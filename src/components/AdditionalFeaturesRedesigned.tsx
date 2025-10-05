/**
 * Additional Features Component - REDESIGNED VERSION
 * Enhanced DTC Management, Learning Center, and Session Statistics panels
 * Implements comprehensive UI/UX improvements per redesign proposal
 * 
 * Key Improvements:
 * - Enhanced information hierarchy with trend indicators
 * - Progressive disclosure with expandable sections
 * - Improved accessibility with ARIA labels and semantic HTML
 * - Visual consistency with unified icon system
 * - Interactive micro-animations and hover states
 * - Better data visualization with progress bars and status indicators
 */

import { useState, type CSSProperties, type FC } from 'react';
import { useUDS } from '../context/UDSContext';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface DTCEntry {
  code: string;
  status: 'confirmed' | 'pending' | 'cleared';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  timestamp: Date;
  ecuModule: string;
  freezeFrameAvailable: boolean;
  occurrenceCount?: number;
}

interface LearningModule {
  id: string;
  title: string;
  description?: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress: number; // 0-100
  category: string;
}

interface StatMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  progress?: number; // 0-100
  status?: 'success' | 'warning' | 'error' | 'info';
  context?: string;
}

interface GlassCardStyle extends CSSProperties {
  '--card-border-start'?: string;
  '--card-border-end'?: string;
  '--card-border-glow'?: string;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const createGlassCardStyle = (
  start: string,
  end: string,
  glow?: string
): GlassCardStyle => ({
  '--card-border-start': start,
  '--card-border-end': end,
  '--card-border-glow': glow ?? start,
});

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

// ========================================
// SUB-COMPONENTS
// ========================================

const TrendIndicator: FC<{ trend: { direction: 'up' | 'down'; percentage: number } }> = ({ trend }) => {
  const isPositive = trend.direction === 'up';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      isPositive ? 'text-green-400' : 'text-red-400'
    }`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isPositive ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        )}
      </svg>
      {trend.percentage}%
    </span>
  );
};

const ProgressBar: FC<{ progress: number; className?: string; color?: string }> = ({ 
  progress, 
  className = '', 
  color = 'bg-cyan-500' 
}) => (
  <div className={`w-full bg-slate-800/50 rounded-full h-2 overflow-hidden ${className}`}>
    <div 
      className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
);

const SeverityBadge: FC<{ severity: 'critical' | 'warning' | 'info' }> = ({ severity }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };

  const icons = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[severity]}`}>
      <span className="text-xs">{icons[severity]}</span>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const DifficultyBadge: FC<{ difficulty: 'beginner' | 'intermediate' | 'advanced' }> = ({ difficulty }) => {
  const styles = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/50',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[difficulty]}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const AdditionalFeaturesRedesigned: FC = () => {
  const { metrics } = useUDS();
  const [expandedDTC, setExpandedDTC] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Mock enhanced DTC data
  const dtcs: DTCEntry[] = [
    { 
      code: 'P0420', 
      status: 'confirmed',
      severity: 'critical',
      description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      ecuModule: 'Engine Control Module',
      freezeFrameAvailable: true,
      occurrenceCount: 3,
    },
    { 
      code: 'P0171', 
      status: 'pending',
      severity: 'warning',
      description: 'System Too Lean (Bank 1)',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      ecuModule: 'Fuel System Control',
      freezeFrameAvailable: false,
      occurrenceCount: 1,
    },
  ];

  // Mock enhanced learning data
  const lessons: LearningModule[] = [
    { 
      id: 'session-control',
      title: 'Session Control',
      description: 'Master diagnostic session management and transitions',
      lessonsCompleted: 5,
      lessonsTotal: 5,
      difficulty: 'beginner',
      duration: 15,
      status: 'completed',
      progress: 100,
      category: 'Fundamentals',
    },
    { 
      id: 'security-access',
      title: 'Security Access',
      description: 'Learn authentication and security protocols',
      lessonsCompleted: 3,
      lessonsTotal: 7,
      difficulty: 'intermediate',
      duration: 45,
      status: 'in-progress',
      progress: 43,
      category: 'Security',
    },
    { 
      id: 'dtc-management',
      title: 'DTC Management',
      description: 'Advanced diagnostic trouble code handling',
      lessonsCompleted: 1,
      lessonsTotal: 4,
      difficulty: 'advanced',
      duration: 30,
      status: 'in-progress',
      progress: 25,
      category: 'Diagnostics',
    },
  ];

  // Enhanced session stats with trends
  const stats: StatMetric[] = [
    {
      id: 'requests',
      label: 'Requests Sent',
      value: metrics.requestsSent,
      unit: 'requests',
      trend: { direction: 'up', percentage: 23 },
      status: 'info',
      context: 'vs last session',
    },
    {
      id: 'success',
      label: 'Success Rate',
      value: metrics.successRate,
      unit: '%',
      progress: metrics.successRate,
      status: metrics.successRate >= 90 ? 'success' : metrics.successRate >= 70 ? 'warning' : 'error',
    },
    {
      id: 'services',
      label: 'Services Used',
      value: metrics.servicesUsed,
      context: `${metrics.servicesUsed} / 18 available`,
      progress: (metrics.servicesUsed / 18) * 100,
      status: 'info',
    },
    {
      id: 'dtcs',
      label: 'Active DTCs',
      value: metrics.activeDTCs,
      unit: 'codes',
      status: metrics.activeDTCs > 0 ? 'error' : 'success',
      context: dtcs.filter(d => d.severity === 'critical').length > 0 ? '1 critical' : 'All clear',
    },
  ];

  const totalLessons = lessons.reduce((sum, l) => sum + l.lessonsTotal, 0);
  const completedLessons = lessons.reduce((sum, l) => sum + l.lessonsCompleted, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ========================================
          SESSION STATS PANEL - REDESIGNED
          ======================================== */}
      <section
        className="glass-card p-6 hover-lift animate-fade-in"
        style={{
          ...createGlassCardStyle('rgba(6, 182, 212, 0.9)', 'rgba(34, 211, 238, 0.5)', 'rgba(14, 165, 233, 0.32)'),
        }}
        aria-labelledby="session-stats-heading"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 id="session-stats-heading" className="font-bold text-cyan-400">Session Stats</h3>
              <p className="text-xs text-slate-500">Current Activity</p>
            </div>
          </div>
          <button 
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            aria-label="View detailed statistics"
          >
            <span>Details</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Stats List */}
        <div className="space-y-4" role="list">
          {stats.map((stat) => (
            <div 
              key={stat.id}
              className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
              role="listitem"
              aria-label={`${stat.label}: ${stat.value}${stat.unit || ''} ${stat.context || ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      stat.status === 'success' ? 'text-green-400' :
                      stat.status === 'warning' ? 'text-yellow-400' :
                      stat.status === 'error' ? 'text-red-400' :
                      'text-cyan-400'
                    }`}>
                      {stat.value}
                    </span>
                    {stat.unit && <span className="text-sm text-slate-500">{stat.unit}</span>}
                  </div>
                </div>
                {stat.trend && <TrendIndicator trend={stat.trend} />}
              </div>
              
              {stat.context && (
                <div className="text-xs text-slate-500 mb-2">{stat.context}</div>
              )}
              
              {stat.progress !== undefined && (
                <ProgressBar 
                  progress={stat.progress} 
                  color={
                    stat.status === 'success' ? 'bg-green-500' :
                    stat.status === 'warning' ? 'bg-yellow-500' :
                    stat.status === 'error' ? 'bg-red-500' :
                    'bg-cyan-500'
                  }
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================
          LEARNING CENTER PANEL - REDESIGNED
          ======================================== */}
      <section
        className="glass-card p-6 hover-lift animate-fade-in"
        style={{
          ...createGlassCardStyle('rgba(168, 85, 247, 0.92)', 'rgba(192, 132, 252, 0.55)', 'rgba(168, 85, 247, 0.32)'),
          animationDelay: '0.1s',
        }}
        aria-labelledby="learning-center-heading"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 id="learning-center-heading" className="font-bold text-purple-400">Learning Center</h3>
              <p className="text-xs text-slate-500">Interactive Tutorials</p>
            </div>
          </div>
          <button 
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            aria-label="Browse all courses"
          >
            <span>Browse</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-400">YOUR PROGRESS</span>
            <span className="text-xs text-slate-400">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <ProgressBar progress={overallProgress} color="bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="text-xs text-purple-400 mt-1 text-right">{overallProgress}% Complete</div>
        </div>

        {/* Lessons List */}
        <div className="space-y-3" role="list">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id}
              className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
              role="listitem"
              onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {lesson.status === 'completed' ? (
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : lesson.status === 'locked' ? (
                      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-purple-400">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span>{lesson.lessonsCompleted}/{lesson.lessonsTotal}</span>
                    <span>•</span>
                    <DifficultyBadge difficulty={lesson.difficulty} />
                    <span>•</span>
                    <span>{lesson.duration} min</span>
                  </div>
                </div>
              </div>
              
              {lesson.status !== 'completed' && lesson.status !== 'locked' && (
                <div className="mt-2">
                  <ProgressBar progress={lesson.progress} color="bg-purple-500" className="mb-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{lesson.progress}%</span>
                    <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                      {lesson.status === 'in-progress' ? 'Resume' : 'Start'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {lesson.status === 'completed' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </span>
                  <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className="w-full mt-4 py-2.5 bg-purple-500/20 border border-purple-500/50 rounded-lg text-sm text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2 group">
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Explore More Courses
        </button>
      </section>

      {/* ========================================
          DTC MANAGEMENT PANEL - REDESIGNED
          ======================================== */}
      <section
        className="glass-card p-6 hover-lift animate-fade-in"
        style={{
          ...createGlassCardStyle('rgba(249, 115, 22, 0.95)', 'rgba(251, 146, 60, 0.55)', 'rgba(249, 115, 22, 0.35)'),
          animationDelay: '0.2s',
        }}
        aria-labelledby="dtc-management-heading"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 id="dtc-management-heading" className="font-bold text-orange-400">DTC Management</h3>
              <p className="text-xs text-slate-500">Diagnostic Trouble Codes</p>
            </div>
          </div>
          <button 
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
            aria-label="Scan ECU for codes"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Scan</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div>
            <div className="text-xs text-slate-500">Active Codes</div>
            <div className="text-xl font-bold text-orange-400">{dtcs.filter(d => d.status !== 'cleared').length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">History</div>
            <div className="text-xl font-bold text-slate-400">5</div>
          </div>
        </div>

        {/* DTC List */}
        <div className="space-y-3" role="list">
          {dtcs.map((dtc) => (
            <div 
              key={dtc.code}
              className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer"
              role="listitem"
              onClick={() => setExpandedDTC(expandedDTC === dtc.code ? null : dtc.code)}
            >
              {/* DTC Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    dtc.severity === 'critical' ? 'bg-red-500' :
                    dtc.severity === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="font-mono text-sm font-bold text-orange-400">{dtc.code}</span>
                </div>
                <SeverityBadge severity={dtc.severity} />
              </div>

              {/* Description */}
              <div className="text-xs text-slate-300 mb-2">{dtc.description}</div>

              {/* Status Row */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                <span className={`font-medium ${
                  dtc.status === 'confirmed' ? 'text-red-400' :
                  dtc.status === 'pending' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {dtc.status.charAt(0).toUpperCase() + dtc.status.slice(1)}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(dtc.timestamp)}</span>
              </div>

              {/* Expanded Details */}
              {expandedDTC === dtc.code && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 animate-slide-down">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">ECU Module:</span>
                    <span className="text-slate-300">{dtc.ecuModule}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Freeze Frame:</span>
                    <span className={dtc.freezeFrameAvailable ? 'text-green-400' : 'text-slate-500'}>
                      {dtc.freezeFrameAvailable ? 'Available' : 'N/A'}
                    </span>
                  </div>
                  {dtc.occurrenceCount && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Occurrences:</span>
                      <span className="text-slate-300">{dtc.occurrenceCount}</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 bg-orange-500/20 border border-orange-500/50 rounded text-xs text-orange-400 hover:bg-orange-500/30 transition-all">
                      Clear Code
                    </button>
                    {dtc.freezeFrameAvailable && (
                      <button className="flex-1 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-blue-400 hover:bg-blue-500/30 transition-all">
                        View Data
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button className="w-full py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-sm text-orange-400 hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Full Report
          </button>
          {dtcs.length > 0 && (
            <button className="w-full py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Codes
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdditionalFeaturesRedesigned;
