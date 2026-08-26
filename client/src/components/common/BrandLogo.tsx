import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  linkTo?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = false,
  linkTo = '/',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20',
  };

  const logoContent = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/assets/logo.png"
        alt="Big Basket Logo"
        className={`${sizeClasses[size]} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
        onError={(e) => {
          // Fallback if path differs
          const target = e.target as HTMLImageElement;
          if (!target.src.endsWith('/logo.png')) {
            target.src = '/assets/logo.png';
          }
        }}
      />
      {showTagline && (
        <div className="hidden sm:flex flex-col">
          <span
            className={`text-xs font-semibold tracking-wide ${
              variant === 'light' ? 'text-slate-300' : 'text-brand-muted'
            }`}
          >
            Fresh Groceries & Daily Essentials
          </span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-brand-red rounded-md">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};
