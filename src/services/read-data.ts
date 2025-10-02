/**
 * Service 0x22: Read Data By Identifier
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ReadDataByIdentifierService implements ServiceHandler {
  serviceId = ServiceId.READ_DATA_BY_IDENTIFIER;
  private dataIdentifiers: Map<number, Uint8Array>;

  constructor(dataIdentifiers: Map<number, Uint8Array> = new Map()) {
    this.dataIdentifiers = dataIdentifiers;
  }

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    // Request format: [DID high][DID low] [DID high][DID low] ...
    if (request.data.length < 2 || request.data.length % 2 !== 0) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const responseBytes: number[] = [];

    // Process each DID
    for (let i = 0; i < request.data.length; i += 2) {
      const did = (request.data[i] << 8) | request.data[i + 1];
      
      const data = this.dataIdentifiers.get(did);
      if (!data) {
        return this.createNegativeResponse(NegativeResponseCode.REQUEST_OUT_OF_RANGE);
      }

      // Add DID and data to response
      responseBytes.push(request.data[i], request.data[i + 1]);
      responseBytes.push(...Array.from(data));
    }

    return this.createPositiveResponse(new Uint8Array(responseBytes));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return {
      serviceId: this.serviceId,
      isPositive: true,
      data,
    };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return {
      serviceId: this.serviceId,
      isPositive: false,
      data: new Uint8Array(0),
      nrc,
    };
  }
}
