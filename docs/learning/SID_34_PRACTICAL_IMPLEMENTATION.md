# SID 0x34: Request Download - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

---

## Table of Contents
1. [Request Processing Flowchart](#request-processing-flowchart)
2. [State Machine Diagram](#state-machine-diagram)
3. [NRC Decision Tree](#nrc-decision-tree)
4. [Memory Validation Process](#memory-validation-process)
5. [Session Timeout Handling](#session-timeout-handling)
6. [Testing Scenarios](#testing-scenarios)
7. [Integration Patterns](#integration-patterns)
8. [Debugging Flowcharts](#debugging-flowcharts)
9. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Main Processing Flow

```
                    ┌──────────────────────┐
                    │  Receive Request     │
                    │  SID = 0x34          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Validate Message     │
                    │ Length               │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
               NO                            YES
                │                             │
                ▼                             ▼
         ┌─────────────┐           ┌──────────────────┐
         │  Return     │           │ Check Current    │
         │  NRC 0x13   │           │ Session Type     │
         └─────────────┘           └────────┬─────────┘
                                            │
                             ┌──────────────┴─────────────┐
                             │                            │
                        Not PROG                      PROGRAMMING
                             │                            │
                             ▼                            ▼
                      ┌─────────────┐          ┌──────────────────┐
                      │  Return     │          │ Check Security   │
                      │  NRC 0x70   │          │ State            │
                      └─────────────┘          └────────┬─────────┘
                                                        │
                                         ┌──────────────┴──────────────┐
                                         │                             │
                                      LOCKED                        UNLOCKED
                                         │                             │
                                         ▼                             ▼
                                  ┌─────────────┐          ┌──────────────────┐
                                  │  Return     │          │ Check Download   │
                                  │  NRC 0x33   │          │ State            │
                                  └─────────────┘          └────────┬─────────┘
                                                                    │
                                                     ┌──────────────┴──────────────┐
                                                     │                             │
                                                  Active                         Idle
                                                     │                             │
                                                     ▼                             ▼
                                              ┌─────────────┐          ┌──────────────────┐
                                              │  Return     │          │ Validate Memory  │
                                              │  NRC 0x22   │          │ Parameters       │
                                              └─────────────┘          └────────┬─────────┘
                                                                                │
                                                                 ┌──────────────┴──────────────┐
                                                                 │                             │
                                                              Invalid                        Valid
                                                                 │                             │
                                                                 ▼                             ▼
                                                          ┌─────────────┐          ┌──────────────────┐
                                                          │  Return     │          │ Prepare Memory   │
                                                          │  NRC 0x31   │          │ Buffer           │
                                                          └─────────────┘          └────────┬─────────┘
                                                                                            │
                                                                             ┌──────────────┴──────────────┐
                                                                             │                             │
                                                                          Failed                       Success
                                                                             │                             │
                                                                             ▼                             ▼
                                                                      ┌─────────────┐          ┌──────────────────┐
                                                                      │  Return     │          │ Set Download     │
                                                                      │  NRC 0x72   │          │ Active State     │
                                                                      └─────────────┘          └────────┬─────────┘
                                                                                                        │
                                                                                                        ▼
                                                                                             ┌──────────────────┐
                                                                                             │ Return Positive  │
                                                                                             │ Response (0x74)  │
                                                                                             │ + Max Block Size │
                                                                                             └──────────────────┘
```

---

## State Machine Diagram

### Download Service States

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOWNLOAD STATE MACHINE                            │
└─────────────────────────────────────────────────────────────────────┘

        ┌──────────────────┐
        │   IDLE STATE     │
        │                  │
        │  • No active     │
        │    download      │
        │  • Ready for new │
        │    request       │
        └────────┬─────────┘
                 │
                 │ Request Download (0x34)
                 │ All checks pass ✓
                 │
                 ▼
        ┌──────────────────┐
        │  DOWNLOAD_ACTIVE │
        │                  │
        │  • Address stored│
        │  • Size stored   │
        │  • Buffer ready  │
        │  • Awaiting 0x36 │
        └────────┬─────────┘
                 │
                 │ Transfer Data (0x36)
                 │ Repeated transfers
                 │
                 ▼
        ┌──────────────────┐
        │ TRANSFER_ACTIVE  │
        │                  │
        │  • Receiving data│
        │  • Block counter │
        │  • CRC calc      │
        └────────┬─────────┘
                 │
                 │ Request Transfer Exit (0x37)
                 │
                 ▼
        ┌──────────────────┐
        │  FINALIZING      │
        │                  │
        │  • Verify CRC    │
        │  • Write to flash│
        │  • Cleanup       │
        └────────┬─────────┘
                 │
                 │ Success
                 │
                 ▼
        ┌──────────────────┐
        │   IDLE STATE     │◄─────┐
        │                  │      │
        │  Ready for next  │      │
        │  download        │      │
        └──────────────────┘      │
                                  │
                                  │
        ┌──────────────────┐      │
        │  ERROR STATE     │      │
        │                  │      │
        │  • Cleanup       │      │
        │  • Release buffer│──────┘
        │  • Return to IDLE│
        └──────────────────┘
```

### State Transition Triggers

```
┌────────────────────────┬─────────────────┬─────────────────┐
│  Current State         │  Event          │  Next State     │
├────────────────────────┼─────────────────┼─────────────────┤
│  IDLE                  │  0x34 Success   │  DOWNLOAD_ACTIVE│
│  IDLE                  │  0x34 Failed    │  IDLE (NRC sent)│
│  DOWNLOAD_ACTIVE       │  0x36 Received  │  TRANSFER_ACTIVE│
│  DOWNLOAD_ACTIVE       │  0x34 Again     │  DOWNLOAD_ACTIVE│
│                        │                 │  (NRC 0x22)     │
│  TRANSFER_ACTIVE       │  0x36 Continue  │  TRANSFER_ACTIVE│
│  TRANSFER_ACTIVE       │  0x37 Received  │  FINALIZING     │
│  FINALIZING            │  Success        │  IDLE           │
│  FINALIZING            │  Failure        │  ERROR          │
│  ERROR                 │  Cleanup Done   │  IDLE           │
│  Any State             │  Session Timeout│  IDLE           │
│  Any State             │  Session Change │  IDLE           │
└────────────────────────┴─────────────────┴─────────────────┘
```

---

## NRC Decision Tree

### When to Return Which NRC

```
                     ┌─────────────────────┐
                     │  Request Received   │
                     │  SID = 0x34         │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Message length =    │
              ┌──────┤ SID + DFI + ALFID + │──────┐
              │      │ addr + size?        │      │
             NO      └─────────────────────┘     YES
              │                                   │
              ▼                                   ▼
       ┌──────────┐                    ┌─────────────────────┐
       │ NRC 0x13 │                    │ Current session =   │
       │ Incorrect│                ┌───┤ PROGRAMMING (0x02)? │───┐
       │ Message  │               NO   └─────────────────────┘  YES
       │ Length   │                │                             │
       └──────────┘                ▼                             ▼
                            ┌──────────┐              ┌─────────────────────┐
                            │ NRC 0x70 │              │ Security state =    │
                            │ Upload/  │          ┌───┤ UNLOCKED?           │───┐
                            │ Download │         NO   └─────────────────────┘  YES
                            │ Not      │          │                             │
                            │ Accepted │          ▼                             ▼
                            └──────────┘   ┌──────────┐              ┌─────────────────────┐
                                           │ NRC 0x33 │              │ Download currently  │
                                           │ Security │          ┌───┤ active?             │───┐
                                           │ Access   │         NO   └─────────────────────┘  YES
                                           │ Denied   │          │                             │
                                           └──────────┘          ▼                             ▼
                                                          ┌─────────────────────┐       ┌──────────┐
                                                          │ Memory address &    │       │ NRC 0x22 │
                                                      ┌───┤ size valid?         │───┐   │ Conditions│
                                                     NO   └─────────────────────┘  YES  │ Not      │
                                                      │                              │   │ Correct  │
                                                      ▼                              ▼   └──────────┘
                                               ┌──────────┐              ┌─────────────────────┐
                                               │ NRC 0x31 │              │ Memory preparation  │
                                               │ Request  │          ┌───┤ successful?         │───┐
                                               │ Out of   │         NO   └─────────────────────┘  YES
                                               │ Range    │          │                             │
                                               └──────────┘          ▼                             ▼
                                                              ┌──────────┐              ┌─────────────┐
                                                              │ NRC 0x72 │              │ Positive    │
                                                              │ General  │              │ Response    │
                                                              │ Prog     │              │ 0x74        │
                                                              │ Failure  │              └─────────────┘
                                                              └──────────┘
```

---

## Memory Validation Process

### Address and Size Validation

```
┌──────────────────────────────────────────────────────────────┐
│              MEMORY VALIDATION FLOWCHART                      │
└──────────────────────────────────────────────────────────────┘

         ┌─────────────────────┐
         │ Extract Memory      │
         │ Address and Size    │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check Address       │
    ┌────┤ >= MIN_FLASH_ADDR?  │────┐
    │    └─────────────────────┘    │
   NO                               YES
    │                                │
    ▼                                ▼
┌────────┐                ┌─────────────────────┐
│NRC 0x31│                │ Check Address       │
└────────┘            ┌───┤ <= MAX_FLASH_ADDR?  │───┐
                      │   └─────────────────────┘   │
                     NO                            YES
                      │                              │
                      ▼                              ▼
                  ┌────────┐              ┌─────────────────────┐
                  │NRC 0x31│              │ Check Size > 0?     │
                  └────────┘          ┌───┤                     │───┐
                                      │   └─────────────────────┘   │
                                     NO                            YES
                                      │                              │
                                      ▼                              ▼
                                  ┌────────┐              ┌─────────────────────┐
                                  │NRC 0x31│              │ Check Address+Size  │
                                  └────────┘          ┌───┤ <= MAX_FLASH_ADDR?  │───┐
                                                      │   └─────────────────────┘   │
                                                     NO                            YES
                                                      │                              │
                                                      ▼                              ▼
                                                  ┌────────┐              ┌─────────────────────┐
                                                  │NRC 0x31│              │ Check region not in │
                                                  └────────┘          ┌───┤ protected area?     │───┐
                                                                      │   └─────────────────────┘   │
                                                                     NO                            YES
                                                                      │                              │
                                                                      ▼                              ▼
                                                                  ┌────────┐              ┌─────────────┐
                                                                  │NRC 0x31│              │ Validation  │
                                                                  └────────┘              │ PASSED ✓    │
                                                                                          └─────────────┘
```

### Memory Region Protection

```
┌──────────────────────────────────────────────────────────────┐
│              FLASH MEMORY MAP EXAMPLE                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  0x00000000                                                  │
│  ├───────────────────────────────────────┐                  │
│  │  BOOTLOADER (PROTECTED) 🔒            │ ◄── NRC 0x31     │
│  │  Cannot download here                 │                  │
│  ├───────────────────────────────────────┤  0x0000FFFF      │
│  │                                       │                  │
│  │  APPLICATION FLASH ✓                  │ ◄── Valid region │
│  │  Downloads allowed here               │                  │
│  │                                       │                  │
│  ├───────────────────────────────────────┤  0x001FFFFF      │
│  │  CALIBRATION DATA (PROTECTED) 🔒      │ ◄── NRC 0x31     │
│  │  Cannot download here                 │                  │
│  ├───────────────────────────────────────┤  0x0020FFFF      │
│  │                                       │                  │
│  │  RESERVED / INVALID                   │ ◄── NRC 0x31     │
│  │                                       │                  │
│  └───────────────────────────────────────┘  0xFFFFFFFF      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Session Timeout Handling

### Programming Session Timeout

```
┌──────────────────────────────────────────────────────────────┐
│                SESSION TIMEOUT SCENARIO                       │
└──────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  Diagnostic Session Control (0x10 0x02)│
    │───────────────────────────────────────>│
    │                                        │ Start Session Timer
    │  Response (0x50 0x02 [P2/P2*])        │ (e.g., 5000ms)
    │<───────────────────────────────────────│
    │                                        │
    │  Security Access (0x27)...             │
    │───────────────────────────────────────>│
    │<───────────────────────────────────────│
    │                                        │
    │  Request Download (0x34)               │
    │───────────────────────────────────────>│
    │                                        │ Download State: ACTIVE
    │  Positive Response (0x74)              │ Reset Timer
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    │  ⏱️  DELAY > 5000ms (No Tester Polls)  │
    │                                        │
    │                                        │ ⚠️ TIMEOUT!
    │                                        │
    │                                        │ Actions:
    │                                        │ 1. Return to DEFAULT session
    │                                        │ 2. Lock security
    │                                        │ 3. Clear download state
    │                                        │ 4. Release memory buffer
    │                                        │
    │  Transfer Data (0x36) [Too late!]      │
    │───────────────────────────────────────>│
    │                                        │
    │  NRC 0x7F (Service Not Supported)      │
    │  or NRC 0x70 (Upload/Download NA)      │
    │<───────────────────────────────────────│
    │                                        │
```

### Prevention Strategy

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Keep Session Alive with Tester Present          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Every < 5000ms:                                             │
│                                                              │
│  Tester                            ECU                       │
│    │                                │                        │
│    │  Tester Present (0x3E 0x80)    │                        │
│    │───────────────────────────────>│                        │
│    │                                │ Reset Timer            │
│    │  Response (0x7E)               │                        │
│    │<───────────────────────────────│                        │
│    │                                │                        │
│    │  ... Continue Download ...     │                        │
│    │                                │                        │
│                                                              │
│  Timing Strategy:                                            │
│  • Send 0x3E every 2-3 seconds                               │
│  • Always before P2* timeout                                 │
│  • Use suppress positive response (0x80)                     │
│  • Alternate with data transfer requests                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Successful Download Initiation

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Happy Path - All Conditions Met                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Preconditions:                                              │
│  ✓ Session = PROGRAMMING (0x02)                              │
│  ✓ Security = UNLOCKED                                       │
│  ✓ No active download                                        │
│  ✓ Valid memory address (0x00100000)                         │
│  ✓ Valid size (4096 bytes)                                   │
│                                                              │
│  Request:                                                    │
│  [0x34] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]           │
│  [0x00] [0x00] [0x10] [0x00]                                 │
│                                                              │
│  Expected Response:                                          │
│  [0x74] [0x20] [0x02] [0x00]                                 │
│   │      │      └─────┴──── Max 512 bytes per block          │
│   │      └──────────────── Length format (2 bytes)           │
│   └─────────────────────── Positive response SID             │
│                                                              │
│  Postconditions:                                             │
│  ✓ Download state = ACTIVE                                   │
│  ✓ Memory buffer allocated                                   │
│  ✓ Ready to receive Transfer Data (0x36)                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Scenario 2: Session Not Programming

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Wrong Session Type                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Preconditions:                                              │
│  ✗ Session = DEFAULT (0x01) or EXTENDED (0x03)               │
│  ✓ Valid request format                                      │
│                                                              │
│  Request:                                                    │
│  [0x34] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]           │
│  [0x00] [0x00] [0x10] [0x00]                                 │
│                                                              │
│  Expected Response:                                          │
│  [0x7F] [0x34] [0x70]                                        │
│   │      │      └──── Upload/Download Not Accepted           │
│   │      └─────────── Request SID                            │
│   └────────────────── Negative Response                      │
│                                                              │
│  Postconditions:                                             │
│  ✓ No state change                                           │
│  ✓ Download not initiated                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Scenario 3: Security Locked

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Security Not Unlocked                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Preconditions:                                              │
│  ✓ Session = PROGRAMMING (0x02)                              │
│  ✗ Security = LOCKED 🔒                                      │
│  ✓ Valid request format                                      │
│                                                              │
│  Request:                                                    │
│  [0x34] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]           │
│  [0x00] [0x00] [0x10] [0x00]                                 │
│                                                              │
│  Expected Response:                                          │
│  [0x7F] [0x34] [0x33]                                        │
│   │      │      └──── Security Access Denied                 │
│   │      └─────────── Request SID                            │
│   └────────────────── Negative Response                      │
│                                                              │
│  Postconditions:                                             │
│  ✓ Security remains LOCKED                                   │
│  ✓ Download not initiated                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Scenario 4: Invalid Memory Address

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Address Out of Range                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Preconditions:                                              │
│  ✓ Session = PROGRAMMING                                     │
│  ✓ Security = UNLOCKED                                       │
│  ✗ Address = 0xFFFF0000 (outside valid flash)                │
│                                                              │
│  Request:                                                    │
│  [0x34] [0x00] [0x44] [0xFF] [0xFF] [0x00] [0x00]           │
│  [0x00] [0x00] [0x10] [0x00]                                 │
│                                                              │
│  Expected Response:                                          │
│  [0x7F] [0x34] [0x31]                                        │
│   │      │      └──── Request Out of Range                   │
│   │      └─────────── Request SID                            │
│   └────────────────── Negative Response                      │
│                                                              │
│  Postconditions:                                             │
│  ✓ Download not initiated                                    │
│  ✓ No memory allocated                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Scenario 5: Download Already Active

```
┌──────────────────────────────────────────────────────────────┐
│  TEST: Second Request While Download Active                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Preconditions:                                              │
│  ✓ Session = PROGRAMMING                                     │
│  ✓ Security = UNLOCKED                                       │
│  ✗ Download state = ACTIVE (from previous 0x34)              │
│                                                              │
│  Request:                                                    │
│  [0x34] [0x00] [0x44] [0x00] [0x20] [0x00] [0x00]           │
│  [0x00] [0x00] [0x10] [0x00]                                 │
│                                                              │
│  Expected Response:                                          │
│  [0x7F] [0x34] [0x22]                                        │
│   │      │      └──── Conditions Not Correct                 │
│   │      └─────────── Request SID                            │
│   └────────────────── Negative Response                      │
│                                                              │
│  Postconditions:                                             │
│  ✓ Previous download still active                            │
│  ✓ Must complete with 0x37 before new download               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Complete Firmware Download Workflow

```
  Tester                                      ECU
    │                                          │
    │ 1. Switch to Programming Session         │
    │    Request: 0x10 0x02                    │
    │─────────────────────────────────────────>│
    │    Response: 0x50 0x02 [timing]          │
    │<─────────────────────────────────────────│
    │                                          │
    │ 2. Unlock Security                       │
    │    Request Seed: 0x27 0x01               │
    │─────────────────────────────────────────>│
    │    Seed Response: 0x67 0x01 [seed]       │
    │<─────────────────────────────────────────│
    │    Send Key: 0x27 0x02 [key]             │
    │─────────────────────────────────────────>│
    │    Unlock Confirmed: 0x67 0x02           │
    │<─────────────────────────────────────────│
    │                                          │
    │ 3. Initiate Download                     │
    │    Request Download: 0x34 [params]       │
    │─────────────────────────────────────────>│
    │    Max Block Size: 0x74 [size]           │
    │<─────────────────────────────────────────│
    │                                          │
    │ 4. Transfer Data (Loop)                  │
    │    Block 1: 0x36 0x01 [data]             │
    │─────────────────────────────────────────>│
    │    ACK: 0x76 0x01                        │
    │<─────────────────────────────────────────│
    │    Block 2: 0x36 0x02 [data]             │
    │─────────────────────────────────────────>│
    │    ACK: 0x76 0x02                        │
    │<─────────────────────────────────────────│
    │    ... (repeat for all blocks)           │
    │                                          │
    │ 5. Finalize Transfer                     │
    │    Request Exit: 0x37                    │
    │─────────────────────────────────────────>│
    │    Confirm: 0x77                         │
    │<─────────────────────────────────────────│
    │                                          │
    │ 6. Reset ECU (Optional)                  │
    │    ECU Reset: 0x11 0x01                  │
    │─────────────────────────────────────────>│
    │    Confirm: 0x51 0x01                    │
    │<─────────────────────────────────────────│
    │                                          │ [ECU reboots]
    │                                          │
```

### Pattern 2: Multi-Region Download

```
┌──────────────────────────────────────────────────────────────┐
│  SCENARIO: Download to Multiple Memory Regions               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Region 1: Application Flash (0x00100000, 256KB)             │
│  Region 2: Calibration Data (0x00200000, 64KB)               │
│                                                              │
│  Workflow:                                                   │
│                                                              │
│  1. Session + Security (once)                                │
│     └─> 0x10 0x02                                            │
│     └─> 0x27 seed/key                                        │
│                                                              │
│  2. Download Region 1                                        │
│     └─> 0x34 [addr=0x00100000, size=256KB]                   │
│     └─> 0x36 (multiple transfers)                            │
│     └─> 0x37 (exit)                                          │
│                                                              │
│  3. Download Region 2                                        │
│     └─> 0x34 [addr=0x00200000, size=64KB]  ◄── New download │
│     └─> 0x36 (multiple transfers)                            │
│     └─> 0x37 (exit)                                          │
│                                                              │
│  4. ECU Reset                                                │
│     └─> 0x11 0x01                                            │
│                                                              │
│  ⚠️  Each region requires separate 0x34 → 0x36 → 0x37       │
│      sequence!                                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Pattern 3: Error Recovery

```
┌──────────────────────────────────────────────────────────────┐
│  SCENARIO: Transfer Interrupted, Retry Download               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                            ECU                       │
│    │                                │                        │
│    │  Request Download (0x34)       │                        │
│    │───────────────────────────────>│                        │
│    │  Response (0x74)               │                        │
│    │<───────────────────────────────│ Download ACTIVE        │
│    │                                │                        │
│    │  Transfer Data (0x36 0x01)     │                        │
│    │───────────────────────────────>│                        │
│    │  ACK (0x76 0x01)               │                        │
│    │<───────────────────────────────│                        │
│    │                                │                        │
│    │  ⚠️  Communication Error!       │                        │
│    │  (Timeout or corruption)       │                        │
│    │                                │                        │
│    │  Recovery Strategy:            │                        │
│    │                                │                        │
│    │  Option A: Abort & Restart     │                        │
│    │  ─────────────────────────────>│                        │
│    │  Request Transfer Exit (0x37)  │                        │
│    │───────────────────────────────>│                        │
│    │  Confirm (0x77)                │                        │
│    │<───────────────────────────────│ Download IDLE          │
│    │                                │                        │
│    │  Request Download (0x34) Again │                        │
│    │───────────────────────────────>│                        │
│    │  Response (0x74)               │                        │
│    │<───────────────────────────────│ Restart from beginning │
│    │                                │                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### Troubleshooting NRC 0x31 (Out of Range)

```
         ┌─────────────────────┐
         │ Received NRC 0x31   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check Request       │
         │ Parameters          │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Verify        │       │ Verify        │
│ memoryAddress │       │ memorySize    │
└───────┬───────┘       └───────┬───────┘
        │                       │
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check against ECU   │
         │ memory map          │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┬───────────────┐
        │                       │               │
        ▼                       ▼               ▼
┌───────────────┐       ┌───────────────┐   ┌─────────────┐
│ Address <     │       │ Address +     │   │ Address in  │
│ MIN_ADDRESS?  │       │ Size >        │   │ protected   │
│               │       │ MAX_ADDRESS?  │   │ region?     │
└───────┬───────┘       └───────┬───────┘   └──────┬──────┘
        │                       │                  │
       YES                     YES                YES
        │                       │                  │
        └───────────┬───────────┴──────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Adjust address/size │
         │ to valid range      │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Retry Request       │
         │ Download            │
         └─────────────────────┘
```

### Troubleshooting NRC 0x22 (Conditions Not Correct)

```
         ┌─────────────────────┐
         │ Received NRC 0x22   │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Is download already │
    ┌────┤ active?             │────┐
   YES   └─────────────────────┘   NO
    │                               │
    ▼                               ▼
┌──────────────────┐     ┌─────────────────────┐
│ Complete current │     │ Check ECU internal  │
│ download first   │     │ state               │
└────────┬─────────┘     └──────────┬──────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐     ┌─────────────────────┐
│ Send Request     │     │ Possible causes:    │
│ Transfer Exit    │     │ • Flash busy        │
│ (0x37)           │     │ • Memory error      │
└────────┬─────────┘     │ • ECU not ready     │
         │               └──────────┬──────────┘
         ▼                          │
┌──────────────────┐                │
│ Wait for         │                │
│ confirmation     │                │
└────────┬─────────┘                │
         │                          │
         └────────┬─────────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │ Retry Request       │
         │ Download            │
         └─────────────────────┘
```

---

## Best Practices Checklist

### Before Sending Request Download

```
┌──────────────────────────────────────────────────────────────┐
│  ☑️  PRE-REQUEST CHECKLIST                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ] Switched to PROGRAMMING session (0x10 0x02)             │
│  [ ] Security unlocked (0x27 seed/key completed)             │
│  [ ] No active download/upload in progress                   │
│  [ ] Memory address within valid flash range                 │
│  [ ] Memory size > 0 and reasonable                          │
│  [ ] Address + Size doesn't exceed flash boundary            │
│  [ ] Target region not write-protected                       │
│  [ ] ECU voltage stable (11-15V for automotive)              │
│  [ ] Message format follows ISO 14229-1 spec                 │
│  [ ] ALFID matches actual address/size byte counts           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### During Download Process

```
┌──────────────────────────────────────────────────────────────┐
│  ☑️  ACTIVE DOWNLOAD CHECKLIST                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ] Send Tester Present (0x3E) every 2-3 seconds            │
│  [ ] Monitor for session timeout warnings                    │
│  [ ] Respect maxNumberOfBlockLength from ECU                 │
│  [ ] Increment block sequence counter properly (0x36)        │
│  [ ] Verify positive response after each block               │
│  [ ] Handle NRCs gracefully (retry or abort)                 │
│  [ ] Calculate and verify checksum/CRC if required           │
│  [ ] Track total bytes transferred                           │
│  [ ] Don't start new download until 0x37 completes           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### After Download Completion

```
┌──────────────────────────────────────────────────────────────┐
│  ☑️  POST-DOWNLOAD CHECKLIST                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ] Request Transfer Exit (0x37) sent and confirmed         │
│  [ ] ECU verified data integrity (CRC check passed)          │
│  [ ] No NRCs received during finalization                    │
│  [ ] Flash write operation completed successfully            │
│  [ ] ECU reset performed if required (0x11)                  │
│  [ ] Verify new firmware version if applicable               │
│  [ ] Run post-flash diagnostics to check ECU health          │
│  [ ] Document download session (address, size, time)         │
│  [ ] Clear any temporary diagnostic flags                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Common Pitfalls to Avoid

```
┌──────────────────────────────────────────────────────────────┐
│  ❌ COMMON MISTAKES                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✗ Forgetting to unlock security before download             │
│  ✗ Not sending Tester Present during long transfers          │
│  ✗ Sending blocks larger than maxNumberOfBlockLength         │
│  ✗ Starting new download without completing previous one     │
│  ✗ Using wrong ALFID (mismatched byte counts)                │
│  ✗ Attempting download in DEFAULT or EXTENDED session        │
│  ✗ Not handling session timeout gracefully                   │
│  ✗ Ignoring NRCs and retrying blindly                        │
│  ✗ Downloading to bootloader or protected regions            │
│  ✗ Not verifying ECU voltage before programming              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Maximizing Transfer Speed

```
┌──────────────────────────────────────────────────────────────┐
│              TRANSFER SPEED OPTIMIZATION                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Use largest block size ECU supports                      │
│     • Query maxNumberOfBlockLength from 0x74 response        │
│     • Typical: 512-4096 bytes                                │
│                                                              │
│  2. Minimize gaps between transfers                          │
│     • Send next 0x36 immediately after receiving 0x76        │
│     • Pre-prepare next block while waiting for ACK           │
│                                                              │
│  3. Optimize Tester Present timing                           │
│     • Send only when necessary (e.g., every 4 seconds)       │
│     • Use suppress positive response flag (0x80)             │
│                                                              │
│  4. Pipeline requests if ECU supports it                     │
│     • Some ECUs accept next block before responding          │
│     • Check ECU capabilities document                        │
│                                                              │
│  5. Use efficient CAN bus settings                           │
│     • Higher baud rate if supported (500 kbps standard)      │
│     • Minimize bus load from other ECUs                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Transfer Speed Calculation

```
┌──────────────────────────────────────────────────────────────┐
│  Example: Download 256 KB with 512-byte blocks               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Total size: 262,144 bytes                                   │
│  Block size: 512 bytes                                       │
│  Number of blocks: 262,144 / 512 = 512 blocks                │
│                                                              │
│  Time per block (optimistic):                                │
│    Request (0x36):  ~10 ms                                   │
│    Response (0x76): ~5 ms                                    │
│    Total:           15 ms                                    │
│                                                              │
│  Total transfer time:                                        │
│    512 blocks × 15 ms = 7,680 ms ≈ 7.7 seconds               │
│                                                              │
│  Effective data rate:                                        │
│    262,144 bytes / 7.7 s ≈ 34 KB/s                           │
│                                                              │
│  Note: Actual performance varies with:                       │
│  • CAN bus speed                                             │
│  • ECU processing time                                       │
│  • Flash write speed                                         │
│  • Network overhead                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x34 Practical Implementation Guide**
