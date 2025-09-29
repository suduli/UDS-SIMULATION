/**
 * Virtual ECU Simulator
 * Simulates ECU responses for UDS diagnostic services
 */

import { UDSConstants } from '../core/constants';
import { UDSMessage } from '../core/message-builder';

export interface VirtualECUConfig {
  ecuAddress: number;
  responseAddress: number;
  protocol: 'CAN' | 'DoIP';
  simulatedDTCs?: Array<{ dtc: number; status: number }>;
  dataIdentifiers?: Map<number, number[]>;
  ecuManufacturer?: string;
  ecuPartNumber?: string;
  softwareVersion?: string;
}

export interface VirtualECUState {
  currentSession: number;
  securityLevel: number;
  isSecurityUnlocked: boolean;
  securityAttempts: number;
  lastSecuritySeed: number[];
  dtcSettings: boolean;
  communicationControl: number;
  activeRoutines: Set<number>;
  memoryData: Map<number, number>;
}

export class VirtualECU {
  private config: VirtualECUConfig;
  private state: VirtualECUState;
  private responseDelay: number = 10; // Simulated response delay in ms

  // Default simulated data
  private defaultDTCs: Array<{ dtc: number; status: number }> = [
    { dtc: 0x123456, status: 0x0F }, // Example DTC with confirmed status
    { dtc: 0x789ABC, status: 0x04 }  // Example DTC with pending status
  ];

  private defaultDataIdentifiers: Map<number, number[]> = new Map([
    [UDSConstants.DATA_IDENTIFIERS.VIN, [0x57, 0x56, 0x57, 0x5A, 0x5A, 0x5A, 0x45, 0x44, 0x43, 0x56, 0x46, 0x52, 0x34, 0x35, 0x32, 0x31, 0x32]], // VIN: WVWZZZEDC VFR45212
    [UDSConstants.DATA_IDENTIFIERS.ECU_SERIAL_NUMBER, [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30]], // Serial: 1234567890
    [UDSConstants.DATA_IDENTIFIERS.ECU_HARDWARE_NUMBER, [0x31, 0x32, 0x33, 0x2D, 0x34, 0x35, 0x36, 0x2D, 0x37, 0x38, 0x39]], // HW: 123-456-789
    [UDSConstants.DATA_IDENTIFIERS.APPLICATION_SOFTWARE_IDENTIFICATION, [0x56, 0x31, 0x2E, 0x30, 0x2E, 0x30]], // SW: V1.0.0
    [UDSConstants.DATA_IDENTIFIERS.ACTIVE_DIAGNOSTIC_SESSION, [0x01]] // Default session
  ]);

  constructor(config: VirtualECUConfig) {
    this.config = {
      simulatedDTCs: this.defaultDTCs,
      dataIdentifiers: this.defaultDataIdentifiers,
      ecuManufacturer: 'Virtual Motors',
      ecuPartNumber: 'VM-ECU-001',
      softwareVersion: '1.0.0',
      ...config
    };

    this.state = {
      currentSession: UDSConstants.SESSION_TYPES.DEFAULT_SESSION,
      securityLevel: 0,
      isSecurityUnlocked: false,
      securityAttempts: 0,
      lastSecuritySeed: [],
      dtcSettings: true,
      communicationControl: UDSConstants.COMMUNICATION_CONTROL.ENABLE_RX_AND_TX,
      activeRoutines: new Set(),
      memoryData: new Map()
    };
  }

  public async initialize(): Promise<void> {
    console.log('🤖 Initializing Virtual ECU...');
    
    // Initialize memory with some default values
    this.initializeMemoryData();
    
    console.log(`✅ Virtual ECU initialized (Address: 0x${this.config.ecuAddress.toString(16).toUpperCase()})`);
  }

  public async setProtocol(protocol: 'CAN' | 'DoIP'): Promise<void> {
    this.config.protocol = protocol;
    console.log(`🔄 Virtual ECU protocol set to ${protocol}`);
  }

