import React, { useState, useEffect } from 'react';
import { Play, Clock, Flame, Dumbbell } from 'lucide-react';
import clsx from 'clsx';
import { authAPI } from '../services/api';


const Workouts = () => {
    const [workouts, setWorkouts] = useState([]);
    const [allWorkouts, setAllWorkouts] = useState([]); // Cache for all workouts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [filteredPages, setFilteredPages] = useState([]); // Store filtered pages for pagination
    const [isFilteredMode, setIsFilteredMode] = useState(false); // Track if we're in filtered mode
    const [allPaginatedResults, setAllPaginatedResults] = useState([]); // Store all paginated filtered results
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        pageSize: 10 // Show 10 workouts per page
    });

    // Fetch workouts from API
    const fetchWorkouts = async (page = 1, pageSize = 10) => {
        try {
            setLoading(true);
            const response = await authAPI.getWorkouts(page, pageSize);
            
            // Map API response to component format - access the workouts array from response
            const mappedWorkouts = response.workouts.map(workout => ({
                id: workout.id,
                title: workout.name,
                description: workout.description,
                duration: `${workout.duration_minutes} min`,
                calories: workout.calories_burned,
                difficulty: workout.difficulty_level,
                type: workout.category, // Use the category directly from API
                video: workout.workout_video_url,
                image: workout.workout_image_url
            }));
            
            // Set display workouts
            setWorkouts(mappedWorkouts);
            
            // Update pagination from API response - use the pagination object from API
            if (response.pagination) {
                setPagination({
                    currentPage: response.pagination.current_page,
                    totalPages: response.pagination.total_pages,
                    totalItems: response.pagination.total_items,
                    hasNext: response.pagination.has_next,
                    hasPrev: response.pagination.has_prev,
                    pageSize: response.pagination.page_size
                });
            } else {
                // Fallback if no pagination object in response
                const totalItems = mappedWorkouts.length;
                const totalPages = Math.ceil(totalItems / pageSize);
                setPagination({
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalItems,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    pageSize: pageSize
                });
            }
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch workouts:', err);
            setError('Failed to load workouts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkouts(1, 10);
    }, []);

    const categories = ['All', 'loose', 'maintain', 'gain'];

    // Smart filtering - find all pages containing filtered workouts and build filtered pagination
    const getFilteredPagination = async (category) => {
        const pageSize = 10;
        const allFilteredWorkouts = [];
        const filteredPages = [];
        
        // Search through all pages to find which ones contain target category
        let currentPage = 1;
        let totalPages = 1;
        
        while (currentPage <= totalPages) {
            try {
                const response = await authAPI.getWorkouts(currentPage, pageSize);
                
                totalPages = response.pagination.total_pages || 1;
                
                // Find workouts with target category on this page
                const filteredWorkoutsOnPage = response.workouts.filter(workout => 
                    category === 'All' || workout.category.toLowerCase() === category.toLowerCase()
                );
                
                if (filteredWorkoutsOnPage.length > 0) {
                    // Add all filtered workouts to our collection
                    allFilteredWorkouts.push(...filteredWorkoutsOnPage);
                    filteredPages.push({
                        pageNumber: currentPage,
                        workoutsCount: filteredWorkoutsOnPage.length
                    });
                }
                
                currentPage++;
                
            } catch (error) {
                console.error(`Error checking page ${currentPage}:`, error);
                break;
            }
        }
        
        // Create paginated filtered results (10 per page)
        const paginatedFilteredResults = [];
        for (let i = 0; i < allFilteredWorkouts.length; i += pageSize) {
            paginatedFilteredResults.push(allFilteredWorkouts.slice(i, i + pageSize));
        }
        
        // Build filtered pagination info
        const filteredPagination = {
            currentPage: 1,
            totalPages: paginatedFilteredResults.length,
            totalItems: allFilteredWorkouts.length,
            hasNext: paginatedFilteredResults.length > 1,
            hasPrev: false,
            pageSize: pageSize,
            filteredPages: filteredPages // Store which original pages have data
        };
        
        // Map first page of filtered results to component format
        const firstPageWorkouts = paginatedFilteredResults.length > 0 ? paginatedFilteredResults[0] : [];
        const mappedWorkouts = firstPageWorkouts.map(workout => ({
            id: workout.id,
            title: workout.name,
            description: workout.description,
            duration: `${workout.duration_minutes} min`,
            calories: workout.calories_burned,
            difficulty: workout.difficulty_level,
            type: workout.category,
            video: workout.workout_video_url,
            image: workout.workout_image_url
        }));
        
        // Store all paginated results for navigation
        const allPaginatedMappedResults = paginatedFilteredResults.map(page => 
            page.map(workout => ({
                id: workout.id,
                title: workout.name,
                description: workout.description,
                duration: `${workout.duration_minutes} min`,
                calories: workout.calories_burned,
                difficulty: workout.difficulty_level,
                type: workout.category,
                video: workout.workout_video_url,
                image: workout.workout_image_url
            }))
        );
        
        return {
            workouts: mappedWorkouts,
            pagination: filteredPagination,
            allPaginatedResults: allPaginatedMappedResults
        };
    };

    // Handle category filter change
    const handleFilterChange = async (newFilter) => {
        setFilter(newFilter);
        
        if (newFilter === 'All') {
            // Reset to normal pagination
            setIsFilteredMode(false);
            setFilteredPages([]);
            setAllPaginatedResults([]);
            fetchWorkouts(1, 10);
        } else {
            // Apply server-side filtering
            try {
                setLoading(true);
                const filteredData = await getFilteredPagination(newFilter);
                setWorkouts(filteredData.workouts);
                setPagination(filteredData.pagination);
                setFilteredPages(filteredData.pagination.filteredPages);
                setAllPaginatedResults(filteredData.allPaginatedResults);
                setIsFilteredMode(true);
                setError(null);
            } catch (error) {
                console.error('Error filtering workouts:', error);
                setError('Failed to filter workouts. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        
        if (isFilteredMode && allPaginatedResults.length > 0) {
            // Handle filtered pagination - use pre-paginated results
            const targetPageResults = allPaginatedResults[newPage - 1];
            if (targetPageResults) {
                setWorkouts(targetPageResults);
                setPagination(prev => ({
                    ...prev,
                    currentPage: newPage,
                    hasNext: newPage < allPaginatedResults.length,
                    hasPrev: newPage > 1
                }));
            }
        } else {
            // Handle normal pagination
            fetchWorkouts(newPage, 10);
        }
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
        
        if (!currentWorkout.calories_burned?.toString().trim()) {
            errors.calories_burned = 'Calories burned is required';
        }
        
        if (!currentWorkout.workout_image_url && !currentWorkout.image_file) {
            errors.workout_image_url = 'Workout image is required';
        }
        
        if (!currentWorkout.workout_video_url && !currentWorkout.video_file) {
            errors.workout_video_url = 'Workout video is required';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this workout?')) {
            try {
                await authAPI.deleteWorkout(id);
                console.log('Workout deleted successfully');
                
                // Determine which page to load after deletion
                let targetPage = Math.max(1, parseInt(pagination.currentPage) || 1);
                
                // If we're in filtered mode, handle differently
                if (isFilteredMode) {
                    // In filtered mode, check if current page will be empty after deletion
                    if (workouts.length === 1 && pagination.currentPage > 1) {
                        targetPage = pagination.currentPage - 1;
                    }
                    // Re-apply filter to get updated results
                    await handleFilterChange(filter);
                } else {
                    // In normal mode, check if we're on the last page and it has only one item
                    if (workouts.length === 1 && pagination.currentPage > 1) {
                        targetPage = pagination.currentPage - 1;
                    }
                    // Refresh workouts list with the determined page
                    await fetchWorkouts(targetPage, 10);
                }
                
            } catch (error) {
                console.error('Error deleting workout:', error);
                setError(error.message || 'Failed to delete workout');
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
            calories_burned: workout.calories || '',
            difficulty_level: workout.difficulty || 'beginner',
            category: workout.type || 'loose',
            workout_image_url: workout.image || '',
            workout_video_url: workout.video || '',
            // Don't set file objects for editing (user can re-upload if needed)
        };
        
        setCurrentWorkout(editWorkout);
        setIsEditModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            
            // Add all workout data with correct field names
            formData.append('title', currentWorkout.title);
            formData.append('description', currentWorkout.description);
            formData.append('duration', currentWorkout.duration);
            formData.append('calorie_burn', currentWorkout.calories_burned);
            formData.append('activity_level', currentWorkout.difficulty_level);
            formData.append('workout_category', currentWorkout.category);
            
            // Add files if they exist
            if (currentWorkout.image_file) {
                formData.append('workout_image', currentWorkout.image_file);
            }
            
            if (currentWorkout.video_file) {
                formData.append('workout_video', currentWorkout.video_file);
            }
            
            // Check if it's an edit or create operation
            const isEdit = workouts.some(w => w.id === currentWorkout.id);
            
            if (isEdit) {
                // Update existing workout
                await authAPI.updateWorkout(currentWorkout.id, formData);
            } else {
                // Create new workout
                await authAPI.createWorkout(formData);
            }
            
            // Refresh workouts list (stay on current page)
            const currentPage = Math.max(1, parseInt(pagination.currentPage) || 1);
            await fetchWorkouts(currentPage, 10);
            
            setIsEditModalOpen(false);
            setCurrentWorkout(null);
            setValidationErrors({});
            
        } catch (error) {
            console.error('Error saving workout:', error);
            setError(error.message || 'Failed to save workout');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Workouts</h1>
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleFilterChange(cat)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                filter === cat
                                    ? "bg-primary text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setCurrentWorkout({ 
        id: Date.now(), 
        title: '', 
        description: '',
        duration: '', 
        calories_burned: '',
        difficulty_level: 'beginner',
        category: 'Loose',
        workout_image_url: '',
        workout_video_url: ''
    });
                            setIsEditModalOpen(true);
                        }}
                        className="ml-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        + Add Workout
                    </button>
                </div>
            </div>

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
                        <div key={workout.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="w-full sm:w-48 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                {workout.image ? (
                                    <img src={workout.image} alt={workout.title} className="w-full h-full object-cover" />
                                ) : workout.video ? (
                                    <video src={workout.video} className="w-full h-full object-cover" controls />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Dumbbell className="w-10 h-10 opacity-50" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{workout.title}</h3>
                                <div className="flex justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <span>{workout.type}</span>
                                    <span>•</span>
                                    <span>{workout.duration}</span>
                                    <span>•</span>
                                    <span>{workout.difficulty}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(workout)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(workout.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                    Delete
                                </button>
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
                        {filter === 'All' ? 'Start by adding your first workout.' : `No workouts found in ${filter} category.`}
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
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
                                        value={currentWorkout.category}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, category: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
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

                            {/* Calories and Difficulty Level */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calories Burned</label>
                                    <input
                                        type="number"
                                        value={currentWorkout.calories_burned}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, calories_burned: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                            validationErrors.calories_burned ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    />
                                    {validationErrors.calories_burned && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.calories_burned}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level</label>
                                    <select
                                        value={currentWorkout.difficulty_level}
                                        onChange={e => setCurrentWorkout({ ...currentWorkout, difficulty_level: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
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
