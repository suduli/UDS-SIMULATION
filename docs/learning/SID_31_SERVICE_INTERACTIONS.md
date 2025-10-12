# SID 0x31 - Routine Control (Service Interactions Guide)

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## 📋 Table of Contents

1. [Service Dependency Hierarchy](#service-dependency-hierarchy)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Hierarchy

### Dependency Pyramid

```
┌────────────────────────────────────────────────────────────────┐
│              SID 0x31 SERVICE DEPENDENCIES                     │
│                  (Bottom-Up Hierarchy)                         │
└────────────────────────────────────────────────────────────────┘

                        ┌───────────────┐
                        │   SID 0x31    │
                        │   Routine     │
                        │   Control     │
                        └───────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                │                               │
                ▼                               ▼
        ┌───────────────┐               ┌──────────────┐
        │   SID 0x27    │               │  SID 0x3E    │
        │   Security    │               │  Tester      │
        │   Access      │               │  Present     │
        │  (Optional*)  │               │  (Optional*) │
        └───────┬───────┘               └──────────────┘
                │
                │
                ▼
        ┌───────────────┐
        │   SID 0x10    │
        │   Diagnostic  │
        │   Session     │
        │   Control     │
        └───────┬───────┘
                │
                │
                ▼
        ┌───────────────┐
        │  Transport    │
        │  Layer        │
        │  (CAN/DoIP)   │
        └───────────────┘

        * Required only for specific routines
```

### Service Call Order

```
┌────────────────────────────────────────────────────────────────┐
│            CORRECT SERVICE INVOCATION ORDER                    │
└────────────────────────────────────────────────────────────────┘

    STEP 1: Session Control (0x10)
        │
        └──► Establishes diagnostic session
             (DEFAULT → EXTENDED or PROGRAMMING)
        │
        ▼
    
    STEP 2: Security Access (0x27) [If Required]
        │
        └──► Unlocks protected routines
             (Request Seed → Send Key)
        │
        ▼
    
    STEP 3: Routine Control (0x31)
        │
        ├──► Start Routine (0x01)
        │
        ├──► [Maintain with Tester Present (0x3E)]
        │
        ├──► Request Results (0x03)
        │
        └──► Stop Routine (0x02) [If Needed]
        │
        ▼
    
    STEP 4: Cleanup
        │
        ├──► Read DTCs (0x19) [If Errors]
        │
        ├──► Clear DTCs (0x14) [If Test DTCs]
        │
        └──► Return to Default Session (0x10 01)
```

---

## Session Requirements Matrix

### Routine Access by Session Type

```
┌─────────────────┬──────────┬──────────┬──────────────┬──────────┐
│  Routine Type   │ DEFAULT  │ EXTENDED │ PROGRAMMING  │ Security │
│                 │  (0x01)  │  (0x03)  │   (0x02)     │ Required │
├─────────────────┼──────────┼──────────┼──────────────┼──────────┤
│ Read Info       │    ✅    │    ✅    │      ✅      │    NO    │
│ Basic Test      │    ❌    │    ✅    │      ✅      │    NO    │
│ Actuator Test   │    ❌    │    ✅    │      ✅      │    YES   │
│ Calibration     │    ❌    │    ✅    │      ✅      │    YES   │
│ Memory Erase    │    ❌    │    ❌    │      ✅      │    YES   │
│ Flash Program   │    ❌    │    ❌    │      ✅      │    YES   │
│ EOL Tests       │    ❌    │    ❌    │      ✅      │    YES   │
└─────────────────┴──────────┴──────────┴──────────────┴──────────┘

Legend:
  ✅ = Allowed
  ❌ = Not Allowed
```

### Session Transitions for Routines

```
┌────────────────────────────────────────────────────────────────┐
│              SESSION TRANSITION SCENARIOS                      │
└────────────────────────────────────────────────────────────────┘

Scenario A: Basic Diagnostic Routine
┌──────────┐    10 03     ┌──────────┐    31 01 XX XX   ┌────────┐
│ DEFAULT  │─────────────►│ EXTENDED │─────────────────►│ RUNNING│
│ SESSION  │              │ SESSION  │                  │ ROUTINE│
└──────────┘              └──────────┘                  └────────┘

Scenario B: Protected Routine
┌──────────┐    10 03     ┌──────────┐    27 XX     ┌─────────┐
│ DEFAULT  │─────────────►│ EXTENDED │─────────────►│UNLOCKED │
│ SESSION  │              │ SESSION  │              │ 🔓      │
└──────────┘              └──────────┘              └────┬────┘
                                                         │
                                                  31 01 XX XX
                                                         │
                                                         ▼
                                                  ┌────────────┐
                                                  │  RUNNING   │
                                                  │  ROUTINE   │
                                                  └────────────┘

Scenario C: Programming Routine
┌──────────┐    10 02     ┌──────────┐    27 XX     ┌─────────┐
│ DEFAULT  │─────────────►│PROGRAMNG │─────────────►│UNLOCKED │
│ SESSION  │              │ SESSION  │              │ 🔓      │
└──────────┘              └──────────┘              └────┬────┘
                                                         │
                                                  31 01 FF XX
                                                         │
                                                         ▼
                                                  ┌────────────┐
                                                  │ FLASH/ERASE│
                                                  │  ROUTINE   │
                                                  └────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Simple Actuator Test

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Test Fuel Pump Relay (No Security Required)        │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 1: Setup Session             │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 10 03                        │
    │  (Extended Diagnostic Session)         │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 50 03 00 32 01 F4           │
    │  (P2=50ms, P2*=500ms)                  │
    │<───────────────────────────────────────│
    │                                        │
    │  [SESSION: EXTENDED ✓]                 │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 2: Start Test                │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 01 0F A0                  │
    │  (Start Fuel Pump Relay Test)          │
    │───────────────────────────────────────>│
    │                                        │
    │         [ECU activates relay for 2s]   │
    │         [Relay clicks: PASS ✓]         │
    │                                        │
    │  Response: 71 01 0F A0 01              │
    │  (Started, Status=PASS)                │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 3: Get Final Results         │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 03 0F A0                  │
    │  (Request Results)                     │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 0F A0 01 00           │
    │  (PASS, No Errors)                     │
    │<───────────────────────────────────────│
    │                                        │
    │  [TEST COMPLETE: ✅ PASS]              │
    │                                        │
```

### Workflow 2: Secured Calibration Routine

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Throttle Body Calibration (Security Required)      │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 1: Extended Session          │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 10 03                        │
    │───────────────────────────────────────>│
    │  Response: 50 03 00 32 01 F4           │
    │<───────────────────────────────────────│
    │                                        │
    │  [SESSION: EXTENDED ✓]                 │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 2: Security Access           │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 27 01                        │
    │  (Request Seed, Level 1)               │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 67 01 A5 B6 C7 D8           │
    │  (Seed = A5 B6 C7 D8)                  │
    │<───────────────────────────────────────│
    │                                        │
    │  [Calculate Key from Seed]             │
    │                                        │
    │  Request: 27 02 12 34 56 78            │
    │  (Send Key)                            │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 67 02                       │
    │  (Unlocked 🔓)                         │
    │<───────────────────────────────────────│
    │                                        │
    │  [SECURITY: UNLOCKED ✓]                │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 3: Start Calibration         │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 01 AB CD                  │
    │  (Start Throttle Calibration)          │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 AB CD 00              │
    │  (Started, In Progress)                │
    │<───────────────────────────────────────│
    │                                        │
    │  [Calibration runs ~30 seconds]        │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 4: Keep Session Alive        │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 3E 00                        │
    │  (Tester Present)                      │
    │───────────────────────────────────────>│
    │  Response: 7E 00                       │
    │<───────────────────────────────────────│
    │                                        │
    │  [Wait 3 seconds...]                   │
    │                                        │
    │  Request: 3E 00                        │
    │───────────────────────────────────────>│
    │  Response: 7E 00                       │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 5: Check Progress            │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 03 AB CD                  │
    │  (Request Results)                     │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 AB CD 00 32           │
    │  (In Progress, 50% complete)           │
    │<───────────────────────────────────────│
    │                                        │
    │  [Continue waiting and sending 3E...]  │
    │                                        │
    │  Request: 31 03 AB CD                  │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 AB CD 01 64           │
    │  (Complete, 100%, PASS ✓)              │
    │<───────────────────────────────────────│
    │                                        │
    │  [CALIBRATION COMPLETE: ✅ PASS]       │
    │                                        │
```

### Workflow 3: Programming Session with Memory Erase

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Erase Flash Memory (Programming Session)           │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 1: Programming Session       │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 10 02                        │
    │  (Programming Session)                 │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 50 02 00 32 01 F4           │
    │<───────────────────────────────────────│
    │                                        │
    │  [SESSION: PROGRAMMING ✓]              │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 2: Security Level 2          │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 27 03                        │
    │  (Request Seed, Level 2)               │
    │───────────────────────────────────────>│
    │  Response: 67 03 [SEED]                │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 27 04 [KEY]                  │
    │───────────────────────────────────────>│
    │  Response: 67 04 (Unlocked 🔓)         │
    │<───────────────────────────────────────│
    │                                        │
    │  [SECURITY LEVEL 2: UNLOCKED ✓]        │
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 3: Check Pre-Conditions      │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 01 02 03                  │
    │  (Check Programming Pre-Conditions)    │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 02 03 01              │
    │  (Pre-conditions OK ✓)                 │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ PHASE 4: Erase Memory              │ │
    │ └────────────────────────────────────┘ │
    │                                        │
    │  Request: 31 01 FF 00 01               │
    │  (Erase Flash - Section 1)             │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 FF 00 00              │
    │  (Erase started)                       │
    │<───────────────────────────────────────│
    │                                        │
    │  [Erasing... ~10 seconds]              │
    │                                        │
    │  Request: 3E 00 (Keep alive)           │
    │───────────────────────────────────────>│
    │  Response: 7E 00                       │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 31 03 FF 00                  │
    │  (Check erase results)                 │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 FF 00 01              │
    │  (Erase complete ✓)                    │
    │<───────────────────────────────────────│
    │                                        │
    │  [MEMORY ERASED: ✅ SUCCESS]           │
    │                                        │
```

### Workflow 4: Routine Cancellation

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW: User Cancels Long-Running Test                     │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Extended Session Active]             │
    │  [Security Unlocked]                   │
    │                                        │
    │  Request: 31 01 56 78                  │
    │  (Start Long Test - 60 seconds)        │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 56 78 00              │
    │  (Test started)                        │
    │<───────────────────────────────────────│
    │                                        │
    │  [Test running... 15 seconds elapsed]  │
    │                                        │
    │  Request: 31 03 56 78                  │
    │  (Check progress)                      │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 56 78 00 19           │
    │  (In progress, 25% complete)           │
    │<───────────────────────────────────────│
    │                                        │
    │  [User clicks CANCEL button]           │
    │                                        │
    │  Request: 31 02 56 78                  │
    │  (STOP routine)                        │
    │───────────────────────────────────────>│
    │                                        │
    │         [ECU stops test gracefully]    │
    │         [Cleanup resources]            │
    │                                        │
    │  Response: 71 02 56 78 02              │
    │  (Stopped by request)                  │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 31 03 56 78                  │
    │  (Get final state)                     │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 56 78 02 19           │
    │  (Stopped at 25% completion)           │
    │<───────────────────────────────────────│
    │                                        │
    │  [TEST CANCELLED BY USER]              │
    │                                        │
