import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Moon, Sun, Save, Camera, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import ForgotPassword from './ForgotPassword';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const { profile, loading: profileLoading, error: profileError, success: profileSuccess, updateProfile } = useProfile();
    const [activeTab, setActiveTab] = useState('account');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    
    // Local state for form handling
    const [localProfile, setLocalProfile] = useState({});

    // Function to get initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    };

    // Initialize local profile when context profile changes
    useEffect(() => {
        setLocalProfile(profile);
    }, [profile]);

    const handleProfileChange = (e) => {
        setLocalProfile({ ...localProfile, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            // Create a temporary preview URL
            setLocalProfile({ 
                ...localProfile, 
                profile_image: URL.createObjectURL(file) 
            });
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        try {
            const profileData = {
                name: localProfile.name,
                bio: localProfile.bio
            };

            if (avatarFile) {
                profileData.profile_image = avatarFile;
            }

            console.log('Submitting profile data:', profileData);
            await updateProfile(profileData);
            setAvatarFile(null);
        } catch (error) {
            console.error('Error updating profile:', error);
            // Error is handled by the context
        }
    };

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        newsletter: false,
        marketing: false
    });

    const [security, setSecurity] = useState({
        twoFactor: true,
        sessionTimeout: '30'
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    
    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Password validation states
    const [passwordValidation, setPasswordValidation] = useState({
        isValid: false,
        message: '',
        isMatching: false,
        newPasswordValid: false,
        newPasswordErrors: []
    });

    // Display error from props or local state
    const displayError = passwordError || profileError;
    const displaySuccess = passwordSuccess || profileSuccess;

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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        const updatedPasswordData = { ...passwordData, [name]: value };
        setPasswordData(updatedPasswordData);
        setPasswordError('');
        setPasswordSuccess('');
        
        // Real-time validation for new password and confirm password
        if (name === 'new_password' || name === 'confirm_password') {
            const newPassword = updatedPasswordData.new_password;
            const confirmPassword = updatedPasswordData.confirm_password;
            
            // Validate new password
            const newPasswordValidation = validatePassword(newPassword);
            
            // Check if passwords match
            let isMatching = false;
            let matchMessage = '';
            
            if (confirmPassword && newPassword) {
                if (newPassword === confirmPassword) {
                    isMatching = true;
                    matchMessage = 'Passwords match!';
                } else {
                    isMatching = false;
                    matchMessage = 'Passwords do not match';
                }
            }
            
            // Update validation state
            setPasswordValidation({
                isValid: newPasswordValidation.isValid && isMatching && confirmPassword.length > 0,
                message: matchMessage,
                isMatching: isMatching,
                newPasswordValid: newPasswordValidation.isValid,
                newPasswordErrors: newPasswordValidation.errors
            });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validation
        if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
            setPasswordError('All fields are required');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 6) {
            setPasswordError('New password must be at least 6 characters long');
            return;
        }

        setPasswordLoading(true);

        try {
            await authAPI.changePassword(passwordData.old_password, passwordData.new_password);
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            setPasswordError(error.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const Tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    ];

    // Show ForgotPassword component if requested
    if (showForgotPassword) {
        return (
            <ForgotPassword 
                onBackToLogin={() => setShowForgotPassword(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col space-y-1">
                    {Tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">

                    {/* ACCOUNT SETTINGS */}
                    {activeTab === 'account' && (
                        <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Public Profile</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile information.</p>
                            </div>

                            {/* Profile Success/Error Messages */}
                            {profileError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
                                </div>
                            )}

                            {profileSuccess && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <p className="text-sm text-green-600 dark:text-green-400">{profileSuccess}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm">
                                        {localProfile.profile_image ? (
                                            <img src={localProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="relative">
                                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-yellow-500 dark:from-yellow-400 dark:to-red-400 drop-shadow-lg transform perspective-500 relative z-10">
                                                    {getInitials(localProfile.name)}
                                                </span>
                                                <span className="absolute inset-0 text-3xl font-black text-black/40 dark:text-black/60 transform translate-x-px translate-y-px z-0">
                                                    {getInitials(localProfile.name)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Profile Picture</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        JPG, GIF or PNG. Max size of 800K
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={localProfile.name || ''}
                                        onChange={handleProfileChange}
                                        disabled={profileLoading}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={localProfile.email || ''}
                                        disabled
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        title="Email address cannot be edited"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address cannot be edited</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={localProfile.bio || ''}
                                        onChange={handleProfileChange}
                                        disabled={profileLoading}
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>
                        </form>
                    )}

                    {/* NOTIFICATIONS SETTINGS */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Config Notifications</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your alert preferences.</p>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(notifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                                                <Mail className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive alerts via {key}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={value}
                                                onChange={() => setNotifications({ ...notifications, [key]: !value })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY SETTINGS */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Security & Privacy</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Protect your account.</p>
                            </div>

                            <div className="max-w-md space-y-4">
                                {/* Password Change Form */}
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showOldPassword ? "text" : "password"}
                                                name="old_password"
                                                value={passwordData.old_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-12 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Enter current password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOldPassword(!showOldPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                                            >
                                                {showOldPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                name="new_password"
                                                value={passwordData.new_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-12 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Enter new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Password Requirements */}
                                    {passwordData.new_password && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                                            <div className="space-y-1">
                                                <div className={`flex items-center gap-2 text-xs ${
                                                    passwordData.new_password.length >= 8 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {passwordData.new_password.length >= 8 ? (
                                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                    )}
                                                    At least 8 characters
                                                </div>
                                                <div className={`flex items-center gap-2 text-xs ${
                                                    /[A-Z]/.test(passwordData.new_password) 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {/[A-Z]/.test(passwordData.new_password) ? (
                                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                    )}
                                                    At least 1 capital letter
                                                </div>
                                                <div className={`flex items-center gap-2 text-xs ${
                                                    /[0-9]/.test(passwordData.new_password) 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {/[0-9]/.test(passwordData.new_password) ? (
                                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                    )}
                                                    At least 1 number
                                                </div>
                                                <div className={`flex items-center gap-2 text-xs ${
                                                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.new_password) 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.new_password) ? (
                                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                                                    )}
                                                    At least 1 special character
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirm_password"
                                                value={passwordData.confirm_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-12 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Validation Message */}
                                    {passwordValidation.message && passwordData.confirm_password && (
                                        <div className={`flex items-center gap-2 p-3 rounded-lg ${
                                            passwordValidation.isValid 
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                        }`}>
                                            {passwordValidation.isValid ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                            )}
                                            <p className={`text-sm ${
                                                passwordValidation.isValid 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {passwordValidation.message}
                                            </p>
                                        </div>
                                    )}

                                    {/* Error and Success Messages */}
                                    {passwordError && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                            <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={passwordLoading || (passwordData.confirm_password && !passwordValidation.isMatching)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Updating Password...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </form>
                                
                                {/* Forgot Password Link */}
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={security.twoFactor}
                                            onChange={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE SETTINGS */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize your workspace look and feel.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-md">
                                <button
                                    onClick={() => theme === 'dark' && toggleTheme()}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200"></div>
                                    <span className="font-medium text-gray-900 dark:text-white">Light Mode</span>
                                </button>
                                <button
                                    onClick={() => theme === 'light' && toggleTheme()}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    <div className="w-full h-24 bg-gray-800 rounded-lg border border-gray-700"></div>
                                    <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Save Button for Forms */}
                    {activeTab === 'account' && (
                        <div className="mt-8 flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button 
                                type="submit"
                                form="profile-form"
                                disabled={profileLoading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all hover:shadow md"
                            >
                                {profileLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {activeTab !== 'account' && activeTab !== 'appearance' && (
                        <div className="mt-8 flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all hover:shadow md">
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
