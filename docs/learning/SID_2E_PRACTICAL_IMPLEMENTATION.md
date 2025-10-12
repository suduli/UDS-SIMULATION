# SID 0x2E - WriteDataByIdentifier Practical Implementation

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**Companion To**: SID_46_WRITE_DATA_BY_IDENTIFIER.md

---

## Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [Write Validation Logic](#write-validation-logic)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [State Machine Diagrams](#state-machine-diagrams)
5. [Testing Scenarios](#testing-scenarios)
6. [Debugging Flowcharts](#debugging-flowcharts)
7. [Implementation Best Practices](#implementation-best-practices)

---

## Request Processing Flowchart

### Complete Write Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│           COMPLETE WRITE REQUEST PROCESSING FLOW                 │
└──────────────────────────────────────────────────────────────────┘

START: Receive UDS Request
         │
         ▼
    ┌─────────────────────┐
    │ Parse Request       │
    │ Extract SID         │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ SID == 0x2E?        │────NO───> [Route to other service]
    └──────┬──────────────┘
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Check Message Length        │
    │ Length >= 3 bytes?          │
    │ (SID + 2 bytes DID min)     │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Return NRC 0x13]
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Extract DID (Bytes 1-2)     │
    │ DID = (Byte1 << 8) | Byte2  │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ DID Exists in ECU?          │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Return NRC 0x31]
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ DID is Writable?            │
    │ (Not read-only?)            │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Return NRC 0x7F]
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Check Expected Length       │
    │ MsgLen == 3 + DID.DataLen?  │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Return NRC 0x13]
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Check Current Session       │
    └──────┬──────────────────────┘
           │
           ├─DEFAULT──> [Return NRC 0x22]
           │
           ├─EXTENDED──> Continue
           │
           ├─PROGRAMMING──> Continue
           │
           │
           ▼
    ┌─────────────────────────────┐
    │ Security Required for DID?  │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Skip security check]
           │       │
           │       ▼
           │  ┌─────────────────────────────┐
           │  │ Check Write Conditions      │
           │  │ (Voltage, state, etc.)      │
           │  └──────┬──────────────────────┘
           │         │
           │         ├─NOT OK──> [Return NRC 0x22]
           │         │
           │         │ OK
           │         ▼
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Security Unlocked?          │
    └──────┬──────────────────────┘
           │
           ├─NO──> [Return NRC 0x33]
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Validate Data Content       │
    │ ├─> Format check            │
    │ ├─> Range check             │
    │ └─> Checksum (if any)       │
    └──────┬──────────────────────┘
           │
           ├─INVALID──> [Return NRC 0x31]
           │
           │ VALID
           ▼
    ┌─────────────────────────────┐
    │ Perform Write Operation     │
    │ ├─> RAM (immediate)         │
    │ └─> EEPROM (queued)         │
    └──────┬──────────────────────┘
           │
           ├─FAIL──> [Return NRC 0x72]
           │
           │ SUCCESS
           ▼
    ┌─────────────────────────────┐
    │ Return Positive Response    │
    │ 0x6E [DID_Hi] [DID_Lo]      │
    └─────────────────────────────┘
           │
           ▼
         END
```

---

## Write Validation Logic

### DID Validation Flowchart

```
┌──────────────────────────────────────────────────────────────────┐
│                   DID VALIDATION PROCESS                         │
└──────────────────────────────────────────────────────────────────┘

START: Validate DID
         │
         ▼
    ┌──────────────────────────┐
    │ Look up DID in table     │
    │ Search: DID registry     │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ DID found?               │
    └──────┬───────────────────┘
           │
           ├─NO──> Return: NRC 0x31
           │       Reason: "DID not supported"
           │
           │ YES
           ▼
    ┌──────────────────────────┐
    │ Get DID properties       │
    │ ├─> Access mode          │
    │ ├─> Data length          │
    │ ├─> Data type            │
    │ ├─> Session required     │
    │ └─> Security level       │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ Check Access Mode        │
    └──────┬───────────────────┘
           │
           ├─READ_ONLY──> Return: NRC 0x7F
           │               Reason: "Service not supported"
           │
           ├─WRITE_ONLY──> Continue
           │
           ├─READ_WRITE──> Continue
           │
           │
           ▼
    ┌──────────────────────────┐
    │ Check Session Allowed    │
    │ Current vs Required      │
    └──────┬───────────────────┘
           │
           ├─MISMATCH──> Return: NRC 0x22
           │             Reason: "Conditions not correct"
           │
           │ MATCH
           ▼
    ┌──────────────────────────┐
    │ Check Security Level     │
    │ Current vs Required      │
    └──────┬───────────────────┘
           │
           ├─INSUFFICIENT──> Return: NRC 0x33
           │                 Reason: "Security access denied"
           │
           │ SUFFICIENT
           ▼
         Return: DID VALID
         Continue to data validation