```

### Workflow 5: Routine Fails with DTC

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Test Fails, Read and Clear DTC                     │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Extended Session, Security OK]       │
    │                                        │
    │  Request: 31 01 99 AA                  │
    │  (Start O2 Sensor Test)                │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 99 AA 00              │
    │<───────────────────────────────────────│
    │                                        │
    │  [Test runs... sensor fails to heat]   │
    │  [ECU sets DTC: P0135]                 │
    │                                        │
    │  Request: 31 03 99 AA                  │
    │  (Get results)                         │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 7F 31 72                    │
    │  (General Programming Failure)         │
    │<───────────────────────────────────────│
    │                                        │
    │  [Routine Failed ❌]                   │
    │                                        │
    │  Request: 19 02 0F                     │
    │  (Read DTCs by Status Mask)            │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 59 02 0F 01 01 35 08 00     │
    │  (DTC: P0135 - O2 Heater Circuit)      │
    │<───────────────────────────────────────│
    │                                        │
    │  [Display DTC to technician]           │
    │  [Technician checks wiring...]         │
    │  [Issue fixed]                         │
    │                                        │
    │  Request: 14 FF FF FF                  │
    │  (Clear all DTCs)                      │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 54                          │
    │  (DTCs cleared)                        │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 31 01 99 AA                  │
    │  (Retry test)                          │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 01 99 AA 00              │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 31 03 99 AA                  │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 71 03 99 AA 01              │
    │  (PASS ✅)                             │
    │<───────────────────────────────────────│
    │                                        │
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Diagnostic Test Session

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Complete Diagnostic Test with Multiple Routines     │
└────────────────────────────────────────────────────────────────┘

 Service Flow:

    10 03 (Extended Session)
      │
      ▼
    27 01/02 (Security Access)
      │
      ├──► 31 01 RID1 (Test 1: Actuator)
      │     └──► 31 03 RID1 (Results) ✅
      │
      ├──► 31 01 RID2 (Test 2: Sensor)
      │     └──► 31 03 RID2 (Results) ✅
      │
      ├──► 31 01 RID3 (Test 3: Communication)
      │     └──► 31 03 RID3 (Results) ✅
      │
      ├──► 22 F1 90 (Read VIN - Verification)
      │
      ├──► 19 02 AF (Read Test DTCs)
      │
      ├──► 14 FF FF FF (Clear Test DTCs)
      │
      └──► 10 01 (Return to Default)
```

