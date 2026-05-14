import React from 'react';
import { motion } from 'framer-motion';

const GRID_SIZE = 7;

const G_CELLS = new Set([
    1, 2, 3, 4, 5,
    7, 13,
    14,
    21,
    28, 31, 32, 33, 34,
    35, 41,
    42, 48,
    50, 51, 52, 53,
]);

const TRACE_ORDER = [
    5, 4, 3, 2, 1,
    7, 14, 21, 28, 35, 42,
    50, 51, 52, 53,
    48, 41, 34,
    33, 32, 31,
];

export default function GridNLoader() {
    return (
        <div className="inline-flex items-center gap-1.5 py-0.5 animate-in fade-in duration-300">
            <div
                className="grid shrink-0 gap-px"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 2px)` }}
                aria-label="UseGlass loading"
            >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                    const active = G_CELLS.has(index);
                    const order = TRACE_ORDER.indexOf(index);
                    return (
                        <motion.span
                            key={index}
                            className={active ? 'h-[2px] w-[2px] rounded-[0.5px] bg-zinc-900' : 'h-[2px] w-[2px] bg-transparent'}
                            initial={false}
                            animate={active ? {
                                opacity: [0.4, 1, 0.55],
                                scale: [0.85, 1.05, 0.95],
                            } : { opacity: 0, scale: 1 }}
                            transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                repeatType: 'loop',
                                delay: order >= 0 ? order * 0.04 : 0,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        />
                    );
                })}
            </div>
            <motion.span
                animate={{ opacity: [0.45, 0.85, 0.45] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[8px] font-medium uppercase tracking-[0.16em] text-zinc-400"
            >
                Thinking
            </motion.span>
        </div>
    );
}
