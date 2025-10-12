# SID 0x34: Request Download

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

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
Request Download (SID 0x34) initiates a data transfer sequence FROM the tester TO the ECU. This service prepares the ECU to receive data that will be sent in subsequent Transfer Data (0x36) requests.

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST DOWNLOAD FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Tester sends Request Download (0x34)               │
│          ↓                                                   │
│  Step 2: ECU validates request and prepares memory          │
│          ↓                                                   │
│  Step 3: ECU responds with maxNumberOfBlockLength           │
│          ↓                                                   │
│  Step 4: Tester sends data via Transfer Data (0x36)         │
│          ↓                                                   │
│  Step 5: Tester finalizes with Request Transfer Exit (0x37) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Download vs Upload

```
┌──────────────────────────────────────────┐
│  REQUEST DOWNLOAD (0x34)                 │
│  Direction: Tester → ECU                 │
│  Purpose: Write data to ECU memory       │
│  Use case: Flashing firmware, configs    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  REQUEST UPLOAD (0x35)                   │
│  Direction: ECU → Tester                 │
│  Purpose: Read data from ECU memory      │
│  Use case: Reading firmware, logs        │
└──────────────────────────────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│  BYTE 0: Service ID (SID)                                      │
│          Value: 0x34                                           │
├────────────────────────────────────────────────────────────────┤
│  BYTE 1: dataFormatIdentifier                                  │
│          Specifies compression and encryption                  │
├────────────────────────────────────────────────────────────────┤
│  BYTE 2: addressAndLengthFormatIdentifier                      │
│          Specifies size of address and length fields           │
├────────────────────────────────────────────────────────────────┤
│  BYTE 3 to X: memoryAddress                                    │
│               Target memory location in ECU                    │
├────────────────────────────────────────────────────────────────┤
│  BYTE X+1 to N: memorySize                                     │
│                 Number of bytes to download                    │
└────────────────────────────────────────────────────────────────┘
```

### Positive Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│  BYTE 0: Response SID                                          │
│          Value: 0x74 (0x34 + 0x40)                             │
├────────────────────────────────────────────────────────────────┤
│  BYTE 1: lengthFormatIdentifier                                │
│          Specifies size of maxNumberOfBlockLength field        │
├────────────────────────────────────────────────────────────────┤
│  BYTE 2 to N: maxNumberOfBlockLength                           │
│               Maximum number of bytes per Transfer Data        │
└────────────────────────────────────────────────────────────────┘
```

### Example: Request Download for 4096 Bytes at Address 0x00100000

```
REQUEST:
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 0x34 │ 0x00 │ 0x44 │ 0x00 │ 0x10 │ 0x00 │ 0x00 │ 0x00 │ 0x00 │ 0x10 │
│      │      │      │      │      │      │      │ 0x00 │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  SID    Data   Addr    ────── Memory Address ──────  ── Size ──
         Format  Len
                Format

