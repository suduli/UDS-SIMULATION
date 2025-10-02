/**
 * Service 0x31: Routine Control
 */

import { ServiceId, NegativeResponseCode, RoutineControlType } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class RoutineControlService implements ServiceHandler {
  serviceId = ServiceId.ROUTINE_CONTROL;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction || request.data.length < 2) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const routineControlType = request.subFunction;
    const routineId = (request.data[0] << 8) | request.data[1];

    if (!Object.values(RoutineControlType).includes(routineControlType)) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }

    const responseData = new Uint8Array([routineControlType, request.data[0], request.data[1], 0x00]);
    return this.createPositiveResponse(responseData);
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
