# DTC - Practical Implementation Guide

**Document Version**: 1.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020, SAE J2012

---

## 📋 Table of Contents

1. [DTC Detection and Storage Flow](#dtc-detection-and-storage-flow)
2. [Status Byte Management](#status-byte-management)
3. [Freeze Frame Capture Logic](#freeze-frame-capture-logic)
4. [Extended Data Management](#extended-data-management)
5. [Memory Management Strategies](#memory-management-strategies)
6. [Testing Scenarios](#testing-scenarios)
7. [Debugging Flowcharts](#debugging-flowcharts)
8. [Best Practices Checklist](#best-practices-checklist)

---

## DTC Detection and Storage Flow

### Complete Detection Workflow

```
┌──────────────────────────────────────────────────────────────┐
│              DTC DETECTION AND STORAGE FLOW                  │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │  SENSOR     │
                    │  READING    │
                    └──────┬──────┘
                           │
                           ▼
                  ┌─────────────────┐
             ┌────┤ Diagnostic Test │────┐
             │    │  Execution      │    │
             │    └─────────────────┘    │
             │                           │
            FAIL                       PASS
             │                           │
             ▼                           ▼
      ┌─────────────┐            ┌─────────────┐
      │ Check: DTC  │            │ Check: Any  │
      │ exists?     │            │ pending DTC?│
      └──────┬──────┘            └──────┬──────┘
             │                          │
    ┌────────┴────────┐        ┌────────┴────────┐
    │                 │       YES              NO
   NO                YES       │                 │
    │                 │        ▼                 ▼
    ▼                 ▼   ┌─────────┐      ┌─────────┐
┌────────┐      ┌────────┐│ Clear   │      │ No      │
│ Create │      │ Update ││ Pending │      │ Action  │
│ Pending│      │ Status ││ Status  │      └─────────┘
│ DTC    │      │ to 0x09│└─────────┘
└───┬────┘      └───┬────┘
    │               │
    │               ▼
    │      ┌─────────────────┐
    │      │ Check: 2nd fail?│
    │      └────────┬─────────┘
    │               │
    │          ┌────┴────┐
    │         YES       NO
    │          │         │
    ▼          ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Status │ │Confirm │ │Keep as │
│= 0x04  │ │DTC     │ │0x09    │
│Set bit2│ │Status= │ └────────┘
└────┬───┘ │0x08/09 │
     │     │Capture │
     │     │Freeze  │
     │     │Frame   │
     │     └───┬────┘
     │         │
     └─────────┴──────────┐
                          │
                          ▼
                   ┌──────────────┐
                   │ Store in     │
                   │ Non-volatile │
                   │ Memory       │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Update       │
                   │ Extended Data│
                   │ (Counters)   │
                   └──────────────┘
```

### Diagnostic Test Execution

```
┌──────────────────────────────────────────────────────────────┐
│              DIAGNOSTIC TEST TYPES                           │
└──────────────────────────────────────────────────────────────┘

CONTINUOUS TESTS (Run constantly while engine running)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Misfire Detection                                    │  │
│  │ • Monitors crankshaft position                       │  │
│  │ • Detects irregular acceleration                     │  │
│  │ • Frequency: Every engine revolution                 │  │
│  │ • Threshold: >5% misfire rate triggers DTC           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Fuel System Monitoring                               │  │
│  │ • Checks fuel trim values                            │  │
│  │ • Frequency: Every 100ms                             │  │
│  │ • Threshold: ±25% trim triggers DTC                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

NON-CONTINUOUS TESTS (Run under specific conditions)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Catalyst Efficiency Monitor                          │  │
│  │ Enabling Criteria:                                   │  │
│  │   • Engine warmed up (>70°C)                         │  │
│  │   • Vehicle speed 40-100 km/h                        │  │
│  │   • Steady cruise (no acceleration)                  │  │
│  │   • Duration: 2+ minutes                             │  │
│  │ Frequency: Once per drive cycle (if conditions met)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ EVAP System Test                                     │  │
│  │ Enabling Criteria:                                   │  │
│  │   • Fuel level 15-85%                                │  │
│  │   • Engine off soak (8+ hours)                       │  │
│  │   • Ambient temp 4-35°C                              │  │
│  │ Frequency: Typically once per day                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


Test Decision Flow:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌──────────────┐                                          │
│   │ Test Enabled?│                                          │
│   └──────┬───────┘                                          │
│          │                                                   │
│     ┌────┴────┐                                             │
│    YES       NO                                             │
│     │         │                                             │
│     ▼         ▼                                             │
│ ┌────────┐ ┌──────────┐                                     │
│ │Execute │ │Set Status│                                     │
│ │ Test   │ │Bit 1 or 6│                                     │
│ └───┬────┘ │(Not      │                                     │
│     │      │Complete) │                                     │
│     │      └──────────┘                                     │
│     ▼                                                        │
│ ┌────────┐                                                  │
│ │Result? │                                                  │
│ └───┬────┘                                                  │
│     │                                                        │
│ ┌───┴───┐                                                   │
│PASS   FAIL                                                  │
│ │      │                                                    │
│ ▼      ▼                                                    │
│Clear  Store                                                 │
│Bits   DTC                                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Status Byte Management

### Status Bit Update Logic

```
┌──────────────────────────────────────────────────────────────┐
│              STATUS BYTE UPDATE FLOWCHART                    │
└──────────────────────────────────────────────────────────────┘

SCENARIO 1: First Test Failure
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Initial State: Status = 0x00 (All bits clear)              │
│                                                              │
│  Test Fails                                                  │
│     │                                                         │
│     ▼                                                         │
│  ┌──────────────────────────────────────┐                   │
│  │ Set Bit 0: Test Failed (Current)     │ = 0x01            │
│  │ Set Bit 1: Test Failed This Cycle    │ = 0x03            │
│  │ Set Bit 2: Pending DTC               │ = 0x07            │
│  │ Set Bit 4: Not Complete Since Clear  │ = 0x17            │
│  │ Set Bit 5: Failed Since Clear        │ = 0x37            │
│  │ Set Bit 6: Not Complete This Cycle   │ = 0x77            │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Result: Status = 0x77 (Binary: 01110111)                   │
│          ┌──┬──┬──┬──┬──┬──┬──┬──┐                          │
│          │ 0│ 1│ 1│ 1│ 0│ 1│ 1│ 1│                          │
│          └──┴──┴──┴──┴──┴──┴──┴──┘                          │
│            │                    └─ Bit 0: Failed ✓          │
│            │                    └─ Bit 1: Failed this cycle │
│            │                    └─ Bit 2: Pending ✓         │
│            │                                                 │
│            └─ Bit 7: Severity (0 for now)                   │
│                                                              │
│  Simplified: Often displayed as 0x04 (Pending only)         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

SCENARIO 2: Second Test Failure (Confirmation)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Previous State: Status = 0x04 (Pending)                    │
│                                                              │
│  Test Fails Again (2nd time)                                 │
│     │                                                         │
│     ▼                                                         │
│  ┌──────────────────────────────────────┐                   │
│  │ Keep Bit 0: Test Failed (Current)    │                   │
│  │ Keep Bit 1: Test Failed This Cycle   │                   │
│  │ Clear Bit 2: No longer "pending"     │                   │
│  │ Set Bit 3: Confirmed DTC ✓           │                   │
│  │ Keep Bit 4,5,6: Previous states      │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Additional Actions:                                         │
│    • Capture Freeze Frame (if first confirmation)           │
│    • Illuminate MIL (Check Engine Light) - Set Bit 7        │
│    • Store to non-volatile memory                           │
│                                                              │
│  Result: Status = 0x09 (Confirmed + Active)                 │
│          Binary: 00001001                                   │
│          ┌──┬──┬──┬──┬──┬──┬──┬──┐                          │
│          │ 0│ 0│ 0│ 0│ 1│ 0│ 0│ 1│                          │
│          └──┴──┴──┴──┴──┴──┴──┴──┘                          │
│                    │        └─ Bit 0: Failed currently       │
│                    └─────────── Bit 3: Confirmed             │
│                                                              │
│  Or: Status = 0x89 if MIL requested                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

SCENARIO 3: Test Pass (Fault Clears)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Previous State: Status = 0x09 (Confirmed + Active)         │
│                                                              │
│  Test Passes                                                 │
│     │                                                         │
│     ▼                                                         │
│  ┌──────────────────────────────────────┐                   │
│  │ Clear Bit 0: No longer failing       │                   │
│  │ Keep Bit 3: Still confirmed          │                   │
│  │ Start aging counter                  │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Result: Status = 0x08 (Confirmed but Inactive)             │
│          Binary: 00001000                                   │
│          ┌──┬──┬──┬──┬──┬──┬──┬──┐                          │
│          │ 0│ 0│ 0│ 0│ 1│ 0│ 0│ 0│                          │
│          └──┴──┴──┴──┴──┴──┴──┴──┘                          │
│                    │                                         │
│                    └─────────── Bit 3: Still confirmed       │
│                                                              │
│  Note: MIL typically extinguishes after 3 consecutive       │
│        passes (but DTC remains stored)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

SCENARIO 4: Manual Clear (SID 0x14)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Previous State: Status = any value                          │
│                                                              │
│  Clear DTCs Command Received                                 │
│     │                                                         │
│     ▼                                                         │
│  ┌──────────────────────────────────────┐                   │
│  │ Clear all status bits → 0x00         │                   │
│  │ Delete freeze frame data             │                   │
│  │ Delete extended data                 │                   │
│  │ Extinguish MIL                       │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Result: Status = 0x00                                      │
│          Binary: 00000000                                   │
│          ┌──┬──┬──┬──┬──┬──┬──┬──┐                          │
│          │ 0│ 0│ 0│ 0│ 0│ 0│ 0│ 0│                          │
│          └──┴──┴──┴──┴──┴──┴──┴──┘                          │
│                                                              │
│  Note: DTC removed from memory entirely                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Drive Cycle Impact on Status

```
┌──────────────────────────────────────────────────────────────┐
│              DRIVE CYCLE STATE TRANSITIONS                   │
└──────────────────────────────────────────────────────────────┘

Drive Cycle Definition: Ignition ON → Engine running → Ignition OFF

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  DAY 1, CYCLE 1: Fault First Detected                       │
│  ════════════════════════════════════════                    │
│                                                              │
│  Ignition ON                                                 │
│     ↓                                                        │
│  Test runs → FAILS                                           │
│     ↓                                                        │
│  Status: 0x04 (Pending)                                     │
│  MIL: OFF                                                    │
│     ↓                                                        │
│  Ignition OFF                                                │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  DAY 2, CYCLE 2: Fault Persists                             │
│  ═══════════════════════════════                             │
│                                                              │
│  Ignition ON                                                 │
│     ↓                                                        │
│  Test runs → FAILS (2nd time)                                │
│     ↓                                                        │
│  Status: 0x09 (Confirmed + Active)                          │
│  MIL: ON 💡                                                  │
│  Freeze Frame: Captured                                      │
│     ↓                                                        │
│  Ignition OFF                                                │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  DAY 3, CYCLE 3: Repair Made, Fault Cleared                 │
│  ═══════════════════════════════════════════════            │
│                                                              │
│  Technician clears DTCs (SID 0x14)                          │
│     ↓                                                        │
│  Status: 0x00                                                │
│  MIL: OFF                                                    │
│     ↓                                                        │
│  Ignition ON                                                 │
│     ↓                                                        │
│  Test runs → PASSES ✓                                        │
│     ↓                                                        │
│  Status: Remains 0x00                                        │
│  MIL: OFF                                                    │
│     ↓                                                        │
│  Ignition OFF                                                │
│     ↓                                                        │
│  Repair Verified ✓                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Freeze Frame Capture Logic

### Capture Decision Tree

```
┌──────────────────────────────────────────────────────────────┐
│           FREEZE FRAME CAPTURE DECISION TREE                 │
└──────────────────────────────────────────────────────────────┘

                 ┌─────────────┐
                 │ Test Fails  │
                 └──────┬──────┘
                        │
                        ▼
                ┌───────────────┐
           ┌────┤ Is DTC new?   │────┐
           │    │ (Pending)     │    │
           │    └───────────────┘    │
          YES                       NO
           │                         │
           ▼                         ▼
    ┌─────────────┐          ┌──────────────┐
    │ Skip freeze │          │ Check: 2nd   │
    │ frame for   │          │ fail? (Conf) │
    │ pending     │          └──────┬───────┘
    │ DTCs        │                 │
    └─────────────┘        ┌────────┴────────┐
                          YES               NO
                           │                 │
                           ▼                 ▼
                   ┌───────────────┐  ┌─────────────┐
                   │ Capture       │  │ Update      │
                   │ Freeze Frame  │  │ Status Only │
                   └───────┬───────┘  └─────────────┘
                           │
                           ▼
                   ┌───────────────┐
              ┌────┤ Priority?     │────┐
              │    └───────────────┘    │
              │                         │
        EMISSIONS                  NON-EMISSIONS
              │                         │
              ▼                         ▼
      ┌───────────────┐         ┌───────────────┐
      │ Store in      │         │ Store in      │
      │ Slot 0        │         │ Next available│
      │ (Overwrite    │         │ slot          │
      │ previous if   │         │ (FIFO)        │
      │ needed)       │         │               │
      └───────────────┘         └───────────────┘


Freeze Frame Storage Rules:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ RULE 1: One Freeze Frame per DTC                            │
│   • Each confirmed DTC gets ONE freeze frame                │
│   • Captured at FIRST confirmation                          │
│   • Not updated on subsequent failures                      │
│                                                              │
│ RULE 2: Emissions DTCs Have Priority                        │
│   • P-codes (emissions) stored in slot 0                    │
│   • Most recent emissions DTC overwrites previous           │
│   • Non-emissions DTCs stored in other slots                │
│                                                              │
│ RULE 3: FIFO for Non-Emissions                              │
│   • Oldest non-emissions freeze frame overwritten first     │
│   • When memory full, discard oldest                        │
│                                                              │
│ RULE 4: Clear with DTC                                      │
│   • Freeze frame deleted when DTC cleared                   │
│   • No orphaned freeze frames                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Capture Timing

```
┌──────────────────────────────────────────────────────────────┐
│              FREEZE FRAME CAPTURE TIMING                     │
└──────────────────────────────────────────────────────────────┘

Timeline (Millisecond Resolution):
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  T-500ms    T-250ms    T=0      T+250ms    T+500ms          │
│     │          │        │          │          │              │
│     ▼          ▼        ▼          ▼          ▼              │
│  ┌────┐    ┌────┐   ┌────┐    ┌────┐    ┌────┐             │
│  │ OK │    │ OK │   │FAIL│    │FAIL│    │FAIL│             │
│  └────┘    └────┘   └─┬──┘    └────┘    └────┘             │
│                       │                                      │
│                  CAPTURE HERE!                               │
│                  at moment of                                │
│                  first detection                             │
│                       │                                      │
│                       ▼                                      │
│             ┌─────────────────┐                              │
│             │ Snapshot State: │                              │
│             │ • RPM: 2450     │                              │
│             │ • Speed: 72km/h │                              │
│             │ • Temp: 89°C    │                              │
│             │ • Load: 45%     │                              │
│             │ • Time: Now     │                              │
│             └─────────────────┘                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Capture Process Flow:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Step 1: Fault Detected (0ms)                               │
│     ↓                                                        │
│  Step 2: Trigger Freeze Frame Logic (5-10ms)                │
│     ↓                                                        │
│  Step 3: Read All Required PIDs (10-50ms)                   │
│     • Engine RPM                                             │
│     • Vehicle Speed                                          │
│     • Coolant Temperature                                    │
│     • Calculated Load                                        │
│     • Fuel Trim (Short & Long)                              │
│     • MAF Reading                                            │
│     • Throttle Position                                      │
│     • etc. (up to 20+ parameters)                           │
│     ↓                                                        │
│  Step 4: Format Data Structure (5ms)                        │
│     ↓                                                        │
│  Step 5: Write to Non-Volatile Memory (100-200ms)           │
│     ↓                                                        │
│  Step 6: Update DTC Status to Confirmed (5ms)               │
│     ↓                                                        │
│  Total Time: ~150-300ms                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Extended Data Management

### Extended Data Update Flow

```
┌──────────────────────────────────────────────────────────────┐
│              EXTENDED DATA RECORD UPDATES                    │
└──────────────────────────────────────────────────────────────┘

EVENT: DTC Confirmed (First Time)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Initialize All Extended Data Records:                       │
│                                                              │
│  Record 0x01: Occurrence Count = 1                          │
│  Record 0x02: Aging Counter = 0                             │
│  Record 0x03: Aged Counter = 0                              │
│  Record 0x04: Cumulative Time = 0                           │
│  Record 0x05: Odometer (First) = Current Odometer           │
│  Record 0x06: Odometer (Latest) = Current Odometer          │
│  Record 0x50+: Manufacturer Data (if applicable)            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

EVENT: DTC Fails Again (Already Confirmed)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Update Extended Data Records:                               │
│                                                              │
│  Record 0x01: Occurrence Count++                            │
│               (Increment by 1)                               │
│                                                              │
│  Record 0x02: Aging Counter = 0                             │
│               (Reset because fault active)                   │
│                                                              │
│  Record 0x04: Cumulative Time += Duration                   │
│               (Add time fault was active)                    │
│                                                              │
│  Record 0x06: Odometer (Latest) = Current Odometer          │
│               (Update to current mileage)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

EVENT: Drive Cycle Ends (Ignition OFF) with Inactive DTC
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Update Extended Data Records:                               │
│                                                              │
│  Record 0x02: Aging Counter++                               │
│               (Increment by 1 per cycle)                     │
│                                                              │
│  Check: Aging Counter >= Threshold?                          │
│    ├─ If YES (typically 40 cycles):                         │
│    │    • Auto-erase DTC                                     │
│    │    • Increment Record 0x03 (Aged Counter)              │
│    │    • Free memory slot                                   │
│    │                                                         │
│    └─ If NO:                                                 │
│         • Keep DTC stored                                    │
│         • Continue aging process                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘


Aging Counter Visualization:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Cycle 1:  [■□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□] 1/40  │
│  Cycle 10: [■■■■■■■■■■□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□] 10/40 │
│  Cycle 20: [■■■■■■■■■■■■■■■■■■■■□□□□□□□□□□□□□□□□□□□□] 20/40 │
│  Cycle 39: [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■□] 39/40 │
│  Cycle 40: [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] AUTO  │
│            DTC ERASED → Record 0x03 (Aged Counter)++        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Memory Management Strategies

### DTC Storage Priority

```
┌──────────────────────────────────────────────────────────────┐
│              DTC MEMORY MANAGEMENT                           │
└──────────────────────────────────────────────────────────────┘

Memory Layout Example (20 DTC Slots):
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────┬─────────────────┬──────────┬─────────────────┐ │
│  │ Slot    │ DTC Code        │ Priority │ Status          │ │
│  ├─────────┼─────────────────┼──────────┼─────────────────┤ │
│  │ 00      │ P0420           │ HIGH (E) │ 0x09 Confirmed  │ │
│  │ 01      │ P0171           │ HIGH (E) │ 0x08 Inactive   │ │
│  │ 02      │ P0300           │ HIGH (E) │ 0x09 Active     │ │
│  │ 03      │ C1234           │ MED (S)  │ 0x08 Inactive   │ │
│  │ 04      │ B1000           │ HIGH (S) │ 0x09 Active     │ │
│  │ 05      │ U0100           │ MED      │ 0x04 Pending    │ │
│  │ 06-19   │ [Empty]         │ -        │ -               │ │
│  └─────────┴─────────────────┴──────────┴─────────────────┘ │
│                                                              │
│  Priority Legend:                                            │
│    E = Emissions-Related (Highest)                           │
│    S = Safety-Critical (High)                                │
│    MED = Functional (Medium)                                 │
│    LOW = Informational (Low)                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Storage Algorithm (When Memory Full):
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  New DTC Needs Storage                                       │
│        │                                                     │
│        ▼                                                     │
│  ┌─────────────┐                                            │
│  │ Empty Slot? │────YES──► Store in next empty slot         │
│  └──────┬──────┘                                            │
│         │                                                    │
│        NO                                                    │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────┐                                 │
│  │ New DTC Priority?      │                                 │
│  └────────┬───────────────┘                                 │
│           │                                                  │
│  ┌────────┼────────┬────────────┐                          │
│  │        │        │            │                           │
│ HIGH    MED      LOW       VERY LOW                         │
│  │        │        │            │                           │
│  ▼        ▼        ▼            ▼                           │
│ Find    Find    Find       Reject                           │
│ lowest  lowest  oldest     (Do not                          │
│ priority pending info DTC   store)                          │
│ DTC and DTC and or aged                                     │
│ replace replace DTC and                                     │
│         if none replace                                     │
│         exists                                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Replacement Decision Tree:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Can Overwrite:                                              │
│    ✓ Pending DTC (0x04) → if new DTC is confirmed          │
│    ✓ Inactive DTC (0x08) → if new DTC is active            │
│    ✓ Aged DTC (Aging >= 35) → almost any new DTC           │
│    ✓ Low priority → if new DTC has higher priority         │
│                                                              │
│  Cannot Overwrite:                                           │
│    ✗ Emissions DTC → unless new is also emissions           │
│    ✗ Safety-critical DTC → unless new is safety-critical    │
│    ✗ Active MIL-ON DTC → unless forced by regulation        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Complete DTC Lifecycle Test

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Complete Lifecycle from Detection to Clear           │
└──────────────────────────────────────────────────────────────┘

Phase 1: Initial State
  Precondition: No DTCs stored
  Expected: Status = 0x00 for all tests
  ✓ Query: SID 0x19 0x01 0xFF → Returns count = 0

Phase 2: Induce Fault (First Failure)
  Action: Disconnect O2 sensor heater
  Wait: 60 seconds (for test to run)
  Expected: Pending DTC created
  ✓ Query: SID 0x19 0x02 0x04 → Returns P0135 with status 0x04
  ✓ Check: MIL still OFF
  ✓ Verify: No freeze frame yet

Phase 3: Drive Cycle Ends
  Action: Turn ignition OFF
  Wait: 5 seconds
  Action: Turn ignition ON
  Expected: Pending DTC persists

Phase 4: Second Failure (Confirmation)
  Wait: 60 seconds (for test to run again)
  Expected: DTC confirmed
  ✓ Query: SID 0x19 0x02 0x08 → Returns P0135 with status 0x08 or 0x09
  ✓ Check: MIL illuminated (ON)
  ✓ Query: SID 0x19 0x04 P0 01 35 01 → Returns freeze frame data
  ✓ Verify: Freeze frame contains RPM, speed, temp, etc.
  ✓ Query: SID 0x19 0x06 P0 01 35 0xFF → Returns extended data
  ✓ Verify: Occurrence count = 1

Phase 5: Repair and Clear
  Action: Reconnect O2 sensor heater
  Action: Clear DTCs via SID 0x14 0xFF FF FF
  Expected: Positive response 0x54
  ✓ Query: SID 0x19 0x01 0xFF → Returns count = 0
  ✓ Check: MIL OFF
  ✓ Verify: All data erased

Phase 6: Verification Drive
  Action: Drive vehicle (enable all tests)
  Wait: 10 minutes of varied driving
  Expected: All tests pass
  ✓ Query: SID 0x19 0x02 0xFF → Returns no DTCs
  ✓ Check: MIL remains OFF
  ✓ Verify: Repair successful

PASS: Complete lifecycle verified ✓
```

### Scenario 2: Intermittent Fault Testing

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Intermittent Fault Detection and Aging               │
└──────────────────────────────────────────────────────────────┘

Setup: Simulate intermittent wiring fault

Cycle 1:
  Action: Induce fault (wiggle connector)
  Result: DTC P0171 confirmed, Status 0x09
  Extended Data: Occurrence = 1, Aging = 0
  ✓ Freeze frame captured

Cycle 2-5: (Fault NOT present)
  Result: DTC remains, Status 0x08 (inactive)
  Extended Data: Occurrence = 1, Aging = 4
  ✓ Aging counter incrementing

Cycle 6: (Fault returns)
  Action: Induce fault again
  Result: Status 0x09 (active again)
  Extended Data: Occurrence = 2, Aging = 0 (reset)
  ✓ Freeze frame NOT updated (kept first one)

Cycle 7-46: (Fault NOT present)
  Result: Status 0x08, aging continues
  Extended Data: Occurrence = 2, Aging increments each cycle

Cycle 47:
  Expected: DTC auto-erased (aged out after 40 inactive cycles)
  ✓ Query: SID 0x19 0x02 0xFF → No P0171
  ✓ Extended Data 0x03 (Aged Counter) = 1

Analysis: Intermittent fault correctly detected, tracked,
          and auto-cleared after sufficient aging period

PASS: Intermittent handling verified ✓
```

### Scenario 3: Memory Full Condition

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Memory Management When Storage Full                  │
└──────────────────────────────────────────────────────────────┘

Precondition: Fill memory with 20 DTCs (max capacity)
  Slots 0-9:  Emissions DTCs (P-codes), confirmed
  Slots 10-15: Chassis DTCs (C-codes), confirmed
  Slots 16-19: Body DTCs (B-codes), pending

Test A: New High-Priority Emissions DTC
  Action: Induce P0300 (Misfire - critical emissions)
  Expected: Overwrites oldest/lowest priority emissions DTC
  ✓ Verify: New DTC stored in available slot
  ✓ Verify: Pending B-code NOT removed (wrong category)
  ✓ Verify: Emissions DTCs prioritized correctly

Test B: New Pending DTC (Low Priority)
  Action: Induce B1600 (HVAC fault)
  Expected: Replaces existing pending DTC (FIFO)
  ✓ Verify: Oldest pending DTC removed
  ✓ Verify: Confirmed DTCs NOT touched

Test C: New Safety-Critical DTC
  Action: Induce C0196 (ABS fault)
  Expected: Replaces lowest priority confirmed DTC
  ✓ Verify: Safety DTC gets priority
  ✓ Verify: Informational DTC removed if available

PASS: Memory management priorities verified ✓
```

---

## Debugging Flowcharts

### Debugging: DTC Not Storing

```
            ┌──────────────────────┐
            │ PROBLEM: Fault       │
            │ occurs but no DTC    │
            │ is stored            │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: DTC setting   │
       │    │ enabled? (SID 0x85)  │
       │    └──────────┬───────────┘
       │               │
   DISABLED          ENABLED
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Enable DTC  │  │ Check: Test      │
│ setting via │  │ execution?       │
│ SID 0x85 01 │  └────────┬─────────┘
└─────────────┘           │
                     ┌────┴────┐
                     │         │
                 NOT RUN     RUNNING
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Check test│ │Check: Did│
              │enabling  │ │test fail │
              │conditions│ │or pass?  │
              │met?      │ └────┬─────┘
              └──────────┘      │
                           ┌────┴────┐
                          PASS      FAIL
                           │         │
                           ▼         ▼
                    ┌──────────┐ ┌──────────┐
                    │No DTC    │ │Check:    │
                    │expected  │ │Memory    │
                    │(working  │ │full?     │
                    │normally) │ └────┬─────┘
                    └──────────┘      │
                                 ┌────┴────┐
                                YES       NO
                                 │         │
                                 ▼         ▼
                          ┌──────────┐ ┌──────────┐
                          │Check     │ │Verify DTC│
                          │priority  │ │creation  │
                          │rules     │ │logic     │
                          └──────────┘ └──────────┘
```

### Debugging: MIL Not Illuminating

```
            ┌──────────────────────┐
            │ PROBLEM: DTC stored  │
            │ but MIL (Check       │
            │ Engine) not lighting │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: DTC status    │
       │    │ bit 7 (MIL request)? │
       │    └──────────┬───────────┘
       │               │
      BIT 7=0        BIT 7=1
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Check: Is   │  │ Check: MIL       │
│ DTC type    │  │ circuit/bulb     │
│ emissions-  │  │ functional?      │
│ related?    │  └────────┬─────────┘
└──────┬──────┘           │
       │            ┌─────┴─────┐
  ┌────┴────┐      │           │
  │         │     BULB OK   BULB FAIL
 YES       NO      │           │
  │         │      ▼           ▼
  ▼         ▼  ┌────────┐ ┌────────┐
┌──────┐ ┌──────────┐│Check   │ │Replace │
│Should│ │MIL not   ││MIL     │ │bulb or │
│set   │ │required  ││driver  │ │fix     │
│MIL   │ │for this  ││circuit │ │wiring  │
│(check│ │DTC type  │└────────┘ └────────┘
│logic)│ └──────────┘
└──────┘
```

### Debugging: Freeze Frame Not Captured

```
            ┌──────────────────────┐
            │ PROBLEM: DTC         │
            │ confirmed but no     │
            │ freeze frame data    │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: Was DTC       │
       │    │ pending first?       │
       │    └──────────┬───────────┘
       │               │
      NO              YES
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Freeze frame│  │ Check: Did DTC   │
│ should have │  │ confirm on 2nd   │
│ been        │  │ failure?         │
│ captured on │  └────────┬─────────┘
│ 1st confirm │           │
└─────────────┘      ┌────┴────┐
                    YES       NO
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Check:    │ │Still     │
              │Memory    │ │pending,  │
              │space for │ │wait for  │
              │freeze    │ │2nd fail  │
              │frame?    │ └──────────┘
              └────┬─────┘
                   │
              ┌────┴────┐
             YES       NO
              │         │
              ▼         ▼
       ┌──────────┐ ┌──────────┐
       │Check data│ │Memory    │
       │collection│ │full, old │
       │at fault  │ │freeze    │
       │moment    │ │frames    │
       │          │ │erased    │
       └──────────┘ └──────────┘
```

---

## Best Practices Checklist

### Implementation Checklist

```
┌──────────────────────────────────────────────────────────────┐
│         DTC IMPLEMENTATION BEST PRACTICES                    │
└──────────────────────────────────────────────────────────────┘

DTC DETECTION:
  ☐ Implement proper diagnostic test conditions
  ☐ Define clear pass/fail thresholds
  ☐ Handle continuous vs. non-continuous tests correctly
  ☐ Implement debouncing for intermittent faults
  ☐ Validate sensor readings before fault declaration
  ☐ Consider environmental factors (temp, pressure, etc.)

STATUS BYTE MANAGEMENT:
  ☐ Update all 8 bits correctly per ISO 14229-1
  ☐ Implement pending → confirmed logic (2-trip rule)
  ☐ Clear bit 0 when fault becomes inactive
  ☐ Maintain bit 3 (confirmed) until manual clear
  ☐ Set bit 7 (MIL request) for emissions DTCs
  ☐ Clear appropriate bits on ignition cycle changes

FREEZE FRAME HANDLING:
  ☐ Capture at first DTC confirmation (not pending)
  ☐ Do NOT update freeze frame on subsequent failures
  ☐ Store minimum required PIDs per regulations
  ☐ Prioritize emissions DTCs (slot 0)
  ☐ Implement FIFO for non-emissions DTCs
  ☐ Clear freeze frame when DTC cleared

EXTENDED DATA:
  ☐ Initialize all counters at DTC creation
  ☐ Increment occurrence counter on each failure
  ☐ Increment aging counter each inactive drive cycle
  ☐ Reset aging counter if fault becomes active again
  ☐ Auto-erase DTC after aging threshold (typically 40)
  ☐ Track odometer at first and latest occurrence
  ☐ Maintain cumulative fault active time

MEMORY MANAGEMENT:
  ☐ Define clear memory capacity (e.g., 20-50 DTCs)
  ☐ Implement priority-based storage (emissions > safety > functional)
  ☐ Use FIFO for same-priority DTCs when full
  ☐ Never overwrite higher priority with lower priority
  ☐ Store to non-volatile memory immediately
  ☐ Implement wear leveling for flash memory
  ☐ Validate memory integrity on power-up

MIL (CHECK ENGINE LIGHT):
  ☐ Illuminate for confirmed emissions DTCs
  ☐ Extinguish after 3 consecutive passes (typical)
  ☐ Keep DTC stored even if MIL off
  ☐ Flash MIL for critical faults (misfire)
  ☐ Implement proper MIL driver circuit diagnostics

REGULATORY COMPLIANCE:
  ☐ Support all required OBD-II emissions DTCs
  ☐ Implement P0xxx codes per SAE J2012
  ☐ Support readiness monitors (SID 0x01 0x01)
  ☐ Enable emissions testing (I/M readiness)
  ☐ Meet 2-trip confirmation requirement
  ☐ Support freeze frame for emissions DTCs
  ☐ Implement 40-cycle aging for emissions DTCs

TESTING:
  ☐ Test complete lifecycle (pending → confirmed → cleared)
  ☐ Verify aging logic with 40+ drive cycles
  ☐ Test memory full scenarios
  ☐ Verify priority-based storage
  ☐ Test freeze frame capture timing
  ☐ Validate extended data accuracy
  ☐ Test intermittent fault handling
  ☐ Verify MIL illumination rules
  ☐ Test manual clear (SID 0x14)
  ☐ Validate DTC format conversion (ISO ↔ SAE)

DOCUMENTATION:
  ☐ Document all supported DTCs with descriptions
  ☐ Specify enabling conditions for each test
  ☐ Define pass/fail thresholds clearly
  ☐ List freeze frame PIDs included
  ☐ Document extended data records format
  ☐ Provide troubleshooting guides per DTC
  ☐ Include repair procedures
  ☐ Document priority levels
```

### Integration Checklist

```
┌──────────────────────────────────────────────────────────────┐
│         INTEGRATION WITH UDS SERVICES                        │
└──────────────────────────────────────────────────────────────┘

WITH SID 0x19 (Read DTC Information):
  ☐ Support all required subfunctions (0x01, 0x02, 0x04, 0x06, etc.)
  ☐ Return correct status byte per DTC
  ☐ Filter DTCs by status mask correctly
  ☐ Format responses per ISO 14229-1
  ☐ Include status availability mask

WITH SID 0x14 (Clear DTC Information):
  ☐ Clear all DTCs when group 0xFFFFFF requested
  ☐ Support selective clear by group
  ☐ Erase freeze frames with DTCs
  ☐ Erase extended data with DTCs
  ☐ Extinguish MIL
  ☐ Reset readiness monitors
  ☐ Return positive response 0x54

WITH SID 0x85 (Control DTC Setting):
  ☐ Stop storing new DTCs when disabled
  ☐ Keep existing DTCs when disabled
  ☐ Allow reading DTCs when disabled
  ☐ Resume normal operation when re-enabled

WITH SID 0x01 (Request Current Powertrain Data):
  ☐ Provide MIL status (PID 0x01)
  ☐ Report DTC count (PID 0x01)
  ☐ Support freeze frame request (PID 0x02)
  ☐ Report readiness monitors (PID 0x01)

WITH SID 0x10 (Diagnostic Session Control):
  ☐ Allow DTC operations in all sessions
  ☐ Maintain DTC storage across session changes
  ☐ Support extended DTCs in extended session

WITH SID 0x27 (Security Access):
  ☐ Allow public DTC reading without security
  ☐ Protect proprietary DTCs behind security
  ☐ Define which DTCs require security access
```

---

**End of Document**

**Related Documents**:
- [DTC Fundamentals](./DTC_FUNDAMENTALS.md)
- [DTC Service Interactions](./DTC_SERVICE_INTERACTIONS.md)
- [SID 0x19: Read DTC Information](./SID_19_READ_DTC_INFORMATION.md)
- [SID 0x14: Clear DTC Information](./SID_14_CLEAR_DIAGNOSTIC_INFORMATION.md)
