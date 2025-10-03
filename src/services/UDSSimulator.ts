/**
 * UDS Protocol Service Simulator
 * Core simulation engine for handling UDS requests and generating responses
 */

import {
  ServiceId,
  DiagnosticSessionType,
  ECUResetType,
  RoutineControlType,
  NegativeResponseCode,
  type UDSRequest,
  type UDSResponse,
  type ProtocolState,
  type ECUConfig,
} from '../types/uds';

import {
  createNegativeResponse,
  generateSeed,
  calculateKeyXOR,
  dtcStatusToByte,
  generateAutomotiveData,
  delay,
} from '../utils/udsHelpers';

export class UDSSimulator {
  private state: ProtocolState;
  private ecuConfig: ECUConfig;
  private currentSeed: number[] = [];
  private expectedKey: number[] = [];

  constructor(ecuConfig: ECUConfig) {
    this.ecuConfig = ecuConfig;
    this.state = {
      currentSession: DiagnosticSessionType.DEFAULT,
      securityLevel: 0,
      securityUnlocked: false,
      securityAttempts: 0,
      lastActivityTime: Date.now(),
      sessionTimeout: 5000,
      communicationEnabled: true,
      activePeriodicIds: [],
      downloadInProgress: false,
      uploadInProgress: false,
      transferBlockCounter: 0,
    };
  }

