// Message parser for UDS responses

import type { UDSServiceResponse } from './uds-protocol';
import { UDSProtocol } from './uds-protocol';

export class MessageParser {
  /**
   * Parse raw UDS response bytes
   */
  static parse(rawData: Uint8Array): UDSServiceResponse {
    return UDSProtocol.decodeResponse(rawData);
  }

  /**
   * Parse and format response data based on service type
   */
  static parseServiceData(response: UDSServiceResponse): Record<string, unknown> {
    if (!response.isPositive) {
      return {
        nrc: response.nrc,
        description: response.nrc ? UDSProtocol.getNRCDescription(response.nrc) : 'Unknown error',
      };
    }

    // Service-specific parsing would go here
    // For now, return raw data
    return {
      sid: response.sid,
      data: Array.from(response.data),
    };
  }

  /**
   * Extract data identifier from ReadDataByIdentifier response
   */
  static parseReadDataByIdentifier(response: UDSServiceResponse): {
    dataIdentifier: number;
    value: Uint8Array;
  } | null {
    if (!response.isPositive || response.data.length < 2) {
      return null;
    }

    // eslint-disable-next-line no-bitwise
    const dataIdentifier = (response.data[0] << 8) | response.data[1];
    const value = response.data.slice(2);

    return { dataIdentifier, value };
  }

  /**
   * Parse DTC information from ReadDTCInformation response
   */
  static parseReadDTCInformation(response: UDSServiceResponse): {
    dtcCount: number;
    dtcs: Array<{ code: number; statusMask: number }>;
  } | null {
    if (!response.isPositive) {
      return null;
    }

    const dtcs: Array<{ code: number; statusMask: number }> = [];
    let offset = 0;

    while (offset + 3 < response.data.length) {
      /* eslint-disable no-bitwise */
      const code =
        (response.data[offset] << 16) |
        (response.data[offset + 1] << 8) |
        response.data[offset + 2];
      /* eslint-enable no-bitwise */
      const statusMask = response.data[offset + 3];

      dtcs.push({ code, statusMask });
      offset += 4;
    }

    return {
      dtcCount: dtcs.length,
      dtcs,
    };
  }
}
