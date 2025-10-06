/**
 * Sequence Builder Types
 * Type definitions for P2-03 Scenario Builder feature
 */

import type { UDSRequest, UDSResponse } from './uds';

/**
 * Condition types for conditional execution
 */
export type ConditionType = 'always' | 'if_positive' | 'if_negative' | 'if_value';

/**
 * Execution condition for a sequence step
 */
export interface StepCondition {
  type: ConditionType;
  expectedValue?: number[]; // For 'if_value' type - match response data
}

/**
 * Individual step in a diagnostic sequence
 */
export interface SequenceStep {
  id: string;
  order: number;
  request: UDSRequest;
  label: string;
  description?: string;
  delay: number; // milliseconds to wait before executing this step
  continueOnError: boolean; // Whether to continue sequence if this step fails
  condition?: StepCondition;
  breakpoint?: boolean; // Pause execution at this step
  expectedResponse?: {
    isPositive?: boolean;
    nrc?: number;
    dataPattern?: number[]; // Expected data bytes (use -1 for wildcard)
  };
}

/**
 * Complete diagnostic sequence
 */
export interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  variables: Record<string, number[]>; // Named variables for substitution
  createdAt: number;
  modifiedAt: number;
  tags?: string[];
  author?: string;
  isTemplate?: boolean; // Whether this is a pre-built template
}

/**
 * Result of a single step execution
 */
export interface StepExecutionResult {
  step: SequenceStep;
  response: UDSResponse;
  success: boolean;
  error?: string;
  timestamp: number;
  duration: number; // Execution time in ms
}

/**
 * Execution state for a running sequence
 */
export interface SequenceExecutionState {
  sequence: Sequence;
  currentStep: number;
  isRunning: boolean;
  isPaused: boolean;
  results: StepExecutionResult[];
  variables: Record<string, number[]>; // Runtime variable values
  startedAt?: number;
  pausedAt?: number;
  completedAt?: number;
  totalDuration?: number;
}

/**
 * Validation result for a sequence
 */
export interface SequenceValidationResult {
  isValid: boolean;
  errors: Array<{
    stepId: string;
    stepOrder: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

/**
 * Variable substitution token format
 * Use ${variableName} or ${stepN.responseData[index]}
 */
export type VariableToken = string;

/**
 * Sequence statistics for analysis
 */
export interface SequenceStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecuted?: number;
}

/**
 * Template category for organizing pre-built sequences
 */
export type TemplateCategory = 
  | 'diagnostic-session'
  | 'security-access'
  | 'dtc-management'
  | 'memory-operations'
  | 'data-transfer'
  | 'routine-control'
  | 'complete-workflow'
  | 'custom';

/**
 * Sequence template with category
 */
export interface SequenceTemplate extends Sequence {
  category: TemplateCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // Expected duration in milliseconds
  prerequisites?: string[]; // Required knowledge or setup
}

/**
 * Execution options for sequence playback
 */
export interface SequenceExecutionOptions {
  stopOnError?: boolean; // Override step-level continueOnError
  speed?: number; // Playback speed multiplier (0.5x, 1x, 2x, etc.)
  skipBreakpoints?: boolean; // Continue through breakpoints
  dryRun?: boolean; // Validate without actually sending requests
}
