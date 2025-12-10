# DTC Implementation Guide

## Overview

This document explains how Diagnostic Trouble Codes (DTCs) are implemented in the UDS Simulator website. The implementation follows the ISO 14229 (UDS) standard and provides a realistic simulation of automotive diagnostic fault handling.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  src/services/mockECU.ts                                        │
│  └── mockDTCs[] - Pre-defined DTCs with initial status          │
│  └── mockECUConfig - Exported ECU configuration with DTCs       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTEXT LAYER                               │
│  src/context/UDSContext.tsx                                     │
│  └── ecuConfig - Exposes DTCs to all components                 │
│  └── updateDTCStatus() - Runtime DTC activation/deactivation    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ ClusterDashboard │ │ DTCManagement    │ │ UDSSimulator         │
│ Page             │ │ Panel            │ │ (Service Handler)    │
│ - Fault triggers │ │ - DTC display    │ │ - SID 0x19 handling  │
│ - Vehicle sim    │ │ - Filtering      │ │ - SID 0x14 handling  │
└──────────────────┘ └──────────────────┘ └──────────────────────┘
```

---

## 1. DTC Data Structure

### Location: `src/types/uds.ts`

```typescript
// DTC Status Masks (8-bit status byte per ISO 14229)
export interface DTCStatusMask {
  testFailed: boolean;                      // Bit 0
  testFailedThisOperationCycle: boolean;    // Bit 1
  pendingDTC: boolean;                      // Bit 2
  confirmedDTC: boolean;                    // Bit 3
  testNotCompletedSinceLastClear: boolean;  // Bit 4
  testFailedSinceLastClear: boolean;        // Bit 5
  testNotCompletedThisOperationCycle: boolean; // Bit 6
  warningIndicatorRequested: boolean;       // Bit 7
}

