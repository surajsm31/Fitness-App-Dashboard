import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children, currentView, onNavigate, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-full">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentView={currentView}
                onNavigate={onNavigate}
            />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onLogout={onLogout}
                    onNavigate={onNavigate}
                />

                <main className="flex-1 py-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
