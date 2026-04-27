import React, { useState, useEffect } from 'react';
import { Quote, Plus, Edit2, Trash2, X, Save, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { quotesAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const Quotes = () => {
    const { theme } = useTheme();
    const { alerts, removeAlert, showCreateSuccess, showUpdateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingQuote, setIsAddingQuote] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [newQuote, setNewQuote] = useState({ text: '', author: '', category: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const quotesPerPage = 9;

    // Load quotes from API on component mount
    useEffect(() => {
        console.log('🚀 [QUOTES COMPONENT] Component mounted, fetching quotes...');
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        console.log('🔄 [QUOTES COMPONENT] Starting fetchQuotes...');
        try {
            setLoading(true);
            setError(null);
            const response = await quotesAPI.getQuotes();
            console.log('📊 [QUOTES COMPONENT] fetchQuotes success, setting quotes:', response);
            setQuotes(response || []); // response already contains the quotes array from API
        } catch (err) {
            console.log('💥 [QUOTES COMPONENT] fetchQuotes failed:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch quotes. Please try again.';
            setError(errorMessage);
            // Don't show alert for initial fetch errors, just set the error state
        } finally {
            setLoading(false);
            console.log('✅ [QUOTES COMPONENT] fetchQuotes completed, loading set to false');
        }
    };

    const handleAddQuote = async () => {
        if (newQuote.text.trim()) {
            console.log('➕ [QUOTES COMPONENT] Adding new quote:', newQuote);
            try {
                const quoteData = {
                    text: newQuote.text.trim(),
                    author: newQuote.author.trim() || null,
                    category: newQuote.category.trim() || null
                };
                const response = await quotesAPI.createQuote(quoteData);
                console.log('📈 [QUOTES COMPONENT] Quote API response:', response);
                console.log('📈 [QUOTES COMPONENT] Quote API response type:', typeof response);
                console.log('📈 [QUOTES COMPONENT] Quote API response keys:', response ? Object.keys(response) : 'response is null/undefined');
                
                // Handle different response structures
                let createdQuote = response;
                if (response && response.data) {
                    createdQuote = response.data;
                } else if (response && response.quote) {
                    createdQuote = response.quote;
                }
                
                console.log('📈 [QUOTES COMPONENT] Final quote to add:', createdQuote);
                
                if (createdQuote && createdQuote.text) {
                    setQuotes([...quotes, createdQuote]);
                    setNewQuote({ text: '', author: '', category: '' });
                    setIsAddingQuote(false);
                    showCreateSuccess('Quote');
                } else {
                    console.error('❌ [QUOTES COMPONENT] Invalid quote response from API:', createdQuote);
                    showCreateError('Quote', 'Invalid response from server. Please try again.');
                }
            } catch (error) {
                console.log('💥 [QUOTES COMPONENT] Failed to add quote:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to add quote. Please try again.';
                showCreateError('Quote', errorMessage);
                setError('Failed to add quote. Please try again.');
            }
        } else {
            console.log('⚠️ [QUOTES COMPONENT] Cannot add quote: text is empty');
        }
    };

    const handleUpdateQuote = async () => {
        if (editingQuote && editingQuote.text.trim()) {
            console.log('✏️ [QUOTES COMPONENT] Updating quote:', editingQuote);
            try {
                const quoteData = {
                    text: editingQuote.text.trim(),
                    author: editingQuote.author?.trim() || null,
                    category: editingQuote.category?.trim() || null
                };
                const response = await quotesAPI.updateQuote(editingQuote.id, quoteData);
                console.log('📝 [QUOTES COMPONENT] Quote updated successfully, updating state:', response);
                
                // Handle case where API returns undefined or no data
                const updatedQuote = response || {
                    ...editingQuote,
                    ...quoteData
                };
                
                setQuotes(quotes.map(quote => 
                    quote.id === editingQuote.id ? updatedQuote : quote
                ));
                setEditingQuote(null);
                showUpdateSuccess('Quote');
            } catch (error) {
                console.log('💥 [QUOTES COMPONENT] Failed to update quote:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to update quote. Please try again.';
                showUpdateError('Quote', errorMessage);
                setError('Failed to update quote. Please try again.');
            }
        } else {
            console.log('⚠️ [QUOTES COMPONENT] Cannot update quote: no editing quote or text is empty');
        }
    };

    const handleDeleteQuote = async (id) => {
        console.log('🗑️ [QUOTES COMPONENT] Deleting quote with ID:', id);
        try {
            await quotesAPI.deleteQuote(id);
            console.log('✅ [QUOTES COMPONENT] Quote deleted successfully, updating state');
            setQuotes(quotes.filter(quote => quote.id !== id));
            showDeleteSuccess('Quote');
        } catch (error) {
            console.log('💥 [QUOTES COMPONENT] Failed to delete quote:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete quote. Please try again.';
            showDeleteError('Quote', errorMessage);
            setError('Failed to delete quote. Please try again.');
        }
    };

    const indexOfLastQuote = currentPage * quotesPerPage;
    const indexOfFirstQuote = indexOfLastQuote - quotesPerPage;
    const currentQuotes = quotes.slice(indexOfFirstQuote, indexOfLastQuote);
    const totalPages = Math.ceil(quotes.length / quotesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Debug logging for state (reduced frequency)
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [QUOTES COMPONENT] State:', {
            loading,
            error,
            quotesLength: quotes.length,
            currentQuotesLength: currentQuotes.length,
            currentPage,
            totalPages,
            quotesPerPage,
            indexOfFirstQuote,
            indexOfLastQuote,
            allQuotes: quotes
        });
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                            Fitness Quotes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
                            Manage your collection of motivational fitness quotes
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddingQuote(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-5 h-5" />
                        Add Quote
                    </button>
                </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-red-700 dark:text-red-300 text-sm mb-2">{error}</p>
                            <button
                                onClick={fetchQuotes}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry
                            </button>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading quotes...</span>
                </div>
            )}

            {/* Add Quote Modal */}
            {isAddingQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl relative">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setIsAddingQuote(false);
                                setNewQuote({ text: '', author: '', category: '' });
                            }}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 pr-8">
                            Add New Quote
                        </h2>
                        
                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quote Text *
                                </label>
                                <textarea
                                    value={newQuote.text}
                                    onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm"
                                    rows={4}
                                    placeholder="Enter the quote text..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Author
                                </label>
                                <input
                                    type="text"
                                    value={newQuote.author}
                                    onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                    placeholder="Enter the author name..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={newQuote.category}
                                    onChange={(e) => setNewQuote({ ...newQuote, category: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                    placeholder="Enter category (e.g., Motivation, Fitness, Success)..."
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8">
                            <button
                                onClick={() => {
                                    setIsAddingQuote(false);
                                    setNewQuote({ text: '', author: '', category: '' });
                                }}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddQuote}
                                disabled={!newQuote.text.trim()}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Quote
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotes Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {(() => {
                        const filteredQuotes = currentQuotes.filter(quote => quote && quote.text);
                        console.log('🎯 [QUOTES COMPONENT] Rendering quotes:', {
                            totalQuotes: quotes.length,
                            currentQuotes: currentQuotes.length,
                            filteredQuotes: filteredQuotes.length,
                            currentPage,
                            quotesPerPage,
                            filteredQuoteIds: filteredQuotes.map(q => q.id)
                        });
                        return filteredQuotes.map((quote) => (
                            <div
                                key={quote.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow relative group"
                            >
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => setEditingQuote(quote)}
                                        className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuote(quote.id)}
                                        className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                                
                                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-3 sm:mb-4 opacity-50" />
                                <blockquote className="text-gray-700 dark:text-gray-300 italic mb-3 sm:mb-4 min-h-[50px] sm:min-h-[60px] text-sm sm:text-base">
                                    "{quote.text}"
                                </blockquote>
                                <cite className="text-sm font-semibold text-gray-900 dark:text-white not-italic block mb-2">
                                    — {quote.author || 'Unknown'}
                                </cite>
                                {quote.category && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <Tag className="w-3 h-3" />
                                        <span>{quote.category}</span>
                                    </div>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            )}

            {/* Edit Quote Modal */}
            {editingQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Quote</h3>
                            <button
                                onClick={() => setEditingQuote(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quote Text *
                                </label>
                                <textarea
                                    value={editingQuote.text}
                                    onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-sm"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Author
                                </label>
                                <input
                                    type="text"
                                    value={editingQuote.author || ''}
                                    onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={editingQuote.category || ''}
                                    onChange={(e) => setEditingQuote({ ...editingQuote, category: e.target.value })}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                    placeholder="Enter category (e.g., Motivation, Fitness, Success)..."
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleUpdateQuote}
                                    disabled={!editingQuote.text.trim()}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                >
                                    <Save className="w-4 h-4" />
                                    Update Quote
                                </button>
                                <button
                                    onClick={() => setEditingQuote(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => paginate(index + 1)}
                            className={`px-2 sm:px-3 py-1 rounded-lg transition-colors text-sm ${
                                currentPage === index + 1
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && quotes.length === 0 && (
                <div className="text-center py-20">
                    <Quote className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No quotes yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Start building your collection by adding your first motivational quote.
                    </p>
                    <button
                        onClick={() => setIsAddingQuote(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Quote
                    </button>
                </div>
            )}
            </div>

            {/* Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
        </>
    );
};

export default Quotes;
