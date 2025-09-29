/**
 * UDS Message Builder
 * Constructs UDS messages according to ISO 14229-1 specification
 */

import { UDSConstants } from './constants';

export interface UDSMessage {
  service: number;
  data: number[];
  length: number;
  checksum?: number;
}

export interface UDSMessageRequest {
  service: number;
  data: number[];
  functionalAddress?: boolean;
  suppressResponse?: boolean;
}

export class UDSMessageBuilder {
  constructor() {}

  public async initialize(): Promise<void> {
    console.log('🔧 Initializing UDS Message Builder...');
  }

  public async buildMessage(request: UDSMessageRequest): Promise<UDSMessage> {
    // Validate service ID
    if (!this.isValidServiceId(request.service)) {
      throw new Error(`Invalid service ID: 0x${request.service.toString(16).padStart(2, '0')}`);
    }

    // Build the message data array
    const messageData: number[] = [request.service, ...request.data];

    // Validate message length
    this.validateMessageLength(messageData);

    const message: UDSMessage = {
      service: request.service,
      data: messageData,
      length: messageData.length
    };

    // Add checksum if required (for certain protocols)
    if (this.requiresChecksum(request.service)) {
      message.checksum = this.calculateChecksum(messageData);
    }

    return message;
  }

  public buildDiagnosticSessionControl(sessionType: number): UDSMessage {
    return {
      service: UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL,
      data: [UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL, sessionType],
      length: 2
    };
  }

  public buildECUReset(resetType: number): UDSMessage {
    return {
      service: UDSConstants.SERVICES.ECU_RESET,
      data: [UDSConstants.SERVICES.ECU_RESET, resetType],
      length: 2
    };
  }

  public buildReadDataByIdentifier(dataIdentifier: number): UDSMessage {
    const didHigh = (dataIdentifier >> 8) & 0xFF;
    const didLow = dataIdentifier & 0xFF;
    
    return {
      service: UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER,
      data: [UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER, didHigh, didLow],
      length: 3
    };
  }

  public buildWriteDataByIdentifier(dataIdentifier: number, data: number[]): UDSMessage {
    const didHigh = (dataIdentifier >> 8) & 0xFF;
    const didLow = dataIdentifier & 0xFF;
    
    return {
      service: UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER,
      data: [UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER, didHigh, didLow, ...data],
      length: 3 + data.length
    };
  }

  public buildSecurityAccess(subFunction: number, data: number[] = []): UDSMessage {
    return {
      service: UDSConstants.SERVICES.SECURITY_ACCESS,
      data: [UDSConstants.SERVICES.SECURITY_ACCESS, subFunction, ...data],
      length: 2 + data.length
    };
  }

  public buildReadDTCInformation(subFunction: number, data: number[] = []): UDSMessage {
    return {
      service: UDSConstants.SERVICES.READ_DTC_INFORMATION,
      data: [UDSConstants.SERVICES.READ_DTC_INFORMATION, subFunction, ...data],
      length: 2 + data.length
    };
  }

  public buildClearDiagnosticInformation(groupOfDTC: number): UDSMessage {
    const dtcHigh = (groupOfDTC >> 16) & 0xFF;
    const dtcMid = (groupOfDTC >> 8) & 0xFF;
    const dtcLow = groupOfDTC & 0xFF;
    
    return {
      service: UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION,
      data: [UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION, dtcHigh, dtcMid, dtcLow],
      length: 4
    };
  }

  public buildTesterPresent(suppressResponse: boolean = false): UDSMessage {
    const subFunction = suppressResponse ? 0x80 : 0x00;
    
    return {
      service: UDSConstants.SERVICES.TESTER_PRESENT,
      data: [UDSConstants.SERVICES.TESTER_PRESENT, subFunction],
      length: 2
    };
  }

  public buildRoutineControl(
    subFunction: number,
    routineIdentifier: number,
    data: number[] = []
  ): UDSMessage {
    const ridHigh = (routineIdentifier >> 8) & 0xFF;
    const ridLow = routineIdentifier & 0xFF;
    
    return {
      service: UDSConstants.SERVICES.ROUTINE_CONTROL,
      data: [UDSConstants.SERVICES.ROUTINE_CONTROL, subFunction, ridHigh, ridLow, ...data],
      length: 4 + data.length
    };
  }

