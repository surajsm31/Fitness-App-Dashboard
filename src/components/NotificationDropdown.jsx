import React, { useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

const NotificationDropdown = ({ notifications, onMarkRead, onClearAll, onClose }) => {
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
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="ml-2 bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
                            {notifications.filter(n => !n.read).length} New
                        </span>
                    )}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={onClearAll}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Clear all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1">No new notifications.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`group relative p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {notification.time}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkRead(notification.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-primary hover:text-indigo-600 transition-all p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                                            title="Mark as read"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={() => notifications.forEach(n => !n.read && onMarkRead(n.id))}
                        className="w-full py-2 text-xs font-medium text-primary hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
