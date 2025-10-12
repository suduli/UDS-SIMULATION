# SID 0x27: Security Access - Service Interactions Guide

**Version:** 2.0  
**Last Updated:** October 12, 2025  
**Compliance:** ISO 14229-1:2020 Section 9.3  
**Format:** Visual diagrams only - NO programming code

---

## 📋 Table of Contents

1. [Service Dependency Pyramid](#service-dependency-pyramid)
2. [Multi-Service Workflow 1: Basic Configuration Write](#multi-service-workflow-1-basic-configuration-write)
3. [Multi-Service Workflow 2: Protected Routine Execution](#multi-service-workflow-2-protected-routine-execution)
4. [Multi-Service Workflow 3: Software Download](#multi-service-workflow-3-software-download)
5. [Multi-Service Workflow 4: DTC Management](#multi-service-workflow-4-dtc-management)
6. [Multi-Service Workflow 5: VIN Programming](#multi-service-workflow-5-vin-programming)
7. [Integration Patterns](#integration-patterns)
8. [Troubleshooting Multi-Service Scenarios](#troubleshooting-multi-service-scenarios)

---

## Service Dependency Pyramid

### Security Access Dependencies

```
                         ┌─────────────────────┐
                         │  PROTECTED SERVICES │
                         │  (Require Security) │
                         └──────────┬──────────┘
                                    │
                                    │ Depends On
                                    ▼
                         ┌─────────────────────┐
                         │   SECURITY ACCESS   │
                         │     (SID 0x27)      │
                         └──────────┬──────────┘
                                    │
                                    │ Depends On
                                    ▼
                         ┌─────────────────────┐
                         │  SESSION CONTROL    │
                         │     (SID 0x10)      │
                         └──────────┬──────────┘
                                    │
                                    │ Foundation
                                    ▼
                         ┌─────────────────────┐
                         │  PHYSICAL LAYER     │
                         │  (CAN/DoIP/etc.)    │
                         └─────────────────────┘
```

### Protected Services Overview

```
┌────────────────────────────────────────────────────────────────┐
│              SERVICES REQUIRING SECURITY ACCESS                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x2E: WriteDataByIdentifier (Protected DIDs)        │  │
│  │ • Security Level: 1-3 depending on DID                  │  │
│  │ • Common Protected DIDs:                                │  │
│  │   - 0xF18C: ECU Serial Number (OTP)                     │  │
│  │   - 0xF190: VIN                                         │  │
│  │   - 0xF198: System Supplier ID                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x31: RoutineControl (Protected Routines)           │  │
│  │ • Security Level: 1-3 depending on routine              │  │
│  │ • Common Protected Routines:                            │  │
│  │   - 0xFF00: Erase Memory                                │  │
│  │   - 0xFF01: Check Programming Dependencies              │  │
│  │   - 0x0203: Check Programming Preconditions             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x34: RequestDownload (Software Updates)            │  │
│  │ • Security Level: 2 (Programming Session)               │  │
│  │ • Required for flashing ECU firmware                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x35: RequestUpload (Data Extraction)               │  │
│  │ • Security Level: 2-3                                   │  │
│  │ • Extract calibration data or logs                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x14: ClearDiagnosticInformation (Protected)        │  │
│  │ • Security Level: 1 (Extended Session)                  │  │
│  │ • Clear specific DTC groups                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SID 0x85: ControlDTCSetting (Disable/Enable)            │  │
│  │ • Security Level: 1                                     │  │
│  │ • Disable DTC setting during testing                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Workflow 1: Basic Configuration Write

### Scenario: Update ECU Configuration Parameter

```
Objective: Write to protected DID 0xF190 (VIN) in Extended Session

Tester                                                        ECU
  │                                                            │
  │ ═══════════════ PHASE 1: SESSION SETUP ══════════════════ │
  │                                                            │
  │  Step 1: Switch to Extended Diagnostic Session            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x03]                                             │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x03] [00] [32] [01] [F4]                         │
  │  (P2=50ms, P2*=500ms)                                      │
  │                                                            │
  │ ════════════════ PHASE 2: SECURITY UNLOCK ════════════════ │
  │                                                            │
  │  Step 2: Request Seed (Level 1)                            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x01]                                             │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x01] [12] [34] [56] [78]                         │
  │  Seed = 0x12345678                                         │
  │                                                            │
  │  ┌──────────────────────────────────────┐                 │
  │  │ Tester calculates:                    │                 │
  │  │ Key = Crypto(0x12345678, Secret)     │                 │
  │  │     = 0xABCDEF01                     │                 │
  │  └──────────────────────────────────────┘                 │
  │                                                            │
  │  Step 3: Send Key (Level 1)                                │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x02] [AB] [CD] [EF] [01]                         │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x02]                                             │
  │  ✅ Security Level 1 UNLOCKED                              │
  │                                                            │
  │ ═══════════════ PHASE 3: WRITE OPERATION ════════════════ │
  │                                                            │
  │  Step 4: Write VIN via WriteDataByIdentifier               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x2E] [0xF1] [0x90] [VIN_17_BYTES...]                    │
  │  DID 0xF190 = VIN (Vehicle Identification Number)          │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x6E] [0xF1] [0x90]                                      │
  │  ✅ VIN Written Successfully                               │
  │                                                            │
  │ ═════════════════ PHASE 4: KEEP ALIVE ═══════════════════ │
  │                                                            │
  │  Step 5: Send TesterPresent (every 2-4 seconds)            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x3E] [0x00]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x7E] [0x00]                                             │
  │  (Keeps session & security alive)                          │
  │                                                            │
  │ ══════════════════ PHASE 5: CLEANUP ═════════════════════ │
  │                                                            │
  │  Step 6: ECU Reset (Optional - persist changes)            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x11] [0x01]  (Hard Reset)                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x51] [0x01]                                             │
  │                                                            │
  │  ECU Reboots, VIN now permanent                            │
  │                                                            │
