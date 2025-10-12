# SID 0x36: Transfer Data - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.5

---

## 📋 Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [State Machine Diagrams](#state-machine-diagrams)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [Block Sequence Counter Management](#block-sequence-counter-management)
5. [Testing Scenarios](#testing-scenarios)
6. [Integration Patterns](#integration-patterns)
7. [Debugging Flowcharts](#debugging-flowcharts)
8. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Main Request Handler

```
                    ┌─────────────────────────┐
                    │  Receive Transfer Data  │
                    │  Request (0x36)         │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Extract Message Fields:│
                    │  • SID (Byte 0)         │
                    │  • BSC (Byte 1)         │
                    │  • Data (Byte 2-N)      │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
              ┌─────┤  Session =              │
              │     │  PROGRAMMING (0x02)?    │
              │     └─────────────────────────┘
              │                 │
             NO                YES
              │                 │
              │                 ▼
              │     ┌─────────────────────────┐
              │ ┌───┤  Security =             │
              │ │   │  UNLOCKED?              │
              │ │   └─────────────────────────┘
              │ │               │
              │NO              YES
              │ │               │
              │ │               ▼
              │ │   ┌─────────────────────────┐
              │ │ ┌─┤  Transfer Context       │
              │ │ │ │  Active? (from 0x34)    │
              │ │ │ └─────────────────────────┘
              │ │ │             │
              │ │NO            YES
              │ │ │             │
              │ │ │             ▼
              │ │ │ ┌─────────────────────────┐
              │ │ │ │  Validate BSC =         │
              │ │ │ │  Expected BSC?          │
              │ │ │ └─────────────────────────┘
              │ │ │             │
              │ │ │        ┌────┴────┐
              │ │ │       YES       NO
              │ │ │        │         │
              │ │ │        ▼         ▼
              │ │ │    ┌────┐   ┌────────┐
              │ │ │    │NEXT│   │NRC 0x24│
              │ │ │    └──┬─┘   │Sequence│
              │ │ │       │     │Error   │
              │ │ │       │     └────────┘
              │ │ │       ▼
              │ │ │   ┌─────────────────────────┐
              │ │ │ ┌─┤  Message Length =       │
              │ │ │ │ │  Expected Block Size?   │
              │ │ │ │ └─────────────────────────┘
              │ │ │ │         │
              │ │ │ │    ┌────┴────┐
              │ │ │ │   YES       NO
              │ │ │ │    │         │
              │ │ │ │    ▼         ▼
              │ │ │ │ ┌────┐   ┌────────┐
              │ │ │ │ │NEXT│   │NRC 0x13│
              │ │ │ │ └──┬─┘   │Length  │
              │ │ │ │    │     │Error   │
              │ │ │ │    │     └────────┘
              │ │ │ │    ▼
              │ │ │ │ ┌─────────────────────────┐
              │ │ │ │ │  Check Voltage Range    │
              │ │ │ │ │  (11V - 15.5V)          │
              │ │ │ │ └─────────────────────────┘
              │ │ │ │         │
              │ │ │ │    ┌────┴────────┬────────┐
              │ │ │ │   OK      TOO LOW    TOO HIGH
              │ │ │ │    │         │         │
              │ │ │ │    ▼         ▼         ▼
              │ │ │ │ ┌────┐   ┌────┐   ┌────┐
              │ │ │ │ │NEXT│   │0x93│   │0x92│
              │ │ │ │ └──┬─┘   └────┘   └────┘
              │ │ │ │    │
              │ │ │ │    ▼
              │ │ │ │ ┌─────────────────────────┐
              │ │ │ │ │  Check Memory Address   │
              │ │ │ │ │  Range Valid?           │
              │ │ │ │ └─────────────────────────┘
              │ │ │ │         │
              │ │ │ │    ┌────┴────┐
              │ │ │ │   YES       NO
              │ │ │ │    │         │
              │ │ │ │    ▼         ▼
              │ │ │ │ ┌────┐   ┌────────┐
              │ │ │ │ │NEXT│   │NRC 0x31│
              │ │ │ │ └──┬─┘   │Out of  │
              │ │ │ │    │     │Range   │
              │ │ │ │    │     └────────┘
              │ │ │ │    ▼
              │ │ │ │ ┌─────────────────────────┐
              │ │ │ │ │  Write Data to Memory   │
              │ │ │ │ └───────────┬─────────────┘
              │ │ │ │             │
              │ │ │ │        ┌────┴────┐
              │ │ │ │     SUCCESS    FAIL
              │ │ │ │        │         │
              │ │ │ │        ▼         ▼
              │ │ │ │    ┌────┐   ┌────────┐
              │ │ │ │    │NEXT│   │NRC 0x72│
              │ │ │ │    └──┬─┘   │Program │
              │ │ │ │       │     │Failure │
              │ │ │ │       │     └────────┘
              │ │ │ │       ▼
              │ │ │ │   ┌─────────────────────────┐
              │ │ │ │   │  Increment Expected BSC │
              │ │ │ │   │  (Wrap at 0xFF → 0x01)  │
              │ │ │ │   └───────────┬─────────────┘
              │ │ │ │               │
              │ │ │ │               ▼
              │ │ │ │   ┌─────────────────────────┐
              │ │ │ │   │  Send Positive Response │
              │ │ │ │   │  0x76 + BSC             │
              │ │ │ │   └─────────────────────────┘
              │ │ │ │               │
              │ │ │ │               ▼
              │ │ │ │           ┌────────┐
              │ │ │ │           │  DONE  │
              │ │ │ │           └────────┘
              │ │ │ │
              │ │ │ └──▶ ┌────────────────┐
              │ │ └────▶ │  NRC 0x22      │
              │ └──────▶ │  Conditions    │
              └────────▶ │  Not Correct   │
                         └────────────────┘
```

---

## State Machine Diagrams

### Transfer State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│              TRANSFER DATA STATE MACHINE                        │
└─────────────────────────────────────────────────────────────────┘


           ┌──────────────────┐
           │  IDLE            │
           │  (No Transfer)   │
           └────────┬─────────┘
                    │
                    │ SID 0x34 Request Download
                    │ (or SID 0x35 Request Upload)
                    ▼
           ┌──────────────────┐
           │  TRANSFER_READY  │
           │  (Awaiting Block)│
           └────────┬─────────┘
                    │
                    │ SID 0x36 (BSC = 1)
                    ▼
           ┌──────────────────┐
           │  TRANSFERRING    │◀──────────┐
           │  (Active)        │           │
           └────────┬─────────┘           │
                    │                     │
              ┌─────┴─────┐               │
              │           │               │
        More Blocks    All Blocks         │
        Remaining      Received           │
              │           │               │
              │           │               │
      SID 0x36 Next   SID 0x37            │
      Block (BSC++)   Transfer Exit       │
              │           │               │
              └───────────┘               │
                    │                     │
                    │                     │
    ┌───────────────┼─────────────────────┼─────────┐
    │               │                     │         │
    │ Error         │ Suspend             │ Success │
    │ (NRC 0x72)    │ (NRC 0x71)          │         │
    ▼               ▼                     ▼         │
┌────────┐    ┌──────────────┐    ┌──────────────┐ │
│ FAILED │    │  SUSPENDED   │    │  COMPLETED   │ │
│        │    │              │    │              │ │
└────────┘    └──────┬───────┘    └──────────────┘ │
                     │                              │
                     │ Condition Cleared            │
                     │ Retry SID 0x36               │
                     └──────────────────────────────┘


  State Transitions:
  ─────────────────
  IDLE → TRANSFER_READY:     SID 0x34/0x35 success
  TRANSFER_READY → TRANSFERRING:  First SID 0x36 (BSC=1)
  TRANSFERRING → TRANSFERRING:    Subsequent SID 0x36 (BSC++)
  TRANSFERRING → COMPLETED:   SID 0x37 (all blocks received)
  TRANSFERRING → SUSPENDED:   NRC 0x71 (voltage/temp issue)
  TRANSFERRING → FAILED:      NRC 0x72 (programming failure)
  SUSPENDED → TRANSFERRING:   Retry same block after recovery
  COMPLETED → IDLE:           New session or reset
  FAILED → IDLE:              ECU reset required
```

### Session State Impact

```
┌─────────────────────────────────────────────────────────────────┐
│           SESSION STATE vs TRANSFER AVAILABILITY                │
└─────────────────────────────────────────────────────────────────┘


  ┌─────────────────────┐
  │  DEFAULT SESSION    │
  │  (0x01)             │
  └──────────┬──────────┘
             │
             │ SID 0x36 Request
             ▼
       ┌──────────┐
       │ NRC 0x7F │  ← Service Not Supported
       │ or 0x22  │     in Current Session
       └──────────┘


  ┌─────────────────────┐
  │  EXTENDED SESSION   │
  │  (0x03)             │
  └──────────┬──────────┘
             │
             │ SID 0x34 → SID 0x36
             ▼
       ┌──────────┐
       │ SUCCESS  │  ✓ Transfer Data Allowed
       │  0x76    │    (with security unlock)
       └──────────┘


  ┌─────────────────────┐
  │ PROGRAMMING SESSION │
  │  (0x02)             │
  └──────────┬──────────┘
             │
             │ SID 0x34 → SID 0x36
             ▼
       ┌──────────┐
       │ SUCCESS  │  ✓ Transfer Data Allowed
       │  0x76    │    (with security unlock)
       └──────────┘
```

---

## NRC Decision Trees

### Complete NRC Decision Tree

```
                      Transfer Data Request (0x36)
                                │
                                ▼
                    ┌───────────────────────┐
               ┌────┤ Session Check         │
               │    └───────────────────────┘
               │                │
          NOT PROG/EXT         PROG/EXT
               │                │
               ▼                ▼
          ┌────────┐    ┌───────────────────────┐
          │NRC 0x7F│ ┌──┤ Security Check        │
          │or 0x22 │ │  └───────────────────────┘
          └────────┘ │              │
                    LOCKED         UNLOCKED
                     │              │
                     ▼              ▼
                ┌────────┐  ┌───────────────────────┐
                │NRC 0x33│┌─┤ Transfer Context?     │
                └────────┘│ └───────────────────────┘
                          │            │
                       NO CONTEXT    CONTEXT EXISTS
                          │            │
                          ▼            ▼
                     ┌────────┐ ┌───────────────────────┐
                     │NRC 0x22│┌┤ BSC Sequential?       │
                     └────────┘││└───────────────────────┘
                               ││           │
                              NO          YES
                               ││           │
                               ▼▼           ▼
                          ┌────────┐ ┌───────────────────────┐
                          │NRC 0x24│┌┤ Message Length OK?    │
                          └────────┘││└───────────────────────┘
                                    ││           │
                                   NO          YES
                                    ││           │
                                    ▼▼           ▼
                               ┌────────┐ ┌───────────────────────┐
                               │NRC 0x13│┌┤ Voltage in Range?     │
                               └────────┘││└───────────────────────┘
                                         ││           │
                                      TOO LOW      ┌──┴───┐
                                      TOO HIGH    OK   TOO HIGH
                                         ││        │      │
                                         ▼▼        │      ▼
                                    ┌────────┐    │  ┌────────┐
                                    │NRC 0x93│    │  │NRC 0x92│
                                    │or 0x92 │    │  └────────┘
                                    └────────┘    │
                                                  ▼
                                         ┌───────────────────────┐
                                       ┌─┤ Address in Range?     │
                                       │ └───────────────────────┘
                                       │            │
                                      NO          YES
                                       │            │
                                       ▼            ▼
                                  ┌────────┐ ┌───────────────────────┐
                                  │NRC 0x31│ │ Write to Memory       │
                                  └────────┘ └───────┬───────────────┘
                                                     │
                                                ┌────┴────┐
                                              FAIL      SUCCESS
                                                │          │
                                                ▼          ▼
                                           ┌────────┐ ┌────────┐
                                           │NRC 0x72│ │ 0x76   │
                                           └────────┘ │ + BSC  │
                                                      └────────┘
```

### Quick NRC Reference Decision

```
┌──────────────────────────────────────────────────────────┐
│           WHICH NRC TO RETURN? QUICK GUIDE               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Session not programming/extended?  →  NRC 0x7F or 0x22 │
│  Security locked?                   →  NRC 0x33         │
│  No active transfer context?        →  NRC 0x22         │
│  BSC out of sequence?               →  NRC 0x24         │
│  Message length wrong?              →  NRC 0x13         │
│  Voltage too low?                   →  NRC 0x93         │
│  Voltage too high?                  →  NRC 0x92         │
│  Memory address out of range?       →  NRC 0x31         │
│  Flash write failed?                →  NRC 0x72         │
│  Temporary resource issue?          →  NRC 0x71         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Block Sequence Counter Management

### BSC Incrementing Algorithm

```
         ┌─────────────────────────┐
         │  Initialize:            │
         │  Expected_BSC = 0x01    │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
    ┌───▶│  Receive Request        │
    │    │  Extract Received_BSC   │
    │    └───────────┬─────────────┘
    │                │
    │                ▼
    │    ┌─────────────────────────┐
    │ ┌──┤  Received_BSC ==        │
    │ │  │  Expected_BSC?          │
    │ │  └─────────────────────────┘
    │ │              │
    │ │         ┌────┴────┐
    │ │        YES       NO
    │ │         │         │
    │ │         ▼         ▼
    │ │    ┌────────┐ ┌──────────┐
    │ │    │PROCESS │ │NRC 0x24  │
    │ │    │DATA    │ │RETURN    │
    │ │    └───┬────┘ └──────────┘
    │ │        │
    │ │        ▼
    │ │    ┌─────────────────────────┐
    │ │    │  Increment Expected_BSC │
    │ │    └───────────┬─────────────┘
    │ │                │
    │ │                ▼
    │ │    ┌─────────────────────────┐
    │ │ ┌──┤  Expected_BSC == 0x00?  │
    │ │ │  │  (after increment)      │
    │ │ │  └─────────────────────────┘
    │ │ │              │
    │ │ │         ┌────┴────┐
    │ │ │        YES       NO
    │ │ │         │         │
    │ │ │         ▼         ▼
    │ │ │  ┌──────────┐ ┌──────────┐
    │ │ │  │Set to 1  │ │Keep Value│
    │ │ │  │BSC=0x01  │ │          │
    │ │ │  └────┬─────┘ └─────┬────┘
    │ │ │       │             │
    │ │ └───────┴─────────────┘
    │ │                │
    │ │                ▼
    │ │    ┌─────────────────────────┐
    │ │    │  Send Response 0x76+BSC │
    │ │    └───────────┬─────────────┘
    │ │                │
    │ │                ▼
    │ │    ┌─────────────────────────┐
    │ └───▶│  More blocks expected?  │
    │      └───────────┬─────────────┘
    │                  │
    │             ┌────┴────┐
    │            YES       NO
    │             │         │
    └─────────────┘         ▼
                        ┌────────┐
                        │ DONE   │
                        │ Await  │
                        │ 0x37   │
                        └────────┘


  Wrap-Around Example:
  ────────────────────
  Expected_BSC = 0xFE  →  Process  →  Increment  →  Expected_BSC = 0xFF
  Expected_BSC = 0xFF  →  Process  →  Increment  →  Expected_BSC = 0x00 → SET TO 0x01
  Expected_BSC = 0x01  →  Process  →  Increment  →  Expected_BSC = 0x02
```

### BSC Validation Pseudocode (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│              BSC VALIDATION LOGIC                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT:  Received_BSC (from request byte 1)                 │
│  STATE:  Expected_BSC (maintained by ECU)                   │
│                                                             │
│  STEP 1: Compare                                            │
│  ┌─────────────────────────────────────────────┐            │
│  │  IF Received_BSC == Expected_BSC THEN       │            │
│  │     GOTO STEP 2                             │            │
│  │  ELSE                                       │            │
│  │     RETURN NRC 0x24                         │            │
│  │  END IF                                     │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  STEP 2: Process Data                                       │
│  ┌─────────────────────────────────────────────┐            │
│  │  Process transfer data block                │            │
│  │  Write to memory                            │            │
│  │  IF write_success THEN                      │            │
│  │     GOTO STEP 3                             │            │
│  │  ELSE                                       │            │
│  │     RETURN NRC 0x72                         │            │
│  │  END IF                                     │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  STEP 3: Increment BSC                                      │
│  ┌─────────────────────────────────────────────┐            │
│  │  Expected_BSC = Expected_BSC + 1            │            │
│  │  IF Expected_BSC > 0xFF THEN                │            │
│  │     Expected_BSC = 0x01  (wrap-around)      │            │
│  │  END IF                                     │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  STEP 4: Send Response                                      │
│  ┌─────────────────────────────────────────────┐            │
│  │  RETURN 0x76 + Received_BSC                 │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Scenario 1: Normal Sequential Transfer

```
┌─────────────────────────────────────────────────────────────┐
│  TEST: Normal Sequential Transfer (4 blocks)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│    • Session: PROGRAMMING (0x02)                            │
│    • Security: UNLOCKED                                     │
│    • SID 0x34 completed: 4096 bytes, 1024 bytes/block       │
│                                                             │
│  Test Steps:                                                │
│                                                             │
│    Step 1:  Send 36 01 [1024 bytes]                         │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 2:  Send 36 02 [1024 bytes]                         │
│            Expected: 76 02  ✓                               │
│                                                             │
│    Step 3:  Send 36 03 [1024 bytes]                         │
│            Expected: 76 03  ✓                               │
│                                                             │
│    Step 4:  Send 36 04 [1024 bytes]                         │
│            Expected: 76 04  ✓                               │
│                                                             │
│    Step 5:  Send 37 (Request Transfer Exit)                 │
│            Expected: 77  ✓                                  │
│                                                             │
│  Pass Criteria:                                             │
│    ✓ All responses are positive (0x76)                      │
│    ✓ BSC echoed correctly in each response                  │
│    ✓ Transfer exit successful                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Scenario 2: BSC Sequence Error

```
┌─────────────────────────────────────────────────────────────┐
│  TEST: Block Sequence Error Detection                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│    • Session: PROGRAMMING (0x02)                            │
│    • Security: UNLOCKED                                     │
│    • SID 0x34 completed                                     │
│                                                             │
│  Test Steps:                                                │
│                                                             │
│    Step 1:  Send 36 01 [1024 bytes]                         │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 2:  Send 36 01 [1024 bytes]  ← REPEAT BSC!          │
│            Expected: 7F 36 24  ✓ (Sequence Error)           │
│                                                             │
│    Step 3:  Restart with SID 0x34                           │
│            Expected: 74 [params]  ✓                         │
│                                                             │
│    Step 4:  Send 36 01 [1024 bytes]                         │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 5:  Send 36 03 [1024 bytes]  ← SKIP BSC 02!         │
│            Expected: 7F 36 24  ✓ (Sequence Error)           │
│                                                             │
│  Pass Criteria:                                             │
│    ✓ NRC 0x24 returned for duplicate BSC                    │
│    ✓ NRC 0x24 returned for skipped BSC                      │
│    ✓ Transfer can restart after error                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Scenario 3: BSC Wrap-Around

```
┌─────────────────────────────────────────────────────────────┐
│  TEST: Block Sequence Counter Wrap-Around                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│    • Large transfer requiring > 255 blocks                  │
│    • Block size: 256 bytes                                  │
│    • Total size: 65792 bytes (257 blocks)                   │
│                                                             │
│  Test Steps:                                                │
│                                                             │
│    Step 1-254:  Send blocks BSC 0x01 to 0xFE                │
│                Expected: 76 01 ... 76 FE  ✓                 │
│                                                             │
│    Step 255:    Send 36 FF [256 bytes]                      │
│                Expected: 76 FF  ✓                           │
│                                                             │
│    Step 256:    Send 36 01 [256 bytes]  ← WRAP TO 0x01      │
│                Expected: 76 01  ✓                           │
│                                                             │
│    Step 257:    Send 36 02 [256 bytes]                      │
│                Expected: 76 02  ✓                           │
│                                                             │
│    Final:       Send 37 (Transfer Exit)                     │
│                Expected: 77  ✓                              │
│                                                             │
│  Pass Criteria:                                             │
│    ✓ BSC wraps from 0xFF to 0x01 (not 0x00)                 │
│    ✓ No sequence errors at wrap boundary                    │
│    ✓ All 257 blocks transferred successfully                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Scenario 4: Voltage Drop During Transfer

```
┌─────────────────────────────────────────────────────────────┐
│  TEST: Voltage Drop Handling                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│    • Session: PROGRAMMING (0x02)                            │
│    • Security: UNLOCKED                                     │
│    • SID 0x34 completed                                     │
│    • Voltage monitoring: 11.0V - 15.5V range                │
│                                                             │
│  Test Steps:                                                │
│                                                             │
│    Step 1:  Voltage = 12.5V                                 │
│            Send 36 01 [1024 bytes]                          │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 2:  Voltage = 12.3V                                 │
│            Send 36 02 [1024 bytes]                          │
│            Expected: 76 02  ✓                               │
│                                                             │
│    Step 3:  Voltage = 10.8V  ← DROPS BELOW 11.0V            │
│            Send 36 03 [1024 bytes]                          │
│            Expected: 7F 36 93  ✓ (Voltage Too Low)          │
│                                                             │
│    Step 4:  Voltage = 12.5V  ← RECOVERS                     │
│            Send 36 03 [1024 bytes]  ← RETRY SAME BLOCK      │
│            Expected: 76 03  ✓                               │
│                                                             │
│    Step 5:  Continue normal transfer                        │
│            Send 36 04 [1024 bytes]                          │
│            Expected: 76 04  ✓                               │
│                                                             │
│  Pass Criteria:                                             │
│    ✓ NRC 0x93 returned when voltage too low                 │
│    ✓ Can retry same BSC after voltage recovery              │
│    ✓ Transfer continues normally after recovery             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Scenario 5: Message Length Validation

```
┌─────────────────────────────────────────────────────────────┐
│  TEST: Message Length Validation                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:                                                     │
│    • Session: PROGRAMMING (0x02)                            │
│    • Security: UNLOCKED                                     │
│    • SID 0x34: Block size = 1024 bytes                      │
│                                                             │
│  Test Steps:                                                │
│                                                             │
│    Step 1:  Send 36 01 [1024 bytes]  ← CORRECT SIZE         │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 2:  Send 36 02 [512 bytes]  ← TOO SHORT             │
│            Expected: 7F 36 13  ✓ (Incorrect Length)         │
│                                                             │
│    Step 3:  Restart transfer (SID 0x34)                     │
│            Expected: 74 [params]  ✓                         │
│                                                             │
│    Step 4:  Send 36 01 [1024 bytes]                         │
│            Expected: 76 01  ✓                               │
│                                                             │
│    Step 5:  Send 36 02 [2048 bytes]  ← TOO LONG             │
│            Expected: 7F 36 13  ✓ (Incorrect Length)         │
│                                                             │
│  Pass Criteria:                                             │
│    ✓ NRC 0x13 for blocks shorter than expected              │
│    ✓ NRC 0x13 for blocks longer than expected               │
│    ✓ Only exact block size accepted                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Flash Download with Checksum Verification

```
  Tester                                    ECU
    │                                        │
    │  1. Enter Programming Session          │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  2. Unlock Security                    │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  3. SID 0x34 Request Download          │
    │     Address: 0x00010000                │
    │     Size:    0x00010000 (64KB)         │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     maxBlockLength: 4096               │
    │                                        │
    │  4. Transfer Loop (16 blocks):         │
    │     ┌──────────────────────────┐       │
    │     │  FOR i = 1 TO 16:        │       │
    │     │    SID 0x36 [BSC=i]      │       │
    │     │    [4096 bytes]          │       │
    │  ───┼──────────────────────────┼────▶  │
    │  ◀──┼──────────────────────────┼─────  │
    │     │    Response: 76 [BSC=i]  │       │
    │     │  END FOR                 │       │
    │     └──────────────────────────┘       │
    │                                        │
    │  5. SID 0x37 Request Transfer Exit     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 77                       │
    │                                        │
    │  6. SID 0x31 Checksum Routine          │
    │     Routine ID: 0x0202                 │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Checksum: OK ✓                     │
    │                                        │
    │  7. SID 0x11 ECU Reset                 │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │     ECU reboots with new software      │
    │                                        │
```

### Pattern 2: Multi-Region Flash Programming

```
  Tester                                    ECU
    │                                        │
    │  Session + Security Setup              │
    │  (Same as Pattern 1)                   │
    │                                        │
    │  ┌─────────────────────────────────┐   │
    │  │  REGION 1: Application (128KB)  │   │
    │  └─────────────────────────────────┘   │
    │                                        │
    │  SID 0x34: Address=0x10000, Size=128KB │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  SID 0x36: Transfer 32 blocks          │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │  (BSC: 01 → 02 → ... → 20)             │
    │                                        │
    │  SID 0x37: Exit Transfer               │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  ┌─────────────────────────────────┐   │
    │  │  REGION 2: Calibration (64KB)   │   │
    │  └─────────────────────────────────┘   │
    │                                        │
    │  SID 0x34: Address=0x30000, Size=64KB  │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  SID 0x36: Transfer 16 blocks          │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │  (BSC: 01 → 02 → ... → 10)  ← RESTARTS │
    │                                        │
    │  SID 0x37: Exit Transfer               │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  ┌─────────────────────────────────┐   │
    │  │  REGION 3: Bootloader (32KB)    │   │
    │  └─────────────────────────────────┘   │
    │                                        │
    │  SID 0x34: Address=0x00000, Size=32KB  │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  SID 0x36: Transfer 8 blocks           │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │  (BSC: 01 → 02 → ... → 08)  ← RESTARTS │
    │                                        │
    │  SID 0x37: Exit Transfer               │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  Final Verification + Reset            │
    │                                        │

  ⚠️  NOTE: BSC restarts at 0x01 for each new SID 0x34
```

### Pattern 3: Upload with Transfer Data

```
  Tester                                    ECU
    │                                        │
    │  1. Enter Extended Session             │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  2. Unlock Security                    │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │                                        │
    │  3. SID 0x35 Request Upload            │
    │     Address: 0x00020000                │
    │     Size:    0x00001000 (4KB)          │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     maxBlockLength: 1024               │
    │                                        │
    │  4. SID 0x36 Transfer Data (Upload)    │
    │     Request: 36 01                     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 76 01 [1024 bytes data]  │
    │                                        │
    │     Request: 36 02                     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 76 02 [1024 bytes data]  │
    │                                        │
    │     Request: 36 03                     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 76 03 [1024 bytes data]  │
    │                                        │
    │     Request: 36 04                     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 76 04 [1024 bytes data]  │
    │                                        │
    │  5. SID 0x37 Request Transfer Exit     │
    │  ───────────────────────────────────▶  │
    │  ◀───────────────────────────────────  │
    │     Response: 77                       │
    │                                        │
    │  ✓ Upload Complete (4KB read from ECU) │
    │                                        │
```

---

## Debugging Flowcharts

### Debugging: Transfer Fails to Start

```
         ┌──────────────────────────┐
         │  Transfer Data (0x36)    │
         │  Returns NRC             │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
      ┌──┤  Which NRC Received?     │
      │  └──────────────────────────┘
      │              │
      │         ┌────┴───────────┬──────────┬─────────┐
      │        0x7F              0x22       0x33      0x24
      │         │                 │          │         │
      │         ▼                 ▼          ▼         ▼
      │  ┌──────────┐      ┌──────────┐ ┌────────┐ ┌────────┐
      │  │ Service  │      │Conditions│ │Security│ │Sequence│
      │  │Not Sup-  │      │Not       │ │Access  │ │Error   │
      │  │ported    │      │Correct   │ │Denied  │ │        │
      │  └─────┬────┘      └─────┬────┘ └────┬───┘ └────┬───┘
      │        │                 │           │          │
      │        ▼                 ▼           ▼          ▼
      │  ┌──────────┐      ┌──────────┐ ┌────────┐ ┌────────┐
      │  │Check     │      │Check:    │ │Perform │ │Check   │
      │  │Session:  │      │• Active  │ │SID 0x27│ │if SID  │
      │  │Must be   │      │  Transfer│ │Security│ │0x34    │
      │  │0x02/0x03 │      │  Context?│ │Access  │ │was     │
      │  └──────────┘      │• Voltage?│ └────────┘ │called  │
      │                    │• Memory? │            │first   │
      │                    └──────────┘            └────────┘
      │
      └─────▶ Resolve issue and retry
```

### Debugging: Transfer Stops Mid-Way

```
         ┌──────────────────────────┐
         │  Transfer Stopped        │
         │  After Block N           │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
      ┌──┤  What was last response? │
      │  └──────────────────────────┘
      │              │
      │         ┌────┴───────┬──────────┬─────────┐
      │      NRC 0x71       0x72       0x93      Timeout
      │         │            │          │           │
      │         ▼            ▼          ▼           ▼
      │  ┌──────────┐  ┌────────┐ ┌────────┐ ┌──────────┐
      │  │Transfer  │  │Program │ │Voltage │ │ECU Not   │
      │  │Suspended │  │Failure │ │Too Low │ │Responding│
      │  └─────┬────┘  └────┬───┘ └────┬───┘ └─────┬────┘
      │        │            │          │           │
      │        ▼            ▼          ▼           ▼
      │  ┌──────────┐  ┌────────┐ ┌────────┐ ┌──────────┐
      │  │Wait for  │  │CRITICAL│ │Check   │ │Check:    │
      │  │condition │  │STOP!   │ │battery │ │• CAN bus │
      │  │to clear  │  │Reset   │ │voltage │ │• P2 time │
      │  │then retry│  │ECU and │ │Connect │ │• Session │
      │  │same BSC  │  │restart │ │charger │ │timeout   │
      │  └──────────┘  │from    │ └────────┘ └──────────┘
      │                │SID 0x10│
      │                └────────┘
      │
      └─────▶ Follow resolution steps
```

### Debugging: BSC Sequence Errors

```
         ┌──────────────────────────┐
         │  Receiving NRC 0x24      │
         │  (Sequence Error)        │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │  Check BSC Pattern:      │
         │  What was sent?          │
         └────────────┬─────────────┘
                      │
         ┌────────────┼────────────┬──────────┐
         │            │            │          │
    Duplicated    Skipped      Wrong       Wrap
    Same BSC      Number       Start       Issue
         │            │            │          │
         ▼            ▼            ▼          ▼
    ┌────────┐  ┌────────┐  ┌────────┐ ┌────────┐
    │Fix:    │  │Fix:    │  │Fix:    │ │Fix:    │
    │Track   │  │Ensure  │  │Always  │ │After   │
    │sent    │  │incre-  │  │start   │ │0xFF    │
    │BSC and │  │mental  │  │with    │ │use     │
    │don't   │  │BSC:    │  │BSC=0x01│ │0x01    │
    │repeat  │  │1,2,3...│  │after   │ │NOT     │
    │        │  │        │  │SID 0x34│ │0x00    │
    └────┬───┘  └────┬───┘  └────┬───┘ └────┬───┘
         │           │           │          │
         └───────────┴───────────┴──────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │  Restart Transfer:       │
         │  1. SID 0x34 again       │
         │  2. Start BSC from 0x01  │
         │  3. Maintain sequence    │
         └──────────────────────────┘
```

---

## Best Practices Checklist

### Pre-Transfer Checklist

```
┌─────────────────────────────────────────────────────────────┐
│              BEFORE STARTING TRANSFER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐  Session established (PROGRAMMING or EXTENDED)           │
│  ☐  Security unlocked (SID 0x27 completed)                  │
│  ☐  SID 0x34 (Request Download) or 0x35 successful          │
│  ☐  Max block length noted from 0x34/0x35 response          │
│  ☐  Total transfer size known                               │
│  ☐  Number of blocks calculated                             │
│  ☐  Voltage stable (11V - 15.5V typical)                    │
│  ☐  External power supply connected (recommended)           │
│  ☐  Tester Present (0x3E) strategy planned for long ops     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### During Transfer Checklist

```
┌─────────────────────────────────────────────────────────────┐
│              DURING TRANSFER OPERATIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐  Start with BSC = 0x01 for first block                   │
│  ☐  Increment BSC sequentially (1, 2, 3, ...)               │
│  ☐  Send exactly maxBlockLength bytes (except last block)   │
│  ☐  Handle wrap-around: 0xFF → 0x01                         │
│  ☐  Verify positive response (0x76) before next block       │
│  ☐  Monitor for NRC 0x71 (suspend) - retry same BSC         │
│  ☐  Monitor voltage continuously                            │
│  ☐  Track cumulative bytes transferred                      │
│  ☐  Send Tester Present (0x3E) if transfer takes > 5 sec    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Post-Transfer Checklist

```
┌─────────────────────────────────────────────────────────────┐
│              AFTER TRANSFER COMPLETE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐  All calculated blocks transferred                       │
│  ☐  SID 0x37 (Request Transfer Exit) sent                   │
│  ☐  Positive response (0x77) received                       │
│  ☐  Optional: Run checksum routine (SID 0x31)               │
│  ☐  Optional: Verify programming with SID 0x22 DID read     │
│  ☐  Reset ECU if required (SID 0x11)                        │
│  ☐  Verify new software boots correctly                     │
│  ☐  Clear any DTCs generated during programming             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling Checklist

```
┌─────────────────────────────────────────────────────────────┐
│              ERROR HANDLING STRATEGIES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐  NRC 0x24 (Sequence): Restart with SID 0x34              │
│  ☐  NRC 0x71 (Suspend): Wait and retry same BSC             │
│  ☐  NRC 0x72 (Failure): STOP, reset ECU, restart all        │
│  ☐  NRC 0x93 (Low V): Wait for voltage, retry same BSC      │
│  ☐  NRC 0x92 (High V): Check power supply, retry            │
│  ☐  NRC 0x13 (Length): Verify block size calculation        │
│  ☐  NRC 0x31 (Range): Check memory addresses and size       │
│  ☐  Timeout: Check CAN bus, session timeout, retry          │
│  ☐  Log all errors with BSC number for debugging            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization Checklist

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐  Use largest block size supported by ECU                 │
│  ☐  Minimize delay between blocks (but respect P2 timing)   │
│  ☐  Use CAN bus at maximum supported baud rate              │
│  ☐  Avoid unnecessary logging during critical transfer      │
│  ☐  Pre-calculate all blocks before starting transfer       │
│  ☐  Use flow control if supported (ISO-TP)                  │
│  ☐  Consider multi-frame CAN messages for efficiency        │
│  ☐  Monitor transfer rate (bytes/second)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│         SID 0x36 PRACTICAL IMPLEMENTATION SUMMARY           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Validate ALL prerequisites before accepting transfer     │
│  ✓ Maintain strict BSC sequence tracking                    │
│  ✓ Handle wrap-around correctly (0xFF → 0x01)               │
│  ✓ Validate message length matches expected block size      │
│  ✓ Monitor voltage continuously during programming          │
│  ✓ Distinguish between recoverable (0x71) and critical      │
│    errors (0x72)                                            │
│  ✓ Support suspend/resume for temporary conditions          │
│  ✓ Implement proper state machine for transfer context      │
│  ✓ Test wrap-around scenarios with large transfers          │
│  ✓ Always complete with SID 0x37 before considering done    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Next Steps:**
- Read: [SID_36_SERVICE_INTERACTIONS.md](SID_36_SERVICE_INTERACTIONS.md) - Complete workflow examples
- Review: [SID_36_TRANSFER_DATA.md](SID_36_TRANSFER_DATA.md) - Theoretical concepts
