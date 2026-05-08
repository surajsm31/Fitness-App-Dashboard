import React, { useState, useEffect } from 'react';
import { Play, Clock, Flame, Compass, ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const ExploreActivities = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [activities, setActivities] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredPages, setFilteredPages] = useState([]);
    const [isFilteredMode, setIsFilteredMode] = useState(false);
    const [allPaginatedResults, setAllPaginatedResults] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        pageSize: 10
    });

    // Fetch activities from API
    const fetchActivities = async (page = 1, pageSize = 10) => {
        try {
            setLoading(true);
            const response = await authAPI.getActivities(page, pageSize);
            
            // Map API response to component format
            const activitiesData = response.data || [];
            
            const mappedActivities = activitiesData.map(activity => ({
                id: activity.id,
                title: activity.activity_name,
                description: activity.description,
                duration: activity.duration,
                type: activity.activity_type,
                image: activity.image,
                video: activity.video
            }));
            
            setActivities(mappedActivities);
            
            // Update pagination from API response
            const paginationData = response.pagination;
            if (paginationData) {
                setPagination({
                    currentPage: paginationData.page || paginationData.current_page,
                    totalPages: paginationData.total_pages,
                    totalItems: paginationData.total,
                    hasNext: paginationData.has_next,
                    hasPrev: paginationData.has_prev,
                    pageSize: paginationData.limit || paginationData.page_size
                });
            } else {
                const totalItems = mappedActivities.length;
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
            setError('Failed to load activities. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(1, 10);
    }, []);

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

    const activityTypes = ['All', 'meditation', 'yoga', 'cycling', 'treadmill', 'outdoor', 'mindful_cooldown'];

    // Smart filtering - find all pages containing filtered activities and build filtered pagination
    const getFilteredPagination = async (activityType) => {
        const pageSize = 10;
        const allFilteredActivities = [];
        const filteredPages = [];
        
        let currentPage = 1;
        let totalPages = 1;
        
        while (currentPage <= totalPages) {
            try {
                const response = await authAPI.getActivities(currentPage, pageSize);
                
                totalPages = response.pagination?.total_pages || 1;
                
                const activitiesData = response.data || [];
                const filteredActivitiesOnPage = activitiesData.filter(activity => 
                    activityType === 'All' || activity.activity_type.toLowerCase() === activityType.toLowerCase()
                );
                
                if (filteredActivitiesOnPage.length > 0) {
                    allFilteredActivities.push(...filteredActivitiesOnPage);
                    filteredPages.push({
                        pageNumber: currentPage,
                        activitiesCount: filteredActivitiesOnPage.length
                    });
                }
                
                currentPage++;
                
            } catch (error) {
                console.error(`Error checking page ${currentPage}:`, error);
                break;
            }
        }
        
        const paginatedFilteredResults = [];
        for (let i = 0; i < allFilteredActivities.length; i += pageSize) {
            paginatedFilteredResults.push(allFilteredActivities.slice(i, i + pageSize));
        }
        
        const filteredPagination = {
            currentPage: 1,
            totalPages: paginatedFilteredResults.length,
            totalItems: allFilteredActivities.length,
            hasNext: paginatedFilteredResults.length > 1,
            hasPrev: false,
            pageSize: pageSize,
            filteredPages: filteredPages
        };
        
        const firstPageActivities = paginatedFilteredResults.length > 0 ? paginatedFilteredResults[0] : [];
        const mappedActivities = firstPageActivities.map(activity => ({
            id: activity.id,
            title: activity.activity_name,
            description: activity.description,
            duration: activity.duration,
            type: activity.activity_type,
            image: activity.image,
            video: activity.video
        }));
        
        const allPaginatedMappedResults = paginatedFilteredResults.map(page => 
            page.map(activity => ({
                id: activity.id,
                title: activity.activity_name,
                description: activity.description,
                duration: activity.duration,
                type: activity.activity_type,
                image: activity.image,
                video: activity.video
            }))
        );
        
        return {
            activities: mappedActivities,
            pagination: filteredPagination,
            allPaginatedResults: allPaginatedMappedResults
        };
    };

    // Handle activity type filter change
    const handleFilterChange = async (newFilter) => {
        setFilter(newFilter);
        
        if (newFilter === 'All') {
            setIsFilteredMode(false);
            setFilteredPages([]);
            setAllPaginatedResults([]);
            fetchActivities(1, 10);
        } else {
            try {
                setLoading(true);
                const filteredData = await getFilteredPagination(newFilter);
                setActivities(filteredData.activities);
                setPagination(filteredData.pagination);
                setFilteredPages(filteredData.pagination.filteredPages);
                setAllPaginatedResults(filteredData.allPaginatedResults);
                setIsFilteredMode(true);
                setError(null);
            } catch (error) {
                console.error('Error filtering activities:', error);
                setError('Failed to filter activities. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (isFilteredMode && allPaginatedResults.length > 0) {
            const targetPageResults = allPaginatedResults[newPage - 1];
            if (targetPageResults) {
                setActivities(targetPageResults);
                setPagination(prev => ({
                    ...prev,
                    currentPage: newPage,
                    hasNext: newPage < allPaginatedResults.length,
                    hasPrev: newPage > 1
                }));
            }
        } else {
            fetchActivities(newPage, 10);
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
            setValidationErrors(prev => ({ ...prev, image: error }));
            return;
        }
        
        setValidationErrors(prev => ({ ...prev, image: null }));
        const imageUrl = URL.createObjectURL(file);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let displayWidth, displayHeight;
            
            if (aspectRatio > 1) {
                displayWidth = Math.min(img.width, 600);
                displayHeight = displayWidth / aspectRatio;
            } else {
                displayHeight = Math.min(img.height, 400);
                displayWidth = displayHeight * aspectRatio;
            }
            
            setImageDimensions({ width: displayWidth, height: displayHeight });
        };
        img.src = imageUrl;
        
        setCurrentActivity({ ...currentActivity, image: imageUrl, image_file: file });
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const error = validateVideoFile(file);
        if (error) {
            setValidationErrors(prev => ({ ...prev, video: error }));
            return;
        }
        
        setValidationErrors(prev => ({ ...prev, video: null }));
        const videoUrl = URL.createObjectURL(file);
        
        // Get video dimensions
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
            const aspectRatio = video.videoWidth / video.videoHeight;
            let displayWidth, displayHeight;
            
            if (aspectRatio > 1) {
                displayWidth = Math.min(video.videoWidth, 600);
                displayHeight = displayWidth / aspectRatio;
            } else {
                displayHeight = Math.min(video.videoHeight, 400);
                displayWidth = displayHeight * aspectRatio;
            }
            
            setVideoDimensions({ width: displayWidth, height: displayHeight });
        };
        video.src = videoUrl;
        
        setCurrentActivity({ ...currentActivity, video: videoUrl, video_file: file });
    };

    const validateForm = () => {
        const errors = {};
        const isEdit = activities.some(a => a.id === currentActivity.id);
        
        if (!currentActivity.activity_name?.toString().trim()) {
            errors.activity_name = 'Activity name is required';
        }
        
        if (!currentActivity.description?.toString().trim()) {
            errors.description = 'Description is required';
        }
        
        if (!currentActivity.duration?.toString().trim()) {
            errors.duration = 'Duration is required';
        }
        
        if (!currentActivity.activity_type?.toString().trim()) {
            errors.activity_type = 'Activity type is required';
        }
        
        // For CREATE: image and video files are required (UploadFile schema)
        // For UPDATE: image and video are optional (Optional[str] schema)
        if (!isEdit) {
            if (!currentActivity.image_file) {
                errors.image = 'Activity image is required for creating new activity';
            }
            
            if (!currentActivity.video_file) {
                errors.video = 'Activity video is required for creating new activity';
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDelete = (id) => {
        const activityToDelete = activities.find(a => a.id === id);
        setActivityToDelete(activityToDelete);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!activityToDelete) return;
        
        const activityName = activityToDelete?.title || 'Activity';
        
        try {
            await authAPI.deleteActivity(activityToDelete.id);
            
            let targetPage = Math.max(1, parseInt(pagination.currentPage) || 1);
            
            if (isFilteredMode) {
                if (activities.length === 1 && pagination.currentPage > 1) {
                    targetPage = pagination.currentPage - 1;
                }
                await handleFilterChange(filter);
            } else {
                if (activities.length === 1 && pagination.currentPage > 1) {
                    targetPage = pagination.currentPage - 1;
                }
                await fetchActivities(targetPage, 10);
            }
            
            showDeleteSuccess(activityName);
            setDeleteModalOpen(false);
            setActivityToDelete(null);
        } catch (error) {
            showDeleteError(activityName, error.message);
            setDeleteModalOpen(false);
            setActivityToDelete(null);
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setActivityToDelete(null);
    };

    const handleEditClick = (activity) => {
        const editActivity = {
            id: activity.id,
            activity_name: activity.title,
            description: activity.description || '',
            duration: activity.duration || '',
            activity_type: activity.type || '',
            image: activity.image || '',
            video: activity.video || '',
        };
        
        setCurrentActivity(editActivity);
        setIsEditModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const isEdit = activities.some(a => a.id === currentActivity.id);
            const activityName = currentActivity.activity_name || 'Activity';
            
            if (isEdit) {
                // UPDATE: Use FormData to match backend expectations
                const formData = new FormData();
                
                formData.append('activity_name', currentActivity.activity_name);
                formData.append('description', currentActivity.description);
                formData.append('duration', currentActivity.duration);
                formData.append('activity_type', currentActivity.activity_type);
                
                // For update, only append files if new ones are uploaded
                if (currentActivity.image_file) {
                    formData.append('image', currentActivity.image_file);
                }
                
                if (currentActivity.video_file) {
                    formData.append('video', currentActivity.video_file);
                }
                
                await authAPI.updateActivity(currentActivity.id, formData);
                showUpdateSuccess(activityName);
                
            } else {
                // CREATE: Use FormData with file uploads (UploadFile schema)
                const formData = new FormData();
                
                formData.append('activity_name', currentActivity.activity_name);
                formData.append('description', currentActivity.description);
                formData.append('duration', currentActivity.duration);
                formData.append('activity_type', currentActivity.activity_type);
                
                // Add files if they exist (required for create)
                if (currentActivity.image_file) {
                    formData.append('image', currentActivity.image_file);
                }
                
                if (currentActivity.video_file) {
                    formData.append('video', currentActivity.video_file);
                }
                
                await authAPI.createActivity(formData);
                showCreateSuccess(activityName);
            }
            
            const currentPage = Math.max(1, parseInt(pagination.currentPage) || 1);
            await fetchActivities(currentPage, 10);
            
            setIsEditModalOpen(false);
            setCurrentActivity(null);
            setValidationErrors({});
            
        } catch (error) {
            const activityName = currentActivity.activity_name || 'Activity';
            const isEdit = activities.some(a => a.id === currentActivity.id);
            if (isEdit) {
                showUpdateError(activityName, error.message);
            } else {
                showCreateError(activityName, error.message);
            }
            setIsEditModalOpen(false);
            setCurrentActivity(null);
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Explore Activities</h1>
                
                {/* Desktop: Activity type buttons + Add button */}
                <div className="hidden lg:flex items-center gap-2 flex-wrap">
                    {activityTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                filter === type
                                    ? "bg-primary text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setCurrentActivity({ 
                                id: Date.now(), 
                                activity_name: '', 
                                description: '',
                                duration: '', 
                                activity_type: '',
                                image: '',
                                video: ''
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="ml-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
                    >
                        + Add Activity
                    </button>
                </div>

                {/* Mobile: Dropdown + Add button */}
                <div className="lg:hidden flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full sm:w-auto flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span>{filter}</span>
                            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                                {activityTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            handleFilterChange(type);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full px-4 py-2 text-left text-sm font-medium transition-colors first:rounded-t-lg last:rounded-b-lg",
                                            filter === type
                                                ? "bg-primary text-white"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => {
                            setCurrentActivity({ 
                                id: Date.now(), 
                                activity_name: '', 
                                description: '',
                                duration: '', 
                                activity_type: '',
                                image: '',
                                video: ''
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
                    >
                        + Add Activity
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading activities...</span>
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
                        onClick={fetchActivities}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Activities Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 gap-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="w-full sm:w-48 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                {activity.image ? (
                                    <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                                ) : activity.video ? (
                                    <video src={activity.video} className="w-full h-full object-cover" controls />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Compass className="w-10 h-10 opacity-50" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activity.title}</h3>
                                <div className="flex justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <span>{activity.type}</span>
                                    <span>•</span>
                                    <span>{activity.duration}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(activity)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(activity.id)}
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
            {!loading && !error && activities.length === 0 && (
                <div className="text-center py-12">
                    <Compass className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'All' ? 'Start by adding your first activity.' : `No activities found in ${filter} type.`}
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
                                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} activities
                                </span>
                            ) : (
                                <span>No activities found</span>
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
            {isEditModalOpen && currentActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 pr-8">
                            {activities.find(a => a.id === currentActivity.id) ? 'Edit Activity' : 'Add Activity'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                            {/* Activity Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Image</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                                         style={{ 
                                             width: imageDimensions.width ? `${Math.min(imageDimensions.width, window.innerWidth > 640 ? 600 : window.innerWidth - 32)}px` : '100%',
                                             height: imageDimensions.height ? `${imageDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        {currentActivity.image ? (
                                            <img 
                                                src={currentActivity.image} 
                                                alt="Activity preview" 
                                                className="w-full h-full object-contain" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ minHeight: '160px' }}>
                                                <div className="text-center">
                                                    <Compass className="w-8 h-8 opacity-50 mx-auto mb-2" />
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
                                        {validationErrors.image && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors.image}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Video Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Video</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                                         style={{ 
                                             width: videoDimensions.width ? `${Math.min(videoDimensions.width, window.innerWidth > 640 ? 600 : window.innerWidth - 32)}px` : '100%',
                                             height: videoDimensions.height ? `${videoDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        {currentActivity.video ? (
                                            <video 
                                                src={currentActivity.video} 
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
                                        {validationErrors.video && (
                                            <p className="mt-1 text-xs text-red-500">{validationErrors.video}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={currentActivity.activity_name}
                                    onChange={e => setCurrentActivity({ ...currentActivity, activity_name: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                        validationErrors.activity_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    required
                                />
                                {validationErrors.activity_name && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.activity_name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={currentActivity.description}
                                    onChange={e => setCurrentActivity({ ...currentActivity, description: e.target.value })}
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

                            {/* Activity Type and Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
                                    <select
                                        value={currentActivity.activity_type || ''}
                                        onChange={e => setCurrentActivity({ ...currentActivity, activity_type: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="" disabled>Select Activity Type</option>
                                        {activityTypes.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {validationErrors.activity_type && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.activity_type}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</label>
                                    <input
                                        type="text"
                                        value={currentActivity.duration}
                                        onChange={e => setCurrentActivity({ ...currentActivity, duration: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                            validationErrors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        placeholder="e.g., 30 minutes, 1 hour"
                                        required
                                    />
                                    {validationErrors.duration && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.duration}</p>
                                    )}
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
                                    {isSubmitting ? 'Saving...' : 'Save Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalOpen && activityToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/10 dark:border-gray-700/10 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300 scale-100 animate-slide-up">
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100/40 dark:bg-red-900/30 backdrop-blur-sm mb-6 animate-pulse">
                                <svg className="h-8 w-8 text-red-600 dark:text-red-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                Delete Activity
                            </h3>
                            
                            {/* Activity Name */}
                            <div className="bg-gray-50/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg px-4 py-3 mb-4 border border-gray-200/20 dark:border-gray-600/20">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Activity to delete:</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {activityToDelete.title || 'Unknown Activity'}
                                </p>
                            </div>
                            
                            {/* Warning Message */}
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                                Are you sure you want to delete this activity? This action cannot be undone and all associated data will be permanently removed.
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg hover:bg-gray-200/40 dark:hover:bg-gray-600/40 transition-all duration-200 transform hover:scale-105 border border-gray-200/20 dark:border-gray-600/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600/40 backdrop-blur-sm rounded-lg hover:bg-red-700/50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 border border-red-500/20"
                                >
                                    Delete Activity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExploreActivities;
