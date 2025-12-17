import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = 'md' }) => {
  const gradientId = useId();
  
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-20",
    xl: "h-32"
  };

  const textSizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl"
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} dir="rtl">
      {/* Brand Text - Styled to match the Montaleq logo typography */}
      {showText && (
        <span className={`font-extrabold tracking-tight font-sans ${textSizeClasses[size]}`} style={{
            fontFamily: "'Tajawal', sans-serif",
            background: `linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #06b6d4 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 10px rgba(6, 182, 212, 0.2))'
        }}>
          منطلق
        </span>
      )}

      {/* Dynamic Launching Arrow Icon */}
      <div className={`${sizeClasses[size]} aspect-square relative flex items-center justify-center transform -rotate-12`}>
        <svg 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-lg" 
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#06b6d4"/> {/* Cyan 500 */}
                    <stop offset="1" stopColor="#cffafe"/> {/* Cyan 100 */}
                </linearGradient>
            </defs>
            
            {/* Main Arrow Body - stylized paper plane/arrow shape */}
            <path 
                d="M20 80 L85 45 L20 20 L35 50 L20 80Z" 
                fill={`url(#${gradientId})`}
            />
        </svg>
      </div>
    </div>
  );
};