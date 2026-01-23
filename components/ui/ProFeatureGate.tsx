import React from 'react';
import { useTokenLimit } from '@/hooks/useTokenLimit';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProFeatureGateProps {
    children: React.ReactNode;
    feature: string;
    fallback?: React.ReactNode;
    showBlur?: boolean;
}

/**
 * Component to gate Pro-only features
 * Shows upgrade prompt for free users
 */
export function ProFeatureGate({
    children,
    feature,
    fallback,
    showBlur = true
}: ProFeatureGateProps) {
    const { isSubscribed, loading } = useTokenLimit();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!isSubscribed) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="relative">
                {showBlur && (
                    <div className="blur-sm pointer-events-none opacity-50">
                        {children}
                    </div>
                )}
                <div className={`${showBlur ? 'absolute inset-0' : ''} flex items-center justify-center p-4`}>
                    <div className="bg-black/90 backdrop-blur-xl px-8 py-6 rounded-2xl border border-purple-500/50 shadow-2xl shadow-purple-500/20 max-w-md w-full">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-purple-600/20 rounded-full">
                                <Lock className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            Pro Feature
                        </h3>
                        <p className="text-gray-400 text-center mb-6">
                            Upgrade to <span className="text-blue-400 font-semibold">Noir Pro</span> to unlock {feature}
                        </p>
                        <div className="space-y-3 mb-6 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-purple-400" />
                                <span>Unlimited AI tokens</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-purple-400" />
                                <span>All AI models (GPT-4o, Claude, Gemini)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-purple-400" />
                                <span>Advanced features & priority support</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Inline Pro badge component
 */
export function ProBadge({ className = '' }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full ${className}`}>
            <Crown className="w-3 h-3" />
            PRO
        </div>
    );
}

/**
 * Pro status indicator for navbar/header
 */
export function ProStatusIndicator() {
    const { isSubscribed, loading } = useTokenLimit();
    const navigate = useNavigate();

    if (loading) return null;

    if (isSubscribed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">Pro</span>
            </div>
        );
    }

    return (
        <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25"
        >
            Upgrade to Pro
        </button>
    );
}
