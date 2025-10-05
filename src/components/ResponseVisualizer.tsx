/**
 * Response Visualizer Component
 * Displays UDS responses with detailed breakdown
 */

import React, { useEffect, useRef } from 'react';
import { useUDS } from '../context/UDSContext';
import { toHex, toASCII, getNRCDescription } from '../utils/udsHelpers';
import type { UDSRequest, UDSResponse } from '../types/uds';

interface HistoryItem {
  request: UDSRequest;
  response: UDSResponse;
}

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
  const { requestHistory, clearHistory } = useUDS();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyber-blue">Response Visualizer</h2>
        <button
          onClick={clearHistory}
          className="cyber-button text-sm"
          disabled={requestHistory.length === 0}
          aria-label="Clear request history"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {requestHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mb-2">No messages yet. Send a request to see the response.</p>
            <p className="text-xs text-gray-600">💡 Try the "Read VIN" quick example to get started!</p>
          </div>
        ) : (
          requestHistory.map((item, index) => (
            <div key={index} className="bg-dark-800/50 rounded-lg border border-dark-600 overflow-hidden animate-fade-in">
              {/* Request */}
              <div className="p-4 border-b border-dark-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-sm font-bold text-cyber-blue">REQUEST</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{formatTimestamp(item.request.timestamp)}</span>
                </div>
                <div className="bg-dark-900/50 rounded p-3 font-mono text-sm">
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

              {/* Response - REDESIGNED to match screenshot */}
              <div className="p-4">
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
                
                <div className={`rounded-lg p-5 ${
                  item.response.isNegative 
                    ? 'bg-dark-900/80 border border-cyber-pink/30' 
                    : 'bg-dark-900/80 border border-cyber-green/30'
                }`}>
                  {/* Hex String Display */}
                  <div className={`font-mono text-xl font-bold mb-4 tracking-wider ${
                    item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                  }`}>
                    {item.response.data.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                  </div>
                  
                  {/* Visual Byte Blocks - Matching Screenshot Style */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {item.response.data.map((byte, byteIdx) => (
                      <div 
                        key={byteIdx} 
                        className={`flex-shrink-0 rounded-md px-3 py-2 text-center border-2 transition-all hover:scale-105 ${
                          item.response.isNegative 
                            ? 'bg-cyber-pink/10 border-cyber-pink/60 hover:bg-cyber-pink/20' 
                            : 'bg-cyber-green/10 border-cyber-green/60 hover:bg-cyber-green/20'
                        }`}
                        style={{ 
                          animationDelay: `${byteIdx * 50}ms`,
                        }}
                      >
                        <div className={`font-mono text-lg font-bold ${
                          item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                        }`}>
                          {byte.toString(16).toUpperCase().padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Detailed Byte Breakdown - Enhanced interpretations */}
                  <div className="mt-4 space-y-2.5 text-sm bg-dark-800/50 rounded-lg p-4 border border-dark-600">
                    {item.response.data.map((byte, byteIdx) => {
                      const interpretation = getByteInterpretation(item, byteIdx, byte);
                      return (
                        <div key={byteIdx} className="flex items-center gap-3 group">
                          <span className="text-slate-500 font-mono text-xs font-semibold min-w-[32px]">[{byteIdx}]:</span>
                          <span className={`font-mono font-bold text-base min-w-[56px] ${
                            item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                          }`}>
                            0x{byte.toString(16).toUpperCase().padStart(2, '0')}
                          </span>
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-gray-300 font-medium">{interpretation}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ASCII representation */}
                  {item.response.data.length > 3 && !item.response.isNegative && (
                    <div className="mt-4 pt-4 border-t border-dark-600">
                      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">ASCII Representation:</div>
                      <div className="font-mono text-sm text-gray-300 bg-dark-900/60 p-3 rounded-md border border-dark-600">
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
                      <div>
                        <div className="font-bold text-cyber-pink text-sm">
                          NRC 0x{item.response.nrc.toString(16).toUpperCase().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {getNRCDescription(item.response.nrc)}
                        </div>
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
    </div>
  );
};

export default ResponseVisualizer;