```

### Data Validation Flowchart

```
┌──────────────────────────────────────────────────────────────────┐
│                  DATA VALIDATION PROCESS                         │
└──────────────────────────────────────────────────────────────────┘

START: Validate Data Content
         │
         ▼
    ┌──────────────────────────────┐
    │ Extract data bytes           │
    │ (Bytes 3 to end of message)  │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Check Data Length            │
    │ Actual vs Expected           │
    └──────┬───────────────────────┘
           │
           ├─MISMATCH──> Return: NRC 0x13
           │             Reason: "Incorrect message length"
           │
           │ MATCH
           ▼
    ┌──────────────────────────────┐
    │ Get Data Type for DID        │
    │ (ASCII, Binary, BCD, etc.)   │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Validate Data Format         │
    └──────┬───────────────────────┘
           │
    ┌──────┴──────────────────────────────────────────┐
    │                                                  │
    ▼                                                  ▼
ASCII Type                                      BINARY Type
    │                                                  │
    ▼                                                  ▼
┌──────────────────────┐                    ┌──────────────────────┐
│ Check all bytes      │                    │ Check value range    │
│ 0x20-0x7E (printable)│                    │ Min <= Value <= Max  │
└──────┬───────────────┘                    └──────┬───────────────┘
       │                                            │
       ├─INVALID──> Return: NRC 0x31               ├─OUT_OF_RANGE──> Return: NRC 0x31
       │                                            │
       │ VALID                                      │ IN_RANGE
       │                                            │
       └──────────────┬─────────────────────────────┘
                      │
                      ▼
               ┌──────────────────────────────┐
               │ Check Special Constraints    │
               │ (DID-specific rules)         │
               │ Example: VIN format check    │
               └──────┬───────────────────────┘
                      │
                      ├─VIOLATED──> Return: NRC 0x31
                      │             Reason: "Invalid data format"
                      │
                      │ PASSED
                      ▼
                    Return: DATA VALID
                    Continue to write operation
```

---

## NRC Decision Trees

### NRC Selection Decision Tree

```
┌──────────────────────────────────────────────────────────────────┐
│                    NRC SELECTION TREE                            │
└──────────────────────────────────────────────────────────────────┘

                    Write Request Received
                            │
                            ▼
                    ┌───────────────────┐
                    │ Message Length    │
                    │ Correct?          │
                    └────┬──────────┬───┘
                         │          │
                      NO │          │ YES
                         │          │
                         ▼          ▼
                    [NRC 0x13]  ┌───────────────────┐
                                │ DID Exists?       │
                                └────┬──────────┬───┘
                                     │          │
                                  NO │          │ YES
                                     │          │
                                     ▼          ▼
                                [NRC 0x31]  ┌───────────────────┐
                                            │ DID Writable?     │
                                            └────┬──────────┬───┘
                                                 │          │
                                              NO │          │ YES
                                                 │          │
                                                 ▼          ▼
                                            [NRC 0x7F]  ┌───────────────────┐
                                                        │ Session OK?       │
                                                        └────┬──────────┬───┘
                                                             │          │
                                                          NO │          │ YES
                                                             │          │
                                                             ▼          ▼
                                                        [NRC 0x22]  ┌───────────────────┐
                                                                    │ Security OK?      │
                                                                    └────┬──────────┬───┘
                                                                         │          │
                                                                      NO │          │ YES
                                                                         │          │
                                                                         ▼          ▼
                                                                    [NRC 0x33]  ┌───────────────────┐
                                                                                │ Data Valid?       │
                                                                                └────┬──────────┬───┘
                                                                                     │          │
                                                                                  NO │          │ YES
                                                                                     │          │
                                                                                     ▼          ▼
                                                                                [NRC 0x31]  ┌───────────────────┐
                                                                                            │ Write Success?    │
                                                                                            └────┬──────────┬───┘
                                                                                                 │          │
                                                                                              NO │          │ YES
                                                                                                 │          │
                                                                                                 ▼          ▼
                                                                                            [NRC 0x72]  [POSITIVE]
                                                                                                        [0x6E DID]
