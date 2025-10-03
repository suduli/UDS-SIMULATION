// Simulator state management
export interface SimulatorState {
  activeTransport: 'CAN' | 'DoIP';
  ecuProfile: string;
  isRunning: boolean;
}

export class SimulatorStore {
  private state: SimulatorState = {
    activeTransport: 'CAN',
    ecuProfile: 'ecu-1',
    isRunning: false,
  };

  getState(): SimulatorState {
    return { ...this.state };
  }

  updateTransport(transport: 'CAN' | 'DoIP'): void {
    this.state.activeTransport = transport;
  }

  setRunning(running: boolean): void {
    this.state.isRunning = running;
  }
}