  public async processMessage(message: UDSMessage, protocol: 'CAN' | 'DoIP'): Promise<number[]> {
    // Simulate processing delay
    await this.delay(this.responseDelay);

    const serviceId = message.data[0];
    
    try {
      // Validate session compatibility
      if (!this.isServiceSupportedInCurrentSession(serviceId)) {
        return this.createNegativeResponse(serviceId, UDSConstants.NRC.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION);
      }

      // Check security requirements
      if (this.isSecurityRequired(serviceId) && !this.state.isSecurityUnlocked) {
        return this.createNegativeResponse(serviceId, UDSConstants.NRC.SECURITY_ACCESS_DENIED);
      }

      // Process service-specific requests
      switch (serviceId) {
        case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
          return this.processDiagnosticSessionControl(message.data);

        case UDSConstants.SERVICES.ECU_RESET:
          return this.processECUReset(message.data);

        case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
          return this.processReadDataByIdentifier(message.data);

        case UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER:
          return this.processWriteDataByIdentifier(message.data);

        case UDSConstants.SERVICES.READ_DTC_INFORMATION:
          return this.processReadDTCInformation(message.data);

        case UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION:
          return this.processClearDiagnosticInformation(message.data);

        case UDSConstants.SERVICES.SECURITY_ACCESS:
          return this.processSecurityAccess(message.data);

        case UDSConstants.SERVICES.TESTER_PRESENT:
          return this.processTesterPresent(message.data);

        case UDSConstants.SERVICES.ROUTINE_CONTROL:
          return this.processRoutineControl(message.data);

        case UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS:
          return this.processReadMemoryByAddress(message.data);

        case UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS:
          return this.processWriteMemoryByAddress(message.data);

        case UDSConstants.SERVICES.COMMUNICATION_CONTROL:
          return this.processCommunicationControl(message.data);

        case UDSConstants.SERVICES.CONTROL_DTC_SETTING:
          return this.processControlDTCSetting(message.data);

        default:
          return this.createNegativeResponse(serviceId, UDSConstants.NRC.SERVICE_NOT_SUPPORTED);
      }

    } catch (error) {
      console.error('Virtual ECU error:', error);
      return this.createNegativeResponse(serviceId, UDSConstants.NRC.GENERAL_REJECT);
    }
  }

  private processDiagnosticSessionControl(data: number[]): number[] {
    if (data.length !== 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const sessionType = data[1];
    
    // Validate session type
    if (!Object.values(UDSConstants.SESSION_TYPES).includes(sessionType as any)) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Update session state
    this.state.currentSession = sessionType;
    
    // Reset security when changing sessions (except for extended sessions)
    if (sessionType === UDSConstants.SESSION_TYPES.DEFAULT_SESSION) {
      this.state.isSecurityUnlocked = false;
      this.state.securityLevel = 0;
      this.state.securityAttempts = 0;
    }

    // Update active diagnostic session data identifier
    this.config.dataIdentifiers?.set(UDSConstants.DATA_IDENTIFIERS.ACTIVE_DIAGNOSTIC_SESSION, [sessionType]);

    // Positive response with timing parameters
    return [
      data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET,
      sessionType,
      0x00, 0x32,  // P2 Server Max (50ms)
      0x01, 0xF4   // P2* Server Max (5000ms)
    ];
  }

  private processECUReset(data: number[]): number[] {
    if (data.length !== 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const resetType = data[1];
    
    // Validate reset type
    if (!Object.values(UDSConstants.RESET_TYPES).includes(resetType as any)) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Simulate reset behavior
    switch (resetType) {
      case UDSConstants.RESET_TYPES.HARD_RESET:
        // Reset all states
        this.state.currentSession = UDSConstants.SESSION_TYPES.DEFAULT_SESSION;
        this.state.isSecurityUnlocked = false;
        this.state.securityLevel = 0;
        this.state.activeRoutines.clear();
        break;
        
      case UDSConstants.RESET_TYPES.SOFT_RESET:
        // Keep session and security state
        break;
    }

    return [
      data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET,
      resetType
    ];
  }

  private processReadDataByIdentifier(data: number[]): number[] {
    if (data.length < 3 || (data.length - 1) % 2 !== 0) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const response = [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET];
    
    // Process each data identifier
    for (let i = 1; i < data.length; i += 2) {
      const did = (data[i] << 8) | data[i + 1];
      const didData = this.config.dataIdentifiers?.get(did);
      
      if (!didData) {
        return this.createNegativeResponse(data[0], UDSConstants.NRC.REQUEST_OUT_OF_RANGE);
      }
      
      // Add DID and its data to response
      response.push(data[i], data[i + 1], ...didData);
    }

    return response;
  }

  private processWriteDataByIdentifier(data: number[]): number[] {
    if (data.length < 4) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const did = (data[1] << 8) | data[2];
    const writeData = data.slice(3);
    
    // Check if DID is writable (manufacturer-specific range)
    if (did < UDSConstants.DATA_IDENTIFIERS.MANUFACTURER_SPECIFIC_DID_RANGE_START || 
        did > UDSConstants.DATA_IDENTIFIERS.MANUFACTURER_SPECIFIC_DID_RANGE_END) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.REQUEST_OUT_OF_RANGE);
    }

    // Store the data
    this.config.dataIdentifiers?.set(did, writeData);

    return [
      data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET,
      data[1],
      data[2]
    ];
  }

