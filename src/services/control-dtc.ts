/**
 * Service 0x85: Control DTC Setting
 */

import { ServiceId, NegativeResponseCode } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class ControlDTCSettingService implements ServiceHandler {
  serviceId = ServiceId.CONTROL_DTC_SETTING;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const dtcSettingType = request.subFunction;

    if (dtcSettingType !== 0x01 && dtcSettingType !== 0x02) {
      return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }

    return this.createPositiveResponse(new Uint8Array([dtcSettingType]));
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return { serviceId: this.serviceId, isPositive: true, data };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return { serviceId: this.serviceId, isPositive: false, data: new Uint8Array(0), nrc };
  }
}
