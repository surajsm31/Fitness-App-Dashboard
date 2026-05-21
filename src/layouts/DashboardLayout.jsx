import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="lg:pl-64 flex flex-col h-screen max-w-full overflow-hidden">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onLogout={onLogout}
                />

                <main className="flex-1 py-8 overflow-y-auto overflow-x-hidden">
                    <div className="px-4 sm:px-6 lg:px-8 max-w-full pb-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
