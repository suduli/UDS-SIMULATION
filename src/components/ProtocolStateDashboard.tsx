import React, { useState, useEffect, useMemo } from 'react';
import { useUDS } from '../context/UDSContext';
import { DiagnosticSessionType } from '../types/uds';

const ProtocolStateDashboard: React.FC = () => {
  const { protocolState, ecuPower, toggleEcuPower, voltage, current, testerPresentState, startTesterPresent, stopTesterPresent } = useUDS();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Update remaining time every 100ms for smooth countdown
  useEffect(() => {
    if (!ecuPower) {
      setRemainingTime(null);
      return;
    }

    // Only show countdown for non-default sessions
    if (protocolState.currentSession === DiagnosticSessionType.DEFAULT) {
      setRemainingTime(null);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - protocolState.lastActivityTime;
      const remaining = Math.max(0, protocolState.sessionTimeout - elapsed);
      setRemainingTime(remaining);
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [ecuPower, protocolState.currentSession, protocolState.lastActivityTime, protocolState.sessionTimeout]);

  const getSessionName = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'Default';
      case DiagnosticSessionType.PROGRAMMING: return 'Programming';
      case DiagnosticSessionType.EXTENDED: return 'Extended';
      case DiagnosticSessionType.SAFETY: return 'Safety';
      default: return 'Unknown';
    }
  };

  const getSessionColor = (session: DiagnosticSessionType): string => {
    if (!ecuPower) return 'text-gray-600 dark:text-gray-500';
    switch (session) {
      case DiagnosticSessionType.DEFAULT: return 'text-green-700 dark:text-cyber-green';
      case DiagnosticSessionType.PROGRAMMING: return 'text-purple-700 dark:text-cyber-purple';
      case DiagnosticSessionType.EXTENDED: return 'text-blue-700 dark:text-cyber-blue';
      case DiagnosticSessionType.SAFETY: return 'text-orange-700 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Calculate progress for visual ring (100% = just started, 0% = timed out)
  const sessionProgress = remainingTime !== null
    ? Math.min(100, (remainingTime / protocolState.sessionTimeout) * 100)
    : 0;

  // Memoize random heights for data bus visualization to prevent re-render cascade
  // This fixes the cluster page freeze caused by Math.random() in render cycle
  const dataBusHeights = useMemo(() =>
    Array(12).fill(0).map(() => Math.random() * 100),
    [ecuPower]);

  // Display remaining seconds or '--' for default session
  const timeoutDisplay = remainingTime !== null
    ? `${Math.ceil(remainingTime / 1000)}s`
    : ecuPower ? '--' : '0s';

  return (
    <div className={`glass-panel p-4 mb-6 relative overflow-hidden transition-all duration-500 ${!ecuPower ? 'grayscale-[0.8] opacity-80' : ''}`}>
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/5 to-transparent opacity-20 pointer-events-none transition-opacity duration-500 ${!ecuPower ? 'opacity-0' : ''}`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0 relative z-10">

        {/* IGNITION Toggle */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center lg:justify-start gap-4 px-4">
          <button
            onClick={toggleEcuPower}
            className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 ${ecuPower
              ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-100 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'border-red-300 dark:border-red-500/50 bg-red-100 dark:bg-red-500/10'
              }`}
          >
            <svg className={`w-6 h-6 transition-colors duration-300 ${ecuPower ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${ecuPower ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Ignition</div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${ecuPower ? 'text-emerald-700 dark:text-emerald-400 text-glow' : 'text-red-600 dark:text-red-400'}`}>
              {ecuPower ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* SYS UP/DOWN Indicator */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all duration-300 ${ecuPower
            ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-100 dark:bg-emerald-500/10'
            : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
            }`}>
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${ecuPower
              ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'
              : 'bg-gray-400 dark:bg-gray-600'
              }`} />
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${ecuPower ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}`}>System</div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${ecuPower ? 'text-emerald-700 dark:text-emerald-400 text-glow' : 'text-gray-500'}`}>
              {ecuPower ? 'SYS UP' : 'SYS DOWN'}
            </div>
            {ecuPower && (
              <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                {voltage.toFixed(1)}V / {current.toFixed(2)}A
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* Session Hologram */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
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
              <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400">{timeoutDisplay}</span>
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
        <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

        {/* Tester Present Keep-Alive */}
        <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 px-4">
          <button
            onClick={() => {
              if (testerPresentState.isActive) {
                stopTesterPresent();
              } else {
                startTesterPresent();
              }
            }}
            className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 ${testerPresentState.isActive
              ? 'border-amber-400 dark:border-amber-500/50 bg-amber-100 dark:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
              }`}
          >
            {/* Heartbeat Icon */}
            <svg
              className={`w-6 h-6 transition-colors duration-300 ${testerPresentState.isActive ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'} ${testerPresentState.isActive ? 'animate-pulse' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${testerPresentState.isActive ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'}`}>
              Tester Present
            </div>
            <div className={`text-lg font-bold font-mono transition-all duration-300 ${testerPresentState.isActive ? 'text-amber-700 dark:text-amber-400 text-glow' : 'text-gray-500'}`}>
              {testerPresentState.isActive ? 'ON' : 'OFF'}
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
            {dataBusHeights.map((height, i) => (
              <div key={i} className={`flex-1 transition-all duration-300 ${!ecuPower ? 'bg-gray-600 h-1' : 'bg-blue-600 dark:bg-cyber-blue'}`} style={{ height: !ecuPower ? '4px' : `${height}%` }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProtocolStateDashboard;
