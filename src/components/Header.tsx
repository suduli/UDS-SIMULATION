/**
 * Header Component
 * Main header with branding and navigation
 */

import React, { useState, useCallback } from 'react';
import { useUDS } from '../context/UDSContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import HelpModal from './HelpModal';

const Header: React.FC = () => {
  const { requestHistory, clearHistory } = useUDS();
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenHelp = useCallback(() => {
    setIsHelpOpen(true);
    setMobileMenuOpen(false);
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onHelp: handleOpenHelp,
    onClearHistory: clearHistory,
  });

  const handleExport = () => {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      requestHistory: requestHistory,
      totalRequests: requestHistory.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uds-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success feedback
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            // TODO: Implement import logic in UDSContext
            console.log('Imported data:', data);
            alert('Import functionality coming soon!');
          } catch (error) {
            console.error('Error importing file:', error);
            alert('Error importing file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      <header className="glass-panel border-b border-cyber-blue/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyber-blue blur-xl opacity-50 animate-pulse-slow"></div>
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 dark:from-cyber-blue dark:via-cyan-400 dark:to-cyber-purple bg-clip-text text-transparent animate-gradient-shift">
                  UDS Simulator
                </h1>
                <p className="hidden sm:block text-xs lg:text-sm text-gray-400 dark:text-gray-500">Unified Diagnostic Services</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3">
              <button 
                onClick={handleOpenHelp}
                className="cyber-button text-sm help-button"
                aria-label="Open tutorials and help (F1)"
                title="F1"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Help
              </button>
              
              <div className="relative">
                <button 
                  onClick={handleExport}
                  className="cyber-button text-sm"
                  disabled={requestHistory.length === 0}
                  aria-label="Export session history"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                {showExportSuccess && (
                  <div className="absolute top-full mt-2 right-0 bg-cyber-green/20 border border-cyber-green text-cyber-green px-3 py-2 rounded text-xs whitespace-nowrap animate-fade-in">
                    ✓ Session exported!
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleImport}
                className="cyber-button text-sm"
                aria-label="Import session from file"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>

              <button 
                onClick={toggleTheme}
                className="cyber-button text-sm"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <button 
                onClick={toggleHighContrast}
                className="cyber-button text-sm"
                aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode (WCAG AAA)`}
                title="Toggle high contrast mode for better accessibility"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343 5.657l-.707-.707m9.9 0l.708.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.5" />
                </svg>
                {highContrast ? 'High' : 'Normal'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden cyber-button p-2"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-cyber-blue/20 space-y-2 animate-fade-in">
              <button 
                onClick={handleOpenHelp}
                className="w-full cyber-button text-sm justify-start"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Help (F1)
              </button>
              
              <button 
                onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                className="w-full cyber-button text-sm justify-start"
                disabled={requestHistory.length === 0}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Session
              </button>
              
              <button 
                onClick={() => { handleImport(); setMobileMenuOpen(false); }}
                className="w-full cyber-button text-sm justify-start"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Session
              </button>

              <button 
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="w-full cyber-button text-sm justify-start"
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light Mode
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark Mode
                  </>
                )}
              </button>

              <button 
                onClick={() => { toggleHighContrast(); setMobileMenuOpen(false); }}
                className="w-full cyber-button text-sm justify-start"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343 5.657l-.707-.707m9.9 0l.708.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {highContrast ? 'Normal Contrast' : 'High Contrast'}
              </button>
            </div>
          )}
        </div>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Header;
