import React, { useState, useEffect, useRef } from 'react';
import { Activity, Mail, Lock, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import ForgotPassword from './ForgotPassword';
import { authAPI } from '../services/api';

const Login = ({ onLogin, loginError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const sessionTimerRef = useRef(null);

    // Check for session expired message on component mount
    useEffect(() => {
        // Additional safety: clear any existing tokens when login page loads
        authAPI.logout();
        
        const sessionExpiredMessage = localStorage.getItem('sessionExpired');
        
        if (sessionExpiredMessage) {
            setError(sessionExpiredMessage);
            setIsSessionExpired(true);
            
            // Clear the message from localStorage immediately
            localStorage.removeItem('sessionExpired');
            
            // Clear any existing timer
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
            }
            
            // Auto-hide session expired message after 5 seconds and refresh page
            sessionTimerRef.current = setTimeout(() => {
                window.location.reload(); // Refresh entire page
            }, 5000);
        }
        
        // Don't return cleanup function that would clear timer on unmount
        // We want the timer to complete even if component re-renders
        return undefined;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setIsSessionExpired(false); // Reset session expired flag on new login attempt
        
        // Clear any existing session timer when user tries to login
        if (sessionTimerRef.current) {
            clearTimeout(sessionTimerRef.current);
            sessionTimerRef.current = null;
        }
        
        try {
            await onLogin(credentials.email, credentials.password);
        } catch (error) {
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Display error from props or local state
    const displayError = loginError || error;

    if (showForgotPassword) {
        return (
            <ForgotPassword 
                onBackToLogin={() => setShowForgotPassword(false)}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse delay-1000"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <Activity className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Enter your credentials to access the dashboard.</p>
                </div>

                {/* Error Display */}
                {displayError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-red-400 text-sm font-medium mb-1">
                                    {isSessionExpired ? 'Session Expired' : 'Login Error'}
                                </p>
                                <p className="text-red-300 text-xs">{displayError}</p>
                                <p className="text-red-400 text-xs mt-2">Check browser console (F12) for detailed error information</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={credentials.email}
                                onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                placeholder="admin@admin.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-gray-400 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded border-gray-700 bg-gray-800 text-primary focus:ring-offset-gray-900" />
                            Remember me
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="absolute bottom-6 text-center text-xs text-gray-600">
                &copy; 2026 FitTrack. All rights reserved.
            </div>
        </div>
    );
};

export default Login;
