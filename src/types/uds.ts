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
  SAFETY: 0x04,
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

// Communication Control Types (SID 0x28)
export const CommunicationControlType = {
  ENABLE_RX_DISABLE_TX: 0x00,
  ENABLE_RX_AND_TX: 0x01,
  DISABLE_RX_ENABLE_TX: 0x02,
  DISABLE_RX_AND_TX: 0x03,
  ENABLE_RX_DISABLE_TX_ENHANCED: 0x04,
  ENABLE_RX_AND_TX_ENHANCED: 0x05,
} as const;

export type CommunicationControlType = typeof CommunicationControlType[keyof typeof CommunicationControlType];

// Communication Types (what to control)
export const CommunicationType = {
  NORMAL_COMMUNICATION_MESSAGES: 0x01,
  NETWORK_MANAGEMENT_MESSAGES: 0x02,
  BOTH_COMMUNICATION_AND_NM: 0x03,
} as const;

export type CommunicationType = typeof CommunicationType[keyof typeof CommunicationType];

// Communication State (RX/TX status for a communication type)
export interface CommunicationState {
  rxEnabled: boolean;
  txEnabled: boolean;
}

// Complete communication control state tracking
export interface CommunicationControlState {
  normalMessages: CommunicationState;  // 0x01 - Application messages
  networkManagement: CommunicationState;  // 0x02 - NM messages
  subnets: Map<number, {  // Subnet-specific states (optional node ID)
    normalMessages: CommunicationState;
    networkManagement: CommunicationState;
  }>;
}

// DTC Categories
export type DTCCategory = 'powertrain' | 'chassis' | 'body' | 'network';

// SID 19 Subfunctions (Read DTC Information Report Types)
export const DTCReportType = {
  REPORT_NUMBER_BY_STATUS_MASK: 0x01,
  REPORT_DTC_BY_STATUS_MASK: 0x02,
  REPORT_DTC_SNAPSHOT_ID: 0x03,
  REPORT_DTC_SNAPSHOT_BY_DTC_NUMBER: 0x04,
  REPORT_DTC_STORED_DATA_BY_RECORD_NUMBER: 0x05,
  REPORT_DTC_EXT_DATA_BY_DTC_NUMBER: 0x06,
  REPORT_NUMBER_BY_SEVERITY_MASK: 0x07,
  REPORT_DTC_BY_SEVERITY_MASK: 0x08,
  REPORT_SEVERITY_INFO_OF_DTC: 0x09,
  REPORT_SUPPORTED_DTC: 0x0A,
  REPORT_FIRST_TEST_FAILED: 0x0B,
  REPORT_FIRST_CONFIRMED: 0x0C,
  REPORT_MOST_RECENT_TEST_FAILED: 0x0D,
  REPORT_MOST_RECENT_CONFIRMED: 0x0E,
  REPORT_MIRROR_MEMORY_DTC: 0x0F,
} as const;

export type DTCReportType = typeof DTCReportType[keyof typeof DTCReportType];

// DTC Severity Levels per ISO 14229
export const DTCSeverity = {
  NO_SEVERITY: 0x00,
  MAINTENANCE_ONLY: 0x20,
  CHECK_AT_NEXT_HALT: 0x40,
  CHECK_IMMEDIATELY: 0x60,
} as const;

export type DTCSeverity = typeof DTCSeverity[keyof typeof DTCSeverity];

// DTC Snapshot Record (Freeze Frame Data)
export interface DTCSnapshotRecord {
  recordNumber: number;
  timestamp: number;
  data: {
    vehicleSpeed: number;      // km/h
    engineRPM: number;         // RPM
    coolantTemp: number;       // °C
    throttlePosition: number;  // %
    fuelLevel: number;         // %
    batteryVoltage: number;    // V
    engineLoad: number;        // %
    intakeAirTemp: number;     // °C
    oilPressure: number;       // kPa
    ambientTemp: number;       // °C
  };
}

// DTC Extended Data Record
export interface DTCExtendedDataRecord {
  recordNumber: number;
  occurrenceCounter: number;     // How many times fault occurred
  agingCounter: number;          // Cycles since last failure (for aging out)
  agedCounter: number;           // Times DTC has aged out
  selfHealingCounter: number;    // Self-healing cycles
  failedSinceLastClear: boolean;
  testNotCompleted: boolean;
  customData?: number[];         // OEM-specific data
}

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
  requiredSession?: DiagnosticSessionType[];  // Sessions that allow this DID (undefined = all sessions)
  requiredSecurity?: number;                   // Security level required (0 or undefined = no security needed)
}

// DTC Information
export interface DTCInfo {
  code: number;                              // 3-byte DTC code
  status: DTCStatusMask;                     // 8-bit status byte
  severity: 'low' | 'medium' | 'high' | 'critical';  // Severity classification
  severityByte?: DTCSeverity;                // ISO 14229 severity byte
  category: DTCCategory;                     // P/C/B/U category
  description: string;                       // Human-readable description
  occurrenceCounter: number;                 // Number of times fault occurred
  agingCounter: number;                      // Aging cycles since last failure
  firstFailureTimestamp?: number;            // When DTC first failed
  mostRecentFailureTimestamp?: number;       // Most recent failure
  snapshots?: DTCSnapshotRecord[];           // Freeze frame data records
  extendedData?: DTCExtendedDataRecord[];    // Extended data records
  // Legacy support - raw byte arrays (optional)
  snapshotRaw?: number[];
  extendedDataRaw?: number[];
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
  suppressedResponse?: boolean; // True when suppress positive response bit (0x80) was set
  resetType?: ECUResetType;     // ECU Reset type for power effect coordination (SID 11)
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
  communicationControlState: CommunicationControlState;  // SID 0x28 state tracking
  activePeriodicIds: number[];
  downloadInProgress: boolean;
  uploadInProgress: boolean;
  transferBlockCounter: number;
  // Rapid Power Shutdown (RPS) state - SID 11 subfunction 0x04/0x05
  rpsEnabled: boolean;
  rpsPowerDownTime: number;  // Power-down time in 10ms units (0-255)
  // Security Access timing and state tracking (SID 0x27)
  lastSeedRequestTime: number;        // Timestamp of last seed request
  lastSeedRequestLevel: number;       // Level (odd sub-function) of last seed request
  lastInvalidKeyTime: number;         // Timestamp of last invalid key attempt
  securityDelayActive: boolean;       // Whether 10s delay is active
  seedTimeout: number;                // Seed validity timeout (5000ms)
  securityDelayDuration: number;      // Delay after invalid key (10000ms)
}

// Memory Address Interface
export interface MemoryAddress {
  address: number;
  size: number;
  data?: number[];
}

// Memory Region Interface (extends MemoryAddress with security and access control)
// Used by SID 0x23 (Read Memory By Address) for region validation
export interface MemoryRegion extends MemoryAddress {
  name: string;
  securityLevel: number;  // 0 = public, 1+ = requires security unlock
  accessible: boolean;    // false for reserved/forbidden regions
  description: string;
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
