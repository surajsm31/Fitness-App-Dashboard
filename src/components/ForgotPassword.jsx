import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader, CheckCircle, Lock, Eye, EyeOff, AlertCircle, Quote } from 'lucide-react';
import { authAPI } from '../services/api';
import FitnessAdminIcon from './FitnessAdminIcon';

const ForgotPassword = ({ onBackToLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    
    // Password validation states
    const [passwordValidation, setPasswordValidation] = useState({
        isValid: false,
        message: '',
        isMatching: false,
        newPasswordValid: false,
        newPasswordErrors: []
    });

    // Quote content dynamically based on current step
    const getLeftSectionContent = (currentStep) => {
        switch (currentStep) {
            case 1:
                return {
                    title: "Access Recovery",
                    quote: "The only bad workout is the one that didn't happen. Let's get you back on track.",
                    author: "Fitness Mantra"
                };
            case 2:
                return {
                    title: "Verification Step",
                    quote: "Focus on your goal. Don't look in any direction but ahead. Success is a matter of consistency.",
                    author: "Athletic Mindset"
                };
            case 3:
                return {
                    title: "Securing Portal",
                    quote: "Strength does not come from physical capacity. It comes from an indomitable will.",
                    author: "Mahatma Gandhi"
                };
            default:
                return {
                    title: "FitTrack Portal",
                    quote: "Empowering personal fitness through advanced optimization and tracking.",
                    author: "FitTrack Admin"
                };
        }
    };

    const leftContent = getLeftSectionContent(step);

    // Password validation function
    const validatePassword = (password) => {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least 1 capital letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least 1 number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least 1 special character');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };

    // Handle password input changes with validation
    const handlePasswordChange = (field, value) => {
        setError('');
        
        if (field === 'newPassword') {
            setNewPassword(value);
        } else if (field === 'confirmPassword') {
            setConfirmPassword(value);
        }
        
        const currentNewPassword = field === 'newPassword' ? value : newPassword;
        const currentConfirmPassword = field === 'confirmPassword' ? value : confirmPassword;
        
        const newPasswordValidation = validatePassword(currentNewPassword);
        
        let isMatching = false;
        let matchMessage = '';
        
        if (currentConfirmPassword && currentNewPassword) {
            if (currentNewPassword === currentConfirmPassword) {
                isMatching = true;
                matchMessage = 'Passwords match!';
            } else {
                isMatching = false;
                matchMessage = 'Passwords do not match';
            }
        }
        
        setPasswordValidation({
            isValid: newPasswordValidation.isValid && isMatching && currentConfirmPassword.length > 0,
            message: matchMessage,
            isMatching: isMatching,
            newPasswordValid: newPasswordValidation.isValid,
            newPasswordErrors: newPasswordValidation.errors
        });
    };

    // Handle email submission
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            await authAPI.forgotPassword(email);
            setOtpSent(true);
            setStep(2);
        } catch (error) {
            setError(error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle OTP keydown for backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // Handle OTP verification
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        const otpValue = otp.join('');
        
        if (otpValue.length !== 6) {
            setError('Please enter all 6 digits');
            setIsLoading(false);
            return;
        }
        
        try {
            await authAPI.verifyOtp(email, otpValue);
            setStep(3);
        } catch (error) {
            setError(error.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        if (!passwordValidation.isValid) {
            setError('Please ensure all password requirements are met and passwords match');
            setIsLoading(false);
            return;
        }
        
        try {
            await authAPI.resetPassword(email, otp.join(''), newPassword);
            setSuccess(true);
        } catch (error) {
            setError(error.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col lg:flex-row relative overflow-hidden bg-gray-950">
            {/* Full Background Image - Covers entire page */}
            <div className="absolute inset-0 overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2070&auto=format&fit=crop" 
                    alt="Fitness Sunset Recovery" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Subtle Color Overlay - Matches sunset and dark luxury gym tones */}
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

            {/* Left Section - Quotes and Recovery Illustration Area (60-65% on desktop) */}
            <div className="hidden lg:flex lg:w-[62%] relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center h-full px-8 xl:px-16 text-white">
                    <div className="max-w-lg xl:max-w-xl">
                        {/* Enlarged Brand Badge */}
                        <div className="inline-flex items-center gap-4 mb-8 px-5 py-3 bg-slate-950/45 backdrop-blur-md rounded-2xl border-2 border-amber-400 shadow-xl shadow-black/40">
                            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-inner">
                                <FitnessAdminIcon className="w-7 h-7 text-slate-950" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase leading-none mb-1">SYSTEM PORTAL</span>
                                <span className="text-lg xl:text-xl font-black tracking-wide text-white leading-none">FitTrack Admin</span>
                            </div>
                        </div>
                        
                        {/* Dynamic Step Header */}
                        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold mb-4 leading-tight tracking-tight drop-shadow-md text-white transition-all duration-500">
                            Empowering <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">{leftContent.title}</span>
                        </h1>

                        {/* Dynamic Quote Box */}
                        <div className="relative mt-6 p-6 sm:p-8 bg-slate-950/35 border border-white/5 rounded-2xl backdrop-blur-md shadow-2xl transition-all duration-500">
                            <Quote className="absolute top-4 left-4 w-8 h-8 text-amber-400/20 rotate-180" />
                            <blockquote className="text-base sm:text-lg xl:text-xl text-gray-200 font-medium italic leading-relaxed pl-6 drop-shadow-sm">
                                "{leftContent.quote}"
                            </blockquote>
                            <cite className="block mt-4 text-xs xl:text-sm font-bold tracking-wider text-amber-400 uppercase text-right">
                                — {leftContent.author}
                            </cite>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Forgot Password UI */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-0 z-10">
                <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 lg:px-12">
                    {/* Mobile Logo - Only visible on mobile/tablet */}
                    <div className="lg:hidden flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                            <FitnessAdminIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white">FitTrack Admin</span>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-slate-950/35 backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/40 p-4 sm:p-6 lg:p-8 border border-white/10">
                        {/* Back Button */}
                        <button
                            onClick={onBackToLogin}
                            className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </button>

                        {/* Step 1: Email Input */}
                        {step === 1 && (
                            <div className="animate-in fade-in duration-300">
                                <div className="mb-6 sm:mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Forgot Password?</h1>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        Enter your registered email address below, and we will send a 6-digit OTP code to verify your account.
                                    </p>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-xl p-3.5 mb-6">
                                        <div className="flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-red-400 text-xs sm:text-sm font-bold">Error</p>
                                                <p className="text-red-300 text-xs mt-0.5">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all text-sm sm:text-base"
                                                placeholder="Enter your email address"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                                <span className="text-xs sm:text-sm text-slate-950">Sending OTP...</span>
                                            </>
                                        ) : (
                                            'Send OTP'
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 2 && (
                            <div className="animate-in fade-in duration-300">
                                <div className="mb-6 sm:mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Verify Identity</h1>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        We have dispatched a 6-digit OTP code to <strong className="text-amber-400">{email}</strong>. Enter it below to proceed.
                                    </p>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-xl p-3.5 mb-6">
                                        <div className="flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-red-400 text-xs sm:text-sm font-bold">Error</p>
                                                <p className="text-red-300 text-xs mt-0.5">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleOtpSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 text-center block">Enter 6-digit OTP Code</label>
                                        <div className="flex gap-2 justify-center">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                                    <span className="text-xs sm:text-sm text-slate-950">Verifying...</span>
                                                </>
                                            ) : (
                                                'Verify OTP'
                                            )}
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all text-sm sm:text-base"
                                        >
                                            Back
                                        </button>
                                    </div>

                                    <div className="text-center pt-2">
                                        <button
                                            type="button"
                                            onClick={handleEmailSubmit}
                                            disabled={isLoading}
                                            className="text-amber-300 hover:text-amber-200 text-sm font-semibold tracking-wider transition-colors disabled:opacity-50"
                                        >
                                            Resend OTP Code
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Reset Password */}
                        {step === 3 && (
                            <div className="animate-in fade-in duration-300">
                                <div className="mb-6 sm:mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">New Password</h1>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        OTP code verified successfully! Specify your new dashboard access password below.
                                    </p>
                                </div>

                                {/* Success Message */}
                                {success && (
                                    <div className="bg-green-500/10 backdrop-blur-2xl border border-green-500/20 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-green-400 text-sm font-bold">Password Reset Successful!</p>
                                                <p className="text-green-300 text-xs mt-1 leading-relaxed">
                                                    Your account access credentials have been securely updated. You can now return to the login interface.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-xl p-3.5 mb-6">
                                        <div className="flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-red-400 text-xs sm:text-sm font-bold">Error</p>
                                                <p className="text-red-300 text-xs mt-0.5">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!success ? (
                                    <form onSubmit={handlePasswordReset} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">New Password</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    value={newPassword}
                                                    onChange={e => handlePasswordChange('newPassword', e.target.value)}
                                                    className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-505 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all text-sm sm:text-base"
                                                    placeholder="Enter new password"
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
                                        
                                        {/* Password Requirements */}
                                        {newPassword && (
                                            <div className="bg-slate-950/45 backdrop-blur-md rounded-xl p-3 border border-white/5">
                                                <p className="text-xs font-bold text-amber-400 mb-2 tracking-wider uppercase">Password Requirements:</p>
                                                <div className="space-y-1.5">
                                                    <div className={`flex items-center gap-2 text-xs ${
                                                        newPassword.length >= 8 
                                                            ? 'text-green-400' 
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {newPassword.length >= 8 ? (
                                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                        )}
                                                        At least 8 characters
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs ${
                                                        /[A-Z]/.test(newPassword) 
                                                            ? 'text-green-400' 
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {/[A-Z]/.test(newPassword) ? (
                                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                        )}
                                                        At least 1 capital letter
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs ${
                                                        /[0-9]/.test(newPassword) 
                                                            ? 'text-green-400' 
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {/[0-9]/.test(newPassword) ? (
                                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                        )}
                                                        At least 1 number
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs ${
                                                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) 
                                                            ? 'text-green-400' 
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? (
                                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                        )}
                                                        At least 1 special character
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
                                                </div>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required
                                                    value={confirmPassword}
                                                    onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                                                    className="block w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl text-white placeholder-gray-505 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all text-sm sm:text-base"
                                                    placeholder="Confirm new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-amber-400 transition-colors"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Password Matching Status */}
                                        {passwordValidation.message && confirmPassword && (
                                            <div className={`flex items-center gap-2.5 p-3 rounded-xl backdrop-blur-md border ${
                                                passwordValidation.isValid 
                                                    ? 'bg-green-500/10 border-green-500/25 text-green-300' 
                                                    : 'bg-red-500/10 border-red-500/25 text-red-300'
                                            }`}>
                                                {passwordValidation.isValid ? (
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                )}
                                                <p className="text-sm font-medium">
                                                    {passwordValidation.message}
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading || !passwordValidation.isValid}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-950" />
                                                    <span className="text-xs sm:text-sm text-slate-950">Resetting...</span>
                                                </>
                                            ) : (
                                                'Reset Password'
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-4 pt-4">
                                        <button
                                            onClick={onBackToLogin}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            Return to Login
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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

export default ForgotPassword;
