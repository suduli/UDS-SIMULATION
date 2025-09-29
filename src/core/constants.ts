/**
 * UDS Protocol Constants
 * Unified Diagnostic Services constants according to ISO 14229-1
 */

export const UDSConstants = {
  // UDS Service Identifiers (SID)
  SERVICES: {
    DIAGNOSTIC_SESSION_CONTROL: 0x10,
    ECU_RESET: 0x11,
    CLEAR_DIAGNOSTIC_INFORMATION: 0x14,
    READ_DTC_INFORMATION: 0x19,
    READ_DATA_BY_IDENTIFIER: 0x22,
    READ_MEMORY_BY_ADDRESS: 0x23,
    READ_SCALING_DATA_BY_IDENTIFIER: 0x24,
    SECURITY_ACCESS: 0x27,
    COMMUNICATION_CONTROL: 0x28,
    READ_DATA_BY_PERIODIC_IDENTIFIER: 0x2A,
    DYNAMICALLY_DEFINE_DATA_IDENTIFIER: 0x2C,
    WRITE_DATA_BY_IDENTIFIER: 0x2E,
    WRITE_MEMORY_BY_ADDRESS: 0x2F,
    ROUTINE_CONTROL: 0x31,
    REQUEST_DOWNLOAD: 0x34,
    REQUEST_UPLOAD: 0x35,
    TRANSFER_DATA: 0x36,
    REQUEST_TRANSFER_EXIT: 0x37,
    REQUEST_FILE_TRANSFER: 0x38,
    WRITE_DATA_BY_PERIODIC_IDENTIFIER: 0x3D,
    TESTER_PRESENT: 0x3E,
    CONTROL_DTC_SETTING: 0x85
  },

  // Positive Response SID offset
  POSITIVE_RESPONSE_OFFSET: 0x40,

  // Negative Response Code (NRC)
  NEGATIVE_RESPONSE_CODE: 0x7F,

  // Common NRC values
  NRC: {
    GENERAL_REJECT: 0x10,
    SERVICE_NOT_SUPPORTED: 0x11,
    SUB_FUNCTION_NOT_SUPPORTED: 0x12,
    INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT: 0x13,
    RESPONSE_TOO_LONG: 0x14,
    BUSY_REPEAT_REQUEST: 0x21,
    CONDITIONS_NOT_CORRECT: 0x22,
    REQUEST_SEQUENCE_ERROR: 0x24,
    NO_RESPONSE_FROM_SUBNET_COMPONENT: 0x25,
    FAILURE_PREVENTS_EXECUTION_OF_REQUESTED_ACTION: 0x26,
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
    SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION: 0x7F
  },

  // Diagnostic Session Types
  SESSION_TYPES: {
    DEFAULT_SESSION: 0x01,
    PROGRAMMING_SESSION: 0x02,
    EXTENDED_DIAGNOSTIC_SESSION: 0x03,
    SAFETY_SYSTEM_DIAGNOSTIC_SESSION: 0x04
  },

  // ECU Reset Types
  RESET_TYPES: {
    HARD_RESET: 0x01,
    KEY_OFF_ON_RESET: 0x02,
    SOFT_RESET: 0x03,
    ENABLE_RAPID_POWER_SHUTDOWN: 0x04,
    DISABLE_RAPID_POWER_SHUTDOWN: 0x05
  },

  // Security Access Types
  SECURITY_ACCESS: {
    REQUEST_SEED: 0x01,
    SEND_KEY: 0x02
  },

  // Communication Control Types
  COMMUNICATION_CONTROL: {
    ENABLE_RX_AND_TX: 0x00,
    ENABLE_RX_AND_DISABLE_TX: 0x01,
    DISABLE_RX_AND_ENABLE_TX: 0x02,
    DISABLE_RX_AND_TX: 0x03
  },

  // Routine Control Types
  ROUTINE_CONTROL: {
    START_ROUTINE: 0x01,
    STOP_ROUTINE: 0x02,
    REQUEST_ROUTINE_RESULTS: 0x03
  },

  // DTC Status Mask Bits
  DTC_STATUS_MASK: {
    TEST_FAILED: 0x01,
    TEST_FAILED_THIS_OPERATION_CYCLE: 0x02,
    PENDING_DTC: 0x04,
    CONFIRMED_DTC: 0x08,
    TEST_NOT_COMPLETED_SINCE_LAST_CLEAR: 0x10,
    TEST_FAILED_SINCE_LAST_CLEAR: 0x20,
    TEST_NOT_COMPLETED_THIS_OPERATION_CYCLE: 0x40,
    WARNING_INDICATOR_REQUESTED: 0x80
  },

  // Common Data Identifiers
  DATA_IDENTIFIERS: {
    // Vehicle Identification
    VIN: 0xF190,
    ECU_SERIAL_NUMBER: 0xF18C,
    ECU_MANUFACTURING_DATE: 0xF18B,
    ECU_MANUFACTURING_NAME: 0xF18A,
    
    // Software Information
    APPLICATION_SOFTWARE_IDENTIFICATION: 0xF181,
    APPLICATION_DATA_IDENTIFICATION: 0xF182,
    BOOT_SOFTWARE_IDENTIFICATION: 0xF183,
    APPLICATION_SOFTWARE_FINGERPRINT: 0xF184,
    
    // Hardware Information
    ECU_HARDWARE_NUMBER: 0xF191,
    ECU_HARDWARE_VERSION_NUMBER: 0xF192,
    SYSTEM_SUPPLIER_IDENTIFIER: 0xF193,
    
    // Diagnostic Information
    SUPPORTED_FUNCTIONAL_UNITS: 0xF1A0,
    VEHICLE_MANUFACTURER_SPECIFIC: 0xF1A1,
    
    // Network Information
    ACTIVE_DIAGNOSTIC_SESSION: 0xF186,
    MANUFACTURER_SPECIFIC_DID_RANGE_START: 0xF010,
    MANUFACTURER_SPECIFIC_DID_RANGE_END: 0xF0FF
  },

  // Timing Parameters (in milliseconds)
  TIMING: {
    P2_CLIENT_MAX: 50,          // Default P2 client timeout
    P2_STAR_CLIENT_MAX: 5000,   // Default P2* client timeout
    P2_SERVER_MAX: 25,          // Default P2 server timeout
    P2_STAR_SERVER_MAX: 5000,   // Default P2* server timeout
    S3_CLIENT: 5000,            // S3 client timeout
    S3_SERVER: 5000             // S3 server timeout
  },

  // Message Length Constraints
  MESSAGE_LENGTH: {
    MIN_REQUEST: 2,             // Minimum request length (SID + at least one parameter)
    MAX_REQUEST: 4095,          // Maximum request length for DoIP
    MAX_CAN_FRAME: 8,           // Maximum CAN frame data length
    MAX_ISO_TP_SINGLE_FRAME: 7  // Maximum ISO-TP single frame data length
  },

  // Addressing
  ADDRESSING: {
    PHYSICAL_ADDRESSING: 0,
    FUNCTIONAL_ADDRESSING: 1,
    DEFAULT_TESTER_ADDRESS: 0xF1,
    DEFAULT_ECU_ADDRESS: 0x10
  }
} as const;