```

### Detailed NRC 0x22 Decision

```
┌──────────────────────────────────────────────────────────────────┐
│          NRC 0x22 - CONDITIONS NOT CORRECT DECISION              │
└──────────────────────────────────────────────────────────────────┘

    Check: Conditions Not Correct
                │
                ▼
    ┌───────────────────────────┐
    │ Current Session Type?     │
    └───────┬───────────────────┘
            │
    ┌───────┼───────┬──────────┬──────────┐
    │       │       │          │          │
    ▼       ▼       ▼          ▼          ▼
 DEFAULT EXTENDED PROG    SAFETY   OTHER
    │       │       │          │          │
    │       │       │          │          │
NRC 0x22    │       │          │       NRC 0x22
"Need      │       │          │       "Unknown
Extended"  │       │          │        session"
           │       │          │
           ▼       ▼          ▼
      Session OK - Continue
                │
                ▼
    ┌───────────────────────────┐
    │ Vehicle Conditions?       │
    └───────┬───────────────────┘
            │
    ┌───────┼──────┬─────────┬──────────┐
    │       │      │         │          │
    ▼       ▼      ▼         ▼          ▼
 Voltage  Speed  Engine  Gear      Temp
   OK      OK     OK      OK        OK
    │       │      │         │          │
    └───────┴──────┴─────────┴──────────┘
                │
                │ ALL OK
                ▼
    ┌───────────────────────────┐
    │ Write Already in Progress?│
    └───────┬───────────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼ YES         ▼ NO
 NRC 0x22      Conditions
 "Busy"        OK - Continue
```

---

## State Machine Diagrams

### Write Operation State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│               WRITE OPERATION STATE MACHINE                      │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    IDLE     │◄──────────────────────────┐
    └──────┬──────┘                           │
           │                                  │
           │ Receive 0x2E Request             │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │ VALIDATING  │                           │
    │   REQUEST   │                           │
    └──────┬──────┘                           │
           │                                  │
           │ Validation Fails                 │
           ├────────────────────┐             │
           │                    │             │
           │ Validation OK      ▼             │
           │            ┌─────────────┐       │
           │            │  REJECTED   │       │
           │            │ (Send NRC)  │       │
           │            └──────┬──────┘       │
           │                   │              │
           │                   │ NRC Sent     │
           │                   └──────────────┘
           │
           ▼
    ┌─────────────┐
    │  CHECKING   │
    │  SECURITY   │
    └──────┬──────┘
           │
           │ Security OK
           │ (or not required)
           │
           ▼
    ┌─────────────┐
    │  PREPARING  │
    │    WRITE    │
    └──────┬──────┘
           │
           │ Ready to Write
           │
           ▼
    ┌─────────────┐
    │   WRITING   │─────────────┐
    │             │             │ Write Fails
    └──────┬──────┘             │
           │                    ▼
           │            ┌─────────────┐
           │ Write OK   │  WRITE_ERR  │
           │            │ (Send 0x72) │
           │            └──────┬──────┘
           │                   │
           │                   │ Error Sent
           │                   └──────────────┐
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │ VERIFYING   │                           │
    └──────┬──────┘                           │
           │                                  │
           │ Verify OK                        │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │  RESPONDING │                           │
    │ (Send 0x6E) │                           │
    └──────┬──────┘                           │
           │                                  │
           │ Response Sent                    │
           │                                  │
           └──────────────────────────────────┘
```

