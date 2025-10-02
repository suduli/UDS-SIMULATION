/**
 * Service 0x3E: Tester Present
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class TesterPresentService implements ServiceHandler {
  serviceId = ServiceId.TESTER_PRESENT;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (request.subFunction !== 0x00) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Response echoes the sub-function
    const responseData = new Uint8Array([0x00]);

    return this.createPositiveResponse(responseData);
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
