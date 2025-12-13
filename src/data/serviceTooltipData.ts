export interface ServiceTooltipData {
  serviceId: string;
  serviceName: string;
  description: string;
  useCases: string[];
  parameters?: string[];
  example?: string;
  exampleHex?: string;
  quickExamples?: { label: string; hex: string }[];
}

export const serviceTooltipData: Record<string, ServiceTooltipData> = {
  '0x10': {
    serviceId: '0x10',
    serviceName: 'Diagnostic Session Control',
    description: 'Enables different diagnostic sessions with varying access levels and capabilities. Essential for accessing protected diagnostic functions.',
    useCases: [
      'Switch to programming session for ECU flashing',
      'Enter extended diagnostic mode for advanced tests',
      'Return to default session after diagnostics'
    ],
    parameters: ['Session Type: 0x01 (Default), 0x02 (Programming), 0x03 (Extended)'],
    example: 'Request: 10 03 → Switch to Extended Session',
    exampleHex: '10 03',
    quickExamples: [
      { label: 'Default Session', hex: '10 01' },
      { label: 'Programming Session', hex: '10 02' },
      { label: 'Extended Session', hex: '10 03' }
    ]
  },
  '0x11': {
    serviceId: '0x11',
    serviceName: 'ECU Reset',
    description: 'Performs different types of ECU resets including soft reset, hard reset, and key-off/on cycles.',
    useCases: [
      'Restart ECU after software update',
      'Clear temporary fault codes',
      'Apply new configuration settings'
    ],
    parameters: ['Reset Type: 0x01 (Hard), 0x02 (Key Off/On), 0x03 (Soft)'],
    example: 'Request: 11 01 → Perform Hard Reset',
    exampleHex: '11 01',
    quickExamples: [
      { label: 'Hard Reset', hex: '11 01' },
      { label: 'Key Off/On Reset', hex: '11 02' },
      { label: 'Soft Reset', hex: '11 03' }
    ]
  },
  '0x14': {
    serviceId: '0x14',
    serviceName: 'Clear Diagnostic Information',
    description: 'Clears stored diagnostic trouble codes (DTCs) and related freeze frame data from ECU memory.',
    useCases: [
      'Clear fault codes after repair',
      'Reset diagnostic counters',
      'Remove stored freeze frame data'
    ],
    parameters: ['Group of DTC: 0xFFFFFF (All DTCs)'],
    example: 'Request: 14 FF FF FF → Clear All DTCs',
    exampleHex: '14 FF FF FF',
    quickExamples: [
      { label: 'Clear All DTCs', hex: '14 FF FF FF' }
    ]
  },
  '0x19': {
    serviceId: '0x19',
    serviceName: 'Read DTC Information',
    description: 'Retrieves diagnostic trouble codes (DTCs) and related information like status, severity, freeze frames, and extended data. Supports 15 subfunctions per ISO 14229.',
    useCases: [
      'Read current fault codes by status',
      'Count DTCs matching specific criteria',
      'Retrieve freeze frame (snapshot) data',
      'Get extended data (counters, aging)',
      'Filter DTCs by severity level'
    ],
    parameters: [
      'Sub-function: 0x01-0x0F (15 report types)',
      'Status Mask: 0x01 (Failed), 0x04 (Pending), 0x08 (Confirmed), 0xFF (All)',
      'Severity Mask: 0x20 (Check Soon), 0x40 (Check Now), 0x80 (Critical)'
    ],
    example: 'Request: 19 02 FF → Read all DTCs with any status',
    exampleHex: '19 02 FF',
    quickExamples: [
      { label: 'Count All DTCs', hex: '19 01 FF' },
      { label: 'Read All DTCs', hex: '19 02 FF' },
      { label: 'Read Confirmed', hex: '19 02 08' },
      { label: 'Read Pending', hex: '19 02 04' },
      { label: 'Snapshot IDs', hex: '19 03' },
      { label: 'Supported DTCs', hex: '19 0A' },
      { label: 'First Failed', hex: '19 0B' },
      { label: 'Most Recent', hex: '19 0D' },
      { label: 'Count by Severity', hex: '19 07 80 FF' },
      { label: 'Read by Severity', hex: '19 08 80 FF' }
    ]
  },
  '0x22': {
    serviceId: '0x22',
    serviceName: 'Read Data By Identifier',
    description: 'Reads specific data values from ECU using standardized data identifiers (DIDs). Most commonly used diagnostic service.',
    useCases: [
      'Read VIN (Vehicle Identification Number)',
      'Check ECU software version',
      'Monitor sensor values in real-time'
    ],
    parameters: ['Data Identifier (DID): 2-byte hex value (e.g., 0xF190 for VIN)'],
    example: 'Request: 22 F1 90 → Read VIN',
    exampleHex: '22 F1 90',
    quickExamples: [
      { label: 'Read VIN', hex: '22 F1 90' },
      { label: 'Read ECU Power', hex: '22 F1 80' },
      { label: 'Read Vehicle Speed', hex: '22 01 00' }
    ]
  },
  '0x23': {
    serviceId: '0x23',
    serviceName: 'Read Memory By Address',
    description: 'Reads raw memory content from ECU at specified addresses. Requires enhanced security access.',
    useCases: [
      'Debug ECU memory issues',
      'Extract calibration data',
      'Verify memory integrity'
    ],
    parameters: [
      'Memory Address: Starting address',
      'Memory Size: Number of bytes to read'
    ],
    example: 'Request: 23 44 12 34 56 78 02 → Read 2 bytes from 0x12345678',
    exampleHex: '23 44 12 34 56 78 02',
    quickExamples: [
      { label: 'Read 2 Bytes', hex: '23 44 12 34 56 78 02' },
      { label: 'Read 4 Bytes', hex: '23 44 12 34 56 78 04' }
    ]
  },
  '0x27': {
    serviceId: '0x27',
    serviceName: 'Security Access',
    description: 'Implements challenge-response authentication to unlock protected diagnostic functions and prevent unauthorized access.',
    useCases: [
      'Unlock programming session',
      'Enable write operations',
      'Access protected calibration data'
    ],
    parameters: [
      'Request Seed: 0x01, 0x03, 0x05... (odd)',
      'Send Key: 0x02, 0x04, 0x06... (even)'
    ],
    example: 'Request: 27 01 → Request Seed, then 27 02 [key] → Send Key',
    exampleHex: '27 01',
    quickExamples: [
      { label: 'Request Seed (Lvl 1)', hex: '27 01' },
      { label: 'Send Key (Lvl 1)', hex: '27 02 B7 6E A6 77' },
      { label: 'Request Seed (Lvl 3)', hex: '27 03' },
      { label: 'Send Key (Lvl 3)', hex: '27 04 B7 6E A6 77' }
    ]
  },
  '0x28': {
    serviceId: '0x28',
    serviceName: 'Communication Control',
    description: 'Enables or disables specific communication types (normal messages, network messages, etc.) for testing purposes.',
    useCases: [
      'Disable normal messages during reprogramming',
      'Test network isolation',
      'Control message flow during diagnostics'
    ],
    parameters: [
      'Control Type: 0x00 (Enable), 0x01 (Disable)',
      'Communication Type: Normal, Network, etc.'
    ],
    example: 'Request: 28 00 03 → Enable Normal & Network Messages',
    exampleHex: '28 00 03',
    quickExamples: [
      { label: 'Enable All Msgs', hex: '28 00 03' },
      { label: 'Disable Non-Diag', hex: '28 01 01' },
      { label: 'Disable All Msgs', hex: '28 03 03' }
    ]
  },
  '0x2A': {
    serviceId: '0x2A',
    serviceName: 'Read Data By Periodic ID',
    description: 'Configures ECU to send specific data values periodically at defined intervals without repeated requests.',
    useCases: [
      'Monitor real-time sensor data streams',
      'Log periodic vehicle parameters',
      'Set up continuous data logging'
    ],
    parameters: [
      'Transmission Mode: Slow, Medium, Fast, Stop',
      'Periodic Data Identifier (PDID)'
    ],
    example: 'Request: 2A 01 F1 → Start slow periodic transmission of PDID 0xF1',
    exampleHex: '2A 01 F1',
    quickExamples: [
      { label: 'Start Slow (RPM)', hex: '2A 01 01' },
      { label: 'Start Fast (Speed)', hex: '2A 03 02' },
      { label: 'Stop Transmission', hex: '2A 04' }
    ]
  },
  '0x2E': {
    serviceId: '0x2E',
    serviceName: 'Write Data By Identifier',
    description: 'Writes specific data values to ECU using data identifiers. Requires security access for protected DIDs.',
    useCases: [
      'Configure ECU parameters',
      'Update calibration values',
      'Set vehicle configuration options'
    ],
    parameters: [
      'Data Identifier (DID): 2-byte hex value',
      'Data Record: Values to write'
    ],
    example: 'Request: 2E F1 00 01 02 03 → Write [01 02 03] to DID 0xF100',
    exampleHex: '2E F1 00 01 02 03',
    quickExamples: [
      { label: 'Write Config', hex: '2E F1 00 01' },
      { label: 'Reset Calibration', hex: '2E F1 01 00' }
    ]
  },
  '0x31': {
    serviceId: '0x31',
    serviceName: 'Routine Control',
    description: 'Starts, stops, or requests results from diagnostic routines (self-tests, calibrations, actuator tests).',
    useCases: [
      'Run actuator self-tests',
      'Execute calibration procedures',
      'Perform component diagnostics'
    ],
    parameters: [
      'Sub-function: 0x01 (Start), 0x02 (Stop), 0x03 (Request Results)',
      'Routine Identifier: Specific routine ID'
    ],
    example: 'Request: 31 01 F0 01 → Start routine 0xF001',
    exampleHex: '31 01 F0 01',
    quickExamples: [
      { label: 'Start Routine', hex: '31 01 F0 01' },
      { label: 'Stop Routine', hex: '31 02 F0 01' },
      { label: 'Request Results', hex: '31 03 F0 01' }
    ]
  },
  '0x34': {
    serviceId: '0x34',
    serviceName: 'Request Download',
    description: 'Initiates a data download sequence from tester to ECU. First step in ECU reprogramming process.',
    useCases: [
      'Start ECU software flashing',
      'Download calibration files',
      'Update ECU firmware'
    ],
    parameters: [
      'Memory Address: Target location',
      'Memory Size: Total download size',
      'Data Format: Compression/encryption settings'
    ],
    example: 'Request: 34 00 44 12 34 56 78 44 00 00 10 00 → Request download to 0x12345678, size 0x1000',
    exampleHex: '34 00 44 12 34 56 78 44 00 00 10 00',
    quickExamples: [
      { label: 'Download Request', hex: '34 00 44 12 34 56 78 44 00 00 10 00' }
    ]
  },
  '0x35': {
    serviceId: '0x35',
    serviceName: 'Request Upload',
    description: 'Initiates a data upload sequence from ECU to tester. Used for extracting firmware or calibration data.',
    useCases: [
      'Backup ECU software',
      'Extract calibration data',
      'Read out firmware for analysis'
    ],
    parameters: [
      'Memory Address: Source location',
      'Memory Size: Total upload size',
      'Data Format: Compression/encryption settings'
    ],
    example: 'Request: 35 00 44 12 34 56 78 44 00 00 10 00 → Request upload from 0x12345678, size 0x1000',
    exampleHex: '35 00 44 12 34 56 78 44 00 00 10 00',
    quickExamples: [
      { label: 'Upload Request', hex: '35 00 44 12 34 56 78 44 00 00 10 00' }
    ]
  },
  '0x36': {
    serviceId: '0x36',
    serviceName: 'Transfer Data',
    description: 'Transfers data blocks during download/upload sequences. Called repeatedly after Request Download/Upload.',
    useCases: [
      'Send firmware blocks during flashing',
      'Receive calibration data chunks',
      'Transfer data in multi-block sequences'
    ],
    parameters: [
      'Block Sequence Counter: Increments with each block',
      'Transfer Data: Actual payload bytes'
    ],
    example: 'Request: 36 01 [data] → Transfer block #1, then 36 02 [data] → Transfer block #2',
    exampleHex: '36 01 00 00',
    quickExamples: [
      { label: 'Transfer Block 1', hex: '36 01 00 00' },
      { label: 'Transfer Block 2', hex: '36 02 00 00' }
    ]
  },
  '0x37': {
    serviceId: '0x37',
    serviceName: 'Request Transfer Exit',
    description: 'Finalizes and validates a download/upload sequence. Last step after all Transfer Data blocks.',
    useCases: [
      'Complete ECU flashing process',
      'Finalize calibration upload',
      'Verify data transfer integrity'
    ],
    parameters: ['Optional: Transfer completion parameters'],
    example: 'Request: 37 → Exit transfer after all blocks sent',
    exampleHex: '37',
    quickExamples: [
      { label: 'Exit Transfer', hex: '37' }
    ]
  },
  '0x3E': {
    serviceId: '0x3E',
    serviceName: 'Tester Present',
    description: 'Indicates to the ECU that the tester is still present and active. Used to maintain non-default sessions and unlock states.',
    useCases: [
      'Keep session active (prevent timeout)',
      'Maintain security unlock state',
      'Periodic heartbeat during idle times'
    ],
    parameters: [
      'Sub-function: 0x00 (Response Required), 0x80 (Suppress Response)'
    ],
    example: 'Request: 3E 00 → "I am here, please confirm"',
    exampleHex: '3E 00',
    quickExamples: [
      { label: 'With Response', hex: '3E 00' },
      { label: 'Suppress Response', hex: '3E 80' }
    ]
  },
  '0x3D': {
    serviceId: '0x3D',
    serviceName: 'Write Memory By Address',
    description: 'Writes raw data to specific memory addresses in ECU. Requires security access and precise addressing.',
    useCases: [
      'Direct memory patching',
      'Low-level calibration updates',
      'Memory repair operations'
    ],
    parameters: [
      'Memory Address: Target location',
      'Memory Size: Number of bytes',
      'Data Record: Bytes to write'
    ],
    example: 'Request: 3D 44 12 34 56 78 02 AB CD → Write [AB CD] to 0x12345678',
    exampleHex: '3D 44 12 34 56 78 02 AB CD',
    quickExamples: [
      { label: 'Write Memory', hex: '3D 44 12 34 56 78 02 AB CD' }
    ]
  },
  '0x83': {
    serviceId: '0x83',
    serviceName: 'Access Timing Parameter',
    description: 'Reads and modifies the timing parameters of the ECU communication.',
    useCases: [
      'Read currently active timing parameters',
      'Set timing values to default',
      'Temporarily adjust timing for specific operations'
    ],
    parameters: [
      'Sub-function: 0x01 (Read Extended), 0x02 (Set to Default), 0x03 (Read Currently Active), 0x04 (Set to Given Value)'
    ],
    example: 'Request: 83 01 → Read extended timing set',
    exampleHex: '83 01',
    quickExamples: [
      { label: 'Read Extended', hex: '83 01' },
      { label: 'Set Default', hex: '83 02' },
      { label: 'Read Active', hex: '83 03' }
    ]
  },
  '0x85': {
    serviceId: '0x85',
    serviceName: 'Control DTC Setting',
    description: 'Enables or disables the updating of Diagnostic Trouble Codes (DTCs) in the ECU.',
    useCases: [
      'Disable DTCs during software update',
      'Enable DTCs after maintenance',
      'Temporarily suppress faults during testing'
    ],
    parameters: [
      'Sub-function: 0x01 (On), 0x02 (Off)'
    ],
    example: 'Request: 85 02 → Turn DTC setting OFF',
    exampleHex: '85 02',
    quickExamples: [
      { label: 'DTC Setting ON', hex: '85 01' },
      { label: 'DTC Setting OFF', hex: '85 02' }
    ]
  }
};