// Complete DTC Information
export interface DTCInfo {
  code: number;                    // 3-byte DTC code (e.g., 0x010101 for P0101)
  status: DTCStatusMask;           // 8-bit status byte
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityByte?: DTCSeverity;      // ISO 14229 severity byte
  category: DTCCategory;           // 'powertrain' | 'chassis' | 'body' | 'network'
  description: string;             // Human-readable description
  occurrenceCounter: number;       // Times fault occurred
  agingCounter: number;            // Cycles since last failure
  firstFailureTimestamp?: number;  // When DTC first failed
  mostRecentFailureTimestamp?: number;
  snapshots?: DTCSnapshotRecord[]; // Freeze frame data
  extendedData?: DTCExtendedDataRecord[];
}
```

### DTC Categories

| Category   | Prefix | Code Range | Description |
|------------|--------|------------|-------------|
| Powertrain | P      | 0x01XXXX   | Engine, transmission, emissions |
| Chassis    | C      | 0x02XXXX   | ABS, steering, suspension |
| Body       | B      | 0x03XXXX   | Airbag, lighting, doors |
| Network    | U      | 0x04XXXX   | CAN bus, communication |

---

## 2. Pre-defined DTCs

### Location: `src/services/mockECU.ts`

The simulator includes 15 pre-configured DTCs:

#### Powertrain DTCs (P-codes)
| Code     | DTC ID   | Description                          | Severity |
|----------|----------|--------------------------------------|----------|
| P0101    | 0x010101 | MAF Sensor Range/Performance         | High     |
| P0171    | 0x010171 | System Too Lean (Bank 1)            | Medium   |
| P0300    | 0x010300 | Random/Multiple Cylinder Misfire    | Critical |
| P0420    | 0x010420 | Catalyst Efficiency Below Threshold | Medium   |
| P0562    | 0x010562 | System Voltage Low                  | Low      |

#### Chassis DTCs (C-codes)
| Code     | DTC ID   | Description                     | Severity |
|----------|----------|---------------------------------|----------|
| C0035    | 0x020035 | Left Front Wheel Speed Sensor  | High     |
| C0045    | 0x020045 | ABS Hydraulic Pump Motor       | Critical |
| C1234    | 0x021234 | Steering Angle Sensor          | Medium   |

#### Body DTCs (B-codes)
| Code     | DTC ID   | Description                    | Severity |
|----------|----------|--------------------------------|----------|
| B0056    | 0x030056 | Driver Seat Position Sensor   | Low      |
| B1001    | 0x031001 | Headlight Low Beam Left       | Medium   |
| B1801    | 0x031801 | Air Bag Warning Indicator     | Critical |

#### Network DTCs (U-codes)
| Code     | DTC ID   | Description                        | Severity |
|----------|----------|------------------------------------|----------|
| U0001    | 0x040001 | High Speed CAN Communication Bus  | Critical |
| U0100    | 0x040100 | Lost Communication with ECM/PCM   | High     |
| U0121    | 0x040121 | Lost Communication with ABS       | High     |
| U0155    | 0x040155 | Lost Communication with Cluster   | Medium   |

---

## 3. DTC Activation/Deactivation

### Location: `src/context/UDSContext.tsx`

The `updateDTCStatus` function handles runtime DTC state changes:

```typescript
const updateDTCStatus = useCallback((
  dtcCode: number, 
  isActive: boolean, 
  capturedState?: VehicleState
) => {
  const dtcIndex = mockECUConfig.dtcs.findIndex(d => d.code === dtcCode);
  if (dtcIndex === -1) return;

  const dtc = mockECUConfig.dtcs[dtcIndex];
  const currentTime = Date.now();

  if (isActive) {
    // ACTIVATE DTC
    dtc.status = {
      ...dtc.status,
      testFailed: true,
      testFailedThisOperationCycle: true,
      confirmedDTC: true,
      testFailedSinceLastClear: true,
    };
    dtc.occurrenceCounter++;
    
    if (!dtc.firstFailureTimestamp) {
      dtc.firstFailureTimestamp = currentTime;
    }
    dtc.mostRecentFailureTimestamp = currentTime;

    // Capture freeze frame from vehicle state
    if (capturedState && dtc.snapshots?.length > 0) {
      dtc.snapshots[0].data = {
        vehicleSpeed: capturedState.vehicleSpeedKph,
        engineRPM: capturedState.engineRpm,
        coolantTemp: capturedState.coolantTemperature,
        // ... other vehicle parameters
      };
    }
  } else {
    // DEACTIVATE DTC
    dtc.status = {
      ...dtc.status,
      testFailed: false,
      testFailedThisOperationCycle: false,
      pendingDTC: false,
    };
    dtc.agingCounter++;
  }
}, []);
```

---

## 4. Cluster Dashboard Integration

### Location: `src/pages/ClusterDashboardPage.tsx`

The Cluster Dashboard provides fault trigger toggles that activate DTCs in real-time:

```typescript
// Fault trigger state
const [faultTriggers, setFaultTriggers] = useState({
  powertrain: {
    mafFault: false,
    coolantTempSensorFault: false,
    misfireDetected: false,
    fuelPressureLow: false,
  },
  brakes: {
    wheelSpeedFLFault: false,
    absPumpMotorFailure: false,
  },
  body: {
    driverDoorSwitchStuck: false,
  },
  network: {
    canTimeoutEngineEcu: false,
    canTimeoutAbs: false,
  },
});

