# DTC Interpretation Guide

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Purpose**: Step-by-step procedures for reading and interpreting Diagnostic Trouble Codes

---

## 📋 Table of Contents

1. [DTC Code Structure](#dtc-code-structure)
2. [Reading DTCs Step-by-Step](#reading-dtcs-step-by-step)
3. [Status Byte Interpretation](#status-byte-interpretation)
4. [Freeze Frame Analysis](#freeze-frame-analysis)
5. [Extended Data Interpretation](#extended-data-interpretation)
6. [Common DTC Patterns](#common-dtc-patterns)
7. [Troubleshooting Flowcharts](#troubleshooting-flowcharts)

---

## DTC Code Structure

### 3-Byte DTC Format (ISO 14229-1)

```
┌─────────────────────────────────────────────────────────────┐
│            3-BYTE DTC CODE STRUCTURE                        │
├─────────────────────────────────────────────────────────────┤
│  Byte 1 (High)   │   Byte 2 (Middle)   │   Byte 3 (Low)    │
│                  │                     │                   │
│  [Category + D1] │   [D2 + D3]         │   [D4 + D5]       │
└─────────────────────────────────────────────────────────────┘

Example: 0x01 0x03 0x01 = P0301 (Cylinder 1 Misfire)
         ├─┘    └─┬─┘
         │       └── 0301 = Fault number
         └── 01 = Powertrain (P-code)
```

### Category Prefixes

| First Nibble | Category | Description | Common Causes |
|--------------|----------|-------------|---------------|
| 0x00-0x3F | P (Powertrain) | Engine, transmission, drivetrain | Sensors, actuators, fuel/air |
| 0x40-0x7F | C (Chassis) | ABS, stability, suspension | Wheel sensors, hydraulics |
| 0x80-0xBF | B (Body) | Airbag, lighting, HVAC | Switches, motors, BCM |
| 0xC0-0xFF | U (Network) | CAN bus, ECU communication | Wiring, module failures |

### Quick Code Lookup

```
┌──────────────────────────────────────────────────────────────┐
│                COMMON DTC CODE RANGES                        │
├──────────────────────────────────────────────────────────────┤
│ P0100-P0199 │ Air/Fuel Metering (MAF, MAP, O2 sensors)       │
│ P0200-P0299 │ Fuel and Air Metering (Injectors)              │
│ P0300-P0399 │ Ignition System (Misfire)                      │
│ P0400-P0499 │ Auxiliary Emission (EGR, Catalyst)             │
│ P0500-P0599 │ Vehicle Speed, Idle Control                    │
│ P0600-P0699 │ ECU Internal (Memory, Processor)               │
│ P0700-P0799 │ Transmission (Shift, Torque Converter)         │
├──────────────────────────────────────────────────────────────┤
│ C0035-C0099 │ Wheel Speed Sensors                            │
│ C1200-C1299 │ Steering Angle Sensors                         │
│ C1300-C1399 │ Stability Control                              │
├──────────────────────────────────────────────────────────────┤
│ B0000-B0099 │ Driver/Passenger Restraints                    │
│ B1000-B1999 │ Body Control Module                            │
├──────────────────────────────────────────────────────────────┤
│ U0100-U0199 │ Lost Communication with ECU                    │
│ U0400-U0499 │ Invalid Data Received                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Reading DTCs Step-by-Step

### Procedure 1: Count Active DTCs

**Purpose**: Quickly check how many faults are stored

```
Step 1: Send count request
   Request:  19 01 FF
             │  │  └── Status mask (FF = all)
             │  └── Subfunction 0x01 (count)
             └── SID 0x19 (Read DTC)

Step 2: Parse response
   Response: 59 01 FF 01 00 05
             │  │  │  │  └──┴── Count: 0x0005 = 5 DTCs
             │  │  │  └── Format: ISO 14229-1
             │  │  └── Availability mask
             │  └── Subfunction echo
             └── Positive response (0x19 + 0x40)
```

### Procedure 2: Read All DTCs

**Purpose**: Get complete list with status bytes

```
Step 1: Send read request
   Request:  19 02 FF
             │  │  └── Status mask (FF = all)
             │  └── Subfunction 0x02 (read by status)
             └── SID 0x19

Step 2: Parse response
   Response: 59 02 FF [DTC1 3-bytes][Status1] [DTC2 3-bytes][Status2]...

   Example:  59 02 FF 01 03 00 29 02 00 45 04

   Interpretation:
   ┌────────────┬────────────┬────────────────────────────────┐
   │ DTC Bytes  │ Status     │ Meaning                        │
   ├────────────┼────────────┼────────────────────────────────┤
   │ 01 03 00   │ 0x29       │ P0300: Confirmed + Failed      │
   │ 02 00 45   │ 0x04       │ C0045: Pending only            │
   └────────────┴────────────┴────────────────────────────────┘
```

### Procedure 3: Read Specific Status Types

**Purpose**: Filter for only confirmed, pending, or failed DTCs

```
┌─────────────────────────────────────────────────────────────┐
│               COMMON STATUS MASK FILTERS                     │
├─────────────────────────────────────────────────────────────┤
│ 19 02 01   │ Failed tests only (testFailed = 1)             │
│ 19 02 04   │ Pending DTCs only (waiting confirmation)        │
│ 19 02 08   │ Confirmed DTCs only (mature faults)             │
│ 19 02 09   │ Confirmed OR Failed (active issues)             │
│ 19 02 80   │ Warning lamp active (MIL on)                    │
│ 19 02 FF   │ All DTCs (any status)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Byte Interpretation

### Complete Status Bit Map

```
┌─────────────────────────────────────────────────────────────┐
│          8-BIT DTC STATUS BYTE STRUCTURE                    │
├─────────────────────────────────────────────────────────────┤
│ Bit │ Mask │ Name                    │ When Set (1)         │
├─────┼──────┼─────────────────────────┼──────────────────────┤
│  0  │ 0x01 │ testFailed              │ Test currently failing│
│  1  │ 0x02 │ testFailedThisOpCycle   │ Failed once this cycle│
│  2  │ 0x04 │ pendingDTC              │ Waiting confirmation  │
│  3  │ 0x08 │ confirmedDTC            │ Fault is mature       │
│  4  │ 0x10 │ testNotCompSinceLastClr │ Not tested after clear│
│  5  │ 0x20 │ testFailedSinceLastClr  │ Failed after last clr │
│  6  │ 0x40 │ testNotCompThisOpCycle  │ Not tested this cycle │
│  7  │ 0x80 │ warningIndicatorReq     │ MIL/warning lamp on   │
└─────────────────────────────────────────────────────────────┘
```

### Status Interpretation Examples

| Status | Binary | Meaning | Action |
|--------|--------|---------|--------|
| 0x00 | 00000000 | Cleared, no issues | No action |
| 0x04 | 00000100 | Pending (1st failure) | Monitor closely |
| 0x08 | 00001000 | Confirmed, not active | Previous fault, cleared itself |
| 0x09 | 00001001 | Confirmed + Active | URGENT: Active fault |
| 0x29 | 00101001 | Confirmed + Active + HistoryFail | Recurring issue |
| 0x89 | 10001001 | Confirmed + Active + MIL | Critical: Warning lamp ON |

### Decision Tree for Status

```
                    ┌─────────────┐
                    │ Status Byte │
                    └──────┬──────┘
                           │
               ┌───────────┴───────────┐
               │ Bit 7 (MIL) = 1?      │
               └───────────┬───────────┘
                    ┌──────┴──────┐
                   YES           NO
                    │             │
            ┌───────┴───────┐    │
            │ ⚠️ CRITICAL   │    │
            │ Lamp is ON    │    │
            │ Check engine! │    │
            └───────────────┘    │
                                 │
                    ┌────────────┴────────────┐
                    │ Bit 3 (Confirmed) = 1?  │
                    └────────────┬────────────┘
                          ┌──────┴──────┐
                         YES           NO
                          │             │
              ┌───────────┴───────┐    │
              │ Bit 0 (Failed) = 1?│   │
              └───────────┬───────┘   │
                   ┌──────┴──────┐    │
                  YES           NO    │
                   │             │    │
           ┌───────┴───┐  ┌─────┴────┴────┐
           │ 🔴 ACTIVE │  │ ⚪ HISTORICAL │
           │ Repair NOW│  │ Monitor       │
           └───────────┘  └───────────────┘
```

---

## Freeze Frame Analysis

### Reading Freeze Frame Data

**Purpose**: Understand vehicle conditions when fault occurred

```
Request: 19 04 [DTC-3bytes] [RecordNum]
Example: 19 04 01 03 00 01
               └───┬───┘ └┘
               P0300     Record #1

Response: 59 04 01 03 00 09 01 03 [Data Records]
                └───┬───┘ │  │  └── Freeze frame data
                  DTC     │  └── Record number
                          └── Status byte
```

### Common Freeze Frame DIDs

| DID | Parameter | Unit | Typical Range |
|-----|-----------|------|---------------|
| 0x0C | Engine RPM | RPM | 0-8000 |
| 0x0D | Vehicle Speed | km/h | 0-255 |
| 0x05 | Coolant Temp | °C | -40 to 215 |
| 0x0F | Intake Air Temp | °C | -40 to 215 |
| 0x11 | Throttle Position | % | 0-100 |
| 0x04 | Engine Load | % | 0-100 |
| 0x42 | Battery Voltage | V | 0-25.5 |

### Interpreting Freeze Frame

```
Example Snapshot:
┌────────────────────────────────────────────────────────────┐
│ DTC P0300 (Misfire) captured at:                           │
├────────────────────────────────────────────────────────────┤
│ • Engine RPM: 3200 RPM ← High load condition               │
│ • Vehicle Speed: 80 km/h ← Highway driving                 │
│ • Coolant Temp: 95°C ← Normal operating temp               │
│ • Throttle: 60% ← Heavy acceleration                       │
│ • Engine Load: 70% ← High demand                           │
├────────────────────────────────────────────────────────────┤
│ DIAGNOSIS: Misfire occurred under high-load acceleration.  │
│ Check: Spark plugs, ignition coils, fuel injectors         │
└────────────────────────────────────────────────────────────┘
```

---

## Extended Data Interpretation

### Reading Extended Data

```
Request: 19 06 [DTC-3bytes] [RecordNum]  (0xFF = all records)
Example: 19 06 01 03 00 FF
```

### Extended Data Records

| Record | Name | Purpose |
|--------|------|---------|
| 0x01 | Occurrence Counter | How many times fault occurred |
| 0x02 | Aging Counter | Drive cycles since last failure |
| 0x03 | Aged Counter | When DTC will self-clear |
| 0x04 | Self-Healing Counter | Successful heals count |

### Interpreting Counters

```
Example Extended Data:
┌───────────────────────────────────────────────────────────┐
│ DTC P0300 Extended Data:                                  │
├───────────────────────────────────────────────────────────┤
│ • Occurrence Counter: 12 ← Fault happened 12 times!       │
│ • Aging Counter: 0 ← Happened recently                    │
│ • Aged Counter: 0 ← Not yet aging out                     │
│ • Self-Healing: 0 ← Never self-cleared                    │
├───────────────────────────────────────────────────────────┤
│ DIAGNOSIS: Frequent recurring fault.                      │
│ This is NOT intermittent - systematic issue!              │
└───────────────────────────────────────────────────────────┘
```

---

## Common DTC Patterns

### Pattern 1: Intermittent Fault

```
Indicators:
- Status: 0x08 (confirmed but not currently failing)
- Occurrence Counter: Low (1-3)
- Aging Counter: Increasing

Action: Monitor, may self-clear after 40 drive cycles
```

### Pattern 2: Hard Fault

```
Indicators:
- Status: 0x89 (confirmed + failed + MIL on)
- Occurrence Counter: High (10+)
- Aging Counter: 0

Action: URGENT repair needed
```

### Pattern 3: Pending Fault

```
Indicators:
- Status: 0x04 (pending only)
- Not yet confirmed

Action: May confirm on next drive cycle, monitor
```

### Pattern 4: Communication Fault (U-codes)

```
Indicators:
- Multiple U-codes present
- Often related modules

Action: Check CAN bus wiring, termination resistors
```

---

## Troubleshooting Flowcharts

### General DTC Diagnosis

```
                    ┌─────────────────┐
                    │ Read All DTCs   │
                    │ (19 02 FF)      │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ DTCs present?   │
                    └────────┬────────┘
                       ┌─────┴─────┐
                      YES          NO
                       │           │
               ┌───────┴───────┐   └→ No issues
               │ Check Status  │
               │ Bytes         │
               └───────┬───────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    Status=0x89   Status=0x08   Status=0x04
    (Active+MIL)  (Historical)  (Pending)
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ URGENT  │  │ READ    │  │ MONITOR │
    │ REPAIR  │  │ FREEZE  │  │ Wait for│
    │ NOW     │  │ FRAME   │  │ confirm │
    └─────────┘  └─────────┘  └─────────┘
```

---

## Quick Reference Commands

| Purpose | Request | Response Format |
|---------|---------|-----------------|
| Count all DTCs | `19 01 FF` | `59 01 FF 01 [count-2B]` |
| Read all DTCs | `19 02 FF` | `59 02 FF [DTC+status]...` |
| Read confirmed only | `19 02 08` | `59 02 08 [DTC+status]...` |
| Freeze frame | `19 04 [DTC] 01` | `59 04 [DTC] [St] 01 [data]` |
| Extended data | `19 06 [DTC] FF` | `59 06 [DTC] [St] [records]` |
| Supported DTCs | `19 0A` | `59 0A [mask] [DTCs]...` |

---

**End of Document**