  public buildCommunicationControl(
    subFunction: number,
    communicationType: number,
    nodeIdentificationNumber?: number
  ): UDSMessage {
    const data = [UDSConstants.SERVICES.COMMUNICATION_CONTROL, subFunction, communicationType];
    
    if (nodeIdentificationNumber !== undefined) {
      data.push((nodeIdentificationNumber >> 8) & 0xFF);
      data.push(nodeIdentificationNumber & 0xFF);
    }
    
    return {
      service: UDSConstants.SERVICES.COMMUNICATION_CONTROL,
      data,
      length: data.length
    };
  }

  public buildReadMemoryByAddress(
    addressAndLengthFormatIdentifier: number,
    memoryAddress: number,
    memorySize: number
  ): UDSMessage {
    const addressLength = (addressAndLengthFormatIdentifier >> 4) & 0x0F;
    const sizeLength = addressAndLengthFormatIdentifier & 0x0F;
    
    const data = [
      UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS,
      addressAndLengthFormatIdentifier
    ];
    
    // Add memory address bytes (MSB first)
    for (let i = addressLength - 1; i >= 0; i--) {
      data.push((memoryAddress >> (i * 8)) & 0xFF);
    }
    
    // Add memory size bytes (MSB first)
    for (let i = sizeLength - 1; i >= 0; i--) {
      data.push((memorySize >> (i * 8)) & 0xFF);
    }
    
    return {
      service: UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS,
      data,
      length: data.length
    };
  }

  public buildWriteMemoryByAddress(
    addressAndLengthFormatIdentifier: number,
    memoryAddress: number,
    dataRecord: number[]
  ): UDSMessage {
    const addressLength = (addressAndLengthFormatIdentifier >> 4) & 0x0F;
    
    const data = [
      UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS,
      addressAndLengthFormatIdentifier
    ];
    
    // Add memory address bytes (MSB first)
    for (let i = addressLength - 1; i >= 0; i--) {
      data.push((memoryAddress >> (i * 8)) & 0xFF);
    }
    
    // Add data record
    data.push(...dataRecord);
    
    return {
      service: UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS,
      data,
      length: data.length
    };
  }

  private isValidServiceId(serviceId: number): boolean {
    return Object.values(UDSConstants.SERVICES).includes(serviceId as any);
  }

  private validateMessageLength(data: number[]): void {
    if (data.length < UDSConstants.MESSAGE_LENGTH.MIN_REQUEST) {
      throw new Error('Message too short');
    }
    
    if (data.length > UDSConstants.MESSAGE_LENGTH.MAX_REQUEST) {
      throw new Error('Message too long');
    }
  }

  private requiresChecksum(serviceId: number): boolean {
    // Checksum typically required for programming services
    return [
      UDSConstants.SERVICES.REQUEST_DOWNLOAD,
      UDSConstants.SERVICES.REQUEST_UPLOAD,
      UDSConstants.SERVICES.TRANSFER_DATA,
      UDSConstants.SERVICES.REQUEST_TRANSFER_EXIT
    ].includes(serviceId as any);
  }

  private calculateChecksum(data: number[]): number {
    // Simple XOR checksum (implementation depends on ECU requirements)
    return data.reduce((checksum, byte) => checksum ^ byte, 0);
  }

  // Utility methods for building complex messages
  public static formatDataIdentifier(did: number): string {
    return `0x${did.toString(16).padStart(4, '0').toUpperCase()}`;
  }

  public static formatServiceId(sid: number): string {
    return `0x${sid.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  public static formatByteArray(data: number[]): string {
    return data.map(byte => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`).join(' ');
  }

  public static parseDataIdentifier(didString: string): number {
    const cleaned = didString.replace(/^0x/i, '');
    const parsed = parseInt(cleaned, 16);
    
    if (isNaN(parsed) || parsed < 0 || parsed > 0xFFFF) {
      throw new Error(`Invalid data identifier: ${didString}`);
    }
    
    return parsed;
  }

  public static parseByteArray(byteString: string): number[] {
    return byteString
      .split(/\s+/)
      .filter(s => s.length > 0)
      .map(s => {
        const cleaned = s.replace(/^0x/i, '');
        const parsed = parseInt(cleaned, 16);
        
        if (isNaN(parsed) || parsed < 0 || parsed > 0xFF) {
          throw new Error(`Invalid byte value: ${s}`);
        }
        
        return parsed;
      });
  }
}