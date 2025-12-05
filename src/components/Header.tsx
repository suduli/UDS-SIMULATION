/**
 * Header Component
 * Redesigned with beautiful modern UI
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUDS } from '../context/UDSContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import HelpModal from './HelpModal';
import { ScenarioLibrary } from './ScenarioLibrary';
import { ReplayControls } from './ReplayControls';
import { SequenceBuilder } from './SequenceBuilder';
import type { EnhancedScenario, ScenarioMetadata } from '../types/scenario';
import type { UDSRequest, UDSResponse } from '../types/uds';
import { scenarioManager } from '../services/ScenarioManager';
import { isFeatureEnabled } from '../config/featureFlags';
import { SystemStatus } from './SystemStatus';

const Header: React.FC = () => {
  const {
    requestHistory,
    clearHistory,
    replayState,
    startReplay,
    pauseReplay,
    resumeReplay,
    stopReplay,
    setReplaySpeed,
    stepForward,
    stepBackward,
    saveEnhancedScenario,
  } = useUDS();
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScenarioLibraryOpen, setIsScenarioLibraryOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSequenceBuilderOpen, setIsSequenceBuilderOpen] = useState(false);

  const handleOpenHelp = useCallback(() => {
    setIsHelpOpen(true);
    setMobileMenuOpen(false);
  }, []);

  useKeyboardShortcuts({
    onHelp: handleOpenHelp,
    onClearHistory: clearHistory,
  });

  const handleExport = () => {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      requestHistory: requestHistory,
      totalRequests: requestHistory.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uds-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Read file content first to check format
          const content = await file.text();
          const data = JSON.parse(content);

          // Check if it's a simple export format (from handleExport)
          if (data.requestHistory && Array.isArray(data.requestHistory)) {
            // Convert simple export format to EnhancedScenario format
            const requests = data.requestHistory.map((item: { request: UDSRequest }) => item.request);
            const responses = data.requestHistory.map((item: { response: UDSResponse }) => item.response);

            // Calculate timings between requests
            const timings: number[] = requests.map((req: UDSRequest, idx: number) => {
              if (idx === 0) return 0;
              return Math.max(0, req.timestamp - requests[idx - 1].timestamp);
            });

            // Create EnhancedScenario from export data
            const scenario: EnhancedScenario = {
              id: `imported_${Date.now()}`,
              name: `Imported Session (${new Date(data.exportDate || Date.now()).toLocaleDateString()})`,
              description: `Imported from exported session file`,
              version: data.version || '1.0.0',
              metadata: {
                description: `Imported session with ${data.totalRequests || requests.length} requests`,
                tags: ['imported'],
                duration: requests.length > 1 ? requests[requests.length - 1].timestamp - requests[0].timestamp : 0,
                totalRequests: requests.length,
                successRate: Math.round((responses.filter((r: UDSResponse) => !r.isNegative).length / responses.length) * 100),
              },
              requests,
              responses,
              timings,
              createdAt: Date.now(),
            };

            startReplay(scenario);
            alert(`Session imported successfully! (${requests.length} requests)`);
          } else {
            // Try as EnhancedScenario format
            const scenario = await scenarioManager.importScenario(file);
            startReplay(scenario);
            alert(`Scenario "${scenario.name}" imported successfully!`);
          }
        } catch (error) {
          console.error('Error importing file:', error);
          alert(`Error importing file: ${error}`);
        }
      }
    };
    input.click();
  };

  const handleSaveScenario = async () => {
    if (requestHistory.length === 0) {
      alert('No requests to save. Please send some requests first.');
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveScenarioSubmit = async (metadata: ScenarioMetadata) => {
    try {
      await saveEnhancedScenario(metadata);
      setShowSaveDialog(false);
      alert(`Scenario "${metadata.name}" saved successfully!`);
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert(`Error saving scenario: ${error}`);
    }
  };

  const handleLoadScenario = (scenario: EnhancedScenario) => {
    startReplay(scenario);
    setIsScenarioLibraryOpen(false);
  };

  const handlePlayReplay = () => {
    if (replayState.isPaused) {
      resumeReplay();
    }
  };

  return (
    <>
      <header className="bg-dark-900/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo & Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  UDS Simulator
                </div>
                <div className="text-xs text-gray-500">Unified Diagnostic Services</div>
              </div>
            </div>

            {/* Center: System Indicators (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
              <SystemStatus />
            </div>

            {/* Right: Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/"
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Help
              </Link>

              <Link
                to="/learn"
                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Learn UDS
              </Link>

              {isFeatureEnabled('ENABLE_SCENARIO_LIBRARY') && (
                <button
                  onClick={() => setIsScenarioLibraryOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
                >
                  Scenarios
                </button>
              )}

              <button
                onClick={() => setIsSequenceBuilderOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                Sequences
              </button>

              {isFeatureEnabled('ENABLE_ENHANCED_EXPORT') && (
                <button
                  onClick={handleSaveScenario}
                  disabled={requestHistory.length === 0}
                  className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              )}

              <button
                onClick={handleExport}
                disabled={requestHistory.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export
              </button>

              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                Import
              </button>

              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
                data-theme-toggle
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <button
                onClick={toggleHighContrast}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all"
              >
                High Contrast
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-800 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
              >
                Help
              </Link>
              <Link
                to="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
              >
                Learn UDS
              </Link>
              <button
                onClick={() => { setIsSequenceBuilderOpen(true); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
              >
                Sequences
              </button>
              <button
                onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
                disabled={requestHistory.length === 0}
              >
                Export
              </button>
              <button
                onClick={() => { handleImport(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
              >
                Import
              </button>
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => { toggleHighContrast(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg"
              >
                {highContrast ? 'Normal Contrast' : 'High Contrast'}
              </button>
            </div>
          )}
        </div>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {isFeatureEnabled('ENABLE_SCENARIO_LIBRARY') && (
        <ScenarioLibrary
          isOpen={isScenarioLibraryOpen}
          onClose={() => setIsScenarioLibraryOpen(false)}
          onLoadScenario={handleLoadScenario}
        />
      )}

      <SequenceBuilder
        isOpen={isSequenceBuilderOpen}
        onClose={() => setIsSequenceBuilderOpen(false)}
      />

      {isFeatureEnabled('ENABLE_SCENARIO_REPLAY') && replayState.isReplaying && (
        <div className="container mx-auto px-4 py-2">
          <ReplayControls
            replayState={replayState}
            onPlay={handlePlayReplay}
            onPause={pauseReplay}
            onStop={stopReplay}
            onSpeedChange={setReplaySpeed}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
          />
        </div>
      )}

      {isFeatureEnabled('ENABLE_ENHANCED_EXPORT') && showSaveDialog && (
        <SaveScenarioDialog
          onSave={handleSaveScenarioSubmit}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {/* Export Success Toast */}
      {showExportSuccess && (
        <div className="fixed bottom-4 right-4 bg-emerald-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-fade-in z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Session exported successfully!</span>
        </div>
      )}
    </>
  );
};

// Save Scenario Dialog Component
const SaveScenarioDialog: React.FC<{
  onSave: (metadata: ScenarioMetadata) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || 'No description provided',
      author: author.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Save Scenario</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scenario Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g., DTC Read Test"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="Describe what this scenario tests..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g., dtc, diagnostic, test"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Save Scenario
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Header;
