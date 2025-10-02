/**
 * Service 0x10: Diagnostic Session Control
 */

import { ServiceId, DiagnosticSessionType, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class SessionControlService implements ServiceHandler {
  serviceId = ServiceId.DIAGNOSTIC_SESSION_CONTROL;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const sessionType = request.subFunction;

    // Validate session type
    if (!this.isValidSessionType(sessionType)) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }

    // Update session state
    state.currentSession = sessionType;
    state.sessionStartTime = Date.now();

    // Response: [sub-function] [P2Server_max high byte] [P2Server_max low byte] [P2*Server_max high byte] [P2*Server_max low byte]
    const responseData = new Uint8Array([
      sessionType,
      0x00, 0x32, // P2Server_max = 50ms (example)
      0x01, 0xF4, // P2*Server_max = 500ms (example)
    ]);

    return this.createPositiveResponse(responseData);
  }

  private isValidSessionType(sessionType: number): boolean {
    return Object.values(DiagnosticSessionType).includes(sessionType);
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
