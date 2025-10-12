# SID 0x14 - Clear Diagnostic Information (ClearDiagnosticInformation)

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Group of DTC Parameter](#group-of-dtc-parameter)
4. [Negative Response Codes](#negative-response-codes)
5. [Session and Security Requirements](#session-and-security-requirements)
6. [Service Behavior](#service-behavior)
7. [Related Services](#related-services)

---

## Service Overview

### Purpose

The **Clear Diagnostic Information** service is used by a tester to clear diagnostic information stored in the ECU's memory, including:
- Diagnostic Trouble Codes (DTCs)
- Fault occurrence counters
- Freeze frame data
- Extended data records
- Aging counters
- Environmental data

### When to Use

```
┌─────────────────────────────────────────────────┐
│  USE SID 0x14 WHEN:                             │
├─────────────────────────────────────────────────┤
│  ✓ Repair work is completed                    │
│  ✓ Need to verify fault is resolved            │
│  ✓ Clearing all DTCs in a group                │
│  ✓ Preparing for diagnostic tests              │
│  ✓ Resetting fault counters                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  DO NOT USE SID 0x14 WHEN:                      │
├─────────────────────────────────────────────────┤
│  ✗ Trying to hide unresolved faults            │
│  ✗ Before reading diagnostic data              │
│  ✗ During active fault conditions              │
│  ✗ Without understanding the consequences      │
└─────────────────────────────────────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────┐
│ CLEAR DIAGNOSTIC INFORMATION REQUEST                   │
├────────────────────────────────────────────────────────┤
│  Byte 0: SID (0x14)                                    │
│  Byte 1: GroupOfDTC (High Byte)                        │
│  Byte 2: GroupOfDTC (Middle Byte)                      │
│  Byte 3: GroupOfDTC (Low Byte)                         │
└────────────────────────────────────────────────────────┘

Total Length: 4 bytes
```

### Visual Example - Clear All DTCs

```
Request Breakdown:
┌────┬────┬────┬────┐
│ 14 │ FF │ FF │ FF │
└────┴────┴────┴────┘
  │    └─────┴────┘
  │         │
  │         └─ GroupOfDTC = 0xFFFFFF (All DTCs)
  │
  └─ Service ID (Clear Diagnostic Information)
```

### Positive Response Structure

```
┌────────────────────────────────────────────────────────┐
│ POSITIVE RESPONSE                                      │
├────────────────────────────────────────────────────────┤
│  Byte 0: Response SID (0x54)                           │
└────────────────────────────────────────────────────────┘

Total Length: 1 byte
```

### Complete Message Exchange

```
  Tester                          ECU
    │                              │
    │  Request: 14 FF FF FF        │
    │  (Clear all DTCs)            │
    │─────────────────────────────>│
    │                              │
    │      [ECU Processing]        │
    │      - Clear DTCs            │
    │      - Clear freeze frames   │
    │      - Reset counters        │
    │                              │
    │  Response: 54                │
    │  (Success)                   │
    │<─────────────────────────────│
    │                              │
```

---

## Group of DTC Parameter

### Three-Byte GroupOfDTC Structure

```
┌─────────────────────────────────────────────────┐
│  GroupOfDTC: 24-bit Parameter (3 bytes)         │
├─────────────────────────────────────────────────┤
│                                                 │
│   High Byte    Middle Byte    Low Byte         │
│   ┌──────┐    ┌──────┐    ┌──────┐            │
│   │  XX  │    │  XX  │    │  XX  │            │
│   └──────┘    └──────┘    └──────┘            │
│       │           │           │                │
│       └───────────┴───────────┘                │
│               │                                │
│        DTC Mask Pattern                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Common GroupOfDTC Values

```
┌──────────────┬─────────────────────────────────────┐
│  GroupOfDTC  │  Description                        │
├──────────────┼─────────────────────────────────────┤
│  0xFFFFFF    │  All DTCs (all groups)              │
│  0x000000    │  Emissions-related DTCs             │
│  0xFFFF33    │  All network communication DTCs     │
│  0xFFFF00    │  All powertrain DTCs                │
│  0xC00000    │  Chassis DTCs (high byte = 0xC0)    │
│  0xB00000    │  Body DTCs (high byte = 0xB0)       │
│  0x400000    │  Network DTCs (high byte = 0x40)    │
└──────────────┴─────────────────────────────────────┘
```

### Visual GroupOfDTC Examples

```
Example 1: Clear ALL DTCs
┌────────────────────────────────────────┐
│  Request: 14 FF FF FF                  │
├────────────────────────────────────────┤
│  FF FF FF = All groups, all DTCs       │
│  Most commonly used value              │
└────────────────────────────────────────┘

Example 2: Clear Emissions DTCs
┌────────────────────────────────────────┐
│  Request: 14 00 00 00                  │
├────────────────────────────────────────┤
│  00 00 00 = Emissions-related only     │
│  OBD-II compliance requirement         │
└────────────────────────────────────────┘

Example 3: Clear Powertrain DTCs
┌────────────────────────────────────────┐
│  Request: 14 FF FF 00                  │
├────────────────────────────────────────┤
│  FF FF 00 = All powertrain DTCs        │
│  Low byte = 0x00 (powertrain)          │
└────────────────────────────────────────┘

Example 4: Clear Specific DTC
┌────────────────────────────────────────┐
│  Request: 14 P1 23 45                  │
├────────────────────────────────────────┤
│  P12345 = Specific DTC code            │
│  Clears only this exact fault          │
└────────────────────────────────────────┘
```

### DTC Numbering System

```
┌─────────────────────────────────────────────────────────┐
│  DTC FORMAT: [High][Middle][Low]                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  High Byte (First Character & Hex Digit):               │
│  ┌────┬────────────────────────────┐                    │
│  │ P  │ Powertrain (0x00-0x3F)     │                    │
│  │ C  │ Chassis (0x40-0x7F)        │                    │
│  │ B  │ Body (0x80-0xBF)           │                    │
│  │ U  │ Network (0xC0-0xFF)        │                    │
│  └────┴────────────────────────────┘                    │
│                                                          │
│  Middle Byte (Second Hex Digit):                        │
│  - Sub-system identifier                                │
│                                                          │
│  Low Byte (Third & Fourth Hex Digits):                  │
│  - Specific fault code                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes

### Common NRCs for SID 0x14

```
┌────────┬─────────────────────────────────────────┐
│  NRC   │  Name                                   │
├────────┼─────────────────────────────────────────┤
│  0x12  │  SubFunctionNotSupported                │
│  0x13  │  IncorrectMessageLengthOrInvalidFormat  │
│  0x22  │  ConditionsNotCorrect                   │
│  0x31  │  RequestOutOfRange                      │
│  0x33  │  SecurityAccessDenied                   │
│  0x72  │  GeneralProgrammingFailure              │
│  0x78  │  RequestCorrectlyReceived-ResponsePending│
└────────┴─────────────────────────────────────────┘
```

---

### NRC 0x13 - Incorrect Message Length or Invalid Format

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 13                     │
├──────────────────────────────────────────────────┤
│  Meaning: The request message has wrong length   │
│           or invalid parameter format            │
└──────────────────────────────────────────────────┘
```

#### Common Causes

```
┌─────────────────────────────────────────────────┐
│  WHY NRC 0x13 OCCURS:                           │
├─────────────────────────────────────────────────┤
│  • Message too short (< 4 bytes)                │
│  • Message too long (> 4 bytes)                 │
│  • Missing GroupOfDTC parameter                 │
│  • Corrupted data transmission                  │
└─────────────────────────────────────────────────┘
```

#### Visual Comparison

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Too short                   │
├────────────────────────────────────────┤
│  Request: 14 FF FF                     │
│           └─────┘                      │
│           Only 2 bytes (need 3)        │
│                                        │
│  Response: 7F 14 13                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Too long                    │
├────────────────────────────────────────┤
│  Request: 14 FF FF FF 00               │
│           └─────────────┘              │
│           4 bytes (need 3)             │
│                                        │
│  Response: 7F 14 13                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Exact length               │
├────────────────────────────────────────┤
│  Request: 14 FF FF FF                  │
│           └───────────┘                │
│           Exactly 3 bytes              │
│                                        │
│  Response: 54                          │
└────────────────────────────────────────┘
```

---

### NRC 0x22 - Conditions Not Correct

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 22                     │
├──────────────────────────────────────────────────┤
│  Meaning: Current conditions prevent clearing    │
│           DTCs (active faults, states, etc.)     │
└──────────────────────────────────────────────────┘
```

#### Common Causes

```
┌─────────────────────────────────────────────────┐
│  WHY NRC 0x22 OCCURS:                           │
├─────────────────────────────────────────────────┤
│  • Active fault still present                   │
│  • ECU in special state (flashing, etc.)        │
│  • Vehicle speed > 0 km/h                       │
│  • Engine running (for some DTCs)               │
│  • Safety-critical systems active               │
│  • Ignition state incorrect                     │
└─────────────────────────────────────────────────┘
```

#### Visual Comparison

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Active fault present        │
├────────────────────────────────────────┤
│  Current State:                        │
│  🔴 Fault Active (sensor unplugged)   │
│  🚗 Vehicle stationary                │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 7F 14 22                    │
│                                        │
│  Reason: Cannot clear while active     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Vehicle moving              │
├────────────────────────────────────────┤
│  Current State:                        │
│  🟢 No active faults                   │
│  🚗 Vehicle speed: 50 km/h            │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 7F 14 22                    │
│                                        │
│  Reason: Must be stationary            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: All conditions met        │
├────────────────────────────────────────┤
│  Current State:                        │
│  🟢 No active faults                   │
│  🚗 Vehicle stationary                │
│  🔧 Fault repaired                     │
│  🔑 Ignition ON                        │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 54                          │
│                                        │
│  Result: DTCs cleared successfully     │
└────────────────────────────────────────┘
```

---

### NRC 0x31 - Request Out of Range

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 31                     │
├──────────────────────────────────────────────────┤
│  Meaning: The GroupOfDTC parameter is invalid    │
│           or not supported by this ECU           │
└──────────────────────────────────────────────────┘
```

#### Common Causes

```
┌─────────────────────────────────────────────────┐
│  WHY NRC 0x31 OCCURS:                           │
├─────────────────────────────────────────────────┤
│  • Invalid DTC group code                       │
│  • DTC group not supported by ECU               │
│  • Reserved DTC range requested                 │
│  • Manufacturer-specific group not recognized   │
└─────────────────────────────────────────────────┘
```

#### Visual Comparison

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Invalid group code          │
├────────────────────────────────────────┤
│  Request: 14 AA BB CC                  │
│           └───────────┘                │
│           Not a valid group            │
│                                        │
│  Response: 7F 14 31                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Valid group                │
├────────────────────────────────────────┤
│  Request: 14 FF FF FF                  │
│           └───────────┘                │
│           All DTCs (standard)          │
│                                        │
│  Response: 54                          │
└────────────────────────────────────────┘
```

---

### NRC 0x33 - Security Access Denied

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 33                     │
├──────────────────────────────────────────────────┤
│  Meaning: Security access required but not       │
│           granted (ECU locked)                   │
└──────────────────────────────────────────────────┘
```

#### Common Causes

```
┌─────────────────────────────────────────────────┐
│  WHY NRC 0x33 OCCURS:                           │
├─────────────────────────────────────────────────┤
│  • ECU requires security unlock (SID 0x27)      │
│  • Security level insufficient                  │
│  • Security session expired                     │
│  • Clearing protected DTCs without access       │
└─────────────────────────────────────────────────┘
```

#### Visual Comparison

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Not unlocked                │
├────────────────────────────────────────┤
│  Security State: 🔒 LOCKED             │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 7F 14 33                    │
│                                        │
│  Reason: Must unlock with SID 0x27     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Security unlocked          │
├────────────────────────────────────────┤
│  Step 1: Unlock ECU                    │
│    Request: 27 01                      │
│    Response: 67 01 [seed]              │
│    Request: 27 02 [key]                │
│    Response: 67 02                     │
│                                        │
│  Security State: 🔓 UNLOCKED           │
│                                        │
│  Step 2: Clear DTCs                    │
│    Request: 14 FF FF FF                │
│    Response: 54                        │
└────────────────────────────────────────┘
```

---

### NRC 0x72 - General Programming Failure

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 72                     │
├──────────────────────────────────────────────────┤
│  Meaning: ECU encountered error while clearing   │
│           DTCs from memory (hardware/software)   │
└──────────────────────────────────────────────────┘
```

#### Common Causes

```
┌─────────────────────────────────────────────────┐
│  WHY NRC 0x72 OCCURS:                           │
├─────────────────────────────────────────────────┤
│  • EEPROM write failure                         │
│  • Memory corruption detected                   │
│  • Flash memory error                           │
│  • Voltage too low for memory write             │
│  • Hardware fault in storage system             │
└─────────────────────────────────────────────────┘
```

#### Visual Comparison

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Low battery voltage          │
├────────────────────────────────────────┤
│  Battery: 🔋 9.5V (too low)            │
│  Required: 11V minimum                 │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 7F 14 72                    │
│                                        │
│  Reason: Insufficient power for write  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Adequate voltage           │
├────────────────────────────────────────┤
│  Battery: 🔋 12.5V (good)              │
│  Memory: ✓ Healthy                     │
│                                        │
│  Request: 14 FF FF FF                  │
│  Response: 54                          │
│                                        │
│  Result: DTCs cleared from EEPROM      │
└────────────────────────────────────────┘
```

---

### NRC 0x78 - Request Correctly Received - Response Pending

#### What It Means

```
┌──────────────────────────────────────────────────┐
│  Negative Response: 7F 14 78                     │
├──────────────────────────────────────────────────┤
│  Meaning: ECU received request and is processing │
│           (clearing large amount of data)        │
│           NOT an error - wait for final response │
└──────────────────────────────────────────────────┘
```

#### Timing Sequence

```
  Tester                          ECU
    │                              │
    │  Request: 14 FF FF FF        │
    │─────────────────────────────>│
    │                              │
    │  NRC: 7F 14 78               │
    │  (Please wait...)            │
    │<─────────────────────────────│
    │                              │
    │      Wait (< P2* timeout)    │
    │                              │
    │  NRC: 7F 14 78               │
    │  (Still working...)          │
    │<─────────────────────────────│
    │                              │
    │  Response: 54                │
    │  (Done!)                     │
    │<─────────────────────────────│
    │                              │
```

#### Visual Explanation

```
┌────────────────────────────────────────┐
│ ⏳ PROCESSING: Large clear operation  │
├────────────────────────────────────────┤
│  Request: 14 FF FF FF                  │
│                                        │
│  Response 1: 7F 14 78 (wait)           │
│  Response 2: 7F 14 78 (still wait)     │
│  Response 3: 54 (complete!)            │
│                                        │
│  What ECU is doing:                    │
│  ├─ Clearing 150 DTCs                  │
│  ├─ Erasing freeze frames              │
│  ├─ Resetting counters                 │
│  ├─ Writing to EEPROM                  │
│  └─ Verifying memory                   │
│                                        │
│  This is NORMAL behavior!              │
└────────────────────────────────────────┘
```

---

## Session and Security Requirements

### Session Requirements

```
┌─────────────────────────────────────────────────────┐
│  DIAGNOSTIC SESSION REQUIREMENTS                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✓ DEFAULT SESSION (0x01)                          │
│    - Usually allowed                               │
│    - May have restrictions on certain DTC groups   │
│                                                     │
│  ✓ EXTENDED DIAGNOSTIC SESSION (0x03)              │
│    - Full access to all DTC groups                 │
│    - Recommended for service/repair                │
│                                                     │
│  ✗ PROGRAMMING SESSION (0x02)                      │
│    - Typically not allowed during flash            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Security Requirements

```
┌─────────────────────────────────────────────────────┐
│  SECURITY ACCESS REQUIREMENTS                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ECU-Dependent Implementation:                     │
│                                                     │
│  Option 1: NO SECURITY REQUIRED 🔓                 │
│  ├─ GroupOfDTC 0xFFFFFF (all): No lock            │
│  └─ Common in production vehicles                  │
│                                                     │
│  Option 2: SELECTIVE SECURITY 🔒/🔓               │
│  ├─ GroupOfDTC 0xFFFFFF: Security required        │
│  ├─ GroupOfDTC 0x000000: No security (emissions)  │
│  └─ Common in protected systems                    │
│                                                     │
│  Option 3: FULL SECURITY REQUIRED 🔒              │
│  ├─ All GroupOfDTC values: Must unlock            │
│  └─ High-security ECUs (airbag, etc.)             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Complete Access Flow

```
         START
           │
           ▼
    ┌─────────────┐
    │ Check       │
    │ Session     │
    └──────┬──────┘
           │
      ┌────┴────┐
      │         │
    DEFAULT   EXTENDED
      │         │
      └────┬────┘
           │
           ▼
    ┌─────────────┐
    │ Check       │
    │ Security    │
    └──────┬──────┘
           │
      ┌────┴────┐
      │         │
   REQUIRED   NOT REQUIRED
      │         │
      │         └────────┐
      │                  │
      ▼                  │
┌────────────┐           │
│ Request    │           │
│ SID 0x27   │           │
│ (Unlock)   │           │
└─────┬──────┘           │
      │                  │
      ▼                  │
┌────────────┐           │
│ Send       │           │
│ SID 0x14   │◄──────────┘
│ Request    │
└─────┬──────┘
      │
      ▼
┌────────────┐
│ DTCs       │
│ Cleared    │
│ ✓          │
└────────────┘
```

---

## Service Behavior

### What Gets Cleared

```
┌──────────────────────────────────────────────────────┐
│  WHEN SID 0x14 IS EXECUTED, THE FOLLOWING ARE        │
│  CLEARED FROM ECU MEMORY:                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Diagnostic Trouble Codes (DTCs)                  │
│    └─ All fault codes matching GroupOfDTC           │
│                                                      │
│  ✓ Freeze Frame Data                                │
│    └─ Snapshot data captured when fault occurred    │
│                                                      │
│  ✓ Extended Data Records                            │
│    └─ Additional fault-related information          │
│                                                      │
│  ✓ Fault Occurrence Counters                        │
│    └─ Number of times fault detected                │
│                                                      │
│  ✓ Aging Counters                                   │
│    └─ Fault healing/aging cycle counts              │
│                                                      │
│  ✓ Test Failed Since Last Clear                     │
│    └─ Monitor readiness flags reset                 │
│                                                      │
│  ✓ DTC Status Byte                                  │
│    └─ All status bits reset to 0x00                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### What Does NOT Get Cleared

```
┌──────────────────────────────────────────────────────┐
│  THE FOLLOWING ARE PRESERVED (NOT CLEARED):          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✗ Permanent DTCs (OBD-II)                          │
│    └─ Require drive cycle completion to clear       │
│                                                      │
│  ✗ ECU Configuration Data                           │
│    └─ Coding, variant, calibration data             │
│                                                      │
│  ✗ Learned Values                                   │
│    └─ Adaptations, learned parameters               │
│                                                      │
│  ✗ Mileage/Odometer                                 │
│    └─ Vehicle lifetime data                         │
│                                                      │
│  ✗ Security Access State                            │
│    └─ Unlock status maintained                      │
│                                                      │
│  ✗ Active Diagnostic Session                        │
│    └─ Session type remains unchanged                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Before and After Comparison

```
BEFORE SID 0x14:
┌─────────────────────────────────────┐
│ ECU Memory State                    │
├─────────────────────────────────────┤
│ DTCs: P0301, P0302, P0420          │
│ Freeze Frames: 3 stored             │
│ Occurrence Count: P0301 = 5 times   │
│ Aging Counter: P0420 = 2 cycles     │
│ Status Byte: 0xE9 (multiple bits)   │
└─────────────────────────────────────┘

           SID 0x14 Executed
                  ⬇

AFTER SID 0x14:
┌─────────────────────────────────────┐
│ ECU Memory State                    │
├─────────────────────────────────────┤
│ DTCs: (empty)                       │
│ Freeze Frames: 0 stored             │
│ Occurrence Count: (reset to 0)      │
│ Aging Counter: (reset to 0)         │
│ Status Byte: 0x00 (all bits clear)  │
└─────────────────────────────────────┘
```

---

## Related Services

### Service Dependencies

```
┌──────────────────────────────────────────────────────┐
│  SERVICES THAT WORK WITH SID 0x14                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SID 0x10 - Diagnostic Session Control              │
│  └─ Used to: Enter extended session before clear    │
│                                                      │
│  SID 0x19 - Read DTC Information                    │
│  └─ Used to: Read DTCs before/after clearing        │
│                                                      │
│  SID 0x27 - Security Access                         │
│  └─ Used to: Unlock ECU if security required        │
│                                                      │
│  SID 0x85 - Control DTC Setting                     │
│  └─ Used to: Stop new DTCs while testing            │
│                                                      │
│  SID 0x3E - Tester Present                          │
│  └─ Used to: Keep session active during clear       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Typical Service Sequence

```
  Tester                          ECU
    │                              │
    │  1. Read DTCs (0x19)         │
    │─────────────────────────────>│
    │  [P0301, P0420, ...]         │
    │<─────────────────────────────│
    │                              │
    │  2. Enter Extended (0x10)    │
    │─────────────────────────────>│
    │  [Session active]            │
    │<─────────────────────────────│
    │                              │
    │  3. Clear DTCs (0x14)        │
    │─────────────────────────────>│
    │  [Success]                   │
    │<─────────────────────────────│
    │                              │
    │  4. Verify Clear (0x19)      │
    │─────────────────────────────>│
    │  [No DTCs]                   │
    │<─────────────────────────────│
    │                              │
```

---

## ISO 14229-1:2020 References

```
┌──────────────────────────────────────────────────────┐
│  STANDARD REFERENCES                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Section 9.5: ClearDiagnosticInformation            │
│  ├─ Service definition                              │
│  ├─ Message format                                  │
│  └─ Behavioral requirements                         │
│                                                      │
│  Section 9.5.1: Request message                     │
│  └─ GroupOfDTC parameter definition                 │
│                                                      │
│  Section 9.5.2: Positive response                   │
│  └─ Response format specification                   │
│                                                      │
│  Section 9.5.3: Negative response codes             │
│  └─ NRC conditions and meanings                     │
│                                                      │
│  Annex B: DTC Numbering                             │
│  └─ GroupOfDTC value definitions                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Summary

```
┌──────────────────────────────────────────────────────┐
│  SID 0x14 KEY POINTS                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Clears DTCs and related diagnostic data          │
│  ✓ Requires 4-byte request (SID + 3-byte group)     │
│  ✓ Most common: 14 FF FF FF (clear all)             │
│  ✓ Positive response: Single byte (0x54)            │
│  ✓ May require security unlock (ECU-dependent)      │
│  ✓ Should verify conditions before clearing         │
│  ✓ Always verify clear was successful (use 0x19)    │
│  ✓ Does NOT clear permanent DTCs or learned data    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

**End of Document**
