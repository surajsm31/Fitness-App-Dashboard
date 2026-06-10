import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';

// Separate RefreshButton component for reuse
const RefreshButton = ({ onRefresh, refreshing, size = 'default' }) => {
  const sizeClasses = size === 'small' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'small' ? 14 : 16;
  
  return (
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className={`${sizeClasses} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Refresh recent activities"
    >
      <RefreshCw 
        size={iconSize} 
        className={refreshing ? 'animate-spin' : ''}
      />
    </button>
  );
};

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getRecentActivities();
      setActivities(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
      setError('Failed to load recent activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await authAPI.getRecentActivities();
      setActivities(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh recent activities:', err);
      setError('Failed to refresh recent activities');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  // Attach RefreshButton as static property for reuse
  RecentActivities.RefreshButton = () => (
    <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/10 dark:bg-slate-950/25 border border-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-white/10 dark:bg-slate-950/20 border border-white/5 rounded-xl p-6">
        <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
        <div className="flex justify-center">
          <RefreshButton 
            onRefresh={handleRefresh} 
            refreshing={refreshing} 
            size="small"
          />
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 bg-white/10 dark:bg-slate-950/20 border border-white/5 rounded-xl p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No recent activities</p>
        <div className="flex justify-center">
          <RefreshButton 
            onRefresh={handleRefresh} 
            refreshing={refreshing} 
            size="small"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
      {/* Activities list */}
      {activities.map((activity, index) => (
        <div 
          key={index} 
          className="flex items-center gap-3.5 p-3.5 bg-white/15 dark:bg-slate-950/20 border border-white/5 hover:border-white/10 hover:bg-white/25 dark:hover:bg-slate-900/35 rounded-xl transition-all duration-300 shadow-sm"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50 flex-shrink-0 animate-pulse"></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {activity.description}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivities;
