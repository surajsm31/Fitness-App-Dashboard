import React from 'react';
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react';

const Profile = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-primary to-purple-600"></div>

                <div className="px-6 pb-6">
                    <div className="relative flex items-end -mt-12 mb-6">
                        <div className="relative">
                            <img
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Profile"
                            />
                            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full hover:bg-indigo-700 border-2 border-white dark:border-gray-800">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="ml-4 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">John Doe</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pro Member</p>
                        </div>
                    </div>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        defaultValue="John Doe"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        defaultValue="john.doe@example.com"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        defaultValue="+1 (555) 000-0000"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        defaultValue="New York, USA"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
