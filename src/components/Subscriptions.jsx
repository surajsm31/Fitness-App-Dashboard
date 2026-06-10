
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, CreditCard } from 'lucide-react';
import { authAPI } from '../services/api';
import AlertContainer from './AlertContainer';
import { useCustomAlert } from '../hooks/useCustomAlert';

const INITIAL_PLANS = [
    {
        id: 1,
        name: 'Free',
        price: '0',
        frequency: 'Monthly',
        status: 'active',
        features: ['Basic Workout Access', 'Limited Analytics', 'Community Support']
    },
    {
        id: 2,
        name: 'Pro',
        price: '1499',
        frequency: 'Monthly',
        status: 'active',
        features: ['All Workouts (Video)', 'Advanced Analytics', 'Priority Support', 'Ad-free Experience']
    },
    {
        id: 3,
        name: 'Premium',
        price: '2499',
        frequency: 'Monthly',
        status: 'pending',
        features: ['All Pro Features', 'Personalized Meal Plans', '1-on-1 Coaching Session', 'Offline Downloads']
    },
    {
        id: 4,
        name: 'Team',
        price: '14999',
        frequency: 'Yearly',
        status: 'inactive',
        features: ['Up to 5 Users', 'Team Analytics', 'Dedicated Account Manager', 'Custom Branding']
    }
];

const Subscriptions = () => {
    const { alerts, removeAlert, showUpdateSuccess, showCreateSuccess, showDeleteSuccess, showCreateError, showUpdateError, showDeleteError } = useCustomAlert();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '',
        price: '', 
        duration_days: 30,
        features: '',
        is_active: true
    });

    // Fetch plans from API on component mount
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const plansData = await authAPI.getPlans();
            console.log('Raw API response:', plansData);
            console.log('Plan data structure:', plansData[0] || 'No plans found');
            setPlans(plansData);
            console.log('Plans loaded successfully:', plansData);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            setError(err.message || 'Failed to load subscription plans');
            // Fallback to mock data if API fails
            setPlans(INITIAL_PLANS);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (plan = null) => {
        if (plan) {
            setCurrentPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description || '',
                price: plan.price,
                duration_days: plan.duration_days || 30,
                features: plan.features ? plan.features.join('\n') : '',
                is_active: plan.is_active !== undefined ? plan.is_active : true
            });
        } else {
            setCurrentPlan(null);
            setFormData({ 
                name: '', 
                description: '',
                price: '', 
                duration_days: 30,
                features: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        // Find the plan to get its name before deletion
        const planToDelete = plans.find(p => p.id === id);
        const planName = planToDelete?.name || 'Plan';
        
        if (window.confirm(`Are you sure you want to delete this plan?`)) {
            try {
                await authAPI.deletePlan(id);
                console.log('Plan deleted successfully:', id);
                // Refresh the plans list from API to ensure UI is in sync
                await fetchPlans();
                showDeleteSuccess(planName);
            } catch (error) {
                console.error('Error deleting plan:', error);
                showDeleteError(planName, error.message);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
        
        const planData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            duration_days: parseInt(formData.duration_days),
            features: featuresArray,
            is_active: formData.is_active
        };

        try {
            if (currentPlan) {
                // Edit existing plan
                const updatedPlan = await authAPI.updatePlan(currentPlan.id, planData);
                setPlans(plans.map(p => p.id === currentPlan.id ? updatedPlan : p));
                console.log('Plan updated successfully:', updatedPlan);
                showUpdateSuccess(planData.name || currentPlan.name);
            } else {
                // Create new plan
                const newPlan = await authAPI.createPlan(planData);
                setPlans([...plans, newPlan]);
                console.log('Plan created successfully:', newPlan);
                showCreateSuccess(planData.name);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving plan:', error);
            if (currentPlan) {
                showUpdateError(planData.name || currentPlan.name, error.message);
            } else {
                showCreateError(planData.name, error.message);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Custom Alert Container */}
            <AlertContainer alerts={alerts} onRemoveAlert={removeAlert} />
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                    Subscription <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Plans</span>
                </h1>
                <button
                    onClick={() => openModal()}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold px-5 py-2 rounded-xl hover:from-amber-400 hover:to-orange-500 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Plan
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading subscription plans...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="text-red-600 dark:text-red-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading plans</h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            <button
                                onClick={fetchPlans}
                                className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-200 mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white/45 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-white/10 flex flex-col overflow-hidden relative group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            <div className="p-6 bg-white/20 dark:bg-white/5 border-b border-white/20 dark:border-white/10 text-center">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        plan.is_active === true
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm shadow-green-500/30 dark:from-green-600 dark:to-green-700 dark:shadow-green-600/30'
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm shadow-gray-400/30 dark:from-gray-600 dark:to-gray-700 dark:shadow-gray-600/30'
                                    }`}>
                                        {plan.is_active === true ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    ₹{plan.price}
                                    <span className="text-base font-normal text-gray-500 dark:text-gray-400">/{plan.duration_days === 30 ? 'mo' : plan.duration_days === 365 ? 'yr' : `${plan.duration_days} days`}</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                {/* Description Section */}
                                <div className="mb-4 p-3 bg-amber-500/10 dark:bg-amber-500/10 rounded-lg border border-amber-200/30 dark:border-amber-500/20">
                                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{plan.description}</p>
                                </div>
                                
                                {/* Features Section */}
                                <ul className="space-y-3 mb-6 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                            <Check className="w-5 h-5 text-green-500 mr-2 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex gap-3 mt-auto pt-4 border-t border-white/20 dark:border-white/10">
                                    <button
                                        onClick={() => openModal(plan)}
                                        className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/30 dark:bg-white/10 rounded-lg hover:bg-white/50 dark:hover:bg-white/15 flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Decorative top bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white/45 dark:bg-slate-950/35 backdrop-blur-md rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/20 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Decorative top bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                        
                        <div className="flex justify-between items-center mb-6 p-6 pb-0">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                {currentPlan ? (
                                    <>Edit <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Plan</span></>
                                ) : (
                                    <>Create New <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Plan</span></>
                                )}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="px-6 pb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                        placeholder="e.g. Premium Plan"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none resize-none"
                                        placeholder="Describe the subscription plan..."
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none"
                                            placeholder="29.99"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                                        <select
                                            value={formData.duration_days}
                                            onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
                                        >
                                            <option value={30} className="bg-white dark:bg-slate-900">30 Days</option>
                                            <option value={90} className="bg-white dark:bg-slate-900">90 Days</option>
                                            <option value={365} className="bg-white dark:bg-slate-900">365 Days</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Features <span className="text-xs font-normal text-gray-500">(One per line)</span>
                                    </label>
                                    <textarea
                                        value={formData.features}
                                        onChange={e => setFormData({ ...formData, features: e.target.value })}
                                        rows={5}
                                        className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/45 dark:bg-white/5 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none resize-none"
                                        placeholder="Personalized workouts&#10;Nutrition plans&#10;Progress tracking&#10;Priority support"
                                    />
                                </div>
                                
                                <div>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-amber-500 border-white/20 dark:border-white/10 rounded bg-white/45 dark:bg-white/5 focus:ring-amber-500/30 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-white/20 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-5 py-2 rounded-lg shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
