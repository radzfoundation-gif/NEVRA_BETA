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
      <div className="relative flex-shrink-0">
        <img
          src="/noir-logo-v2.png"
          alt="Noir AI"
          style={{ width: size, height: size }}
          className="rounded-xl object-cover shadow-sm"
        />
      </div>
      {showText && (
        <span className={`font-display font-bold tracking-tight ${textClassName}`}>
          NOIR AI
        </span>
      )}
    </div>
  );
};

export default Logo;
