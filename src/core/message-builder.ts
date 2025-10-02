/**
 * UDS Message Builder - Constructs UDS messages according to ISO 14229-1
 */

import { ServiceId } from './constants';
import { UDSRequest } from './types';

export class UDSMessageBuilder {
  private serviceId: ServiceId;
  private subFunction?: number;
  private dataBytes: number[] = [];
  private suppressPositiveResponse = false;

  constructor(serviceId: ServiceId) {
    this.serviceId = serviceId;
  }

  withSubFunction(subFunction: number, suppressResponse = false): this {
    this.subFunction = subFunction;
    if (suppressResponse) {
      this.subFunction |= 0x80; // Set suppress positive response bit
      this.suppressPositiveResponse = true;
    }
    return this;
  }

  withData(data: number | number[] | Uint8Array): this {
    if (typeof data === 'number') {
      this.dataBytes.push(data);
    } else if (Array.isArray(data)) {
      this.dataBytes.push(...data);
    } else {
      this.dataBytes.push(...Array.from(data));
    }
    return this;
  }

  withDataIdentifier(did: number): this {
    this.dataBytes.push((did >> 8) & 0xFF, did & 0xFF);
    return this;
  }

  build(): UDSRequest {
    return {
      serviceId: this.serviceId,
      subFunction: this.subFunction,
      data: new Uint8Array(this.dataBytes),
      suppressPositiveResponse: this.suppressPositiveResponse,
    };
  }

  toBytes(): Uint8Array {
    const bytes: number[] = [this.serviceId];
    
    if (this.subFunction !== undefined) {
      bytes.push(this.subFunction);
    }
    
    bytes.push(...this.dataBytes);
    return new Uint8Array(bytes);
  }

  static createSessionControl(sessionType: number): UDSRequest {
    return new UDSMessageBuilder(ServiceId.DIAGNOSTIC_SESSION_CONTROL)
      .withSubFunction(sessionType)
      .build();
  }

  static createECUReset(resetType: number): UDSRequest {
    return new UDSMessageBuilder(ServiceId.ECU_RESET)
      .withSubFunction(resetType)
      .build();
  }

  static createReadDataByIdentifier(did: number): UDSRequest {
    return new UDSMessageBuilder(ServiceId.READ_DATA_BY_IDENTIFIER)
      .withDataIdentifier(did)
      .build();
  }

  static createWriteDataByIdentifier(did: number, data: Uint8Array): UDSRequest {
    return new UDSMessageBuilder(ServiceId.WRITE_DATA_BY_IDENTIFIER)
      .withDataIdentifier(did)
      .withData(data)
      .build();
  }

  static createTesterPresent(suppressResponse = false): UDSRequest {
    return new UDSMessageBuilder(ServiceId.TESTER_PRESENT)
      .withSubFunction(0x00, suppressResponse)
      .build();
  }

  static createSecurityAccessRequest(level: number): UDSRequest {
    return new UDSMessageBuilder(ServiceId.SECURITY_ACCESS)
      .withSubFunction(level)
      .build();
  }

  static createSecurityAccessSendKey(level: number, key: Uint8Array): UDSRequest {
    return new UDSMessageBuilder(ServiceId.SECURITY_ACCESS)
      .withSubFunction(level)
      .withData(key)
      .build();
  }
}
