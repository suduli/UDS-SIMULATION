/**
 * Service 0x24: Read Scaling Data By Identifier
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ReadScalingDataService implements ServiceHandler {
  serviceId = ServiceId.READ_SCALING_DATA_BY_IDENTIFIER;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (request.data.length < 2) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }
    // Simplified stub implementation
    return this.createPositiveResponse(new Uint8Array([request.data[0], request.data[1], 0x00, 0x01]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
