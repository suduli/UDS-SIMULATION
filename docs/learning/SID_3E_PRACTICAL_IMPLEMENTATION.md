# SID 0x3E:  Practical Implementation Guide

**Document Version**:  2.0  
**Last Updated**: December 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.3

---

## Table of Contents

1. [Request Processing Flow](#request-processing-flow)
2. [Sub-function Validation Logic](#sub-function-validation-logic)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [State Machine Diagrams](#state-machine-diagrams)
5. [Testing Scenarios](#testing-scenarios)
6. [Integration Patterns](#integration-patterns)
7. [Debugging Guide](#debugging-guide)
8. [Best Practices](#best-practices)

---

## Request Processing Flow

### High-Level Processing Flowchart

```
                    ┌──────────────────┐
                    │ Receive Request  │
                    │   (SID 0x3E)     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Validate Length  │
               ┌────┤ (= 2 bytes)?     │────┐
               │    └──────────────────┘    │
              NO                            YES
               │                             │
               ▼                             ▼
        ┌─────────────┐           ┌──────────────────┐
        │ Return NRC  │           │ Extract          │
        │    0x13     │           │ Sub-function     │
        └─────────────┘           └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Sub-function     │
                                  │ Valid?           │
                                  │ (0x00 or 0x80)   │
                                  └────────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                   NO                     YES                     │
                    │                      │                      │
                    ▼                      ▼                      │
            ┌──────────────┐      ┌──────────────┐              │
            │ Return NRC   │      │ Reset P3     │              │
            │    0x12      │      │ Server Timer │              │
            └──────────────┘      └──────┬───────┘              │
                                         │                       │
                                         ▼                       │
                                  ┌──────────────┐              │
                                  │ Sub-function │              │
                                  │ = 0x00?       │              │
                                  └──────┬───────┘              │
                                         │                       │
                                    ┌────┴────┐                 │
                                   YES       NO                 │
                                    │          │                 │
                                    ▼          ▼                 │
                            ┌──────────┐  ┌──────────┐          │
                            │Send Pos  │  │Suppress  │          │
                            │Response  │  │Response  │          │
                            │0x7E 0x00 │  │(No msg)  │          │
                            └──────────┘  └──────────┘          │
                                    │          │                 │
                                    └────┬─────┘                 │
                                         │                       │
                                         ▼                       │
                                    ┌──────────┐                │
                                    │   Done   │                │
                                    └──────────┘                │
```

### Detailed Request Validation Flow

```
         ┌─────────────────────┐
         │ Start Processing    │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check byte 0 = 0x3E? │
         └──────────┬──────────┘
                    │
              ┌─────┴─────┐
             NO           YES
              │             │
              ▼             ▼
         ┌─────────┐   ┌──────────────────┐
         │ Ignore  │   │ Length Check:     │
         │ (not    │   │ Exactly 2 bytes? │
         │ 0x3E)   │   └────────┬─────────┘
         └─────────┘            │
                          ┌─────┴─────┐
                         NO           YES
                          │             │
                          ▼             ▼
                   ┌──────────┐   ┌──────────────┐
                   │Return NRC│   │ Parse        │
                   │   0x13   │   │ Sub-function │
                   └──────────┘   │ (byte 1)     │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Sub-fn is    │
                                  │ 0x00 or 0x80? │
                                  └──────┬───────┘
                                         │
                                    ┌────┴────┐
                                   NO        YES
                                    │          │
                                    ▼          ▼
                              ┌──────────┐  ┌──────────┐
                              │Return NRC│  │Process   │
                              │   0x12   │  │Request   │
                              └──────────┘  └──────────┘
```

---

## Sub-function Validation Logic

### Sub-function Validation Table

```
┌──────────────┬─────────────┬──────────────┬────────────────┐
│ Sub-function │ Hex Value   │ Valid?        │ Action         │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ 0x00         │ 0000 0000   │ ✓ YES        │ Send 0x7E 0x00 │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ 0x01-0x7F    │ 0xxx xxxx   │ ✗ NO         │ NRC 0x12       │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ 0x80         │ 1000 0000   │ ✓ YES        │ No response    │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ 0x81-0xFF    │ 1xxx xxxx   │ ✗ NO         │ NRC 0x12       │
└──────────────┴─────────────┴──────────────┴────────────────┘
```

### Bit-Level Validation

```
┌─────────────────────────────────────────────────────────────┐
│           SUB-FUNCTION VALIDATION LOGIC                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input:  Sub-function byte (1 byte)                          │
│                                                             │
│  Step 1: Check if bit 7 is set                              │
│  ┌────────────────────────────────────┐                    │
│  │ Bit 7 = 1?                          │                    │
│  │  YES → Suppress response mode      │                    │
│  │  NO  → Normal response mode        │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
│  Step 2: Check bits 0-6                                     │
│  ┌────────────────────────────────────┐                    │
│  │ Bits 0-6 = 0x00?                    │                    │
│  │  YES → Valid sub-function          │                    │
│  │  NO  → Invalid (NRC 0x12)          │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
│  Valid Combinations:                                        │
│  • 0x00 = 0000 0000 → Normal (respond)                     │
│  • 0x80 = 1000 0000 → Suppress (no response)               │
│                                                             │
│  Invalid Examples:                                          │
│  • 0x01 = 0000 0001 → NRC 0x12                             │
│  • 0x7F = 0111 1111 → NRC 0x12                             │
│  • 0x81 = 1000 0001 → NRC 0x12                             │
│  • 0xFF = 1111 1111 → NRC 0x12                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## NRC Decision Trees

### Master NRC Decision Tree

```
                        Start Processing
                              │
                              ▼
                    ┌──────────────────┐
                    │ Message length   │
               ┌────┤ = 2 bytes?       │────┐
              NO    └──────────────────┘   YES
               │                             │
               ▼                             ▼
          NRC 0x13                  ┌────────────────┐
       (Length Error)               │ Sub-function   │
                                ┌───┤ = 0x00 or 0x80?│───┐
                               NO   └────────────────┘  YES
                                │                        │
                                ▼                        ▼
                           NRC 0x12              ┌──────────────┐
                      (Sub-fn Invalid)           │ ECU state    │
                                            ┌────┤ normal?       │────┐
                                           NO    └──────────────┘   YES
                                            │                        │
                                            ▼                        ▼
                                       NRC 0x22              Positive Response
                                  (Conditions Not              or Suppressed
                                      Correct)
```

### Specific NRC Conditions

```
┌─────────────────────────────────────────────────────────────┐
│                  NRC 0x13 CONDITIONS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger Conditions:                                        │
│  • Message length < 2 bytes                                 │
│  • Message length > 2 bytes                                 │
│  • Missing sub-function byte                                │
│  • Extra padding bytes present                              │
│                                                             │
│  Examples:                                                  │
│  ┌──────────────────┬─────────────────────┐                │
│  │ Message          │ Result              │                │
│  ├──────────────────┼─────────────────────┤                │
│  │ [3E]             │ NRC 0x13 (too short)│                │
│  │ [3E 00 FF]       │ NRC 0x13 (too long) │                │
│  │ [3E 00 00 00]    │ NRC 0x13 (too long) │                │
│  └──────────────────┴─────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  NRC 0x12 CONDITIONS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger Conditions:                                         │
│  • Sub-function not 0x00 or 0x80                            │
│  • Invalid bit pattern in sub-function byte                 │
│                                                             │
│  Examples:                                                  │
│  ┌──────────────────┬─────────────────────┐                │
│  │ Message          │ Result              │                │
│  ├──────────────────┼─────────────────────┤                │
│  │ [3E 01]          │ NRC 0x12            │                │
│  │ [3E 7F]          │ NRC 0x12            │                │
│  │ [3E 81]          │ NRC 0x12            │                │
│  │ [3E FF]          │ NRC 0x12            │                │
│  │ [3E 40]          │ NRC 0x12            │                │
│  └──────────────────┴─────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  NRC 0x22 CONDITIONS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger Conditions (RARE for 0x3E):                        │
│  • ECU in fault state                                       │
│  • Critical system error                                    │
│  • ECU not fully initialized                                │
│  • Hardware malfunction                                     │
│                                                             │
│  Note: Very uncommon for Tester Present service            │
│        Most ECUs accept 0x3E in any state                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## State Machine Diagrams

### Session Timer State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              SESSION TIMER STATE MACHINE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│        ┌─────────────────────────────────┐                 │
│        │   DEFAULT SESSION (0x01)        │                 │
│        │                                 │                 │
│        │  State: STABLE                  │                 │
│        │  Timer:  INACTIVE                │                 │
│        │  Tester Present: Not required   │                 │
│        └─────────┬───────────────────────┘                 │
│                  │                                          │
│                  │ SID 0x10 0x03                            │
│                  │ (Enter Extended)                         │
│                  ▼                                          │
│        ┌─────────────────────────────────┐                 │
│        │  EXTENDED SESSION (0x03)        │                 │
│        │                                 │                 │
│        │  State:  ACTIVE                  │                 │
│   ┌───>│  Timer: COUNTING (5000ms)       │────┐            │
│   │    │  Tester Present:  REQUIRED       │    │            │
│   │    └─────────────────────────────────┘    │            │
│   │                                            │            │
│   │                                            │            │
│   │    ┌─────────────────────────────────┐    │            │
│   │    │  Timer Events:                  │    │            │
│   └────┤  • Tester Present → Reset timer │────┘            │
│        │  • Any UDS msg → Reset timer    │                 │
│        │  • Timeout → Return to DEFAULT  │                 │
│        └─────────────────────────────────┘                 │
│                                                             │
│                                                             │
│        Timeout Transition:                                   │
│        ┌─────────────────────┐                             │
│        │  EXTENDED/PROG      │                             │
│        │  (Timer = 0)        │                             │
│        └──────────┬──────────┘                             │
│                   │                                         │
│                   │ [Timeout Event]                         │
│                   │                                         │
│                   ▼                                         │
│        ┌─────────────────────┐                             │
│        │  Return to DEFAULT  │                             │
│        │  • Lock security    │                             │
│        │  • Clear session    │                             │
│        │  • Stop timer       │                             │
│        └─────────────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Response Behavior State Machine

```
┌─────────────────────────────────────────────────────────────┐
│           TESTER PRESENT RESPONSE BEHAVIOR                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                 ┌─────────────────┐                         │
│                 │  Request        │                         │
│                 │  Received       │                         │
│                 │  (0x3E)         │                         │
│                 └────────┬────────┘                         │
│                          │                                  │
│                          ▼                                  │
│                 ┌─────────────────┐                         │
│                 │  Parse          │                         │
│                 │  Sub-function   │                         │
│                 └────────┬────────┘                         │
│                          │                                  │
│              ┌───────────┴───────────┐                      │
│              │                       │                      │
│              ▼                       ▼                      │
│     ┌────────────────┐      ┌────────────────┐             │
│     │  Sub-fn = 0x00 │      │  Sub-fn = 0x80 │             │
│     │  (Normal)      │      │  (Suppress)    │             │
│     └────────┬───────┘      └────────┬───────┘             │
│              │                       │                      │
│              │                       │                      │
│              ▼                       ▼                      │
│     ┌────────────────┐      ┌────────────────┐             │
│     │ STATE:          │      │ STATE:         │             │
│     │ RESPOND        │      │ SILENT         │             │
│     └────────┬───────┘      └────────┬───────┘             │
│              │                       │                      │
│              ▼                       ▼                      │
│     ┌────────────────┐      ┌────────────────┐             │
│     │ Reset P3 timer │      │ Reset P3 timer │             │
│     └────────┬───────┘      └────────┬───────┘             │
│              │                       │                      │
│              ▼                       ▼                      │
│     ┌────────────────┐      ┌────────────────┐             │
│     │ Build response │      │ No response    │             │
│     │ [0x7E 0x00]    │      │ (bus silent)   │             │
│     └────────┬───────┘      └────────────────┘             │
│              │                                              │
│              ▼                                              │
│     ┌────────────────┐                                      │
│     │ Send to CAN    │                                      │
│     └────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timer Reset Mechanism

```
┌─────────────────────────────────────────────────────────────┐
│              P3SERVER TIMER RESET LOGIC                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  State: EXTENDED or PROGRAMMING Session                     │
│                                                             │
│  Timer State Diagram:                                       │
│                                                             │
│  ┌─────────┐                                                │
│  │ Timer   │                                                │
│  │ = 5000  │◄───────────────────┐                          │
│  └────┬────┘                    │                          │
│       │                         │                          │
│       │ [Countdown]             │ [ANY UDS Message]        │
│       │                         │ Including:                │
│       ▼                         │ • 0x3E (Tester Present)  │
│  ┌─────────┐                    │ • 0x22 (Read DID)        │
│  │ Timer   │                    │ • 0x2E (Write DID)       │
│  │ = 4000  │                    │ • 0x31 (Routine)         │
│  └────┬────┘                    │ • Any other service      │
│       │                         │                          │
│       │ [Countdown]             │                          │
│       │                         │                          │
│       ▼                         │                          │
│  ┌─────────┐                    │                          │
│  │ Timer   │                    │                          │
│  │ = 3000  │────────────────────┘                          │
│  └────┬────┘                                               │
│       │                                                     │
│       │ [If reaches 0]                                      │
│       ▼                                                     │
│  ┌─────────┐                                                │
│  │ TIMEOUT │                                                │
│  │ Return  │                                                │
│  │ DEFAULT │                                                │
│  └─────────┘                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Normal Request with Response (0x00)

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Basic Tester Present with positive response         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session:  EXTENDED (0x03)                                 │
│ • Security: Not required                                   │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  3E 00                  │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Validate:  length = 2]     │
│     │                         │ [Validate: sub-fn = 0x00]  │
│     │                         │ [Reset P3 timer]           │
│     │                         │ [Build response]           │
│     │                         │                            │
│     │  7E 00                  │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result:  ✓ SUCCESS                                 │
│ Response: 0x7E 0x00                                        │
│                                                            │
│ Verify:                                                    │
│ • Response starts with 0x7E                                │
│ • Sub-function echoed back (0x00)                          │
│ • Response length = 2 bytes                                │
│ • P3 server timer reset to 5000ms                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 2: Suppressed Response (0x80)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Tester Present with suppressed response             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                      │
│ • Session: EXTENDED (0x03)                                 │
│ • Security: Not required                                   │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  3E 80                  │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Validate: length = 2]     │
│     │                         │ [Validate: sub-fn = 0x80]  │
│     │                         │ [Reset P3 timer]           │
│     │                         │ [Suppress response]        │
│     │                         │                            │
│     │  (no response)          │                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Response:  NONE (suppressed)                                │
│                                                            │
│ Verify:                                                    │
│ • No response received                                     │
│ • CAN bus silent after request                             │
│ • P3 server timer reset to 5000ms (internally)             │
│ • Session remains EXTENDED                                 │
│ • Follow-up diagnostic requests work                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 3: Invalid Sub-function (NRC 0x12)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Invalid sub-function value                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  3E 01                  │ (Invalid sub-fn 0x01)      │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Validate: length = 2 ✓]   │
│     │                         │ [Validate: sub-fn = 0x01]  │
│     │                         │ [0x01 NOT VALID! ]          │
│     │                         │                            │
│     │  7F 3E 12               │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x12 (Sub-function Not Supported)                      │
│                                                            │
│ Verify:                                                    │
│ • Byte 0 = 0x7F                                            │
│ • Byte 1 = 0x3E (requested SID)                            │
│ • Byte 2 = 0x12 (NRC)                                      │
│ • Timer NOT reset (session may timeout!)                   │
│                                                            │
│ Additional Test Cases:                                     │
│ • 3E 7F → 7F 3E 12                                         │
│ • 3E 81 → 7F 3E 12                                         │
│ • 3E FF → 7F 3E 12                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 4: Incorrect Length (NRC 0x13)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Message length validation                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Test Case A: Too Short                                     │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  3E                     │ (Only 1 byte!)             │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Length check: 1 ≠ 2]      │
│     │                         │ [FAIL! ]                    │
│     │                         │                            │
│     │  7F 3E 13               │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Test Case B: Too Long                                      │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  3E 00 FF               │ (3 bytes!)                 │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Length check:  3 ≠ 2]      │
│     │                         │ [FAIL! ]                    │
│     │                         │                            │
│     │  7F 3E 13               │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x13 (Incorrect Message Length)                        │
│                                                            │
│ Verify:                                                    │
│ • Byte 0 = 0x7F                                            │
│ • Byte 1 = 0x3E                                            │
│ • Byte 2 = 0x13                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 5: Session Timeout Prevention

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Verify timer reset prevents timeout                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                      │
│ • Session: EXTENDED (timeout = 5000ms)                     │
│ • Test duration: 12 seconds                                │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Time    Tester              ECU              Timer       │
│     │                          │                │          │
│   T=0s   10 03 ──────────────>│                │          │
│          50 03 <───────────────│              Start        │
│                                │              5000ms       │
│                                                            │
│   T=2s   3E 80 ──────────────>│                │          │
│                                │              RESET        │
│                                │              5000ms       │
│                                                            │
│   T=4s   3E 80 ──────────────>│                │          │
│                                │              RESET        │
│                                │              5000ms       │
│                                                            │
│   T=6s   3E 80 ──────────────>│                │          │
│                                │              RESET        │
│                                │              5000ms       │
│                                                            │
│   T=8s   3E 80 ──────────────>│                │          │
│                                │              RESET        │
│                                │              5000ms       │
│                                                            │
│   T=10s  3E 80 ──────────────>│                │          │
│                                │              RESET        │
│                                │              5000ms       │
│                                                            │
│   T=12s  22 F186 ────────────>│ (Check session)           │
│          62 F186 03 <──────────│ ✓ Still EXTENDED          │
│                                                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Session maintained for 12 seconds (> 2x timeout)           │
│                                                            │
│ Verify:                                                    │
│ • Session never timed out                                  │
│ • Timer reset 5 times                                      │
│ • Final diagnostic request successful                      │
│ • Session still EXTENDED at end                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 6: Timeout Without Tester Present

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Verify timeout occurs without Tester Present        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                      │
│ • Session: EXTENDED (timeout = 5000ms)                     │
│ • NO Tester Present sent                                   │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Time    Tester              ECU              Timer       │
│     │                          │                │          │
│   T=0s   10 03 ──────────────>│                │          │
│          50 03 <───────────────│              Start        │
│                                │              5000ms       │
│                                                            │
│   T=1-4s (NO ACTIVITY)         │            4000ms         │
│                                │            3000ms         │
│                                │            2000ms         │
│                                │            1000ms         │
│                                                            │
│   T=5s                         │            TIMEOUT!        │
│                                │            [Return to     │
│                                │             DEFAULT]      │
│                                                            │
│   T=6s   22 0105 ────────────>│ (Try to read sensor)      │
│          7F 22 7F <────────────│ ✗ Wrong session!           │
│                                                            │
│                                                            │
│ Expected Result: ✓ TIMEOUT OCCURRED                        │
│ Session returned to DEFAULT after 5 seconds                │
│                                                            │
│ Verify:                                                    │
│ • Timeout occurred at T=5s                                 │
│ • ECU returned to DEFAULT session                          │
│ • Subsequent request failed with NRC 0x7F                  │
│ • Session-specific services no longer available            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Background Timer Implementation

```
┌─────────────────────────────────────────────────────────────┐
│           BACKGROUND TIMER PATTERN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Component Architecture:                                    │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Main Diagnostic │         │  Timer Thread    │         │
│  │  Thread          │         │  (Background)    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │  ① Start Session           │                    │
│           │─────────────────────────> ECU                   │
│           │                            │                    │
│           │  ② Enable Timer            │                    │
│           │───────────────────────────>│                    │
│           │                            │                    │
│           │                            │ Every 2 seconds:    │
│           │                            │ Send 3E 80 ──> ECU │
│           │                            │                    │
│           │  ③ Diagnostic Work         │                    │
│           │─────────────────────────> ECU                   │
│           │                            │                    │
│           │                            │ Continue sending   │
│           │                            │ 3E 80 in bg       │
│           │                            │                    │
│           │  ④ Disable Timer           │                    │
│           │───────────────────────────>│                    │
│           │                            │ [Stop timer]       │
│           │                            │                    │
│           │  ⑤ Exit Session            │                    │
│           │─────────────────────────> ECU                   │
│           │                            │                    │
│                                                             │
│  Pseudo-logic:                                              │
│  ┌────────────────────────────────────────┐                │
│  │ Main Thread:                            │                │
│  │   enter_session(EXTENDED)              │                │
│  │   start_tester_present_timer(2000ms)   │                │
│  │   do_diagnostic_work()                 │                │
│  │   stop_tester_present_timer()          │                │
│  │   exit_session()                       │                │
│  │                                        │                │
│  │ Timer Thread:                          │                │
│  │   while(enabled):                      │                │
│  │     sleep(2000ms)                      │                │
│  │     send_can([0x3E, 0x80])             │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Explicit Keep-Alive in Long Operations

```
┌─────────────────────────────────────────────────────────────┐
│         EXPLICIT KEEP-ALIVE PATTERN                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Use Case:  Long operation where timing is known            │
│                                                             │
│  Flow:                                                      │
│                                                             │
│  ┌────────────────────────────────┐                        │
│  │ 1. Enter Programming Session   │                        │
│  │    send:  10 02                 │                        │
│  │    recv: 50 02                 │                        │
│  └────────────┬───────────────────┘                        │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────┐                        │
│  │ 2. Start Download (34)         │                        │
│  │    Expected duration: 90s      │                        │
│  └────────────┬───────────────────┘                        │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────┐                        │
│  │ 3. Loop:  Transfer blocks       │                        │
│  │    for each block:              │                        │
│  │      if (time_since_last > 3s):│                        │
│  │        send:  3E 80              │                        │
│  │      send: 36 [block]          │                        │
│  │      recv: 76                  │                        │
│  └────────────┬───────────────────┘                        │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────┐                        │
│  │ 4. Exit Transfer (37)          │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  Timing Diagram:                                            │
│  ┌──────────────────────────────────────────────┐          │
│  │ T=0s:    34 [start] ──────────────────> ECU   │          │
│  │ T=1s:   36 01 [block 1] ────────────> ECU   │          │
│  │ T=2s:    36 02 [block 2] ────────────> ECU   │          │
│  │ T=3s:   3E 80 (keep-alive) ─────────> ECU   │          │
│  │ T=4s:    36 03 [block 3] ────────────> ECU   │          │
│  │ T=5s:   36 04 [block 4] ────────────> ECU   │          │
│  │ T=6s:   3E 80 (keep-alive) ─────────> ECU   │          │
│  │ ...                                           │          │
│  │ T=89s:  36 64 [block 100] ──────────> ECU   │          │
│  │ T=90s:  37 [exit] ──────────────────> ECU   │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 3: Adaptive Timing

```
┌─────────────────────────────────────────────────────────────┐
│              ADAPTIVE TIMING PATTERN                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Adjusts Tester Present frequency based on activity        │
│                                                             │
│  State Machine:                                             │
│                                                             │
│  ┌────────────────┐                                         │
│  │ IDLE STATE     │                                         │
│  │ Interval:  2s   │                                         │
│  └───────┬────────┘                                         │
│          │                                                  │
│          │ [Diagnostic activity detected]                   │
│          │                                                  │
│          ▼                                                  │
│  ┌────────────────┐                                         │
│  │ ACTIVE STATE   │                                         │
│  │ Interval: 4s   │  (Less frequent, diagnostics reset     │
│  └───────┬────────┘   timer)                               │
│          │                                                  │
│          │ [No activity for 10s]                            │
│          │                                                  │
│          ▼                                                  │
│  ┌────────────────┐                                         │
│  │ IDLE STATE     │                                         │
│  │ Interval: 2s   │  (More frequent, no other messages)    │
│  └────────────────┘                                         │
│                                                             │
│  Logic:                                                     │
│  ┌────────────────────────────────────────────┐            │
│  │ if (time_since_last_diagnostic < 5s):      │            │
│  │   interval = 4000ms  // Relax frequency    │            │
│  │ else:                                      │            │
│  │   interval = 2000ms  // More frequent      │            │
│  │                                            │            │
│  │ Benefits:                                    │            │
│  │ • Reduces bus load during active use       │            │
│  │ • Ensures safety during idle periods       │            │
│  │ • Optimizes CAN bandwidth                  │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Debugging Guide

### Common Issues Checklist

```
┌────────────────────────────────────────────────────────────┐
│              TROUBLESHOOTING CHECKLIST                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Issue:  Session times out unexpectedly                      │
│ ☐ Is Tester Present being sent?                            │
│ ☐ Check interval:  Should be < 5 seconds                    │
│ ☐ Verify 3E messages on CAN bus                            │
│ ☐ Check if background timer is running                     │
│ ☐ Confirm no exceptions stopping timer                     │
│                                                            │
│ Issue: NRC 0x12 received                                    │
│ ☐ Verify sub-function is 0x00 or 0x80                      │
│ ☐ Check for bit manipulation errors                        │
│ ☐ Confirm no typos in hex values                           │
│ ☐ Validate message construction logic                      │
│                                                            │
│ Issue: NRC 0x13 received                                    │
│ ☐ Message length exactly 2 bytes?                           │
│ ☐ No extra padding bytes?                                   │
│ ☐ Sub-function byte present?                               │
│ ☐ Check CAN frame construction                             │
│                                                            │
│ Issue: CAN bus overloaded                                   │
│ ☐ Using 0x80 (suppress) instead of 0x00?                    │
│ ☐ Interval not too short (< 1 second)?                     │
│ ☐ Multiple tools sending Tester Present?                   │
│ ☐ Check for duplicate timer threads                        │
│                                                            │
│ Issue:  Tester Present not preventing timeout               │
│ ☐ Correct CAN ID (physical or functional)?                 │
│ ☐ ECU receiving messages (check ACK)?                      │
│ ☐ Messages well-formed (valid ISO-TP)?                     │
│ ☐ Session actually in EXTENDED/PROG?                        │
│                                                            │
│ Issue: Random timeouts during long operations               │
│ ☐ Timer thread priority high enough?                       │
│ ☐ System under heavy load?                                 │
│ ☐ Timing jitter excessive?                                 │
│ ☐ Consider reducing interval for safety margin             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Debug Logging Template

```
┌─────────────────────────────────────────────────────────────┐
│                   DEBUG LOG TEMPLATE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Timestamp] [Level] [Component] Message                    │
│                                                             │
│  Example Logs:                                              │
│                                                             │
│  [00:00.000] [INFO] [SESSION] Entered EXTENDED (0x03)      │
│  [00:00.010] [INFO] [TIMER] Started Tester Present timer   │
│  [00:00.015] [INFO] [TIMER] Interval: 2000ms               │
│  [00:02.001] [DEBUG] [TIMER] Timer fired                   │
│  [00:02.002] [DEBUG] [CAN] TX: 3E 80                       │
│  [00:02.005] [DEBUG] [TIMER] P3 timer reset                │
│  [00:03.100] [DEBUG] [DIAG] TX: 22 0105                    │
│  [00:03.150] [DEBUG] [DIAG] RX: 62 0105 5A                 │
│  [00:04.001] [DEBUG] [TIMER] Timer fired                   │
│  [00:04.002] [DEBUG] [CAN] TX: 3E 80                       │
│  [00:04.005] [DEBUG] [TIMER] P3 timer reset                │
│  [00:06.001] [DEBUG] [TIMER] Timer fired                   │
│  [00:06.002] [DEBUG] [CAN] TX: 3E 80                       │
│  [00:06.005] [DEBUG] [TIMER] P3 timer reset                │
│  [00:08.000] [INFO] [TIMER] Stopped Tester Present timer   │
│  [00:08.010] [INFO] [SESSION] Exiting to DEFAULT           │
│                                                             │
│  Error Example:                                             │
│                                                             │
│  [00:05.123] [WARN] [CAN] No ACK for 3E 80                 │
│  [00:05.124] [ERROR] [ECU] Not responding                  │
│  [00:10.000] [ERROR] [SESSION] Timeout detected            │
│  [00:10.001] [ERROR] [SESSION] Returned to DEFAULT         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Network Analysis Tips

```
┌─────────────────────────────────────────────────────────────┐
│              CAN BUS ANALYSIS CHECKLIST                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Using CAN analyzer (CANalyzer, Wireshark, etc. ):          │
│                                                             │
│  ☑ Check Tester Present message frequency                   │
│    Expected: Every 2-3 seconds                              │
│    Command: Filter for "3E"                                 │
│                                                             │
│  ☑ Verify message format                                    │
│    Expected: [3E 80] or [3E 00]                             │
│    Length:  Exactly 2 bytes                                  │
│                                                             │
│  ☑ Check for responses (if using 0x00)                      │
│    Expected: [7E 00] within 50ms                            │
│                                                             │
│  ☑ Verify no responses (if using 0x80)                      │
│    Expected: CAN bus silent after 3E 80                     │
│                                                             │
│  ☑ Measure actual interval                                  │
│    Method: Calculate time between consecutive 3E messages   │
│    Acceptable range: 1800-3200ms (if target is 2000ms)      │
│                                                             │
│  ☑ Check for negative responses                             │
│    Look for:  [7F 3E xx]                                     │
│    If found, decode NRC (xx)                                │
│                                                             │
│  ☑ Monitor session state                                    │
│    Method: Send [22 F1 86] periodically                     │
│    Response should stay [62 F1 86 03] for EXTENDED          │
│                                                             │
│  ☑ Check CAN bus load                                       │
│    With 0x00:  ~2 msgs/sec × 2 = 4 CAN frames/sec            │
│    With 0x80: ~1 msg/sec × 1 = 1 CAN frame/sec              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### DO's ✓

```
┌────────────────────────────────────────────────────────────┐
│                  BEST PRACTICES - DO's                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✓ Use 0x80 (suppress response) for periodic keep-alive     │
│   Reason: Reduces CAN bus traffic by 50%                   │
│                                                            │
│ ✓ Send Tester Present every 2-3 seconds in background      │
│   Reason:  Provides safety margin vs 5s timeout             │
│                                                            │
│ ✓ Use 0x00 for initial handshake/confirmation              │
│   Reason:  Verify ECU is responding before going silent     │
│                                                            │
│ ✓ Implement as dedicated timer/thread                      │
│   Reason: Ensures reliability independent of main logic    │
│                                                            │
│ ✓ Stop timer when returning to DEFAULT session             │
│   Reason:  Unnecessary in DEFAULT (infinite timeout)        │
│                                                            │
│ ✓ Handle negative responses gracefully                     │
│   Reason: Detect and report ECU issues early               │
│                                                            │
│ ✓ Log all Tester Present activity for debugging            │
│   Reason: Essential for diagnosing timeout issues          │
│                                                            │
│ ✓ Increase frequency (1-2s) for critical operations        │
│   Reason: Extra safety during firmware updates             │
│                                                            │
│ ✓ Verify session state before starting long operations     │
│   Reason:  Ensure you're in correct session first           │
│                                                            │
│ ✓ Test timeout scenarios during development                │
│   Reason: Validate timeout handling works correctly        │
│                                                            │
│ ✓ Use exact 2-byte message format                          │
│   Reason: Avoid NRC 0x13 (length error)                    │
│                                                            │
│ ✓ Monitor CAN bus to confirm messages sent                 │
│   Reason:  Verify timer is actually working                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### DON'Ts ✗

```
┌────────────────────────────────────────────────────────────┐
│                 BEST PRACTICES - DON'Ts                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✗ Don't use 0x00 for periodic keep-alive                   │
│   Problem: Doubles CAN bus traffic unnecessarily           │
│   Solution: Use 0x80 instead                               │
│                                                            │
│ ✗ Don't send Tester Present too frequently (< 1 second)    │
│   Problem: Wastes bandwidth, may overwhelm ECU             │
│   Solution:  Stick to 2-3 second interval                   │
│                                                            │
│ ✗ Don't rely solely on Tester Present during active ops    │
│   Problem: Any diagnostic message resets timer             │
│   Note: If sending other messages, Tester Present optional │
│                                                            │
│ ✗ Don't ignore negative responses (NRC)                    │
│   Problem:  Miss early warning signs of ECU issues          │
│   Solution: Log and handle all NRCs                        │
│                                                            │
│ ✗ Don't assume timer is working without verification       │
│   Problem: Silent failures lead to unexpected timeouts     │
│   Solution: Monitor CAN bus periodically                   │
│                                                            │
│ ✗ Don't use invalid sub-functions (not 0x00/0x80)          │
│   Problem: ECU returns NRC 0x12, timer NOT reset           │
│   Solution: Only use 0x00 or 0x80                          │
│                                                            │
│ ✗ Don't send messages with wrong length                    │
│   Problem: NRC 0x13, session may timeout                   │
│   Solution:  Always exactly 2 bytes                         │
│                                                            │
│ ✗ Don't forget to start timer when entering session        │
│   Problem: Session times out during first operation        │
│   Solution: Start timer immediately after session change   │
│                                                            │
│ ✗ Don't leave timer running in DEFAULT session             │
│   Problem:  Unnecessary CAN traffic                         │
│   Solution: Stop timer when exiting to DEFAULT             │
│                                                            │
│ ✗ Don't use same timer instance across multiple sessions   │
│   Problem: Race conditions, incorrect state                │
│   Solution: Create new timer for each session              │
│                                                            │
│ ✗ Don't test only happy path scenarios                     │
│   Problem: Timeout issues only appear in production        │
│   Solution: Test timeout scenarios explicitly              │
│                                                            │
│ ✗ Don't hardcode timing values                             │
│   Problem: Different ECUs may have different timeouts      │
│   Solution: Make timing configurable                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Implementation Checklist

```
┌────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION CHECKLIST                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Design Phase:                                              │
│ ☐ Define timeout values (default:  5000ms)                  │
│ ☐ Choose Tester Present interval (default: 2000ms)         │
│ ☐ Select sub-function strategy (0x80 for periodic)         │
│ ☐ Design timer/thread architecture                         │
│ ☐ Plan error handling for NRCs                             │
│                                                            │
│ Implementation Phase:                                       │
│ ☐ Implement message construction (2 bytes)                 │
│ ☐ Implement sub-function validation                        │
│ ☐ Create background timer/thread                           │
│ ☐ Add timer start/stop logic                               │
│ ☐ Implement CAN transmission                               │
│ ☐ Add response handling (if using 0x00)                    │
│ ☐ Implement NRC detection and logging                      │
│ ☐ Add session state tracking                               │
│                                                            │
│ Testing Phase:                                              │
│ ☐ Test normal operation (0x00 and 0x80)                    │
│ ☐ Test invalid sub-function (expect NRC 0x12)              │
│ ☐ Test incorrect length (expect NRC 0x13)                  │
│ ☐ Test timeout prevention (long operations)                │
│ ☐ Test timeout occurrence (without Tester Present)         │
│ ☐ Test timer start/stop during session transitions         │
│ ☐ Measure actual timing with CAN analyzer                  │
│ ☐ Verify CAN bus load acceptable                           │
│ ☐ Test under load (CPU, network)                           │
│                                                            │
│ Production Readiness:                                       │
│ ☐ Add comprehensive logging                                │
│ ☐ Document timing configuration                            │
│ ☐ Create troubleshooting guide                             │
│ ☐ Implement monitoring/alerting                            │
│ ☐ Conduct integration testing                              │
│ ☐ Performance testing (long duration)                      │
│ ☐ Stress testing (multiple ECUs)                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**End of Practical Implementation Guide**

For theoretical concepts, see:  `SID_3E_TESTER_PRESENT. md`  
For service interactions, see: `SID_3E_SERVICE_INTERACTIONS.md`