/**
 * Response Visualizer Component
 * Displays UDS responses with detailed breakdown and real-time packet flow
 */

import React, { useRef, useState, useEffect } from 'react';
import { useUDS } from '../context/UDSContext';
import { toHex, getNRCDescription } from '../utils/udsHelpers';
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
  const [flowStats, setFlowStats] = useState({
    totalRequests: 0,
    totalResponses: 0,
    activeFlow: false
  });

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
      setFlowStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1, activeFlow: true }));

      // T=2500ms - REQUEST ARRIVES AT ECU (Wait for request animation to complete)
      setTimeout(() => {
        // Remove the request packet animation (it has arrived)
        setActivePackets(prev => prev.filter(p => p.id !== requestPacket.id));

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
    <div className="glass-panel cyber-shape p-0 animate-slide-up !bg-white dark:!bg-black/90 relative overflow-hidden flex flex-col h-[600px]" style={{ animationDelay: '0.1s' }}>
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] hidden dark:block opacity-20" />

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 !bg-gray-100 dark:!bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-sm font-mono text-gray-700 dark:text-gray-300 font-bold tracking-wide">TERMINAL_OUTPUT</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600 dark:text-gray-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>TX: {flowStats.totalRequests}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>RX: {flowStats.totalResponses}</span>
          </div>
          <button
            onClick={clearHistory}
            className="text-[10px] font-mono text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors uppercase"
            disabled={requestHistory.length === 0}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Packet Flow - Compact & Integrated */}
      <div className="relative py-2 px-4 flex items-center justify-between h-16 !bg-gray-50 dark:!bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 shrink-0">
        {/* Client Node */}
        <div className="flex items-center gap-2 z-20">
          <div className="w-8 h-8 bg-cyan-900/30 rounded flex items-center justify-center border border-cyan-700/50">
            <span className="text-xs font-bold text-cyan-500">CLI</span>
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="flex-1 relative h-full mx-4 flex items-center">
          <div className="w-full h-px bg-gray-300 dark:bg-gray-800 relative">
            {/* Request Packets */}
            {activePackets.filter(p => p.direction === 'request').map(p => (
              <div key={p.id} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] rounded-full animate-packet-request" />
            ))}
            {/* Response Packets */}
            {activePackets.filter(p => p.direction === 'response').map(p => (
              <div key={p.id} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] rounded-full animate-packet-response" style={{ right: 0, animationDirection: 'reverse' }} />
            ))}
          </div>
        </div>

        {/* ECU Node */}
        <div className="flex items-center gap-2 z-20">
          <div className="w-8 h-8 bg-purple-900/30 rounded flex items-center justify-center border border-purple-700/50 relative">
            {flowStats.activeFlow && (
              <div className="absolute inset-0 border border-purple-500 rounded animate-ping opacity-20" />
            )}
            <span className="text-xs font-bold text-purple-500">ECU</span>
          </div>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar !bg-gray-50 dark:!bg-black/50">
        {requestHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
            <p>_ No active session data</p>
            <p className="text-xs">Waiting for UDS commands...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {requestHistory.map((item, index) => (
              <div key={index} className="animate-fade-in">
                {/* Request Line */}
                <div className="terminal-log-entry group">
                  <span className="text-gray-500 dark:text-gray-600 mr-2">[{formatTimestamp(item.request.timestamp)}]</span>
                  <span className="text-cyan-500 font-bold mr-2">➜ TX</span>
                  <span className="text-gray-700 dark:text-gray-300 mr-2">{getServiceName(item.request.sid)}</span>
                  <span className="text-cyan-600 dark:text-cyan-700">
                    {toHex([item.request.sid, ...(item.request.subFunction ? [item.request.subFunction] : []), ...(item.request.data || [])])}
                  </span>
                </div>

                {/* Response Line */}
                <div className="terminal-log-entry group mt-0.5">
                  <span className="text-gray-500 dark:text-gray-600 mr-2">[{formatTimestamp(item.response.timestamp)}]</span>
                  <span className={`font-bold mr-2 ${item.response.isNegative ? 'text-red-500' : 'text-purple-500'}`}>
                    {item.response.isNegative ? '✖ RX' : '✔ RX'}
                  </span>

                  {item.response.isNegative ? (
                    <>
                      <span className="text-red-600 dark:text-red-400 mr-2">NEGATIVE RESPONSE</span>
                      <span className="text-red-700 font-bold">
                        {item.response.nrc ? `NRC 0x${byteToHex(item.response.nrc)}` : 'Error'}
                      </span>
                      {item.response.nrc && (
                        <button
                          onClick={() => handleOpenLearning(item.response.nrc!, item.request, item.response)}
                          className="ml-2 text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 rounded border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          ? HELP
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-purple-600 dark:text-purple-300 mr-2">POSITIVE RESPONSE</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {item.response.data.map(b => byteToHex(b)).join(' ')}
                      </span>
                    </>
                  )}
                </div>

                {/* Detailed Breakdown (Collapsible-ish look, always visible for now but indented) */}
                <div className="pl-24 pr-4 py-1 text-xs text-gray-600 dark:text-gray-500 border-l border-gray-300 dark:border-gray-800 ml-3 mb-2 hidden group-hover:block transition-all">
                  {item.response.data.map((byte, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="w-6 text-gray-500 dark:text-gray-600">[{idx}]</span>
                      <span className="w-8 font-bold text-gray-800 dark:text-gray-400">{byteToHex(byte)}</span>
                      <span className="text-gray-600 dark:text-gray-600">→ {getByteInterpretation(item, idx, byte)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Active Cursor Line */}
            <div className="mt-2 text-cyan-600 dark:text-cyan-500 terminal-cursor">
              _
            </div>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* NRC Learning Modal */}
      {selectedNRC && (
        <NRCLearningModal
          isOpen={learningModalOpen}
          onClose={() => setLearningModalOpen(false)}
          nrc={selectedNRC.nrc}
          request={selectedNRC.request}
          response={selectedNRC.response}
          onTryCorrection={handleTryCorrection}
          onMarkResolved={handleMarkResolved}
        />
      )}
    </div>
  );
};

export default ResponseVisualizer;