// Effect that updates DTCs when triggers change
useEffect(() => {
  updateDTCStatus(0x010101, faultTriggers.powertrain.mafFault, vehicleState);
  updateDTCStatus(0x010300, faultTriggers.powertrain.misfireDetected, vehicleState);
  updateDTCStatus(0x020035, faultTriggers.brakes.wheelSpeedFLFault, vehicleState);
  // ... more DTC updates
}, [faultTriggers, vehicleState, updateDTCStatus]);
```

---

## 5. DTC Management Panel

### Location: `src/components/DTCManagementPanel.tsx`

The DTC Management Panel provides a UI for viewing and managing DTCs:

### Features:
- **Category Tabs**: Filter by Powertrain, Chassis, Body, Network
- **Status Filters**: Filter by Confirmed, Pending, Test Failed, Warning Indicator
- **DTC Cards**: Display code, description, severity, occurrence count
- **Status Byte Visualization**: Visual representation of 8-bit status
- **Quick Actions**: Read DTCs (SID 0x19), Clear DTCs (SID 0x14)

### Key Functions:

```typescript
// Send DTC read request via UDS Service 0x19
const handleReadDTCs = (subfunction: number, statusMask: number = 0xFF) => {
  sendRequest({
    sid: 0x19,
    subFunction: subfunction,
    data: [statusMask],
    timestamp: Date.now(),
  });
};

// Send clear DTC request via UDS Service 0x14
const handleClearDTCs = () => {
  sendRequest({
    sid: 0x14,
    data: [0xFF, 0xFF, 0xFF], // Clear all DTCs
    timestamp: Date.now(),
  });
};
```

---

## 6. UDS Service Integration

### SID 0x19 - Read DTC Information

The simulator supports multiple subfunctions:

| Subfunction | Name                              | Description |
|-------------|-----------------------------------|-------------|
| 0x01        | reportNumberOfDTCByStatusMask    | Count DTCs matching status |
| 0x02        | reportDTCByStatusMask            | List DTCs matching status |
| 0x03        | reportDTCSnapshotIdentification  | List snapshot IDs |
| 0x04        | reportDTCSnapshotRecordByDTCNumber | Get freeze frame data |
| 0x06        | reportDTCExtDataRecordByDTCNumber | Get extended data |
| 0x0A        | reportSupportedDTC               | List all supported DTCs |

### SID 0x14 - Clear Diagnostic Information

Clears DTCs and resets status bytes:
- Request: `14 FF FF FF` (clear all groups)
- Response: `54` (positive response)

---

## 7. Freeze Frame Data (Snapshots)

When a DTC is activated, the system captures a snapshot of vehicle parameters:

```typescript
interface DTCSnapshotRecord {
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
```

---

## 8. File Reference

| File | Purpose |
|------|---------|
| `src/types/uds.ts` | DTC type definitions |
| `src/services/mockECU.ts` | Pre-defined DTCs and ECU config |
| `src/context/UDSContext.tsx` | DTC state management and updateDTCStatus |
| `src/components/DTCManagementPanel.tsx` | DTC display UI component |
| `src/pages/ClusterDashboardPage.tsx` | Fault trigger UI and vehicle simulation |
| `src/utils/udsHelpers.ts` | DTC formatting and utility functions |

---

## 9. Usage Examples

### Activate a DTC Programmatically
```typescript
const { updateDTCStatus, vehicleState } = useUDS();

// Activate P0300 - Misfire
updateDTCStatus(0x010300, true, vehicleState);
```

### Read All Confirmed DTCs
```typescript
const { sendRequest } = useUDS();

sendRequest({
  sid: 0x19,
  subFunction: 0x02,  // reportDTCByStatusMask
  data: [0x08],       // Status mask: confirmedDTC only
  timestamp: Date.now(),
});
```

### Clear All DTCs
```typescript
const { sendRequest } = useUDS();

sendRequest({
  sid: 0x14,
  data: [0xFF, 0xFF, 0xFF],
  timestamp: Date.now(),
});
```

---

## 10. Summary

The DTC implementation provides:
- ✅ ISO 14229 compliant status byte handling
- ✅ 15 realistic pre-configured DTCs across all categories
- ✅ Runtime activation/deactivation via Cluster Dashboard
- ✅ Freeze frame data capture on fault occurrence
- ✅ UDS Service 0x19 and 0x14 integration
- ✅ Visual DTC Management Panel for monitoring
