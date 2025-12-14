import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor';
  status?: string;
  className?: string;
}

export default function AILoading({ mode = 'tutor', status, className }: AILoadingProps) {
  return (
    <div className={cn("flex items-center gap-2 md:gap-3", className)}>
      {/* Animated avatar/icon */}
      <div className={cn(
        "relative flex items-center justify-center border shadow-md overflow-hidden",
        mode === 'tutor'
          ? "w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30"
          : "w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/20"
      )}>
        {/* Gradient shimmer effect */}
        <div 
          className={cn(
            "absolute inset-0 opacity-30",
            mode === 'tutor'
              ? "bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
              : "bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
          )} 
          style={{
            animation: 'shimmer 2s infinite',
            backgroundSize: '200% 100%',
          }} 
        />
        
        {/* Pulsing dots */}
        <div className="relative flex items-center justify-center gap-0.5 z-10">
          <div 
            className={cn(
              "w-1 h-1 rounded-full",
              mode === 'tutor' ? "bg-blue-400" : "bg-purple-400"
            )} 
            style={{ 
              animation: 'bounce 1.4s infinite',
              animationDelay: '0s'
            }} 
          />
          <div 
            className={cn(
              "w-1 h-1 rounded-full",
              mode === 'tutor' ? "bg-blue-400" : "bg-purple-400"
            )} 
            style={{ 
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s'
            }} 
          />
          <div 
            className={cn(
              "w-1 h-1 rounded-full",
              mode === 'tutor' ? "bg-blue-400" : "bg-purple-400"
            )} 
            style={{ 
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s'
            }} 
          />
        </div>
      </div>
      
      {/* Text with typing effect */}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "text-xs md:text-sm font-medium",
          mode === 'tutor' ? "text-gray-300 font-semibold" : "text-gray-400 font-medium"
        )}>
          {status || 'Thinking'}
        </span>
        <div className="flex gap-0.5">
          <span 
            className="opacity-100 text-xs" 
            style={{ 
              animation: 'pulse 1.5s infinite',
              animationDelay: '0s'
            }}
          >
            .
          </span>
          <span 
            className="opacity-100 text-xs" 
            style={{ 
              animation: 'pulse 1.5s infinite',
              animationDelay: '0.3s'
            }}
          >
            .
          </span>
          <span 
            className="opacity-100 text-xs" 
            style={{ 
              animation: 'pulse 1.5s infinite',
              animationDelay: '0.6s'
            }}
          >
            .
          </span>
        </div>
      </div>
      
      {/* Add shimmer animation to CSS */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
