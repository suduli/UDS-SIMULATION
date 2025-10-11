# SID 10: Visual Implementation Guide

## Table of Contents
1. [Implementation Overview](#implementation-overview)
2. [Request Processing Flow](#request-processing-flow)
3. [State Machine Diagrams](#state-machine-diagrams)
4. [NRC Decision Trees](#nrc-decision-trees)
5. [Session Timeout Behavior](#session-timeout-behavior)
6. [Testing Scenarios](#testing-scenarios)
7. [Integration Patterns](#integration-patterns)
8. [Debugging Flowcharts](#debugging-flowcharts)

---

## Implementation Overview

This guide provides visual diagrams and flowcharts showing how SID 10 (Diagnostic Session Control) works in practice.

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│              UDS DIAGNOSTIC SYSTEM ARCHITECTURE                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐                    ┌──────────────┐         │
│  │   Diagnostic │    SID 10 Request  │     ECU      │         │
│  │     Tool     │───────────────────>│  (Simulator) │         │
│  │   (Tester)   │                    │              │         │
│  │              │<───────────────────│              │         │
│  └──────────────┘    Response        └──────┬───────┘         │
│                                              │                 │
│                                              ▼                 │
│                      ┌────────────────────────────────┐        │
│                      │   Request Handler Pipeline     │        │
│                      ├────────────────────────────────┤        │
│                      │  1. Receive Request            │        │
│                      │  2. Validate Format            │        │
│                      │  3. Check Session/Security     │        │
│                      │  4. Execute Service            │        │
│                      │  5. Update State               │        │
│                      │  6. Send Response              │        │
│                      └────────────┬───────────────────┘        │
│                                   │                            │
│                                   ▼                            │
│                      ┌────────────────────────┐                │
│                      │    Protocol State      │                │
│                      ├────────────────────────┤                │
│                      │ • Current Session      │                │
│                      │ • Security Status      │                │
│                      │ • Timeout Timer        │                │
│                      │ • Activity Timestamp   │                │
│                      └────────────────────────┘                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Request Processing Flow

### Complete Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│             SID 10 REQUEST PROCESSING FLOWCHART                 │
└─────────────────────────────────────────────────────────────────┘

    START: Receive SID 10 Request
           │
           ▼
    ┌──────────────────────┐
    │ Does SubFunction     │
    │ byte exist?          │
    └──────┬───────┬───────┘
           │ NO    │ YES
           ▼       │
      [NRC 0x13]   │
      Incorrect    │
      Message      │
      Length       │
           ▲       │
           │       ▼
           │  ┌──────────────────────┐
           │  │ Is SubFunction       │
           │  │ valid?               │
           │  │ (0x01, 0x02, 0x03)   │
           │  └──────┬───────┬───────┘
           │         │ NO    │ YES
           │         ▼       │
           │    [NRC 0x12]   │
           │    Sub-Function │
           │    Not Supported│
           │         ▲       │
           │         │       ▼
           │         │  ┌──────────────────────┐
           │         │  │ Is message length    │
           │         │  │ correct?             │
           │         │  │ (exactly 2 bytes)    │
           │         │  └──────┬───────┬───────┘
           │         │         │ NO    │ YES
           │         │         ▼       │
           │         └────[NRC 0x13]   │
           │              Incorrect    │
           │              Message      │
           │              Length       │
           │                   ▲       │
           │                   │       ▼
           │                   │  ┌──────────────────────┐
           │                   │  │ Are vehicle          │
           │                   │  │ conditions OK?       │
           │                   │  │ (speed, ignition)    │
           │                   │  └──────┬───────┬───────┘
           │                   │         │ NO    │ YES
           │                   │         ▼       │
           │                   │    [NRC 0x22]   │
           │                   │    Conditions   │
           │                   │    Not Correct  │
           │                   │         ▲       │
           │                   │         │       ▼
           └───────────────────┴─────────┘  ┌──────────────────────┐
                                            │ UPDATE STATE:        │
                                            │ • Set new session    │
                                            │ • Reset security?    │
                                            │ • Reset timeout      │
                                            └──────┬───────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────────────┐
                                            │ Generate Positive    │
                                            │ Response:            │
                                            │ [0x50, session,      │
                                            │  P2_H, P2_L,         │
                                            │  P2*_H, P2*_L]       │
                                            └──────┬───────────────┘
                                                   │
                                                   ▼
                                                 END
```

### Request/Response Format Diagrams

```
┌────────────────────────────────────────────────────────────────┐
│                  REQUEST/RESPONSE FORMATS                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  REQUEST FORMAT (2 bytes):                                    │
│  ┌────────┬────────────┐                                      │
│  │ Byte 0 │  Byte 1    │                                      │
│  ├────────┼────────────┤                                      │
│  │  0x10  │ SubFunction│                                      │
│  │  (SID) │ (0x01-0x03)│                                      │
│  └────────┴────────────┘                                      │
│                                                                │
│  Example: [0x10, 0x03] = Enter Extended Session               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  POSITIVE RESPONSE FORMAT (6 bytes):                          │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐     │
│  │ Byte 0 │ Byte 1 │ Byte 2 │ Byte 3 │ Byte 4 │ Byte 5 │     │
│  ├────────┼────────┼────────┼────────┼────────┼────────┤     │
│  │  0x50  │Session │ P2_High│ P2_Low │P2*_High│P2*_Low │     │
│  │(SID+40)│  Type  │        │        │        │        │     │
│  └────────┴────────┴────────┴────────┴────────┴────────┘     │
│                                                                │
│  Example: [0x50, 0x03, 0x00, 0x32, 0x01, 0xF4]                │
│           = Extended Session, P2=50ms, P2*=500ms              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  NEGATIVE RESPONSE FORMAT (3 bytes):                          │
│  ┌────────┬────────┬────────┐                                │
│  │ Byte 0 │ Byte 1 │ Byte 2 │                                │
│  ├────────┼────────┼────────┤                                │
│  │  0x7F  │  0x10  │  NRC   │                                │
│  │ (Neg.) │  (SID) │ (Code) │                                │
│  └────────┴────────┴────────┘                                │
│                                                                │
│  Example: [0x7F, 0x10, 0x12]                                  │
│           = Sub-Function Not Supported                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Example Processing Scenarios

```
┌────────────────────────────────────────────────────────────────┐
│                  REQUEST VALIDATION EXAMPLES                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Example 1: Valid Request - Extended Session                  │
│  ════════════════════════════════════════                      │
│                                                                │
│  Input:  [0x10, 0x03]                                         │
│          │      │                                             │
│          │      └─── SubFunction: 0x03 (Extended) ✓          │
│          └────────── SID: 0x10 ✓                             │
│                                                                │
│  Validation Steps:                                             │
│  Step 1: ✓ SubFunction exists (0x03)                         │
│  Step 2: ✓ SubFunction valid (in [0x01, 0x02, 0x03])         │
│  Step 3: ✓ Message length = 2 bytes                          │
│  Step 4: ✓ Vehicle conditions OK                             │
│                                                                │
│  Output: [0x50, 0x03, 0x00, 0x32, 0x01, 0xF4]                │
│  Status: ✓ SUCCESS - Entered Extended Session                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Example 2: Invalid - Missing SubFunction                     │
│  ═════════════════════════════════════                         │
│                                                                │
│  Input:  [0x10]                                               │
│          │                                                    │
│          └────────── SID: 0x10 ✓                             │
│                      SubFunction: MISSING ✗                   │
│                                                                │
│  Validation Steps:                                             │
│  Step 1: ✗ SubFunction does not exist                        │
│  STOP → Generate NRC 0x13                                    │
│                                                                │
│  Output: [0x7F, 0x10, 0x13]                                   │
│  Status: ✗ FAILED - Incorrect Message Length                 │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Example 3: Invalid SubFunction Value                         │
│  ═════════════════════════════════                             │
│                                                                │
│  Input:  [0x10, 0xFF]                                         │
│          │      │                                             │
│          │      └─── SubFunction: 0xFF (Invalid) ✗           │
│          └────────── SID: 0x10 ✓                             │
│                                                                │
│  Validation Steps:                                             │
│  Step 1: ✓ SubFunction exists (0xFF)                         │
│  Step 2: ✗ SubFunction NOT in [0x01, 0x02, 0x03]            │
│  STOP → Generate NRC 0x12                                    │
│                                                                │
│  Output: [0x7F, 0x10, 0x12]                                   │
│  Status: ✗ FAILED - Sub-Function Not Supported               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Example 4: Extra Data Bytes                                  │
│  ═══════════════════════                                       │
│                                                                │
│  Input:  [0x10, 0x03, 0xAA, 0xBB]                            │
│          │      │     │     │                                 │
│          │      │     └─────┴─ Extra bytes ✗                 │
│          │      └─────────── SubFunction: 0x03 ✓             │
│          └────────────────── SID: 0x10 ✓                     │
│                                                                │
│  Validation Steps:                                             │
│  Step 1: ✓ SubFunction exists (0x03)                         │
│  Step 2: ✓ SubFunction valid (0x03)                          │
│  Step 3: ✗ Message length = 4 bytes (should be 2)           │
│  STOP → Generate NRC 0x13                                    │
│                                                                │
│  Output: [0x7F, 0x10, 0x13]                                   │
│  Status: ✗ FAILED - Incorrect Message Length                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## State Machine Diagrams

### Session State Transition Diagram

```
┌────────────────────────────────────────────────────────────────┐
│              SESSION STATE MACHINE                             │
└────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   POWER ON      │
                    │   ECU RESET     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
              ┌────>│     DEFAULT     │<────┐
              │     │   SESSION 0x01  │     │
              │     └────────┬────────┘     │
              │              │              │
              │              │ 10 03        │ 10 01
              │              ▼              │
              │     ┌─────────────────┐     │
              │     │    EXTENDED     │─────┘
              │     │  SESSION 0x03   │
              │     └────────┬────────┘
              │              │
              │              │ 10 02
              │              ▼
              │     ┌─────────────────┐
              └─────│  PROGRAMMING    │
                    │  SESSION 0x02   │
                    └─────────────────┘

Legend:
  10 01 = Enter Default Session
  10 02 = Enter Programming Session
  10 03 = Enter Extended Session
  
Transitions:
  • All sessions can transition to any other session
  • Default is the initial state
  • Timeout returns to Default
  • ECU Reset returns to Default
```

### Security State Integration

```
┌────────────────────────────────────────────────────────────────┐
│          SESSION + SECURITY STATE MACHINE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DEFAULT SESSION (0x01)                                        │
│  ┌──────────────────────────────────────┐                     │
│  │  State: Default                      │                     │
│  │  Security: LOCKED 🔒                 │                     │
│  │  Available Services: Read-only       │                     │
│  └──────────────────────────────────────┘                     │
│                    │                                           │
│                    │ [10 03]                                   │
│                    ▼                                           │
│  EXTENDED SESSION (0x03)                                       │
│  ┌──────────────────────────────────────┐                     │
│  │  State: Extended                     │                     │
│  │  Security: LOCKED 🔒                 │                     │
│  │  Available: Security Access (0x27)   │                     │
│  └──────────────────────────────────────┘                     │
│                    │                                           │
│                    │ [27 01 → 27 02]                          │
│                    ▼                                           │
│  EXTENDED SESSION - UNLOCKED                                   │
│  ┌──────────────────────────────────────┐                     │
│  │  State: Extended                     │                     │
│  │  Security: UNLOCKED 🔓               │                     │
│  │  Available: Write, Routines, etc.    │                     │
│  └──────────────────────────────────────┘                     │
│                    │                                           │
│           ┌────────┴────────┐                                 │
│           │                 │                                 │
│      [10 01]           [10 02]                                │
│           │                 │                                 │
│           ▼                 ▼                                 │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │   DEFAULT    │  │ PROGRAMMING  │                          │
│  │  LOCKED 🔒   │  │  LOCKED 🔒   │                          │
│  └──────────────┘  └──────────────┘                          │
│                                                                │
│  ⚠️ IMPORTANT: Leaving Extended Session clears security!     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### State Transition Rules

```
┌────────────────────────────────────────────────────────────────┐
│               STATE TRANSITION RULES TABLE                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  From State     │ To State      │ Command │ Security Impact  │
│  ══════════════════════════════════════════════════════════  │
│  DEFAULT        │ DEFAULT       │  10 01  │ No change        │
│  DEFAULT        │ EXTENDED      │  10 03  │ No change        │
│  DEFAULT        │ PROGRAMMING   │  10 02  │ No change        │
│  ──────────────────────────────────────────────────────────  │
│  EXTENDED       │ DEFAULT       │  10 01  │ ❌ RESET (Lock) │
│  EXTENDED       │ EXTENDED      │  10 03  │ ✓ Preserved     │
│  EXTENDED       │ PROGRAMMING   │  10 02  │ ❌ RESET (Lock) │
│  ──────────────────────────────────────────────────────────  │
│  PROGRAMMING    │ DEFAULT       │  10 01  │ ❌ RESET (Lock) │
│  PROGRAMMING    │ EXTENDED      │  10 03  │ ❌ RESET (Lock) │
│  PROGRAMMING    │ PROGRAMMING   │  10 02  │ No change        │
│  ──────────────────────────────────────────────────────────  │
│  ANY            │ DEFAULT       │ Timeout │ ❌ RESET (Lock) │
│  ANY            │ DEFAULT       │ ECU RST │ ❌ RESET (Lock) │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Key Rules:
  1. Security is ONLY preserved when staying in same session
  2. Any session change (except 10 03→10 03) clears security
  3. Timeout always returns to DEFAULT with locked security
  4. ECU reset always returns to DEFAULT with locked security
```

---

## NRC Decision Trees

### Complete NRC Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│           NRC GENERATION DECISION TREE FOR SID 10               │
└─────────────────────────────────────────────────────────────────┘

                    Receive SID 10 Request
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        SubFunction         SubFunction
          EXISTS?              MISSING
                │                   │
            YES │                   │ NO
                │                   │
                ▼                   ▼
        ┌───────────────┐    ┌──────────────┐
        │ SubFunction   │    │  NRC 0x13    │
        │ in [01,02,03]?│    │  Incorrect   │
        └───┬───────┬───┘    │  Message     │
            │ YES   │ NO     │  Length      │
            │       │        └──────────────┘
            │       ▼
            │  ┌──────────────┐
            │  │  NRC 0x12    │
            │  │ Sub-Function │
            │  │Not Supported │
            │  └──────────────┘
            │
            ▼
    ┌───────────────┐
    │ Message       │
    │ Length = 2?   │
    └───┬───────┬───┘
        │ YES   │ NO
        │       │
        │       ▼
        │  ┌──────────────┐
        │  │  NRC 0x13    │
        │  │  Incorrect   │
        │  │  Message     │
        │  │  Length      │
        │  └──────────────┘
        │
        ▼
    ┌───────────────┐
    │ Vehicle       │
    │ Conditions    │
    │ OK?           │
    └───┬───────┬───┘
        │ YES   │ NO
        │       │
        │       ▼
        │  ┌──────────────┐
        │  │  NRC 0x22    │
        │  │ Conditions   │
        │  │ Not Correct  │
        │  └──────────────┘
        │
        ▼
    ┌──────────────┐
    │   POSITIVE   │
    │   RESPONSE   │
    │     0x50     │
    └──────────────┘
```

### NRC Scenarios Table

```
┌────────────────────────────────────────────────────────────────┐
│                  NRC SCENARIOS REFERENCE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario 1: Missing SubFunction                              │
│  ═══════════════════════════════                               │
│  Request:  [0x10]                                             │
│  Problem:  No subfunction byte                                │
│  NRC:      0x13 (Incorrect Message Length)                    │
│  Response: [0x7F, 0x10, 0x13]                                 │
│  Fix:      Add subfunction → [0x10, 0x03]                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario 2: Invalid SubFunction                              │
│  ════════════════════════════                                  │
│  Request:  [0x10, 0xFF]                                       │
│  Problem:  0xFF not in valid set [0x01, 0x02, 0x03]          │
│  NRC:      0x12 (Sub-Function Not Supported)                  │
│  Response: [0x7F, 0x10, 0x12]                                 │
│  Fix:      Use valid subfunction → [0x10, 0x03]               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario 3: Extra Data Bytes                                 │
│  ═════════════════════════                                     │
│  Request:  [0x10, 0x03, 0xAA, 0xBB]                          │
│  Problem:  Message too long (4 bytes instead of 2)            │
│  NRC:      0x13 (Incorrect Message Length)                    │
│  Response: [0x7F, 0x10, 0x13]                                 │
│  Fix:      Remove extra bytes → [0x10, 0x03]                  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario 4: Bad Vehicle Conditions                           │
│  ═══════════════════════════════════                           │
│  Request:  [0x10, 0x02]  (Programming Session)                │
│  Problem:  Vehicle moving, or other safety issue              │
│  NRC:      0x22 (Conditions Not Correct)                      │
│  Response: [0x7F, 0x10, 0x22]                                 │
│  Fix:      Stop vehicle, ensure safe conditions               │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario 5: Valid Request ✓                                  │
│  ════════════════════════                                      │
│  Request:  [0x10, 0x03]                                       │
│  Problem:  None - all checks pass                             │
│  NRC:      None                                               │
│  Response: [0x50, 0x03, 0x00, 0x32, 0x01, 0xF4]              │
│  Result:   SUCCESS - Extended Session active                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session Timeout Behavior

### Timeout Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                   SESSION TIMEOUT MECHANISM                    │
└────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │ Session Started │
    │ (Non-Default)   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Start Timer:    │
    │ S3 Timeout      │
    │ (e.g., 5000ms)  │
    └────────┬────────┘
             │
             │
        ┌────┴────┐
        │         │
        ▼         ▼
   ┌─────────┐  ┌──────────────┐
   │ Request │  │ Timer Expires│
   │Received │  │ (No Activity)│
   └────┬────┘  └──────┬───────┘
        │              │
        │              ▼
        │      ┌───────────────┐
        │      │ Reset Session │
        │      │ to DEFAULT    │
        │      └───────┬───────┘
        │              │
        │              ▼
        │      ┌───────────────┐
        │      │ Clear Security│
        │      │ LOCK 🔒       │
        │      └───────────────┘
        │
        ▼
   ┌─────────────────┐
   │ Reset Timer     │
   │ (Activity!)     │
   └────────┬────────┘
            │
            │ Loop
            └────────────┐
                         │
                         ▼
                    (Continue)
```

### Timeout Timing Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                TIMEOUT TIMELINE VISUALIZATION                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Time  Event                       Session    Security        │
│  ════════════════════════════════════════════════════════════ │
│  0ms   │ 10 03 (Extended)          EXTENDED   LOCKED 🔒       │
│        │                                                       │
│  500ms │ 27 01/02 (Unlock)         EXTENDED   UNLOCKED 🔓     │
│        │ ✓ Timer Reset                                        │
│        │                                                       │
│  2s    │ 2E (Write Data)           EXTENDED   UNLOCKED 🔓     │
│        │ ✓ Timer Reset                                        │
│        │                                                       │
│  4s    │ 22 (Read Data)            EXTENDED   UNLOCKED 🔓     │
│        │ ✓ Timer Reset                                        │
│        │                                                       │
│  9s    │ [NO ACTIVITY]             EXTENDED   UNLOCKED 🔓     │
│        │ ⏰ TIMEOUT! (5s elapsed)                             │
│        │ ⚠️  AUTO RESET                                       │
│        ▼                                                       │
│  9s    │ System Action             DEFAULT    LOCKED 🔒       │
│        │ Session → DEFAULT                                    │
│        │ Security → LOCKED                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Key Points:
  • Every request resets the timeout timer
  • Typical S3 timeout: 5 seconds (implementation-specific)
  • Timeout always returns to DEFAULT session
  • Security is ALWAYS cleared on timeout
```

---

## Testing Scenarios

### Test Scenario 1: Basic Session Transitions

```
┌────────────────────────────────────────────────────────────────┐
│         TEST 1: BASIC SESSION TRANSITIONS                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Test Case 1.1: Enter Default Session                         │
│  ──────────────────────────────────                            │
│  Input:    [0x10, 0x01]                                       │
│  Expected: [0x50, 0x01, 0x00, 0x32, 0x01, 0xF4]              │
│  Status:   ✓ PASS if response SID = 0x50                     │
│            ✓ PASS if session = 0x01                           │
│                                                                │
│  Test Case 1.2: Enter Extended Session                        │
│  ───────────────────────────────────                           │
│  Input:    [0x10, 0x03]                                       │
│  Expected: [0x50, 0x03, 0x00, 0x32, 0x01, 0xF4]              │
│  Status:   ✓ PASS if response SID = 0x50                     │
│            ✓ PASS if session = 0x03                           │
│                                                                │
│  Test Case 1.3: Enter Programming Session                     │
│  ──────────────────────────────────────                        │
│  Input:    [0x10, 0x02]                                       │
│  Expected: [0x50, 0x02, 0x00, 0x32, 0x01, 0xF4]              │
│  Status:   ✓ PASS if response SID = 0x50                     │
│            ✓ PASS if session = 0x02                           │
│                                                                │
│  Test Case 1.4: Return to Default                             │
│  ──────────────────────────                                    │
│  Input:    [0x10, 0x01]                                       │
│  Expected: [0x50, 0x01, 0x00, 0x32, 0x01, 0xF4]              │
│  Status:   ✓ PASS if back to default                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Scenario 2: NRC Validation

```
┌────────────────────────────────────────────────────────────────┐
│         TEST 2: NEGATIVE RESPONSE CODE VALIDATION              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Test Case 2.1: Missing SubFunction (NRC 0x13)                │
│  ───────────────────────────────────────────                   │
│  Input:    [0x10]                                             │
│  Expected: [0x7F, 0x10, 0x13]                                 │
│  Status:   ✓ PASS if byte[0] = 0x7F                          │
│            ✓ PASS if byte[2] = 0x13                           │
│                                                                │
│  Test Case 2.2: Invalid SubFunction (NRC 0x12)                │
│  ──────────────────────────────────────────                    │
│  Input:    [0x10, 0xFF]                                       │
│  Expected: [0x7F, 0x10, 0x12]                                 │
│  Status:   ✓ PASS if NRC = 0x12                              │
│                                                                │
│  Test Case 2.3: Extra Bytes (NRC 0x13)                        │
│  ──────────────────────────────────                            │
│  Input:    [0x10, 0x03, 0xAA, 0xBB]                          │
│  Expected: [0x7F, 0x10, 0x13]                                 │
│  Status:   ✓ PASS if NRC = 0x13                              │
│                                                                │
│  Test Case 2.4: Bad Conditions (NRC 0x22)                     │
│  ─────────────────────────────────────                         │
│  Precondition: Vehicle moving                                  │
│  Input:    [0x10, 0x02]                                       │
│  Expected: [0x7F, 0x10, 0x22]                                 │
│  Status:   ✓ PASS if NRC = 0x22                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Scenario 3: Security Reset Behavior

```
┌────────────────────────────────────────────────────────────────┐
│         TEST 3: SECURITY RESET ON SESSION CHANGE               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Enter Extended Session                               │
│  ───────────────────────────────                               │
│  Command:  [0x10, 0x03]                                       │
│  Result:   Session = EXTENDED, Security = LOCKED 🔒           │
│  Check:    ✓ Session state updated                           │
│                                                                │
│  Step 2: Unlock Security                                      │
│  ───────────────────────                                       │
│  Command:  [0x27, 0x01] → Get Seed                           │
│           [0x27, 0x02, key...] → Send Key                     │
│  Result:   Session = EXTENDED, Security = UNLOCKED 🔓         │
│  Check:    ✓ Security unlocked                               │
│                                                                │
│  Step 3: Change to Default Session                            │
│  ───────────────────────────────────                           │
│  Command:  [0x10, 0x01]                                       │
│  Result:   Session = DEFAULT, Security = LOCKED 🔒            │
│  Check:    ✓ Security was reset (CRITICAL!)                  │
│                                                                │
│  Step 4: Verify Security Cleared                              │
│  ────────────────────────────────                              │
│  Command:  [0x2E, ...]  (Write - requires security)          │
│  Expected: [0x7F, 0x2E, 0x33]  (Security Access Denied)       │
│  Check:    ✓ Write fails due to locked security              │
│                                                                │
│  TEST PASSES IF:                                               │
│  • Security is cleared when leaving Extended                  │
│  • Subsequent protected operations fail with NRC 0x33         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Read-Only Diagnostic Workflow

```
┌────────────────────────────────────────────────────────────────┐
│          PATTERN 1: READ-ONLY DIAGNOSTIC WORKFLOW              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Purpose: Read vehicle information without modifications       │
│  Session: DEFAULT (0x01)                                       │
│  Security: NOT REQUIRED                                        │
│                                                                │
│  Workflow Diagram:                                             │
│                                                                │
│      START                                                     │
│        │                                                       │
│        ▼                                                       │
│  ┌──────────────┐                                             │
│  │  10 01       │  Enter Default Session (optional)           │
│  │  (Default)   │                                             │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  22 F1 90    │  Read VIN                                   │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  22 F1 87    │  Read Part Number                           │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  19 01 FF    │  Count DTCs                                 │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  19 02 FF    │  Read all DTCs                              │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│       END                                                      │
│                                                                │
│  Result: ✓ No session changes, no security needed             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Secure Write Configuration

```
┌────────────────────────────────────────────────────────────────┐
│        PATTERN 2: SECURE CONFIGURATION WRITE WORKFLOW          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Purpose: Write calibration or configuration data              │
│  Session: EXTENDED (0x03)                                      │
│  Security: REQUIRED                                            │
│                                                                │
│  Workflow Diagram:                                             │
│                                                                │
│      START                                                     │
│        │                                                       │
│        ▼                                                       │
│  ┌──────────────┐                                             │
│  │  10 03       │  Step 1: Enter Extended Session             │
│  │  (Extended)  │  ✓ Enables security access                  │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  27 01       │  Step 2: Request Seed                       │
│  │  (Req Seed)  │  ← Receive: [67 01 AA BB CC DD]            │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  27 02 KEY   │  Step 3: Send Key (calculated)              │
│  │  (Send Key)  │  ✓ Security now UNLOCKED 🔓                 │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  2E DID DATA │  Step 4: Write Configuration Data           │
│  │  (Write)     │  ✓ Now allowed (security unlocked)          │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  22 DID      │  Step 5: Verify Write (read back)           │
│  │  (Read)      │  ✓ Confirm data written correctly           │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  10 01       │  Step 6: Return to Default                  │
│  │  (Default)   │  ⚠️  Security now LOCKED 🔒                 │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│       END                                                      │
│                                                                │
│  CRITICAL: Must enter Extended BEFORE security access!        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 3: Firmware Update Workflow

```
┌────────────────────────────────────────────────────────────────┐
│          PATTERN 3: FIRMWARE UPDATE WORKFLOW                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Purpose: Flash new firmware to ECU                            │
│  Session: PROGRAMMING (0x02)                                   │
│  Security: REQUIRED                                            │
│                                                                │
│  Workflow Diagram:                                             │
│                                                                │
│      START                                                     │
│        │                                                       │
│        ▼                                                       │
│  ┌──────────────┐                                             │
│  │  10 02       │  Step 1: Programming Session                │
│  │ (Programming)│  ⚠️  Must be in this session!               │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  27 01       │  Step 2: Request Seed                       │
│  │  27 02 KEY   │  Step 3: Unlock Security                    │
│  └──────┬───────┘  ✓ Security UNLOCKED 🔓                     │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  34 ...      │  Step 4: Request Download                   │
│  │ (Req Dnload) │  • Specify memory address & size            │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  36 01 DATA  │  Step 5: Transfer Data Block 1              │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  36 02 DATA  │  Step 6: Transfer Data Block 2              │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│      [ ... ]         (Continue for all blocks)                 │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  36 NN DATA  │  Step N: Transfer Data Block N              │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  37          │  Step N+1: Request Transfer Exit            │
│  │ (Exit Xfer)  │  ✓ Finalize flash operation                 │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  11 01       │  Step N+2: Hard Reset ECU                   │
│  │ (ECU Reset)  │  → Automatically returns to DEFAULT         │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│       END                                                      │
│                                                                │
│  CRITICAL SEQUENCE:                                            │
│  1. MUST use Programming Session (not Extended!)              │
│  2. Security required before 0x34                             │
│  3. Must call 0x34 before any 0x36                            │
│  4. Maintain correct block sequence numbers                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### Debug Flowchart: Session Control Failed

```
┌─────────────────────────────────────────────────────────────────┐
│        DEBUGGING: SID 10 SESSION CONTROL FAILED                 │
└─────────────────────────────────────────────────────────────────┘

         Request Failed?
                │
                ▼
         ┌──────────────┐
         │ Is Response  │
         │  0x7F?       │
         └──┬───────┬───┘
            │ NO    │ YES
            │       │
            │       ▼
            │  ┌──────────────┐
            │  │ Check NRC    │
            │  │ (byte 2)     │
            │  └──┬───────────┘
            │     │
            │     ├─────────┬────────┬─────────┐
            │     │         │        │         │
            │     ▼         ▼        ▼         ▼
            │  [0x12]   [0x13]   [0x22]   [0x7F]
            │     │         │        │         │
            │     ▼         ▼        ▼         ▼
            │ Invalid   Wrong   Bad      Service Not
            │ SubFunc   Length  Conds   in Session
            │     │         │        │         │
            │     ▼         ▼        ▼         ▼
            │  Use      Check    Fix      Already in
            │  01,02    byte     vehicle   correct
            │  or 03    count    state     session?
            │
            ▼
      No Response?
            │
            ▼
      ┌──────────────┐
      │ Check:       │
      │ • CAN bus OK?│
      │ • ECU power? │
      │ • Timeout?   │
      └──────────────┘
```

### Debug Checklist

```
┌────────────────────────────────────────────────────────────────┐
│              SID 10 DEBUGGING CHECKLIST                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ STEP 1: Validate Request Format                            │
│    ══════════════════════════════                              │
│    □ Request has exactly 2 bytes?                             │
│    □ Byte 0 = 0x10?                                           │
│    □ Byte 1 in [0x01, 0x02, 0x03]?                           │
│    □ No extra bytes?                                          │
│                                                                │
│  ✓ STEP 2: Check Response Type                                │
│    ═════════════════════════                                   │
│    □ Positive (0x50)? → SUCCESS                               │
│    □ Negative (0x7F)? → Check NRC                            │
│    □ No response? → Check communication                       │
│                                                                │
│  ✓ STEP 3: Analyze NRC (if negative)                          │
│    ═══════════════════════════════                             │
│    □ 0x12 → Invalid subfunction value                         │
│    □ 0x13 → Wrong message length                              │
│    □ 0x22 → Vehicle conditions not met                        │
│    □ 0x7F → Service not supported in current session          │
│                                                                │
│  ✓ STEP 4: Verify State Changes                               │
│    ══════════════════════════                                  │
│    □ Session state updated correctly?                         │
│    □ Security reset as expected?                              │
│    □ Timeout timer started?                                   │
│                                                                │
│  ✓ STEP 5: Check Timing                                       │
│    ══════════════════                                          │
│    □ Response within P2 timeout (50ms)?                       │
│    □ Session timeout (S3) configured?                         │
│    □ Activity resetting timeout properly?                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Common Issues and Solutions

```
┌────────────────────────────────────────────────────────────────┐
│           COMMON ISSUES & SOLUTIONS GUIDE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Problem 1: NRC 0x13 (Incorrect Message Length)               │
│  ═══════════════════════════════════════════════               │
│  Symptom:   Request → [0x7F, 0x10, 0x13]                      │
│  Causes:    • Missing subfunction byte                         │
│             • Extra data bytes appended                        │
│  Solution:  Ensure exactly 2 bytes: [0x10, subfunction]       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Problem 2: NRC 0x12 (Sub-Function Not Supported)             │
│  ══════════════════════════════════════════════                │
│  Symptom:   Request → [0x7F, 0x10, 0x12]                      │
│  Causes:    • Subfunction not in [0x01, 0x02, 0x03]           │
│             • Typo in subfunction value                        │
│  Solution:  Use only valid subfunctions:                       │
│             0x01 (Default), 0x02 (Programming), 0x03 (Extend) │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Problem 3: Security Lost After Session Change                │
│  ═══════════════════════════════════════════                   │
│  Symptom:   Write fails with NRC 0x33 after session switch    │
│  Causes:    • Changed session from Extended to other           │
│             • Security automatically reset                     │
│  Solution:  Re-unlock security (0x27 01/02) after session     │
│             change, OR stay in Extended session                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Problem 4: Timeout Returning to Default                      │
│  ════════════════════════════════════                          │
│  Symptom:   Session unexpectedly resets to DEFAULT            │
│  Causes:    • No activity for S3 timeout period (5s)          │
│             • Timer not being reset properly                   │
│  Solution:  Send periodic "keep-alive" requests, or           │
│             increase S3 timeout value if supported             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Visual Concepts

```
┌────────────────────────────────────────────────────────────────┐
│                  SID 10 VISUAL SUMMARY                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. REQUEST FLOW                                               │
│     Validate → Check Conditions → Update State → Respond      │
│                                                                │
│  2. STATE MACHINE                                              │
│     DEFAULT ⇄ EXTENDED ⇄ PROGRAMMING                          │
│     (Security reset on transitions!)                           │
│                                                                │
│  3. NRC DECISION TREE                                          │
│     SubFunc Exists? → Valid? → Length OK? → Conditions OK?    │
│                                                                │
│  4. TIMEOUT BEHAVIOR                                           │
│     Activity → Reset Timer → No Activity → Return to DEFAULT  │
│                                                                │
│  5. INTEGRATION PATTERNS                                       │
│     • Read-Only: Just DEFAULT session                          │
│     • Write: DEFAULT → EXTENDED → Unlock → Write → DEFAULT   │
│     • Flash: DEFAULT → PROGRAMMING → Unlock → Flash → Reset  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Testing Matrix

| Test Type | Scenarios | Critical Checks |
|-----------|-----------|----------------|
| Format Validation | 4 test cases | Message length, subfunction value |
| NRC Generation | 4 test cases | Correct NRC for each error type |
| State Transitions | 3 test cases | Session updates, security reset |
| Timeout | 2 test cases | Timer reset, auto-return to DEFAULT |
| Integration | 3 patterns | Multi-service workflows |

---

**Document Version**: 2.0  
**Last Updated**: 2025-10-11  
**Format**: Visual Diagrams & Flowcharts  
**Related Files**: 
- `docs/learning/SID_10_DIAGNOSTIC_SESSION_CONTROL.md`
- `docs/learning/SID_10_SERVICE_INTERACTIONS.md`
- `src/services/UDSSimulator.ts`
