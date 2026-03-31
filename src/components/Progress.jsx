import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Calendar, Target } from 'lucide-react';

const monthlyData = [
    { name: 'Week 1', weight: 82, bodyFat: 20 },
    { name: 'Week 2', weight: 81.5, bodyFat: 19.8 },
    { name: 'Week 3', weight: 81.2, bodyFat: 19.5 },
    { name: 'Week 4', weight: 80.8, bodyFat: 19.2 },
    { name: 'Week 5', weight: 80.5, bodyFat: 19.0 },
    { name: 'Week 6', weight: 80.1, bodyFat: 18.8 },
];

const Progress = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Progress</h1>

            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium opacity-90">Current Streak</p>
                            <h3 className="text-3xl font-bold mt-1">12 Days</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FlameIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium opacity-90">Total Workouts</p>
                            <h3 className="text-3xl font-bold mt-1">48</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Trophy className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium opacity-90">Weight Lost</p>
                            <h3 className="text-3xl font-bold mt-1">2.5 kg</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Target className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Weight vs Body Fat %</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="weight" stroke="#4F46E5" fillOpacity={1} fill="url(#colorWeight)" />
                            <Area type="monotone" dataKey="bodyFat" stroke="#10B981" fillOpacity={1} fill="url(#colorFat)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

/* Helper for the undefined icon in usage above */
const FlameIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.6.5 1.5.5 2.8z" />
    </svg>
);

export default Progress;