### Pattern 2: Flash Programming Sequence

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Complete ECU Reprogramming Session                  │
└────────────────────────────────────────────────────────────────┘

    10 02 (Programming Session)
      │
      ▼
    27 03/04 (Security Level 2)
      │
      ▼
    31 01 02 03 (Check Pre-Conditions)
      │
      ▼
    31 01 FF 01 (Check Dependencies)
      │
      ▼
    31 01 FF 00 (Erase Memory)
      │ (Send 3E periodically)
      ▼
    31 03 FF 00 (Verify Erase)
      │
      ▼
    34 XX ... (Request Download)
      │
      ▼
    36 XX [Data] (Transfer Data - Multiple blocks)
      │
      ▼
    37 (Request Transfer Exit)
      │
      ▼
    31 01 02 02 (Check Programming Dependencies)
      │
      ▼
    31 01 FF 02 (Verify Programming)
      │
      ▼
    11 01 (ECU Reset)
```

### Pattern 3: Production End-of-Line Test

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Manufacturing EOL Complete Test Sequence            │
└────────────────────────────────────────────────────────────────┘

    10 02 (Programming Session)
      │
      ▼
    27 05/06 (Manufacturing Security)
      │
      ├──► 2E F1 8C [VIN] (Write VIN)
      │
      ├──► 2E F1 5A [Date] (Write Manufacturing Date)
      │
      ├──► 31 01 F0 01 (ECU Self-Test)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 02 (CAN Communication Test)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 03 (Input/Output Test)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 04 (Sensor Test)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 05 (Actuator Test)
      │     └──► Results: ✅
      │
      ├──► 2E F1 87 [Status] (Write EOL Test Status: PASS)
      │
      └──► 10 01 (Return to Default)
      
    [ECU Ready for Delivery ✅]
```

