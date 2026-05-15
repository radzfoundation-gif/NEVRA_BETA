import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function ChatSkeleton() {
    return (
        <div className="flex gap-3 md:gap-4 mb-6">
            {/* AI Avatar Skeleton with Pixel Grid */}
            <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center relative overflow-hidden shadow-lg shadow-indigo-500/20">
                    <Bot size={18} className="text-white relative z-10" />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                
                {/* Compact Pixel Grid Loader */}
                <div className="grid grid-cols-3 gap-[1.5px] w-fit rounded-[4px] bg-white/80 px-1 py-0.5 ring-1 ring-zinc-200/70">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-[3px] h-[3px] rounded-[0.5px] bg-zinc-900"
                            animate={{ opacity: [0.24, 1, 0.34], scale: [0.82, 1.08, 0.92] }}
                            transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.055, ease: [0.4, 0, 0.2, 1] }}
                        />
                    ))}
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 space-y-3 pt-1">
                <div className="flex items-center gap-2 mb-3">
                    <motion.div 
                        className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
                
                <div className="space-y-2.5">
                    <SkeletonLine width="90%" delay={0} />
                    <SkeletonLine width="75%" delay={0.1} />
                    <SkeletonLine width="85%" delay={0.2} />
                    <SkeletonLine width="40%" delay={0.3} />
                </div>
            </div>
        </div>
    );
}

function SkeletonLine({ width, delay }: { width: string; delay: number }) {
    return (
        <div className="relative h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden" style={{ width }}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-zinc-700/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay
                }}
            />
        </div>
    );
}
