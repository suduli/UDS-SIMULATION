/**
 * UDS Message Parser
 * Parses UDS response messages according to ISO 14229-1 specification
 */

import { UDSConstants } from './constants';

export interface ParsedUDSResponse {
  isPositive: boolean;
  service: number;
  data: number[];
  negativeResponseCode?: number;
  subFunction?: number;
  dataIdentifier?: number;
  routineIdentifier?: number;
  dtcCount?: number;
  sessionType?: number;
}

export class UDSMessageParser {
  constructor() {}

  public async initialize(): Promise<void> {
    console.log('🔧 Initializing UDS Message Parser...');
  }

  public parseResponse(rawData: number[]): ParsedUDSResponse {
    if (rawData.length === 0) {
      throw new Error('Empty response data');
    }

    const responseServiceId = rawData[0];

    // Check for negative response
    if (responseServiceId === UDSConstants.NEGATIVE_RESPONSE_CODE) {
      return this.parseNegativeResponse(rawData);
    }

    // Parse positive response
    return this.parsePositiveResponse(rawData);
  }

  private parseNegativeResponse(data: number[]): ParsedUDSResponse {
    if (data.length < 3) {
      throw new Error('Invalid negative response format - too short');
    }

    const requestServiceId = data[1];
    const negativeResponseCode = data[2];

    return {
      isPositive: false,
      service: requestServiceId,
      data: data,
      negativeResponseCode: negativeResponseCode
    };
  }

  private parsePositiveResponse(data: number[]): ParsedUDSResponse {
    const responseServiceId = data[0];
    const requestServiceId = responseServiceId - UDSConstants.POSITIVE_RESPONSE_OFFSET;

    const baseResponse: ParsedUDSResponse = {
      isPositive: true,
      service: requestServiceId,
      data: data
    };

    // Parse service-specific response data
    switch (requestServiceId) {
      case UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL:
        return this.parseDiagnosticSessionControlResponse(baseResponse, data);

      case UDSConstants.SERVICES.ECU_RESET:
        return this.parseECUResetResponse(baseResponse, data);

      case UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER:
        return this.parseReadDataByIdentifierResponse(baseResponse, data);

      case UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER:
        return this.parseWriteDataByIdentifierResponse(baseResponse, data);

      case UDSConstants.SERVICES.READ_DTC_INFORMATION:
        return this.parseReadDTCInformationResponse(baseResponse, data);

      case UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION:
        return this.parseClearDiagnosticInformationResponse(baseResponse, data);

      case UDSConstants.SERVICES.SECURITY_ACCESS:
        return this.parseSecurityAccessResponse(baseResponse, data);

      case UDSConstants.SERVICES.TESTER_PRESENT:
        return this.parseTesterPresentResponse(baseResponse, data);

      case UDSConstants.SERVICES.ROUTINE_CONTROL:
        return this.parseRoutineControlResponse(baseResponse, data);

      case UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS:
        return this.parseReadMemoryByAddressResponse(baseResponse, data);

      case UDSConstants.SERVICES.WRITE_MEMORY_BY_ADDRESS:
        return this.parseWriteMemoryByAddressResponse(baseResponse, data);

      case UDSConstants.SERVICES.COMMUNICATION_CONTROL:
        return this.parseCommunicationControlResponse(baseResponse, data);

      default:
        return baseResponse;
    }
  }

  private parseDiagnosticSessionControlResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.sessionType = data[1];
    }
    
    // Parse timing parameters if present
    if (data.length >= 6) {
      const p2ServerMax = (data[2] << 8) | data[3];
      const p2StarServerMax = ((data[4] << 8) | data[5]) * 10; // In units of 10ms
      
      // Add timing info to response
      (baseResponse as any).timingParameters = {
        p2ServerMax,
        p2StarServerMax
      };
    }

    return baseResponse;
  }

  private parseECUResetResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
    }

    // Parse power down time if present
    if (data.length >= 3) {
      (baseResponse as any).powerDownTime = data[2];
    }

    return baseResponse;
  }

  private parseReadDataByIdentifierResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 3) {
      baseResponse.dataIdentifier = (data[1] << 8) | data[2];
      
      // Extract data record (everything after DID)
      if (data.length > 3) {
        (baseResponse as any).dataRecord = data.slice(3);
      }
    }

    return baseResponse;
  }

  private parseWriteDataByIdentifierResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 3) {
      baseResponse.dataIdentifier = (data[1] << 8) | data[2];
    }

    return baseResponse;
  }

  private parseReadDTCInformationResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
    }

    // Parse based on sub-function
    if (baseResponse.subFunction) {
      switch (baseResponse.subFunction) {
        case 0x01: // reportNumberOfDTCByStatusMask
        case 0x07: // reportNumberOfDTCBySeverityMaskRecord
        case 0x11: // reportNumberOfMirrorMemoryDTCByStatusMask
        case 0x12: // reportNumberOfEmissionsOBDDTCByStatusMask
          if (data.length >= 4) {
            baseResponse.dtcCount = (data[3] << 8) | data[4];
          }
          break;

        case 0x02: // reportDTCByStatusMask
        case 0x0A: // reportSupportedDTC
          // Parse DTC records
          (baseResponse as any).dtcRecords = this.parseDTCRecords(data.slice(2));
          break;
      }
    }

    return baseResponse;
  }

  private parseClearDiagnosticInformationResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    // Clear DTC response typically has no additional data
    return baseResponse;
  }

  private parseSecurityAccessResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
      
      // If odd sub-function (request seed), response contains seed
      if ((baseResponse.subFunction & 0x01) === 1 && data.length > 2) {
        (baseResponse as any).securitySeed = data.slice(2);
      }
    }

    return baseResponse;
  }

  private parseTesterPresentResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
    }

    return baseResponse;
  }

  private parseRoutineControlResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
    }

    if (data.length >= 4) {
      baseResponse.routineIdentifier = (data[2] << 8) | data[3];
    }

    // Extract routine status record if present
    if (data.length > 4) {
      (baseResponse as any).routineStatusRecord = data.slice(4);
    }

    return baseResponse;
  }

  private parseReadMemoryByAddressResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    // Data record starts from index 1
    if (data.length > 1) {
      (baseResponse as any).dataRecord = data.slice(1);
    }

    return baseResponse;
  }

  private parseWriteMemoryByAddressResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      (baseResponse as any).addressAndLengthFormatIdentifier = data[1];
    }

    // Parse memory address and size if present
    if (data.length > 2) {
      const alfid = data[1];
      const addressLength = (alfid >> 4) & 0x0F;
      const sizeLength = alfid & 0x0F;
      
      if (data.length >= 2 + addressLength + sizeLength) {
        let memoryAddress = 0;
        for (let i = 0; i < addressLength; i++) {
          memoryAddress = (memoryAddress << 8) | data[2 + i];
        }
        
        let memorySize = 0;
        for (let i = 0; i < sizeLength; i++) {
          memorySize = (memorySize << 8) | data[2 + addressLength + i];
        }
        
        (baseResponse as any).memoryAddress = memoryAddress;
        (baseResponse as any).memorySize = memorySize;
      }
    }

    return baseResponse;
  }

  private parseCommunicationControlResponse(
    baseResponse: ParsedUDSResponse,
    data: number[]
  ): ParsedUDSResponse {
    if (data.length >= 2) {
      baseResponse.subFunction = data[1];
    }

    return baseResponse;
  }

  private parseDTCRecords(data: number[]): Array<{dtc: number, status: number}> {
    const records: Array<{dtc: number, status: number}> = [];
    
    // Each DTC record is 4 bytes (3 bytes DTC + 1 byte status)
    for (let i = 0; i < data.length; i += 4) {
      if (i + 3 < data.length) {
        const dtc = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
        const status = data[i + 3];
        records.push({ dtc, status });
      }
    }
    
    return records;
  }

  // Utility methods for interpreting parsed data
  public static formatDTC(dtc: number): string {
    return `0x${dtc.toString(16).padStart(6, '0').toUpperCase()}`;
  }

  public static formatDataIdentifier(did: number): string {
    return `0x${did.toString(16).padStart(4, '0').toUpperCase()}`;
  }

  public static formatNRC(nrc: number): string {
    const nrcNames: { [key: number]: string } = {
      [UDSConstants.NRC.GENERAL_REJECT]: 'General Reject',
      [UDSConstants.NRC.SERVICE_NOT_SUPPORTED]: 'Service Not Supported',
      [UDSConstants.NRC.SUB_FUNCTION_NOT_SUPPORTED]: 'Sub-Function Not Supported',
      [UDSConstants.NRC.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT]: 'Incorrect Message Length',
      [UDSConstants.NRC.RESPONSE_TOO_LONG]: 'Response Too Long',
      [UDSConstants.NRC.BUSY_REPEAT_REQUEST]: 'Busy Repeat Request',
      [UDSConstants.NRC.CONDITIONS_NOT_CORRECT]: 'Conditions Not Correct',
      [UDSConstants.NRC.SECURITY_ACCESS_DENIED]: 'Security Access Denied',
      [UDSConstants.NRC.INVALID_KEY]: 'Invalid Key',
      [UDSConstants.NRC.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING]: 'Response Pending'
    };

    const name = nrcNames[nrc] || 'Unknown NRC';
    return `${name} (0x${nrc.toString(16).padStart(2, '0').toUpperCase()})`;
  }

  public static interpretDTCStatus(status: number): string[] {
    const statusBits: string[] = [];
    
    if (status & UDSConstants.DTC_STATUS_MASK.TEST_FAILED) {
      statusBits.push('Test Failed');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.TEST_FAILED_THIS_OPERATION_CYCLE) {
      statusBits.push('Test Failed This Operation Cycle');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.PENDING_DTC) {
      statusBits.push('Pending DTC');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.CONFIRMED_DTC) {
      statusBits.push('Confirmed DTC');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.TEST_NOT_COMPLETED_SINCE_LAST_CLEAR) {
      statusBits.push('Test Not Completed Since Last Clear');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.TEST_FAILED_SINCE_LAST_CLEAR) {
      statusBits.push('Test Failed Since Last Clear');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.TEST_NOT_COMPLETED_THIS_OPERATION_CYCLE) {
      statusBits.push('Test Not Completed This Operation Cycle');
    }
    if (status & UDSConstants.DTC_STATUS_MASK.WARNING_INDICATOR_REQUESTED) {
      statusBits.push('Warning Indicator Requested');
    }

    return statusBits;
  }
}