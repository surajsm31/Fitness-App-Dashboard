import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Clock, Flame, Dumbbell, ChevronDown, X, Filter, Search } from 'lucide-react';
import clsx from 'clsx';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';


const Workouts = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [workouts, setWorkouts] = useState([]);
    const [allWorkouts, setAllWorkouts] = useState([]); // Cache for all workouts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter & Search State
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        activityType: 'All',
        workoutCategory: 'All'
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [filteredPages, setFilteredPages] = useState([]); // Store filtered pages for pagination
    const [isFilteredMode, setIsFilteredMode] = useState(false); // Track if we're in filtered mode
    const [allPaginatedResults, setAllPaginatedResults] = useState([]); // Store all paginated filtered results
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For mobile dropdown
    const [isActivityTypeDropdownOpen, setIsActivityTypeDropdownOpen] = useState(false);
    const [isWorkoutCategoryDropdownOpen, setIsWorkoutCategoryDropdownOpen] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        pageSize: 10 // Show 10 workouts per page
    });

    // Fetch all workouts and cache them
    const fetchAllWorkouts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Clear cache first to ensure fresh data
            setAllWorkouts([]);
            setWorkouts([]);
            
            // Fetch all workouts (use a large limit to get everything)
            const response = await authAPI.getWorkouts(1, 1000); // Fetch up to 1000 workouts
            
            // Map API response to component format matching new API schema
            const mappedWorkouts = response.workouts.map(workout => ({
                id: workout.id,
                title: workout.name, // API returns 'name', map to 'title' for display
                description: workout.description,
                duration: `${workout.duration_minutes} min`,
                calories: workout.calories_burned,
                difficulty: workout.difficulty_level,
                type: workout.workout_type || workout.category, // Use workout_type first, fallback to category
                category: workout.category, // Keep category for filtering
                workout_type: workout.workout_type, // Keep workout_type for filtering
                video: workout.workout_video_url,
                image: workout.workout_image_url
            }));
            
            // Cache all workouts
            setAllWorkouts(mappedWorkouts);
            
            // Set initial display workouts
            setWorkouts(mappedWorkouts);
            
            // Update pagination
            const totalItems = mappedWorkouts.length;
            const totalPages = Math.ceil(totalItems / 10);
            setPagination({
                currentPage: 1,
                totalPages: totalPages,
                totalItems: totalItems,
                hasNext: totalPages > 1,
                hasPrev: false,
                pageSize: 10
            });
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch workouts:', err);
            setError('Failed to load workouts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load workouts on component mount
    useEffect(() => {
        fetchAllWorkouts();
    }, []); // Only run once on mount

    // Re-apply filters when allWorkouts are loaded (for initial display)
    useEffect(() => {
        if (allWorkouts.length > 0) {
            applyFiltersAndPagination(searchTerm, filters, pagination.currentPage);
        }
    }, [allWorkouts]); // Re-run when cache is populated

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isActivityTypeDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsActivityTypeDropdownOpen(false);
            }
            if (isWorkoutCategoryDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsWorkoutCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActivityTypeDropdownOpen, isWorkoutCategoryDropdownOpen]);

    const activityTypes = ['All', 'Gym', 'Home'];
    const workoutCategories = ['All', 'Loose', 'Maintain', 'Gain'];

    // Client-side filtering and pagination
    const applyFiltersAndPagination = (searchTerm = '', filters = null, page = 1) => {
        let filteredWorkouts = [...allWorkouts];
        
        // Apply search filter
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filteredWorkouts = filteredWorkouts.filter(workout => {
                return (
                    workout.title?.toLowerCase().includes(searchLower) ||
                    workout.description?.toLowerCase().includes(searchLower) ||
                    workout.category?.toLowerCase().includes(searchLower) ||
                    workout.workout_type?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        // Apply other filters (case-insensitive like Users page)
        if (filters) {
            if (filters.activityType && filters.activityType !== 'All') {
                filteredWorkouts = filteredWorkouts.filter(workout => {
                    const workoutType = workout.workout_type || '';
                    const filterType = filters.activityType.toLowerCase();
                    return workoutType.toLowerCase() === filterType;
                });
            }
            if (filters.workoutCategory && filters.workoutCategory !== 'All') {
                filteredWorkouts = filteredWorkouts.filter(workout => {
                    const workoutCategory = workout.category || '';
                    const filterCategory = filters.workoutCategory.toLowerCase();
                    return workoutCategory.toLowerCase() === filterCategory;
                });
            }
        }
        
        // Apply pagination
        const totalItems = filteredWorkouts.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        const startIndex = (page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedWorkouts = filteredWorkouts.slice(startIndex, endIndex);
        
        // Update display workouts and pagination
        setWorkouts(paginatedWorkouts);
        setPagination({
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            pageSize: pagination.pageSize
        });
    };

    // Search and filter handlers
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        // Apply filters immediately with new search term
        applyFiltersAndPagination(value, filters, 1);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        // Apply filters immediately using cached data
        applyFiltersAndPagination(searchTerm, newFilters, 1);
    };

    // Clear all filters and search
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({ activityType: 'All', workoutCategory: 'All' });
        setIsActivityTypeDropdownOpen(false);
        setIsWorkoutCategoryDropdownOpen(false);
        // Apply cleared filters immediately using cached data - this will show all workouts from cache
        applyFiltersAndPagination('', { activityType: 'All', workoutCategory: 'All' }, 1);
    };

    // Handle filter toggle - close and clear filters when toggling off
    const handleFilterToggle = () => {
        if (showFilters) {
            // If filters are currently shown, close panel and clear all filters
            setShowFilters(false);
            handleClearFilters(); // This will show all workouts from cache
        } else {
            // If filters are hidden, show the panel
            setShowFilters(true);
        }
    };
    
    // Pagination handlers
    const handlePageChange = (newPage) => {
        console.log('Changing to page:', newPage);
        applyFiltersAndPagination(searchTerm, filters, newPage);
        // Scroll to top of page with delay
        setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 100);
    };

    const handlePrevPage = () => {
        if (pagination.hasPrev) {
            handlePageChange(pagination.currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.hasNext) {
            handlePageChange(pagination.currentPage + 1);
        }
    };

    // Validation functions
    const validateImageFile = (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload JPG, JPEG, or PNG images only.';
        }
        
        if (file.size > maxSize) {
            return 'File size exceeds 10MB limit.';
        }
        
        return null;
    };

    const validateVideoFile = (file) => {
        const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/x-matroska'];
        const maxSize = 35 * 1024 * 1024; // 35MB
        
        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload MP4, AVI, MOV, or MKV videos only.';
        }
        
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `Video file size (${fileSizeMB}MB) exceeds the 35MB limit. Please choose a smaller video file.`;
        }
        
        return null;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const error = validateImageFile(file);
        if (error) {
            setValidationErrors(prev => ({ ...prev, workout_image_url: error }));
            return;
        }
        
        setValidationErrors(prev => ({ ...prev, workout_image_url: null }));
        const imageUrl = URL.createObjectURL(file);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let displayWidth, displayHeight;
            
            // Calculate responsive dimensions based on aspect ratio
            if (aspectRatio > 1) {
                // Landscape image
                displayWidth = Math.min(img.width, 600);
                displayHeight = displayWidth / aspectRatio;
            } else {
                // Portrait or square image
                displayHeight = Math.min(img.height, 400);
                displayWidth = displayHeight * aspectRatio;
            }
            
            setImageDimensions({ width: displayWidth, height: displayHeight });
        };
        img.src = imageUrl;
        
        setCurrentWorkout({ ...currentWorkout, workout_image_url: imageUrl, image_file: file });
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const error = validateVideoFile(file);
        if (error) {
            setValidationErrors(prev => ({ ...prev, workout_video_url: error }));
            return;
        }
        
        setValidationErrors(prev => ({ ...prev, workout_video_url: null }));
        const videoUrl = URL.createObjectURL(file);
        
        // Get video dimensions
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
            const aspectRatio = video.videoWidth / video.videoHeight;
            let displayWidth, displayHeight;
            
            // Calculate responsive dimensions based on aspect ratio
            if (aspectRatio > 1) {
                // Landscape video
                displayWidth = Math.min(video.videoWidth, 600);
                displayHeight = displayWidth / aspectRatio;
            } else {
                // Portrait or square video
                displayHeight = Math.min(video.videoHeight, 400);
                displayWidth = displayHeight * aspectRatio;
            }
            
            setVideoDimensions({ width: displayWidth, height: displayHeight });
        };
        video.src = videoUrl;
        
        setCurrentWorkout({ ...currentWorkout, workout_video_url: videoUrl, video_file: file });
    };

    const validateForm = () => {
        const errors = {};
        
        if (!currentWorkout.title?.toString().trim()) {
            errors.title = 'Title is required';
        }
        
        if (!currentWorkout.description?.toString().trim()) {
            errors.description = 'Description is required';
        }
        
        if (!currentWorkout.duration?.toString().trim()) {
            errors.duration = 'Duration is required';
        }
        
        if (!currentWorkout.calories?.toString().trim()) {
            errors.calories = 'Calories burned is required';
        }
        
        // For CREATE: image and video files are required (UploadFile schema)
        // For UPDATE: image and video are optional (Optional[str] schema)
        if (!isEdit) {
            if (!currentWorkout.image_file) {
                errors.workout_image_url = 'Workout image is required for creating new workout';
            }
            
            if (!currentWorkout.video_file) {
                errors.workout_video_url = 'Workout video is required for creating new workout';
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDelete = async (id) => {
        // Find the workout to get its name before deletion
        const workoutToDelete = workouts.find(w => w.id === id);
        const workoutName = workoutToDelete?.title || 'Workout';
        
        if (window.confirm('Are you sure you want to delete this workout?')) {
            try {
                await authAPI.deleteWorkout(id);
                console.log('Workout deleted successfully');
                
                // Clear cache and refresh workouts list
                await fetchAllWorkouts();
                
                showDeleteSuccess(workoutName);
            } catch (error) {
                console.error('Error deleting workout:', error);
                showDeleteError(workoutName, error.message);
            }
        }
    };

    const handleEditClick = (workout) => {
        // Map the workout data to the form format
        const editWorkout = {
            id: workout.id,
            title: workout.title,
            description: workout.description || '',
            duration: workout.duration ? workout.duration.replace(' min', '') : '',
            calories: workout.calories || '',
            difficulty: workout.difficulty || 'beginner',
            category: workout.category || 'loose',
            workout_type: workout.type || '',
            workout_image_url: workout.image || '',
            workout_video_url: workout.video || '',
            // Don't set file objects for editing (user can re-upload if needed)
        };
        
        setCurrentWorkout(editWorkout);
        setIsEditModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        console.log('💪 [WORKOUT COMPONENT] Starting handleSave process');
        console.log('💪 [WORKOUT COMPONENT] Current workout data:', currentWorkout);
        
        if (!validateForm()) {
            console.log('💪 [WORKOUT COMPONENT] Form validation failed');
            return;
        }
        
        console.log('💪 [WORKOUT COMPONENT] Form validation passed');
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            console.log('💪 [WORKOUT COMPONENT] Created new FormData instance');
            
            // Add all workout data with correct field names matching actual API schema
            console.log('💪 [WORKOUT COMPONENT] Adding workout data to FormData:');
            console.log('💪 [WORKOUT COMPONENT]   title:', currentWorkout.title);
            formData.append('title', currentWorkout.title);
            
            console.log('💪 [WORKOUT COMPONENT]   description:', currentWorkout.description);
            formData.append('description', currentWorkout.description);
            
            console.log('💪 [WORKOUT COMPONENT]   duration:', currentWorkout.duration);
            formData.append('duration', currentWorkout.duration);
            
            console.log('💪 [WORKOUT COMPONENT]   calorie_burn:', currentWorkout.calories);
            formData.append('calorie_burn', currentWorkout.calories);
            
            console.log('💪 [WORKOUT COMPONENT]   activity_level:', currentWorkout.difficulty);
            formData.append('activity_level', currentWorkout.difficulty);
            
            console.log('💪 [WORKOUT COMPONENT]   workout_category:', currentWorkout.category);
            formData.append('workout_category', currentWorkout.category);
            
            console.log('💪 [WORKOUT COMPONENT]   workout_type:', currentWorkout.workout_type);
            formData.append('workout_type', currentWorkout.workout_type);
            
            // Add files if they exist
            if (currentWorkout.image_file) {
                console.log('💪 [WORKOUT COMPONENT]   workout_image:', currentWorkout.image_file.name, currentWorkout.image_file.size, 'bytes');
                formData.append('workout_image', currentWorkout.image_file);
            } else {
                console.log('💪 [WORKOUT COMPONENT]   No image file to upload');
            }
            
            if (currentWorkout.video_file) {
                console.log('💪 [WORKOUT COMPONENT]   workout_video:', currentWorkout.video_file.name, currentWorkout.video_file.size, 'bytes');
                formData.append('workout_video', currentWorkout.video_file);
            } else {
                console.log('💪 [WORKOUT COMPONENT]   No video file to upload');
            }
            
            // Log final FormData before sending
            console.log('💪 [WORKOUT COMPONENT] Final FormData contents:');
            console.log('💪 [WORKOUT COMPONENT] FormData keys:', Array.from(formData.keys()));
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`💪 [WORKOUT COMPONENT]   ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
                } else {
                    console.log(`💪 [WORKOUT COMPONENT]   ${key}: ${value}`);
                }
            }
            
            // Check if it's an edit or create operation
            const isEdit = workouts.some(w => w.id === currentWorkout.id);
            const workoutName = currentWorkout.title || 'Workout';
            console.log(`💪 [WORKOUT COMPONENT] Operation: ${isEdit ? 'UPDATE' : 'CREATE'} workout "${workoutName}"`);
            
            if (isEdit) {
                // Update existing workout
                console.log('💪 [WORKOUT COMPONENT] Calling updateWorkout API...');
                await authAPI.updateWorkout(currentWorkout.id, formData);
                showUpdateSuccess(workoutName);
            } else {
                // Create new workout
                console.log('💪 [WORKOUT COMPONENT] Calling createWorkout API...');
                await authAPI.createWorkout(formData);
                showCreateSuccess(workoutName);
            }
            
            // Clear cache and refresh workouts list
            await fetchAllWorkouts();
            
            setIsEditModalOpen(false);
            setCurrentWorkout(null);
            setValidationErrors({});
            
        } catch (error) {
            console.error('Error saving workout:', error);
            const workoutName = currentWorkout.title || 'Workout';
            const isEdit = workouts.some(w => w.id === currentWorkout.id);
            if (isEdit) {
                showUpdateError(workoutName, error.message);
            } else {
                showCreateError(workoutName, error.message);
            }
            // Close modal on error as well
            setIsEditModalOpen(false);
            setCurrentWorkout(null);
            setValidationErrors({});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Custom Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"> Workouts</h1>
                
                {/* Search Bar and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-initial">
                        <input
                            type="text"
                            placeholder="Search workouts..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full lg:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFilterToggle}
                            className={`p-2 border rounded-lg transition-colors ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Filter className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => {
                                setCurrentWorkout({ 
                                    id: Date.now(), 
                                    title: '', 
                                    description: '',
                                    duration: '', 
                                    calories: '',
                                    difficulty: '',
                                    category: '',
                                    workout_type: '',
                                    workout_image_url: '',
                                    workout_video_url: ''
                                });
                                setIsEditModalOpen(true);
                            }}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        >
                            + Add Workout
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="flex flex-col gap-3 sm:gap-4 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 w-full max-w-full overflow-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
                        <div className="w-full max-w-full dropdown-container relative !overflow-visible">
                            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Activity Type</label>
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsActivityTypeDropdownOpen(!isActivityTypeDropdownOpen);
                                        setIsWorkoutCategoryDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm p-2 sm:p-2.5 pr-8 sm:pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none truncate max-w-full"
                                >
                                    <span className="truncate">{filters.activityType === 'All' ? 'All Activity Types' : filters.activityType}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${isActivityTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isActivityTypeDropdownOpen && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleFilterChange({ ...filters, activityType: 'All' });
                                                setIsActivityTypeDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${filters.activityType === 'All' ? 'bg-primary/10 font-semibold text-primary dark:text-primary' : ''}`}
                                        >
                                            All Activity Types
                                        </button>
                                        {activityTypes.filter(type => type !== 'All').map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    handleFilterChange({ ...filters, activityType: type });
                                                    setIsActivityTypeDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${filters.activityType === type ? 'bg-primary/10 font-semibold text-primary dark:text-primary' : ''}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full max-w-full dropdown-container relative !overflow-visible">
                            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Workout Category</label>
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsWorkoutCategoryDropdownOpen(!isWorkoutCategoryDropdownOpen);
                                        setIsActivityTypeDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm p-2 sm:p-2.5 pr-8 sm:pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none truncate max-w-full"
                                >
                                    <span className="truncate">{filters.workoutCategory === 'All' ? 'All Categories' : filters.workoutCategory}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${isWorkoutCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isWorkoutCategoryDropdownOpen && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleFilterChange({ ...filters, workoutCategory: 'All' });
                                                setIsWorkoutCategoryDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${filters.workoutCategory === 'All' ? 'bg-primary/10 font-semibold text-primary dark:text-primary' : ''}`}
                                        >
                                            All Categories
                                        </button>
                                        {workoutCategories.filter(category => category !== 'All').map(category => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => {
                                                    handleFilterChange({ ...filters, workoutCategory: category });
                                                    setIsWorkoutCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${filters.workoutCategory === category ? 'bg-primary/10 font-semibold text-primary dark:text-primary' : ''}`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleClearFilters}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-all whitespace-nowrap border border-transparent active:scale-95"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading workouts...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                        <Flame className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700 dark:text-red-300">{error}</span>
                    </div>
                    <button
                        onClick={fetchWorkouts}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Workouts Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 gap-4">
                    {workouts.map((workout) => (
                        <div key={workout.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20">
                            {/* Mobile: Stack layout, Desktop: Side-by-side */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                {/* Image/Video Section */}
                                <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 relative group-hover:shadow-inner transition-all duration-300">
                                    <div className="w-full h-full relative">
                                        {workout.image ? (
                                            <img src={workout.image} alt={workout.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : workout.video ? (
                                            <video src={workout.video} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Dumbbell className="w-10 h-10 opacity-30 animate-pulse" />
                                            </div>
                                        )}
                                        {/* Overlay for hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                                    </div>
                                </div>
                                
                                {/* Content Section */}
                                <div className="flex-1 flex flex-col min-w-0 justify-between">
                                    {/* Title and Meta */}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
                                                {workout.type}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {workout.duration}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="inline-flex items-center text-xs font-medium text-orange-500 dark:text-orange-400">
                                                <Flame className="w-3 h-3 mr-1" />
                                                {workout.calories} kcal
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                workout.difficulty?.toLowerCase() === 'beginner' ? 'bg-green-100 text-green-700' :
                                                workout.difficulty?.toLowerCase() === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            )}>
                                                {workout.difficulty}
                                            </span>
                                            {/* Workout Category Badge */}
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                workout.category?.toLowerCase() === 'loose' ? 'bg-blue-100 text-blue-700' :
                                                workout.category?.toLowerCase() === 'maintain' ? 'bg-indigo-100 text-indigo-700' :
                                                workout.category?.toLowerCase() === 'gain' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                            )}>
                                                {workout.category}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">{workout.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                            {workout.description}
                                        </p>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => handleEditClick(workout)}
                                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary hover:text-white dark:hover:bg-primary transition-all duration-300 border border-gray-100 dark:border-gray-700"
                                        >
                                            Edit Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(workout.id)}
                                            className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
                                            title="Delete Workout"
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

            {/* Empty State */}
            {!loading && !error && workouts.length === 0 && (
                <div className="text-center py-12">
                    <Dumbbell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No workouts found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filters.workoutCategory === 'All' ? 'Start by adding your first workout.' : `No workouts found in ${filters.workoutCategory} category.`}
                    </p>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.totalItems > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pagination.totalItems > 0 ? (
                                <span>
                                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} workouts
                                </span>
                            ) : (
                                <span>No workouts found</span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPrev}
                                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            
                            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            
                            <button 
                                onClick={handleNextPage}
                                disabled={!pagination.hasNext}
                                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modal */}
            {isEditModalOpen && currentWorkout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 pr-8">
                            {workouts.find(w => w.id === currentWorkout.id) ? 'Edit Workout' : 'Add Workout'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                            {/* Workout Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workout Image</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                                         style={{ 
                                             width: imageDimensions.width ? `${Math.min(imageDimensions.width, window.innerWidth > 640 ? 600 : window.innerWidth - 32)}px` : '100%',
                                             height: imageDimensions.height ? `${imageDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        {currentWorkout.workout_image_url ? (
                                            <img 
                                                src={currentWorkout.workout_image_url} 
                                                alt="Workout preview" 
                                                className="w-full h-full object-contain" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ minHeight: '160px' }}>
                                                <div className="text-center">
                                                    <Dumbbell className="w-8 h-8 opacity-50 mx-auto mb-2" />
                                                    <span className="text-xs">No image selected</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={handleImageUpload}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary file:text-white
                                                hover:file:bg-indigo-700
                                            "
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, JPEG, PNG up to 10MB</p>
                                        {validationErrors.workout_image_url && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors.workout_image_url}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Workout Video Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workout Video</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                                         style={{ 
                                             width: videoDimensions.width ? `${Math.min(videoDimensions.width, window.innerWidth > 640 ? 600 : window.innerWidth - 32)}px` : '100%',
                                             height: videoDimensions.height ? `${videoDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        {currentWorkout.workout_video_url ? (
                                            <video 
                                                src={currentWorkout.workout_video_url} 
                                                className="w-full h-full object-contain" 
                                                controls
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ minHeight: '160px' }}>
                                                <div className="text-center">
                                                    <Play className="w-8 h-8 opacity-50 mx-auto mb-2" />
                                                    <span className="text-xs">No video selected</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept=".mp4,.avi,.mov,.mkv"
                                            onChange={handleVideoUpload}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary file:text-white
                                                hover:file:bg-indigo-700
                                            "
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">MP4, AVI, MOV, MKV up to 30-35MB</p>
                                        {validationErrors.workout_video_url && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors.workout_video_url}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={currentWorkout.title}
                                    onChange={e => setCurrentWorkout({ ...currentWorkout, title: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                        validationErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    required
                                />
                                {validationErrors.title && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={currentWorkout.description}
                                    onChange={e => setCurrentWorkout({ ...currentWorkout, description: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                        validationErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    rows="3"
                                    required
                                />
                                {validationErrors.description && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.description}</p>
                                )}
                            </div>

                            {/* Category and Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select
                                        value={currentWorkout.category || ''}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {workoutCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={currentWorkout.duration}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, duration: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                            validationErrors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    />
                                    {validationErrors.duration && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.duration}</p>
                                    )}
                                </div>
                            </div>

                            {/* Workout Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Workout Type</label>
                                <select
                                    value={currentWorkout.workout_type || ''}
                                    onChange={e => setCurrentWorkout({ ...currentWorkout, workout_type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="" disabled>Select workout type</option>
                                    <option value="Gym">GYM</option>
                                    <option value="Home">Home</option>
                                </select>
                            </div>

                            {/* Calories and Difficulty Level */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calories Burned</label>
                                    <input
                                        type="number"
                                        value={currentWorkout.calories}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, calories: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                            validationErrors.calories ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    />
                                    {validationErrors.calories && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.calories}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level</label>
                                    <select
                                        value={currentWorkout.difficulty || ''}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="" disabled>Select Difficulty Level</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setValidationErrors({});
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Workout'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workouts;