### EEPROM Write Queueing State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│           EEPROM WRITE QUEUE STATE MACHINE                       │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    IDLE     │◄──────────────────────────┐
    │  (No Queue) │                           │
    └──────┬──────┘                           │
           │                                  │
           │ Write Request                    │
           │ (Target: EEPROM)                 │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │   QUEUED    │                           │
    │ (Waiting)   │◄──────────┐               │
    └──────┬──────┘           │               │
           │                  │               │
           │ Timer expires    │ Not Safe      │
           │ OR Safe moment   │               │
           │                  │               │
           ▼                  │               │
    ┌─────────────┐           │               │
    │  CHECKING   │           │               │
    │  SAFETY     │           │               │
    └──────┬──────┘           │               │
           │                  │               │
           │ Voltage < 11V ───┘               │
           │ OR Other unsafe condition         │
           │                                  │
           │ Safe to write                    │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │   ERASING   │                           │
    │  (if needed)│                           │
    └──────┬──────┘                           │
           │                                  │
           │ Erase complete                   │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │   WRITING   │─────────────┐             │
    │   EEPROM    │             │ Write Fails │
    └──────┬──────┘             │             │
           │                    ▼             │
           │ Write OK   ┌─────────────┐       │
           │            │    ERROR    │       │
           │            │  (Retry?)   │       │
           │            └──────┬──────┘       │
           │                   │              │
           │                   │ Max Retries  │
           │                   │ OR Give Up   │
           │                   └──────────────┤
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │  VERIFYING  │                           │
    │   WRITE     │                           │
    └──────┬──────┘                           │
           │                                  │
           │ Verify OK                        │
           │                                  │
           ▼                                  │
    ┌─────────────┐                           │
    │  COMPLETE   │                           │
    │ (Clear Queue)│                          │
    └──────┬──────┘                           │
           │                                  │
           └──────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Basic Write Operation

```
┌──────────────────────────────────────────────────────────────────┐
│         SCENARIO 1: BASIC WRITE (No Security Required)           │
└──────────────────────────────────────────────────────────────────┘

Objective: Write a simple configuration parameter

Setup:
┌────────────────────────────────────────────────────────┐
│ DID: 0x0105 (Diagnostic Test Counter)                 │
│ Type: Binary, 2 bytes                                  │
│ Range: 0x0000 - 0xFFFF                                 │
│ Session Required: EXTENDED                             │
│ Security Required: NO                                  │
│ Memory Type: RAM                                       │
└────────────────────────────────────────────────────────┘

Test Sequence:
  Tester                           ECU
    │                               │
    │  Step 1: Enter Extended Session
    │                               │
    │  10 03                        │
    │──────────────────────────────>│
    │                               ├─> Switch to EXTENDED
    │  50 03 00 32 00 C8            │
    │<──────────────────────────────│
    │                               │
    │  Step 2: Write Value 0x0042
    │                               │
    │  2E 01 05 00 42               │
    │──────────────────────────────>│
    │                               ├─> Validate DID ✓
    │                               ├─> Check session ✓
    │                               ├─> Check security (not needed) ✓
    │                               ├─> Validate data (in range) ✓
    │                               ├─> Write to RAM ✓
    │  6E 01 05                     │
    │<──────────────────────────────│
    │                               │
    │  Step 3: Verify Write
    │                               │
    │  22 01 05                     │
    │──────────────────────────────>│
    │                               ├─> Read from RAM
    │  62 01 05 00 42               │
    │<──────────────────────────────│
    │                               │
    │  ✓ Test PASSED: Value = 0x0042
    │

Expected Results:
✓ Write accepted in EXTENDED session
✓ No security required
✓ Immediate RAM write
✓ Read-back verification matches
```

### Scenario 2: Security-Protected Write

