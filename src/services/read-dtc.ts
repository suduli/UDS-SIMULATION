/**
 * Service 0x19: Read DTC Information
 */

import { ServiceId, NegativeResponseCode, DTCStatusMask } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler, DTCRecord } from '../core/types';

export class ReadDTCService implements ServiceHandler {
  serviceId = ServiceId.READ_DTC_INFORMATION;
  private dtcRecords: DTCRecord[] = [];

  constructor(dtcRecords: DTCRecord[] = []) {
    this.dtcRecords = dtcRecords;
  }

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const reportType = request.subFunction;

    switch (reportType) {
      case 0x01: // reportNumberOfDTCByStatusMask
        return this.reportNumberOfDTC(request);
      case 0x02: // reportDTCByStatusMask
        return this.reportDTCByStatusMask(request);
      case 0x04: // reportDTCSnapshotRecordByDTCNumber
        return this.reportDTCSnapshot(request);
      case 0x06: // reportDTCExtendedDataRecordByDTCNumber
        return this.reportDTCExtendedData(request);
      default:
        return this.createNegativeResponse(NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED);
    }
  }

  private reportNumberOfDTC(request: UDSRequest): UDSResponse {
    if (request.data.length < 1) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const statusMask = request.data[0];
    const filteredDTCs = this.dtcRecords.filter(dtc => (dtc.statusMask & statusMask) !== 0);

    const responseData = new Uint8Array([
      request.subFunction!,
      statusMask,
      DTCStatusMask.TEST_FAILED | DTCStatusMask.CONFIRMED_DTC, // DTCFormatIdentifier
      (filteredDTCs.length >> 8) & 0xFF,
      filteredDTCs.length & 0xFF,
    ]);

    return this.createPositiveResponse(responseData);
  }

  private reportDTCByStatusMask(request: UDSRequest): UDSResponse {
    if (request.data.length < 1) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const statusMask = request.data[0];
    const filteredDTCs = this.dtcRecords.filter(dtc => (dtc.statusMask & statusMask) !== 0);

    const responseBytes: number[] = [request.subFunction!, statusMask];

    for (const dtc of filteredDTCs) {
      responseBytes.push(
        (dtc.dtcCode >> 16) & 0xFF,
        (dtc.dtcCode >> 8) & 0xFF,
        dtc.dtcCode & 0xFF,
        dtc.statusMask
      );
    }

    return this.createPositiveResponse(new Uint8Array(responseBytes));
  }

  private reportDTCSnapshot(request: UDSRequest): UDSResponse {
    // Simplified implementation
    return this.createNegativeResponse(NegativeResponseCode.REQUEST_OUT_OF_RANGE);
  }

  private reportDTCExtendedData(request: UDSRequest): UDSResponse {
    // Simplified implementation
    return this.createNegativeResponse(NegativeResponseCode.REQUEST_OUT_OF_RANGE);
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
