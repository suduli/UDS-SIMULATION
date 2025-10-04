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
            <Header />
            
            <main className="container mx-auto px-4 py-8">
              {/* Enhanced Protocol State Dashboard - Now 4 cards */}
              <div className="protocol-dashboard">
                <ProtocolStateDashboard />
              </div>
              
              {/* Main Content Grid - Request Builder and Response Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-6">
                  <div className="request-builder">
                    <RequestBuilder />
                  </div>
                  <div className="quick-examples">
                    <AdditionalFeatures />
                  </div>
                </div>
                
                <div className="space-y-6">
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
