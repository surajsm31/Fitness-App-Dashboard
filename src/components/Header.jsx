import React, { useState } from 'react';
import { Bell, Menu, Moon, Sun, Search, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onMenuClick, onLogout, onNavigate }) => {
    const { theme, toggleTheme } = useTheme();
    const { profile, loading: profileLoading } = useProfile();
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Use real notification system
    const {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
    } = useNotifications();

    // Function to get initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    };

    const handleMarkRead = async (id) => {
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setShowNotifications(false);
    };

    const handleClearAll = async () => {
        await clearAllNotifications();
        setShowNotifications(false);
    };

    // Handle notification bell click
    const handleNotificationBellClick = () => {
        setShowNotifications(!showNotifications);
        // Don't automatically mark as read - let user manually mark them
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                onClick={onMenuClick}
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
                {/* <div className="relative flex flex-1 items-center max-w-xs sm:max-w-md my-3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="block h-full w-full rounded-full border-0 bg-gray-100/50 dark:bg-gray-800/50 py-0 pl-10 pr-2 sm:pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 text-xs sm:text-sm transition-all shadow-sm hover:shadow-md focus:shadow-md"
                    />
                </div> */}

                <div className="flex items-center gap-x-1 sm:gap-x-2 lg:gap-x-6 ml-auto">

                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center p-1.5 sm:p-2.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-amber-400 transition-colors bg-gray-50/50 dark:bg-gray-800/50 rounded-full hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                    >
                        <span className="sr-only">Toggle theme</span>
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
                        ) : (
                            <Moon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
                        )}
                    </button>

                    {/* Connection Status Indicator */}
                    <div className="hidden sm:flex items-center">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            isConnected 
                                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        }`}>
                            {isConnected ? (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    <span>Live</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3" />
                                    <span>Offline</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative flex items-center">
                        <button
                            type="button"
                            onClick={handleNotificationBellClick}
                            className={`flex items-center justify-center p-1 xs:p-1 sm:p-1.5 lg:p-2.5 transition-colors rounded-full shadow-sm relative group ${
                                isLoading 
                                    ? 'text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700'
                            }`}
                            disabled={isLoading}
                            title={isLoading ? 'Loading notifications...' : 'View notifications'}
                        >
                            <span className="sr-only">View notifications</span>
                            <Bell className={`h-3.5 w-3.5 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0 transition-transform ${
                                unreadCount > 0 ? 'group-hover:animate-swing' : ''
                            } ${isLoading ? 'animate-pulse' : ''}`} aria-hidden="true" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0.5 xs:top-0.5 sm:top-1 right-0.5 xs:right-0.5 sm:right-1.5 lg:right-2.5 block h-1.5 w-1.5 xs:h-1.5 xs:w-1.5 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-900 animate-pulse" />
                            )}
                            {isLoading && (
                                <span className="absolute top-0.5 xs:top-0.5 sm:top-1 right-0.5 xs:right-0.5 sm:right-1.5 lg:right-2.5 block h-1.5 w-1.5 xs:h-1.5 xs:w-1.5 rounded-full bg-gray-400 ring-1 ring-white dark:ring-gray-900 animate-ping" />
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                {/* Mobile overlay backdrop */}
                                <div 
                                    className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <NotificationDropdown
                                    notifications={notifications}
                                    onMarkRead={handleMarkRead}
                                    onMarkAllAsRead={handleMarkAllAsRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            </>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="hidden sm:block sm:h-6 sm:w-px sm:bg-gray-200 dark:sm:bg-gray-700" aria-hidden="true" />

                    {/* Profile & Logout */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span
                            onClick={() => onNavigate('Settings')}
                            className="flex items-center relative group cursor-pointer"
                        >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 blur opacity-0 group-hover:opacity-75 transition duration-200"></span>
                            {profile.profile_image ? (
                                <img
                                    className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gray-50 object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                    src={profile.profile_image}
                                    alt={profile.name || 'Admin'}
                                />
                            ) : (
                                <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md">
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        {getInitials(profile.name)}
                                    </span>
                                </div>
                            )}
                        </span>
                        <button
                            onClick={onLogout}
                            className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
