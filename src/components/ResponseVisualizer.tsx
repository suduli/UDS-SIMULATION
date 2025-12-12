/**
 * Response Visualizer Component
 * Displays UDS responses with detailed breakdown and real-time packet flow
 */

import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUDS } from '../context/UDSContext';
import { toHex, getNRCDescription } from '../utils/udsHelpers';
import type { UDSRequest, UDSResponse, NegativeResponseCode } from '../types/uds';
import { NRCLearningModal } from './NRCLearningModal';

interface HistoryItem {
  request: UDSRequest;
  response: UDSResponse;
  isAutoKeepAlive?: boolean;
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
      if (byteIdx === 1) {
        const subfunctionNames: Record<number, string> = {
          0x01: 'reportNumberOfDTCByStatusMask',
          0x02: 'reportDTCByStatusMask',
          0x03: 'reportDTCSnapshotIdentification',
          0x04: 'reportDTCSnapshotRecordByDTCNumber',
          0x06: 'reportDTCExtDataRecordByDTCNumber',
          0x07: 'reportNumberOfDTCBySeverityMaskRecord',
          0x08: 'reportDTCBySeverityMaskRecord',
          0x09: 'reportSeverityInformationOfDTC',
          0x0A: 'reportSupportedDTC',
          0x0B: 'reportFirstTestFailedDTC',
          0x0C: 'reportFirstConfirmedDTC',
          0x0D: 'reportMostRecentTestFailedDTC',
          0x0E: 'reportMostRecentConfirmedDTC',
          0x0F: 'reportMirrorMemoryDTCByStatusMask',
        };
        return `Sub-function: ${subfunctionNames[byte] || 'Unknown (0x' + byte.toString(16).toUpperCase() + ')'}`;
      }
      // Subfunction-specific interpretation
      const subFunc = request.subFunction || response.data[1];
      if (subFunc === 0x01 || subFunc === 0x07) {
        // reportNumberOfDTCByStatusMask / reportNumberOfDTCBySeverityMaskRecord
        if (byteIdx === 2) return 'DTC Status Availability Mask';
        if (byteIdx === 3) return 'DTC Format Identifier (ISO 14229-1)';
        if (byteIdx === 4) return 'DTC Count High Byte';
        if (byteIdx === 5) {
          const count = ((response.data[4] << 8) | byte);
          return `DTC Count Low Byte (Total: ${count} DTCs)`;
        }
      } else if (subFunc === 0x02 || subFunc === 0x0A || subFunc === 0x0B || subFunc === 0x0C || subFunc === 0x0D || subFunc === 0x0E || subFunc === 0x0F) {
        // DTC list responses
        if (byteIdx === 2) return 'DTC Status Availability Mask';
        if (byteIdx >= 3) {
          const dtcOffset = (byteIdx - 3) % 4;
          const dtcNum = Math.floor((byteIdx - 3) / 4) + 1;
          if (dtcOffset === 0) return `DTC #${dtcNum} High Byte`;
          if (dtcOffset === 1) return `DTC #${dtcNum} Middle Byte`;
          if (dtcOffset === 2) return `DTC #${dtcNum} Low Byte`;
          if (dtcOffset === 3) {
            const statusDesc = [];
            if (byte & 0x08) statusDesc.push('Confirmed');
            if (byte & 0x04) statusDesc.push('Pending');
            if (byte & 0x01) statusDesc.push('Failed');
            return `DTC #${dtcNum} Status (${statusDesc.join(', ') || 'No flags'})`;
          }
        }
      } else if (subFunc === 0x03) {
        // reportDTCSnapshotIdentification
        if (byteIdx === 2) return 'DTC High Byte';
        if (byteIdx === 3) return 'DTC Middle Byte';
        if (byteIdx === 4) return 'DTC Low Byte';
        if (byteIdx >= 5) return `Snapshot Record Number ${byteIdx - 4}`;
      } else if (subFunc === 0x04) {
        // reportDTCSnapshotRecordByDTCNumber (Freeze Frame Data)
        if (byteIdx === 2) return 'DTC High Byte';
        if (byteIdx === 3) return 'DTC Middle Byte';
        if (byteIdx === 4) return 'DTC Low Byte';
        if (byteIdx === 5) return 'DTC Status Byte';
        if (byteIdx === 6) return 'Snapshot Record Number';
        if (byteIdx === 7) return 'Number of DIDs in Snapshot';
        if (byteIdx >= 8) return `Freeze Frame Data Byte ${byteIdx - 7}`;
      } else if (subFunc === 0x06) {
        // reportDTCExtDataRecordByDTCNumber
        if (byteIdx === 2) return 'DTC High Byte';
        if (byteIdx === 3) return 'DTC Middle Byte';
        if (byteIdx === 4) return 'DTC Low Byte';
        if (byteIdx === 5) return 'DTC Status Byte';
        if (byteIdx === 6) return 'Extended Data Record Number';
        if (byteIdx >= 7) return `Extended Data Byte ${byteIdx - 6}`;
      } else if (subFunc === 0x08 || subFunc === 0x09) {
        // Severity-based responses
        if (byteIdx === 2) return 'DTC Status Availability Mask';
        if (byteIdx >= 3) {
          const severityOffset = (byteIdx - 3) % 6;
          const dtcNum = Math.floor((byteIdx - 3) / 6) + 1;
          if (severityOffset === 0) {
            const severity = (byte >> 5) & 0x07;
            const sevNames = ['No Info', 'Maint Due', 'Check Soon', 'Check Now', 'Critical', 'Critical', 'Critical', 'Critical'];
            return `DTC #${dtcNum} Severity (${sevNames[severity]})`;
          }
          if (severityOffset === 1) return `DTC #${dtcNum} Functional Unit`;
          if (severityOffset === 2) return `DTC #${dtcNum} High Byte`;
          if (severityOffset === 3) return `DTC #${dtcNum} Middle Byte`;
          if (severityOffset === 4) return `DTC #${dtcNum} Low Byte`;
          if (severityOffset === 5) return `DTC #${dtcNum} Status`;
        }
      }
      return `DTC Data Byte ${byteIdx - 2}`;


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
  const { requestHistory, clearHistory, recordNRCResolution, ecuPower } = useUDS();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
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

