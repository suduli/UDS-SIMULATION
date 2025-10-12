# SID 0x2A - ReadDataByPeriodicIdentifier Service

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.2

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Transmission Modes](#transmission-modes)
4. [Periodic Identifier Types](#periodic-identifier-types)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Service Behavior](#service-behavior)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### Purpose

ReadDataByPeriodicIdentifier (SID 0x2A) allows a diagnostic tester to request **periodic transmission** of data from an ECU at specified time intervals. Unlike ReadDataByIdentifier (SID 0x22) which provides a single response, SID 0x2A enables continuous monitoring of dynamic vehicle data.

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE OVERVIEW                         │
├─────────────────────────────────────────────────────────────┤
│  Service Name: ReadDataByPeriodicIdentifier                 │
│  Request SID:  0x2A                                         │
│  Response SID: 0x6A                                         │
│  Function:     Request periodic data transmission           │
│  Data Type:    Dynamic vehicle parameters                   │
│  Relationship: Extended version of SID 0x22                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Continuous Data Streaming                                 │
│    └─> ECU sends data at regular intervals                   │
│                                                               │
│  ✓ Multiple Transmission Rates                               │
│    └─> Slow, Medium, Fast modes available                    │
│                                                               │
│  ✓ Multiple Identifiers Support                              │
│    └─> Can request several parameters simultaneously         │
│                                                               │
│  ✓ Stop Transmission Control                                 │
│    └─> Tester can halt periodic transmission                 │
│                                                               │
│  ✓ Automatic Termination                                     │
│    └─> Stops on session change or timeout                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  REQUEST MESSAGE FORMAT                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     SID (0x2A)                                        │
│              └─> Service Identifier                            │
│                                                                │
│  Byte 1:     Transmission Mode                                 │
│              ├─> 0x01 = Send At Slow Rate                      │
│              ├─> 0x02 = Send At Medium Rate                    │
│              ├─> 0x03 = Send At Fast Rate                      │
│              └─> 0x04 = Stop Sending                           │
│                                                                │
│  Byte 2:     Periodic Data Identifier #1                       │
│              └─> First identifier to monitor                   │
│                                                                │
│  Byte 3:     Periodic Data Identifier #2 (optional)            │
│              └─> Second identifier to monitor                  │
│                                                                │
│  Byte N:     Periodic Data Identifier #N (optional)            │
│              └─> Additional identifiers                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Positive Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│              POSITIVE RESPONSE FORMAT (Initial)                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Response SID (0x6A)                               │
│              └─> Positive response identifier                  │
│                                                                │
│  Bytes 1-N:  No additional data in initial response            │
│              └─> Confirmation only                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│             PERIODIC RESPONSE FORMAT (Ongoing)                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Response SID (0x6A)                               │
│              └─> Indicates periodic data                       │
│                                                                │
│  Byte 1:     Periodic Data Identifier                          │
│              └─> Which parameter is being sent                 │
│                                                                │
│  Bytes 2-N:  Data Record                                       │
│              └─> Actual parameter value                        │
│                                                                │
│  Note: If multiple identifiers requested, ECU sends            │
│        separate periodic responses for each                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Negative Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│               NEGATIVE RESPONSE FORMAT                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Negative Response SID (0x7F)                      │
│              └─> Indicates error                               │
│                                                                │
│  Byte 1:     Requested SID (0x2A)                              │
│              └─> Service that failed                           │
│                                                                │
│  Byte 2:     NRC (Negative Response Code)                      │
│              └─> Reason for rejection                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Transmission Modes

### Mode Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    TRANSMISSION MODES                            │
├───────────┬──────────────┬─────────────────┬────────────────────┤
│   Mode    │     Hex      │  Typical Rate   │   Use Case         │
├───────────┼──────────────┼─────────────────┼────────────────────┤
│   Slow    │     0x01     │   1-5 Hz        │  Temperature,      │
│           │              │   (1000-200ms)  │  Fuel level        │
├───────────┼──────────────┼─────────────────┼────────────────────┤
│  Medium   │     0x02     │   5-20 Hz       │  Vehicle speed,    │
│           │              │   (200-50ms)    │  RPM               │
├───────────┼──────────────┼─────────────────┼────────────────────┤
│   Fast    │     0x03     │   20-100 Hz     │  Sensor data,      │
│           │              │   (50-10ms)     │  Real-time signals │
├───────────┼──────────────┼─────────────────┼────────────────────┤
│   Stop    │     0x04     │   N/A           │  Stop all periodic │
│           │              │                 │  transmissions     │
└───────────┴──────────────┴─────────────────┴────────────────────┘
```

### Transmission Mode State Machine

```
                     ┌──────────────────┐
                     │  No Transmission │
                     │     (Initial)    │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        0x01: Slow      0x02: Medium    0x03: Fast
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Transmitting│  │ Transmitting│  │ Transmitting│
    │  @ Slow Rate│  │ @ Med Rate  │  │ @ Fast Rate │
    └─────┬───────┘  └─────┬───────┘  └─────┬───────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                    0x04: Stop Sending
                           │
                           ▼
                  ┌──────────────────┐
                  │  No Transmission │
                  │    (Stopped)     │
                  └──────────────────┘

    Additional Stop Conditions:
    ├─> Session Change (e.g., DEFAULT → EXTENDED)
    ├─> Security State Change (LOCKED after UNLOCKED)
    ├─> ECU Reset
    └─> Timeout (P2/P2* expiration)
```

### Rate Selection Guide

```
┌──────────────────────────────────────────────────────────────────┐
│                   RATE SELECTION DECISION                        │
└──────────────────────────────────────────────────────────────────┘

                    Is data slowly changing?
                   (e.g., temperature, fuel)
                              │
                    ┌─────────┴─────────┐
                   Yes                  No
                    │                   │
                    ▼                   │
            Use SLOW Rate (0x01)        │
            └─> 1-5 Hz                  │
                                        │
                           Is data moderately dynamic?
                          (e.g., speed, RPM, pressure)
                                        │
                              ┌─────────┴─────────┐
                             Yes                  No
                              │                   │
                              ▼                   │
                    Use MEDIUM Rate (0x02)        │
                    └─> 5-20 Hz                   │
                                                  │
                                     Is data rapidly changing?
                                    (e.g., sensor signals, PID)
                                                  │
                                        ┌─────────┴─────────┐
                                       Yes                  No
                                        │                   │
                                        ▼                   │
                              Use FAST Rate (0x03)          │
                              └─> 20-100 Hz                 │
                                                            │
                                                            ▼
                                              Consider using SID 0x22
                                              (Single read sufficient)
```

---

## Periodic Identifier Types

### Identifier Format

```
┌────────────────────────────────────────────────────────────────┐
│           PERIODIC DATA IDENTIFIER (PDID) FORMAT               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Range:  0x00 - 0xFF (1 byte)                                  │
│          └─> Unlike DID (0x0000-0xFFFF), PDID is 1 byte       │
│                                                                │
│  Categories:                                                   │
│  ├─> 0x00:        Stop all periodic transmissions             │
│  ├─> 0x01-0xEF:   Vehicle manufacturer specific               │
│  ├─> 0xF0-0xF9:   Network configuration specific              │
│  └─> 0xFA-0xFF:   Reserved/System specific                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### PDID vs DID Relationship

```
┌──────────────────────────────────────────────────────────────────┐
│              PDID (SID 0x2A) vs DID (SID 0x22)                   │
├──────────────────────┬───────────────────────────────────────────┤
│      Aspect          │         Difference                        │
├──────────────────────┼───────────────────────────────────────────┤
│  Identifier Size     │  PDID: 1 byte (0xXX)                      │
│                      │  DID:  2 bytes (0xXXXX)                   │
├──────────────────────┼───────────────────────────────────────────┤
│  Response Type       │  PDID: Periodic (continuous)              │
│                      │  DID:  Single (one-time)                  │
├──────────────────────┼───────────────────────────────────────────┤
│  Use Case            │  PDID: Monitoring dynamic data            │
│                      │  DID:  Reading static/current data        │
├──────────────────────┼───────────────────────────────────────────┤
│  Mapping             │  PDID often maps to one or more DIDs      │
│                      │  (ECU-specific configuration)             │
└──────────────────────┴───────────────────────────────────────────┘

Example Mapping:
┌─────────────────────────────────────────────────────────┐
│  PDID 0x01 → Engine RPM                                 │
│              ├─> Maps to DID 0xF40C internally          │
│              └─> Sent periodically at requested rate    │
│                                                         │
│  PDID 0x02 → Vehicle Speed                              │
│              ├─> Maps to DID 0xF40D internally          │
│              └─> Sent periodically at requested rate    │
└─────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### Common NRCs for SID 0x2A

```
┌──────────────────────────────────────────────────────────────────┐
│                        NRC OVERVIEW                              │
├──────┬───────────────────────────────┬───────────────────────────┤
│ NRC  │         Meaning               │    When It Occurs         │
├──────┼───────────────────────────────┼───────────────────────────┤
│ 0x12 │ Sub-Function Not Supported    │ Invalid transmission mode │
│ 0x13 │ Incorrect Message Length      │ Wrong number of bytes     │
│ 0x22 │ Conditions Not Correct        │ Wrong session/state       │
│ 0x31 │ Request Out Of Range          │ Invalid PDID              │
│ 0x33 │ Security Access Denied        │ Not unlocked when needed  │
│ 0x72 │ General Programming Failure   │ Scheduler overload        │
└──────┴───────────────────────────────┴───────────────────────────┘
```

### NRC 0x12: Sub-Function Not Supported

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 12                    │
│  │  │  └─> NRC: 0x12         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The requested transmission mode is not supported by this ECU.

**Common Causes:**
- Requesting mode 0x00 (reserved)
- Requesting mode > 0x04
- ECU only supports slow/medium (not fast)
- Using reserved transmission mode values

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unsupported Transmission Mode                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 05 01                 │  (Mode 0x05 doesn't exist)  │
│  │ │  │  └─> PDID 0x01      │                             │
│  │ │  └────> Mode 0x05 ❌   │                             │
│  │ └───────> SID 0x2A       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 12                 │                             │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Valid Transmission Mode                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 01                 │                             │
│  │ │  │  └─> PDID 0x01      │                             │
│  │ │  └────> Mode 0x02 ✓    │  (Medium rate - valid)     │
│  │ └───────> SID 0x2A       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Positive acknowledgment)  │
│  └──────────────────────────┘                             │
│                                                            │
│  Then periodic responses:                                  │
│  ┌──────────────────────────┐                             │
│  │ 6A 01 [data...]          │  (Every ~100-200ms)         │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x13: Incorrect Message Length

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 13                    │
│  │  │  └─> NRC: 0x13         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The request message has an invalid number of bytes.

**Common Causes:**
- Missing transmission mode byte
- Missing PDID when mode requires it
- Request too short (only SID provided)
- Extra unexpected bytes

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Missing Required Bytes                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02                    │  (Missing PDID!)            │
│  │ │  └─> Mode 0x02         │                             │
│  │ └────> SID 0x2A          │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 13                 │  (Incorrect length)         │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Complete Message                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 01                 │                             │
│  │ │  │  └─> PDID 0x01 ✓    │                             │
│  │ │  └────> Mode 0x02 ✓    │                             │
│  │ └───────> SID 0x2A ✓     │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x22: Conditions Not Correct

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 22                    │
│  │  │  └─> NRC: 0x22         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The ECU cannot start periodic transmission due to current operating conditions.

**Common Causes:**
- Wrong diagnostic session (must be in Extended or higher)
- Vehicle moving (safety requirement)
- Another periodic transmission already active at same rate
- ECU in a fault state
- Transmission scheduler full

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Requesting in Wrong Session                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Current State:                                            │
│  ┌────────────────────────────────────┐                   │
│  │  Session: DEFAULT (0x01)           │                   │
│  │  Security: N/A                     │                   │
│  └────────────────────────────────────┘                   │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 01                 │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 22                 │  (Conditions not correct)   │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Proper Session First                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Enter Extended Session                            │
│  ┌──────────────────────────┐                             │
│  │ 10 03                    │  (SID 0x10, Extended)       │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 50 03 [timing...]        │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
│  Current State:                                            │
│  ┌────────────────────────────────────┐                   │
│  │  Session: EXTENDED (0x03) ✓        │                   │
│  │  Security: N/A                     │                   │
│  └────────────────────────────────────┘                   │
│                                                            │
│  Step 2: Request Periodic Data                             │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 01                 │                             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x31: Request Out Of Range

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 31                    │
│  │  │  └─> NRC: 0x31         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The requested Periodic Data Identifier (PDID) is not supported or out of valid range.

**Common Causes:**
- PDID not configured in ECU
- PDID in reserved range (0xFA-0xFF) not implemented
- Too many PDIDs requested simultaneously
- PDID valid but not available in current configuration

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unsupported PDID                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 99                 │                             │
│  │ │  │  └─> PDID 0x99 ❌   │  (Not configured in ECU)   │
│  │ │  └────> Mode 0x02      │                             │
│  │ └───────> SID 0x2A       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 31                 │  (Out of range)             │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Valid PDID                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Supported PDIDs in this ECU:                              │
│  ┌────────────────────────────────────┐                   │
│  │  0x01: Engine RPM                  │                   │
│  │  0x02: Vehicle Speed                │                   │
│  │  0x03: Coolant Temperature          │                   │
│  └────────────────────────────────────┘                   │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 01                 │                             │
│  │ │  │  └─> PDID 0x01 ✓    │  (Supported!)              │
│  │ │  └────> Mode 0x02      │                             │
│  │ └───────> SID 0x2A       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x33: Security Access Denied

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 33                    │
│  │  │  └─> NRC: 0x33         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The requested PDID requires security access, but the ECU is currently locked.

**Common Causes:**
- Requesting security-protected PDID without unlocking
- Security level insufficient for requested data
- Security timeout occurred (ECU re-locked)

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Requesting Protected Data While Locked           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Security State: 🔒 LOCKED                                 │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 0A                 │                             │
│  │ │  │  └─> PDID 0x0A      │  (Requires security!)      │
│  │ │  └────> Mode 0x02      │                             │
│  │ └───────> SID 0x2A       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 33                 │  (Security denied)          │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock First, Then Request                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Enter Extended Session                            │
│  ┌──────────────────────────┐                             │
│  │ 10 03                    │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  Step 2: Security Access (Seed)                            │
│  ┌──────────────────────────┐                             │
│  │ 27 01                    │  (Request seed)             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 67 01 [seed bytes]       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  Step 3: Security Access (Key)                             │
│  ┌──────────────────────────┐                             │
│  │ 27 02 [key bytes]        │  (Send key)                 │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 67 02                    │  (Unlocked!)                │
│  └──────────────────────────┘                             │
│                                                            │
│  Security State: 🔓 UNLOCKED ✓                             │
│                                                            │
│  Step 4: Request Periodic Data                             │
│  ┌──────────────────────────┐                             │
│  │ 2A 02 0A                 │                             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x72: General Programming Failure

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2A 72                    │
│  │  │  └─> NRC: 0x72         │
│  │  └────> SID: 0x2A         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The ECU's periodic transmission scheduler is overloaded or has encountered an internal error.

**Common Causes:**
- Too many active periodic transmissions
- ECU scheduler at maximum capacity
- Insufficient memory for buffering
- Internal timing conflict

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Overloading the Scheduler                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Current Active Transmissions:                             │
│  ┌────────────────────────────────────┐                   │
│  │  Fast Rate:   5 PDIDs active       │                   │
│  │  Medium Rate: 8 PDIDs active       │  (Scheduler full) │
│  │  Slow Rate:   3 PDIDs active       │                   │
│  └────────────────────────────────────┘                   │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2A 03 05                 │  (Another fast rate!)       │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2A 72                 │  (Programming failure)      │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Stop Unused Transmissions First                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Stop Unnecessary Periodic Transmissions           │
│  ┌──────────────────────────┐                             │
│  │ 2A 04                    │  (Stop all)                 │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  Current Active Transmissions:                             │
│  ┌────────────────────────────────────┐                   │
│  │  Fast Rate:   0 PDIDs active       │                   │
│  │  Medium Rate: 0 PDIDs active       │  (Scheduler clear)│
│  │  Slow Rate:   0 PDIDs active       │                   │
│  └────────────────────────────────────┘                   │
│                                                            │
│  Step 2: Request Only Needed Data                          │
│  ┌──────────────────────────┐                             │
│  │ 2A 03 05                 │                             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6A                       │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Session and Security Requirements

### Session Requirements

```
┌──────────────────────────────────────────────────────────────────┐
│                     SESSION REQUIREMENTS                         │
├──────────────────────┬───────────────────────────────────────────┤
│  Session Type        │  SID 0x2A Availability                    │
├──────────────────────┼───────────────────────────────────────────┤
│  DEFAULT (0x01)      │  ❌ Typically NOT supported               │
│                      │  └─> Most ECUs reject in default session  │
├──────────────────────┼───────────────────────────────────────────┤
│  PROGRAMMING (0x02)  │  ⚠️  Vehicle manufacturer specific        │
│                      │  └─> May be disabled during programming   │
├──────────────────────┼───────────────────────────────────────────┤
│  EXTENDED (0x03)     │  ✅ Typically SUPPORTED                   │
│                      │  └─> Primary session for periodic data    │
├──────────────────────┼───────────────────────────────────────────┤
│  SAFETY SYSTEM (0x04)│  ⚠️  Vehicle manufacturer specific        │
│                      │  └─> May support safety-related PDIDs     │
└──────────────────────┴───────────────────────────────────────────┘
```

### Security Requirements

```
┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY REQUIREMENTS                         │
└──────────────────────────────────────────────────────────────────┘

PDID Security Levels:
┌────────────────────────────────────────────────────────┐
│  Public PDIDs (No Security Required)                   │
│  ├─> Standard vehicle data (RPM, speed, temperature)   │
│  └─> Available after session change only               │
├────────────────────────────────────────────────────────┤
│  Protected PDIDs (Security Required)                   │
│  ├─> Calibration data monitoring                       │
│  ├─> Internal sensor values                            │
│  ├─> Diagnostic trouble code monitoring                │
│  └─> Must unlock via SID 0x27 first                    │
└────────────────────────────────────────────────────────┘

Security State Impact:
┌────────────────────────────────────────────────────────┐
│                                                        │
│  🔒 LOCKED State:                                      │
│     ├─> Only public PDIDs available                   │
│     └─> Protected PDIDs return NRC 0x33               │
│                                                        │
│  🔓 UNLOCKED State:                                    │
│     ├─> All PDIDs available (session permitting)      │
│     └─> Both public and protected PDIDs accessible    │
│                                                        │
│  ⚠️  AUTO RE-LOCK Conditions:                          │
│     ├─> Session change                                │
│     ├─> ECU reset                                     │
│     ├─> Security timeout                              │
│     └─> All periodic transmissions stop on re-lock    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Service Behavior

### Periodic Transmission Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│              PERIODIC TRANSMISSION LIFECYCLE                     │
└──────────────────────────────────────────────────────────────────┘

Phase 1: INITIATION
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │  2A 02 01              │  (Request: Medium rate, PDID 0x01)
    │───────────────────────>│
    │                        │
    │                        ├──> Validate session
    │                        ├──> Validate security
    │                        ├──> Check PDID exists
    │                        ├──> Check scheduler capacity
    │                        │
    │  6A                    │  (Positive acknowledgment)
    │<───────────────────────│
    │                        │
    │                        └──> Start periodic timer


Phase 2: PERIODIC TRANSMISSION
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │                        ├──> Timer expires (e.g., 100ms)
    │                        ├──> Read PDID data
    │                        │
    │  6A 01 [data...]       │  (Periodic response)
    │<───────────────────────│
    │                        │
    │                        ├──> Restart timer
    │                        ├──> Timer expires again
    │                        │
    │  6A 01 [data...]       │  (Another periodic response)
    │<───────────────────────│
    │                        │
    │        ...             │  (Continues indefinitely)
    │                        │


Phase 3: TERMINATION (Manual)
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │  2A 04                 │  (Stop transmission)
    │───────────────────────>│
    │                        │
    │                        ├──> Stop all periodic timers
    │                        ├──> Clear scheduler entries
    │                        │
    │  6A                    │  (Acknowledgment)
    │<───────────────────────│
    │                        │
    │                        └──> Periodic transmission stopped


Phase 4: TERMINATION (Automatic)
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │  10 01                 │  (Return to default session)
    │───────────────────────>│
    │                        │
    │                        ├──> Stop all periodic timers
    │                        ├──> Clear all scheduler entries
    │                        ├──> Change session to DEFAULT
    │                        │
    │  50 01 [timing...]     │  (Session change confirmed)
    │<───────────────────────│
    │                        │
    │                        └──> All periodic transmissions stopped
```

### Multiple PDID Handling

```
┌──────────────────────────────────────────────────────────────────┐
│               REQUESTING MULTIPLE PDIDs                          │
└──────────────────────────────────────────────────────────────────┘

Method 1: Single Request (Multiple PDIDs)
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │  2A 02 01 02 03        │  (Request 3 PDIDs at medium rate)
    │───────────────────────>│
    │                        │
    │  6A                    │  (Acknowledgment)
    │<───────────────────────│
    │                        │
    │  6A 01 [RPM data]      │  ─┐
    │<───────────────────────│  │
    │                        │  │ Separate periodic
    │  6A 02 [Speed data]    │  │ responses for each
    │<───────────────────────│  │ PDID (interleaved)
    │                        │  │
    │  6A 03 [Temp data]     │  │
    │<───────────────────────│  ─┘
    │                        │
    │        ...             │  (Cycle repeats)


Method 2: Separate Requests (Different Rates)
═══════════════════════════════════════════════════════════════════
  Tester                    ECU
    │                        │
    │  2A 01 01              │  (Request PDID 0x01 at slow rate)
    │───────────────────────>│
    │  6A                    │
    │<───────────────────────│
    │                        │
    │  2A 03 02              │  (Request PDID 0x02 at fast rate)
    │───────────────────────>│
    │  6A                    │
    │<───────────────────────│
    │                        │
    │  6A 02 [Speed data]    │  ─┐ Fast (50ms)
    │<───────────────────────│  │
    │  6A 02 [Speed data]    │  │
    │<───────────────────────│  │
    │  6A 01 [RPM data]      │  ├─ Slow (500ms)
    │<───────────────────────│  │
    │  6A 02 [Speed data]    │  │
    │<───────────────────────│  ─┘
    │        ...             │
```

### Scheduler Priority

```
┌──────────────────────────────────────────────────────────────────┐
│                  TRANSMISSION SCHEDULER                          │
└──────────────────────────────────────────────────────────────────┘

Priority Order (Highest to Lowest):
┌────────────────────────────────────────────────────────┐
│  1. Fast Rate (0x03)                                   │
│     └─> 10-50ms interval, highest priority             │
│                                                        │
│  2. Medium Rate (0x02)                                 │
│     └─> 50-200ms interval, medium priority             │
│                                                        │
│  3. Slow Rate (0x01)                                   │
│     └─> 200-1000ms interval, lowest priority           │
└────────────────────────────────────────────────────────┘

Timing Diagram Example:
═══════════════════════════════════════════════════════════════
Time:  0ms    50ms   100ms  150ms  200ms  250ms  300ms
       │      │      │      │      │      │      │
Fast:  ▼──────▼──────▼──────▼──────▼──────▼──────▼──────
       │                    │                    │
Med:   ▼────────────────────▼────────────────────▼────────
       │                                         │
Slow:  ▼─────────────────────────────────────────▼────────

Legend:
  ▼ = Periodic transmission sent
```

---

## ISO 14229-1 Reference

### Standard Specification

```
┌──────────────────────────────────────────────────────────────────┐
│                ISO 14229-1:2020 REFERENCE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Document:  ISO 14229-1:2020                                     │
│  Section:   11.2 - ReadDataByPeriodicIdentifier (0x2A)           │
│  Title:     Road vehicles — Unified diagnostic services (UDS)    │
│             Part 1: Application layer                            │
│                                                                  │
│  Key Normative References:                                       │
│  ├─> Section 11.2.1: Service description                         │
│  ├─> Section 11.2.2: Message format definition                   │
│  ├─> Section 11.2.3: Transmission mode specification             │
│  ├─> Section 11.2.4: Periodic identifier definition              │
│  └─> Section 11.2.5: NRC definitions                             │
│                                                                  │
│  Related Sections:                                               │
│  ├─> Section 11.1: ReadDataByIdentifier (0x22)                   │
│  ├─> Section 9.2:  DiagnosticSessionControl (0x10)               │
│  ├─> Section 9.3:  SecurityAccess (0x27)                         │
│  └─> Section 7.5:  Negative response codes                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Compliance Requirements

```
┌──────────────────────────────────────────────────────────────────┐
│                  COMPLIANCE CHECKLIST                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Mandatory Requirements:                                         │
│  ✓ Support at least one transmission mode (slow/medium/fast)    │
│  ✓ Support stop transmission mode (0x04)                         │
│  ✓ Implement scheduler to handle periodic transmissions          │
│  ✓ Automatically stop transmissions on session change            │
│  ✓ Return NRC 0x12 for unsupported transmission modes            │
│  ✓ Return NRC 0x13 for incorrect message length                  │
│  ✓ Return NRC 0x22 for incorrect conditions                      │
│  ✓ Return NRC 0x31 for unsupported PDIDs                         │
│  ✓ Return NRC 0x33 when security access required but denied      │
│                                                                  │
│  Optional (Vehicle Manufacturer Specific):                       │
│  ○ Support for all three transmission rates                      │
│  ○ Maximum number of simultaneous periodic transmissions         │
│  ○ Specific PDID to DID mapping                                  │
│  ○ Exact transmission rate timing values                         │
│  ○ Security requirements for specific PDIDs                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Quick Reference Card

```
┌──────────────────────────────────────────────────────────────────┐
│              SID 0x2A QUICK REFERENCE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request Format:                                                 │
│  ┌────────────────────────────────┐                             │
│  │ 2A [Mode] [PDID1] [PDID2] ...  │                             │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Positive Response:                                              │
│  ┌────────────────────────────────┐                             │
│  │ 6A                             │  (Acknowledgment)            │
│  │ 6A [PDID] [data...]            │  (Periodic responses)        │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Negative Response:                                              │
│  ┌────────────────────────────────┐                             │
│  │ 7F 2A [NRC]                    │                             │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Transmission Modes:                                             │
│  ├─> 0x01: Slow Rate (1-5 Hz)                                   │
│  ├─> 0x02: Medium Rate (5-20 Hz)                                │
│  ├─> 0x03: Fast Rate (20-100 Hz)                                │
│  └─> 0x04: Stop Sending                                         │
│                                                                  │
│  Common NRCs:                                                    │
│  ├─> 0x12: Sub-Function Not Supported                           │
│  ├─> 0x13: Incorrect Message Length                             │
│  ├─> 0x22: Conditions Not Correct                               │
│  ├─> 0x31: Request Out Of Range                                 │
│  ├─> 0x33: Security Access Denied                               │
│  └─> 0x72: General Programming Failure                          │
│                                                                  │
│  Session Required: EXTENDED (0x03) or higher                     │
│  Security Required: Depends on PDID (check ECU spec)             │
│                                                                  │
│  Auto-Stop Conditions:                                           │
│  ├─> Session change                                             │
│  ├─> Security state change                                      │
│  ├─> ECU reset                                                  │
│  └─> Explicit stop request (0x04)                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x2A Theory Document**

For implementation guidance, see: `SID_42_PRACTICAL_IMPLEMENTATION.md`  
For service interactions, see: `SID_42_SERVICE_INTERACTIONS.md`
