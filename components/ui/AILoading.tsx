import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from '../Logo';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor' | 'canvas';
  status?: string;
  className?: string;
}

export default function AILoading({ mode = 'tutor', status, className }: AILoadingProps) {
  // Determine colors based on mode - Override to Black/Dark as requested for visibility
  const accentColor = 'text-zinc-900';
  const glowColor = 'bg-zinc-900/5';
  const borderColor = 'border-zinc-900/20';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Animated Logo Container */}
      <div className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9">
        {/* Spinning outer ring (Perplexity-like) */}
        <div className={cn(
          "absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-current border-r-current opacity-100",
          accentColor
        )}
          style={{ animation: 'spin-slow 1.5s linear infinite' }}
        />

        {/* Inner static border/background */}
        <div className={cn(
          "absolute inset-0.5 rounded-full border opacity-30",
          borderColor,
          glowColor
        )} />

        {/* The 'N' Logo - Inlined to ensure color control (default Logo component forces white) */}
        <div className="relative z-10 transform scale-75" style={{ animation: 'pulse-slow 2s ease-in-out infinite' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={accentColor} // Use the calculated accent color (text-zinc-900)
          >
            <path
              d="M 20 20 C 20 25, 22 30, 24 35 C 26 40, 28 45, 30 50 C 32 55, 30 60, 28 65 C 26 70, 24 75, 22 80 C 20 85, 20 90, 20 100 L 20 100 C 20 95, 22 90, 24 85 C 26 80, 28 75, 30 70 C 32 65, 34 60, 36 55 C 38 50, 40 45, 42 40 C 44 35, 46 30, 48 25 C 50 20, 50 20, 50 20 Z"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 100 20 C 100 25, 98 30, 96 35 C 94 40, 92 45, 90 50 C 88 55, 90 60, 92 65 C 94 70, 96 75, 98 80 C 100 85, 100 90, 100 100 L 100 100 C 100 95, 98 90, 96 85 C 94 80, 92 75, 90 70 C 88 65, 86 60, 84 55 C 82 50, 80 45, 78 40 C 76 35, 74 30, 72 25 C 70 20, 70 20, 70 20 Z"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 20 20 C 30 25, 40 35, 45 45 C 50 55, 48 65, 50 70 C 52 75, 60 85, 70 90 C 80 95, 90 98, 100 100"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Text with typing effect */}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "text-xs md:text-sm font-medium tracking-wide",
          "text-zinc-900"
        )}>
          {status || 'Thinking'}
        </span>
        <div className="flex gap-0.5 mt-1">
          <span
            className="w-1 h-1 rounded-full bg-zinc-900 opacity-80"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: '0s'
            }}
          />
          <span
            className="w-1 h-1 rounded-full bg-zinc-900 opacity-80"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: '0.2s'
            }}
          />
          <span
            className="w-1 h-1 rounded-full bg-zinc-900 opacity-80"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: '0.4s'
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(0.75) opacity(1); }
          50% { transform: scale(0.85) opacity(0.8); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
