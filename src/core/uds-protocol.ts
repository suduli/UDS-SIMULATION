/**
 * UDS Protocol Implementation
 * Core UDS protocol engine for message handling and ECU communication
 */

import { UDSConstants } from './constants';
import { UDSMessage, UDSMessageBuilder } from './message-builder';
import { UDSMessageParser } from './message-parser';
import { VirtualECU } from '../simulation/virtual-ecu';

export interface UDSProtocolConfig {
  virtualECU: VirtualECU;
  protocol: 'CAN' | 'DoIP';
  timeout?: number;
  retryCount?: number;
}

export interface UDSResponse {
  success: boolean;
  data: number[];
  timestamp: number;
  duration: number;
  service: number;
  negativeResponseCode?: number;
  error?: string;
}

export interface UDSRequest {
  service: number;
  data: number[];
  functionalAddress?: boolean;
  suppressResponse?: boolean;
}

export class UDSProtocol {
  private config: UDSProtocolConfig;
  private messageBuilder: UDSMessageBuilder;
  private messageParser: UDSMessageParser;
  private currentSession: number = UDSConstants.SESSION_TYPES.DEFAULT_SESSION;
  private securityLevel: number = 0;
  private isSecurityUnlocked: boolean = false;
  private messageCount: number = 0;
  private errorCount: number = 0;

