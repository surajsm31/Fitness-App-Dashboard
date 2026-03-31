import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

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
        if (value.length > 1) return; // Only allow single digit
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        
        // Auto focus next input
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
        
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
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

    // Reset flow
    const resetFlow = () => {
        setStep(1);
        setEmail('');
        setOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        setOtpSent(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse delay-1000"></div>
            </div>

            {/* Forgot Password Card */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Back Button */}
                <button
                    onClick={onBackToLogin}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </button>

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="p-3 bg-primary/20 rounded-xl">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                            <p className="text-gray-400">
                                Enter your email address and we'll send you a 6-digit OTP to reset your password.
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                                <p className="text-red-400 text-sm font-medium mb-1">Error</p>
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="p-3 bg-primary/20 rounded-xl">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Enter OTP</h1>
                            <p className="text-gray-400">
                                We've sent a 6-digit OTP to {email}
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                                <p className="text-red-400 text-sm font-medium mb-1">Error</p>
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleOtpSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Enter 6-digit OTP</label>
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
                                            className="w-12 h-12 text-center text-lg font-semibold bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
                                >
                                    Back
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleEmailSubmit}
                                    disabled={isLoading}
                                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="p-3 bg-green-500/20 rounded-xl">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                            <p className="text-gray-400">
                                OTP verified! Enter your new password.
                            </p>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-400 text-sm font-medium">Password Reset Successful!</p>
                                        <p className="text-green-300 text-xs mt-1">
                                            Your password has been reset successfully. You can now login with your new password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                                <p className="text-red-400 text-sm font-medium mb-1">Error</p>
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        {!success ? (
                            <form onSubmit={handlePasswordReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={onBackToLogin}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Return to Login
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Remember your password?{' '}
                        <button
                            onClick={onBackToLogin}
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-6 text-center text-xs text-gray-600">
                &copy; 2026 FitTrack. All rights reserved.
            </div>
        </div>
    );
};

export default ForgotPassword;
