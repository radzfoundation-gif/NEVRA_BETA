import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor' | 'canvas';
  status?: string;
  loadingMessages?: string[];
  className?: string;
}

const DEFAULT_MESSAGES = [
  "Noir is thinking...",
  "Analyzing request...",
  "Connecting to knowledge base...",
  "Formulating response...",
  "Writing code...",
  "Almost there..."
];

export default function AILoading({ mode = 'tutor', status, loadingMessages, className }: AILoadingProps) {
  // Use provided messages or defaults, but if status is provided, prioritize it as a fixed message initially
  const messages = loadingMessages && loadingMessages.length > 0 ? loadingMessages : DEFAULT_MESSAGES;

  // If status is provided, we can optionally just show that, OR we can start with it.
  // For this design, let's behave as follows:
  // If status is specific (passed from outside irrelevant to cycling), we might want to respect it.
  // BUT the requirement is to cycle. Let's assume 'status' might be the initial state.

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Change text every 4 seconds
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentText = status && !loadingMessages ? status : messages[msgIndex];

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

      {/* Elegant Text Label with Typing Effect */}
      <div className="flex flex-col justify-center h-full min-w-[150px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentText} // Trigger animation on text change
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }} // Optional exit
            transition={{ duration: 1.5, ease: "linear" }}
            className="text-xs font-medium text-zinc-500 tracking-wide whitespace-nowrap"
          >
            {currentText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
