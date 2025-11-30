/**
 * Response Visualizer Component
 * Displays UDS responses with detailed breakdown and real-time packet flow
 */

import React, { useRef, useState, useEffect } from 'react';
import { useUDS } from '../context/UDSContext';
import { toHex, toASCII, getNRCDescription } from '../utils/udsHelpers';
import type { UDSRequest, UDSResponse, NegativeResponseCode } from '../types/uds';
import { NRCLearningModal } from './NRCLearningModal';

interface HistoryItem {
  request: UDSRequest;
  response: UDSResponse;
}

interface PacketAnimation {
  id: string;
  direction: 'request' | 'response';
  bytes: string[];
  timestamp: number;
  isAnimating: boolean;
}

interface CompletedPacket {
  requestBytes: string[] | null;  // null means request has been processed and cleared
  responseBytes: string[] | null; // null means response not yet received
  timestamp: number;
}

// Helper to convert single byte to hex string
const byteToHex = (byte: number): string => {
  return byte.toString(16).toUpperCase().padStart(2, '0');
};

/**
 * Get detailed interpretation for each byte in the response
 */
const getByteInterpretation = (item: HistoryItem, byteIdx: number, byte: number): string => {
  const { request, response } = item;

  // Negative Response interpretations
  if (response.isNegative) {
    if (byteIdx === 0) return 'Negative Response Code (NRC)';
    if (byteIdx === 1) return 'Service ID that failed';
    if (byteIdx === 2 && response.nrc) {
      return `${getNRCDescription(response.nrc)}`;
    }
    return 'Additional NRC data';
  }

  // Positive Response interpretations based on service
  if (byteIdx === 0) {
    return `Positive Response (SID + 0x40)`;
  }

  // Service-specific interpretations
  switch (request.sid) {
    case 0x10: // Diagnostic Session Control
      if (byteIdx === 1) {
        const sessionNames: Record<number, string> = {
          0x01: 'Default Session',
          0x02: 'Programming Session',
          0x03: 'Extended Session',
        };
        return sessionNames[byte] || 'Session Type';
      }
      if (byteIdx === 2) return 'Session Parameter / P2 Server Max High Byte';
      if (byteIdx === 3) return `P2 Server Max Low Byte (${((response.data[2] << 8) | byte) / 10}ms)`;
      if (byteIdx === 4) return 'P2* High Byte';
      if (byteIdx === 5) return `P2* Low Byte (${((response.data[4] << 8) | byte) * 10}ms)`;
      break;

    case 0x11: // ECU Reset
      if (byteIdx === 1) {
        const resetNames: Record<number, string> = {
          0x01: 'Hard Reset',
          0x02: 'Key Off/On Reset',
          0x03: 'Soft Reset',
        };
        return resetNames[byte] || 'Reset Type';
      }
      if (byteIdx === 2) return 'Power Down Time (seconds)';
      break;

    case 0x22: // Read Data By Identifier
      if (byteIdx === 1) return 'Data Identifier High Byte';
      if (byteIdx === 2) return 'Data Identifier Low Byte';
      if (byteIdx >= 3) return `Data Byte ${byteIdx - 2}`;
      break;

    case 0x27: // Security Access
      if (byteIdx === 1) {
        return byte % 2 === 1 ? 'Request Seed' : 'Send Key';
      }
      if (byteIdx >= 2 && request.subFunction && request.subFunction % 2 === 1) {
        return `Seed Byte ${byteIdx - 1}`;
      }
      if (byteIdx >= 2) return `Security Access Response`;
      break;

    case 0x2E: // Write Data By Identifier
      if (byteIdx === 1) return 'Data Identifier High Byte';
      if (byteIdx === 2) return 'Data Identifier Low Byte';
      break;

    case 0x31: // Routine Control
      if (byteIdx === 1) {
        const routineNames: Record<number, string> = {
          0x01: 'Start Routine',
          0x02: 'Stop Routine',
          0x03: 'Request Routine Results',
        };
        return routineNames[byte] || 'Routine Control Type';
      }
      if (byteIdx === 2) return 'Routine Identifier High Byte';
      if (byteIdx === 3) return 'Routine Identifier Low Byte';
      if (byteIdx >= 4) return `Routine Status Info ${byteIdx - 3}`;
      break;

    case 0x14: // Clear DTC
      if (byteIdx === 1) return 'DTC Group High Byte';
      if (byteIdx === 2) return 'DTC Group Mid Byte';
      if (byteIdx === 3) return 'DTC Group Low Byte';
      break;

    case 0x19: // Read DTC Information
      if (byteIdx === 1) return 'Sub-function';
      if (byteIdx === 2) return 'DTC Status Availability Mask';
      if (byteIdx === 3) return 'DTC Format Identifier';
      if (byteIdx >= 4) return `DTC Data Byte ${byteIdx - 3}`;
      break;

    case 0x34: // Request Download
      if (byteIdx === 1) return 'Length Format Identifier';
      if (byteIdx === 2) return 'Max Block Length High Byte';
      if (byteIdx === 3) return 'Max Block Length Low Byte';
      break;

    case 0x36: // Transfer Data
      if (byteIdx === 1) return 'Block Sequence Counter';
      break;

    case 0x37: // Transfer Exit
      return 'Transfer Exit Response';
  }

  // Default interpretation
  if (byteIdx === 1) return 'Sub-function / Parameter';
  return `Data Byte ${byteIdx - 1}`;
};

