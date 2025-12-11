import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UDSProvider } from './context/UDSContext';
import { HomePage } from './pages/HomePage';
import { LearningPage } from './pages/LearningPage';
import { ClusterDashboardPage } from './pages/ClusterDashboardPage';
import { ReportAnalysisPage } from './pages/ReportAnalysisPage';

function App() {
  return (
    <BrowserRouter basename="/UDS-SIMULATION">
      <ThemeProvider>
        <UDSProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearningPage />} />
            <Route path="/cluster" element={<ClusterDashboardPage />} />
            <Route path="/report" element={<ReportAnalysisPage />} />
          </Routes>

        </UDSProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

