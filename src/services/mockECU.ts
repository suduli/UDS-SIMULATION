/**
 * Mock ECU Configuration
 * Default configuration with realistic automotive data
 */

import {
  ServiceId,
  DiagnosticSessionType,
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
    requiredSession: [DiagnosticSessionType.DEFAULT, DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING, DiagnosticSessionType.SAFETY],
    requiredSecurity: 0, // Public DID
    readonly: true, // Read-only status
  },
  {
    id: 0xF190,
    name: 'vin',
    description: 'Vehicle Identification Number',
    value: generateMockVIN(),
    format: 'ascii',
    requiredSession: [DiagnosticSessionType.DEFAULT, DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING],
    requiredSecurity: 0, // Public Read
    writeSecurity: 1, // Secure Write
    writeSession: [DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING],
    size: 17, // 17 char VIN
  },
  {
    id: 0xF191,
    name: 'vehicleManufacturerECUHardwareNumber',
    description: 'ECU Hardware Number',
    value: 'HW123456789',
    format: 'ascii',
    requiredSession: [DiagnosticSessionType.DEFAULT, DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING],
    requiredSecurity: 0,
    readonly: true, // Hardware number usually fixed
  },
  {
    id: 0xF194,
    name: 'systemSupplierECUSoftwareNumber',
    description: 'ECU Software Number',
    value: 'SW987654321',
    format: 'ascii',
    requiredSession: [DiagnosticSessionType.DEFAULT, DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING],
    requiredSecurity: 0, // Public DID - no security needed
  },
  {
    id: 0xF195,
    name: 'ecuManufacturingDateAndTime',
    description: 'ECU Manufacturing Date',
    value: '20240315',
    format: 'ascii',
    requiredSession: [DiagnosticSessionType.DEFAULT, DiagnosticSessionType.EXTENDED],
    requiredSecurity: 0, // Public DID - no security needed
  },
  {
    id: 0x010C,
    name: 'engineRPM',
    description: 'Engine RPM',
    value: 0,
    unit: 'RPM',
    format: 'dec',
    requiredSession: [DiagnosticSessionType.EXTENDED], // Runtime data - EXTENDED session only
    requiredSecurity: 0, // No security needed
    size: 2, // 2 bytes
  },
  {
    id: 0x010D,
    name: 'vehicleSpeed',
    description: 'Vehicle Speed',
    value: 0,
    unit: 'km/h',
    format: 'dec',
    requiredSession: [DiagnosticSessionType.EXTENDED], // Runtime data - EXTENDED session only
    requiredSecurity: 0, // No security needed
    size: 1, // 1 byte
  },
  {
    id: 0x0105,
    name: 'coolantTemp',
    description: 'Engine Coolant Temperature',
    value: 0,
    unit: '°C',
    format: 'dec',
    requiredSession: [DiagnosticSessionType.EXTENDED], // Runtime data - EXTENDED session only
    requiredSecurity: 0, // No security needed
  },
  {
    id: 0x0142,
    name: 'batteryVoltage',
    description: 'Control Module Voltage',
    value: 0,
    unit: 'V',
    format: 'dec',
    requiredSession: [DiagnosticSessionType.EXTENDED], // Runtime data - EXTENDED session only
    requiredSecurity: 0, // No security needed
  },
  {
    id: 0x0110,
    name: 'maf',
    description: 'Mass Air Flow',
    value: 0,
    unit: 'g/s',
    format: 'dec',
    requiredSession: [DiagnosticSessionType.EXTENDED], // Runtime data - EXTENDED session only
    requiredSecurity: 0, // No security needed
  },
];

