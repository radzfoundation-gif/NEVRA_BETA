import React from 'react';
import { motion } from 'framer-motion';

const GRID_SIZE = 3;
const CELLS = Array.from({ length: GRID_SIZE * GRID_SIZE });

export type GridLoaderTone = 'default' | 'web' | 'document' | 'code' | 'presentation';

const TONE_STYLES: Record<GridLoaderTone, { dot: string; label: string; ring: string }> = {
    default: { dot: 'bg-zinc-900', label: 'text-zinc-400', ring: 'ring-zinc-200/70' },
    web: { dot: 'bg-orange-500', label: 'text-orange-500', ring: 'ring-orange-200/70' },
    document: { dot: 'bg-blue-600', label: 'text-blue-600', ring: 'ring-blue-200/70' },
    code: { dot: 'bg-emerald-600', label: 'text-emerald-600', ring: 'ring-emerald-200/70' },
    presentation: { dot: 'bg-violet-600', label: 'text-violet-600', ring: 'ring-violet-200/70' },
};

const TONE_LABEL: Record<GridLoaderTone, string> = {
    default: 'Thinking',
    web: 'Building UI',
    document: 'Writing PDF',
    code: 'Coding',
    presentation: 'Making slides',
};

export default function GridNLoader({ tone = 'default', label }: { tone?: GridLoaderTone; label?: string }) {
    const style = TONE_STYLES[tone];
    // Empty string = caller explicitly suppresses inner label (e.g. when an
    // outer streaming status already shows the description). undefined =
    // use the tone's default label.
    const showLabel = label !== '';
    const text = label || TONE_LABEL[tone];
    return (
        <div className="inline-flex items-center gap-1.5 py-1 align-middle animate-in fade-in duration-300">
            <div
                className={`grid shrink-0 gap-[2px] rounded-[6px] bg-white/80 px-1.5 py-1 ring-1 ${style.ring}`}
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 4px)` }}
                aria-label="UseGlass loading"
            >
                {CELLS.map((_, index) => (
                    <motion.span
                        key={index}
                        className={`h-1 w-1 rounded-[1px] ${style.dot}`}
                        animate={{
                            opacity: [0.24, 1, 0.34],
                            scale: [0.82, 1.08, 0.92],
                        }}
                        transition={{
                            duration: 1.15,
                            repeat: Infinity,
                            delay: index * 0.055,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                    />
                ))}
            </div>
            {showLabel && (
                <motion.span
                    animate={{ opacity: [0.45, 0.85, 0.45] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className={`text-[8px] font-medium uppercase leading-none tracking-[0.16em] ${style.label}`}
                >
                    {text}
                </motion.span>
            )}
        </div>
    );
}
