import React, { useState } from 'react';
import { X, Check, Zap, Crown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/lib/authContext';

declare global {
    interface Window {
        snap: {
            pay: (token: string, options: {
                onSuccess?: (result: any) => void;
                onPending?: (result: any) => void;
                onError?: (result: any) => void;
                onClose?: () => void;
            }) => void;
        };
    }
}

interface SubscriptionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    tokensUsed: number;
    tokensLimit: number;
    onSelectFree?: () => void;
    title?: string;
    description?: string;
}

const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({
    isOpen,
    onClose,
    tokensUsed,
    tokensLimit,
    onSelectFree,
    title = "Upgrade to Pro",
    description,
}) => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleUpgrade = async () => {
        if (!user) {
            setError('Please sign in to upgrade');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/payment/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.emailAddresses[0]?.emailAddress || '',
                    userName: user.fullName || user.firstName || 'User',
                    plan: 'pro',
                    amount: 50000,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            const { token, orderId } = await response.json();

            if (window.snap) {
                window.snap.pay(token, {
                    onSuccess: async (result) => {
                        console.log('Payment success:', result);
                        await fetch('/api/payment/activate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, orderId }),
                        });
                        setLoading(false);
                        setShowSuccess(true);
                    },
                    onPending: (result) => {
                        console.log('Payment pending:', result);
                        setError('Payment pending. Please complete your payment.');
                    },
                    onError: (result) => {
                        console.error('Payment error:', result);
                        setError('Payment failed. Please try again.');
                    },
                    onClose: () => {
                        setLoading(false);
                    },
                });
            } else {
                throw new Error('Midtrans Snap not loaded');
            }
        } catch (err) {
            console.error('Upgrade error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start payment');
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        onClose();
        window.location.reload();
    };

    const plans = [
        {
            name: 'Free',
            price: 0,
            period: 'forever',
            icon: Zap,
            features: [
                '150 AI Tokens/month',
                'Gemini Flash Lite Model',
                '2x Canvas AI Analyze/month',
                '7-day Chat History',
                'Builder & Tutor Mode',
            ],
            buttonText: 'Current Plan',
            disabled: true,
            onClick: undefined as (() => void) | undefined,
        },
        {
            name: 'Pro',
            price: 3,
            period: 'month',
            icon: Crown,
            popular: true,
            features: [
                'Unlimited AI Tokens',
                'All Premium AI Models',
                'Unlimited Canvas AI Analyze',
                'Unlimited Chat History',
                'Priority Support',
                'Advanced Code Generation',
                'Export Projects',
            ],
            buttonText: loading ? 'Processing...' : 'Upgrade to Pro',
            disabled: loading,
            onClick: handleUpgrade,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={showSuccess ? handleSuccessClose : onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    >
                        {showSuccess ? (
                            <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm sm:max-w-lg p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden mx-auto">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

                                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">Welcome to Nevra Pro!</h2>
                                <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">Your account has been successfully upgraded. You now have access to:</p>

                                <div className="space-y-3 mb-8 text-left max-w-[280px] mx-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                                        </div>
                                        <span className="text-sm sm:text-base text-zinc-700 font-medium">Unlimited AI Tokens</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                                        </div>
                                        <span className="text-sm sm:text-base text-zinc-700 font-medium">GPT-4o, Claude 3.5 & More</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                                        </div>
                                        <span className="text-sm sm:text-base text-zinc-700 font-medium">Unlimited Canvas Analyze</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                                        </div>
                                        <span className="text-sm sm:text-base text-zinc-700 font-medium">Priority Support</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSuccessClose}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base"
                                >
                                    Start Creating with Pro
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                                <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 sm:p-6 flex items-start justify-between z-10 shrink-0">
                                    <div className="pr-8">
                                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{title}</h2>
                                        <p className="text-sm sm:text-base text-zinc-500 mt-1 line-clamp-2">
                                            {description || 'Unlock premium features and unlimited AI access'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 -mt-2 hover:bg-zinc-100 rounded-lg transition-colors shrink-0"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
                                    </button>
                                </div>

                                {error && (
                                    <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto">
                                    {plans.map((plan) => {
                                        const Icon = plan.icon;
                                        const isPopular = 'popular' in plan && plan.popular;

                                        return (
                                            <div
                                                key={plan.name}
                                                className={`relative p-5 sm:p-6 rounded-xl border flex flex-col ${isPopular
                                                    ? 'bg-gradient-to-b from-purple-50 to-white border-purple-200 shadow-xl shadow-purple-500/10'
                                                    : 'bg-white border-zinc-200'
                                                    }`}
                                            >
                                                {isPopular && (
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
                                                        RECOMMENDED
                                                    </div>
                                                )}

                                                <div className="mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon className={`w-5 h-5 ${isPopular ? 'text-purple-600' : 'text-zinc-500'}`} />
                                                        <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl sm:text-3xl font-bold text-zinc-900">${plan.price}</span>
                                                        <span className="text-sm text-zinc-500">/{plan.period}</span>
                                                    </div>
                                                </div>

                                                <ul className="space-y-2.5 sm:space-y-3 mb-6 flex-1">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                                            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? 'text-purple-600' : 'text-zinc-400'}`} />
                                                            <span className="leading-snug">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    disabled={plan.disabled}
                                                    onClick={plan.onClick}
                                                    className={`w-full py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${plan.disabled
                                                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                                        : isPopular
                                                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/25 active:scale-[0.98]'
                                                            : 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50 active:scale-[0.98]'
                                                        }`}
                                                >
                                                    {loading && plan.name === 'Pro' && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    {plan.buttonText}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-zinc-200 p-4 text-center shrink-0">
                                    <p className="text-[10px] sm:text-xs text-zinc-400">Secure payment powered by Midtrans • Cancel anytime</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SubscriptionPopup;
