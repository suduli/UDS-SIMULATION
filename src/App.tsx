import { UDSProvider } from './context/UDSContext';
import Header from './components/Header';
import RequestBuilder from './components/RequestBuilder';
import ResponseVisualizer from './components/ResponseVisualizer';
import ProtocolStateDashboard from './components/ProtocolStateDashboard';
import BackgroundEffect from './components/BackgroundEffect';

function App() {
  return (
    <UDSProvider>
      <div className="min-h-screen bg-dark-900 text-gray-100 relative overflow-hidden">
        <BackgroundEffect />
        
        <div className="relative z-10">
          <Header />
          
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <ProtocolStateDashboard />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <RequestBuilder />
              </div>
              
              <div className="space-y-6">
                <ResponseVisualizer />
              </div>
            </div>
          </main>
        </div>
      </div>
    </UDSProvider>
  );
}

export default App;
