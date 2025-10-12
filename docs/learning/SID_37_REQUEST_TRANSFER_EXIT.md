# SID 0x37: Request Transfer Exit - Complete Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Transfer Parameter Records](#transfer-parameter-records)
4. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
5. [Session and Security Requirements](#session-and-security-requirements)
6. [State Machine Behavior](#state-machine-behavior)
7. [Interaction with Other Services](#interaction-with-other-services)
8. [ISO 14229-1 References](#iso-14229-1-references)

---

## Service Overview

### Purpose

Request Transfer Exit (SID `0x37`) is used to **terminate a data transfer sequence** that was initiated by either:
- SID `0x34` (Request Download) - ECU receives data from tester
- SID `0x35` (Request Upload) - ECU sends data to tester

And executed through multiple:
- SID `0x36` (Transfer Data) - Actual data block transfers

```
┌────────────────────────────────────────────────────────────────┐
│  TRANSFER EXIT PURPOSE                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  • Signals completion of data transfer                        │
│  • Allows ECU to verify transfer integrity                    │
│  • Triggers ECU post-processing (checksum, validation)        │
│  • Returns ECU to ready state for next operation              │
│  • May return verification results to tester                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### When to Use SID 0x37

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASES                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ After completing all Transfer Data (0x36) blocks         │
│  ✓ To finalize firmware/software downloads                  │
│  ✓ To conclude ECU memory upload sessions                   │
│  ✓ To trigger ECU data verification processes               │
│  ✓ Before starting a new download/upload sequence           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Typical Transfer Sequence

```
  Tester                                    ECU
    │                                        │
    │  SID 0x34/0x35 (Request Transfer)     │
    │───────────────────────────────────────>│
    │                                        │
    │  Positive Response (0x74/0x75)         │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x36 (Transfer Data Block 1)      │
    │───────────────────────────────────────>│
    │  Positive Response (0x76)              │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x36 (Transfer Data Block 2)      │
    │───────────────────────────────────────>│
    │  Positive Response (0x76)              │
    │<───────────────────────────────────────│
    │                                        │
    │         ... more blocks ...            │
    │                                        │
    │  SID 0x37 (Request Transfer Exit) ◄─── YOU ARE HERE
    │───────────────────────────────────────>│
    │                                        │
    │  Positive Response (0x77)              │
    │<───────────────────────────────────────│
    │                                        │
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│  REQUEST MESSAGE (SID 0x37)                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Service ID (0x37)                                 │
│  Byte 1-N:   transferRequestParameterRecord (OPTIONAL)         │
│                                                                │
│  Minimum Length: 1 byte                                        │
│  Maximum Length: Variable (depends on implementation)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Request Examples

#### Example 1: Simple Exit (No Parameters)

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  37                                 │
└─────────────────────────────────────┘

Byte Breakdown:
  [0] = 0x37  → Request Transfer Exit SID
```

#### Example 2: Exit with CRC-32 Checksum

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  37 A1 B2 C3 D4                     │
└─────────────────────────────────────┘

Byte Breakdown:
  [0]    = 0x37        → Request Transfer Exit SID
  [1-4]  = 0xA1B2C3D4  → CRC-32 checksum of transferred data
```

#### Example 3: Exit with Block Count Verification

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  37 00 FF                           │
└─────────────────────────────────────┘

Byte Breakdown:
  [0]    = 0x37    → Request Transfer Exit SID
  [1-2]  = 0x00FF  → Total blocks transferred (255 blocks)
```

---

### Positive Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│  POSITIVE RESPONSE MESSAGE (SID 0x77)                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Response SID (0x77 = 0x37 + 0x40)                 │
│  Byte 1-N:   transferResponseParameterRecord (OPTIONAL)        │
│                                                                │
│  Minimum Length: 1 byte                                        │
│  Maximum Length: Variable (depends on implementation)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Response Examples

#### Example 1: Simple Positive Response

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  77                                 │
└─────────────────────────────────────┘

Byte Breakdown:
  [0] = 0x77  → Positive response (0x37 + 0x40)

Meaning: Transfer successfully completed, no additional data
```

#### Example 2: Response with Verification Status

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  77 01                              │
└─────────────────────────────────────┘

Byte Breakdown:
  [0] = 0x77  → Positive response
  [1] = 0x01  → Verification status (0x01 = Success)

Status Codes (Example):
  0x00 = Not verified yet
  0x01 = Verification successful
  0x02 = Verification pending
```

#### Example 3: Response with Flash Programming Status

```
┌─────────────────────────────────────┐
│  HEX BYTES                          │
├─────────────────────────────────────┤
│  77 00 10                           │
└─────────────────────────────────────┘

Byte Breakdown:
  [0]    = 0x77    → Positive response
  [1-2]  = 0x0010  → Flash blocks written successfully (16 blocks)
```

---

## Transfer Parameter Records

### Request Parameters (transferRequestParameterRecord)

The optional parameter record in the request can contain:

```
┌────────────────────────────────────────────────────────────────┐
│  COMMON REQUEST PARAMETERS                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Checksum/CRC Value                                         │
│     • Used to verify data integrity                            │
│     • Common formats: CRC-16, CRC-32, custom checksum          │
│                                                                │
│  2. Block Counter                                              │
│     • Total number of blocks transferred                       │
│     • ECU verifies against expected count                      │
│                                                                │
│  3. Transfer Size                                              │
│     • Total bytes transferred                                  │
│     • ECU verifies against expected size                       │
│                                                                │
│  4. Signature/Hash                                             │
│     • Cryptographic signature for security                     │
│     • Used in secure flash programming                         │
│                                                                │
│  5. Custom Verification Data                                   │
│     • Manufacturer-specific verification parameters            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Response Parameters (transferResponseParameterRecord)

The optional parameter record in the response can contain:

```
┌────────────────────────────────────────────────────────────────┐
│  COMMON RESPONSE PARAMETERS                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Verification Status                                        │
│     • 0x00 = Not verified                                      │
│     • 0x01 = Verification successful                           │
│     • 0x02 = Verification pending                              │
│     • 0xFF = Verification failed                               │
│                                                                │
│  2. Processing Time                                            │
│     • Estimated time for ECU post-processing                   │
│     • Format: milliseconds or seconds                          │
│                                                                │
│  3. ECU Calculated Checksum                                    │
│     • ECU's own checksum of received data                      │
│     • Allows tester to verify ECU calculation                  │
│                                                                │
│  4. Block Count Confirmation                                   │
│     • Number of blocks ECU actually received                   │
│     • Used for verification against expected count             │
│                                                                │
│  5. Status Flags                                               │
│     • Additional processing status indicators                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### NRC Overview Table

```
┌──────────┬─────────────────────────────────────┬────────────────┐
│   NRC    │  Description                        │  Common Usage  │
├──────────┼─────────────────────────────────────┼────────────────┤
│   0x13   │  Incorrect Message Length           │  Very Common   │
│   0x22   │  Conditions Not Correct             │  Very Common   │
│   0x24   │  Request Sequence Error             │  Most Common   │
│   0x31   │  Request Out Of Range               │  Common        │
│   0x33   │  Security Access Denied             │  Common        │
│   0x70   │  Upload Download Not Accepted       │  Common        │
│   0x72   │  General Programming Failure        │  Common        │
│   0x92   │  Voltage Too High                   │  Moderate      │
│   0x93   │  Voltage Too Low                    │  Moderate      │
└──────────┴─────────────────────────────────────┴────────────────┘
```

---

### NRC 0x13: Incorrect Message Length or Invalid Format

**What It Means:**

The length of the Transfer Exit request doesn't match the expected format.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 13                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Incorrect Message Length (0x13)               │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Sent parameter record when ECU expects none
- Missing required parameter record
- Parameter record size doesn't match ECU specification
- Corrupted message during transmission

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unexpected Parameter Record                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester sends:    37 AA BB CC DD                               │
│                                                                │
│  But ECU expects: 37 (no parameters)                           │
│                                                                │
│  Result: NRC 0x13 (message too long)                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Match ECU Specification                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Check ECU documentation first                                 │
│                                                                │
│  If ECU expects no parameters:                                 │
│    Tester sends:    37                                         │
│    ECU responds:    77                                         │
│                                                                │
│  If ECU expects CRC-32:                                        │
│    Tester sends:    37 A1 B2 C3 D4                             │
│    ECU responds:    77                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x22: Conditions Not Correct

**What It Means:**

The ECU cannot process the Transfer Exit request because current conditions don't allow it.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 22                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Conditions Not Correct (0x22)                 │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Vehicle is not stationary (for critical updates)
- Engine is running (for safety-critical transfers)
- Transmission not in Park/Neutral
- Battery voltage outside acceptable range
- ECU temperature too high
- Critical systems are active

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unsafe Conditions                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Current State:                                                │
│    • Engine: RUNNING 🔴                                        │
│    • Transmission: DRIVE 🔴                                    │
│    • Speed: 45 km/h 🔴                                         │
│                                                                │
│  Tester:  SID 0x37 (Transfer Exit)                             │
│  ECU:     7F 37 22 (Conditions Not Correct)                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Safe Conditions Met                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Required State:                                               │
│    • Engine: OFF ✅                                            │
│    • Transmission: PARK ✅                                     │
│    • Speed: 0 km/h ✅                                          │
│    • Battery: 12.5V (acceptable) ✅                            │
│                                                                │
│  Tester:  SID 0x37 (Transfer Exit)                             │
│  ECU:     77 (Positive Response)                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x24: Request Sequence Error

**What It Means:**

The Transfer Exit request was sent at the wrong time in the transfer sequence. **This is the MOST COMMON NRC for SID 0x37.**

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 24                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Request Sequence Error (0x24)                 │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- No active transfer session (never called SID 0x34/0x35)
- Transfer already exited
- Still expecting more Transfer Data blocks
- Transfer session timed out
- Another transfer operation in progress

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: No Active Transfer                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Sequence:                                                     │
│    1. (No SID 0x34 or 0x35 sent)                               │
│    2. Tester → ECU: 37 (Transfer Exit)                         │
│    3. ECU → Tester: 7F 37 24 (No transfer to exit!)            │
│                                                                │
│  Problem: Never started a transfer session                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Already Exited                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Sequence:                                                     │
│    1. SID 0x34 (Request Download) → Success                    │
│    2. SID 0x36 (Transfer Data) → Success                       │
│    3. SID 0x37 (Transfer Exit) → Success                       │
│    4. SID 0x37 (Transfer Exit AGAIN) ← ERROR                   │
│       ECU → Tester: 7F 37 24 (Already exited!)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Proper Transfer Sequence                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Complete Sequence:                                            │
│                                                                │
│    1. SID 0x34 (Request Download)                              │
│       ECU → 74 (OK, ready to receive)                          │
│                                                                │
│    2. SID 0x36 (Transfer Data Block 1)                         │
│       ECU → 76 (Block received)                                │
│                                                                │
│    3. SID 0x36 (Transfer Data Block 2)                         │
│       ECU → 76 (Block received)                                │
│                                                                │
│    ... (all blocks transferred) ...                            │
│                                                                │
│    4. SID 0x37 (Transfer Exit) ← CORRECT TIMING                │
│       ECU → 77 (Transfer complete!)                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x31: Request Out Of Range

**What It Means:**

The transfer parameter record contains values outside acceptable ranges.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 31                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Request Out Of Range (0x31)                   │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Invalid checksum value format
- Block count doesn't match actual transfers
- Transfer size mismatch
- Unsupported verification method specified

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Block Count Mismatch                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Actual transfers performed: 100 blocks                        │
│                                                                │
│  Tester sends: 37 00 C8                                        │
│                   └──┘                                         │
│                   0x00C8 = 200 blocks (WRONG!)                 │
│                                                                │
│  ECU responds: 7F 37 31 (Count out of range)                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Matching Block Count                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Actual transfers performed: 100 blocks                        │
│                                                                │
│  Tester sends: 37 00 64                                        │
│                   └──┘                                         │
│                   0x0064 = 100 blocks ✅                       │
│                                                                │
│  ECU responds: 77 (Success)                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x33: Security Access Denied

**What It Means:**

Transfer Exit requires security access, and the ECU is currently locked.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 33                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Security Access Denied (0x33)                 │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Never performed SID 0x27 (Security Access)
- Security session expired/timed out
- Wrong security level unlocked
- Security re-lock occurred during transfer

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: ECU Locked                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Security State: LOCKED 🔒                                     │
│                                                                │
│  Tester → ECU: 37 (Transfer Exit)                              │
│  ECU → Tester: 7F 37 33 (Access Denied)                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: ECU Unlocked First                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Unlock ECU                                            │
│    SID 0x27 0x01 (Request Seed)                                │
│    SID 0x27 0x02 + Key (Send Key)                              │
│    Security State: UNLOCKED 🔓                                 │
│                                                                │
│  Step 2: Start Transfer                                        │
│    SID 0x34 (Request Download)                                 │
│    SID 0x36... (Transfer blocks)                               │
│                                                                │
│  Step 3: Exit Transfer                                         │
│    Tester → ECU: 37 (Transfer Exit)                            │
│    ECU → Tester: 77 (Success)                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x70: Upload Download Not Accepted

**What It Means:**

The ECU cannot accept the Transfer Exit due to transfer-specific issues.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 70                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: Upload Download Not Accepted (0x70)           │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Not all expected blocks were transferred
- Transfer was incomplete
- ECU detected missing data blocks
- Transfer was corrupted or interrupted

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Incomplete Transfer                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Expected blocks: 150                                          │
│  Transferred:     145 (missing 5 blocks!)                      │
│                                                                │
│  Tester → ECU: 37 (Try to exit)                                │
│  ECU → Tester: 7F 37 70 (Transfer incomplete)                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Complete Transfer                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Expected blocks: 150                                          │
│  Transferred:     150 ✅                                       │
│                                                                │
│  All blocks successfully received                              │
│                                                                │
│  Tester → ECU: 37 (Exit)                                       │
│  ECU → Tester: 77 (Success)                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x72: General Programming Failure

**What It Means:**

The ECU detected a failure during post-transfer processing (checksum verification, flash write, etc.).

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 72                                                      │
│  │  │  │                                                       │
│  │  │  └── NRC: General Programming Failure (0x72)            │
│  │  └───── SID that failed (0x37)                             │
│  └──────── Negative Response SID (0x7F)                        │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Checksum mismatch (corrupted data)
- Flash memory write failure
- Data verification failed
- Invalid firmware signature
- Memory allocation error

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Checksum Mismatch                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester sends:   37 A1 B2 C3 D4                                │
│                     └──────┘                                   │
│                     Expected CRC                               │
│                                                                │
│  ECU calculates: CRC = 0xA1B2C3D5 (doesn't match!)             │
│                                                                │
│  ECU responds:   7F 37 72 (Programming Failure)                │
│                                                                │
│  Cause: Data corruption during transfer                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Checksum Match                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester sends:   37 A1 B2 C3 D4                                │
│                     └──────┘                                   │
│                     Expected CRC                               │
│                                                                │
│  ECU calculates: CRC = 0xA1B2C3D4 ✅                           │
│                                                                │
│  Verification successful!                                      │
│                                                                │
│  ECU responds:   77 (Success)                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x92/0x93: Voltage Too High/Low

**What It Means:**

Battery voltage is outside the safe range for completing the transfer.

```
┌────────────────────────────────────────────────────────────────┐
│  NEGATIVE RESPONSE FORMAT                                      │
├────────────────────────────────────────────────────────────────┤
│  7F 37 92  (Voltage Too High)                                  │
│  7F 37 93  (Voltage Too Low)                                   │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**

- Battery voltage < 11V (too low for flash operations)
- Battery voltage > 16V (too high, risk of damage)
- Unstable power supply during transfer
- Charging system malfunction

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Unsafe Voltage                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Battery Voltage: 10.5V 🔴 (TOO LOW)                           │
│                                                                │
│  Tester → ECU: 37 (Transfer Exit)                              │
│  ECU → Tester: 7F 37 93 (Voltage Too Low)                      │
│                                                                │
│  Risk: Flash programming may fail/corrupt                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Safe Voltage Range                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Battery Voltage: 12.6V ✅ (SAFE RANGE: 11V - 16V)             │
│                                                                │
│  Tester → ECU: 37 (Transfer Exit)                              │
│  ECU → Tester: 77 (Success)                                    │
│                                                                │
│  Flash programming proceeds safely                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session and Security Requirements

### Session Requirements

```
┌────────────────────────────────────────────────────────────────┐
│  SESSION REQUIREMENTS FOR SID 0x37                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DEFAULT Session (0x01):                                       │
│    ❌ Usually NOT supported                                   │
│                                                                │
│  EXTENDED Session (0x03):                                      │
│    ⚠️  May be supported for non-critical transfers            │
│                                                                │
│  PROGRAMMING Session (0x02):                                   │
│    ✅ REQUIRED for firmware/flash transfers                   │
│    ✅ Most common session for SID 0x37                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Security Requirements

```
┌────────────────────────────────────────────────────────────────┐
│  SECURITY REQUIREMENTS FOR SID 0x37                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Read Operations (Upload 0x35):                                │
│    Security Level: Often REQUIRED 🔒                           │
│    Protects: ECU firmware/calibration data                     │
│                                                                │
│  Write Operations (Download 0x34):                             │
│    Security Level: ALWAYS REQUIRED 🔒                          │
│    Protects: Flash memory writes                               │
│                                                                │
│  Security must remain active throughout:                       │
│    SID 0x34/0x35 → SID 0x36... → SID 0x37                      │
│                                                                │
│  If security expires during transfer:                          │
│    SID 0x37 returns NRC 0x33 (Security Access Denied)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Typical Session/Security Setup

```
  Tester                                    ECU
    │                                        │
    │  1. SID 0x10 0x02 (Programming)        │
    │───────────────────────────────────────>│
    │        50 02 (OK)                      │
    │<───────────────────────────────────────│
    │                                        │
    │  2. SID 0x27 0x01 (Request Seed)       │
    │───────────────────────────────────────>│
    │        67 01 AA BB CC DD (Seed)        │
    │<───────────────────────────────────────│
    │                                        │
    │  3. SID 0x27 0x02 + Key                │
    │───────────────────────────────────────>│
    │        67 02 (Unlocked) 🔓             │
    │<───────────────────────────────────────│
    │                                        │
    │  NOW SID 0x37 CAN BE USED              │
    │                                        │
```

---

## State Machine Behavior

### ECU Transfer State Diagram

```
                    ┌─────────────────┐
                    │   IDLE STATE    │
                    │  No Transfer    │
                    └────────┬────────┘
                             │
                    SID 0x34 / 0x35
                             │
                             ▼
                    ┌─────────────────┐
                    │ TRANSFER ACTIVE │◄────┐
                    │  Expecting      │     │
                    │  Data Blocks    │     │
                    └────────┬────────┘     │
                             │              │
                         SID 0x36        SID 0x36
                      (Transfer Data)   (More Blocks)
                             │              │
                             └──────────────┘
                             │
                    Last block received
                             │
                             ▼
                    ┌─────────────────┐
                    │ READY TO EXIT   │
                    │  Awaiting       │
                    │  SID 0x37       │
                    └────────┬────────┘
                             │
                         SID 0x37
                    (Request Transfer Exit)
                             │
                             ▼
                    ┌─────────────────┐
                    │   PROCESSING    │
                    │  Verifying      │
                    │  Checksum       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               Verification      Verification
                  Success           Failed
                    │                 │
                    ▼                 ▼
            ┌───────────────┐  ┌──────────────┐
            │  COMPLETED    │  │   ERROR      │
            │  Response:    │  │  Response:   │
            │    0x77       │  │   7F 37 72   │
            └───────┬───────┘  └──────┬───────┘
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   IDLE STATE    │
                    │ (Ready for next)│
                    └─────────────────┘
```

### Timeout Behavior

```
┌────────────────────────────────────────────────────────────────┐
│  TRANSFER EXIT TIMEOUT HANDLING                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: ECU expects SID 0x37 after last SID 0x36            │
│                                                                │
│  Timeline:                                                     │
│                                                                │
│  T=0s     Last SID 0x36 received                               │
│  │        ECU enters "READY TO EXIT" state                     │
│  │                                                             │
│  T=1s     ⏱️ Waiting for SID 0x37...                           │
│  │                                                             │
│  T=2s     ⏱️ Still waiting...                                  │
│  │                                                             │
│  T=5s     ⏱️ Timeout threshold reached!                        │
│  │        ECU aborts transfer                                  │
│  │        Returns to IDLE state                                │
│  │                                                             │
│  T=6s     Tester sends: SID 0x37                               │
│           ECU responds: 7F 37 24 (Sequence Error)              │
│                                                                │
│  ⚠️  Typical Timeout: 2-5 seconds (ECU-dependent)              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Interaction with Other Services

### Related UDS Services

```
┌────────────────────────────────────────────────────────────────┐
│  SID 0x37 DEPENDENCIES                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  MUST Use Before SID 0x37:                                     │
│    • SID 0x10 - Diagnostic Session Control                    │
│    • SID 0x27 - Security Access (usually required)            │
│    • SID 0x34 - Request Download  OR                          │
│      SID 0x35 - Request Upload                                │
│    • SID 0x36 - Transfer Data (one or more blocks)            │
│                                                                │
│  Often Used After SID 0x37:                                    │
│    • SID 0x31 - Routine Control (checksum verification)       │
│    • SID 0x11 - ECU Reset (to activate new firmware)          │
│                                                                │
│  Related Data Services:                                        │
│    • SID 0x22 - Read Data By Identifier                       │
│    • SID 0x2E - Write Data By Identifier                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Complete Transfer Workflow

```
┌────────────────────────────────────────────────────────────────┐
│  TYPICAL FIRMWARE UPDATE SEQUENCE                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Phase 1: Setup                                                │
│    1. SID 0x10 0x02 (Enter Programming Session)               │
│    2. SID 0x27 0x01/0x02 (Unlock Security)                    │
│    3. SID 0x28 (Disable Communications - optional)            │
│                                                                │
│  Phase 2: Erase (optional)                                     │
│    4. SID 0x31 (Routine: Erase Memory)                        │
│                                                                │
│  Phase 3: Download                                             │
│    5. SID 0x34 (Request Download - start transfer)            │
│    6. SID 0x36 (Transfer Data Block 1)                        │
│    7. SID 0x36 (Transfer Data Block 2)                        │
│       ... (repeat for all blocks) ...                          │
│    8. SID 0x36 (Transfer Data Block N - last)                 │
│    9. SID 0x37 (Request Transfer Exit) ◄── YOU ARE HERE       │
│                                                                │
│  Phase 4: Verification                                         │
│   10. SID 0x31 (Routine: Check Programming Dependencies)      │
│   11. SID 0x31 (Routine: Verify Checksum)                     │
│                                                                │
│  Phase 5: Finalization                                         │
│   12. SID 0x28 (Enable Communications - if disabled)          │
│   13. SID 0x11 0x01 (Hard Reset - activate firmware)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## ISO 14229-1 References

```
┌────────────────────────────────────────────────────────────────┐
│  ISO 14229-1:2020 SPECIFICATION REFERENCES                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Primary Reference:                                            │
│    • Section 11.5 - RequestTransferExit (0x37) Service        │
│                                                                │
│  Related Sections:                                             │
│    • Section 11.3 - RequestDownload (0x34)                    │
│    • Section 11.4 - RequestUpload (0x35)                      │
│    • Section 11.4 - TransferData (0x36)                       │
│    • Section 6.6  - Security Access (0x27)                    │
│    • Section 6.5  - Diagnostic Session Control (0x10)         │
│                                                                │
│  Message Format:                                               │
│    • Section 8.2.2 - Positive Response Message Format         │
│    • Section 8.2.3 - Negative Response Message Format         │
│                                                                │
│  Parameter Records:                                            │
│    • Appendix A - Parameter Definitions                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Summary

```
┌────────────────────────────────────────────────────────────────┐
│  SID 0x37 QUICK FACTS                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Service Name:  Request Transfer Exit                          │
│  SID:           0x37                                           │
│  Response SID:  0x77 (0x37 + 0x40)                             │
│                                                                │
│  Purpose:       Terminate data transfer session                │
│                                                                │
│  Request:       [0x37] [optional parameters]                   │
│  Response:      [0x77] [optional parameters]                   │
│                                                                │
│  Session:       Programming (0x02) - most common               │
│  Security:      Usually REQUIRED 🔒                            │
│                                                                │
│  Common NRCs:   0x24 (Sequence Error) - MOST COMMON            │
│                 0x22 (Conditions Not Correct)                  │
│                 0x72 (Programming Failure)                     │
│                 0x70 (Upload Download Not Accepted)            │
│                                                                │
│  Use After:     SID 0x34/0x35 + all SID 0x36 blocks            │
│  Use Before:    SID 0x31 (verification) or SID 0x11 (reset)    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

After mastering SID 0x37 theory:

1. ✅ Read **SID_37_PRACTICAL_IMPLEMENTATION.md** for implementation flowcharts
2. ✅ Study **SID_37_SERVICE_INTERACTIONS.md** for complete workflow examples
3. ✅ Review **SID_34_REQUEST_DOWNLOAD.md** for download initiation
4. ✅ Review **SID_35_REQUEST_UPLOAD.md** for upload initiation
5. ✅ Review **SID_36_TRANSFER_DATA.md** for data transfer blocks
6. ✅ Practice complete transfer sequences with all services together

---

**End of SID 0x37 Complete Guide**
