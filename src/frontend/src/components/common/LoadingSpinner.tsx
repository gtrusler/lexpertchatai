import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
  ariaLabel?: string;
  isLoading?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  fullScreen = false,
  ariaLabel = 'Loading content',
  isLoading = true
}) => {
  if (!isLoading) return null;
  
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  };
  
  const colorClasses = {
    primary: 'border-primary/30 border-t-primary',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300 border-t-gray-600'
  };
  
  const spinner = (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 z-50"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {spinner}
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner; 