import React from 'react';
import { X, Check, Zap, Crown, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    tokensUsed: number;
    tokensLimit: number;
    onSelectFree?: () => void;
}

const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({
    isOpen,
    onClose,
    tokensUsed,
    tokensLimit,
    onSelectFree,
}) => {
    const plans = [
        {
            name: 'Free',
            price: 0,
            period: 'forever',
            icon: Zap,
            color: 'gray',
            features: [
                '200 AI Tokens/month',
                'Basic AI Models (Groq, Deepseek)',
                'Community Support',
                '7-day Chat History',
                'Builder & Tutor Mode',
            ],
            buttonText: 'Current Plan',
            disabled: true,
        },
        {
            name: 'Premium',
            price: 3,
            period: 'month',
            icon: Crown,
            color: 'purple',
            popular: true,
            features: [
                'Unlimited AI Tokens',
                'All AI Models (GPT-4o, Gemini, Kimi K2)',
                'Priority Support',
                'Unlimited Chat History',
                'Advanced Code Generation',
                'Export Projects',
                'Agentic Planning',
            ],
            buttonText: 'Upgrade to Premium',
            disabled: false,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            {/* Header */}
                            <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 p-6 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Token Limit Reached</h2>
                                    <p className="text-gray-400 mt-1">
                                        You've used {tokensUsed} of {tokensLimit} free tokens. Upgrade to continue using AI features.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            {/* Usage Bar */}
                            <div className="px-6 pt-6 space-y-3">
                                <div className="bg-[#151515] rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-400">Token Usage</span>
                                        <span className="text-sm font-bold text-white">
                                            {tokensUsed} / {tokensLimit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((tokensUsed / tokensLimit) * 100, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                        />
                                    </div>
                                </div>

                                {onSelectFree && (
                                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-amber-200 text-sm font-medium">
                                            <Zap size={16} className="text-amber-300" />
                                            Free fallback available: switch to Llama 3 (Groq)
                                        </div>
                                        <div className="text-xs text-amber-100/80">
                                            Continue for free with Llama 3. GPT-4o will resume after you upgrade.
                                        </div>
                                        <button
                                            onClick={onSelectFree}
                                            className="w-full md:w-auto px-3 py-2 rounded-lg bg-amber-400 text-black text-sm font-semibold hover:bg-amber-300 transition-colors"
                                        >
                                            Use Free Plan (Llama 3)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pricing Cards */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {plans.map((plan) => {
                                    const Icon = plan.icon;
                                    const isPopular = plan.popular;

                                    return (
                                        <div
                                            key={plan.name}
                                            className={`relative p-6 rounded-xl border flex flex-col ${isPopular
                                                    ? 'bg-[#111] border-purple-500/50 shadow-2xl shadow-purple-900/20'
                                                    : 'bg-[#0A0A0A] border-white/10'
                                                }`}
                                        >
                                            {isPopular && (
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                                    Most Popular
                                                </div>
                                            )}

                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon className={`w-5 h-5 text-${plan.color}-400`} />
                                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold text-white">
                                                        {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                                                    </span>
                                                    {plan.period && (
                                                        <span className="text-sm text-gray-500">/{plan.period}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <ul className="space-y-3 mb-6 flex-1">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                        <Check
                                                            className={`w-4 h-4 mt-0.5 shrink-0 ${isPopular ? 'text-purple-400' : 'text-gray-400'
                                                                }`}
                                                        />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                disabled={plan.disabled}
                                                className={`w-full py-3 rounded-lg font-medium transition-all ${plan.disabled
                                                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                        : isPopular
                                                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/25'
                                                            : 'border border-white/20 text-white hover:bg-white hover:text-black'
                                                    }`}
                                            >
                                                {plan.buttonText}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-white/10 p-6 text-center">
                                <p className="text-sm text-gray-400">
                                    Need help choosing? {' '}
                                    <a href="/pricing" className="text-purple-400 hover:text-purple-300 underline">
                                        Compare all plans
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SubscriptionPopup;