const ResponseVisualizer: React.FC = () => {
  const { requestHistory, clearHistory, recordNRCResolution } = useUDS();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastHistoryLengthRef = useRef(0);

  // NRC Learning Modal state
  const [learningModalOpen, setLearningModalOpen] = useState(false);
  const [selectedNRC, setSelectedNRC] = useState<{ nrc: NegativeResponseCode; request: UDSRequest; response: UDSResponse } | null>(null);

  // Packet Flow Animation state
  const [activePackets, setActivePackets] = useState<PacketAnimation[]>([]);
  const [completedPacket, setCompletedPacket] = useState<CompletedPacket | null>(null);
  const [flowStats, setFlowStats] = useState({
    totalRequests: 0,
    totalResponses: 0,
    activeFlow: false
  });

  // Monitor request history for new packets
  useEffect(() => {
    if (requestHistory.length > lastHistoryLengthRef.current) {
      const latestItem = requestHistory[requestHistory.length - 1];

      // Clear previous completed packet when new request starts
      setCompletedPacket(null);

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
      setFlowStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1, activeFlow: true }));

      // T=2500ms - REQUEST ARRIVES AT ECU (Wait for request animation to complete)
      setTimeout(() => {
        // Remove the request packet animation (it has arrived)
        setActivePackets(prev => prev.filter(p => p.id !== requestPacket.id));

        // Show request data at ECU (packet has arrived, ECU is now processing)
        setCompletedPacket({
          requestBytes,            // ECU: Shows received request ✅
          responseBytes: null,     // Client: Waiting for response ✅
          timestamp: Date.now()
        });

        // T=2500ms - 3000ms - ECU PROCESSING (500ms delay)
        setTimeout(() => {
          // T=3000ms - ECU STARTS RESPONSE
          const responseBytes = latestItem.response.data.map(b => byteToHex(b));
          const responsePacket: PacketAnimation = {
            id: `res-${latestItem.response.timestamp}`,
            direction: 'response',
            bytes: responseBytes,
            timestamp: latestItem.response.timestamp,
            isAnimating: true
          };

          // Start response animation (ECU still shows request during travel)
          setActivePackets(prev => [...prev, responsePacket]);
          setFlowStats(prev => ({ ...prev, totalResponses: prev.totalResponses + 1 }));

          // T=5500ms - RESPONSE ARRIVES AT CLIENT (Wait for response animation to complete)
          setTimeout(() => {
            // T=5500ms - RESPONSE ARRIVES AT CLIENT (COMPLETE!)
            // Remove the response packet animation (it has arrived)
            setActivePackets(prev => prev.filter(p => p.id !== responsePacket.id));

            // Clear ECU request (processed), show response at Client
            // Timeline: ECU data cleared, Client shows response
            setCompletedPacket({
              requestBytes: null,  // ECU: Request processed, cleared ✅
              responseBytes,       // Client: Response received, displayed ✅
              timestamp: Date.now()
            });

            setFlowStats(prev => ({ ...prev, activeFlow: false }));
          }, 2500); // Response animation duration (2500ms)
        }, 500); // ECU processing delay
      }, 2500); // Request animation duration

      lastHistoryLengthRef.current = requestHistory.length;
    }
  }, [requestHistory]);

  const handleOpenLearning = (nrc: NegativeResponseCode, request: UDSRequest, response: UDSResponse) => {
    setSelectedNRC({ nrc, request, response });
    setLearningModalOpen(true);
  };

  const handleTryCorrection = (correctedRequest: UDSRequest) => {
    // This will be handled by copying to the request builder
    console.log('Try correction:', correctedRequest);
    setLearningModalOpen(false);
  };

  const handleMarkResolved = () => {
    if (selectedNRC) {
      recordNRCResolution(selectedNRC.nrc);
    }
  };

  // Auto-scroll disabled to prevent page jumping
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [requestHistory]);

  const getServiceName = (sid: number): string => {
    const serviceNames: Record<number, string> = {
      0x10: 'Diagnostic Session Control',
      0x11: 'ECU Reset',
      0x14: 'Clear DTC',
      0x19: 'Read DTC Information',
      0x22: 'Read Data By Identifier',
      0x23: 'Read Memory',
      0x27: 'Security Access',
      0x28: 'Communication Control',
      0x2A: 'Periodic Data',
      0x2E: 'Write Data By Identifier',
      0x31: 'Routine Control',
      0x34: 'Request Download',
      0x36: 'Transfer Data',
      0x37: 'Transfer Exit',
      0x3D: 'Write Memory',
    };
    return serviceNames[sid] || `Unknown Service (0x${sid.toString(16).toUpperCase()})`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="glass-panel cyber-shape p-6 animate-slide-up bg-white/90 dark:bg-black/80 relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-10 dark:opacity-100" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-full animate-pulse shadow-neon-green" />
          <h2 className="text-xl font-bold font-mono text-green-700 dark:text-green-500 tracking-wider">TERMINAL_OUTPUT</h2>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs font-mono text-green-700 dark:text-green-500 border border-green-700/30 dark:border-green-500/30 px-3 py-1 hover:bg-green-500/10 transition-colors uppercase"
          disabled={requestHistory.length === 0}
          aria-label="Clear request history"
        >
          [ CLEAR_LOG ]
        </button>
      </div>

      {/* Header & Stats Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/20 bg-gray-100/50 dark:bg-black/20">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-700 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Packet Flow</h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 dark:text-slate-500">REQ:</span>
            <span className="text-cyan-700 dark:text-cyan-400 font-mono font-bold">{flowStats.totalRequests}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 dark:text-slate-500">RES:</span>
            <span className="text-purple-700 dark:text-purple-400 font-mono font-bold">{flowStats.totalResponses}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${flowStats.activeFlow ? 'bg-green-600 dark:bg-green-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
            <span className="text-slate-700 dark:text-slate-400">{flowStats.activeFlow ? 'Active' : 'Idle'}</span>
          </div>
        </div>
      </div>

      {/* Communication Flow - Compact */}
      <div className="relative py-4 px-4 flex items-center justify-between h-24">
        {/* Client Node */}
        <div className="flex flex-col items-center gap-1 z-20 w-16">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 dark:from-cyan-500 dark:to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 relative">
            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400">Client</div>

          {/* Received Response Data */}
          {completedPacket && completedPacket.responseBytes && (
            <div className="absolute top-12 left-0 bg-purple-500/20 border border-purple-400/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <div className="text-[9px] text-purple-700 dark:text-purple-300 font-mono whitespace-nowrap">
                {completedPacket.responseBytes.slice(0, 3).join(' ')}{completedPacket.responseBytes.length > 3 ? '...' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Communication Channel - Compact */}
        <div className="flex-1 relative h-full mx-4">
          {/* Request Channel (Top) */}
          <div className="absolute left-0 right-0 top-1/3 -translate-y-1/2">
            <div className="relative h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-500/40 to-purple-500/20 rounded-full">
              {/* Animated Request Packets */}
              {activePackets
                .filter(p => p.direction === 'request')
                .map(packet => (
                  <div
                    key={packet.id}
                    className="absolute top-1/2 -translate-y-1/2 left-0 animate-packet-request z-30"
                  >
                    <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  </div>
                ))}
            </div>
          </div>

          {/* Response Channel (Bottom) */}
          <div className="absolute left-0 right-0 bottom-1/3 translate-y-1/2">
            <div className="relative h-1 bg-gradient-to-l from-purple-500/20 via-purple-500/40 to-cyan-500/20 rounded-full">
              {/* Animated Response Packets */}
              {activePackets
                .filter(p => p.direction === 'response')
                .map(packet => (
                  <div
                    key={packet.id}
                    className="absolute top-1/2 -translate-y-1/2 right-0 animate-packet-response z-30"
                  >
                    <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ECU Node */}
        <div className="flex flex-col items-center gap-1 z-20 w-16">
          <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-700 dark:from-purple-500 dark:to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/40">
            {/* Processing Indicator */}
            {completedPacket && completedPacket.requestBytes && !activePackets.some(p => p.direction === 'response') && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-900/60 rounded-lg backdrop-blur-[1px] animate-pulse z-20">
                <svg className="w-4 h-4 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            )}
            <svg className="w-5 h-5 text-white drop-shadow-md relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400">ECU</div>

          {/* Request Data Display */}
          {completedPacket && completedPacket.requestBytes && (
            <div className="absolute top-12 right-0 bg-cyan-500/20 border border-cyan-400/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <div className="text-[9px] text-cyan-700 dark:text-cyan-300 font-mono whitespace-nowrap">
                {completedPacket.requestBytes.slice(0, 3).join(' ')}{completedPacket.requestBytes.length > 3 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {requestHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50 text-slate-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mb-2 text-slate-600 dark:text-gray-400">No messages yet. Send a request to see the response.</p>
            <p className="text-xs text-slate-500 dark:text-gray-600">💡 Try the "Read VIN" quick example to get started!</p>
          </div>
        ) : (
          // LIFO: Display newest requests first (reverse order)
          [...requestHistory].reverse().map((item, index) => (
            <div key={requestHistory.length - 1 - index} className="bg-gray-50 dark:bg-dark-800/50 rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden animate-fade-in min-w-0 max-w-full">
              {/* Request */}
              <div className="p-4 border-b border-gray-200 dark:border-dark-600 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-sm font-bold text-cyber-blue">REQUEST</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{formatTimestamp(item.request.timestamp)}</span>
                </div>
                <div className="bg-white dark:bg-dark-900/50 rounded p-3 font-mono text-sm min-w-0">
                  <div className="text-cyber-blue">
                    {toHex([
                      item.request.sid,
                      ...(item.request.subFunction ? [item.request.subFunction] : []),
                      ...(item.request.data || [])
                    ])}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getServiceName(item.request.sid)}
                  </div>
                </div>
              </div>

              {/* Response */}
              <div className="p-4 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className={`text-sm font-bold ${item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'}`}>
                      {item.response.isNegative ? 'NEGATIVE RESPONSE' : 'POSITIVE RESPONSE'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    ⏱️ {((item.response.timestamp - item.request.timestamp))}ms
                  </span>
                </div>

                <div className={`rounded-lg p-5 min-w-0 ${item.response.isNegative
                  ? 'bg-white dark:bg-dark-900/80 border border-cyber-pink/30'
                  : 'bg-white dark:bg-dark-900/80 border border-cyber-green/30'
                  }`}>
                  {/* Hex String Display */}
                  <div
                    className={`response-data-container font-mono text-base font-bold mb-4 tracking-wide ${item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                      }`}
                  >
                    {item.response.data.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                  </div>

                  {/* Visual Byte Blocks */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {item.response.data.map((byte, byteIdx) => (
                      <div
                        key={byteIdx}
                        className={`
                          flex-shrink-0 rounded-md px-3 py-2 text-center border-2 
                          transition-all hover:scale-110 animate-byte-appear
                          ${item.response.isNegative
                            ? 'bg-cyber-pink/10 border-cyber-pink/60 hover:bg-cyber-pink/20 hover:shadow-lg hover:shadow-cyber-pink/30'
                            : 'bg-cyber-green/10 border-cyber-green/60 hover:bg-cyber-green/20 hover:shadow-lg hover:shadow-cyber-green/30'
                          }
                        `}
                        style={{
                          animationDelay: `${byteIdx * 100}ms`,
                        }}
                      >
                        <div className={`font-mono text-lg font-bold ${item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                          }`}>
                          {byte.toString(16).toUpperCase().padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Byte Breakdown */}
                  <div className="mt-4 space-y-2.5 text-sm bg-gray-100 dark:bg-dark-800/50 rounded-lg p-4 border border-gray-200 dark:border-dark-600">
                    {item.response.data.map((byte, byteIdx) => {
                      const interpretation = getByteInterpretation(item, byteIdx, byte);
                      return (
                        <div key={byteIdx} className="flex items-center gap-3 group">
                          <span className="text-slate-600 dark:text-slate-500 font-mono text-xs font-semibold min-w-[32px]">[{byteIdx}]:</span>
                          <span className={`font-mono font-bold text-base min-w-[56px] ${item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                            }`}>
                            0x{byte.toString(16).toUpperCase().padStart(2, '0')}
                          </span>
                          <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{interpretation}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ASCII representation */}
                  {item.response.data.length > 3 && !item.response.isNegative && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-semibold">ASCII Representation:</div>
                      <div className="response-data-container font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-900/60 p-3 rounded-md border border-gray-200 dark:border-dark-600">
                        {toASCII(item.response.data.slice(item.response.data[1] ? 2 : 1))}
                      </div>
                    </div>
                  )}
                </div>

                {/* NRC Explanation */}
                {item.response.isNegative && item.response.nrc && (
                  <div className="mt-3 p-3 bg-cyber-pink/10 border border-cyber-pink/30 rounded-lg animate-fade-in">
                    <div className="flex items-start space-x-2">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <div className="font-bold text-cyber-pink text-sm">
                          NRC 0x{item.response.nrc.toString(16).toUpperCase().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {getNRCDescription(item.response.nrc)}
                        </div>
                        <button
                          onClick={() => handleOpenLearning(item.response.nrc!, item.request, item.response)}
                          className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Learn More About This Error
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* NRC Learning Modal */}
      {selectedNRC && (
        <NRCLearningModal
          nrc={selectedNRC.nrc}
          request={selectedNRC.request}
          response={selectedNRC.response}
          isOpen={learningModalOpen}
          onClose={() => setLearningModalOpen(false)}
          onTryCorrection={handleTryCorrection}
          onMarkResolved={handleMarkResolved}
        />
      )}
    </div>
  );
};


export default ResponseVisualizer;