  /**
   * Generate report from current terminal data and navigate to report page
   */
  const handleGenerateReport = () => {
    if (requestHistory.length === 0) {
      alert('No terminal data to generate report. Please send some UDS requests first.');
      return;
    }

    // Extract requests and responses from history
    const requests = requestHistory.map(item => item.request);
    const responses = requestHistory.map(item => item.response);

    // Calculate timings between requests
    const timings: number[] = requests.map((req, idx) => {
      if (idx === 0) return 0;
      return Math.max(0, req.timestamp - requests[idx - 1].timestamp);
    });

    // Calculate success rate
    const successCount = responses.filter(r => !r.isNegative).length;
    const successRate = responses.length > 0 ? Math.round((successCount / responses.length) * 100) : 0;

    // Calculate duration
    const duration = requests.length > 1 ? requests[requests.length - 1].timestamp - requests[0].timestamp : 0;

    // Create report data in the format expected by ReportAnalysisPage
    const reportData = {
      id: `terminal_report_${Date.now()}`,
      name: `Terminal Output Report (${new Date().toLocaleString()})`,
      description: `Generated from current terminal session with ${requests.length} requests`,
      version: '1.0.0',
      metadata: {
        author: 'UDS Simulator',
        description: `Terminal session with ${requests.length} requests, ${successRate}% success rate`,
        tags: ['terminal', 'live-session'],
        duration: duration,
        totalRequests: requests.length,
        successRate: successRate,
        createdAt: Date.now(),
      },
      requests: requests,
      responses: responses,
      timings: timings,
      createdAt: Date.now(),
    };

    // Store in sessionStorage for the report page to pick up
    sessionStorage.setItem('currentReport', JSON.stringify(reportData));

    // Navigate to report page
    navigate('/report', { state: { reportData } });
  };

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

