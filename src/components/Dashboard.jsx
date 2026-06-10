import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { ActivityChart } from './Charts';
import { Users, IndianRupee, Dumbbell, Activity, AlertCircle } from 'lucide-react';
import { SkeletonStatsCard, SkeletonChart } from './Skeletons';
import { authAPI } from '../services/api';
import RecentActivities from './RecentActivities';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [usersData, setUsersData] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // Fetch both overview and users data in parallel
                const [overviewData, usersResponse] = await Promise.all([
                    authAPI.getDashboardOverview(),
                    authAPI.getDashboardUsers()
                ]);
                
                setDashboardData(overviewData);
                setUsersData(usersResponse || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                // Set default values on error
                setDashboardData({
                    total_users: 0,
                    total_workouts: 0,
                    total_meals: 0,
                    active_subscriptions: 0
                });
                setUsersData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Transform API data to component format
    const adminStatsData = dashboardData ? [
        {
            title: 'Total Users',
            value: dashboardData.total_users?.toString() || '0',
            icon: 'Users',
            color: 'blue'
        },
        {
            title: 'Total Workouts',
            value: dashboardData.total_workouts?.toString() || '0',
            icon: 'Dumbbell',
            color: 'green'
        },
        {
            title: 'Total Nutritions',
            value: dashboardData.total_meals?.toString() || '0',
            icon: 'Flame',
            color: 'indigo'
        },
        {
            title: 'Subscribed Users',
            value: dashboardData.active_subscriptions?.toString() || '0',
            icon: 'IndianRupee',
            color: 'orange'
        }
    ] : [];

    return (
        <div className="space-y-6 relative z-10">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Admin <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Overview</span>
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                    ? [...Array(4)].map((_, i) => <SkeletonStatsCard key={i} />)
                    : adminStatsData.map((stat) => <StatsCard key={stat.title} {...stat} />)
                }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users Table */}
                <div className="lg:col-span-2 bg-white/45 dark:bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 dark:border-white/10 transition-all duration-300 relative overflow-hidden">
                    {/* Decorative top bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                    <h3 className="text-lg font-bold text-gray-955 dark:text-white mb-6">Latest <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Users</span></h3>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-w-full">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[65%] sm:w-[45%] md:w-[35%] lg:w-[30%]">User</th>
                                        <th className="py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell sm:w-[40%] md:w-[35%] lg:w-[35%]">Email</th>
                                        <th className="py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell md:w-[15%] lg:w-[15%]">Gender</th>
                                        <th className="py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[35%] sm:w-[15%] md:w-[15%] lg:w-[20%]">Activity Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                    {usersData.length > 0 ? (
                                        usersData.slice(0, 5).map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="py-3.5 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                                            {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px] md:max-w-[180px] lg:max-w-none">
                                                            {user.username || user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                                    <span className="block truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-none">
                                                        {user.email}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell capitalize truncate">
                                                    {user.gender || 'N/A'}
                                                </td>
                                                <td className="py-3.5 px-3 text-sm text-gray-500 dark:text-gray-400 capitalize truncate">
                                                    {user.activity_level || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Activity Feed */}
                <div className="lg:col-span-1 bg-white/45 dark:bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 dark:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-955 dark:text-white">Recent <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Activity</span></h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">Refresh</span>
                            <RecentActivities.RefreshButton />
                        </div>
                    </div>
                    <RecentActivities />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