```

### Timing Diagram

```
Time    Tester Action              ECU State
─────   ────────────────────────   ──────────────────────────────
0:00    Session Change (0x10)      Default → Extended
        ↓
0:01    Request Seed (0x27 0x01)   State: LOCKED
        ↓                          Generate seed
0:02    Receive Seed               State: SEED_REQUESTED
        Calculate Key
        ↓
0:03    Send Key (0x27 0x02)       Validate key
        ↓                          State: UNLOCKED ✅
0:04    Write VIN (0x2E)           Check security: OK
        ↓                          Write to EEPROM
0:05    Receive Confirmation       Write complete
        ↓
0:07    TesterPresent (0x3E)       Reset S3 timer
        ↓
0:11    TesterPresent (0x3E)       Reset S3 timer
        ↓
0:15    ECU Reset (0x11)           Reboot
        ↓
0:18    ECU Ready                  State: Default, LOCKED
```

---

## Multi-Service Workflow 2: Protected Routine Execution

### Scenario: Erase Memory Before Programming

```
Objective: Execute protected routine "Erase Memory" (0xFF00)

Tester                                                        ECU
  │                                                            │
  │ ══════════ PHASE 1: SESSION + SECURITY SETUP ════════════ │
  │                                                            │
  │  Step 1: Programming Session                               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x02]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x02] [00] [32] [01] [F4]                         │
  │                                                            │
  │  Step 2: Security Unlock (Level 2 for Programming)         │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x03]  (Request Level 2 Seed)                     │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x03] [SEED]                                      │
  │                                                            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x04] [KEY]  (Send Level 2 Key)                   │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x04]  ✅ Level 2 UNLOCKED                        │
  │                                                            │
  │ ═════════════ PHASE 2: PRE-ERASE CHECKS ═════════════════ │
  │                                                            │
  │  Step 3: Check Programming Preconditions                   │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0x02] [0x03]                               │
  │  (Start Routine 0x0203)                                    │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0x02] [0x03] [00]                          │
  │  Status: 0x00 = All conditions OK                          │
  │                                                            │
  │ ══════════════ PHASE 3: MEMORY ERASE ════════════════════ │
  │                                                            │
  │  Step 4: Start Erase Memory Routine                        │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0xFF] [0x00]                               │
  │  (Start Routine 0xFF00 - Erase Memory)                     │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0xFF] [0x00]                               │
  │  Erase started...                                          │
  │                                                            │
  │  ⏳ Erase in Progress (may take 10-30 seconds)             │
  │                                                            │
  │  Step 5: Poll Routine Status                               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x03] [0xFF] [0x00]                               │
  │  (Request Routine Results)                                 │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x03] [0xFF] [0x00] [0x01]                        │
  │  Status: 0x01 = In Progress                                │
  │                                                            │
  │  ⏳ Wait 5 seconds...                                      │
  │                                                            │
  │  Step 6: Poll Again                                        │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x03] [0xFF] [0x00]                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x03] [0xFF] [0x00] [0x00]                        │
  │  Status: 0x00 = Complete ✅                                │
  │                                                            │
  │ ══════════ PHASE 4: PROCEED WITH PROGRAMMING ════════════ │
  │                                                            │
  │  Step 7: Request Download (now safe to write)              │
  ├───────────────────────────────────────────────────────────>│
  │  [0x34] [Format] [Address] [Size]                          │
  │<───────────────────────────────────────────────────────────┤
  │  [0x74] [BlockSize]                                        │
  │                                                            │
  │  Continue with TransferData (0x36)...                      │
  │                                                            │
