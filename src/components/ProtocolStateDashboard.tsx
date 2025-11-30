import React from 'react';
import { useUDS } from '../context/UDSContext';
import { DiagnosticSessionType } from '../types/uds';

const ProtocolStateDashboard: React.FC = () => {
  const { protocolState } = useUDS();

  const getSessionName = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'Default';
      case DiagnosticSessionType.PROGRAMMING: return 'Programming';
      case DiagnosticSessionType.EXTENDED: return 'Extended';
      default: return 'Unknown';
    }
  };

  const getSessionColor = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'text-cyber-green';
      case DiagnosticSessionType.PROGRAMMING: return 'text-cyber-purple';
      case DiagnosticSessionType.EXTENDED: return 'text-cyber-blue';
      default: return 'text-gray-400';
    }
  };

  const sessionProgress = Math.min(((Date.now() - protocolState.lastActivityTime) / protocolState.sessionTimeout) * 100, 100);
  const timeoutSeconds = Math.floor(protocolState.sessionTimeout / 1000);

  return (
    <div className="glass-panel p-4 mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/5 to-transparent opacity-20 pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0 relative z-10">

        {/* Session Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-start gap-4 px-4">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-dark-700" />
              <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent"
                strokeDasharray={150.8}
                strokeDashoffset={150.8 * (sessionProgress / 100)}
                className={`${getSessionColor(protocolState.currentSession)} transition-all duration-1000 ease-linear`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400">{timeoutSeconds}s</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-cyber-blue uppercase tracking-[0.2em] mb-1">Session</div>
            <div className={`text-lg font-bold font-mono ${getSessionColor(protocolState.currentSession)} text-glow`}>
              {getSessionName(protocolState.currentSession)}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* Security Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${protocolState.securityUnlocked ? 'border-cyber-purple bg-cyber-purple/10' : 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
            <svg className={`w-6 h-6 ${protocolState.securityUnlocked ? 'text-cyber-purple animate-pulse' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={protocolState.securityUnlocked ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} />
            </svg>
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${protocolState.securityUnlocked ? 'text-cyber-purple' : 'text-amber-500'}`}>Security</div>
            <div className={`text-lg font-bold font-mono ${protocolState.securityUnlocked ? 'text-cyber-purple text-glow' : 'text-amber-500 text-shadow-sm'}`}>
              {protocolState.securityUnlocked ? `Lvl ${protocolState.securityLevel}` : 'LOCKED'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Communication Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${protocolState.communicationEnabled ? 'border-cyber-green/50 bg-cyber-green/5' : 'border-red-500/50 bg-red-500/5'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${protocolState.communicationEnabled ? 'bg-cyber-green animate-ping' : 'bg-red-500'}`}></div>
          </div>
          <div>
            <div className="text-[10px] text-cyber-green uppercase tracking-[0.2em] mb-1">Comms</div>
            <div className={`text-lg font-bold font-mono ${protocolState.communicationEnabled ? 'text-cyber-green text-glow' : 'text-red-500'}`}>
              {protocolState.communicationEnabled ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Data Transfer Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-end gap-4 px-4">
          <div className="text-right">
            <div className="text-[10px] text-cyber-blue uppercase tracking-[0.2em] mb-1">Data Bus</div>
            <div className="text-lg font-bold font-mono text-gray-800 dark:text-gray-200">
              {protocolState.downloadInProgress ? 'DOWNLOADING...' : protocolState.uploadInProgress ? 'UPLOADING...' : 'IDLE'}
            </div>
          </div>
          <div className="h-10 flex items-end gap-0.5 opacity-50 w-24">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 bg-cyber-blue transition-all duration-300" style={{ height: `${Math.random() * 100}%` }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProtocolStateDashboard;
