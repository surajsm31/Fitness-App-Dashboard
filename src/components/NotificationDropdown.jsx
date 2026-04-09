import React, { useRef, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const NotificationDropdown = ({ notifications, onMarkRead, onMarkAllAsRead, onClose }) => {
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 xs:w-5 xs:h-5 text-amber-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 xs:w-5 xs:h-5 text-red-500" />;
            default: return <Info className="w-4 h-4 xs:w-5 xs:h-5 text-blue-500" />;
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="fixed left-1 right-1 top-12 xs:left-0 xs:right-0 xs:top-11 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-0.5rem)] xs:w-[calc(100vw-0.25rem)] sm:w-80 md:w-96 lg:w-[28rem] xl:w-[32rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-3rem)] xs:max-h-[calc(100vh-2.5rem)] sm:max-h-[32rem]"
        >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="ml-2 bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
                            {notifications.filter(n => !n.is_read).length} New
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={() => {
                                console.log('Mark all as read button clicked');
                                console.log('Current notifications:', notifications);
                                onMarkAllAsRead();
                            }}
                            className="text-xs font-medium text-primary hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Mark all as read"
                        >
                            Mark all as read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto h-full max-h-[calc(100vh-8rem)] xs:max-h-[calc(100vh-6rem)] sm:max-h-[28rem] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                {notifications.length === 0 ? (
                    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-2 xs:mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-xs xs:text-xs sm:text-sm font-medium">All caught up!</p>
                        <p className="text-xs xs:text-xs sm:text-xs mt-1">No new notifications.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <li key={notification.id} className="relative group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="flex gap-3 p-2.5 xs:p-3 sm:p-4">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5 xs:space-y-1">
                                        <p className={`text-[11px] xs:text-[10px] sm:text-xs font-medium leading-tight ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-[11px] xs:text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-1 xs:line-clamp-1 sm:line-clamp-2">
                                            {notification.message}
                                        </p>
                                        {notification.username && (
                                            <p className="text-[11px] xs:text-[9px] sm:text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                                From: {notification.username}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-[8px] xs:text-[8px] sm:text-[10px] text-gray-400 leading-tight">
                                                {notification.time}
                                            </p>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMarkRead(notification.id);
                                                    }}
                                                    className="text-[11px] xs:text-[10px] sm:text-xs text-primary hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkRead(notification.id);
                                        }}
                                        className="opacity-75 hover:opacity-100 absolute top-1.5 xs:top-1.5 sm:top-2.5 right-1.5 xs:right-1.5 sm:right-2.5 text-primary hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all p-0.5 xs:p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md"
                                        title="Mark as read"
                                    >
                                        <Check className="w-2 h-2 xs:w-3 xs:h-3 sm:w-3 sm:h-3" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

                        
            {/* Debug: Show notification count */}
            {process.env.NODE_ENV === 'development' && (
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                    Debug: {notifications.length} notifications ({notifications.filter(n => !n.is_read).length} unread)
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
