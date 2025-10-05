import React, { useState } from 'react';
import FeatureCardWrapper from './FeatureCardWrapper';

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
}

interface StatMetric {
  value: number | string;
  label: string;
  trend?: TrendData;
  context?: string;
  color: 'cyan' | 'green' | 'purple' | 'orange' | 'slate';
}

type TimeRange = 'hour' | 'day' | 'week' | 'month';

const SessionStatsCardRedesigned: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  
  const stats: StatMetric[] = [
    {
      value: 247,
      label: 'Requests Sent',
      trend: { direction: 'up', percentage: 23 },
      context: 'vs. last session',
      color: 'cyan'
    },
    {
      value: '98%',
      label: 'Success Rate',
      trend: { direction: 'up', percentage: 2 },
      color: 'green'
    },
    {
      value: 12,
      label: 'Services Used',
      context: '12/18 active',
      color: 'purple'
    },
    {
      value: 5,
      label: 'Active DTCs',
      context: '2 critical',
      color: 'orange'
    },
    {
      value: '142ms',
      label: 'Avg Response',
      trend: { direction: 'down', percentage: 18 },
      context: 'faster',
      color: 'cyan'
    }
  ];

  const getColorClass = (color: string) => {
    switch(color) {
      case 'cyan': return 'text-cyan-400';
      case 'green': return 'text-green-400';
      case 'purple': return 'text-purple-400';
      case 'orange': return 'text-orange-400';
      case 'slate': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const TrendIndicator = ({ trend }: { trend: TrendData }) => {
    const isPositive = trend.direction === 'up';
    const isNegative = trend.direction === 'down';
    
    if (trend.direction === 'neutral') {
      return null;
    }
    
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ) : isNegative ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        ) : null}
        {trend.percentage}%
      </span>
    );
  };

  const handleExport = () => {
    console.log('Exporting stats...');
    // Implement export logic
  };

  const handleViewDetails = () => {
    console.log('Viewing details...');
    // Implement view details logic
  };

  const icon = (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const headerAction = (
    <select 
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
      className="px-3 py-1.5 text-xs font-medium bg-dark-800 border border-slate-700 rounded-lg text-slate-300 hover:border-cyan-500/50 transition-colors cursor-pointer focus:outline-none focus:border-cyan-500"
      aria-label="Select time range"
    >
      <option value="hour">Last Hour</option>
      <option value="day">Last 24h</option>
      <option value="week">Last Week</option>
      <option value="month">Last Month</option>
    </select>
  );

  return (
    <FeatureCardWrapper
      icon={icon}
      title="Session Stats"
      subtitle="Current Activity"
      accentColor="cyan"
      headerAction={headerAction}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2.5 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
          >
            View Details
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2.5 border border-slate-700/50 rounded-lg text-slate-400 font-medium hover:bg-slate-800/50 transition-colors"
          >
            Export
          </button>
        </div>
      }
    >
      {/* Hero Metric */}
      <div className="mb-6 pb-6 border-b border-slate-700/30">
        <div className="text-center">
          <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-fade-in">
            {stats[0].value}
          </div>
          <div className="text-sm text-slate-400 mb-2">{stats[0].label}</div>
          {stats[0].trend && (
            <div className="flex items-center justify-center gap-2">
              <TrendIndicator trend={stats[0].trend} />
              <span className="text-xs text-slate-500">{stats[0].context}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.slice(1).map((stat, index) => (
          <div 
            key={stat.label}
            className="bg-dark-800/60 rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`text-2xl font-bold mb-1 ${getColorClass(stat.color)}`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
              {stat.label}
            </div>
            {stat.context && (
              <div className="text-xs text-slate-500 mb-2">
                {stat.context}
              </div>
            )}
            {stat.trend && (
              <div className="mt-2">
                <TrendIndicator trend={stat.trend} />
              </div>
            )}
          </div>
        ))}
      </div>
    </FeatureCardWrapper>
  );
};

export default SessionStatsCardRedesigned;