  private processReadDTCInformation(data: number[]): number[] {
    if (data.length < 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1];
    const response = [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction];

    switch (subFunction) {
      case 0x01: // reportNumberOfDTCByStatusMask
        if (data.length !== 3) {
          return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
        }
        const statusMask = data[2];
        const filteredDTCs = this.config.simulatedDTCs?.filter(dtc => (dtc.status & statusMask) !== 0) || [];
        response.push(statusMask);
        response.push(0x01); // DTC format identifier
        response.push((filteredDTCs.length >> 8) & 0xFF, filteredDTCs.length & 0xFF);
        break;

      case 0x02: // reportDTCByStatusMask
        if (data.length !== 3) {
          return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
        }
        const mask = data[2];
        response.push(mask);
        
        this.config.simulatedDTCs?.forEach(dtc => {
          if ((dtc.status & mask) !== 0) {
            response.push((dtc.dtc >> 16) & 0xFF, (dtc.dtc >> 8) & 0xFF, dtc.dtc & 0xFF, dtc.status);
          }
        });
        break;

      case 0x0A: // reportSupportedDTC
        this.config.simulatedDTCs?.forEach(dtc => {
          response.push((dtc.dtc >> 16) & 0xFF, (dtc.dtc >> 8) & 0xFF, dtc.dtc & 0xFF, dtc.status);
        });
        break;

      default:
        return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    return response;
  }

  private processClearDiagnosticInformation(data: number[]): number[] {
    if (data.length !== 4) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const groupOfDTC = (data[1] << 16) | (data[2] << 8) | data[3];
    
    // Clear DTCs (simulation)
    if (groupOfDTC === 0xFFFFFF) {
      // Clear all DTCs
      this.config.simulatedDTCs = [];
    } else {
      // Clear specific DTC group
      this.config.simulatedDTCs = this.config.simulatedDTCs?.filter(dtc => 
        (dtc.dtc & 0xFFFF00) !== (groupOfDTC & 0xFFFF00)
      ) || [];
    }

    return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET];
  }

