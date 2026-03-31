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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeProvider } from './context/ThemeContext';
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

    // Check authentication status on app load
    useEffect(() => {
        if (authAPI.isAuthenticated()) {
            setIsAuthenticated(true);
        }
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

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            setIsAuthenticated(false);
            setCurrentView('Dashboard'); // Reset view on logout
            setLoginError('');
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            // Still logout locally even if API fails
            setIsAuthenticated(false);
            setCurrentView('Dashboard');
            setLoginError('');
        }
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} loginError={loginError} />;
    }

    return (
        <ThemeProvider>
            <DashboardLayout
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
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
        </ThemeProvider>
    );
}

export default App;
