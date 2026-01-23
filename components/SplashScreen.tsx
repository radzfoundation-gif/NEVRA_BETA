import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [textPhase, setTextPhase] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [showDocs, setShowDocs] = useState(false);

    useEffect(() => {
        // Sequence phases
        const phase1 = setTimeout(() => setTextPhase(1), 1000); // "Welcome"
        const phase2 = setTimeout(() => setTextPhase(2), 2500); // "Where imagination..."
        const phase3 = setTimeout(() => setTextPhase(3), 4000); // "Experience..."

        // Show controls after intro
        const controls = setTimeout(() => setShowControls(true), 5500);

        return () => {
            clearTimeout(phase1);
            clearTimeout(phase2);
            clearTimeout(phase3);
            clearTimeout(controls);
        };
    }, []);

    const handleEnter = () => {
        setIsVisible(false);
        setTimeout(onComplete, 800);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden font-sans"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                    {/* Soft Retro Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900" />

                    {/* Film Grain Texture */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none z-10"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                    />

                    {/* Dreamy Orbs */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                    <AnimatePresence mode="wait">
                        {!showDocs ? (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8 }}
                                className="relative z-30 flex flex-col items-center justify-center p-8 max-w-4xl w-full"
                            >
                                {/* Soft Glowing Logo */}
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-110" />
                                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                                        <Logo size={64} />
                                    </div>
                                </div>

                                {/* Text Container - Elegant & Soft */}
                                <div className="space-y-6 text-center min-h-[180px]">
                                    {textPhase >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                                            transition={{ duration: 1.5 }}
                                        >
                                            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 tracking-tight drop-shadow-lg">
                                                NOIR AI
                                            </h1>
                                        </motion.div>
                                    )}

                                    {textPhase >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 1 }}
                                            className="flex flex-col gap-2"
                                        >
                                            <p className="text-xl md:text-2xl text-purple-200/80 font-light tracking-wide">
                                                Imagination meets Intelligence
                                            </p>
                                        </motion.div>
                                    )}

                                    {textPhase >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 1 }}
                                            className="pt-2"
                                        >
                                            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/50">
                                                Neural Automation System
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Interactive Controls - Glassmorphism */}
                                {showControls && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1 }}
                                        className="mt-16 flex flex-col md:flex-row gap-6 z-40 items-center"
                                    >
                                        <button
                                            onClick={() => setShowDocs(true)}
                                            className="group relative px-8 py-3 rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300"
                                        >
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                                            <span className="relative text-sm font-medium text-pink-200/80 tracking-widest uppercase group-hover:text-pink-100">
                                                Read Documentation
                                            </span>
                                        </button>

                                        <button
                                            onClick={handleEnter}
                                            className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                                        >
                                            <span className="text-sm font-bold tracking-widest uppercase">
                                                Enter Experience
                                            </span>
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="docs"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5 }}
                                className="relative z-30 flex flex-col p-8 md:p-12 max-w-4xl w-full h-[80vh] bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl overflow-hidden"
                            >
                                {/* Decorative Gradient Top */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400" />

                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                                        Documentation
                                    </h2>
                                    <button
                                        onClick={() => setShowDocs(false)}
                                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-8 text-purple-100/80 font-light leading-relaxed custom-scrollbar">
                                    <section>
                                        <h3 className="text-xl font-medium text-pink-200 mb-3">Project Overview</h3>
                                        <p className="opacity-80">Noir AI is a next-generation SaaS workspace designed to harmonize human creativity with artificial intelligence.</p>
                                    </section>

                                    <section>
                                        <h3 className="text-xl font-medium text-purple-200 mb-3">Core Features</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <strong className="block text-white mb-1">AI Chat</strong>
                                                <span className="text-sm opacity-70">Advanced conversational models with context awareness.</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <strong className="block text-white mb-1">Design Studio</strong>
                                                <span className="text-sm opacity-70">Text-to-UI generation and prototyping.</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <strong className="block text-white mb-1">Canvas</strong>
                                                <span className="text-sm opacity-70">Infinite whiteboard for brainstorming.</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-xl font-medium text-cyan-200 mb-3">Current Status</h3>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                            v0.9.1 Beta (Development)
                                        </div>
                                    </section>
                                </div>

                                <div className="pt-8 mt-4 w-full flex justify-end border-t border-white/5">
                                    <button
                                        onClick={handleEnter}
                                        className="px-8 py-3 rounded-xl bg-white text-indigo-950 font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Launch Application
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
