import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Play, Clock, Flame, Compass, ChevronDown, X, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const ExploreActivities = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [activities, setActivities] = useState([]);
    const [allActivities, setAllActivities] = useState([]); // Cache for all activities
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter & Search State
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        activityType: 'All'
    });
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

    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsTypeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch all activities and cache them
    const fetchAllActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Clear cache first to ensure fresh data
            setAllActivities([]);
            setActivities([]);
            
            // Fetch all activities with pagination to get everything
            let allFetchedActivities = [];
            let currentPage = 1;
            let hasMore = true;
            
            while (hasMore) {
                try {
                    const response = await authAPI.getActivities(currentPage, 50); // Use reasonable limit
                    
                    const activitiesData = response.data || [];
                    
                    if (activitiesData.length === 0) {
                        hasMore = false;
                        break;
                    }
                    
                    const mappedActivities = activitiesData.map(activity => ({
                        id: activity.id,
                        title: activity.activity_name,
                        description: activity.description,
                        duration: activity.duration,
                        type: activity.activity_type,
                        image: activity.image,
                        video: activity.video
                    }));
                    
                    allFetchedActivities.push(...mappedActivities);
                    
                    // Check if there are more pages
                    const pagination = response.pagination;
                    if (pagination) {
                        hasMore = pagination.has_next && pagination.current_page < pagination.total_pages;
                        if (hasMore) {
                            currentPage = pagination.current_page + 1;
                        }
                    } else {
                        hasMore = false;
                    }
                } catch (error) {
                    console.error(`Error fetching page ${currentPage}:`, error);
                    hasMore = false;
                }
            }
            
            // Cache all activities
            setAllActivities(allFetchedActivities);
            
            // Set initial display activities
            setActivities(allFetchedActivities);
            
            // Update pagination
            const totalItems = allFetchedActivities.length;
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
            setError('Failed to load activities. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load activities on component mount
    useEffect(() => {
        fetchAllActivities();
    }, []); // Only run once on mount

    // Re-apply filters when allActivities are loaded (for initial display)
    useEffect(() => {
        if (allActivities.length > 0) {
            applyFiltersAndPagination(searchTerm, filters, pagination.currentPage);
        }
    }, [allActivities]); // Re-run when cache is populated

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

    const activityTypes = [
        { label: 'All', value: 'All' },
        { label: 'Meditation', value: 'meditation' },
        { label: 'Yoga', value: 'yoga' },
        { label: 'Cycling', value: 'cycling' },
        { label: 'Treadmill', value: 'treadmill' },
        { label: 'Outdoor', value: 'outdoor' },
        { label: 'Mindful_Cooldown', value: 'mindful_cooldown' }
    ];

    // Client-side filtering and pagination
    const applyFiltersAndPagination = (searchTerm = '', filters = null, page = 1) => {
        let filteredActivities = [...allActivities];
        
        // Apply search filter
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filteredActivities = filteredActivities.filter(activity => {
                return (
                    activity.title?.toLowerCase().includes(searchLower) ||
                    activity.description?.toLowerCase().includes(searchLower) ||
                    activity.type?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        // Apply activity type filter (case-insensitive like Users page)
        if (filters && filters.activityType && filters.activityType !== 'All') {
            filteredActivities = filteredActivities.filter(activity => {
                const activityType = activity.type || '';
                const filterType = filters.activityType.toLowerCase();
                return activityType.toLowerCase() === filterType;
            });
        }
        
        // Apply pagination
        const totalItems = filteredActivities.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        const startIndex = (page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
        
        // Update display activities and pagination
        setActivities(paginatedActivities);
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
        setFilters({ activityType: 'All' });
        setIsDropdownOpen(false);
        // Apply cleared filters immediately using cached data - this will show all activities from cache
        applyFiltersAndPagination('', { activityType: 'All' }, 1);
    };

    // Handle filter toggle - close and clear filters when toggling off
    const handleFilterToggle = () => {
        if (showFilters) {
            // If filters are currently shown, close panel and clear all filters
            setShowFilters(false);
            handleClearFilters(); // This will show all activities from cache
        } else {
            // If filters are hidden, show the panel
            setShowFilters(true);
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        applyFiltersAndPagination(searchTerm, filters, newPage);
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
            
            // Clear cache and refresh activities list
            await fetchAllActivities();
            
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
        setImageDimensions({ width: 0, height: 0 });
        setVideoDimensions({ width: 0, height: 0 });
        setIsEditModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        console.log('🚀 [EXPLORE ACTIVITIES] Starting handleSave process');
        console.log('🚀 [EXPLORE ACTIVITIES] Current activity data:', currentActivity);
        
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
            
            console.log('✅ [EXPLORE ACTIVITIES] Activity saved successfully');
            
            // Clear cache and refresh activities list
            await fetchAllActivities();
            
            setIsEditModalOpen(false);
            setCurrentActivity(null);
            setValidationErrors({});
            
        } catch (error) {
            console.error('❌ [EXPLORE ACTIVITIES] Error saving activity:', error);
            const activityName = currentActivity.activity_name || 'Activity';
            const isEdit = activities.some(a => a.id === currentActivity.id);
            if (isEdit) {
                showUpdateError(activityName, error.message);
            } else {
                showCreateError(activityName, error.message);
            }
            // Do NOT close modal on error so user can fix and retry
            // setIsEditModalOpen(false);
            // setCurrentActivity(null);
            // setValidationErrors({});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative z-10">
            {/* Custom Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight animate-in fade-in slide-in-from-left-2">
                    Explore <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Activities</span>
                </h1>
                
                {/* Search Bar and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-initial">
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full lg:w-64 pl-10 pr-4 py-2 border border-white/20 dark:border-white/10 rounded-xl bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 text-sm transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFilterToggle}
                            className={`p-2 border rounded-xl transition-all duration-200 backdrop-blur-md ${showFilters ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20' : 'bg-white/45 dark:bg-white/5 border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400'}`}
                        >
                            <Filter className="h-5 w-5" />
                        </button>
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
                                setImageDimensions({ width: 0, height: 0 });
                                setVideoDimensions({ width: 0, height: 0 });
                                setIsEditModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm whitespace-nowrap"
                        >
                            + Add Activity
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="flex flex-col gap-3 sm:gap-4 bg-white/45 dark:bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-lg border border-white/20 dark:border-white/10 animate-in fade-in slide-in-from-top-2 w-full max-w-full overflow-visible">
                    <div className="w-full max-w-full dropdown-container relative !overflow-visible">
                        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Activity Type</label>
                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDropdownOpen(!isDropdownOpen);
                                }}
                                className="w-full flex items-center justify-between text-left text-xs sm:text-sm p-2 sm:p-2.5 pr-8 sm:pr-10 rounded-lg border border-white/20 dark:border-white/10 bg-white/45 dark:bg-white/5 text-gray-900 dark:text-white backdrop-blur-md focus:ring-2 focus:ring-amber-500/30 transition-all outline-none truncate max-w-full"
                            >
                                <span className="truncate">
                                    {filters.activityType === 'All' 
                                        ? 'All Activity Types' 
                                        : (activityTypes.find(t => t.value === filters.activityType)?.label || filters.activityType)
                                    }
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-white/90 dark:bg-slate-950/80 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-lg shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleFilterChange({ ...filters, activityType: 'All' });
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors ${filters.activityType === 'All' ? 'bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400' : ''}`}
                                    >
                                        All Activity Types
                                    </button>
                                    {activityTypes.filter(type => type.value !== 'All').map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                handleFilterChange({ ...filters, activityType: type.value });
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors ${filters.activityType === type.value ? 'bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400' : ''}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleClearFilters}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all whitespace-nowrap active:scale-95"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}


            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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
                        onClick={fetchAllActivities}
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
                        <div key={activity.id} className="group bg-white/45 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 dark:border-white/10 p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:border-amber-500/30 relative overflow-hidden">
                            {/* Hover accent top bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                            
                            {/* Mobile: Stack layout, Desktop: Side-by-side */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10">
                                {/* Image/Video Section */}
                                <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl overflow-hidden flex-shrink-0 relative group-hover:shadow-inner transition-all duration-300 border border-white/10 dark:border-white/5">
                                    <div className="w-full h-full relative">
                                        {activity.image ? (
                                            <img src={activity.image} alt={activity.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : activity.video ? (
                                            <video src={activity.video} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Compass className="w-10 h-10 opacity-30 animate-pulse" />
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
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wide uppercase">
                                                {activityTypes.find(t => t.value === (activity.type?.toLowerCase() || ''))?.label || activity.type}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3 mr-1 text-amber-500" />
                                                {activity.duration}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-amber-500 transition-colors duration-300">{activity.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                            {activity.description}
                                        </p>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            onClick={() => handleEditClick(activity)}
                                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/20 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 transition-all duration-300"
                                        >
                                            Edit Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="p-2 text-red-500 bg-red-50/50 dark:bg-red-900/20 border border-red-200/20 dark:border-red-800/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
                                            title="Delete Activity"
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
            {!loading && !error && activities.length === 0 && (
                <div className="text-center py-12">
                    <Compass className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {filters.activityType === 'All' ? 'Start by adding your first activity.' : `No activities found in ${filters.activityType} type.`}
                    </p>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.totalItems > 0 && (
                <div className="border-t border-white/20 dark:border-white/10 px-6 py-4">
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
                                className="px-3 py-1 text-sm border border-white/20 dark:border-white/10 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
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
                                className="px-3 py-1 text-sm border border-white/20 dark:border-white/10 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white/45 dark:bg-slate-950/35 backdrop-blur-md rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-4 sm:p-6 shadow-2xl border border-white/20 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Decorative top bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                        
                        <button
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setValidationErrors({});
                            }}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors rounded-lg z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6 pr-8">
                            {activities.find(a => a.id === currentActivity.id) ? 'Edit' : 'Add'} <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Activity</span>
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                            {/* Activity Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-amber-600 dark:text-amber-400 font-semibold mb-2">Activity Image</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-white/25 dark:border-white/10 bg-white/25 dark:bg-slate-900/40 backdrop-blur-sm w-full max-w-full"
                                         style={{ 
                                             height: imageDimensions.height ? `${imageDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        <div className="w-full h-full">
                                            {currentActivity.image ? (
                                                <img 
                                                    src={currentActivity.image} 
                                                    alt="Activity preview" 
                                                    className="w-full h-full object-contain" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[160px]">
                                                    <div className="text-center">
                                                        <ImageIcon className="w-8 h-8 opacity-50 mx-auto mb-2" />
                                                        <p className="text-xs">No image selected</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/jpg,image/jpeg,image/png"
                                        onChange={handleImageUpload}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-amber-500 file:to-orange-600 file:text-slate-950 hover:file:from-amber-400 hover:file:to-orange-500 file:cursor-pointer cursor-pointer"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, JPEG, PNG up to 10MB</p>
                                    {validationErrors.image && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.image}</p>
                                    )}
                                </div>
                            </div>

                            {/* Activity Video Upload */}
                            <div>
                                <label className="block text-sm font-medium text-amber-600 dark:text-amber-400 font-semibold mb-2">Activity Video</label>
                                <div className="mt-1 flex flex-col gap-4">
                                    <div className="relative mx-auto rounded-lg overflow-hidden border border-white/25 dark:border-white/10 bg-white/25 dark:bg-slate-900/40 backdrop-blur-sm w-full max-w-full"
                                         style={{ 
                                             height: videoDimensions.height ? `${videoDimensions.height}px` : '160px',
                                             maxWidth: '100%'
                                         }}>
                                        <div className="w-full h-full">
                                            {currentActivity.video ? (
                                                <video 
                                                    src={currentActivity.video} 
                                                    className="w-full h-full object-contain" 
                                                    controls
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[160px]">
                                                    <div className="text-center">
                                                        <Play className="w-8 h-8 opacity-50 mx-auto mb-2" />
                                                        <p className="text-xs">No video selected</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="video/mp4,video/avi,video/mov,video/mkv"
                                        onChange={handleVideoUpload}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-amber-500 file:to-orange-600 file:text-slate-950 hover:file:from-amber-400 hover:file:to-orange-500 file:cursor-pointer cursor-pointer"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">MP4, AVI, MOV, MKV up to 35MB</p>
                                    {validationErrors.video && (
                                        <p className="mt-1 text-xs text-red-500">{validationErrors.video}</p>
                                    )}
                                </div>
                            </div>

                            {/* Activity Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={currentActivity.activity_name}
                                    onChange={e => setCurrentActivity({ ...currentActivity, activity_name: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border bg-white/45 dark:bg-white/5 backdrop-blur-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all ${
                                        validationErrors.activity_name ? 'border-red-500/60 focus:ring-red-500/30' : 'border-white/20 dark:border-white/10'
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
                                    className={`w-full px-3 py-2 rounded-lg border bg-white/45 dark:bg-white/5 backdrop-blur-md text-gray-900 dark:text-white resize-none ${
                                        validationErrors.description ? 'border-red-500/60 focus:ring-red-500/30' : 'border-white/20 dark:border-white/10'
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
                                        className="w-full px-3 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/45 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-slate-900 text-white">Select Activity Type</option>
                                        {activityTypes.filter(t => t.value !== 'All').map(t => <option key={t.value} value={t.value} className="bg-slate-900 text-white">{t.label}</option>)}
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
                                        className={`w-full px-3 py-2 rounded-lg border bg-white/45 dark:bg-white/5 backdrop-blur-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all ${
                                            validationErrors.duration ? 'border-red-500/60 focus:ring-red-500/30' : 'border-white/20 dark:border-white/10'
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
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-5 py-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-lg shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 transition-all"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white/45 dark:bg-slate-950/35 backdrop-blur-md rounded-xl max-w-md w-full p-6 shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Decorative top bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                        
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 dark:bg-red-900/30 border border-red-500/20 mb-4">
                                <svg className="h-6 w-6 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                                Delete <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Activity</span>
                            </h3>
                            
                            {/* Activity Name */}
                            <div className="bg-white/20 dark:bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-3 mb-4">
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Activity to delete:</p>
                                <p className="text-base font-bold text-gray-950 dark:text-white truncate">
                                    {activityToDelete.title || 'Unknown Activity'}
                                </p>
                            </div>
                            
                            {/* Warning Message */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                Are you sure you want to delete this activity? This action cannot be undone and all associated data will be permanently removed.
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md shadow-red-500/20"
                                >
                                    Delete
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
