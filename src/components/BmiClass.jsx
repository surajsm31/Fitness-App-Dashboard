import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Filter, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const BmiClass = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const filterRef = useRef(null);
    const [bmiClasses, setBmiClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterRange, setFilterRange] = useState('all');
    const [pagination, setPagination] = useState({
        current_page: 1,
        page_size: 10,
        total_items: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        next_skip: null,
        prev_skip: null
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        category_name: '',
        min_bmi: '',
        max_bmi: ''
    });

    // Fetch BMI classifications from API
    useEffect(() => {
        fetchBmiClassifications();
    }, [currentPage]);

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };

        if (showFilter) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilter]);

    const fetchBmiClassifications = async () => {
        try {
            setLoading(true);
            setError('');
            const skip = (currentPage - 1) * pagination.page_size;
            const response = await authAPI.getBmiClassifications(skip, pagination.page_size);
            
            // Handle the exact API response format
            let classifications = [];
            let paginationData = pagination;
            
            if (response && typeof response === 'object') {
                // Extract BMI classifications array
                if (response.bmi_classifications && Array.isArray(response.bmi_classifications)) {
                    classifications = response.bmi_classifications;
                }
                
                // Extract pagination data
                if (response.pagination) {
                    paginationData = {
                        ...pagination,
                        ...response.pagination
                    };
                    setPagination(paginationData);
                }
            }
            
            // Map API response to component format
            const mappedClasses = classifications.map(bmi => ({
                id: bmi.id,
                name: bmi.category_name || '',
                minBmi: bmi.min_bmi !== null ? bmi.min_bmi : 0,
                maxBmi: bmi.max_bmi !== null ? bmi.max_bmi : 999,
                classification: bmi.category_name || '', // Use category_name as classification
                color: getDefaultColor(bmi.category_name),
                created_at: bmi.created_at
            }));
            
            setBmiClasses(mappedClasses);
        } catch (err) {
            console.error('Error fetching BMI classifications:', err);
            setError(err.message || 'Failed to load BMI classifications');
            
            // Fallback to mock data if API fails
            setBmiClasses([
                {
                    id: 1,
                    name: 'Underweight',
                    minBmi: 0,
                    maxBmi: 18.4,
                    classification: 'Underweight',
                    color: '#EF4444'
                },
                {
                    id: 2,
                    name: 'Normal Weight',
                    minBmi: 18.5,
                    maxBmi: 24.9,
                    classification: 'Normal Weight',
                    color: '#10B981'
                },
                {
                    id: 3,
                    name: 'Overweight',
                    minBmi: 25.0,
                    maxBmi: 29.9,
                    classification: 'Overweight',
                    color: '#F59E0B'
                },
                {
                    id: 4,
                    name: 'Obese',
                    minBmi: 30.0,
                    maxBmi: 999,
                    classification: 'Obese',
                    color: '#DC2626'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get default color based on category name
    const getDefaultColor = (categoryName) => {
        const colorMap = {
            // Underweight categories - Red tones
            'Underweight': '#EF4444',
            'Under Weight': '#EF4444',
            'underweight': '#EF4444',
            'Severely Underweight': '#DC2626',
            'Moderately Underweight': '#F87171',
            'Mildly Underweight': '#FCA5A5',
            
            // Normal weight categories - Green tones
            'Normal Weight': '#10B981',
            'Normal': '#10B981',
            'normal': '#10B981',
            'Healthy Weight': '#059669',
            'Ideal Weight': '#047857',
            'Normal Range': '#065F46',
            
            // Overweight categories - Yellow/Orange tones
            'Overweight': '#F59E0B',
            'overweight': '#F59E0B',
            'Mildly Overweight': '#FBBf24',
            'Moderately Overweight': '#F97316',
            'Pre-obese': '#FB923C',
            
            // Obese categories - Red/Orange tones
            'Obese': '#DC2626',
            'obese': '#DC2626',
            'Obesity': '#DC2626',
            'Obese Class I': '#EA580C',
            'Obese Class II': '#C2410C',
            'Obese Class III': '#991B1B',
            'Severely Obese': '#991B1B',
            'Very Severely Obese': '#7F1D1D',
            'Morbidly Obese': '#7F1D1D',
            
            // Common variations
            'Normal weight': '#10B981',
            'Normal weight range': '#10B981',
            'Over weight': '#F59E0B',
            'Over weight range': '#F59E0B'
        };
        
        return colorMap[categoryName] || '#3B82F6'; // Default blue if no match
    };

    const filteredClasses = bmiClasses.filter(bmi => {
        // Apply search filter
        const matchesSearch = bmi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bmi.classification.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Apply BMI range filter
        let matchesFilter = true;
        if (filterRange !== 'all') {
            const avgBmi = (bmi.minBmi + bmi.maxBmi) / 2;
            switch (filterRange) {
                case 'underweight':
                    matchesFilter = avgBmi < 18.5;
                    break;
                case 'normal':
                    matchesFilter = avgBmi >= 18.5 && avgBmi < 25;
                    break;
                case 'overweight':
                    matchesFilter = avgBmi >= 25 && avgBmi < 30;
                    break;
                case 'obese':
                    matchesFilter = avgBmi >= 30;
                    break;
                default:
                    matchesFilter = true;
            }
        }
        
        return matchesSearch && matchesFilter;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAdd = async () => {
        if (formData.category_name && formData.min_bmi && formData.max_bmi) {
            try {
                const payload = {
                    category_name: formData.category_name,
                    min_bmi: parseFloat(formData.min_bmi),
                    max_bmi: parseFloat(formData.max_bmi)
                };
                
                await authAPI.createBmiClassification(payload);
                await fetchBmiClassifications(); // Refresh data
                const className = formData.category_name || 'BMI Classification';
                showCreateSuccess(className);
                setFormData({ category_name: '', min_bmi: '', max_bmi: '' });
                setIsAdding(false);
                setError('');
            } catch (err) {
                console.error('Error creating BMI classification:', err);
                const className = formData.category_name || 'BMI Classification';
                showCreateError(className, err.message || 'Failed to create BMI classification');
                setError(err.message || 'Failed to create BMI classification');
            }
        }
    };

    const handleEdit = (id) => {
        const bmi = bmiClasses.find(b => b.id === id);
        if (bmi) {
            setFormData({
                category_name: bmi.name,
                min_bmi: bmi.minBmi === 0 ? '' : bmi.minBmi,
                max_bmi: bmi.maxBmi === 999 ? '' : bmi.maxBmi
            });
            setEditingId(id);
        }
    };

    const handleUpdate = async () => {
        if (formData.category_name && formData.min_bmi && formData.max_bmi) {
            try {
                const payload = {
                    category_name: formData.category_name,
                    min_bmi: parseFloat(formData.min_bmi),
                    max_bmi: parseFloat(formData.max_bmi)
                };
                
                await authAPI.updateBmiClassification(editingId, payload);
                await fetchBmiClassifications(); // Refresh data
                const className = formData.category_name || 'BMI Classification';
                showUpdateSuccess(className);
                setFormData({ category_name: '', min_bmi: '', max_bmi: '' });
                setEditingId(null);
                setError('');
            } catch (err) {
                console.error('Error updating BMI classification:', err);
                const className = formData.category_name || 'BMI Classification';
                showUpdateError(className, err.message || 'Failed to update BMI classification');
                setError(err.message || 'Failed to update BMI classification');
            }
        }
    };

    const handleDelete = async (id) => {
        // Find the BMI classification to get its name before deletion
        const bmiToDelete = bmiClasses.find(b => b.id === id);
        const className = bmiToDelete?.name || 'BMI Classification';
        
        if (window.confirm('Are you sure you want to delete this BMI classification?')) {
            try {
                await authAPI.deleteBmiClassification(id);
                await fetchBmiClassifications(); // Refresh data
                showDeleteSuccess(className);
                setError('');
            } catch (err) {
                console.error('Error deleting BMI classification:', err);
                showDeleteError(className, err.message || 'Failed to delete BMI classification');
                setError(err.message || 'Failed to delete BMI classification');
            }
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleCancel = () => {
        setFormData({ category_name: '', min_bmi: '', max_bmi: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Custom Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">BMI <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Classifications</span></h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 transition-all text-sm sm:text-base"
                >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Classification</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex gap-2 sm:gap-4 items-center">
                <div className="relative flex-1 max-w-xs sm:max-w-md">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all text-xs sm:text-sm outline-none"
                    />
                </div>
                <div className="relative z-20" ref={filterRef}>
                    <button 
                        onClick={() => setShowFilter(!showFilter)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/20 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all text-xs sm:text-sm backdrop-blur-md outline-none"
                    >
                        <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {filterRange !== 'all' && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        )}
                    </button>
                    
                    {/* Filter Dropdown */}
                    {showFilter && (
                        <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-lg shadow-lg z-30 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                            <div className="p-1.5 space-y-0.5">
                                {[
                                    { value: 'all', label: 'All Classifications' },
                                    { value: 'underweight', label: 'Underweight (<18.5)' },
                                    { value: 'normal', label: 'Normal Weight (18.5-24.9)' },
                                    { value: 'overweight', label: 'Overweight (25-29.9)' },
                                    { value: 'obese', label: 'Obese (≥30)' }
                                ].map(item => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => { setFilterRange(item.value); setShowFilter(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-md text-xs sm:text-sm transition-colors ${
                                            filterRange === item.value 
                                                ? 'bg-amber-500/20 dark:bg-amber-500/30 font-bold text-amber-600 dark:text-amber-400' 
                                                : 'hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {item.value === 'underweight' ? <>Underweight (&lt;18.5)</> :
                                         item.value === 'obese' ? <>Obese (&ge;30)</> :
                                         item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Clear Filter Button */}
                {filterRange !== 'all' && (
                    <button
                        onClick={() => setFilterRange('all')}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(isAdding || editingId) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md transform overflow-hidden bg-white/45 dark:bg-slate-950/35 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Decorative top bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 px-6 py-4 pt-5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                {isAdding ? (
                                    <>Add New <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Classification</span></>
                                ) : (
                                    <>Edit <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Classification</span></>
                                )}
                            </h3>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        name="category_name"
                                        value={formData.category_name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                        placeholder="e.g., Normal Weight"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Min BMI
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="min_bmi"
                                            value={formData.min_bmi}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                            placeholder="18.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max BMI
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="max_bmi"
                                            value={formData.max_bmi}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                            placeholder="24.9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-white/20 dark:border-white/10 px-6 py-4">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={isAdding ? handleAdd : handleUpdate}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {isAdding ? 'Save' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BMI Classes Table */}
            <div className="bg-white/45 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-sm overflow-hidden relative">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading BMI classifications...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 dark:bg-white/5 border-b border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Classification
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            BMI Range
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Color
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20 dark:divide-white/10">
                                    {filteredClasses.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No BMI classifications found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClasses.map((bmi) => (
                                            <tr key={bmi.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-all">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: bmi.color }}
                                                        />
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {bmi.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {bmi.classification}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                        {bmi.minBmi} - {bmi.maxBmi}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                                                            style={{ backgroundColor: bmi.color }}
                                                        />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {bmi.color}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(bmi.id)}
                                                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(bmi.id)}
                                                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden p-4 space-y-4">
                            {filteredClasses.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No BMI classifications found
                                </div>
                            ) : (
                                filteredClasses.map((bmi) => (
                                    <div key={bmi.id} className="bg-white/20 dark:bg-white/5 rounded-lg p-4 border border-white/20 dark:border-white/10">
                                        {/* Classification Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div
                                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: bmi.color }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">{bmi.name}</h3>
                                                    <p className="text-xs text-gray-700 dark:text-gray-400 truncate">
                                                        {bmi.classification}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                                <button
                                                    onClick={() => handleEdit(bmi.id)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bmi.id)}
                                                    className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Classification Details */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">BMI Range:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {bmi.minBmi} - {bmi.maxBmi}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Color:</span>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
                                                        style={{ backgroundColor: bmi.color }}
                                                    />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {bmi.color}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/45 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-sm gap-3 sm:gap-0 mt-4">
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to{' '}
                        {Math.min(pagination.current_page * pagination.page_size, pagination.total_items)} of{' '}
                        {pagination.total_items} results
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={!pagination.has_prev}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={!pagination.has_next}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BmiClass;
