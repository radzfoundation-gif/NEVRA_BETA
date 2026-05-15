import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ImageGenLoadingProps {
    type?: 'image' | 'video';
}

const GRID_CELLS = Array.from({ length: 9 });

const ImageGenLoading = ({ type = 'image' }: ImageGenLoadingProps) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-start p-2 mt-2 mb-4 w-full">
            <div className="flex items-center gap-3 mb-3">
                <div className="grid grid-cols-3 gap-[2px] rounded-[6px] bg-white/80 px-1.5 py-1 ring-1 ring-orange-200/70 dark:bg-zinc-950/70 dark:ring-orange-500/20">
                    {GRID_CELLS.map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-1 w-1 rounded-[1px] bg-orange-500"
                            animate={{ opacity: [0.24, 1, 0.34], scale: [0.82, 1.08, 0.92] }}
                            transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.055, ease: [0.4, 0, 0.2, 1] }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <motion.p 
                        className="text-[14px] font-medium bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent"
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        style={{ backgroundSize: '200% auto' }}
                    >
                        {type === 'video' ? 'Crafting your video...' : 'Dreaming up your image...'}
                    </motion.p>
                </div>
            </div>

            <motion.div 
                className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Smooth Floating Fluid Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute -top-10 -left-10 w-48 h-48 bg-purple-500/40 dark:bg-purple-500/20 rounded-full blur-3xl"
                        animate={{
                            x: [0, 50, -20, 0],
                            y: [0, 40, -10, 0],
                            scale: [1, 1.2, 0.9, 1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-0 -right-10 w-56 h-56 bg-pink-500/30 dark:bg-pink-500/10 rounded-full blur-3xl"
                        animate={{
                            x: [0, -50, 20, 0],
                            y: [0, 50, -20, 0],
                            scale: [1, 0.9, 1.2, 1]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    <motion.div
                        className="absolute -bottom-10 left-10 w-56 h-56 bg-blue-500/30 dark:bg-blue-500/10 rounded-full blur-3xl"
                        animate={{
                            x: [0, 30, -50, 0],
                            y: [0, -50, 20, 0],
                            scale: [1, 1.1, 0.8, 1]
                        }}
                        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
                </div>

                {/* Shimmer sweep */}
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent skew-x-12"
                    initial={{ x: '-150%' }}
                    animate={{ x: '150%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                />

                {/* Sharp Moving Particles */}
                {[...Array(25)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] dark:shadow-[0_0_8px_rgba(168,85,247,0.8)] dark:bg-purple-200"
                        style={{
                            width: Math.random() * 3 + 1.5,
                            height: Math.random() * 3 + 1.5,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -(Math.random() * 120 + 40)], // Float upwards
                            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20], // Drift sideways
                            opacity: [0, 0.9, 0], // Fade in and out
                            scale: [0, Math.random() * 1.5 + 0.5, 0] // Grow and shrink
                        }}
                        transition={{
                            duration: 2 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 3
                        }}
                    />
                ))}


            </motion.div>

            {/* Styled Timer Below Loading */}
            <motion.div 
                className="mt-4 flex items-center justify-center w-64 sm:w-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/50 shadow-sm backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-mono text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-widest">
                        {formatTime(elapsedTime)}
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default ImageGenLoading;
