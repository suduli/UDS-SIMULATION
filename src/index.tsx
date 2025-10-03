import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <h1>UDS Protocol Interactive Simulator</h1>
    <p>Workspace bootstrapped. Replace this placeholder with the app shell.</p>
  </StrictMode>,
);
