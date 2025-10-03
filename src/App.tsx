import React from 'react';
import { ServicePalette } from './ui/components/ServicePalette';
import { SecurityAccessDialog } from './ui/components/security-access-dialog';

const App: React.FC = () => {
  return (
    <div className="app">
      <header>
        <h1>UDS Protocol Interactive Simulator</h1>
      </header>
      <main>
        <ServicePalette />
        <SecurityAccessDialog />
        <div data-testid="advanced-editor">
          <textarea data-testid="hex-input" placeholder="Enter hex commands..." />
        </div>
        <div data-testid="offline-indicator" style={{ display: 'none' }}>
          Offline
        </div>
      </main>
    </div>
  );
};

export default App;
