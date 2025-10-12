# DTC (Diagnostic Trouble Code) - Complete Learning Guide

**Document Version**: 1.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020, ISO 15031-6, SAE J2012

---

## 📋 Table of Contents

1. [What is a DTC?](#what-is-a-dtc)
2. [DTC Structure and Format](#dtc-structure-and-format)
3. [DTC Categories](#dtc-categories)
4. [DTC Status Byte](#dtc-status-byte)
5. [DTC Lifecycle](#dtc-lifecycle)
6. [DTC Storage Types](#dtc-storage-types)
7. [Freeze Frame and Snapshot Data](#freeze-frame-and-snapshot-data)
8. [Extended Data Records](#extended-data-records)
9. [DTC Severity and Priority](#dtc-severity-and-priority)
10. [Why DTCs Exist](#why-dtcs-exist)
11. [Common DTC Formats](#common-dtc-formats)

---

## What is a DTC?

### Definition

```
┌──────────────────────────────────────────────────────────────┐
│                   DIAGNOSTIC TROUBLE CODE                    │
└──────────────────────────────────────────────────────────────┘

A DTC is a standardized numeric code that identifies a specific
fault condition detected by an Electronic Control Unit (ECU).

Purpose:
  • Enable fault detection and storage
  • Facilitate diagnosis and repair
  • Support regulatory compliance (emissions)
  • Provide standardized fault communication
  • Enable predictive maintenance

┌─────────────────────────────────────────────────────────────┐
│                    DTC SYSTEM OVERVIEW                      │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   SENSOR    │ → Abnormal reading detected
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  ECU LOGIC  │ → Test fails, condition met
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  DTC STORED │ → Code generated and saved
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ DIAGNOSTIC  │ → Technician retrieves code
    │    TOOL     │ → Identifies fault quickly
    └─────────────┘
```

### Real-World Example

```
Scenario: Oxygen Sensor Malfunction

┌──────────────────────────────────────────────────────────────┐
│  Traditional Diagnosis (Without DTC)                         │
├──────────────────────────────────────────────────────────────┤
│  Symptom: Check Engine Light ON                             │
│  Technician must:                                            │
│    1. Test oxygen sensor voltage        (30 min)            │
│    2. Check wiring harness              (20 min)            │
│    3. Verify ECU connections            (15 min)            │
│    4. Test sensor heater circuit        (20 min)            │
│    5. Eliminate other possibilities     (45 min)            │
│  Total Time: ~2+ hours                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Modern Diagnosis (With DTC)                                 │
├──────────────────────────────────────────────────────────────┤
│  1. Connect diagnostic tool              (2 min)            │
│  2. Read DTC: P0135                      (1 min)            │
│     "O2 Sensor Heater Circuit (Bank 1)"                     │
│  3. Check freeze frame data              (2 min)            │
│  4. Verify specific circuit              (10 min)           │
│  Total Time: ~15 minutes                                     │
│  Accuracy: Pinpointed to exact fault                         │
└──────────────────────────────────────────────────────────────┘
```

---

## DTC Structure and Format

### ISO 14229-1 Format (3-Byte DTC)

```
┌──────────────────────────────────────────────────────────────┐
│                    3-BYTE DTC STRUCTURE                      │
└──────────────────────────────────────────────────────────────┘

Byte 1          Byte 2          Byte 3
┌────────┐      ┌────────┐      ┌────────┐
│ HI BYTE│      │MID BYTE│      │LOW BYTE│
└────────┘      └────────┘      └────────┘
   │               │               │
   └───────┬───────┴───────┬───────┘
           │               │
           ▼               ▼
    ┌──────────┐    ┌──────────┐
    │ Category │    │  Fault   │
    │  & Area  │    │  Number  │
    └──────────┘    └──────────┘


Example: P0135 (Oxygen Sensor Heater Circuit)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   P   0   1   3   5                                         │
│   │   │   │   │   │                                         │
│   │   │   │   └───┴─── Specific Fault Number (35 in hex)   │
│   │   │   │                                                 │
│   │   │   └─────────── System (Fuel/Air metering)          │
│   │   │                                                     │
│   │   └─────────────── Generic (0) or Manufacturer (1)     │
│   │                                                         │
│   └─────────────────── Category (P = Powertrain)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Binary Representation:
┌──────────────────────────────────────────────────────────────┐
│ Byte 1: 0x00                                                 │
│         ┌──┬──┬──┬──┬──┬──┬──┬──┐                            │
│         │ 0│ 0│ 0│ 0│ 0│ 0│ 0│ 0│                            │
│         └──┴──┴──┴──┴──┴──┴──┴──┘                            │
│           │  │                                               │
│           └──┴── 00 = Powertrain (P-code)                    │
│                                                              │
│ Byte 2: 0x01                                                 │
│         ┌──┬──┬──┬──┬──┬──┬──┬──┐                            │
│         │ 0│ 0│ 0│ 0│ 0│ 0│ 0│ 1│                            │
│         └──┴──┴──┴──┴──┴──┴──┴──┘                            │
│                                                              │
│ Byte 3: 0x35                                                 │
│         ┌──┬──┬──┬──┬──┬──┬──┬──┐                            │
│         │ 0│ 0│ 1│ 1│ 0│ 1│ 0│ 1│                            │
│         └──┴──┴──┴──┴──┴──┴──┴──┘                            │
│                                                              │
│ Combined: 0x000135 → Display as P0135                        │
└──────────────────────────────────────────────────────────────┘
```

### Category Encoding (First 2 Bits of High Byte)

```
┌──────────────────────────────────────────────────────────────┐
│                    DTC CATEGORY ENCODING                     │
└──────────────────────────────────────────────────────────────┘

Bits 7-6 (High Byte)    Letter    Category        Examples
┌──────────────────┬───────────┬──────────────┬───────────────┐
│ 00               │     P     │ Powertrain   │ P0135, P0420  │
│ 01               │     C     │ Chassis      │ C1234, C0196  │
│ 10               │     B     │ Body         │ B1000, B1342  │
│ 11               │     U     │ Network      │ U0100, U0155  │
└──────────────────┴───────────┴──────────────┴───────────────┘

Visual Representation:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│    High Byte Bit Pattern                                    │
│                                                              │
│    00xxxxxx → P-code (Powertrain)                           │
│    01xxxxxx → C-code (Chassis)                              │
│    10xxxxxx → B-code (Body)                                 │
│    11xxxxxx → U-code (Network/Communication)                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## DTC Categories

### Category Distribution

```
┌──────────────────────────────────────────────────────────────┐
│                      DTC CATEGORIES                          │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ P-CODES: POWERTRAIN (Engine, Transmission)                 │
├─────────────────────────────────────────────────────────────┤
│ Range: P0000 - P3FFF                                        │
│                                                             │
│ Subsystems:                                                 │
│   P0xxx: Generic (ISO/SAE standard)                         │
│   P1xxx: Manufacturer specific                              │
│   P2xxx: Generic (ISO/SAE standard)                         │
│   P3xxx: Manufacturer specific                              │
│                                                             │
│ Examples:                                                   │
│   P0135: O2 Sensor Heater Circuit                          │
│   P0171: System Too Lean (Bank 1)                          │
│   P0420: Catalyst System Efficiency                         │
│   P0562: System Voltage Low                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ C-CODES: CHASSIS (ABS, Suspension, Steering)               │
├─────────────────────────────────────────────────────────────┤
│ Range: C0000 - C3FFF                                        │
│                                                             │
│ Subsystems:                                                 │
│   C0xxx: Generic (ISO/SAE standard)                         │
│   C1xxx: Manufacturer specific                              │
│   C2xxx: Generic (ISO/SAE standard)                         │
│   C3xxx: Manufacturer specific                              │
│                                                             │
│ Examples:                                                   │
│   C0196: ABS Hydraulic Pump Motor Circuit                  │
│   C1234: Wheel Speed Sensor Front Right                    │
│   C1550: Electronic Stability Control                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ B-CODES: BODY (HVAC, Airbags, Lighting, Security)          │
├─────────────────────────────────────────────────────────────┤
│ Range: B0000 - B3FFF                                        │
│                                                             │
│ Subsystems:                                                 │
│   B0xxx: Generic (ISO/SAE standard)                         │
│   B1xxx: Manufacturer specific                              │
│   B2xxx: Generic (ISO/SAE standard)                         │
│   B3xxx: Manufacturer specific                              │
│                                                             │
│ Examples:                                                   │
│   B1000: Airbag Deployment Command Circuit                 │
│   B1342: ECU Internal Failure                              │
│   B1600: HVAC Blower Motor Circuit                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ U-CODES: NETWORK (CAN, LIN, FlexRay Communication)         │
├─────────────────────────────────────────────────────────────┤
│ Range: U0000 - U3FFF                                        │
│                                                             │
│ Subsystems:                                                 │
│   U0xxx: Generic (ISO/SAE standard)                         │
│   U1xxx: Manufacturer specific                              │
│   U2xxx: Generic (ISO/SAE standard)                         │
│   U3xxx: Manufacturer specific                              │
│                                                             │
│ Examples:                                                   │
│   U0100: Lost Communication with ECM/PCM                   │
│   U0121: Lost Communication with ABS Module                │
│   U0155: Lost Communication with Instrument Cluster        │
│   U0401: Invalid Data Received from ECM                    │
└─────────────────────────────────────────────────────────────┘
```

### Generic vs. Manufacturer-Specific

```
┌──────────────────────────────────────────────────────────────┐
│         GENERIC vs. MANUFACTURER-SPECIFIC DTCs               │
└──────────────────────────────────────────────────────────────┘

GENERIC CODES (P0xxx, P2xxx, C0xxx, C2xxx, B0xxx, B2xxx, U0xxx, U2xxx)
┌─────────────────────────────────────────────────────────────┐
│ Characteristics:                                            │
│   ✓ Standardized across all manufacturers                   │
│   ✓ Same meaning regardless of vehicle make                 │
│   ✓ Defined by ISO/SAE standards                            │
│   ✓ Required for regulatory compliance                      │
│   ✓ Universal diagnostic tool compatibility                 │
│                                                             │
│ Example: P0420                                              │
│   All manufacturers: "Catalyst System Efficiency Below      │
│                       Threshold (Bank 1)"                   │
└─────────────────────────────────────────────────────────────┘

MANUFACTURER-SPECIFIC (P1xxx, P3xxx, C1xxx, C3xxx, B1xxx, B3xxx, U1xxx, U3xxx)
┌─────────────────────────────────────────────────────────────┐
│ Characteristics:                                            │
│   ✓ Defined by vehicle manufacturer                         │
│   ✓ Meaning varies by make/model                            │
│   ✓ Cover proprietary systems                               │
│   ✓ Enhanced diagnostic capabilities                        │
│   ✓ May require manufacturer-specific tools                 │
│                                                             │
│ Example: P1234                                              │
│   Ford:     "Fuel Pump Driver Module Offline"               │
│   GM:       "MAP Sensor Circuit Intermittent"               │
│   Toyota:   "Turbocharger/Supercharger Boost Sensor"        │
└─────────────────────────────────────────────────────────────┘
```

---

## DTC Status Byte

### 8-Bit Status Structure

```
┌──────────────────────────────────────────────────────────────┐
│                    DTC STATUS BYTE (8 BITS)                  │
└──────────────────────────────────────────────────────────────┘

Bit Position:  7    6    5    4    3    2    1    0
              ┌────┬────┬────┬────┬────┬────┬────┬────┐
              │ S  │ TF │TP │ CD │ TC │ TP │ TN │ TF │
              │ A  │ TD │ SL│ TC │ SL │ A  │ CT│ AT│
              │    │ C  │ C  │    │ C  │ T  │ L │ MC│
              └────┴────┴────┴────┴────┴────┴────┴────┘
                │    │    │    │    │    │    │    │
                │    │    │    │    │    │    │    └─ Bit 0: Test Failed This Monitoring Cycle
                │    │    │    │    │    │    └────── Bit 1: Test Not Completed This Cycle
                │    │    │    │    │    └─────────── Bit 2: Pending DTC
                │    │    │    │    └──────────────── Bit 3: Confirmed DTC
                │    │    │    └───────────────────── Bit 4: Test Not Completed Since Clear
                │    │    └────────────────────────── Bit 5: Test Failed Since Clear
                │    └─────────────────────────────── Bit 6: Test Not Completed This Cycle
                └──────────────────────────────────── Bit 7: Severity Available


┌──────────────────────────────────────────────────────────────┐
│                  BIT DETAILED EXPLANATIONS                   │
└──────────────────────────────────────────────────────────────┘

Bit 0: Test Failed At Most Recent Test Cycle (testFailed)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Test passed or not executed in last cycle          │
  │ 1 = Test FAILED in most recent monitoring cycle        │
  │                                                        │
  │ Use: Indicates CURRENT fault status                    │
  │      Distinguishes active vs. historical faults        │
  └────────────────────────────────────────────────────────┘

Bit 1: Test Failed This Operating Cycle (testFailedThisOperatingCycle)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Test has not failed this ignition cycle            │
  │ 1 = Test FAILED at least once this ignition cycle      │
  │                                                        │
  │ Use: Tracks faults within current driving session      │
  │      Cleared when ignition turned off                  │
  └────────────────────────────────────────────────────────┘

Bit 2: Pending DTC (pendingDTC)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = DTC not pending                                    │
  │ 1 = Fault detected once, pending confirmation          │
  │                                                        │
  │ Use: Early warning of potential fault                  │
  │      Becomes confirmed if fails again                  │
  └────────────────────────────────────────────────────────┘

Bit 3: Confirmed DTC (confirmedDTC)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = DTC not confirmed                                  │
  │ 1 = Fault confirmed, stored permanently                │
  │                                                        │
  │ Use: Fault has failed multiple times                   │
  │      Requires service/repair attention                 │
  │      Triggers MIL (Malfunction Indicator Lamp)         │
  └────────────────────────────────────────────────────────┘

Bit 4: Test Not Completed Since Last Clear (testNotCompletedSinceLastClear)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Test HAS been completed since DTC clear            │
  │ 1 = Test NOT yet completed since DTC clear             │
  │                                                        │
  │ Use: Verifies repair effectiveness                     │
  │      Ensures all systems tested after clear            │
  └────────────────────────────────────────────────────────┘

Bit 5: Test Failed Since Last Clear (testFailedSinceLastClear)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Test has NOT failed since DTC clear                │
  │ 1 = Test HAS failed at least once since clear          │
  │                                                        │
  │ Use: Indicates fault recurrence after repair           │
  │      Repair verification                               │
  └────────────────────────────────────────────────────────┘

Bit 6: Test Not Completed This Operating Cycle (testNotCompletedThisOperatingCycle)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Test completed this ignition cycle                 │
  │ 1 = Test NOT completed this ignition cycle             │
  │                                                        │
  │ Use: Tracks diagnostic readiness                       │
  │      Emission testing compliance                       │
  └────────────────────────────────────────────────────────┘

Bit 7: Warning Indicator Requested (warningIndicatorRequested)
  ┌────────────────────────────────────────────────────────┐
  │ 0 = Warning lamp NOT requested                         │
  │ 1 = Warning lamp (MIL) requested                       │
  │                                                        │
  │ Use: Controls Check Engine Light                       │
  │      Indicates severity level                          │
  └────────────────────────────────────────────────────────┘
```

### Common Status Values

```
┌──────────────────────────────────────────────────────────────┐
│               COMMON DTC STATUS VALUES                       │
└──────────────────────────────────────────────────────────────┘

Status  Binary      Meaning                        Visual
Value   Bits 76543210                              Indicator
┌──────┬────────────┬──────────────────────────┬──────────────┐
│ 0x00 │ 00000000   │ No Fault / Cleared       │              │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x01 │ 00000001   │ Test Failed (Current)    │ ⚠️ Active    │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x04 │ 00000100   │ Pending DTC              │ ⏳ Pending   │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x08 │ 00001000   │ Confirmed DTC            │ 🔴 Stored    │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x09 │ 00001001   │ Confirmed + Active       │ 🔥 Critical  │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x0C │ 00001100   │ Confirmed + Pending      │ 🟡 Warning   │
├──────┼────────────┼──────────────────────────┼──────────────┤
│ 0x88 │ 10001000   │ Confirmed + MIL ON       │ 💡 MIL ON    │
└──────┴────────────┴──────────────────────────┴──────────────┘

Legend:
  Bit 0 = Test Failed (Current)
  Bit 2 = Pending
  Bit 3 = Confirmed
  Bit 7 = MIL Requested
```

---

## DTC Lifecycle

### Complete Lifecycle State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                  DTC LIFECYCLE STATE MACHINE                 │
└──────────────────────────────────────────────────────────────┘

                      ┌─────────────┐
                      │  NO FAULT   │
                      │  Status=0x00│
                      └──────┬──────┘
                             │
                   First Test Failure
                             │
                             ▼
                      ┌─────────────┐
                      │  PENDING    │
                  ┌───│  Status=0x04│───┐
                  │   └─────────────┘   │
                  │                     │
           Test Passed            Test Failed
          (Next Cycle)             (Again)
                  │                     │
                  ▼                     ▼
           ┌─────────────┐       ┌─────────────┐
           │  CLEARED    │       │ CONFIRMED   │
           │ (Auto-heal) │       │ Status=0x08 │
           │ Status=0x00 │       └──────┬──────┘
           └─────────────┘              │
                                        │
                           ┌────────────┼────────────┐
                           │                         │
                     Fault Active              Fault Inactive
                     (Currently failing)       (Not failing now)
                           │                         │
                           ▼                         ▼
                    ┌─────────────┐          ┌─────────────┐
                    │ CONFIRMED   │          │ CONFIRMED   │
                    │  + ACTIVE   │          │  + AGED     │
                    │ Status=0x09 │          │ Status=0x08 │
                    │ MIL: ON 💡  │          │ MIL: OFF    │
                    └──────┬──────┘          └──────┬──────┘
                           │                        │
                           │                        │
                           │    Manual Clear        │
                           │    (SID 0x14)          │
                           └────────┬───────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │  CLEARED    │
                             │ Status=0x00 │
                             │ All Data    │
                             │ Erased      │
                             └─────────────┘


┌──────────────────────────────────────────────────────────────┐
│                  LIFECYCLE TIMING EXAMPLE                    │
└──────────────────────────────────────────────────────────────┘

Day 1, Morning:
  ┌──────────────────────────────────────────────┐
  │ O2 sensor test FAILS                         │
  │ Status: 0x04 (Pending)                       │
  │ MIL: OFF                                     │
  │ Action: DTC stored as "pending"              │
  └──────────────────────────────────────────────┘

Day 1, Evening (Same driving cycle):
  ┌──────────────────────────────────────────────┐
  │ O2 sensor test FAILS AGAIN                   │
  │ Status: 0x08 → 0x09 (Confirmed + Active)     │
  │ MIL: ON 💡                                   │
  │ Action: DTC confirmed, freeze frame captured │
  └──────────────────────────────────────────────┘

Day 2:
  ┌──────────────────────────────────────────────┐
  │ Sensor replaced by technician                │
  │ DTCs cleared (SID 0x14)                      │
  │ Status: 0x00 (Cleared)                       │
  │ MIL: OFF                                     │
  └──────────────────────────────────────────────┘

Day 3:
  ┌──────────────────────────────────────────────┐
  │ All tests pass                               │
  │ Status: 0x00 (No faults)                     │
  │ Repair verified ✓                            │
  └──────────────────────────────────────────────┘
```

---

## DTC Storage Types

### Memory Classification

```
┌──────────────────────────────────────────────────────────────┐
│                    DTC MEMORY TYPES                          │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRIMARY MEMORY (Permanent Storage)                          │
├─────────────────────────────────────────────────────────────┤
│ Characteristics:                                            │
│   • Non-volatile (survives power loss)                      │
│   • Stores confirmed DTCs                                   │
│   • Includes freeze frame data                              │
│   • Includes extended data (counters, etc.)                 │
│   • Retained until manually cleared                         │
│                                                             │
│ Capacity: Typically 10-50 DTCs depending on ECU             │
│                                                             │
│ Use Case: Long-term fault tracking, repair history          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SECONDARY MEMORY (Pending Storage)                          │
├─────────────────────────────────────────────────────────────┤
│ Characteristics:                                            │
│   • Volatile or semi-volatile                               │
│   • Stores pending DTCs (first-time failures)               │
│   • Auto-cleared if test passes next cycle                  │
│   • Minimal data storage                                    │
│                                                             │
│ Capacity: Usually same as primary memory                    │
│                                                             │
│ Use Case: Early fault detection, preventive maintenance     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MIRROR MEMORY (Diagnostic Mirror)                           │
├─────────────────────────────────────────────────────────────┤
│ Characteristics:                                            │
│   • Volatile (RAM-based)                                    │
│   • Active during diagnostic session only                   │
│   • Used for real-time testing                              │
│   • Cleared when session ends                               │
│                                                             │
│ Capacity: Limited, typically 1-5 DTCs                       │
│                                                             │
│ Use Case: Development, testing, live diagnostics            │
└─────────────────────────────────────────────────────────────┘

Storage Priority:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Emissions-Related DTCs  ────────────► Highest Priority    │
│         │                                                    │
│         ▼                                                    │
│   Safety-Critical DTCs  ──────────────► High Priority       │
│         │                                                    │
│         ▼                                                    │
│   Functional DTCs  ────────────────────► Medium Priority    │
│         │                                                    │
│         ▼                                                    │
│   Informational DTCs  ─────────────────► Low Priority       │
│                                                              │
│ When memory full, lowest priority DTCs may be overwritten   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Freeze Frame and Snapshot Data

### Concept and Purpose

```
┌──────────────────────────────────────────────────────────────┐
│                   FREEZE FRAME / SNAPSHOT DATA               │
└──────────────────────────────────────────────────────────────┘

Concept: "Photograph" of vehicle operating conditions at the
         exact moment a fault was first detected.

Purpose:
  ✓ Provides context for fault diagnosis
  ✓ Helps identify root cause
  ✓ Distinguishes between multiple instances
  ✓ Supports intermittent fault troubleshooting


┌──────────────────────────────────────────────────────────────┐
│                  FREEZE FRAME CAPTURE MOMENT                 │
└──────────────────────────────────────────────────────────────┘

Timeline:
         Normal Operation         Fault Occurs!    Continued Operation
              │                        │                    │
    ──────────┴────────────────────────X────────────────────┴─────
                                       │
                                  SNAPSHOT
                                  captured
                                  HERE! 📸

Captured Data (Example for Emissions DTC):
┌─────────────────────────────┬────────────────────────────────┐
│ Data Element                │ Value at Fault Moment          │
├─────────────────────────────┼────────────────────────────────┤
│ Engine Speed                │ 2450 RPM                       │
│ Vehicle Speed               │ 72 km/h                        │
│ Engine Coolant Temperature  │ 89°C                           │
│ Calculated Load Value       │ 45%                            │
│ Fuel System Status          │ Closed Loop                    │
│ Short Term Fuel Trim        │ +8%                            │
│ Long Term Fuel Trim         │ +12%                           │
│ Intake Manifold Pressure    │ 35 kPa                         │
│ Timing Advance              │ 18° BTDC                       │
│ MAF Sensor                  │ 15.2 g/s                       │
│ Throttle Position           │ 32%                            │
│ Odometer Reading            │ 45,230 km                      │
└─────────────────────────────┴────────────────────────────────┘
```

### Snapshot Data Structure (ISO 14229-1)

```
┌──────────────────────────────────────────────────────────────┐
│              SNAPSHOT RECORD FORMAT                          │
└──────────────────────────────────────────────────────────────┘

Snapshot Record Structure:
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Record Number: 0x01                                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Number of Data Identifiers: 5                        │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ DID 0x0C (Engine RPM):        2450 (0x0992)          │ │
│  │   Length: 2 bytes                                    │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ DID 0x0D (Vehicle Speed):     72 (0x48)              │ │
│  │   Length: 1 byte                                     │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ DID 0x05 (Coolant Temp):      89 (0x59)              │ │
│  │   Length: 1 byte                                     │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ DID 0x11 (Throttle Position): 32 (0x20)              │ │
│  │   Length: 1 byte                                     │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ DID 0x04 (Engine Load):       45 (0x2D)              │ │
│  │   Length: 1 byte                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Total Record Size: 2+1+1+1+1 + overhead = ~12 bytes      │
│                                                            │
└────────────────────────────────────────────────────────────┘

Multiple Snapshots per DTC:
┌────────────────────────────────────────────────────────────┐
│ DTC P0420 (Catalyst Efficiency)                           │
│                                                            │
│ Snapshot 0x01: First occurrence (Week 1)                  │
│ Snapshot 0x02: Second occurrence (Week 2)                 │
│ Snapshot 0x03: Third occurrence (Week 3)                  │
│                                                            │
│ Helps identify patterns or changing conditions            │
└────────────────────────────────────────────────────────────┘
```

---

## Extended Data Records

### Structure and Types

```
┌──────────────────────────────────────────────────────────────┐
│                   EXTENDED DATA RECORDS                      │
└──────────────────────────────────────────────────────────────┘

Purpose: Additional diagnostic information beyond snapshot data

Types of Extended Data:
┌─────────────────────────────────────────────────────────────┐
│ Record 0x01: Occurrence Counter                            │
│   • Number of times fault has occurred                      │
│   • 1-2 bytes (0-65535 occurrences)                         │
│   • Helps identify intermittent faults                      │
│                                                             │
│   Example: DTC occurred 47 times                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Record 0x02: Aging Counter                                  │
│   • Number of drive cycles since fault last occurred        │
│   • 1 byte (0-255 cycles)                                   │
│   • DTC auto-erases after threshold (typically 40)          │
│                                                             │
│   Example: 12 cycles since last occurrence                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Record 0x03: Aged Counter                                   │
│   • Total number of times DTC has aged out                  │
│   • Indicates recurring intermittent issue                  │
│                                                             │
│   Example: Aged out 3 times (keeps coming back!)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Record 0x04: Cumulative Occurrence Time                     │
│   • Total time fault has been active                        │
│   • Measured in seconds or minutes                          │
│                                                             │
│   Example: Active for 320 minutes total                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Record 0x05: Odometer at First Occurrence                   │
│   • Vehicle mileage when fault first detected               │
│   • Helps track fault history                               │
│                                                             │
│   Example: First occurred at 42,500 km                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Record 0x06: Odometer at Latest Occurrence                  │
│   • Vehicle mileage at most recent occurrence               │
│                                                             │
│   Example: Latest occurrence at 45,230 km                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Records 0x50-0xFF: Manufacturer Specific                    │
│   • Custom diagnostic data                                  │
│   • Proprietary fault analysis                              │
│   • Enhanced troubleshooting information                    │
└─────────────────────────────────────────────────────────────┘


Extended Data Example (Complete):
┌──────────────────────────────────────────────────────────────┐
│ DTC P0171 (System Too Lean - Bank 1)                        │
│                                                              │
│ Extended Data Records:                                       │
│   0x01: Occurrence count = 23 times                          │
│   0x02: Aging counter = 0 (currently active)                 │
│   0x03: Aged counter = 1 (aged out once before)              │
│   0x04: Cumulative time = 185 minutes                        │
│   0x05: First at = 38,200 km                                 │
│   0x06: Latest at = 45,230 km                                │
│   0x50: Fuel trim average = +18% (manufacturer specific)     │
│                                                              │
│ Analysis: Recurring issue, occurred 23 times over 7000 km,   │
│          excessive fuel trim indicates vacuum leak or MAF    │
│          sensor issue.                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## DTC Severity and Priority

### Severity Classification

```
┌──────────────────────────────────────────────────────────────┐
│                    DTC SEVERITY LEVELS                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS A: EMISSIONS-RELATED (Highest Priority)              │
├─────────────────────────────────────────────────────────────┤
│ Impact: Affects emissions compliance                        │
│ MIL: Immediately illuminated                                │
│ Storage: Mandatory, cannot be disabled                      │
│ Regulatory: Required by law (OBD-II)                        │
│                                                             │
│ Examples:                                                   │
│   • P0420: Catalyst efficiency                              │
│   • P0171: System too lean                                  │
│   • P0300: Random misfire detected                          │
│                                                             │
│ Technician Action: MUST be repaired for emissions test     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS B: SAFETY-CRITICAL (Very High Priority)              │
├─────────────────────────────────────────────────────────────┤
│ Impact: Affects vehicle safety                              │
│ Indicator: ABS, Airbag, Brake warning lights               │
│ Storage: Mandatory, high priority                           │
│                                                             │
│ Examples:                                                   │
│   • C0196: ABS hydraulic pump failure                       │
│   • B1000: Airbag circuit malfunction                       │
│   • C1550: Electronic stability control                     │
│                                                             │
│ Technician Action: Immediate repair required                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS C: FUNCTIONAL (Medium Priority)                      │
├─────────────────────────────────────────────────────────────┤
│ Impact: Affects vehicle function, not safety                │
│ Indicator: Various warning lights                           │
│ Storage: Normal priority                                    │
│                                                             │
│ Examples:                                                   │
│   • U0100: Lost communication with ECM                      │
│   • B1600: HVAC blower motor circuit                        │
│   • P0562: System voltage low                               │
│                                                             │
│ Technician Action: Repair when convenient                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS D: INFORMATIONAL (Low Priority)                      │
├─────────────────────────────────────────────────────────────┤
│ Impact: Information only, no functional impact              │
│ Indicator: May not illuminate any light                     │
│ Storage: Optional, may be overwritten                       │
│                                                             │
│ Examples:                                                   │
│   • Configuration changes                                   │
│   • Maintenance reminders                                   │
│   • Accessory faults (heated seats, etc.)                   │
│                                                             │
│ Technician Action: Optional repair                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Why DTCs Exist

### Historical Context and Evolution

```
┌──────────────────────────────────────────────────────────────┐
│                  HISTORY OF DTCs                             │
└──────────────────────────────────────────────────────────────┘

1960s-1970s: Pre-DTC Era
  ┌────────────────────────────────────────────────────────┐
  │ • No standardized fault codes                          │
  │ • Manual diagnosis only                                │
  │ • Required extensive technical knowledge               │
  │ • Repair times: hours to days                          │
  │ • High cost, low accuracy                              │
  └────────────────────────────────────────────────────────┘

1980s: Introduction of On-Board Diagnostics (OBD-I)
  ┌────────────────────────────────────────────────────────┐
  │ • Basic fault code system                              │
  │ • Manufacturer-specific codes                          │
  │ • 2-digit codes (e.g., Code 12, Code 44)               │
  │ • Check Engine Light introduced                        │
  │ • Limited diagnostic capability                        │
  └────────────────────────────────────────────────────────┘

1996: OBD-II Mandated (USA)
  ┌────────────────────────────────────────────────────────┐
  │ • Standardized 5-character DTCs (Pxxxx)                │
  │ • Universal diagnostic connector (16-pin)              │
  │ • Emissions monitoring required                        │
  │ • Freeze frame data introduced                         │
  │ • All manufacturers use same codes                     │
  └────────────────────────────────────────────────────────┘

2000s-Present: Enhanced Diagnostics (UDS/ISO 14229)
  ┌────────────────────────────────────────────────────────┐
  │ • 3-byte DTCs (more fault codes possible)              │
  │ • Network communication faults (U-codes)               │
  │ • Advanced snapshot data                               │
  │ • Predictive diagnostics                               │
  │ • Remote diagnostics capability                        │
  └────────────────────────────────────────────────────────┘
```

### Benefits of Standardized DTCs

```
┌──────────────────────────────────────────────────────────────┐
│                    BENEFITS OF DTCs                          │
└──────────────────────────────────────────────────────────────┘

FOR TECHNICIANS:
  ✓ Faster diagnosis (minutes vs. hours)
  ✓ Pinpoints exact fault area
  ✓ Provides historical context (when, how often)
  ✓ Verifies repair effectiveness
  ✓ Reduces guesswork and parts replacement

FOR VEHICLE OWNERS:
  ✓ Lower repair costs (faster diagnosis)
  ✓ Fewer return trips for same issue
  ✓ Better understanding of vehicle health
  ✓ Predictive maintenance alerts
  ✓ Transparent repair process

FOR MANUFACTURERS:
  ✓ Warranty claim validation
  ✓ Quality control and field feedback
  ✓ Software update targeting
  ✓ Regulatory compliance (emissions)
  ✓ Customer satisfaction improvement

FOR REGULATORS:
  ✓ Emissions compliance verification
  ✓ Safety monitoring (fleet-wide issues)
  ✓ Recall identification
  ✓ Environmental protection
  ✓ Consumer protection

FOR ENVIRONMENT:
  ✓ Early detection of emissions issues
  ✓ Prevents excessive pollution
  ✓ Ensures catalyst efficiency
  ✓ Monitors fuel system integrity
  ✓ Supports clean air standards
```

---

## Common DTC Formats

### Format Comparison

```
┌──────────────────────────────────────────────────────────────┐
│                  DTC FORMAT STANDARDS                        │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ISO 14229-1 (UDS) Format                                    │
├─────────────────────────────────────────────────────────────┤
│ Structure: 3 bytes (24 bits)                                │
│ Range: 0x000000 to 0xFFFFFF                                 │
│ Capacity: 16,777,216 possible codes                         │
│                                                             │
│ Byte 1  Byte 2  Byte 3                                      │
│ ┌────┬─┬────┬─┬────┬─┐                                      │
│ │ HH │ │ MM │ │ LL │ │                                      │
│ └────┴─┴────┴─┴────┴─┘                                      │
│                                                             │
│ Display: P0135, C1234, U0100                                │
│                                                             │
│ Used By: Modern vehicles (2000+), UDS protocol              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SAE J2012 (OBD-II) Format                                   │
├─────────────────────────────────────────────────────────────┤
│ Structure: 5-character alphanumeric                         │
│ Format: [Letter][Digit][Digit][Digit][Digit]               │
│                                                             │
│   P  0  1  3  5                                             │
│   │  │  │  │  │                                             │
│   │  │  └──┴──┴── Specific fault                            │
│   │  └────────── Generic (0) or Mfr (1,2,3)                 │
│   └───────────── Category (P,C,B,U)                         │
│                                                             │
│ Examples: P0420, P1234, C0196                               │
│                                                             │
│ Used By: OBD-II compliant vehicles (1996+ USA)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Manufacturer Legacy Formats (Pre-OBD-II)                    │
├─────────────────────────────────────────────────────────────┤
│ Structure: 2-digit numeric                                  │
│ Range: 00-99                                                │
│ Capacity: 100 codes                                         │
│                                                             │
│ Examples:                                                   │
│   Code 12 (GM): No reference pulse                          │
│   Code 44 (Ford): Oxygen sensor lean                        │
│   Code 21 (Toyota): Main O2 sensor                          │
│                                                             │
│ Display Method: Blink codes via Check Engine Light          │
│                                                             │
│ Used By: Older vehicles (pre-1996)                          │
└─────────────────────────────────────────────────────────────┘
```

### Format Conversion Example

```
┌──────────────────────────────────────────────────────────────┐
│         ISO 14229-1 TO SAE J2012 CONVERSION                  │
└──────────────────────────────────────────────────────────────┘

ISO Format (3 bytes): 0x00 0x01 0x35

Step 1: Extract category (Bits 7-6 of Byte 1)
  0x00 = 0b00000000
         ││
         └┴─ 00 = Powertrain = 'P'

Step 2: Extract generic/mfr (Bits 5-4 of Byte 1)
  0x00 = 0b00000000
           ││
           └┴─ 00 = Generic = '0'

Step 3: Extract remaining fault number
  Byte 1 (low 4 bits) + Byte 2 + Byte 3
  0x00 (0000) + 0x01 + 0x35
  = 0x0135 = 0135 decimal

Result: P0135

Verification:
  ┌────────────────────────────────────────┐
  │ ISO:    0x000135                       │
  │ SAE:    P0135                          │
  │ Meaning: O2 Sensor Heater Circuit      │
  │          (Bank 1, Sensor 1)            │
  └────────────────────────────────────────┘
```

---

**End of Document**

**Related Documents**:
- [DTC Practical Implementation](./DTC_PRACTICAL_IMPLEMENTATION.md)
- [DTC Service Interactions](./DTC_SERVICE_INTERACTIONS.md)
- [SID 0x19: Read DTC Information](./SID_19_READ_DTC_INFORMATION.md)
- [SID 0x14: Clear DTC Information](./SID_14_CLEAR_DIAGNOSTIC_INFORMATION.md)
