import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Filter, User, MoreVertical, X, ChevronDown } from 'lucide-react';
import { authAPI } from '../services/api';
import LazyImage from './LazyImage';

const GenderBadge = ({ gender }) => {
    if (!gender) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Not Set
            </span>
        );
    }
    
    let colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    if (gender.toLowerCase() === 'female') colorClass = "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
    if (gender.toLowerCase() === 'male') colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {gender}
        </span>
    );
};

const BMIBadge = ({ bmi }) => {
    if (!bmi) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                N/A
            </span>
        );
    }
    
    let colorClass = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    if (bmi < 18.5) colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    if (bmi >= 25) colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
    if (bmi >= 30) colorClass = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {bmi}
        </span>
    );
};

const ActivityLevelBadge = ({ activityLevel }) => {
    if (!activityLevel) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Not Set
            </span>
        );
    }
    
    let colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    if (activityLevel.toLowerCase() === 'beginner') colorClass = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    if (activityLevel.toLowerCase() === 'intermediate') colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    if (activityLevel.toLowerCase() === 'advanced') colorClass = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {activityLevel}
        </span>
    );
};

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // Cache for all users
    const [loading, setLoading] = useState(true);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        pageSize: 10
    });
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 'auto', bottom: 'auto' });
    const [currentUser, setCurrentUser] = useState(null);
    const [createUser, setCreateUser] = useState({
        username: '',
        email: '',
        password: ''
    });

    // Fetch all users and cache them
    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Clear cache first to ensure fresh data
            setAllUsers([]);
            setUsers([]);
            
            // Fetch all users (use a large limit to get everything)
            const data = await authAPI.getUsers(1, 1000); // Fetch up to 1000 users
            
            // Cache all users
            setAllUsers(data.users || []);
            
            // Set initial display users
            setUsers(data.users || []);
            
            // Update pagination based on total users
            const totalUsers = data.users?.length || 0;
            const totalPages = Math.ceil(totalUsers / pagination.pageSize);
            
            setPagination({
                currentPage: 1,
                totalPages: totalPages,
                totalItems: totalUsers,
                hasNext: totalPages > 1,
                hasPrev: false,
                pageSize: pagination.pageSize
            });
            
            // Fetch profile images in background
            const fetchProfileImages = async () => {
                const usersWithProfiles = await Promise.all(
                    (data.users || []).map(async (user) => {
                        try {
                            const userDetails = await authAPI.getUserById(user.id);
                            
                            let profileImage = userDetails.user?.profile_image || userDetails.profile_image || user.profile_image;
                            
                            // Fix Cloudinary URL typo if present
                            if (profileImage && profileImage.includes('fitness-/users')) {
                                profileImage = profileImage.replace('fitness-/users', 'fitness-app/users');
                            }
                            
                            return {
                                ...user,
                                profile_image: profileImage
                            };
                        } catch (error) {
                            console.warn(`Failed to fetch details for user ${user.id}:`, error);
                            return user;
                        }
                    })
                );
                
                // Update both cache and display users with profile images
                setAllUsers(prevUsers => {
                    const updatedUsers = [...prevUsers];
                    usersWithProfiles.forEach(userWithProfile => {
                        const index = updatedUsers.findIndex(u => u.id === userWithProfile.id);
                        if (index !== -1) {
                            updatedUsers[index] = userWithProfile;
                        }
                    });
                    setUsers(updatedUsers.slice(0, pagination.pageSize)); // Update display users too
                    return updatedUsers;
                });
            };
            
            fetchProfileImages();
            
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Load users on component mount
    useEffect(() => {
        fetchAllUsers();
    }, []); // Only run once on mount

    // Re-apply filters when allUsers are loaded (for initial display)
    useEffect(() => {
        if (allUsers.length > 0) {
            applyFiltersAndPagination(searchTerm, filters, pagination.currentPage);
        }
    }, [allUsers]); // Re-run when cache is populated

    // Client-side filtering and pagination
    const applyFiltersAndPagination = (searchTerm = '', filters = null, page = 1) => {
        
        let filteredUsers = [...allUsers];
        
        // Apply search filter
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                return (
                    user.username?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        // Apply other filters
        if (filters) {
            if (filters.gender && filters.gender !== 'All') {
                filteredUsers = filteredUsers.filter(user => user.gender === filters.gender);
            }
            if (filters.activityLevel && filters.activityLevel !== 'All') {
                filteredUsers = filteredUsers.filter(user => {
                    // Handle both field names and case-insensitive comparison
                    const userActivity = user.activity_level || user.activityLevel || '';
                    const filterActivity = filters.activityLevel.toLowerCase();
                    const matches = userActivity.toLowerCase() === filterActivity;
                    return matches;
                });
            }
        }
        
        // Apply pagination
        const totalItems = filteredUsers.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        const startIndex = (page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        // Update display users and pagination
        setUsers(paginatedUsers);
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
        setFilters({ gender: 'All', activityLevel: 'All' });
        // Apply cleared filters immediately using cached data - this will show all users
        applyFiltersAndPagination('', { gender: 'All', activityLevel: 'All' }, 1);
    };

    // Handle filter toggle - close and clear filters when toggling off
    const handleFilterToggle = () => {
        if (showFilters) {
            // If filters are currently shown, close panel and clear all filters
            console.log('Closing filter panel and clearing all filters');
            setShowFilters(false);
            handleClearFilters(); // This will show all users from cache
        } else {
            // If filters are hidden, show the panel
            console.log('Opening filter panel');
            setShowFilters(true);
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        console.log('Changing to page:', newPage);
        applyFiltersAndPagination(searchTerm, filters, newPage);
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

    // Calculate dropdown position based on available space
    const calculateDropdownPosition = (buttonElement) => {
        if (!buttonElement) return { top: 'auto', bottom: 'auto' };
        
        const rect = buttonElement.getBoundingClientRect();
        const dropdownHeight = 120; // Approximate height of dropdown
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        console.log('Dropdown positioning - Rect:', rect, 'Space below:', spaceBelow, 'Space above:', spaceAbove);
        
        // If there's not enough space below but enough space above, open upwards
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            return { top: 'auto', bottom: '8px' }; // Open upwards
        } else {
            return { top: '100%', bottom: 'auto' }; // Open downwards (default)
        }
    };

    // Handle dropdown toggle with position calculation
    const handleDropdownToggle = (userId, event) => {
        const buttonElement = event.currentTarget;
        const newPosition = calculateDropdownPosition(buttonElement);
        
        if (isDropdownOpen === userId) {
            setIsDropdownOpen(null);
            setDropdownPosition({ top: 'auto', bottom: 'auto' });
        } else {
            setIsDropdownOpen(userId);
            setDropdownPosition(newPosition);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown-menu')) {
                setIsDropdownOpen(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    // Filter & Search State
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        gender: 'All',
        activityLevel: 'All'
    });

    const handleEdit = (user) => {
        // Preserve original profile image URL and add tracking flag
        console.log('Editing user:', user);
        console.log('Profile image URL:', user.profile_image);
        
        // Handle both File objects and string URLs
        let fixedProfileImage = user.profile_image;
        let originalProfileImage = user.profile_image;
        
        // If profile_image is a File object, we need to get the URL from the updated users array
        if (user.profile_image instanceof File) {
            // Find the user in the users array to get the correct URL
            const updatedUser = users.find(u => u.id === user.id);
            console.log('Looking for user in array:', updatedUser);
            console.log('Current users array:', users);
            
            if (updatedUser && updatedUser.profile_image && typeof updatedUser.profile_image === 'string') {
                fixedProfileImage = updatedUser.profile_image;
                originalProfileImage = updatedUser.profile_image;
                console.log('Using URL from users array:', fixedProfileImage);
            } else {
                // Fallback to empty string if no URL found
                fixedProfileImage = '';
                originalProfileImage = '';
                console.log('No URL found in users array, using empty string');
            }
        } else if (user.profile_image && typeof user.profile_image === 'string') {
            // Fix Cloudinary URL if it has the typo
            if (user.profile_image.includes('fitness-/users')) {
                fixedProfileImage = user.profile_image.replace('fitness-/users', 'fitness-app/users');
                console.log('Fixed profile image URL:', fixedProfileImage);
            }
        }
        
        setCurrentUser({
            ...user,
            original_profile_image: originalProfileImage,
            profile_image: fixedProfileImage, // Use fixed URL
            profile_image_changed: false,
            profile_image_file: null
        });
        setIsEditModalOpen(true);
    };

    const handleHistory = async (user) => {
        try {
            setProfileLoading(true);
            // Fetch full user details from API
            const userDetails = await authAPI.getUserById(user.id);
            setCurrentUser(userDetails.user || userDetails); // Handle different response formats
            setIsHistoryModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            // Fallback to using the user data from the table
            setCurrentUser(user);
            setIsHistoryModalOpen(true);
        } finally {
            setProfileLoading(false);
        }
    };

    // Calculate BMI based on weight (kg) and height (cm)
    const calculateBMI = (weight, height) => {
        if (!weight || !height) return null;
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // Calculate BMI if weight and height are provided
            const calculatedBMI = calculateBMI(
                currentUser.weight ? parseFloat(currentUser.weight) : null,
                currentUser.height ? parseFloat(currentUser.height) : null
            );
            
            // Handle file upload if present
            let profileImageUrl = currentUser.original_profile_image; // Default to original
            let profileImageFile = null;
            
            if (currentUser.profile_image_file && currentUser.profile_image_changed) {
                // New file selected - use the actual file object
                profileImageFile = currentUser.profile_image_file;
            } else if (!currentUser.profile_image_changed) {
                // No new file selected - keep original URL as string
                profileImageUrl = currentUser.original_profile_image;
            }
            
            // Prepare update data matching API schema (UserUpdate)
            const updateData = {};
            
            // Only include fields that have values
            if (currentUser.email) updateData.email = currentUser.email;
            if (currentUser.gender) updateData.gender = currentUser.gender;
            if (currentUser.age) updateData.age = parseInt(currentUser.age);
            if (currentUser.weight) updateData.weight = parseFloat(currentUser.weight);
            if (currentUser.height) updateData.height = parseFloat(currentUser.height);
            if (currentUser.weight_goal) updateData.weight_goal = parseFloat(currentUser.weight_goal);
            if (currentUser.activity_level) updateData.activity_level = currentUser.activity_level;
            if (calculatedBMI) updateData.bmi = parseFloat(calculatedBMI);
            
            // Handle profile image separately for file upload
            if (profileImageFile) {
                updateData.profile_image = profileImageFile; // Send actual file
            } else if (profileImageUrl) {
                updateData.profile_image = profileImageUrl; // Send URL string
            }
            
            console.log('Sending update data:', updateData);
            console.log('Current user data:', currentUser);
            console.log('User ID:', currentUser.id);
            
            // Ensure we have the required user ID
            if (!currentUser.id) {
                throw new Error('User ID is required for update');
            }
            
            const updateResponse = await authAPI.updateUser(currentUser.id, updateData);
            
            console.log('Update response from backend:', updateResponse);
            
            // Close modal and clear current user
            setIsEditModalOpen(false);
            setCurrentUser(null);
            
            // Clear cache and refresh users list from API
            await fetchAllUsers();
            
            alert('User updated successfully');
        } catch (error) {
            console.error('Failed to update user:', error);
            alert(error.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await authAPI.createUser(createUser);
            
            // Reset form and close modal
            setCreateUser({ username: '', email: '', password: '' });
            setIsCreateModalOpen(false);
            
            // Clear cache and refresh users list from API
            await fetchAllUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            try {
                setLoading(true);
                await authAPI.deleteUser(user.id);
                
                // Close dropdown
                setIsDropdownOpen(null);
                
                // Clear cache and refresh users list from API
                await fetchAllUsers();
                
                alert('User deleted successfully');
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert(error.message || 'Failed to delete user');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => fetchUsers()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <div className="flex w-full sm:w-auto gap-4">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => handleSearchChange('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        title="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleFilterToggle}
                                className={`p-2 border rounded-lg transition-colors ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <Filter className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                            >
                                Add User
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                                <select
                                    value={filters.gender}
                                    onChange={(e) => handleFilterChange({ ...filters, gender: e.target.value })}
                                    className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Activity Level</label>
                                <select
                                    value={filters.activityLevel}
                                    onChange={(e) => handleFilterChange({ ...filters, activityLevel: e.target.value })}
                                    className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="All">All Levels</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            
                            {/* Clear Filters Button */}
                            <div className="sm:col-span-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">BMI</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Level</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-gray-500">
                                                {searchTerm || (filters.gender !== 'All' || filters.activityLevel !== 'All') 
                                                    ? 'No users found matching your search or filters.' 
                                                    : 'No users found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                                            {user.profile_image ? (
                                                                <img 
                                                                    src={user.profile_image} 
                                                                    alt={user.username} 
                                                                    className="w-full h-full rounded-full object-cover"
                                                                    onLoad={() => console.log('Basic img loaded:', user.profile_image)}
                                                                    onError={(e) => console.log('Basic img failed:', user.profile_image)}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                                                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{user.username || 'N/A'}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <GenderBadge gender={user.gender} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <BMIBadge bmi={user.bmi} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ActivityLevelBadge activityLevel={user.activity_level} />
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleHistory(user)}
                                                            disabled={profileLoading}
                                                            className="p-1 text-gray-400 hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-50"
                                                            title="View Profile"
                                                        >
                                                            {profileLoading ? (
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                                            ) : (
                                                                <User className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                        <div className="relative dropdown-menu">
                                                            <button
                                                                onClick={(e) => handleDropdownToggle(user.id, e)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                            >
                                                                <MoreVertical className="h-5 w-5" />
                                                            </button>
                                                            
                                                            {isDropdownOpen === user.id && (
                                                                <div 
                                                                    className="absolute right-0 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                                                                    style={{
                                                                        top: dropdownPosition.top,
                                                                        bottom: dropdownPosition.bottom
                                                                    }}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            handleEdit(user);
                                                                            setIsDropdownOpen(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteUser(user);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {pagination.totalItems > 0 ? (
                                        <span>
                                            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} users
                                        </span>
                                    ) : (
                                        <span>No users found</span>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handlePrevPage}
                                        disabled={!pagination.hasPrev || paginationLoading}
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
                                        disabled={!pagination.hasNext || paginationLoading}
                                        className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        Next
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Loading indicator for pagination */}
                            {paginationLoading && (
                                <div className="flex justify-center items-center py-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* User Details Modal */}
            {isHistoryModalOpen && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.username}'s Details</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">User Information</p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Email</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Gender</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.gender || 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Age</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.age || 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">BMI</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.bmi || 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Weight</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.weight ? `${currentUser.weight} kg` : 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Height</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.height ? `${currentUser.height} cm` : 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Weight Goal</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.weight_goal ? `${currentUser.weight_goal} kg` : 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Activity Level</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.activity_level || 'Not Set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Verified</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.is_verified ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Blocked</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{currentUser.is_blocked ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Joined Date</label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit User</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={currentUser.email || ''}
                                        readOnly
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                                        placeholder="Email address"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be edited</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                    <select
                                        value={currentUser.gender || ''}
                                        onChange={e => setCurrentUser({ ...currentUser, gender: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={currentUser.age || ''}
                                        onChange={e => setCurrentUser({ ...currentUser, age: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Enter age"
                                        min="1"
                                        max="120"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={currentUser.weight || ''}
                                            onChange={e => {
                                                const newWeight = e.target.value ? parseFloat(e.target.value) : undefined;
                                                const updatedUser = { ...currentUser, weight: newWeight };
                                                setCurrentUser(updatedUser);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            placeholder="Weight"
                                            step="0.1"
                                            min="1"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            value={currentUser.height || ''}
                                            onChange={e => {
                                                const newHeight = e.target.value ? parseFloat(e.target.value) : undefined;
                                                const updatedUser = { ...currentUser, height: newHeight };
                                                setCurrentUser(updatedUser);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            placeholder="Height"
                                            step="0.1"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BMI</label>
                                    <input
                                        type="text"
                                        value={calculateBMI(currentUser.weight, currentUser.height) || ''}
                                        readOnly
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                                        placeholder="Calculated automatically"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculated automatically from weight and height</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight Goal (kg)</label>
                                    <input
                                        type="number"
                                        value={currentUser.weight_goal || ''}
                                        onChange={e => setCurrentUser({ ...currentUser, weight_goal: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Weight goal"
                                        step="0.1"
                                        min="1"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activity Level</label>
                                    <select
                                        value={currentUser.activity_level || ''}
                                        onChange={e => setCurrentUser({ ...currentUser, activity_level: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    >
                                        <option value="">Select Activity Level</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                // Create preview URL for new file
                                                const previewUrl = URL.createObjectURL(file);
                                                setCurrentUser({ 
                                                    ...currentUser, 
                                                    profile_image: previewUrl,
                                                    profile_image_file: file,
                                                    profile_image_changed: true
                                                });
                                            }
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-700"
                                    />
                                    
                                    {/* Show existing or preview image */}
                                    {currentUser.profile_image ? (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {currentUser.profile_image_changed ? 'New image preview:' : 'Current profile image:'}
                                            </p>
                                            <img 
                                                src={currentUser.profile_image} 
                                                alt="Profile preview" 
                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                                onLoad={() => console.log('Image loaded successfully:', currentUser.profile_image)}
                                                onError={(e) => {
                                                    console.log('Image failed to load:', currentUser.profile_image);
                                                    // If image fails to load, show placeholder
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                                crossOrigin="anonymous"
                                            />
                                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center" style={{display: 'none'}}>
                                                <User className="w-8 h-8 text-gray-400" />
                                            </div>
                                            {currentUser.profile_image_changed && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Click Save to upload new image</p>
                                            )}
                                            
                                            {/* Debug info */}
                                            <p className="text-xs text-gray-400 mt-2 truncate" title={currentUser.profile_image}>
                                                URL: {currentUser.profile_image}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No profile image</p>
                                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                <User className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Debug: profile_image = {String(currentUser.profile_image)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={createUser.username}
                                    onChange={e => setCreateUser({ ...createUser, username: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={createUser.email}
                                    onChange={e => setCreateUser({ ...createUser, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={createUser.password}
                                    onChange={e => setCreateUser({ ...createUser, password: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
