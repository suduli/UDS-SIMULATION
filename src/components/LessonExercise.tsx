/**
 * Lesson Exercise Component
 * 
 * Interactive exercise with hints, validation, and solution reveal
 */

import React, { useState } from 'react';
import type { LessonExercise as LessonExerciseType, LessonProgress } from '../types/tutorial';

interface LessonExerciseProps {
  exercise: LessonExerciseType;
  progress: LessonProgress;
  onComplete: (success: boolean, hintsUsed: number[], solutionViewed: boolean) => void;
}

export const LessonExercise: React.FC<LessonExerciseProps> = ({
  exercise,
  // progress, // Reserved for future use
  onComplete,
}) => {
  const [hexInput, setHexInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    messages: string[];
  } | null>(null);
  const [usedHintLevels, setUsedHintLevels] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleHintClick = (level: number) => {
    if (!usedHintLevels.includes(level)) {
      setUsedHintLevels([...usedHintLevels, level].sort());
    }
  };

  const handleShowSolution = () => {
    setShowSolution(true);
  };

  const validateRequest = (input: string): { isValid: boolean; messages: string[] } => {
    const messages: string[] = [];
    let isValid = true;

    // Parse hex input
    const cleanHex = input.replace(/0x/gi, '').replace(/\s+/g, ' ').trim();
    const bytes = cleanHex.split(' ').filter(b => b.length > 0);

    // Apply validation rules
    exercise.validationRules.forEach(rule => {
      switch (rule.type) {
        case 'exact-match':
          if (rule.expectedValue) {
            const expected = Array.isArray(rule.expectedValue) 
              ? rule.expectedValue 
              : [rule.expectedValue];
            const actualBytes = bytes.map(b => parseInt(b, 16));
            const matches = JSON.stringify(actualBytes) === JSON.stringify(expected);
            
            if (!matches) {
              messages.push(rule.message);
              isValid = false;
            }
          }
          break;

        case 'length':
          if (rule.min !== undefined && bytes.length < rule.min) {
            messages.push(rule.message);
            isValid = false;
          }
          if (rule.max !== undefined && bytes.length > rule.max) {
            messages.push(rule.message);
            isValid = false;
          }
          break;

        case 'service-id':
          if (rule.expectedValue !== undefined && bytes.length > 0) {
            const firstByte = parseInt(bytes[0], 16);
            if (firstByte !== rule.expectedValue) {
              messages.push(rule.message);
              isValid = false;
            }
          }
          break;

        case 'sub-function':
          if (rule.expectedValue !== undefined && bytes.length > 1) {
            const secondByte = parseInt(bytes[1], 16);
            if (secondByte !== rule.expectedValue) {
              messages.push(rule.message);
              isValid = false;
            }
          }
          break;

        case 'byte-range':
          bytes.forEach((byte, index) => {
            const value = parseInt(byte, 16);
            if (rule.min !== undefined && value < rule.min) {
              messages.push(`${rule.message} (byte ${index})`);
              isValid = false;
            }
            if (rule.max !== undefined && value > rule.max) {
              messages.push(`${rule.message} (byte ${index})`);
              isValid = false;
            }
          });
          break;

        case 'format': {
          const hexPattern = /^([0-9A-Fa-f]{2}\s)*[0-9A-Fa-f]{2}$/;
          if (!hexPattern.test(cleanHex) && cleanHex.length > 0) {
            messages.push(rule.message);
            isValid = false;
          }
          break;
        }
      }
    });

    return { isValid, messages };
  };

  const handleCheck = () => {
    const result = validateRequest(hexInput);
    setValidationResult(result);
    setAttemptCount(attemptCount + 1);

    if (result.isValid) {
      // Success!
      setTimeout(() => {
        onComplete(true, usedHintLevels, showSolution);
      }, 1500);
    }
  };

  const handleCopySolution = () => {
    setHexInput(exercise.solution.hex);
    navigator.clipboard.writeText(exercise.solution.hex);
  };

  const availableHints = exercise.hints.filter(h => h.level <= 3).sort((a, b) => a.level - b.level);
  const nextHintLevel = Math.min(...availableHints.map(h => h.level).filter(l => !usedHintLevels.includes(l)));

  return (
    <div className="space-y-6">
      {/* Exercise Description */}
      <div className="cyber-panel bg-blue-500/10 border-blue-500/30 p-6">
        <h3 className="text-cyan-400 font-bold mb-2">📋 Exercise</h3>
        <p className="text-gray-300 mb-3">{exercise.description}</p>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-blue-400">🎯</span>
          <div>
            <p className="text-blue-300 font-medium">Objective:</p>
            <p className="text-gray-400">{exercise.objective}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cyber-panel p-4">
          <p className="text-xs text-gray-400 mb-1">Attempts</p>
          <p className="text-xl font-bold text-cyan-400">{attemptCount}</p>
        </div>
        <div className="cyber-panel p-4">
          <p className="text-xs text-gray-400 mb-1">Hints Used</p>
          <p className="text-xl font-bold text-yellow-400">{usedHintLevels.length}/3</p>
        </div>
        <div className="cyber-panel p-4">
          <p className="text-xs text-gray-400 mb-1">Solution</p>
          <p className="text-xl font-bold text-purple-400">{showSolution ? 'Viewed' : 'Hidden'}</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="cyber-panel p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Request (Hex Format)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            placeholder="Example: 10 03"
            className="cyber-input flex-1 font-mono"
            spellCheck={false}
          />
          <button
            onClick={handleCheck}
            disabled={!hexInput.trim()}
            className="cyber-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Check
          </button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`mt-4 p-4 rounded border ${
            validationResult.isValid
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className={`font-bold mb-2 ${
              validationResult.isValid ? 'text-green-400' : 'text-red-400'
            }`}>
              {validationResult.isValid ? '✓ Correct!' : '✗ Not quite right'}
            </p>
            {validationResult.messages.length > 0 && (
              <ul className="text-sm space-y-1">
                {validationResult.messages.map((msg, index) => (
                  <li key={index} className="text-gray-300">• {msg}</li>
                ))}
              </ul>
            )}
            {validationResult.isValid && (
              <p className="text-sm text-green-300 mt-2">
                Great job! Proceeding to quiz...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hints Section */}
      <div className="cyber-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cyan-400 font-bold">💡 Hints</h3>
          <p className="text-xs text-gray-400">
            Use hints if you're stuck, but try without them first!
          </p>
        </div>

        <div className="space-y-3">
          {availableHints.map((hint) => {
            const isRevealed = usedHintLevels.includes(hint.level);
            const canReveal = hint.level === nextHintLevel || isRevealed;

            return (
              <div key={hint.level}>
                <button
                  onClick={() => handleHintClick(hint.level)}
                  disabled={!canReveal || isRevealed}
                  className={`w-full text-left p-4 rounded border transition-colors ${
                    isRevealed
                      ? 'bg-yellow-500/10 border-yellow-500/30 cursor-default'
                      : canReveal
                      ? 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 cursor-pointer'
                      : 'bg-gray-800/30 border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${isRevealed ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {isRevealed ? '💡' : '🔒'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-400 mb-1">
                        Hint Level {hint.level}
                      </p>
                      {isRevealed ? (
                        <p className="text-gray-300">{hint.text}</p>
                      ) : (
                        <p className="text-gray-500 italic">
                          {canReveal ? 'Click to reveal' : 'Unlock previous hints first'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solution Section */}
      <div className="cyber-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-purple-400 font-bold">🔓 Solution</h3>
          <p className="text-xs text-gray-400">
            View the complete solution and explanation
          </p>
        </div>

        {!showSolution ? (
          <button
            onClick={handleShowSolution}
            className="w-full cyber-button bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          >
            Show Solution
          </button>
        ) : (
          <div className="space-y-4">
            {/* Solution Hex */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Complete Request:</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-gray-800 p-3 rounded font-mono text-purple-300 text-lg">
                  {exercise.solution.hex}
                </code>
                <button
                  onClick={handleCopySolution}
                  className="cyber-button-sm"
                  title="Copy and use solution"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Explanation:</p>
              <p className="text-gray-300">{exercise.solution.explanation}</p>
            </div>

            {/* Breakdown */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Byte Breakdown:</p>
              <div className="space-y-2">
                {exercise.solution.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded">
                    <code className="font-mono text-purple-400 font-bold">{item.bytes}</code>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-300">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expected Response Info */}
      <div className="cyber-panel bg-green-500/10 border-green-500/30 p-6">
        <h3 className="text-green-400 font-bold mb-2">✅ Expected Response</h3>
        <p className="text-gray-300 text-sm">{exercise.expectedResponse.description}</p>
        {exercise.expectedResponse.data && exercise.expectedResponse.data.length > 0 && (
          <code className="response-data-container block mt-2 bg-gray-800 p-2 rounded font-mono text-green-300 text-sm">
            {exercise.expectedResponse.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
          </code>
        )}
      </div>
    </div>
  );
};
