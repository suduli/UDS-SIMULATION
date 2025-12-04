/**
 * Home Page - Main UDS Simulator Interface
 */

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import RequestBuilder from '../components/RequestBuilder';
import ResponseVisualizer from '../components/ResponseVisualizer';
import ProtocolStateDashboard from '../components/ProtocolStateDashboard';
import { PowerSupplyDashboard } from '../components/PowerSupplyDashboard';
import EnhancedBackground from '../components/EnhancedBackground';
import { OnboardingTour } from '../components/OnboardingTour';
import ToastContainer from '../components/ToastContainer';
import type { ToastMessage } from '../components/ToastContainer';

export const HomePage: React.FC = () => {
    const [showTour, setShowTour] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        // Check if user has completed the tour
        const tourCompleted = localStorage.getItem('uds-tour-completed');
        if (!tourCompleted) {
            // Show tour after a brief delay for better UX
            setTimeout(() => setShowTour(true), 1000);
        }

        // Listen for custom event to restart tour
        const handleRestartTour = () => setShowTour(true);
        window.addEventListener('restart-tour', handleRestartTour);

        return () => window.removeEventListener('restart-tour', handleRestartTour);
    }, []);

    // Toast management functions
    const addToast = (toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { ...toast, id }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Expose addToast globally for UDS context to use
    useEffect(() => {
        interface WindowWithToast extends Window {
            addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
        }
        (window as WindowWithToast).addToast = addToast;
        return () => {
            delete (window as WindowWithToast).addToast;
        };
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                {/* Skip to main content link for accessibility */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyber-blue focus:text-dark-900 focus:rounded-lg focus:font-bold"
                >
                    Skip to main content
                </a>

                <Header />

                <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
                    {/* Enhanced Protocol State Dashboard - Responsive grid */}
                    <div className="protocol-dashboard mb-4 sm:mb-6 space-y-6">
                        <ProtocolStateDashboard />
                    </div>

                    {/* Main Content Grid - Stack on mobile, side-by-side on desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        {/* Left Column - Request Builder first on desktop, second on mobile for better mobile UX */}
                        <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                            <div className="request-builder">
                                <RequestBuilder />
                            </div>
                        </div>

                        {/* Right Column - Response Visualizer first on mobile for immediate feedback */}
                        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                            <div className="response-visualizer">
                                <ResponseVisualizer />
                            </div>
                        </div>
                    </div>

                    {/* Power Supply Dashboard - Moved to bottom */}
                    <div className="power-supply-dashboard mb-4 sm:mb-6">
                        <PowerSupplyDashboard />
                    </div>
                </main>
            </div>

            {/* Onboarding Tour */}
            <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
};
