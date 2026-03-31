import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { ActivityChart } from './Charts';
import { Users, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { SkeletonStatsCard, SkeletonChart } from './Skeletons';
import { authAPI } from '../services/api';

const Dashboard = () => {
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
            icon: 'Footprints',
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
            icon: 'DollarSign',
            color: 'orange'
        }
    ] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                    ? [...Array(4)].map((_, i) => <SkeletonStatsCard key={i} />)
                    : adminStatsData.map((stat) => <StatsCard key={stat.title} {...stat} />)
                }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Latest Users</h3>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">No.</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Username</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Activity Level</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Gender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersData.length > 0 ? (
                                        usersData.map((user, index) => (
                                            <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{user.username}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        user.activity_level === 'advanced' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : user.activity_level === 'beginner'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                            : user.activity_level
                                                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                            : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                                    }`}>
                                                        {user.activity_level || 'Not set'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        user.gender === 'Male' 
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                            : user.gender === 'Female'
                                                            ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
                                                            : user.gender
                                                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                            : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                                    }`}>
                                                        {user.gender || 'Not set'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[
                                { user: 'Alice', action: 'signed up', time: '2 mins ago' },
                                { user: 'Bob', action: 'purchased Pro', time: '15 mins ago' },
                                { user: 'Charlie', action: 'updated profile', time: '1 hour ago' },
                                { user: 'David', action: 'logged a workout', time: '2 hours ago' },
                                { user: 'Eve', action: 'submitted ticket', time: '4 hours ago' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            <span className="font-medium">{item.user}</span> {item.action}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
