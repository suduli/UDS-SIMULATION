# SID 0x3D (61): Write Memory By Address - Complete Learning Guide

**Document Version**: 2.0  
**Last Updated**: 2025-10-12  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.4

---

## Table of Contents

1. [Overview](#overview)
2. [What is SID 0x3D?](#what-is-sid-0x3d)
3. [When to Use SID 0x3D](#when-to-use-sid-0x3d)
4. [Message Structure](#message-structure)
5. [Address and Length Format Identifier (ALFID)](#address-and-length-format-identifier-alfid)
6. [Request Message Format](#request-message-format)
7. [Response Message Format](#response-message-format)
8. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
9. [Session and Security Requirements](#session-and-security-requirements)
10. [Memory Region Access Control](#memory-region-access-control)
11. [Write Operation Types](#write-operation-types)
12. [Write Verification](#write-verification)
13. [Common Use Cases](#common-use-cases)
14. [Troubleshooting](#troubleshooting)
15. [Quick Reference](#quick-reference)
16. [ISO 14229-1 Compliance](#iso-14229-1-compliance)

---

## Overview

### Purpose

SID 0x3D (Write Memory By Address) allows the tester to write raw binary data directly to specific memory addresses in the ECU. This service provides low-level memory access for operations like:

- Calibration data updates
- Configuration parameter writes
- Firmware patching (temporary fixes)
- Manufacturing data programming
- Memory testing and validation

**⚠️ CRITICAL**: This service provides **unrestricted memory access** when unlocked. Incorrect usage can **brick the ECU** or cause safety issues.

---

## What is SID 0x3D?

```
┌────────────────────────────────────────────────────────────┐
│                    SID 0x3D OVERVIEW                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Service ID (SID): 0x3D                                    │
│  Decimal: 61                                               │
│  Response SID: 0x7D                                        │
│                                                            │
│  Purpose: Write binary data to specific memory addresses   │
│                                                            │
│  Access Level: 🔴 HIGH SECURITY REQUIRED                  │
│                                                            │
│  Session Required: EXTENDED (0x03) or PROGRAMMING (0x02)   │
│  Security Required: ✅ YES (Level varies by region)       │
│                                                            │
│  Related Services:                                         │
│   - SID 0x23: Read Memory By Address (read operation)     │
│   - SID 0x2E: Write Data By Identifier (structured write) │
│   - SID 0x34: Request Download (flash programming)        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## When to Use SID 0x3D

### ✅ APPROPRIATE Use Cases

```
┌─────────────────────────────────────────────────┐
│  1. Calibration Data Updates                    │
│     └─ Write new calibration values to RAM/     │
│        EEPROM after calculation                  │
│                                                  │
│  2. Configuration Parameter Programming          │
│     └─ Set vehicle configuration during          │
│        manufacturing or repair                   │
│                                                  │
│  3. Manufacturing Data Writes                    │
│     └─ Program serial numbers, dates, options    │
│                                                  │
│  4. Temporary Firmware Patches                   │
│     └─ Apply hot-fixes to RAM for testing        │
│        (not permanent)                           │
│                                                  │
│  5. Memory Testing                               │
│     └─ Write test patterns to verify memory      │
│        integrity                                 │
└─────────────────────────────────────────────────┘
```

### ❌ INAPPROPRIATE Use Cases

```
┌─────────────────────────────────────────────────┐
│  ❌ Firmware Updates (Use SID 0x34/0x36/0x37)  │
│  ❌ Structured Data (Use SID 0x2E with DID)    │
│  ❌ Unsecured Production (requires security)   │
│  ❌ Safety-Critical Code Modification          │
│  ❌ Write-Protected Flash Regions              │
└─────────────────────────────────────────────────┘
```

---

## Message Structure

### Complete Exchange Flow

```
  Tester                                    ECU
    │                                        │
    │  REQUEST: Write Memory                │
    │  ┌──────────────────────────────┐     │
    │  │ 3D [ALFID] [Addr] [Data...]  │     │
    │  └──────────────────────────────┘     │
    │────────────────────────────────────>  │
    │                                        │
    │                          ┌──────────┐ │
    │                          │ Validate │ │
    │                          │ Session  │ │
    │                          └────┬─────┘ │
    │                               │       │
    │                          ┌────▼─────┐ │
    │                          │ Check    │ │
    │                          │ Security │ │
    │                          └────┬─────┘ │
    │                               │       │
    │                          ┌────▼─────┐ │
    │                          │ Validate │ │
    │                          │ Address  │ │
    │                          └────┬─────┘ │
    │                               │       │
    │                          ┌────▼─────┐ │
    │                          │  Write   │ │
    │                          │  Memory  │ │
    │                          └────┬─────┘ │
    │                               │       │
    │  RESPONSE: Success              │     │
    │  ┌──────────────────────────────┐     │
    │  │ 7D [ALFID] [Addr]            │     │
    │  └──────────────────────────────┘     │
    │  <────────────────────────────────────│
    │                                        │
```

---

## Address and Length Format Identifier (ALFID)

### ALFID Byte Structure

```
┌────────────────────────────────────────────────────────┐
│              ALFID BYTE BREAKDOWN                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Bit 7-4: memorySize (Length of Data)                │
│   Bit 3-0: addressSize (Length of Address)            │
│                                                        │
│   Format: [memorySize][addressSize]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Common ALFID Values

```
┌──────────┬─────────────┬──────────────┬───────────────┐
│ ALFID    │ Addr Bytes  │ Data Bytes   │ Common Use    │
├──────────┼─────────────┼──────────────┼───────────────┤
│ 0x14     │ 1 byte      │ 1 byte       │ Test/Demo     │
│ 0x24     │ 2 bytes     │ 2 bytes      │ Small writes  │
│ 0x44     │ 4 bytes     │ 4 bytes      │ Balanced      │
│ 0x84     │ 4 bytes     │ 8 bytes      │ Large data    │
│ 0xF4     │ 4 bytes     │ 15 bytes     │ Max data      │
│ 0x48     │ 4 bytes     │ 8 bytes      │ 64-bit systems│
└──────────┴─────────────┴──────────────┴───────────────┘
```

### ALFID Calculation Example

```
Example: Write 4 bytes to a 32-bit address

┌────────────────────────────────────────┐
│ Need to write:                         │
│  - Address: 0x20001000 (4 bytes)       │
│  - Data: 0x12345678 (4 bytes)          │
│                                        │
│ Step 1: Determine addressSize          │
│   → 4 bytes = 0x4                      │
│                                        │
│ Step 2: Determine memorySize           │
│   → 4 bytes = 0x4                      │
│                                        │
│ Step 3: Combine into ALFID             │
│   → ALFID = (4 << 4) | 4 = 0x44        │
│                                        │
│ Result: ALFID = 0x44                   │
└────────────────────────────────────────┘
```

---

## Request Message Format

### Basic Structure

```
┌────────────────────────────────────────────────────────┐
│                 WRITE MEMORY REQUEST                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Byte 0:      SID (0x3D)                               │
│  Byte 1:      ALFID                                    │
│  Byte 2-N:    Memory Address (length = addressSize)   │
│  Byte N+1-M:  Memory Size (length = memorySize)       │
│  Byte M+1-Z:  Data Records (actual data to write)     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Example 1: Write 4 Bytes to 32-bit Address

```
Request: Write 0x12345678 to address 0x20001000

┌─────────────────────────────────────────────────────┐
│ Hex: 3D 44 20 00 10 00 00 00 00 04 12 34 56 78     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  3D        - SID (Write Memory By Address)          │
│  44        - ALFID (4-byte addr, 4-byte size)       │
│  20001000  - Memory Address (4 bytes)               │
│  00000004  - Memory Size (4 bytes) = write 4 bytes  │
│  12345678  - Data to Write (4 bytes)                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Example 2: Write 8 Bytes to 32-bit Address

```
Request: Write calibration data to address 0x08001000

┌──────────────────────────────────────────────────────────┐
│ Hex: 3D 84 08 00 10 00 00 00 00 08 AA BB CC DD          │
│                                 11 22 33 44              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  3D        - SID (Write Memory By Address)               │
│  84        - ALFID (4-byte addr, 8-byte size)            │
│  08001000  - Memory Address (4 bytes)                    │
│  00000008  - Memory Size (8 bytes) = write 8 bytes       │
│  AA BB ... - Data to Write (8 bytes)                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Example 3: Small Write (1 Byte Address)

```
Request: Write 1 byte to address 0x50

┌─────────────────────────────────────┐
│ Hex: 3D 11 50 01 FF                 │
├─────────────────────────────────────┤
│                                     │
│  3D    - SID                        │
│  11    - ALFID (1-byte addr, size)  │
│  50    - Address (1 byte)           │
│  01    - Size (1 byte)              │
│  FF    - Data (1 byte)              │
│                                     │
└─────────────────────────────────────┘
```

---

## Response Message Format

### Positive Response Structure

```
┌────────────────────────────────────────────────────────┐
│              POSITIVE RESPONSE (0x7D)                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Byte 0:    Response SID (0x7D)                        │
│  Byte 1:    ALFID (echoed from request)                │
│  Byte 2-N:  Memory Address (echoed from request)       │
│                                                        │
│  Note: Data is NOT echoed back                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Example Positive Response

```
Request:  3D 44 20 00 10 00 00 00 00 04 12 34 56 78
Response: 7D 44 20 00 10 00

┌────────────────────────────────────┐
│ 7D        - Positive Response SID  │
│ 44        - ALFID (echoed)         │
│ 20001000  - Address (echoed)       │
│                                    │
│ ✓ Write successful                 │
└────────────────────────────────────┘
```

### Negative Response Structure

```
┌────────────────────────────────────────────────────────┐
│              NEGATIVE RESPONSE (0x7F)                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Byte 0:  Negative Response SID (0x7F)                 │
│  Byte 1:  Requested SID (0x3D)                         │
│  Byte 2:  NRC (Negative Response Code)                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### NRC 0x13: Incorrect Message Length Or Invalid Format

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x13: Incorrect Message Length                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   The request message has wrong length or ALFID        │
│   doesn't match actual data size                       │
│                                                        │
│  Common Causes:                                        │
│   • ALFID specifies 4 bytes but only 2 provided        │
│   • Missing data bytes                                 │
│   • Extra unexpected bytes                             │
│   • addressSize in ALFID doesn't match address length  │
│   • memorySize doesn't match data length               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Wrong vs Correct Example

```
┌────────────────────────────────────────┐
│ ❌ WRONG: ALFID Mismatch              │
├────────────────────────────────────────┤
│                                        │
│  Request: 3D 44 20 00 10 00 12 34      │
│                                        │
│  Problem:                              │
│   ALFID 0x44 = 4-byte addr, 4-byte size│
│   But only 2 data bytes provided       │
│                                        │
│  Response: 7F 3D 13                    │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ ✅ CORRECT: ALFID Matches Data             │
├────────────────────────────────────────────────┤
│                                                │
│  Request: 3D 44 20 00 10 00 00 00 00 04        │
│           12 34 56 78                          │
│                                                │
│  Correct:                                      │
│   ALFID 0x44 = 4-byte addr, 4-byte size        │
│   Address: 4 bytes ✓                           │
│   Size: 4 bytes ✓                              │
│   Data: 4 bytes ✓                              │
│                                                │
│  Response: 7D 44 20 00 10 00                   │
│                                                │
└────────────────────────────────────────────────┘
```

---

### NRC 0x22: Conditions Not Correct

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x22: Conditions Not Correct                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   ECU cannot perform the write operation due to        │
│   current conditions or state                          │
│                                                        │
│  Common Causes:                                        │
│   • Vehicle is running (engine ON)                     │
│   • Memory region is busy (another write in progress)  │
│   • Memory controller is locked                        │
│   • Write operation would corrupt data                 │
│   • Voltage too low/high for EEPROM write              │
│   • Temperature out of range                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Wrong vs Correct Example

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Writing While Engine ON     │
├────────────────────────────────────────┤
│                                        │
│  Condition: Engine running             │
│                                        │
│  Request: 3D 44 20 00 10 00 ...        │
│                                        │
│  Problem:                              │
│   ECU cannot safely write to flash     │
│   while engine is running              │
│                                        │
│  Response: 7F 3D 22                    │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Engine OFF Before Write   │
├────────────────────────────────────────┤
│                                        │
│  Step 1: Turn OFF engine               │
│  Step 2: Wait for conditions stable    │
│  Step 3: Send write request            │
│                                        │
│  Request: 3D 44 20 00 10 00 ...        │
│                                        │
│  Condition: Engine OFF, voltage stable │
│                                        │
│  Response: 7D 44 20 00 10 00 ✓         │
│                                        │
└────────────────────────────────────────┘
```

---

### NRC 0x31: Request Out Of Range

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x31: Request Out Of Range                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   The memory address or size is invalid or             │
│   outside allowed boundaries                           │
│                                                        │
│  Common Causes:                                        │
│   • Address doesn't exist in memory map                │
│   • Address points to protected region (OS, ROM)       │
│   • Size causes read beyond region boundary            │
│   • Address + Size exceeds memory capacity             │
│   • Region is write-protected (flash code area)        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Wrong vs Correct Example

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Write to ROM Region         │
├────────────────────────────────────────┤
│                                        │
│  Request: 3D 44 00 00 00 00 ...        │
│           (trying to write to ROM)     │
│                                        │
│  Problem:                              │
│   Address 0x00000000 is in ROM         │
│   ROM is READ-ONLY                     │
│                                        │
│  Response: 7F 3D 31                    │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Write to RAM/EEPROM       │
├────────────────────────────────────────┤
│                                        │
│  Request: 3D 44 20 00 10 00 ...        │
│           (writing to RAM)             │
│                                        │
│  Correct:                              │
│   Address 0x20001000 is in RAM region  │
│   RAM is writable ✓                    │
│                                        │
│  Response: 7D 44 20 00 10 00 ✓         │
│                                        │
└────────────────────────────────────────┘
```

---

### NRC 0x33: Security Access Denied

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x33: Security Access Denied                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   Security unlock is required but not performed,       │
│   or wrong security level unlocked                     │
│                                                        │
│  Common Causes:                                        │
│   • No security unlock performed (SID 0x27)            │
│   • Wrong security level unlocked                      │
│   • Security timeout occurred (went back to LOCKED)    │
│   • Trying to write protected memory without unlock    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Wrong vs Correct Example

```
┌────────────────────────────────────────┐
│ ❌ WRONG: No Security Unlock          │
├────────────────────────────────────────┤
│                                        │
│  Tester → ECU: 10 03 (Extended Session)│
│  ECU → Tester: 50 03 ✓                 │
│                                        │
│  Tester → ECU: 3D 44 08 00 10 00 ...   │
│              (write to protected flash)│
│                                        │
│  Problem: No security unlock done      │
│                                        │
│  ECU → Tester: 7F 3D 33 ❌             │
│                                        │
└────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ✅ CORRECT: Security Unlocked First        │
├─────────────────────────────────────────────┤
│                                             │
│  Tester → ECU: 10 03                        │
│  ECU → Tester: 50 03 ✓                      │
│                                             │
│  Tester → ECU: 27 01 (Request Seed)         │
│  ECU → Tester: 67 01 12 34 56 78            │
│                                             │
│  Tester → ECU: 27 02 AA BB CC DD (Send Key) │
│  ECU → Tester: 67 02 ✓                      │
│                                             │
│  Security: 🔓 UNLOCKED                      │
│                                             │
│  Tester → ECU: 3D 44 08 00 10 00 ...        │
│  ECU → Tester: 7D 44 08 00 10 00 ✓          │
│                                             │
└─────────────────────────────────────────────┘
```

---

### NRC 0x72: General Programming Failure

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x72: General Programming Failure              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   Memory write operation failed at hardware level      │
│                                                        │
│  Common Causes:                                        │
│   • EEPROM write error (bad cell)                      │
│   • Flash memory hardware failure                      │
│   • Voltage drop during write                          │
│   • Memory corruption detected                         │
│   • Write verification failed                          │
│   • Hardware fault in memory controller                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Example Scenario

```
┌────────────────────────────────────────┐
│ ❌ PROBLEM: Write Verification Failed │
├────────────────────────────────────────┤
│                                        │
│  Tester → ECU: 3D 44 08 00 10 00 ...   │
│                                        │
│  ECU Internal:                         │
│    1. Write 0x12345678 to 0x08001000   │
│    2. Read back: 0x12345600 ❌         │
│       (Last byte corrupted)            │
│    3. Verification FAILED              │
│                                        │
│  ECU → Tester: 7F 3D 72                │
│                                        │
│  Action: Check hardware, retry, or     │
│          replace memory module         │
│                                        │
└────────────────────────────────────────┘
```

---

### NRC 0x7F: Service Not Supported In Active Session

```
┌────────────────────────────────────────────────────────┐
│ ❌ NRC 0x7F: Service Not Supported In Active Session  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What it means:                                        │
│   SID 0x3D cannot be used in current diagnostic session│
│                                                        │
│  Common Cause:                                         │
│   • Currently in DEFAULT session (0x01)                │
│   • Need EXTENDED (0x03) or PROGRAMMING (0x02)         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Wrong vs Correct Example

```
┌────────────────────────────────────────┐
│ ❌ WRONG: Default Session             │
├────────────────────────────────────────┤
│                                        │
│  Current Session: DEFAULT (0x01)       │
│                                        │
│  Request: 3D 44 20 00 10 00 ...        │
│                                        │
│  Problem: SID 0x3D not allowed in      │
│           DEFAULT session              │
│                                        │
│  Response: 7F 3D 7F                    │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Extended Session First    │
├────────────────────────────────────────┤
│                                        │
│  Step 1: Switch to Extended Session    │
│  Tester → ECU: 10 03                   │
│  ECU → Tester: 50 03 ✓                 │
│                                        │
│  Step 2: Now write is allowed          │
│  Request: 3D 44 20 00 10 00 ...        │
│  Response: 7D 44 20 00 10 00 ✓         │
│                                        │
└────────────────────────────────────────┘
```

---

## Session and Security Requirements

### Session Requirements Matrix

```
┌──────────────────────┬──────────┬───────────────┐
│  Memory Region       │ Session  │ Security      │
├──────────────────────┼──────────┼───────────────┤
│  RAM (calibration)   │ EXTENDED │ Level 1 🔒    │
│  EEPROM (config)     │ EXTENDED │ Level 1 🔒    │
│  Flash (firmware)    │ PROGRAM  │ Level 3 🔒🔒🔒 │
│  OTP (serial#)       │ PROGRAM  │ Level 5 🔒🔒🔒🔒🔒│
└──────────────────────┴──────────┴───────────────┘
```

### Session State Behavior

```
┌──────────────┐
│   DEFAULT    │  ❌ SID 0x3D NOT allowed
│  Session 01  │
└──────────────┘

       │
       │ 10 03
       ▼

┌──────────────┐
│   EXTENDED   │  ✅ SID 0x3D allowed (with security)
│  Session 03  │     - RAM writes (Level 1 security)
└──────────────┘     - EEPROM writes (Level 1 security)

       │
       │ 10 02
       ▼

┌──────────────┐
│ PROGRAMMING  │  ✅ SID 0x3D allowed (with security)
│  Session 02  │     - All memory types
└──────────────┘     - Flash, OTP (higher security)
```

### Security State Transitions

```
      ┌──────────────────────────────────┐
      │        LOCKED 🔒                 │
      │   (Default state)                │
      │   SID 0x3D → NRC 0x33            │
      └─────────────┬────────────────────┘
                    │
        ┌───────────▼──────────┐
        │  27 01 (Request Seed)│
        └───────────┬──────────┘
                    │
      ┌─────────────▼────────────────────┐
      │     SEED REQUESTED 🔐            │
      │   (Waiting for key)              │
      │   SID 0x3D → NRC 0x33            │
      └─────────────┬────────────────────┘
                    │
        ┌───────────▼──────────┐
        │  27 02 (Send Key)    │
        └───────────┬──────────┘
                    │
      ┌─────────────▼────────────────────┐
      │       UNLOCKED 🔓                │
      │   (Security granted)             │
      │   SID 0x3D → 7D (Success)        │
      └──────────────────────────────────┘
                    │
                    │ Session timeout OR
                    │ 10 01 (Default Session)
                    │
      ┌─────────────▼────────────────────┐
      │        LOCKED 🔒                 │
      │   (Security reset)               │
      └──────────────────────────────────┘
```

---

## Memory Region Access Control

### Typical Memory Map

```
┌─────────────────────────────────────────────────────┐
│              ECU MEMORY MAP                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  0x00000000 - 0x0007FFFF  ❌ ROM (Read-Only)       │
│  │  - Boot loader code                             │
│  │  - Cannot write (NRC 0x31)                      │
│                                                     │
│  0x08000000 - 0x0807FFFF  🔒 Flash (Firmware)      │
│  │  - Application code                             │
│  │  - Requires PROGRAMMING session + Level 3       │
│                                                     │
│  0x20000000 - 0x2001FFFF  🔓 RAM (Calibration)     │
│  │  - Runtime data                                 │
│  │  - Requires EXTENDED session + Level 1          │
│  │  - Most common write target                     │
│                                                     │
│  0x08080000 - 0x080807FF  🔒 EEPROM (Config)       │
│  │  - Non-volatile config                          │
│  │  - Requires EXTENDED session + Level 1          │
│                                                     │
│  0xFFFF0000 - 0xFFFF00FF  🔒🔒🔒 OTP (One-Time)    │
│  │  - Serial numbers, VIN                          │
│  │  - Requires PROGRAMMING session + Level 5       │
│  │  - Can only write ONCE                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Address Validation Flow

```
         ┌──────────────┐
         │ Write Request│
         └──────┬───────┘
                │
         ┌──────▼────────┐
    ┌────┤ Address Valid?│────┐
    │    └───────────────┘    │
   NO                        YES
    │                          │
    ▼                          ▼
┌────────┐            ┌────────────────┐
│NRC 0x31│       ┌────┤ Region Type?   │────┐
└────────┘       │    └────────────────┘    │
                ROM                        RAM/EEPROM
                 │                          │
                 ▼                          ▼
          ┌────────────┐            ┌──────────────┐
          │  NRC 0x31  │            │ Check Session│
          │(Read-Only) │            └──────┬───────┘
          └────────────┘                   │
                                    ┌──────▼───────┐
                               ┌────┤ Session OK?  │────┐
                               │    └──────────────┘    │
                              NO                       YES
                               │                         │
                               ▼                         ▼
                        ┌────────────┐          ┌──────────────┐
                        │  NRC 0x7F  │          │Check Security│
                        └────────────┘          └──────┬───────┘
                                                       │
                                                ┌──────▼───────┐
                                           ┌────┤ Security OK? │────┐
                                           │    └──────────────┘    │
                                          NO                       YES
                                           │                         │
                                           ▼                         ▼
                                    ┌────────────┐          ┌──────────┐
                                    │  NRC 0x33  │          │  WRITE   │
                                    └────────────┘          │  MEMORY  │
                                                            └──────┬───┘
                                                                   │
                                                            ┌──────▼─────┐
                                                       ┌────┤Write OK?   │────┐
                                                       │    └────────────┘    │
                                                      NO                     YES
                                                       │                       │
                                                       ▼                       ▼
                                                ┌────────────┐        ┌────────────┐
                                                │  NRC 0x72  │        │   7D (OK)  │
                                                └────────────┘        └────────────┘
```

---

## Write Operation Types

### RAM Write (Fastest)

```
┌────────────────────────────────────────────────────┐
│              RAM WRITE OPERATION                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Characteristics:                                  │
│   • Fast (microseconds)                            │
│   • Volatile (lost on power-off)                   │
│   • No wear leveling needed                        │
│   • No verification needed (reliable)              │
│                                                    │
│  Common Use:                                       │
│   • Temporary calibration changes                  │
│   • Runtime parameter tuning                       │
│   • Test mode activation                           │
│                                                    │
│  Timing:                                           │
│    Write → Verify → Response: < 1 ms               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### EEPROM Write (Slow, Non-Volatile)

```
┌────────────────────────────────────────────────────┐
│            EEPROM WRITE OPERATION                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Characteristics:                                  │
│   • Slow (1-5 ms per byte)                         │
│   • Non-volatile (survives power-off)              │
│   • Limited write cycles (~100k-1M)                │
│   • Requires verification                          │
│                                                    │
│  Common Use:                                       │
│   • Configuration data                             │
│   • Vehicle options                                │
│   • Learning values                                │
│                                                    │
│  Timing:                                           │
│    Write → Verify → Response: 5-50 ms              │
│                                                    │
│  ⚠️ Warning: Don't write repeatedly (wears out)    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Flash Write (Most Restricted)

```
┌────────────────────────────────────────────────────┐
│             FLASH WRITE OPERATION                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Characteristics:                                  │
│   • Must erase before write (block erase)          │
│   • Typically use SID 0x34/0x36/0x37 instead       │
│   • Limited write cycles (~10k-100k)               │
│   • High security required                         │
│                                                    │
│  Common Use:                                       │
│   • Temporary patches (hot-fixes)                  │
│   • Development/testing                            │
│                                                    │
│  ⚠️ CAUTION: For production firmware updates,      │
│              use SID 0x34/0x36/0x37 instead        │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Write Verification

### Write-Verify-Retry Pattern

```
  Tester                                    ECU
    │                                        │
    │  STEP 1: Write Data                    │
    │────────────────────────────────────>   │
    │  3D 44 20 00 10 00 00 00 00 04         │
    │     12 34 56 78                        │
    │                                        │
    │  <────────────────────────────────────│
    │  7D 44 20 00 10 00 ✓                   │
    │                                        │
    │  STEP 2: Verify Write (Read Back)      │
    │────────────────────────────────────>   │
    │  23 44 20 00 10 00 00 00 00 04         │
    │  (Read Memory By Address)              │
    │                                        │
    │  <────────────────────────────────────│
    │  63 12 34 56 78 ✓                      │
    │                                        │
    │  STEP 3: Compare                       │
    │  Expected: 12 34 56 78                 │
    │  Actual:   12 34 56 78                 │
    │  Result:   ✅ MATCH                    │
    │                                        │
```

### Verification Failure Handling

```
┌────────────────────────────────────────────────────┐
│         WRITE VERIFICATION FLOWCHART               │
├────────────────────────────────────────────────────┤
│                                                    │
│    1. Write Data (SID 0x3D)                        │
│         │                                          │
│         ▼                                          │
│    2. Read Back (SID 0x23)                         │
│         │                                          │
│         ▼                                          │
│    3. Compare Written vs Read                      │
│         │                                          │
│    ┌────▼─────┐                                    │
│    │ Match?   │                                    │
│    └────┬─────┘                                    │
│         │                                          │
│    ┌────┴────┐                                     │
│   YES       NO                                     │
│    │         │                                     │
│    ▼         ▼                                     │
│  ✅ Done  Retry?                                   │
│            │                                       │
│       ┌────┴────┐                                  │
│      YES       NO                                  │
│       │         │                                  │
│       ▼         ▼                                  │
│    Retry     ❌ FAIL                               │
│    (max 3x)   Report Error                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: RAM Calibration Update

```
┌────────────────────────────────────────────────────┐
│  Scenario: Update engine calibration value         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Goal: Write new fuel map to RAM                   │
│                                                    │
│  Steps:                                            │
│   1. 10 03 → Extended Session                      │
│   2. 27 01/02 → Security unlock (Level 1)          │
│   3. 3D 44 20 00 10 00 ... → Write 4 bytes         │
│   4. 23 44 20 00 10 00 ... → Verify                │
│                                                    │
│  Address: 0x20001000 (RAM)                         │
│  Data: New calibration value                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Use Case 2: EEPROM Configuration Write

```
┌────────────────────────────────────────────────────┐
│  Scenario: Program vehicle options                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  Goal: Write configuration to EEPROM               │
│                                                    │
│  Steps:                                            │
│   1. 10 03 → Extended Session                      │
│   2. 27 01/02 → Security unlock                    │
│   3. 3D 84 08 08 00 00 ... → Write config          │
│   4. Wait 50ms (EEPROM write time)                 │
│   5. 23 84 08 08 00 00 ... → Verify                │
│                                                    │
│  ⚠️ Note: EEPROM writes are SLOW                   │
│           Allow time for completion                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Use Case 3: Manufacturing Data Programming

```
┌────────────────────────────────────────────────────┐
│  Scenario: Program serial number (one-time)        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Goal: Write serial number to OTP memory           │
│                                                    │
│  Steps:                                            │
│   1. 10 02 → Programming Session                   │
│   2. 27 0B/0C → High security unlock (Level 5)     │
│   3. 3D 84 FF FF 00 00 ... → Write serial#         │
│   4. 23 84 FF FF 00 00 ... → Verify                │
│   5. 11 01 → ECU Reset                             │
│                                                    │
│  ⚠️ CRITICAL: Can only write ONCE to OTP           │
│               Double-check data before writing!    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Problem: NRC 0x13 (Message Length)

```
┌────────────────────────────────────────────────────┐
│  Symptom: Getting NRC 0x13                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Check:                                            │
│   1. ALFID matches address size                    │
│      • 0x44 = 4-byte addr, 4-byte size             │
│   2. Data length matches memorySize                │
│   3. No missing or extra bytes                     │
│                                                    │
│  Debug Steps:                                      │
│   • Log request bytes                              │
│   • Count bytes manually                           │
│   • Verify ALFID calculation                       │
│   • Check for truncation in transmission           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem: NRC 0x31 (Out Of Range)

```
┌────────────────────────────────────────────────────┐
│  Symptom: Getting NRC 0x31                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Check:                                            │
│   1. Address exists in memory map                  │
│   2. Region is writable (not ROM)                  │
│   3. Address + Size doesn't exceed boundary        │
│   4. Region allows writes in current session       │
│                                                    │
│  Common Mistakes:                                  │
│   ❌ Writing to ROM (0x00000000-0x0007FFFF)        │
│   ❌ Address beyond memory size                    │
│   ❌ Trying to write flash in Extended session     │
│                                                    │
│  Solution:                                         │
│   • Use memory map reference                       │
│   • Verify address range before writing            │
│   • Use correct session for memory type            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem: NRC 0x33 (Security Denied)

```
┌────────────────────────────────────────────────────┐
│  Symptom: Getting NRC 0x33                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Check:                                            │
│   1. Security unlock performed (SID 0x27)          │
│   2. Correct security level unlocked               │
│   3. Security hasn't timed out                     │
│   4. No session change after unlock                │
│                                                    │
│  Debug Workflow:                                   │
│   1. Unlock security: 27 01/02                     │
│   2. Verify unlock: Should get 67 02               │
│   3. Immediately write: 3D ...                     │
│   4. Keep session active: 3E 00 (TesterPresent)    │
│                                                    │
│  Timing:                                           │
│   • Complete write within S3 timeout (5s)          │
│   • Send TesterPresent if taking longer            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem: NRC 0x72 (Programming Failure)

```
┌────────────────────────────────────────────────────┐
│  Symptom: Getting NRC 0x72                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Possible Causes:                                  │
│   • Hardware failure (bad memory)                  │
│   • Voltage too low during write                   │
│   • Write verification failed internally           │
│   • Memory wear-out (too many cycles)              │
│                                                    │
│  Debug Steps:                                      │
│   1. Check battery voltage (>11.5V)                │
│   2. Retry write (may be transient)                │
│   3. Try different address (test memory)           │
│   4. Read memory first to verify accessibility     │
│                                                    │
│  If Persistent:                                    │
│   • May indicate hardware failure                  │
│   • Contact ECU manufacturer                       │
│   • May need ECU replacement                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Service Summary

```
┌────────────────────────────────────────────────────┐
│  SID: 0x3D (61)                                    │
│  Name: WriteMemoryByAddress                        │
│  Response SID: 0x7D                                │
│                                                    │
│  Session: EXTENDED or PROGRAMMING                  │
│  Security: Required (level depends on region)      │
│                                                    │
│  Request:  3D [ALFID] [Addr] [Size] [Data]         │
│  Response: 7D [ALFID] [Addr]                       │
│  Error:    7F 3D [NRC]                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Common ALFID Values

```
┌──────┬────────┬──────────┬───────────────┐
│ ALFID│ Addr   │ Size     │ Use Case      │
├──────┼────────┼──────────┼───────────────┤
│ 0x44 │ 4 bytes│ 4 bytes  │ Most common   │
│ 0x84 │ 4 bytes│ 8 bytes  │ Large data    │
│ 0x24 │ 2 bytes│ 2 bytes  │ Small ECU     │
│ 0xF4 │ 4 bytes│ 15 bytes │ Maximum data  │
└──────┴────────┴──────────┴───────────────┘
```

### NRC Quick Reference

```
┌──────┬───────────────────────────────────┐
│ NRC  │ Meaning                           │
├──────┼───────────────────────────────────┤
│ 0x13 │ Wrong length/format               │
│ 0x22 │ Conditions not correct            │
│ 0x31 │ Address out of range              │
│ 0x33 │ Security access denied            │
│ 0x72 │ Programming failure               │
│ 0x7F │ Wrong session                     │
└──────┴───────────────────────────────────┘
```

### Memory Region Quick Reference

```
┌────────────┬──────────┬────────────────┐
│ Region     │ Session  │ Security Level │
├────────────┼──────────┼────────────────┤
│ RAM        │ EXTENDED │ Level 1        │
│ EEPROM     │ EXTENDED │ Level 1        │
│ Flash      │ PROGRAM  │ Level 3        │
│ OTP        │ PROGRAM  │ Level 5        │
└────────────┴──────────┴────────────────┘
```

---

## ISO 14229-1 Compliance

### Standard Reference

```
┌────────────────────────────────────────────────────┐
│  ISO 14229-1:2020                                  │
│  Section 11.4: WriteMemoryByAddress                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Key Requirements:                                 │
│   • ALFID format must match data                   │
│   • Security required for protected regions        │
│   • Response must echo ALFID and address           │
│   • NRC 0x31 for invalid addresses                 │
│   • NRC 0x72 for write failures                    │
│                                                    │
│  Related Sections:                                 │
│   • Section 11.3: ReadMemoryByAddress              │
│   • Section 11.6: RequestDownload                  │
│   • Section 9.3: SecurityAccess                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**End of SID 0x3D Main Theoretical Guide**
