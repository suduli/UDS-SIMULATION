/**
 * Service 0x36: Transfer Data
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class TransferDataService implements ServiceHandler {
  serviceId = ServiceId.TRANSFER_DATA;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (request.data.length < 1) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }
    return this.createPositiveResponse(new Uint8Array([request.data[0]]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
