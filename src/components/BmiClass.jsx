import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Filter, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const BmiClass = () => {
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
                setFormData({ category_name: '', min_bmi: '', max_bmi: '' });
                setIsAdding(false);
                setError('');
            } catch (err) {
                console.error('Error creating BMI classification:', err);
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
                setFormData({ category_name: '', min_bmi: '', max_bmi: '' });
                setEditingId(null);
                setError('');
            } catch (err) {
                console.error('Error updating BMI classification:', err);
                setError(err.message || 'Failed to update BMI classification');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this BMI classification?')) {
            try {
                await authAPI.deleteBmiClassification(id);
                await fetchBmiClassifications(); // Refresh data
                setError('');
            } catch (err) {
                console.error('Error deleting BMI classification:', err);
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BMI Classifications</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Classification
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
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search classifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowFilter(!showFilter)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {filterRange !== 'all' && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </button>
                    
                    {/* Filter Dropdown */}
                    {showFilter && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <div className="p-2">
                                <button
                                    onClick={() => { setFilterRange('all'); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterRange === 'all' 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    All Classifications
                                </button>
                                <button
                                    onClick={() => { setFilterRange('underweight'); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterRange === 'underweight' 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Underweight (&lt;18.5)
                                </button>
                                <button
                                    onClick={() => { setFilterRange('normal'); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterRange === 'normal' 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Normal Weight (18.5-24.9)
                                </button>
                                <button
                                    onClick={() => { setFilterRange('overweight'); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterRange === 'overweight' 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Overweight (25-29.9)
                                </button>
                                <button
                                    onClick={() => { setFilterRange('obese'); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterRange === 'obese' 
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Obese (≥30)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Clear Filter Button */}
                {filterRange !== 'all' && (
                    <button
                        onClick={() => setFilterRange('all')}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear Filter
                    </button>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(isAdding || editingId) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {isAdding ? 'Add New Classification' : 'Edit Classification'}
                            </h3>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="24.9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={isAdding ? handleAdd : handleUpdate}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {isAdding ? 'Save' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BMI Classes Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading BMI classifications...</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
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
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredClasses.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No BMI classifications found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClasses.map((bmi) => (
                                        <tr key={bmi.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
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
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to{' '}
                        {Math.min(pagination.current_page * pagination.page_size, pagination.total_items)} of{' '}
                        {pagination.total_items} results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={!pagination.has_prev}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={!pagination.has_next}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
