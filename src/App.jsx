import React, { useState, useEffect } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Workouts from './components/Workouts';
import Nutrition from './components/Nutrition';
import Progress from './components/Progress';
import UsersPage from './components/Users';
import Subscriptions from './components/Subscriptions';
import BmiClass from './components/BmiClass';
import Settings from './components/Settings';
import Login from './components/Login';
import AppWithNotifications from './components/AppWithNotifications';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { NotificationProvider } from './context/NotificationContext';
import { authAPI } from './services/api';

/* Simple Analytics component inline or imported */
const Analytics = () => (
    <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        <p className="text-gray-500">Deep dive into system performance metrics here.</p>
    </div>
);

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('Dashboard');
    const [loginError, setLoginError] = useState('');
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    // Check authentication status on app load
    useEffect(() => {
        if (authAPI.isAuthenticated()) {
            setIsAuthenticated(true);
        }
        // Scroll to top on initial app load
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, []);

    const handleLogin = async (email, password) => {
        setLoginError('');
        try {
            await authAPI.login(email, password);
            setIsAuthenticated(true);
        } catch (error) {
            setLoginError(error.message || 'Login failed. Please try again.');
            throw error;
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await authAPI.logout();
            setIsAuthenticated(false);
            setCurrentView('Dashboard'); // Reset view on logout
            setLoginError('');
            setShowLogoutDialog(false);
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            // Still logout locally even if API fails
            setIsAuthenticated(false);
            setCurrentView('Dashboard');
            setLoginError('');
            setShowLogoutDialog(false);
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutDialog(false);
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
        // Scroll to top when navigating to a new page
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} loginError={loginError} />;
    }

    return (
        <ThemeProvider>
            <ProfileProvider>
                <NotificationProvider>
                    <AppWithNotifications>
                        <DashboardLayout
                            currentView={currentView}
                            onNavigate={handleNavigate}
                            onLogout={handleLogoutClick}
                        >
                            {currentView === 'Dashboard' && <Dashboard />}
                            {currentView === 'Users' && <UsersPage />}
                            {currentView === 'Subscriptions' && <Subscriptions />}
                            {currentView === 'Workouts' && <Workouts />}
                            {currentView === 'Nutrition' && <Nutrition />}
                            {currentView === 'BMI Class' && <BmiClass />}
                            {currentView === 'Analytics' && <Progress />} {/* Reusing Progress as Analytics for now */}
                            {currentView === 'Profile' && <Profile />}
                            {currentView === 'Settings' && <Settings />}
                        </DashboardLayout>
                    
                    {/* Logout Confirmation Dialog */}
                    {showLogoutDialog && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl">
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-4">
                                        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Confirm Logout
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        Are you sure you want to logout? You will need to login again to access the dashboard.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleLogoutCancel}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogoutConfirm}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-700 rounded-lg transition-colors"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </AppWithNotifications>
                </NotificationProvider>
            </ProfileProvider>
        </ThemeProvider>
    );
}

export default App;