```
┌──────────────────────────────────────────────────────────────────┐
│      SCENARIO 2: SECURITY-PROTECTED WRITE (VIN Example)          │
└──────────────────────────────────────────────────────────────────┘

Objective: Write VIN (requires high security)

Setup:
┌────────────────────────────────────────────────────────────┐
│ DID: 0xF190 (VIN - Vehicle Identification Number)         │
│ Type: ASCII, 17 bytes                                      │
│ Format: Must be valid VIN format                           │
│ Session Required: EXTENDED or PROGRAMMING                  │
│ Security Required: YES (Level 1 minimum)                   │
│ Memory Type: EEPROM                                        │
└────────────────────────────────────────────────────────────┘

Test Sequence:
  Tester                           ECU
    │                               │
    │  Step 1: Enter Extended Session
    │                               │
    │  10 03                        │
    │──────────────────────────────>│
    │  50 03 00 32 00 C8            │
    │<──────────────────────────────│
    │                               │
    │  Step 2: Request Seed
    │                               │
    │  27 01                        │
    │──────────────────────────────>│
    │  67 01 A3 B4 C5 D6            │
    │<──────────────────────────────│
    │                               │
    │  (Tester calculates key from seed)
    │                               │
    │  Step 3: Send Key
    │                               │
    │  27 02 12 34 56 78            │
    │──────────────────────────────>│
    │                               ├─> Verify key ✓
    │  67 02                        │
    │<──────────────────────────────│
    │                               │
    │  Security Status: 🔓 UNLOCKED
    │                               │
    │  Step 4: Write VIN
    │                               │
    │  2E F1 90 57 56 57 5A 5A 5A   │
    │  31 4B 5A 42 57 31 32 33 34   │
    │  35 36                        │
    │  (WVWZZZ1KZBW123456)          │
    │──────────────────────────────>│
    │                               ├─> Validate DID ✓
    │                               ├─> Check session ✓
    │                               ├─> Check security ✓
    │                               ├─> Validate VIN format ✓
    │                               ├─> Queue EEPROM write
    │  6E F1 90                     │
    │<──────────────────────────────│
    │                               │
    │  ... (Wait 500ms for EEPROM write)
    │                               │
    │  Step 5: Verify Write
    │                               │
    │  22 F1 90                     │
    │──────────────────────────────>│
    │  62 F1 90 57 56 57 5A 5A 5A   │
    │  31 4B 5A 42 57 31 32 33 34   │
    │  35 36                        │
    │<──────────────────────────────│
    │                               │
    │  ✓ Test PASSED: VIN written
    │

Expected Results:
✓ Security unlock required before write
✓ VIN format validated
✓ EEPROM write queued and executed
✓ Read-back verification matches
```

### Scenario 3: Invalid DID Write Attempt

```
┌──────────────────────────────────────────────────────────────────┐
│         SCENARIO 3: WRITE TO INVALID/READ-ONLY DID               │
└──────────────────────────────────────────────────────────────────┘

Objective: Verify proper NRC for invalid write attempts

Test Case 3A: Non-Existent DID
─────────────────────────────────────────────────────────────────
  Tester                           ECU
    │                               │
    │  10 03                        │  (Enter EXTENDED)
    │──────────────────────────────>│
    │  50 03 [...]                  │
    │<──────────────────────────────│
    │                               │
    │  2E FF FF 12 34               │  (DID 0xFFFF - invalid)
    │──────────────────────────────>│
    │                               ├─> Search DID table
    │                               ├─> DID not found ✗
    │  7F 2E 31                     │
    │<──────────────────────────────│
    │                               │
    │  ✓ Expected NRC 0x31 received
    │

Test Case 3B: Read-Only DID
─────────────────────────────────────────────────────────────────
  Tester                           ECU
    │                               │
    │  2E F1 91 [HW number]         │  (DID 0xF191 - read-only)
    │──────────────────────────────>│
    │                               ├─> DID found ✓
    │                               ├─> Check write permission
    │                               ├─> Read-only DID ✗
    │  7F 2E 7F                     │
    │<──────────────────────────────│
    │                               │
    │  ✓ Expected NRC 0x7F received
    │

Expected Results:
✓ NRC 0x31 for non-existent DID
✓ NRC 0x7F for read-only DID
✓ No memory modification attempted
```

### Scenario 4: Wrong Session Test

