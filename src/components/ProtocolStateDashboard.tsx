/**
 * Protocol State Dashboard Component
 * Displays current protocol state, session, security status
 */

import React from 'react';
import { useUDS } from '../context/UDSContext';
import { DiagnosticSessionType } from '../types/uds';

const ProtocolStateDashboard: React.FC = () => {
  const { protocolState } = useUDS();

  const getSessionName = (session: DiagnosticSessionType): string => {
    switch (session) {
      case DiagnosticSessionType.DEFAULT:
        return 'Default Session';
      case DiagnosticSessionType.PROGRAMMING:
        return 'Programming Session';
      case DiagnosticSessionType.EXTENDED:
        return 'Extended Session';
      default:
        return 'Unknown Session';
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

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-cyber-blue">Protocol State</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Session */}
        <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Session</span>
            <div className={`w-3 h-3 rounded-full ${protocolState.currentSession === DiagnosticSessionType.DEFAULT ? 'bg-cyber-green' : protocolState.currentSession === DiagnosticSessionType.EXTENDED ? 'bg-cyber-blue' : 'bg-cyber-purple'} animate-pulse shadow-neon`}></div>
          </div>
          <p className={`font-bold ${getSessionColor(protocolState.currentSession)}`}>
            {getSessionName(protocolState.currentSession)}
          </p>
        </div>

        {/* Security Status */}
        <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Security</span>
            {protocolState.securityUnlocked && (
              <svg className="w-4 h-4 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            {!protocolState.securityUnlocked && (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <p className={`font-bold ${protocolState.securityUnlocked ? 'text-cyber-green' : 'text-gray-500'}`}>
            {protocolState.securityUnlocked ? `Level ${protocolState.securityLevel}` : 'Locked'}
          </p>
          {protocolState.securityAttempts > 0 && (
            <p className="text-xs text-cyber-pink mt-1">Attempts: {protocolState.securityAttempts}/3</p>
          )}
        </div>

        {/* Communication Status */}
        <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Communication</span>
            <div className={`w-3 h-3 rounded-full ${protocolState.communicationEnabled ? 'bg-cyber-green' : 'bg-gray-500'} animate-pulse`}></div>
          </div>
          <p className={`font-bold ${protocolState.communicationEnabled ? 'text-cyber-green' : 'text-gray-500'}`}>
            {protocolState.communicationEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        {/* Transfer Status */}
        <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Data Transfer</span>
            {(protocolState.downloadInProgress || protocolState.uploadInProgress) && (
              <div className="w-3 h-3 rounded-full bg-cyber-yellow animate-pulse"></div>
            )}
          </div>
          <p className={`font-bold ${(protocolState.downloadInProgress || protocolState.uploadInProgress) ? 'text-cyber-yellow' : 'text-gray-500'}`}>
            {protocolState.downloadInProgress && 'Download'}
            {protocolState.uploadInProgress && 'Upload'}
            {!protocolState.downloadInProgress && !protocolState.uploadInProgress && 'Idle'}
          </p>
          {(protocolState.downloadInProgress || protocolState.uploadInProgress) && (
            <p className="text-xs text-gray-400 mt-1">Block: {protocolState.transferBlockCounter}</p>
          )}
        </div>
      </div>

      {/* Periodic Services */}
      {protocolState.activePeriodicIds.length > 0 && (
        <div className="mt-4 bg-dark-800/50 rounded-lg p-4 border border-dark-600">
          <h3 className="text-sm text-gray-400 mb-2">Active Periodic Services</h3>
          <div className="flex flex-wrap gap-2">
            {protocolState.activePeriodicIds.map((id) => (
              <span key={id} className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded border border-cyber-blue/50">
                ID: 0x{id.toString(16).toUpperCase().padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolStateDashboard;
