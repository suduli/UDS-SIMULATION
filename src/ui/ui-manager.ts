/**
 * UI Manager
 * Manages the interactive user interface for the UDS Protocol Simulator
 */

import { UDSProtocol, UDSRequest, UDSResponse } from '../core/uds-protocol';
import { VirtualECU } from '../simulation/virtual-ecu';
import { UDSConstants, UDSServiceInfo } from '../core/constants';
import { DragDropBuilder } from './components/drag-drop-builder';
import { ServicePalette } from './components/service-palette';
import { ResponseViewer } from './components/response-viewer';

export interface UIManagerConfig {
  udsProtocol: UDSProtocol;
  virtualECU: VirtualECU;
}

export class UIManager {
  private config: UIManagerConfig;
  private dragDropBuilder: DragDropBuilder;
  private servicePalette: ServicePalette;
  private responseViewer: ResponseViewer;
  private currentProtocol: 'CAN' | 'DoIP' = 'CAN';

  // DOM elements
  private elements: {
    sendMessageBtn: HTMLButtonElement;
    clearCanvasBtn: HTMLButtonElement;
    connectionStatus: HTMLElement;
    ecuStatus: HTMLElement;
    sessionStatus: HTMLElement;
    messageCount: HTMLElement;
    errorCount: HTMLElement;
    timingInfo: HTMLElement;
    settingsBtn: HTMLButtonElement;
    settingsModal: HTMLElement;
    closeSettingsBtn: HTMLButtonElement;
    saveSettingsBtn: HTMLButtonElement;
    cancelSettingsBtn: HTMLButtonElement;
  };

  constructor(config: UIManagerConfig) {
    this.config = config;
    this.elements = {} as any;
    
    // Initialize components
    this.dragDropBuilder = new DragDropBuilder();
    this.servicePalette = new ServicePalette();
    this.responseViewer = new ResponseViewer();
  }

  public async initialize(): Promise<void> {
    console.log('🎨 Initializing UI Manager...');

    // Get DOM elements
    this.initializeElements();

    // Initialize components
    await this.dragDropBuilder.initialize();
    await this.servicePalette.initialize();
    await this.responseViewer.initialize();

    // Setup event listeners
    this.setupEventListeners();

    // Setup UDS protocol event handlers
    this.setupProtocolHandlers();

    // Initialize UI state
    this.updateUIState();

    // Populate service palette
    this.populateServicePalette();

    console.log('✅ UI Manager initialized');
  }

  private initializeElements(): void {
    this.elements.sendMessageBtn = this.getElement<HTMLButtonElement>('send-message');
    this.elements.clearCanvasBtn = this.getElement<HTMLButtonElement>('clear-canvas');
    this.elements.connectionStatus = this.getElement('connection-status');
    this.elements.ecuStatus = this.getElement('ecu-status');
    this.elements.sessionStatus = this.getElement('session-status');
    this.elements.messageCount = this.getElement('message-count');
    this.elements.errorCount = this.getElement('error-count');
    this.elements.timingInfo = this.getElement('timing-info');
    this.elements.settingsBtn = this.getElement<HTMLButtonElement>('settings-btn');
    this.elements.settingsModal = this.getElement('settings-modal');
    this.elements.closeSettingsBtn = this.getElement<HTMLButtonElement>('close-settings');
    this.elements.saveSettingsBtn = this.getElement<HTMLButtonElement>('save-settings');
    this.elements.cancelSettingsBtn = this.getElement<HTMLButtonElement>('cancel-settings');
  }

