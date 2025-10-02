/**
 * Service 0x37: Request Transfer Exit
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class RequestTransferExitService implements ServiceHandler {
  serviceId = ServiceId.REQUEST_TRANSFER_EXIT;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    return this.createPositiveResponse(new Uint8Array(0));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