  // Auto-scroll to top when new content is added (since we show newest first)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [requestHistory]);

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
      0x35: 'Request Upload',
      0x36: 'Transfer Data',
      0x37: 'Transfer Exit',
      0x3D: 'Write Memory',
      0x3E: 'Tester Present',
      0x83: 'Access Timing Parameter',
      0x85: 'Control DTC Setting',
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
    <div className="glass-panel cyber-shape p-0 animate-slide-up terminal-container relative overflow-hidden flex flex-col h-full" style={{ animationDelay: '0.1s' }}>
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] hidden dark:block opacity-20" />

      {/* Terminal Header */}
      <div className="terminal-header flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 py-2 sm:py-3 relative z-10 shrink-0 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5">
            {/* Red - Glows when ECU is OFFLINE */}
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${!ecuPower
              ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
              : 'bg-red-500/30'
              }`} title={ecuPower ? 'Ignition On' : 'Ignition Off'} />
            {/* Yellow - Always dim (standby indicator) */}
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/30 transition-all duration-300" title="Standby" />
            {/* Green - Glows when ECU is ONLINE */}
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${ecuPower
              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse'
              : 'bg-green-500/30'
              }`} title={ecuPower ? 'ECU Online' : 'ECU Offline'} />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-300 font-bold tracking-wide">
              <span className="hidden sm:inline">TERMINAL_OUTPUT</span>
              <span className="sm:hidden">TERM</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap justify-end">
          {/* Latency Indicator - hidden on very small screens */}
          <div className="hidden xs:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-800/50 border border-gray-700 rounded-md">
            <span className="text-[8px] sm:text-[10px] text-gray-500">LATENCY</span>
            <span className="text-[8px] sm:text-[10px] font-mono text-emerald-400">7ms</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-mono text-gray-600 dark:text-gray-500">
            <span className="flex items-center gap-1"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-500"></span>TX: {flowStats.totalRequests}</span>
            <span className="flex items-center gap-1"><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500"></span>RX: {flowStats.totalResponses}</span>
          </div>
          <button
            onClick={handleGenerateReport}
            className="text-[8px] sm:text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors uppercase"
            disabled={requestHistory.length === 0}
            title="Generate report from current terminal data"
          >
            <span className="hidden sm:inline">REPORT</span>
            <span className="sm:hidden">📊</span>
          </button>
          <button
            onClick={clearHistory}
            className="text-[8px] sm:text-[10px] font-mono text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors uppercase"
            disabled={requestHistory.length === 0}
          >
            <span className="hidden sm:inline">CLEAR</span>
            <span className="sm:hidden">🗑️</span>
          </button>
        </div>
      </div>

      {/* Packet Flow - Dual Line (TX & RX) */}
      <div className="relative py-2 sm:py-3 px-2 sm:px-4 flex items-center justify-between h-16 sm:h-24 !bg-gray-50 dark:!bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 shrink-0">
        {/* Client Node */}
        <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 z-20 h-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-700/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-[10px] sm:text-xs font-bold text-cyan-500">CLI</span>
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-6 mx-2 sm:mx-4 h-full relative">

          {/* TX Line (CLI -> ECU) */}
          <div className="relative w-full h-3 sm:h-4 flex items-center">
            <div className="hidden sm:block absolute left-[-10px] text-[10px] font-mono text-cyan-600/70 font-bold">TX</div>
            <div className="w-full h-px bg-gradient-to-r from-cyan-900/50 via-cyan-500/30 to-cyan-900/50 relative">
              {/* Direction Arrows */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-500/50 text-[8px] sm:text-[10px]">▶</div>
              <div className="hidden sm:block absolute left-1/3 top-1/2 -translate-y-1/2 text-cyan-500/20 text-[8px]">▶</div>
              <div className="hidden sm:block absolute left-2/3 top-1/2 -translate-y-1/2 text-cyan-500/20 text-[8px]">▶</div>

              {/* Request Packets */}
              {activePackets.filter(p => p.direction === 'request').map(p => (
                <div key={p.id} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] rounded-full animate-packet-request" />
              ))}
            </div>
          </div>

          {/* RX Line (ECU -> CLI) */}
          <div className="relative w-full h-3 sm:h-4 flex items-center">
            <div className="hidden sm:block absolute left-[-10px] text-[10px] font-mono text-purple-600/70 font-bold">RX</div>
            <div className="w-full h-px bg-gradient-to-r from-purple-900/50 via-purple-500/30 to-purple-900/50 relative">
              {/* Direction Arrows */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-purple-500/50 text-[8px] sm:text-[10px]">◀</div>
              <div className="hidden sm:block absolute left-1/3 top-1/2 -translate-y-1/2 text-purple-500/20 text-[8px]">◀</div>
              <div className="hidden sm:block absolute left-2/3 top-1/2 -translate-y-1/2 text-purple-500/20 text-[8px]">◀</div>

              {/* Response Packets */}
              {activePackets.filter(p => p.direction === 'response').map(p => (
                <div key={p.id} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] rounded-full animate-packet-response" />
              ))}
            </div>
          </div>

        </div>

        {/* ECU Node */}
        <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 z-20 h-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-700/50 relative shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            {flowStats.activeFlow && (
              <div className="absolute inset-0 border border-purple-500 rounded-lg animate-ping opacity-20" />
            )}
            <span className="text-[10px] sm:text-xs font-bold text-purple-500">ECU</span>
          </div>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div ref={containerRef} className="h-[250px] sm:h-[350px] lg:h-[400px] overflow-y-auto p-2 sm:p-4 font-mono text-xs sm:text-sm custom-scrollbar scroll-smooth">
        {/* Filter out auto-TP packets (only suppress successful auto-keep-alive, show errors) */}
        {(() => {
          const filteredHistory = requestHistory.filter(item => {
            // Keep auto-TP failures/errors visible in terminal
            const isAutoTP = (item as { isAutoKeepAlive?: boolean }).isAutoKeepAlive;
            if (isAutoTP && item.request.sid === 0x3E && !item.response.isNegative) {
              return false; // Suppress successful auto-TP
            }
            return true;
          });

          return filteredHistory.length === 0 ? (
            <div className="terminal-empty-state">
              <p className="font-mono">No active session data</p>
              <p className="text-xs">Waiting for UDS commands...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {[...filteredHistory].reverse().map((item, index) => (
                <div key={`${item.request.timestamp}-${index}`} className="animate-fade-in mb-3">
                  {/* Request Line */}
                  <div className="terminal-log-entry terminal-log-tx group">
                    <span className="text-gray-500 dark:text-gray-500 mr-2 text-xs">[{formatTimestamp(item.request.timestamp)}]</span>
                    <span className="text-cyan-500 font-bold mr-2">➜ TX</span>
                    <span className="text-gray-700 dark:text-gray-300 mr-2 font-medium">{getServiceName(item.request.sid)}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                      {toHex([item.request.sid, ...(item.request.subFunction ? [item.request.subFunction] : []), ...(item.request.data || [])])}
                    </span>
                  </div>

                  {/* Response Line */}
                  <div className={`terminal-log-entry group mt-1 ${item.response.isNegative ? 'terminal-log-rx-negative' : 'terminal-log-rx-positive'}`}>
                    <span className="text-gray-500 dark:text-gray-500 mr-2 text-xs">[{formatTimestamp(item.response.timestamp)}]</span>
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
                        <span className="text-purple-600 dark:text-purple-300 mr-2 font-medium">POSITIVE RESPONSE</span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono">
                          {item.response.data.map(b => byteToHex(b)).join(' ')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Detailed Breakdown (Always visible for learning) */}
                  <div className="terminal-byte-breakdown py-2 mt-1 mb-2">
                    {item.response.data.map((byte, idx) => (
                      <div key={idx} className="terminal-byte-row">
                        <span className="terminal-byte-index">{idx}</span>
                        <span className="terminal-byte-value">{byteToHex(byte)}</span>
                        <span className="terminal-byte-interpretation">{getByteInterpretation(item, idx, byte)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4 text-cyan-500 terminal-cursor text-lg">
                _
              </div>
            </div>
          );
        })()}
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