  // Event handlers
  private onMessageSent: ((request: UDSRequest, response: UDSResponse) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor(config: UDSProtocolConfig) {
    this.config = {
      timeout: 5000,
      retryCount: 0,
      ...config
    };

    this.messageBuilder = new UDSMessageBuilder();
    this.messageParser = new UDSMessageParser();
  }

  public async initialize(): Promise<void> {
    console.log('🔧 Initializing UDS Protocol engine...');
    
    // Initialize message handlers
    await this.messageBuilder.initialize();
    await this.messageParser.initialize();
    
    // Reset to default session
    this.currentSession = UDSConstants.SESSION_TYPES.DEFAULT_SESSION;
    this.securityLevel = 0;
    this.isSecurityUnlocked = false;
    this.messageCount = 0;
    this.errorCount = 0;

    console.log('✅ UDS Protocol engine initialized');
  }

  public async setProtocol(protocol: 'CAN' | 'DoIP'): Promise<void> {
    this.config.protocol = protocol;
    console.log(`🔄 UDS Protocol switched to ${protocol}`);
  }

  public async sendMessage(request: UDSRequest): Promise<UDSResponse> {
    const startTime = performance.now();
    this.messageCount++;

    try {
      // Validate request
      this.validateRequest(request);

      // Build UDS message
      const message = await this.messageBuilder.buildMessage(request);

      // Send to virtual ECU and get response
      const rawResponse = await this.config.virtualECU.processMessage(
        message,
        this.config.protocol
      );

      // Parse response
      const response = await this.parseResponse(rawResponse, request.service, startTime);

      // Update session state if needed
      this.updateSessionState(request, response);

      // Notify listeners
      if (this.onMessageSent) {
        this.onMessageSent(request, response);
      }

      return response;

    } catch (error) {
      this.errorCount++;
      const errorResponse: UDSResponse = {
        success: false,
        data: [],
        timestamp: Date.now(),
        duration: performance.now() - startTime,
        service: request.service,
        error: error instanceof Error ? error.message : String(error)
      };

      if (this.onError) {
        this.onError(errorResponse.error!);
      }

      return errorResponse;
    }
  }

  private validateRequest(request: UDSRequest): void {
    // Check service support
    if (!Object.values(UDSConstants.SERVICES).includes(request.service as any)) {
      throw new Error(`Unsupported service: 0x${request.service.toString(16).padStart(2, '0')}`);
    }

    // Check session compatibility
    if (!this.isServiceSupportedInSession(request.service)) {
      throw new Error(`Service not supported in current session: ${this.getSessionName()}`);
    }

    // Check security requirements
    if (this.isSecurityRequired(request.service) && !this.isSecurityUnlocked) {
      throw new Error('Security access required for this service');
    }

    // Check message length
    const totalLength = request.data.length + 1; // +1 for service ID
    if (totalLength < UDSConstants.MESSAGE_LENGTH.MIN_REQUEST) {
      throw new Error('Message too short');
    }

    if (this.config.protocol === 'CAN' && totalLength > UDSConstants.MESSAGE_LENGTH.MAX_ISO_TP_SINGLE_FRAME) {
      // For CAN, we'd need ISO-TP multi-frame handling
      console.warn('Message requires ISO-TP multi-frame transmission');
    }
  }

  private async parseResponse(
    rawResponse: number[],
    requestService: number,
    startTime: number
  ): Promise<UDSResponse> {
    const duration = performance.now() - startTime;
    const timestamp = Date.now();

    if (rawResponse.length === 0) {
      throw new Error('No response received');
    }

    // Check for negative response
    if (rawResponse[0] === UDSConstants.NEGATIVE_RESPONSE_CODE) {
      if (rawResponse.length < 3) {
        throw new Error('Invalid negative response format');
      }

      const serviceId = rawResponse[1];
      const nrc = rawResponse[2];

      return {
        success: false,
        data: rawResponse,
        timestamp,
        duration,
        service: requestService,
        negativeResponseCode: nrc,
        error: this.getNRCDescription(nrc)
      };
    }

    // Check for positive response
    const expectedPositiveResponse = requestService + UDSConstants.POSITIVE_RESPONSE_OFFSET;
    if (rawResponse[0] !== expectedPositiveResponse) {
      throw new Error(`Unexpected response service ID: 0x${rawResponse[0].toString(16)}`);
    }

    return {
      success: true,
      data: rawResponse,
      timestamp,
      duration,
      service: requestService
    };
  }

  private updateSessionState(request: UDSRequest, response: UDSResponse): void {
    if (!response.success) return;

    // Update session for diagnostic session control
    if (request.service === UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL) {
      if (request.data.length > 0) {
        this.currentSession = request.data[0];
        // Reset security when changing sessions
        if (this.currentSession === UDSConstants.SESSION_TYPES.DEFAULT_SESSION) {
          this.isSecurityUnlocked = false;
          this.securityLevel = 0;
        }
      }
    }

    // Update security state for security access
    if (request.service === UDSConstants.SERVICES.SECURITY_ACCESS) {
      if (request.data.length > 0) {
        const subFunction = request.data[0];
        if ((subFunction & 0x01) === 0) { // Even sub-function = send key
          this.isSecurityUnlocked = true;
          this.securityLevel = (subFunction >> 1) + 1;
        }
      }
    }
  }

  private isServiceSupportedInSession(service: number): boolean {
    // Default session: basic services only
    if (this.currentSession === UDSConstants.SESSION_TYPES.DEFAULT_SESSION) {
      return [
        UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL,
        UDSConstants.SERVICES.ECU_RESET,
        UDSConstants.SERVICES.READ_DTC_INFORMATION,
        UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER,
        UDSConstants.SERVICES.TESTER_PRESENT
      ].includes(service as any);
    }

    // Extended and programming sessions: all services
    return true;
  }

  private isSecurityRequired(service: number): boolean {
    const securityRequiredServices = [
      UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION,
      UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS,
      UDSConstants.SERVICES.COMMUNICATION_CONTROL,
      UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER,
      UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS,
      UDSConstants.SERVICES.ROUTINE_CONTROL,
      UDSConstants.SERVICES.REQUEST_DOWNLOAD,
      UDSConstants.SERVICES.REQUEST_UPLOAD,
      UDSConstants.SERVICES.TRANSFER_DATA,
      UDSConstants.SERVICES.REQUEST_TRANSFER_EXIT
    ];

    return securityRequiredServices.includes(service as any);
  }

  private getNRCDescription(nrc: number): string {
    const nrcMap: { [key: number]: string } = {
      [UDSConstants.NRC.GENERAL_REJECT]: 'General reject',
      [UDSConstants.NRC.SERVICE_NOT_SUPPORTED]: 'Service not supported',
      [UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED]: 'Sub-function not supported',
      [UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT]: 'Incorrect message length or invalid format',
      [UDSConstants.NRC.RESPONSE_TOO_LONG]: 'Response too long',
      [UDSConstants.NRC.BUSY_REPEAT_REQUEST]: 'Busy, repeat request',
      [UDSConstants.NRC.CONDITIONS_NOT_CORRECT]: 'Conditions not correct',
      [UDSConstants.NRC.REQUEST_SEQUENCE_ERROR]: 'Request sequence error',
      [UDSConstants.NRC.SECURITY_ACCESS_DENIED]: 'Security access denied',
      [UDSConstants.NRC.INVALID_KEY]: 'Invalid key',
      [UDSConstants.NRC.EXCEED_NUMBER_OF_ATTEMPTS]: 'Exceed number of attempts',
      [UDSConstants.NRC.REQUIRED_TIME_DELAY_NOT_EXPIRED]: 'Required time delay not expired',
      [UDSConstants.NRC.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING]: 'Request correctly received, response pending',
      [UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION]: 'Sub-function not supported in active session',
      [UDSConstants.NRC.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION]: 'Service not supported in active session'
    };

    return nrcMap[nrc] || `Unknown NRC: 0x${nrc.toString(16).padStart(2, '0')}`;
  }

  private getSessionName(): string {
    const sessionMap: { [key: number]: string } = {
      [UDSConstants.SESSION_TYPES.DEFAULT_SESSION]: 'Default Session',
      [UDSConstants.SESSION_TYPES.PROGRAMMING_SESSION]: 'Programming Session',
      [UDSConstants.SESSION_TYPES.EXTENDED_DIAGNOSTIC_SESSION]: 'Extended Diagnostic Session',
      [UDSConstants.SESSION_TYPES.SAFETY_SYSTEM_DIAGNOSTIC_SESSION]: 'Safety System Diagnostic Session'
    };

    return sessionMap[this.currentSession] || 'Unknown Session';
  }

  // Event handlers
  public onMessageSentHandler(callback: (request: UDSRequest, response: UDSResponse) => void): void {
    this.onMessageSent = callback;
  }

  public onErrorHandler(callback: (error: string) => void): void {
    this.onError = callback;
  }

  // Getters
  public getCurrentSession(): number {
    return this.currentSession;
  }

  public getSecurityLevel(): number {
    return this.securityLevel;
  }

  public isSecurityAccessUnlocked(): boolean {
    return this.isSecurityUnlocked;
  }

  public getMessageCount(): number {
    return this.messageCount;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }

  public getProtocol(): string {
    return this.config.protocol;
  }

  // Cleanup
  public cleanup(): void {
    this.onMessageSent = null;
    this.onError = null;
    console.log('🧹 UDS Protocol cleaned up');
  }
}