```

### Error Handling in Routine Flow

```
┌────────────────────────────────────────────────────────────────┐
│         ERROR SCENARIO: Preconditions Not Met                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tester → ECU: [0x31] [0x01] [0x02] [0x03]                      │
│                (Check Programming Preconditions)                │
│                                                                 │
│  ECU → Tester: [0x71] [0x01] [0x02] [0x03] [0x02]               │
│                Status: 0x02 = Voltage too low                   │
│                                                                 │
│  Decision Tree:                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │ Status != 0x00 (Not OK)                  │                  │
│  │         │                                │                  │
│  │         ▼                                │                  │
│  │  ┌─────────────────┐                     │                  │
│  │  │ DO NOT PROCEED  │                     │                  │
│  │  │ with Erase!     │                     │                  │
│  │  └─────────┬───────┘                     │                  │
│  │            │                             │                  │
│  │            ▼                             │                  │
│  │  ┌─────────────────┐                     │                  │
│  │  │ Fix conditions: │                     │                  │
│  │  │ • Stabilize 12V │                     │                  │
│  │  │ • Check engine  │                     │                  │
│  │  │   off           │                     │                  │
│  │  └─────────┬───────┘                     │                  │
│  │            │                             │                  │
│  │            ▼                             │                  │
│  │  Retry precondition check                │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Workflow 3: Software Download

### Complete Flash Programming Sequence

