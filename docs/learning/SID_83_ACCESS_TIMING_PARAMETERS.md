# SID 0x83: Access Timing Parameters

**Document Version**:  2.0  
**Last Updated**: December 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.4

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Structure](#message-structure)
3. [Timing Parameters Explained](#timing-parameters-explained)
4. [Sub-function Types](#sub-function-types)
5. [Positive Response](#positive-response)
6. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
7. [Common Use Cases](#common-use-cases)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### What is Access Timing Parameters?

**Purpose**: Read or modify diagnostic timing parameters that control ECU response timing and session timeouts

```
┌─────────────────────────────────────────────────────────────┐
│              SID 0x83 - ACCESS TIMING PARAMETERS            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Allows tester to:                                           │
│  • Read current timing parameters (P2, P3)                  │
│  • Set custom timing values                                 │
│  • Restore default timing values                            │
│  • Adapt to different ECU processing speeds                 │
│  • Optimize diagnostic session timing                       │
│                                                             │
│  Controls:                                                  │
│  • P2Server: ECU response time limit                        │
│  • P2*Server: Extended response time limit                  │
│  • P3Server: Session inactivity timeout                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

```
┌──────────────────────┬────────────────────────────────────┐
│ Characteristic       │ Value                              │
├──────────────────────┼────────────────────────────────────┤
│ Service ID (SID)     │ 0x83                               │
│ Response SID         │ 0xC3                               │
│ Subfunction?          │ YES (0x01, 0x02, 0x03)             │
│ Request Length       │ Variable (2-6 bytes)               │
│ Response Length      │ Variable (depends on sub-fn)       │
│ Session Required     │ DEFAULT, EXTENDED, PROGRAMMING     │
│ Security Required    │ NO (typically)                     │
│ Priority             │ HIGH (affects all communication)   │
└──────────────────────┴────────────────────────────────────┘
```

---

## Message Structure

### Request Message Format

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST MESSAGE STRUCTURE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Byte 0:      SID = 0x83                                     │
│  Byte 1:     Sub-function                                   │
│              • 0x01 = Read Extended Timing Parameters       │
│              • 0x02 = Set Timing Parameters to Given Values │
│              • 0x03 = Read Current Active Timing Parameters │
│                                                             │
│  Byte 2-N:   Timing parameter data (for sub-function 0x02) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sub-function 0x01: Read Extended Timing Parameters

```
┌────────────────────────────────────────────┐
│ Read Extended Timing Parameters Set        │
├────────────────────────────────────────────┤
│                                            │
│  Request Bytes:                            │
│  ┌──────┬──────┐                          │
│  │ 0x83 │ 0x01 │                          │
│  └──────┴──────┘                          │
│    SID   Sub-fn                           │
│                                            │
│  Length:  2 bytes                           │
│                                            │
│  Meaning:                                   │
│  "Tell me the timing parameter set"       │
│                                            │
└────────────────────────────────────────────┘
```

### Sub-function 0x02: Set Timing Parameters

```
┌────────────────────────────────────────────┐
│ Set Timing Parameters to Given Values      │
├────────────────────────────────────────────┤
│                                            │
│  Request Bytes:                             │
│  ┌──────┬──────┬──────┬──────┬──────┐    │
│  │ 0x83 │ 0x02 │ P2Hi │ P2Lo │ ...   │    │
│  └──────┴──────┴──────┴──────┴──────┘    │
│    SID   Sub-fn  Timing values           │
│                                            │
│  Length: 2 + N bytes (N = timing data)     │
│                                            │
│  Meaning:                                  │
│  "Change timing to these values"          │
│                                            │
└────────────────────────────────────────────┘
```

### Sub-function 0x03: Read Currently Active Parameters

```
┌────────────────────────────────────────────┐
│ Read Currently Active Timing Parameters    │
├────────────────────────────────────────────┤
│                                            │
│  Request Bytes:                            │
│  ┌──────┬──────┐                          │
│  │ 0x83 │ 0x03 │                          │
│  └──────┴──────┘                          │
│    SID   Sub-fn                           │
│                                            │
│  Length: 2 bytes                           │
│                                            │
│  Meaning:                                   │
│  "Tell me current active timing values"   │
│                                            │
└────────────────────────────────────────────┘
```

---

## Timing Parameters Explained

### P2Server Timing Parameter

```
┌─────────────────────────────────────────────────────────────┐
│                    P2SERVER PARAMETER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Definition:  Maximum time ECU has to start responding       │
│                                                             │
│  Timeline:                                                  │
│                                                             │
│  Tester                           ECU                       │
│    │                               │                        │
│    │  Diagnostic Request           │                        │
│    │──────────────────────────────>│                        │
│    │                               │                        │
│    │         ◄─── P2Server ───►    │                        │
│    │         (max 50ms default)    │                        │
│    │                               │                        │
│    │  Response                     │                        │
│    │◄──────────────────────────────│                        │
│    │                               │                        │
│                                                             │
│  Default Value: 50 ms (0x0032 in hex)                      │
│  Unit:  Milliseconds                                         │
│  Range:  Typically 1-5000 ms                                 │
│                                                             │
│  Use Case: Normal diagnostic requests                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### P2*Server (Extended) Timing Parameter

```
┌─────────────────────────────────────────────────────────────┐
│                  P2*SERVER PARAMETER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Definition: Maximum time ECU has for extended processing   │
│              (when NRC 0x78 "Response Pending" is sent)     │
│                                                             │
│  Timeline:                                                  │
│                                                             │
│  Tester                           ECU                       │
│    │                               │                        │
│    │  Diagnostic Request           │                        │
│    │──────────────────────────────>│                        │
│    │                               │                        │
│    │         ◄─── P2Server ───►    │                        │
│    │                               │                        │
│    │  NRC 0x78 (Pending)           │                        │
│    │◄──────────────────────────────│                        │
│    │                               │                        │
│    │       ◄─── P2*Server ───►     │                        │
│    │       (max 5000ms default)    │                        │
│    │                               │                        │
│    │  Final Response               │                        │
│    │◄──────────────────────────────│                        │
│    │                               │                        │
│                                                             │
│  Default Value: 5000 ms (0x1388 in hex)                    │
│  Unit: Milliseconds                                         │
│  Range: Typically 100-10000 ms                              │
│                                                             │
│  Use Case: Long operations (flash, routines, DTC read)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### P3Server (Session Timeout) Parameter

```
┌─────────────────────────────────────────────────────────────┐
│                   P3SERVER PARAMETER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Definition: Maximum time between tester requests           │
│              (session inactivity timeout)                   │
│                                                             │
│  Timeline:                                                  │
│                                                             │
│  Tester                           ECU                       │
│    │                               │                        │
│    │  Request (e.g., session)      │                        │
│    │──────────────────────────────>│                        │
│    │  Response                     │                        │
│    │◄──────────────────────────────│                        │
│    │                               │ [Start P3Server timer] │
│    │                               │ ⏱ 5000ms               │
│    │                               │                        │
│    │  (No activity)                │ ⏱ Counting down...      │
│    │                               │                        │
│    │  Next Request (before timeout)│                        │
│    │──────────────────────────────>│ [Reset timer]          │
│    │                               │                        │
│                                                             │
│  If P3Server expires:                                        │
│  • ECU returns to DEFAULT session                           │
│  • Security access locked                                   │
│  • Need to re-enter session                                 │
│                                                             │
│  Default Value: 5000 ms (0x1388 in hex)                    │
│  Unit: Milliseconds                                         │
│  Range: Typically 1000-60000 ms                             │
│                                                             │
│  Related:  Tester Present (SID 0x3E) resets this timer       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timing Parameters Summary Table

```
┌──────────────┬─────────────┬──────────┬────────────────────┐
│ Parameter    │ Default     │ Unit     │ Purpose            │
├──────────────┼─────────────┼──────────┼────────────────────┤
│ P2Server     │ 50 ms       │ ms       │ Normal response    │
│              │ (0x0032)    │          │ timeout            │
├──────────────┼─────────────┼──────────┼────────────────────┤
│ P2*Server    │ 5000 ms     │ ms       │ Extended response  │
│              │ (0x1388)    │          │ timeout            │
├──────────────┼─────────────┼──────────┼────────────────────┤
│ P3Server     │ 5000 ms     │ ms       │ Session inactivity │
│              │ (0x1388)    │          │ timeout            │
└──────────────┴─────────────┴──────────┴────────────────────┘
```

---

## Sub-function Types

### Sub-function 0x01: Read Extended Timing Parameter Set

```
┌─────────────────────────────────────────────────────────────┐
│              SUB-FUNCTION 0x01 DETAILS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose: Read the extended timing parameter set            │
│           (not currently active, but available)             │
│                                                             │
│  Request:                                                    │
│  ┌──────┬──────┐                                           │
│  │ 0x83 │ 0x01 │                                           │
│  └──────┴──────┘                                           │
│                                                             │
│  Response:                                                  │
│  ┌──────┬──────┬──────────────────────┐                    │
│  │ 0xC3 │ 0x01 │ Timing Parameter Set │                    │
│  └──────┴──────┴──────────────────────┘                    │
│                                                             │
│  Timing Parameter Set Format:                               │
│  • Byte 2:  Timing Parameter Access Type                    │
│  • Byte 3-4: P2Server_max (2 bytes, big-endian)            │
│  • Byte 5-6: P2*Server_max (2 bytes, big-endian)           │
│  • Optional:  Additional parameters                          │
│                                                             │
│  Use Case:                                                   │
│  • Query what timing sets are supported                     │
│  • Understand ECU timing capabilities                       │
│  • Prepare for timing adjustment                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sub-function 0x02: Set Timing Parameters to Given Values

```
┌─────────────────────────────────────────────────────────────┐
│              SUB-FUNCTION 0x02 DETAILS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose: Set new timing parameter values                   │
│                                                             │
│  Request:                                                   │
│  ┌──────┬──────┬──────────────────────┐                    │
│  │ 0x83 │ 0x02 │ New Timing Values    │                    │
│  └──────┴──────┴──────────────────────┘                    │
│                                                             │
│  Timing Values Format:                                      │
│  • Byte 2: Timing Parameter Access Type                    │
│  • Byte 3-4: P2Server_max (2 bytes)                        │
│  • Byte 5-6: P2*Server_max (2 bytes)                       │
│                                                             │
│  Example:  Set P2=100ms, P2*=10000ms                        │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │ 0x83 │ 0x02 │ 0x01 │ 0x00 │ 0x64 │ 0x27 │ 0x10 │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│    SID   Sub   Type   P2-Hi  P2-Lo  P2*-Hi P2*-Lo         │
│                       (100ms)        (10000ms)             │
│                                                             │
│  Response:                                                  │
│  ┌──────┬──────┐                                           │
│  │ 0xC3 │ 0x02 │                                           │
│  └──────┴──────┘                                           │
│                                                             │
│  Use Case:                                                   │
│  • Slow ECUs need longer P2/P2* times                      │
│  • Fast networks can reduce timeouts                        │
│  • Optimize for specific diagnostic operations              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sub-function 0x03: Read Currently Active Timing Parameters

```
┌─────────────────────────────────────────────────────────────┐
│              SUB-FUNCTION 0x03 DETAILS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose:  Read the current active timing parameters         │
│                                                             │
│  Request:                                                   │
│  ┌──────┬──────┐                                           │
│  │ 0x83 │ 0x03 │                                           │
│  └──────┴──────┘                                           │
│                                                             │
│  Response:                                                  │
│  ┌──────┬──────┬──────────────────────┐                    │
│  │ 0xC3 │ 0x03 │ Current Timing Values│                    │
│  └──────┴──────┴──────────────────────┘                    │
│                                                             │
│  Current Timing Values Format:                              │
│  • Byte 2: Timing Parameter Access Type                    │
│  • Byte 3-4: Current P2Server_max                          │
│  • Byte 5-6: Current P2*Server_max                         │
│                                                             │
│  Example Response:                                           │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │ 0xC3 │ 0x03 │ 0x01 │ 0x00 │ 0x32 │ 0x13 │ 0x88 │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│   Resp  Sub   Type   P2-Hi  P2-Lo  P2*-Hi P2*-Lo          │
│                      (50ms)        (5000ms)                │
│                                                             │
│  Use Case:                                                  │
│  • Verify current settings                                  │
│  • Debug timing issues                                      │
│  • Confirm previous SET operation succeeded                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Positive Response

### Response Message Format

```
┌─────────────────────────────────────────────────────────────┐
│                  POSITIVE RESPONSE STRUCTURE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Byte 0:      Response SID = 0xC3 (0x83 + 0x40)             │
│  Byte 1:     Sub-function echo                              │
│  Byte 2-N:   Timing parameter data (depends on sub-fn)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Response Example:  Read Current Timing (0x03)

```
┌────────────────────────────────────────────────────────────┐
│ Read Currently Active Timing Parameters                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Request:                                                  │
│  ┌──────┬──────┐                                          │
│  │ 0x83 │ 0x03 │                                          │
│  └──────┴──────┘                                          │
│                                                            │
│  Response:                                                 │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐      │
│  │ 0xC3 │ 0x03 │ 0x01 │ 0x00 │ 0x32 │ 0x13 │ 0x88 │      │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘      │
│   Resp  Echo   Type   P2Hi   P2Lo  P2*Hi  P2*Lo          │
│   SID   Sub-fn                                            │
│                                                            │
│  Decoded Values:                                           │
│  • P2Server:   0x0032 = 50 decimal = 50 ms                 │
│  • P2*Server: 0x1388 = 5000 decimal = 5000 ms             │
│                                                            │
│  Meaning:  Current timing is 50ms/5000ms (default)         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Response Example: Set Timing (0x02)

```
┌────────────────────────────────────────────────────────────┐
│ Set Timing Parameters - Success                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Request:  Set P2=100ms, P2*=10000ms                       │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐      │
│  │ 0x83 │ 0x02 │ 0x01 │ 0x00 │ 0x64 │ 0x27 │ 0x10 │      │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘      │
│                                                            │
│  Response:                                                 │
│  ┌──────┬──────┐                                          │
│  │ 0xC3 │ 0x02 │                                          │
│  └──────┴──────┘                                          │
│   Resp  Echo                                              │
│   SID   Sub-fn                                            │
│                                                            │
│  Meaning: Timing successfully updated                     │
│           New values now active                           │
│                                                            │
│  Verification:  Send 0x83 0x03 to read back values         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### NRC Message Format

```
┌─────────────────────────────────────────────────────────────┐
│              NEGATIVE RESPONSE MESSAGE FORMAT               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Byte 0:  0x7F (Negative Response SID)                     │
│  Byte 1:  0x83 (Requested Service ID - Echo)               │
│  Byte 2:  NRC Code (Reason for rejection)                  │
│                                                             │
│  Total Length: Always 3 bytes                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Common NRCs for SID 0x83

```
┌──────┬─────────────────────────────┬───────────────────────┐
│ NRC  │ Name                        │ When It Occurs        │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x12 │ Sub-function Not Supported  │ Invalid sub-function  │
│      │                             │ (not 0x01/0x02/0x03)  │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x13 │ Incorrect Message Length    │ Wrong message length  │
│      │ Or Invalid Format           │ for sub-function      │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x22 │ Conditions Not Correct      │ Cannot change timing  │
│      │                             │ in current state      │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x31 │ Request Out Of Range        │ Timing values too     │
│      │                             │ large or too small    │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x33 │ Security Access Denied      │ Security unlock       │
│      │                             │ required (rare)       │
└──────┴─────────────────────────────┴───────────────────────┘
```

### NRC 0x31:  Request Out Of Range

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG:  Setting invalid timing values                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester sends: P2=0ms (impossible!)                        │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐      │
│  │ 0x83 │ 0x02 │ 0x01 │ 0x00 │ 0x00 │ 0x00 │ 0x00 │      │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘      │
│                       P2=0     P2*=0                       │
│                                                            │
│  ECU responds:                                              │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x83 │ 0x31 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  Reason: Timing values must be within valid range         │
│          Typically:  P2: 10-5000ms, P2*: 50-60000ms        │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Use valid timing ranges                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester sends: P2=100ms, P2*=10000ms                      │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐      │
│  │ 0x83 │ 0x02 │ 0x01 │ 0x00 │ 0x64 │ 0x27 │ 0x10 │      │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘      │
│                       P2=100   P2*=10000                   │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┐                                          │
│  │ 0xC3 │ 0x02 │  ✓ Success                               │
│  └──────┴──────┘                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: Read Default Timing Parameters

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: Verify ECU timing capabilities                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Read current active timing                         │
│  Request:   83 03                                            │
│  Response: C3 03 01 00 32 13 88                             │
│            (P2=50ms, P2*=5000ms)                            │
│                                                             │
│  Step 2: Interpret values                                   │
│  • P2Server: 0x0032 = 50ms (normal response timeout)       │
│  • P2*Server: 0x1388 = 5000ms (extended timeout)           │
│                                                             │
│  Step 3: Document for tester configuration                  │
│  • Configure tester to wait up to 50ms for responses       │
│  • Configure extended timeout of 5000ms for NRC 0x78        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 2: Adjust Timing for Slow ECU

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: ECU needs more time to process                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Problem: ECU frequently sends NRC 0x78 (Response Pending)  │
│           Indicates default P2 timeout too short            │
│                                                             │
│  Solution: Increase P2 and P2* timeouts                     │
│                                                             │
│  Step 1: Set longer timeouts                                │
│  Request:  83 02 01 00 C8 27 10                             │
│            (P2=200ms, P2*=10000ms)                          │
│  Response: C3 02                                            │
│  ✓ Timing adjusted                                          │
│                                                             │
│  Step 2: Verify new settings                                │
│  Request:  83 03                                            │
│  Response: C3 03 01 00 C8 27 10                             │
│  ✓ Confirmed:  P2=200ms, P2*=10000ms                        │
│                                                             │
│  Step 3: Retry previous operation                           │
│  Request:  22 F190 (Read VIN)                               │
│  Response: 62 F190 [VIN data]                               │
│  ✓ Success - no more NRC 0x78!                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 3: Optimize for Fast Network

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: High-speed network, reduce wait times           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup: ECU on fast CAN-FD network, minimal processing      │
│                                                             │
│  Step 1: Test current performance                           │
│  Request:  22 F186 (Read session)                           │
│  Response:  62 F186 01 (received in 10ms)                    │
│  Note: ECU responds very quickly                            │
│                                                             │
│  Step 2: Reduce P2 timeout to optimize                      │
│  Request:   83 02 01 00 19 03 E8                             │
│            (P2=25ms, P2*=1000ms)                            │
│  Response: C3 02                                            │
│  ✓ Faster timeouts configured                               │
│                                                             │
│  Step 3: Test multiple quick requests                       │
│  Request:   22 F186 → Response in 8ms ✓                      │
│  Request:  22 F18C → Response in 12ms ✓                     │
│  Request:  22 F190 → Response in 15ms ✓                     │
│                                                             │
│  Benefit:                                                    │
│  • Faster diagnostic sequences                              │
│  • Reduced total test time                                  │
│  • Better throughput for production testing                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 4: Programming Session Timing Adjustment

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: ECU flashing requires extended timeouts         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Enter programming session                          │
│  Request:  10 02                                            │
│  Response:  50 02                                            │
│                                                             │
│  Step 2: Set very long timeouts for flash operations        │
│  Request:  83 02 01 01 F4 75 30                             │
│            (P2=500ms, P2*=30000ms)                          │
│  Response: C3 02                                            │
│  ✓ Extended timeouts active                                 │
│                                                             │
│  Step 3: Unlock security                                    │
│  Request:  27 01                                            │
│  Response:  67 01 [seed]                                     │
│  Request:  27 02 [key]                                      │
│  Response: 67 02                                            │
│                                                             │
│  Step 4: Begin flash with adequate timing                   │
│  Request:   34 00 44 [address/size]                          │
│  ECU may send:  7F 34 78 (Response Pending)                  │
│  [Tester waits up to 30000ms]                               │
│  Response: 74 20 [params]                                   │
│  ✓ Success - extended timeout prevented failure             │
│                                                             │
│  Step 5: Transfer data blocks                               │
│  [Continue with 0x36 service]                               │
│  Long operations complete successfully                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ISO 14229-1 Reference

### Standard Specification

```
┌─────────────────────────────────────────────────────────────┐
│              ISO 14229-1:2020 REFERENCE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Document:  ISO 14229-1:2020                                 │
│  Section: 9.4 - AccessTimingParameter (0x83) service        │
│                                                             │
│  Key Topics Covered:                                        │
│  • Service description and purpose                          │
│  • Request message format                                   │
│  • Response message format                                  │
│  • Sub-function definitions (0x01, 0x02, 0x03)              │
│  • Timing parameter definitions (P2, P2*, P3)               │
│  • Timing parameter access types                            │
│  • Negative response codes                                  │
│  • Session behavior and requirements                        │
│                                                             │
│  Related Sections:                                          │
│  • Section 6.5:  Communication timing parameters             │
│  • Section 7.6: Response timing behavior                    │
│  • Section 8.2: Diagnostic Session Control (SID 0x10)       │
│  • Annex C: Negative Response Code Definitions              │
│  • Annex D: Timing parameter examples                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timing Parameter Relationships

```
┌─────────────────────────────────────────────────────────────┐
│              TIMING PARAMETER RELATIONSHIPS                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hierarchy:                                                 │
│                                                             │
│  P2Server ◄────┐                                            │
│    (50ms)      │  ECU Response                              │
│                │  Timing                                    │
│  P2*Server ◄───┘  (When needed for                          │
│    (5000ms)       long operations)                          │
│                                                             │
│  P3Server ◄─── Session Timeout                              │
│    (5000ms)    (Inactivity timer)                           │
│                                                             │
│  Relationship Rules:                                        │
│  • P2*Server MUST be > P2Server                             │
│  • P3Server should be >> P2*Server                          │
│  • Typical:  P2 < P2* ≤ P3                                   │
│  • Example: 50ms < 5000ms ≤ 5000ms                          │
│                                                             │
│  Usage Pattern:                                             │
│  ┌────────────────────────────────────────┐                │
│  │ Request sent                            │                │
│  │   ↓                                    │                │
│  │ Wait P2Server                          │                │
│  │   ↓                                    │                │
│  │ Response OR NRC 0x78?                   │                │
│  │   ↓                   ↓                │                │
│  │ Done           Wait P2*Server          │                │
│  │                       ↓                │                │
│  │                  Final Response        │                │
│  └────────────────────────────────────────┘                │
│                                                             │
│  P3Server runs independently:                                │
│  • Resets on ANY message from tester                        │
│  • Expires → return to DEFAULT session                      │
│  • Protected by Tester Present (SID 0x3E)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  SID 0x83 QUICK REFERENCE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose: Read/set diagnostic timing parameters             │
│                                                             │
│  Sub-functions:                                              │
│  • 0x01: Read Extended Timing Parameter Set                 │
│  • 0x02: Set Timing Parameters to Given Values              │
│  • 0x03: Read Currently Active Timing Parameters            │
│                                                             │
│  Key Timing Parameters:                                     │
│  • P2Server: Normal response timeout (default:  50ms)        │
│  • P2*Server: Extended response timeout (default: 5000ms)   │
│  • P3Server: Session inactivity timeout (default: 5000ms)   │
│                                                             │
│  Request Format:                                            │
│  [0x83] [Sub-fn] [Optional:  Timing Data]                   │
│                                                             │
│  Response Format:                                           │
│  [0xC3] [Sub-fn] [Timing Data if applicable]               │
│                                                             │
│  Common NRCs:                                               │
│  • 0x12 - Sub-function not supported                        │
│  • 0x13 - Incorrect message length                          │
│  • 0x22 - Conditions not correct                            │
│  • 0x31 - Timing values out of range                        │
│  • 0x33 - Security access denied                            │
│                                                             │
│  Best Practices:                                            │
│  • Read current timing before modifying                     │
│  • Verify changes with sub-function 0x03                    │
│  • Use longer timeouts for slow ECUs                        │
│  • Optimize timing for fast networks                        │
│  • Adjust P2*/P3 for programming operations                 │
│  • Stay within ECU-supported ranges                         │
│                                                             │
│  Critical Use Cases:                                        │
│  • ECU programming/flashing (need long P2*)                 │
│  • Slow/busy ECUs (increase timeouts)                       │
│  • Fast networks (decrease timeouts)                        │
│  • Diagnostic tool optimization                             │
│  • Multi-vendor ECU support                                 │
│                                                             │
│  Timing Units:                                               │
│  • All values in milliseconds                               │
│  • 2-byte values, big-endian format                         │
│  • Range:  Typically 1-65535ms                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x83 Theoretical Guide**

For practical implementation details, see:  `SID_83_PRACTICAL_IMPLEMENTATION.md`  
For service interaction workflows, see: `SID_83_SERVICE_INTERACTIONS.md`