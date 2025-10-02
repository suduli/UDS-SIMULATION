/**
 * Service 0x2F: Write Memory By Address
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class WriteMemoryByAddressService implements ServiceHandler {
  serviceId = ServiceId.WRITE_MEMORY_BY_ADDRESS;

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