### Pattern 4: Adaptive Value Reset

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Reset Adaptive/Learning Values After Repair         │
└────────────────────────────────────────────────────────────────┘

    10 03 (Extended Session)
      │
      ▼
    27 01/02 (Security Access)
      │
      ├──► 14 FF FF FF (Clear DTCs)
      │
      ├──► 31 01 F0 10 (Reset Fuel Trim Learning)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 11 (Reset Throttle Adaptation)
      │     └──► Results: ✅
      │
      ├──► 31 01 F0 12 (Reset Transmission Learning)
      │     └──► Results: ✅
      │
      ├──► 2F [DID] [Value] (Reset specific parameters)
      │
      └──► 10 01 (Return to Default)
      
    [Adaptive values reset, ready for road test]
```

### Pattern 5: Variant Coding

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Configure ECU for Vehicle Variant                   │
└────────────────────────────────────────────────────────────────┘

    10 03 (Extended Session)
      │
      ▼
    27 01/02 (Security Access)
      │
      ▼
    2E F1 00 [Variant Code] (Write Variant)
      │
      ▼
    31 01 F0 20 (Apply Variant Configuration)
      │ (ECU reconfigures based on variant)
      │
      ▼
    31 03 F0 20 (Verify Configuration)
      │
      ▼
    22 F1 00 (Read Back Variant - Verify)
      │
      ▼
    11 01 (ECU Reset to apply changes)
      │
      ▼
    [Wait for ECU reboot]
      │
      ▼
    22 F1 00 (Verify variant after reset)
      │
      ▼
    [Configuration complete ✅]
```

