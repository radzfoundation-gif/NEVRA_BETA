import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Sparkles, Cpu } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface PhilosLoadingProps {
  phase: 'understanding' | 'researching' | 'synthesizing';
  status?: string;
  className?: string;
}

const PixelGridSkeleton = () => {
    // 10x10 grid for a more "matrix" or "circuit" feel
    const pixels = Array.from({ length: 100 });
    
    return (
        <div className="grid grid-cols-10 gap-[2px] w-fit p-4 bg-zinc-900/5 rounded-2xl border border-zinc-200/50 backdrop-blur-sm">
            {pixels.map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-[1px] bg-indigo-500/20"
                    animate={{
                        backgroundColor: [
                            "rgba(99, 102, 241, 0.1)", 
                            "rgba(99, 102, 241, 0.6)", 
                            "rgba(139, 92, 246, 0.4)", 
                            "rgba(99, 102, 241, 0.1)"
                        ],
                        scale: [1, 1.1, 1.05, 1],
                        opacity: [0.3, 0.8, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: (i % 10) * 0.1 + Math.floor(i / 10) * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};

export default function PhilosLoading({ phase, status, className }: PhilosLoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getPhaseConfig = () => {
    switch (phase) {
      case 'understanding':
        return {
          icon: Brain,
          label: 'Phase 1: Deep Understanding',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200'
        };
      case 'researching':
        return {
          icon: Search,
          label: 'Phase 2: Collaborative Research',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        };
      case 'synthesizing':
        return {
          icon: Sparkles,
          label: 'Phase 3: Multi-Model Synthesis',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          borderColor: 'border-indigo-200'
        };
    }
  };

  const config = getPhaseConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col gap-6 py-6 select-none max-w-xl mx-auto", className)}>
      <div className="flex flex-col items-center gap-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("p-4 rounded-2xl border-2 shadow-lg", config.bgColor, config.borderColor)}
        >
          <Icon className={cn("w-8 h-8", config.color)} />
        </motion.div>
        
        <div className="text-center space-y-1">
          <motion.h3 
            key={config.label}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-sm font-bold text-zinc-900 uppercase tracking-widest"
          >
            {config.label}
          </motion.h3>
          <p className="text-xs text-zinc-500 font-medium h-4">
            {status || `Noir Philos is ${phase === 'synthesizing' ? 'merging intelligence' : phase}${dots}`}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        {phase === 'synthesizing' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <PixelGridSkeleton />
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
               <Cpu size={12} className="text-indigo-500 animate-pulse" />
               <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Pixel Matrix Syncing...</span>
            </div>
          </motion.div>
        ) : (
          <div className="flex gap-2">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className={cn("w-2 h-2 rounded-full", config.bgColor, "border", config.borderColor)}
                 animate={{
                   scale: [1, 1.5, 1],
                   opacity: [0.3, 1, 0.3],
                 }}
                 transition={{
                   duration: 1,
                   repeat: Infinity,
                   delay: i * 0.2,
                 }}
               />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