```
┌──────────────────────────────────────────────────────────────────┐
│           SCENARIO 4: WRITE IN WRONG SESSION                     │
└──────────────────────────────────────────────────────────────────┘

Objective: Verify write rejection in DEFAULT session

Test Sequence:
  Tester                           ECU
    │                               │
    │  Initial State: DEFAULT Session
    │                               │
    │  2E 01 05 00 42               │  (Try to write config DID)
    │──────────────────────────────>│
    │                               ├─> Validate DID ✓
    │                               ├─> Check session
    │                               ├─> Session = DEFAULT ✗
    │                               ├─> EXTENDED required
    │  7F 2E 22                     │
    │<──────────────────────────────│
    │                               │
    │  ✓ Expected NRC 0x22 received
    │  Reason: "Conditions not correct"
    │

Expected Results:
✓ NRC 0x22 for wrong session
✓ Write not executed
✓ Tester must change session first
```

### Scenario 5: Data Out of Range

```
┌──────────────────────────────────────────────────────────────────┐
│          SCENARIO 5: WRITE VALUE OUT OF RANGE                    │
└──────────────────────────────────────────────────────────────────┘

Objective: Verify data validation enforcement

Setup:
┌────────────────────────────────────────────────────────┐
│ DID: 0x0100 (Speed Limit Configuration)               │
│ Type: Binary, 2 bytes (unsigned)                       │
│ Valid Range: 0x0000 - 0x00FA (0-250 km/h)             │
│ Session Required: EXTENDED                             │
│ Security Required: YES                                 │
└────────────────────────────────────────────────────────┘

Test Sequence:
  Tester                           ECU
    │                               │
    │  (Assume: EXTENDED + Unlocked)
    │                               │
    │  2E 01 00 01 F4               │  (Try to write 500 km/h)
    │──────────────────────────────>│
    │                               ├─> Validate DID ✓
    │                               ├─> Check session ✓
    │                               ├─> Check security ✓
    │                               ├─> Validate data:
    │                               │   Value = 0x01F4 = 500
    │                               │   Max = 0x00FA = 250
    │                               │   500 > 250 ✗
    │  7F 2E 31                     │
    │<──────────────────────────────│
    │                               │
    │  ✓ Expected NRC 0x31 received
    │  Reason: "Request out of range"
    │

Expected Results:
✓ NRC 0x31 for out-of-range value
✓ Range validation enforced
✓ Invalid data rejected before write
```

---

## Debugging Flowcharts

### Troubleshooting Write Failures

