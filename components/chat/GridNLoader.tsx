import React from 'react';
import { motion } from 'framer-motion';

const GRID_G = [
    0, 1, 1, 1, 1, 0,
    1, 1, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0,
    1, 0, 0, 1, 1, 1,
    1, 0, 0, 0, 0, 1,
    1, 1, 0, 0, 1, 1,
    0, 1, 1, 1, 1, 0,
];

const TRACE_ORDER = [
    1, 2, 3, 4,
    7, 6,
    12, 18, 24, 30,
    37, 38, 39, 40,
    35, 29,
    23, 22, 21,
];

export default function GridNLoader() {
    return (
        <div className="flex items-center gap-1.5 py-0.5 animate-in fade-in duration-500">
            <div className="grid grid-cols-6 gap-px">
                {GRID_G.map((active, index) => {
                    const order = TRACE_ORDER.indexOf(index);
                    return (
                        <motion.span
                            key={index}
                            className={active ? 'h-[3px] w-[3px] rounded-[0.8px] bg-zinc-900' : 'h-[3px] w-[3px] rounded-[0.8px] bg-zinc-200/60'}
                            animate={active ? {
                                opacity: [0.22, 1, 0.38],
                                scale: [0.72, 1.2, 0.86],
                            } : {
                                opacity: 0.18,
                                scale: 0.9,
                            }}
                            transition={{
                                duration: 1.45,
                                repeat: Infinity,
                                delay: order >= 0 ? order * 0.055 : 0,
                                ease: 'easeInOut',
                            }}
                        />
                    );
                })}
            </div>
            <motion.span
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-400"
            >
                Thinking
            </motion.span>
        </div>
    );
}
