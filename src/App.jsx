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
import Quotes from './components/Quotes';
import Settings from './components/Settings';
import ExploreActivities from './components/ExploreActivities';
import Login from './components/Login';
import AppWithNotifications from './components/AppWithNotifications';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { NotificationProvider } from './context/NotificationContext';
import { LogOut } from 'lucide-react';
import { authAPI } from './services/api';

/* Simple Analytics component inline or imported */
const Analytics = () => (
    <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        <p className="text-gray-500">Deep dive into system performance metrics here.</p>
    </div>
);

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </ThemeProvider>
    );
}

// Separate component to use useAuth hook
const AppRoutes = () => {
    const { isAuthenticated, loading, logout } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await logout();
            setShowLogoutDialog(false);
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            setShowLogoutDialog(false);
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutDialog(false);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading App...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Route */}
            <Route 
                path="/login" 
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                } 
            />

            {/* Protected Dashboard Routes */}
            <Route 
                path="/*" 
                element={
                    <ProtectedRoute>
                        <ProfileProvider>
                            <NotificationProvider>
                                <AppWithNotifications>
                                    <DashboardLayout
                                        onLogout={handleLogoutClick}
                                    >
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/dashboard" element={<Navigate to="/" replace />} />
                                            <Route path="/users" element={<UsersPage />} />
                                            <Route path="/subscriptions" element={<Subscriptions />} />
                                            <Route path="/workouts" element={<Workouts />} />
                                            <Route path="/explore-activities" element={<ExploreActivities />} />
                                            <Route path="/nutrition" element={<Nutrition />} />
                                            <Route path="/bmi-class" element={<BmiClass />} />
                                            <Route path="/analytics" element={<Progress />} />
                                            <Route path="/quotes" element={<Quotes />} />
                                            <Route path="/profile" element={<Profile />} />
                                            <Route path="/settings" element={<Settings />} />
                                            {/* Catch all for dashboard - redirect to home */}
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </DashboardLayout>
                                    
                                     {/* Logout Confirmation Dialog */}
                                     {showLogoutDialog && (
                                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                             <div className="bg-white/45 dark:bg-slate-950/35 backdrop-blur-md rounded-xl max-w-sm w-full p-6 shadow-2xl border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                                                 {/* Decorative top bar */}
                                                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 animate-in fade-in slide-in-from-top-1 z-10"></div>
                                                 
                                                 <div className="text-center mt-2">
                                                     <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/10 dark:bg-amber-500/25 mb-4 border border-amber-500/20">
                                                         <LogOut className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                                                     </div>
                                                     <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                                                         Confirm <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">Logout</span>
                                                     </h3>
                                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                                         Are you sure you want to logout? You will need to login again to access the dashboard.
                                                     </p>
                                                 </div>
                                                 <div className="flex gap-3">
                                                     <button
                                                         onClick={handleLogoutCancel}
                                                         className="flex-1 px-4 py-2 text-sm font-medium border border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all"
                                                     >
                                                         Cancel
                                                     </button>
                                                     <button
                                                         onClick={handleLogoutConfirm}
                                                         className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-4 py-2 rounded-lg shadow-md shadow-amber-500/20 transition-all text-sm"
                                                     >
                                                         Logout
                                                     </button>
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                </AppWithNotifications>
                            </NotificationProvider>
                        </ProfileProvider>
                    </ProtectedRoute>
                } 
            />
        </Routes>
    );
};

export default App;
