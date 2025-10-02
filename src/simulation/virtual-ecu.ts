/**
 * Virtual ECU Simulator - Simulates an ECU responding to UDS requests
 */

import { ServiceId, NegativeResponseCode, POSITIVE_RESPONSE_OFFSET } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ECUConfiguration, ServiceHandler } from '../core/types';

export class VirtualECU {
  private config: ECUConfiguration;
  private state: DiagnosticSessionState;
  private serviceHandlers: Map<ServiceId, ServiceHandler> = new Map();

  constructor(config: ECUConfiguration) {
    this.config = config;
    this.state = {
      currentSession: 0x01, // Default session
      securityLevel: 0,
      isSecurityUnlocked: false,
      sessionStartTime: Date.now(),
    };
  }

  registerService(handler: ServiceHandler): void {
    this.serviceHandlers.set(handler.serviceId, handler);
  }

  async handleRequest(request: UDSRequest): Promise<UDSResponse> {
    // Check if service is supported
    if (!this.config.supportedServices.includes(request.serviceId)) {
      return this.createNegativeResponse(
        request.serviceId,
        NegativeResponseCode.SERVICE_NOT_SUPPORTED
      );
    }

    // Get service handler
    const handler = this.serviceHandlers.get(request.serviceId);
    if (!handler) {
      return this.createNegativeResponse(
        request.serviceId,
        NegativeResponseCode.SERVICE_NOT_SUPPORTED
      );
    }

    try {
      const response = await handler.handle(request, this.state);
      
      // Don't send positive response if suppressed
      if (request.suppressPositiveResponse && response.isPositive) {
        return {
          serviceId: request.serviceId,
          isPositive: true,
          data: new Uint8Array(0),
        };
      }
      
      return response;
    } catch (error) {
      console.error('Service handler error:', error);
      return this.createNegativeResponse(
        request.serviceId,
        NegativeResponseCode.GENERAL_REJECT
      );
    }
  }

  private createNegativeResponse(serviceId: ServiceId, nrc: NegativeResponseCode): UDSResponse {
    return {
      serviceId,
      isPositive: false,
      data: new Uint8Array(0),
      nrc,
    };
  }

  createPositiveResponse(serviceId: ServiceId, data: Uint8Array = new Uint8Array(0)): UDSResponse {
    return {
      serviceId,
      isPositive: true,
      data,
    };
  }

  getState(): DiagnosticSessionState {
    return { ...this.state };
  }

  updateState(updates: Partial<DiagnosticSessionState>): void {
    this.state = { ...this.state, ...updates };
  }

  getConfig(): ECUConfiguration {
    return this.config;
  }

  reset(): void {
    this.state = {
      currentSession: 0x01,
      securityLevel: 0,
      isSecurityUnlocked: false,
      sessionStartTime: Date.now(),
    };
  }

  // Helper to convert response to byte array
  responseToBytes(response: UDSResponse): Uint8Array {
    if (!response.isPositive) {
      // Negative response format: 0x7F [Service ID] [NRC]
      return new Uint8Array([0x7F, response.serviceId, response.nrc || 0]);
    }

    // Positive response format: [Service ID + 0x40] [Data]
    const bytes = new Uint8Array(1 + response.data.length);
    bytes[0] = response.serviceId + POSITIVE_RESPONSE_OFFSET;
    bytes.set(response.data, 1);
    return bytes;
  }
}
