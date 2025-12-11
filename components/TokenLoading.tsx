import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenLoadingProps {
    tokensUsed: number;
    tokensLimit: number;
    isSubscribed: boolean;
    message?: string;
}

const TokenLoading: React.FC<TokenLoadingProps> = ({
    tokensUsed,
    tokensLimit,
    isSubscribed,
    message = 'AI is thinking...',
}) => {
    const tokensRemaining = Math.max(0, tokensLimit - tokensUsed);
    const percentage = Math.min((tokensUsed / tokensLimit) * 100, 100);

    return (
        <div className="flex flex-col gap-3 p-4 bg-[#0A0A0A] border border-white/10 rounded-xl">
            {/* Loading Animation */}
            <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                <span className="text-sm text-gray-300">{message}</span>
            </div>

            {/* Token Usage Display */}
            {!isSubscribed && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Token Usage</span>
                        </div>
                        <span className="font-mono font-bold text-white">
                            {tokensRemaining} / {tokensLimit} remaining
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-[#151515] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full ${percentage >= 90
                                    ? 'bg-gradient-to-r from-red-600 to-pink-600'
                                    : percentage >= 70
                                        ? 'bg-gradient-to-r from-orange-600 to-yellow-600'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600'
                                }`}
                        />
                    </div>

                    {/* Warning Message */}
                    {tokensRemaining <= 10 && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-orange-400 flex items-center gap-1"
                        >
                            <Zap className="w-3 h-3" />
                            <span>
                                {tokensRemaining === 0
                                    ? 'Token limit reached! Upgrade to continue.'
                                    : `Only ${tokensRemaining} tokens left!`}
                            </span>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Subscribed Badge */}
            {isSubscribed && (
                <div className="flex items-center gap-1.5 text-xs text-purple-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Unlimited tokens (Pro)</span>
                </div>
            )}
        </div>
    );
};

export default TokenLoading;
