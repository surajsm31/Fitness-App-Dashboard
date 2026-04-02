import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Coffee, Sun, Moon, Utensils, X, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

const Nutrition = () => {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
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

    // Fetch meals from API with pagination
    const fetchMeals = async (page = 1, pageSize = 10, isPagination = false, category = null) => {
        try {
            if (isPagination) {
                setPaginationLoading(true);
            } else {
                setLoading(true);
            }
            setError(null);
            
            console.log('Fetching meals with page:', page, 'pageSize:', pageSize, 'isPagination:', isPagination, 'category:', category);
            const response = await authAPI.getMeals(page, pageSize);
            console.log('API response received:', response);
            setMeals(response.meals);
            
            // Map API pagination fields to our state format
            const mappedPagination = {
                currentPage: response.pagination.current_page || 1,
                totalPages: response.pagination.total_pages || 1,
                totalItems: response.pagination.total_items || 0,
                hasNext: response.pagination.has_next || false,
                hasPrev: response.pagination.has_prev || false,
                pageSize: response.pagination.page_size || 10
            };
            
            // Preserve current category and page during refresh
            if (category) {
                setSelectedCategory(category);
            }
            
            setPagination(mappedPagination);
            console.log('Pagination state set to:', mappedPagination);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch meals:', err);
            setError('Failed to load meals. Please try again.');
        } finally {
            setLoading(false);
            setPaginationLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMeals(1, pagination.pageSize);
    }, []); // Only run once on mount

    // Smart filtering - find all pages containing filtered meals and build filtered pagination
    const getFilteredPagination = async (category) => {
        const pageSize = pagination.pageSize;
        const filteredPages = [];
        
        // Define category ID mappings
        const categoryIds = {
            'Underweight': [1, 2, 3],
            'Normal': [4],
            'Overweight': [5],
            'Obese': [6, 7, 8]
        };
        
        const targetIds = categoryIds[category] || [];
        
        // Search through all pages to find which ones contain target category
        let currentPage = 1;
        let totalPages = 1;
        let totalFilteredItems = 0;
        
        while (currentPage <= totalPages) {
            try {
                console.log(`Checking page ${currentPage} for ${category} meals`);
                const response = await authAPI.getMeals(currentPage, pageSize);
                
                totalPages = response.pagination.total_pages || 1;
                
                // Count meals with target category on this page
                const filteredMealsOnPage = response.meals.filter(meal => targetIds.includes(meal.bmiCategory));
                
                if (filteredMealsOnPage.length > 0) {
                    filteredPages.push({
                        pageNumber: currentPage,
                        meals: filteredMealsOnPage,
                        totalMeals: filteredMealsOnPage.length
                    });
                    totalFilteredItems += filteredMealsOnPage.length;
                }
                
                currentPage++;
                
            } catch (error) {
                console.error(`Error checking page ${currentPage}:`, error);
                break;
            }
        }
        
        // Build filtered pagination info
        const filteredPagination = {
            currentPage: 1, // Start at first page with filtered data
            totalPages: filteredPages.length,
            totalItems: totalFilteredItems,
            hasNext: filteredPages.length > 1,
            hasPrev: false,
            pageSize: pageSize,
            filteredPages: filteredPages // Store which original pages have data
        };
        
        return filteredPagination;
    };

    // Handle filter change with context-aware pagination
    const handleFilterChange = async (category) => {
        setSelectedCategory(category);
        
        if (category === 'All') {
            // Reset to normal pagination
            fetchMeals(1, pagination.pageSize);
        } else {
            // Show loading state during filtering
            setLoading(true);
            setError(null);
            
            try {
                // Get filtered pagination info and load first page with filtered data
                const filteredPagination = await getFilteredPagination(category);
                
                if (filteredPagination.filteredPages.length > 0) {
                    // Load first page with filtered data
                    const firstFilteredPage = filteredPagination.filteredPages[0].pageNumber;
                    
                    // Load the actual meals for that page
                    const response = await authAPI.getMeals(firstFilteredPage, pagination.pageSize);
                    const categoryIds = {
                        'Underweight': [1, 2, 3],
                        'Normal': [4],
                        'Overweight': [5],
                        'Obese': [6, 7, 8]
                    };
                    const filteredMeals = response.meals.filter(meal => 
                        categoryIds[category].includes(meal.bmiCategory)
                    );
                    
                    setMeals(filteredMeals);
                    setPagination(filteredPagination);
                    setError(null);
                } else {
                    // No meals found for this category
                    setMeals([]);
                    setPagination({
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        hasNext: false,
                        hasPrev: false,
                        pageSize: pagination.pageSize
                    });
                    setError('No meal plans found for this category');
                }
            } catch (error) {
                console.error('Error filtering meals:', error);
                setError('Failed to load meals. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Pagination handlers
    const handlePageChange = async (newFilteredPage) => {
        if (selectedCategory === 'All') {
            // Normal pagination for "All" category
            fetchMeals(newFilteredPage, pagination.pageSize, true);
        } else {
            // Filtered pagination - map filtered page number to actual page number
            const categoryIds = {
                'Underweight': [1, 2, 3],
                'Normal': [4],
                'Overweight': [5],
                'Obese': [6, 7, 8]
            };
            
            if (pagination.filteredPages && pagination.filteredPages[newFilteredPage - 1]) {
                const actualPageNumber = pagination.filteredPages[newFilteredPage - 1].pageNumber;
                console.log(`Changing to filtered page ${newFilteredPage} (actual page ${actualPageNumber})`);
                
                // Show loading state during page change
                setPaginationLoading(true);
                
                try {
                    const response = await authAPI.getMeals(actualPageNumber, pagination.pageSize);
                    const filteredMeals = response.meals.filter(meal => 
                        categoryIds[selectedCategory].includes(meal.bmiCategory)
                    );
                    
                    setMeals(filteredMeals);
                    setPagination(prev => ({
                        ...prev,
                        currentPage: newFilteredPage,
                        hasNext: newFilteredPage < prev.totalPages,
                        hasPrev: newFilteredPage > 1
                    }));
                    setError(null);
                } catch (error) {
                    console.error('Error loading filtered page:', error);
                    setError('Failed to load meals. Please try again.');
                } finally {
                    setPaginationLoading(false);
                }
            }
        }
    };

    const handlePrevPage = () => {
        console.log('Previous button clicked. Current page:', pagination.currentPage, 'HasPrev:', pagination.hasPrev);
        if (pagination.hasPrev && !paginationLoading) {
            handlePageChange(pagination.currentPage - 1);
        } else {
            console.log('Previous page not available or loading');
        }
    };

    const handleNextPage = () => {
        console.log('Next button clicked. Current page:', pagination.currentPage, 'HasNext:', pagination.hasNext);
        if (pagination.hasNext && !paginationLoading) {
            handlePageChange(pagination.currentPage + 1);
        } else {
            console.log('Next page not available or loading');
        }
    };

    const macroData = [
        { name: 'Protein', value: 120, color: '#4F46E5' }, // Indigo
        { name: 'Carbs', value: 250, color: '#10B981' },   // Emerald
        { name: 'Fats', value: 65, color: '#F59E0B' },     // Amber
    ];

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
            
            // Use the same logic as handleFilterChange to load meals for the calculated category
            setSelectedCategory(category);
            
            if (category === 'All') {
                // Reset to normal pagination
                fetchMeals(1, pagination.pageSize);
            } else {
                // Show loading state during filtering
                setLoading(true);
                setError(null);
                
                try {
                    // Get filtered pagination info and load first page with filtered data
                    const filteredPagination = await getFilteredPagination(category);
                    
                    if (filteredPagination.filteredPages.length > 0) {
                        // Load first page with filtered data
                        const firstFilteredPage = filteredPagination.filteredPages[0].pageNumber;
                        
                        // Load the actual meals for that page
                        const response = await authAPI.getMeals(firstFilteredPage, pagination.pageSize);
                        const categoryIds = {
                            'Underweight': [1, 2, 3],
                            'Normal': [4],
                            'Overweight': [5],
                            'Obese': [6, 7, 8]
                        };
                        const filteredMeals = response.meals.filter(meal => 
                            categoryIds[category].includes(meal.bmiCategory)
                        );
                        
                        setMeals(filteredMeals);
                        setPagination({
                            ...filteredPagination,
                            currentPage: 1
                        });
                        setError(null);
                    } else {
                        // No meals found for this category
                        setMeals([]);
                        setPagination({
                            currentPage: 1,
                            totalPages: 0,
                            totalItems: 0,
                            hasNext: false,
                            hasPrev: false,
                            pageSize: pagination.pageSize
                        });
                        setError('No meal plans found for this category');
                    }
                } catch (error) {
                    console.error('Error filtering meals by BMI category:', error);
                    setError('Failed to load meals. Please try again.');
                } finally {
                    setLoading(false);
                    setBmiCalculating(false);
                }
            }
        }
    };

    const filteredMeals = selectedCategory === 'All'
        ? meals
        : selectedCategory === 'Underweight'
            ? meals.filter(m => [1, 2, 3].includes(m.bmiCategory))
            : selectedCategory === 'Normal'
                ? meals.filter(m => m.bmiCategory === 4)
                : selectedCategory === 'Overweight'
                    ? meals.filter(m => m.bmiCategory === 5)
                    : selectedCategory === 'Obese'
                        ? meals.filter(m => [6, 7, 8].includes(m.bmiCategory))
                        : meals;

    const handleEdit = (meal) => {
        setCurrentMeal(meal);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        
        try {
            setLoading(true);
            setSubmitLoading(true);
            setError(null);
            
            // Prepare meal data for API - use correct field names as per Postman
            const mealData = {
                food_item: currentMeal.name ? currentMeal.name.replace(' Plan', '').trim() : 'Untitled Meal', // Use 'food_item' field (not 'name')
                calories: parseInt(currentMeal.calories) || 0, // Ensure calories is a number
                meal_type: currentMeal.type ? currentMeal.type.toLowerCase() : 'breakfast',
                bmi_category_id: parseInt(currentMeal.bmiCategory) || 4 // Ensure bmi_category_id is a number
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
                console.log('Updating existing meal with ID:', currentMeal.id);
                response = await authAPI.updateMeal(currentMeal.id, mealData);
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
                    // Update the meal in local state with the new data from backend response
                    // Backend returns food_item field, so map it to name for frontend display
                    const updatedMeal = {
                        ...responseData,
                        name: responseData.food_item || responseData.name || currentMeal.name,
                        type: responseData.meal_type ? responseData.meal_type.charAt(0).toUpperCase() + responseData.meal_type.slice(1) : currentMeal.type,
                        bmiCategory: responseData.bmi_category_id || currentMeal.bmiCategory
                    };
                    
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
                    
                    
                    setMeals(prevMeals => {
                        const updatedMeals = prevMeals.map(meal => 
                            meal.id === currentMeal.id ? updatedMeal : meal
                        );
                        
                        // If we're in a specific category filter and category changed, remove the meal from current view
                        if (selectedCategory !== 'All' && categoryChanged) {
                            const categoryIds = {
                                'Underweight': [1, 2, 3],
                                'Normal': [4],
                                'Overweight': [5],
                                'Obese': [6, 7, 8]
                            };
                            const targetIds = categoryIds[selectedCategory] || [];
                            
                            // If the updated meal doesn't belong to current category, remove it from view
                            if (!targetIds.includes(updatedMeal.bmiCategory)) {
                                console.log('Meal changed category, removing from current view');
                                return updatedMeals.filter(meal => meal.id !== currentMeal.id);
                            }
                        }
                        
                        return updatedMeals;
                    });
                    
                    
                    // If we're in a specific category filter, recall the category filter API to show first page
                    if (selectedCategory !== 'All') {
                        console.log('Reloading category filter from page 1:', selectedCategory);
                        console.log('Category changed:', categoryChanged);
                        
                        // Use the same logic as handleFilterChange to reload the category from page 1
                        try {
                            setLoading(true);
                            setError(null);
                            
                            // Get filtered pagination info and load first page with filtered data
                            const filteredPagination = await getFilteredPagination(selectedCategory);
                            
                            if (filteredPagination.filteredPages.length > 0) {
                                // Load first page with filtered data
                                const firstFilteredPage = filteredPagination.filteredPages[0].pageNumber;
                                
                                // Load the actual meals for that page
                                const response = await authAPI.getMeals(firstFilteredPage, pagination.pageSize);
                                const categoryIds = {
                                    'Underweight': [1, 2, 3],
                                    'Normal': [4],
                                    'Overweight': [5],
                                    'Obese': [6, 7, 8]
                                };
                                const filteredMeals = response.meals.filter(meal => 
                                    categoryIds[selectedCategory].includes(meal.bmiCategory)
                                );
                                
                                console.log('Reloaded category filter:', selectedCategory);
                                console.log('Filtered meals found:', filteredMeals.length);
                                console.log('Setting pagination to page 1');
                                
                                setMeals(filteredMeals);
                                setPagination({
                                    ...filteredPagination,
                                    currentPage: 1 // Reset to page 1
                                });
                                setError(null);
                            } else {
                                // No meals found for this category
                                console.log('No meals found for category:', selectedCategory);
                                setMeals([]);
                                setPagination({
                                    currentPage: 1,
                                    totalPages: 0,
                                    totalItems: 0,
                                    hasNext: false,
                                    hasPrev: false,
                                    pageSize: pagination.pageSize
                                });
                                setError('No meal plans found for this category');
                            }
                        } catch (error) {
                            console.error('Error reloading category filter:', error);
                            setError('Failed to load meals. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    }
                    
                    // Show success message and close modal
                    setError(null);
                    setIsModalOpen(false);
                    setCurrentMeal(null);
                    
                } else {
                    console.error('Update failed - Response:', responseData);
                    setError('Failed to update meal. Please try again.');
                    // Don't close modal on error so user can retry
                }
            } else {
                // Create new meal
                console.log('Creating new meal');
                console.log('Creating new meal');
                response = await authAPI.createMeal(mealData);
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
                    setMeals(prevMeals => [...prevMeals, { ...currentMeal, id: responseData.id || Date.now() }]);
                    console.log('Added new meal to local state successfully');
                    
                    // Show success message and close modal
                    setError(null);
                    setIsModalOpen(false);
                    setCurrentMeal(null);
                } else {
                    console.error('Create failed - Response:', responseData);
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
            bmiCategory: 4 // Default to Normal (ID 4)
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this meal plan?')) {
            try {
                setLoading(true);
                setError(null);
                
                await authAPI.deleteMeal(id);
                
                // Remove meal from local state
                setMeals(meals.filter(m => m.id !== id));
                
                // If we're in a specific category filter, reload the category
                if (selectedCategory !== 'All') {
                    // Use the same logic as handleFilterChange to reload category from page 1
                    const filteredPagination = await getFilteredPagination(selectedCategory);
                    
                    if (filteredPagination.filteredPages.length > 0) {
                        // Load first page with filtered data
                        const firstFilteredPage = filteredPagination.filteredPages[0].pageNumber;
                        
                        // Load actual meals for that page
                        const response = await authAPI.getMeals(firstFilteredPage, pagination.pageSize);
                        const categoryIds = {
                            'Underweight': [1, 2, 3],
                            'Normal': [4],
                            'Overweight': [5],
                            'Obese': [6, 7, 8]
                        };
                        const filteredMeals = response.meals.filter(meal => 
                            categoryIds[selectedCategory].includes(meal.bmiCategory)
                        );
                        
                        setMeals(filteredMeals);
                        setPagination({
                            ...filteredPagination,
                            currentPage: 1 // Reset to page 1
                        });
                    } else {
                        // No meals found for this category
                        setMeals([]);
                        setPagination({
                            currentPage: 1,
                            totalPages: 0,
                            totalItems: 0,
                            hasNext: false,
                            hasPrev: false,
                            pageSize: pagination.pageSize
                        });
                        setError('No meal plans found for this category');
                    }
                }
                
                setError(null);
            } catch (error) {
                console.error('Failed to delete meal:', error);
                setError('Failed to delete meal. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 relative px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Nutrition</h1>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Meal Plan</span>
                    <span className="sm:hidden">Create</span>
                </button>
            </div>

            {/* BMI Calculator Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                    <div className="w-full lg:w-auto">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">BMI Smart Planner</h2>
                        <p className="opacity-90 text-sm sm:text-base max-w-full lg:max-w-md">Enter user details to filter nutrition plans specifically tailored for their BMI category.</p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <div className="flex-1 sm:flex-none">
                                <label className="block text-sm font-medium mb-1 opacity-80">Height (cm)</label>
                                <input
                                    type="number"
                                    value={bmiInputs.height}
                                    onChange={e => setBmiInputs({ ...bmiInputs, height: e.target.value })}
                                    className="px-3 py-2 rounded-lg text-gray-900 w-full sm:w-32 focus:outline-none"
                                    placeholder="175"
                                />
                            </div>
                            <div className="flex-1 sm:flex-none">
                                <label className="block text-sm font-medium mb-1 opacity-80">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={bmiInputs.weight}
                                    onChange={e => setBmiInputs({ ...bmiInputs, weight: e.target.value })}
                                    className="px-3 py-2 rounded-lg text-gray-900 w-full sm:w-32 focus:outline-none"
                                    placeholder="70"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={calculateBMI}
                                    disabled={bmiCalculating}
                                    className="bg-white text-indigo-600 px-4 sm:px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {bmiCalculating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
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
                        <div className="bg-white/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white/30 text-center w-full lg:w-auto lg:min-w-[200px]">
                            <p className="text-sm font-medium opacity-90">Calculated BMI</p>
                            <p className="text-3xl sm:text-4xl font-bold my-2">{bmiResult.bmi}</p>
                            <span className="inline-block px-3 py-1 bg-white text-indigo-600 rounded-full text-sm font-bold">
                                {bmiResult.category}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Macro Chart */}
                <div className="xl:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Focus Distribution</h3>
                        <div className="h-[200px] sm:h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={macroData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {macroData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Most users prefer Low Carb</p>
                        </div>
                    </div>
                </div>

                {/* Meals List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedCategory === 'All' ? 'All Plans' : `Plans for ${selectedCategory}`}
                        </h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            {['All', 'Underweight', 'Normal', 'Overweight', 'Obese'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleFilterChange(cat)}
                                    className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-colors ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
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
                    ) : filteredMeals.length === 0 ? (
                        <div className="text-center py-8 sm:py-10 text-gray-500 dark:text-gray-400">
                            No meal plans found for this category.
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {filteredMeals.map((meal) => (
                                <div key={meal.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 flex-shrink-0">
                                                <meal.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{meal.name} Plan</p>
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>{meal.type}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span>{meal.calories} kcal</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                                        [1, 2, 3].includes(meal.bmiCategory) ? 'bg-blue-100 text-blue-800' : // Underweight (IDs 1-3)
                                                            meal.bmiCategory === 4 ? 'bg-green-100 text-green-800' : // Normal (ID 4)
                                                                meal.bmiCategory === 5 ? 'bg-yellow-100 text-yellow-800' : // Overweight (ID 5)
                                                                    [6, 7, 8].includes(meal.bmiCategory) ? 'bg-red-100 text-red-800' : // Obese (IDs 6-8)
                                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        ID {meal.bmiCategory}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                                            <button onClick={() => handleEdit(meal)} className="text-xs sm:text-sm text-primary hover:underline font-medium">Edit</button>
                                            <button onClick={() => handleDelete(meal.id)} className="text-xs sm:text-sm text-red-500 hover:underline font-medium">Delete</button>
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
