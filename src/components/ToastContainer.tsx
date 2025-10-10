/**
 * Toast Container Component
 * Manages the display of multiple toast notifications
 */

import React from 'react';
import Toast from './Toast';
import type { ToastType } from './Toast';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md pointer-events-none"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
