/**
 * UDS Message Parser - Parses UDS messages according to ISO 14229-1
 */

import { ServiceId, NegativeResponseCode, POSITIVE_RESPONSE_OFFSET } from './constants';
import { UDSResponse, UDSRequest } from './types';

export class UDSMessageParser {
  static parseRequest(bytes: Uint8Array): UDSRequest {
    if (bytes.length < 1) {
      throw new Error('Invalid UDS request: message too short');
    }

    const serviceId = bytes[0] as ServiceId;
    let subFunction: number | undefined;
    let dataStart = 1;
    let suppressPositiveResponse = false;

    // Check if service uses sub-function
    if (this.hasSubFunction(serviceId) && bytes.length > 1) {
      subFunction = bytes[1];
      suppressPositiveResponse = (subFunction & 0x80) !== 0;
      subFunction = subFunction & 0x7F; // Clear suppress bit
      dataStart = 2;
    }

    const data = bytes.slice(dataStart);

    return {
      serviceId,
      subFunction,
      data,
      suppressPositiveResponse,
    };
  }

  static parseResponse(bytes: Uint8Array): UDSResponse {
    if (bytes.length < 1) {
      throw new Error('Invalid UDS response: message too short');
    }

    const firstByte = bytes[0];
    
    // Check if negative response (0x7F)
    if (firstByte === 0x7F) {
      if (bytes.length < 3) {
        throw new Error('Invalid negative response: message too short');
      }
      
      const serviceId = bytes[1] as ServiceId;
      const nrc = bytes[2] as NegativeResponseCode;
      
      return {
        serviceId,
        isPositive: false,
        data: bytes.slice(3),
        nrc,
      };
    }

    // Positive response
    const serviceId = (firstByte - POSITIVE_RESPONSE_OFFSET) as ServiceId;
    
    return {
      serviceId,
      isPositive: true,
      data: bytes.slice(1),
    };
  }

  static hasSubFunction(serviceId: ServiceId): boolean {
    const servicesWithSubFunction = [
      ServiceId.DIAGNOSTIC_SESSION_CONTROL,
      ServiceId.ECU_RESET,
      ServiceId.SECURITY_ACCESS,
      ServiceId.COMMUNICATION_CONTROL,
      ServiceId.TESTER_PRESENT,
      ServiceId.CONTROL_DTC_SETTING,
      ServiceId.ROUTINE_CONTROL,
      ServiceId.READ_DATA_BY_PERIODIC_IDENTIFIER,
      ServiceId.DYNAMICALLY_DEFINE_DATA_IDENTIFIER,
      ServiceId.WRITE_DATA_BY_PERIODIC_IDENTIFIER,
    ];

    return servicesWithSubFunction.includes(serviceId);
  }

  static formatMessage(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  static parseDataIdentifier(data: Uint8Array, offset = 0): number {
    if (data.length < offset + 2) {
      throw new Error('Insufficient data for Data Identifier');
    }
    return (data[offset] << 8) | data[offset + 1];
  }
}
