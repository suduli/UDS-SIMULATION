/**
 * NRC Learning Modal Component
 * Interactive educational modal for Negative Response Codes
 */

import React, { useState } from 'react';
import type { NegativeResponseCode, UDSRequest, UDSResponse } from '../types/uds';
import { NRC_LESSONS } from '../data/nrcLessons';

interface NRCLearningModalProps {
  nrc: NegativeResponseCode;
  request: UDSRequest;
  response: UDSResponse;
  isOpen: boolean;
  onClose: () => void;
  onTryCorrection: (request: UDSRequest) => void;
  onMarkResolved?: () => void;
}

export const NRCLearningModal: React.FC<NRCLearningModalProps> = ({
  nrc,
  isOpen,
  onClose,
  onTryCorrection,
  onMarkResolved
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'troubleshooting' | 'examples'>('overview');
  const [copiedExample, setCopiedExample] = useState<number | null>(null);

  if (!isOpen) return null;

  const lesson = NRC_LESSONS[nrc];
  
  if (!lesson) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border-2 border-red-500 rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-400">Unknown NRC: 0x{nrc.toString(16).toUpperCase().padStart(2, '0')}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-slate-300">No learning content available for this error code.</p>
        </div>
      </div>
    );
  }

  const handleCopyExample = (index: number, example: UDSRequest) => {
    const hexString = `${example.sid.toString(16).padStart(2, '0')} ${
      example.subFunction ? example.subFunction.toString(16).padStart(2, '0') + ' ' : ''
    }${example.data?.map(b => b.toString(16).padStart(2, '0')).join(' ') || ''}`.trim();
    
    navigator.clipboard.writeText(hexString);
    setCopiedExample(index);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const handleTryCorrection = (example: UDSRequest) => {
    onTryCorrection(example);
    if (onMarkResolved) {
      onMarkResolved();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-lg max-w-4xl w-full my-8 shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{lesson.title}</h2>
                <p className="text-cyan-100">NRC: 0x{nrc.toString(16).toUpperCase().padStart(2, '0')}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-700 bg-slate-800/50">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Overview
            </button>
            <button
              onClick={() => setActiveTab('troubleshooting')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'troubleshooting'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Troubleshooting
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'examples'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Examples
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  What Does This Error Mean?
                </h3>
                <p className="text-slate-300 leading-relaxed">{lesson.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Common Causes</h3>
                <ul className="space-y-2">
                  {lesson.commonCauses.map((cause, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">ISO Reference</h3>
                <p className="text-cyan-300 font-mono text-sm">{lesson.isoReference}</p>
              </div>

              {lesson.relatedNRCs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Related Error Codes</h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.relatedNRCs.map((relatedNrc) => (
                      <span
                        key={relatedNrc}
                        className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-sm text-cyan-300 font-mono"
                      >
                        0x{relatedNrc.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Troubleshooting Tab */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Step-by-Step Troubleshooting
                </h3>
                <div className="space-y-4">
                  {lesson.troubleshootingSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <p className="text-slate-300">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium mb-1">Need More Help?</p>
                    <p className="text-slate-300 text-sm">
                      Check the Examples tab to see correct vs. incorrect requests, or try one of the suggested corrections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Example Solutions</h3>
                {lesson.examples.map((example, index) => (
                  <div key={index} className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-slate-300 mb-4">{example.explanation}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Incorrect Example */}
                      <div className="border border-red-500/30 bg-red-900/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="font-semibold text-red-400">Incorrect</span>
                        </div>
                        <code className="text-sm text-red-300 font-mono block">
                          {example.incorrect.sid.toString(16).toUpperCase().padStart(2, '0')}
                          {example.incorrect.subFunction && ' ' + example.incorrect.subFunction.toString(16).toUpperCase().padStart(2, '0')}
                          {example.incorrect.data && example.incorrect.data.length > 0 && 
                            ' ' + example.incorrect.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                        </code>
                      </div>

                      {/* Correct Example */}
                      <div className="border border-green-500/30 bg-green-900/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold text-green-400">Correct</span>
                          </div>
                          <button
                            onClick={() => handleCopyExample(index, example.correct)}
                            className="text-slate-400 hover:text-green-400 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedExample === index ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <code className="text-sm text-green-300 font-mono block">
                          {example.correct.sid.toString(16).toUpperCase().padStart(2, '0')}
                          {example.correct.subFunction && ' ' + example.correct.subFunction.toString(16).toUpperCase().padStart(2, '0')}
                          {example.correct.data && example.correct.data.length > 0 && 
                            ' ' + example.correct.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                        </code>
                        <button
                          onClick={() => handleTryCorrection(example.correct)}
                          className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          Try This Correction
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 bg-slate-800/50 p-4 rounded-b-lg flex items-center justify-between">
          <div className="text-sm text-slate-400">
            💡 Learning UDS? Encountering errors is the best way to learn!
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            {onMarkResolved && (
              <button
                onClick={() => {
                  onMarkResolved();
                  onClose();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Understood
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