```
Tester                                                        ECU
  │                                                            │
  │ ═══════════════ PHASE 1: PREPARATION ════════════════════ │
  │                                                            │
  │  Step 1: Programming Session                               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x02]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x02] [P2] [P2*]                                  │
  │                                                            │
  │  Step 2: Unlock Security Level 2                           │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x03] → [0x67] [0x03] [SEED]                      │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x04] [KEY] → [0x67] [0x04] ✅                    │
  │                                                            │
  │  Step 3: Disable DTC Setting (Prevent false codes)         │
  ├───────────────────────────────────────────────────────────>│
  │  [0x85] [0x02]  (DTCSettingOff)                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0xC5] [0x02]  ✅ DTC setting disabled                    │
  │                                                            │
  │ ════════════ PHASE 2: PRECONDITION CHECKS ═══════════════ │
  │                                                            │
  │  Step 4: Check Programming Dependencies                    │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0xFF] [0x01]                               │
  │  (Routine 0xFF01)                                          │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0xFF] [0x01] [0x00]  ✅ OK                 │
  │                                                            │
  │  Step 5: Check Programming Preconditions                   │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0x02] [0x03]                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0x02] [0x03] [0x00]  ✅ OK                 │
  │                                                            │
  │ ═══════════════ PHASE 3: MEMORY ERASE ═══════════════════ │
  │                                                            │
  │  Step 6: Erase Flash Memory                                │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0xFF] [0x00]                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0xFF] [0x00]  Started...                   │
  │                                                            │
  │  ⏳ Wait for erase (polling)                               │
  │                                                            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x03] [0xFF] [0x00]  (Check status)               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x03] [0xFF] [0x00] [0x00]  ✅ Complete           │
  │                                                            │
  │ ══════════════ PHASE 4: DOWNLOAD SETUP ══════════════════ │
  │                                                            │
  │  Step 7: Request Download                                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x34] [0x00] [0x44]                                      │
  │        [Address: 0x00100000]                               │
  │        [Size: 0x00080000] (512 KB)                         │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x74] [0x20] [0x10] [0x00]                               │
  │  Max Block Length = 4096 bytes                             │
  │                                                            │
  │ ═══════════════ PHASE 5: DATA TRANSFER ══════════════════ │
  │                                                            │
  │  Step 8: Transfer Data Blocks                              │
  │                                                            │
  │  Block 1:                                                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x36] [0x01] [DATA_4096_BYTES...]                        │
  │<───────────────────────────────────────────────────────────┤
  │  [0x76] [0x01]  ✅                                         │
  │                                                            │
  │  Block 2:                                                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x36] [0x02] [DATA_4096_BYTES...]                        │
  │<───────────────────────────────────────────────────────────┤
  │  [0x76] [0x02]  ✅                                         │
  │                                                            │
  │  ... (Blocks 3-128 for 512 KB) ...                         │
  │                                                            │
  │  Block 128:                                                │
  ├───────────────────────────────────────────────────────────>│
  │  [0x36] [0x80] [DATA_4096_BYTES...]                        │
  │<───────────────────────────────────────────────────────────┤
  │  [0x76] [0x80]  ✅                                         │
  │                                                            │
  │ ══════════════ PHASE 6: EXIT TRANSFER ═══════════════════ │
  │                                                            │
  │  Step 9: Request Transfer Exit                             │
  ├───────────────────────────────────────────────────────────>│
  │  [0x37]                                                    │
  │<───────────────────────────────────────────────────────────┤
  │  [0x77]  ✅ Transfer complete                              │
  │                                                            │
  │ ════════════ PHASE 7: POST-PROGRAMMING ══════════════════ │
  │                                                            │
  │  Step 10: Check Programming Integrity                      │
  ├───────────────────────────────────────────────────────────>│
  │  [0x31] [0x01] [0x02] [0x02]  (Routine 0x0202)             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x71] [0x01] [0x02] [0x02] [0x00]  ✅ Integrity OK       │
  │                                                            │
  │  Step 11: Re-enable DTC Setting                            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x85] [0x01]  (DTCSettingOn)                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0xC5] [0x01]  ✅ DTC setting enabled                     │
  │                                                            │
  │  Step 12: ECU Reset to Activate New Software               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x11] [0x01]  (Hard Reset)                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x51] [0x01]                                             │
  │                                                            │
  │  ECU Reboots with new firmware                             │
  │                                                            │
```

### Security Loss During Download (Error Case)

```
┌────────────────────────────────────────────────────────────────┐
│      ERROR: Security Lost During Transfer                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scenario: S3 timeout during long transfer                     │
│                                                                 │
│  Time 0:00 - Transfer Block 50                                  │
│  Tester → ECU: [0x36] [0x32] [DATA]                             │
│  ECU → Tester: [0x76] [0x32]  ✅                                │
│                                                                 │
│  Time 0:00 to 0:10 - Processing block (slow transfer)           │
│  (No TesterPresent sent, S3 timeout = 5 seconds)                │
│                                                                 │
│  Time 0:10 - Try next block                                     │
│  Tester → ECU: [0x36] [0x33] [DATA]                             │
│  ECU → Tester: [0x7F] [0x36] [0x7F]                             │
│                ❌ Session timeout!                              │
│                                                                 │
│  Recovery Procedure:                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Abort current download                                │  │
│  │ 2. Re-enter Programming Session (0x10 0x02)              │  │
│  │ 3. Re-unlock Security Level 2 (0x27 0x03/0x04)           │  │
│  │ 4. Re-erase memory (0x31 0xFF00)                         │  │
│  │ 5. Restart download from beginning                       │  │
│  │                                                          │  │
│  │ Prevention:                                              │  │
│  │ • Send TesterPresent every 2-3 seconds during transfer   │  │
│  │ • Use suppressPosRspMsgIndicationBit (0x3E 0x80)         │  │
│  │   to avoid response overhead                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Workflow 4: DTC Management

### Scenario: Clear Protected DTCs

```
Objective: Clear DTC group 0xFFFFFF (All DTCs) in Extended Session

