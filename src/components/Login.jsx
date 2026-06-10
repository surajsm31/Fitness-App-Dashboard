import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import ForgotPassword from './ForgotPassword';
import AnimatedActivityIcon from './AnimatedActivityIcon';
import { useAuth } from '../context/AuthContext';
import { storeCredentialsInCookies, getCredentialsFromCookies, clearRememberMeCookies, areCredentialsStored } from '../utils/cookieUtils';

const Login = ({ loginError }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);
    const [permissionDialogType, setPermissionDialogType] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
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
        
        return undefined;
    }, []);

    // Auto-fill credentials from cookies on component mount
    useEffect(() => {
        const savedCredentials = getCredentialsFromCookies();
        if (savedCredentials) {
            setCredentials({
                email: savedCredentials.email,
                password: ''
            });
            setRememberMe(true);
        }
    }, []);

    const handlePermissionDialogClose = () => {
        setShowPermissionDialog(false);
        setPermissionDialogType('');
        setPendingAction(null);
    };

    const handlePermissionDialogConfirm = () => {
        if (pendingAction) {
            pendingAction();
        }
        handlePermissionDialogClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setIsSessionExpired(false);
        
        if (sessionTimerRef.current) {
            clearTimeout(sessionTimerRef.current);
            sessionTimerRef.current = null;
        }
        
        try {
            const credentialsAlreadyStored = areCredentialsStored();
            const savedCredentials = getCredentialsFromCookies();
            const emailChanged = savedCredentials && savedCredentials.email !== credentials.email;
            
            const performLogin = async () => {
                try {
                    await login(credentials.email, credentials.password);
                    navigate('/');
                } catch (err) {
                    setError(err.message || 'Login failed. Please try again.');
                }
            };

            if (rememberMe) {
                if (!credentialsAlreadyStored) {
                    setPermissionDialogType('store');
                    setPendingAction(() => () => {
                        storeCredentialsInCookies(credentials.email);
                        performLogin();
                    });
                    setShowPermissionDialog(true);
                    setIsLoading(false);
                    return;
                } 
                else if (emailChanged) {
                    setPermissionDialogType('update');
                    setPendingAction(() => () => {
                        storeCredentialsInCookies(credentials.email);
                        performLogin();
                    });
                    setShowPermissionDialog(true);
                    setIsLoading(false);
                    return;
                }
            } else {
                if (credentialsAlreadyStored) {
                    setPermissionDialogType('clear');
                    setPendingAction(() => () => {
                        clearRememberMeCookies();
                        performLogin();
                    });
                    setShowPermissionDialog(true);
                    setIsLoading(false);
                    return;
                }
            }
            
            await performLogin();
        } catch (error) {
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                    src="/login-bg.jpg" 
                    alt="Fitness Dashboard" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Subtle Color Overlay - Enhances the natural warm sunset and dark luxury gym tones without washing them out */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-slate-900/10 to-slate-950/45"></div>
                
                {/* Additional color blending for depth and text contrast on the right */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/20 to-slate-950/45"></div>
                
                {/* Glow Effects - Integrated with image's natural light (warm sunset & gold LED accents) */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] lg:top-20 lg:left-20 lg:w-[450px] lg:h-[450px] lg:blur-[130px]"></div>
                    <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-orange-400/5 rounded-full blur-[100px] lg:top-1/2 lg:left-1/2 lg:w-[500px] lg:h-[500px] lg:blur-[140px]"></div>
                    <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/5 rounded-full blur-[90px] lg:bottom-20 lg:right-20 lg:w-[400px] lg:h-[400px] lg:blur-[120px]"></div>
                </div>
            </div>

                {/* Left Section - Illustration Area (60-65% on desktop) */}
            <div className="hidden lg:flex lg:w-[62%] relative overflow-hidden">
                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col justify-center h-full px-8 xl:px-16 text-white">
                    <div className="max-w-lg xl:max-w-xl">
                        <div className="inline-flex items-center gap-4 mb-8 px-5 py-3 bg-slate-950/45 backdrop-blur-md rounded-2xl border-2 border-amber-400 shadow-xl shadow-black/40">
                            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-inner">
                                <AnimatedActivityIcon className="w-7 h-7 text-slate-950" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase leading-none mb-1">SYSTEM PORTAL</span>
                                <span className="text-lg xl:text-xl font-black tracking-wide text-white leading-none">FitTrack Admin</span>
                            </div>
                        </div>
                        
                        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-3 xl:mb-4 leading-tight tracking-tight drop-shadow-md text-white">
                            Empowering <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">Personal Fitness</span>
                        </h1>
                        <p className="text-base sm:text-lg xl:text-xl text-gray-200 mb-8 xl:mb-12 leading-relaxed drop-shadow-sm font-medium">
                            The industry's leading admin platform for tracking and optimization.
                        </p>

                        {/* Stats Section */}
                        <div className="flex gap-6 xl:gap-12">
                            <div>
                                <div className="text-2xl xl:text-4xl font-extrabold mb-1 text-amber-400">95%</div>
                                <div className="text-gray-300 text-xs xl:text-sm font-medium">User Engagement</div>
                            </div>
                            <div>
                                <div className="text-2xl xl:text-4xl font-extrabold mb-1 text-amber-400">500+</div>
                                <div className="text-gray-300 text-xs xl:text-sm font-medium">Workout Plans</div>
                            </div>
                            <div>
                                <div className="text-2xl xl:text-4xl font-extrabold mb-1 text-amber-400">10K+</div>
                                <div className="text-gray-300 text-xs xl:text-sm font-medium">Active Users</div>
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
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                            <AnimatedActivityIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white">FitTrack Admin</span>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-slate-950/35 backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 p-4 sm:p-6 lg:p-8 border border-white/10">
                        <div className="mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Sign in</h1>
                            <p className="text-gray-300 text-sm sm:text-base">Enter your credentials to access the dashboard</p>
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
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={credentials.email}
                                        onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                        className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all text-sm sm:text-base"
                                        placeholder="Enter Your Email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={credentials.password}
                                        onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                        className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all text-sm sm:text-base"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-amber-400 transition-colors"
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
                                <label className="flex items-center text-gray-300 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="mr-1.5 sm:mr-2 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/20" 
                                    />
                                    <span className="text-xs sm:text-sm">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-amber-300 hover:text-amber-200 font-medium transition-colors text-xs sm:text-sm"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                        <span className="text-xs sm:text-sm text-slate-950">Signing in...</span>
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

            {/* Permission Dialog */}
            {showPermissionDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl max-w-sm w-full p-6 shadow-xl border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                {permissionDialogType === 'store' ? 'Store Credentials' : permissionDialogType === 'update' ? 'Update Credentials' : 'Remove Credentials'}
                            </h3>
                            <button
                                onClick={handlePermissionDialogClose}
                                className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-6">
                            {permissionDialogType === 'store' ? (
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    For your security, we want to confirm:
                                    <br /><br />
                                    Do you want to store your email on this device for future convenience?
                                    <br /><br />
                                    Your email will be stored securely in cookies.
                                    This will allow you to quickly fill your email on future visits.
                                </p>
                            ) : permissionDialogType === 'update' ? (
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    You are logging in with a different email than what is currently stored.
                                    <br /><br />
                                    Do you want to update the stored email to the new one?
                                    <br /><br />
                                    Your email will be stored securely in cookies.
                                </p>
                            ) : (
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    You have unchecked "Remember me".
                                    <br /><br />
                                    Do you want to remove the stored email from this device?
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePermissionDialogClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-200 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePermissionDialogConfirm}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-colors"
                            >
                                {permissionDialogType === 'store' ? 'Confirm' : permissionDialogType === 'update' ? 'Update' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
