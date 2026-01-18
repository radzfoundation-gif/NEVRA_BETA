import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800);
        }, 3500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="scale-150 relative z-10">
                            <Logo size={48} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="max-w-md space-y-4"
                    >
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white/50">
                            Welcome to Nevra
                        </h1>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-yellow-200/90 text-sm font-medium leading-relaxed">
                                ⚠️ Nevra is currently in <span className="text-yellow-400 font-bold">Development Stage</span> and may not be fully stable yet.
                            </p>
                        </div>

                        <p className="text-zinc-500 text-xs mt-8 animate-pulse">
                            Converting dreams to reality...
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