const mockDTCs: DTCInfo[] = [
  // =====================
  // POWERTRAIN DTCs (P-codes)
  // =====================
  {
    code: 0x010101,  // P0101 - MAF Sensor Range/Performance
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
    severityByte: 0x60,
    category: 'powertrain',
    description: 'Mass Air Flow Sensor Range/Performance Problem',
    occurrenceCounter: 5,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 86400000 * 3, // 3 days ago
    mostRecentFailureTimestamp: Date.now() - 3600000, // 1 hour ago
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 3600000,
      data: {
        vehicleSpeed: 65,
        engineRPM: 2500,
        coolantTemp: 92,
        throttlePosition: 45,
        fuelLevel: 60,
        batteryVoltage: 14.2,
        engineLoad: 55,
        intakeAirTemp: 28,
        oilPressure: 350,
        ambientTemp: 22,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 5,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x010171,  // P0171 - System Too Lean Bank 1
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
    severityByte: 0x40,
    category: 'powertrain',
    description: 'System Too Lean (Bank 1)',
    occurrenceCounter: 2,
    agingCounter: 1,
    firstFailureTimestamp: Date.now() - 86400000, // 1 day ago
    mostRecentFailureTimestamp: Date.now() - 43200000, // 12 hours ago
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 43200000,
      data: {
        vehicleSpeed: 40,
        engineRPM: 1800,
        coolantTemp: 88,
        throttlePosition: 30,
        fuelLevel: 45,
        batteryVoltage: 14.0,
        engineLoad: 40,
        intakeAirTemp: 25,
        oilPressure: 320,
        ambientTemp: 20,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 2,
      agingCounter: 1,
      agedCounter: 0,
      selfHealingCounter: 1,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x010300,  // P0300 - Random/Multiple Cylinder Misfire
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
    severity: 'critical',
    severityByte: 0x60,
    category: 'powertrain',
    description: 'Random/Multiple Cylinder Misfire Detected',
    occurrenceCounter: 12,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 86400000 * 5,
    mostRecentFailureTimestamp: Date.now() - 1800000, // 30 mins ago
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 1800000,
      data: {
        vehicleSpeed: 80,
        engineRPM: 3200,
        coolantTemp: 95,
        throttlePosition: 60,
        fuelLevel: 55,
        batteryVoltage: 14.1,
        engineLoad: 70,
        intakeAirTemp: 32,
        oilPressure: 380,
        ambientTemp: 25,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 12,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x010420,  // P0420 - Catalyst System Efficiency
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
    severity: 'medium',
    severityByte: 0x40,
    category: 'powertrain',
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    occurrenceCounter: 8,
    agingCounter: 2,
    firstFailureTimestamp: Date.now() - 86400000 * 14,
    mostRecentFailureTimestamp: Date.now() - 86400000 * 2,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 86400000 * 2,
      data: {
        vehicleSpeed: 55,
        engineRPM: 2200,
        coolantTemp: 90,
        throttlePosition: 40,
        fuelLevel: 70,
        batteryVoltage: 14.3,
        engineLoad: 50,
        intakeAirTemp: 26,
        oilPressure: 340,
        ambientTemp: 18,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 8,
      agingCounter: 2,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x010562,  // P0562 - System Voltage Low
    status: {
      testFailed: false,
      testFailedThisOperationCycle: false,
      pendingDTC: false,
      confirmedDTC: true,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: false,
    },
    severity: 'low',
    severityByte: 0x20,
    category: 'powertrain',
    description: 'System Voltage Low',
    occurrenceCounter: 3,
    agingCounter: 5,
    firstFailureTimestamp: Date.now() - 86400000 * 7,
    mostRecentFailureTimestamp: Date.now() - 86400000 * 5,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 86400000 * 5,
      data: {
        vehicleSpeed: 0,
        engineRPM: 750,
        coolantTemp: 45,
        throttlePosition: 0,
        fuelLevel: 80,
        batteryVoltage: 11.2,
        engineLoad: 15,
        intakeAirTemp: 12,
        oilPressure: 280,
        ambientTemp: 8,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 3,
      agingCounter: 5,
      agedCounter: 0,
      selfHealingCounter: 3,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },

  // =====================
  // CHASSIS DTCs (C-codes)
  // =====================
  {
    code: 0x020035,  // C0035 - Left Front Wheel Speed Sensor
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
    severityByte: 0x60,
    category: 'chassis',
    description: 'Left Front Wheel Speed Sensor Circuit',
    occurrenceCounter: 4,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 86400000 * 2,
    mostRecentFailureTimestamp: Date.now() - 7200000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 7200000,
      data: {
        vehicleSpeed: 45,
        engineRPM: 2000,
        coolantTemp: 85,
        throttlePosition: 35,
        fuelLevel: 50,
        batteryVoltage: 14.1,
        engineLoad: 45,
        intakeAirTemp: 24,
        oilPressure: 330,
        ambientTemp: 20,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 4,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x020045,  // C0045 - ABS Hydraulic Pump Motor
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
    severity: 'critical',
    severityByte: 0x60,
    category: 'chassis',
    description: 'ABS Hydraulic Pump Motor Circuit',
    occurrenceCounter: 1,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 3600000,
    mostRecentFailureTimestamp: Date.now() - 3600000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 3600000,
      data: {
        vehicleSpeed: 30,
        engineRPM: 1500,
        coolantTemp: 75,
        throttlePosition: 25,
        fuelLevel: 65,
        batteryVoltage: 13.8,
        engineLoad: 30,
        intakeAirTemp: 22,
        oilPressure: 310,
        ambientTemp: 18,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 1,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x021234,  // C1234 - Steering Angle Sensor
    status: {
      testFailed: false,
      testFailedThisOperationCycle: false,
      pendingDTC: false,
      confirmedDTC: true,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: false,
    },
    severity: 'medium',
    severityByte: 0x40,
    category: 'chassis',
    description: 'Steering Angle Sensor Malfunction',
    occurrenceCounter: 6,
    agingCounter: 3,
    firstFailureTimestamp: Date.now() - 86400000 * 10,
    mostRecentFailureTimestamp: Date.now() - 86400000 * 3,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 86400000 * 3,
      data: {
        vehicleSpeed: 25,
        engineRPM: 1200,
        coolantTemp: 80,
        throttlePosition: 20,
        fuelLevel: 40,
        batteryVoltage: 14.0,
        engineLoad: 25,
        intakeAirTemp: 20,
        oilPressure: 300,
        ambientTemp: 15,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 6,
      agingCounter: 3,
      agedCounter: 0,
      selfHealingCounter: 2,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },

  // =====================
  // BODY DTCs (B-codes)
  // =====================
  {
    code: 0x030056,  // B0056 - Driver Seat Position Sensor
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
    severity: 'low',
    severityByte: 0x20,
    category: 'body',
    description: 'Driver Seat Position Sensor Circuit',
    occurrenceCounter: 2,
    agingCounter: 1,
    firstFailureTimestamp: Date.now() - 86400000,
    mostRecentFailureTimestamp: Date.now() - 43200000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 43200000,
      data: {
        vehicleSpeed: 0,
        engineRPM: 0,
        coolantTemp: 25,
        throttlePosition: 0,
        fuelLevel: 75,
        batteryVoltage: 12.6,
        engineLoad: 0,
        intakeAirTemp: 22,
        oilPressure: 0,
        ambientTemp: 22,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 2,
      agingCounter: 1,
      agedCounter: 0,
      selfHealingCounter: 1,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x031001,  // B1001 - Headlight Low Beam Left
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
    severity: 'medium',
    severityByte: 0x40,
    category: 'body',
    description: 'Headlight Low Beam Left Circuit Open',
    occurrenceCounter: 7,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 86400000 * 4,
    mostRecentFailureTimestamp: Date.now() - 3600000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 3600000,
      data: {
        vehicleSpeed: 50,
        engineRPM: 2100,
        coolantTemp: 88,
        throttlePosition: 40,
        fuelLevel: 55,
        batteryVoltage: 14.2,
        engineLoad: 48,
        intakeAirTemp: 18,
        oilPressure: 340,
        ambientTemp: 5,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 7,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x031801,  // B1801 - Air Bag Warning Indicator
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
    severity: 'critical',
    severityByte: 0x60,
    category: 'body',
    description: 'Air Bag Warning Indicator Circuit Short to Ground',
    occurrenceCounter: 3,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 86400000,
    mostRecentFailureTimestamp: Date.now() - 1800000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 1800000,
      data: {
        vehicleSpeed: 0,
        engineRPM: 750,
        coolantTemp: 45,
        throttlePosition: 0,
        fuelLevel: 60,
        batteryVoltage: 14.0,
        engineLoad: 12,
        intakeAirTemp: 20,
        oilPressure: 280,
        ambientTemp: 18,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 3,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },

  // =====================
  // NETWORK DTCs (U-codes)
  // =====================
  {
    code: 0x040001,  // U0001 - High Speed CAN Bus
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
    severity: 'critical',
    severityByte: 0x60,
    category: 'network',
    description: 'High Speed CAN Communication Bus',
    occurrenceCounter: 2,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 7200000,
    mostRecentFailureTimestamp: Date.now() - 600000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 600000,
      data: {
        vehicleSpeed: 70,
        engineRPM: 2800,
        coolantTemp: 92,
        throttlePosition: 55,
        fuelLevel: 45,
        batteryVoltage: 14.1,
        engineLoad: 62,
        intakeAirTemp: 30,
        oilPressure: 360,
        ambientTemp: 24,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 2,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x040100,  // U0100 - Lost Communication with ECM/PCM
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
    severity: 'high',
    severityByte: 0x60,
    category: 'network',
    description: 'Lost Communication With ECM/PCM "A"',
    occurrenceCounter: 1,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 1800000,
    mostRecentFailureTimestamp: Date.now() - 1800000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 1800000,
      data: {
        vehicleSpeed: 0,
        engineRPM: 0,
        coolantTemp: 65,
        throttlePosition: 0,
        fuelLevel: 70,
        batteryVoltage: 12.4,
        engineLoad: 0,
        intakeAirTemp: 22,
        oilPressure: 0,
        ambientTemp: 20,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 1,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x040121,  // U0121 - Lost Communication with ABS
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
    severity: 'high',
    severityByte: 0x60,
    category: 'network',
    description: 'Lost Communication With ABS Control Module',
    occurrenceCounter: 1,
    agingCounter: 0,
    firstFailureTimestamp: Date.now() - 3600000,
    mostRecentFailureTimestamp: Date.now() - 3600000,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 3600000,
      data: {
        vehicleSpeed: 40,
        engineRPM: 1800,
        coolantTemp: 85,
        throttlePosition: 30,
        fuelLevel: 55,
        batteryVoltage: 13.8,
        engineLoad: 40,
        intakeAirTemp: 23,
        oilPressure: 325,
        ambientTemp: 19,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 1,
      agingCounter: 0,
      agedCounter: 0,
      selfHealingCounter: 0,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
  {
    code: 0x040155,  // U0155 - Lost Communication with Cluster
    status: {
      testFailed: false,
      testFailedThisOperationCycle: false,
      pendingDTC: false,
      confirmedDTC: true,
      testNotCompletedSinceLastClear: false,
      testFailedSinceLastClear: true,
      testNotCompletedThisOperationCycle: false,
      warningIndicatorRequested: false,
    },
    severity: 'medium',
    severityByte: 0x40,
    category: 'network',
    description: 'Lost Communication With Instrument Panel Cluster',
    occurrenceCounter: 4,
    agingCounter: 2,
    firstFailureTimestamp: Date.now() - 86400000 * 6,
    mostRecentFailureTimestamp: Date.now() - 86400000 * 2,
    snapshots: [{
      recordNumber: 1,
      timestamp: Date.now() - 86400000 * 2,
      data: {
        vehicleSpeed: 35,
        engineRPM: 1600,
        coolantTemp: 82,
        throttlePosition: 28,
        fuelLevel: 50,
        batteryVoltage: 13.9,
        engineLoad: 35,
        intakeAirTemp: 21,
        oilPressure: 315,
        ambientTemp: 17,
      }
    }],
    extendedData: [{
      recordNumber: 1,
      occurrenceCounter: 4,
      agingCounter: 2,
      agedCounter: 0,
      selfHealingCounter: 2,
      failedSinceLastClear: true,
      testNotCompleted: false,
    }],
  },
];

const mockRoutines: Routine[] = [
  // ===== BASIC/READ-ONLY ROUTINES (DEFAULT session, no security) =====
  {
    id: 0x0100,
    name: 'readECUInformation',
    description: 'Read ECU System Information',
    status: 'idle',
    results: [0x01, 0x00, 0x00],  // Version 1.0.0
    requiredSession: DiagnosticSessionType.DEFAULT,
    requiredSecurity: 0,
  },
  {
    id: 0x0101,
    name: 'getSystemStatus',
    description: 'Get System Health Status',
    status: 'idle',
    results: [0x00],  // 0x00 = Healthy
    requiredSession: DiagnosticSessionType.DEFAULT,
    requiredSecurity: 0,
  },

  // ===== DIAGNOSTIC TESTS (EXTENDED session, no security) =====
  {
    id: 0x0203,
    name: 'checkProgrammingDependencies',
    description: 'Check Programming Dependencies',
    status: 'idle',
    results: [0x00],  // 0x00 = All OK
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 0,
  },
  {
    id: 0x0F01,
    name: 'fuelPumpRelayTest',
    description: 'Test Fuel Pump Relay activation',
    status: 'idle',
    results: [0x01],  // 0x01 = PASS
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 0,
    executionTime: 2000,  // 2 seconds
  },
  {
    id: 0x0F02,
    name: 'hornTest',
    description: 'Test Horn Output',
    status: 'idle',
    results: [0x01],  // 0x01 = PASS
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 0,
    executionTime: 1000,  // 1 second
  },
  {
    id: 0x0F03,
    name: 'headlightTest',
    description: 'Test Headlight Circuit',
    status: 'idle',
    results: [0x01],  // 0x01 = PASS
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 0,
    executionTime: 1500,  // 1.5 seconds
  },

  // ===== ACTUATOR TESTS (EXTENDED session, security required) =====
  {
    id: 0xF012,
    name: 'injectorCylinder1Test',
    description: 'Injector Cylinder 1 Test',
    status: 'idle',
    results: [0x01, 0x00],  // 0x01 = PASS, 0x00 = No errors
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 1,
    executionTime: 3000,  // 3 seconds
  },
  {
    id: 0xF013,
    name: 'throttleBodyTest',
    description: 'Throttle Body Actuator Test',
    status: 'idle',
    results: [0x01, 0x00],  // 0x01 = PASS
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 1,
    executionTime: 5000,  // 5 seconds
  },
  {
    id: 0xABCD,
    name: 'throttleCalibration',
    description: 'Throttle Position Calibration (Long-Running)',
    status: 'idle',
    results: [0x01, 0x64],  // 0x01 = PASS, 0x64 = 100% complete
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 1,
    executionTime: 30000,  // 30 seconds
  },

  // ===== SENSOR TESTS (EXTENDED session, security required) =====
  {
    id: 0xF156,
    name: 'o2SensorTest',
    description: 'Oxygen Sensor Test',
    status: 'idle',
    results: [0x01, 0x00],  // 0x01 = PASS
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 1,
    executionTime: 10000,  // 10 seconds
  },
  {
    id: 0x99AA,
    name: 'lambdaSensorTest',
    description: 'Lambda Sensor Test (Can Fail)',
    status: 'idle',
    results: [0x01],  // 0x01 = PASS (or can be set to 'failed' for testing)
    requiredSession: DiagnosticSessionType.EXTENDED,
    requiredSecurity: 1,
    executionTime: 8000,  // 8 seconds
  },

  // ===== PROGRAMMING OPERATIONS (PROGRAMMING session, security required) =====
  {
    id: 0x0202,
    name: 'ecuSelfTest',
    description: 'ECU Self Test',
    status: 'idle',
    results: [0x01, 0xFF],  // 0x01 = PASS, 0xFF = All systems OK
    requiredSession: [DiagnosticSessionType.EXTENDED, DiagnosticSessionType.PROGRAMMING],
    requiredSecurity: 1,
    executionTime: 15000,  // 15 seconds
  },
  {
    id: 0xFF00,
    name: 'eraseFlashMemory',
    description: 'Erase Flash Memory',
    status: 'idle',
    results: [0x00],  // 0x00 = Erase complete
    requiredSession: DiagnosticSessionType.PROGRAMMING,
    requiredSecurity: 1,
    supportedSubFunctions: [0x01, 0x03],  // Only START and REQUEST_RESULTS (no STOP for erase)
    executionTime: 10000,  // 10 seconds
  },
  {
    id: 0xFF01,
    name: 'checkProgrammingIntegrity',
    description: 'Check Programming Integrity',
    status: 'idle',
    results: [0x01, 0x01, 0x02, 0x03],  // 0x01 = PASS, integrity bytes
    requiredSession: DiagnosticSessionType.PROGRAMMING,
    requiredSecurity: 1,
  },
  {
    id: 0xFF02,
    name: 'verifyProgramming',
    description: 'Verify Flash Programming',
    status: 'idle',
    results: [0x01, 0x00],  // 0x01 = PASS, 0x00 = No CRC errors
    requiredSession: DiagnosticSessionType.PROGRAMMING,
    requiredSecurity: 1,
    executionTime: 20000,  // 20 seconds
  },
];

const mockMemoryMap: MemoryAddress[] = [
  // Reserved Region - Not accessible
  {
    name: 'Reserved',
    address: 0x00000000,
    size: 0x00001000,  // 4KB
    accessible: false,
    writable: false,
    protected: true,
    securityLevel: 0,
    description: 'Reserved memory region (inaccessible)',
  } as any,

  // Flash Code - Security Level 1 required, writable for programming
  {
    name: 'Flash Code',
    address: 0x00001000,
    size: 0x000FF000,  // ~1020KB
    accessible: true,
    writable: true,  // Can be flashed
    protected: false,
    securityLevel: 1,
    description: 'Application flash memory (programmable with security)',
    data: Array.from({ length: 256 }, (_, i) => 0x10 + (i & 0xFF)),  // Sample data pattern
  } as any,

  // Public Calibration Data - No security required
  {
    name: 'Calibration Public',
    address: 0x00100000,
    size: 0x00100000,  // 1MB
    accessible: true,
    writable: true,  // Can be updated
    protected: false,
    securityLevel: 0,
    description: 'Public calibration parameters (read without security)',
    data: Array.from({ length: 512 }, (_, i) => 0x20 + (i & 0xFF)),  // Sample calibration data
  } as any,

  // OEM Calibration Data - Security Level 1 required
  {
    name: 'Calibration OEM',
    address: 0x00200000,
    size: 0x00100000,  // 1MB
    accessible: true,
    writable: true,  // Can be updated with security
    protected: false,
    securityLevel: 1,
    description: 'OEM-specific calibration data (security required)',
    data: Array.from({ length: 256 }, (_, i) => 0x30 + (i & 0xFF)),
  } as any,

  // RAM - Security Level 1 required, not writable via download (volatile)
  {
    name: 'RAM',
    address: 0x00300000,
    size: 0x00100000,  // 1MB
    accessible: true,
    writable: false,  // Cannot download to RAM (use Write Memory instead)
    protected: false,
    securityLevel: 1,
    description: 'Runtime RAM data (security required)',
    data: Array.from({ length: 1024 }, (_, i) => 0x40 + (i & 0xFF)),
  } as any,

  // Bootloader - Protected, cannot be overwritten
  {
    name: 'Bootloader',
    address: 0x00400000,
    size: 0x00010000,  // 64KB
    accessible: true,
    writable: false,
    protected: true,  // Write-protected (bootloader must not be touched)
    securityLevel: 1,
    description: 'Bootloader code (read-only, protected)',
    data: Array.from({ length: 128 }, (_, i) => 0xB0 + (i & 0xFF)),
  } as any,
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
    ServiceId.TESTER_PRESENT,
    ServiceId.ACCESS_TIMING_PARAMETER,
    ServiceId.CONTROL_DTC_SETTING,
  ],
  dataIdentifiers: mockDataIdentifiers,
  dtcs: mockDTCs,
  routines: mockRoutines,
  memoryMap: mockMemoryMap,
  securitySeed: [0x12, 0x34, 0x56, 0x78],
  securityKey: [0xB7, 0x6E, 0xA6, 0x77],
  maxBlockLength: 4096,  // 4KB per Transfer Data block
};
