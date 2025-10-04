/**
 * TimingMetrics Component
 * Displays response timing metrics with visual indicators
 */

import React, { useMemo } from 'react';
import { useUDS } from '../context/UDSContext';

const TimingMetrics: React.FC = () => {
  const { requestHistory } = useUDS();
  
  const timingData = useMemo(() => {
    if (requestHistory.length === 0) {
      return {
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        chartData: [],
        recent: []
      };
    }

    // Calculate response times (in milliseconds)
    const times = requestHistory.map(item => 
      item.response.timestamp - item.request.timestamp
    );
    
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Get last 10 for chart
    const recent = requestHistory.slice(-10).map((item, idx) => ({
      index: idx + 1,
      time: item.response.timestamp - item.request.timestamp,
      serviceName: `0x${item.request.sid.toString(16).toUpperCase().padStart(2, '0')}`
    }));
    
    return { avgTime, minTime, maxTime, recent };
  }, [requestHistory]);
  
  const getTimeColor = (time: number) => {
    if (time < 50) return 'text-green-400';
    if (time < 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (time: number) => {
    if (time < 50) return 'bg-green-400';
    if (time < 100) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getBarHeight = (time: number) => {
    const maxHeight = 100; // percentage
    const maxDisplayTime = 150; // ms - anything above shows as max height
    return Math.min((time / maxDisplayTime) * maxHeight, maxHeight);
  };
  
  if (requestHistory.length === 0) {
    return (
      <div className="glass-card p-6 border-cyan-500/30">
        <h3 className="text-lg font-bold text-cyber-blue mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Response Timing
        </h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm">Send requests to see timing metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border-cyan-500/30 animate-fade-in">
      <h3 className="text-lg font-bold text-cyber-blue mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Response Timing
      </h3>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600 hover:border-cyber-blue/30 transition-colors">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Average
          </div>
          <div className={`text-2xl font-bold ${getTimeColor(timingData.avgTime)}`}>
            {timingData.avgTime}
            <span className="text-sm ml-1">ms</span>
          </div>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600 hover:border-green-400/30 transition-colors">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Fastest
          </div>
          <div className="text-2xl font-bold text-green-400">
            {timingData.minTime}
            <span className="text-sm ml-1">ms</span>
          </div>
        </div>
        <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600 hover:border-red-400/30 transition-colors">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Slowest
          </div>
          <div className="text-2xl font-bold text-red-400">
            {timingData.maxTime}
            <span className="text-sm ml-1">ms</span>
          </div>
        </div>
      </div>
      
      {/* Simple Bar Chart */}
      {timingData.recent.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
            <span>Last {timingData.recent.length} Requests</span>
            <span className="text-gray-500">Response time (ms)</span>
          </div>
          <div className="flex items-end gap-2 h-32 bg-dark-900/50 rounded-lg p-3 border border-dark-700">
            {timingData.recent.map((item, idx) => (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 animate-fade-in">
                  <div className="bg-dark-800 border border-cyber-blue rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-neon-cyan">
                    <div className="font-bold text-cyber-blue">{item.serviceName}</div>
                    <div className="text-gray-300">{item.time}ms</div>
                  </div>
                  <div className="w-2 h-2 bg-dark-800 border-l border-b border-cyber-blue transform rotate-45 mx-auto -mt-1"></div>
                </div>
                
                {/* Bar */}
                <div className="w-full flex flex-col justify-end items-center h-full">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${getBarColor(item.time)} opacity-80 hover:opacity-100`}
                    style={{ height: `${getBarHeight(item.time)}%` }}
                  />
                </div>
                
                {/* Label */}
                <div className="text-[10px] text-gray-500 font-mono">
                  {item.index}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* P2/P2* Timeout Reference */}
      <div className="bg-dark-800/30 rounded-lg p-3 border border-dark-600">
        <div className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          UDS Timeout Reference
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">P2 (Standard):</span>
            <span className="font-mono text-green-400 font-bold">50ms</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">P2* (Extended):</span>
            <span className="font-mono text-yellow-400 font-bold">500ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimingMetrics;
