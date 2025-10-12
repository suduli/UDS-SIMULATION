# SID 0x11 - ECU Reset Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.3

---

## Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [State Machine Diagrams](#state-machine-diagrams)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [Reset Execution Workflows](#reset-execution-workflows)
5. [Testing Scenarios](#testing-scenarios)
6. [Integration Patterns](#integration-patterns)
7. [Debugging Guide](#debugging-guide)
8. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Main ECU Reset Handler

```
                    ┌─────────────────────┐
                    │  Receive Request    │
                    │     (0x11 0xXX)     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                 ┌──┤ Message Length = 2? │──┐
                 │  └─────────────────────┘  │
                YES                          NO
                 │                            │
                 ▼                            ▼
    ┌─────────────────────┐        ┌──────────────────┐
    │ Extract Subfunction │        │ Return NRC 0x13  │
    │    (Byte 1)         │        │ (Incorrect Len)  │
    └──────────┬──────────┘        └──────────────────┘
               │
               ▼
    ┌─────────────────────┐
 ┌──┤ Subfunction Valid?  │──┐
 │  │ (0x01-0x05, or Mfr) │  │
YES └─────────────────────┘  NO
 │                            │
 │                            ▼
 │                 ┌──────────────────┐
 │                 │ Return NRC 0x12  │
 │                 │ (Sub Not Support)│
 │                 └──────────────────┘
 │
 ▼
┌─────────────────────┐
│ Check Session Type  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Session Allows      │──NO──> ┌──────────────────┐
│ This Reset Type?    │        │ Return NRC 0x7F  │
└──────────┬──────────┘        │ (Not In Session) │
          YES                  └──────────────────┘
           │
           ▼
┌─────────────────────┐
│ Check Security      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Security Required?  │──YES──> ┌─────────────────┐
└──────────┬──────────┘      ┌──┤ Security Open?  │──┐
          NO                 │  └─────────────────┘  │
           │                YES                      NO
           │                 │                        │
           │                 │                        ▼
           │                 │             ┌──────────────────┐
           │                 │             │ Return NRC 0x33  │
           │                 │             │ (Security Denied)│
           │                 │             └──────────────────┘
           │                 │
           └─────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check Conditions    │
         │ (Speed, Voltage,    │
         │  Temperature, etc.) │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
      ┌──┤ Conditions OK?      │──┐
      │  └─────────────────────┘  │
     YES                          NO
      │                            │
      ▼                            ▼
┌─────────────────────┐  ┌──────────────────┐
│ Send Positive       │  │ Return NRC 0x22  │
│ Response (0x51 0xXX)│  │ (Conditions Not  │
└──────────┬──────────┘  │  Correct)        │
           │             └──────────────────┘
           ▼
┌─────────────────────┐
│ Execute Reset       │
│ Based on Type       │
└─────────────────────┘
```

### Subfunction Router

```
         ┌──────────────────────┐
         │ Subfunction Value    │
         └──────────┬───────────┘
                    │
        ┌───────────┴───────────┬──────────────┬─────────────┐
        │           │           │              │             │
        ▼           ▼           ▼              ▼             ▼
    ┌───────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ 0x01  │  │ 0x02   │  │  0x03   │  │  0x04   │  │  0x05   │
    │ Hard  │  │ Key    │  │  Soft   │  │ Enable  │  │ Disable │
    │ Reset │  │ Off/On │  │  Reset  │  │ Rapid   │  │ Rapid   │
    └───┬───┘  └───┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
        │          │            │            │            │
        ▼          ▼            ▼            ▼            ▼
    ┌────────────────────────────────────────────────────────┐
    │         Execute Specific Reset Procedure               │
    └────────────────────────────────────────────────────────┘
```

---

## State Machine Diagrams

### ECU Reset State Machine

```
┌──────────────────────────────────────────────────────────────┐
│ ECU RESET STATE MACHINE                                      │
└──────────────────────────────────────────────────────────────┘

           ┌─────────────────────┐
           │   NORMAL OPERATION  │ ◄───────────┐
           │   [Running]         │             │
           └──────────┬──────────┘             │
                      │                        │
                      │ Reset Request          │
                      │ (0x11 0xXX)           │
                      ▼                        │
           ┌─────────────────────┐             │
           │   VALIDATING        │             │
           │   [Checking Req]    │             │
           └──────────┬──────────┘             │
                      │                        │
              ┌───────┴────────┐               │
              │                │               │
          Valid?            Invalid            │
              │                │               │
              ▼                ▼               │
   ┌─────────────────┐  ┌──────────────┐      │
   │  PREPARE RESET  │  │ SEND NRC     │      │
   │  [Saving Data]  │  │ [Reject Req] │──────┘
   └────────┬────────┘  └──────────────┘
            │
            │ Send 0x51 Response
            ▼
   ┌─────────────────┐
   │ RESPONSE SENT   │
   │ [Positive ACK]  │
   └────────┬────────┘
            │
            │ Start Reset Timer
            ▼
   ┌─────────────────┐
   │ PRE-RESET       │
   │ [Shutdown Apps] │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ EXECUTING RESET │
   │ [HW/SW Reset]   │
   └────────┬────────┘
            │
            │ Hardware/Software Reset
            ▼
   ┌─────────────────┐
   │ BOOTLOADER      │
   │ [Initializing]  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ POST-RESET      │
   │ [Self-Test]     │
   └────────┬────────┘
            │
            │ Initialization Complete
            ▼
   ┌─────────────────┐
   │ NORMAL OPERATION│
   │ [Default Session]│
   │ [Security 🔒]   │
   └─────────────────┘
```

### Communication State During Reset

```
┌──────────────────────────────────────────────────────────────┐
│ COMMUNICATION STATE TRANSITIONS                              │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  COMM ACTIVE    │
│  [TX/RX Ready]  │
└────────┬────────┘
         │
         │ Reset Request Received
         ▼
┌─────────────────┐
│  RESPONDING     │
│  [Send 0x51]    │
└────────┬────────┘
         │
         │ Response Sent
         ▼
┌─────────────────┐     Hard Reset (0x01)
│  COMM DRAINING  │◄──  Key Off/On (0x02)
│  [Finish TX]    │
└────────┬────────┘     Soft Reset (0x03)
         │              May stay active!
         │
         ▼
┌─────────────────┐
│  COMM OFFLINE   │
│  [Disconnected] │
└────────┬────────┘
         │
         │ ECU Restarting
         │ (2-15 seconds)
         ▼
┌─────────────────┐
│  COMM INIT      │
│  [CAN Setup]    │
└────────┬────────┘
         │
         │ Bus Active
         ▼
┌─────────────────┐
│  COMM ACTIVE    │
│  [TX/RX Ready]  │
│  [New Session]  │
└─────────────────┘
```

### Session State Transitions

```
Before Reset:              After Reset:
┌─────────────┐           ┌─────────────┐
│  DEFAULT    │           │  DEFAULT    │
│  Session    │           │  Session    │
└─────────────┘           └─────────────┘
       │                         ▲
       │ 10 03                   │
       ▼                         │
┌─────────────┐                  │
│  EXTENDED   │                  │
│  Session    │                  │
└─────────────┘                  │
       │                         │
       │ 11 01 (Reset)           │
       │─────────────────────────┘
       │
       ▼
   [ECU RESETS]
```

---

## NRC Decision Trees

### NRC Selection Decision Tree

```
                    ┌─────────────────────┐
                    │  Reset Request      │
                    │  Received (0x11)    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                 ┌──┤ Check Message       │
                 │  │ Length = 2 bytes?   │──┐
                NO  └─────────────────────┘ YES
                 │                           │
                 ▼                           ▼
        ┌──────────────────┐      ┌─────────────────────┐
        │  NRC: 0x13       │   ┌──┤ Subfunction in      │
        │  Incorrect Msg   │   │  │ Valid Range?        │──┐
        │  Length Or Format│  YES └─────────────────────┘  NO
        └──────────────────┘   │                           │
                               ▼                           ▼
                    ┌─────────────────────┐      ┌──────────────────┐
                 ┌──┤ Current Session     │      │  NRC: 0x12       │
                 │  │ Supports Reset?     │──┐   │  Sub-Function    │
                YES └─────────────────────┘  NO  │  Not Supported   │
                 │                           │   └──────────────────┘
                 │                           ▼
                 │                  ┌──────────────────┐
                 │                  │  NRC: 0x7F       │
                 │                  │  Service Not     │
                 │                  │  Supported In    │
                 │                  │  Active Session  │
                 │                  └──────────────────┘
                 ▼
      ┌─────────────────────┐
   ┌──┤ Security Access     │──┐
   │  │ Required?           │  │
  NO  └─────────────────────┘ YES
   │                           │
   │                           ▼
   │                ┌─────────────────────┐
   │             ┌──┤ Security            │──┐
   │             │  │ Unlocked?           │  │
   │            YES └─────────────────────┘  NO
   │             │                           │
   │             │                           ▼
   │             │                  ┌──────────────────┐
   │             │                  │  NRC: 0x33       │
   │             │                  │  Security Access │
   │             │                  │  Denied          │
   │             │                  └──────────────────┘
   │             │
   └─────────────┘
          │
          ▼
┌─────────────────────┐
│ Check Preconditions │
│ • Vehicle Speed     │
│ • Engine State      │
│ • Voltage Level     │
│ • Temperature       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ All Conditions   │──NO──> ┌──────────────────┐
│ Correct?         │        │  NRC: 0x22       │
└──────────┬──────────┘      │  Conditions Not  │
          YES                │  Correct         │
           │                 └──────────────────┘
           ▼
┌─────────────────────┐
│  ✓ POSITIVE         │
│  RESPONSE (0x51)    │
└─────────────────────┘
```

### Condition Check Decision Tree

```
                ┌─────────────────────┐
                │ Check Preconditions │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
             ┌──┤ Vehicle Speed = 0?  │──┐
            YES └─────────────────────┘  NO
             │                           │
             │                           ▼
             │                 ┌──────────────────┐
             │                 │ NRC 0x22         │
             │                 │ "Vehicle Moving" │
             │                 └──────────────────┘
             ▼
  ┌─────────────────────┐
┌─┤ Engine Off or Idle? │──┐
│ └─────────────────────┘  │
│                          │
YES                        NO
│                          │
│                          ▼
│                ┌──────────────────┐
│                │ NRC 0x22         │
│                │ "Engine Running" │
│                └──────────────────┘
│
▼
┌─────────────────────┐
│ Battery Voltage     │──┐
│ 9V < V < 16V?       │  │
└─────────────────────┘  │
         │               │
        YES              NO
         │               │
         │               ▼
         │     ┌──────────────────┐
         │     │ NRC 0x22         │
         │     │ "Voltage Out of  │
         │     │  Range"          │
         │     └──────────────────┘
         ▼
┌─────────────────────┐
│ No Critical Faults? │──┐
└─────────────────────┘  │
         │               │
        YES              NO
         │               │
         │               ▼
         │     ┌──────────────────┐
         │     │ NRC 0x22         │
         │     │ "Critical Fault  │
         │     │  Active"         │
         │     └──────────────────┘
         ▼
┌─────────────────────┐
│  ✓ CONDITIONS OK    │
│  PROCEED WITH RESET │
└─────────────────────┘
```

---

## Reset Execution Workflows

### Hard Reset (0x01) Execution Flow

```
┌──────────────────────────────────────────────────────────────┐
│ HARD RESET EXECUTION SEQUENCE                                │
└──────────────────────────────────────────────────────────────┘

  Step 1: Validate Request
  ┌─────────────────────┐
  │ Receive: 11 01      │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ Validate Session,   │
  │ Security, Conditions│
  └──────────┬──────────┘
             │
             ▼
  Step 2: Send Response
  ┌─────────────────────┐
  │ Send: 51 01         │
  │ (Optional: + Time)  │
  └──────────┬──────────┘
             │
             ▼
  Step 3: Pre-Reset Actions
  ┌─────────────────────┐
  │ • Save critical data│
  │   to EEPROM         │
  │ • Log reset reason  │
  │ • Set reset flag    │
  └──────────┬──────────┘
             │
             ▼
  Step 4: Shutdown Sequence
  ┌─────────────────────┐
  │ • Stop applications │
  │ • Close comm ports  │
  │ • Disable interrupts│
  └──────────┬──────────┘
             │
             ▼
  Step 5: Hardware Reset
  ┌─────────────────────┐
  │ • Trigger watchdog  │
  │   OR                │
  │ • Call reset routine│
  │ • Clear RAM         │
  └──────────┬──────────┘
             │
             ▼
  Step 6: Bootloader Phase
  ┌─────────────────────┐
  │ • Check reset reason│
  │ • Verify application│
  │ • Initialize HW     │
  └──────────┬──────────┘
             │
             ▼
  Step 7: Application Start
  ┌─────────────────────┐
  │ • Load application  │
  │ • Initialize modules│
  │ • Start scheduler   │
  └──────────┬──────────┘
             │
             ▼
  Step 8: Communication Init
  ┌─────────────────────┐
  │ • Init CAN/LIN      │
  │ • Set Default Session│
  │ • Lock Security 🔒  │
  └──────────┬──────────┘
             │
             ▼
  Step 9: Ready
  ┌─────────────────────┐
  │ ECU Ready for       │
  │ New Requests        │
  └─────────────────────┘

  Total Time: 5-15 seconds
```

### Soft Reset (0x03) Execution Flow

```
┌──────────────────────────────────────────────────────────────┐
│ SOFT RESET EXECUTION SEQUENCE                                │
└──────────────────────────────────────────────────────────────┘

  Step 1: Validate Request
  ┌─────────────────────┐
  │ Receive: 11 03      │
  └──────────┬──────────┘
             │
             ▼
  Step 2: Send Response
  ┌─────────────────────┐
  │ Send: 51 03         │
  └──────────┬──────────┘
             │
             ▼
  Step 3: Application Stop
  ┌─────────────────────┐
  │ • Stop app tasks    │
  │ • Save volatile data│
  │ • Pause services    │
  └──────────┬──────────┘
             │
             ▼
  Step 4: Selective Reset
  ┌─────────────────────┐
  │ • Clear app RAM     │
  │ • Keep comm stack   │
  │ • Preserve session? │
  └──────────┬──────────┘
             │
             ▼
  Step 5: Re-Initialize App
  ┌─────────────────────┐
  │ • Reload config     │
  │ • Restart tasks     │
  │ • Resume services   │
  └──────────┬──────────┘
             │
             ▼
  Step 6: Ready
  ┌─────────────────────┐
  │ ECU Ready           │
  │ Session: May persist│
  │ Comm: May stay up   │
  └─────────────────────┘

  Total Time: 1-5 seconds
```

### Rapid Power Shutdown Enable/Disable

```
┌──────────────────────────────────────────────────────────────┐
│ RAPID POWER SHUTDOWN CONTROL                                 │
└──────────────────────────────────────────────────────────────┘

Enable (0x04):                 Disable (0x05):
┌─────────────────────┐        ┌─────────────────────┐
│ Receive: 11 04      │        │ Receive: 11 05      │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│ Send: 51 04         │        │ Send: 51 05         │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│ Set Internal Flag:  │        │ Clear Internal Flag:│
│ rapid_shutdown = 1  │        │ rapid_shutdown = 0  │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│ Next Power-Down:    │        │ Next Power-Down:    │
│ • Skip cleanup      │        │ • Normal cleanup    │
│ • Immediate shutdown│        │ • Save all data     │
│ • Fast (< 1 sec)    │        │ • Graceful shutdown │
└─────────────────────┘        └─────────────────────┘

Note: No ECU reset occurs - just mode change!
```

---

## Testing Scenarios

### Test Scenario 1: Basic Hard Reset

```
┌──────────────────────────────────────────────────────────────┐
│ TEST: Basic Hard Reset in Extended Session                   │
└──────────────────────────────────────────────────────────────┘

Preconditions:
  • Vehicle stationary (Speed = 0)
  • Ignition ON
  • Battery voltage nominal (12-13V)
  • ECU in Default Session

  Tester                          ECU
    │                              │
    │  Step 1: Enter Extended Session
    │  10 03                       │
    │─────────────────────────────>│
    │                              │
    │  50 03 [session params]      │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │  Step 2: Request Hard Reset  │
    │  11 01                       │
    │─────────────────────────────>│
    │                              │
    │  51 01                       │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │  Step 3: Wait for Reset      │
    │                              │
    │         [ECU Offline]        │
    │ ································ │
    │         (5-10 seconds)       │
    │                              │
    │         [ECU Online]         │
    │<═════════════════════════════│
    │                              │
    │  Step 4: Verify Default Session
    │  10 01                       │
    │─────────────────────────────>│
    │                              │
    │  50 01 [params]              │
    │<─────────────────────────────│
    │                         ✓    │

Expected Results:
  ✓ Positive response 51 01 received
  ✓ ECU resets within expected time
  ✓ ECU returns to Default Session
  ✓ Security is locked 🔒
```

### Test Scenario 2: Reset Rejected - Conditions Not Correct

```
┌──────────────────────────────────────────────────────────────┐
│ TEST: Reset Rejected Due to Vehicle Speed                    │
└──────────────────────────────────────────────────────────────┘

Preconditions:
  • Vehicle MOVING (Speed = 50 km/h) ⚠️
  • Ignition ON
  • ECU in Extended Session

  Tester                          ECU
    │                              │
    │  11 01                       │
    │─────────────────────────────>│
    │                              │
    │           [Check: Speed > 0] │
    │                         ✗    │
    │                              │
    │  7F 11 22                    │
    │<─────────────────────────────│
    │     (Conditions Not Correct) │
    │                              │
    │  [ECU Continues Normal Ops]  │
    │  [NO RESET OCCURS]           │

Expected Results:
  ✓ NRC 0x22 received
  ✗ ECU does NOT reset
  ✓ Session remains Extended
  ✓ ECU continues normal operation
```

### Test Scenario 3: Security Required Reset

```
┌──────────────────────────────────────────────────────────────┐
│ TEST: Reset Requiring Security Access                        │
└──────────────────────────────────────────────────────────────┘

Preconditions:
  • Vehicle stationary
  • ECU in Programming Session
  • Security NOT unlocked 🔒

  Tester                          ECU
    │                              │
    │  Step 1: Attempt Reset (Locked)
    │  11 01                       │
    │─────────────────────────────>│
    │                              │
    │  7F 11 33                    │
    │<─────────────────────────────│
    │     (Security Access Denied) │
    │                         ✗    │
    │                              │
    │  Step 2: Unlock Security     │
    │  27 01 (Request Seed)        │
    │─────────────────────────────>│
    │  67 01 AB CD                 │
    │<─────────────────────────────│
    │                              │
    │  27 02 XX XX (Send Key)      │
    │─────────────────────────────>│
    │  67 02                       │
    │<─────────────────────────────│
    │                         🔓   │
    │                              │
    │  Step 3: Retry Reset (Unlocked)
    │  11 01                       │
    │─────────────────────────────>│
    │                              │
    │  51 01                       │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │       [ECU Resets]           │

Expected Results:
  ✓ First reset attempt rejected (NRC 0x33)
  ✓ Security unlock successful
  ✓ Second reset attempt succeeds
  ✓ ECU resets and returns to Default Session
```

### Test Scenario 4: Soft Reset Maintains Communication

```
┌──────────────────────────────────────────────────────────────┐
│ TEST: Soft Reset With Communication Persistence              │
└──────────────────────────────────────────────────────────────┘

Preconditions:
  • ECU in Extended Session
  • Active diagnostics session

  Tester                          ECU
    │                              │
    │  11 03 (Soft Reset)          │
    │─────────────────────────────>│
    │                              │
    │  51 03                       │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │  [Brief Pause - 1-3 seconds] │
    │  [Communication MAY stay up] │
    │                              │
    │  22 F1 90 (Read VIN)         │
    │─────────────────────────────>│
    │                              │
    │  62 F1 90 [VIN Data]         │
    │<─────────────────────────────│
    │                         ✓    │

Expected Results:
  ✓ Positive response 51 03 received
  ✓ Short reset time (1-5 seconds)
  ✓ Communication may remain active
  ✓ Session may persist (depends on implementation)
  ✓ Can immediately send new requests
```

### Test Scenario 5: Invalid Subfunction

```
┌──────────────────────────────────────────────────────────────┐
│ TEST: Invalid Subfunction Rejection                          │
└──────────────────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │  11 0A (Invalid subfunction) │
    │─────────────────────────────>│
    │                              │
    │  7F 11 12                    │
    │<─────────────────────────────│
    │     (Sub-Function Not        │
    │      Supported)              │

Expected Results:
  ✓ NRC 0x12 received
  ✗ ECU does NOT reset
  ✓ Normal operation continues
```

---

## Integration Patterns

### Pattern 1: Post-Programming Reset

```
┌──────────────────────────────────────────────────────────────┐
│ INTEGRATION: Software Update Workflow                        │
└──────────────────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ 1. Enter Programming Session │
    │    10 02                     │
    │─────────────────────────────>│
    │    50 02                     │
    │<─────────────────────────────│
    │                              │
    │ 2. Unlock Security           │
    │    27 XX (Seed/Key Exchange) │
    │<────────────────────────────>│
    │                         🔓   │
    │                              │
    │ 3. Erase Memory              │
    │    31 01 FF 00               │
    │─────────────────────────────>│
    │    71 01 FF 00               │
    │<─────────────────────────────│
    │                              │
    │ 4. Download Software         │
    │    34 00 [addr] [size]       │
    │─────────────────────────────>│
    │    74 [params]               │
    │<─────────────────────────────│
    │                              │
    │    36 XX [data blocks...]    │
    │<────────────────────────────>│
    │                              │
    │    37                        │
    │─────────────────────────────>│
    │    77                        │
    │<─────────────────────────────│
    │                              │
    │ 5. Verify Download           │
    │    31 01 FF 01 [checksum]    │
    │─────────────────────────────>│
    │    71 01 FF 01               │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │ 6. ★ RESET ECU ★             │
    │    11 01 (Hard Reset)        │
    │─────────────────────────────>│
    │    51 01                     │
    │<─────────────────────────────│
    │                              │
    │       [ECU Resets]           │
    │ ································ │
    │       [New Software Active]  │
    │                              │
    │ 7. Verify New Software       │
    │    22 F1 95 (Read SW Ver)    │
    │─────────────────────────────>│
    │    62 F1 95 [new version]    │
    │<─────────────────────────────│
    │                         ✓    │
```

### Pattern 2: Parameter Update Cycle

```
┌──────────────────────────────────────────────────────────────┐
│ INTEGRATION: Configuration Parameter Update                  │
└──────────────────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ 1. Extended Session          │
    │    10 03                     │
    │─────────────────────────────>│
    │    50 03                     │
    │<─────────────────────────────│
    │                              │
    │ 2. Write Parameters          │
    │    2E F1 00 [param data]     │
    │─────────────────────────────>│
    │    6E F1 00                  │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │    2E F1 01 [param data]     │
    │─────────────────────────────>│
    │    6E F1 01                  │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │ 3. ★ KEY OFF/ON RESET ★      │
    │    11 02                     │
    │─────────────────────────────>│
    │    51 02                     │
    │<─────────────────────────────│
    │                              │
    │   [Simulated Key Cycle]      │
    │   [Parameters Applied]       │
    │                              │
    │ 4. Verify New Values         │
    │    22 F1 00                  │
    │─────────────────────────────>│
    │    62 F1 00 [new values]     │
    │<─────────────────────────────│
    │                         ✓    │
```

### Pattern 3: Diagnostic Troubleshooting Sequence

```
┌──────────────────────────────────────────────────────────────┐
│ INTEGRATION: Clear Faults and Reset                          │
└──────────────────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ 1. Read Fault Codes          │
    │    19 02 FF                  │
    │─────────────────────────────>│
    │    59 02 [DTCs...]           │
    │<─────────────────────────────│
    │                              │
    │ 2. Clear Fault Codes         │
    │    14 FF FF FF               │
    │─────────────────────────────>│
    │    54                        │
    │<─────────────────────────────│
    │                         ✓    │
    │                              │
    │ 3. ★ HARD RESET ★            │
    │    11 01                     │
    │─────────────────────────────>│
    │    51 01                     │
    │<─────────────────────────────│
    │                              │
    │       [ECU Resets]           │
    │   [Fresh Start - No Faults]  │
    │                              │
    │ 4. Verify No Faults          │
    │    19 02 FF                  │
    │─────────────────────────────>│
    │    59 02 [No DTCs]           │
    │<─────────────────────────────│
    │                         ✓    │
```

---

## Debugging Guide

### Common Issues and Solutions

#### Issue 1: ECU Doesn't Reset

```
┌──────────────────────────────────────────────────────────────┐
│ PROBLEM: ECU sends 0x51 but doesn't actually reset          │
└──────────────────────────────────────────────────────────────┘

Diagnostic Steps:

1. Verify Response
   ┌─────────────────────┐
   │ Check: 51 01 received?
   └──────────┬──────────┘
              │
         ┌────┴────┐
        YES       NO
         │         │
         │         └──> Check message format
         │              Check session type
         ▼
2. Monitor Reset Behavior
   ┌─────────────────────┐
   │ • Watch CAN traffic │
   │ • Check voltage     │
   │ • Monitor uptime    │
   └──────────┬──────────┘
              │
              ▼
3. Check Implementation
   ┌─────────────────────┐
   │ Is reset routine    │
   │ actually called?    │
   └──────────┬──────────┘
              │
         ┌────┴────┐
        YES       NO
         │         │
         │         └──> Bug in handler!
         │              Missing reset call
         ▼
4. Check Timing
   ┌─────────────────────┐
   │ Response sent before│
   │ reset triggered?    │
   └─────────────────────┘

Common Causes:
  ❌ Reset code not linked
  ❌ Watchdog not configured
  ❌ Reset flag not set
  ❌ Response sent but reset skipped

Solution Checklist:
  ✓ Verify reset function is called
  ✓ Check watchdog configuration
  ✓ Ensure proper timing (response → delay → reset)
  ✓ Test with debugger breakpoints
```

#### Issue 2: NRC 0x22 Always Returned

```
┌──────────────────────────────────────────────────────────────┐
│ PROBLEM: Always getting "Conditions Not Correct"             │
└──────────────────────────────────────────────────────────────┘

Diagnostic Flowchart:

         ┌──────────────────────┐
         │ Receiving NRC 0x22?  │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Check Vehicle Speed  │
         └──────────┬───────────┘
                    │
            ┌───────┴────────┐
           = 0?            > 0?
            │                │
            │                └──> Stop vehicle!
            ▼
    ┌──────────────────────┐
    │ Check Engine State   │
    └──────────┬───────────┘
                │
        ┌───────┴────────┐
      OFF/Idle?       Running?
        │                │
        │                └──> Turn off engine
        ▼
┌──────────────────────┐
│ Check Battery Voltage│
└──────────┬───────────┘
            │
    ┌───────┴────────┐
  Normal?          Low/High?
    │                │
    │                └──> Fix voltage issue
    ▼
┌──────────────────────┐
│ Check Other Faults   │
│ • Active DTCs        │
│ • Flash in progress  │
│ • Critical errors    │
└──────────────────────┘

Debugging Tips:
  • Read actual condition values via SID 0x22
  • Check ECU logs for specific failure reason
  • Verify all sensors working correctly
```

#### Issue 3: Communication Lost After Reset

```
┌──────────────────────────────────────────────────────────────┐
│ PROBLEM: Can't reconnect to ECU after reset                  │
└──────────────────────────────────────────────────────────────┘

Timeline Analysis:

Time    Expected               Actual              Issue
─────────────────────────────────────────────────────────────
0s      Request sent          Request sent        ✓
1s      Response received     Response received   ✓
2s      ECU offline           ECU offline         ✓
5s      ECU should be back    Still offline       ❌
10s     Should respond        No response         ❌
15s     ...                   Dead silence        ❌

Possible Causes:

1. ECU Stuck in Bootloader
   ┌─────────────────────────────────┐
   │ • Application corrupted         │
   │ • Invalid program checksum      │
   │ • Missing startup code          │
   └─────────────────────────────────┘
   Solution: Reflash ECU via bootloader

2. CAN Bus Issue
   ┌─────────────────────────────────┐
   │ • Baudrate changed              │
   │ • Wrong CAN ID after reset      │
   │ • Termination problem           │
   └─────────────────────────────────┘
   Solution: Check CAN configuration

3. Power Problem
   ┌─────────────────────────────────┐
   │ • Voltage dropped during reset  │
   │ • Power supply interrupted      │
   │ • Brown-out condition           │
   └─────────────────────────────────┘
   Solution: Check power stability

4. Infinite Reset Loop
   ┌─────────────────────────────────┐
   │ • Watchdog misconfigured        │
   │ • Startup check fails           │
   │ • Continuous resets             │
   └─────────────────────────────────┘
   Solution: Check reset reason register
```

#### Issue 4: Wrong Session After Reset

```
┌──────────────────────────────────────────────────────────────┐
│ PROBLEM: ECU not in Default Session after reset              │
└──────────────────────────────────────────────────────────────┘

Expected vs Actual:

Expected:                      Actual:
┌─────────────────┐           ┌─────────────────┐
│  Before: Any    │           │  Before: Any    │
│  Session        │           │  Session        │
└────────┬────────┘           └────────┬────────┘
         │                             │
         │ Reset                       │ Reset
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│  After: DEFAULT │           │  After: ???     │
│  Session 0x01   │           │  Wrong Session! │
└─────────────────┘           └─────────────────┘

Check These:

1. ┌─────────────────────────────┐
   │ Session variable properly   │
   │ initialized to 0x01?        │
   └─────────────────────────────┘

2. ┌─────────────────────────────┐
   │ Non-volatile memory         │
   │ incorrectly preserving      │
   │ session state?              │
   └─────────────────────────────┘

3. ┌─────────────────────────────┐
   │ Using Soft Reset (0x03)?    │
   │ May preserve session!       │
   └─────────────────────────────┘

Solution:
  • Verify session init code
  • Clear session variables on hard reset
  • Check reset type implementation
```

---

## Best Practices Checklist

### Implementation Best Practices

```
┌──────────────────────────────────────────────────────────────┐
│ ECU RESET IMPLEMENTATION CHECKLIST                           │
└──────────────────────────────────────────────────────────────┘

Request Validation:
  ☐ Check message length = 2 bytes
  ☐ Validate subfunction range
  ☐ Verify current session allows reset
  ☐ Check security access if required
  ☐ Validate all preconditions (speed, voltage, etc.)
  ☐ Return appropriate NRC on any failure

Response Handling:
  ☐ Send positive response BEFORE reset
  ☐ Include power-down time if applicable
  ☐ Ensure response fully transmitted
  ☐ Add small delay after response (50-200ms)

Reset Execution:
  ☐ Save critical data to non-volatile memory
  ☐ Log reset reason and timestamp
  ☐ Close all communication channels gracefully
  ☐ Stop all application tasks
  ☐ Trigger hardware reset properly
  ☐ Clear volatile memory (RAM)

Post-Reset Initialization:
  ☐ Return to Default Session (0x01)
  ☐ Lock security access 🔒
  ☐ Clear all diagnostic flags
  ☐ Initialize communication stack
  ☐ Verify application integrity
  ☐ Load default configurations

Safety Considerations:
  ☐ Check vehicle speed = 0 before reset
  ☐ Verify engine state allows reset
  ☐ Confirm battery voltage in range
  ☐ Ensure no critical operations active
  ☐ Verify no active safety-critical faults
  ☐ Implement watchdog protection

Testing:
  ☐ Test all reset types (0x01, 0x02, 0x03)
  ☐ Test all rejection scenarios (NRCs)
  ☐ Verify timing requirements met
  ☐ Test session transition behavior
  ☐ Verify security state after reset
  ☐ Test under various vehicle conditions
  ☐ Verify memory preservation/clearing
  ☐ Test communication recovery
```

### Timing Guidelines

```
┌──────────────────────────────────────────────────────────────┐
│ RESET TIMING RECOMMENDATIONS                                 │
└──────────────────────────────────────────────────────────────┘

Reset Type          Min Time    Typical     Max Time
───────────────────────────────────────────────────────────────
Hard Reset (0x01)   2 seconds   5-10 sec    15 seconds
Key Off/On (0x02)   3 seconds   8-12 sec    20 seconds
Soft Reset (0x03)   500 ms      1-3 sec     5 seconds
Rapid PD Enable     N/A         Immediate   N/A
Rapid PD Disable    N/A         Immediate   N/A

Critical Delays:
  • Response → Reset trigger: 50-200 ms
  • Data save timeout: 1-2 seconds max
  • Bootloader timeout: 3-5 seconds
  • Application init: 2-5 seconds
  • CAN init: 100-500 ms
```

### Error Recovery Strategy

```
┌──────────────────────────────────────────────────────────────┐
│ RESET FAILURE RECOVERY                                       │
└──────────────────────────────────────────────────────────────┘

           ┌──────────────────┐
           │ Reset Requested  │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Set Reset Flag   │
           │ in NV Memory     │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ Execute Reset    │
           └────────┬─────────┘
                    │
             ┌──────┴──────┐
           Success      Failure
             │              │
             ▼              ▼
    ┌──────────────┐  ┌──────────────┐
    │ Clear Flag   │  │ Watchdog     │
    │ Normal Boot  │  │ Triggers     │
    └──────────────┘  └──────┬───────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Check Reset Flag │
                    │ Attempt Recovery │
                    └──────────────────┘
```

---

**End of Document**

**Related Documentation:**
- `SID_11_ECU_RESET.md` - Theoretical foundation
- `SID_11_SERVICE_INTERACTIONS.md` - Workflow examples
- ISO 14229-1:2020 Section 9.3 - Official specification