  private processSecurityAccess(data: number[]): number[] {
    if (data.length < 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1];
    const securityLevel = Math.floor(subFunction / 2) + 1;

    // Check for too many attempts
    if (this.state.securityAttempts >= 3) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.EXCEED_NUMBER_OF_ATTEMPTS);
    }

    if ((subFunction & 0x01) === 1) {
      // Request seed (odd sub-function)
      if (this.state.isSecurityUnlocked && this.state.securityLevel >= securityLevel) {
        // Already unlocked for this level or higher
        return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction, 0x00, 0x00];
      }

      // Generate seed
      this.state.lastSecuritySeed = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
      return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction, ...this.state.lastSecuritySeed];

    } else {
      // Send key (even sub-function)
      if (data.length < 4) {
        return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
      }

      const providedKey = data.slice(2);
      const expectedKey = this.calculateSecurityKey(this.state.lastSecuritySeed);

      if (this.arraysEqual(providedKey, expectedKey)) {
        // Correct key
        this.state.isSecurityUnlocked = true;
        this.state.securityLevel = securityLevel;
        this.state.securityAttempts = 0;
        return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction];
      } else {
        // Incorrect key
        this.state.securityAttempts++;
        return this.createNegativeResponse(data[0], UDSConstants.NRC.INVALID_KEY);
      }
    }
  }

  private processTesterPresent(data: number[]): number[] {
    if (data.length !== 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1] & 0x7F; // Remove suppress positive response bit
    const suppressResponse = (data[1] & 0x80) !== 0;

    if (subFunction !== 0x00) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Tester present keeps session alive
    // No additional processing needed for simulation

    if (suppressResponse) {
      return []; // No response
    }

    return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, 0x00];
  }

  private processRoutineControl(data: number[]): number[] {
    if (data.length < 4) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1];
    const routineId = (data[2] << 8) | data[3];
    const routineData = data.slice(4);

    switch (subFunction) {
      case UDSConstants.ROUTINE_CONTROL.START_ROUTINE:
        this.state.activeRoutines.add(routineId);
        break;
        
      case UDSConstants.ROUTINE_CONTROL.STOP_ROUTINE:
        this.state.activeRoutines.delete(routineId);
        break;
        
      case UDSConstants.ROUTINE_CONTROL.REQUEST_ROUTINE_RESULTS:
        // Return simulated results
        break;
        
      default:
        return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    return [
      data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET,
      subFunction,
      data[2],
      data[3],
      0x00 // Routine status: completed successfully
    ];
  }

  private processReadMemoryByAddress(data: number[]): number[] {
    if (data.length < 3) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const alfid = data[1];
    const addressLength = (alfid >> 4) & 0x0F;
    const sizeLength = alfid & 0x0F;

    if (data.length !== 2 + addressLength + sizeLength) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    // Parse memory address and size
    let memoryAddress = 0;
    for (let i = 0; i < addressLength; i++) {
      memoryAddress = (memoryAddress << 8) | data[2 + i];
    }

    let memorySize = 0;
    for (let i = 0; i < sizeLength; i++) {
      memorySize = (memorySize << 8) | data[2 + addressLength + i];
    }

    // Read simulated memory data
    const response = [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET];
    for (let i = 0; i < memorySize; i++) {
      const value = this.state.memoryData.get(memoryAddress + i) || 0x00;
      response.push(value);
    }

    return response;
  }

  private processWriteMemoryByAddress(data: number[]): number[] {
    if (data.length < 3) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const alfid = data[1];
    const addressLength = (alfid >> 4) & 0x0F;

    if (data.length < 2 + addressLength + 1) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    // Parse memory address
    let memoryAddress = 0;
    for (let i = 0; i < addressLength; i++) {
      memoryAddress = (memoryAddress << 8) | data[2 + i];
    }

    const writeData = data.slice(2 + addressLength);
    
    // Write to simulated memory
    writeData.forEach((value, index) => {
      this.state.memoryData.set(memoryAddress + index, value);
    });

    return [
      data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET,
      alfid,
      ...data.slice(2, 2 + addressLength)
    ];
  }

  private processCommunicationControl(data: number[]): number[] {
    if (data.length < 3) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1];
    const communicationType = data[2];

    // Validate communication control type
    if (!Object.values(UDSConstants.COMMUNICATION_CONTROL).includes(subFunction as any)) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    this.state.communicationControl = subFunction;

    return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction];
  }

  private processControlDTCSetting(data: number[]): number[] {
    if (data.length !== 2) {
      return this.createNegativeResponse(data[0], UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const subFunction = data[1];

    switch (subFunction) {
      case 0x01: // Enable DTC setting
        this.state.dtcSettings = true;
        break;
      case 0x02: // Disable DTC setting
        this.state.dtcSettings = false;
        break;
      default:
        return this.createNegativeResponse(data[0], UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED);
    }

    return [data[0] + UDSConstants.POSITIVE_RESPONSE_OFFSET, subFunction];
  }

  // Helper methods
  private createNegativeResponse(serviceId: number, nrc: number): number[] {
    return [UDSConstants.NEGATIVE_RESPONSE_CODE, serviceId, nrc];
  }

  private isServiceSupportedInCurrentSession(serviceId: number): boolean {
    if (this.state.currentSession === UDSConstants.SESSION_TYPES.DEFAULT_SESSION) {
      const basicServices = [
        UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL,
        UDSConstants.SERVICES.ECU_RESET,
        UDSConstants.SERVICES.READ_DTC_INFORMATION,
        UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER,
        UDSConstants.SERVICES.TESTER_PRESENT
      ];
      return basicServices.includes(serviceId as any);
    }
    return true; // Extended and programming sessions support all services
  }

  private isSecurityRequired(serviceId: number): boolean {
    const securityRequiredServices = [
      UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION,
      UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS,
      UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER,
      UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS,
      UDSConstants.SERVICES.ROUTINE_CONTROL,
      UDSConstants.SERVICES.COMMUNICATION_CONTROL,
      UDSConstants.SERVICES.CONTROL_DTC_SETTING
    ];
    return securityRequiredServices.includes(serviceId as any);
  }

  private calculateSecurityKey(seed: number[]): number[] {
    // Simple XOR-based key calculation for simulation
    // In real implementations, this would be a complex cryptographic function
    return seed.map(byte => byte ^ 0xAA);
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private initializeMemoryData(): void {
    // Initialize some sample memory data
    for (let i = 0x1000; i < 0x1100; i++) {
      this.state.memoryData.set(i, Math.floor(Math.random() * 256));
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public getters for state inspection
  public getCurrentSession(): number {
    return this.state.currentSession;
  }

  public getSecurityLevel(): number {
    return this.state.securityLevel;
  }

  public isSecurityUnlocked(): boolean {
    return this.state.isSecurityUnlocked;
  }

  public getConfig(): Readonly<VirtualECUConfig> {
    return { ...this.config };
  }

  public cleanup(): void {
    this.state.activeRoutines.clear();
    this.state.memoryData.clear();
    console.log('🧹 Virtual ECU cleaned up');
  }
}