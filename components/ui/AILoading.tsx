import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor' | 'canvas';
  status?: string;
  message?: string;
  loadingMessages?: string[];
  className?: string;
  userPrompt?: string; // The user's prompt to allow copying
  hasImages?: boolean; // True if the user attached images
}

const DEFAULT_MESSAGES = [
  "Noir is thinking...",
  "Analyzing your question...",
  "Processing with AI...",
  "Formulating response...",
  "Preparing answer...",
  "Almost there..."
];

export default function AILoading({ mode = 'tutor', status, loadingMessages, className, userPrompt, hasImages }: AILoadingProps) {
  const messages = loadingMessages && loadingMessages.length > 0 ? loadingMessages : DEFAULT_MESSAGES;

  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Estimate remaining time based on prompt length and attachments
  const estimateTotal = useCallback(() => {
    let baseEstimate = 15; // default 15s
    if (userPrompt) {
      const len = userPrompt.length;
      if (len < 50) baseEstimate = 8;
      else if (len < 200) baseEstimate = 15;
      else if (len < 500) baseEstimate = 25;
      else baseEstimate = 35;
    }
    
    // Add 10 seconds buffer for image processing/network upload
    if (hasImages) {
      baseEstimate += 10;
    }
    
    return baseEstimate;
  }, [userPrompt, hasImages]);

  const totalEstimate = estimateTotal();
  const remaining = Math.max(0, totalEstimate - elapsed);

  const handleCopy = async () => {
    if (!userPrompt) return;
    try {
      await navigator.clipboard.writeText(userPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const currentText = status && !loadingMessages ? status : messages[msgIndex];

  // Format time
  const formatTime = (s: number) => {
    if (s <= 0) return 'any moment now';
    if (s < 60) return `~${s}s`;
    return `~${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className={cn("flex flex-col gap-1.5 py-2 select-none", className)}>
      {/* Main loading row */}
      <div className="flex items-center gap-3">
        {/* Pixel N Grid Logo */}
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
              className={cn(
                "w-[2.5px] h-[2.5px] rounded-[0.5px]",
                isN ? "bg-indigo-500 shadow-[0_0_3px_rgba(99,102,241,0.4)]" : "bg-stone-200"
              )}
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

        {/* Text + ETA */}
        <div className="flex items-center gap-2 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentText}
              initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
              exit={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="text-xs font-medium text-zinc-500 tracking-wide whitespace-nowrap"
            >
              {currentText}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Copy prompt row */}
      {userPrompt && (
        <div className="flex items-center gap-2 pl-8">
          <div className="max-w-[220px] truncate text-[10px] text-zinc-600 italic">
            "{userPrompt.length > 60 ? userPrompt.substring(0, 60) + '...' : userPrompt}"
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
            title="Copy prompt"
          >
            {copied ? (
              <>
                <Check size={10} className="text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={10} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