### Pattern 6: Continuous Monitoring Routine

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Long-Running Monitoring with Periodic Updates       │
└────────────────────────────────────────────────────────────────┘

    10 03 (Extended Session)
      │
      ▼
    31 01 A0 B0 (Start Emissions Monitor - 120 sec)
      │
      ▼
    Loop (every 5 seconds):
      ├──► 3E 00 (Tester Present)
      │
      └──► 31 03 A0 B0 (Get Progress)
            │
            ├──► T=5s:  [Progress: 8%]
            ├──► T=10s: [Progress: 16%]
            ├──► T=15s: [Progress: 25%]
            │    ...
            └──► T=120s: [Complete: 100% ✅]
      
    [Test complete, results saved]
```

### Pattern 7: Conditional Routine Execution

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Execute Routine Based on Vehicle State              │
└────────────────────────────────────────────────────────────────┘

    10 03 (Extended Session)
      │
      ▼
    22 01 00 (Read Engine State)
      │
      ├──► If Engine = OFF:
      │     └──► 31 01 C0 D0 (Injector Test - Engine Off)
      │
      └──► If Engine = ON:
            └──► 31 01 C0 D1 (Injector Test - Engine Running)
      
    Both routines return results via:
      31 03 C0 DX (Request Results)
```

---

## Troubleshooting Scenarios

