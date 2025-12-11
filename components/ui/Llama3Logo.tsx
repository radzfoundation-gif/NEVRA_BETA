import React from 'react';

interface Llama3LogoProps {
  size?: number;
  className?: string;
}

/**
 * Llama 3 Logo Component
 * Based on Meta's Llama 3.3 70B branding:
 * - Llama head with electric blue glow effect
 * - Modern, tech-focused aesthetic
 * - Dark blue gradient background feel
 */
export const Llama3Logo: React.FC<Llama3LogoProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Llama head silhouette with glow effect */}
      <defs>
        <linearGradient id="llamaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00AAFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0088FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Llama head outline with electric blue glow */}
      <g filter="url(#glow)">
        {/* Llama head shape */}
        <path
          d="M4 8C4 6 5 4 7 4C8 4 9 5 10 6C11 5 12 4 13 4C15 4 16 6 16 8C16 10 15 12 13 12C12 12 11 11 10 10C9 11 8 12 7 12C5 12 4 10 4 8Z"
          fill="url(#llamaGlow)"
          stroke="#00AAFF"
          strokeWidth="0.5"
        />
        {/* Llama ears */}
        <path
          d="M6 4L7 2L8 4M12 4L13 2L14 4"
          stroke="#00AAFF"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        {/* Llama face details */}
        <circle cx="8" cy="8" r="1" fill="#FFFFFF" opacity="0.9" />
        <circle cx="12" cy="8" r="1" fill="#FFFFFF" opacity="0.9" />
        <ellipse cx="10" cy="10" rx="2" ry="1" fill="#00AAFF" opacity="0.6" />
      </g>
      
      {/* "Llama 3" text */}
      <text
        x="22"
        y="12"
        fill="#FFFFFF"
        fontSize="9"
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.3px"
      >
        Llama 3
      </text>
    </svg>
  );
};

/**
 * Llama 3 Icon Only (just the llama head)
 */
export const Llama3Icon: React.FC<Llama3LogoProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="llamaIconGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00AAFF" stopOpacity="1" />
          <stop offset="50%" stopColor="#0088FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.8" />
        </linearGradient>
        <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Llama head with electric blue glow */}
      <g filter="url(#iconGlow)">
        {/* Main head shape */}
        <ellipse cx="10" cy="10" rx="6" ry="5" fill="url(#llamaIconGlow)" />
        <ellipse cx="10" cy="10" rx="6" ry="5" fill="none" stroke="#00AAFF" strokeWidth="0.8" opacity="0.8" />
        
        {/* Ears */}
        <path
          d="M7 5L8 3L9 5M11 5L12 3L13 5"
          stroke="#00AAFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <ellipse cx="8" cy="4" rx="1" ry="1.5" fill="#00AAFF" opacity="0.6" />
        <ellipse cx="12" cy="4" rx="1" ry="1.5" fill="#00AAFF" opacity="0.6" />
        
        {/* Eyes */}
        <circle cx="8.5" cy="9.5" r="1.3" fill="#FFFFFF" opacity="0.95" />
        <circle cx="11.5" cy="9.5" r="1.3" fill="#FFFFFF" opacity="0.95" />
        <circle cx="8.5" cy="9.5" r="0.6" fill="#1a1a1a" />
        <circle cx="11.5" cy="9.5" r="0.6" fill="#1a1a1a" />
        
        {/* Nose/Mouth */}
        <ellipse cx="10" cy="12" rx="2" ry="1.2" fill="#00AAFF" opacity="0.7" />
        
        {/* Glow effect around head */}
        <ellipse cx="10" cy="10" rx="7" ry="6" fill="none" stroke="#00AAFF" strokeWidth="0.5" opacity="0.4" />
      </g>
    </svg>
  );
};

export default Llama3Logo;
