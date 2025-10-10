/**
 * Toast Notification Component
 * Displays temporary notifications for UDS responses, errors, and system states
 */

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  message, 
  description, 
  duration = 5000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const styles = {
    success: 'bg-green-500/10 border-green-500/50 text-green-400',
    error: 'bg-red-500/10 border-red-500/50 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  };

  const icons = {
    success: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div 
      className={`
        ${styles[type]}
        border-2 rounded-xl p-4 shadow-2xl backdrop-blur-md
        animate-slide-in-right
        flex items-start gap-3 min-w-[320px] max-w-[500px]
        hover:scale-105 transition-transform duration-200
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{message}</div>
        {description && (
          <div className="text-xs opacity-90 mt-1 leading-relaxed">{description}</div>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
