/**
 * UDS Simulator Context
 * React context for managing UDS protocol state
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { UDSSimulator } from '../services/UDSSimulator';
import { mockECUConfig } from '../services/mockECU';
import type { UDSRequest, UDSResponse, ProtocolState, Scenario } from '../types/uds';

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
