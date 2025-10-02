/**
 * UDS Protocol Type Definitions
 */

import { ServiceId, NegativeResponseCode } from './constants';

export interface UDSMessage {
  serviceId: ServiceId;
  subFunction?: number;
  data: Uint8Array;
}

export interface UDSRequest extends UDSMessage {
  suppressPositiveResponse?: boolean;
}

export interface UDSResponse {
  serviceId: ServiceId;
  isPositive: boolean;
  data: Uint8Array;
  nrc?: NegativeResponseCode;
}

export interface DiagnosticSessionState {
  currentSession: number;
  securityLevel: number;
  isSecurityUnlocked: boolean;
  sessionStartTime: number;
}

export interface DTCRecord {
  dtcCode: number;
  statusMask: number;
  environmentalData?: Uint8Array;
}

export interface ServiceHandler {
  serviceId: ServiceId;
  handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse>;
}

export interface ECUConfiguration {
  ecuId: number;
  supportedServices: ServiceId[];
  dataIdentifiers: Map<number, Uint8Array>;
  dtcRecords: DTCRecord[];
  securitySeed?: Uint8Array;
}
