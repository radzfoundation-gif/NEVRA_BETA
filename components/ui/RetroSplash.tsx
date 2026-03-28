import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function RetroSplash({ onComplete }: { onComplete: () => void }) {
    useEffect(() => {
        // Simple loading screen lasting 1.8 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 1800);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#D4FF8D' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex items-center justify-center"
            >
                <motion.img 
                    src="/owl-logo.png" 
                    alt="Noir Owl Logo" 
                    className="w-24 h-24 object-contain opacity-90"
                    animate={{ 
                        opacity: [0.7, 1, 0.7], 
                        scale: [0.95, 1.05, 0.95] 
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 2.5, 
                        ease: "easeInOut" 
                    }}
                />
            </motion.div>
        </div>
    );
}