Tester                                                        ECU
  │                                                            │
  │  Step 1: Extended Session                                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x03]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x03] [P2] [P2*]                                  │
  │                                                            │
  │  Step 2: Unlock Security Level 1                           │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x01] → [0x67] [0x01] [SEED]                      │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x02] [KEY] → [0x67] [0x02] ✅                    │
  │                                                            │
  │  Step 3: Read DTCs Before Clear (Optional)                 │
  ├───────────────────────────────────────────────────────────>│
  │  [0x19] [0x02] [0xFF]  (Report DTC by Status Mask)         │
  │<───────────────────────────────────────────────────────────┤
  │  [0x59] [0x02] [Status] [DTC1] [DTC2] ... [DTCn]           │
  │                                                            │
  │  Step 4: Clear All DTCs                                    │
  ├───────────────────────────────────────────────────────────>│
  │  [0x14] [0xFF] [0xFF] [0xFF]                               │
  │  (Group of DTC = 0xFFFFFF = All)                           │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x54]  ✅ DTCs Cleared                                   │
  │                                                            │
  │  Step 5: Verify DTCs Cleared                               │
  ├───────────────────────────────────────────────────────────>│
  │  [0x19] [0x02] [0xFF]                                      │
  │<───────────────────────────────────────────────────────────┤
  │  [0x59] [0x02] [0x00]  (No DTCs present)                   │
  │                                                            │
```

### Without Security (Fails)

```
┌────────────────────────────────────────────────────────────────┐
│       COMPARISON: Clear DTCs Without Security                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tester → ECU: [0x10] [0x03]  (Extended Session)                │
│  ECU → Tester: [0x50] [0x03]                                    │
│                                                                 │
│  Tester → ECU: [0x14] [0xFF] [0xFF] [0xFF]  (Clear All DTCs)    │
│  ECU → Tester: [0x7F] [0x14] [0x33]                             │
│                ❌ NRC 0x33 (Security Access Denied)             │
│                                                                 │
│  Why Fails:                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DTC Clear (0x14) for all groups requires security        │  │
│  │ Must unlock Level 1 first                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Workflow 5: VIN Programming

### One-Time Programmable (OTP) Write

```
Objective: Write VIN (DID 0xF190) - Can only be written once!

Tester                                                        ECU
  │                                                            │
  │  Step 1: Read Current VIN Status                           │
  ├───────────────────────────────────────────────────────────>│
  │  [0x22] [0xF1] [0x90]  (ReadDataByIdentifier)              │
  │<───────────────────────────────────────────────────────────┤
  │  [0x62] [0xF1] [0x90] [0x00] [0x00] ... [0x00]             │
  │  VIN = All zeros (not yet programmed) ✅                   │
  │                                                            │
  │  Step 2: Extended Session                                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x03]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x03]                                             │
  │                                                            │
  │  Step 3: Unlock Security Level 3 (High Security for OTP)   │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x05]  (Request Level 3 Seed)                     │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x05] [SEED]                                      │
  │                                                            │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x06] [KEY]  (Send Level 3 Key)                   │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x06]  ✅ Level 3 UNLOCKED                        │
  │                                                            │
  │  Step 4: Write VIN (ONE TIME ONLY!)                        │
  ├───────────────────────────────────────────────────────────>│
  │  [0x2E] [0xF1] [0x90]                                      │
  │        [V][I][N][1][2][3][4][5][6][7][8][9][0][A][B][C][D] │
  │        (17 ASCII characters)                               │
  │                                                            │
  │<───────────────────────────────────────────────────────────┤
  │  [0x6E] [0xF1] [0x90]  ✅ VIN Written (PERMANENT!)         │
  │                                                            │
  │  Step 5: Verify VIN                                        │
  ├───────────────────────────────────────────────────────────>│
  │  [0x22] [0xF1] [0x90]                                      │
  │<───────────────────────────────────────────────────────────┤
  │  [0x62] [0xF1] [0x90] [V][I][N][1][2]...[C][D]             │
  │  ✅ VIN Confirmed                                          │
  │                                                            │
  │  Step 6: Attempt Second Write (WILL FAIL)                  │
  ├───────────────────────────────────────────────────────────>│
  │  [0x2E] [0xF1] [0x90] [NEW_VIN...]                         │
  │<───────────────────────────────────────────────────────────┤
  │  [0x7F] [0x2E] [0x72]                                      │
  │  ❌ NRC 0x72 (General Programming Failure)                 │
  │  VIN locked, cannot be changed!                            │
  │                                                            │
```

