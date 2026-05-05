import React, { useState, useEffect, useRef } from 'react';
import { Activity, Mail, Lock, ArrowRight, Loader, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ForgotPassword from './ForgotPassword';
import { authAPI } from '../services/api';
import { storeCredentialsInCookies, getCredentialsFromCookies, clearRememberMeCookies, isRememberMeActive, areCredentialsStored } from '../utils/cookieUtils';

const Login = ({ onLogin, loginError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const sessionTimerRef = useRef(null);

    // Check for session expired message on component mount
    useEffect(() => {
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

    // Auto-fill credentials from cookies on component mount
    useEffect(() => {
        const savedCredentials = getCredentialsFromCookies();
        if (savedCredentials) {
            setCredentials({
                email: savedCredentials.email,
                password: savedCredentials.password
            });
            setRememberMe(true);
        }
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
            // Handle remember me logic
            const credentialsAlreadyStored = areCredentialsStored();
            
            if (rememberMe) {
                // Only ask for permission if we're storing NEW credentials
                if (!credentialsAlreadyStored) {
                    const shouldStore = window.confirm(
                        'For your security, we want to confirm:\n\n' +
                        'Do you want to store your login credentials on this device for future convenience?\n\n' +
                        'Your password will be encrypted and stored securely in cookies.\n' +
                        'This will allow you to auto-login on future visits.\n\n' +
                        'Click OK to confirm, or Cancel to login without saving.'
                    );
                    
                    if (shouldStore) {
                        storeCredentialsInCookies(credentials.email, credentials.password);
                    } else {
                        // User declined, clear any existing cookies
                        clearRememberMeCookies();
                        setRememberMe(false);
                    }
                } else {
                    // Credentials already stored, just update them if they're different
                    const savedCredentials = getCredentialsFromCookies();
                    if (savedCredentials && (savedCredentials.email !== credentials.email || savedCredentials.password !== credentials.password)) {
                        storeCredentialsInCookies(credentials.email, credentials.password);
                    }
                }
            } else {
                // Only clear cookies if user explicitly wants to remove stored credentials
                // AND credentials are currently stored
                if (credentialsAlreadyStored) {
                    const shouldClear = window.confirm(
                        'You have unchecked "Remember me".\n\n' +
                        'Do you want to remove the stored login credentials from this device?\n\n' +
                        'Click OK to remove stored credentials, or Cancel to keep them for future convenience.'
                    );
                    
                    if (shouldClear) {
                        clearRememberMeCookies();
                    }
                }
            }
            
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
        <div className="h-screen flex flex-col lg:flex-row relative overflow-hidden">
            {/* Full Background Image - Covers entire page */}
            <div className="absolute inset-0 overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop" 
                    alt="Fitness Dashboard" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Color Overlay - Merges image with theme colors */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-primary/30 to-blue-800/35"></div>
                
                {/* Additional color blending for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/10"></div>
                
                {/* Glow Effects - Integrated with image colors */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-60 h-60 bg-blue-400/30 rounded-full blur-[80px] lg:top-20 lg:left-20 lg:w-80 lg:h-80 lg:blur-[100px]"></div>
                    <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/25 rounded-full blur-[90px] lg:bottom-20 lg:right-20 lg:w-96 lg:h-96 lg:blur-[120px]"></div>
                    <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/20 rounded-full blur-[100px] lg:top-1/2 lg:left-1/2 lg:w-[600px] lg:h-[600px] lg:blur-[150px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-400/15 rounded-full blur-[70px] lg:bottom-1/3 lg:right-1/3 lg:w-80 lg:h-80 lg:blur-[90px]"></div>
                </div>
            </div>

                {/* Left Section - Illustration Area (60-65% on desktop) */}
            <div className="hidden lg:flex lg:w-[62%] relative overflow-hidden">
                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col justify-center h-full px-8 xl:px-16 text-white">
                    <div className="max-w-lg xl:max-w-xl">
                        <div className="inline-flex items-center gap-2 xl:gap-3 mb-4 xl:mb-6">
                            <div className="p-2 xl:p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                <Activity className="w-8 h-8 xl:w-10 xl:h-10 text-white" />
                            </div>
                            <span className="text-base xl:text-lg font-semibold tracking-wide">FitTrack Admin</span>
                        </div>
                        
                        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold mb-3 xl:mb-4 leading-tight">
                            Empowering Personal Fitness
                        </h1>
                        <p className="text-lg xl:text-xl text-gray-200 mb-8 xl:mb-12 leading-relaxed">
                            The industry's leading admin platform for tracking and optimization
                        </p>

                        {/* Stats Section */}
                        <div className="flex gap-6 xl:gap-12">
                            <div>
                                <div className="text-2xl xl:text-4xl font-bold mb-1">95%</div>
                                <div className="text-gray-300 text-xs xl:text-sm">User Engagement</div>
                            </div>
                            <div>
                                <div className="text-2xl xl:text-4xl font-bold mb-1">500+</div>
                                <div className="text-gray-300 text-xs xl:text-sm">Workout Plans</div>
                            </div>
                            <div>
                                <div className="text-2xl xl:text-4xl font-bold mb-1">10K+</div>
                                <div className="text-gray-300 text-xs xl:text-sm">Active Users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Login UI (35-40% on desktop) */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-0">
                <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 lg:px-12">
                    {/* Mobile Logo - Only visible on mobile/tablet */}
                    <div className="lg:hidden flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-primary to-indigo-700 rounded-xl">
                            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-white">FitTrack Admin</span>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-white/5 backdrop-blur-3xl rounded-2xl shadow-xl shadow-black/20 p-4 sm:p-6 lg:p-8 border border-white/10">
                        <div className="mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Sign in</h1>
                            <p className="text-gray-200 text-sm sm:text-base">Enter your credentials to access the dashboard</p>
                        </div>

                        {/* Error Display */}
                        {displayError && (
                            <div className="bg-red-500/10 backdrop-blur-2xl border border-red-400/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-300 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-red-200 text-xs sm:text-sm font-medium mb-1">
                                            {isSessionExpired ? 'Session Expired' : 'Login Error'}
                                        </p>
                                        <p className="text-red-300 text-xs">{displayError}</p>
                                        <p className="text-red-400 text-xs mt-2">Check browser console (F12) for detailed error information</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-200">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={credentials.email}
                                        onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                        className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-sm sm:text-base"
                                        placeholder="admin@admin.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-200">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={credentials.password}
                                        onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                        className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-sm sm:text-base"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-300 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <label className="flex items-center text-gray-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="mr-1.5 sm:mr-2 rounded border-white/20 bg-white/5 text-primary focus:ring-white/20" 
                                    />
                                    <span className="text-xs sm:text-sm">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-blue-200 hover:text-blue-100 font-medium transition-colors text-xs sm:text-sm"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-400/20 hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        <span className="text-xs sm:text-sm">Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6 sm:mt-8 text-xs text-gray-300">
                        &copy; 2026 FitTrack. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
