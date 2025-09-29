/**
 * Response Viewer Component
 * Displays UDS message traces and responses
 */

import { UDSRequest, UDSResponse } from '../../core/uds-protocol';
import { UDSConstants } from '../../core/constants';

export interface TraceMessage {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error';
  service: number;
  serviceName: string;
  data: number[];
  rawData?: string;
  duration?: number;
  success?: boolean;
  error?: string;
  negativeResponseCode?: number;
}

export class ResponseViewer {
  private container: HTMLElement;
  private traceContainer: HTMLElement;
  private traces: TraceMessage[] = [];
  private maxTraces: number = 100;

  constructor() {
    this.container = null as any;
    this.traceContainer = null as any;
  }

  public async initialize(): Promise<void> {
    console.log('📊 Initializing Response Viewer...');

    this.container = this.getElement('response-viewer');
    this.traceContainer = this.getElement('trace-container');

    console.log('✅ Response Viewer initialized');
  }

  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }

  public addMessage(request: UDSRequest, response: UDSResponse): void {
    const serviceName = this.getServiceName(request.service);
    
    // Add request trace
    const requestTrace: TraceMessage = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: response.timestamp - (response.duration || 0),
      type: 'request',
      service: request.service,
      serviceName,
      data: [request.service, ...request.data],
      rawData: this.formatHexData([request.service, ...request.data])
    };

    // Add response trace
    const responseTrace: TraceMessage = {
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: response.timestamp,
      type: 'response',
      service: request.service,
      serviceName,
      data: response.data,
      rawData: this.formatHexData(response.data),
      duration: response.duration,
      success: response.success,
      error: response.error,
      negativeResponseCode: response.negativeResponseCode
    };

    this.traces.push(requestTrace, responseTrace);
    this.trimTraces();
    this.renderTraces();
    this.scrollToBottom();
  }

  public addError(error: string): void {
    const errorTrace: TraceMessage = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'error',
      service: 0,
      serviceName: 'System Error',
      data: [],
      error
    };

    this.traces.push(errorTrace);
    this.trimTraces();
    this.renderTraces();
    this.scrollToBottom();
  }

  private renderTraces(): void {
    // Clear placeholder if exists
    const placeholder = this.traceContainer.querySelector('.trace-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Create trace elements for recent traces
    const recentTraces = this.traces.slice(-20); // Show last 20 traces
    
    this.traceContainer.innerHTML = '';
    
    recentTraces.forEach(trace => {
      const traceElement = this.createTraceElement(trace);
      this.traceContainer.appendChild(traceElement);
    });

    if (this.traces.length === 0) {
      this.showPlaceholder();
    }
  }

  private createTraceElement(trace: TraceMessage): HTMLElement {
    const element = document.createElement('div');
    element.className = `trace-message ${trace.type}`;
    element.dataset.traceId = trace.id;

    const timestamp = new Date(trace.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let statusInfo = '';
    if (trace.type === 'response') {
      if (trace.success) {
        statusInfo = `<span class="status-success">✓ OK</span>`;
      } else if (trace.negativeResponseCode) {
        statusInfo = `<span class="status-error">✗ NRC 0x${trace.negativeResponseCode.toString(16).padStart(2, '0').toUpperCase()}</span>`;
      } else {
        statusInfo = `<span class="status-error">✗ ERROR</span>`;
      }
      
      if (trace.duration !== undefined) {
        statusInfo += ` <span class="timing">(${trace.duration.toFixed(1)}ms)</span>`;
      }
    }

    let content = '';
    if (trace.type === 'error') {
      content = `
        <div class="trace-header">
          <span class="trace-type">ERROR</span>
          <span class="trace-timestamp">${timestamp}</span>
        </div>
        <div class="trace-data error-message">${trace.error}</div>
      `;
    } else {
      content = `
        <div class="trace-header">
          <span class="trace-type">${trace.type.toUpperCase()}</span>
          <span class="trace-service">${trace.serviceName}</span>
          <span class="trace-timestamp">${timestamp}</span>
        </div>
        <div class="trace-data">${trace.rawData || this.formatHexData(trace.data)}</div>
        ${statusInfo ? `<div class="trace-status">${statusInfo}</div>` : ''}
        ${trace.error ? `<div class="trace-error">${trace.error}</div>` : ''}
      `;
    }

    element.innerHTML = content;

    // Add click handler for details
    element.addEventListener('click', () => {
      this.showTraceDetails(trace);
    });

    return element;
  }

  private showTraceDetails(trace: TraceMessage): void {
    // Create a detailed view popup or expand inline
    const details = this.parseTraceDetails(trace);
    
    // For now, log to console - could be enhanced with a modal
    console.log('Trace Details:', details);
    
    // Show details in a tooltip or modal
    this.showTooltip(details, trace.id);
  }

  private parseTraceDetails(trace: TraceMessage): any {
    if (trace.type === 'error') {
      return { type: 'error', message: trace.error };
    }

    const details: any = {
      type: trace.type,
      service: `0x${trace.service.toString(16).padStart(2, '0').toUpperCase()}`,
      serviceName: trace.serviceName,
      timestamp: new Date(trace.timestamp).toISOString(),
      data: trace.data,
      hexData: this.formatHexData(trace.data)
    };

    if (trace.type === 'response') {
      details.success = trace.success;
      details.duration = trace.duration;
      
      if (!trace.success) {
        details.negativeResponseCode = trace.negativeResponseCode;
        details.error = trace.error;
      } else {
        // Parse positive response details based on service
        details.parsedResponse = this.parseResponseData(trace.service, trace.data);
      }
    }

    return details;
  }

  private parseResponseData(service: number, data: number[]): any {
    if (data.length === 0) return null;

    const responseServiceId = data[0];
    const expectedResponseId = service + UDSConstants.POSITIVE_RESPONSE_OFFSET;

    if (responseServiceId !== expectedResponseId) {
      return { error: 'Unexpected response service ID' };
    }

    switch (service) {
      case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
        return {
          sessionType: data[1],
          p2ServerMax: data.length >= 4 ? (data[2] << 8) | data[3] : null,
          p2StarServerMax: data.length >= 6 ? ((data[4] << 8) | data[5]) * 10 : null
        };

      case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
        if (data.length >= 3) {
          const did = (data[1] << 8) | data[2];
          return {
            dataIdentifier: `0x${did.toString(16).padStart(4, '0').toUpperCase()}`,
            dataRecord: data.slice(3)
          };
        }
        break;

      case UDSConstants.SERVICES.SECURITY_ACCESS:
        if (data.length >= 2) {
          const subFunction = data[1];
          const result: any = { subFunction };
          
          if ((subFunction & 0x01) === 1 && data.length > 2) {
            result.securitySeed = data.slice(2);
          }
          
          return result;
        }
        break;

      case UDSConstants.SERVICES.READ_DTC_INFORMATION:
        if (data.length >= 2) {
          const subFunction = data[1];
          const result: any = { subFunction };
          
          if (subFunction === 0x01 && data.length >= 5) {
            result.statusMask = data[2];
            result.dtcFormatIdentifier = data[3];
            result.dtcCount = (data[4] << 8) | data[5];
          } else if (subFunction === 0x02) {
            result.statusMask = data[2];
            result.dtcRecords = [];
            
            for (let i = 3; i < data.length; i += 4) {
              if (i + 3 < data.length) {
                const dtc = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
                const status = data[i + 3];
                result.dtcRecords.push({
                  dtc: `0x${dtc.toString(16).padStart(6, '0').toUpperCase()}`,
                  status: `0x${status.toString(16).padStart(2, '0').toUpperCase()}`
                });
              }
            }
          }
          
          return result;
        }
        break;
    }

    return { rawResponse: data.slice(1) };
  }

  private showTooltip(details: any, traceId: string): void {
    // Remove existing tooltips
    document.querySelectorAll('.trace-tooltip').forEach(el => el.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'trace-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <h4>Trace Details</h4>
        <button class="tooltip-close">✕</button>
      </div>
      <div class="tooltip-content">
        <pre>${JSON.stringify(details, null, 2)}</pre>
      </div>
    `;

    // Position tooltip
    const traceElement = this.traceContainer.querySelector(`[data-trace-id="${traceId}"]`);
    if (traceElement) {
      const rect = traceElement.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.top = `${rect.top}px`;
      tooltip.style.left = `${rect.right + 10}px`;
      tooltip.style.zIndex = '1000';
      tooltip.style.background = 'var(--secondary-bg)';
      tooltip.style.border = '1px solid var(--glass-border)';
      tooltip.style.borderRadius = 'var(--radius-md)';
      tooltip.style.padding = 'var(--spacing-md)';
      tooltip.style.maxWidth = '400px';
      tooltip.style.maxHeight = '300px';
      tooltip.style.overflow = 'auto';
      tooltip.style.fontSize = '0.8rem';
    }

    document.body.appendChild(tooltip);

    // Close button
    tooltip.querySelector('.tooltip-close')?.addEventListener('click', () => {
      tooltip.remove();
    });

    // Auto close after 10 seconds
    setTimeout(() => {
      if (document.body.contains(tooltip)) {
        tooltip.remove();
      }
    }, 10000);
  }

  private getServiceName(service: number): string {
    const serviceNames: { [key: number]: string } = {
      [UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL]: 'Diagnostic Session Control',
      [UDSConstants.SERVICES.ECU_RESET]: 'ECU Reset',
      [UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION]: 'Clear Diagnostic Information',
      [UDSConstants.SERVICES.READ_DTC_INFORMATION]: 'Read DTC Information',
      [UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER]: 'Read Data by Identifier',
      [UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS]: 'Read Memory by Address',
      [UDSConstants.SERVICES.SECURITY_ACCESS]: 'Security Access',
      [UDSConstants.SERVICES.COMMUNICATION_CONTROL]: 'Communication Control',
      [UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER]: 'Write Data by Identifier',
      [UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS]: 'Write Memory by Address',
      [UDSConstants.SERVICES.ROUTINE_CONTROL]: 'Routine Control',
      [UDSConstants.SERVICES.TESTER_PRESENT]: 'Tester Present',
      [UDSConstants.SERVICES.CONTROL_DTC_SETTING]: 'Control DTC Setting'
    };

    return serviceNames[service] || `Unknown Service (0x${service.toString(16).padStart(2, '0').toUpperCase()})`;
  }

  private formatHexData(data: number[]): string {
    return data.map(byte => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`).join(' ');
  }

  private trimTraces(): void {
    if (this.traces.length > this.maxTraces) {
      this.traces = this.traces.slice(-this.maxTraces);
    }
  }

  private scrollToBottom(): void {
    this.traceContainer.scrollTop = this.traceContainer.scrollHeight;
  }

  private showPlaceholder(): void {
    this.traceContainer.innerHTML = `
      <div class="trace-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>Message traces will appear here</p>
      </div>
    `;
  }

  public clearTrace(): void {
    this.traces = [];
    this.showPlaceholder();
  }

  public exportTrace(): void {
    if (this.traces.length === 0) {
      alert('No trace data to export');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      traceCount: this.traces.length,
      traces: this.traces.map(trace => ({
        id: trace.id,
        timestamp: new Date(trace.timestamp).toISOString(),
        type: trace.type,
        service: `0x${trace.service.toString(16).padStart(2, '0').toUpperCase()}`,
        serviceName: trace.serviceName,
        data: trace.data,
        hexData: this.formatHexData(trace.data),
        success: trace.success,
        duration: trace.duration,
        error: trace.error,
        negativeResponseCode: trace.negativeResponseCode ? 
          `0x${trace.negativeResponseCode.toString(16).padStart(2, '0').toUpperCase()}` : undefined
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uds-trace-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public cleanup(): void {
    this.traces = [];
    console.log('🧹 Response Viewer cleaned up');
  }
}