```
┌──────────────────────────────────────────────────────────────────┐
│            WRITE FAILURE DEBUGGING FLOWCHART                     │
└──────────────────────────────────────────────────────────────────┘

START: Write Request Failed
         │
         ▼
    ┌─────────────────────┐
    │ Which NRC received? │
    └──────┬──────────────┘
           │
    ┌──────┼──────┬──────┬──────┬──────┬──────┐
    │      │      │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼      ▼      ▼
  0x13   0x22   0x31   0x33   0x72   0x7F   Other

  │      │      │      │      │      │      │
  │      │      │      │      │      │      └──> Unknown NRC
  │      │      │      │      │      │           Check ECU spec
  │      │      │      │      │      │
  │      │      │      │      │      └──────────> READ-ONLY DID
  │      │      │      │      │                   ┌──────────────┐
  │      │      │      │      │                   │ DID is not   │
  │      │      │      │      │                   │ writable     │
  │      │      │      │      │                   │              │
  │      │      │      │      │                   │ FIX: Use     │
  │      │      │      │      │                   │ different    │
  │      │      │      │      │                   │ DID or check │
  │      │      │      │      │                   │ ECU spec     │
  │      │      │      │      │                   └──────────────┘
  │      │      │      │      │
  │      │      │      │      └────────────────────> WRITE FAILURE
  │      │      │      │                            ┌──────────────┐
  │      │      │      │                            │ Check:       │
  │      │      │      │                            │ ├─> Voltage  │
  │      │      │      │                            │ ├─> EEPROM   │
  │      │      │      │                            │ └─> Memory   │
  │      │      │      │                            │              │
  │      │      │      │                            │ FIX: Ensure  │
  │      │      │      │                            │ 11V+ voltage │
  │      │      │      │                            │ & retry      │
  │      │      │      │                            └──────────────┘
  │      │      │      │
  │      │      │      └───────────────────────────────> SECURITY DENIED
  │      │      │                                        ┌──────────────┐
  │      │      │                                        │ Check:       │
  │      │      │                                        │ ├─> Unlocked?│
  │      │      │                                        │ ├─> Timeout? │
  │      │      │                                        │ └─> Level OK?│
  │      │      │                                        │              │
  │      │      │                                        │ FIX: Perform │
  │      │      │                                        │ SID 0x27     │
  │      │      │                                        │ unlock first │
  │      │      │                                        └──────────────┘
  │      │      │
  │      │      └──────────────────────────────────────────> OUT OF RANGE
  │      │                                                   ┌──────────────┐
  │      │                                                   │ Check:       │
  │      │                                                   │ ├─> DID valid│
  │      │                                                   │ ├─> Data min/│
  │      │                                                   │ │   max range│
  │      │                                                   │ └─> Format OK│
  │      │                                                   │              │
  │      │                                                   │ FIX: Correct │
  │      │                                                   │ DID or data  │
  │      │                                                   │ value        │
  │      │                                                   └──────────────┘
  │      │
  │      └─────────────────────────────────────────────────────> CONDITIONS NOT CORRECT
  │                                                                ┌──────────────┐
  │                                                                │ Check:       │
  │                                                                │ ├─> Session? │
  │                                                                │ ├─> Voltage? │
  │                                                                │ ├─> Speed?   │
  │                                                                │ └─> State?   │
  │                                                                │              │
  │                                                                │ FIX: Enter   │
  │                                                                │ EXTENDED +   │
  │                                                                │ check vehicle│
  │                                                                │ conditions   │
  │                                                                └──────────────┘
  │
  └────────────────────────────────────────────────────────────────> INCORRECT LENGTH
                                                                     ┌──────────────┐
                                                                     │ Check:       │
                                                                     │ ├─> Message  │
                                                                     │ │   length   │
                                                                     │ ├─> DID spec │
                                                                     │ └─> Data len │
                                                                     │              │
                                                                     │ FIX: Correct │
                                                                     │ data length  │
                                                                     │ to match DID │
                                                                     └──────────────┘
```

### EEPROM Write Troubleshooting

```
┌──────────────────────────────────────────────────────────────────┐
│          EEPROM WRITE TROUBLESHOOTING FLOWCHART                  │
└──────────────────────────────────────────────────────────────────┘

Problem: Write Accepted but Data Not Persisting
         │
         ▼
    ┌─────────────────────────────┐
    │ Did you get positive        │
    │ response (0x6E)?            │
    └──────┬──────────────────────┘
           │
           ├─NO──> Response was NRC
           │       └─> See "Write Failure" flowchart above
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Did you wait for EEPROM     │
    │ write to complete?          │
    │ (100-500ms typically)       │
    └──────┬──────────────────────┘
           │
           ├─NO──> Problem: Read too soon
           │       └─> FIX: Wait 500ms, then read again
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Read back immediately       │
    │ after write - correct?      │
    └──────┬──────────────────────┘
           │
           ├─NO──> Problem: Write to RAM failed
           │       └─> Check for NRC 0x72 in logs
           │
           │ YES
           ▼
    ┌─────────────────────────────┐
    │ Reset ECU, then read again  │
    │ Data still there?           │
    └──────┬──────────────────────┘
           │
           ├─NO──> Problem: EEPROM write failed
           │       │
           │       ▼
           │   ┌─────────────────────────────┐
           │   │ Check:                      │
           │   │ ├─> Voltage during write    │
           │   │ │   (must be >= 11V)        │
           │   │ ├─> EEPROM write queue logs │
           │   │ ├─> Write protection status │
           │   │ └─> EEPROM wear level       │
           │   │                             │
           │   │ FIX:                        │
           │   │ ├─> Ensure stable voltage   │
           │   │ ├─> Check EEPROM health     │
           │   │ └─> Review ECU error logs   │
           │   └─────────────────────────────┘
           │
           │ YES
           ▼
      Data Persisted Successfully ✓
```

---

## Implementation Best Practices

### Checklist for Implementing SID 0x2E