RESPONSE:
┌──────┬──────┬──────┬──────┐
│ 0x74 │ 0x20 │ 0x02 │ 0x00 │
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
│  Request: [0x34] [0x00] [0x44] [0x00] [0x10] [0x00]            │
│                                                                │
│  Response: [0x7F] [0x34] [0x13]                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Proper Message Length                             │
├────────────────────────────────────────────────────────────────┤
│  Request with ALFID 0x44 provides full 8 bytes                 │
│                                                                │
│  Request: [0x34] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x74] [0x20] [0x02] [0x00] ✓                       │
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
│  ❌ WRONG: Download Already in Progress                        │
├────────────────────────────────────────────────────────────────┤
│  Tester                           ECU                          │
│    │                               │                           │
│    │  Request Download (0x34)      │                           │
│    │──────────────────────────────>│                           │
│    │                               │ Download active           │
│    │  Positive Response (0x74)     │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │  Request Download (0x34) Again│                           │
│    │──────────────────────────────>│                           │
│    │                               │ ⚠️ Already active!        │
│    │  NRC 0x22                     │                           │
│    │<──────────────────────────────│                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Complete Previous Download First                  │
├────────────────────────────────────────────────────────────────┤
│  Tester                           ECU                          │
│    │                               │                           │
│    │  Request Download (0x34)      │                           │
│    │──────────────────────────────>│                           │
│    │  Positive Response (0x74)     │                           │
│    │<──────────────────────────────│                           │
│    │  Transfer Data (0x36)...      │                           │
│    │──────────────────────────────>│                           │
│    │  Request Transfer Exit (0x37) │                           │
│    │──────────────────────────────>│                           │
│    │  Positive Response (0x77)     │                           │
│    │<──────────────────────────────│ Download complete         │
│    │                               │                           │
│    │  Request Download (0x34) New  │                           │
│    │──────────────────────────────>│ ✓ Ready for new download  │
│    │  Positive Response (0x74)     │                           │
│    │<──────────────────────────────│                           │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Previous download sequence not completed (missing 0x37)
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
│  Request: [0x34] [0x00] [0x44] [0xFF] [0xFF] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x7F] [0x34] [0x31]                                │
│                                                                │
│  Reason: Memory address not in ECU's valid flash range         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ CORRECT: Valid Memory Address                              │
├────────────────────────────────────────────────────────────────┤
│  Requested address: 0x00100000 (within flash region)           │
│                                                                │
│  Request: [0x34] [0x00] [0x44] [0x00] [0x10] [0x00] [0x00]    │
│           [0x00] [0x00] [0x10] [0x00]                          │
│                                                                │
│  Response: [0x74] [0x20] [0x02] [0x00] ✓                       │
│                                                                │
│  Valid flash range: 0x00100000 - 0x001FFFFF                    │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Memory address outside ECU's flash region
- Memory size too large for available space
- Address + size exceeds boundary
- Protected memory region

---

### NRC 0x33: Security Access Denied

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ WRONG: Not Unlocked                                        │
├────────────────────────────────────────────────────────────────┤
│  Security State: LOCKED 🔒                                     │
│                                                                │
│  Tester sends Request Download (0x34)                          │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x34] [0x33]                            │
│                                                                │
│  Downloads require security unlock!                            │
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
│  Step 5: Request Download (0x34)                               │
│           ↓                                                    │
│  Response: [0x74] [lengthFormat] [maxBlockLength] ✓            │
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
│  Tester sends Request Download (0x34)                          │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x34] [0x70]                            │
│                                                                │
│  Downloads only allowed in PROGRAMMING session!                │
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
│  Step 4: Request Download (0x34)                               │
│           ↓                                                    │
│  Response: [0x74] [lengthFormat] [maxBlockLength] ✓            │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Not in PROGRAMMING session (0x02)
- ECU configuration doesn't support downloads
- Download feature disabled

---

### NRC 0x72: General Programming Failure

