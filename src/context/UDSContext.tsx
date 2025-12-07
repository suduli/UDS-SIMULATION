/**
 * UDS Simulator Context
 * React context for managing UDS protocol state
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { UDSSimulator } from '../services/UDSSimulator';
import { parseNRC } from '../utils/nrcLookup';
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

// Vehicle State Type for Cluster Integration
type GearPosition = 'P' | 'R' | 'N' | 'D' | '1' | '2' | '3';

interface VehicleState {
  gearPosition: GearPosition;
  vehicleSpeedKph: number;
  engineRpm: number;
  coolantTemperature: number;
  fuelLevel: number;
  oilPressure: number;
}

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

  // Advanced Power State
  systemVoltage: 12 | 24;
  targetVoltage: number;
  currentLimit: number;
  powerState: 'OFF' | 'ACC' | 'ON' | 'CRANKING';
  faultState: 'NONE' | 'SHORT_GND' | 'OPEN_CIRCUIT';

  // Rapid Power Shutdown (RPS) State - SID 11
  rpsEnabled: boolean;
  rpsPowerDownTime: number;      // Power-down time in 10ms units (0-255)
  rpsCountdown: number | null;   // Active countdown in ms (null if not counting down)

  // Vehicle State for Cluster Integration
  vehicleState: VehicleState;
  updateVehicleState: <K extends keyof VehicleState>(key: K, value: VehicleState[K]) => void;

  toggleEcuPower: () => void; // Toggles between OFF and ON (keeping previous ACC state logic if needed, or simplifying)
  setPowerState: (state: 'OFF' | 'ACC' | 'ON' | 'CRANKING') => void;
  setSystemVoltage: (volts: 12 | 24) => void;
  setTargetVoltage: (volts: number) => void;
  setCurrentLimit: (amps: number) => void;
  setFaultState: (fault: 'NONE' | 'SHORT_GND' | 'OPEN_CIRCUIT') => void;
  simulateCranking: () => void;
  setVoltage: (volts: number) => void; // Keep for backward compatibility or manual override
  setCurrent: (amps: number) => void; // Keep for backward compatibility
  triggerRpsPowerDown: () => void;    // Manually trigger RPS power-down countdown
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
  const [systemVoltage, setSystemVoltage] = useState<12 | 24>(12);
  const [targetVoltage, setTargetVoltage] = useState(12.0); // Default to 12V
  const [currentLimit, setCurrentLimit] = useState(5.0);
  const [powerState, setPowerState] = useState<'OFF' | 'ACC' | 'ON' | 'CRANKING'>('ON');
  const [faultState, setFaultState] = useState<'NONE' | 'SHORT_GND' | 'OPEN_CIRCUIT'>('NONE');

  // Legacy state support (derived or synced)
  const [voltage, setVoltage] = useState(12.4);
  const [current, setCurrent] = useState(0.5);
  const [ecuPower, setEcuPower] = useState(true);

  // Rapid Power Shutdown (RPS) State - SID 11
  const [rpsEnabled] = useState(false);  const [rpsPowerDownTime, setRpsPowerDownTime] = useState(0); // in 10ms units
  const [rpsPowerDownTime] = useState<number | null>(null);  const rpsTimerRef = useRef<number | null>(null);

  // Vehicle State for Cluster Integration
  const [vehicleState, setVehicleStateInternal] = useState<VehicleState>({
    gearPosition: 'P',
    vehicleSpeedKph: 0,
    engineRpm: 0,
    coolantTemperature: 88,
    fuelLevel: 72,
    oilPressure: 45
  });

  const updateVehicleState = useCallback(<K extends keyof VehicleState>(
    key: K,
    value: VehicleState[K]
  ) => {
    setVehicleStateInternal(prev => ({ ...prev, [key]: value }));
  }, []);

  // Sync legacy ecuPower with powerState
  React.useEffect(() => {
    setEcuPower(powerState !== 'OFF');
  }, [powerState]);

  // Simulate power physics
  React.useEffect(() => {
    const interval = setInterval(() => {
      // 1. Handle Faults
      if (faultState === 'SHORT_GND') {
        setVoltage(0);
        setCurrent(Math.random() * 5 + 15); // Spike > 15A
        return;
      }
      if (faultState === 'OPEN_CIRCUIT') {
        setVoltage(targetVoltage); // Voltage might still be present at terminals, but no current
        setCurrent(0);
        return;
      }

      // 2. Handle Power States
      if (powerState === 'OFF') {
        setVoltage(0);
        setCurrent(0);
        return;
      }

      // Base voltage depends on state and target
      let baseVoltage = targetVoltage;

      if (powerState === 'CRANKING') {
        // Cranking logic handled by animation/timeout, but here we ensure it doesn't stay static if manual set fails
        // This block might be overridden by the simulateCranking animation loop
      }

      // Calculate Load Current based on state
      let baseCurrent = 0;
      if (powerState === 'ACC') {
        baseCurrent = 0.2; // 200mA
      } else if (powerState === 'ON') {
        baseCurrent = 0.5; // 500mA idle
      } else if (powerState === 'CRANKING') {
        baseCurrent = 8.0; // High draw during crank
      }

      // Apply fluctuations
      // Voltage fluctuation (alternator ripple if ON)
      const vRipple = powerState === 'ON' ? (Math.random() - 0.5) * 0.2 : 0.05;
      let newVoltage = baseVoltage + vRipple;

      // Current fluctuation
      const iRipple = (Math.random() - 0.5) * 0.05;
      let newCurrent = baseCurrent + iRipple;

      // 3. Apply Limits
      // Clamp Voltage
      newVoltage = Math.max(0, Math.min(36, newVoltage));

      // Current Limiting (CC Mode simulation)
      if (newCurrent > currentLimit) {
        newCurrent = currentLimit;
        // In a real bench supply, voltage would drop in CC mode. 
        // V = I * R. If I is capped, V must drop. 
        // Let's simulate a simple voltage drop proportional to the limit hit
        newVoltage = newVoltage * (currentLimit / (baseCurrent + 0.001));
      }

      setVoltage(newVoltage);
      setCurrent(newCurrent);

    }, 100); // 10Hz update for smoothness

    return () => clearInterval(interval);
  }, [powerState, faultState, targetVoltage, currentLimit, systemVoltage]);

  const toggleEcuPower = useCallback(() => {
    setPowerState(prev => prev === 'OFF' ? 'ON' : 'OFF');
  }, []);

  const simulateCranking = useCallback(async () => {
    if (powerState === 'OFF') return;

    const originalState = powerState;
    setPowerState('CRANKING');

    // Animation loop for cranking profile
    const startTime = Date.now();
    const duration = 1500; // 1.5s crank

    const crankInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(crankInterval);
        setPowerState(originalState); // Return to previous state (usually ON)
        return;
      }

      // Cranking Profile: Drop to 6V, then ramp up
      // 0-300ms: Drop
      // 300-1000ms: Hold low/fluctuate
      // 1000-1500ms: Ramp up

      let crankVolts = 12.0;
      if (elapsed < 300) {
        crankVolts = 12.0 - (elapsed / 300) * 6.0; // Drop to 6V
      } else if (elapsed < 1000) {
        crankVolts = 6.0 + (Math.random() * 1.0); // Rattle around 6-7V
      } else {
        const progress = (elapsed - 1000) / 500;
        crankVolts = 7.0 + progress * (targetVoltage - 7.0); // Ramp back
      }

      setVoltage(crankVolts);
      // Current spikes during crank
      setCurrent(8.0 + (Math.random() * 2.0));

    }, 50);

  }, [powerState, targetVoltage]);

  /**
   * Simulate voltage profile during ECU Reset operations
   * - Hard Reset: Brief voltage dip (~8V for 200ms, then recovery)
   * - Key Off-On: Simulates power cycle via voltage drop (without changing powerState to avoid triggering RPS)
   */
  const simulateResetVoltageProfile = useCallback((type: 'hard' | 'keyOffOn') => {
    if (type === 'hard') {
      // Hard Reset: Brief voltage dip to simulate reset current draw
      setVoltage(8.0);
      setCurrent(3.0); // Spike current during reset

      setTimeout(() => {
        setVoltage(targetVoltage);
        setCurrent(0.5); // Return to idle
      }, 200);
    } else if (type === 'keyOffOn') {
      // Key Off-On Reset: Simulate power cycle via voltage/current only
      // We don't change powerState to avoid triggering RPS logic during reset
      setVoltage(0);
      setCurrent(0);

      setTimeout(() => {
        setVoltage(targetVoltage);
        setCurrent(0.5);
      }, 500);
    }
  }, [targetVoltage]);

  /**
   * Trigger RPS (Rapid Power Shutdown) countdown when ignition turns OFF
   * Uses the stored rpsPowerDownTime (in 10ms units) for graceful shutdown
   */
  const triggerRpsPowerDown = useCallback(() => {
    if (!rpsEnabled || rpsPowerDownTime === 0) {
      // RPS not enabled or immediate shutdown
      setRpsCountdown(null);
      return;
    }

    const totalMs = rpsPowerDownTime * 10; // Convert 10ms units to ms
    setRpsCountdown(totalMs);

    // Clear any existing timer
    if (rpsTimerRef.current) {
      clearInterval(rpsTimerRef.current);
    }

    // Start countdown animation
    const startTime = Date.now();
    rpsTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalMs - elapsed);

      if (remaining <= 0) {
        // Countdown complete - graceful shutdown
        clearInterval(rpsTimerRef.current!);
        rpsTimerRef.current = null;
        setRpsCountdown(null);

        // Perform graceful ECU shutdown
        simulator.reset();
        setProtocolState(simulator.getState());

        emitToast({
          type: 'info',
          message: 'RPS Power-Down Complete',
          description: `ECU gracefully shut down after ${totalMs}ms`,
          duration: 4000,
        });
      } else {
        setRpsCountdown(remaining);
      }
    }, 50); // Update every 50ms for smooth countdown
  }, [rpsEnabled, rpsPowerDownTime, simulator, emitToast]);

  // RPS behavior: Trigger power-down countdown when power switches to OFF
  // DISABLED: This was causing UI crashes. RPS state is tracked but not auto-triggered.
  // The user can manually observe RPS state in the Power Supply Dashboard.
  // TODO: Re-enable with proper state management once the root cause is identified.
  // React.useEffect(() => {
  //   if (powerState === 'OFF' && rpsEnabled && !rpsTimerRef.current) {
  //     triggerRpsPowerDown();
  //   } else if (powerState !== 'OFF' && rpsTimerRef.current) {
  //     clearInterval(rpsTimerRef.current);
  //     rpsTimerRef.current = null;
  //     setRpsCountdown(null);
  //   }
  // }, [powerState, rpsEnabled, triggerRpsPowerDown]);

  // Session timeout enforcement (S3 timer)
  // Per ISO 14229, if no diagnostic request is received within S3 timeout,
  // the ECU reverts to Default session and locks security
  React.useEffect(() => {
    if (!ecuPower) return; // No timeout check when ECU is off

    const checkTimeout = () => {
      const currentState = simulator.getState();

      // Only enforce timeout in non-default sessions
      if (currentState.currentSession === 1) return; // DiagnosticSessionType.DEFAULT = 1

      const elapsed = Date.now() - currentState.lastActivityTime;
      const timeout = currentState.sessionTimeout;

      if (elapsed >= timeout) {
        // Session timed out - reset to default
        console.log('[S3 Timeout] Session timed out, reverting to Default');
        simulator.reset();
        setProtocolState(simulator.getState());

        // Emit toast notification
        emitToast({
          type: 'warning',
          message: 'Session Timeout (S3)',
          description: 'Reverted to Default session due to inactivity',
          duration: 5000,
        });
      }
    };

    // Check every 1 second
    const interval = setInterval(checkTimeout, 1000);

    return () => clearInterval(interval);
  }, [ecuPower, simulator, emitToast]);

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
    // Check for ECU Power
    if (!ecuPower) {
      // Simulate timeout delay (client waiting for response that never comes)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const error = new Error('Request timed out - ECU is powered off');
      emitToast({
        type: 'error',
        message: 'Request Timed Out',
        description: 'No response received from ECU (Ignition OFF)',
        duration: 5000,
      });
      throw error;
    }

    try {
      // Process request through simulator
      // Pass ignition state (ON or CRANKING considered ON for UDS)
      // Pass voltage parameters for power condition validation (SID 11)
      const ignitionOn = powerState === 'ON' || powerState === 'CRANKING';
      const response = await simulator.processRequest(request, ignitionOn, voltage, systemVoltage);

      setRequestHistory(prev => [...prev, { request, response }]);
      setProtocolState(simulator.getState());

      // Note: SID 11 (ECU Reset) power effects handling has been disabled
      // due to causing UI crashes. The core reset functionality still works.

      if (response.isNegative) {
        // Check for Response Pending (0x78)
        if (response.data.length >= 3 && response.data[2] === 0x78) { // 0x78 is Response Pending
          // NRC 0x78: Do NOT show error toast.
          // Ideally restart P2 timer here, but for now just suppress error.
          console.log('NRC 0x78: Response Pending - Waiting...');
        } else {
          const nrc = parseNRC(response.data);
          if (nrc) {
            emitToast({
              type: nrc.definition.severity,
              message: `${nrc.definition.name} (0x${nrc.nrcCode.toString(16).toUpperCase().padStart(2, '0')})`,
              description: nrc.definition.description,
              duration: 7000,
            });
          } else {
            // Fallback if parseNRC fails
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
          }
        }
      } else if (request.sid !== 0x11) {
        // Success Toast (Optional, but skip for ECU Reset as we have specific toasts above)
        if (request.sid === 0x27 && request.subFunction && request.subFunction % 2 === 0) {
          emitToast({
            type: 'success',
            message: 'Security Access Granted',
            description: 'ECU Unlocked',
            duration: 4500,
          });
        } else {
          emitToast({
            type: 'success',
            message: `Response for service ${formatHexByte(request.sid)}`,
            description: `Received ${response.data.length} byte${response.data.length === 1 ? '' : 's'} from ECU.`,
            duration: 4500,
          });
        }
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
  }, [simulator, emitToast, ecuPower, powerState, voltage, systemVoltage]);

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
    // For replay, we assume ignition is ON or we capture state? 
    // For simplicity, let's assume replay forces ignition ON or uses current state.
    // Using current state is safer.
    // const ignitionOn = true; // Unused 
    // Actually, if we replay a "Conditions Not Correct" scenario, we might want to respect that.
    // But `processRequest` generates a NEW response.
    // If we are replaying, we might just be visualizing history?
    // Wait, `executeReplayStep` calls `simulator.processRequest`. This generates a NEW response.
    // If we want to reproduce the original scenario, we should probably set the simulator state to match.
    // For now, let's pass `true` to allow the request to proceed, or `this.ecuPower`?
    // Let's use `true` to ensure replay doesn't fail due to ignition being OFF in the simulator unless intended.
    const response = await simulator.processRequest(request, true);
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

      const response = await simulator.processRequest(request, true);
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
        setVoltage,
        setCurrent,

        // Advanced Power State
        systemVoltage,
        targetVoltage,
        currentLimit,
        powerState,
        faultState,
        setPowerState,
        setSystemVoltage,
        setTargetVoltage,
        setCurrentLimit,
        setFaultState,
        simulateCranking,

        // Rapid Power Shutdown (RPS) State - SID 11
        rpsEnabled,
        rpsPowerDownTime,
        rpsCountdown,
        triggerRpsPowerDown,

        // Vehicle State for Cluster Integration
        vehicleState,
        updateVehicleState,
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
