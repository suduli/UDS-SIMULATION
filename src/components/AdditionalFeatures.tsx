/**
 * Additional Features Component
 * DTC Management, Learning Center, and Statistics panels
 * IMPROVEMENT: New feature panels to extend functionality per user review
 */

import React from 'react';

interface DTCEntry {
  code: string;
  status: 'Confirmed' | 'Pending' | 'Cleared';
  description: string;
}

interface LessonProgress {
  title: string;
  completed: boolean;
  progress?: string;
}

const AdditionalFeatures: React.FC = () => {
  // Mock DTC data
  const dtcs: DTCEntry[] = [
    { code: 'P0420', status: 'Confirmed', description: 'Catalyst System Efficiency' },
    { code: 'P0171', status: 'Pending', description: 'System Too Lean Bank 1' },
  ];

  // Mock learning data
  const lessons: LessonProgress[] = [
    { title: 'Session Control', completed: true, progress: '5/5' },
    { title: 'Security Access', completed: false, progress: '3/7' },
    { title: 'DTC Management', completed: false, progress: '1/4' },
  ];

  // Mock statistics
  const stats = {
    requestsSent: 247,
    successRate: 98,
    servicesUsed: 12,
    activeDTCs: 5,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {/* DTC Management Panel */}
      <div className="glass-card border-orange-500/30 p-6 hover-lift animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">🔍</span>
          </div>
          <div>
            <h3 className="font-bold text-orange-400">DTC Management</h3>
            <p className="text-xs text-slate-500">Diagnostic Trouble Codes</p>
          </div>
        </div>
        <div className="space-y-2">
          {dtcs.map((dtc, index) => (
            <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-orange-400">{dtc.code}</span>
                <span className={`text-xs ${
                  dtc.status === 'Confirmed' ? 'text-red-400' : 
                  dtc.status === 'Pending' ? 'text-yellow-400' : 'text-green-400'
                }`}>{dtc.status}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{dtc.description}</div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-sm text-orange-400 hover:bg-orange-500/30 transition-all">
          View All DTCs
        </button>
      </div>

      {/* Learning Center Panel */}
      <div className="glass-card border-purple-500/30 p-6 hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-purple-400">Learning Center</h3>
            <p className="text-xs text-slate-500">Interactive Tutorials</p>
          </div>
        </div>
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between hover:border-purple-500/50 transition-all cursor-pointer">
              <div>
                <div className="text-sm text-purple-400">{lesson.title}</div>
                <div className="text-xs text-slate-500">{lesson.progress} lessons</div>
              </div>
              <div className="text-xs">
                {lesson.completed ? <span className="text-green-400">✓</span> : <span className="text-yellow-400">{lesson.progress}</span>}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-sm text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Continue Learning
        </button>
      </div>

      {/* Statistics Panel */}
      <div className="glass-card border-cyan-500/30 p-6 hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="font-bold text-cyan-400">Session Stats</h3>
            <p className="text-xs text-slate-500">Current Activity</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-cyan-400">{stats.requestsSent}</div>
            <div className="text-xs text-slate-500">Requests Sent</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
            <div className="text-xs text-slate-500">Success Rate</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">{stats.servicesUsed}</div>
            <div className="text-xs text-slate-500">Services Used</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="text-2xl font-bold text-orange-400">{stats.activeDTCs}</div>
            <div className="text-xs text-slate-500">Active DTCs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalFeatures;
