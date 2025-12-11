import React from 'react';
import { Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenBadgeProps {
    tokensUsed: number;
    tokensLimit: number;
    isSubscribed: boolean;
    compact?: boolean;
}

const TokenBadge: React.FC<TokenBadgeProps> = ({
    tokensUsed,
    tokensLimit,
    isSubscribed,
    compact = false,
}) => {
    const tokensRemaining = Math.max(0, tokensLimit - tokensUsed);
    const percentage = Math.min((tokensUsed / tokensLimit) * 100, 100);

    // Determine color based on usage
    const getColor = () => {
        if (isSubscribed) return 'purple';
        if (percentage >= 90) return 'red';
        if (percentage >= 70) return 'orange';
        return 'green';
    };

    const color = getColor();

    const colorClasses = {
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        red: 'bg-red-500/10 text-red-400 border-red-500/30',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        green: 'bg-green-500/10 text-green-400 border-green-500/30',
    };

    if (compact) {
        return (
            <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${colorClasses[color]}`}
            >
                {isSubscribed ? (
                    <>
                        <Crown className="w-3 h-3" />
                        <span>Pro</span>
                    </>
                ) : (
                    <>
                        <Zap className="w-3 h-3" />
                        <span>{tokensRemaining}</span>
                    </>
                )}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses[color]}`}
        >
            {isSubscribed ? (
                <>
                    <Crown className="w-4 h-4" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">Pro Plan</span>
                        <span className="text-[10px] opacity-70">Unlimited Tokens</span>
                    </div>
                </>
            ) : (
                <>
                    <Zap className="w-4 h-4" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">
                            {tokensRemaining} / {tokensLimit}
                        </span>
                        <span className="text-[10px] opacity-70">Tokens Remaining</span>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default TokenBadge;