### Security Level Comparison for VIN

```
┌────────────────────────────────────────────────────────────────┐
│        SECURITY LEVEL REQUIREMENTS FOR VIN OPERATIONS           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┬─────────────────┬────────────────────┐   │
│  │ Operation        │ Security Level  │ Session Required   │   │
│  ├──────────────────┼─────────────────┼────────────────────┤   │
│  │ Read VIN         │ None (Public)   │ Default OK         │   │
│  │ (SID 0x22)       │                 │                    │   │
│  ├──────────────────┼─────────────────┼────────────────────┤   │
│  │ Write VIN        │ Level 3         │ Extended or        │   │
│  │ (First Time)     │ (High Security) │ Programming        │   │
│  │ (SID 0x2E)       │                 │                    │   │
│  ├──────────────────┼─────────────────┼────────────────────┤   │
│  │ Write VIN        │ ❌ IMPOSSIBLE   │ N/A                │   │
│  │ (Second Time)    │ (Hardware Lock) │                    │   │
│  └──────────────────┴─────────────────┴────────────────────┘   │
│                                                                 │
│  VIN Write Flow:                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Initial State: VIN = 0x00 00 00 ... (blank)             │  │
│  │        │                                                 │  │
│  │        ▼                                                 │  │
│  │  Write VIN with Level 3 Security                         │  │
│  │        │                                                 │  │
│  │        ▼                                                 │  │
│  │  OTP Bit Set: LOCKED FOREVER                             │  │
│  │        │                                                 │  │
│  │        ▼                                                 │  │
│  │  Future writes: NRC 0x72 (Programming Failure)           │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Session + Security + Operation

```
┌────────────────────────────────────────────────────────────────┐
│              STANDARD INTEGRATION PATTERN                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This pattern applies to most protected operations              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 1: Switch Session                                   │  │
│  │ [0x10] [Session_Type]                                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 2: Unlock Security                                  │  │
│  │ [0x27] [Level_Seed_Request]                              │  │
│  │ [0x27] [Level_Key_Send]                                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 3: Perform Protected Operation                      │  │
│  │ [Service_SID] [Parameters...]                            │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 4: Maintain Session (Optional)                      │  │
│  │ [0x3E] [0x00] - TesterPresent                            │  │
│  │ Repeat every 2-4 seconds                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Multi-Level Security