  /**
   * Process UDS request and generate response
   */
  async processRequest(request: UDSRequest): Promise<UDSResponse> {
    this.state.lastActivityTime = Date.now();

    // Check if service is supported
    if (!this.ecuConfig.supportedServices.includes(request.sid)) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SERVICE_NOT_SUPPORTED
      );
    }

    // Route to appropriate service handler
    switch (request.sid) {
      case ServiceId.DIAGNOSTIC_SESSION_CONTROL:
        return this.handleDiagnosticSessionControl(request);
      
      case ServiceId.ECU_RESET:
        return await this.handleECUReset(request);
      
      case ServiceId.CLEAR_DIAGNOSTIC_INFORMATION:
        return this.handleClearDTC(request);
      
      case ServiceId.READ_DTC_INFORMATION:
        return this.handleReadDTC(request);
      
      case ServiceId.READ_DATA_BY_IDENTIFIER:
        return this.handleReadDataById(request);
      
      case ServiceId.READ_MEMORY_BY_ADDRESS:
        return this.handleReadMemory(request);
      
      case ServiceId.SECURITY_ACCESS:
        return this.handleSecurityAccess(request);
      
      case ServiceId.COMMUNICATION_CONTROL:
        return this.handleCommunicationControl(request);
      
      case ServiceId.READ_DATA_BY_PERIODIC_IDENTIFIER:
        return this.handlePeriodicData(request);
      
      case ServiceId.WRITE_DATA_BY_IDENTIFIER:
        return this.handleWriteDataById(request);
      
      case ServiceId.WRITE_MEMORY_BY_ADDRESS:
        return this.handleWriteMemory(request);
      
      case ServiceId.ROUTINE_CONTROL:
        return this.handleRoutineControl(request);
      
      case ServiceId.REQUEST_DOWNLOAD:
        return this.handleRequestDownload(request);
      
      case ServiceId.REQUEST_UPLOAD:
        return this.handleRequestUpload(request);
      
      case ServiceId.TRANSFER_DATA:
        return this.handleTransferData(request);
      
      case ServiceId.REQUEST_TRANSFER_EXIT:
        return this.handleTransferExit(request);
      
      default:
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.SERVICE_NOT_SUPPORTED
        );
    }
  }

  /**
   * 0x10 - Diagnostic Session Control
   */
  private handleDiagnosticSessionControl(request: UDSRequest): UDSResponse {
    if (!request.subFunction) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const sessionType = request.subFunction as DiagnosticSessionType;
    
    // Validate session type
    if (![DiagnosticSessionType.DEFAULT, DiagnosticSessionType.PROGRAMMING, DiagnosticSessionType.EXTENDED].includes(sessionType)) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED
      );
    }

    this.state.currentSession = sessionType;
    
    // Reset security when changing session
    if (sessionType !== DiagnosticSessionType.EXTENDED) {
      this.state.securityUnlocked = false;
      this.state.securityLevel = 0;
    }

    // Response: SID + SubFunction + P2 (2 bytes) + P2* (2 bytes)
    return {
      sid: request.sid,
      data: [0x50, sessionType, 0x00, 0x32, 0x01, 0xF4], // P2=50ms, P2*=500ms
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x11 - ECU Reset
   */
  private async handleECUReset(request: UDSRequest): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const resetType = request.subFunction as ECUResetType;

    // Simulate reset delay
    await delay(100);

    // Reset state based on type
    if (resetType === ECUResetType.HARD_RESET || resetType === ECUResetType.KEY_OFF_ON_RESET) {
      this.state.currentSession = DiagnosticSessionType.DEFAULT;
      this.state.securityUnlocked = false;
      this.state.securityLevel = 0;
      this.state.activePeriodicIds = [];
    }

    return {
      sid: request.sid,
      data: [0x51, resetType],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x14 - Clear Diagnostic Information
   */
  private handleClearDTC(request: UDSRequest): UDSResponse {
    if (!request.data || request.data.length < 3) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Extract DTC group (3 bytes)
    const dtcGroup = (request.data[0] << 16) | (request.data[1] << 8) | request.data[2];

    // Clear matching DTCs
    if (dtcGroup === 0xFFFFFF) {
      // Clear all DTCs
      this.ecuConfig.dtcs = [];
    } else {
      // Clear specific DTC or group
      this.ecuConfig.dtcs = this.ecuConfig.dtcs.filter(dtc => dtc.code !== dtcGroup);
    }

    return {
      sid: request.sid,
      data: [0x54],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x19 - Read DTC Information
   */
  private handleReadDTC(request: UDSRequest): UDSResponse {
    if (!request.subFunction) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const subFunction = request.subFunction;
    const responseData: number[] = [0x59, subFunction];

    switch (subFunction) {
      case 0x01: // reportNumberOfDTCByStatusMask
        {
          const statusMask = request.data?.[0] || 0xFF;
          const filteredDTCs = this.ecuConfig.dtcs.filter(dtc => {
            const dtcStatus = dtcStatusToByte(dtc.status);
            return (dtcStatus & statusMask) !== 0;
          });
          
          responseData.push(0x08); // DTCFormatIdentifier (ISO14229-1)
          responseData.push((filteredDTCs.length >> 8) & 0xFF);
          responseData.push(filteredDTCs.length & 0xFF);
        }
        break;

      case 0x02: // reportDTCByStatusMask
        {
          const statusMask = request.data?.[0] || 0xFF;
          const filteredDTCs = this.ecuConfig.dtcs.filter(dtc => {
            const dtcStatus = dtcStatusToByte(dtc.status);
            return (dtcStatus & statusMask) !== 0;
          });

          responseData.push(statusMask);
          
          filteredDTCs.forEach(dtc => {
            responseData.push((dtc.code >> 16) & 0xFF);
            responseData.push((dtc.code >> 8) & 0xFF);
            responseData.push(dtc.code & 0xFF);
            responseData.push(dtcStatusToByte(dtc.status));
          });
        }
        break;

      default:
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED
        );
    }

    return {
      sid: request.sid,
      data: responseData,
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x22 - Read Data By Identifier
   */
  private handleReadDataById(request: UDSRequest): UDSResponse {
    if (!request.data || request.data.length < 2) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const did = (request.data[0] << 8) | request.data[1];
    const dataId = this.ecuConfig.dataIdentifiers.find(d => d.id === did);

    if (!dataId) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.REQUEST_OUT_OF_RANGE
      );
    }

    const responseData: number[] = [0x62, request.data[0], request.data[1]];
    
    // Convert value to bytes based on format
    if (typeof dataId.value === 'string') {
      dataId.value.split('').forEach(char => {
        responseData.push(char.charCodeAt(0));
      });
    } else if (Array.isArray(dataId.value)) {
      responseData.push(...dataId.value);
    } else {
      // Generate dynamic data for certain DIDs
      const dynamicData = generateAutomotiveData(dataId.name);
      responseData.push(...dynamicData);
    }

    return {
      sid: request.sid,
      data: responseData,
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x23 - Read Memory By Address
   */
  private handleReadMemory(request: UDSRequest): UDSResponse {
    if (!this.state.securityUnlocked) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SECURITY_ACCESS_DENIED
      );
    }

    if (!request.data || request.data.length < 3) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Simplified: assume 4-byte address, 2-byte size
    const address = (request.data[0] << 24) | (request.data[1] << 16) | 
                   (request.data[2] << 8) | request.data[3];
    const size = (request.data[4] << 8) | request.data[5];

    // Find memory region
    const memRegion = this.ecuConfig.memoryMap.find(
      m => m.address === address && m.size === size
    );

    const responseData: number[] = [0x63];
    
    if (memRegion?.data) {
      responseData.push(...memRegion.data);
    } else {
      // Generate dummy data
      for (let i = 0; i < size; i++) {
        responseData.push(Math.floor(Math.random() * 256));
      }
    }

    return {
      sid: request.sid,
      data: responseData,
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x27 - Security Access
   */
  private handleSecurityAccess(request: UDSRequest): UDSResponse {
    if (!request.subFunction) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const subFunction = request.subFunction;

    // Check if odd (request seed) or even (send key)
    if (subFunction % 2 === 1) {
      // Request Seed
      if (this.state.securityAttempts >= 3) {
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS
        );
      }

      this.currentSeed = generateSeed(4);
      this.expectedKey = calculateKeyXOR(this.currentSeed);

      return {
        sid: request.sid,
        data: [0x67, subFunction, ...this.currentSeed],
        timestamp: Date.now(),
        isNegative: false,
      };
    } else {
      // Send Key
      if (!request.data || request.data.length < 4) {
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
        );
      }

      const receivedKey = request.data.slice(0, 4);
      const isValid = receivedKey.every((byte, idx) => byte === this.expectedKey[idx]);

      if (isValid) {
        this.state.securityUnlocked = true;
        this.state.securityLevel = Math.floor(subFunction / 2);
        this.state.securityAttempts = 0;

        return {
          sid: request.sid,
          data: [0x67, subFunction],
          timestamp: Date.now(),
          isNegative: false,
        };
      } else {
        this.state.securityAttempts++;
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.INVALID_KEY
        );
      }
    }
  }

  /**
   * 0x28 - Communication Control
   */
  private handleCommunicationControl(request: UDSRequest): UDSResponse {
    if (!request.subFunction) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const controlType = request.subFunction;
    
    // 0x00 = enable, 0x01 = disable, 0x03 = enable all
    if (controlType === 0x00 || controlType === 0x03) {
      this.state.communicationEnabled = true;
    } else if (controlType === 0x01) {
      this.state.communicationEnabled = false;
    }

    return {
      sid: request.sid,
      data: [0x68, controlType],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x2A - Read Data By Periodic Identifier
   */
  private handlePeriodicData(request: UDSRequest): UDSResponse {
    if (!request.subFunction || !request.data) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const transmissionMode = request.subFunction;
    
    if (transmissionMode === 0x01) {
      // Start sending
      this.state.activePeriodicIds = request.data;
    } else if (transmissionMode === 0x02) {
      // Stop sending
      this.state.activePeriodicIds = this.state.activePeriodicIds.filter(
        id => !request.data!.includes(id)
      );
    } else if (transmissionMode === 0x03 || transmissionMode === 0x04) {
      // Stop all
      this.state.activePeriodicIds = [];
    }

    return {
      sid: request.sid,
      data: [0x6A, transmissionMode],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x2E - Write Data By Identifier
   */
  private handleWriteDataById(request: UDSRequest): UDSResponse {
    if (!this.state.securityUnlocked) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SECURITY_ACCESS_DENIED
      );
    }

    if (!request.data || request.data.length < 3) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const did = (request.data[0] << 8) | request.data[1];
    const dataId = this.ecuConfig.dataIdentifiers.find(d => d.id === did);

    if (!dataId) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.REQUEST_OUT_OF_RANGE
      );
    }

    // Update value
    dataId.value = request.data.slice(2);

    return {
      sid: request.sid,
      data: [0x6E, request.data[0], request.data[1]],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x3D - Write Memory By Address
   */
  private handleWriteMemory(request: UDSRequest): UDSResponse {
    if (!this.state.securityUnlocked) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SECURITY_ACCESS_DENIED
      );
    }

    if (!request.data || request.data.length < 7) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    return {
      sid: request.sid,
      data: [0x7D],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x31 - Routine Control
   */
  private handleRoutineControl(request: UDSRequest): UDSResponse {
    if (!request.subFunction || !request.data || request.data.length < 2) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const controlType = request.subFunction as RoutineControlType;
    const routineId = (request.data[0] << 8) | request.data[1];
    
    const routine = this.ecuConfig.routines.find(r => r.id === routineId);
    
    if (!routine) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.REQUEST_OUT_OF_RANGE
      );
    }

    const responseData: number[] = [0x71, controlType, request.data[0], request.data[1]];

    switch (controlType) {
      case RoutineControlType.START_ROUTINE:
        routine.status = 'running';
        responseData.push(0x00); // Routine started
        break;
      
      case RoutineControlType.STOP_ROUTINE:
        routine.status = 'idle';
        responseData.push(0x00); // Routine stopped
        break;
      
      case RoutineControlType.REQUEST_ROUTINE_RESULTS:
        routine.status = 'completed';
        if (routine.results) {
          responseData.push(...routine.results);
        }
        break;
    }

    return {
      sid: request.sid,
      data: responseData,
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x34 - Request Download
   */
  private handleRequestDownload(request: UDSRequest): UDSResponse {
    if (!this.state.securityUnlocked) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SECURITY_ACCESS_DENIED
      );
    }

    this.state.downloadInProgress = true;
    this.state.transferBlockCounter = 1;

    return {
      sid: request.sid,
      data: [0x74, 0x20, 0x10, 0x00], // lengthFormatIdentifier, maxNumberOfBlockLength
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x35 - Request Upload
   */
  private handleRequestUpload(request: UDSRequest): UDSResponse {
    if (!this.state.securityUnlocked) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SECURITY_ACCESS_DENIED
      );
    }

    this.state.uploadInProgress = true;
    this.state.transferBlockCounter = 1;

    return {
      sid: request.sid,
      data: [0x75, 0x20, 0x10, 0x00],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x36 - Transfer Data
   */
  private handleTransferData(request: UDSRequest): UDSResponse {
    if (!this.state.downloadInProgress && !this.state.uploadInProgress) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.REQUEST_SEQUENCE_ERROR
      );
    }

    if (!request.data || request.data.length < 1) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    const blockCounter = request.data[0];
    
    if (blockCounter !== this.state.transferBlockCounter) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.WRONG_BLOCK_SEQUENCE_COUNTER
      );
    }

    this.state.transferBlockCounter++;
    if (this.state.transferBlockCounter > 0xFF) {
      this.state.transferBlockCounter = 0;
    }

    return {
      sid: request.sid,
      data: [0x76, blockCounter],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x37 - Request Transfer Exit
   */
  private handleTransferExit(request: UDSRequest): UDSResponse {
    if (!this.state.downloadInProgress && !this.state.uploadInProgress) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.REQUEST_SEQUENCE_ERROR
      );
    }

    this.state.downloadInProgress = false;
    this.state.uploadInProgress = false;
    this.state.transferBlockCounter = 0;

    return {
      sid: request.sid,
      data: [0x77],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * Helper to create negative response object
   */
  private createNegativeResponseObj(sid: ServiceId, nrc: NegativeResponseCode): UDSResponse {
    return {
      sid,
      data: createNegativeResponse(sid, nrc),
      timestamp: Date.now(),
      isNegative: true,
      nrc,
    };
  }

  /**
   * Get current protocol state
   */
  getState(): ProtocolState {
    return { ...this.state };
  }

  /**
   * Reset simulator state
   */
  reset(): void {
    this.state = {
      currentSession: DiagnosticSessionType.DEFAULT,
      securityLevel: 0,
      securityUnlocked: false,
      securityAttempts: 0,
      lastActivityTime: Date.now(),
      sessionTimeout: 5000,
      communicationEnabled: true,
      activePeriodicIds: [],
      downloadInProgress: false,
      uploadInProgress: false,
      transferBlockCounter: 0,
    };
  }
}
