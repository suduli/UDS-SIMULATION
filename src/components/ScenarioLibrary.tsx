/**
 * Scenario Library Component
 * UI for viewing, searching, and managing saved scenarios
 */

import React, { useState, useEffect } from 'react';
import { scenarioManager } from '../services/ScenarioManager';
import type { EnhancedScenario, ScenarioStatistics } from '../types/scenario';
import { formatTiming } from '../utils/udsHelpers';

interface ScenarioLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenario: (scenario: EnhancedScenario) => void;
  onExportScenario?: (scenario: EnhancedScenario) => void;
}

export const ScenarioLibrary: React.FC<ScenarioLibraryProps> = ({
  isOpen,
  onClose,
  onLoadScenario,
  onExportScenario,
}) => {
  const [scenarios, setScenarios] = useState<EnhancedScenario[]>([]);
  const [statistics, setStatistics] = useState<ScenarioStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<EnhancedScenario | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'requests'>('date');
  const [filterTag, setFilterTag] = useState<string>('');

  // Load scenarios on mount
  useEffect(() => {
    if (isOpen) {
      loadScenarios();
      loadStatistics();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    const loaded = await scenarioManager.listScenarios();
    setScenarios(loaded);
  };

  const loadStatistics = async () => {
    const stats = await scenarioManager.getStatistics();
    setStatistics(stats);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await scenarioManager.searchScenarios(searchQuery);
      setScenarios(results);
    } else {
      loadScenarios();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      await scenarioManager.deleteScenario(id);
      loadScenarios();
      loadStatistics();
      if (selectedScenario?.id === id) {
        setSelectedScenario(null);
      }
    }
  };

  const handleExport = async (scenario: EnhancedScenario, format: 'json' | 'csv' = 'json') => {
    const blob = await scenarioManager.exportScenario(scenario, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onExportScenario) {
      onExportScenario(scenario);
    }
  };

  const handleLoad = (scenario: EnhancedScenario) => {
    onLoadScenario(scenario);
    onClose();
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(scenarios.flatMap(s => s.metadata.tags))
  ).sort();

  // Filter and sort scenarios
  const filteredScenarios = scenarios
    .filter(s => !filterTag || s.metadata.tags.includes(filterTag))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.createdAt - a.createdAt;
        case 'requests':
          return b.metadata.totalRequests - a.metadata.totalRequests;
        default:
          return 0;
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 border-2 border-cyan-500/30 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                Scenario Library
              </h2>
              {statistics && (
                <p className="text-sm text-gray-400 mt-1">
                  {statistics.totalScenarios} scenarios • {statistics.totalRequests} total requests • {statistics.averageSuccessRate}% avg success rate
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search scenarios..."
                className="w-full bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Search
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'requests')}
              className="bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="requests">Sort by Requests</option>
            </select>
            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Scenario List */}
          <div className="w-1/2 border-r border-cyan-500/30 overflow-y-auto">
            {filteredScenarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No scenarios found</p>
                <p className="text-sm mt-2">Create your first scenario by saving your request history</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'bg-cyan-500/20 border-2 border-cyan-500'
                        : 'bg-gray-800/30 border-2 border-cyan-500/20 hover:border-cyan-500/50'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white mb-1">{scenario.name}</h3>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">{scenario.metadata.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{scenario.metadata.totalRequests} requests</span>
                      <span>{scenario.metadata.successRate}% success</span>
                      <span>{formatTiming(scenario.metadata.duration)}</span>
                    </div>
                    {scenario.metadata.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {scenario.metadata.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-2">
                      {new Date(scenario.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scenario Details */}
          <div className="w-1/2 overflow-y-auto p-6">
            {selectedScenario ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">{selectedScenario.name}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Description</label>
                    <p className="text-white">{selectedScenario.metadata.description}</p>
                  </div>

                  {selectedScenario.metadata.author && (
                    <div>
                      <label className="text-sm text-gray-400">Author</label>
                      <p className="text-white">{selectedScenario.metadata.author}</p>
                    </div>
                  )}

                  {selectedScenario.notes && (
                    <div>
                      <label className="text-sm text-gray-400">Notes</label>
                      <p className="text-white whitespace-pre-wrap">{selectedScenario.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Total Requests</label>
                      <p className="text-2xl font-bold text-cyan-400">{selectedScenario.metadata.totalRequests}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Success Rate</label>
                      <p className="text-2xl font-bold text-green-400">{selectedScenario.metadata.successRate}%</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Duration</label>
                      <p className="text-2xl font-bold text-blue-400">{formatTiming(selectedScenario.metadata.duration)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Version</label>
                      <p className="text-lg text-white">{selectedScenario.version}</p>
                    </div>
                  </div>

                  {selectedScenario.metadata.tags.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Tags</label>
                      <div className="flex gap-2 flex-wrap">
                        {selectedScenario.metadata.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-cyan-500/30">
                    <button
                      onClick={() => handleLoad(selectedScenario)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30"
                    >
                      Load & Replay
                    </button>
                    <button
                      onClick={() => handleExport(selectedScenario, 'json')}
                      className="px-4 py-3 bg-gray-700/50 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Export as JSON"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleExport(selectedScenario, 'csv')}
                      className="px-4 py-3 bg-gray-700/50 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Export as CSV"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleDelete(selectedScenario.id)}
                      className="px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete scenario"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Select a scenario to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
