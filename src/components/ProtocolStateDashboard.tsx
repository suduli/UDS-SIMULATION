import React from 'react';
import { useUDS } from '../context/UDSContext';
import { DiagnosticSessionType } from '../types/uds';

const ProtocolStateDashboard: React.FC = () => {
  const { protocolState, ecuPower } = useUDS();

  const getSessionName = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'Default';
      case DiagnosticSessionType.PROGRAMMING: return 'Programming';
      case DiagnosticSessionType.EXTENDED: return 'Extended';
      default: return 'Unknown';
    }
  };

  const getSessionColor = (session: DiagnosticSessionType): string => {
    if (!ecuPower) return 'text-gray-600 dark:text-gray-500';
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'text-green-700 dark:text-cyber-green';
      case DiagnosticSessionType.PROGRAMMING: return 'text-purple-700 dark:text-cyber-purple';
      case DiagnosticSessionType.EXTENDED: return 'text-blue-700 dark:text-cyber-blue';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const sessionProgress = ecuPower ? Math.min(((Date.now() - protocolState.lastActivityTime) / protocolState.sessionTimeout) * 100, 100) : 0;
  const timeoutSeconds = ecuPower ? Math.floor(protocolState.sessionTimeout / 1000) : 0;

  return (
    <div className={`glass-panel p-4 mb-6 relative overflow-hidden transition-all duration-500 ${!ecuPower ? 'grayscale-[0.8] opacity-80' : ''}`}>
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/5 to-transparent opacity-20 pointer-events-none transition-opacity duration-500 ${!ecuPower ? 'opacity-0' : ''}`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0 relative z-10">

        {/* Session Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-start gap-4 px-4">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-dark-700" />
              <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent"
                strokeDasharray={150.8}
                strokeDashoffset={150.8 * (sessionProgress / 100)}
                className={`${getSessionColor(protocolState.currentSession)} transition-all duration-1000 ease-linear ${!ecuPower ? 'opacity-0' : ''}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400">{timeoutSeconds}s</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-blue-700 dark:text-cyber-blue uppercase tracking-[0.2em] mb-1">Session</div>
            <div className={`text-lg font-bold font-mono ${getSessionColor(protocolState.currentSession)} ${ecuPower ? 'text-glow' : ''}`}>
              {ecuPower ? getSessionName(protocolState.currentSession) : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* Security Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all duration-300 ${!ecuPower
              ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              : protocolState.securityUnlocked
                ? 'border-purple-300 dark:border-cyber-purple bg-purple-100 dark:bg-cyber-purple/10'
                : 'border-amber-300 dark:border-amber-500/50 bg-amber-100 dark:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}>
            <svg className={`w-6 h-6 transition-colors duration-300 ${!ecuPower
                ? 'text-gray-400 dark:text-gray-600'
                : protocolState.securityUnlocked
                  ? 'text-purple-700 dark:text-cyber-purple animate-pulse'
                  : 'text-amber-700 dark:text-amber-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={protocolState.securityUnlocked ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} />
            </svg>
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${!ecuPower ? 'text-gray-500' : protocolState.securityUnlocked ? 'text-purple-700 dark:text-cyber-purple' : 'text-amber-700 dark:text-amber-500'}`}>Security</div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${!ecuPower
                ? 'text-gray-500'
                : protocolState.securityUnlocked
                  ? 'text-purple-700 dark:text-cyber-purple text-glow'
                  : 'text-amber-700 dark:text-amber-500 text-shadow-sm'
              }`}>
              {ecuPower ? (protocolState.securityUnlocked ? `Lvl ${protocolState.securityLevel}` : 'LOCKED') : '---'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Communication Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${!ecuPower
              ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              : protocolState.communicationEnabled
                ? 'border-green-300 dark:border-cyber-green/50 bg-green-100 dark:bg-cyber-green/5'
                : 'border-red-300 dark:border-red-500/50 bg-red-100 dark:bg-red-500/5'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${!ecuPower
                ? 'bg-gray-400 dark:bg-gray-600'
                : protocolState.communicationEnabled
                  ? 'bg-green-600 dark:bg-cyber-green animate-ping'
                  : 'bg-red-600 dark:bg-red-500'
              }`}></div>
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${!ecuPower ? 'text-gray-500' : 'text-green-700 dark:text-cyber-green'}`}>Comms</div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${!ecuPower
                ? 'text-gray-500'
                : protocolState.communicationEnabled
                  ? 'text-green-700 dark:text-cyber-green text-glow'
                  : 'text-red-700 dark:text-red-500'
              }`}>
              {ecuPower ? (protocolState.communicationEnabled ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

        {/* Data Bus Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-end gap-4 px-4">
          <div className="text-right">
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${!ecuPower ? 'text-gray-500' : 'text-blue-700 dark:text-cyber-blue'}`}>Data Bus</div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${!ecuPower ? 'text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {ecuPower ? (protocolState.downloadInProgress ? 'DOWNLOADING...' : protocolState.uploadInProgress ? 'UPLOADING...' : 'IDLE') : 'OFF'}
            </div>
          </div>
          <div className={`h-10 flex items-end gap-0.5 w-24 transition-opacity duration-300 ${!ecuPower ? 'opacity-20 grayscale' : 'opacity-50'}`}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`flex-1 transition-all duration-300 ${!ecuPower ? 'bg-gray-600 h-1' : 'bg-blue-600 dark:bg-cyber-blue'}`} style={{ height: !ecuPower ? '4px' : `${Math.random() * 100}%` }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProtocolStateDashboard;