```
┌────────────────────────────────────────────────────────────────┐
│           MULTIPLE SECURITY LEVELS IN ONE SESSION               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Some ECUs support multiple independent security levels         │
│                                                                 │
│  Session: Programming (0x02)                                    │
│      │                                                          │
│      ├─► Unlock Level 1 (0x27 0x01/0x02)                        │
│      │   • Can write public protected DIDs                      │
│      │                                                          │
│      ├─► Unlock Level 2 (0x27 0x03/0x04)                        │
│      │   • Can erase memory                                     │
│      │   • Can download software                                │
│      │   • Level 1 still active                                 │
│      │                                                          │
│      └─► Unlock Level 3 (0x27 0x05/0x06)                        │
│          • Can write OTP data (VIN, Serial Number)              │
│          • Level 1 & 2 still active                             │
│                                                                 │
│  All levels remain unlocked simultaneously until:               │
│  • Session change                                               │
│  • S3 timeout                                                   │
│  • ECU reset                                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 3: TesterPresent Integration

```
┌────────────────────────────────────────────────────────────────┐
│         TESTER PRESENT KEEPS SESSION & SECURITY ALIVE           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Timing Requirement: Send before S3 timeout (typically 5s)      │
│                                                                 │
│  Option A: With Response (Standard)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tester → ECU: [0x3E] [0x00]                              │  │
│  │ ECU → Tester: [0x7E] [0x00]                              │  │
│  │                                                          │  │
│  │ Overhead: 2 messages per cycle                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Option B: Suppress Response (Efficient)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tester → ECU: [0x3E] [0x80]                              │  │
│  │ (0x80 = suppressPosRspMsgIndicationBit)                  │  │
│  │ ECU: No response, timer reset silently                   │  │
│  │                                                          │  │
│  │ Overhead: 1 message per cycle (50% reduction)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Usage During Long Operations:                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Time 0:00 - Start RequestDownload                       │  │
│  │  Time 0:02 - TesterPresent (0x3E 0x80)                   │  │
│  │  Time 0:04 - TesterPresent (0x3E 0x80)                   │  │
│  │  Time 0:05 - TransferData Block 1                        │  │
│  │  Time 0:07 - TesterPresent (0x3E 0x80)                   │  │
│  │  Time 0:09 - TesterPresent (0x3E 0x80)                   │  │
│  │  Time 0:10 - TransferData Block 2                        │  │
│  │  ...                                                     │  │
│  │                                                          │  │
│  │  Every 2-3 seconds ensures no timeout                    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Multi-Service Scenarios

### Issue 1: Security Access Works, But Protected Service Fails

```
┌────────────────────────────────────────────────────────────────┐
│ SYMPTOM: NRC 0x33 on Protected Service Despite Unlock          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Successful Unlock:                                             │
│  [0x27] [0x01] → [0x67] [0x01] [SEED]  ✅                       │
│  [0x27] [0x02] [KEY] → [0x67] [0x02]  ✅                        │
│                                                                 │
│  Protected Operation:                                           │
│  [0x2E] [0xF1] [0x90] [DATA] → [0x7F] [0x2E] [0x33]  ❌         │
│  NRC 0x33 = Security Access Denied                              │
│                                                                 │
│  Root Causes:                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Wrong security level unlocked                         │  │
│  │    → DID 0xF190 needs Level 3, but only Level 1 unlocked│  │
│  │    → Fix: Unlock correct level (0x27 0x05/0x06)         │  │
│  │                                                          │  │
│  │ 2. Security timeout between unlock and operation         │  │
│  │    → S3 expired (> 5 seconds delay)                      │  │
│  │    → Fix: Send TesterPresent or retry unlock            │  │
│  │                                                          │  │
│  │ 3. Wrong session for security level                      │  │
│  │    → Level 2 requires Programming session                │  │
│  │    → Fix: Switch to correct session first               │  │
│  │                                                          │  │
│  │ 4. DID not protected by unlocked level                   │  │
│  │    → DID requires Level 2, Level 1 is unlocked           │  │
│  │    → Fix: Check DID security requirements in spec       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Issue 2: Download Interrupted

```
┌────────────────────────────────────────────────────────────────┐
│ SYMPTOM: TransferData Fails Mid-Download                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Block 47: [0x36] [0x2F] [DATA] → [0x76] [0x2F]  ✅             │
│  Block 48: [0x36] [0x30] [DATA] → [0x76] [0x30]  ✅             │
│  Block 49: [0x36] [0x31] [DATA] → [0x7F] [0x36] [0x??]  ❌      │
│                                                                 │
│  Possible NRCs:                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NRC 0x24 (Request Sequence Error)                        │  │
│  │ • Wrong block counter (jumped or repeated)               │  │
│  │ • Fix: Verify sequential counter increments              │  │
│  │                                                          │  │
│  │ NRC 0x31 (Request Out of Range)                          │  │
│  │ • Exceeded download address range                        │  │
│  │ • Fix: Check total size vs RequestDownload declaration   │  │
│  │                                                          │  │
│  │ NRC 0x7F (Service Not Supported in Active Session)       │  │
│  │ • S3 timeout → returned to Default session               │  │
│  │ • Fix: Send TesterPresent periodically                   │  │
│  │ • Must restart from session + security + download        │  │
│  │                                                          │  │
│  │ NRC 0x72 (General Programming Failure)                   │  │
│  │ • Flash write error                                      │  │
│  │ • Voltage drop during programming                        │  │
│  │ • Fix: Check preconditions, restart download            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Issue 3: Routine Fails After Security Unlock

