import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Download, Phone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const InstallPrompt = () => {
    const { isInstallable, installApp } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Check if already standalone (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // Check local storage to see if user dismissed it recently
        const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
        const dismissedTime = lastDismissed ? parseInt(lastDismissed) : 0;
        // Show again after 3 days
        const shouldShow = Date.now() - dismissedTime > 3 * 24 * 60 * 60 * 1000;

        if (!isStandalone && shouldShow) {
            // Delay showing the prompt to not be annoying immediately
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    // Don't render if not visible or (not installable AND not iOS)
    // We want to show it on iOS too even though isInstallable is false there
    if (!isVisible || (!isInstallable && !isIOS)) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96"
                >
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xl relative overflow-hidden">
                        {/* Glossy effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-black/5 transition-colors z-10"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex gap-4 relative z-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-black to-zinc-800 flex items-center justify-center shrink-0 shadow-lg">
                                <img src="/noir-logo-v2.png" alt="App Icon" className="w-full h-full object-cover rounded-xl" />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">Install Noir AI</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                                    Add to your home screen for the best fullscreen experience and quick access.
                                </p>

                                {isIOS ? (
                                    <div className="flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-bold">1</span>
                                            <span>Tap <Share size={12} className="inline mx-0.5" /> <strong>Share</strong> in Safari menu</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] font-bold">2</span>
                                            <span>Select <PlusSquare size={12} className="inline mx-0.5" /> <strong>Add to Home Screen</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={installApp}
                                        className="w-full py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} />
                                        Install App
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
