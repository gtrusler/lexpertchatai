import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  show?: boolean;
  type?: 'default' | 'prompt-coach';
  targetRef?: React.RefObject<HTMLElement | HTMLInputElement>;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  className = '',
  dismissible = false,
  onDismiss,
  show = true,
  type = 'default',
  targetRef
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  // Add event listeners for targetRef if provided
  useEffect(() => {
    if (!targetRef?.current) return;

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => {
      if (!dismissible) {
        setIsVisible(false);
      }
    };

    const target = targetRef.current;
    target.addEventListener('mouseenter', handleMouseEnter);
    target.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      target.removeEventListener('mouseenter', handleMouseEnter);
      target.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef, dismissible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  const typeClasses = {
    default: 'bg-gray-800 text-white',
    'prompt-coach': 'bg-primary text-white shadow-md'
  };

  // Calculate position if targetRef is provided
  const style: React.CSSProperties = {};
  if (targetRef?.current && tooltipRef.current) {
    const targetRect = targetRef.current.getBoundingClientRect();
    
    if (position === 'top') {
      style.left = targetRect.left + (targetRect.width / 2);
      style.transform = 'translateX(-50%)';
      style.bottom = window.innerHeight - targetRect.top;
    } else if (position === 'bottom') {
      style.left = targetRect.left + (targetRect.width / 2);
      style.transform = 'translateX(-50%)';
      style.top = targetRect.bottom;
    }
  }

  return (
    <div 
      ref={tooltipRef}
      className={`tooltip absolute z-10 p-2 rounded-md ${positionClasses[position]} ${typeClasses[type]} ${className}`}
      style={style}
      role="tooltip"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-1">{content}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss tooltip"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* Add a small arrow/pointer for prompt-coach tooltips */}
      {type === 'prompt-coach' && (
        <div 
          className={`absolute w-2 h-2 bg-primary transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px]' : 
            position === 'bottom' ? 'top-[-4px]' : 
            position === 'left' ? 'right-[-4px]' : 
            'left-[-4px]'
          } left-1/2 ml-[-4px]`}
        />
      )}
    </div>
  );
};

export default Tooltip; 