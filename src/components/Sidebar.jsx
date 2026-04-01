import React from 'react';
import { LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, X, Activity, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Users', icon: Users },
    { label: 'Subscriptions', icon: CreditCard },
    { label: 'Workouts', icon: FileText },
    { label: 'Nutrition', icon: FileText },
    { label: 'BMI Class', icon: Activity },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose, currentView, onNavigate }) => {
    const { theme } = useTheme();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-200",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 z-30 h-full w-64 border-r border-gray-200/50 dark:border-gray-700/50 transition-transform duration-300 ease-in-out lg:translate-x-0",
                    "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl lg:shadow-none",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        <Activity className="w-6 h-6 text-primary" />
                        <span>FitTrack</span>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                onNavigate(item.label);
                                onClose();
                            }}
                            className={clsx(
                                "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden",
                                currentView === item.label
                                    ? "text-white shadow-lg shadow-indigo-500/30"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100"
                            )}
                        >
                            {currentView === item.label && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 rounded-xl" />
                            )}
                            <item.icon className={clsx("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", currentView === item.label ? "text-white" : "")} />
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50">
                    <div 
                        onClick={() => {
                            onNavigate('Settings');
                            onClose();
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                                ℳ𝒮
                            </div>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 opacity-0 group-hover:opacity-75 transition duration-200 blur-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Suraj More</p>
                            <p className="text-xs text-primary dark:text-indigo-400 font-medium truncate">Pro Member</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
