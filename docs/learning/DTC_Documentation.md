# DTC (Diagnostic Trouble Code) Documentation

## Overview

This document describes the Diagnostic Trouble Codes (DTCs) implemented in the UDS Simulator, how to read them, and how to clear them using standard UDS services.

---

## Table of Contents

1. [DTC Categories](#dtc-categories)
2. [Implemented DTCs](#implemented-dtcs)
3. [Reading DTCs (Service 0x19)](#reading-dtcs-service-0x19)
4. [Clearing DTCs (Service 0x14)](#clearing-dtcs-service-0x14)
5. [DTC Status Byte](#dtc-status-byte)
6. [Using the DTC Management Panel](#using-the-dtc-management-panel)
7. [Examples](#examples)

---

## DTC Categories

DTCs are categorized according to SAE J2012 / ISO 15031-6 standards:

| Prefix | Category    | First Hex Digit | Description                              |
|--------|-------------|-----------------|------------------------------------------|
| P      | Powertrain  | 0x01            | Engine, transmission, fuel system        |
| C      | Chassis     | 0x02            | ABS, suspension, steering                |
| B      | Body        | 0x03            | Airbags, lighting, seats, HVAC           |
| U      | Network     | 0x04            | CAN bus, communication failures          |

---

## Implemented DTCs

The simulator includes **15 pre-configured DTCs** across all four categories:

### Powertrain DTCs (P-codes)

| DTC Code   | Hex Code   | Description                                    | Severity |
|------------|------------|------------------------------------------------|----------|
| P0101      | 0x010101   | Mass Air Flow Sensor Range/Performance Problem | High     |
| P0171      | 0x010171   | System Too Lean (Bank 1)                       | Medium   |
| P0300      | 0x010300   | Random/Multiple Cylinder Misfire Detected      | Critical |
| P0420      | 0x010420   | Catalyst System Efficiency Below Threshold     | Medium   |
| P0562      | 0x010562   | System Voltage Low                             | Low      |

### Chassis DTCs (C-codes)

| DTC Code   | Hex Code   | Description                           | Severity |
|------------|------------|---------------------------------------|----------|
| C0035      | 0x020035   | Left Front Wheel Speed Sensor Circuit | High     |
| C0045      | 0x020045   | ABS Hydraulic Pump Motor Circuit      | Critical |
| C1234      | 0x021234   | Steering Angle Sensor Malfunction     | Medium   |

### Body DTCs (B-codes)

| DTC Code   | Hex Code   | Description                                   | Severity |
|------------|------------|-----------------------------------------------|----------|
| B0056      | 0x030056   | Driver Seat Position Sensor Circuit           | Low      |
| B1001      | 0x031001   | Headlight Low Beam Left Circuit Open          | Medium   |
| B1801      | 0x031801   | Air Bag Warning Indicator Circuit Short       | Critical |

### Network DTCs (U-codes)

| DTC Code   | Hex Code   | Description                                | Severity |
|------------|------------|-------------------------------------------|----------|
| U0001      | 0x040001   | High Speed CAN Communication Bus          | Critical |
| U0100      | 0x040100   | Lost Communication With ECM/PCM "A"       | High     |
| U0155      | 0x040155   | Lost Communication With Instrument Cluster | Medium   |

---

## Reading DTCs (Service 0x19)

### Service Overview

**Service ID:** `0x19` (Read DTC Information)  
**Positive Response:** `0x59`

This service supports multiple subfunctions for different types of DTC reports.

### Supported Subfunctions

| Sub-function | Name                                  | Request Format                      |
|--------------|---------------------------------------|-------------------------------------|
| 0x01         | reportNumberOfDTCByStatusMask         | `19 01 [StatusMask]`                |
| 0x02         | reportDTCByStatusMask                 | `19 02 [StatusMask]`                |
| 0x03         | reportDTCSnapshotIdentification       | `19 03`                             |
| 0x04         | reportDTCSnapshotRecordByDTCNumber    | `19 04 [DTC-3B] [RecordNum]`        |
| 0x06         | reportDTCExtDataRecordByDTCNumber     | `19 06 [DTC-3B] [RecordNum]`        |
| 0x07         | reportNumberOfDTCBySeverityMaskRecord | `19 07 [SeverityMask] [StatusMask]` |
| 0x08         | reportDTCBySeverityMaskRecord         | `19 08 [SeverityMask] [StatusMask]` |
| 0x09         | reportSeverityInformationOfDTC        | `19 09 [DTC-3B]`                    |
| 0x0A         | reportSupportedDTC                    | `19 0A`                             |
| 0x0B         | reportFirstTestFailedDTC              | `19 0B`                             |
| 0x0C         | reportFirstConfirmedDTC               | `19 0C`                             |
| 0x0D         | reportMostRecentTestFailedDTC         | `19 0D`                             |
| 0x0E         | reportMostRecentConfirmedDTC          | `19 0E`                             |
| 0x0F         | reportMirrorMemoryDTCByStatusMask     | `19 0F [StatusMask]` (Extended session required) |

### Status Mask Values

| Bit | Value  | Description                          |
|-----|--------|--------------------------------------|
| 0   | 0x01   | Test Failed                          |
| 1   | 0x02   | Test Failed This Operation Cycle     |
| 2   | 0x04   | Pending DTC                          |
| 3   | 0x08   | Confirmed DTC                        |
| 4   | 0x10   | Test Not Completed Since Last Clear  |
| 5   | 0x20   | Test Failed Since Last Clear         |
| 6   | 0x40   | Test Not Completed This Cycle        |
| 7   | 0x80   | Warning Indicator Requested          |

**Common Masks:**
- `0xFF` - All DTCs (any status)
- `0x08` - Confirmed DTCs only
- `0x04` - Pending DTCs only
- `0x01` - Active/Test Failed DTCs

### Response Format

**Subfunction 0x01 (Count):**
```
59 01 [StatusAvailMask] [DTCFormat] [CountHigh] [CountLow]
```

**Subfunction 0x02 (List with Status):**
```
59 02 [StatusAvailMask] [DTC1-High] [DTC1-Mid] [DTC1-Low] [Status1] [DTC2...]
```

---

## Clearing DTCs (Service 0x14)

### Service Overview

**Service ID:** `0x14` (Clear Diagnostic Information)  
**Positive Response:** `0x54`

### Request Format

```
14 [GroupHigh] [GroupMid] [GroupLow]
```

### Group of DTC Values

| Value      | Description                    |
|------------|--------------------------------|
| 0xFFFFFF   | Clear ALL DTCs                 |
| 0x010000   | Clear Powertrain DTCs only     |
| 0x020000   | Clear Chassis DTCs only        |
| 0x030000   | Clear Body DTCs only           |
| 0x040000   | Clear Network DTCs only        |
| [DTC Code] | Clear specific DTC             |

### Examples

**Clear All DTCs:**
```
Request:  14 FF FF FF
Response: 54
```

**Clear Specific DTC (P0101):**
```
Request:  14 01 01 01
Response: 54
```

### Session Requirements

- **Default Session (0x01):** Clear allowed
- **Extended Session (0x03):** Clear allowed
- **Programming Session (0x02):** Clear allowed
- **Safety Session (0x04):** Clear **BLOCKED** (NRC 0x22 - Conditions Not Correct)

> ⚠️ **Note:** Safety Session blocks DTC clearing to preserve diagnostic evidence for safety-critical analysis.

---

## DTC Status Byte

Each DTC has an 8-bit status byte indicating its current state:

```
Bit 7: Warning Indicator Requested (WIR)
Bit 6: Test Not Completed This Cycle (TNC)
Bit 5: Test Failed Since Last Clear (TFS)
Bit 4: Test Not Completed Since Clear (TNCSLC)
Bit 3: Confirmed DTC (CD)
Bit 2: Pending DTC (PD)
Bit 1: Test Failed This Operation Cycle (TFTOC)
Bit 0: Test Failed (TF)
```

### Status Interpretation

| Status Byte | Meaning                                          |
|-------------|--------------------------------------------------|
| 0x09        | Active + Confirmed (TF + CD)                     |
| 0x2B        | Active, Confirmed, Warning (TF + TFS + CD + WIR) |
| 0x24        | Pending (TFS + PD)                               |
| 0x28        | Confirmed but not currently failing (CD + TFS)   |

---

## Using the DTC Management Panel

The **DTC Management Panel** is located on the **Cluster Dashboard** page and provides a graphical interface for DTC operations.

### Quick Action Buttons

| Button           | UDS Request              | Description                    |
|------------------|--------------------------|--------------------------------|
| Count All        | `19 01 FF`               | Count all DTCs                 |
| Read All         | `19 02 FF`               | List all DTCs with status      |
| Confirmed Only   | `19 02 08`               | List only confirmed DTCs       |
| Pending Only     | `19 02 04`               | List only pending DTCs         |
| Supported DTCs   | `19 0A`                  | List all supported DTC codes   |
| Clear All DTCs   | `14 FF FF FF`            | Clear all stored DTCs          |

### Category Tabs

Filter DTCs by category:
- **All** - Show all DTCs
- **Powertrain** - P-codes only
- **Chassis** - C-codes only
- **Body** - B-codes only
- **Network** - U-codes only

### Status Filters

- **All** - No filter
- **Confirmed** - Only confirmed DTCs (status bit 3)
- **Pending** - Only pending DTCs (status bit 2)
- **Active** - Only test-failed DTCs (status bit 0)

### DTC Card Features

Click on any DTC card to expand and view:
- **Status Byte Visualization** - 8-bit binary representation
- **Occurrence Counter** - How many times the fault occurred
- **Aging Counter** - Driving cycles since last failure
- **First/Most Recent Failure** - Timestamps
- **Freeze Frame Data** - Snapshot of vehicle parameters when fault occurred
- **Extended Data** - Aging, self-healing, and test completion info

### Detail Actions

| Button               | UDS Request                    | Description                      |
|----------------------|--------------------------------|----------------------------------|
| Read Snapshot        | `19 04 [DTC] FF`               | Read freeze frame data           |
| Read Extended Data   | `19 06 [DTC] FF`               | Read extended data records       |

---

## Examples

### Example 1: Count All DTCs

**Request:**
```
19 01 FF
```

**Response:**
```
59 01 FF 01 00 0F
```
- `59` - Positive response (0x19 + 0x40)
- `01` - Subfunction echo
- `FF` - Status availability mask (all bits supported)
- `01` - DTC format (ISO 15031-6)
- `00 0F` - DTC count = 15

### Example 2: Read All Confirmed DTCs

**Request:**
```
19 02 08
```

**Response:**
```
59 02 FF 01 01 01 2B 01 03 00 2B 01 04 20 29 ...
```
- Each DTC is 4 bytes: [DTCHigh][DTCMid][DTCLow][Status]

### Example 3: Read Freeze Frame for P0101

**Request:**
```
19 04 01 01 01 FF
```

**Response:**
```
59 04 01 01 01 2B 01 0A [Data...]
```
- Contains vehicle speed, RPM, coolant temp, etc. at time of failure

### Example 4: Clear All DTCs

**Request:**
```
14 FF FF FF
```

**Response:**
```
54
```

### Example 5: Read Most Recent Confirmed DTC

**Request:**
```
19 0E
```

**Response:**
```
59 0E FF 04 00 01 2B
```
- Returns U0001 (High Speed CAN Bus) as most recent confirmed DTC

---

## Troubleshooting

### Common Negative Response Codes (NRCs)

| NRC  | Name                                  | Cause                                      |
|------|---------------------------------------|-------------------------------------------|
| 0x12 | Sub-function Not Supported            | Invalid subfunction for SID 0x19          |
| 0x13 | Incorrect Message Length              | Wrong number of bytes in request          |
| 0x22 | Conditions Not Correct                | Session doesn't allow operation           |
| 0x31 | Request Out Of Range                  | DTC not found or invalid record number    |

### Tips

1. **Always read DTCs before clearing** - Document the faults first
2. **Use Extended Session** for advanced DTC operations
3. **Check session before clearing** - Safety Session blocks clear operations
4. **Use status masks** to filter DTCs efficiently
5. **Review freeze frame data** to understand conditions when fault occurred

---

## Related Services

| Service | Description                        |
|---------|------------------------------------|
| 0x10    | Diagnostic Session Control         |
| 0x14    | Clear Diagnostic Information       |
| 0x19    | Read DTC Information               |
| 0x22    | Read Data By Identifier            |

---

*Last Updated: December 2024*
