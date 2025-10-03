import { UDSProvider } from './context/UDSContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import RequestBuilder from './components/RequestBuilder';
import ResponseVisualizer from './components/ResponseVisualizer';
import ProtocolStateDashboard from './components/ProtocolStateDashboard';
import BackgroundEffect from './components/BackgroundEffect';
import AdditionalFeatures from './components/AdditionalFeatures';

function App() {
  return (
    <ThemeProvider>
      <UDSProvider>
        <div className="min-h-screen bg-dark-900 text-gray-100 relative overflow-hidden">
          <BackgroundEffect />
          
          <div className="relative z-10">
            <Header />
            
            <main className="container mx-auto px-4 py-8">
              {/* Enhanced Protocol State Dashboard - Now 4 cards */}
              <ProtocolStateDashboard />
              
              {/* Main Content Grid - Request Builder and Response Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-6">
                  <RequestBuilder />
                </div>
                
                <div className="space-y-6">
                  <ResponseVisualizer />
                </div>
              </div>

              {/* Additional Features - DTC, Learning, Stats */}
              <AdditionalFeatures />
            </main>
          </div>
        </div>
      </UDSProvider>
    </ThemeProvider>
  );
}

export default App;
