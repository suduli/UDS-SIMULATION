# SID 0x31 - Routine Control (Complete Visual Guide)

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Subfunctions](#subfunctions)
4. [Routine Identifier (RID)](#routine-identifier-rid)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session Requirements](#session-requirements)
7. [Security Behavior](#security-behavior)
8. [Interaction with Other SIDs](#interaction-with-other-sids)
9. [ISO 14229-1 References](#iso-14229-1-references)

---

## Service Overview

### What is Routine Control?

**Routine Control (SID 0x31)** allows a diagnostic tester to execute server-side routines (procedures) in the ECU. These routines can be:
- Self-tests (e.g., actuator tests, sensor checks)
- Calibration procedures
- Manufacturing processes
- Maintenance operations
- Programming sequences

```
┌────────────────────────────────────────────────────────────────┐
│                    ROUTINE CONTROL CONCEPT                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │  "Start Routine 0x1234"       │                           │
│    │──────────────────────────────>│                           │
│    │                               │ [Executes procedure]      │
│    │                               │ [Returns status]          │
│    │  "Routine started OK"         │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │  "Get Results of 0x1234"      │                           │
│    │──────────────────────────────>│                           │
│    │  "Results: PASS + data"       │                           │
│    │<──────────────────────────────│                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Purpose

- ✅ Execute ECU self-diagnostic routines
- ✅ Perform actuator tests (e.g., test fuel injector)
- ✅ Run calibration sequences
- ✅ Check sensor functionality
- ✅ Erase fault memory
- ✅ Manufacturing end-of-line tests

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  ROUTINE CONTROL REQUEST                       │
├────────────────────────────────────────────────────────────────┤
│  Byte 0:    SID (0x31)                                         │
│  Byte 1:    SubFunction (0x01, 0x02, or 0x03)                  │
│  Byte 2:    Routine Identifier High Byte (RID_HI)              │
│  Byte 3:    Routine Identifier Low Byte (RID_LO)               │
│  Byte 4-N:  Routine Control Option Record (if required)        │
└────────────────────────────────────────────────────────────────┘
```

### Positive Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  POSITIVE RESPONSE (0x71)                      │
├────────────────────────────────────────────────────────────────┤
│  Byte 0:    Response SID (0x71)                                │
│  Byte 1:    SubFunction Echo (0x01, 0x02, or 0x03)             │
│  Byte 2:    Routine Identifier High Byte (RID_HI)              │
│  Byte 3:    Routine Identifier Low Byte (RID_LO)               │
│  Byte 4-N:  Routine Status Record (if available)               │
└────────────────────────────────────────────────────────────────┘
```

### Negative Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  NEGATIVE RESPONSE (0x7F)                      │
├────────────────────────────────────────────────────────────────┤
│  Byte 0:    Negative Response SID (0x7F)                       │
│  Byte 1:    Service ID Echo (0x31)                             │
│  Byte 2:    Negative Response Code (NRC)                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Subfunctions

### Available Subfunctions

```
┌──────────────┬─────────────────────┬──────────────────────────────┐
│  SubFunction │  Name               │  Purpose                     │
├──────────────┼─────────────────────┼──────────────────────────────┤
│  0x01        │  Start Routine      │  Begin routine execution     │
│  0x02        │  Stop Routine       │  Halt routine execution      │
│  0x03        │  Request Results    │  Get routine results/status  │
└──────────────┴─────────────────────┴──────────────────────────────┘
```

### Subfunction 0x01 - Start Routine

```
  Tester                                    ECU
    │                                        │
    │  Request: 31 01 [RID_HI] [RID_LO]     │
    │           [Option Record]              │
    │───────────────────────────────────────>│
    │                                        │
    │                         [Start routine]│
    │                         [Check conditions]
    │                                        │
    │  Response: 71 01 [RID_HI] [RID_LO]    │
    │            [Status Record]             │
    │<───────────────────────────────────────│
    │                                        │
```

**Purpose**: Initiates execution of the specified routine

**When to use**:
- Start actuator test
- Begin calibration procedure
- Execute self-test
- Start programming sequence

### Subfunction 0x02 - Stop Routine

```
  Tester                                    ECU
    │                                        │
    │  Request: 31 02 [RID_HI] [RID_LO]     │
    │───────────────────────────────────────>│
    │                                        │
    │                          [Stop routine]│
    │                          [Cleanup]     │
    │                                        │
    │  Response: 71 02 [RID_HI] [RID_LO]    │
    │            [Status Record]             │
    │<───────────────────────────────────────│
    │                                        │
```

**Purpose**: Stops a currently running routine

**When to use**:
- User cancellation
- Timeout prevention
- Safety abort
- Emergency stop

### Subfunction 0x03 - Request Results

```
  Tester                                    ECU
    │                                        │
    │  Request: 31 03 [RID_HI] [RID_LO]     │
    │───────────────────────────────────────>│
    │                                        │
    │                      [Retrieve results]│
    │                      [Format data]     │
    │                                        │
    │  Response: 71 03 [RID_HI] [RID_LO]    │
    │            [Results Record]            │
    │<───────────────────────────────────────│
    │                                        │
```

**Purpose**: Retrieves results from a completed or running routine

**When to use**:
- Check test results
- Get progress status
- Retrieve measurement data
- Verify completion

---

## Routine Identifier (RID)

### RID Structure

```
┌────────────────────────────────────────────────────────────────┐
│                   ROUTINE IDENTIFIER (RID)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  16-bit value (2 bytes): 0x0000 - 0xFFFF                       │
│                                                                │
│  ┌──────────────────┬──────────────────┐                      │
│  │  Byte 2 (RID_HI) │  Byte 3 (RID_LO) │                      │
│  └──────────────────┴──────────────────┘                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Common RID Ranges (Examples)

```
┌──────────────────┬─────────────────────────────────────────────┐
│  RID Range       │  Typical Usage                              │
├──────────────────┼─────────────────────────────────────────────┤
│  0x0000-0x00FF   │  Vehicle manufacturer specific              │
│  0x0100-0x01FF   │  Network configuration                      │
│  0x0200-0x02FF   │  Data link layer                            │
│  0x0300-0xCFFF   │  Vehicle manufacturer specific              │
│  0xD000-0xD0FF   │  Diagnostic connector related               │
│  0xD100-0xEFFF   │  Vehicle manufacturer specific              │
│  0xF000-0xF0FF   │  Vehicle manufacturer specific              │
│  0xF100-0xF18F   │  Network configuration                      │
│  0xF190-0xF19F   │  Vehicle manufacturer specific              │
│  0xF1A0-0xF1EF   │  Vehicle manufacturer specific              │
│  0xF1F0-0xF1FF   │  System supplier specific                   │
│  0xF200-0xFFFF   │  ECU/System supplier specific               │
└──────────────────┴─────────────────────────────────────────────┘
```

### Example Routines

```
┌─────────┬──────────────────────────────────────────────────────┐
│  RID    │  Routine Description                                 │
├─────────┼──────────────────────────────────────────────────────┤
│  0x0203 │  Check Programming Pre-Conditions                    │
│  0xFF00 │  Erase Memory                                        │
│  0xFF01 │  Check Programming Dependencies                      │
│  0x1234 │  Injector Test (Example)                             │
│  0x5678 │  Lambda Sensor Test (Example)                        │
│  0xABCD │  Throttle Calibration (Example)                      │
└─────────┴──────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### Common NRCs for SID 0x31

```
┌──────────┬────────────────────────────┬──────────────────────────┐
│   NRC    │  Name                      │  When Returned           │
├──────────┼────────────────────────────┼──────────────────────────┤
│  0x12    │  SubFunction Not Supported │  Invalid subfunction     │
│  0x13    │  Incorrect Message Length  │  Wrong byte count        │
│  0x22    │  Conditions Not Correct    │  Prerequisites not met   │
│  0x24    │  Request Sequence Error    │  Wrong order/state       │
│  0x31    │  Request Out Of Range      │  Invalid RID             │
│  0x33    │  Security Access Denied    │  Not unlocked            │
│  0x72    │  General Programming Fail  │  Routine execution fail  │
│  0x7E    │  SubFunction Not Supported │  Wrong session           │
│           │  In Active Session         │                          │
│  0x7F    │  Service Not Supported In  │  Wrong session type      │
│           │  Active Session            │                          │
└──────────┴────────────────────────────┴──────────────────────────┘
```

### NRC 0x12 - SubFunction Not Supported

```hex
7F 31 12
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The requested subfunction (0x01, 0x02, or 0x03) is not        │
│  supported by this ECU or for this specific RID.               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Subfunction value not in range 0x01-0x03                    │
│  • RID doesn't support Stop (0x02) operation                   │
│  • ECU doesn't implement all subfunctions                      │
│  • Reserved subfunction value used                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG APPROACH                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 04 12 34  (Invalid subfunction 0x04)        │
│  ECU → Tester: 7F 31 12                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT APPROACH                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12 34  (Valid subfunction 0x01)          │
│  ECU → Tester: 71 01 12 34 [Status]                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x13 - Incorrect Message Length

```hex
7F 31 13
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The request message has the wrong number of bytes.            │
│  Either too short (missing required data) or too long.         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Missing RID bytes (need both high and low)                  │
│  • Missing required option record parameters                   │
│  • Extra unexpected bytes in message                           │
│  • Truncated message                                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG MESSAGE LENGTH                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12     (Missing RID low byte!)           │
│  ECU → Tester: 7F 31 13                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT MESSAGE LENGTH                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12 34  (Complete: SID + SF + RID)        │
│  ECU → Tester: 71 01 12 34 [Status]                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x22 - Conditions Not Correct

```hex
7F 31 22
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The routine cannot be executed because current conditions     │
│  don't meet the requirements (vehicle state, sensors, etc.)    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Vehicle not in correct state (e.g., engine running)         │
│  • Required sensor values out of range                         │
│  • System voltage too low/high                                 │
│  • Temperature out of operating range                          │
│  • Safety conditions not met                                   │
│  • Another routine already running                             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Ignoring Prerequisites                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Vehicle: Engine Running, Speed 50 km/h]                      │
│                                                                │
│  Tester → ECU: 31 01 12 34  (Start actuator test)             │
│  ECU → Tester: 7F 31 22     (Vehicle must be stopped!)         │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Meeting Prerequisites                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Vehicle: Engine Off, Speed 0 km/h, Ignition ON]             │
│                                                                │
│  Tester → ECU: 31 01 12 34  (Start actuator test)             │
│  ECU → Tester: 71 01 12 34 00  (Test started OK)               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x24 - Request Sequence Error

```hex
7F 31 24
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The request was sent in the wrong order. Some actions must    │
│  happen before others (e.g., must Start before getting Results)│
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Requesting results before starting routine                  │
│  • Starting routine that's already running                     │
│  • Stopping routine that's not running                         │
│  • Missing prerequisite steps                                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG SEQUENCE                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Tester → ECU: 31 03 12 34  (Request results)          │
│          ECU → Tester: 7F 31 24     (Not started yet!)         │
│                                                                │
│  [Routine 0x1234 is NOT running]                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT SEQUENCE                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Tester → ECU: 31 01 12 34  (Start routine)            │
│          ECU → Tester: 71 01 12 34 00                          │
│                                                                │
│  Step 2: Tester → ECU: 31 03 12 34  (Request results)          │
│          ECU → Tester: 71 03 12 34 [Results]                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x31 - Request Out Of Range

```hex
7F 31 31
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The requested Routine Identifier (RID) is not supported       │
│  by this ECU, or parameters in option record are invalid.      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • RID not implemented in ECU                                  │
│  • RID value outside allowed range                             │
│  • Invalid parameter values in option record                   │
│  • Wrong RID for this ECU type                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unsupported RID                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 FF FF  (RID 0xFFFF not supported)        │
│  ECU → Tester: 7F 31 31                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Supported RID                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12 34  (RID 0x1234 is supported)         │
│  ECU → Tester: 71 01 12 34 00                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x33 - Security Access Denied

```hex
7F 31 33
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The routine requires security access (unlocked ECU), but      │
│  the tester has not successfully completed security unlock.    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Security access (SID 0x27) not performed                    │
│  • Security session expired (timeout)                          │
│  • Wrong security level unlocked                               │
│  • Security required for this RID                              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Skipping Security                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [ECU is LOCKED 🔒]                                            │
│                                                                │
│  Tester → ECU: 31 01 12 34  (Protected routine)               │
│  ECU → Tester: 7F 31 33     (Need to unlock first!)           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock First                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Unlock ECU with SID 0x27 (Security Access)           │
│          [ECU is now UNLOCKED 🔓]                              │
│                                                                │
│  Step 2: Tester → ECU: 31 01 12 34  (Protected routine)       │
│          ECU → Tester: 71 01 12 34 00                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### NRC 0x72 - General Programming Failure

```hex
7F 31 72
```

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WHAT IT MEANS                                               │
├────────────────────────────────────────────────────────────────┤
│  The routine started but failed during execution due to an     │
│  internal error, hardware failure, or unexpected condition.    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 🔍 COMMON CAUSES                                               │
├────────────────────────────────────────────────────────────────┤
│  • Hardware component failure during test                      │
│  • Memory error during routine execution                       │
│  • Actuator malfunction                                        │
│  • Sensor read failure                                         │
│  • Internal timeout or watchdog reset                          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ FAILURE SCENARIO                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12 34  (Start injector test)             │
│  ECU: [Starts test... injector doesn't respond... FAIL]       │
│  ECU → Tester: 7F 31 72     (Test execution failed)           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ SUCCESS SCENARIO                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 12 34  (Start injector test)             │
│  ECU: [Starts test... injector responds... PASS]              │
│  ECU → Tester: 71 01 12 34 00  (Test passed)                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session Requirements

### Session State Behavior

```
┌────────────────────────────────────────────────────────────────┐
│              SESSION REQUIREMENTS FOR ROUTINES                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DEFAULT Session (0x01)                                        │
│  ┌──────────────────────────────────────┐                     │
│  │  Limited routines available          │                     │
│  │  • Basic diagnostic routines         │                     │
│  │  • Read-only tests                   │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
│  EXTENDED Session (0x03)                                       │
│  ┌──────────────────────────────────────┐                     │
│  │  More routines available             │                     │
│  │  • Advanced diagnostics              │                     │
│  │  • Actuator tests                    │                     │
│  │  • Calibration routines              │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
│  PROGRAMMING Session (0x02)                                    │
│  ┌──────────────────────────────────────┐                     │
│  │  Full routine access                 │                     │
│  │  • Memory operations                 │                     │
│  │  • Flash programming                 │                     │
│  │  • Manufacturing tests               │                     │
│  └──────────────────────────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Session Transition Example

```
  Tester                                    ECU
    │                                        │
    │  [DEFAULT SESSION]                     │
    │                                        │
    │  Request: 31 01 AB CD                  │
    │  (Protected routine)                   │
    │───────────────────────────────────────>│
    │                                        │
    │  Response: 7F 31 7F                    │
    │  (Not supported in this session)       │
    │<───────────────────────────────────────│
    │                                        │
    │  Request: 10 03 (Extended Session)     │
    │───────────────────────────────────────>│
    │  Response: 50 03                       │
    │<───────────────────────────────────────│
    │                                        │
    │  [EXTENDED SESSION]                    │
    │                                        │
    │  Request: 31 01 AB CD                  │
    │  (Same routine, now allowed)           │
    │───────────────────────────────────────>│
    │  Response: 71 01 AB CD 00              │
    │<───────────────────────────────────────│
    │                                        │
```

---

## Security Behavior

### Security State Machine

```
┌────────────────────────────────────────────────────────────────┐
│                 SECURITY STATE FOR ROUTINES                    │
└────────────────────────────────────────────────────────────────┘

         ┌──────────────────┐
         │  ECU LOCKED 🔒   │
         │                  │
         │  Limited Routines│
         └────────┬─────────┘
                  │
                  │ SID 0x27
                  │ (Security Access)
                  ▼
         ┌──────────────────┐
         │ ECU UNLOCKED 🔓  │
         │                  │
         │  All Routines    │
         │  Available       │
         └────────┬─────────┘
                  │
                  │ Timeout or
                  │ Session Change
                  ▼
         ┌──────────────────┐
         │  ECU LOCKED 🔒   │
         │                  │
         │  (Auto re-lock)  │
         └──────────────────┘
```

### Routine Access Matrix

```
┌─────────────┬──────────────┬─────────────┬─────────────────────┐
│   Routine   │   Session    │  Security   │  Access Allowed?    │
│   Type      │   Required   │  Required   │                     │
├─────────────┼──────────────┼─────────────┼─────────────────────┤
│ Read Info   │  DEFAULT     │  NO         │  ✅ Always          │
│ Basic Test  │  EXTENDED    │  NO         │  ✅ In EXTENDED     │
│ Actuator    │  EXTENDED    │  YES        │  🔓 If unlocked     │
│ Calibration │  EXTENDED    │  YES        │  🔓 If unlocked     │
│ Programming │  PROGRAMMING │  YES        │  🔓 If unlocked     │
│ Memory Ops  │  PROGRAMMING │  YES        │  🔓 If unlocked     │
└─────────────┴──────────────┴─────────────┴─────────────────────┘
```

---

## Interaction with Other SIDs

### Related Services

```
┌────────────────────────────────────────────────────────────────┐
│           SID 0x31 INTERACTIONS WITH OTHER SERVICES            │
└────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │         SID 0x10                            │
    │   Diagnostic Session Control                │
    │  (Enables routine access)                   │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │         SID 0x27                            │
    │      Security Access                        │
    │  (Unlocks protected routines)               │
    └──────────────────┬──────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────┐
    │         SID 0x31                            │
    │      Routine Control                        │
    │  (Execute routines)                         │
    └──────────────────┬──────────────────────────┘
                       │
                       ├──────────────────────────┐
                       │                          │
                       ▼                          ▼
    ┌─────────────────────────┐   ┌──────────────────────────┐
    │    SID 0x3E             │   │    SID 0x22              │
    │  Tester Present         │   │  Read Data By ID         │
    │ (Keep session alive)    │   │ (Verify routine results) │
    └─────────────────────────┘   └──────────────────────────┘
```

### Typical Service Sequence

```
  Tester                                    ECU
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ STEP 1: Enter Extended Session     │ │
    │ └────────────────────────────────────┘ │
    │  Request: 10 03                        │
    │───────────────────────────────────────>│
    │  Response: 50 03                       │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ STEP 2: Unlock Security            │ │
    │ └────────────────────────────────────┘ │
    │  Request: 27 01 (Request Seed)         │
    │───────────────────────────────────────>│
    │  Response: 67 01 [SEED]                │
    │<───────────────────────────────────────│
    │  Request: 27 02 [KEY]                  │
    │───────────────────────────────────────>│
    │  Response: 67 02 (Unlocked 🔓)         │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ STEP 3: Start Routine              │ │
    │ └────────────────────────────────────┘ │
    │  Request: 31 01 12 34                  │
    │───────────────────────────────────────>│
    │  Response: 71 01 12 34 00              │
    │<───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────────┐ │
    │ │ STEP 4: Request Results            │ │
    │ └────────────────────────────────────┘ │
    │  Request: 31 03 12 34                  │
    │───────────────────────────────────────>│
    │  Response: 71 03 12 34 [RESULTS]       │
    │<───────────────────────────────────────│
    │                                        │
```

### Dependency Table

```
┌────────────────────┬────────────────────────────────────────────┐
│  To Execute        │  Prerequisite Services                     │
├────────────────────┼────────────────────────────────────────────┤
│  Basic Routine     │  SID 0x10 (Session Control)                │
│  Protected Routine │  SID 0x10 + SID 0x27 (Security)            │
│  Long Routine      │  SID 0x10 + SID 0x3E (Tester Present)      │
│  Programming       │  SID 0x10 (PROG) + SID 0x27 + SID 0x31     │
└────────────────────┴────────────────────────────────────────────┘
```

---

## ISO 14229-1 References

### Standard Compliance

```
┌────────────────────────────────────────────────────────────────┐
│                    ISO 14229-1:2020                            │
│              Unified Diagnostic Services (UDS)                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Section 9.5: RoutineControl (0x31) Service                    │
│                                                                │
│  Key Requirements:                                             │
│  • Minimum request length: 4 bytes (SID + SF + RID)            │
│  • Minimum response length: 4 bytes (RSID + SF + RID)          │
│  • Subfunction parameter range: 0x01-0x03                      │
│  • RID parameter range: 0x0000-0xFFFF                          │
│  • Optional routine control option record                      │
│  • Optional routine status record in response                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Related ISO Sections

```
┌──────────────────┬─────────────────────────────────────────────┐
│  ISO Section     │  Topic                                      │
├──────────────────┼─────────────────────────────────────────────┤
│  9.5             │  RoutineControl service definition          │
│  9.3             │  Session control (prerequisite)             │
│  9.4             │  Security access (for protected routines)   │
│  Annex A         │  Routine identifier ranges                  │
│  Annex B         │  NRC definitions                            │
│  Annex C         │  Timing parameters                          │
└──────────────────┴─────────────────────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│                  SID 0x31 QUICK REFERENCE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Service:      Routine Control                                 │
│  SID:          0x31                                            │
│  Response:     0x71 (positive)                                 │
│  Subfunctions: 0x01 (Start), 0x02 (Stop), 0x03 (Results)       │
│  Min Length:   4 bytes                                         │
│  Session:      Often EXTENDED or PROGRAMMING                   │
│  Security:     Often required for protected routines           │
│                                                                │
│  Purpose:                                                      │
│  • Execute ECU-side procedures (tests, calibrations)           │
│  • Control routine execution (start/stop)                      │
│  • Retrieve routine results                                    │
│                                                                │
│  Common NRCs:                                                  │
│  • 0x12 - SubFunction Not Supported                            │
│  • 0x13 - Incorrect Message Length                             │
│  • 0x22 - Conditions Not Correct                               │
│  • 0x24 - Request Sequence Error                               │
│  • 0x31 - Request Out Of Range                                 │
│  • 0x33 - Security Access Denied                               │
│  • 0x72 - General Programming Failure                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x31 Visual Guide**
