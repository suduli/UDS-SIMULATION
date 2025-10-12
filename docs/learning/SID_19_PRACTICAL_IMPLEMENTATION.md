# SID 0x19 - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.7

---

## 📋 Table of Contents

1. [Request Processing Flowcharts](#request-processing-flowcharts)
2. [NRC Decision Trees](#nrc-decision-trees)
3. [State Machine Diagrams](#state-machine-diagrams)
4. [Testing Scenarios](#testing-scenarios)
5. [Debugging Flowcharts](#debugging-flowcharts)
6. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowcharts

### Subfunction 0x01: Report Number of DTCs by Status Mask

```
                    START
                      │
                      ▼
              ┌───────────────┐
              │ Receive Request│
              │ 19 01 [Mask]  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
         ┌────┤ Message Length│
         │    │ = 3 bytes?    │
         │    └───────┬───────┘
         │            │
        NO           YES
         │            │
         ▼            ▼
    ┌────────┐  ┌─────────────┐
    │7F 19 13│  │Check Session│
    │  (NRC) │  │ State       │
    └────────┘  └──────┬──────┘
                       │
                       ▼
                ┌──────────────┐
           ┌────┤ DEFAULT or   │
           │    │ EXTENDED?    │
           │    └──────┬───────┘
           │           │
          NO          YES
           │           │
           ▼           ▼
      ┌────────┐  ┌─────────────┐
      │7F 19 22│  │ Count DTCs  │
      │  (NRC) │  │ matching    │
      └────────┘  │ status mask │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Build       │
                  │ Response:   │
                  │ 59 01       │
                  │ [AvailMask] │
                  │ [Format]    │
                  │ [CountHi]   │
                  │ [CountLo]   │
                  └──────┬──────┘
                         │
                         ▼
                    ┌────────┐
                    │  SEND  │
                    └────────┘
```

### Subfunction 0x02: Report DTC by Status Mask

```
                    START
                      │
                      ▼
              ┌───────────────┐
              │ Receive:      │
              │ 19 02 [Mask]  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Validate      │
              │ Message (3B)  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Search DTC    │
              │ Memory        │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌─────────┐
    │ Match  │  │ Match   │  │ Match   │
    │ DTC 1  │  │ DTC 2   │  │ DTC 3   │
    └───┬────┘  └────┬────┘  └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              ┌─────────────┐
              │ Build       │
              │ Response:   │
              │ 59 02       │
              │ [AvailMask] │
              │ [DTC1][St1] │
              │ [DTC2][St2] │
              │ [DTC3][St3] │
              └──────┬──────┘
                     │
                     ▼
                 ┌───────┐
                 │ SEND  │
                 └───────┘
```

### Subfunction 0x04: Report DTC Snapshot Record

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ Receive:               │
         │ 19 04 [DTC3] [RecNum]  │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
    ┌────┤ Length = 6 bytes?      │
    │    └────────────┬───────────┘
    │                 │
   NO                YES
    │                 │
    ▼                 ▼
┌────────┐   ┌────────────────┐
│7F 19 13│   │ Lookup DTC in  │
└────────┘   │ Memory         │
             └────────┬───────┘
                      │
             ┌────────┴────────┐
             │                 │
            NO                YES
     (Not Found)         (Found)
             │                 │
             ▼                 ▼
        ┌────────┐    ┌────────────────┐
        │7F 19 31│    │ Check Record # │
        └────────┘    │ Availability   │
                      └────────┬───────┘
                               │
                      ┌────────┴────────┐
                      │                 │
                     NO                YES
              (Invalid Rec)      (Valid Rec)
                      │                 │
                      ▼                 ▼
                 ┌────────┐    ┌────────────────┐
                 │7F 19 31│    │ Read Snapshot  │
                 └────────┘    │ Data from      │
                               │ Memory         │
                               └────────┬───────┘
                                        │
                                        ▼
                               ┌────────────────┐
                               │ Build Response:│
                               │ 59 04          │
                               │ [DTC3]         │
                               │ [Status]       │
                               │ [RecNum]       │
                               │ [DataID][Data] │
                               └────────┬───────┘
                                        │
                                        ▼
                                    ┌───────┐
                                    │ SEND  │
                                    └───────┘
```

### Subfunction 0x06: Report Extended Data Record

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ Receive:               │
         │ 19 06 [DTC3] [RecNum]  │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Validate Request       │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
    ┌────┤ Security Required?     │
    │    └────────────┬───────────┘
    │                 │
   YES               NO
    │                 │
    ▼                 ▼
┌─────────────┐  ┌────────────────┐
│ Check       │  │ Lookup DTC     │
│ Security    │  │ and Record     │
│ State       │  └────────┬───────┘
└──────┬──────┘           │
       │                  │
   ┌───┴───┐              │
   │       │              │
LOCKED  UNLOCKED          │
   │       │              │
   ▼       └──────────────┘
┌────────┐                │
│7F 19 33│                │
└────────┘                ▼
                 ┌────────────────┐
                 │ Read Extended  │
                 │ Data Records:  │
                 │ • Occurrence   │
                 │ • Aging        │
                 │ • Custom Data  │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Format Response│
                 │ 59 06 [DTC3]   │
                 │ [Status]       │
                 │ [ExtDataRecs]  │
                 └────────┬───────┘
                          │
                          ▼
                      ┌───────┐
                      │ SEND  │
                      └───────┘
```

### Subfunction 0x0A: Report Supported DTCs

```
                    START
                      │
                      ▼
              ┌───────────────┐
              │ Receive:      │
              │ 19 0A         │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
         ┌────┤ Message Length│
         │    │ = 2 bytes?    │
         │    └───────┬───────┘
         │            │
        NO           YES
         │            │
         ▼            ▼
    ┌────────┐  ┌─────────────┐
    │7F 19 13│  │Check Session│
    │  (NRC) │  │ State       │
    └────────┘  └──────┬──────┘
                       │
                       ▼
                ┌──────────────┐
                │ DEFAULT or   │
                │ EXTENDED?    │
                └──────┬───────┘
                       │
                      OK
                       │
                       ▼
                ┌──────────────┐
                │ Read ECU     │
                │ Capability   │
                │ Definition   │
                └──────┬───────┘
                       │
         ┌─────────────┼─────────────┐
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌─────────┐
    │Emissions│               │ Body/   │
    │ Related │               │Chassis/ │
    │ DTCs    │               │Network  │
    └────┬────┘               └────┬────┘
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ Build List   │
              │ of All DTCs  │
              │ ECU Can      │
              │ Detect       │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Format:      │
              │ 59 0A        │
              │ [AvailMask]  │
              │ [DTC1]       │
              │ [DTC2]       │
              │ ...          │
              │ [DTCn]       │
              └──────┬───────┘
                     │
                     ▼
                 ┌───────┐
                 │ SEND  │
                 └───────┘


┌──────────────────────────────────────────────────────────────┐
│          SPECIAL CHARACTERISTICS OF 0x0A                     │
└──────────────────────────────────────────────────────────────┘

Key Differences from Other Subfunctions:
  • Returns ALL possible DTCs (not just active/stored ones)
  • No status mask parameter needed
  • Response includes DTCs that COULD occur, not just those present
  • Useful for diagnostic tool capability discovery
  • Response does NOT include status bytes (just DTC numbers)

Response Structure:
  ┌────────┬──────────────┬───────┬───────┬─────┬───────┐
  │ 0x59   │ 0x0A         │ Mask  │ DTC1  │ DTC2│ DTCn  │
  └────────┴──────────────┴───────┴───────┴─────┴───────┘
   SID+0x40  Subfunction   Avail   3 bytes each (no status)

Example Response:
  59 0A 00 P0 01 35 P0 04 20 P0 17 1 C1 23 4 U0 10 0
       └──┘ └──────┴──────┴──────┴──────┴──────┘
       Mask  5 Supported DTCs (15 bytes total)
```

---

## NRC Decision Trees

### General NRC Decision Tree

```
                 ┌─────────────────┐
                 │ Request Received│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
            ┌────┤ Correct Length? │────┐
            │    └─────────────────┘    │
           NO                          YES
            │                            │
            ▼                            ▼
       ┌─────────┐            ┌─────────────────┐
       │7F 19 13 │       ┌────┤ Subfunction     │────┐
       │(Bad Len)│       │    │ Supported?      │    │
       └─────────┘      NO    └─────────────────┘   YES
                         │                            │
                         ▼                            ▼
                    ┌─────────┐            ┌─────────────────┐
                    │7F 19 12 │       ┌────┤ Session OK?     │────┐
                    │(Bad SF) │       │    └─────────────────┘    │
                    └─────────┘      NO                          YES
                                      │                            │
                                      ▼                            ▼
                                 ┌─────────┐            ┌─────────────────┐
                                 │7F 19 22 │       ┌────┤ Conditions OK?  │────┐
                                 │(Cond)   │       │    └─────────────────┘    │
                                 └─────────┘      NO                          YES
                                                   │                            │
                                                   ▼                            ▼
                                              ┌─────────┐            ┌─────────────────┐
                                              │7F 19 22 │       ┌────┤ Security OK?    │────┐
                                              │(Cond)   │       │    └─────────────────┘    │
                                              └─────────┘      NO                          YES
                                                                │                            │
                                                                ▼                            ▼
                                                           ┌─────────┐            ┌─────────────────┐
                                                           │7F 19 33 │            │ Process Request │
                                                           │(Sec)    │            │ Send 59 XX      │
                                                           └─────────┘            └─────────────────┘
```

### Subfunction-Specific NRC Decision

```
┌──────────────────────────────────────────────────────────────┐
│         SUBFUNCTION VALIDATION DECISION TREE                 │
└──────────────────────────────────────────────────────────────┘

Subfunction 0x01, 0x02 (Status Mask Based)
    │
    ├─ Status Mask = 0x00? → Valid ✓ (search for cleared DTCs)
    ├─ Status Mask valid (0x01-0xFF)? → Valid ✓
    └─ Otherwise → 7F 19 31 (Request Out of Range)

Subfunction 0x04, 0x06 (DTC + Record Number)
    │
    ├─ DTC exists in memory? NO → 7F 19 31
    ├─ Record number = 0xFF? YES → All records (Valid ✓)
    ├─ Record number = 0x00? YES → Record 0 (Valid ✓)
    ├─ Record exists for DTC? NO → 7F 19 31
    └─ Otherwise → Valid ✓

Subfunction 0x0A (Supported DTCs)
    │
    └─ No parameters needed → Always Valid ✓

Subfunction 0x0F-0x11 (Mirror Memory)
    │
    ├─ Extended session? NO → 7F 19 22
    ├─ Mirror memory supported? NO → 7F 19 12
    └─ Otherwise → Valid ✓
```

---

## State Machine Diagrams

### DTC Lifecycle State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                  DTC LIFECYCLE STATES                        │
└──────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  NO FAULT    │ Status: 0x00
                    │  (Cleared)   │
                    └──────┬───────┘
                           │
                           │ Test Failed
                           ▼
                    ┌──────────────┐
                    │   PENDING    │ Status: 0x04
                    │  (1st Fail)  │ Bit 2 = 1
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
         Test Passed              Test Failed
         (1 cycle)                (2nd time)
              │                         │
              ▼                         ▼
       ┌──────────────┐          ┌──────────────┐
       │  NO FAULT    │          │  CONFIRMED   │ Status: 0x08
       │  (Cleared)   │          │   (Stored)   │ Bit 3 = 1
       └──────────────┘          └──────┬───────┘
                                        │
                           ┌────────────┼────────────┐
                           │                         │
                      Currently                  Currently
                       Failing                    Passing
                           │                         │
                           ▼                         ▼
                    ┌──────────────┐         ┌──────────────┐
                    │  CONFIRMED   │         │  CONFIRMED   │
                    │   + ACTIVE   │         │ + INACTIVE   │
                    │ Status: 0x09 │         │ Status: 0x08 │
                    │ Bit 0,3 = 1  │         │ Bit 3 = 1    │
                    └──────┬───────┘         └──────┬───────┘
                           │                         │
                           │                         │
                           │        Clear DTCs       │
                           │      (SID 0x14)         │
                           └────────────┬────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │  NO FAULT    │ Status: 0x00
                                 │  (Cleared)   │
                                 └──────────────┘
```

### Session State Impact on SID 0x19

```
┌──────────────────────────────────────────────────────────────┐
│           SESSION STATE MACHINE FOR SID 0x19                 │
└──────────────────────────────────────────────────────────────┘

              ┌─────────────────┐
              │   POWER ON      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ DEFAULT SESSION │
              │     (0x01)      │
              └────────┬────────┘
                       │
      ┌────────────────┼────────────────┐
      │                                 │
      ▼                                 ▼
┌──────────────┐                ┌──────────────┐
│ SID 0x19     │                │ SID 0x10 0x03│
│ Subfunctions:│                │ (Go Extended)│
│              │                └──────┬───────┘
│ ✓ 0x01-0x0E  │                       │
│ ✓ 0x42, 0x55 │                       ▼
│ ❌ 0x0F-0x19 │               ┌──────────────┐
└──────────────┘               │   EXTENDED   │
                               │   SESSION    │
                               │    (0x03)    │
                               └──────┬───────┘
                                      │
                               ┌──────┴──────┐
                               │ SID 0x19    │
                               │ All         │
                               │ Subfunctions│
                               │ ✓ 0x01-0x19 │
                               │ ✓ 0x0F-0x11 │
                               └─────────────┘
```

### Supported DTCs Discovery Flow (0x0A)

```
┌──────────────────────────────────────────────────────────────┐
│        SUBFUNCTION 0x0A - SUPPORTED DTCs DISCOVERY           │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │ Diagnostic Tool │
                    │  Initialization │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Request 19 0A   │
                    │ (Supported DTCs)│
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │ ECU Reads Capability     │
              │ Configuration:           │
              │ • Variant coding         │
              │ • Feature flags          │
              │ • Calibration data       │
              └──────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│ Emissions DTCs  │           │ Other DTCs      │
│ (P-codes)       │           │ (C, B, U-codes) │
│ • P0xxx         │           │ • C0xxx (Chassis)│
│ • P2xxx         │           │ • B0xxx (Body)   │
│ • P3xxx         │           │ • U0xxx (Network)│
└────────┬────────┘           └────────┬────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ Merge All Lists  │
              │ Remove Duplicates│
              │ Sort by DTC Code │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Format Response: │
              │ 59 0A [Mask]     │
              │ [DTC List]       │
              │ (No Status Bytes)│
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Tool Stores List │
              │ For Reference    │
              └──────────────────┘

Key Concept: 0x0A returns POTENTIAL DTCs, not ACTIVE ones

┌────────────────────────────────────────────────────────────┐
│              COMPARISON: 0x0A vs. 0x02                     │
├────────────────────────────────────────────────────────────┤
│ Subfunction 0x0A (Supported)                               │
│ • Returns DTCs the ECU CAN detect                          │
│ • No status information                                    │
│ • Static list (capability-based)                           │
│ • Use: Tool configuration, capability discovery            │
│                                                            │
│ Subfunction 0x02 (Active)                                  │
│ • Returns DTCs currently stored                            │
│ • Includes status byte per DTC                             │
│ • Dynamic list (fault-based)                               │
│ • Use: Troubleshooting, repair verification                │
└────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Read and Verify DTC Count

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Verify DTC Count Matches Actual Stored DTCs          │
└──────────────────────────────────────────────────────────────┘

Step 1: Request DTC count (confirmed only)
  Tester → ECU: 19 01 08
  ECU → Tester: 59 01 19 01 00 03
                          └──┴── 3 DTCs

Step 2: Request actual DTCs
  Tester → ECU: 19 02 08
  ECU → Tester: 59 02 19 P0135 08 P0420 08 C1234 08
                          └─────────┴─────────┴── 3 DTCs

✓ PASS: Count (3) matches actual DTCs (3)

Step 3: Request all DTCs (any status)
  Tester → ECU: 19 01 FF
  ECU → Tester: 59 01 19 01 00 05
                          └──┴── 5 DTCs total

Step 4: Verify with read
  Tester → ECU: 19 02 FF
  ECU → Tester: 59 02 19 P0135 08 P0171 04 P0420 09 
                          C1234 08 U0100 08
                          └─────────────────── 5 DTCs

✓ PASS: All counts verified
```

### Scenario 2: Snapshot Data Validation

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Read and Parse Snapshot Data (Freeze Frame)          │
└──────────────────────────────────────────────────────────────┘

Precondition: DTC P0420 stored with snapshot record 01

Step 1: Request snapshot
  Tester → ECU: 19 04 P0 04 20 01
  ECU → Tester: 59 04 P0 04 20 08 01 [Snapshot Data]

Step 2: Parse snapshot data structure
  Response Breakdown:
  ┌──────┬──────┬────────────┬────────┬──────┬─────────────┐
  │ 0x59 │ 0x04 │ P0 04 20   │ 0x08   │ 0x01 │ Data Records│
  └──────┴──────┴────────────┴────────┴──────┴─────────────┘
    SID    SF     DTC          Status   RecNum  Freeze Data

Step 3: Extract data identifiers
  Example Snapshot Data:
  ┌────────┬──────────────────────────┐
  │ DataID │ Value                    │
  ├────────┼──────────────────────────┤
  │ 0x0C   │ 1500 RPM (2 bytes)       │
  │ 0x0D   │ 45 km/h (1 byte)         │
  │ 0x05   │ 85°C (1 byte)            │
  │ 0x11   │ 25% Load (1 byte)        │
  └────────┴──────────────────────────┘

✓ PASS: Snapshot data retrieved and parsed
```

### Scenario 3: Extended Data Verification

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Verify Extended Data (Occurrence Counters)           │
└──────────────────────────────────────────────────────────────┘

Step 1: Request all extended data for DTC
  Tester → ECU: 19 06 P0 04 20 FF
                             └── 0xFF = all records

Step 2: Parse response
  ECU → Tester: 59 06 P0 04 20 08 [Ext Records]

  Extended Data Records:
  ┌──────────┬────────┬──────────────────────────┐
  │ Record # │ Length │ Data                     │
  ├──────────┼────────┼──────────────────────────┤
  │ 0x01     │ 1 byte │ Occurrence: 12 times     │
  │ 0x02     │ 1 byte │ Aging counter: 0         │
  │ 0x03     │ 1 byte │ Aged counter: 0          │
  │ 0x50     │ N bytes│ Manufacturer data        │
  └──────────┴────────┴──────────────────────────┘

✓ PASS: Extended data shows fault occurred 12 times
```

### Scenario 4: Clear and Verify DTCs

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Clear DTCs and Verify Successful Clear               │
└──────────────────────────────────────────────────────────────┘

Step 1: Check initial DTC count
  Tester → ECU: 19 01 FF
  ECU → Tester: 59 01 19 01 00 05 (5 DTCs)

Step 2: Clear all DTCs (SID 0x14)
  Tester → ECU: 14 FF FF FF
  ECU → Tester: 54 ✓

Step 3: Verify clear succeeded
  Tester → ECU: 19 01 FF
  ECU → Tester: 59 01 19 01 00 00 (0 DTCs) ✓

Step 4: Verify no DTCs returned
  Tester → ECU: 19 02 FF
  ECU → Tester: 59 02 19 (No DTC data) ✓

✓ PASS: DTCs successfully cleared
```

### Scenario 5: NRC Testing

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Verify Negative Response Codes                       │
└──────────────────────────────────────────────────────────────┘

Test A: Invalid subfunction
  Tester → ECU: 19 99 FF
  ECU → Tester: 7F 19 12 ✓ (Sub-function Not Supported)

Test B: Incorrect message length
  Tester → ECU: 19 04 P0 01 35
                      └────┴── Missing record number
  ECU → Tester: 7F 19 13 ✓ (Incorrect Message Length)

Test C: Invalid DTC number
  Tester → ECU: 19 04 FF FF FF 01
  ECU → Tester: 7F 19 31 ✓ (Request Out of Range)

Test D: Wrong session for mirror memory
  [In DEFAULT session]
  Tester → ECU: 19 0F FF
  ECU → Tester: 7F 19 22 ✓ (Conditions Not Correct)

✓ PASS: All NRCs returned correctly
```

### Scenario 6: Supported DTCs Discovery (0x0A)

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Discover All DTCs ECU Can Detect                     │
└──────────────────────────────────────────────────────────────┘

Precondition: ECU supports diagnostic capability reporting

Step 1: Request all supported DTCs
  Tester → ECU: 19 0A
  ECU → Tester: 59 0A 00 [Supported DTCs]

Step 2: Parse complete response
  Response Breakdown:
  ┌──────┬──────┬──────┬─────────────────────────────────┐
  │ 0x59 │ 0x0A │ 0x00 │ DTC List (3 bytes per DTC)      │
  └──────┴──────┴──────┴─────────────────────────────────┘
    SID    SF     Mask   No status bytes included

  Example Supported DTCs:
  ┌──────────┬────────────────────────────────────┐
  │ DTC Code │ Description                        │
  ├──────────┼────────────────────────────────────┤
  │ P0135    │ O2 Sensor Heater Circuit          │
  │ P0171    │ System Too Lean (Bank 1)          │
  │ P0420    │ Catalyst System Efficiency        │
  │ P0562    │ System Voltage Low                │
  │ C1234    │ ABS Wheel Speed Sensor            │
  │ U0100    │ Lost Communication with ECM       │
  └──────────┴────────────────────────────────────┘

Step 3: Compare with currently stored DTCs
  Tester → ECU: 19 02 FF (Get actual stored DTCs)
  ECU → Tester: 59 02 00 P0171 04 P0420 08

  Analysis:
  ┌──────────┬───────────┬─────────────────────┐
  │ DTC      │ Supported │ Currently Stored?   │
  ├──────────┼───────────┼─────────────────────┤
  │ P0135    │ ✓         │ ✗ (Capable but OK)  │
  │ P0171    │ ✓         │ ✓ (Pending)         │
  │ P0420    │ ✓         │ ✓ (Confirmed)       │
  │ P0562    │ ✓         │ ✗ (Capable but OK)  │
  │ C1234    │ ✓         │ ✗ (Capable but OK)  │
  │ U0100    │ ✓         │ ✗ (Capable but OK)  │
  └──────────┴───────────┴─────────────────────┘

Step 4: Use for diagnostic tool configuration
  • Configure tester to show only relevant DTCs for this ECU
  • Enable correct DTC descriptions
  • Prepare proper freeze frame/snapshot DIDs
  • Set up correct clearing procedures

✓ PASS: Supported DTCs discovered, tool configured

Use Cases for 0x0A:
  1. Diagnostic tool initialization
  2. ECU capability discovery
  3. Software variant identification
  4. Test coverage planning
  5. Fault injection test setup
```

### Scenario 7: Cross-Reference Supported vs. Active DTCs

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Verify DTC Capability vs. Active Faults              │
└──────────────────────────────────────────────────────────────┘

Test Workflow:

Step 1: Get baseline (supported DTCs)
  Tester → ECU: 19 0A
  ECU → Tester: 59 0A 00 [20 supported DTCs]
  Result: ECU can detect 20 different fault types

Step 2: Check current health
  Tester → ECU: 19 01 FF (Count all status)
  ECU → Tester: 59 01 00 01 00 02
                          └──┴── 2 DTCs present
  Result: 2 out of 20 possible DTCs are active

Step 3: Identify the active ones
  Tester → ECU: 19 02 FF
  ECU → Tester: 59 02 00 P0171 04 P0420 08

Step 4: Calculate ECU health score
  Health = (Supported - Active) / Supported × 100%
         = (20 - 2) / 20 × 100%
         = 90% healthy

✓ PASS: Health monitoring established
```

---

## Debugging Flowcharts

### Debugging: No DTCs Returned When Expected

```
            ┌──────────────────────┐
            │ PROBLEM: No DTCs     │
            │ returned but faults  │
            │ should exist         │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: Were DTCs     │
       │    │ recently cleared?    │
       │    └──────────┬───────────┘
       │               │
      YES             NO
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ DTCs were   │  │ Check: Correct   │
│ cleared by  │  │ status mask used?│
│ SID 0x14 or │  └────────┬─────────┘
│ battery     │           │
│ disconnect  │      ┌────┴────┐
└─────────────┘      │         │
                    YES       NO
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Check:DTC │ │ Use 0xFF │
              │setting   │ │ mask to  │
              │enabled?  │ │ get all  │
              │(SID 0x85)│ └──────────┘
              └────┬─────┘
                   │
              ┌────┴────┐
              │         │
           ENABLED  DISABLED
              │         │
              ▼         ▼
       ┌──────────┐ ┌──────────┐
       │Check ECU │ │Enable DTC│
       │fault     │ │setting   │
       │detection │ │SID 0x85  │
       │logic     │ │0x01      │
       └──────────┘ └──────────┘
```

### Debugging: Snapshot Data Empty or Invalid

```
            ┌──────────────────────┐
            │ PROBLEM: Snapshot    │
            │ data is empty or     │
            │ malformed            │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Verify: DTC exists?  │
       │    └──────────┬───────────┘
       │               │
      NO              YES
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Request     │  │ Check: Record    │
│ returns     │  │ number valid?    │
│ 7F 19 31    │  └────────┬─────────┘
│ (DTC not    │           │
│ found)      │      ┌────┴────┐
└─────────────┘      │         │
                    YES       NO
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Check:    │ │ Try 0xFF │
              │Snapshot  │ │ to get   │
              │captured? │ │ all recs │
              └────┬─────┘ └──────────┘
                   │
              ┌────┴────┐
              │         │
           CAPTURED  NOT CAPTURED
              │         │
              ▼         ▼
       ┌──────────┐ ┌──────────┐
       │Parse data│ │ECU may   │
       │using DID │ │not store │
       │structure │ │snapshots │
       └──────────┘ │for this  │
                    │DTC type  │
                    └──────────┘
```

### Debugging: Unexpected NRC 0x22

```
            ┌──────────────────────┐
            │ PROBLEM: Receiving   │
            │ NRC 0x22 (Conditions │
            │ Not Correct)         │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: Vehicle       │
       │    │ conditions OK?       │
       │    └──────────┬───────────┘
       │               │
    Moving         Stationary
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Stop vehicle│  │ Check: Engine    │
│ Speed must  │  │ state            │
│ be 0 km/h   │  └────────┬─────────┘
└─────────────┘           │
                     ┌────┴────┐
                     │         │
                  Running     Off
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Some ECUs │ │Check:    │
              │require   │ │Session   │
              │engine OFF│ │state?    │
              └──────────┘ └────┬─────┘
                                │
                           ┌────┴────┐
                           │         │
                       DEFAULT   EXTENDED
                           │         │
                           ▼         ▼
                    ┌──────────┐ ┌──────────┐
                    │Check if  │ │Should be │
                    │subfunction│ │OK - check│
                    │needs     │ │security  │
                    │EXTENDED  │ │access    │
                    └──────────┘ └──────────┘
```

### Debugging: Supported DTCs (0x0A) Returns Empty List

```
            ┌──────────────────────┐
            │ PROBLEM: Subfunction │
            │ 0x0A returns no DTCs │
            │ or very few          │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: Subfunction   │
       │    │ 0x0A supported?      │
       │    └──────────┬───────────┘
       │               │
      NO              YES
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ ECU returns │  │ Check: ECU       │
│ 7F 19 12    │  │ software variant?│
│ (Not        │  └────────┬─────────┘
│ Supported)  │           │
└─────────────┘      ┌────┴────┐
                     │         │
                 Basic ECU  Full Feature
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │May only  │ │Check:    │
              │support   │ │Configured│
              │mandatory │ │DTCs in   │
              │emission  │ │variant   │
              │DTCs      │ │data      │
              └──────────┘ └────┬─────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Verify:      │
                         │ • Calibration│
                         │   loaded?    │
                         │ • DTC config │
                         │   files OK?  │
                         │ • Feature    │
                         │   flags set? │
                         └──────────────┘

Common Causes:
  1. ECU software variant doesn't include full DTC library
  2. Configuration/calibration not loaded properly
  3. Feature licensing/activation required
  4. Manufacturing mode still active (DTCs disabled)
  5. Subfunction not implemented (returns empty list vs. NRC)
```

### Debugging: Mismatch Between 0x0A and Actual DTCs

```
            ┌──────────────────────┐
            │ PROBLEM: DTC appears │
            │ in 0x02 but not in   │
            │ 0x0A supported list  │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
       ┌────┤ Check: Dynamic DTC?  │
       │    │ (runtime generated)  │
       │    └──────────┬───────────┘
       │               │
      YES             NO
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ Some ECUs   │  │ Check: Software  │
│ generate    │  │ updated after    │
│ DTCs based  │  │ initial query?   │
│ on active   │  └────────┬─────────┘
│ config (e.g.│           │
│ trailer     │      ┌────┴────┐
│ connected)  │      │         │
└─────────────┘     YES       NO
                     │         │
                     ▼         ▼
              ┌──────────┐ ┌──────────┐
              │Re-query  │ │Possible  │
              │19 0A     │ │ECU bug:  │
              │after     │ │DTC should│
              │config    │ │be in 0x0A│
              │change    │ │list      │
              └──────────┘ └──────────┘

Resolution Strategy:
  1. Query 0x0A at start of diagnostic session
  2. Store list as "baseline capabilities"
  3. If unexpected DTC appears, re-query 0x0A
  4. Document any discrepancies for ECU validation
  5. Check ISO 14229-1 compliance of ECU
```

---

## Best Practices Checklist

### Implementation Checklist

```
┌──────────────────────────────────────────────────────────────┐
│         SID 0x19 IMPLEMENTATION BEST PRACTICES               │
└──────────────────────────────────────────────────────────────┘

REQUEST VALIDATION:
  ☐ Verify message length for each subfunction
  ☐ Validate status mask range (0x00-0xFF)
  ☐ Check DTC number format (3 bytes)
  ☐ Validate record number (0x00-0xFF)
  ☐ Verify subfunction support before processing

SESSION MANAGEMENT:
  ☐ Check session state (DEFAULT/EXTENDED required)
  ☐ Implement session timeout handling
  ☐ Support subfunction 0x01-0x0E in DEFAULT session
  ☐ Restrict 0x0F-0x19 to EXTENDED session (if applicable)
  ☐ Maintain session state during multi-request sequences

SECURITY:
  ☐ Identify which DTCs require security access
  ☐ Validate security state before returning protected data
  ☐ Return NRC 0x33 for security-locked DTCs
  ☐ Allow public DTCs (P-codes) without security
  ☐ Document security requirements clearly

DTC STORAGE:
  ☐ Implement proper DTC lifecycle (pending → confirmed)
  ☐ Update status bits correctly (8-bit status byte)
  ☐ Store snapshot data when DTC first fails
  ☐ Maintain occurrence counters in extended data
  ☐ Support aging/aged counters per ISO 14229-1
  ☐ Implement proper DTC priority/severity
  ☐ Define complete supported DTC list (for 0x0A response)
  ☐ Ensure supported DTC list matches ECU capabilities

RESPONSE FORMATTING:
  ☐ Include status availability mask in responses
  ☐ Use correct DTC format identifier (0x01 = ISO14229-1)
  ☐ Format DTC count as 2 bytes (Hi + Lo)
  ☐ Include status byte for each DTC (except 0x0A)
  ☐ Structure snapshot data with Data IDs
  ☐ Format extended data records properly
  ☐ For 0x0A: return DTCs only (no status bytes)
  ☐ For 0x0A: include ALL detectable DTCs, not just active ones

ERROR HANDLING:
  ☐ Return NRC 0x12 for unsupported subfunctions
  ☐ Return NRC 0x13 for incorrect message length
  ☐ Return NRC 0x22 for wrong session or conditions
  ☐ Return NRC 0x31 for invalid DTC or record number
  ☐ Return NRC 0x33 for security access denied
  ☐ Handle edge cases (no DTCs, empty records)

PERFORMANCE:
  ☐ Optimize DTC search algorithms
  ☐ Implement efficient status mask filtering
  ☐ Use response pending (0x78) for long operations
  ☐ Cache frequently accessed DTC data
  ☐ Minimize memory fragmentation

TESTING:
  ☐ Test all supported subfunctions
  ☐ Verify NRC responses for invalid requests
  ☐ Test with various status masks (0x00, 0x08, 0xFF)
  ☐ Validate snapshot and extended data integrity
  ☐ Test session transitions during DTC operations
  ☐ Verify DTC clear and re-check workflow
  ☐ Test with maximum DTC count scenarios
  ☐ Verify 0x0A returns complete supported DTC list
  ☐ Compare 0x0A list with actual detectable faults
  ☐ Test 0x0A in both DEFAULT and EXTENDED sessions

DOCUMENTATION:
  ☐ Document all supported subfunctions
  ☐ List DTC format used (ISO 14229-1, SAE J2012)
  ☐ Specify session requirements per subfunction
  ☐ Document security access requirements
  ☐ Provide snapshot data structure (DIDs included)
  ☐ List extended data record definitions
  ☐ Include example request/response sequences
  ☐ Publish complete supported DTC list (from 0x0A)
  ☐ Document DTC capability vs. variant configuration
```

### Integration Checklist

```
┌──────────────────────────────────────────────────────────────┐
│         INTEGRATION WITH OTHER SERVICES                      │
└──────────────────────────────────────────────────────────────┘

WITH SID 0x10 (Session Control):
  ☐ Test DTC reading in all supported sessions
  ☐ Verify session timeout doesn't interrupt DTC reads
  ☐ Handle session transitions gracefully

WITH SID 0x14 (Clear DTC):
  ☐ Verify SID 0x19 0x01 returns 0 after clear
  ☐ Ensure all DTC data (snapshot, extended) is cleared
  ☐ Reset status bits to 0x00
  ☐ Test selective vs. full clear

WITH SID 0x27 (Security Access):
  ☐ Identify protected vs. public DTCs
  ☐ Test security unlock before protected DTC access
  ☐ Verify NRC 0x33 when locked

WITH SID 0x85 (Control DTC Setting):
  ☐ Test DTC reading when setting disabled
  ☐ Verify existing DTCs remain readable
  ☐ Ensure new DTCs aren't stored when disabled

WITH SID 0x22 (Read Data by Identifier):
  ☐ Cross-reference snapshot DIDs with live data
  ☐ Ensure consistent data formatting
  ☐ Use same scaling/units
```

---

**End of Document**
