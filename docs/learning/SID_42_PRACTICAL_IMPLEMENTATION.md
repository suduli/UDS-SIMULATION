# SID 0x2A - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.2

---

## Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [State Machine Diagrams](#state-machine-diagrams)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [Scheduler Implementation](#scheduler-implementation)
5. [Testing Scenarios](#testing-scenarios)
6. [Debugging Flowcharts](#debugging-flowcharts)
7. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Main Processing Flow

```
                        ┌─────────────────────┐
                        │  Receive Request    │
                        │  (SID 0x2A)         │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │  Validate Message   │
                        │  Length             │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                 Length                        Length
                  OK?                           Wrong?
                    │                             │
                    ▼                             ▼
         ┌─────────────────────┐      ┌─────────────────────┐
         │  Extract            │      │  Return NRC 0x13    │
         │  Transmission Mode  │      │  (Incorrect Length) │
         └──────────┬──────────┘      └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Validate Mode      │
         │  (0x01-0x04)        │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
       Valid                Invalid
       Mode?                 Mode?
         │                     │
         ▼                     ▼
┌─────────────────┐ ┌─────────────────────┐
│  Mode = 0x04?   │ │  Return NRC 0x12    │
│  (Stop)         │ │  (Sub-Function Not  │
└────────┬────────┘ │  Supported)         │
         │          └─────────────────────┘
   ┌─────┴─────┐
  Yes         No
   │           │
   ▼           ▼
┌──────────┐ ┌─────────────────────┐
│  Stop    │ │  Extract PDID(s)    │
│  All     │ │  from request       │
│  Periodic│ └──────────┬──────────┘
│  Trans.  │            │
│          │            ▼
│  Return  │ ┌─────────────────────┐
│  6A      │ │  Check Session      │
└──────────┘ │  Requirements       │
             └──────────┬──────────┘
                        │
             ┌──────────┴──────────┐
             │                     │
          Session              Session
          Valid?               Invalid?
             │                     │
             ▼                     ▼
  ┌─────────────────────┐ ┌─────────────────────┐
  │  Check Security     │ │  Return NRC 0x22    │
  │  Requirements       │ │  (Conditions Not    │
  └──────────┬──────────┘ │  Correct)           │
             │            └─────────────────────┘
             ▼
  ┌─────────────────────┐
  │  For Each PDID:     │
  │  ├─> Valid?         │
  │  ├─> Security OK?   │
  │  └─> Supported?     │
  └──────────┬──────────┘
             │
    ┌────────┴────────┐
    │                 │
  All               Any
  Valid?            Invalid?
    │                 │
    ▼                 ▼
┌─────────────┐ ┌─────────────────────┐
│  Check      │ │  Return appropriate │
│  Scheduler  │ │  NRC:               │
│  Capacity   │ │  ├─> 0x31 (Range)   │
└──────┬──────┘ │  └─> 0x33 (Security)│
       │        └─────────────────────┘
       ▼
┌─────────────────────┐
│  Capacity           │
│  Available?         │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
   Yes           No
    │             │
    ▼             ▼
┌──────────┐ ┌─────────────────────┐
│  Add to  │ │  Return NRC 0x72    │
│  Schedule│ │  (Programming       │
│          │ │  Failure)           │
│  Start   │ └─────────────────────┘
│  Periodic│
│  Timer(s)│
│          │
│  Return  │
│  6A      │
└──────────┘
```

---

## State Machine Diagrams

### Periodic Transmission State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│              PERIODIC TRANSMISSION STATE MACHINE                 │
└──────────────────────────────────────────────────────────────────┘


                     ┌────────────────────┐
                     │      IDLE          │
                     │  (No transmission) │
                     └──────────┬─────────┘
                                │
                                │ Request received
                                │ Mode: 0x01/0x02/0x03
                                │ All validations pass
                                │
                                ▼
                     ┌────────────────────┐
          ┌──────────│     ACTIVE         │◄─────────┐
          │          │  (Transmitting)    │          │
          │          └──────────┬─────────┘          │
          │                     │                    │
          │                     │ Timer expires      │
          │                     │                    │
          │                     ▼                    │
          │          ┌────────────────────┐          │
          │          │   READ_DATA        │          │
          │          │  (Fetch PDID data) │          │
          │          └──────────┬─────────┘          │
          │                     │                    │
          │                     │ Data ready         │
          │                     │                    │
          │                     ▼                    │
          │          ┌────────────────────┐          │
          │          │   SEND_RESPONSE    │          │
          │          │  (6A [PDID] [data])│          │
          │          └──────────┬─────────┘          │
          │                     │                    │
          │                     │ Response sent      │
          │                     │ Restart timer      │
          │                     │                    │
          │                     └────────────────────┘
          │
          │ Stop conditions:
          │ ├─> Mode 0x04 received
          │ ├─> Session changed
          │ ├─> Security changed
          │ ├─> ECU reset
          │ └─> Error occurred
          │
          ▼
   ┌────────────────────┐
   │   STOPPING         │
   │ (Clear scheduler)  │
   └──────────┬─────────┘
              │
              │ Cleanup complete
              │
              ▼
   ┌────────────────────┐
   │      IDLE          │
   │  (No transmission) │
   └────────────────────┘
```

### Scheduler State Transitions

```
┌──────────────────────────────────────────────────────────────────┐
│                   SCHEDULER STATE MACHINE                        │
└──────────────────────────────────────────────────────────────────┘

State: EMPTY
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Scheduler:                         │
│  ├─> Slow Rate:   0 entries         │
│  ├─> Medium Rate: 0 entries         │
│  └─> Fast Rate:   0 entries         │
│                                     │
│  Status: Idle                       │
└─────────────────────────────────────┘
                 │
                 │ Add first periodic PDID
                 ▼

State: PARTIAL
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Scheduler:                         │
│  ├─> Slow Rate:   1 entry           │
│  ├─> Medium Rate: 0 entries         │
│  └─> Fast Rate:   0 entries         │
│                                     │
│  Status: Active (low load)          │
└─────────────────────────────────────┘
                 │
                 │ Add more PDIDs
                 ▼

State: BUSY
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Scheduler:                         │
│  ├─> Slow Rate:   3 entries         │
│  ├─> Medium Rate: 5 entries         │
│  └─> Fast Rate:   4 entries         │
│                                     │
│  Status: Active (high load)         │
└─────────────────────────────────────┘
                 │
                 │ Try to add beyond capacity
                 ▼

State: FULL (Reject new requests)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Scheduler:                         │
│  ├─> Slow Rate:   5 entries (MAX)   │
│  ├─> Medium Rate: 8 entries (MAX)   │
│  └─> Fast Rate:   5 entries (MAX)   │
│                                     │
│  Status: At capacity                │
│  Action: Return NRC 0x72            │
└─────────────────────────────────────┘
                 │
                 │ Stop transmission (Mode 0x04)
                 │ or Session change
                 ▼

State: EMPTY (Return to idle)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────┐
│  Scheduler:                         │
│  ├─> Slow Rate:   0 entries         │
│  ├─> Medium Rate: 0 entries         │
│  └─> Fast Rate:   0 entries         │
│                                     │
│  Status: Idle                       │
└─────────────────────────────────────┘
```

---

## NRC Decision Trees

### Decision Tree: Which NRC to Return?

```
                    Request Received (SID 0x2A)
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Is message length   │
                    │ correct?            │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                   No                    Yes
                    │                     │
                    ▼                     ▼
         ┌─────────────────────┐  ┌─────────────────────┐
         │  Return NRC 0x13    │  │ Is transmission     │
         │  (Incorrect         │  │ mode valid?         │
         │  Message Length)    │  │ (0x01-0x04)         │
         └─────────────────────┘  └──────────┬──────────┘
                                             │
                                  ┌──────────┴──────────┐
                                 No                    Yes
                                  │                     │
                                  ▼                     ▼
                       ┌─────────────────────┐  ┌─────────────────────┐
                       │  Return NRC 0x12    │  │ Is mode 0x04        │
                       │  (Sub-Function Not  │  │ (Stop)?             │
                       │  Supported)         │  └──────────┬──────────┘
                       └─────────────────────┘             │
                                                 ┌──────────┴──────────┐
                                                Yes                   No
                                                 │                     │
                                                 ▼                     ▼
                                      ┌──────────────────┐  ┌─────────────────────┐
                                      │  Stop all and    │  │ Is current session  │
                                      │  return 6A       │  │ valid?              │
                                      └──────────────────┘  │ (EXTENDED/higher)   │
                                                            └──────────┬──────────┘
                                                                       │
                                                            ┌──────────┴──────────┐
                                                           No                    Yes
                                                            │                     │
                                                            ▼                     ▼
                                                 ┌─────────────────────┐  ┌─────────────────────┐
                                                 │  Return NRC 0x22    │  │ Are all PDIDs       │
                                                 │  (Conditions Not    │  │ valid?              │
                                                 │  Correct)           │  └──────────┬──────────┘
                                                 └─────────────────────┘             │
                                                                          ┌──────────┴──────────┐
                                                                         No                    Yes
                                                                          │                     │
                                                                          ▼                     ▼
                                                               ┌─────────────────────┐  ┌─────────────────────┐
                                                               │  Return NRC 0x31    │  │ Do PDIDs require    │
                                                               │  (Request Out Of    │  │ security?           │
                                                               │  Range)             │  └──────────┬──────────┘
                                                               └─────────────────────┘             │
                                                                                        ┌──────────┴──────────┐
                                                                                       Yes                   No
                                                                                        │                     │
                                                                                        ▼                     ▼
                                                                             ┌─────────────────────┐  ┌─────────────────────┐
                                                                             │ Is ECU unlocked?    │  │ Is scheduler        │
                                                                             └──────────┬──────────┘  │ capacity available? │
                                                                                        │             └──────────┬──────────┘
                                                                             ┌──────────┴──────────┐             │
                                                                            No                    Yes  ┌─────────┴─────────┐
                                                                             │                     │  No                  Yes
                                                                             ▼                     │   │                   │
                                                                  ┌─────────────────────┐         │   ▼                   ▼
                                                                  │  Return NRC 0x33    │         │ ┌──────────────┐ ┌────────────┐
                                                                  │  (Security Access   │         │ │ Return 0x72  │ │ Add to     │
                                                                  │  Denied)            │         │ │ (Programming │ │ scheduler  │
                                                                  └─────────────────────┘         │ │ Failure)     │ │            │
                                                                                                  │ └──────────────┘ │ Return 6A  │
                                                                                                  │                  └────────────┘
                                                                                                  └──────────┐
                                                                                                             │
                                                                                                  ┌──────────┴──────────┐
                                                                                                 No                    Yes
                                                                                                  │                     │
                                                                                                  ▼                     ▼
                                                                                       ┌─────────────────────┐  ┌──────────────┐
                                                                                       │  Return NRC 0x72    │  │ Add to       │
                                                                                       │  (Programming       │  │ scheduler    │
                                                                                       │  Failure)           │  │              │
                                                                                       └─────────────────────┘  │ Return 6A    │
                                                                                                                └──────────────┘
```

### Validation Sequence Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    VALIDATION SEQUENCE                           │
└──────────────────────────────────────────────────────────────────┘

Validation Step 1: Message Length
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  Expected:                         │
│  ├─> Mode 0x04: 2 bytes (2A 04)    │
│  └─> Mode 0x01-0x03: ≥3 bytes      │
│                                    │
│  Check:                            │
│  ├─> Byte count matches?           │
│  └─> If NO → NRC 0x13              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼

Validation Step 2: Transmission Mode
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  Valid Modes:                      │
│  ├─> 0x01 (Slow)                   │
│  ├─> 0x02 (Medium)                 │
│  ├─> 0x03 (Fast)                   │
│  └─> 0x04 (Stop)                   │
│                                    │
│  Check:                            │
│  ├─> Mode in valid range?          │
│  ├─> Mode supported by ECU?        │
│  └─> If NO → NRC 0x12              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼

Validation Step 3: Session State
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  Required Session:                 │
│  └─> EXTENDED (0x03) or higher     │
│                                    │
│  Check:                            │
│  ├─> Current session valid?        │
│  └─> If NO → NRC 0x22              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼

Validation Step 4: PDID Validity (if mode ≠ 0x04)
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  For each PDID:                    │
│  ├─> Is PDID supported?            │
│  ├─> Is PDID in valid range?       │
│  └─> If NO → NRC 0x31              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼

Validation Step 5: Security Check
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  For each PDID:                    │
│  ├─> Does PDID require security?   │
│  ├─> If YES, is ECU unlocked?      │
│  └─> If NO → NRC 0x33              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼

Validation Step 6: Scheduler Capacity
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│  Check:                            │
│  ├─> Is scheduler full?            │
│  ├─> Can add new entries?          │
│  └─> If NO → NRC 0x72              │
└────────────────────────────────────┘
                 │
                 │ PASS
                 ▼
┌────────────────────────────────────┐
│  ALL VALIDATIONS PASSED            │
│  → Add to scheduler                │
│  → Return 6A                       │
└────────────────────────────────────┘
```

---

## Scheduler Implementation

### Scheduler Data Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                   SCHEDULER STRUCTURE                            │
└──────────────────────────────────────────────────────────────────┘

Slow Rate Queue:
┌────────────────────────────────────────────────────────────┐
│  Entry 1: │ PDID: 0x01 │ Interval: 500ms │ Next: 350ms │  │
├────────────────────────────────────────────────────────────┤
│  Entry 2: │ PDID: 0x05 │ Interval: 1000ms│ Next: 800ms │  │
├────────────────────────────────────────────────────────────┤
│  Entry 3: │ (Empty)                                      │  │
└────────────────────────────────────────────────────────────┘

Medium Rate Queue:
┌────────────────────────────────────────────────────────────┐
│  Entry 1: │ PDID: 0x02 │ Interval: 100ms │ Next: 45ms  │  │
├────────────────────────────────────────────────────────────┤
│  Entry 2: │ PDID: 0x03 │ Interval: 150ms │ Next: 120ms │  │
├────────────────────────────────────────────────────────────┤
│  Entry 3: │ PDID: 0x07 │ Interval: 200ms │ Next: 180ms │  │
└────────────────────────────────────────────────────────────┘

Fast Rate Queue:
┌────────────────────────────────────────────────────────────┐
│  Entry 1: │ PDID: 0x04 │ Interval: 20ms  │ Next: 15ms  │  │
├────────────────────────────────────────────────────────────┤
│  Entry 2: │ PDID: 0x08 │ Interval: 50ms  │ Next: 30ms  │  │
└────────────────────────────────────────────────────────────┘

Metadata:
┌────────────────────────────────────────────────────────────┐
│  Current Session:  EXTENDED (0x03)                         │
│  Security State:   UNLOCKED                                │
│  Total Entries:    7                                       │
│  Max Capacity:     20                                      │
│  Status:           ACTIVE                                  │
└────────────────────────────────────────────────────────────┘
```

### Timer Processing Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   TIMER TICK PROCESSING                          │
└──────────────────────────────────────────────────────────────────┘

Every System Tick (e.g., 1ms):
═══════════════════════════════════════════════════════════════════

         ┌───────────────────────┐
         │   System Tick Event   │
         │   (1ms elapsed)       │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  Decrement all "Next" │
         │  timers by 1ms        │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  Scan Fast Queue      │
         └──────────┬────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
     Any timer               All timers
     expired?                > 0?
         │                     │
         ▼                     │
┌─────────────────┐            │
│  Send periodic  │            │
│  response for   │            │
│  expired PDID   │            │
│                 │            │
│  Reset timer    │            │
│  to interval    │            │
└─────────┬───────┘            │
          │                    │
          └────────┬───────────┘
                   │
                   ▼
         ┌───────────────────────┐
         │  Scan Medium Queue    │
         └──────────┬────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
     Any timer               All timers
     expired?                > 0?
         │                     │
         ▼                     │
┌─────────────────┐            │
│  Send periodic  │            │
│  response for   │            │
│  expired PDID   │            │
│                 │            │
│  Reset timer    │            │
│  to interval    │            │
└─────────┬───────┘            │
          │                    │
          └────────┬───────────┘
                   │
                   ▼
         ┌───────────────────────┐
         │  Scan Slow Queue      │
         └──────────┬────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
     Any timer               All timers
     expired?                > 0?
         │                     │
         ▼                     │
┌─────────────────┐            │
│  Send periodic  │            │
│  response for   │            │
│  expired PDID   │            │
│                 │            │
│  Reset timer    │            │
│  to interval    │            │
└─────────┬───────┘            │
          │                    │
          └────────┬───────────┘
                   │
                   ▼
         ┌───────────────────────┐
         │   Wait for next tick  │
         └───────────────────────┘
```

### Add Entry to Scheduler Flow

```
         ┌───────────────────────┐
         │  New PDID Request     │
         │  (Mode + PDID)        │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  Determine Queue      │
         │  based on Mode        │
         └──────────┬────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
   Mode 0x01    Mode 0x02    Mode 0x03
   (Slow)       (Medium)     (Fast)
      │             │             │
      └──────┬──────┴──────┬──────┘
             │             │
             ▼             ▼
   ┌─────────────┐   ┌─────────────┐
   │ Slow Queue  │   │ Medium Q    │  ...
   └──────┬──────┘   └──────┬──────┘
          │                 │
          └────────┬────────┘
                   │
                   ▼
         ┌───────────────────────┐
         │  Is PDID already in   │
         │  this queue?          │
         └──────────┬────────────┘
                    │
         ┌──────────┴──────────┐
        Yes                   No
         │                     │
         ▼                     ▼
┌─────────────────┐  ┌───────────────────────┐
│  Replace entry  │  │  Is queue full?       │
│  (update rate)  │  └──────────┬────────────┘
│                 │             │
│  Return 6A      │  ┌──────────┴──────────┐
└─────────────────┘ Yes                   No
                     │                     │
                     ▼                     ▼
          ┌─────────────────┐  ┌───────────────────────┐
          │  Return NRC 0x72│  │  Create new entry:    │
          │  (Scheduler     │  │  ├─> PDID             │
          │  Capacity Full) │  │  ├─> Interval (mode)  │
          └─────────────────┘  │  └─> Next = Interval  │
                               │                       │
                               │  Add to queue         │
                               │                       │
                               │  Return 6A            │
                               └───────────────────────┘
```

---

## Testing Scenarios

### Test Scenario 1: Basic Single PDID Request

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST: Basic Periodic Data Request                              │
├──────────────────────────────────────────────────────────────────┤
│  Purpose: Verify basic periodic transmission functionality       │
│  Preconditions:                                                  │
│  ├─> ECU in EXTENDED session                                     │
│  ├─> No security required for PDID 0x01                          │
│  └─> Scheduler empty                                             │
└──────────────────────────────────────────────────────────────────┘

Step 1: Enter Extended Session
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  10 03
  ECU → Tester:  50 03 [timing...]
  
  Result: ✓ Session = EXTENDED

Step 2: Request Periodic Data (Medium Rate)
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 02 01
                 │  │  └─> PDID 0x01 (Engine RPM)
                 │  └────> Medium rate
                 └───────> SID 0x2A
  
  ECU → Tester:  6A
  
  Result: ✓ Acknowledged, periodic transmission started

Step 3: Observe Periodic Responses
═══════════════════════════════════════════════════════════════════
  Time: 0ms
  ECU → Tester:  (none - initial acknowledgment done)

  Time: 100ms (±10ms)
  ECU → Tester:  6A 01 0C 80
                 │  │  └──┴─> Data: RPM = 3200
                 │  └───────> PDID 0x01
                 └──────────> Response SID

  Time: 200ms (±10ms)
  ECU → Tester:  6A 01 0D 20
                 └──────────> RPM = 3360

  Time: 300ms (±10ms)
  ECU → Tester:  6A 01 0D 80
                 └──────────> RPM = 3456

  Result: ✓ Periodic responses sent every ~100ms

Step 4: Stop Periodic Transmission
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 04
                 │  └─> Stop sending
                 └────> SID 0x2A
  
  ECU → Tester:  6A
  
  Result: ✓ Periodic transmission stopped

  Time: 400ms+
  ECU → Tester:  (no more periodic responses)
  
  Result: ✓ PASS - Basic functionality working
```

### Test Scenario 2: Multiple PDIDs at Different Rates

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST: Multiple PDIDs with Mixed Rates                           │
├──────────────────────────────────────────────────────────────────┤
│  Purpose: Verify scheduler handles multiple rates correctly      │
│  Preconditions:                                                  │
│  ├─> ECU in EXTENDED session                                     │
│  ├─> PDIDs 0x01, 0x02, 0x03 supported                            │
│  └─> Scheduler empty                                             │
└──────────────────────────────────────────────────────────────────┘

Step 1: Request Slow Rate PDID
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 01 01
                 │  │  └─> PDID 0x01 (RPM)
                 │  └────> Slow rate
                 └───────> SID 0x2A
  
  ECU → Tester:  6A
  
  Scheduler State:
  ┌────────────────────────────────┐
  │  Slow:   [PDID 0x01: 500ms]    │
  │  Medium: [Empty]               │
  │  Fast:   [Empty]               │
  └────────────────────────────────┘

Step 2: Request Medium Rate PDID
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 02 02
                 │  │  └─> PDID 0x02 (Speed)
                 │  └────> Medium rate
                 └───────> SID 0x2A
  
  ECU → Tester:  6A
  
  Scheduler State:
  ┌────────────────────────────────┐
  │  Slow:   [PDID 0x01: 500ms]    │
  │  Medium: [PDID 0x02: 100ms]    │
  │  Fast:   [Empty]               │
  └────────────────────────────────┘

Step 3: Request Fast Rate PDID
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 03 03
                 │  │  └─> PDID 0x03 (Coolant Temp)
                 │  └────> Fast rate
                 └───────> SID 0x2A
  
  ECU → Tester:  6A
  
  Scheduler State:
  ┌────────────────────────────────┐
  │  Slow:   [PDID 0x01: 500ms]    │
  │  Medium: [PDID 0x02: 100ms]    │
  │  Fast:   [PDID 0x03: 50ms]     │
  └────────────────────────────────┘

Step 4: Observe Interleaved Responses
═══════════════════════════════════════════════════════════════════
  Time: 0ms
  (Requests acknowledged)

  Time: 50ms
  ECU → Tester:  6A 03 [temp data]   ← Fast PDID

  Time: 100ms
  ECU → Tester:  6A 03 [temp data]   ← Fast PDID
  ECU → Tester:  6A 02 [speed data]  ← Medium PDID

  Time: 150ms
  ECU → Tester:  6A 03 [temp data]   ← Fast PDID

  Time: 200ms
  ECU → Tester:  6A 03 [temp data]   ← Fast PDID
  ECU → Tester:  6A 02 [speed data]  ← Medium PDID

  Time: 500ms
  ECU → Tester:  6A 01 [RPM data]    ← Slow PDID
  ECU → Tester:  6A 03 [temp data]   ← Fast PDID
  ECU → Tester:  6A 02 [speed data]  ← Medium PDID

  Result: ✓ PASS - All rates operating correctly and interleaved
```

### Test Scenario 3: Session Change Stops Transmission

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST: Session Change Auto-Stop Behavior                         │
├──────────────────────────────────────────────────────────────────┤
│  Purpose: Verify periodic transmission stops on session change   │
│  Preconditions:                                                  │
│  ├─> ECU in EXTENDED session                                     │
│  ├─> Periodic transmission active (PDID 0x01 @ medium rate)      │
│  └─> Receiving periodic responses                               │
└──────────────────────────────────────────────────────────────────┘

Initial State:
═══════════════════════════════════════════════════════════════════
  Session: EXTENDED
  Scheduler:
  ┌────────────────────────────────┐
  │  Medium: [PDID 0x01: 100ms]    │
  └────────────────────────────────┘
  
  Periodic responses flowing:
  Time: 100ms → 6A 01 [data]
  Time: 200ms → 6A 01 [data]
  Time: 300ms → 6A 01 [data]

Step 1: Change to DEFAULT Session
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  10 01
                 │  └─> DEFAULT session
                 └────> SID 0x10
  
  ECU Internal Actions:
  ├─> Stop all periodic timers
  ├─> Clear scheduler
  ├─> Change session to DEFAULT
  └─> Send response

  ECU → Tester:  50 01 [timing...]
  
  Result: ✓ Session changed to DEFAULT

Step 2: Verify Periodic Transmission Stopped
═══════════════════════════════════════════════════════════════════
  Time: 400ms+
  ECU → Tester:  (no periodic responses)
  
  Time: 500ms+
  ECU → Tester:  (no periodic responses)
  
  Time: 1000ms+
  ECU → Tester:  (no periodic responses)
  
  Scheduler State:
  ┌────────────────────────────────┐
  │  Slow:   [Empty]               │
  │  Medium: [Empty]               │
  │  Fast:   [Empty]               │
  └────────────────────────────────┘
  
  Result: ✓ PASS - Periodic transmission automatically stopped
```

### Test Scenario 4: Security Access Required

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST: Security-Protected PDID                                   │
├──────────────────────────────────────────────────────────────────┤
│  Purpose: Verify NRC 0x33 when accessing protected PDID          │
│  Preconditions:                                                  │
│  ├─> ECU in EXTENDED session                                     │
│  ├─> ECU is LOCKED (not unlocked via SID 0x27)                   │
│  └─> PDID 0x0A requires security access                          │
└──────────────────────────────────────────────────────────────────┘

Step 1: Request Protected PDID While Locked
═══════════════════════════════════════════════════════════════════
  Security State: 🔒 LOCKED
  
  Tester → ECU:  2A 02 0A
                 │  │  └─> PDID 0x0A (Protected)
                 │  └────> Medium rate
                 └───────> SID 0x2A
  
  ECU → Tester:  7F 2A 33
                 │  │  └─> NRC 0x33 (Security Access Denied)
                 │  └────> SID 0x2A
                 └───────> Negative response
  
  Result: ✓ Correctly rejected with NRC 0x33

Step 2: Unlock ECU via Security Access
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  27 01
  ECU → Tester:  67 01 [seed bytes]
  
  Tester → ECU:  27 02 [key bytes]
  ECU → Tester:  67 02
  
  Security State: 🔓 UNLOCKED
  
  Result: ✓ ECU unlocked

Step 3: Retry Protected PDID Request
═══════════════════════════════════════════════════════════════════
  Security State: 🔓 UNLOCKED
  
  Tester → ECU:  2A 02 0A
  
  ECU → Tester:  6A
  
  Result: ✓ Request accepted

  Time: 100ms
  ECU → Tester:  6A 0A [protected data]
  
  Time: 200ms
  ECU → Tester:  6A 0A [protected data]
  
  Result: ✓ PASS - Security protection working correctly
```

### Test Scenario 5: Scheduler Capacity Limit

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST: Scheduler Full (NRC 0x72)                                 │
├──────────────────────────────────────────────────────────────────┤
│  Purpose: Verify NRC 0x72 when scheduler reaches capacity        │
│  Preconditions:                                                  │
│  ├─> ECU in EXTENDED session                                     │
│  ├─> Scheduler max capacity: 5 entries per queue                 │
│  └─> Medium queue already has 5 active PDIDs                     │
└──────────────────────────────────────────────────────────────────┘

Initial Scheduler State:
═══════════════════════════════════════════════════════════════════
  ┌────────────────────────────────────────────┐
  │  Medium Queue (5/5 - FULL):                │
  │  ├─> PDID 0x01                             │
  │  ├─> PDID 0x02                             │
  │  ├─> PDID 0x03                             │
  │  ├─> PDID 0x04                             │
  │  └─> PDID 0x05                             │
  └────────────────────────────────────────────┘

Step 1: Attempt to Add 6th Entry to Medium Queue
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 02 06
                 │  │  └─> PDID 0x06
                 │  └────> Medium rate (queue is FULL!)
                 └───────> SID 0x2A
  
  ECU Internal Check:
  ├─> Validation passes (valid PDID, session, security)
  ├─> Check medium queue capacity
  └─> Medium queue FULL (5/5)
  
  ECU → Tester:  7F 2A 72
                 │  │  └─> NRC 0x72 (Programming Failure)
                 │  └────> SID 0x2A
                 └───────> Negative response
  
  Result: ✓ Correctly rejected with NRC 0x72

Step 2: Stop One Existing PDID
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 04
  
  ECU → Tester:  6A
  
  Scheduler State:
  ┌────────────────────────────────────────────┐
  │  Medium Queue (0/5 - EMPTY):               │
  │  (All stopped)                             │
  └────────────────────────────────────────────┘
  
  Result: ✓ Scheduler cleared

Step 3: Retry Adding PDID 0x06
═══════════════════════════════════════════════════════════════════
  Tester → ECU:  2A 02 06
  
  ECU → Tester:  6A
  
  Scheduler State:
  ┌────────────────────────────────────────────┐
  │  Medium Queue (1/5):                       │
  │  └─> PDID 0x06                             │
  └────────────────────────────────────────────┘
  
  Result: ✓ PASS - Scheduler capacity management working
```

---

## Debugging Flowcharts

### Debugging: No Periodic Responses Received

```
┌──────────────────────────────────────────────────────────────────┐
│  PROBLEM: Sent 2A request, got 6A, but no periodic responses     │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  Request sent:      │
                    │  2A 02 01           │
                    │  Response: 6A       │
                    │  But no periodic    │
                    │  responses arrive   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Check 1:           │
                    │  Did session change │
                    │  after request?     │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                   Yes                   No
                    │                     │
                    ▼                     ▼
         ┌─────────────────────┐  ┌─────────────────────┐
         │  ✓ FOUND ISSUE:     │  │  Check 2:           │
         │  Session change     │  │  Did security state │
         │  stops periodic     │  │  change? (re-lock)  │
         │  transmission       │  └──────────┬──────────┘
         │                     │             │
         │  Solution:          │  ┌──────────┴──────────┐
         │  Stay in EXTENDED   │ Yes                   No
         │  session            │  │                     │
         └─────────────────────┘  ▼                     ▼
                       ┌─────────────────────┐  ┌─────────────────────┐
                       │  ✓ FOUND ISSUE:     │  │  Check 3:           │
                       │  ECU re-locked      │  │  Is PDID data       │
                       │  (timeout/reset)    │  │  source available?  │
                       │                     │  └──────────┬──────────┘
                       │  Solution:          │             │
                       │  Re-authenticate    │  ┌──────────┴──────────┐
                       │  via SID 0x27       │ No                    Yes
                       └─────────────────────┘  │                     │
                                                ▼                     ▼
                                     ┌─────────────────────┐  ┌─────────────────────┐
                                     │  ✓ FOUND ISSUE:     │  │  Check 4:           │
                                     │  Data source error  │  │  Check ECU logs     │
                                     │  (sensor fault)     │  │  for scheduler      │
                                     │                     │  │  errors             │
                                     │  Solution:          │  └──────────┬──────────┘
                                     │  Fix data source    │             │
                                     │  or use different   │  ┌──────────┴──────────┐
                                     │  PDID               │ Error                 OK
                                     └─────────────────────┘  │                     │
                                                              ▼                     ▼
                                                   ┌─────────────────────┐  ┌─────────────────────┐
                                                   │  ✓ FOUND ISSUE:     │  │  Check 5:           │
                                                   │  Scheduler internal │  │  Verify network     │
                                                   │  error              │  │  connection         │
                                                   │                     │  └──────────┬──────────┘
                                                   │  Solution:          │             │
                                                   │  ECU reset or       │  ┌──────────┴──────────┐
                                                   │  stop/restart       │ Bad                   OK
                                                   │  periodic tx        │  │                     │
                                                   └─────────────────────┘  ▼                     ▼
                                                                 ┌─────────────────────┐  ┌─────────────────────┐
                                                                 │  ✓ FOUND ISSUE:     │  │  ✗ UNKNOWN ISSUE    │
                                                                 │  CAN bus error/     │  │  Contact ECU vendor │
                                                                 │  packet loss        │  │  for support        │
                                                                 │                     │  └─────────────────────┘
                                                                 │  Solution:          │
                                                                 │  Check physical     │
                                                                 │  connection, bus    │
                                                                 │  termination        │
                                                                 └─────────────────────┘
```

### Debugging: Received NRC Instead of Success

```
┌──────────────────────────────────────────────────────────────────┐
│  PROBLEM: Sent 2A request, received 7F 2A [NRC]                  │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  Check NRC value    │
                    │  (Byte 3 of response│
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
      NRC 0x12             NRC 0x13             NRC 0x22
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Sub-Function    │ │ Incorrect       │ │ Conditions Not  │
│ Not Supported   │ │ Message Length  │ │ Correct         │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Check mode byte │ │ Verify request  │ │ Check session:  │
│ Is it 0x01-0x04?│ │ format:         │ │ Must be         │
│                 │ │ ├─> 2A [mode]   │ │ EXTENDED or     │
│ Does ECU support│ │ ├─> Plus PDID(s)│ │ higher          │
│ this mode?      │ │ │   if not 0x04 │ │                 │
│                 │ │ └─> Minimum 2   │ │ Or check:       │
│ Solution:       │ │     bytes for   │ │ ├─> Vehicle not │
│ Use supported   │ │     mode 0x04   │ │ │   moving      │
│ mode (0x01-0x03)│ │                 │ │ └─> Other pre-  │
└─────────────────┘ │ Solution:       │ │     conditions  │
                    │ Fix message     │ └─────────────────┘
                    │ format          │
                    └─────────────────┘

         │                     │                     │
         │                     │                     │
      NRC 0x31             NRC 0x33             NRC 0x72
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Request Out Of  │ │ Security Access │ │ General         │
│ Range           │ │ Denied          │ │ Programming     │
└────────┬────────┘ └────────┬────────┘ │ Failure         │
         │                   │          └────────┬────────┘
         ▼                   ▼                   │
┌─────────────────┐ ┌─────────────────┐         ▼
│ Check PDID:     │ │ PDID requires   │ ┌─────────────────┐
│ ├─> Is PDID     │ │ security access │ │ Scheduler full: │
│ │   supported?  │ │                 │ │ ├─> Too many    │
│ └─> Is PDID in  │ │ Solution:       │ │ │   active PDIDs│
│     valid range?│ │ 1. Enter        │ │ └─> Stop some   │
│                 │ │    EXTENDED     │ │     periodic tx │
│ Solution:       │ │ 2. Unlock via   │ │                 │
│ Use valid PDID  │ │    SID 0x27     │ │ Or ECU internal │
│ from ECU spec   │ │ 3. Retry 0x2A   │ │ error           │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Best Practices Checklist

### Implementation Best Practices

```
┌──────────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION BEST PRACTICES                       │
└──────────────────────────────────────────────────────────────────┘

Request Handling:
☐ Validate message length before processing
☐ Check transmission mode is in range 0x01-0x04
☐ Verify current session is EXTENDED or higher
☐ Check security state for protected PDIDs
☐ Validate all requested PDIDs are supported
☐ Return specific NRC for each validation failure

Scheduler Design:
☐ Implement separate queues for each transmission rate
☐ Define maximum capacity per queue
☐ Use timer-based mechanism (not polling loops)
☐ Implement priority handling (Fast > Medium > Slow)
☐ Gracefully handle scheduler overflow (NRC 0x72)
☐ Support at least 10 simultaneous periodic transmissions

Transmission Behavior:
☐ Start transmission immediately after validation
☐ Send periodic responses at configured intervals
☐ Include PDID in each periodic response
☐ Interleave responses from multiple PDIDs correctly
☐ Maintain accurate timing (±10% tolerance acceptable)
☐ Stop transmission immediately on session change

Auto-Stop Conditions:
☐ Stop all periodic transmissions on session change
☐ Stop all periodic transmissions on security state change
☐ Stop all periodic transmissions on ECU reset
☐ Stop transmission for specific PDID on mode 0x04
☐ Support stopping all transmissions with mode 0x04 (no PDID)

Data Source Management:
☐ Map PDIDs to internal data sources (DIDs, sensors, etc.)
☐ Handle data source unavailability gracefully
☐ Update periodic data in real-time (not cached)
☐ Return fresh data with each periodic response
☐ Log errors when data source fails

Error Handling:
☐ Define all supported NRCs clearly
☐ Return NRC 0x13 for any message length error
☐ Return NRC 0x12 for unsupported modes
☐ Return NRC 0x22 for session/condition errors
☐ Return NRC 0x31 for invalid PDIDs
☐ Return NRC 0x33 for security violations
☐ Return NRC 0x72 for scheduler capacity issues
☐ Log all error conditions for debugging

Testing:
☐ Test basic single PDID request/response
☐ Test multiple PDIDs at same rate
☐ Test multiple PDIDs at different rates
☐ Test session change auto-stop behavior
☐ Test security access requirements
☐ Test scheduler capacity limits
☐ Test stop transmission (mode 0x04)
☐ Test invalid PDID rejection
☐ Test mode 0x04 with no PDID (stop all)
☐ Test long-duration periodic transmission (stability)

Performance:
☐ Ensure fast rate transmission doesn't overload bus
☐ Minimize jitter in periodic timing
☐ Optimize data reading for high-frequency PDIDs
☐ Monitor CPU usage during peak transmission
☐ Test under maximum scheduler load

Documentation:
☐ Document all supported PDIDs and their meanings
☐ Document PDID to DID mapping (if applicable)
☐ Specify transmission rate values for each mode
☐ Document maximum scheduler capacity
☐ Document security requirements per PDID
☐ Provide examples of request/response sequences
☐ Document auto-stop conditions clearly
```

### Tester Best Practices

```
┌──────────────────────────────────────────────────────────────────┐
│                 TESTER BEST PRACTICES                            │
└──────────────────────────────────────────────────────────────────┘

Before Sending Request:
☐ Enter EXTENDED session first (SID 0x10, mode 0x03)
☐ Unlock ECU if requesting protected PDIDs (SID 0x27)
☐ Verify PDID support from ECU documentation
☐ Choose appropriate transmission rate for data type

Request Construction:
☐ Use correct message format: 2A [mode] [PDID(s)]
☐ Don't exceed scheduler capacity with too many PDIDs
☐ Use mode 0x04 to stop transmissions when done
☐ Request only necessary data to minimize bus load

During Periodic Transmission:
☐ Monitor periodic response timing
☐ Handle interleaved responses from multiple PDIDs
☐ Don't send duplicate requests for same PDID
☐ Keep session active (avoid timeout)

Clean Up:
☐ Always stop periodic transmission when done (mode 0x04)
☐ Don't rely on session change to stop transmission
☐ Avoid leaving orphaned periodic transmissions
☐ Return to DEFAULT session when diagnostics complete

Error Handling:
☐ Parse NRC responses and take corrective action
☐ NRC 0x12: Use different transmission mode
☐ NRC 0x13: Fix request message format
☐ NRC 0x22: Enter correct session first
☐ NRC 0x31: Use valid PDID from ECU spec
☐ NRC 0x33: Unlock ECU via SID 0x27
☐ NRC 0x72: Stop some transmissions to free capacity

Network Management:
☐ Monitor bus utilization during periodic transmission
☐ Don't exceed CAN bus bandwidth (~70-80% max recommended)
☐ Stagger start times when requesting multiple PDIDs
☐ Use slower rates when real-time data not critical
```

---

**End of SID 0x2A Practical Implementation Guide**

For service theory, see: `SID_42_READ_DATA_BY_PERIODIC_IDENTIFIER.md`  
For service interactions, see: `SID_42_SERVICE_INTERACTIONS.md`
