import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGenLoadingProps {
    type?: 'image' | 'video';
}

const LETTERS = {
    N: [
        1,0,0,0,1,
        1,1,0,0,1,
        1,0,1,0,1,
        1,0,0,1,1,
        1,0,0,0,1
    ],
    O: [
        0,1,1,1,0,
        1,0,0,0,1,
        1,0,0,0,1,
        1,0,0,0,1,
        0,1,1,1,0
    ],
    I: [
        0,1,1,1,0,
        0,0,1,0,0,
        0,0,1,0,0,
        0,0,1,0,0,
        0,1,1,1,0
    ],
    R: [
        1,1,1,1,0,
        1,0,0,0,1,
        1,1,1,1,0,
        1,0,1,0,0,
        1,0,0,1,1
    ]
};

const SEQUENCE = ['N', 'O', 'I', 'R'];

const ImageGenLoading = ({ type = 'image' }: ImageGenLoadingProps) => {
    const [letterIndex, setLetterIndex] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLetterIndex((prev) => (prev + 1) % SEQUENCE.length);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

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

    const currentLetter = LETTERS[SEQUENCE[letterIndex] as keyof typeof LETTERS];

    let dotCount = 0;
    const activeDots = currentLetter.map((isActive, i) => {
        if (isActive) {
            const dot = { id: `dot-${dotCount}`, index: i, x: i % 5, y: Math.floor(i / 5) };
            dotCount++;
            return dot;
        }
        return null;
    }).filter(Boolean) as { id: string; index: number; x: number; y: number }[];

    return (
        <div className="flex flex-col items-start p-2 mt-2 mb-4 w-full">
            <div className="flex items-center gap-3 mb-3">
                {/* N-O-I-R Pixel Grid Loading */}
                <div className="relative w-[24px] h-[24px] mr-2">
                    {/* Background faint dots */}
                    {Array.from({ length: 25 }).map((_, i) => (
                        <div
                            key={`bg-${i}`}
                            className="absolute w-[4px] h-[4px] rounded-[1px] bg-purple-200/40 dark:bg-purple-900/40"
                            style={{ left: (i % 5) * 5, top: Math.floor(i / 5) * 5 }}
                        />
                    ))}

                    {/* Active morphing dots */}
                    <AnimatePresence>
                        {activeDots.map((dot) => (
                            <motion.div
                                key={dot.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                    left: dot.x * 5,
                                    top: dot.y * 5
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 150, 
                                    damping: 15,
                                    mass: 0.8
                                }}
                                className="absolute w-[4px] h-[4px] rounded-[1px] bg-purple-600 dark:bg-purple-400"
                            />
                        ))}
                    </AnimatePresence>
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
