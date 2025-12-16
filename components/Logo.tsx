import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textClassName = '',
  color
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ color: color }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Left vertical bar with organic concave inner edge */}
          <path
            d="M 20 20 
               C 20 25, 22 30, 24 35
               C 26 40, 28 45, 30 50
               C 32 55, 30 60, 28 65
               C 26 70, 24 75, 22 80
               C 20 85, 20 90, 20 100
               L 20 100
               C 20 95, 22 90, 24 85
               C 26 80, 28 75, 30 70
               C 32 65, 34 60, 36 55
               C 38 50, 40 45, 42 40
               C 44 35, 46 30, 48 25
               C 50 20, 50 20, 50 20
               Z"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right vertical bar with organic concave inner edge */}
          <path
            d="M 100 20 
               C 100 25, 98 30, 96 35
               C 94 40, 92 45, 90 50
               C 88 55, 90 60, 92 65
               C 94 70, 96 75, 98 80
               C 100 85, 100 90, 100 100
               L 100 100
               C 100 95, 98 90, 96 85
               C 94 80, 92 75, 90 70
               C 88 65, 86 60, 84 55
               C 82 50, 80 45, 78 40
               C 76 35, 74 30, 72 25
               C 70 20, 70 20, 70 20
               Z"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flowing diagonal stroke with organic S-curves (main) */}
          <path
            d="M 20 20 
               C 30 25, 40 35, 45 45
               C 50 55, 48 65, 50 70
               C 52 75, 60 85, 70 90
               C 80 95, 90 98, 100 100"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary flowing curve for depth and movement */}
          <path
            d="M 25 25 
               C 32 28, 38 35, 42 42
               C 46 49, 45 56, 47 63
               C 49 70, 55 76, 62 78
               C 69 80, 78 82, 95 95"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-display font-bold tracking-tight ${textClassName}`}>
          NEVRA
        </span>
      )}
    </div>
  );
};

export default Logo;