// Service Information with metadata
export const UDSServiceInfo = {
  [UDSConstants.SERVICES.DIAGNOSTIC_SESSION_CONTROL]: {
    name: 'Diagnostic Session Control',
    description: 'Control diagnostic session state',
    icon: '🔄',
    category: 'Session',
    minLength: 2,
    maxLength: 2,
    supportedSessions: ['default', 'programming', 'extended'],
    securityRequired: false
  },
  [UDSConstants.SERVICES.ECU_RESET]: {
    name: 'ECU Reset',
    description: 'Reset ECU functionality',
    icon: '🔄',
    category: 'Session',
    minLength: 2,
    maxLength: 2,
    supportedSessions: ['default', 'extended'],
    securityRequired: false
  },
  [UDSConstants.SERVICES.CLEAR_DIAGNOSTIC_INFORMATION]: {
    name: 'Clear Diagnostic Information',
    description: 'Clear stored DTCs',
    icon: '🧹',
    category: 'DTC',
    minLength: 4,
    maxLength: 4,
    supportedSessions: ['extended'],
    securityRequired: true
  },
  [UDSConstants.SERVICES.READ_DTC_INFORMATION]: {
    name: 'Read DTC Information',
    description: 'Read diagnostic trouble codes',
    icon: '📋',
    category: 'DTC',
    minLength: 2,
    maxLength: 255,
    supportedSessions: ['default', 'extended'],
    securityRequired: false
  },
  [UDSConstants.SERVICES.READ_DATA_BY_IDENTIFIER]: {
    name: 'Read Data by Identifier',
    description: 'Read data using identifier',
    icon: '📖',
    category: 'Data',
    minLength: 3,
    maxLength: 255,
    supportedSessions: ['default', 'extended'],
    securityRequired: false
  },
  [UDSConstants.SERVICES.READ_MEMORY_BY_ADDRESS]: {
    name: 'Read Memory by Address',
    description: 'Read memory at specific address',
    icon: '💾',
    category: 'Memory',
    minLength: 4,
    maxLength: 255,
    supportedSessions: ['extended'],
    securityRequired: true
  },
  [UDSConstants.SERVICES.SECURITY_ACCESS]: {
    name: 'Security Access',
    description: 'Unlock security protected services',
    icon: '🔐',
    category: 'Security',
    minLength: 2,
    maxLength: 255,
    supportedSessions: ['extended', 'programming'],
    securityRequired: false
  },
  [UDSConstants.SERVICES.COMMUNICATION_CONTROL]: {
    name: 'Communication Control',
    description: 'Control communication interfaces',
    icon: '📡',
    category: 'Control',
    minLength: 3,
    maxLength: 3,
    supportedSessions: ['extended'],
    securityRequired: true
  },
  [UDSConstants.SERVICES.WRITE_DATA_BY_IDENTIFIER]: {
    name: 'Write Data by Identifier',
    description: 'Write data using identifier',
    icon: '✏️',
    category: 'Data',
    minLength: 4,
    maxLength: 255,
    supportedSessions: ['extended'],
    securityRequired: true
  },
  [UDSConstants.SERVICES.ROUTINE_CONTROL]: {
    name: 'Routine Control',
    description: 'Control diagnostic routines',
    icon: '⚙️',
    category: 'Control',
    minLength: 4,
    maxLength: 255,
    supportedSessions: ['extended'],
    securityRequired: true
  },
  [UDSConstants.SERVICES.TESTER_PRESENT]: {
    name: 'Tester Present',
    description: 'Keep diagnostic session active',
    icon: '🔔',
    category: 'Session',
    minLength: 2,
    maxLength: 2,
    supportedSessions: ['default', 'extended', 'programming'],
    securityRequired: false
  }
} as const;

// Type definitions
export type UDSService = keyof typeof UDSConstants.SERVICES;
export type UDSSessionType = keyof typeof UDSConstants.SESSION_TYPES;
export type UDSResetType = keyof typeof UDSConstants.RESET_TYPES;
export type UDSNegativeResponseCode = keyof typeof UDSConstants.NRC;