import React from 'react';

interface KimiK2LogoProps {
  size?: number;
  className?: string;
}

/**
 * Kimi K2 Logo Component
 * Based on the official Kimi K2 branding:
 * - Black square with rounded corners
 * - White "K" letter inside with fragmented/light effect
 * - Light blue dot above and to the right
 * - "KIMI" text in white
 * - "K2" badge in white rounded rectangle with black text
 */
export const KimiK2Logo: React.FC<KimiK2LogoProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon Container - Black square with rounded corners */}
      <rect x="0" y="2" width="16" height="16" rx="2" fill="#000000" />
      
      {/* White "K" letter with fragmented/light effect */}
      <path
        d="M4 4L4 16M4 10L10 4M4 10L10 16"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      {/* Additional light effect lines for fragmented look */}
      <path
        d="M4.5 4.5L4.5 15.5M4.5 9.5L9.5 4.5M4.5 9.5L9.5 15.5"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Light blue dot above and to the right */}
      <circle cx="18" cy="4" r="2" fill="#00A8FF" />
      
      {/* "KIMI" text in white */}
      <text
        x="22"
        y="13"
        fill="#FFFFFF"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.5px"
      >
        KIMI
      </text>
      
      {/* "K2" badge - white rounded rectangle with black text */}
      <rect x="52" y="6" width="24" height="8" rx="3" fill="#FFFFFF" />
      <text
        x="64"
        y="12"
        fill="#000000"
        fontSize="7"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        letterSpacing="0.5px"
      >
        K2
      </text>
    </svg>
  );
};

/**
 * Kimi K2 Icon Only (just the square with K)
 */
export const KimiK2Icon: React.FC<KimiK2LogoProps> = ({ size = 16, className = '' }) => {
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
      {/* Black square with rounded corners */}
      <rect x="2" y="2" width="16" height="16" rx="2.5" fill="#000000" />
      
      {/* White "K" letter with fragmented/light effect */}
      <path
        d="M6 6L6 14M6 10L12 6M6 10L12 14"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      {/* Additional fragmented light effect lines */}
      <path
        d="M6.3 6.3L6.3 13.7M6.3 9.5L11.2 6.3M6.3 9.5L11.2 13.7"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M6.6 6.6L6.6 13.4M6.6 9.2L10.8 6.6M6.6 9.2L10.8 13.4"
        stroke="#FFFFFF"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      {/* Light blue dot above and to the right */}
      <circle cx="17" cy="3" r="1.8" fill="#00A8FF" />
    </svg>
  );
};

export default KimiK2Logo;
