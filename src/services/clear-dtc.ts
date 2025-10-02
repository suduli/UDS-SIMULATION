/**
 * Service 0x14: Clear Diagnostic Information
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ClearDTCService implements ServiceHandler {
  serviceId = ServiceId.CLEAR_DIAGNOSTIC_INFORMATION;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    // Request format: [groupOfDTC 3 bytes]
    if (request.data.length < 3) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    // Check if allowed in current session
    if (state.currentSession === 0x01) {
      return this.createNegativeResponse(NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION);
    }

    const groupOfDTC = (request.data[0] << 16) | (request.data[1] << 8) | request.data[2];

    // 0xFFFFFF means all DTCs
    if (groupOfDTC === 0xFFFFFF) {
      // Clear all DTCs
    } else {
      // Clear specific DTC group
    }

    // Positive response has no data
    return this.createPositiveResponse(new Uint8Array(0));
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
