/**
 * Service 0x2E: Write Data By Identifier
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class WriteDataByIdentifierService implements ServiceHandler {
  serviceId = ServiceId.WRITE_DATA_BY_IDENTIFIER;
  private dataIdentifiers: Map<number, Uint8Array>;

  constructor(dataIdentifiers: Map<number, Uint8Array> = new Map()) {
    this.dataIdentifiers = dataIdentifiers;
  }

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (request.data.length < 3) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    if (!state.isSecurityUnlocked) {
      return this.createNegativeResponse(NegativeResponseCode.SECURITY_ACCESS_DENIED);
    }

    const did = (request.data[0] << 8) | request.data[1];
    const newData = request.data.slice(2);

    this.dataIdentifiers.set(did, newData);

    return this.createPositiveResponse(new Uint8Array([request.data[0], request.data[1]]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
