/**
 * Packet Flow Visualizer Component
 * Real-time visualization of UDS request/response packet flow between Client and ECU
 */

import React, { useEffect, useState, useRef } from 'react';
import { useUDS } from '../context/UDSContext';

interface PacketAnimation {
  id: string;
  direction: 'request' | 'response';
  bytes: string[];
  timestamp: number;
  isAnimating: boolean;
}

// Helper to convert single byte to hex string
const byteToHex = (byte: number): string => {
  return byte.toString(16).toUpperCase().padStart(2, '0');
};

const PacketFlowVisualizer: React.FC = () => {
  const { requestHistory } = useUDS();
  const [activePackets, setActivePackets] = useState<PacketAnimation[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalResponses: 0,
    activeFlow: false
  });
  const lastHistoryLengthRef = useRef(0);

  // Monitor request history for new packets
  useEffect(() => {
    if (requestHistory.length > lastHistoryLengthRef.current) {
      const latestItem = requestHistory[requestHistory.length - 1];
      
      // Create request packet animation
      const requestBytes = [
        byteToHex(latestItem.request.sid),
        ...(latestItem.request.subFunction !== undefined ? [byteToHex(latestItem.request.subFunction)] : []),
        ...(latestItem.request.data?.map(b => byteToHex(b)) || [])
      ];

      const requestPacket: PacketAnimation = {
        id: `req-${latestItem.request.timestamp}`,
        direction: 'request',
        bytes: requestBytes,
        timestamp: latestItem.request.timestamp,
        isAnimating: true
      };

      setActivePackets(prev => [...prev, requestPacket]);
      setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1, activeFlow: true }));

      // Add request packet first, then response after delay
      setTimeout(() => {
        const responseBytes = latestItem.response.data.map(b => byteToHex(b));
        const responsePacket: PacketAnimation = {
          id: `res-${latestItem.response.timestamp}`,
          direction: 'response',
          bytes: responseBytes,
          timestamp: latestItem.response.timestamp,
          isAnimating: true
        };

        setActivePackets(prev => [...prev, responsePacket]);
        setStats(prev => ({ ...prev, totalResponses: prev.totalResponses + 1 }));

        // Clear packets after animation completes
        setTimeout(() => {
          setActivePackets(prev => prev.filter(p => p.id !== requestPacket.id && p.id !== responsePacket.id));
          setStats(prev => ({ ...prev, activeFlow: false }));
        }, 2000);
      }, 800);

      lastHistoryLengthRef.current = requestHistory.length;
    }
  }, [requestHistory]);

  return (
    <div className="glass-card p-6 animate-fade-in border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-purple-400">Real-time Packet Flow</h2>
            <p className="text-sm text-slate-400">Live UDS Communication Visualization</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stats.activeFlow ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs text-slate-400">
            {stats.activeFlow ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="relative bg-gradient-to-br from-slate-900/60 to-slate-800/60 rounded-xl p-8 border border-purple-500/20 min-h-[280px]">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Client and ECU Nodes */}
        <div className="relative flex items-center justify-between h-full">
          {/* Client Node */}
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse-slow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-cyan-400">Client</div>
              <div className="text-xs text-slate-500">Diagnostic Tester</div>
            </div>
          </div>

          {/* Communication Channel */}
          <div className="flex-1 relative px-8">
            {/* Connection Lines */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
              {/* Request Line (top) */}
              <div className="relative mb-8">
                <div className="h-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500/30" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
                  Request Flow →
                </div>
                
                {/* Animated Request Packets */}
                {activePackets
                  .filter(p => p.direction === 'request')
                  .map(packet => (
                    <div
                      key={packet.id}
                      className="absolute top-1/2 -translate-y-1/2 left-0 animate-packet-request"
                      style={{
                        animation: 'packet-request 800ms ease-out forwards'
                      }}
                    >
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-cyan-500/50 text-xs font-mono whitespace-nowrap">
                        {packet.bytes.slice(0, 4).join(' ')}
                        {packet.bytes.length > 4 && '...'}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Response Line (bottom) */}
              <div className="relative mt-8">
                <div className="h-0.5 bg-gradient-to-r from-purple-500/30 to-cyan-500/30" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
                  ← Response Flow
                </div>

                {/* Animated Response Packets */}
                {activePackets
                  .filter(p => p.direction === 'response')
                  .map(packet => (
                    <div
                      key={packet.id}
                      className="absolute top-1/2 -translate-y-1/2 right-0 animate-packet-response"
                      style={{
                        animation: 'packet-response 800ms ease-out forwards'
                      }}
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-purple-500/50 text-xs font-mono whitespace-nowrap">
                        {packet.bytes.slice(0, 4).join(' ')}
                        {packet.bytes.length > 4 && '...'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* ECU Node */}
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse-slow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-400">ECU</div>
              <div className="text-xs text-slate-500">Electronic Control Unit</div>
            </div>
          </div>
        </div>

        {/* Placeholder when no activity */}
        {requestHistory.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="text-sm">Send a request to see packet flow visualization</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.totalRequests}</div>
          <div className="text-xs text-slate-400 mt-1">Requests Sent</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.totalResponses}</div>
          <div className="text-xs text-slate-400 mt-1">Responses Received</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {stats.totalResponses > 0 ? Math.round((stats.totalResponses / stats.totalRequests) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Success Rate</div>
        </div>
      </div>
    </div>
  );
};

export default PacketFlowVisualizer;
