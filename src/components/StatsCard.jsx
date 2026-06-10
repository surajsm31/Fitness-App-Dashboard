import React from 'react';
import { ArrowUp, ArrowDown, Footprints, Flame, Timer, Droplets, Users, IndianRupee, Dumbbell, Activity, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const iconMap = {
    Footprints: Footprints,
    Flame: Flame,
    Timer: Timer,
    Droplets: Droplets,
    Users: Users,
    IndianRupee: IndianRupee,
    Dumbbell: Dumbbell,
    Activity: Activity,
    AlertCircle: AlertCircle
};

const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

const StatsCard = ({ title, value, icon, color, unit }) => {
    const Icon = iconMap[icon];

    return (
        <div className="rounded-xl bg-white/45 dark:bg-white/5 backdrop-blur-md p-6 shadow-lg border border-white/20 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                        {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
                    </div>
                </div>
                <div className={clsx("p-3 rounded-lg", colorMap[color])}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
