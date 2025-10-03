import React from 'react';
import { useUDS } from '../context/UDSContext';
import { DiagnosticSessionType } from '../types/uds';

const ProtocolStateDashboard: React.FC = () => {
  const { protocolState } = useUDS();

  const getSessionName = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT:
        return 'Default';
      case DiagnosticSessionType.PROGRAMMING:
        return 'Programming';
      case DiagnosticSessionType.EXTENDED:
        return 'Extended';
      default:
        return 'Unknown';
    }
  };

  const getSessionColor = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT:
        return 'text-cyber-green';
      case DiagnosticSessionType.PROGRAMMING:
        return 'text-cyber-purple';
      case DiagnosticSessionType.EXTENDED:
        return 'text-cyber-blue';
      default:
        return 'text-gray-400';
    }
  };

  const sessionProgress = Math.min(((Date.now() - protocolState.lastActivityTime) / protocolState.sessionTimeout) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Session Card */}
      <div className="glass-card border-cyan-500/30 p-6 hover-lift hover:shadow-neon-cyan group animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Session</span>
            <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${
              protocolState.currentSession === DiagnosticSessionType.DEFAULT ? 'bg-cyber-green shadow-green-400/50' :
              protocolState.currentSession === DiagnosticSessionType.EXTENDED ? 'bg-cyber-blue shadow-cyan-400/50' :
              'bg-cyber-purple shadow-purple-400/50'
            }`} />
          </div>
          <div className={`text-2xl font-bold mb-2 ${getSessionColor(protocolState.currentSession)}`}>
            {getSessionName(protocolState.currentSession)}
          </div>
          <div className="flex gap-1 mb-2">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i}
                className={`progress-bar ${i < Math.floor((7 * (100 - sessionProgress)) / 100) ? 'bg-cyan-400' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Timeout: {Math.floor(protocolState.sessionTimeout / 1000)}s
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="glass-card border-purple-500/30 p-6 hover-lift hover:shadow-neon-purple group animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Security</span>
            <svg className={`w-5 h-5 ${protocolState.securityUnlocked ? 'text-purple-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className={`text-2xl font-bold mb-2 ${protocolState.securityUnlocked ? 'text-purple-400' : 'text-slate-500'}`}>
            {protocolState.securityUnlocked ? `🔓 Level ${protocolState.securityLevel}` : '🔒 Locked'}
          </div>
          <div className="text-xs text-slate-500">
            {protocolState.securityAttempts > 0 ? `Attempts: ${protocolState.securityAttempts}/3` : 'No attempts'}
          </div>
        </div>
      </div>

      {/* Communication Card */}
      <div className="glass-card border-green-500/30 p-6 hover-lift hover:shadow-neon-green group animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Communication</span>
            <svg className={`w-5 h-5 ${protocolState.communicationEnabled ? 'text-green-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <div className={`text-2xl font-bold mb-2 ${protocolState.communicationEnabled ? 'text-green-400' : 'text-slate-500'}`}>
            {protocolState.communicationEnabled ? '✓ Enabled' : '✗ Disabled'}
          </div>
          <div className="text-xs text-slate-500">Tx: 1.2k | Rx: 856</div>
        </div>
      </div>

      {/* Data Transfer Card */}
      <div className="glass-card border-slate-500/30 p-6 hover-lift group animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Data Transfer</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div className={`text-2xl font-bold mb-2 ${(protocolState.downloadInProgress || protocolState.uploadInProgress) ? 'text-yellow-400' : 'text-slate-400'}`}>
            {protocolState.downloadInProgress && 'Download'}
            {protocolState.uploadInProgress && 'Upload'}
            {!protocolState.downloadInProgress && !protocolState.uploadInProgress && 'Idle'}
          </div>
          <div className="flex gap-0.5 h-8 items-end mt-2">
            {[2,4,6,3,8,5,2,4,9,6,3,1].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-600 rounded-t transition-all" style={{height: `${h*10}%`}} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolStateDashboard;
