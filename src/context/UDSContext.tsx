/**
 * UDS Simulator Context
 * React context for managing UDS protocol state
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { UDSSimulator } from '../services/UDSSimulator';
import { mockECUConfig } from '../services/mockECU';
import { NegativeResponseCode as NegativeResponseCodeMap } from '../types/uds';
import type { UDSRequest, UDSResponse, ProtocolState, Scenario, NegativeResponseCode } from '../types/uds';
import type { EnhancedScenario, ReplayState, ScenarioMetadata } from '../types/scenario';
import type { LearningProgress } from '../types/learning';
import type { Sequence, SequenceExecutionState, SequenceExecutionOptions } from '../types/sequence';
import type { TutorialProgress, LessonProgress } from '../types/tutorial';
import { scenarioManager } from '../services/ScenarioManager';
import { sequenceEngine } from '../services/SequenceEngine';
import { delay } from '../utils/udsHelpers';
import { LEARNING_BADGES } from '../data/nrcLessons';
import { serializeLearningProgress, deserializeLearningProgress } from '../types/learning';

interface UDSMetrics {
  requestsSent: number;
  successRate: number;
  servicesUsed: number;
  activeDTCs: number;
}

type ToastPayload = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
};

const formatHexByte = (value: number) => `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;

const toTitleCase = (label: string) =>
  label
    .toLowerCase()
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getFriendlyNRCName = (code?: NegativeResponseCode) => {
  if (code === undefined) return undefined;
  const match = Object.entries(NegativeResponseCodeMap).find(([, value]) => value === code);
  if (!match) return undefined;
  const rawLabel = match[0].replace(/_/g, ' ');
  return toTitleCase(rawLabel);
};

interface UDSContextType {
  simulator: UDSSimulator;
  protocolState: ProtocolState;
  requestHistory: Array<{ request: UDSRequest; response: UDSResponse }>;
  metrics: UDSMetrics;
  sendRequest: (request: UDSRequest) => Promise<UDSResponse>;
  clearHistory: () => void;
  resetSimulator: () => void;
  saveScenario: (name: string, description: string) => Scenario;
  loadScenario: (scenario: Scenario) => void;

  // Enhanced scenario support
  scenarios: EnhancedScenario[];
  replayState: ReplayState;
  saveEnhancedScenario: (metadata: ScenarioMetadata) => Promise<EnhancedScenario>;
  loadScenarioById: (id: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  startReplay: (scenario: EnhancedScenario) => void;
  pauseReplay: () => void;
  resumeReplay: () => void;
  stopReplay: () => void;
  setReplaySpeed: (speed: number) => void;
  stepForward: () => void;
  stepBackward: () => void;

  // Learning progress support
  learningProgress: LearningProgress;
  recordNRCEncounter: (nrc: NegativeResponseCode) => void;
  recordNRCResolution: (nrc: NegativeResponseCode) => void;

  // Tutorial System (P2-05)
  tutorialProgress: TutorialProgress;
  startLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string, score: number) => void;
  updateLessonProgress: (lessonId: string, updates: Partial<LessonProgress>) => void;

  // Sequence support (P2-03)
  sequences: Sequence[];
  currentSequence?: SequenceExecutionState;
  createSequence: (name: string, description: string) => Sequence;
  updateSequence: (id: string, updates: Partial<Sequence>) => void;
  deleteSequenceById: (id: string) => void;
  executeSequence: (sequence: Sequence, options?: SequenceExecutionOptions) => Promise<void>;
  pauseSequence: () => void;
  resumeSequence: () => void;
  stopSequence: () => void;
  clearSequenceExecution: () => void;

  // Power Management
  voltage: number;
  current: number;
  ecuPower: boolean;
  toggleEcuPower: () => void;
}

const UDSContext = createContext<UDSContextType | undefined>(undefined);

export const UDSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulator] = useState(() => new UDSSimulator(mockECUConfig));
  const [protocolState, setProtocolState] = useState<ProtocolState>(simulator.getState());

  // Initialize with demo data for first-time users
  const getInitialHistory = (): Array<{ request: UDSRequest; response: UDSResponse }> => {
    const hasSeenDemo = localStorage.getItem('uds_demo_seen');
    if (!hasSeenDemo) {
      localStorage.setItem('uds_demo_seen', 'true');
      // Return demo request/response
      return [{
        request: {
          sid: 0x22,
          data: [0xF1, 0x90],
          timestamp: Date.now() - 100,
        },
        response: {
          sid: 0x22,
          data: [0x62, 0xF1, 0x90, 0x31, 0x44, 0x34, 0x47, 0x50, 0x30, 0x30, 0x52, 0x35, 0x35, 0x42, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36],
          timestamp: Date.now(),
          isNegative: false,
        }
      }];
    }
    return [];
  };

  const [requestHistory, setRequestHistory] = useState<Array<{ request: UDSRequest; response: UDSResponse }>>(getInitialHistory);

  // Enhanced scenario state
  const [scenarios, setScenarios] = useState<EnhancedScenario[]>([]);
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    currentStep: 0,
    totalSteps: 0,
    speed: 1,
    isPaused: false,
  });
  const replayTimerRef = useRef<number | null>(null);
  const currentReplayScenario = useRef<EnhancedScenario | null>(null);

  // Calculate metrics from request history
  const [metrics, setMetrics] = useState<UDSMetrics>({
    requestsSent: 0,
    successRate: 0,
    servicesUsed: 0,
    activeDTCs: 0,
  });

  const emitToast = useCallback((toast: ToastPayload) => {
    if (typeof window === 'undefined') return;
    const api = window as Window & { addToast?: (toast: ToastPayload) => void };
    api.addToast?.(toast);
  }, []);

  // Learning progress state
  const getInitialLearningProgress = (): LearningProgress => {
    const stored = localStorage.getItem('uds_learning_progress');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return deserializeLearningProgress(parsed);
      } catch {
        // If parsing fails, return empty progress
      }
    }
    return {
      encounteredNRCs: new Set(),
      resolvedNRCs: new Set(),
      totalErrors: 0,
      totalResolutions: 0,
      badges: LEARNING_BADGES.map(b => ({ ...b })),
      lastUpdated: Date.now(),
    };
  };

  const [learningProgress, setLearningProgress] = useState<LearningProgress>(getInitialLearningProgress);

  // Sequence state (P2-03)
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [currentSequence, setCurrentSequence] = useState<SequenceExecutionState | undefined>();
  const sequenceAbortController = useRef<AbortController | null>(null);

  // Power Management State
  const [voltage, setVoltage] = useState(12.4);
  const [current, setCurrent] = useState(0.5);
  const [ecuPower, setEcuPower] = useState(true);

  // Simulate power fluctuations
  React.useEffect(() => {
    if (!ecuPower) {
      setVoltage(0);
      setCurrent(0);
      return;
    }

    const interval = setInterval(() => {
      // Fluctuate voltage between 11.8 and 14.4
      setVoltage(prev => {
        const change = (Math.random() - 0.5) * 0.1;
        const newVal = prev + change;
        return Math.max(11.8, Math.min(14.4, newVal));
      });

      // Fluctuate current between 0.3 and 0.8
      setCurrent(prev => {
        const change = (Math.random() - 0.5) * 0.05;
        const newVal = prev + change;
        return Math.max(0.3, Math.min(0.8, newVal));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ecuPower]);

  const toggleEcuPower = useCallback(() => {
    setEcuPower(prev => !prev);
  }, []);

  // Save learning progress to localStorage whenever it changes
  React.useEffect(() => {
    const serialized = serializeLearningProgress(learningProgress);
    localStorage.setItem('uds_learning_progress', JSON.stringify(serialized));
  }, [learningProgress]);

  // Update metrics whenever request history changes
  React.useEffect(() => {
    const totalRequests = requestHistory.length;
    const positiveResponses = requestHistory.filter(
      item => !item.response.isNegative
    ).length;
    const successRate = totalRequests > 0
      ? Math.round((positiveResponses / totalRequests) * 100)
      : 0;
    const uniqueServices = new Set(
      requestHistory.map(item => item.request.sid)
    ).size;

    // Get active DTCs from simulator (you can enhance this later)
    const activeDTCs = 5; // TODO: Get from mockECU state

    setMetrics({
      requestsSent: totalRequests,
      successRate,
      servicesUsed: uniqueServices,
      activeDTCs,
    });
  }, [requestHistory]);

  const sendRequest = useCallback(async (request: UDSRequest): Promise<UDSResponse> => {
    try {
      const response = await simulator.processRequest(request);

      setRequestHistory(prev => [...prev, { request, response }]);
      setProtocolState(simulator.getState());

      if (response.isNegative) {
        const nrcHex = response.nrc !== undefined ? formatHexByte(response.nrc) : undefined;
        const friendlyName = getFriendlyNRCName(response.nrc);

        emitToast({
          type: 'error',
          message: nrcHex ? `Negative response ${nrcHex}` : 'Negative response received',
          description: friendlyName
            ? `${friendlyName} for service ${formatHexByte(request.sid)}`
            : `Service ${formatHexByte(request.sid)} returned a negative response.`,
          duration: 7000,
        });
      } else {
        emitToast({
          type: 'success',
          message: `Response for service ${formatHexByte(request.sid)}`,
          description: `Received ${response.data.length} byte${response.data.length === 1 ? '' : 's'} from ECU.`,
          duration: 4500,
        });
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while sending request.';
      emitToast({
        type: 'error',
        message: 'Request failed',
        description: message,
        duration: 7000,
      });
      throw error;
    }
  }, [simulator, emitToast]);

  const clearHistory = useCallback(() => {
    setRequestHistory([]);
  }, []);

  const resetSimulator = useCallback(() => {
    simulator.reset();
    setProtocolState(simulator.getState());
    setRequestHistory([]);
  }, [simulator]);

  const saveScenario = useCallback((name: string, description: string): Scenario => {
    const scenario: Scenario = {
      id: `scenario_${Date.now()}`,
      name,
      description,
      requests: requestHistory.map(h => h.request),
      createdAt: Date.now(),
    };

    // Save to localStorage
    const savedScenarios = JSON.parse(localStorage.getItem('uds_scenarios') || '[]');
    savedScenarios.push(scenario);
    localStorage.setItem('uds_scenarios', JSON.stringify(savedScenarios));

    return scenario;
  }, [requestHistory]);

  const loadScenario = useCallback(() => {
    resetSimulator();
    // Could replay requests here if needed
  }, [resetSimulator]);

  // Enhanced scenario methods
  const executeReplayStep = useCallback(async (
    scenario: EnhancedScenario,
    stepIndex: number,
    speed: number,
    isPaused: boolean
  ) => {
    if (stepIndex >= scenario.requests.length) {
      // Replay completed
      setReplayState(prev => ({
        ...prev,
        isReplaying: false,
        currentStep: scenario.requests.length,
      }));
      return;
    }

    const request = scenario.requests[stepIndex];
    const timing = scenario.timings[stepIndex] || 100;

    // Apply speed multiplier to timing
    const adjustedTiming = timing / speed;

    // Wait for the timing delay
    await delay(Math.max(10, adjustedTiming));

    // Check if paused
    if (isPaused) {
      return;
    }

    // Send the request
    const response = await simulator.processRequest(request);
    setRequestHistory(prev => [...prev, { request, response }]);
    setProtocolState(simulator.getState());

    // Update replay state
    setReplayState(prev => ({
      ...prev,
      currentStep: stepIndex + 1,
    }));

    // Schedule next step
    if (stepIndex + 1 < scenario.requests.length && !isPaused) {
      replayTimerRef.current = window.setTimeout(() => {
        executeReplayStep(scenario, stepIndex + 1, speed, isPaused);
      }, 0);
    } else if (stepIndex + 1 >= scenario.requests.length) {
      setReplayState(prev => ({
        ...prev,
        isReplaying: false,
      }));
    }
  }, [simulator]);

  const saveEnhancedScenario = useCallback(async (metadata: ScenarioMetadata): Promise<EnhancedScenario> => {
    const requests = requestHistory.map(h => h.request);
    const responses = requestHistory.map(h => h.response);

    const enhancedScenario = scenarioManager.createEnhancedScenario(
      requests,
      responses,
      metadata
    );

    await scenarioManager.saveScenario(enhancedScenario);

    // Reload scenarios list
    const updatedScenarios = await scenarioManager.listScenarios();
    setScenarios(updatedScenarios);

    return enhancedScenario;
  }, [requestHistory]);

  const startReplay = useCallback((scenario: EnhancedScenario) => {
    // Clear existing history and reset
    setRequestHistory([]);
    resetSimulator();

    // Set up replay state
    currentReplayScenario.current = scenario;
    setReplayState({
      isReplaying: true,
      currentStep: 0,
      totalSteps: scenario.requests.length,
      speed: 1,
      isPaused: false,
      scenarioId: scenario.id,
    });

    // Start replay
    executeReplayStep(scenario, 0, 1, false);
  }, [resetSimulator, executeReplayStep]);

  const loadScenarioById = useCallback(async (id: string): Promise<void> => {
    const scenario = await scenarioManager.getScenarioById(id);
    if (scenario) {
      startReplay(scenario);
    }
  }, [startReplay]);

  const deleteScenario = useCallback(async (id: string): Promise<void> => {
    await scenarioManager.deleteScenario(id);
    const updatedScenarios = await scenarioManager.listScenarios();
    setScenarios(updatedScenarios);
  }, []);

  const pauseReplay = useCallback(() => {
    if (replayTimerRef.current) {
      clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setReplayState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeReplay = useCallback(() => {
    if (currentReplayScenario.current && replayState.isPaused) {
      setReplayState(prev => ({
        ...prev,
        isPaused: false,
      }));

      // Continue from current step
      executeReplayStep(
        currentReplayScenario.current,
        replayState.currentStep,
        replayState.speed,
        false
      );
    }
  }, [replayState, executeReplayStep]);

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current) {
      clearTimeout(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    currentReplayScenario.current = null;
    setReplayState({
      isReplaying: false,
      currentStep: 0,
      totalSteps: 0,
      speed: 1,
      isPaused: false,
    });
  }, []);

  const setReplaySpeed = useCallback((speed: number) => {
    setReplayState(prev => ({
      ...prev,
      speed,
    }));
  }, []);

  const stepForward = useCallback(async () => {
    if (currentReplayScenario.current && replayState.currentStep < replayState.totalSteps) {
      const scenario = currentReplayScenario.current;
      const request = scenario.requests[replayState.currentStep];

      const response = await simulator.processRequest(request);
      setRequestHistory(prev => [...prev, { request, response }]);
      setProtocolState(simulator.getState());

      setReplayState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  }, [simulator, replayState]);

  const stepBackward = useCallback(() => {
    if (replayState.currentStep > 0) {
      // Remove last request from history
      setRequestHistory(prev => prev.slice(0, -1));

      setReplayState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [replayState]);

  // Learning progress methods
  const recordNRCEncounter = useCallback((nrc: NegativeResponseCode) => {
    setLearningProgress(prev => {
      const updated = {
        ...prev,
        encounteredNRCs: new Set(prev.encounteredNRCs).add(nrc),
        totalErrors: prev.totalErrors + 1,
        lastUpdated: Date.now(),
      };

      // Check and award badges
      const updatedBadges = prev.badges.map(badge => {
        if (badge.earnedAt) return badge; // Already earned

        let shouldEarn = false;
        switch (badge.condition.type) {
          case 'encounter':
            shouldEarn = updated.totalErrors >= badge.condition.threshold;
            break;
          case 'variety':
            shouldEarn = updated.encounteredNRCs.size >= badge.condition.threshold;
            break;
        }

        if (shouldEarn) {
          return { ...badge, earnedAt: Date.now() };
        }
        return badge;
      });

      return { ...updated, badges: updatedBadges };
    });
  }, []);

  const recordNRCResolution = useCallback((nrc: NegativeResponseCode) => {
    setLearningProgress(prev => {
      const updated = {
        ...prev,
        resolvedNRCs: new Set(prev.resolvedNRCs).add(nrc),
        totalResolutions: prev.totalResolutions + 1,
        lastUpdated: Date.now(),
      };

      // Check and award badges
      const updatedBadges = prev.badges.map(badge => {
        if (badge.earnedAt) return badge; // Already earned

        let shouldEarn = false;
        switch (badge.condition.type) {
          case 'resolve':
            shouldEarn = updated.totalResolutions >= badge.condition.threshold;
            break;
        }

        if (shouldEarn) {
          return { ...badge, earnedAt: Date.now() };
        }
        return badge;
      });

      return { ...updated, badges: updatedBadges };
    });
  }, []);

  // Auto-track NRC encounters from responses
  React.useEffect(() => {
    if (requestHistory.length === 0) return;

    const lastItem = requestHistory[requestHistory.length - 1];
    if (lastItem.response.isNegative && lastItem.response.nrc) {
      recordNRCEncounter(lastItem.response.nrc);
    }
  }, [requestHistory, recordNRCEncounter]);

  // Tutorial System (P2-05)
  const getInitialTutorialProgress = (): TutorialProgress => {
    const saved = localStorage.getItem('uds_tutorial_progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tutorial progress:', e);
      }
    }

    // Return default
    return {
      lessons: {},
      totalLessons: 0,
      completedLessons: 0,
      inProgressLessons: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      badges: [],
      totalBadges: 0,
      earnedBadges: 0,
      serviceMastery: {} as Record<number, {
        lessonsCompleted: number;
        totalLessons: number;
        averageScore: number;
        masteryLevel: 'novice' | 'intermediate' | 'expert' | 'master';
      }>,
      preferences: {
        autoStartNextLesson: true,
        showHintsAutomatically: true,
        difficultyPreference: 'beginner' as const,
      },
    };
  };

  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress>(getInitialTutorialProgress);

  // Save tutorial progress to localStorage
  React.useEffect(() => {
    localStorage.setItem('uds_tutorial_progress', JSON.stringify(tutorialProgress));
  }, [tutorialProgress]);

  const startLesson = useCallback((lessonId: string) => {
    setTutorialProgress(prev => {
      const lessonProgress: LessonProgress = prev.lessons[lessonId] || {
        lessonId,
        status: 'not-started',
        theoryCompleted: false,
        exerciseCompleted: false,
        quizCompleted: false,
        quizAttempts: 0,
        quizBestScore: 0,
        hintsUsed: 0,
        timeSpent: 0,
        startedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      const isNew = prev.lessons[lessonId]?.status === 'not-started' || !prev.lessons[lessonId];

      return {
        ...prev,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...lessonProgress,
            status: 'in-progress',
            lastAccessedAt: Date.now(),
          },
        },
        inProgressLessons: isNew ? prev.inProgressLessons + 1 : prev.inProgressLessons,
      };
    });
  }, []);

  const completeLesson = useCallback((lessonId: string, score: number) => {
    setTutorialProgress(prev => {
      const lessonProgress = prev.lessons[lessonId];
      if (!lessonProgress) return prev;

      const wasInProgress = lessonProgress.status === 'in-progress';
      const wasNotCompleted = lessonProgress.status !== 'completed';

      return {
        ...prev,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...lessonProgress,
            status: 'completed',
            completedAt: Date.now(),
            quizBestScore: Math.max(lessonProgress.quizBestScore, score),
          },
        },
        completedLessons: wasNotCompleted ? prev.completedLessons + 1 : prev.completedLessons,
        inProgressLessons: wasInProgress ? prev.inProgressLessons - 1 : prev.inProgressLessons,
      };
    });
  }, []);

  const updateLessonProgress = useCallback((lessonId: string, updates: Partial<LessonProgress>) => {
    setTutorialProgress(prev => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [lessonId]: {
          ...(prev.lessons[lessonId] || {
            lessonId,
            status: 'not-started',
            theoryCompleted: false,
            exerciseCompleted: false,
            quizCompleted: false,
            quizAttempts: 0,
            quizBestScore: 0,
            hintsUsed: 0,
            timeSpent: 0,
            startedAt: Date.now(),
            lastAccessedAt: Date.now(),
          }),
          ...updates,
          lastAccessedAt: Date.now(),
        },
      },
      totalTimeSpent: prev.totalTimeSpent + (updates.timeSpent || 0),
    }));
  }, []);

  // Sequence methods (P2-03)
  const createSequence = useCallback((name: string, description: string): Sequence => {
    const newSequence: Sequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      steps: [],
      variables: {},
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };

    setSequences(prev => [...prev, newSequence]);

    // Save to localStorage
    const savedSequences = JSON.parse(localStorage.getItem('uds_sequences') || '[]');
    savedSequences.push(newSequence);
    localStorage.setItem('uds_sequences', JSON.stringify(savedSequences));

    return newSequence;
  }, []);

  const updateSequence = useCallback((id: string, updates: Partial<Sequence>) => {
    setSequences(prev => prev.map(seq =>
      seq.id === id
        ? { ...seq, ...updates, modifiedAt: Date.now() }
        : seq
    ));

    // Update in localStorage
    const savedSequences = JSON.parse(localStorage.getItem('uds_sequences') || '[]');
    const updatedSequences = savedSequences.map((seq: Sequence) =>
      seq.id === id ? { ...seq, ...updates, modifiedAt: Date.now() } : seq
    );
    localStorage.setItem('uds_sequences', JSON.stringify(updatedSequences));
  }, []);

  const deleteSequenceById = useCallback((id: string) => {
    setSequences(prev => prev.filter(seq => seq.id !== id));

    // Remove from localStorage
    const savedSequences = JSON.parse(localStorage.getItem('uds_sequences') || '[]');
    const filtered = savedSequences.filter((seq: Sequence) => seq.id !== id);
    localStorage.setItem('uds_sequences', JSON.stringify(filtered));
  }, []);

  const executeSequence = useCallback(async (
    sequence: Sequence,
    options?: SequenceExecutionOptions
  ): Promise<void> => {
    sequenceAbortController.current = new AbortController();

    try {
      // Clear history for fresh execution
      setRequestHistory([]);

      // Create initial execution state
      const executionState: SequenceExecutionState = {
        sequence,
        currentStep: 0,
        isRunning: true,
        isPaused: false,
        results: [],
        variables: { ...sequence.variables },
        startedAt: Date.now(),
      };

      setCurrentSequence(executionState);

      // Execute sequence using engine
      const finalState = await sequenceEngine.executeSequence(
        sequence,
        sendRequest,
        options
      );

      // Update history with results
      finalState.results.forEach(result => {
        if (result.response) {
          setRequestHistory(prev => [...prev, {
            request: result.step.request,
            response: result.response
          }]);
        }
      });

      setCurrentSequence(finalState);
    } catch (error) {
      console.error('Sequence execution error:', error);
      setCurrentSequence(prev => prev ? {
        ...prev,
        isRunning: false,
        completedAt: Date.now(),
      } : undefined);
    }
  }, [sendRequest]);

  const pauseSequence = useCallback(() => {
    setCurrentSequence(prev => prev ? {
      ...prev,
      isPaused: true,
      pausedAt: Date.now(),
    } : undefined);
  }, []);

  const resumeSequence = useCallback(() => {
    setCurrentSequence(prev => prev ? {
      ...prev,
      isPaused: false,
      pausedAt: undefined,
    } : undefined);

    // Resume execution logic would go here
    // This is a simplified implementation
  }, []);

  const stopSequence = useCallback(() => {
    sequenceAbortController.current?.abort();
    setCurrentSequence(prev => prev ? {
      ...prev,
      isRunning: false,
      isPaused: false,
      completedAt: Date.now(),
    } : undefined);
  }, []);

  const clearSequenceExecution = useCallback(() => {
    sequenceAbortController.current?.abort();
    setCurrentSequence(undefined);
  }, []);

  // Load sequences from localStorage on mount
  React.useEffect(() => {
    const loadSavedSequences = () => {
      try {
        const saved = localStorage.getItem('uds_sequences');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSequences(parsed);
        }
      } catch (error) {
        console.error('Failed to load sequences:', error);
      }
    };
    loadSavedSequences();
  }, []);

  // Load scenarios on mount
  React.useEffect(() => {
    const loadInitialScenarios = async () => {
      const loaded = await scenarioManager.listScenarios();
      setScenarios(loaded);
    };
    loadInitialScenarios();
  }, []);

  // Cleanup replay timer on unmount
  React.useEffect(() => {
    return () => {
      if (replayTimerRef.current) {
        clearTimeout(replayTimerRef.current);
      }
    };
  }, []);

  return (
    <UDSContext.Provider
      value={{
        simulator,
        protocolState,
        requestHistory,
        metrics,
        sendRequest,
        clearHistory,
        resetSimulator,
        saveScenario,
        loadScenario,
        // Enhanced scenario support
        scenarios,
        replayState,
        saveEnhancedScenario,
        loadScenarioById,
        deleteScenario,
        startReplay,
        pauseReplay,
        resumeReplay,
        stopReplay,
        setReplaySpeed,
        stepForward,
        stepBackward,
        // Learning progress support
        learningProgress,
        recordNRCEncounter,
        recordNRCResolution,
        // Tutorial System (P2-05)
        tutorialProgress,
        startLesson,
        completeLesson,
        updateLessonProgress,
        // Sequence support (P2-03)
        sequences,
        currentSequence,
        createSequence,
        updateSequence,
        deleteSequenceById,
        executeSequence,
        pauseSequence,
        resumeSequence,
        stopSequence,
        clearSequenceExecution,
        // Power Management
        voltage,
        current,
        ecuPower,
        toggleEcuPower,
      }}
    >
      {children}
    </UDSContext.Provider>
  );
};

export const useUDS = (): UDSContextType => {
  const context = useContext(UDSContext);
  if (!context) {
    throw new Error('useUDS must be used within a UDSProvider');
  }
  return context;
};
