import React from 'react';
import clsx from 'clsx';

const Shimmer = ({ className }) => (
    <div className={clsx("animate-pulse bg-gray-200 dark:bg-gray-700 rounded", className)} />
);

export const SkeletonStatsCard = () => {
    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="w-full">
                    <Shimmer className="h-4 w-24 mb-2" />
                    <Shimmer className="h-8 w-16" />
                </div>
                <Shimmer className="h-12 w-12 rounded-lg" />
            </div>
            <div className="mt-4 flex items-center">
                <Shimmer className="h-4 w-32" />
            </div>
        </div>
    );
};

export const SkeletonChart = ({ height = "h-[300px]" }) => {
    return (
        <div className={clsx("w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700", height)}>
            <Shimmer className="h-6 w-48 mb-6" />
            <div className="space-y-4">
                <div className="flex items-end justify-between gap-2 h-[200px]">
                    {[...Array(7)].map((_, i) => (
                        <Shimmer key={i} className={clsx("w-full rounded-t", `h-[${Math.floor(Math.random() * 80 + 20)}%]`)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SkeletonBMICard = () => {
    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    <Shimmer className="h-4 w-24" />
                    <Shimmer className="h-10 w-20" />
                </div>
                <Shimmer className="h-10 w-10 rounded-lg" />
            </div>
            <Shimmer className="h-4 w-full mt-8" />
            <Shimmer className="h-2 w-full mt-4 rounded-full" />
        </div>
    );
};
