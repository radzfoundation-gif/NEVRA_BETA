import React from 'react';
import { motion } from 'framer-motion';

export default function GridNLoader() {
    return (
        <div className="flex items-center gap-3 py-2 animate-in fade-in duration-500">
            <div className="grid grid-cols-5 gap-[1.5px] w-fit">
                {[
                    1,0,0,0,1,
                    1,1,0,0,1,
                    1,0,1,0,1,
                    1,0,0,1,1,
                    1,0,0,0,1
                ].map((isN, i) => (
                    <motion.div
                        key={i}
                        className={`w-[2.5px] h-[2.5px] rounded-[0.5px] ${isN ? "bg-indigo-500 shadow-[0_0_3px_rgba(99,102,241,0.4)]" : "bg-stone-200"}`}
                        animate={isN ? {
                            opacity: [0.35, 1, 0.35],
                            scale: [0.95, 1.15, 0.95],
                        } : {
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
            <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest ml-1"
            >
                Thinking
            </motion.span>
        </div>
    );
}