  private getElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T;
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }

  private setupEventListeners(): void {
    // Send message button
    this.elements.sendMessageBtn.addEventListener('click', () => {
      this.sendCurrentMessage();
    });

    // Clear canvas button
    this.elements.clearCanvasBtn.addEventListener('click', () => {
      this.dragDropBuilder.clearCanvas();
      this.elements.sendMessageBtn.disabled = true;
    });

    // Settings modal
    this.elements.settingsBtn.addEventListener('click', () => {
      this.showSettingsModal();
    });

    this.elements.closeSettingsBtn.addEventListener('click', () => {
      this.hideSettingsModal();
    });

    this.elements.cancelSettingsBtn.addEventListener('click', () => {
      this.hideSettingsModal();
    });

    this.elements.saveSettingsBtn.addEventListener('click', () => {
      this.saveSettings();
    });

    // Drag and drop events
    this.dragDropBuilder.onMessageBuilt = (canSend: boolean) => {
      this.elements.sendMessageBtn.disabled = !canSend;
    };

    // Service search
    const serviceSearch = document.getElementById('service-search') as HTMLInputElement;
    if (serviceSearch) {
      serviceSearch.addEventListener('input', (e) => {
        const searchTerm = (e.target as HTMLInputElement).value;
        this.servicePalette.filterServices(searchTerm);
      });
    }

    // Response viewer controls
    const clearTraceBtn = document.getElementById('clear-trace');
    const exportTraceBtn = document.getElementById('export-trace');

    clearTraceBtn?.addEventListener('click', () => {
      this.responseViewer.clearTrace();
    });

    exportTraceBtn?.addEventListener('click', () => {
      this.responseViewer.exportTrace();
    });
  }

  private setupProtocolHandlers(): void {
    this.config.udsProtocol.onMessageSentHandler((request: UDSRequest, response: UDSResponse) => {
      this.handleMessageResponse(request, response);
    });

    this.config.udsProtocol.onErrorHandler((error: string) => {
      this.handleProtocolError(error);
    });
  }

  private populateServicePalette(): void {
    const services = [
      {
        service: UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL,
        info: UDSServiceInfo[UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL]
      },
      {
        service: UDSConstants.SERVICES.ECU_RESET,
        info: UDSServiceInfo[UDSConstants.SERVICES.ECU_RESET]
      },
      {
        service: UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER,
        info: UDSServiceInfo[UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER]
      },
      {
        service: UDSConstants.SERVICES.READ_DTC_INFORMATION,
        info: UDSServiceInfo[UDSConstants.SERVICES.READ_DTC_INFORMATION]
      },
      {
        service: UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION,
        info: UDSServiceInfo[UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION]
      },
      {
        service: UDSConstants.SERVICES.SECURITY_ACCESS,
        info: UDSServiceInfo[UDSConstants.SERVICES.SECURITY_ACCESS]
      },
      {
        service: UDSConstants.SERVICES.COMMUNICATION_CONTROL,
        info: UDSServiceInfo[UDSConstants.SERVICES.COMMUNICATION_CONTROL]
      },
      {
        service: UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER,
        info: UDSServiceInfo[UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER]
      },
      {
        service: UDSConstants.SERVICES.ROUTINE_CONTROL,
        info: UDSServiceInfo[UDSConstants.SERVICES.ROUTINE_CONTROL]
      },
      {
        service: UDSConstants.SERVICES.TESTER_PRESENT,
        info: UDSServiceInfo[UDSConstants.SERVICES.TESTER_PRESENT]
      }
    ];

    this.servicePalette.populateServices(services);
  }

  private async sendCurrentMessage(): Promise<void> {
    try {
      const request = this.dragDropBuilder.buildRequest();
      if (!request) {
        this.showNotification('No message to send', 'warning');
        return;
      }

      this.elements.sendMessageBtn.disabled = true;
      this.elements.sendMessageBtn.textContent = 'Sending...';

      const response = await this.config.udsProtocol.sendMessage(request);
      
      // Response is handled by the protocol handler
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.showNotification('Failed to send message', 'error');
    } finally {
      this.elements.sendMessageBtn.disabled = false;
      this.elements.sendMessageBtn.textContent = 'Send Message';
    }
  }

  private handleMessageResponse(request: UDSRequest, response: UDSResponse): void {
    // Add to response viewer
    this.responseViewer.addMessage(request, response);

    // Update UI state
    this.updateUIState();

    // Update timing info
    this.elements.timingInfo.textContent = `Timing: ${response.duration.toFixed(1)} ms`;

    // Show notification for negative responses
    if (!response.success) {
      this.showNotification(`Negative response: ${response.error}`, 'error');
    }
  }

  private handleProtocolError(error: string): void {
    this.responseViewer.addError(error);
    this.showNotification(`Protocol error: ${error}`, 'error');
    this.updateUIState();
  }

  private updateUIState(): void {
    // Update message and error counts
    this.elements.messageCount.textContent = `Messages: ${this.config.udsProtocol.getMessageCount()}`;
    this.elements.errorCount.textContent = `Errors: ${this.config.udsProtocol.getErrorCount()}`;

    // Update session status
    const sessionName = this.getSessionName(this.config.udsProtocol.getCurrentSession());
    this.elements.sessionStatus.textContent = `Session: ${sessionName}`;

    // Update ECU status
    const ecuConfig = this.config.virtualECU.getConfig();
    this.elements.ecuStatus.textContent = `Virtual ECU: Ready (0x${ecuConfig.ecuAddress.toString(16).toUpperCase()})`;

    // Update connection status indicator
    this.elements.connectionStatus.className = 'status-indicator';
    this.elements.connectionStatus.style.background = '#00ff88';
    this.elements.connectionStatus.style.boxShadow = '0 0 10px #00ff88';
  }

  private getSessionName(sessionType: number): string {
    const sessionMap: { [key: number]: string } = {
      [UDSConstants.SESSION_TYPES.DEFAULT_SESSION]: 'Default',
      [UDSConstants.SESSION_TYPES.PROGRAMMING_SESSION]: 'Programming',
      [UDSConstants.SESSION_TYPES.EXTENDED_DIAGNOSTIC_SESSION]: 'Extended',
      [UDSConstants.SESSION_TYPES.SAFETY_SYSTEM_DIAGNOSTIC_SESSION]: 'Safety'
    };
    return sessionMap[sessionType] || 'Unknown';
  }

  private showSettingsModal(): void {
    this.elements.settingsModal.classList.remove('hidden');
    this.loadCurrentSettings();
  }

  private hideSettingsModal(): void {
    this.elements.settingsModal.classList.add('hidden');
  }

  private loadCurrentSettings(): void {
    const ecuConfig = this.config.virtualECU.getConfig();
    
    const ecuAddressInput = document.getElementById('ecu-address') as HTMLInputElement;
    const responseAddressInput = document.getElementById('response-address') as HTMLInputElement;
    const p2TimeoutInput = document.getElementById('p2-timeout') as HTMLInputElement;
    const p2StarTimeoutInput = document.getElementById('p2-star-timeout') as HTMLInputElement;

    if (ecuAddressInput) ecuAddressInput.value = `0x${ecuConfig.ecuAddress.toString(16).toUpperCase()}`;
    if (responseAddressInput) responseAddressInput.value = `0x${ecuConfig.responseAddress.toString(16).toUpperCase()}`;
    if (p2TimeoutInput) p2TimeoutInput.value = UDSConstants.TIMING.P2_CLIENT_MAX.toString();
    if (p2StarTimeoutInput) p2StarTimeoutInput.value = UDSConstants.TIMING.P2_STAR_CLIENT_MAX.toString();
  }

  private saveSettings(): void {
    try {
      // Get form values
      const ecuAddressInput = document.getElementById('ecu-address') as HTMLInputElement;
      const responseAddressInput = document.getElementById('response-address') as HTMLInputElement;
      const p2TimeoutInput = document.getElementById('p2-timeout') as HTMLInputElement;
      const p2StarTimeoutInput = document.getElementById('p2-star-timeout') as HTMLInputElement;

      // Validate and apply settings
      if (ecuAddressInput && responseAddressInput) {
        const ecuAddress = parseInt(ecuAddressInput.value.replace(/^0x/i, ''), 16);
        const responseAddress = parseInt(responseAddressInput.value.replace(/^0x/i, ''), 16);

        if (isNaN(ecuAddress) || isNaN(responseAddress)) {
          throw new Error('Invalid address format');
        }

        // Update configuration (in a real implementation, this would update the ECU config)
        console.log('Settings updated:', { ecuAddress, responseAddress });
      }

      this.hideSettingsModal();
      this.showNotification('Settings saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: '#ffffff',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideIn 0.3s ease'
    });

    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
        break;
      case 'warning':
        notification.style.background = 'linear-gradient(135deg, #ff9500, #e67e00)';
        break;
      case 'error':
        notification.style.background = 'linear-gradient(135deg, #ff4757, #ff3742)';
        break;
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  public updateProtocol(protocol: 'CAN' | 'DoIP'): void {
    this.currentProtocol = protocol;
    console.log(`🔄 UI updated for ${protocol} protocol`);
    
    // Update UI elements that depend on protocol
    this.updateUIState();
  }

  public cleanup(): void {
    this.dragDropBuilder.cleanup();
    this.servicePalette.cleanup();
    this.responseViewer.cleanup();
    console.log('🧹 UI Manager cleaned up');
  }
}