```
┌──────────────────────────────────────────────────────────────────┐
│          SID 0x2E IMPLEMENTATION CHECKLIST                       │
└──────────────────────────────────────────────────────────────────┘

Message Parsing & Validation
═════════════════════════════════════════════════════════════════
☐ Parse SID byte (must be 0x2E)
☐ Extract DID (2 bytes, big-endian)
☐ Validate minimum message length (>= 3 bytes)
☐ Look up DID in registry/table
☐ Verify DID exists (else NRC 0x31)
☐ Verify DID is writable (else NRC 0x7F)
☐ Check data length matches DID spec (else NRC 0x13)

Session & Security Checks
═════════════════════════════════════════════════════════════════
☐ Check current diagnostic session
☐ Reject if DEFAULT session (NRC 0x22)
☐ Allow if EXTENDED or PROGRAMMING
☐ Check if DID requires security
☐ If security required, verify unlocked (else NRC 0x33)
☐ Verify security level matches DID requirement

Condition Checks
═════════════════════════════════════════════════════════════════
☐ Check vehicle speed (if required by DID)
☐ Check engine state (if required by DID)
☐ Check battery voltage (>= 11V for EEPROM writes)
☐ Check no write operation already in progress
☐ Check ECU not in fault/limp mode
☐ Return NRC 0x22 if any condition fails

Data Validation
═════════════════════════════════════════════════════════════════
☐ Validate data type (ASCII, Binary, BCD, etc.)
☐ Check data range (min/max values)
☐ Validate data format (e.g., VIN format)
☐ Check data constraints (DID-specific rules)
☐ Return NRC 0x31 if validation fails

Write Operation
═════════════════════════════════════════════════════════════════
☐ Determine target memory (RAM, EEPROM, Flash)
☐ For RAM: Write immediately
☐ For EEPROM: Queue write for safe moment
☐ For Flash: Use programming session + separate services
☐ Verify write success internally
☐ Return NRC 0x72 if write fails

Response Handling
═════════════════════════════════════════════════════════════════
☐ Send positive response (0x6E + DID) if successful
☐ Include DID bytes in response (echo)
☐ Do NOT include data record in response
☐ Send response BEFORE EEPROM write completes
☐ Queue EEPROM write in background

Verification & Testing
═════════════════════════════════════════════════════════════════
☐ Test with valid DID and correct session
☐ Test with invalid DID (verify NRC 0x31)
☐ Test with read-only DID (verify NRC 0x7F)
☐ Test in wrong session (verify NRC 0x22)
☐ Test without security unlock (verify NRC 0x33)
☐ Test with incorrect data length (verify NRC 0x13)
☐ Test with out-of-range data (verify NRC 0x31)
☐ Test low voltage scenario (verify NRC 0x72)
☐ Verify EEPROM persistence after reset
☐ Test read-after-write for all writable DIDs

Error Handling
═════════════════════════════════════════════════════════════════
☐ Log all write attempts (success and failure)
☐ Track write failures for diagnostics
☐ Implement retry logic for transient EEPROM failures
☐ Handle voltage drops during write gracefully
☐ Detect and report EEPROM corruption
☐ Implement wear-leveling if applicable

Security Considerations
═════════════════════════════════════════════════════════════════
☐ Never allow critical DIDs without security
☐ Implement timeout for security unlock state
☐ Log all security-protected write attempts
☐ Protect against replay attacks (if applicable)
☐ Validate VIN format before writing
☐ Prevent serial number overwrites after initial write

Performance Optimization
═════════════════════════════════════════════════════════════════
☐ Optimize DID lookup (hash table or binary search)
☐ Minimize validation overhead
☐ Use efficient EEPROM write algorithms
☐ Batch multiple EEPROM writes if safe
☐ Respond quickly (< 50ms for RAM writes)
☐ Queue EEPROM writes to avoid blocking

Documentation
═════════════════════════════════════════════════════════════════
☐ Document all writable DIDs
☐ Specify data format for each DID
☐ Document session requirements per DID
☐ Document security requirements per DID
☐ Document data validation rules
☐ Provide examples for common write operations
```

---

**End of SID 0x2E Practical Implementation Document**

For theory, see: `SID_46_WRITE_DATA_BY_IDENTIFIER.md`  
For service interactions, see: `SID_46_SERVICE_INTERACTIONS.md`
