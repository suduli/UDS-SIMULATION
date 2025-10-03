// UDS Protocol core implementation with SID codec and NRC mapping
// ISO 14229-1 compliant

export interface UDSServiceRequest {
  sid: number;
  subFunction?: number;
  data: Uint8Array;
  transport: 'CAN' | 'DoIP';
  securityLevelRequired: 'default' | 'supplier' | 'oem';
  expectedNrc: number[];
}

export interface UDSServiceResponse {
  sid: number;
  data: Uint8Array;
  isPositive: boolean;
  nrc?: number;
}

// ISO 14229 Service Identifiers
export enum ServiceIdentifier {
  DiagnosticSessionControl = 0x10,
  ECUReset = 0x11,
  ClearDiagnosticInformation = 0x14,
  ReadDTCInformation = 0x19,
  ReadDataByIdentifier = 0x22,
  ReadMemoryByAddress = 0x23,
  ReadScalingDataByIdentifier = 0x24,
  SecurityAccess = 0x27,
  CommunicationControl = 0x28,
  ReadDataByPeriodicIdentifier = 0x2a,
  DynamicallyDefineDataIdentifier = 0x2c,
  WriteDataByIdentifier = 0x2e,
  WriteMemoryByAddress = 0x3d,
  RoutineControl = 0x31,
  RequestDownload = 0x34,
  RequestUpload = 0x35,
  TransferData = 0x36,
  RequestTransferExit = 0x37,
  TesterPresent = 0x3e,
  ControlDTCSetting = 0x85,
}

// ISO 14229 Negative Response Codes
export enum NegativeResponseCode {
  GeneralReject = 0x10,
  ServiceNotSupported = 0x11,
  SubFunctionNotSupported = 0x12,
  IncorrectMessageLengthOrInvalidFormat = 0x13,
  ResponseTooLong = 0x14,
  BusyRepeatRequest = 0x21,
  ConditionsNotCorrect = 0x22,
  RequestSequenceError = 0x24,
  NoResponseFromSubnetComponent = 0x25,
  FailurePreventsExecutionOfRequestedAction = 0x26,
  RequestOutOfRange = 0x31,
  SecurityAccessDenied = 0x33,
  InvalidKey = 0x35,
  ExceedNumberOfAttempts = 0x36,
  RequiredTimeDelayNotExpired = 0x37,
  UploadDownloadNotAccepted = 0x70,
  TransferDataSuspended = 0x71,
  GeneralProgrammingFailure = 0x72,
  WrongBlockSequenceCounter = 0x73,
  RequestCorrectlyReceivedResponsePending = 0x78,
  SubFunctionNotSupportedInActiveSession = 0x7e,
  ServiceNotSupportedInActiveSession = 0x7f,
}

export class UDSProtocol {
  /**
   * Encode a UDS service request into raw bytes
   */
  static encodeRequest(request: UDSServiceRequest): Uint8Array {
    const payload: number[] = [request.sid];

    if (request.subFunction !== undefined) {
      payload.push(request.subFunction);
    }

    if (request.data.length > 0) {
      payload.push(...Array.from(request.data));
    }

    return new Uint8Array(payload);
  }

  /**
   * Decode a raw UDS response into structured format
   */
  static decodeResponse(rawData: Uint8Array): UDSServiceResponse {
    if (rawData.length === 0) {
      throw new Error('Empty response data');
    }

    const firstByte = rawData[0];
    const isPositive = firstByte !== 0x7f;

    if (isPositive) {
      // Positive response: first byte is SID + 0x40
      return {
        sid: firstByte - 0x40,
        data: rawData.slice(1),
        isPositive: true,
      };
    }

    // Negative response: 0x7F <requested SID> <NRC>
    if (rawData.length < 3) {
      throw new Error('Invalid negative response format');
    }

    return {
      sid: rawData[1],
      data: new Uint8Array(),
      isPositive: false,
      nrc: rawData[2],
    };
  }

