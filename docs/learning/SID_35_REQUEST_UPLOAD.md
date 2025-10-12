# SID 0x35: Request Upload

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.6

---

## Table of Contents
1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Data Format Identifier](#data-format-identifier)
4. [Address and Length Format](#address-and-length-format)
5. [Negative Response Codes](#negative-response-codes)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Service Interaction](#service-interaction)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### Purpose
Request Upload (SID 0x35) initiates a data transfer sequence FROM the ECU TO the tester. This service prepares the ECU to send data that will be transmitted in subsequent Transfer Data (0x36) responses.

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST UPLOAD FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Tester sends Request Upload (0x35)                 │
│          ↓                                                   │
│  Step 2: ECU validates request and prepares memory          │
│          ↓                                                   │
│  Step 3: ECU responds with maxNumberOfBlockLength           │
│          ↓                                                   │
│  Step 4: Tester requests data via Transfer Data (0x36)      │
│          ↓                                                   │
│  Step 5: Tester finalizes with Request Transfer Exit (0x37) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Upload vs Download

```
┌──────────────────────────────────────────┐
│  REQUEST UPLOAD (0x35)                   │
│  Direction: ECU → Tester                 │
│  Purpose: Read data from ECU memory      │
│  Use case: Reading firmware, logs, cal   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  REQUEST DOWNLOAD (0x34)                 │
│  Direction: Tester → ECU                 │
│  Purpose: Write data to ECU memory       │
│  Use case: Flashing firmware, configs    │
└──────────────────────────────────────────┘
```

### Comparison Table

```
┌──────────────────┬─────────────────┬─────────────────┐
│  Aspect          │  Upload (0x35)  │  Download (0x34)│
├──────────────────┼─────────────────┼─────────────────┤
│  Direction       │  ECU → Tester   │  Tester → ECU   │
│  Data in 0x36    │  From ECU       │  From Tester    │
│  Typical use     │  Read firmware  │  Flash firmware │
│  Security req    │  Yes (UNLOCKED) │  Yes (UNLOCKED) │
│  Session req     │  PROGRAMMING    │  PROGRAMMING    │
└──────────────────┴─────────────────┴─────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│  BYTE 0: Service ID (SID)                                      │
│          Value: 0x35                                           │
├────────────────────────────────────────────────────────────────┤
│  BYTE 1: dataFormatIdentifier                                  │
│          Specifies compression and encryption                  │
├────────────────────────────────────────────────────────────────┤
│  BYTE 2: addressAndLengthFormatIdentifier                      │
│          Specifies size of address and length fields           │
├────────────────────────────────────────────────────────────────┤
│  BYTE 3 to X: memoryAddress                                    │
│               Source memory location in ECU                    │
├────────────────────────────────────────────────────────────────┤
│  BYTE X+1 to N: memorySize                                     │
│                 Number of bytes to upload                      │
└────────────────────────────────────────────────────────────────┘
```

### Positive Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│  BYTE 0: Response SID                                          │
│          Value: 0x75 (0x35 + 0x40)                             │
├────────────────────────────────────────────────────────────────┤
│  BYTE 1: lengthFormatIdentifier                                │
│          Specifies size of maxNumberOfBlockLength field        │
├────────────────────────────────────────────────────────────────┤
│  BYTE 2 to N: maxNumberOfBlockLength                           │
│               Maximum number of bytes per Transfer Data        │
└────────────────────────────────────────────────────────────────┘
```

### Example: Request Upload for 4096 Bytes at Address 0x00100000

```
REQUEST:
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 0x35 │ 0x00 │ 0x44 │ 0x00 │ 0x10 │ 0x00 │ 0x00 │ 0x00 │ 0x00 │ 0x10 │
│      │      │      │      │      │      │      │ 0x00 │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  SID    Data   Addr    ────── Memory Address ──────  ── Size ──
         Format  Len
                Format

RESPONSE:
┌──────┬──────┬──────┬──────┐
│ 0x75 │ 0x20 │ 0x02 │ 0x00 │
└──────┴──────┴──────┴──────┘
  SID    Len    Max Block
         Format  Length = 512
```

---

## Data Format Identifier

The Data Format Identifier (Byte 1) specifies compression and encryption applied to the data.

```
┌────────────────────────────────────────────────────────────────┐
│           DATA FORMAT IDENTIFIER (DFI) STRUCTURE               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Bit 7-4: compressionMethod                                   │
│            0x0 = No compression                                │
│            0x1-0xF = Compression algorithm ID                  │
│                                                                │
│   Bit 3-0: encryptingMethod                                    │
│            0x0 = No encryption                                 │
│            0x1-0xF = Encryption algorithm ID                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Common Data Format Values

```
┌──────────────┬──────────────────┬─────────────────┐
│  DFI Value   │  Compression     │  Encryption     │
├──────────────┼──────────────────┼─────────────────┤
│  0x00        │  None            │  None           │
│  0x01        │  None            │  Method 1       │
│  0x10        │  Method 1        │  None           │
│  0x11        │  Method 1        │  Method 1       │
└──────────────┴──────────────────┴─────────────────┘
```

### Upload Data Processing

```
┌─────────────────────────────────────────────────────────────────┐
│  ECU Processing Pipeline for Upload:                            │
│                                                                 │
│  Read from Memory → Compress (if DFI) → Encrypt (if DFI) →     │
│  Transfer via 0x36                                              │
│                                                                 │
│  Tester Processing Pipeline:                                   │
│                                                                 │
│  Receive via 0x36 → Decrypt (if DFI) → Decompress (if DFI) →   │
│  Save to File                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Address and Length Format

The Address and Length Format Identifier (Byte 2) specifies the size of the memory address and memory size fields.

```
┌────────────────────────────────────────────────────────────────┐
│    ADDRESS AND LENGTH FORMAT IDENTIFIER (ALFID) STRUCTURE      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Bit 7-4: memorySizeLength                                    │
│            Number of bytes used for memorySize parameter       │
│            Valid values: 0x1 to 0xF                            │
│                                                                │
│   Bit 3-0: memoryAddressLength                                 │
│            Number of bytes used for memoryAddress parameter    │
│            Valid values: 0x1 to 0xF                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Example Calculations

```
┌─────────────────────────────────────────────────────────────────┐
│  Example 1: ALFID = 0x44                                        │
├─────────────────────────────────────────────────────────────────┤
│  Binary: 0100 0100                                              │
│          ││││ ││││                                              │
│          ││││ └┴┴┴─ memoryAddressLength = 4 bytes              │
│          └┴┴┴────── memorySizeLength = 4 bytes                 │
│                                                                 │
│  Total request size: 1 + 1 + 1 + 4 + 4 = 11 bytes              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Example 2: ALFID = 0x33                                        │
├─────────────────────────────────────────────────────────────────┤
│  Binary: 0011 0011                                              │
│          ││││ ││││                                              │
│          ││││ └┴┴┴─ memoryAddressLength = 3 bytes              │
│          └┴┴┴────── memorySizeLength = 3 bytes                 │
│                                                                 │
│  Total request size: 1 + 1 + 1 + 3 + 3 = 9 bytes               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes

### NRC 0x13: Incorrect Message Length or Invalid Format

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Message Length Mismatch                             │
├────────────────────────────────────────────────────────────────┤
│  Request with ALFID 0x44 (expects 4+4=8 bytes of addr+size)    │
│  but only provides 6 bytes total                               │
│                                                                │
│  Request: [0x35] [0x00] [0x44] [0x00] [0x10] [0x00]            │
│                                                                │
│  Response: [0x7F] [0x35] [0x13]                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Proper Message Length                             │
├────────────────────────────────────────────────────────────────┤
│  Request with ALFID 0x44 provides full 8 bytes                 │
│                                                                │
│  Request: [0x35] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x75] [0x20] [0x02] [0x00] ✓                       │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Address/size byte count doesn't match ALFID specification
- Missing bytes in request
- Extra bytes appended to request

---

### NRC 0x22: Conditions Not Correct

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Upload Already in Progress                          │
├────────────────────────────────────────────────────────────────┤
│  Tester                           ECU                          │
│    │                               │                           │
│    │  Request Upload (0x35)        │                           │
│    │──────────────────────────────>│                           │
│    │                               │ Upload active             │
│    │  Positive Response (0x75)     │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │  Request Upload (0x35) Again  │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ⚠️ Already active!        │
│    │  NRC 0x22                     │                           │
│    │<──────────────────────────────│                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Complete Previous Upload First                    │
├────────────────────────────────────────────────────────────────┤
│  Tester                           ECU                          │
│    │                               │                           │
│    │  Request Upload (0x35)        │                           │
│    │──────────────────────────────>│                           │
│    │  Positive Response (0x75)     │                           │
│    │<──────────────────────────────│                           │
│    │  Transfer Data (0x36)...      │                           │
│    │<──────────────────────────────│                           │
│    │  Request Transfer Exit (0x37) │                           │
│    │──────────────────────────────>│                           │
│    │  Positive Response (0x77)     │                           │
│    │<──────────────────────────────│ Upload complete           │
│    │                               │                           │
│    │  Request Upload (0x35) New    │                           │
│    │──────────────────────────────>│ ✓ Ready for new upload    │
│    │  Positive Response (0x75)     │                           │
│    │<──────────────────────────────│                           │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Previous upload sequence not completed (missing 0x37)
- ECU internal state not ready
- Memory region locked or busy

---

### NRC 0x31: Request Out of Range

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Invalid Memory Address                              │
├────────────────────────────────────────────────────────────────┤
│  Requested address: 0xFFFF0000 (outside valid range)           │
│                                                                │
│  Request: [0x35] [0x00] [0x44] [0xFF] [0xFF] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x7F] [0x35] [0x31]                                │
│                                                                │
│  Reason: Memory address not in ECU's valid memory range        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Valid Memory Address                              │
├────────────────────────────────────────────────────────────────┤
│  Requested address: 0x00100000 (within flash region)           │
│                                                                │
│  Request: [0x35] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x75] [0x20] [0x02] [0x00] ✓                       │
│                                                                │
│  Valid flash range: 0x00100000 - 0x001FFFFF                    │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Memory address outside ECU's accessible region
- Memory size too large for available space
- Address + size exceeds boundary
- Protected or restricted memory region

---

### NRC 0x33: Security Access Denied

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Not Unlocked                                        │
├────────────────────────────────────────────────────────────────┤
│  Security State: LOCKED 🔒                                     │
│                                                                │
│  Tester sends Request Upload (0x35)                            │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x35] [0x33]                            │
│                                                                │
│  Uploads require security unlock!                              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Security Unlocked First                           │
├────────────────────────────────────────────────────────────────┤
│  Step 1: Request Seed (0x27 0x01)                              │
│           ↓                                                    │
│  Step 2: Receive Seed [0x67] [0x01] [seed]                     │
│           ↓                                                    │
│  Step 3: Send Key (0x27 0x02) [key]                            │
│           ↓                                                    │
│  Step 4: Unlock Confirmed [0x67] [0x02]                        │
│           ↓                                                    │
│  Security State: UNLOCKED 🔓                                   │
│           ↓                                                    │
│  Step 5: Request Upload (0x35)                                 │
│           ↓                                                    │
│  Response: [0x75] [lengthFormat] [maxBlockLength] ✓            │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Security Access (0x27) not performed
- Invalid key sent during security unlock
- Security session timed out

---

### NRC 0x70: Upload/Download Not Accepted

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Wrong Session Type                                  │
├────────────────────────────────────────────────────────────────┤
│  Current Session: DEFAULT (0x01)                               │
│                                                                │
│  Tester sends Request Upload (0x35)                            │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x35] [0x70]                            │
│                                                                │
│  Uploads only allowed in PROGRAMMING session!                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Switch to Programming Session                     │
├────────────────────────────────────────────────────────────────┤
│  Step 1: Diagnostic Session Control (0x10 0x02)                │
│           ↓                                                    │
│  Step 2: Confirm [0x50] [0x02] [timing...]                     │
│           ↓                                                    │
│  Current Session: PROGRAMMING (0x02) ✓                         │
│           ↓                                                    │
│  Step 3: Security Access (0x27)...                             │
│           ↓                                                    │
│  Step 4: Request Upload (0x35)                                 │
│           ↓                                                    │
│  Response: [0x75] [lengthFormat] [maxBlockLength] ✓            │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Not in PROGRAMMING session (0x02)
- ECU configuration doesn't support uploads
- Upload feature disabled

---

### NRC 0x72: General Programming Failure

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ PROBLEM: ECU Internal Error                                │
├────────────────────────────────────────────────────────────────┤
│  Request: [0x35] [0x00] [0x44] [address] [size]                │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x35] [0x72]                            │
│                                                                │
│  Possible causes:                                              │
│  • Memory read preparation failed                              │
│  • Insufficient memory for upload buffer                       │
│  • Hardware fault in memory controller                         │
│  • Data integrity check failed                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ SOLUTION: Diagnostic Steps                                 │
├────────────────────────────────────────────────────────────────┤
│  1. Check ECU voltage (must be stable 11-15V)                  │
│  2. Verify no active DTCs blocking upload                      │
│  3. Reset ECU and retry sequence                               │
│  4. Try smaller memory regions                                 │
│  5. Check for ongoing background processes                     │
│  6. Review ECU diagnostic logs if accessible                   │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Memory controller fault
- Insufficient RAM for upload buffer
- ECU voltage too low/high
- Active DTCs preventing programming

---

## Session and Security Requirements

### Required Diagnostic Session

```
┌────────────────────────────────────────────────────────────────┐
│               SESSION REQUIREMENT DIAGRAM                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DEFAULT SESSION (0x01)                                        │
│  ┌──────────────────────────┐                                 │
│  │  Request Upload (0x35)   │ ──────> ❌ NRC 0x70             │
│  └──────────────────────────┘                                 │
│                                                                │
│  EXTENDED SESSION (0x03)                                       │
│  ┌──────────────────────────┐                                 │
│  │  Request Upload (0x35)   │ ──────> ❌ NRC 0x70             │
│  └──────────────────────────┘                                 │
│                                                                │
│  PROGRAMMING SESSION (0x02)                                    │
│  ┌──────────────────────────┐                                 │
│  │  Request Upload (0x35)   │ ──────> ✅ Allowed (if unlocked)│
│  └──────────────────────────┘                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Security Access Requirement

```
┌────────────────────────────────────────────────────────────────┐
│                   SECURITY STATE FLOW                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────────┐  Request Upload     ┌──────────────────┐   │
│   │   LOCKED    │ ──────────────────> │   NRC 0x33       │   │
│   │     🔒      │                     │ Access Denied    │   │
│   └─────────────┘                     └──────────────────┘   │
│         │                                                     │
│         │ Security Access (0x27)                              │
│         │ Seed/Key Exchange                                   │
│         ▼                                                     │
│   ┌─────────────┐  Request Upload     ┌──────────────────┐   │
│   │  UNLOCKED   │ ──────────────────> │  Positive Resp   │   │
│   │     🔓      │                     │  0x75 + params   │   │
│   └─────────────┘                     └──────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Service Interaction

### Upload Sequence Services

Request Upload works in conjunction with several other UDS services:

```
┌────────────────────────────────────────────────────────────────┐
│              COMPLETE UPLOAD SERVICE CHAIN                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Diagnostic Session Control (0x10)                          │
│     └─> Switch to PROGRAMMING session                          │
│                                                                │
│  2. Security Access (0x27)                                     │
│     └─> Unlock ECU for programming operations                  │
│                                                                │
│  3. Request Upload (0x35) ◄── YOU ARE HERE                     │
│     └─> Initiate upload, receive max block size                │
│                                                                │
│  4. Transfer Data (0x36) [Multiple times]                      │
│     └─> Receive data blocks from ECU                           │
│                                                                │
│  5. Request Transfer Exit (0x37)                               │
│     └─> Finalize upload, trigger verification                  │
│                                                                │
│  6. Save/Process uploaded data (tester-side)                   │
│     └─> Verify integrity, save to file                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Dependency Pyramid

```
                  ┌──────────────┐
                  │  Data Save/  │
                  │  Processing  │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │ Request Transfer    │
              │  Exit (0x37)        │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │  Transfer Data      │
              │    (0x36)           │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │ Request Upload   ◄─── Current Service
              │    (0x35)           │
              └──────────┬──────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────┴─────┐                   ┌─────┴────┐
    │ Security │                   │ Session  │
    │  Access  │                   │ Control  │
    │  (0x27)  │                   │  (0x10)  │
    └──────────┘                   └──────────┘
```

---

## ISO 14229-1 Reference

### Standard Sections

```
┌────────────────────────────────────────────────────────────────┐
│           ISO 14229-1:2020 REFERENCE SECTIONS                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Section 11.6: RequestUpload (0x35) Service                    │
│  ├─ 11.6.1: Service Description                                │
│  ├─ 11.6.2: Message Format                                     │
│  ├─ 11.6.3: Positive Response Behavior                         │
│  └─ 11.6.4: Negative Response Codes                            │
│                                                                │
│  Section 11.7: TransferData (0x36) Service                     │
│  └─ Works with 0x35 to complete upload                         │
│                                                                │
│  Section 11.8: RequestTransferExit (0x37) Service              │
│  └─ Finalizes upload initiated by 0x35                         │
│                                                                │
│  Annex D: DataFormatIdentifier Definitions                     │
│  └─ Compression and encryption methods                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Parameter Definitions

```
┌─────────────────────────────────┬──────────────────────────────┐
│  Parameter                      │  ISO Section                 │
├─────────────────────────────────┼──────────────────────────────┤
│  dataFormatIdentifier           │  11.6.2.1                    │
│  addressAndLengthFormatId       │  11.6.2.2                    │
│  memoryAddress                  │  11.6.2.3                    │
│  memorySize                     │  11.6.2.4                    │
│  maxNumberOfBlockLength         │  11.6.3.1                    │
└─────────────────────────────────┴──────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    SID 0x35 KEY POINTS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ Initiates data transfer FROM ECU TO tester                  │
│  ✓ Requires PROGRAMMING session (0x02)                         │
│  ✓ Requires Security Access (UNLOCKED state)                   │
│  ✓ Specifies memory address and size                           │
│  ✓ ECU responds with max block size for transfers              │
│  ✓ Must be followed by Transfer Data (0x36)                    │
│  ✓ Completed by Request Transfer Exit (0x37)                   │
│  ✓ Only one upload sequence active at a time                   │
│                                                                │
│  Common Use Cases:                                             │
│    • Reading firmware from ECU                                 │
│    • Extracting calibration data                               │
│    • Backing up ECU configuration                              │
│    • Retrieving diagnostic logs                                │
│    • Firmware verification                                     │
│                                                                │
│  Common NRCs:                                                  │
│    0x13 - Message length error                                 │
│    0x22 - Conditions not correct                               │
│    0x31 - Request out of range                                 │
│    0x33 - Security access denied                               │
│    0x70 - Upload/download not accepted                         │
│    0x72 - General programming failure                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x35 Request Upload Service Documentation**