```
┌────────────────────────────────────────────────────────────────┐
│ SYMPTOM: RoutineControl Rejected Despite Valid Security        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [0x27] [0x03/0x04] → Security Level 2 Unlocked  ✅             │
│  [0x31] [0x01] [0xFF] [0x00] → [0x7F] [0x31] [0x??]  ❌         │
│  (Start Erase Memory Routine)                                   │
│                                                                 │
│  Possible NRCs:                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ NRC 0x22 (Conditions Not Correct)                        │  │
│  │ • Preconditions not met                                  │  │
│  │ • Fix: Run 0x31 0x0203 (Check Preconditions) first      │  │
│  │ • Verify voltage, engine off, etc.                       │  │
│  │                                                          │  │
│  │ NRC 0x24 (Request Sequence Error)                        │  │
│  │ • Another routine already running                        │  │
│  │ • Must stop previous routine first                       │  │
│  │ • Fix: Send 0x31 0x02 (Stop) to previous routine        │  │
│  │                                                          │  │
│  │ NRC 0x31 (Request Out of Range)                          │  │
│  │ • Invalid routine identifier                             │  │
│  │ • ECU doesn't support this routine ID                    │  │
│  │ • Fix: Check supported routines via 0x22 DID             │  │
│  │                                                          │  │
│  │ NRC 0x33 (Security Access Denied)                        │  │
│  │ • Routine requires higher security level                 │  │
│  │ • Erase might need Level 3, not Level 2                  │  │
│  │ • Fix: Unlock correct level per ECU specification        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Issue 4: Session Lost During Multi-Step Process

```
┌────────────────────────────────────────────────────────────────┐
│ SYMPTOM: Extended Session Reverts to Default Unexpectedly      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Timeline:                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 0:00 - Session Change to Extended (0x10 0x03)  ✅        │  │
│  │ 0:01 - Security Unlock (0x27 0x01/0x02)  ✅              │  │
│  │ 0:02 - Write DID (0x2E)  ✅                              │  │
│  │ 0:10 - Write Another DID (0x2E) → NRC 0x7F  ❌           │  │
│  │        (8 seconds elapsed, S3 timeout!)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Diagnosis:                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ S3 Timer expired (typically 5 seconds)                   │  │
│  │ → ECU automatically returned to Default Session          │  │
│  │ → Security state lost                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Solution:                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Send TesterPresent (0x3E) every 2-4 seconds              │  │
│  │                                                          │  │
│  │ Revised Timeline:                                        │  │
│  │ 0:00 - Session Change  ✅                                │  │
│  │ 0:01 - Security Unlock  ✅                               │  │
│  │ 0:02 - Write DID  ✅                                     │  │
│  │ 0:04 - TesterPresent (0x3E 0x80)  ← Reset S3             │  │
│  │ 0:08 - TesterPresent (0x3E 0x80)  ← Reset S3             │  │
│  │ 0:10 - Write Another DID  ✅  (Session still active)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- **Theory Guide:** `SID_27_SECURITY_ACCESS.md`
- **Practical Implementation:** `SID_27_PRACTICAL_IMPLEMENTATION.md`
- **ISO 14229-1:2020:** Section 9.3 - Security Access Service

---

**End of SID 0x27 Service Interactions Guide**
