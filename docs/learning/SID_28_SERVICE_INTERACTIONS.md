# SID 0x28: Communication Control - Service Interactions Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## Table of Contents

1. [Overview](#overview)
2. [Service Dependency Pyramid](#service-dependency-pyramid)
3. [Session Requirements Matrix](#session-requirements-matrix)
4. [Complete Workflow Examples](#complete-workflow-examples)
5. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
6. [Integration with Specific Services](#integration-with-specific-services)
7. [Troubleshooting Multi-Service Scenarios](#troubleshooting-multi-service-scenarios)
8. [Quick Reference Tables](#quick-reference-tables)

---

## Overview

SID 0x28 (Communication Control) **rarely operates alone**. It's typically used in conjunction with other UDS services to:

- **Isolate ECUs** before firmware updates (with SID 0x34, 0x36, 0x37)
- **Prevent interference** during diagnostic routines (with SID 0x31)
- **Control network traffic** during configuration writes (with SID 0x2E)
- **Maintain session** during long operations (with SID 0x3E)

This guide shows **complete multi-service workflows** with sequence diagrams showing Tester ↔ ECU communication.

---

## Service Dependency Pyramid

### Dependency Hierarchy

```
                    ┌──────────────────────┐
                    │   Communication      │
                    │   Control (0x28)     │
                    │   [Isolation Layer]  │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
    ┌───────┴────────┐                   ┌────────┴───────┐
    │  Session (0x10)│                   │Security (0x27) │
    │  [Access Layer]│                   │[Access Layer]  │
    └───────┬────────┘                   └────────┬───────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               │
        ┌──────────────────────┴───────────────────────┐
        │                      │                       │
┌───────┴────────┐    ┌────────┴────────┐    ┌────────┴────────┐
│  Flash (0x34)  │    │  Write (0x2E)   │    │Routines (0x31)  │
│  Transfer (0x36)│    │  Read (0x22)    │    │  DTCs (0x14,19) │
│  Exit (0x37)   │    │                 │    │                 │
└────────────────┘    └─────────────────┘    └─────────────────┘
                      [Protected Services]
```

### Dependency Rules

```
┌────────────────────────────────────────────────────┐
│ Service 0x28 Dependencies                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  REQUIRED BEFORE 0x28:                            │
│    1. Session Control (0x10)                      │
│       → Must be in Extended (0x03) or             │
│         Programming (0x02) session                │
│                                                    │
│    2. Security Access (0x27) [Optional]           │
│       → Required if ECU enforces security         │
│         for communication control                 │
│                                                    │
│  SERVICES THAT USE 0x28:                          │
│    • Firmware Update (0x34, 0x36, 0x37, 0x31)     │
│    • Configuration Write (0x2E)                   │
│    • Diagnostic Routines (0x31)                   │
│    • Network Testing (various)                    │
│                                                    │
│  SERVICES THAT WORK WITH 0x28 ACTIVE:             │
│    • TesterPresent (0x3E) - ALWAYS                │
│    • Session Control (0x10) - ALWAYS              │
│    • Security Access (0x27) - ALWAYS              │
│    • All diagnostic services - ALWAYS             │
│                                                    │
│  NOTES:                                           │
│    • Diagnostic messages NEVER affected by 0x28   │
│    • Only application and NM messages controlled  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### Session Compatibility Table

```
┌─────────────────────┬──────────┬───────────┬──────────────┐
│ Operation           │ DEFAULT  │ EXTENDED  │ PROGRAMMING  │
│                     │  (0x01)  │  (0x03)   │   (0x02)     │
├─────────────────────┼──────────┼───────────┼──────────────┤
│ Use SID 0x28        │    ❌    │    ✅     │     ✅       │
│ Disable normal msg  │    ❌    │    ✅     │     ✅       │
│ Disable NM msg      │    ❌    │    ✅     │     ✅       │
│ Disable all comm    │    ❌    │    ✅     │     ✅       │
│ Target subnets      │    ❌    │    ✅     │     ✅       │
│ Re-enable comm      │    ❌    │    ✅     │     ✅       │
└─────────────────────┴──────────┴───────────┴──────────────┘
```

### Session Transition Impact

```
┌────────────────────────────────────────────────────┐
│ What Happens to Communication Control on          │
│ Session Changes?                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  EXTENDED → PROGRAMMING:                          │
│    Communication control state: PRESERVED ✅       │
│                                                    │
│  PROGRAMMING → EXTENDED:                          │
│    Communication control state: PRESERVED ✅       │
│                                                    │
│  EXTENDED/PROGRAMMING → DEFAULT:                  │
│    Communication control state: RESET ❌           │
│    (Auto-restored to normal operation)            │
│                                                    │
│  DEFAULT → EXTENDED/PROGRAMMING:                  │
│    Communication control state: NORMAL (default)  │
│    (Must re-apply 0x28 if isolation needed)       │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Flash Programming with Isolation

**Purpose**: Update ECU firmware while preventing network interference

```
┌──────────────────────────────────────────────────────────┐
│ COMPLETE FLASH PROGRAMMING WORKFLOW                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tester                              ECU                │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 1: Session Setup                            │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [10 02] Programming Session     │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ ✓ Session: 0x02 │
│    │  [50 02 00 32 01 F4]             │                 │
│    │<─────────────────────────────────│                 │
│    │  (P2=50ms, P2*=5000ms)           │                 │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 2: Security Unlock                          │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [27 01] Request Seed            │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Generate seed   │
│    │  [67 01 AB CD EF 12]             │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  (Calculate key from seed)       │                 │
│    │                                  │                 │
│    │  [27 02 12 34 56 78]             │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Validate key    │
│    │  [67 02]                         │ 🔓 UNLOCKED     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 3: Isolate ECU                              │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [28 03 03] Disable All Comm     │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Set RX:❌ TX:❌ │
│    │  [68 03]                         │ (Isolated!)     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  Wait 100ms (ECU applies state)  │                 │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 4: Flash Programming                        │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [34 00 44 00 10 00 00 ...]      │                 │
│    │  Request Download                │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Prepare flash   │
│    │  [74 20 10 00]                   │                 │
│    │<─────────────────────────────────│                 │
│    │  (Max 4096 bytes per block)      │                 │
│    │                                  │                 │
│    │  Start TesterPresent (background)│                 │
│    │  [3E 80] every 2 seconds ────────────────────────  │
│    │                                  │ Keep alive      │
│    │                                  │                 │
│    │  [36 01 <256 bytes>] Block 1     │                 │
│    │─────────────────────────────────>│                 │
│    │  [76 02]                         │ Write to flash  │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [36 02 <256 bytes>] Block 2     │                 │
│    │─────────────────────────────────>│                 │
│    │  [76 03]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  ... (repeat for all blocks) ... │                 │
│    │                                  │                 │
│    │  [36 FF <remaining>] Last Block  │                 │
│    │─────────────────────────────────>│                 │
│    │  [76 00]                         │ All received    │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [37] Request Transfer Exit      │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Finalize flash  │
│    │  [77]                            │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [31 01 02 02] Check Integrity   │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 01 02 02]                   │ ✓ Flash OK      │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 5: Restore Communication                    │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [28 01 03] Enable All Comm      │                 │
│    │─────────────────────────────────>│                 │
│    │                                  │ Set RX:✅ TX:✅ │
│    │  [68 01]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │ ─────────────────────────────────────────────────  │
│    │ PHASE 6: Reset and Boot New FW                    │
│    │ ─────────────────────────────────────────────────  │
│    │                                  │                 │
│    │  [11 01] Hard Reset              │                 │
│    │─────────────────────────────────>│                 │
│    │  [51 01]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │ Rebooting...    │
│    │                                  │                 │
│    │  ... ECU restarts with new FW ...│                 │
│    │                                  │                 │
│    │                                  │ ✅ COMPLETE     │
│    │                                  │                 │
└──────────────────────────────────────────────────────────┘

Key Points:
  • Communication disabled BEFORE flash operations
  • TesterPresent runs throughout (diagnostics always work)
  • Communication restored AFTER flash complete
  • Reset restores normal operation automatically
```

---

### Workflow 2: Protected Configuration Write

**Purpose**: Write calibration data without network interference

```
┌──────────────────────────────────────────────────────────┐
│ SECURE CONFIGURATION WRITE WORKFLOW                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tester                              ECU                │
│    │                                  │                 │
│    │  [10 03] Extended Session        │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 03 00 32 01 F4]             │ ✓ Extended      │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [27 01] Request Seed (Level 1)  │                 │
│    │─────────────────────────────────>│                 │
│    │  [67 01 AA BB CC DD]             │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [27 02 KEY] Send Key            │                 │
│    │─────────────────────────────────>│                 │
│    │  [67 02]                         │ 🔓 UNLOCKED     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 00 01] Enable RX,           │                 │
│    │             Disable TX (Normal)  │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 00]                         │ RX:✅ TX:❌     │
│    │<─────────────────────────────────│ (Listen-only)   │
│    │                                  │                 │
│    │  [22 F1 90] Read VIN (verify)    │                 │
│    │─────────────────────────────────>│                 │
│    │  [62 F1 90 VIN DATA...]          │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [2E 10 A0 <config data>]        │                 │
│    │  Write Config Parameter          │                 │
│    │─────────────────────────────────>│                 │
│    │  [6E 10 A0]                      │ ✓ Written       │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [22 10 A0] Read Back (verify)   │                 │
│    │─────────────────────────────────>│                 │
│    │  [62 10 A0 <config data>]        │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  ✓ Verify data matches           │                 │
│    │                                  │                 │
│    │  [28 01 01] Re-enable Normal TX  │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 01]                         │ RX:✅ TX:✅     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [10 01] Return to Default       │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 01]                         │ ✓ Normal mode   │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
└──────────────────────────────────────────────────────────┘

Key Points:
  • RX-only mode prevents ECU from broadcasting changes
  • Write-verify pattern ensures data integrity
  • Communication fully restored before exiting
```

---

### Workflow 3: Subnet-Specific Diagnostic Testing

**Purpose**: Test one network segment while others remain active

```
┌──────────────────────────────────────────────────────────┐
│ MULTI-SUBNET TESTING WORKFLOW                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Vehicle Network:                                        │
│    Subnet 0xF0 = Powertrain CAN                          │
│    Subnet 0xF1 = Chassis CAN                             │
│    Subnet 0xF2 = Body CAN                                │
│                                                          │
│  Goal: Test Chassis ECUs without powertrain interference │
│                                                          │
│  Tester                              ECU (Chassis)       │
│    │                                  │                 │
│    │  [10 03] Extended Session        │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 03 ...]                     │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 03 03 F0 00]                │                 │
│    │  Disable Subnet 0xF0 (Powertrain)│                 │
│    │─────────────────────────────────>│                 │
│    │  [68 03]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  Current Network State:          │                 │
│    │    Subnet 0xF0: ❌ SILENT        │                 │
│    │    Subnet 0xF1: ✅ ACTIVE        │                 │
│    │    Subnet 0xF2: ✅ ACTIVE        │                 │
│    │                                  │                 │
│    │  [22 F1 A0] Read Chassis Data    │                 │
│    │─────────────────────────────────>│                 │
│    │  [62 F1 A0 ...]                  │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [31 01 F0 01] Start ABS Test    │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 01 F0 01]                   │ ✓ Test running  │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  ... Test executes without       │                 │
│    │      engine RPM interference ... │                 │
│    │                                  │                 │
│    │  [31 03 F0 01] Get Results       │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 03 F0 01 RESULTS]           │ ✓ PASS          │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 01 03 F0 00]                │                 │
│    │  Re-enable Subnet 0xF0           │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 01]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  All Subnets: ✅ ACTIVE          │                 │
│    │                                  │                 │
└──────────────────────────────────────────────────────────┘
```

---

### Workflow 4: End-of-Line Production Testing

**Purpose**: Controlled environment for production line testing

```
┌──────────────────────────────────────────────────────────┐
│ EOL PRODUCTION TEST WORKFLOW                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tester                              ECU                │
│    │                                  │                 │
│    │  [10 03] Extended Session        │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 03 ...]                     │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 03 03] Isolate Completely   │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 03]                         │ RX:❌ TX:❌     │
│    │<─────────────────────────────────│ (Isolated)      │
│    │                                  │                 │
│    │  [2E F1 90 VIN...] Write VIN     │                 │
│    │─────────────────────────────────>│                 │
│    │  [6E F1 90]                      │ ✓ VIN written   │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [2E 10 B0 SERIAL...] Write S/N  │                 │
│    │─────────────────────────────────>│                 │
│    │  [6E 10 B0]                      │ ✓ S/N written   │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [31 01 FF 00] Self-Test         │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 01 FF 00]                   │ ✓ Test started  │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  Wait for test completion...     │                 │
│    │                                  │                 │
│    │  [31 03 FF 00] Get Results       │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 03 FF 00 PASS]              │ ✅ All tests OK │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [14 FF FF FF] Clear DTCs        │                 │
│    │─────────────────────────────────>│                 │
│    │  [54]                            │ ✓ Cleared       │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 01 03] Enable Communication │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 01]                         │ RX:✅ TX:✅     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [10 01] Return to Default       │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 01]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  ECU Ready for Vehicle Assembly  │ ✅ COMPLETE     │
│    │                                  │                 │
└──────────────────────────────────────────────────────────┘
```

---

### Workflow 5: Diagnostic Routine with Network Quiet

**Purpose**: Execute sensitive diagnostic routine without CAN bus noise

```
┌──────────────────────────────────────────────────────────┐
│ NETWORK-QUIET ROUTINE EXECUTION                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tester                              ECU                │
│    │                                  │                 │
│    │  [10 03] Extended Session        │                 │
│    │─────────────────────────────────>│                 │
│    │  [50 03 ...]                     │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 00 03] Enable RX,           │                 │
│    │             Disable TX           │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 00]                         │ Listen-only     │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [31 01 02 05] Start Actuator    │                 │
│    │                Test Routine      │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 01 02 05]                   │ ✓ Started       │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  Routine runs for 5 seconds...   │                 │
│    │  ECU listens to network but      │                 │
│    │  doesn't broadcast results       │                 │
│    │                                  │                 │
│    │  [3E 80] TesterPresent           │                 │
│    │─────────────────────────────────>│                 │
│    │  [7E 80]                         │                 │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [31 03 02 05] Get Results       │                 │
│    │─────────────────────────────────>│                 │
│    │  [71 03 02 05 RESULTS...]        │ Results ready   │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
│    │  [28 01 03] Re-enable All        │                 │
│    │─────────────────────────────────>│                 │
│    │  [68 01]                         │ ✓ Normal comm   │
│    │<─────────────────────────────────│                 │
│    │                                  │                 │
└──────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Session → Security → Comm Control → Operation

```
This is the STANDARD pattern for protected operations

┌──────────────────────────────────────────────────────┐
│ STANDARD PROTECTED OPERATION PATTERN                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Step 1: Establish Session                          │
│    SID 0x10 (Session Control)                       │
│    → Enter Extended (0x03) or Programming (0x02)    │
│                                                      │
│  Step 2: Unlock Security                            │
│    SID 0x27 (Security Access)                       │
│    → Request seed, send key, get unlocked           │
│                                                      │
│  Step 3: Isolate Communication                      │
│    SID 0x28 (Communication Control)                 │
│    → Disable normal/NM messages                     │
│                                                      │
│  Step 4: Perform Protected Operation                │
│    SID 0x2E (Write Data)                            │
│    SID 0x31 (Routine Control)                       │
│    SID 0x34/36/37 (Flash Programming)               │
│                                                      │
│  Step 5: Restore Communication                      │
│    SID 0x28 again                                   │
│    → Re-enable normal/NM messages                   │
│                                                      │
│  Step 6: Return to Normal                           │
│    SID 0x10 (Return to Default) OR                  │
│    SID 0x11 (ECU Reset)                             │
│                                                      │
└──────────────────────────────────────────────────────┘

Visual Flow:
  [10 XX] → [27 XX] → [28 03 03] → [Operation] → [28 01 03] → [10 01]
  Session   Security   Isolate      Do Work      Restore      Exit
```

---

### Pattern 2: TesterPresent Integration

```
┌──────────────────────────────────────────────────────┐
│ TESTERPRESENT DURING ISOLATED OPERATIONS             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Why: Even with communication disabled, session     │
│       can timeout if no diagnostic activity         │
│                                                      │
│  Solution: Send SID 0x3E (TesterPresent) regularly  │
│                                                      │
│  Timeline:                                          │
│                                                      │
│  T=0s    [28 03 03] Disable all communication       │
│          [68 03] ✓                                  │
│                                                      │
│  T=2s    [3E 80] TesterPresent (suppress response)  │
│          (No response due to 0x80 flag)             │
│                                                      │
│  T=3s    [34 ...] Start flash download              │
│          [74 ...] ✓                                 │
│                                                      │
│  T=4s    [3E 80] TesterPresent                      │
│                                                      │
│  T=5s    [36 01 ...] Transfer block 1               │
│          [76 02] ✓                                  │
│                                                      │
│  T=6s    [3E 80] TesterPresent                      │
│                                                      │
│  T=7s    [36 02 ...] Transfer block 2               │
│          [76 03] ✓                                  │
│                                                      │
│  ...continue pattern...                             │
│                                                      │
│  Key: TesterPresent every 2s prevents timeout       │
│       Use 0x80 flag to suppress response            │
│       Diagnostics work even with comm disabled      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Pattern 3: Multi-Level Communication Control

```
┌──────────────────────────────────────────────────────┐
│ PROGRESSIVE ISOLATION PATTERN                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Use Case: Incrementally isolate network for        │
│            sensitive operations                      │
│                                                      │
│  Level 1: Disable Normal Messages Only              │
│    [28 03 01] → Only app messages disabled          │
│    Network management still active (keep-alive)     │
│    Use for: Light diagnostics, read operations      │
│                                                      │
│  Level 2: Disable All Non-Diagnostic                │
│    [28 03 03] → Both normal + NM disabled           │
│    Complete network quiet                           │
│    Use for: Flash programming, critical routines    │
│                                                      │
│  Level 3: Subnet-Specific Isolation                 │
│    [28 03 03 F0 00] → Disable subnet 0xF0           │
│    Other subnets remain active                      │
│    Use for: Testing specific network segments       │
│                                                      │
│  Restoration Path (reverse order):                  │
│    [28 01 03 F0 00] → Re-enable subnet              │
│    [28 01 03]       → Re-enable all                 │
│    [28 01 01]       → Normal messages only          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Integration with Specific Services

### SID 0x10 (Session Control) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ Session Control Integration                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Session Changes:                                 │
│                                                    │
│    DEFAULT → EXTENDED:                            │
│      • 0x28 now allowed                           │
│      • Previous comm state: N/A (was in default)  │
│                                                    │
│    EXTENDED → PROGRAMMING:                        │
│      • 0x28 state PRESERVED                       │
│      • If already isolated, stays isolated        │
│                                                    │
│    PROGRAMMING → DEFAULT (timeout):               │
│      • 0x28 state RESET                           │
│      • Communication auto-restored                │
│                                                    │
│  Best Practice:                                   │
│    Always re-apply 0x28 after session change      │
│    to ensure desired state                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x27 (Security Access) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ Security Access Integration                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Security Requirements:                           │
│    • Some ECUs require security for 0x28          │
│    • Check ECU documentation                      │
│    • Typically for safety-critical ECUs           │
│                                                    │
│  Security State Changes:                          │
│                                                    │
│    LOCKED → UNLOCKED:                             │
│      • 0x28 now allowed (if required)             │
│      • Comm state unchanged                       │
│                                                    │
│    UNLOCKED → LOCKED (session change):            │
│      • 0x28 may no longer work                    │
│      • Comm state may auto-restore                │
│                                                    │
│  Pattern:                                         │
│    [10 03] → [27 01/02] → [28 03 03]              │
│    Session   Unlock       Can now isolate         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x3E (TesterPresent) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ TesterPresent Integration                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Critical: TesterPresent ALWAYS works             │
│            even when communication disabled       │
│                                                    │
│  Usage During Isolation:                          │
│                                                    │
│    [28 03 03] Disable all                         │
│       ↓                                           │
│    Normal msgs: ❌ BLOCKED                        │
│    NM msgs:     ❌ BLOCKED                        │
│    Diagnostic:  ✅ STILL WORKS                    │
│       ↓                                           │
│    [3E 80] TesterPresent                          │
│       ↓                                           │
│    Session kept alive ✓                           │
│                                                    │
│  Recommended Timing:                              │
│    • Send every 2 seconds                         │
│    • Use 0x80 flag (suppress response)            │
│    • Continue throughout isolated operation       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x34/36/37 (Flash Programming) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ Flash Programming Integration                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Standard Sequence:                               │
│                                                    │
│  1. [10 02] Programming session                   │
│  2. [27 01/02] Security unlock                    │
│  3. [28 03 03] ISOLATE ◄── Critical!              │
│  4. [34 ...] Request download                     │
│  5. [36 ...] Transfer data (multiple blocks)      │
│  6. [37] Exit transfer                            │
│  7. [31 ...] Check programming dependencies       │
│  8. [28 01 03] RESTORE ◄── Critical!              │
│  9. [11 01] Reset ECU                             │
│                                                    │
│  Why Isolation Needed:                            │
│    • Prevents bus errors during flash write       │
│    • Reduces EMI interference                     │
│    • Ensures data integrity                       │
│    • Prevents other ECUs from interrupting        │
│                                                    │
│  Don't Forget:                                    │
│    • Send [3E 80] every 2s during transfer        │
│    • Wait 100ms after [28 03 03] before [34]      │
│    • Always restore comm before reset             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x2E (Write Data) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ Write Data Integration                             │
├────────────────────────────────────────────────────┤
│                                                    │
│  Use Case 1: Silent Configuration Write           │
│    [28 00 01] Enable RX, Disable TX (normal)      │
│    [2E ...] Write configuration                   │
│    [22 ...] Verify write                          │
│    [28 01 01] Re-enable TX                        │
│                                                    │
│  Use Case 2: Isolated VIN Write                   │
│    [28 03 03] Complete isolation                  │
│    [2E F1 90 VIN...] Write VIN                    │
│    [22 F1 90] Read back VIN                       │
│    [28 01 03] Restore communication               │
│                                                    │
│  Why Use 0x28 with 0x2E:                          │
│    • Prevent ECU from broadcasting changes        │
│    • Avoid triggering other ECU reactions         │
│    • Maintain system stability during config      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x31 (Routine Control) + SID 0x28

```
┌────────────────────────────────────────────────────┐
│ Routine Control Integration                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Pattern: Network-Quiet Routine Execution         │
│                                                    │
│  [10 03] Extended session                         │
│  [28 00 03] Enable RX, Disable TX                 │
│     │                                             │
│     ├─ ECU can read network inputs               │
│     └─ ECU won't broadcast routine status        │
│                                                    │
│  [31 01 XX XX] Start routine                      │
│     Routine runs quietly                          │
│                                                    │
│  [3E 80] Keep session alive                       │
│                                                    │
│  [31 03 XX XX] Get results                        │
│     Results retrieved via diagnostics             │
│                                                    │
│  [28 01 03] Restore communication                 │
│                                                    │
│  Use Cases:                                       │
│    • Actuator tests (no broadcast during test)    │
│    • Calibration routines (quiet execution)       │
│    • Self-diagnostics (isolated environment)      │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Troubleshooting Multi-Service Scenarios

### Problem 1: Flash Fails After Communication Disable

```
┌────────────────────────────────────────────────────┐
│ SYMPTOM: Flash programming fails with timeout or  │
│          NRC 0x78 after [28 03 03]                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Root Causes:                                     │
│                                                    │
│  1. TesterPresent Not Sent                        │
│     ├─ Session timeout occurred                   │
│     └─ Solution: Send [3E 80] every 2s            │
│                                                    │
│  2. Diagnostic CAN Also Disabled                  │
│     ├─ Tester can't communicate with ECU          │
│     └─ Solution: Only disable normal/NM,          │
│        keep diagnostic CAN active                 │
│                                                    │
│  3. Timing Issue                                  │
│     ├─ Started flash too quickly after [28]       │
│     └─ Solution: Wait 100ms after comm control    │
│                                                    │
│  4. Power Supply Issue                            │
│     ├─ Voltage dropped during isolation           │
│     └─ Solution: Ensure stable external power     │
│                                                    │
│  Debug Steps:                                     │
│    □ Verify [68 03] response received             │
│    □ Check TesterPresent is running (2s interval) │
│    □ Monitor diagnostic CAN (should be active)    │
│    │ Add 100ms delay after [28 03 03]             │
│    □ Check ECU power supply voltage               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 2: Security Works But Operation Fails

```
┌────────────────────────────────────────────────────┐
│ SYMPTOM: Security unlocked successfully, but      │
│          operation (write/routine) fails with NRC │
├────────────────────────────────────────────────────┤
│                                                    │
│  Scenario:                                        │
│    [27 02] → [67 02] ✓ Unlocked                   │
│    [28 03 03] → [68 03] ✓ Isolated                │
│    [2E ...] → [7F 2E 33] ❌ Security Denied       │
│                                                    │
│  Root Causes:                                     │
│                                                    │
│  1. Wrong Security Level                          │
│     ├─ Unlocked Level 1, need Level 3             │
│     └─ Solution: Check DID security requirements  │
│        Unlock correct level                       │
│                                                    │
│  2. Security Timeout                              │
│     ├─ Too much time between unlock and operation │
│     └─ Solution: Reduce delay, send [3E 80]       │
│                                                    │
│  3. Session Changed                               │
│     ├─ Session timeout reset security             │
│     └─ Solution: Keep session alive with [3E]     │
│                                                    │
│  4. Conditions Not Met                            │
│     ├─ Vehicle in motion, engine running, etc.    │
│     └─ Solution: Check ECU preconditions          │
│                                                    │
│  Debug Sequence:                                  │
│    [10 03] Extended                               │
│    [27 01] → [67 01 SEED]                         │
│    [27 02 KEY] → [67 02] ✓ Unlocked               │
│    [3E 80] Keep alive (immediate)                 │
│    [28 03 03] → [68 03]                           │
│    [2E ...] Try operation immediately             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 3: Communication Won't Restore

```
┌────────────────────────────────────────────────────┐
│ SYMPTOM: Sent [28 01 03] but communication        │
│          doesn't restore                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Check 1: Response Code                           │
│    ├─ [68 01] = Success (wait for ECU to apply)   │
│    └─ [7F 28 XX] = Failed (check NRC)             │
│                                                    │
│  Check 2: Session State                           │
│    ├─ [22 F1 86] Read active session              │
│    ├─ If DEFAULT: Session timed out               │
│    └─ Solution: Re-enter Extended [10 03]         │
│                                                    │
│  Check 3: Security State                          │
│    ├─ Some ECUs need security for re-enable       │
│    └─ Solution: Re-unlock [27 01/02]              │
│                                                    │
│  Check 4: Subnet Mismatch                         │
│    ├─ Disabled with [28 03 03 F0 00]              │
│    ├─ Tried to enable with [28 01 03] (no Node ID)│
│    └─ Solution: Match Node ID in both commands    │
│        [28 01 03 F0 00]                           │
│                                                    │
│  Last Resort: ECU Reset                           │
│    [11 01] Hard reset                             │
│    └─ Automatically restores all communication    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 4: Routine Execution Interrupted

```
┌────────────────────────────────────────────────────┐
│ SYMPTOM: Started routine with [31 01], but        │
│          execution interrupted or times out       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Scenario:                                        │
│    [28 00 03] RX only, TX disabled                │
│    [31 01 XX XX] Start routine                    │
│    [71 01 XX XX] Started OK                       │
│    ... wait for completion ...                    │
│    [31 03 XX XX] Get results                      │
│    [7F 31 24] ❌ Request Sequence Error           │
│                                                    │
│  Root Causes:                                     │
│                                                    │
│  1. Session Timeout                               │
│     ├─ Routine took > S3_Server time              │
│     ├─ No TesterPresent sent during execution     │
│     └─ Solution: Send [3E 80] every 2s            │
│                                                    │
│  2. Wrong Communication Type                      │
│     ├─ Routine needs to send status updates       │
│     ├─ TX disabled blocks internal messaging      │
│     └─ Solution: Use [28 01 03] (enable both)     │
│        or [28 00 01] (allow NM messages)          │
│                                                    │
│  3. External Interference                         │
│     ├─ Other ECUs sent conflicting commands       │
│     └─ Solution: Use [28 03 03] (complete isolate)│
│                                                    │
│  Correct Pattern:                                 │
│    [10 03] Extended                               │
│    [28 00 03] OR [28 03 03] depending on routine  │
│    [31 01 XX XX] Start                            │
│    Loop:                                          │
│      [3E 80] every 2 seconds                      │
│      Check if routine complete                    │
│    [31 03 XX XX] Get results                      │
│    [28 01 03] Restore                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Service Combination Matrix

```
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Primary   │ SID 0x10│ SID 0x27│ SID 0x3E│ SID 0x11│ Notes   │
│ Service   │ Session │ Security│ Tester  │ Reset   │         │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ SID 0x28  │Required │Optional │Required │Optional │         │
│ Comm Ctrl │(Ext/Prog)│(If ECU  │(During  │(Restore)│         │
│           │         │requires)│ long op)│         │         │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ + 0x34/36 │Prog     │Required │Required │After    │Flash    │
│ Flash     │Session  │Usually  │Every 2s │flash    │         │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ + 0x2E    │Extended │Often    │If slow  │Optional │Config   │
│ Write     │or Prog  │Required │write    │         │Write    │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ + 0x31    │Extended │Sometimes│If long  │Optional │Routine  │
│ Routine   │         │Required │routine  │         │         │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ + 0x22    │Any      │Rarely   │No       │No       │Read     │
│ Read      │         │         │         │         │(Simple) │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Communication State by Service

```
┌──────────────────┬───────────┬───────────┬─────────────────┐
│ Service          │ Normal TX │ NM TX     │ Diagnostic TX   │
├──────────────────┼───────────┼───────────┼─────────────────┤
│ After [28 00 01] │ DISABLED  │ ENABLED   │ ENABLED         │
│ After [28 00 03] │ DISABLED  │ DISABLED  │ ENABLED         │
│ After [28 01 01] │ ENABLED   │ ENABLED   │ ENABLED         │
│ After [28 01 03] │ ENABLED   │ ENABLED   │ ENABLED         │
│ After [28 03 01] │ DISABLED  │ ENABLED   │ ENABLED         │
│ After [28 03 03] │ DISABLED  │ DISABLED  │ ENABLED         │
│ After [11 01]    │ ENABLED   │ ENABLED   │ ENABLED (reset) │
│ Session Timeout  │ ENABLED   │ ENABLED   │ ENABLED (reset) │
└──────────────────┴───────────┴───────────┴─────────────────┘
```

### Common Workflow Quick Reference

```
┌────────────────────┬─────────────────────────────────────┐
│ Use Case           │ Command Sequence                    │
├────────────────────┼─────────────────────────────────────┤
│ Flash Programming  │ [10 02][27 01/02][28 03 03]         │
│                    │ [34][36...][37][31][28 01 03][11 01]│
├────────────────────┼─────────────────────────────────────┤
│ Secure Config Write│ [10 03][27 01/02][28 00 01]         │
│                    │ [2E ...][22 verify][28 01 01]       │
├────────────────────┼─────────────────────────────────────┤
│ Quiet Routine      │ [10 03][28 00 03][31 01...][3E 80]  │
│                    │ [31 03...][28 01 03]                │
├────────────────────┼─────────────────────────────────────┤
│ Subnet Testing     │ [10 03][28 03 03 XX XX]             │
│                    │ [tests...][28 01 03 XX XX]          │
├────────────────────┼─────────────────────────────────────┤
│ EOL Production     │ [10 03][28 03 03][2E VIN][2E S/N]   │
│                    │ [31 test][14 clear][28 01 03][10 01]│
└────────────────────┴─────────────────────────────────────┘
```

### NRC Occurrence by Service Combination

```
┌──────┬─────────────────────────────────────────────────┐
│ NRC  │ Most Common With                                │
├──────┼─────────────────────────────────────────────────┤
│ 0x12 │ Invalid control type (0x06+)                    │
│      │ Enhanced addressing not supported               │
├──────┼─────────────────────────────────────────────────┤
│ 0x13 │ Wrong length (2 bytes, 4 bytes, 6+ bytes)       │
│      │ Incomplete Node ID                              │
├──────┼─────────────────────────────────────────────────┤
│ 0x22 │ + SID 0x34 (vehicle in motion)                  │
│      │ + SID 0x31 (wrong preconditions)                │
├──────┼─────────────────────────────────────────────────┤
│ 0x31 │ Invalid comm type (0x00, 0x04+)                 │
├──────┼─────────────────────────────────────────────────┤
│ 0x33 │ + SID 0x2E (VIN write requires security)        │
│      │ + SID 0x34 (flash requires security)            │
├──────┼─────────────────────────────────────────────────┤
│ 0x7F │ Tried in DEFAULT session                        │
│      │ Session timeout occurred                        │
└──────┴─────────────────────────────────────────────────┘
```

---

**End of SID 0x28 Service Interactions Guide**

**Document Series**:
- Theory: [SID_28_COMMUNICATION_CONTROL.md](./SID_28_COMMUNICATION_CONTROL.md)
- Implementation: [SID_28_PRACTICAL_IMPLEMENTATION.md](./SID_28_PRACTICAL_IMPLEMENTATION.md)
- **You are here**: Service Interactions

**Related Services**:
- SID 0x10 (Session Control): [SID_10_DIAGNOSTIC_SESSION_CONTROL.md](./SID_10_DIAGNOSTIC_SESSION_CONTROL.md)
- SID 0x27 (Security Access): [SID_27_SECURITY_ACCESS.md](./SID_27_SECURITY_ACCESS.md)
- SID 0x3E (TesterPresent): Check main documentation
- SID 0x2E (Write Data): [SID_46_WRITE_DATA_BY_IDENTIFIER.md](./SID_46_WRITE_DATA_BY_IDENTIFIER.md)
