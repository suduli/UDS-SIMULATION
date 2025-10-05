/**
 * Enhanced Scenario Types
 * Type definitions for Phase 2 enhanced export/import functionality
 */

import type { Scenario, ECUConfig, UDSResponse } from './uds';

/**
 * Enhanced scenario with metadata and timing information
 */
export interface EnhancedScenario extends Scenario {
  version: string;
  metadata: {
    author?: string;
    description: string;
    tags: string[];
    duration: number; // milliseconds
    totalRequests: number;
    successRate: number; // percentage
  };
  ecuState?: Partial<ECUConfig>;
  timings: number[]; // timing between each request in milliseconds
  notes?: string;
  responses?: UDSResponse[]; // Store responses for replay validation
}

/**
 * Library of saved scenarios
 */
export interface ScenarioLibrary {
  scenarios: EnhancedScenario[];
  lastModified: number;
}

/**
 * Replay state management
 */
export interface ReplayState {
  isReplaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number; // multiplier (1x, 2x, 5x, 10x)
  isPaused: boolean;
  scenarioId?: string;
}

/**
 * Scenario metadata for creation
 */
export interface ScenarioMetadata {
  name: string;
  description: string;
  author?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Validation result for scenario import
 */
export interface ScenarioValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  scenario?: EnhancedScenario;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Import options
 */
export interface ImportOptions {
  mergeHistory?: boolean; // Merge with existing history or replace
  validateResponses?: boolean; // Validate responses match expected
  preserveTimings?: boolean; // Preserve original timing delays
}

/**
 * CSV export row format
 */
export interface CSVScenarioRow {
  step: number;
  timestamp: string;
  service: string;
  sid: string;
  subFunction?: string;
  data: string;
  responseType: 'positive' | 'negative';
  nrc?: string;
  responseData: string;
  timing: number;
}

/**
 * Scenario statistics
 */
export interface ScenarioStatistics {
  totalScenarios: number;
  totalRequests: number;
  averageSuccessRate: number;
  mostUsedServices: Array<{ sid: number; count: number }>;
  averageDuration: number;
  lastModified: number;
}
