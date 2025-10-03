/**
 * Mock ECU Configuration
 * Default configuration with realistic automotive data
 */

import {
  ServiceId,
  type ECUConfig,
  type DataIdentifier,
  type DTCInfo,
  type Routine,
  type MemoryAddress,
} from '../types/uds';

import { generateMockVIN } from '../utils/udsHelpers';

const mockDataIdentifiers: DataIdentifier[] = [
  {
    id: 0xF186,
    name: 'activeDiagnosticSession',
    description: 'Active Diagnostic Session',
    value: [0x01],
    format: 'hex',
  },
  {
    id: 0xF190,
    name: 'vin',
    description: 'Vehicle Identification Number',
    value: generateMockVIN(),
    format: 'ascii',
  },
  {
    id: 0xF191,
    name: 'vehicleManufacturerECUHardwareNumber',
    description: 'ECU Hardware Number',
    value: 'HW123456789',
    format: 'ascii',
  },
  {
    id: 0xF194,
    name: 'systemSupplierECUSoftwareNumber',
    description: 'ECU Software Number',
    value: 'SW987654321',
    format: 'ascii',
  },
  {
    id: 0xF195,
    name: 'ecuManufacturingDateAndTime',
    description: 'ECU Manufacturing Date',
    value: '20240315',
    format: 'ascii',
  },
  {
    id: 0x010C,
    name: 'engineRPM',
    description: 'Engine RPM',
    value: 0,
    unit: 'RPM',
    format: 'dec',
  },
  {
    id: 0x010D,
    name: 'vehicleSpeed',
    description: 'Vehicle Speed',
    value: 0,
    unit: 'km/h',
    format: 'dec',
  },
  {
    id: 0x0105,
    name: 'coolantTemp',
    description: 'Engine Coolant Temperature',
    value: 0,
    unit: '°C',
    format: 'dec',
  },
  {
    id: 0x0142,
    name: 'batteryVoltage',
    description: 'Control Module Voltage',
    value: 0,
    unit: 'V',
    format: 'dec',
  },
  {
    id: 0x0110,
    name: 'maf',
    description: 'Mass Air Flow',
    value: 0,
    unit: 'g/s',
    format: 'dec',
  },
];

const mockDTCs: DTCInfo[] = [
  {
    code: 0xC00173,
    status: {
      testFailed: true,
      testFailedThisOperationCycle: true,
      pendingDTC: false,
      confirmedDTC: true,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: true,
    },
    severity: 'high',
    description: 'Lost Communication With Engine Control Module',
  },
  {
    code: 0x030000,
    status: {
      testFailed: false,
      testFailedThisOperationCycle: false,
      pendingDTC: true,
      confirmedDTC: false,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: false,
    },
    severity: 'medium',
    description: 'Random/Multiple Cylinder Misfire Detected (P0300)',
  },
  {
    code: 0x042000,
    status: {
      testFailed: true,
      testFailedThisOperationCycle: false,
      pendingDTC: false,
      confirmedDTC: true,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: true,
    },
    severity: 'low',
    description: 'Catalyst System Efficiency Below Threshold (P0420)',
  },
];

const mockRoutines: Routine[] = [
  {
    id: 0x0203,
    name: 'checkProgrammingDependencies',
    description: 'Check Programming Dependencies',
    status: 'idle',
    results: [0x00],
  },
  {
    id: 0xFF00,
    name: 'eraseMemory',
    description: 'Erase Flash Memory',
    status: 'idle',
    results: [0x00],
  },
  {
    id: 0xFF01,
    name: 'checkProgrammingIntegrity',
    description: 'Check Programming Integrity',
    status: 'idle',
    results: [0x00, 0x01, 0x02, 0x03],
  },
  {
    id: 0x0202,
    name: 'selfTest',
    description: 'ECU Self Test',
    status: 'idle',
    results: [0x00, 0xFF],
  },
];

const mockMemoryMap: MemoryAddress[] = [
  {
    address: 0x00000000,
    size: 256,
    data: Array.from({ length: 256 }, (_, i) => i & 0xFF),
  },
  {
    address: 0x00010000,
    size: 1024,
  },
];

export const mockECUConfig: ECUConfig = {
  id: 'ECU_001',
  name: 'Engine Control Module',
  supportedServices: [
    ServiceId.DIAGNOSTIC_SESSION_CONTROL,
    ServiceId.ECU_RESET,
    ServiceId.CLEAR_DIAGNOSTIC_INFORMATION,
    ServiceId.READ_DTC_INFORMATION,
    ServiceId.READ_DATA_BY_IDENTIFIER,
    ServiceId.READ_MEMORY_BY_ADDRESS,
    ServiceId.SECURITY_ACCESS,
    ServiceId.COMMUNICATION_CONTROL,
    ServiceId.READ_DATA_BY_PERIODIC_IDENTIFIER,
    ServiceId.WRITE_DATA_BY_IDENTIFIER,
    ServiceId.WRITE_MEMORY_BY_ADDRESS,
    ServiceId.ROUTINE_CONTROL,
    ServiceId.REQUEST_DOWNLOAD,
    ServiceId.REQUEST_UPLOAD,
    ServiceId.TRANSFER_DATA,
    ServiceId.REQUEST_TRANSFER_EXIT,
  ],
  dataIdentifiers: mockDataIdentifiers,
  dtcs: mockDTCs,
  routines: mockRoutines,
  memoryMap: mockMemoryMap,
  securitySeed: [0x12, 0x34, 0x56, 0x78],
  securityKey: [0xB7, 0x6E, 0xA6, 0x77],
};
