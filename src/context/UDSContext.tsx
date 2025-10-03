/**
 * UDS Simulator Context
 * React context for managing UDS protocol state
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { UDSSimulator } from '../services/UDSSimulator';
import { mockECUConfig } from '../services/mockECU';
import type { UDSRequest, UDSResponse, ProtocolState, Scenario } from '../types/uds';

interface UDSContextType {
  simulator: UDSSimulator;
  protocolState: ProtocolState;
  requestHistory: Array<{ request: UDSRequest; response: UDSResponse }>;
  sendRequest: (request: UDSRequest) => Promise<UDSResponse>;
  clearHistory: () => void;
  resetSimulator: () => void;
  saveScenario: (name: string, description: string) => Scenario;
  loadScenario: (scenario: Scenario) => void;
}

const UDSContext = createContext<UDSContextType | undefined>(undefined);

export const UDSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulator] = useState(() => new UDSSimulator(mockECUConfig));
  const [protocolState, setProtocolState] = useState<ProtocolState>(simulator.getState());
  const [requestHistory, setRequestHistory] = useState<Array<{ request: UDSRequest; response: UDSResponse }>>([]);

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

  const loadScenario = useCallback((_scenario: Scenario) => {
    resetSimulator();
    // Could replay requests here if needed
  }, [resetSimulator]);

  return (
    <UDSContext.Provider
      value={{
        simulator,
        protocolState,
        requestHistory,
        sendRequest,
        clearHistory,
        resetSimulator,
        saveScenario,
        loadScenario,
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