```
┌────────────────────────────────────────────────────────────────┐
│  ❌ PROBLEM: ECU Internal Error                                │
├────────────────────────────────────────────────────────────────┤
│  Request: [0x34] [0x00] [0x44] [address] [size]                │
│           ↓                                                    │
│  ECU Response: [0x7F] [0x34] [0x72]                            │
│                                                                │
│  Possible causes:                                              │
│  • Flash memory preparation failed                             │
│  • Insufficient memory for download buffer                     │
│  • Hardware fault in flash controller                          │
│  • Checksum validation failed                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ✅ SOLUTION: Diagnostic Steps                                 │
├────────────────────────────────────────────────────────────────┤
│  1. Check ECU voltage (must be stable 11-15V)                  │
│  2. Verify no active DTCs blocking programming                 │
│  3. Reset ECU and retry sequence                               │
│  4. Try smaller memory regions                                 │
│  5. Check for ongoing background processes                     │
│  6. Review ECU diagnostic logs if accessible                   │
└────────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Flash memory controller fault
- Insufficient RAM for download buffer
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
│  │  Request Download (0x34) │ ──────> ❌ NRC 0x70             │
│  └──────────────────────────┘                                 │
│                                                                │
│  EXTENDED SESSION (0x03)                                       │
│  ┌──────────────────────────┐                                 │
│  │  Request Download (0x34) │ ──────> ❌ NRC 0x70             │
│  └──────────────────────────┘                                 │
│                                                                │
│  PROGRAMMING SESSION (0x02)                                    │
│  ┌──────────────────────────┐                                 │
│  │  Request Download (0x34) │ ──────> ✅ Allowed (if unlocked)│
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
│   ┌─────────────┐  Request Download   ┌──────────────────┐   │
│   │   LOCKED    │ ──────────────────> │   NRC 0x33       │   │
│   │     🔒      │                     │ Access Denied    │   │
│   └─────────────┘                     └──────────────────┘   │
│         │                                                     │
│         │ Security Access (0x27)                              │
│         │ Seed/Key Exchange                                   │
│         ▼                                                     │
│   ┌─────────────┐  Request Download   ┌──────────────────┐   │
│   │  UNLOCKED   │ ──────────────────> │  Positive Resp   │   │
│   │     🔓      │                     │  0x74 + params   │   │
│   └─────────────┘                     └──────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Service Interaction

### Download Sequence Services

Request Download works in conjunction with several other UDS services:

```
┌────────────────────────────────────────────────────────────────┐
│              COMPLETE DOWNLOAD SERVICE CHAIN                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Diagnostic Session Control (0x10)                          │
│     └─> Switch to PROGRAMMING session                          │
│                                                                │
│  2. Security Access (0x27)                                     │
│     └─> Unlock ECU for programming operations                  │
│                                                                │
│  3. Request Download (0x34) ◄── YOU ARE HERE                   │
│     └─> Initiate download, receive max block size              │
│                                                                │
│  4. Transfer Data (0x36) [Multiple times]                      │
│     └─> Send data blocks to ECU                                │
│                                                                │
│  5. Request Transfer Exit (0x37)                               │
│     └─> Finalize download, trigger verification                │
│                                                                │
│  6. ECU Reset (0x11) [Optional]                                │
│     └─> Reset ECU to apply new firmware                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Dependency Pyramid

```
                  ┌──────────────┐
                  │  ECU Reset   │
                  │    (0x11)    │
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
              │ Request Download ◄─── Current Service
              │    (0x34)           │
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
│  Section 11.5: RequestDownload (0x34) Service                  │
│  ├─ 11.5.1: Service Description                                │
│  ├─ 11.5.2: Message Format                                     │
│  ├─ 11.5.3: Positive Response Behavior                         │
│  └─ 11.5.4: Negative Response Codes                            │
│                                                                │
│  Section 11.6: TransferData (0x36) Service                     │
│  └─ Works with 0x34 to complete download                       │
│                                                                │
│  Section 11.7: RequestTransferExit (0x37) Service              │
│  └─ Finalizes download initiated by 0x34                       │
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
│  dataFormatIdentifier           │  11.5.2.1                    │
│  addressAndLengthFormatId       │  11.5.2.2                    │
│  memoryAddress                  │  11.5.2.3                    │
│  memorySize                     │  11.5.2.4                    │
│  maxNumberOfBlockLength         │  11.5.3.1                    │
└─────────────────────────────────┴──────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    SID 0x34 KEY POINTS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ Initiates data transfer FROM tester TO ECU                  │
│  ✓ Requires PROGRAMMING session (0x02)                         │
│  ✓ Requires Security Access (UNLOCKED state)                   │
│  ✓ Specifies memory address and size                           │
│  ✓ ECU responds with max block size for transfers              │
│  ✓ Must be followed by Transfer Data (0x36)                    │
│  ✓ Completed by Request Transfer Exit (0x37)                   │
│  ✓ Only one download sequence active at a time                 │
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

**End of SID 0x34 Request Download Service Documentation**
