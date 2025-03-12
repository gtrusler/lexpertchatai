import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  accent?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  onClick,
  hoverable = false,
  accent = false
}) => {
  const baseClasses = 'bg-card rounded-lg shadow-sm p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700';
  const hoverClasses = hoverable || onClick ? 'cursor-pointer hover:shadow-md' : '';
  const accentClasses = accent ? 'border-l-4 border-l-[#0078D4]' : '';
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      // Only stop propagation if this is a nested clickable element
      if (e.target !== e.currentTarget) {
        e.stopPropagation();
      }
      onClick();
    }
  };
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${accentClasses} ${className}`}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      data-clickable={onClick ? "true" : "false"}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card; 