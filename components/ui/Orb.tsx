import React from 'react';
import { motion } from 'framer-motion';

interface OrbProps {
    className?: string;
    color?: 'purple' | 'blue' | 'orange';
}

export const Orb: React.FC<OrbProps> = ({ className = '', color = 'purple' }) => {
    const gradients = {
        purple: 'radial-gradient(circle at 30% 30%, rgba(192, 132, 252, 0.8), rgba(168, 85, 247, 0.4) 40%, rgba(147, 51, 234, 0.1) 70%, transparent 80%)',
        blue: 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.4) 40%, rgba(37, 99, 235, 0.1) 70%, transparent 80%)',
        orange: 'radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.8), rgba(249, 115, 22, 0.4) 40%, rgba(234, 88, 12, 0.1) 70%, transparent 80%)',
    };

    const glowColors = {
        purple: 'rgba(168, 85, 247, 0.3)',
        blue: 'rgba(59, 130, 246, 0.3)',
        orange: 'rgba(249, 115, 22, 0.3)',
    };

    // Detect if mobile for performance optimization
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className={`relative w-32 h-32 flex items-center justify-center ${className}`}>
            {/* Core Orb */}
            <motion.div
                animate={isMobile ? {} : {
                    y: [-10, 10, -10],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-24 h-24 rounded-full z-10"
                style={{
                    background: gradients[color],
                    boxShadow: `0 0 40px 10px ${glowColors[color]}, inset 0 0 20px rgba(255,255,255,0.5)`,
                    filter: 'blur(0.5px)',
                    willChange: isMobile ? 'auto' : 'transform'
                }}
            >
                {/* Specular Highlight */}
                <div className="absolute top-[20%] left-[20%] w-8 h-8 bg-white opacity-40 rounded-full blur-md" />
            </motion.div>

            {/* Ambient Glow */}
            <motion.div
                animate={isMobile ? { opacity: 0.6 } : {
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1.2, 1.4, 1.2],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                }}
                className="absolute inset-0 rounded-full blur-3xl z-0"
                style={{
                    background: glowColors[color],
                    willChange: isMobile ? 'auto' : 'transform, opacity'
                }}
            />
        </div>
    );
};

export default Orb;
