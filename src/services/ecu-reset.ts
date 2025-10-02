/**
 * Service 0x11: ECU Reset
 */

import { ServiceId, ECUResetType, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ECUResetService implements ServiceHandler {
  serviceId = ServiceId.ECU_RESET;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const resetType = request.subFunction;

    // Validate reset type
    if (!Object.values(ECUResetType).includes(resetType)) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Check if reset is allowed in current session
    if (state.currentSession === 0x01 && resetType !== ECUResetType.HARD_RESET) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION);
    }

    // Simulate reset delay in milliseconds
    const powerDownTime = 0xFF; // 255ms example

    const responseData = new Uint8Array([resetType, powerDownTime]);

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
