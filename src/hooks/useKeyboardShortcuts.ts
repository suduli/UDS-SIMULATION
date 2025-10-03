/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts for the application
 */

import { useEffect } from 'react';

interface ShortcutHandlers {
  onHelp?: () => void;
  onClearHistory?: () => void;
  onToggleManualMode?: () => void;
  onSendRequest?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F1 - Help
      if (event.key === 'F1') {
        event.preventDefault();
        handlers.onHelp?.();
        return;
      }

      // Ctrl+K - Clear History
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        handlers.onClearHistory?.();
        return;
      }

      // Ctrl+M - Toggle Manual Mode
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        handlers.onToggleManualMode?.();
        return;
      }

      // Enter (when focused on input) - Send Request
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
        const target = event.target as HTMLElement;
        // Only trigger if we're in an input but not a textarea
        if (target.tagName === 'INPUT') {
          event.preventDefault();
          handlers.onSendRequest?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
