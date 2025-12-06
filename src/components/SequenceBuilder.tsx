/**
 * Sequence Builder Component
 * Visual workflow builder for creating and managing diagnostic sequences
 */

import React, { useState, useEffect } from 'react';
import type { Sequence, SequenceStep, ConditionType } from '../types/sequence';
import type { ServiceId } from '../types/uds';
import { useUDS } from '../context/UDSContext';
import { SequenceStepCard } from './SequenceStepCard';
import { SequenceExecutionPanel } from './SequenceExecutionPanel';
import { sequenceEngine } from '../services/SequenceEngine';

interface SequenceBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  initialSequence?: Sequence;
}

export const SequenceBuilder: React.FC<SequenceBuilderProps> = ({
  isOpen,
  onClose,
  initialSequence,
}) => {
  const { sequences, createSequence, updateSequence, deleteSequenceById } = useUDS();

  const [currentSequence, setCurrentSequence] = useState<Sequence | null>(initialSequence || null);
  const [selectedStepIndex, _setSelectedStepIndex] = useState<number | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Step editor state
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [stepLabel, setStepLabel] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [stepSID, setStepSID] = useState<string>('0x10');
  const [stepSubFunction, setStepSubFunction] = useState<string>('');
  const [stepData, setStepData] = useState<string>('');
  const [stepDelay, setStepDelay] = useState<string>('100');
  const [stepCondition, setStepCondition] = useState<ConditionType>('always');
  const [stepContinueOnError, setStepContinueOnError] = useState(false);

  useEffect(() => {
    if (initialSequence) {
      setCurrentSequence(initialSequence);
    }
  }, [initialSequence]);

  const handleCreateNew = () => {
    const newSeq = createSequence('New Sequence', 'Description');
    setCurrentSequence(newSeq);
    setValidationErrors([]);
  };

  const handleLoadExisting = (seq: Sequence) => {
    setCurrentSequence(seq);
    setShowTemplates(false);
    setValidationErrors([]);
  };

  const handleSave = () => {
    if (!currentSequence) return;

    updateSequence(currentSequence.id, currentSequence);
    alert('Sequence saved successfully!');
  };

  const handleValidate = () => {
    if (!currentSequence) return;

    const result = sequenceEngine.validateSequence(currentSequence);

    if (result.isValid) {
      setValidationErrors([]);
      alert('✓ Sequence is valid!');
    } else {
      const errorMessages = result.errors.map(
        e => `Step ${e.stepOrder + 1}: ${e.message}`
      );
      setValidationErrors(errorMessages);
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    resetStepEditor();
    setShowStepEditor(true);
  };

  const handleEditStep = (step: SequenceStep) => {
    setEditingStep(step);
    setStepLabel(step.label);
    setStepDescription(step.description || '');
    setStepSID(`0x${step.request.sid.toString(16).toUpperCase()}`);
    setStepSubFunction(step.request.subFunction !== undefined ? `0x${step.request.subFunction.toString(16).toUpperCase()}` : '');
    setStepData(step.request.data ? step.request.data.map(b => `0x${b.toString(16).toUpperCase()}`).join(' ') : '');
    setStepDelay(step.delay.toString());
    setStepCondition(step.condition?.type || 'always');
    setStepContinueOnError(step.continueOnError);
    setShowStepEditor(true);
  };

  const handleSaveStep = () => {
    if (!currentSequence) return;

    try {
      const sid = parseInt(stepSID);
      const subFunction = stepSubFunction ? parseInt(stepSubFunction) : undefined;
      const data = stepData
        ? stepData.split(/\s+/).map(b => parseInt(b))
        : [];

      const newStep: SequenceStep = {
        id: editingStep?.id || `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order: editingStep?.order ?? currentSequence.steps.length,
        request: {
          sid: sid as ServiceId,
          subFunction,
          data,
          timestamp: Date.now(),
        },
        label: stepLabel || `Step ${currentSequence.steps.length + 1}`,
        description: stepDescription,
        delay: parseInt(stepDelay) || 0,
        continueOnError: stepContinueOnError,
        condition: { type: stepCondition },
      };

      if (editingStep) {
        // Update existing step
        const updatedSteps = currentSequence.steps.map(s =>
          s.id === editingStep.id ? newStep : s
        );
        setCurrentSequence({ ...currentSequence, steps: updatedSteps });
      } else {
        // Add new step
        setCurrentSequence({
          ...currentSequence,
          steps: [...currentSequence.steps, newStep],
        });
      }

      setShowStepEditor(false);
      resetStepEditor();
    } catch {
      alert('Invalid step data. Please check your inputs.');
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (!currentSequence) return;

    const updatedSteps = currentSequence.steps
      .filter(s => s.id !== stepId)
      .map((s, index) => ({ ...s, order: index }));

    setCurrentSequence({ ...currentSequence, steps: updatedSteps });
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!currentSequence) return;

    const index = currentSequence.steps.findIndex(s => s.id === stepId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentSequence.steps.length) return;

    const newSteps = [...currentSequence.steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    // Update order
    newSteps.forEach((step, idx) => {
      step.order = idx;
    });

    setCurrentSequence({ ...currentSequence, steps: newSteps });
  };

  const handleToggleBreakpoint = (stepId: string) => {
    if (!currentSequence) return;

    const updatedSteps = currentSequence.steps.map(s =>
      s.id === stepId ? { ...s, breakpoint: !s.breakpoint } : s
    );

    setCurrentSequence({ ...currentSequence, steps: updatedSteps });
  };

  const handleDelete = () => {
    if (!currentSequence) return;

    if (confirm(`Are you sure you want to delete "${currentSequence.name}"?`)) {
      deleteSequenceById(currentSequence.id);
      setCurrentSequence(null);
      alert('Sequence deleted');
    }
  };

  const resetStepEditor = () => {
    setStepLabel('');
    setStepDescription('');
    setStepSID('0x10');
    setStepSubFunction('');
    setStepData('');
    setStepDelay('100');
    setStepCondition('always');
    setStepContinueOnError(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {/* Main Container */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900/95 dark:to-gray-900 border border-slate-300 dark:border-cyan-500/30 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl shadow-slate-500/20 dark:shadow-cyan-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-purple-500/10 border-b border-slate-200 dark:border-cyan-500/30 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Sequence Builder
                </h2>
                {currentSequence && (
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                    {currentSequence.name} • {currentSequence.steps.length} steps
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30"
              >
                + New Sequence
              </button>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 py-2 bg-slate-100 dark:bg-gray-700/50 border border-slate-300 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                📚 Templates
              </button>
              {currentSequence && (
                <>
                  <button
                    onClick={handleAddStep}
                    className="px-4 py-2 bg-emerald-50 dark:bg-green-500/20 border border-emerald-300 dark:border-green-500/50 text-emerald-600 dark:text-green-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-green-500/30 transition-colors"
                  >
                    + Add Step
                  </button>
                  <button
                    onClick={handleValidate}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors"
                  >
                    ✓ Validate
                  </button>
                  <button
                    onClick={() => setShowExecutionPanel(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-500/20 dark:to-blue-500/20 border border-cyan-300 dark:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 rounded-lg hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 transition-all font-semibold"
                    disabled={!currentSequence || currentSequence.steps.length === 0}
                  >
                    ▶️ Execute
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-50 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/50 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-colors"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg">
                <h4 className="text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ Validation Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-500 dark:text-red-300 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex h-[calc(95vh-200px)]">
            {/* Templates Sidebar */}
            {showTemplates && (
              <div className="w-80 border-r border-slate-200 dark:border-cyan-500/30 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-800/20">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Available Sequences</h3>
                <div className="space-y-2">
                  {sequences.map(seq => (
                    <button
                      key={seq.id}
                      onClick={() => handleLoadExisting(seq)}
                      className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-slate-200 dark:border-cyan-500/20 hover:border-cyan-500 dark:hover:border-cyan-500/50 transition-colors shadow-sm hover:shadow-md"
                    >
                      <h4 className="text-slate-900 dark:text-white font-semibold">{seq.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">{seq.description}</p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">{seq.steps.length} steps</p>
                    </button>
                  ))}
                  {sequences.length === 0 && (
                    <p className="text-slate-500 dark:text-gray-500 text-sm">No saved sequences yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent">
              {!currentSequence ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-gray-500">
                  <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="text-lg">Create a new sequence or load an existing one</p>
                </div>
              ) : (
                <div>
                  {/* Sequence Info */}
                  <div className="mb-6 p-4 bg-white dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-cyan-500/20 shadow-sm">
                    <input
                      type="text"
                      value={currentSequence.name}
                      onChange={(e) => setCurrentSequence({ ...currentSequence, name: e.target.value })}
                      className="w-full bg-transparent text-xl font-bold text-slate-900 dark:text-white border-none outline-none mb-2 placeholder-slate-400 dark:placeholder-gray-500"
                      placeholder="Sequence Name"
                    />
                    <textarea
                      value={currentSequence.description}
                      onChange={(e) => setCurrentSequence({ ...currentSequence, description: e.target.value })}
                      className="w-full bg-transparent text-sm text-slate-600 dark:text-gray-400 border-none outline-none resize-none placeholder-slate-400 dark:placeholder-gray-600"
                      placeholder="Description"
                      rows={2}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {currentSequence.steps.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-gray-500">
                        <p>No steps yet. Click "Add Step" to begin.</p>
                      </div>
                    ) : (
                      currentSequence.steps.map((step, index) => (
                        <SequenceStepCard
                          key={step.id}
                          step={step}
                          index={index}
                          isSelected={selectedStepIndex === index}
                          onEdit={handleEditStep}
                          onDelete={() => handleDeleteStep(step.id)}
                          onMove={(dir) => handleMoveStep(step.id, dir)}
                          onToggleBreakpoint={() => handleToggleBreakpoint(step.id)}
                          canMoveUp={index > 0}
                          canMoveDown={index < currentSequence.steps.length - 1}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step Editor Modal */}
          {showStepEditor && (
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 border border-slate-300 dark:border-cyan-500/50 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {editingStep ? 'Edit Step' : 'Add New Step'}
                </h3>

                <div className="space-y-4">
                  {/* Label */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Step Label</label>
                    <input
                      type="text"
                      value={stepLabel}
                      onChange={(e) => setStepLabel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      placeholder="e.g., Enter Diagnostic Session"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Description (optional)</label>
                    <textarea
                      value={stepDescription}
                      onChange={(e) => setStepDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      rows={2}
                      placeholder="Additional details..."
                    />
                  </div>

                  {/* SID */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Service ID (SID)</label>
                    <input
                      type="text"
                      value={stepSID}
                      onChange={(e) => setStepSID(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      placeholder="0x10"
                    />
                  </div>

                  {/* Sub-function */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Sub-function (optional)</label>
                    <input
                      type="text"
                      value={stepSubFunction}
                      onChange={(e) => setStepSubFunction(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      placeholder="0x01"
                    />
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Data Bytes (space-separated)</label>
                    <input
                      type="text"
                      value={stepData}
                      onChange={(e) => setStepData(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      placeholder="0xF1 0x90"
                    />
                  </div>

                  {/* Delay */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Delay (ms)</label>
                    <input
                      type="number"
                      value={stepDelay}
                      onChange={(e) => setStepDelay(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      min="0"
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Execution Condition</label>
                    <select
                      value={stepCondition}
                      onChange={(e) => setStepCondition(e.target.value as ConditionType)}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-cyan-500/30 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                    >
                      <option value="always">Always Execute</option>
                      <option value="if_positive">If Previous Positive</option>
                      <option value="if_negative">If Previous Negative</option>
                      <option value="if_value">If Value Matches</option>
                    </select>
                  </div>

                  {/* Continue on Error */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="continueOnError"
                      checked={stepContinueOnError}
                      onChange={(e) => setStepContinueOnError(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label htmlFor="continueOnError" className="text-sm text-slate-600 dark:text-gray-400">
                      Continue sequence if this step fails
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-cyan-500/30">
                    <button
                      onClick={handleSaveStep}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30"
                    >
                      {editingStep ? 'Update Step' : 'Add Step'}
                    </button>
                    <button
                      onClick={() => setShowStepEditor(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Panel */}
      {showExecutionPanel && currentSequence && (
        <SequenceExecutionPanel
          isOpen={showExecutionPanel}
          onClose={() => setShowExecutionPanel(false)}
          sequence={currentSequence}
        />
      )}
    </>
  );
};
