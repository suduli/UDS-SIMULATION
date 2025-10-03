/**
 * Help Modal Component
 * Provides documentation and guidance for UDS Protocol Simulator
 */

import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div 
        className="glass-panel p-6 max-w-4xl max-h-[90vh] overflow-y-auto m-4 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="help-modal-title" className="text-2xl font-bold text-cyber-blue">
            UDS Protocol Simulator - Help Guide
          </h2>
          <button
            onClick={onClose}
            className="cyber-button text-sm"
            aria-label="Close help modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">What is UDS?</h3>
            <p className="text-gray-300 leading-relaxed">
              Unified Diagnostic Services (UDS) is a standardized communication protocol used in automotive Electronic Control Units (ECUs). 
              This simulator helps you learn and practice UDS protocols in a safe, interactive environment.
            </p>
          </section>

          {/* How it Works */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">How It Works</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-blue/20 text-cyber-blue flex items-center justify-center font-bold">1</span>
                <div>
                  <strong className="text-cyber-blue">Build Request:</strong> Select a service from the dropdown or use Manual Mode to enter raw hex bytes. 
                  Use Quick Examples to load pre-configured requests.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-blue/20 text-cyber-blue flex items-center justify-center font-bold">2</span>
                <div>
                  <strong className="text-cyber-blue">Send Request:</strong> Click "Send Request" to transmit the UDS command to the simulated ECU.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-blue/20 text-cyber-blue flex items-center justify-center font-bold">3</span>
                <div>
                  <strong className="text-cyber-blue">View Response:</strong> The Response Visualizer shows detailed breakdowns of positive or negative responses, 
                  including NRC (Negative Response Code) explanations.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyber-blue/20 text-cyber-blue flex items-center justify-center font-bold">4</span>
                <div>
                  <strong className="text-cyber-blue">Monitor State:</strong> The Protocol State Dashboard shows current session type, security status, 
                  and communication state.
                </div>
              </div>
            </div>
          </section>

          {/* Common Services */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">Common UDS Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x10 - Session Control</div>
                <p className="text-xs text-gray-400 mt-1">Change diagnostic session (Default, Extended, Programming)</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x22 - Read Data</div>
                <p className="text-xs text-gray-400 mt-1">Read data by identifier (e.g., VIN, ECU info)</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x27 - Security Access</div>
                <p className="text-xs text-gray-400 mt-1">Request seed/send key for security unlocking</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x19 - Read DTC</div>
                <p className="text-xs text-gray-400 mt-1">Read Diagnostic Trouble Codes</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x31 - Routine Control</div>
                <p className="text-xs text-gray-400 mt-1">Start/stop diagnostic routines</p>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-600">
                <div className="font-mono text-cyber-blue font-bold">0x2E - Write Data</div>
                <p className="text-xs text-gray-400 mt-1">Write data by identifier</p>
              </div>
            </div>
          </section>

          {/* Response Codes */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">Understanding Responses</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-3 bg-cyber-green/10 p-3 rounded border border-cyber-green/30">
                <svg className="w-5 h-5 text-cyber-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong className="text-cyber-green">Positive Response:</strong> SID + 0x40 (e.g., 0x22 → 0x62)
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-cyber-pink/10 p-3 rounded border border-cyber-pink/30">
                <svg className="w-5 h-5 text-cyber-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong className="text-cyber-pink">Negative Response:</strong> 0x7F + SID + NRC (Negative Response Code)
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">Tips & Best Practices</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-cyber-blue mt-1">•</span>
                <span>Start with Quick Examples to understand request formats</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyber-blue mt-1">•</span>
                <span>Use Manual Mode for custom hex sequences and advanced testing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyber-blue mt-1">•</span>
                <span>Watch the Protocol State Dashboard for session and security changes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyber-blue mt-1">•</span>
                <span>Export your session history for later analysis or sharing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyber-blue mt-1">•</span>
                <span>NRC codes provide valuable feedback - read them carefully to understand why requests fail</span>
              </li>
            </ul>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xl font-bold text-cyber-green mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-dark-800/50 p-2 rounded border border-dark-600">
                <span className="text-gray-400">Send Request</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono text-cyber-blue border border-dark-500">Enter</kbd>
              </div>
              <div className="flex items-center justify-between bg-dark-800/50 p-2 rounded border border-dark-600">
                <span className="text-gray-400">Clear History</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono text-cyber-blue border border-dark-500">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between bg-dark-800/50 p-2 rounded border border-dark-600">
                <span className="text-gray-400">Toggle Manual Mode</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono text-cyber-blue border border-dark-500">Ctrl+M</kbd>
              </div>
              <div className="flex items-center justify-between bg-dark-800/50 p-2 rounded border border-dark-600">
                <span className="text-gray-400">Help</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-xs font-mono text-cyber-blue border border-dark-500">F1</kbd>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-600">
          <p className="text-sm text-gray-400 text-center">
            For more information, visit the <a href="https://en.wikipedia.org/wiki/Unified_Diagnostic_Services" target="_blank" rel="noopener noreferrer" className="text-cyber-blue hover:underline">UDS Wikipedia page</a> or consult ISO 14229 standard documentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
