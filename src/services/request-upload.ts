/**
 * Service 0x35: Request Upload
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class RequestUploadService implements ServiceHandler {
  serviceId = ServiceId.REQUEST_UPLOAD;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!state.isSecurityUnlocked) {
      return this.createNegativeResponse(NegativeResponseCode.SECURITY_ACCESS_DENIED);
    }
    return this.createPositiveResponse(new Uint8Array([0x20, 0x10, 0x00]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
