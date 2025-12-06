/**
 * Sequence Execution Panel Component
 * Real-time display and control for sequence execution
 */

import React from 'react';
import type { Sequence, SequenceExecutionOptions } from '../types/sequence';
import { useUDS } from '../context/UDSContext';
import { formatTiming } from '../utils/udsHelpers';

interface SequenceExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sequence?: Sequence;
}

export const SequenceExecutionPanel: React.FC<SequenceExecutionPanelProps> = ({
  isOpen,
  onClose,
  sequence,
}) => {
  const { currentSequence, executeSequence, pauseSequence, resumeSequence, stopSequence, clearSequenceExecution } = useUDS();
  const [speed, setSpeed] = React.useState<number>(1);
  const [stopOnError, setStopOnError] = React.useState<boolean>(true);

  const handleExecute = async () => {
    if (!sequence) return;

    const options: SequenceExecutionOptions = {
      speed,
      stopOnError,
      skipBreakpoints: false,
      dryRun: false,
    };

    try {
      await executeSequence(sequence, options);
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const handlePause = () => {
    pauseSequence();
  };

  const handleResume = () => {
    resumeSequence();
  };

  const handleStop = () => {
    stopSequence();
    // After a brief moment, clear the execution so user can start fresh
    setTimeout(() => {
      clearSequenceExecution();
    }, 1000);
  };

  const handleClose = () => {
    // Clear execution state when closing
    clearSequenceExecution();
    onClose();
  };

  // Auto-close when execution completes successfully
  React.useEffect(() => {
    if (currentSequence &&
      !currentSequence.isRunning &&
      currentSequence.completedAt &&
      currentSequence.results.length > 0) {
      // Check if all steps succeeded
      const allSuccess = currentSequence.results.every(r => r.success);
      if (allSuccess) {
        // Auto-close after 2 seconds on success
        const timer = setTimeout(() => {
          clearSequenceExecution();
          onClose();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSequence, clearSequenceExecution, onClose]);

  const getProgress = () => {
    if (!currentSequence) return 0;
    if (currentSequence.sequence.steps.length === 0) return 0;
    return (currentSequence.currentStep / currentSequence.sequence.steps.length) * 100;
  };

  const getSuccessRate = () => {
    if (!currentSequence || currentSequence.results.length === 0) return 0;
    const successful = currentSequence.results.filter(r => r.success).length;
    return Math.round((successful / currentSequence.results.length) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900/95 dark:to-gray-900 border border-slate-300 dark:border-cyan-500/30 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-slate-500/20 dark:shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-purple-500/10 border-b border-slate-200 dark:border-cyan-500/30 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sequence Execution
              </h2>
              {sequence && (
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                  {sequence.name} • {sequence.steps.length} steps
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50/50 dark:bg-transparent">
          {!currentSequence ? (
            /* Initial State */
            <div className="space-y-6">
              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-400 mb-2">Playback Speed</label>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  >
                    <option value={0.5}>0.5x (Slow)</option>
                    <option value={1}>1x (Normal)</option>
                    <option value={2}>2x (Fast)</option>
                    <option value={5}>5x (Very Fast)</option>
                    <option value={10}>10x (Max)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-400 mb-2">Error Handling</label>
                  <select
                    value={stopOnError ? 'stop' : 'continue'}
                    onChange={(e) => setStopOnError(e.target.value === 'stop')}
                    className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  >
                    <option value="stop">Stop on Error</option>
                    <option value="continue">Continue on Error</option>
                  </select>
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={handleExecute}
                disabled={!sequence}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execute Sequence
              </button>

              {/* Preview */}
              {sequence && (
                <div className="p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                  <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Sequence Preview</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sequence.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-slate-900 dark:text-white">{step.label}</span>
                        {step.breakpoint && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Breakpoint"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Execution State */
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600 dark:text-gray-400">
                    Step {currentSequence.currentStep + 1} of {currentSequence.sequence.steps.length}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-gray-400">
                    {Math.round(getProgress())}% Complete
                  </span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {currentSequence.results.length}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-emerald-500 dark:text-green-400">
                    {getSuccessRate()}%
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-gray-400 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">
                    {currentSequence.startedAt && formatTiming(Date.now() - currentSequence.startedAt)}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {currentSequence.isRunning && !currentSequence.isPaused && (
                  <button
                    onClick={handlePause}
                    className="flex-1 px-4 py-3 bg-amber-50 dark:bg-yellow-500/20 border border-amber-300 dark:border-yellow-500/50 text-amber-600 dark:text-yellow-400 rounded-lg hover:bg-amber-100 dark:hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </button>
                )}

                {currentSequence.isPaused && (
                  <button
                    onClick={handleResume}
                    className="flex-1 px-4 py-3 bg-emerald-50 dark:bg-green-500/20 border border-emerald-300 dark:border-green-500/50 text-emerald-600 dark:text-green-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Resume
                  </button>
                )}

                {currentSequence.isRunning ? (
                  <button
                    onClick={handleStop}
                    className="flex-1 px-4 py-3 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Done
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Execution Log</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentSequence.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${result.success
                          ? 'bg-emerald-50 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/30'
                          : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                        }`}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-white text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-900 dark:text-white font-semibold">{result.step.label}</span>
                          {result.success ? (
                            <svg className="w-4 h-4 text-emerald-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          {result.response.isNegative
                            ? `Negative Response (NRC: 0x${result.response.nrc?.toString(16).toUpperCase()})`
                            : `Positive Response`
                          }
                          {' • '}
                          {result.duration}ms
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-500 dark:text-red-400 mt-1">{result.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
