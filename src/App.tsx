import { useState, useEffect } from 'react';
import { UDSProvider } from './context/UDSContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import RequestBuilder from './components/RequestBuilder';
import ResponseVisualizer from './components/ResponseVisualizer';
import ProtocolStateDashboard from './components/ProtocolStateDashboard';
import BackgroundEffect from './components/BackgroundEffect';
import AdditionalFeatures from './components/AdditionalFeatures';
import TimingMetrics from './components/TimingMetrics';
import { OnboardingTour } from './components/OnboardingTour';

function App() {
  const [showTour, setShowTour] = useState(false);

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

  return (
    <ThemeProvider>
      <UDSProvider>
        <div className="min-h-screen bg-dark-900 text-gray-100 relative overflow-hidden">
          <BackgroundEffect />
          
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
              <div className="protocol-dashboard mb-4 sm:mb-6">
                <ProtocolStateDashboard />
              </div>
              
              {/* Main Content Grid - Stack on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Left Column - Request Builder first on desktop, second on mobile for better mobile UX */}
                <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                  <div className="request-builder">
                    <RequestBuilder />
                  </div>
                  <div className="quick-examples">
                    <AdditionalFeatures />
                  </div>
                </div>
                
                {/* Right Column - Response Visualizer first on mobile for immediate feedback */}
                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                  <div className="response-visualizer">
                    <ResponseVisualizer />
                  </div>
                  <TimingMetrics />
                </div>
              </div>
            </main>
          </div>

          {/* Onboarding Tour */}
          <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />
        </div>
      </UDSProvider>
    </ThemeProvider>
  );
}

export default App;
