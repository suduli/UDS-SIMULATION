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

        {/* Client and ECU Nodes - Redesigned */}
        <div className="relative py-8">
          <div className="flex items-center justify-between">
            {/* Client Node */}
            <div className="flex flex-col items-center gap-3 z-20 w-28">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30 border-2 border-cyan-400/40 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                <svg className="w-12 h-12 text-white drop-shadow-lg relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-cyan-400 drop-shadow-md">Client</div>
                <div className="text-xs text-slate-500 mt-0.5">Diagnostic Tester</div>
              </div>
            </div>

            {/* Communication Channel - Perfectly Centered */}
            <div className="flex-1 relative h-36 mx-10">
              {/* Center reference line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/30 -translate-y-1/2" />
              
              {/* Request Channel (Top Half) */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-full pb-5">
                <div className="relative h-14 flex items-center">
                  {/* Request Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500/40 via-cyan-500/60 to-purple-500/40 rounded-full shadow-lg shadow-cyan-500/20" />
                  
                  {/* Directional Arrow */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rotate-45 transform translate-x-1.5 shadow-lg shadow-purple-500/50" />
                  
                  {/* Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-7 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-cyan-400">Request Flow</span>
                    <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  
                  {/* Animated Request Packets */}
                  {activePackets
                    .filter(p => p.direction === 'request')
                    .map(packet => (
                      <div
                        key={packet.id}
                        className="absolute top-1/2 -translate-y-1/2 left-0 z-30"
                        style={{
                          animation: 'packet-request 800ms ease-out forwards'
                        }}
                      >
                        <div className="response-data-container bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1.5 rounded-lg shadow-xl shadow-cyan-500/50 text-xs font-mono font-bold whitespace-nowrap border border-cyan-300/30 max-w-[200px]">
                          {packet.bytes.slice(0, 4).join(' ')}
                          {packet.bytes.length > 4 && '...'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Response Channel (Bottom Half) */}
              <div className="absolute left-0 right-0 top-1/2 translate-y-0 pt-5">
                <div className="relative h-14 flex items-center">
                  {/* Response Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-purple-500/40 via-purple-500/60 to-cyan-500/40 rounded-full shadow-lg shadow-purple-500/20" />
                  
                  {/* Directional Arrow */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-500 rotate-45 transform -translate-x-1.5 shadow-lg shadow-cyan-500/50" />
                  
                  {/* Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-purple-500/30 backdrop-blur-sm">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className="text-xs font-semibold text-purple-400">Response Flow</span>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                  </div>
                  
                  {/* Animated Response Packets */}
                  {activePackets
                    .filter(p => p.direction === 'response')
                    .map(packet => (
                      <div
                        key={packet.id}
                        className="absolute top-1/2 -translate-y-1/2 right-0 z-30"
                        style={{
                          animation: 'packet-response 800ms ease-out forwards'
                        }}
                      >
                        <div className="response-data-container bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg shadow-xl shadow-purple-500/50 text-xs font-mono font-bold whitespace-nowrap border border-purple-300/30 max-w-[200px]">
                          {packet.bytes.slice(0, 4).join(' ')}
                          {packet.bytes.length > 4 && '...'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* ECU Node */}
            <div className="flex flex-col items-center gap-3 z-20 w-28">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 border-2 border-purple-400/40 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                <svg className="w-12 h-12 text-white drop-shadow-lg relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-purple-400 drop-shadow-md">ECU</div>
                <div className="text-xs text-slate-500 mt-0.5">Electronic Control Unit</div>
              </div>
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
