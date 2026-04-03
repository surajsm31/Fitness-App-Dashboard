import axios from 'axios';
import { Coffee, Sun, Moon, Utensils } from 'lucide-react';

// const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'https://fitness-app-backend-5l3u.onrender.com';

// Helper functions for meal data mapping
const mapBmiCategoryIdToCategory = (bmiCategoryId) => {
  const categoryMap = {
    1: 'Underweight',
    2: 'Normal', 
    3: 'Overweight',
    4: 'Obese'
  };
  return categoryMap[bmiCategoryId] || 'Normal';
};

const getIconForMealType = (mealType) => {
  const iconMap = {
    'breakfast': Coffee,
    'Breakfast': Coffee,
    'lunch': Sun,
    'Lunch': Sun,
    'dinner': Moon,
    'Dinner': Moon,
    'snack': Utensils,
    'Snack': Utensils
  };
  return iconMap[mealType] || Utensils;
};

// Token refresh queue to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Add subscriber to queue
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers with new token
const notifyRefreshSubscribers = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Function to clear all tokens and user data
const clearAllTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('All tokens cleared');
};

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased timeout to 2 minutes (120 seconds) for video uploads
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: true,
  // Add mode for better CORS handling
  mode: 'cors',
});

// Add CORS handling for development
if (import.meta.env.DEV) {
  // Log the full URL for debugging
  console.log('API Base URL configured as:', API_BASE_URL);
}

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Request interceptor - Token available:', !!token);
    console.log('Request interceptor - Token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request interceptor - Added Authorization header:', config.headers.Authorization);
    } else {
      console.log('Request interceptor - No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token available, redirect to login
        clearAllTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, wait for it to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      isRefreshing = true;
      
      try {
        // Call refresh token API
        const response = await axios.post(`${API_BASE_URL}/api/admin/refresh-token`, {
          refresh_token: refreshToken
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        
        const { access_token, refresh_token: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('authToken', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Notify all waiting subscribers
        notifyRefreshSubscribers(access_token);
        
        // Retry the original request
        return api(originalRequest);
        
      } catch (refreshError) {
        // Check for specific refresh token errors
        const errorMessage = refreshError.response?.data?.detail || 
                           refreshError.response?.data?.message || 
                           refreshError.message;
        
        // Check if it's a refresh token not found or revoked error
        if (errorMessage === "Refresh token not found or revoked" || 
            errorMessage?.toLowerCase().includes('refresh token') ||
            refreshError.response?.status === 401) {
          
          // Clear all tokens and user data
          clearAllTokens();
          
          // Store the session expired message for login page
          localStorage.setItem('sessionExpired', 'Your session has expired. Please login again.');
          
          // Redirect to login page
          window.location.href = '/login';
        } else {
          // For other refresh errors, also clear tokens and redirect
          clearAllTokens();
          window.location.href = '/login';
        }
        
        // Notify subscribers that refresh failed
        notifyRefreshSubscribers(null);
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/login`);
      console.log('Credentials:', { email, password: '***' });
      
      // First test basic connectivity
      console.log('Testing basic connectivity...');
      const connectivityTest = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        mode: 'no-cors'
      }).catch(e => {
        console.log('Connectivity test failed:', e.message);
        throw { message: `Cannot reach backend at ${API_BASE_URL}. Check if server is running and accessible.` };
      });
      
      const response = await api.post('/api/admin/login', {
        email: email.trim(),
        password: password,
      });
      
      console.log('Login response:', response.data);
      console.log('Login response keys:', Object.keys(response.data));
      
      // Store token and user data in localStorage
      // Check different possible token field names
      const token = response.data.token || response.data.access_token || response.data.authToken;
      const refreshToken = response.data.refresh_token || response.data.refreshToken;
      
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('Token stored successfully:', token);
      } else {
        console.warn('No token found in login response. Available fields:', Object.keys(response.data));
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Refresh token stored successfully:', refreshToken);
      }
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('User data stored successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      // More detailed error handling
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        throw { message: 'Cannot connect to server. Please check if the backend is running.' };
      } else if (error.response?.status === 0) {
        throw { message: 'Network error. Unable to reach the server.' };
      } else if (error.response?.status === 404) {
        throw { message: 'Login endpoint not found. Check API configuration.' };
      } else if (error.response?.status === 500) {
        throw { message: 'Server error. Please try again later.' };
      } else {
        throw error.response?.data || { message: `Login failed: ${error.message}` };
      }
    }
  },

  // Refresh token API function
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      console.log('Refreshing token...');
      const response = await axios.post(`${API_BASE_URL}/api/admin/refresh-token`, {
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      // Store new tokens
      localStorage.setItem('authToken', access_token);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      console.log('Token refreshed successfully');
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error.response?.data || { message: 'Failed to refresh token' };
    }
  },

  logout: () => {
    clearAllTokens();
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Forgot password API function
  forgotPassword: async (email) => {
    try {
      console.log('Sending forgot password request for email:', email);
      
      const requestData = {
        email: email.trim()
      };
      
      console.log('Forgot password request data:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/auth/forgot-password/send`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      
      console.log('Forgot password API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Forgot password error response data:', error.response?.data);
      console.error('Forgot password error response status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Failed to send reset email';
      
      throw error.response?.data || { message: errorMessage };
    }
  },

  // Verify OTP API function
  verifyOtp: async (email, otp) => {
    try {
      console.log('Verifying OTP for email:', email);
      console.log('OTP value:', otp);
      console.log('OTP length:', otp.length);
      
      const requestData = {
        email: email.trim(),
        otp: otp
      };
      
      console.log('OTP verification request data:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/auth/forgot-password/verify`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      
      console.log('OTP verification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      console.error('OTP verification error response data:', error.response?.data);
      console.error('OTP verification error response status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Invalid OTP';
      
      throw error.response?.data || { message: errorMessage };
    }
  },

  // Reset password API function
  resetPassword: async (email, otp, newPassword) => {
    try {
      console.log('Resetting password for email:', email);
      console.log('OTP:', otp);
      console.log('New password length:', newPassword.length);
      
      const requestData = {
        email: email.trim(),
        otp: otp,
        new_password: newPassword
      };
      
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/auth/forgot-password/reset`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      
      console.log('Password reset API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Failed to reset password';
      
      throw error.response?.data || { message: errorMessage };
    }
  },

  // Change password API function
  changePassword: async (oldPassword, newPassword) => {
    try {
      console.log('Changing password...');
      
      const response = await api.put('/api/admin/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      
      console.log('Password change successful');
      return response.data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Users API functions
  getUsers: async (page = 1, pageSize = 10, searchTerm = null, filters = null) => {
    try {
      // Convert page-based to skip/limit format
      const skip = (page - 1) * pageSize;
      
      const params = {
        skip: skip,
        limit: pageSize
      };
      
      // Add search term if provided - use more flexible search parameter
      if (searchTerm) {
        params.q = searchTerm; // Use 'q' for query parameter which is more standard
        params.search = searchTerm; // Also include 'search' as fallback
      }
      
      // Add filters if provided
      if (filters) {
        if (filters.gender && filters.gender !== 'All') {
          params.gender = filters.gender;
        }
        if (filters.activityLevel && filters.activityLevel !== 'All') {
          params.activity_level = filters.activityLevel;
        }
      }
      
      console.log('Fetching users from:', `${API_BASE_URL}/users`, `Page: ${page}, Size: ${pageSize}, Skip: ${skip}, Search: ${searchTerm}, Filters:`, filters);
      console.log('Request params:', params);
      
      const response = await api.get('/api/admin/users', { params });
      
      console.log('Users API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  getUserById: async (userId) => {
    try {
      console.log('Fetching user details for ID:', userId);
      const response = await api.get(`/api/admin/user/${userId}`);
      
      console.log('User details API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error.response?.data || { message: 'Failed to fetch user details' };
    }
  },

  createUser: async (userData) => {
    try {
      console.log('Creating new user:', userData);
      const response = await api.post('/api/admin/register-user', userData);
      
      console.log('Create user API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  deleteUser: async (userId) => {
    try {
      console.log('Deleting user with ID:', userId);
      const response = await api.delete(`/api/admin/user/${userId}`);
      
      console.log('Delete user API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      console.log('Updating user with ID:', userId, userData);
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          // Handle file objects separately
          if (key === 'profile_image' && userData[key] instanceof File) {
            formData.append(key, userData[key]);
          } else {
            formData.append(key, userData[key]);
          }
        }
      });
      
      // Use the exact endpoint with multipart/form-data
      const response = await api.put(`/api/admin/update-user/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Update user API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  logout: async () => {
    try {
      console.log('Attempting logout with token revocation...');
      
      // Get refresh token from localStorage (if available)
      const refreshToken = localStorage.getItem('refreshToken');
      const authToken = localStorage.getItem('authToken');
      
      console.log('Logout - Auth token available:', !!authToken);
      console.log('Logout - Refresh token available:', !!refreshToken);
      
      if (authToken) {
        // Make logout request with refresh token if available
        const logoutData = refreshToken ? { refresh_token: refreshToken } : {};
        const response = await api.post('/api/admin/logout', logoutData);
        
        console.log('Logout API response:', response.data);
      }
      
      // Clear all tokens and user data
      clearAllTokens();
      
      console.log('Logout successful - all tokens cleared');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API call fails, clear local tokens
      clearAllTokens();
      
      console.log('Logout fallback - local tokens cleared');
      
      return { success: true }; // Still return success for UX
    }
  },

  // Workout API functions
  getWorkouts: async (page = 1, pageSize = 10) => {
    try {
      // Ensure page and pageSize are valid numbers
      const validPage = Math.max(1, parseInt(page) || 1);
      const validPageSize = Math.max(1, parseInt(pageSize) || 10);
      
      // Convert page-based pagination to skip/limit format
      const skip = (validPage - 1) * validPageSize;
      
      console.log(`Fetching workouts - Page: ${validPage}, Size: ${validPageSize}, Skip: ${skip}`);
      
      const response = await api.get('/api/admin/workouts', {
        params: {
          skip: skip,
          limit: validPageSize
        }
      });
      
      console.log('Full API URL:', `/workouts?skip=${skip}&limit=${validPageSize}`);
      console.log('Base URL:', API_BASE_URL);
      console.log('Get workouts API response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      console.error('Error response:', error.response);
      throw error.response?.data || { message: 'Failed to fetch workouts' };
    }
  },

  createWorkout: async (workoutData) => {
    try {
      console.log('Creating workout with data:', workoutData);
      
      // For FormData, we need to delete the default Content-Type header
      // and let the browser set it automatically to multipart/form-data with boundary
      const apiInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 120000,
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: true,
        mode: 'cors',
      });
      
      // Add auth token to this instance
      const token = localStorage.getItem('authToken');
      if (token) {
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await apiInstance.post('/api/admin/workouts', workoutData);
      
      console.log('Create workout API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error.response?.data || { message: 'Failed to create workout' };
    }
  },

  updateWorkout: async (workoutId, workoutData) => {
    try {
      console.log('Updating workout with ID:', workoutId, 'and data:', workoutData);
      
      // For FormData, we need to delete the default Content-Type header
      // and let the browser set it automatically to multipart/form-data with boundary
      const apiInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 120000,
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: true,
        mode: 'cors',
      });
      
      // Add auth token to this instance
      const token = localStorage.getItem('authToken');
      if (token) {
        apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await apiInstance.put(`/api/admin/update-workout/${workoutId}`, workoutData);
      
      console.log('Update workout API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error.response?.data || { message: 'Failed to update workout' };
    }
  },

  deleteWorkout: async (workoutId) => {
    try {
      console.log('Deleting workout with ID:', workoutId);
      
      const response = await api.delete(`/api/admin/workout/${workoutId}`);
      
      console.log('Delete workout API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error.response?.data || { message: 'Failed to delete workout' };
    }
  },

  // Meal API functions
  getMeals: async (page = 1, pageSize = 10) => {
    try {
      // Convert page-based pagination to skip/limit format
      const skip = (page - 1) * pageSize;
      
      console.log('Fetching meals from:', `${API_BASE_URL}/meals`, `Page: ${page}, Size: ${pageSize}, Skip: ${skip}`);
      const response = await api.get('/api/admin/meals', {
        params: {
          skip: skip,
          limit: pageSize
        }
      });
      
      console.log('Meals API response status:', response.status);
      console.log('Meals API response data:', response.data);
      
      // Extract meals array from nested response structure
      const mealsArray = response.data.meals || [];
      const pagination = response.data.pagination || {};
      
      console.log('Extracted meals array length:', mealsArray.length);
      console.log('Extracted pagination:', pagination);
      
      // Map API response fields to component expected format
      // API returns: id, bmi_category_id, meal_type, food_item, calories
      // Component expects: id, type, name, calories, bmiCategory, icon
      const mappedMeals = mealsArray.map(meal => ({
        id: meal.id,
        type: meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1),
        name: meal.food_item,
        calories: meal.calories,
        bmiCategory: meal.bmi_category_id, // Show ID instead of category name
        icon: getIconForMealType(meal.meal_type)
      }));
      
      console.log('Mapped meals:', mappedMeals);
      console.log('Pagination info:', pagination);
      
      return {
        meals: mappedMeals,
        pagination: pagination
      };
    } catch (error) {
      console.error('Error fetching meals:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || { message: 'Failed to fetch meals' };
    }
  },

  createMeal: async (mealData) => {
    try {
      console.log('Creating meal with data:', mealData);
      const response = await api.post('/api/admin/meals', mealData);
      
      console.log('Create meal API response status:', response.status);
      console.log('Create meal API response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating meal:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error details:', error.response?.data?.detail);
      console.error('Error input:', error.response?.data?.input);
      throw error.response?.data || { message: 'Failed to create meal' };
    }
  },

  updateMeal: async (mealId, mealData) => {
    try {
      console.log('Updating meal with ID:', mealId, 'Data:', mealData);
      console.log('Request payload:', JSON.stringify(mealData, null, 2));
      
      const response = await api.put(`/api/admin/update-meal/${mealId}`, mealData);
      
      console.log('Raw API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response headers:', response.headers);
      
      // Handle different response structures
      let responseData = response.data;
      if (!responseData && response.data) {
        responseData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        responseData = response.data;
      } else if (response.data && response.data.data) {
        responseData = response.data.data;
      }
      
      console.log('Processed response data:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('Error updating meal:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || { message: 'Failed to update meal' };
    }
  },

  // Delete meal
  deleteMeal: async (mealId) => {
    try {
      console.log('Deleting meal with ID:', mealId);
      const response = await api.delete(`/api/admin/meal/${mealId}`);
      console.log('Delete API response status:', response.status);
      console.log('Delete API response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error.response?.data || { message: 'Failed to delete meal' };
    }
  },

  // Subscription API functions
  getPlans: async () => {
    try {
      console.log('Fetching subscription plans from:', `${API_BASE_URL}/plans`);
      const response = await api.get('/api/admin/plans');
      
      console.log('Plans API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error.response?.data || { message: 'Failed to fetch subscription plans' };
    }
  },

  createPlan: async (planData) => {
    try {
      console.log('Creating subscription plan with data:', planData);
      const response = await api.post('/api/admin/plans', planData);
      
      console.log('Create plan API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error.response?.data || { message: 'Failed to create subscription plan' };
    }
  },

  updatePlan: async (planId, planData) => {
    try {
      console.log('Updating subscription plan with ID:', planId, 'Data:', planData);
      const response = await api.put(`/api/admin/update-plan/${planId}`, planData);
      
      console.log('Update plan API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error.response?.data || { message: 'Failed to update subscription plan' };
    }
  },

  deletePlan: async (planId) => {
    try {
      console.log('Deleting subscription plan with ID:', planId);
      const response = await api.delete(`/api/admin/delete-plan/${planId}`);
      
      console.log('Delete plan API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      throw error.response?.data || { message: 'Failed to delete subscription plan' };
    }
  },

  // User Subscriptions API functions
  getUserSubscriptions: async (page = 1, pageSize = 10) => {
    try {
      // Convert page-based to skip/limit format
      const skip = (page - 1) * pageSize;
      
      console.log('Fetching user subscriptions from:', `${API_BASE_URL}/user-subscriptions`, `Page: ${page}, Size: ${pageSize}, Skip: ${skip}`);
      
      const response = await api.get('/api/admin/user-subscriptions', {
        params: {
          skip: skip,
          limit: pageSize
        }
      });
      
      console.log('User subscriptions API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error.response?.data || { message: 'Failed to fetch user subscriptions' };
    }
  },

  updateUserSubscription: async (subscriptionId, status) => {
    try {
      console.log('Updating subscription with ID:', subscriptionId, 'Status:', status);
      
      const response = await api.put(`/api/admin/update-user-subscription/${subscriptionId}`, {
        status: status
      });
      
      console.log('Update subscription API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error.response?.data || { message: 'Failed to update subscription' };
    }
  },

  // BMI Classification API functions
  getBmiClassifications: async (skip = 0, limit = 10) => {
    try {
      console.log('Fetching BMI classifications from:', `${API_BASE_URL}/bmi-classifications?skip=${skip}&limit=${limit}`);
      const response = await api.get('/api/admin/bmi-classifications', {
        params: {
          skip: skip,
          limit: limit
        }
      });
      
      console.log('BMI classifications API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching BMI classifications:', error);
      throw error.response?.data || { message: 'Failed to fetch BMI classifications' };
    }
  },

  createBmiClassification: async (bmiData) => {
    try {
      console.log('Creating BMI classification with data:', bmiData);
      const response = await api.post('/api/admin/bmi-classifications', bmiData);
      
      console.log('Create BMI classification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating BMI classification:', error);
      throw error.response?.data || { message: 'Failed to create BMI classification' };
    }
  },

  updateBmiClassification: async (bmiId, bmiData) => {
    try {
      console.log('Updating BMI classification with ID:', bmiId, 'Data:', bmiData);
      const response = await api.put(`/api/admin/update-bmi-classification/${bmiId}`, bmiData);
      
      console.log('Update BMI classification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating BMI classification:', error);
      throw error.response?.data || { message: 'Failed to update BMI classification' };
    }
  },

  deleteBmiClassification: async (bmiId) => {
    try {
      console.log('Deleting BMI classification with ID:', bmiId);
      const response = await api.delete(`/api/admin/bmi-classification/${bmiId}`);
      
      console.log('Delete BMI classification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting BMI classification:', error);
      throw error.response?.data || { message: 'Failed to delete BMI classification' };
    }
  },

  // Dashboard API functions
  getDashboardOverview: async () => {
    try {
      console.log('Fetching dashboard overview from:', `${API_BASE_URL}/dashboard/overview`);
      const response = await api.get('/api/admin/dashboard/overview');
      
      console.log('Dashboard overview API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error.response?.data || { message: 'Failed to fetch dashboard overview' };
    }
  },

  getDashboardUsers: async () => {
    try {
      console.log('Fetching dashboard users from:', `${API_BASE_URL}/dashboard/users`);
      const response = await api.get('/api/admin/dashboard/users');
      
      console.log('Dashboard users API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard users:', error);
      throw error.response?.data || { message: 'Failed to fetch dashboard users' };
    }
  },

  // Profile API functions
  getProfile: async () => {
    try {
      console.log('Fetching admin profile from:', `${API_BASE_URL}/api/admin/profile`);
      const response = await api.get('/api/admin/profile');
      
      console.log('Profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  updateProfile: async (profileData) => {
    try {
      console.log('Updating admin profile with data:', profileData);
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add all fields to FormData according to AdminProfileUpdateSchema
      if (profileData.name !== undefined && profileData.name !== null) {
        formData.append('name', profileData.name);
      }
      if (profileData.email !== undefined && profileData.email !== null) {
        formData.append('email', profileData.email);
      }
      if (profileData.bio !== undefined && profileData.bio !== null) {
        formData.append('bio', profileData.bio);
      }
      if (profileData.profile_image !== undefined && profileData.profile_image !== null) {
        formData.append('profile_image', profileData.profile_image);
      }
      
      const response = await api.put('/api/admin/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Update profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  }
};

export default api;
