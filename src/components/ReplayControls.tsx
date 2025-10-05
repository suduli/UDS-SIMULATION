/**
 * Replay Controls Component
 * UI for controlling scenario replay with play/pause/speed controls
 */

import React from 'react';
import type { ReplayState } from '../types/scenario';

interface ReplayControlsProps {
  replayState: ReplayState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10];

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  replayState,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  onStepForward,
  onStepBackward,
}) => {
  const { isReplaying, currentStep, totalSteps, speed, isPaused } = replayState;

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-purple-400 font-semibold">Replay Mode</span>
        </div>
        <span className="text-gray-400 text-sm">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Step Backward */}
        {onStepBackward && (
          <button
            onClick={onStepBackward}
            disabled={currentStep === 0}
            className="p-2 bg-gray-700/50 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Step Backward"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>
        )}

        {/* Play/Pause Button */}
        {!isReplaying || isPaused ? (
          <button
            onClick={onPlay}
            disabled={currentStep >= totalSteps}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isPaused ? 'Resume' : 'Play'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg shadow-yellow-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pause
          </button>
        )}

        {/* Stop Button */}
        <button
          onClick={onStop}
          disabled={!isReplaying && currentStep === 0}
          className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
          Stop
        </button>

        {/* Step Forward */}
        {onStepForward && (
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            className="p-2 bg-gray-700/50 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Step Forward"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
        )}

        {/* Speed Control */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-400">Speed:</label>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-gray-700/50 border border-purple-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {SPEED_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-3 text-sm text-gray-400">
        {!isReplaying && currentStep === 0 && (
          <p>Ready to replay. Click Play to start.</p>
        )}
        {isReplaying && !isPaused && (
          <p>Replaying scenario at {speed}x speed...</p>
        )}
        {isPaused && (
          <p>Replay paused. Click Resume to continue.</p>
        )}
        {currentStep >= totalSteps && totalSteps > 0 && (
          <p className="text-green-400">✓ Replay completed!</p>
        )}
      </div>
    </div>
  );
};
