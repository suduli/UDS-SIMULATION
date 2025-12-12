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
      case DiagnosticSessionType.PROGRAMMING: return 'Prog';
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



  // Display remaining seconds or '--' for default session
  const timeoutDisplay = remainingTime !== null
    ? `${Math.ceil(remainingTime / 1000)}s`
    : ecuPower ? '--' : '0s';

  // Compact status indicator component for mobile
  const StatusIndicator = ({
    icon,
    label,
    value,
    active,
    color = 'emerald',
    onClick,
    pulse = false,
    subValue
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    active: boolean;
    color?: 'emerald' | 'amber' | 'purple' | 'blue' | 'green' | 'red' | 'gray';
    onClick?: () => void;
    pulse?: boolean;
    subValue?: string;
  }) => {
    const colorClasses = {
      emerald: active ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      amber: active ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      purple: active ? 'border-purple-400 dark:border-purple-500/50 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      blue: active ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      green: active ? 'border-green-400 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      red: 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10',
      gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
    };

    const textColorClasses = {
      emerald: active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500',
      amber: active ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500',
      purple: active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500',
      blue: active ? 'text-blue-600 dark:text-cyber-blue' : 'text-gray-500',
      green: active ? 'text-green-600 dark:text-cyber-green' : 'text-gray-500',
      red: 'text-red-500 dark:text-red-400',
      gray: 'text-gray-500',
    };

    const Wrapper = onClick ? 'button' : 'div';

    return (
      <Wrapper
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${colorClasses[color]} ${onClick ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : ''} ${pulse && active ? 'animate-pulse' : ''}`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white/10 shadow-inner' : 'bg-black/5'} backdrop-blur-sm`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left flex flex-col justify-center">
          <div className={`text-[10px] uppercase tracking-widest font-bold ${textColorClasses[color]} opacity-80 mb-0.5`}>{label}</div>
          <div className="flex items-center gap-2">
            <div className={`text-lg font-bold font-mono truncate leading-none ${textColorClasses[color]}`}>{value}</div>
            {active && <div className={`w-1.5 h-1.5 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-green-400'} shadow-[0_0_8px_currentColor]`} />}
            {subValue && <div className="text-[10px] font-mono text-gray-500 truncate opacity-70 border-l border-gray-600 pl-2 ml-auto">{subValue}</div>}
          </div>
        </div>
        {onClick && (
          <div className="shrink-0 text-gray-400 opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        )}
      </Wrapper>
    );
  };

  return (
    <div id="protocol-dashboard" className={`glass-panel p-2 sm:p-4 mb-3 sm:mb-6 relative overflow-hidden transition-all duration-500 ${!ecuPower ? 'grayscale-[0.8] opacity-80' : ''}`}>
      {/* Background decoration */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/5 to-transparent opacity-20 pointer-events-none transition-opacity duration-500 ${!ecuPower ? 'opacity-0' : ''}`} />

      {/* Mobile Layout: Vertical Stack */}
      <div className="lg:hidden relative z-10 space-y-2">
        {/* Ignition */}
        <StatusIndicator
          icon={
            <svg className={`w-5 h-5 ${ecuPower ? 'text-emerald-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          label="Ignition"
          value={ecuPower ? 'ON' : 'OFF'}
          active={ecuPower}
          color={ecuPower ? 'emerald' : 'red'}
          onClick={toggleEcuPower}
        />

        {/* System Status */}
        <StatusIndicator
          icon={
            <div className={`w-3 h-3 rounded-full ${ecuPower ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-400'}`} />
          }
          label="System"
          value={ecuPower ? 'UP' : 'DOWN'}
          subValue={ecuPower ? `${voltage.toFixed(1)}V / ${current.toFixed(2)}A` : undefined}
          active={ecuPower}
          color="emerald"
        />

        {/* Session */}
        <StatusIndicator
          icon={
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-gray-200 dark:text-dark-700" />
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent"
                  strokeDasharray={87.96}
                  strokeDashoffset={87.96 * (1 - sessionProgress / 100)}
                  className={`${getSessionColor(protocolState.currentSession)} transition-all duration-1000 ease-linear`}
                />
              </svg>
              <span className="absolute text-[8px] font-mono text-gray-500">{timeoutDisplay}</span>
            </div>
          }
          label="Session"
          value={ecuPower ? getSessionName(protocolState.currentSession) : 'OFF'}
          active={ecuPower}
          color="blue"
        />

        {/* Security */}
        <StatusIndicator
          icon={
            <svg className={`w-5 h-5 ${!ecuPower ? 'text-gray-400' : protocolState.securityUnlocked ? 'text-purple-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={protocolState.securityUnlocked ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} />
            </svg>
          }
          label="Security"
          value={ecuPower ? (protocolState.securityUnlocked ? `Lvl ${protocolState.securityLevel}` : 'LOCKED') : '---'}
          active={ecuPower && protocolState.securityUnlocked}
          color={protocolState.securityUnlocked ? 'purple' : 'amber'}
        />

        {/* Tester Present */}
        <StatusIndicator
          icon={
            <svg className={`w-5 h-5 ${testerPresentState.isActive ? 'text-amber-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          }
          label="Tester"
          value={testerPresentState.isActive ? 'ON' : 'OFF'}
          active={testerPresentState.isActive}
          color="amber"
          onClick={() => testerPresentState.isActive ? stopTesterPresent() : startTesterPresent()}
          pulse={testerPresentState.isActive}
        />

        {/* Comms */}
        <StatusIndicator
          icon={
            <div className={`w-3 h-3 rounded-full ${ecuPower && protocolState.communicationEnabled ? 'bg-green-500 animate-ping' : 'bg-gray-400'}`} />
          }
          label="Comms"
          value={ecuPower ? (protocolState.communicationEnabled ? 'ONLINE' : 'OFF') : '---'}
          active={ecuPower && protocolState.communicationEnabled}
          color="green"
        />

        {/* Data Bus */}
        <StatusIndicator
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          }
          label="Data Bus"
          value={ecuPower ? (protocolState.downloadInProgress ? 'DOWNLOADING' : protocolState.uploadInProgress ? 'UPLOADING' : 'IDLE') : 'OFF'}
          active={ecuPower}
          color={ecuPower ? (protocolState.downloadInProgress || protocolState.uploadInProgress ? 'blue' : 'gray') : 'gray'}
        />
      </div>

      {/* Desktop Layout: Horizontal row */}
      <div className="hidden lg:block relative z-10">
        <div className="flex flex-row items-center justify-between">
          {/* IGNITION Toggle */}
          <div className="flex-1 flex items-center justify-start gap-4 px-4">
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

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

          {/* SYS UP/DOWN */}
          <div className="flex-1 flex items-center justify-center gap-4 px-4">
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

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

          {/* Session */}
          <div className="flex-1 flex items-center justify-center gap-4 px-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-dark-700" />
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 * (1 - sessionProgress / 100)}
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

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

          {/* Security */}
          <div className="flex-1 flex items-center justify-center gap-4 px-4">
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

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

          {/* Tester Present */}
          <div className="flex-1 flex items-center justify-center gap-4 px-4">
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

          <div className="w-px h-12 bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

          {/* Communication */}
          <div className="flex-1 flex items-center justify-center gap-4 px-4">
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
        </div>
      </div>
    </div>
  );
};

export default ProtocolStateDashboard;
