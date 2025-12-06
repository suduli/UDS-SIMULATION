import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UDSProvider } from './context/UDSContext';
import { HomePage } from './pages/HomePage';
import { LearningPage } from './pages/LearningPage';
import { ClusterDashboardPage } from './pages/ClusterDashboardPage';

function App() {
  return (
    <BrowserRouter basename="/UDS-SIMULATION">
      <ThemeProvider>
        <UDSProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="/cluster" element={<ClusterDashboardPage />} />
          </Routes>

        </UDSProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