  /**
   * Get human-readable NRC description
   */
  static getNRCDescription(nrc: number): string {
    const descriptions: Record<number, string> = {
      [NegativeResponseCode.GeneralReject]: 'General reject',
      [NegativeResponseCode.ServiceNotSupported]: 'Service not supported',
      [NegativeResponseCode.SubFunctionNotSupported]: 'Sub-function not supported',
      [NegativeResponseCode.IncorrectMessageLengthOrInvalidFormat]:
        'Incorrect message length or invalid format',
      [NegativeResponseCode.ResponseTooLong]: 'Response too long',
      [NegativeResponseCode.BusyRepeatRequest]: 'Busy, repeat request',
      [NegativeResponseCode.ConditionsNotCorrect]: 'Conditions not correct',
      [NegativeResponseCode.RequestSequenceError]: 'Request sequence error',
      [NegativeResponseCode.NoResponseFromSubnetComponent]: 'No response from subnet component',
      [NegativeResponseCode.FailurePreventsExecutionOfRequestedAction]:
        'Failure prevents execution of requested action',
      [NegativeResponseCode.RequestOutOfRange]: 'Request out of range',
      [NegativeResponseCode.SecurityAccessDenied]: 'Security access denied',
      [NegativeResponseCode.InvalidKey]: 'Invalid key',
      [NegativeResponseCode.ExceedNumberOfAttempts]: 'Exceed number of attempts',
      [NegativeResponseCode.RequiredTimeDelayNotExpired]: 'Required time delay not expired',
      [NegativeResponseCode.UploadDownloadNotAccepted]: 'Upload/Download not accepted',
      [NegativeResponseCode.TransferDataSuspended]: 'Transfer data suspended',
      [NegativeResponseCode.GeneralProgrammingFailure]: 'General programming failure',
      [NegativeResponseCode.WrongBlockSequenceCounter]: 'Wrong block sequence counter',
      [NegativeResponseCode.RequestCorrectlyReceivedResponsePending]:
        'Request correctly received, response pending',
      [NegativeResponseCode.SubFunctionNotSupportedInActiveSession]:
        'Sub-function not supported in active session',
      [NegativeResponseCode.ServiceNotSupportedInActiveSession]:
        'Service not supported in active session',
    };

    return descriptions[nrc] || `Unknown NRC: 0x${nrc.toString(16).toUpperCase()}`;
  }

  /**
   * Get human-readable service name
   */
  static getServiceName(sid: number): string {
    const names: Record<number, string> = {
      [ServiceIdentifier.DiagnosticSessionControl]: 'DiagnosticSessionControl',
      [ServiceIdentifier.ECUReset]: 'ECUReset',
      [ServiceIdentifier.ClearDiagnosticInformation]: 'ClearDiagnosticInformation',
      [ServiceIdentifier.ReadDTCInformation]: 'ReadDTCInformation',
      [ServiceIdentifier.ReadDataByIdentifier]: 'ReadDataByIdentifier',
      [ServiceIdentifier.ReadMemoryByAddress]: 'ReadMemoryByAddress',
      [ServiceIdentifier.ReadScalingDataByIdentifier]: 'ReadScalingDataByIdentifier',
      [ServiceIdentifier.SecurityAccess]: 'SecurityAccess',
      [ServiceIdentifier.CommunicationControl]: 'CommunicationControl',
      [ServiceIdentifier.ReadDataByPeriodicIdentifier]: 'ReadDataByPeriodicIdentifier',
      [ServiceIdentifier.DynamicallyDefineDataIdentifier]: 'DynamicallyDefineDataIdentifier',
      [ServiceIdentifier.WriteDataByIdentifier]: 'WriteDataByIdentifier',
      [ServiceIdentifier.WriteMemoryByAddress]: 'WriteMemoryByAddress',
      [ServiceIdentifier.RoutineControl]: 'RoutineControl',
      [ServiceIdentifier.RequestDownload]: 'RequestDownload',
      [ServiceIdentifier.RequestUpload]: 'RequestUpload',
      [ServiceIdentifier.TransferData]: 'TransferData',
      [ServiceIdentifier.RequestTransferExit]: 'RequestTransferExit',
      [ServiceIdentifier.TesterPresent]: 'TesterPresent',
      [ServiceIdentifier.ControlDTCSetting]: 'ControlDTCSetting',
    };

    return names[sid] || `Unknown Service: 0x${sid.toString(16).toUpperCase()}`;
  }

  /**
   * Validate SID is within ISO 14229 range
   */
  static isValidSID(sid: number): boolean {
    return sid >= 0x10 && sid <= 0xff;
  }

  /**
   * Check if response matches expected NRC
   */
  static matchesExpectedNRC(response: UDSServiceResponse, expectedNrcs: number[]): boolean {
    if (response.isPositive) {
      return expectedNrcs.length === 0;
    }

    return response.nrc !== undefined && expectedNrcs.includes(response.nrc);
  }
}
