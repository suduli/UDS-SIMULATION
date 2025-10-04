export interface ServiceTooltipData {
  serviceId: string;
  serviceName: string;
  description: string;
  useCases: string[];
  parameters?: string[];
  example?: string;
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
    example: 'Request: 10 03 → Switch to Extended Session'
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
    example: 'Request: 11 01 → Perform Hard Reset'
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
    example: 'Request: 14 FF FF FF → Clear All DTCs'
  },
  '0x19': {
    serviceId: '0x19',
    serviceName: 'Read DTC Information',
    description: 'Retrieves diagnostic trouble codes (DTCs) and related information like status, severity, and freeze frames.',
    useCases: [
      'Read current fault codes',
      'Check DTC status (pending, confirmed)',
      'Retrieve freeze frame snapshots'
    ],
    parameters: [
      'Sub-function: 0x01 (Number of DTCs), 0x02 (DTCs by status)',
      'Status Mask: Filter DTCs by status'
    ],
    example: 'Request: 19 02 08 → Read DTCs with confirmed status'
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
    example: 'Request: 22 F1 90 → Read VIN'
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
    example: 'Request: 23 44 12 34 56 78 02 → Read 2 bytes from 0x12345678'
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
    example: 'Request: 27 01 → Request Seed, then 27 02 [key] → Send Key'
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
    example: 'Request: 28 00 03 → Enable Normal & Network Messages'
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
    example: 'Request: 2A 01 F1 → Start slow periodic transmission of PDID 0xF1'
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
    example: 'Request: 2E F1 00 01 02 03 → Write [01 02 03] to DID 0xF100'
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
    example: 'Request: 31 01 F0 01 → Start routine 0xF001'
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
    example: 'Request: 34 00 44 12 34 56 78 44 00 00 10 00 → Request download to 0x12345678, size 0x1000'
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
    example: 'Request: 35 00 44 12 34 56 78 44 00 00 10 00 → Request upload from 0x12345678, size 0x1000'
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
    example: 'Request: 36 01 [data] → Transfer block #1, then 36 02 [data] → Transfer block #2'
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
    example: 'Request: 37 → Exit transfer after all blocks sent'
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
    example: 'Request: 3D 44 12 34 56 78 02 AB CD → Write [AB CD] to 0x12345678'
  }
};
