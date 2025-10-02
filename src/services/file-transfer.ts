/**
 * Service 0x38: Request File Transfer
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class RequestFileTransferService implements ServiceHandler {
  serviceId = ServiceId.REQUEST_FILE_TRANSFER;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!state.isSecurityUnlocked) {
      return this.createNegativeResponse(NegativeResponseCode.SECURITY_ACCESS_DENIED);
    }
    return this.createPositiveResponse(new Uint8Array([0x00]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
