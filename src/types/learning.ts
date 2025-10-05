/**
 * Learning System Types for NRC Educational Features
 */

import type { NegativeResponseCode, UDSRequest } from './uds';

export interface NRCLesson {
  nrc: NegativeResponseCode;
  title: string;
  description: string;
  commonCauses: string[];
  troubleshootingSteps: string[];
  examples: {
    incorrect: UDSRequest;
    correct: UDSRequest;
    explanation: string;
  }[];
  isoReference: string;
  relatedNRCs: NegativeResponseCode[];
}

export interface LearningProgress {
  encounteredNRCs: Set<NegativeResponseCode>;
  resolvedNRCs: Set<NegativeResponseCode>;
  totalErrors: number;
  totalResolutions: number;
  badges: Badge[];
  lastUpdated: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
  condition: {
    type: 'encounter' | 'resolve' | 'streak' | 'variety';
    threshold: number;
  };
}

export interface LearningProgressStorage {
  encounteredNRCs: NegativeResponseCode[];
  resolvedNRCs: NegativeResponseCode[];
  totalErrors: number;
  totalResolutions: number;
  badges: Badge[];
  lastUpdated: number;
}

// Helper to convert LearningProgress to storage format
export const serializeLearningProgress = (progress: LearningProgress): LearningProgressStorage => ({
  encounteredNRCs: Array.from(progress.encounteredNRCs),
  resolvedNRCs: Array.from(progress.resolvedNRCs),
  totalErrors: progress.totalErrors,
  totalResolutions: progress.totalResolutions,
  badges: progress.badges,
  lastUpdated: progress.lastUpdated,
});

// Helper to convert storage format to LearningProgress
export const deserializeLearningProgress = (storage: LearningProgressStorage): LearningProgress => ({
  encounteredNRCs: new Set(storage.encounteredNRCs),
  resolvedNRCs: new Set(storage.resolvedNRCs),
  totalErrors: storage.totalErrors,
  totalResolutions: storage.totalResolutions,
  badges: storage.badges,
  lastUpdated: storage.lastUpdated,
});
