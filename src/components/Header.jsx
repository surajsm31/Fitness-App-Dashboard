import React, { useState } from 'react';
import { Bell, Menu, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onMenuClick, onLogout, onNavigate }) => {
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock Notification Data
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New User Signup', message: 'Sarah Connor joined as a Pro member.', time: '2 min ago', type: 'success', read: false },
        { id: 2, title: 'Payment Received', message: 'Received ₹1499 from John Doe.', time: '1 hour ago', type: 'success', read: false },
        { id: 3, title: 'System Update', message: 'Dashboard v2.0 is now live with enhanced UI.', time: '5 hours ago', type: 'info', read: false },
        { id: 4, title: 'Subscription Cancelled', message: 'User Mike Ross cancelled their subscription.', time: '1 day ago', type: 'warning', read: true },
        { id: 5, title: 'Server Load High', message: 'CPU usage exceeded 80% for 5 mins.', time: '2 days ago', type: 'error', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleClearAll = () => {
        setNotifications([]);
        setShowNotifications(false);
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

                    <div className="relative flex items-center">
                        <button
                            type="button"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="flex items-center justify-center p-1.5 sm:p-2.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors bg-gray-50/50 dark:bg-gray-800/50 rounded-full hover:bg-white dark:hover:bg-gray-700 shadow-sm relative group"
                        >
                            <span className="sr-only">View notifications</span>
                            <Bell className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${unreadCount > 0 ? 'group-hover:animate-swing' : ''}`} aria-hidden="true" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                            )}
                        </button>

                        {showNotifications && (
                            <NotificationDropdown
                                notifications={notifications}
                                onMarkRead={handleMarkRead}
                                onClearAll={handleClearAll}
                                onClose={() => setShowNotifications(false)}
                            />
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
                            <img
                                className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gray-50 object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt=""
                            />
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
