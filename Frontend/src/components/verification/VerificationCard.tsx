'use client';

import React from 'react';
import { CheckCircle2, Circle, LucideIcon } from 'lucide-react';

interface VerificationCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    isVerified: boolean;
    isActive?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
    title,
    description,
    icon: Icon,
    isVerified,
    isActive = false,
    children,
    className = '',
}) => {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${isVerified
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                    : isActive
                        ? 'border-brand-200 bg-white shadow-lg shadow-brand-500/10 dark:border-brand-800 dark:bg-slate-800'
                        : 'border-gray-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50'
                } ${className}`}
        >
            {/* Background Pattern */}
            {isActive && !isVerified && (
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/5 blur-3xl" />
            )}

            <div className="relative p-6 sm:p-8">
                <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${isVerified
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : isActive
                                    ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                    >
                        <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h3
                                className={`text-lg font-bold transition-colors ${isVerified
                                        ? 'text-green-900 dark:text-green-100'
                                        : isActive
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-slate-400'
                                    }`}
                            >
                                {title}
                            </h3>
                            {isVerified ? (
                                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Verificado
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                                    <Circle className="h-3.5 w-3.5" />
                                    Pendiente
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-lg">
                            {description}
                        </p>

                        {/* Content Area */}
                        <div className={`mt-6 transition-all duration-500 ${isActive || isVerified ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'
                            }`}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
