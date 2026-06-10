import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = ({ children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme } = useTheme();

    return (
        <div className="relative h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Shared Background Image for entire dashboard layout (Sidebar + Header + Content) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <img 
                    src={theme === 'dark' 
                        ? "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
                        : "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2070&auto=format&fit=crop"
                    } 
                    alt="Fitness Background" 
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out scale-105"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                {/* Backdrop Filters for glassmorphism layout - subtle tint so background image shows clearly */}
                <div className="absolute inset-0 bg-slate-50/35 dark:bg-slate-950/50 backdrop-blur-[2px] transition-all duration-300"></div>
                
                {/* Subtle Theme Glow Overlay - Matches Login Page Sunset Glows */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-amber-950/10 dark:from-amber-500/10 dark:via-transparent dark:to-orange-500/5"></div>
                
                {/* Glow Effects - Integrated with natural sunset glow */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] lg:top-20 lg:left-20 lg:w-[450px] lg:h-[450px] lg:blur-[130px] opacity-70"></div>
                    <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-400/5 rounded-full blur-[90px] lg:bottom-20 lg:right-20 lg:w-[400px] lg:h-[400px] lg:blur-[120px] opacity-70"></div>
                </div>
            </div>

            <div className="relative z-10 flex h-full">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="flex-1 lg:pl-64 flex flex-col h-screen max-w-full overflow-hidden">
                    <Header
                        onMenuClick={() => setSidebarOpen(true)}
                        onLogout={onLogout}
                    />

                    <main className="flex-1 py-8 overflow-y-auto overflow-x-hidden relative">
                        <div className="px-4 sm:px-6 lg:px-8 max-w-full pb-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
