/**
 * Learning Page - Full-page UDS Protocol Learning Interface
 */

import React from 'react';
import { Link } from 'react-router-dom';
import EnhancedBackground from '../components/EnhancedBackground';
import { useTheme } from '../context/ThemeContext';
import RequestBuilder from '../components/RequestBuilder';
import ResponseVisualizer from '../components/ResponseVisualizer';

export const LearningPage: React.FC = () => {
    const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                {/* Header with Back Navigation */}
                <header className="glass-panel border-b border-cyber-blue/20 sticky top-0 z-50 backdrop-blur-lg">
                    <div className="container mx-auto px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            {/* Back Button and Title */}
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/"
                                    className="cyber-button flex items-center space-x-2 hover:scale-105 transition-transform"
                                    aria-label="Back to simulator"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span>Back to Simulator</span>
                                </Link>

                                <div className="hidden sm:block">
                                    <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-cyber-blue via-cyan-400 to-cyber-purple bg-clip-text text-transparent">
                                        📚 Learn UDS Protocol
                                    </h1>
                                </div>
                            </div>

                            {/* Theme Controls */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={toggleTheme}
                                    className="cyber-button p-2"
                                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={toggleHighContrast}
                                    className="cyber-button p-2"
                                    aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
                                    title={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343 5.657l-.707-.707m9.9 0l.708.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Breadcrumbs - Mobile */}
                        <div className="sm:hidden mt-2">
                            <nav aria-label="Breadcrumb" className="text-sm">
                                <ol className="flex items-center space-x-2 text-gray-400">
                                    <li>
                                        <Link to="/" className="hover:text-cyber-blue transition-colors">
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </li>
                                    <li className="text-cyber-blue font-semibold">Learn</li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content - Interactive Lab Only */}
                <main className="container mx-auto p-4 h-[calc(100vh-80px)] flex flex-col relative">

                    {/* Interactive Lab */}
                    <div className="flex-1 min-h-0 flex flex-col">


                        {/* Lab Content - Side-by-Side */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Input Section */}
                            <div className="flex flex-col min-h-0">
                                <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800 bg-dark-900/30 backdrop-blur-sm p-1">
                                    <RequestBuilder initialRequest="" />
                                </div>
                            </div>

                            {/* Output Section */}
                            <div className="flex flex-col min-h-0">
                                <div className="flex-1 overflow-hidden rounded-xl border border-gray-800 bg-dark-900/30 backdrop-blur-sm shadow-inner">
                                    <ResponseVisualizer />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
