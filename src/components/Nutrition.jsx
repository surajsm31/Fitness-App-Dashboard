import React, { useState, useEffect, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Coffee, Sun, Moon, Utensils, X, Loader2, ChevronDown, RefreshCw, Flame } from 'lucide-react';
import clsx from 'clsx';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const Nutrition = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [meals, setMeals] = useState([]);
    const [allMeals, setAllMeals] = useState([]); // Cache for all meals
    const [loading, setLoading] = useState(true);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    // Client-side filtering and pagination (similar to Users.jsx)
    const applyFiltersAndPagination = (category = 'All', page = 1) => {
        let filteredMeals = [...allMeals];
        
        // Apply category filter
        if (category !== 'All') {
            const categoryIds = {
                'Underweight': [1, 2, 3],
                'Normal': [4],
                'Overweight': [5],
                'Obese': [6, 7, 8]
            };
            
            const targetIds = categoryIds[category] || [];
            filteredMeals = filteredMeals.filter(meal => targetIds.includes(meal.bmiCategory));
        }
        
        // Apply pagination
        const totalItems = filteredMeals.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        const startIndex = (page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedMeals = filteredMeals.slice(startIndex, endIndex);
        
        // Update display meals and pagination
        setMeals(paginatedMeals);
        setPagination({
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            pageSize: pagination.pageSize
        });
    };

    // Fetch all meals and cache them (similar to Users.jsx)
    const fetchAllMeals = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Clear cache first to ensure fresh data
            setAllMeals([]);
            setMeals([]);
            
            // Fetch all meals (use a large limit to get everything)
            let currentPage = 1;
            let totalPages = 1;
            let allFetchedMeals = [];
            
            // Fetch all pages to get complete dataset
            while (currentPage <= totalPages) {
                const response = await authAPI.getMeals(currentPage, 50);
                totalPages = response.pagination?.total_pages || 1;
                
                // Map API response to frontend format - convert food_item to name
                const mappedMeals = response.meals.map(meal => ({
                    ...meal,
                    name: meal.food_item || meal.name || 'Untitled Meal',
                    type: meal.meal_type ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1) : meal.type,
                    bmiCategory: meal.bmi_category_id || meal.bmiCategory,
                    description: meal.description || '',
                    image_url: meal.meal_image || meal.image_url || null
                }));
                
                allFetchedMeals = [...allFetchedMeals, ...mappedMeals];
                currentPage++;
            }
            
            // Cache all meals
            setAllMeals(allFetchedMeals);
            
            // Apply current filter and pagination after cache refresh
            applyFiltersAndPagination(selectedCategory, pagination.currentPage);
            
        } catch (err) {
            console.error('Failed to fetch meals:', err);
            setError(err.message || 'Failed to load meals');
        } finally {
            setLoading(false);
        }
    };
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        pageSize: 10
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMeal, setCurrentMeal] = useState(null);

    // BMI State
    const [bmiInputs, setBmiInputs] = useState({ height: '', weight: '' });
    const [bmiResult, setBmiResult] = useState(null);
    const [bmiCalculating, setBmiCalculating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For mobile dropdown
    const [nutritionData, setNutritionData] = useState([
        { name: 'Protein', value: 30, color: '#3B82F6' },     // Blue
        { name: 'Carbs', value: 40, color: '#10B981' },      // Green
        { name: 'Fats', value: 30, color: '#F59E0B' },       // Amber
    ]);

    // Nutrition data configuration based on BMI categories
    const nutritionRatios = {
        underweight: { protein: 25, carbs: 50, fats: 25 },
        normal: { protein: 30, carbs: 40, fats: 30 },
        overweight: { protein: 35, carbs: 35, fats: 30 },
        obese: { protein: 40, carbs: 30, fats: 30 }
    };

    // Function to map BMI category ID to category name
    const getBmiCategoryName = (bmiCategoryId) => {
        if ([1, 2, 3].includes(bmiCategoryId)) return 'Underweight';
        if (bmiCategoryId === 4) return 'Normal';
        if (bmiCategoryId === 5) return 'Overweight';
        if ([6, 7, 8].includes(bmiCategoryId)) return 'Obese';
        return 'Unknown';
    };

    // Function to update nutrition chart based on BMI category
    const updateNutritionChart = (bmiCategory) => {
        const ratios = nutritionRatios[bmiCategory] || nutritionRatios.normal;
        
        const newNutritionData = [
            { name: 'Protein', value: ratios.protein, color: '#3B82F6' },     // Blue
            { name: 'Carbs', value: ratios.carbs, color: '#10B981' },         // Green
            { name: 'Fats', value: ratios.fats, color: '#F59E0B' },           // Amber
        ];
        
        setNutritionData(newNutritionData);
        console.log(`Updated nutrition chart for ${bmiCategory}:`, newNutritionData);
    };

    // Reusable Nutrition Chart Component
    const NutritionChart = memo(({ data, bmiCategory }) => {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm sm:text-base lg:text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Nutrition Distribution
                    {bmiCategory && (
                        <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                            ({bmiCategory})
                        </span>
                    )}
                </h3>
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center">
                    {/* Chart Section */}
                    <div className="h-[150px] sm:h-[180px] lg:h-[180px] w-full lg:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart key={bmiCategory || 'default-chart'}>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={0}
                                    isAnimationActive={false}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    formatter={(value, name) => {
                                        const calories = 2000;
                                        const multiplier = name === 'Protein' ? 4 : name === 'Carbs' ? 4 : 9;
                                        const grams = Math.round((value / 100) * calories / multiplier);
                                        return [
                                            `${value}% (~${grams}g)`,
                                            name
                                        ];
                                    }}
                                    labelFormatter={() => 'Macronutrient Ratio (2000 kcal diet)'}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats/Details Section */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {bmiCategory
                                ? `Optimized for ${bmiCategory} BMI category`
                                : 'Enter height and weight, then click Calculate to see personalized nutrition ratios'
                            }
                        </p>
                        {bmiCategory && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                Based on 2000 calorie daily intake
                            </p>
                        )}

                        {/* Macro Stats */}
                        <div className="mt-2 space-y-1.5">
                            {data.map((item, index) => {
                                const calories = 2000;
                                const multiplier = item.name === 'Protein' ? 4 : item.name === 'Carbs' ? 4 : 9;
                                const grams = Math.round((item.value / 100) * calories / multiplier);
                                return (
                                    <div key={index} className="flex items-center justify-between lg:justify-start gap-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            {item.value}% (~{grams}g)
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    });


    // Load meals on component mount
    useEffect(() => {
        fetchAllMeals();
    }, []); // Only run once on mount

    // Re-apply filters when allMeals are loaded (for initial display)
    useEffect(() => {
        if (allMeals.length > 0) {
            applyFiltersAndPagination(selectedCategory, pagination.currentPage);
        }
    }, [allMeals]); // Re-run when cache is populated

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);


    // Handle filter change using cached data (similar to Users.jsx)
    const handleFilterChange = (category) => {
        setSelectedCategory(category);
        
        // Update nutrition chart based on selected category (convert to lowercase for the chart)
        if (category !== 'All') {
            updateNutritionChart(category.toLowerCase());
        } else {
            // Reset to default (normal) when 'All' is selected
            updateNutritionChart('normal');
        }
        
        // Apply filters immediately using cached data
        applyFiltersAndPagination(category, 1);
    };

    // Pagination handlers using cached data (similar to Users.jsx)
    const handlePageChange = (newPage) => {
        console.log('Changing to page:', newPage);
        applyFiltersAndPagination(selectedCategory, newPage);
    };

    const handlePrevPage = () => {
        console.log('Previous button clicked. Current page:', pagination.currentPage, 'HasPrev:', pagination.hasPrev);
        if (pagination.hasPrev) {
            handlePageChange(pagination.currentPage - 1);
        }
    };

    const handleNextPage = () => {
        console.log('Next button clicked. Current page:', pagination.currentPage, 'HasNext:', pagination.hasNext);
        if (pagination.hasNext) {
            handlePageChange(pagination.currentPage + 1);
        }
    };

    const iconOptions = [
        { label: 'Breakfast', icon: Coffee },
        { label: 'Lunch', icon: Sun },
        { label: 'Dinner', icon: Moon },
        { label: 'Snack', icon: Utensils },
    ];

    const calculateBMI = async () => {
        const h = parseFloat(bmiInputs.height) / 100; // cm to m
        const w = parseFloat(bmiInputs.weight);

        if (h > 0 && w > 0) {
            setBmiCalculating(true);
            
            const bmi = (w / (h * h)).toFixed(1);
            let category = '';
            if (bmi < 18.5) category = 'Underweight';
            else if (bmi < 25) category = 'Normal';
            else if (bmi < 30) category = 'Overweight';
            else category = 'Obese';

            setBmiResult({ bmi, category });
            
            // Update nutrition chart based on BMI category
            updateNutritionChart(category.toLowerCase());
            
            // Use the same logic as handleFilterChange to load meals for the calculated category
            setSelectedCategory(category);
            
            // Apply filters immediately using cached data
            applyFiltersAndPagination(category, 1);
            
            // Reset loading state
            setBmiCalculating(false);
        }
    };


    const handleEdit = async (meal) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch complete meal data from API
            const mealData = await authAPI.getMealById(meal.id);
            
            console.log('handleEdit - Raw API response:', mealData);
            console.log('handleEdit - mealData.meal_image:', mealData.meal_image);
            console.log('handleEdit - mealData.image_url:', mealData.image_url);
            
            // Map API response to frontend format
            const mappedMeal = {
                ...mealData,
                name: mealData.food_item || mealData.name || 'Untitled Meal',
                type: mealData.meal_type ? mealData.meal_type.charAt(0).toUpperCase() + mealData.meal_type.slice(1) : mealData.type,
                bmiCategory: mealData.bmi_category_id || mealData.bmiCategory,
                description: mealData.description || '',
                image_url: mealData.meal_image || mealData.image_url || null,
                imageFile: null,
                imagePreview: null
            };
            
            console.log('handleEdit - Mapped meal with image_url:', mappedMeal.image_url);
            
            // Ensure icon is properly mapped for the meal type
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
            
            mappedMeal.icon = getIconForMealType(mappedMeal.type);
            
            setCurrentMeal(mappedMeal);
            setIsModalOpen(true);
            
        } catch (error) {
            console.error('Failed to fetch meal details:', error);
            setError('Failed to load meal details. Please try again.');
            
            // Fallback to using the meal data from the list
            const fallbackMeal = {
                ...meal,
                description: meal.description || '',
                image_url: meal.image_url || null,
                imageFile: null,
                imagePreview: null
            };
            setCurrentMeal(fallbackMeal);
            setIsModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        
        try {
            setLoading(true);
            setSubmitLoading(true);
            setError(null);
            
            // Prepare meal data for API - use correct field names as per backend schema
            const mealData = {
                bmi_category_id: parseInt(currentMeal.bmiCategory) || 4,
                meal_type: currentMeal.type ? currentMeal.type.toLowerCase() : 'breakfast',
                food_item: currentMeal.name ? currentMeal.name.replace(' Plan', '').trim() : 'Untitled Meal',
                calories: parseInt(currentMeal.calories) || 0,
                description: currentMeal.description || ''
            };
            
            // Validate required fields before sending
            if (!mealData.food_item || mealData.food_item.trim() === '') {
                setError('Meal name is required');
                setSubmitLoading(false);
                setLoading(false);
                return;
            }
            
            if (!mealData.calories || mealData.calories <= 0) {
                setError('Calories must be greater than 0');
                setSubmitLoading(false);
                setLoading(false);
                return;
            }
            
            console.log('Saving meal with data:', mealData);
            console.log('API endpoint:', currentMeal.id ? `/update-meal/${currentMeal.id}` : '/meals');
            
            let response;
            if (currentMeal.id) {
                // Update existing meal
                console.log('Updating existing meal with ID:', currentMeal.id);
                
                // Create update data following same pattern as user profile update
                const updateData = {
                    bmi_category_id: mealData.bmi_category_id,
                    meal_type: mealData.meal_type,
                    food_item: mealData.food_item,
                    calories: mealData.calories,
                    description: mealData.description
                };
                
                // Handle meal image - only include if a new file is selected
                if (currentMeal.imageFile) {
                    updateData.image = currentMeal.imageFile; // Send actual file only when new image is uploaded
                }
                // Don't include meal_image field at all when keeping the existing image
                
                console.log('Sending update data:', updateData);
                console.log('Current meal data:', currentMeal);
                console.log('Has new image file:', !!currentMeal.imageFile);
                
                response = await authAPI.updateMeal(currentMeal.id, updateData);
                console.log('Update API response from service:', response);
                console.log('Response data keys:', Object.keys(response || {}));
                console.log('Response has data property:', 'data' in (response || {}));
                
                // Extract the actual data from the response
                let responseData = null;
                if (response && typeof response === 'object') {
                    responseData = response;
                } else if (response && response.data && typeof response.data === 'object') {
                    responseData = response.data;
                } else if (response && response.data && response.data.data) {
                    responseData = response.data.data;
                }
                
                // Check if update was successful - backend returns data without status field
                if (responseData && responseData.id) {
                    console.log('Update successful - Response data:', responseData);
                    console.log('meal_image field:', responseData.meal_image);
                    console.log('image_url field:', responseData.image_url);
                    
                    // Update the meal in local state with the new data from backend response
                    // API response has food_item field, so map it to name for frontend display
                    const updatedMeal = {
                        ...responseData,
                        name: responseData.food_item || responseData.name || currentMeal.name,
                        type: responseData.meal_type ? responseData.meal_type.charAt(0).toUpperCase() + responseData.meal_type.slice(1) : currentMeal.type,
                        bmiCategory: responseData.bmi_category_id || currentMeal.bmiCategory,
                        description: responseData.description || currentMeal.description,
                        image_url: responseData.meal_image || responseData.image_url || currentMeal.image_url
                    };
                    
                    console.log('Mapped updatedMeal with image_url:', updatedMeal.image_url);
                    
                    // Ensure icon is properly mapped for the updated meal type
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
                    
                    updatedMeal.icon = getIconForMealType(updatedMeal.type);
                    
                    // Check if category changed
                    const categoryChanged = currentMeal.bmiCategory !== updatedMeal.bmiCategory;
                    
                    // Close modal and clear current meal
                    setIsModalOpen(false);
                    setCurrentMeal(null);
                    
                    // Clear cache and refresh meals list from API
                    console.log('Refreshing meals list after update...');
                    await fetchAllMeals();
                    console.log('Meals list refreshed after update');
                    
                    const mealName = currentMeal.name || 'Meal';
                    showUpdateSuccess(mealName);
                    
                } else {
                    console.error('Update failed - Response:', responseData);
                    const mealName = currentMeal.name || 'Meal';
                    showUpdateError(mealName, 'Failed to update meal. Please try again.');
                    setError('Failed to update meal. Please try again.');
                    // Don't close modal on error so user can retry
                }
            } else {
                // Create new meal
                console.log('Creating new meal');
                
                // Handle image upload if there's an image file
                if (currentMeal.imageFile) {
                    const formData = new FormData();
                    formData.append('image', currentMeal.imageFile);
                    
                    // Add other meal data to formData
                    Object.keys(mealData).forEach(key => {
                        formData.append(key, mealData[key]);
                    });
                    
                    response = await authAPI.createMeal(formData);
                } else {
                    // If no image, send regular data
                    response = await authAPI.createMeal(mealData);
                }
                console.log('Create API response from service:', response);
                console.log('Response data keys:', Object.keys(response || {}));
                console.log('Response has data property:', 'data' in (response || {}));
                
                // Extract the actual data from the response
                let responseData = null;
                if (response && typeof response === 'object') {
                    responseData = response;
                } else if (response && response.data && typeof response.data === 'object') {
                    responseData = response.data;
                } else if (response && response.data && response.data.data) {
                    responseData = response.data.data;
                }
                
                console.log('Extracted response data:', responseData);
                
                if (responseData && responseData.id) {
                    // Add new meal to local state immediately
                    const newMeal = {
                        ...currentMeal,
                        ...responseData,
                        name: responseData.food_item || responseData.name || currentMeal.name,
                        type: responseData.meal_type ? responseData.meal_type.charAt(0).toUpperCase() + responseData.meal_type.slice(1) : currentMeal.type,
                        bmiCategory: responseData.bmi_category_id || currentMeal.bmiCategory,
                        description: responseData.description || currentMeal.description,
                        image_url: responseData.meal_image || responseData.image_url || currentMeal.image_url
                    };
                    
                    // Ensure icon is properly mapped for the meal type
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
                    
                    newMeal.icon = getIconForMealType(newMeal.type);
                    
                    // Close modal and clear current meal
                    setIsModalOpen(false);
                    setCurrentMeal(null);
                    
                    // Clear cache and refresh meals list from API
                    await fetchAllMeals();
                    
                    const mealName = currentMeal.name || 'Meal';
                    showCreateSuccess(mealName);
                } else {
                    console.error('Create failed - Response:', responseData);
                    const mealName = currentMeal.name || 'Meal';
                    showCreateError(mealName, 'Failed to create meal. Please try again.');
                    setError('Failed to create meal. Please try again.');
                    // Don't close modal on error so user can retry
                }
            }
            
            // Close modal only on success
            if (response && response.status === 200) {
                setIsModalOpen(false);
                setCurrentMeal(null);
            }
            
        } catch (error) {
            console.error('Failed to save meal:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const mealName = currentMeal.name || 'Meal';
            const isEdit = !!currentMeal.id;
            if (isEdit) {
                showUpdateError(mealName, error.message || 'Failed to save meal. Please try again.');
            } else {
                showCreateError(mealName, error.message || 'Failed to save meal. Please try again.');
            }
            setError('Failed to save meal. Please try again.');
        } finally {
            setLoading(false);
            setSubmitLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentMeal({
            id: null, // New meal will have no ID
            type: 'Breakfast',
            name: '',
            calories: '',
            icon: Coffee,
            bmiCategory: 4, // Default to Normal (ID 4)
            description: '',
            imageFile: null,
            imagePreview: null,
            image_url: null
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (mealId) => {
        // Find the meal to get its name before deletion
        const mealToDelete = meals.find(m => m.id === mealId);
        const mealName = mealToDelete?.name || 'Meal';
        
        if (window.confirm('Are you sure you want to delete this meal plan?')) {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Deleting meal with ID:', mealId);
                await authAPI.deleteMeal(mealId);
                console.log('Meal deleted successfully');
                
                // Clear cache and refresh meals list from API
                await fetchAllMeals();
                
                showDeleteSuccess(mealName);
            } catch (error) {
                console.error('Failed to delete meal:', error);
                showDeleteError(mealName, error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 relative px-2 sm:px-0">
            {/* Custom Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Nutrition</h1>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Meal Plan</span>
                        <span className="sm:hidden">Create</span>
                    </button>
                    <button
                        onClick={fetchAllMeals}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                        <span className="sm:hidden">Refresh</span>
                    </button>
                </div>
            </div>

            {/* BMI Calculator Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 sm:p-4 lg:p-4 text-white shadow-lg">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4">
                    <div className="w-full lg:w-auto">
                        <h2 className="text-lg sm:text-xl lg:text-xl font-bold mb-1">BMI Smart Planner</h2>
                        <p className="opacity-90 text-xs sm:text-sm lg:text-sm max-w-full lg:max-w-md">Enter user details to filter nutrition plans specifically tailored for their BMI category.</p>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-3 mt-2 sm:mt-3 lg:mt-3">
                            <div className="flex-1 sm:flex-none">
                                <label className="block text-xs sm:text-sm font-medium mb-1 opacity-80">Height (cm)</label>
                                <input
                                    type="number"
                                    value={bmiInputs.height}
                                    onChange={e => setBmiInputs({ ...bmiInputs, height: e.target.value })}
                                    className="px-3 py-1.5 sm:py-2 rounded-lg text-gray-900 w-full sm:w-28 lg:w-32 focus:outline-none"
                                    placeholder="175"
                                />
                            </div>
                            <div className="flex-1 sm:flex-none">
                                <label className="block text-xs sm:text-sm font-medium mb-1 opacity-80">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={bmiInputs.weight}
                                    onChange={e => setBmiInputs({ ...bmiInputs, weight: e.target.value })}
                                    className="px-3 py-1.5 sm:py-2 rounded-lg text-gray-900 w-full sm:w-28 lg:w-32 focus:outline-none"
                                    placeholder="70"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={calculateBMI}
                                    disabled={bmiCalculating}
                                    className="bg-white text-indigo-600 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {bmiCalculating ? (
                                        <>
                                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        'Calculate'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {bmiResult && (
                        <div className="bg-white/20 backdrop-blur-md p-3 sm:p-4 lg:p-4 rounded-xl border border-white/30 text-center w-full lg:w-auto lg:min-w-[180px]">
                            <p className="text-xs sm:text-sm font-medium opacity-90">Calculated BMI</p>
                            <p className="text-2xl sm:text-3xl lg:text-3xl font-bold my-1 lg:my-2">{bmiResult.bmi}</p>
                            <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-white text-indigo-600 rounded-full text-xs sm:text-sm font-bold">
                                {bmiResult.category}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
                {/* Macro Chart - Full Width for Desktop */}
                <div className="w-full">
                    <NutritionChart
                        key={bmiResult?.category || 'default'}
                        data={nutritionData}
                        bmiCategory={bmiResult?.category}
                    />
                </div>

                {/* Meals List - Full Width */}
                <div className="w-full space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedCategory === 'All' ? 'All Plans' : `Plans for ${selectedCategory}`}
                        </h3>
                        
                        {/* Desktop: Category buttons */}
                        <div className="hidden lg:flex flex-wrap gap-1 sm:gap-2">
                            {['All', 'Underweight', 'Normal', 'Overweight', 'Obese'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleFilterChange(cat)}
                                    className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Mobile: Dropdown */}
                        <div className="lg:hidden w-full sm:w-auto dropdown-container relative !overflow-visible">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                    }}
                                    className="w-full sm:w-auto flex items-center justify-between text-left text-xs sm:text-sm p-2 sm:p-2.5 pr-8 sm:pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none truncate max-w-full min-w-[120px]"
                                >
                                    <span className="truncate">{selectedCategory}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100 min-w-[120px]">
                                        {['All', 'Underweight', 'Normal', 'Overweight', 'Obese'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    handleFilterChange(cat);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedCategory === cat ? 'bg-primary/10 font-semibold text-primary dark:text-primary' : ''}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
                            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 animate-pulse">Loading meals...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 sm:py-10 text-red-500">
                            {error}
                        </div>
                    ) : meals.length === 0 ? (
                        <div className="text-center py-8 sm:py-10 text-gray-500 dark:text-gray-400">
                            No meal plans found for this category.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {meals.map((meal) => (
                                <div key={meal.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                        {/* Image/Icon Section */}
                                        <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 relative group-hover:shadow-inner transition-all duration-300">
                                            <div className="w-full h-full relative">
                                                {meal.image_url ? (
                                                    <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <meal.icon className="w-10 h-10 opacity-30 animate-pulse" />
                                                    </div>
                                                )}
                                                {/* Overlay for hover */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 flex flex-col min-w-0 justify-between">
                                            {/* Meta and Title */}
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
                                                        {meal.type}
                                                    </span>
                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                    <span className="inline-flex items-center text-xs font-medium text-orange-500 dark:text-orange-400">
                                                        <Flame className="w-3 h-3 mr-1" />
                                                        {meal.calories} kcal
                                                    </span>
                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                    <span className={clsx(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        [1, 2, 3].includes(meal.bmiCategory) ? 'bg-blue-100 text-blue-700' : 
                                                        meal.bmiCategory === 4 ? 'bg-green-100 text-green-700' : 
                                                        meal.bmiCategory === 5 ? 'bg-yellow-100 text-yellow-700' : 
                                                        'bg-red-100 text-red-700'
                                                    )}>
                                                        {getBmiCategoryName(meal.bmiCategory)}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">{meal.name} Plan</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                                    {meal.description || 'Nutritionally balanced meal plan optimized for your fitness goals.'}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 pt-2">
                                                <button
                                                    onClick={() => handleEdit(meal)}
                                                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                                >
                                                    Edit Plan
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(meal.id)}
                                                    className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
                                                    title="Delete Plan"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && !error && meals.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 mt-6">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                            {paginationLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-indigo-600" />
                                    Loading...
                                </span>
                            ) : (
                                <>
                                    <span className="block sm:hidden">Page {pagination.currentPage} of {pagination.totalPages}</span>
                                    <span className="hidden sm:inline">
                                        Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                                        {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                                        {pagination.totalItems} meals
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-start">
                            <button
                                type="button"
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPrev || paginationLoading}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                                    pagination.hasPrev && !paginationLoading
                                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {paginationLoading ? '...' : 'Previous'}
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage <= 2) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage >= pagination.totalPages - 1) {
                                        pageNum = pagination.totalPages - 2 + i;
                                    } else {
                                        pageNum = pagination.currentPage - 1 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={paginationLoading}
                                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                                                pageNum === pagination.currentPage
                                                    ? 'bg-indigo-600 text-white'
                                                    : paginationLoading
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                            }`}
                                        >
                                            {paginationLoading && pageNum === pagination.currentPage ? '...' : pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={!pagination.hasNext || paginationLoading}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                    pagination.hasNext && !paginationLoading
                                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {paginationLoading ? (
                                    <Loader2 className="w-2 h-2 sm:w-3 sm:h-3 animate-spin" />
                                ) : (
                                    'Next'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && currentMeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                {currentMeal.id ? 'Edit Meal Plan' : 'New Meal Plan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Name</label>
                                <input
                                    type="text"
                                    value={currentMeal.name}
                                    onChange={e => setCurrentMeal({ ...currentMeal, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        value={currentMeal.type}
                                        onChange={e => {
                                            const type = e.target.value;
                                            const icon = iconOptions.find(opt => opt.label === type)?.icon || Utensils;
                                            setCurrentMeal({ ...currentMeal, type, icon });
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    >
                                        {iconOptions.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target BMI Category</label>
                                    <select
                                        value={currentMeal.bmiCategory}
                                        onChange={e => setCurrentMeal({ ...currentMeal, bmiCategory: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value={1}>ID 1 - Severe Thinness</option>
                                        <option value={2}>ID 2 - Moderate Thinness</option>
                                        <option value={3}>ID 3 - Mild Thinness</option>
                                        <option value={4}>ID 4 - Normal</option>
                                        <option value={5}>ID 5 - Overweight</option>
                                        <option value={6}>ID 6 - Obese Class I</option>
                                        <option value={7}>ID 7 - Obese Class II</option>
                                        <option value={8}>ID 8 - Obese Class III</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calories</label>
                                <input
                                    type="number"
                                    value={currentMeal.calories}
                                    onChange={e => setCurrentMeal({ ...currentMeal, calories: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={currentMeal.description || ''}
                                    onChange={e => setCurrentMeal({ ...currentMeal, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                                    rows={3}
                                    placeholder="Enter meal description (optional)..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Image</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setCurrentMeal({ ...currentMeal, imageFile: file });
                                                // Create preview URL
                                                const reader = new FileReader();
                                                reader.onload = (e) => {
                                                    setCurrentMeal(prev => ({ ...prev, imagePreview: e.target.result }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {currentMeal.imagePreview && (
                                        <div className="relative">
                                            <img 
                                                src={currentMeal.imagePreview} 
                                                alt="Meal preview" 
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentMeal({ ...currentMeal, imageFile: null, imagePreview: null, image_url: null });
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {currentMeal.image_url && !currentMeal.imagePreview && (
                                        <div className="relative">
                                            <img 
                                                src={currentMeal.image_url} 
                                                alt="Current meal image" 
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentMeal({ ...currentMeal, image_url: null });
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 text-sm" disabled={submitLoading}>
                                {submitLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Plan'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Nutrition;
