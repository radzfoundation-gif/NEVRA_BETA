import React from 'react';
import { cn } from '@/lib/utils';

interface SlidingCubeLoaderProps {
    size?: number;
    speed?: number; // duration in seconds
    color?: string; // fallback color
    className?: string;
}

export default function SlidingCubeLoader({
    size = 20,
    speed = 1.8,
    className
}: SlidingCubeLoaderProps) {
    // CSS for the sliding animation
    const style = {
        '--cube-size': `${size}px`,
        '--anim-duration': `${speed}s`,
    } as React.CSSProperties;

    return (
        <div className={cn("relative flex items-center justify-center p-4", className)} style={style}>
            <style>{`
        @keyframes slideCube {
          0% {
            opacity: 0;
            transform: translateX(-150%) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          35% {
            transform: translateX(50%) scale(1);
          }
          50% {
            opacity: 0;
            transform: translateX(150%) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateX(150%) scale(0.8);
          }
        }

        .sliding-cube-wrapper {
          position: relative;
          width: calc(var(--cube-size) * 5); /* Width to accommodate sliding range */
          height: calc(var(--cube-size) * 1.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sliding-cube {
          position: absolute;
          width: var(--cube-size);
          height: var(--cube-size);
          border-radius: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          opacity: 0;
          animation: slideCube var(--anim-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Glass / Glow effect */
        .sliding-cube::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(2px);
        }
      `}</style>

            <div className="sliding-cube-wrapper">
                {/* 4 Cubes with stagger delays */}
                <div className="sliding-cube" style={{ animationDelay: '0s' }} />
                <div className="sliding-cube" style={{ animationDelay: '0.15s' }} />
                <div className="sliding-cube" style={{ animationDelay: '0.3s' }} />
                <div className="sliding-cube" style={{ animationDelay: '0.45s' }} />
            </div>
        </div>
    );
}
