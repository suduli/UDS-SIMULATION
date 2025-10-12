# SID 0x35: Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.6

---

## Table of Contents
1. [Request Processing Flowchart](#request-processing-flowchart)
2. [Upload State Machine](#upload-state-machine)
3. [NRC Decision Tree](#nrc-decision-tree)
4. [Memory Validation](#memory-validation)
5. [Session Timeout Handling](#session-timeout-handling)
6. [Testing Scenarios](#testing-scenarios)
7. [Integration Patterns](#integration-patterns)
8. [Debugging Flowcharts](#debugging-flowcharts)
9. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Complete Upload Request Handler

```
                        START: Request Upload (0x35) Received
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │ Parse Request Message         │
                        │ Extract: DFI, ALFID, Address, │
                        │          Size                 │
                        └───────────┬───────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────────────┐
                        │ Validate Message Length       │
                        │ Expected = 3 + addr_len +     │
                        │            size_len            │
                        └───────────┬───────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                  VALID                          INVALID
                    │                               │
                    ▼                               ▼
         ┌──────────────────────┐      ┌───────────────────────┐
         │ Check Session Type   │      │ Send NRC 0x13         │
         │ Required: PROG (0x02)│      │ (Incorrect Length)    │
         └──────────┬───────────┘      └───────────────────────┘
                    │                               │
        ┌───────────┴───────────┐                   ▼
        │                       │                  END
    SESSION                  SESSION
      OK                     WRONG
        │                       │
        ▼                       ▼
┌────────────────┐   ┌──────────────────────┐
│ Check Security │   │ Send NRC 0x70        │
│ State          │   │ (Upload Not Accepted)│
└────────┬───────┘   └──────────────────────┘
         │                       │
 ┌───────┴────────┐              ▼
 │                │             END
UNLOCKED        LOCKED
 │                │
 ▼                ▼
┌────────────┐  ┌──────────────────────┐
│ Check      │  │ Send NRC 0x33        │
│ Upload     │  │ (Security Denied)    │
│ State      │  └──────────────────────┘
└─────┬──────┘             │
      │                    ▼
┌─────┴─────┐             END
│           │
IDLE     ACTIVE
│           │
▼           ▼
┌────┐  ┌──────────────────────┐
│    │  │ Send NRC 0x22        │
│    │  │ (Conditions Not      │
│    │  │  Correct)            │
│    │  └──────────────────────┘
│    │             │
│    │             ▼
│    │            END
│    │
│    ▼
│  ┌──────────────────────────┐
│  │ Validate Memory Address  │
│  │ Check: Address in valid  │
│  │        range             │
│  └──────────┬───────────────┘
│             │
│   ┌─────────┴──────────┐
│   │                    │
│  VALID              INVALID
│   │                    │
│   ▼                    ▼
│ ┌─────────────┐  ┌──────────────────┐
│ │ Validate    │  │ Send NRC 0x31    │
│ │ Memory Size │  │ (Out of Range)   │
│ └──────┬──────┘  └──────────────────┘
│        │                  │
│  ┌─────┴──────┐           ▼
│  │            │          END
│ VALID      INVALID
│  │            │
│  ▼            ▼
│┌──────┐ ┌──────────────────┐
││      │ │ Send NRC 0x31    │
││      │ │ (Out of Range)   │
││      │ └──────────────────┘
││      │          │
││      │          ▼
││      │         END
││      │
││      ▼
││ ┌──────────────────────────┐
││ │ Check Memory Region      │
││ │ Permissions              │
││ └──────────┬───────────────┘
││            │
││  ┌─────────┴──────────┐
││  │                    │
││ ALLOWED            FORBIDDEN
││  │                    │
││  ▼                    ▼
││┌─────────────┐  ┌──────────────────┐
│││ Prepare     │  │ Send NRC 0x31    │
│││ Upload      │  │ (Out of Range)   │
│││ Buffer      │  └──────────────────┘
││└──────┬──────┘           │
││       │                  ▼
││  ┌────┴─────┐           END
││  │          │
││SUCCESS    FAILURE
││  │          │
││  ▼          ▼
││┌────┐ ┌──────────────────┐
│││    │ │ Send NRC 0x72    │
│││    │ │ (Programming     │
│││    │ │  Failure)        │
│││    │ └──────────────────┘
│││    │          │
│││    │          ▼
│││    │         END
│││    │
│││    ▼
│││ ┌──────────────────────────┐
│││ │ Calculate Max Block Size │
│││ │ Based on: Buffer size,   │
│││ │          Network MTU     │
│││ └──────────┬───────────────┘
│││            │
│││            ▼
│││ ┌──────────────────────────┐
│││ │ Set Upload State ACTIVE  │
│││ │ Store: Address, Size,    │
│││ │        Current Offset    │
│││ └──────────┬───────────────┘
│││            │
│││            ▼
│││ ┌──────────────────────────┐
│││ │ Build Positive Response  │
│││ │ [0x75][LFI][maxBlock]    │
│││ └──────────┬───────────────┘
│││            │
│││            ▼
│││        Send Response
│││            │
│││            ▼
│││           END
```

---

## Upload State Machine

### State Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    UPLOAD STATE MACHINE                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                         ┌──────────┐                           │
│                         │   IDLE   │ ◄─────────────┐           │
│                         └────┬─────┘               │           │
│                              │                     │           │
│                Request Upload(0x35)          Reset ECU         │
│                              │               Session Timeout   │
│                              ▼                     │           │
│                    ┌──────────────────┐            │           │
│         ┌──────────│ UPLOAD_ACTIVE    │────────────┘           │
│         │          │                  │                        │
│         │          │ Waiting for 0x36 │                        │
│         │          │ or 0x37          │                        │
│         │          └────┬─────────────┘                        │
│         │               │                                      │
│         │       Transfer Data (0x36)                           │
│         │               │                                      │
│         │               ▼                                      │
│         │    ┌──────────────────────┐                          │
│         │    │ TRANSFER_ACTIVE      │◄──────────┐              │
│         │    │                      │           │              │
│         │    │ Sending data blocks  │    More blocks           │
│         │    │ via 0x36             │    to send               │
│         │    └────┬─────────────────┘           │              │
│         │         │                             │              │
│         │   Last Block Sent               Transfer Data        │
│         │         │                         (0x36)             │
│         │         │                             │              │
│         │         ▼                             │              │
│         │  ┌──────────────────────┐             │              │
│         │  │ FINALIZING           │─────────────┘              │
│         │  │                      │                            │
│         │  │ Waiting for 0x37     │                            │
│         │  └────┬─────────────────┘                            │
│         │       │                                              │
│         │   Request Transfer Exit (0x37)                       │
│         │       │                                              │
│         │       ▼                                              │
│         │   ┌───────────────┐                                  │
│         │   │ Cleanup       │                                  │
│         │   │ Free buffers  │                                  │
│         │   └───────┬───────┘                                  │
│         │           │                                          │
│         │           └─────────────────┐                        │
│         │                             │                        │
│         │                             ▼                        │
│         │                      Back to IDLE                    │
│         │                                                      │
│      Error                                                     │
│      Condition                                                 │
│         │                                                      │
│         ▼                                                      │
│   ┌──────────────┐                                             │
│   │   ERROR      │                                             │
│   │              │                                             │
│   │ Send NRC     │                                             │
│   │ Reset state  │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          └──────────────────────────────────────────────────┐  │
│                                                             │  │
│                                                             ▼  │
│                                                        Back to │
│                                                          IDLE  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### State Transition Table

```
┌─────────────────┬──────────────┬───────────────┬──────────────┐
│ Current State   │ Event        │ Next State    │ Response     │
├─────────────────┼──────────────┼───────────────┼──────────────┤
│ IDLE            │ 0x35 Valid   │ UPLOAD_ACTIVE │ 0x75 + params│
│ IDLE            │ 0x35 Invalid │ ERROR         │ NRC          │
│ UPLOAD_ACTIVE   │ 0x36 Request │ TRANSFER_     │ 0x76 + data  │
│                 │              │ ACTIVE        │              │
│ UPLOAD_ACTIVE   │ 0x37 Request │ IDLE          │ 0x77         │
│ TRANSFER_ACTIVE │ 0x36 Request │ TRANSFER_     │ 0x76 + data  │
│                 │              │ ACTIVE        │              │
│ TRANSFER_ACTIVE │ Last Block   │ FINALIZING    │ 0x76 + data  │
│ FINALIZING      │ 0x37 Request │ IDLE          │ 0x77         │
│ FINALIZING      │ Timeout      │ ERROR         │ NRC 0x72     │
│ Any State       │ Reset        │ IDLE          │ N/A          │
│ Any State       │ Error        │ ERROR         │ NRC          │
└─────────────────┴──────────────┴───────────────┴──────────────┘
```

---

## NRC Decision Tree

### Which NRC to Send?

```
                     Request Upload (0x35) Received
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Message Length Correct? │
                    └────────┬────────────────┘
                             │
                      ┌──────┴───────┐
                      NO             YES
                      │               │
                      ▼               ▼
              ┌─────────────┐   ┌──────────────────┐
              │ Send NRC    │   │ In PROGRAMMING   │
              │   0x13      │   │ Session?         │
              └─────────────┘   └────────┬─────────┘
                                         │
                                  ┌──────┴──────┐
                                  NO            YES
                                  │              │
                                  ▼              ▼
                          ┌─────────────┐  ┌────────────────┐
                          │ Send NRC    │  │ Security       │
                          │   0x70      │  │ Unlocked?      │
                          └─────────────┘  └────────┬───────┘
                                                     │
                                              ┌──────┴──────┐
                                              NO            YES
                                              │              │
                                              ▼              ▼
                                      ┌─────────────┐  ┌────────────────┐
                                      │ Send NRC    │  │ Upload Already │
                                      │   0x33      │  │ Active?        │
                                      └─────────────┘  └────────┬───────┘
                                                                 │
                                                          ┌──────┴──────┐
                                                          YES           NO
                                                          │              │
                                                          ▼              ▼
                                                  ┌─────────────┐  ┌──────────────┐
                                                  │ Send NRC    │  │ Address Valid?│
                                                  │   0x22      │  └────────┬─────┘
                                                  └─────────────┘           │
                                                                     ┌──────┴──────┐
                                                                     NO            YES
                                                                     │              │
                                                                     ▼              ▼
                                                             ┌─────────────┐  ┌──────────────┐
                                                             │ Send NRC    │  │ Size Valid?  │
                                                             │   0x31      │  └────────┬─────┘
                                                             └─────────────┘           │
                                                                              ┌────────┴────────┐
                                                                              NO               YES
                                                                              │                 │
                                                                              ▼                 ▼
                                                                      ┌─────────────┐  ┌────────────────┐
                                                                      │ Send NRC    │  │ Memory Read    │
                                                                      │   0x31      │  │ Preparation OK?│
                                                                      └─────────────┘  └────────┬───────┘
                                                                                                │
                                                                                         ┌──────┴──────┐
                                                                                         NO            YES
                                                                                         │              │
                                                                                         ▼              ▼
                                                                                 ┌─────────────┐  ┌──────────────┐
                                                                                 │ Send NRC    │  │ Send Positive│
                                                                                 │   0x72      │  │ Response 0x75│
                                                                                 └─────────────┘  └──────────────┘
```

---

## Memory Validation

### Address Range Check

```
┌────────────────────────────────────────────────────────────────┐
│              MEMORY ADDRESS VALIDATION FLOWCHART                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  START: Validate Address                       │
│                           │                                    │
│                           ▼                                    │
│              ┌─────────────────────────┐                       │
│              │ Requested Address       │                       │
│              │ addr = 0xXXXXXXXX       │                       │
│              └────────┬────────────────┘                       │
│                       │                                        │
│                       ▼                                        │
│              ┌─────────────────────────┐                       │
│              │ Define Valid Regions    │                       │
│              │ • Flash: 0x00100000-    │                       │
│              │          0x001FFFFF     │                       │
│              │ • RAM:   0x20000000-    │                       │
│              │          0x2000FFFF     │                       │
│              │ • EEPROM:0x08000000-    │                       │
│              │          0x08001FFF     │                       │
│              └────────┬────────────────┘                       │
│                       │                                        │
│                       ▼                                        │
│         ┌─────────────────────────────────┐                    │
│         │ Is address within any region?   │                    │
│         └────────┬────────────────────────┘                    │
│                  │                                             │
│          ┌───────┴────────┐                                    │
│          YES              NO                                   │
│          │                │                                    │
│          ▼                ▼                                    │
│    ┌──────────┐    ┌──────────────┐                           │
│    │ Check    │    │ NRC 0x31     │                           │
│    │ Region   │    │ (Out of Range│                           │
│    │ Perms    │    └──────────────┘                           │
│    └────┬─────┘           │                                    │
│         │                 ▼                                    │
│         ▼                END                                   │
│  ┌──────────────┐                                              │
│  │ Is region    │                                              │
│  │ readable?    │                                              │
│  └────┬─────────┘                                              │
│       │                                                        │
│  ┌────┴─────┐                                                  │
│  YES        NO                                                 │
│  │          │                                                  │
│  ▼          ▼                                                  │
│ ┌────┐  ┌──────────────┐                                      │
│ │ OK │  │ NRC 0x31     │                                      │
│ └─┬──┘  │ (Protected)  │                                      │
│   │     └──────────────┘                                      │
│   │            │                                               │
│   │            ▼                                               │
│   │           END                                              │
│   │                                                            │
│   └──────────────────────────────────────────────────┐         │
│                                                      │         │
│                                                      ▼         │
│                                            Continue to Size    │
│                                            Validation          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Size Validation

```
┌────────────────────────────────────────────────────────────────┐
│                MEMORY SIZE VALIDATION FLOWCHART                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  START: Validate Size                          │
│                           │                                    │
│                           ▼                                    │
│              ┌─────────────────────────┐                       │
│              │ Requested Size          │                       │
│              │ size = N bytes          │                       │
│              │ Address = addr          │                       │
│              └────────┬────────────────┘                       │
│                       │                                        │
│                       ▼                                        │
│              ┌─────────────────────────┐                       │
│              │ Calculate End Address   │                       │
│              │ end_addr = addr + size  │                       │
│              └────────┬────────────────┘                       │
│                       │                                        │
│                       ▼                                        │
│         ┌─────────────────────────────────┐                    │
│         │ Is size > 0?                    │                    │
│         └────────┬────────────────────────┘                    │
│                  │                                             │
│          ┌───────┴────────┐                                    │
│          YES              NO                                   │
│          │                │                                    │
│          ▼                ▼                                    │
│    ┌──────────┐    ┌──────────────┐                           │
│    │ Check    │    │ NRC 0x31     │                           │
│    │ Bounds   │    │ (Invalid Size│                           │
│    └────┬─────┘    └──────────────┘                           │
│         │                 │                                    │
│         ▼                 ▼                                    │
│  ┌──────────────────┐   END                                   │
│  │ end_addr within  │                                          │
│  │ region boundary? │                                          │
│  └────┬─────────────┘                                          │
│       │                                                        │
│  ┌────┴─────┐                                                  │
│  YES        NO                                                 │
│  │          │                                                  │
│  ▼          ▼                                                  │
│ ┌────┐  ┌──────────────┐                                      │
│ │ OK │  │ NRC 0x31     │                                      │
│ └─┬──┘  │ (Exceeds     │                                      │
│   │     │  Boundary)   │                                      │
│   │     └──────────────┘                                      │
│   │            │                                               │
│   │            ▼                                               │
│   │           END                                              │
│   │                                                            │
│   └──────────────────────────────────────────────────┐         │
│                                                      │         │
│                                                      ▼         │
│                                            Address and Size    │
│                                            Valid!              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session Timeout Handling

### Timeout Sequence

```
┌────────────────────────────────────────────────────────────────┐
│                SESSION TIMEOUT MANAGEMENT                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │  Request Upload (0x35)           │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Start P2*Server timer  │
│    │  Positive Response (0x75)        │ (e.g., 5000ms)         │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │  ════════════════════════════    │                        │
│    │  Working... (delay)              │ Timer counting...      │
│    │  ════════════════════════════    │                        │
│    │                                  │ 3000ms elapsed         │
│    │                                  │                        │
│    │  Tester Session Keep-Alive (0x3E)│                        │
│    │─────────────────────────────────>│ Reset timer ✓          │
│    │                                  │                        │
│    │  Positive Response (0x7E)        │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │  Transfer Data (0x36)            │                        │
│    │─────────────────────────────────>│ Reset timer ✓          │
│    │                                  │ Read memory block      │
│    │  Transfer Data Response (0x76)   │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Timeout Error Scenario

```
┌────────────────────────────────────────────────────────────────┐
│                     TIMEOUT EXPIRATION                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │  Request Upload (0x35)           │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Upload state: ACTIVE   │
│    │  Positive Response (0x75)        │ Start timer: 5000ms    │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │  ════════════════════════════    │                        │
│    │  No activity...                  │ Timer counting...      │
│    │  ════════════════════════════    │ 5000ms...              │
│    │                                  │                        │
│    │                                  │ ⏰ TIMEOUT!            │
│    │                                  │ Reset upload state     │
│    │                                  │ → IDLE                 │
│    │                                  │ Free resources         │
│    │                                  │                        │
│    │  Transfer Data (0x36)            │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Upload state: IDLE ❌  │
│    │  NRC 0x24 (Sequence Error)       │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │  Must restart with 0x35!         │                        │
│    │                                  │                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Successful Upload

```
┌────────────────────────────────────────────────────────────────┐
│  TEST CASE 1: Complete Successful Upload                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-conditions:                                               │
│    • ECU in PROGRAMMING session (0x02)                         │
│    • Security unlocked (0x27 completed)                        │
│    • No active upload in progress                              │
│                                                                │
│  Test Steps:                                                   │
│    1. Send Request Upload (0x35)                               │
│       Address: 0x00100000                                      │
│       Size: 4096 bytes (0x1000)                                │
│       DFI: 0x00 (no compression/encryption)                    │
│       ALFID: 0x44                                              │
│                                                                │
│    2. Verify positive response (0x75)                          │
│       Check maxNumberOfBlockLength received                    │
│                                                                │
│    3. Send Transfer Data (0x36) requests                       │
│       Block sequence counter: 01, 02, 03...                    │
│       Request blocks until all 4096 bytes received             │
│                                                                │
│    4. Verify each Transfer Data response (0x76)                │
│       Check block sequence counter matches                     │
│       Verify data length matches max block size                │
│                                                                │
│    5. Send Request Transfer Exit (0x37)                        │
│                                                                │
│    6. Verify positive response (0x77)                          │
│                                                                │
│  Expected Results:                                             │
│    ✓ All responses positive (0x75, 0x76, 0x77)                 │
│    ✓ 4096 bytes received from ECU                              │
│    ✓ Upload state returns to IDLE                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Security Not Unlocked

```
┌────────────────────────────────────────────────────────────────┐
│  TEST CASE 2: Upload Without Security Access                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-conditions:                                               │
│    • ECU in PROGRAMMING session (0x02)                         │
│    • Security LOCKED (0x27 not completed) 🔒                   │
│                                                                │
│  Test Steps:                                                   │
│    1. Send Request Upload (0x35)                               │
│       Address: 0x00100000                                      │
│       Size: 4096 bytes                                         │
│       DFI: 0x00                                                │
│       ALFID: 0x44                                              │
│                                                                │
│  Expected Results:                                             │
│    ✓ NRC 0x33 (Security Access Denied)                         │
│    ✓ Upload state remains IDLE                                 │
│                                                                │
│  Recovery Steps:                                               │
│    1. Perform Security Access (0x27)                           │
│       • Request Seed (0x27 0x01)                               │
│       • Send Key (0x27 0x02)                                   │
│    2. Retry Request Upload (0x35)                              │
│    3. Should now succeed with 0x75 response                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Invalid Memory Address

```
┌────────────────────────────────────────────────────────────────┐
│  TEST CASE 3: Upload from Invalid Address                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-conditions:                                               │
│    • ECU in PROGRAMMING session (0x02)                         │
│    • Security unlocked (0x27 completed)                        │
│                                                                │
│  Test Steps:                                                   │
│    1. Send Request Upload (0x35)                               │
│       Address: 0xFFFF0000 (invalid/restricted)                 │
│       Size: 1024 bytes                                         │
│       DFI: 0x00                                                │
│       ALFID: 0x44                                              │
│                                                                │
│  Expected Results:                                             │
│    ✓ NRC 0x31 (Request Out of Range)                           │
│    ✓ Upload state remains IDLE                                 │
│                                                                │
│  Variations:                                                   │
│    A. Address outside all memory regions                       │
│    B. Address in protected region                              │
│    C. Size exceeds region boundary                             │
│    D. Address + Size overflows                                 │
│                                                                │
│  All variations should return NRC 0x31                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 4: Upload Already Active

```
┌────────────────────────────────────────────────────────────────┐
│  TEST CASE 4: Multiple Concurrent Upload Attempts              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-conditions:                                               │
│    • ECU in PROGRAMMING session (0x02)                         │
│    • Security unlocked (0x27 completed)                        │
│                                                                │
│  Test Steps:                                                   │
│    1. Send first Request Upload (0x35)                         │
│       Address: 0x00100000                                      │
│       Size: 4096 bytes                                         │
│                                                                │
│    2. Verify positive response (0x75)                          │
│       Upload state: ACTIVE ✓                                   │
│                                                                │
│    3. Send second Request Upload (0x35)                        │
│       Address: 0x00200000 (different region)                   │
│       Size: 2048 bytes                                         │
│                                                                │
│  Expected Results:                                             │
│    ✓ Second request gets NRC 0x22 (Conditions Not Correct)     │
│    ✓ First upload remains active                               │
│                                                                │
│  Recovery Steps:                                               │
│    1. Complete first upload:                                   │
│       • Transfer Data (0x36) until complete                    │
│       • Request Transfer Exit (0x37)                           │
│    2. Upload state returns to IDLE                             │
│    3. Now second upload can be started                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 5: Compressed Upload

```
┌────────────────────────────────────────────────────────────────┐
│  TEST CASE 5: Upload with Compression                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pre-conditions:                                               │
│    • ECU in PROGRAMMING session (0x02)                         │
│    • Security unlocked (0x27 completed)                        │
│    • ECU supports compression method 1                         │
│                                                                │
│  Test Steps:                                                   │
│    1. Send Request Upload (0x35)                               │
│       Address: 0x00100000                                      │
│       Size: 8192 bytes (uncompressed)                          │
│       DFI: 0x10 (compression method 1)                         │
│       ALFID: 0x44                                              │
│                                                                │
│    2. Verify positive response (0x75)                          │
│       Note maxNumberOfBlockLength                              │
│                                                                │
│    3. Send Transfer Data (0x36) requests                       │
│       Receive compressed data blocks                           │
│                                                                │
│    4. Decompress received data                                 │
│                                                                │
│    5. Send Request Transfer Exit (0x37)                        │
│                                                                │
│  Expected Results:                                             │
│    ✓ Positive responses throughout                             │
│    ✓ Compressed data size < 8192 bytes                         │
│    ✓ Decompressed data = exactly 8192 bytes                    │
│    ✓ Data integrity verified                                   │
│                                                                │
│  Performance Metrics:                                          │
│    • Compression ratio achieved                                │
│    • Total transfer time                                       │
│    • Bandwidth savings vs uncompressed                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Firmware Backup Workflow

```
┌────────────────────────────────────────────────────────────────┐
│              COMPLETE FIRMWARE BACKUP SEQUENCE                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Phase 1: Session Setup                                        │
│    │                                                           │
│    ├─> Diagnostic Session Control (0x10 0x02)                  │
│    │   Response: [0x50] [0x02] [P2] [P2*]                      │
│    │                                                           │
│    ├─> Security Access Request Seed (0x27 0x01)                │
│    │   Response: [0x67] [0x01] [seed]                          │
│    │                                                           │
│    └─> Security Access Send Key (0x27 0x02 + key)              │
│        Response: [0x67] [0x02]                                 │
│                                                                │
│  Phase 2: Upload Firmware Region 1                             │
│    │                                                           │
│    ├─> Request Upload (0x35)                                   │
│    │   Address: 0x00100000                                     │
│    │   Size: 65536 bytes (64KB)                                │
│    │   Response: [0x75] [0x20] [0x04] [0x00]                   │
│    │            (max 1024 bytes/block)                         │
│    │                                                           │
│    ├─> Transfer Data Loop (0x36)                               │
│    │   Block 01: Request → Receive 1024 bytes                  │
│    │   Block 02: Request → Receive 1024 bytes                  │
│    │   ...                                                     │
│    │   Block 64: Request → Receive 1024 bytes                  │
│    │   Total: 65536 bytes received                             │
│    │                                                           │
│    └─> Request Transfer Exit (0x37)                            │
│        Response: [0x77]                                        │
│                                                                │
│  Phase 3: Upload Firmware Region 2                             │
│    │                                                           │
│    ├─> Request Upload (0x35)                                   │
│    │   Address: 0x00110000                                     │
│    │   Size: 65536 bytes (64KB)                                │
│    │   Response: [0x75] [0x20] [0x04] [0x00]                   │
│    │                                                           │
│    ├─> Transfer Data Loop (0x36)                               │
│    │   [64 blocks of 1024 bytes each]                          │
│    │                                                           │
│    └─> Request Transfer Exit (0x37)                            │
│        Response: [0x77]                                        │
│                                                                │
│  Phase 4: Verification                                         │
│    │                                                           │
│    ├─> Calculate checksums of uploaded data                    │
│    │                                                           │
│    ├─> Compare with expected checksums                         │
│    │   (if available from ECU)                                 │
│    │                                                           │
│    └─> Save to backup file                                     │
│        File: ECU_Firmware_Backup_YYYYMMDD.bin                  │
│                                                                │
│  Phase 5: Session Cleanup                                      │
│    │                                                           │
│    └─> Diagnostic Session Control (0x10 0x01)                  │
│        Return to DEFAULT session                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Calibration Data Extract

```
┌────────────────────────────────────────────────────────────────┐
│          CALIBRATION DATA EXTRACTION WORKFLOW                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Enter Programming Session                             │
│    └─> 0x10 0x02 (PROGRAMMING)                                 │
│                                                                │
│  Step 2: Unlock Security                                       │
│    └─> 0x27 seed/key exchange                                  │
│                                                                │
│  Step 3: Upload Calibration Block 1                            │
│    ├─> Request Upload (0x35)                                   │
│    │   Address: 0x08000000 (EEPROM cal region)                 │
│    │   Size: 4096 bytes                                        │
│    │   DFI: 0x00 (no compression)                              │
│    ├─> Transfer Data (0x36) loop                               │
│    │   Receive all blocks                                      │
│    └─> Request Transfer Exit (0x37)                            │
│                                                                │
│  Step 4: Upload Calibration Block 2                            │
│    ├─> Request Upload (0x35)                                   │
│    │   Address: 0x08001000                                     │
│    │   Size: 2048 bytes                                        │
│    ├─> Transfer Data (0x36) loop                               │
│    └─> Request Transfer Exit (0x37)                            │
│                                                                │
│  Step 5: Parse Calibration Data                                │
│    ├─> Extract parameter structures                            │
│    ├─> Decode calibration values                               │
│    └─> Save in human-readable format (CSV/XML)                 │
│                                                                │
│  Step 6: Return to Default Session                             │
│    └─> 0x10 0x01                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### Debug: Upload Fails Immediately

```
                Upload Request Gets Immediate NRC
                              │
                              ▼
                ┌──────────────────────────┐
                │ Which NRC Received?      │
                └──────────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
       0x13               0x22               0x31
        │                  │                  │
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Check message  │  │ Check if       │  │ Validate       │
│ length         │  │ upload already │  │ address/size   │
│                │  │ active         │  │ parameters     │
│ • Verify ALFID │  │                │  │                │
│   calculation  │  │ Check state:   │  │ • Address in   │
│ • Count bytes  │  │ - Previous 0x37│  │   valid range? │
│   sent         │  │   completed?   │  │ • Size valid?  │
│ • Match spec   │  │ - Timeout?     │  │ • End address  │
│                │  │                │  │   overflow?    │
└────────────────┘  └────────────────┘  └────────────────┘

        │                  │                  │
       0x33               0x70               0x72
        │                  │                  │
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Security not   │  │ Wrong session  │  │ ECU internal   │
│ unlocked       │  │ type           │  │ error          │
│                │  │                │  │                │
│ • Perform 0x27 │  │ • Check        │  │ • Check ECU    │
│   first        │  │   current      │  │   voltage      │
│ • Verify key   │  │   session      │  │ • Reset ECU    │
│   calculation  │  │ • Send 0x10    │  │ • Check for    │
│                │  │   0x02         │  │   DTCs         │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Debug: Transfer Data Fails

```
            Upload Started OK, But Transfer Data Fails
                              │
                              ▼
                ┌──────────────────────────┐
                │ Which Phase Failed?      │
                └──────────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   First Block        Mid-Transfer       Last Block
        │                  │                  │
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Check 0x36     │  │ Check sequence │  │ Check if all   │
│ request format │  │ counter        │  │ data sent      │
│                │  │                │  │                │
│ • Block seq=01?│  │ • Counter      │  │ • Verify total │
│ • Correct DFI? │  │   incremented? │  │   bytes sent   │
│                │  │ • Timeout?     │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## Best Practices Checklist

### Pre-Upload Validation

```
┌────────────────────────────────────────────────────────────────┐
│              PRE-UPLOAD VALIDATION CHECKLIST                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Session Requirements:                                         │
│    ☐ Diagnostic session switched to PROGRAMMING (0x02)         │
│    ☐ Session confirmed with positive response                  │
│    ☐ P2/P2* timing parameters noted                            │
│                                                                │
│  Security Requirements:                                        │
│    ☐ Security Access (0x27) performed                          │
│    ☐ Seed received successfully                                │
│    ☐ Key calculated correctly                                  │
│    ☐ Unlock confirmed with positive response                   │
│                                                                │
│  Memory Parameters:                                            │
│    ☐ Memory address validated against ECU memory map           │
│    ☐ Memory size validated (non-zero, within bounds)           │
│    ☐ End address (address + size) checked for overflow         │
│    ☐ Memory region permissions verified (readable)             │
│                                                                │
│  Request Parameters:                                           │
│    ☐ Data Format Identifier (DFI) set correctly                │
│    ☐ Compression method supported by ECU (if used)             │
│    ☐ Encryption method supported by ECU (if used)              │
│    ☐ ALFID calculated correctly for address/size lengths       │
│    ☐ Message length matches ALFID specification                │
│                                                                │
│  State Checks:                                                 │
│    ☐ No previous upload/download currently active              │
│    ☐ ECU voltage stable (11-15V recommended)                   │
│    ☐ No critical DTCs active                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Transfer Phase Best Practices

```
┌────────────────────────────────────────────────────────────────┐
│             TRANSFER PHASE BEST PRACTICES                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Block Management:                                             │
│    ☐ Respect maxNumberOfBlockLength from ECU response          │
│    ☐ Increment block sequence counter correctly (01→02→03...)  │
│    ☐ Handle sequence counter rollover (FF→00)                  │
│    ☐ Track total bytes received                                │
│                                                                │
│  Timeout Management:                                           │
│    ☐ Monitor P2* timeout between requests                      │
│    ☐ Send Tester Present (0x3E) if delays expected             │
│    ☐ Implement retry logic for transient errors                │
│    ☐ Set maximum retry count (e.g., 3 attempts)                │
│                                                                │
│  Data Handling:                                                │
│    ☐ Buffer received data appropriately                        │
│    ☐ Decompress data if DFI compression used                   │
│    ☐ Decrypt data if DFI encryption used                       │
│    ☐ Verify data integrity (checksums if available)            │
│                                                                │
│  Error Handling:                                               │
│    ☐ Check each Transfer Data response for NRCs                │
│    ☐ Log errors with context (block number, address)           │
│    ☐ Implement graceful abort on fatal errors                  │
│    ☐ Clean up upload state on error                            │
│                                                                │
│  Progress Monitoring:                                          │
│    ☐ Track upload progress (bytes received / total)            │
│    ☐ Display progress to user                                  │
│    ☐ Estimate time remaining                                   │
│    ☐ Log performance metrics                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Post-Upload Verification

```
┌────────────────────────────────────────────────────────────────┐
│            POST-UPLOAD VERIFICATION CHECKLIST                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Transfer Completion:                                          │
│    ☐ All expected bytes received                               │
│    ☐ Request Transfer Exit (0x37) sent                         │
│    ☐ Positive response (0x77) received                         │
│    ☐ Upload state returned to IDLE                             │
│                                                                │
│  Data Integrity:                                               │
│    ☐ Calculate checksum/CRC of received data                   │
│    ☐ Compare with expected checksum (if available)             │
│    ☐ Verify data structure validity                            │
│    ☐ Check for data corruption                                 │
│                                                                │
│  Data Processing:                                              │
│    ☐ Decompression completed successfully (if applicable)      │
│    ☐ Decryption completed successfully (if applicable)         │
│    ☐ Data saved to file with appropriate metadata              │
│    ☐ File permissions set correctly                            │
│                                                                │
│  Session Cleanup:                                              │
│    ☐ Return to DEFAULT session if appropriate (0x10 0x01)      │
│    ☐ Log upload summary (time, bytes, success/failure)         │
│    ☐ Clear sensitive data from memory (keys, seeds)            │
│                                                                │
│  Documentation:                                                │
│    ☐ Log upload parameters (address, size, DFI)                │
│    ☐ Record ECU identification (VIN, part number, etc.)        │
│    ☐ Timestamp upload completion                               │
│    ☐ Note any warnings or anomalies                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│                IMPLEMENTATION KEY TAKEAWAYS                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request Upload Flow:                                          │
│    1. Validate message length against ALFID                    │
│    2. Check session type (must be PROGRAMMING)                 │
│    3. Check security state (must be UNLOCKED)                  │
│    4. Verify no upload currently active                        │
│    5. Validate memory address and size                         │
│    6. Prepare read buffer and calculate max block size         │
│    7. Set state to UPLOAD_ACTIVE                               │
│    8. Send positive response with max block length             │
│                                                                │
│  State Transitions:                                            │
│    IDLE → UPLOAD_ACTIVE → TRANSFER_ACTIVE → FINALIZING → IDLE │
│                                                                │
│  Critical NRCs:                                                │
│    • 0x13: Message length error                                │
│    • 0x22: Upload already active                               │
│    • 0x31: Invalid address or size                             │
│    • 0x33: Security locked                                     │
│    • 0x70: Wrong session                                       │
│    • 0x72: Internal ECU error                                  │
│                                                                │
│  Testing Focus Areas:                                          │
│    • Session and security prerequisites                        │
│    • Memory validation (address, size, permissions)            │
│    • State management (no concurrent uploads)                  │
│    • Timeout and keep-alive handling                           │
│    • Data integrity verification                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x35 Practical Implementation Guide**
