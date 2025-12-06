/**
 * Sequence Step Card Component
 * Individual step card with drag-and-drop support for sequence builder
 */

import React, { useState } from 'react';
import type { SequenceStep } from '../types/sequence';
import { getServiceName } from '../utils/udsHelpers';

interface SequenceStepCardProps {
  step: SequenceStep;
  index: number;
  isSelected?: boolean;
  onEdit: (step: SequenceStep) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onToggleBreakpoint: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const SequenceStepCard: React.FC<SequenceStepCardProps> = ({
  step,
  index,
  isSelected = false,
  onEdit,
  onDelete,
  onMove,
  onToggleBreakpoint,
  canMoveUp,
  canMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConditionLabel = () => {
    if (!step.condition) return 'Always';

    switch (step.condition.type) {
      case 'always':
        return 'Always';
      case 'if_positive':
        return 'If Previous Positive';
      case 'if_negative':
        return 'If Previous Negative';
      case 'if_value':
        return `If Value Matches [${step.condition.expectedValue?.map(v => `0x${v.toString(16).toUpperCase()}`).join(', ')}]`;
      default:
        return 'Unknown';
    }
  };

  const serviceName = getServiceName(step.request.sid);

  return (
    <div
      className={`
        border-2 rounded-lg p-4 transition-all
        ${isSelected
          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-gray-800/30 hover:border-cyan-400 dark:hover:border-cyan-500/50'
        }
        ${step.breakpoint ? 'border-l-4 border-l-red-500' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Step Number */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            {index + 1}
          </div>

          {/* Step Label */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold">{step.label || `Step ${index + 1}`}</h4>
            <p className="text-xs text-slate-500 dark:text-gray-400">{serviceName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Breakpoint Toggle */}
          <button
            onClick={onToggleBreakpoint}
            className={`p-1.5 rounded transition-colors ${step.breakpoint
                ? 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30'
                : 'bg-slate-100 dark:bg-gray-700/50 text-slate-400 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            title="Toggle breakpoint"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="6" />
            </svg>
          </button>

          {/* Move Up */}
          <button
            onClick={() => onMove('up')}
            disabled={!canMoveUp}
            className="p-1.5 rounded bg-slate-100 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down */}
          <button
            onClick={() => onMove('down')}
            disabled={!canMoveDown}
            className="p-1.5 rounded bg-slate-100 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-100 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(step)}
            className="p-1.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors"
            title="Edit step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1.5 rounded bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors"
            title="Delete step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {step.delay > 0 ? `${step.delay}ms delay` : 'No delay'}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {getConditionLabel()}
        </span>
        {step.continueOnError && (
          <span className="flex items-center gap-1 text-amber-500 dark:text-yellow-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Continue on error
          </span>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-cyan-500/20 space-y-2">
          {step.description && (
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400">Description:</label>
              <p className="text-sm text-slate-900 dark:text-white">{step.description}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400">Request Data:</label>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700/50 rounded text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                SID: 0x{step.request.sid.toString(16).toUpperCase().padStart(2, '0')}
              </span>
              {step.request.subFunction !== undefined && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700/50 rounded text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                  SUB: 0x{step.request.subFunction.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              )}
              {step.request.data && step.request.data.length > 0 && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700/50 rounded text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                  DATA: {step.request.data.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(' ')}
                </span>
              )}
            </div>
          </div>

          {step.expectedResponse && (
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400">Expected Response:</label>
              <div className="text-sm mt-1">
                {step.expectedResponse.isPositive !== undefined && (
                  <span className={step.expectedResponse.isPositive ? 'text-emerald-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                    {step.expectedResponse.isPositive ? 'Positive' : 'Negative'}
                  </span>
                )}
                {step.expectedResponse.nrc !== undefined && (
                  <span className="ml-2 text-amber-500 dark:text-yellow-400">
                    NRC: 0x{step.expectedResponse.nrc.toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
