/**
 * Service 0x23: Read Memory By Address
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ReadMemoryByAddressService implements ServiceHandler {
  serviceId = ServiceId.READ_MEMORY_BY_ADDRESS;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (request.data.length < 2) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }
    // Simplified stub implementation
    return this.createPositiveResponse(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