### Scenario 1: Session Times Out During Routine

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: Routine stops because session expired                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    • Routine starts OK                                         │
│    • After 5 seconds, routine stops                            │
│    • No results available                                      │
│                                                                │
│  Root Cause:                                                   │
│    Extended session timeout (default 5000ms)                   │
│    No Tester Present sent during routine execution             │
│                                                                │
│  Timeline:                                                     │
│    T=0s:   31 01 XX XX (Start routine)                        │
│    T=0s:   71 01 XX XX 00 (Started OK)                        │
│    T=5s:   [Session expires → DEFAULT]                        │
│    T=5s:   [Routine auto-stops]                               │
│    T=6s:   31 03 XX XX (Request results)                      │
│    T=6s:   7F 31 24 (Sequence error - not running)            │
│                                                                │
│  Solution:                                                     │
│    ┌──────────────────────────────────────┐                   │
│    │ Send 3E 00 every 2-3 seconds         │                   │
│    │ during long-running routines         │                   │
│    └──────────────────────────────────────┘                   │
│                                                                │
│  Corrected Timeline:                                           │
│    T=0s:   31 01 XX XX (Start)                                │
│    T=2s:   3E 00 (Keep alive) ✅                              │
│    T=4s:   3E 00 (Keep alive) ✅                              │
│    T=6s:   3E 00 (Keep alive) ✅                              │
│    T=10s:  31 03 XX XX (Results)                              │
│    T=10s:  71 03 XX XX [RESULTS] ✅                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Wrong Session for Routine

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: Routine requires PROGRAMMING session                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    Request: 31 01 FF 00 (Memory Erase)                        │
│    Response: 7F 31 7F (Not supported in active session)       │
│                                                                │
│  Current State: Extended Session (0x03)                        │
│  Required: Programming Session (0x02)                          │
│                                                                │
│  Solution Flow:                                                │
│                                                                │
│    ┌──────────────────────────────────┐                       │
│    │ 1. Exit Extended Session         │                       │
│    │    10 01 (Default)               │                       │
│    └──────────────┬───────────────────┘                       │
│                   ▼                                            │
│    ┌──────────────────────────────────┐                       │
│    │ 2. Enter Programming Session     │                       │
│    │    10 02                         │                       │
│    └──────────────┬───────────────────┘                       │
│                   ▼                                            │
│    ┌──────────────────────────────────┐                       │
│    │ 3. Security Access (Level 2)     │                       │
│    │    27 03/04                      │                       │
│    └──────────────┬───────────────────┘                       │
│                   ▼                                            │
│    ┌──────────────────────────────────┐                       │
│    │ 4. Retry Routine                 │                       │
│    │    31 01 FF 00                   │                       │
│    │    71 01 FF 00 00 ✅             │                       │
│    └──────────────────────────────────┘                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Conditions Not Met

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: Vehicle conditions prevent routine execution        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    Request: 31 01 12 34 (Actuator test)                       │
│    Response: 7F 31 22 (Conditions not correct)                │
│                                                                │
│  Diagnostic Steps:                                             │
│                                                                │
│    ┌──────────────────────────────────┐                       │
│    │ Check 1: Vehicle Speed           │                       │
│    │   22 01 0D (Read speed DID)      │                       │
│    │   Result: 45 km/h ❌             │                       │
│    │   Required: 0 km/h               │                       │
│    └──────────────────────────────────┘                       │
│                   │                                            │
│    ┌──────────────▼──────────────────┐                        │
│    │ Action: Stop vehicle             │                       │
│    │   [Vehicle now stopped]          │                       │
│    └──────────────┬──────────────────┘                        │
│                   │                                            │
│    ┌──────────────▼──────────────────┐                        │
│    │ Check 2: Engine State            │                       │
│    │   22 01 00 (Read engine DID)     │                       │
│    │   Result: Running ❌             │                       │
│    │   Required: Off                  │                       │
│    └──────────────────────────────────┘                       │
│                   │                                            │
│    ┌──────────────▼──────────────────┐                        │
│    │ Action: Turn off engine          │                       │
│    │   [Engine now off]               │                       │
│    └──────────────┬──────────────────┘                        │
│                   │                                            │
│    ┌──────────────▼──────────────────┐                        │
│    │ Retry Routine:                   │                       │
│    │   31 01 12 34                    │                       │
│    │   71 01 12 34 00 ✅              │                       │
│    └──────────────────────────────────┘                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Service Timing Parameters

```
┌──────────────────┬────────────┬────────────┬─────────────────┐
│  Parameter       │  Typical   │  Extended  │  Description    │
│                  │  Value     │  Value     │                 │
├──────────────────┼────────────┼────────────┼─────────────────┤
│  P2 (Response)   │  50 ms     │  50 ms     │  Normal timeout │
│  P2* (Extended)  │  5000 ms   │  10000 ms  │  Long operations│
│  S3 (Session)    │  5000 ms   │  5000 ms   │  Session timeout│
│  Tester Present  │  N/A       │  2000 ms   │  Keep-alive int.│
│  Security TO     │  10000 ms  │  10000 ms  │  Security expiry│
└──────────────────┴────────────┴────────────┴─────────────────┘
```

### Common RID Categories

```
┌──────────────┬──────────────────────────────────────────────────┐
│  RID Range   │  Purpose / Examples                              │
├──────────────┼──────────────────────────────────────────────────┤
│  0x0000-     │  Vehicle manufacturer routines                   │
│  0x00FF      │  Example: Custom diagnostics                     │
├──────────────┼──────────────────────────────────────────────────┤
│  0x0200-     │  Programming prerequisites                       │
│  0x02FF      │  0x0203: Check programming dependencies          │
├──────────────┼──────────────────────────────────────────────────┤
│  0xF000-     │  Actuator tests                                  │
│  0xF0FF      │  0xF012: Injector test                           │
│              │  0xF034: Throttle test                           │
├──────────────┼──────────────────────────────────────────────────┤
│  0xF100-     │  Sensor tests                                    │
│  0xF1FF      │  0xF156: O2 sensor test                          │
│              │  0xF178: Lambda sensor test                      │
├──────────────┼──────────────────────────────────────────────────┤
│  0xFF00-     │  Programming operations                          │
│  0xFFFF      │  0xFF00: Erase memory                            │
│              │  0xFF01: Check dependencies                      │
└──────────────┴──────────────────────────────────────────────────┘
```

