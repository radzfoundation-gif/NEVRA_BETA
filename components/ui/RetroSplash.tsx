import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RetroSplash({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);

    // Sequence:
    // 0: Initial blink
    // 1: Typing System Name
    // 2: Loading Bar
    // 3: Access Granted -> Exit

    useEffect(() => {
        // Step 0 -> 1
        const timer1 = setTimeout(() => setStep(1), 500);

        // Step 1 -> 2 (After typing animation)
        const timer2 = setTimeout(() => setStep(2), 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    // Progress Bar Simulation
    useEffect(() => {
        if (step === 2) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep(3), 500); // Wait bit before success
                        return 100;
                    }
                    // Random increments for realism
                    return prev + Math.floor(Math.random() * 15) + 1;
                });
            }, 150);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Completion
    useEffect(() => {
        if (step === 3) {
            const timer = setTimeout(() => {
                onComplete();
            }, 1000); // Show "Access Granted" for 1s
            return () => clearTimeout(timer);
        }
    }, [step, onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center font-mono overflow-hidden">
            {/* Retro CRT Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: '100% 2px, 3px 100%' }} />
            <div className="absolute inset-0 pointer-events-none z-20 animate-flicker bg-white/5 opacity-[0.02]" />

            <div className="relative z-30 w-full max-w-md px-8">
                <div className="flex flex-col items-center gap-8">

                    {/* Logo / Title Area */}
                    <div className="flex flex-col items-center gap-4">
                        {/* Simple ASCII-like or Geometric Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-16 h-16 border-2 border-zinc-800 flex items-center justify-center rounded-sm relative"
                        >
                            <div className="w-10 h-10 bg-zinc-900 border border-zinc-700/50" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/20" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white/20" />
                        </motion.div>

                        <div className="h-8 flex items-center">
                            {step >= 1 && (
                                <Typewriter
                                    text="NOIR INTELLIGENCE"
                                    speed={50}
                                    className="text-xl font-bold tracking-[0.2em] text-zinc-100"
                                />
                            )}
                        </div>
                    </div>

                    {/* Status Lines */}
                    <div className="w-full text-xs text-zinc-500 space-y-1 h-12 flex flex-col justify-end">
                        {step >= 1 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>SYST: INITIALIZING CORE...</motion.div>}
                        {step >= 2 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>MEM: ALLOCATING NEURAL BLOCKS...</motion.div>}
                        {step >= 2 && progress > 50 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>NET: ESTABLISHING SECURE UPLINK...</motion.div>}
                    </div>

                    {/* Progress Bar */}
                    {step >= 2 && (
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute left-0 top-0 bottom-0 bg-zinc-100"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
                            />
                        </div>
                    )}

                    {/* Final Status */}
                    <div className="h-6 flex items-center justify-center">
                        {step === 3 && (
                            <motion.span
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-white text-xs font-semibold tracking-widest uppercase border border-white/20 px-3 py-1 bg-white/5"
                            >
                                Access Granted
                            </motion.span>
                        )}
                    </div>

                </div>
            </div>

            <div className="absolute bottom-8 text-[10px] text-zinc-700 tracking-widest font-mono opacity-50">
                v2.0.4 // SYSTEM READY
            </div>
        </div>
    );
}

// Simple internal typewriter component
const Typewriter = ({ text, speed, className }: { text: string, speed: number, className?: string }) => {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayed(prev => text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <span className={className}>
            {displayed}
            <span className="animate-pulse ml-1 opacity-70">_</span>
        </span>
    );
};
