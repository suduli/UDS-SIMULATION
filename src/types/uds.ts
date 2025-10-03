/**
 * UDS Protocol Type Definitions
 * Comprehensive type system for Unified Diagnostic Services
 */

// Service Identifiers (SID)
export const ServiceId = {
  DIAGNOSTIC_SESSION_CONTROL: 0x10,
  ECU_RESET: 0x11,
  CLEAR_DIAGNOSTIC_INFORMATION: 0x14,
  READ_DTC_INFORMATION: 0x19,
  READ_DATA_BY_IDENTIFIER: 0x22,
  READ_MEMORY_BY_ADDRESS: 0x23,
  SECURITY_ACCESS: 0x27,
  COMMUNICATION_CONTROL: 0x28,
  READ_DATA_BY_PERIODIC_IDENTIFIER: 0x2A,
  WRITE_DATA_BY_IDENTIFIER: 0x2E,
  WRITE_MEMORY_BY_ADDRESS: 0x3D,
  ROUTINE_CONTROL: 0x31,
  REQUEST_DOWNLOAD: 0x34,
  REQUEST_UPLOAD: 0x35,
  TRANSFER_DATA: 0x36,
  REQUEST_TRANSFER_EXIT: 0x37,
} as const;

export type ServiceId = typeof ServiceId[keyof typeof ServiceId];

// Negative Response Codes (NRC)
export const NegativeResponseCode = {
  GENERAL_REJECT: 0x10,
  SERVICE_NOT_SUPPORTED: 0x11,
  SUB_FUNCTION_NOT_SUPPORTED: 0x12,
  INCORRECT_MESSAGE_LENGTH: 0x13,
  RESPONSE_TOO_LONG: 0x14,
  BUSY_REPEAT_REQUEST: 0x21,
  CONDITIONS_NOT_CORRECT: 0x22,
  REQUEST_SEQUENCE_ERROR: 0x24,
  REQUEST_OUT_OF_RANGE: 0x31,
  SECURITY_ACCESS_DENIED: 0x33,
  INVALID_KEY: 0x35,
  EXCEED_NUMBER_OF_ATTEMPTS: 0x36,
  REQUIRED_TIME_DELAY_NOT_EXPIRED: 0x37,
  UPLOAD_DOWNLOAD_NOT_ACCEPTED: 0x70,
  TRANSFER_DATA_SUSPENDED: 0x71,
  GENERAL_PROGRAMMING_FAILURE: 0x72,
  WRONG_BLOCK_SEQUENCE_COUNTER: 0x73,
  REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING: 0x78,
  SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION: 0x7E,
  SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION: 0x7F,
} as const;

export type NegativeResponseCode = typeof NegativeResponseCode[keyof typeof NegativeResponseCode];

// Diagnostic Session Types
export const DiagnosticSessionType = {
  DEFAULT: 0x01,
  PROGRAMMING: 0x02,
  EXTENDED: 0x03,
} as const;

export type DiagnosticSessionType = typeof DiagnosticSessionType[keyof typeof DiagnosticSessionType];

// ECU Reset Types
export const ECUResetType = {
  HARD_RESET: 0x01,
  KEY_OFF_ON_RESET: 0x02,
  SOFT_RESET: 0x03,
  ENABLE_RAPID_POWER_SHUTDOWN: 0x04,
  DISABLE_RAPID_POWER_SHUTDOWN: 0x05,
} as const;

export type ECUResetType = typeof ECUResetType[keyof typeof ECUResetType];

// Routine Control Types
export const RoutineControlType = {
  START_ROUTINE: 0x01,
  STOP_ROUTINE: 0x02,
  REQUEST_ROUTINE_RESULTS: 0x03,
} as const;

export type RoutineControlType = typeof RoutineControlType[keyof typeof RoutineControlType];

// Security Access Types
export const SecurityAccessType = {
  REQUEST_SEED: 0x01,
  SEND_KEY: 0x02,
} as const;

export type SecurityAccessType = typeof SecurityAccessType[keyof typeof SecurityAccessType];

// DTC Status Masks
export interface DTCStatusMask {
  testFailed: boolean;
  testFailedThisOperationCycle: boolean;
  pendingDTC: boolean;
  confirmedDTC: boolean;
  testNotCompletedSinceLastClear: boolean;
  testFailedSinceLastClear: boolean;
  testNotCompletedThisOperationCycle: boolean;
  warningIndicatorRequested: boolean;
}

// Data Identifier Interface
export interface DataIdentifier {
  id: number;
  name: string;
  description: string;
  value: string | number | number[];
  unit?: string;
  format: 'hex' | 'dec' | 'ascii' | 'binary';
}

// DTC Information
export interface DTCInfo {
  code: number;
  status: DTCStatusMask;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  snapshot?: number[];
  extendedData?: number[];
}

// UDS Request/Response Base Interfaces
export interface UDSRequest {
  sid: ServiceId;
  subFunction?: number;
  data?: number[];
  timestamp: number;
}

export interface UDSResponse {
  sid: ServiceId;
  data: number[];
  timestamp: number;
  isNegative: boolean;
  nrc?: NegativeResponseCode;
}

// Protocol State
export interface ProtocolState {
  currentSession: DiagnosticSessionType;
  securityLevel: number;
  securityUnlocked: boolean;
  securityAttempts: number;
  lastActivityTime: number;
  sessionTimeout: number;
  communicationEnabled: boolean;
  activePeriodicIds: number[];
  downloadInProgress: boolean;
  uploadInProgress: boolean;
  transferBlockCounter: number;
}

// Memory Address Interface
export interface MemoryAddress {
  address: number;
  size: number;
  data?: number[];
}

// Routine Interface
export interface Routine {
  id: number;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  results?: number[];
}

// ECU Configuration
export interface ECUConfig {
  id: string;
  name: string;
  supportedServices: ServiceId[];
  dataIdentifiers: DataIdentifier[];
  dtcs: DTCInfo[];
  routines: Routine[];
  memoryMap: MemoryAddress[];
  securitySeed?: number[];
  securityKey?: number[];
}

// Scenario for save/load
export interface Scenario {
  id: string;
  name: string;
  description: string;
  requests: UDSRequest[];
  ecuConfig?: Partial<ECUConfig>;
  createdAt: number;
}

// Protocol Timing
export interface ProtocolTiming {
  P2_CLIENT: number;  // Default timing (50ms)
  P2_STAR_CLIENT: number;  // Extended timing (5000ms)
  S3_CLIENT: number;  // Session timeout (5000ms)
}

// Challenge-Response for Security Access
export interface SecurityChallenge {
  seed: number[];
  expectedKey: number[];
  algorithm: 'xor' | 'add' | 'custom';
}

// Export utility type for hex string
export type HexString = string;

// Export helper for converting between formats
export interface FormatConverter {
  toHex: (data: number[]) => HexString;
  fromHex: (hex: HexString) => number[];
  toASCII: (data: number[]) => string;
  fromASCII: (ascii: string) => number[];
}
