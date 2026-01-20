import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor' | 'canvas';
  status?: string;
  className?: string;
}

export default function AILoading({ mode = 'tutor', status, className }: AILoadingProps) {
  const [loadingText, setLoadingText] = useState(status || 'Nevra is thinking');

  // Optional: Cycle through messages for a more "alive" feel if no status is provided
  // For now, keeping it simple and elegant as requested.

  return (
    <div className={cn("flex items-center gap-3 py-2 select-none", className)}>
      {/* Abstract Breathing Logo (Claude-style) */}
      <div className="relative flex items-center justify-center w-5 h-5">
        <motion.div
          className="w-3.5 h-3.5 bg-[#da7756] rounded-[4px]"
          animate={{
            scale: [0.85, 1.1, 0.85],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 45, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 bg-[#da7756] rounded-full opacity-20"
          animate={{
            scale: [1, 1.4],
            opacity: [0.2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </div>

      {/* Elegant Text Label */}
      <div className="flex flex-col justify-center h-full">
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-medium text-zinc-500 tracking-wide"
        >
          {status || 'Nevra is thinking...'}
        </motion.span>
      </div>
    </div>
  );
}
