import React, { useState } from 'react';
import FeatureCardWrapper from './FeatureCardWrapper';

interface DTCCode {
  code: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'confirmed' | 'pending' | 'cleared';
  timestamp: string;
  ecuModule: string;
  occurrences: number;
  freezeFrame: boolean;
}

const DTCManagementCardRedesigned: React.FC = () => {
  const [dtcs] = useState<DTCCode[]>([
    {
      code: 'P0420',
      description: 'Catalyst System Efficiency',
      severity: 'critical',
      status: 'confirmed',
      timestamp: '2 days ago',
      ecuModule: 'Powertrain',
      occurrences: 3,
      freezeFrame: true
    },
    {
      code: 'P0171',
      description: 'System Too Lean Bank 1',
      severity: 'warning',
      status: 'pending',
      timestamp: '5 hours ago',
      ecuModule: 'Engine',
      occurrences: 1,
      freezeFrame: false
    }
  ]);

  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const criticalCount = dtcs.filter(d => d.severity === 'critical').length;
  const warningCount = dtcs.filter(d => d.severity === 'warning').length;
  const infoCount = dtcs.filter(d => d.severity === 'info').length;

  const getSeverityConfig = (severity: string) => {
    switch(severity) {
      case 'critical': 
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/50',
          dot: 'bg-red-500',
          pulse: 'animate-pulse'
        };
      case 'warning': 
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
          dot: 'bg-amber-500',
          pulse: ''
        };
      case 'info': 
        return {
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
          dot: 'bg-blue-500',
          pulse: ''
        };
      default: 
        return {
          badge: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
          dot: 'bg-slate-500',
          pulse: ''
        };
    }
  };

  const handleScanECU = () => {
    console.log('Scanning ECU...');
    // Implement scan logic
  };

  const toggleExpanded = (code: string) => {
    setExpandedCode(expandedCode === code ? null : code);
  };

  const icon = (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const headerAction = (
    <button 
      onClick={handleScanECU}
      className="px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-500/50 rounded-lg hover:bg-orange-500/10 transition-colors"
      aria-label="Scan ECU"
    >
      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Scan
    </button>
  );

  return (
    <FeatureCardWrapper
      icon={icon}
      title="DTC Management"
      subtitle="Diagnostic Trouble Codes"
      accentColor="orange"
      headerAction={headerAction}
      actions={
        <div className="flex items-center gap-2">
          <button className="flex-1 px-4 py-2.5 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-400 font-medium hover:bg-orange-500/30 transition-colors">
            View All DTCs
          </button>
          <button className="px-4 py-2.5 border border-slate-700/50 rounded-lg text-slate-400 font-medium hover:bg-slate-800/50 transition-colors">
            Export
          </button>
        </div>
      }
    >
      {/* Severity Summary */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/30">
        <div className="flex items-center gap-1.5 text-sm">
          <div className={`w-2 h-2 rounded-full ${getSeverityConfig('critical').dot} ${getSeverityConfig('critical').pulse}`} />
          <span className="text-slate-300">{criticalCount} Critical</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className={`w-2 h-2 rounded-full ${getSeverityConfig('warning').dot}`} />
          <span className="text-slate-300">{warningCount} Warning</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className={`w-2 h-2 rounded-full ${getSeverityConfig('info').dot}`} />
          <span className="text-slate-300">{infoCount} Info</span>
        </div>
      </div>

      {/* DTC List */}
      <div className="space-y-3">
        {dtcs.map((dtc, index) => {
          const config = getSeverityConfig(dtc.severity);
          const isExpanded = expandedCode === dtc.code;
          
          return (
            <div 
              key={dtc.code}
              className="bg-dark-800/60 rounded-xl p-4 border border-slate-700/30 hover:border-orange-500/30 transition-all duration-200 cursor-pointer hover:bg-dark-800/80 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => toggleExpanded(dtc.code)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleExpanded(dtc.code);
                }
              }}
              aria-expanded={isExpanded}
            >
              {/* Code and Status */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-mono font-semibold text-orange-400 tracking-wider">
                  {dtc.code}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${config.badge}`}>
                  {dtc.status}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-sm text-slate-300 mb-3">
                {dtc.description}
              </p>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <span>🕐</span>
                  <span>{dtc.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{dtc.ecuModule}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>↻</span>
                  <span>{dtc.occurrences} time{dtc.occurrences !== 1 ? 's' : ''}</span>
                </div>
                {dtc.freezeFrame && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <span>❄️</span>
                    <span>Freeze frame</span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-700/30 animate-slide-up">
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">Additional Details</h4>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>First Occurrence:</span>
                      <span className="text-slate-300">3 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Occurrence:</span>
                      <span className="text-slate-300">{dtc.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Affected Systems:</span>
                      <span className="text-slate-300">Emissions, Performance</span>
                    </div>
                    {dtc.freezeFrame && (
                      <button className="w-full mt-2 px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors">
                        View Freeze Frame Data
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FeatureCardWrapper>
  );
};

export default DTCManagementCardRedesigned;
