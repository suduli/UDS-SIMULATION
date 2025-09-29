/**
 * UDS Protocol Simulator - Main Entry Point
 * Interactive web-based platform for testing Unified Diagnostic Services (UDS) protocol
 * according to ISO 14229-1 standard
 */

import './ui/styles/main.css';
import { UIManager } from './ui/ui-manager';
import { UDSProtocol } from './core/uds-protocol';
import { VirtualECU } from './simulation/virtual-ecu';
import { UDSConstants } from './core/constants';

// Application State
interface AppState {
  isInitialized: boolean;
  currentProtocol: 'CAN' | 'DoIP';
  virtualECU: VirtualECU | null;
  udsProtocol: UDSProtocol | null;
  uiManager: UIManager | null;
}

class UDSSimulatorApp {
  private state: AppState = {
    isInitialized: false,
    currentProtocol: 'CAN',
    virtualECU: null,
    udsProtocol: null,
    uiManager: null
  };

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      console.log('🚗 Initializing UDS Protocol Simulator...');
      
      // Initialize core components
      await this.initializeCore();
      
      // Initialize UI
      await this.initializeUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Hide loading screen and show app
      this.showApplication();
      
      this.state.isInitialized = true;
      console.log('✅ UDS Protocol Simulator initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize UDS Protocol Simulator:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  private async initializeCore(): Promise<void> {
    // Initialize Virtual ECU
    this.state.virtualECU = new VirtualECU({
      ecuAddress: 0x7E0,
      responseAddress: 0x7E8,
      protocol: this.state.currentProtocol
    });

    // Initialize UDS Protocol engine
    this.state.udsProtocol = new UDSProtocol({
      virtualECU: this.state.virtualECU,
      protocol: this.state.currentProtocol
    });

    await this.state.virtualECU.initialize();
    await this.state.udsProtocol.initialize();
  }

  private async initializeUI(): Promise<void> {
    this.state.uiManager = new UIManager({
      udsProtocol: this.state.udsProtocol!,
      virtualECU: this.state.virtualECU!
    });

    await this.state.uiManager.initialize();
  }

  private setupEventListeners(): void {
    // Protocol switcher
    const canProtocolBtn = document.getElementById('can-protocol');
    const doipProtocolBtn = document.getElementById('doip-protocol');

    canProtocolBtn?.addEventListener('click', () => {
      this.switchProtocol('CAN');
    });

    doipProtocolBtn?.addEventListener('click', () => {
      this.switchProtocol('DoIP');
    });

    // Window events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showError('An unexpected error occurred. Check the console for details.');
    });
  }

  private async switchProtocol(protocol: 'CAN' | 'DoIP'): Promise<void> {
    if (this.state.currentProtocol === protocol) return;

    try {
      console.log(`🔄 Switching to ${protocol} protocol...`);
      
      // Update UI state
      const canBtn = document.getElementById('can-protocol');
      const doipBtn = document.getElementById('doip-protocol');
      
      if (protocol === 'CAN') {
        canBtn?.classList.add('active');
        doipBtn?.classList.remove('active');
      } else {
        doipBtn?.classList.add('active');
        canBtn?.classList.remove('active');
      }

      // Reinitialize components with new protocol
      this.state.currentProtocol = protocol;
      await this.state.virtualECU?.setProtocol(protocol);
      await this.state.udsProtocol?.setProtocol(protocol);
      
      // Update UI
      this.state.uiManager?.updateProtocol(protocol);
      
      console.log(`✅ Successfully switched to ${protocol} protocol`);
      
    } catch (error) {
      console.error(`❌ Failed to switch to ${protocol} protocol:`, error);
      this.showError(`Failed to switch to ${protocol} protocol. Please try again.`);
    }
  }

  private showApplication(): void {
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');

    setTimeout(() => {
      loadingScreen?.classList.add('hidden');
      app?.classList.remove('hidden');
    }, 2000); // Keep loading screen for 2 seconds for effect
  }

  private showError(message: string): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-logo" style="color: #ff4757;">❌</div>
        <div class="loading-text">
          <strong>Error</strong><br>
          <small>${message}</small>
        </div>
        <button onclick="location.reload()" style="
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #00d4ff, #00a8cc);
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
          font-size: 1rem;
        ">Reload Application</button>
      `;
    }
  }

  private cleanup(): void {
    this.state.uiManager?.cleanup();
    this.state.virtualECU?.cleanup();
    this.state.udsProtocol?.cleanup();
  }

  // Public API for debugging and testing
  public getState(): Readonly<AppState> {
    return { ...this.state };
  }

  public async sendTestMessage(): Promise<void> {
    if (!this.state.udsProtocol) {
      throw new Error('UDS Protocol not initialized');
    }

    // Send a test diagnostic session control message
    const response = await this.state.udsProtocol.sendMessage({
      service: UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL,
      data: [0x01] // Default session
    });

    console.log('Test message response:', response);
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Expose app instance globally for debugging
  (window as any).udsApp = new UDSSimulatorApp();
});

// Export for potential module usage
export { UDSSimulatorApp };