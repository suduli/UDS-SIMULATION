# SID 0x36: Transfer Data - Complete Visual Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.5

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Block Sequence Counter](#block-sequence-counter)
4. [Positive Response](#positive-response)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Service Dependencies](#service-dependencies)
8. [Transfer Workflow](#transfer-workflow)
9. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### Purpose

**SID 0x36 (Transfer Data)** is used to transfer blocks of data from the tester to the ECU during:
- Flash programming (download)
- Data upload from ECU
- File transfer operations

This service is the **core data transfer mechanism** for ECU reprogramming and must be used in conjunction with:
- **SID 0x34** (Request Download) - for downloading data TO the ECU
- **SID 0x35** (Request Upload) - for uploading data FROM the ECU
- **SID 0x37** (Request Transfer Exit) - to complete the transfer

```
┌─────────────────────────────────────────────────────────────┐
│               TRANSFER DATA SERVICE (0x36)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose: Transfer data blocks during download/upload      │
│                                                             │
│  When to Use:                                               │
│    ✓ After successful Request Download (0x34)              │
│    ✓ After successful Request Upload (0x35)                │
│    ✓ Before Request Transfer Exit (0x37)                   │
│                                                             │
│  Characteristics:                                           │
│    • Uses block sequence counter (BSC)                      │
│    • Transfers data in fixed-size blocks                    │
│    • Must maintain correct sequence order                   │
│    • Supports suspend/resume operations                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Request         │────▶│  Transfer Data   │────▶│  Request         │
│  Download/Upload │     │  (Multiple       │     │  Transfer Exit   │
│  (SID 0x34/0x35) │     │   Blocks)        │     │  (SID 0x37)      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
     INITIATE                   TRANSFER                  COMPLETE
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│                    TRANSFER DATA REQUEST                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:      SID = 0x36                                       │
│  Byte 1:      Block Sequence Counter (BSC) = 0x01 to 0xFF     │
│  Byte 2-N:    Transfer Data (payload)                          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Minimum Length: 3 bytes (SID + BSC + at least 1 data byte)   │
│  Maximum Length: Limited by maxNumberOfBlockLength from 0x34  │
└────────────────────────────────────────────────────────────────┘
```

### Visual Example - First Block Transfer

```
┌─────────────────────────────────────────────────────────────┐
│  Example: Transfer First 8 Bytes of Flash Data              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Request:                                                   │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐      │
│  │ 36 │ 01 │ AA │ BB │ CC │ DD │ EE │ FF │ 11 │ 22 │      │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘      │
│    │    │    └────────────┬─────────────────┘              │
│    │    │                 │                                │
│    │    │                 └─ Data Bytes (8 bytes)          │
│    │    └─ Block Sequence Counter (BSC = 1)                │
│    └─ Service ID (0x36)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Block Sequence Counter (BSC) Byte Breakdown

```
┌────────────────────────────────────────────────────────┐
│         BLOCK SEQUENCE COUNTER (Byte 1)                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Value Range: 0x01 to 0xFF                             │
│                                                        │
│  ┌──────────────────────────────────────────┐          │
│  │  0x01  →  First block                    │          │
│  │  0x02  →  Second block                   │          │
│  │  0x03  →  Third block                    │          │
│  │  ...                                     │          │
│  │  0xFF  →  255th block                    │          │
│  │  0x01  →  Wraps around to 1 (not 0x00)  │          │
│  └──────────────────────────────────────────┘          │
│                                                        │
│  ⚠️  IMPORTANT: BSC never uses 0x00                    │
│      Counter wraps: 0xFF → 0x01                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Block Sequence Counter

### BSC Incrementing Pattern

```
                  Transfer Sequence Flow
                  
    Block 1          Block 2          Block 3
   ┌───────┐       ┌───────┐       ┌───────┐
   │ BSC=1 │──────▶│ BSC=2 │──────▶│ BSC=3 │
   └───────┘       └───────┘       └───────┘
       │               │               │
       ▼               ▼               ▼
   [Data 1]        [Data 2]        [Data 3]
   
   
    Block 254        Block 255        Block 256
   ┌───────┐       ┌───────┐       ┌───────┐
   │BSC=FE │──────▶│BSC=FF │──────▶│ BSC=1 │  ← Wraps!
   └───────┘       └───────┘       └───────┘
       │               │               │
       ▼               ▼               ▼
   [Data 254]      [Data 255]      [Data 256]
```

### BSC Validation Logic

```
         ┌──────────────────────┐
         │  Receive Transfer    │
         │  Data Request        │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Extract BSC from    │
         │  Byte 1              │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
    ┌────┤  BSC = Expected?     │────┐
    │    └──────────────────────┘    │
   YES                               NO
    │                                 │
    ▼                                 ▼
┌─────────────────┐      ┌──────────────────────┐
│ Accept Data     │      │ Return NRC 0x24      │
│ Process Block   │      │ (Request Sequence    │
│ Increment BSC   │      │  Error)              │
└────────┬────────┘      └──────────────────────┘
         │
         ▼
┌─────────────────┐
│ Send Positive   │
│ Response 0x76   │
└─────────────────┘
```

---

## Positive Response

### Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│               TRANSFER DATA POSITIVE RESPONSE                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:      Response SID = 0x76 (0x36 + 0x40)                │
│  Byte 1:      Block Sequence Counter (BSC) - echoed            │
│  Byte 2-N:    Transfer Response Parameters (optional)          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Minimum Length: 2 bytes (Response SID + BSC)                  │
│  Optional: Some ECUs return additional status/parameters       │
└────────────────────────────────────────────────────────────────┘
```

### Request-Response Example

```
  Tester                                      ECU
    │                                          │
    │  Request: 36 01 [Data Block 1]           │
    │─────────────────────────────────────────▶│
    │                                          │
    │                   ┌──────────────────┐   │
    │                   │ Process Block 1  │   │
    │                   │ Write to Memory  │   │
    │                   │ Increment BSC    │   │
    │                   └──────────────────┘   │
    │                                          │
    │  Response: 76 01                         │
    │◀─────────────────────────────────────────│
    │         ✓ Success                        │
    │                                          │
    │  Request: 36 02 [Data Block 2]           │
    │─────────────────────────────────────────▶│
    │                                          │
    │  Response: 76 02                         │
    │◀─────────────────────────────────────────│
    │         ✓ Success                        │
    │                                          │
```

---

## Negative Response Codes (NRCs)

### Common NRCs for Transfer Data

```
┌──────────┬─────────────────────────────────────────────────────┐
│   NRC    │   Meaning                                           │
├──────────┼─────────────────────────────────────────────────────┤
│   0x13   │   Incorrect Message Length Or Invalid Format        │
│   0x24   │   Request Sequence Error                            │
│   0x31   │   Request Out Of Range                              │
│   0x71   │   Transfer Data Suspended                           │
│   0x72   │   Programming Failure                               │
│   0x92   │   Voltage Too High                                  │
│   0x93   │   Voltage Too Low                                   │
│   0x22   │   Conditions Not Correct                            │
└──────────┴─────────────────────────────────────────────────────┘
```

### NRC 0x13: Incorrect Message Length

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Message Length Doesn't Match Expected           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 01 [2 bytes]              │                       │
│    │──────────────────────────────▶│                       │
│    │                               │                       │
│    │  Expected: 1024 bytes         │                       │
│    │  Received: 2 bytes            │                       │
│    │                               │                       │
│    │  7F 36 13                     │                       │
│    │◀──────────────────────────────│                       │
│    │  ❌ NRC 0x13                   │                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Message Length Matches Expected               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 01 [1024 bytes]           │                       │
│    │──────────────────────────────▶│                       │
│    │                               │                       │
│    │  Expected: 1024 bytes         │                       │
│    │  Received: 1024 bytes ✓       │                       │
│    │                               │                       │
│    │  76 01                        │                       │
│    │◀──────────────────────────────│                       │
│    │  ✓ Success                    │                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Data block size doesn't match `maxNumberOfBlockLength` from SID 0x34
- Last block has incorrect padding
- Message truncated during transmission

**Solution:**
- Verify block size matches negotiated value from Request Download
- For last block, use actual remaining data size
- Check CAN bus message integrity

---

### NRC 0x24: Request Sequence Error

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Block Sequence Counter Out of Order             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 01 [Block 1]              │                       │
│    │──────────────────────────────▶│                       │
│    │  76 01  ✓                     │                       │
│    │◀──────────────────────────────│                       │
│    │                               │                       │
│    │  36 03 [Block 3] ← SKIP!      │                       │
│    │──────────────────────────────▶│                       │
│    │                               │                       │
│    │  Expected BSC: 0x02           │                       │
│    │  Received BSC: 0x03           │                       │
│    │                               │                       │
│    │  7F 36 24                     │                       │
│    │◀──────────────────────────────│                       │
│    │  ❌ Sequence Error             │                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Sequential Block Sequence Counter             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 01 [Block 1]              │                       │
│    │──────────────────────────────▶│                       │
│    │  76 01  ✓                     │                       │
│    │◀──────────────────────────────│                       │
│    │                               │                       │
│    │  36 02 [Block 2]  ✓           │                       │
│    │──────────────────────────────▶│                       │
│    │  76 02  ✓                     │                       │
│    │◀──────────────────────────────│                       │
│    │                               │                       │
│    │  36 03 [Block 3]  ✓           │                       │
│    │──────────────────────────────▶│                       │
│    │  76 03  ✓                     │                       │
│    │◀──────────────────────────────│                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Skipped a block sequence number
- Repeated the same BSC twice
- BSC did not wrap correctly at 0xFF → 0x01
- Transfer restarted without new Request Download

**Solution:**
- Maintain strict sequential counter (1, 2, 3, ...)
- Handle wrap-around: after 0xFF, use 0x01
- On error, restart with new SID 0x34 request

---

### NRC 0x31: Request Out Of Range

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Transferred More Data Than Requested            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Initial Setup (SID 0x34):                                 │
│    Memory Address: 0x00010000                              │
│    Memory Size:    0x00001000 (4096 bytes)                 │
│                                                            │
│  Transfer Progress:                                        │
│    Block 1: 1024 bytes  ✓                                  │
│    Block 2: 1024 bytes  ✓                                  │
│    Block 3: 1024 bytes  ✓                                  │
│    Block 4: 1024 bytes  ✓                                  │
│    ─────────────────────                                   │
│    Total:   4096 bytes (COMPLETE)                          │
│                                                            │
│    Block 5: 1024 bytes  ← EXCEEDS RANGE!                   │
│    │                                                       │
│    └──▶ 7F 36 31 (NRC: Out of Range)                       │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Transfer Exactly Requested Size               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Initial Setup (SID 0x34):                                 │
│    Memory Address: 0x00010000                              │
│    Memory Size:    0x00001000 (4096 bytes)                 │
│                                                            │
│  Transfer Progress:                                        │
│    Block 1: 1024 bytes  ✓                                  │
│    Block 2: 1024 bytes  ✓                                  │
│    Block 3: 1024 bytes  ✓                                  │
│    Block 4: 1024 bytes  ✓                                  │
│    ─────────────────────                                   │
│    Total:   4096 bytes (COMPLETE)                          │
│                                                            │
│    SID 0x37: Request Transfer Exit  ✓                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Sent more blocks than memory size allows
- Incorrect calculation of total blocks needed
- Did not call SID 0x37 to exit after completion

**Solution:**
- Calculate: `totalBlocks = memorySize / blockLength`
- Track cumulative bytes transferred
- Call SID 0x37 when all data sent

---

### NRC 0x71: Transfer Data Suspended

```
┌────────────────────────────────────────────────────────────┐
│             TRANSFER SUSPENDED SCENARIO                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 01 [Block 1]              │                       │
│    │──────────────────────────────▶│                       │
│    │  76 01  ✓                     │                       │
│    │◀──────────────────────────────│                       │
│    │                               │                       │
│    │  36 02 [Block 2]              │                       │
│    │──────────────────────────────▶│                       │
│    │                               │                       │
│    │      ⚠️  Voltage drops!        │                       │
│    │      ⚠️  Below threshold       │                       │
│    │                               │                       │
│    │  7F 36 71                     │                       │
│    │◀──────────────────────────────│                       │
│    │  Transfer Suspended           │                       │
│    │                               │                       │
│    │  [Wait for voltage to recover]│                       │
│    │                               │                       │
│    │  36 02 [Block 2]  ← RETRY     │                       │
│    │──────────────────────────────▶│                       │
│    │  76 02  ✓ Resumed             │                       │
│    │◀──────────────────────────────│                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Voltage drop detected during programming
- Temperature out of acceptable range
- ECU internal resource temporarily unavailable

**Solution:**
- Wait for condition to clear
- Retry the same block (do not increment BSC)
- Monitor voltage/temperature before retry

---

### NRC 0x72: Programming Failure

```
┌────────────────────────────────────────────────────────────┐
│             PROGRAMMING FAILURE (CRITICAL)                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester                           ECU                      │
│    │                               │                       │
│    │  36 0A [Block 10]             │                       │
│    │──────────────────────────────▶│                       │
│    │                               │                       │
│    │      ❌ Flash write failed     │                       │
│    │      ❌ Memory verification    │                       │
│    │         error                 │                       │
│    │                               │                       │
│    │  7F 36 72                     │                       │
│    │◀──────────────────────────────│                       │
│    │  Programming Failure!         │                       │
│    │                               │                       │
│    │  ⚠️  CRITICAL: ECU may be in   │                       │
│    │      invalid state            │                       │
│    │                               │                       │
│    │  Recovery Required:           │                       │
│    │  1. ECU Reset (SID 0x11)      │                       │
│    │  2. Restart programming       │                       │
│    │     from SID 0x34             │                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Flash memory write failure
- Memory verification failed after write
- Corrupted data detected
- Flash sector protection active

**Solution:**
- Stop transfer immediately
- Reset ECU (SID 0x11)
- Clear DTCs if possible
- Restart entire programming sequence from SID 0x10

---

### NRC 0x92/0x93: Voltage Too High/Low

```
┌────────────────────────────────────────────────────────────┐
│              VOLTAGE MONITORING DURING TRANSFER            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Acceptable Voltage Range: 11.0V - 15.5V (example)         │
│                                                            │
│  Scenario 1: Voltage Too Low (0x93)                        │
│  ═══════════════════════════════════                       │
│                                                            │
│    Voltage: 10.2V  ← Below 11.0V                           │
│    │                                                       │
│    │  36 05 [Block 5]                                      │
│    │─────────────────▶                                     │
│    │                                                       │
│    │  7F 36 93                                             │
│    │◀─────────────────                                     │
│    │  Voltage Too Low                                      │
│                                                            │
│                                                            │
│  Scenario 2: Voltage Too High (0x92)                       │
│  ════════════════════════════════════                      │
│                                                            │
│    Voltage: 16.1V  ← Above 15.5V                           │
│    │                                                       │
│    │  36 08 [Block 8]                                      │
│    │─────────────────▶                                     │
│    │                                                       │
│    │  7F 36 92                                             │
│    │◀─────────────────                                     │
│    │  Voltage Too High                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Vehicle battery weak or failing
- Charging system malfunction
- Incorrect power supply used during programming

**Solution:**
- Connect external power supply (battery maintainer)
- Verify voltage is stable in acceptable range
- Retry transfer after voltage stabilizes

---

## Session and Security Requirements

### Required Session State

```
┌────────────────────────────────────────────────────────────┐
│              SESSION REQUIREMENTS                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Transfer Data (0x36) REQUIRES:                            │
│                                                            │
│  ┌──────────────────────────────────────┐                 │
│  │  PROGRAMMING SESSION (0x02)          │                 │
│  │  OR                                  │                 │
│  │  EXTENDED DIAGNOSTIC SESSION (0x03)  │                 │
│  └──────────────────────────────────────┘                 │
│                                                            │
│  ❌ NOT Available in:                                      │
│     • Default Session (0x01)                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Security Access Requirement

```
┌────────────────────────────────────────────────────────────┐
│              SECURITY STATE REQUIREMENTS                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Transfer Data (0x36) REQUIRES:                            │
│                                                            │
│  ┌────────────────────┐                                    │
│  │  Security UNLOCKED │  🔓                                │
│  └────────────────────┘                                    │
│                                                            │
│  Must have successfully completed:                         │
│    • SID 0x27 (Security Access) with correct key          │
│    • Security level appropriate for memory region          │
│                                                            │
│  ❌ If security LOCKED 🔒:                                  │
│     Returns NRC 0x33 (Security Access Denied)              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Complete Prerequisites Flow

```
         Start Programming
               │
               ▼
    ┌──────────────────────┐
    │  SID 0x10 (0x02)     │  ← Enter Programming Session
    │  Programming Session │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  SID 0x27            │  ← Unlock Security
    │  Security Access     │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  SID 0x34            │  ← Request Download
    │  Request Download    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  SID 0x36 (Multiple) │  ✓ NOW AVAILABLE
    │  Transfer Data       │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  SID 0x37            │  ← Complete Transfer
    │  Transfer Exit       │
    └──────────────────────┘
```

---

## Service Dependencies

### Required Services Before Transfer Data

```
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE DEPENDENCIES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      SID 0x36                               │
│                   (Transfer Data)                           │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                   │
│         ▼               ▼               ▼                   │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│   │ SID 0x10 │   │ SID 0x27 │   │ SID 0x34 │               │
│   │ Session  │   │ Security │   │ Request  │               │
│   │ Control  │   │ Access   │   │ Download │               │
│   └──────────┘   └──────────┘   └──────────┘               │
│    REQUIRED       REQUIRED       REQUIRED                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Related Services After Transfer Data

```
┌─────────────────────────────────────────────────────────────┐
│              SERVICES USED WITH TRANSFER DATA               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Before:                                                    │
│  ┌────────────────────────────────────────┐                │
│  │  SID 0x34 - Request Download           │                │
│  │  SID 0x35 - Request Upload             │                │
│  └────────────────────────────────────────┘                │
│                                                             │
│  During:                                                    │
│  ┌────────────────────────────────────────┐                │
│  │  SID 0x36 - Transfer Data (Multiple)   │                │
│  │  SID 0x3E - Tester Present (Keep-alive)│                │
│  └────────────────────────────────────────┘                │
│                                                             │
│  After:                                                     │
│  ┌────────────────────────────────────────┐                │
│  │  SID 0x37 - Request Transfer Exit      │                │
│  │  SID 0x31 - Routine Control (Checksum) │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Transfer Workflow

### Complete Download Sequence

```
  Tester                                    ECU
    │                                        │
    │  1. SID 0x10 (Programming Session)     │
    │───────────────────────────────────────▶│
    │  50 02                                 │
    │◀───────────────────────────────────────│
    │                                        │
    │  2. SID 0x27 (Security Access)         │
    │───────────────────────────────────────▶│
    │  67 [Seed]                             │
    │◀───────────────────────────────────────│
    │  27 [Key]                              │
    │───────────────────────────────────────▶│
    │  67 (Unlocked)                         │
    │◀───────────────────────────────────────│
    │                                        │
    │  3. SID 0x34 (Request Download)        │
    │     Address: 0x00010000                │
    │     Size:    0x00001000 (4096 bytes)   │
    │───────────────────────────────────────▶│
    │  74 [maxBlockLength=1024]              │
    │◀───────────────────────────────────────│
    │                                        │
    │  4. SID 0x36 Block 1 [1024 bytes]      │
    │───────────────────────────────────────▶│
    │  76 01                                 │
    │◀───────────────────────────────────────│
    │                                        │
    │  5. SID 0x36 Block 2 [1024 bytes]      │
    │───────────────────────────────────────▶│
    │  76 02                                 │
    │◀───────────────────────────────────────│
    │                                        │
    │  6. SID 0x36 Block 3 [1024 bytes]      │
    │───────────────────────────────────────▶│
    │  76 03                                 │
    │◀───────────────────────────────────────│
    │                                        │
    │  7. SID 0x36 Block 4 [1024 bytes]      │
    │───────────────────────────────────────▶│
    │  76 04                                 │
    │◀───────────────────────────────────────│
    │                                        │
    │  8. SID 0x37 (Request Transfer Exit)   │
    │───────────────────────────────────────▶│
    │  77                                    │
    │◀───────────────────────────────────────│
    │         ✓ Download Complete            │
```

### Block Size Calculation

```
┌─────────────────────────────────────────────────────────────┐
│              CALCULATING NUMBER OF BLOCKS                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Given:                                                     │
│    Memory Size to Transfer:  8192 bytes                     │
│    Max Block Length:         1024 bytes                     │
│                                                             │
│  Calculation:                                               │
│    ┌───────────────────────────────────────────┐            │
│    │  Total Blocks = Memory Size / Block Size │            │
│    │              = 8192 / 1024                │            │
│    │              = 8 blocks                   │            │
│    └───────────────────────────────────────────┘            │
│                                                             │
│  Block Distribution:                                        │
│    Block 1 (BSC=0x01):  1024 bytes                          │
│    Block 2 (BSC=0x02):  1024 bytes                          │
│    Block 3 (BSC=0x03):  1024 bytes                          │
│    Block 4 (BSC=0x04):  1024 bytes                          │
│    Block 5 (BSC=0x05):  1024 bytes                          │
│    Block 6 (BSC=0x06):  1024 bytes                          │
│    Block 7 (BSC=0x07):  1024 bytes                          │
│    Block 8 (BSC=0x08):  1024 bytes                          │
│    ──────────────────────────────                           │
│    Total:               8192 bytes ✓                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Handling Last Block (Partial)

```
┌─────────────────────────────────────────────────────────────┐
│           HANDLING PARTIAL LAST BLOCK                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Given:                                                     │
│    Memory Size to Transfer:  5500 bytes                     │
│    Max Block Length:         1024 bytes                     │
│                                                             │
│  Calculation:                                               │
│    Full Blocks:  5500 / 1024 = 5 (remainder 380)            │
│    Last Block:   380 bytes                                  │
│                                                             │
│  Block Distribution:                                        │
│    Block 1 (BSC=0x01):  1024 bytes  ✓                       │
│    Block 2 (BSC=0x02):  1024 bytes  ✓                       │
│    Block 3 (BSC=0x03):  1024 bytes  ✓                       │
│    Block 4 (BSC=0x04):  1024 bytes  ✓                       │
│    Block 5 (BSC=0x05):  1024 bytes  ✓                       │
│    Block 6 (BSC=0x06):   380 bytes  ✓ (Last/Partial)        │
│    ──────────────────────────────                           │
│    Total:               5500 bytes ✓                        │
│                                                             │
│  ⚠️  IMPORTANT: Last block uses actual remaining size,      │
│                 NOT padded to 1024 bytes                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ISO 14229-1 Reference

### Standard Section

```
┌─────────────────────────────────────────────────────────────┐
│                   ISO 14229-1:2020                          │
│              Section 10.5: TransferData (0x36)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Key Points from Standard:                                  │
│                                                             │
│  • Block sequence counter increments from 0x01 to 0xFF      │
│  • Counter wraps around: 0xFF → 0x01 (skips 0x00)           │
│  • Block size determined by SID 0x34/0x35 response          │
│  • Transfer must complete with SID 0x37                     │
│  • Timeout monitoring required (P2/P2* extended)            │
│  • Security access required for protected memory            │
│  • Programming session required for flash operations        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timing Parameters

```
┌──────────────────┬──────────────────────────────────────────┐
│   Parameter      │   Description                            │
├──────────────────┼──────────────────────────────────────────┤
│   P2 Server      │   Time between request and response      │
│                  │   Typical: 50-150 ms                     │
├──────────────────┼──────────────────────────────────────────┤
│   P2* Extended   │   Time for long operations (flash write) │
│                  │   Typical: 5000-10000 ms                 │
├──────────────────┼──────────────────────────────────────────┤
│   S3 Server      │   Session timeout (keep-alive needed)    │
│                  │   Typical: 5000 ms                       │
└──────────────────┴──────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│              SID 0x36 KEY TAKEAWAYS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Core data transfer service for ECU reprogramming         │
│  ✓ Uses block sequence counter (BSC) from 0x01 to 0xFF      │
│  ✓ BSC wraps around (0xFF → 0x01, never 0x00)               │
│  ✓ Must follow SID 0x34 (Request Download) or 0x35          │
│  ✓ Block size fixed by maxNumberOfBlockLength from 0x34     │
│  ✓ Last block can be partial (smaller than max block size)  │
│  ✓ Requires PROGRAMMING session + security unlock           │
│  ✓ Must complete with SID 0x37 (Request Transfer Exit)      │
│  ✓ Strict sequence checking - any skip causes NRC 0x24      │
│  ✓ Voltage monitoring critical during transfer              │
│  ✓ Programming failures (NRC 0x72) require full restart     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Next Steps:**
- Read: [SID_36_PRACTICAL_IMPLEMENTATION.md](SID_36_PRACTICAL_IMPLEMENTATION.md) - Hands-on flowcharts and decision trees
- Read: [SID_36_SERVICE_INTERACTIONS.md](SID_36_SERVICE_INTERACTIONS.md) - Complete workflow examples and patterns
