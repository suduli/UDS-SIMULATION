/**
 * UDS Simulator Context
 * React context for managing UDS protocol state
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { UDSSimulator } from '../services/UDSSimulator';
import { mockECUConfig } from '../services/mockECU';
import type { UDSRequest, UDSResponse, ProtocolState, Scenario } from '../types/uds';
import type { EnhancedScenario, ReplayState, ScenarioMetadata } from '../types/scenario';
import { scenarioManager } from '../services/ScenarioManager';
import { delay } from '../utils/udsHelpers';

interface UDSMetrics {
  requestsSent: number;
  successRate: number;
  servicesUsed: number;
  activeDTCs: number;
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
    const response = await simulator.processRequest(request);
    
    setRequestHistory(prev => [...prev, { request, response }]);
    setProtocolState(simulator.getState());
    
    return response;
  }, [simulator]);

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
