import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Sun, Save, Camera, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import ForgotPassword from './ForgotPassword';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('account');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Mock States
    const [profile, setProfile] = useState({
        name: 'Suraj More',
        email: 'ssmtest31@gmail.com',
        bio: 'Fitness enthusiast and dashboard administrator.',
        avatar: null
    });

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

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfile({ ...profile, avatar: URL.createObjectURL(file) });
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setPasswordError('');
        setPasswordSuccess('');
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

    // Display error from props or local state
    const displayError = passwordError;

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
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Public Profile</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile information.</p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm">
                                        {profile.avatar ? (
                                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-400" />
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
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={profile.bio}
                                        onChange={handleProfileChange}
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                        </div>
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
                                                type="password"
                                                name="old_password"
                                                value={passwordData.old_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Enter current password"
                                                required
                                            />
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
                                                type="password"
                                                name="new_password"
                                                value={passwordData.new_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Enter new password"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="confirm_password"
                                                value={passwordData.confirm_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                        </div>
                                    </div>

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
                                        disabled={passwordLoading}
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
                    {activeTab !== 'appearance' && (
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
