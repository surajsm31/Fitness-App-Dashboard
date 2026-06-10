import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, X, Activity, CreditCard, Quote, ChevronDown, Dumbbell, Compass } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Users', icon: Users, path: '/users' },
    { label: 'Subscriptions', icon: CreditCard, path: '/subscriptions' },
    { 
        label: 'Workouts', 
        icon: FileText,
        isDropdown: true,
        dropdownItems: [
            { label: 'Workout', icon: Dumbbell, path: '/workouts' },
            { label: 'Explore Activities', icon: Compass, path: '/explore-activities' }
        ]
    },
    { label: 'Nutrition', icon: FileText, path: '/nutrition' },
    { label: 'BMI Class', icon: Activity, path: '/bmi-class' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Quotes', icon: Quote, path: '/quotes' },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const { profile, loading: profileLoading } = useProfile();
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const dropdownRef = useRef(null);
    const location = useLocation();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(null);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Function to get initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    };

    return (
        <>
            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? '#4B5563' : '#D1D5DB'};
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${theme === 'dark' ? '#6B7280' : '#9CA3AF'};
                }
            `}</style>
            
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
                    "fixed top-0 left-0 z-30 h-full w-64 border-r border-white/20 dark:border-white/10 transition-transform duration-300 ease-in-out lg:translate-x-0",
                    "bg-white/45 dark:bg-slate-950/35 backdrop-blur-md shadow-2xl lg:shadow-none flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 dark:border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2 font-black text-xl">
                        <Activity className="w-6 h-6 text-amber-500 animate-pulse" />
                        <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">FitTrack</span>
                    </div>
                </div>

                {/* Scrollable Navigation */}
                <nav 
                    className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: theme === 'dark' ? '#4B5563 transparent' : '#D1D5DB transparent'
                    }}
                >
                    {NAV_ITEMS.map((item) => (
                        <div key={item.label} className="relative" ref={item.isDropdown ? dropdownRef : null}>
                            {item.isDropdown ? (
                                // Dropdown menu item
                                <div>
                                    <button
                                        onClick={() => setDropdownOpen(dropdownOpen === item.label ? null : item.label)}
                                        className={clsx(
                                            "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden",
                                            item.dropdownItems.some(d => d.path === location.pathname)
                                                ? "text-slate-950 font-bold shadow-lg shadow-amber-500/10"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400"
                                        )}
                                    >
                                        {item.dropdownItems.some(d => d.path === location.pathname) && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl" />
                                        )}
                                        <item.icon className={clsx("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", item.dropdownItems.some(d => d.path === location.pathname) ? "text-slate-950" : "")} />
                                        <span className="relative z-10 flex-1 text-left">{item.label}</span>
                                        <ChevronDown className={clsx("w-4 h-4 relative z-10 transition-transform", dropdownOpen === item.label ? "rotate-180" : "", item.dropdownItems.some(d => d.path === location.pathname) ? "text-slate-950" : "")} />
                                    </button>
                                    
                                    {/* Dropdown menu */}
                                    {dropdownOpen === item.label && (
                                        <div 
                                            className="absolute top-full left-0 right-0 mt-1 bg-white/90 dark:bg-slate-950/80 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            {item.dropdownItems.map((dropdownItem) => (
                                                <NavLink
                                                    key={dropdownItem.label}
                                                    to={dropdownItem.path}
                                                    onClick={() => {
                                                        onClose();
                                                        setDropdownOpen(null);
                                                    }}
                                                    className={({ isActive }) => clsx(
                                                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                                                        isActive
                                                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400"
                                                    )}
                                                >
                                                    <dropdownItem.icon className="w-4 h-4 relative z-10" />
                                                    <span className="relative z-10">{dropdownItem.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Regular menu item
                                <NavLink
                                    to={item.path}
                                    onClick={onClose}
                                    className={({ isActive }) => clsx(
                                        "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden",
                                        isActive
                                            ? "text-slate-950 font-bold shadow-lg shadow-amber-500/10"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400"
                                    )}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl" />
                                            )}
                                            <item.icon className={clsx("w-5 h-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "text-slate-950" : "")} />
                                            <span className="relative z-10">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Profile Section - Fixed at bottom */}
                <div className="flex-shrink-0 p-4 border-t border-white/20 dark:border-white/10 bg-gradient-to-t from-white/10 to-transparent dark:from-white/5">
                    <NavLink 
                        to="/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors cursor-pointer group"
                    >
                        <div className="relative">
                            {profile.profile_image ? (
                                <img
                                    src={profile.profile_image}
                                    alt={profile.name || 'Admin'}
                                    className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white dark:ring-gray-800"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                                    {getInitials(profile.name)}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 opacity-0 group-hover:opacity-75 transition duration-200 blur-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {profileLoading ? 'Loading...' : (profile.name || 'Admin')}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold truncate">
                                {profileLoading ? 'Loading...' : 'Administrator'}
                            </p>
                        </div>
                    </NavLink>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
