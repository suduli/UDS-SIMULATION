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
      // RPS state initialization
      rpsEnabled: false,
      rpsPowerDownTime: 0,
    };
  }

  /**
   * Process UDS request and generate response
   */
  /**
   * Process UDS request and generate response
   * @param request - The UDS request to process
   * @param ignitionOn - Whether ignition is ON
   * @param voltage - Current power supply voltage (optional, for power mode validation)
   * @param systemVoltage - System voltage type: 12V or 24V (optional)
   */
  async processRequest(
    request: UDSRequest,
    ignitionOn: boolean,
    voltage?: number,
    systemVoltage?: 12 | 24
  ): Promise<UDSResponse> {
    this.state.lastActivityTime = Date.now();

    // Check if service is supported
    if (!this.ecuConfig.supportedServices.includes(request.sid)) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SERVICE_NOT_SUPPORTED
      );
    }

    // Ignition Check: Reject most services if Ignition is OFF
    // Allowed services: DiagnosticSessionControl (0x10), ECUReset (0x11)
    const ALWAYS_ALLOWED_SIDS: ServiceId[] = [
      ServiceId.DIAGNOSTIC_SESSION_CONTROL,
      ServiceId.ECU_RESET
    ];

    if (!ignitionOn && !ALWAYS_ALLOWED_SIDS.includes(request.sid as ServiceId)) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.CONDITIONS_NOT_CORRECT
      );
    }

    // Route to appropriate service handler
    switch (request.sid) {
      case ServiceId.DIAGNOSTIC_SESSION_CONTROL: {
        const response = this.handleDiagnosticSessionControl(request);
        // If null, suppress positive response bit was set - return a special marker
        if (response === null) {
          return {
            sid: request.sid,
            data: [], // Empty data indicates suppressed response
            timestamp: Date.now(),
            isNegative: false,
            suppressedResponse: true, // Custom flag to indicate suppression
          } as UDSResponse;
        }
        return response;
      }

      case ServiceId.ECU_RESET: {
        // Pass voltage parameters for power condition validation
        const response = await this.handleECUReset(request, voltage, systemVoltage);
        // If null, suppress positive response bit was set - return a special marker
        if (response === null) {
          return {
            sid: request.sid,
            data: [], // Empty data indicates suppressed response
            timestamp: Date.now(),
            isNegative: false,
            suppressedResponse: true, // Custom flag to indicate suppression
          } as UDSResponse;
        }
        return response;
      }

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
   * Supports suppress positive response bit (0x80) per ISO 14229
   * Supports all four standard sessions: Default (0x01), Programming (0x02), Extended (0x03), Safety (0x04)
   */
  private handleDiagnosticSessionControl(request: UDSRequest): UDSResponse | null {
    // Check if subfunction is missing (use explicit undefined check, not falsy)
    // This is important because 0x00 is a valid but unsupported subfunction
    if (request.subFunction === undefined) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Extract suppress positive response bit (bit 7)
    const suppressPositiveResponse = (request.subFunction & 0x80) !== 0;

    // Get actual session type (lower 7 bits)
    const sessionType = (request.subFunction & 0x7F) as DiagnosticSessionType;

    // Validate session type - must be 0x01, 0x02, 0x03, or 0x04
    // Any other value (including 0x00, 0x05+) returns NRC 0x12
    const validSessions = [
      DiagnosticSessionType.DEFAULT,
      DiagnosticSessionType.PROGRAMMING,
      DiagnosticSessionType.EXTENDED,
      DiagnosticSessionType.SAFETY
    ];
    if (!validSessions.includes(sessionType)) {
      // Note: NRC responses are never suppressed per ISO 14229
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED
      );
    }

    // Check for extra bytes - SID 10 should have exactly 2 bytes (SID + subFunction)
    // Any additional data bytes should return NRC 0x13
    if (request.data && request.data.length > 0) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Session transition validation per ISO 14229-1:2020
    // Valid Transitions Matrix:
    // | From → To        | Default | Programming | Extended | Safety |
    // |------------------|---------|-------------|----------|--------|
    // | Default (0x01)   | OK      | OK          | OK       | OK     |
    // | Programming(0x02)| OK      | NRC 0x22    | NRC 0x22 | NRC 0x22|
    // | Extended (0x03)  | OK      | NRC 0x22    | OK       | NRC 0x22|
    // | Safety (0x04)    | OK      | NRC 0x22    | NRC 0x22 | OK     |
    const currentSession = this.state.currentSession;

    const isTransitionValid = (): boolean => {
      // Always allow transition TO Default session
      if (sessionType === DiagnosticSessionType.DEFAULT) {
        return true;
      }

      // Always allow transition FROM Default session
      if (currentSession === DiagnosticSessionType.DEFAULT) {
        return true;
      }

      // Programming session: cannot re-enter or transition to from any non-Default
      if (currentSession === DiagnosticSessionType.PROGRAMMING) {
        return false; // Must return to Default first
      }

      // Extended and Safety: allow re-entering same session only
      if (sessionType === currentSession) {
        return sessionType === DiagnosticSessionType.EXTENDED ||
          sessionType === DiagnosticSessionType.SAFETY;
      }

      // All other non-Default to non-Default transitions are blocked
      return false;
    };

    if (!isTransitionValid()) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.CONDITIONS_NOT_CORRECT
      );
    }

    // Update session state
    this.state.currentSession = sessionType;

    // Reset security when changing session (per ISO 14229-1, security is always locked on session change)
    // Only exception: re-entering the same session
    if (sessionType !== currentSession) {
      this.state.securityUnlocked = false;
      this.state.securityLevel = 0;
    }

    // Reset activity timestamp for session timeout
    this.state.lastActivityTime = Date.now();

    // If suppress positive response bit is set, return null (no response)
    if (suppressPositiveResponse) {
      return null;
    }

    // Determine P2 timing based on session type
    // Per SID10_Reference.md:
    // - Default/Programming/Safety: P2=50ms (0x0032)
    // - Extended: P2=100ms (0x0064)
    // - All sessions: P2*=5000ms (0x01F4 in 10ms units)
    const p2High = sessionType === DiagnosticSessionType.EXTENDED ? 0x00 : 0x00;
    const p2Low = sessionType === DiagnosticSessionType.EXTENDED ? 0x64 : 0x32;

    // Response: SID + SubFunction + P2 (2 bytes) + P2* (2 bytes)
    return {
      sid: request.sid,
      data: [0x50, sessionType, p2High, p2Low, 0x01, 0xF4],
      timestamp: Date.now(),
      isNegative: false,
    };
  }

  /**
   * 0x11 - ECU Reset
   * Supports all reset types per ISO 14229-1:2020
   * - 0x01: Hard Reset
   * - 0x02: Key Off-On Reset
   * - 0x03: Soft Reset
   * - 0x04: Enable Rapid Power Shutdown (with powerDownTime parameter)
   * - 0x05: Disable Rapid Power Shutdown
   * 
   * Power Mode Integration:
   * - Validates voltage is within acceptable range before reset
   * - Returns NRC 0x22 (Conditions Not Correct) for unstable power
   * - Tracks RPS enabled state and power-down time
   */
  private async handleECUReset(request: UDSRequest, voltage?: number, systemVoltage?: 12 | 24): Promise<UDSResponse | null> {
    // Check if subfunction is missing
    if (request.subFunction === undefined) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Extract suppress positive response bit (bit 7)
    const suppressPositiveResponse = (request.subFunction & 0x80) !== 0;

    // Get actual reset type (lower 7 bits)
    const resetType = (request.subFunction & 0x7F) as ECUResetType;

    // Validate reset type - must be 0x01-0x05
    // Any other value (including 0x00, 0x06+) returns NRC 0x12
    const validResetTypes = [
      ECUResetType.HARD_RESET,           // 0x01
      ECUResetType.KEY_OFF_ON_RESET,     // 0x02
      ECUResetType.SOFT_RESET,           // 0x03
      ECUResetType.ENABLE_RAPID_POWER_SHUTDOWN,  // 0x04
      ECUResetType.DISABLE_RAPID_POWER_SHUTDOWN  // 0x05
    ];

    if (!validResetTypes.includes(resetType)) {
      // NRC responses are never suppressed per ISO 14229
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED
      );
    }

    // Validate message length based on reset type
    // - 0x01, 0x02, 0x03, 0x05: Exactly 2 bytes (SID + subFunction), no data allowed
    // - 0x04: Exactly 3 bytes (SID + subFunction + powerDownTime)
    const expectedDataLength = resetType === ECUResetType.ENABLE_RAPID_POWER_SHUTDOWN ? 1 : 0;
    const actualDataLength = request.data?.length || 0;

    if (actualDataLength !== expectedDataLength) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Power condition validation for reset operations (0x01, 0x02, 0x03)
    // Returns NRC 0x22 (Conditions Not Correct) if voltage is unstable
    if (voltage !== undefined &&
      (resetType === ECUResetType.HARD_RESET ||
        resetType === ECUResetType.KEY_OFF_ON_RESET ||
        resetType === ECUResetType.SOFT_RESET)) {
      const sysV = systemVoltage ?? 12;
      const minVoltage = sysV === 12 ? 11.0 : 22.0;
      const maxVoltage = sysV === 12 ? 16.0 : 28.0;

      if (voltage < minVoltage || voltage > maxVoltage) {
        return this.createNegativeResponseObj(
          request.sid,
          NegativeResponseCode.CONDITIONS_NOT_CORRECT
        );
      }
    }

    // Session restriction check per ISO 14229-1:2020
    // Safety Session (0x04): Only actual resets (0x01, 0x02, 0x03) are NOT allowed - return NRC 0x7E
    // RPS commands (0x04, 0x05) are allowed in all sessions as they don't perform actual reset
    // Programming Session (0x02): Soft Reset (0x03) is NOT allowed
    const isActualReset = resetType === ECUResetType.HARD_RESET ||
      resetType === ECUResetType.KEY_OFF_ON_RESET ||
      resetType === ECUResetType.SOFT_RESET;

    if (this.state.currentSession === DiagnosticSessionType.SAFETY && isActualReset) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION
      );
    }

    if (this.state.currentSession === DiagnosticSessionType.PROGRAMMING &&
      resetType === ECUResetType.SOFT_RESET) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION
      );
    }

    // Get powerDownTime for Enable RPS (0x04)
    let powerDownTime: number | undefined;
    if (resetType === ECUResetType.ENABLE_RAPID_POWER_SHUTDOWN && request.data) {
      powerDownTime = request.data[0];
    }

    // Handle RPS Enable/Disable
    if (resetType === ECUResetType.ENABLE_RAPID_POWER_SHUTDOWN && powerDownTime !== undefined) {
      this.state.rpsEnabled = true;
      this.state.rpsPowerDownTime = powerDownTime;
    } else if (resetType === ECUResetType.DISABLE_RAPID_POWER_SHUTDOWN) {
      this.state.rpsEnabled = false;
      this.state.rpsPowerDownTime = 0;
    }

    // Simulate reset delay based on type
    switch (resetType) {
      case ECUResetType.HARD_RESET:
        await delay(200); // 100-500ms typical
        break;
      case ECUResetType.KEY_OFF_ON_RESET:
        await delay(300); // 200-1000ms typical
        break;
      case ECUResetType.SOFT_RESET:
        await delay(50);  // 10-100ms typical (fastest)
        break;
      default:
        await delay(50);
    }

    // Reset state based on type
    // All resets return to Default session and lock security
    if (resetType === ECUResetType.HARD_RESET ||
      resetType === ECUResetType.KEY_OFF_ON_RESET ||
      resetType === ECUResetType.SOFT_RESET) {
      this.state.currentSession = DiagnosticSessionType.DEFAULT;
      this.state.securityUnlocked = false;
      this.state.securityLevel = 0;
      this.state.activePeriodicIds = [];
    }

    // If suppress positive response bit is set, return null (no response)
    if (suppressPositiveResponse) {
      return null;
    }

    // Build positive response
    // Format: 0x51 + resetType + [powerDownTime for 0x04]
    const responseData: number[] = [0x51, resetType];
    if (resetType === ECUResetType.ENABLE_RAPID_POWER_SHUTDOWN && powerDownTime !== undefined) {
      responseData.push(powerDownTime);
    }

    return {
      sid: request.sid,
      data: responseData,
      timestamp: Date.now(),
      isNegative: false,
      resetType, // Include reset type for power effect coordination
    } as UDSResponse;
  }

  /**
   * 0x14 - Clear Diagnostic Information
   * Per ISO 14229-1:2020:
   * - Request format: SID (0x14) + groupOfDTC (3 bytes) = exactly 4 bytes total
   * - groupOfDTC specifies which DTCs to clear (0xFFFFFF = all)
   * - Safety Session typically blocks clear operations to preserve evidence
   */
  private handleClearDTC(request: UDSRequest): UDSResponse {
    // Validate message length: must be exactly 3 bytes of data (groupOfDTC)
    // Less than 3 bytes OR more than 3 bytes = NRC 0x13
    if (!request.data || request.data.length !== 3) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.INCORRECT_MESSAGE_LENGTH
      );
    }

    // Session restriction: Safety Session (0x04) typically blocks DTC clearing
    // This preserves diagnostic evidence for safety-critical analysis
    if (this.state.currentSession === DiagnosticSessionType.SAFETY) {
      return this.createNegativeResponseObj(
        request.sid,
        NegativeResponseCode.CONDITIONS_NOT_CORRECT
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
      // RPS state reset
      rpsEnabled: false,
      rpsPowerDownTime: 0,
    };
  }
}
