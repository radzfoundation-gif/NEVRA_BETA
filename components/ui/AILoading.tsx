import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

interface AILoadingProps {
  mode?: 'builder' | 'tutor' | 'canvas';
  status?: string;
  className?: string;
}

export default function AILoading({ mode = 'tutor', status, className }: AILoadingProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {/* Simple blinking text with low opacity */}
      <span
        className="text-sm font-medium text-zinc-500 animate-pulse"
        style={{
          opacity: 0.6,
          animation: 'blink 1.5s ease-in-out infinite'
        }}
      >
        {status || 'Nevra sedang mengetik...'}
      </span>

      {/* CSS Animation */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
