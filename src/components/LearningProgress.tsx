/**
 * Learning Progress Component
 * Displays user's learning progress, badges, and achievements
 */

import React from 'react';
import type { LearningProgress } from '../types/learning';

interface LearningProgressProps {
  progress: LearningProgress;
}

export const LearningProgressDisplay: React.FC<LearningProgressProps> = ({ progress }) => {
  const encounterCount = progress.encounteredNRCs.size;
  const resolvedCount = progress.resolvedNRCs.size;
  const resolutionRate = encounterCount > 0 ? Math.round((resolvedCount / encounterCount) * 100) : 0;

  return (
    <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        Your Learning Journey
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-cyan-400">{encounterCount}</div>
          <div className="text-sm text-slate-400 mt-1">Errors Encountered</div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{resolvedCount}</div>
          <div className="text-sm text-slate-400 mt-1">Errors Resolved</div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{resolutionRate}%</div>
          <div className="text-sm text-slate-400 mt-1">Resolution Rate</div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{progress.badges.filter(b => b.earnedAt).length}</div>
          <div className="text-sm text-slate-400 mt-1">Badges Earned</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Learning Progress</span>
          <span className="text-sm font-bold text-cyan-400">{resolutionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${resolutionRate}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      {progress.badges.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Achievements</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {progress.badges.map((badge) => (
              <div
                key={badge.id}
                className={`relative border rounded-lg p-3 transition-all ${
                  badge.earnedAt
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                    : 'bg-slate-900/30 border-slate-600 opacity-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-sm font-bold text-white">{badge.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{badge.description}</div>
                  {badge.earnedAt && (
                    <div className="mt-2 text-xs text-yellow-400">
                      ✓ Earned
                    </div>
                  )}
                  {!badge.earnedAt && (
                    <div className="mt-2 text-xs text-slate-500">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encountered NRCs */}
      {encounterCount > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-3">Errors You've Encountered</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(progress.encounteredNRCs).map((nrc) => (
              <span
                key={nrc}
                className={`px-3 py-1 rounded-full text-sm font-mono border ${
                  progress.resolvedNRCs.has(nrc)
                    ? 'bg-green-900/30 border-green-500/50 text-green-300'
                    : 'bg-red-900/30 border-red-500/50 text-red-300'
                }`}
              >
                {progress.resolvedNRCs.has(nrc) && '✓ '}
                0x{nrc.toString(16).toUpperCase().padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {encounterCount === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-slate-400 mb-2">Start Your Learning Journey!</p>
          <p className="text-sm text-slate-500">Send some UDS requests to begin tracking your progress.</p>
        </div>
      )}
    </div>
  );
};
