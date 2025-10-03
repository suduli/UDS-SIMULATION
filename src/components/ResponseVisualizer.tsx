/**
 * Response Visualizer Component
 * Displays UDS responses with detailed breakdown
 */

import React, { useEffect, useRef } from 'react';
import { useUDS } from '../context/UDSContext';
import { toHex, toASCII, getNRCDescription } from '../utils/udsHelpers';

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

              {/* Response - ENHANCED with visual byte blocks and timeline */}
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
                
                <div className={`rounded-xl p-4 ${
                  item.response.isNegative 
                    ? 'bg-cyber-pink/10 border border-cyber-pink/30' 
                    : 'bg-cyber-green/10 border border-cyber-green/30'
                }`}>
                  <div className={`font-mono text-lg mb-3 ${item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'}`}>
                    {toHex(item.response.data)}
                  </div>
                  
                  {/* Enhanced Visual Byte Blocks */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {item.response.data.map((byte, byteIdx) => (
                      <div 
                        key={byteIdx} 
                        className={`flex-shrink-0 rounded-lg p-2 text-center border transition-all hover:scale-110 ${
                          item.response.isNegative 
                            ? 'bg-cyber-pink/20 border-cyber-pink/50' 
                            : 'bg-cyber-green/20 border-cyber-green/50'
                        }`}
                        style={{ animationDelay: `${byteIdx * 0.1}s` }}
                      >
                        <div className={`font-mono text-sm font-bold ${
                          item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                        }`}>
                          {byte.toString(16).toUpperCase().padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Byte breakdown with emoji icons */}
                  <div className="mt-3 space-y-2 text-sm">
                    {item.response.data.map((byte, byteIdx) => (
                      <div key={byteIdx} className="flex items-start gap-2 text-gray-300">
                        <span className="text-slate-500 font-mono text-xs">[{byteIdx}]:</span>
                        <span className={`font-mono font-bold ${
                          item.response.isNegative ? 'text-cyber-pink' : 'text-cyber-green'
                        }`}>
                          0x{byte.toString(16).toUpperCase().padStart(2, '0')}
                        </span>
                        {byteIdx === 0 && item.response.isNegative && <span className="text-slate-400">→ NRC Response</span>}
                        {byteIdx === 0 && !item.response.isNegative && <span className="text-slate-400">✓ Positive Response</span>}
                        {byteIdx === 1 && item.response.isNegative && <span className="text-slate-400">→ Service ID</span>}
                        {byteIdx === 1 && !item.response.isNegative && <span className="text-slate-400">→ Sub-Function</span>}
                        {byteIdx === 2 && item.response.isNegative && item.response.nrc && (
                          <span className="text-slate-400">→ {getNRCDescription(item.response.nrc)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ASCII representation */}
                  {item.response.data.length > 3 && !item.response.isNegative && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">ASCII Representation:</div>
                      <div className="font-mono text-sm text-gray-300 bg-slate-900/50 p-2 rounded">
                        {toASCII(item.response.data.slice(item.response.data[1] ? 2 : 1))}
                      </div>
                    </div>
                  )}
                </div>

                {/* NRC Explanation - ENHANCED with emoji */}
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

                {/* Protocol Trace Timeline - NEW FEATURE */}
                {!item.response.isNegative && (
                  <div className="mt-4">
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Protocol Trace Timeline</div>
                    <div className="flex gap-0.5 h-12 items-end bg-slate-900/50 rounded-lg p-2">
                      {[1,1,3,8,9,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-green-500 to-cyan-500 rounded-t transition-all hover:opacity-70" 
                          style={{height: `${h*10}%`}} 
                        />
                      ))}
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