### Service Combination Matrix

```
┌────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│  Current   │ Next Service Can Be:                             │
│  Service   │ 0x10    │ 0x27    │ 0x31    │ 0x3E    │ Other   │
├────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  None      │   ✅    │   ❌    │   ❌    │   ❌    │   ❌    │
│  0x10      │   ✅    │   ✅    │   ✅*   │   ✅    │   ✅    │
│  0x27      │   ✅    │   ✅    │   ✅    │   ✅    │   ✅    │
│  0x31      │   ✅    │   ✅    │   ✅**  │   ✅    │   ✅*** │
│  0x3E      │   ✅    │   ✅    │   ✅    │   ✅    │   ✅    │
└────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

   * Depends on session and security
  ** Only if previous routine complete/stopped
 *** Limited services during routine execution
```

### NRC Priority Decision

```
When multiple errors exist, return NRC in this priority order:

┌──────┬───────────────────────────────────────────────────────┐
│ Rank │  NRC Code & Condition                                 │
├──────┼───────────────────────────────────────────────────────┤
│  1   │  0x13 - Incorrect Message Length                      │
│      │  (Check first - fundamental format error)             │
├──────┼───────────────────────────────────────────────────────┤
│  2   │  0x12 - SubFunction Not Supported                     │
│      │  (Invalid subfunction value)                          │
├──────┼───────────────────────────────────────────────────────┤
│  3   │  0x7F - Service Not Supported In Active Session       │
│      │  (Wrong session type)                                 │
├──────┼───────────────────────────────────────────────────────┤
│  4   │  0x33 - Security Access Denied                        │
│      │  (Not unlocked)                                       │
├──────┼───────────────────────────────────────────────────────┤
│  5   │  0x31 - Request Out Of Range                          │
│      │  (Invalid RID)                                        │
├──────┼───────────────────────────────────────────────────────┤
│  6   │  0x24 - Request Sequence Error                        │
│      │  (Wrong order or state)                               │
├──────┼───────────────────────────────────────────────────────┤
│  7   │  0x22 - Conditions Not Correct                        │
│      │  (Prerequisites not met)                              │
├──────┼───────────────────────────────────────────────────────┤
│  8   │  0x72 - General Programming Failure                   │
│      │  (Execution failed)                                   │
└──────┴───────────────────────────────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│          SID 0x31 SERVICE INTERACTIONS SUMMARY                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Key Dependencies:                                             │
│  • SID 0x10 (Session Control) - Required for session access   │
│  • SID 0x27 (Security) - Required for protected routines      │
│  • SID 0x3E (Tester Present) - Needed for long routines       │
│  • SID 0x19/0x14 (DTCs) - Useful for diagnostics              │
│                                                                │
│  Typical Workflow:                                             │
│  1. Enter diagnostic session (0x10)                            │
│  2. Unlock security if needed (0x27)                           │
│  3. Start routine (0x31 01)                                    │
│  4. Keep session alive (0x3E)                                  │
│  5. Check progress/results (0x31 03)                           │
│  6. Handle errors (read DTCs with 0x19)                        │
│  7. Cleanup (clear DTCs with 0x14, exit session)               │
│                                                                │
│  Best Practices:                                               │
│  ✅ Always check prerequisites before starting                │
│  ✅ Send Tester Present for routines > 3 seconds              │
│  ✅ Handle NRCs gracefully with proper diagnostics            │
│  ✅ Follow proper service sequence                            │
│  ✅ Document all routine interactions                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x31 Service Interactions Guide**
