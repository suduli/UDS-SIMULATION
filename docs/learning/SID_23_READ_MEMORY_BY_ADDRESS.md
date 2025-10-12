# SID 0x23: Read Memory By Address - Theory Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.3

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Address and Length Format Identifier (ALFID)](#address-and-length-format-identifier-alfid)
4. [Request/Response Examples](#requestresponse-examples)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session State Requirements](#session-state-requirements)
7. [Security Behavior](#security-behavior)
8. [Interaction with Other SIDs](#interaction-with-other-sids)

---

## Service Overview

### Purpose

The **Read Memory By Address** service allows a diagnostic tester to read raw memory content from an ECU at a specific memory address. This is useful for:

- **Calibration data reading**: Reading calibration parameters from ECU memory
- **Diagnostic data extraction**: Extracting fault memory or diagnostic buffers
- **Software verification**: Reading program code for verification
- **Development/debugging**: Direct memory inspection during development

```
┌────────────────────────────────────────────────────────────────┐
│                    READ MEMORY BY ADDRESS                      │
│                         (SID 0x23)                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester sends:                                                 │
│    • Memory address to read from                               │
│    • Number of bytes to read                                   │
│                                                                │
│  ECU responds:                                                 │
│    • The requested memory content                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

```
┌──────────────────────────┬─────────────────────────────────────┐
│ Characteristic           │ Value                               │
├──────────────────────────┼─────────────────────────────────────┤
│ Service ID (SID)         │ 0x23                                │
│ Response SID             │ 0x63                                │
│ Subfunctions             │ None                                │
│ Session Required         │ Extended Diagnostic (0x03)          │
│ Security Required        │ Yes (for protected memory regions)  │
│ Suppress Positive Resp.  │ Not supported                       │
│ ISO 14229-1 Section      │ 11.3                                │
└──────────────────────────┴─────────────────────────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│                   REQUEST MESSAGE (0x23)                       │
├──────┬──────┬──────────────────────┬──────────────────────────┤
│ Byte │ Name │ Description          │ Example                  │
├──────┼──────┼──────────────────────┼──────────────────────────┤
│  0   │ SID  │ Service Identifier   │ 0x23                     │
│  1   │ ALFID│ Address/Length       │ 0x44                     │
│      │      │ Format Identifier    │ (4-byte addr, 4-byte len)│
│ 2-N  │ ADDR │ Memory Address       │ 0x00 0x10 0x20 0x30      │
│ N+1-M│ SIZE │ Memory Size (bytes)  │ 0x00 0x00 0x00 0x10      │
└──────┴──────┴──────────────────────┴──────────────────────────┘
```

### Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│              POSITIVE RESPONSE MESSAGE (0x63)                  │
├──────┬──────┬──────────────────────┬──────────────────────────┤
│ Byte │ Name │ Description          │ Example                  │
├──────┼──────┼──────────────────────┼──────────────────────────┤
│  0   │ SID  │ Response ID          │ 0x63 (0x23 + 0x40)       │
│ 1-N  │ DATA │ Memory Data Record   │ 0xAA 0xBB 0xCC ... 0xFF  │
└──────┴──────┴──────────────────────┴──────────────────────────┘
```

### Negative Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│              NEGATIVE RESPONSE MESSAGE (0x7F)                  │
├──────┬──────┬──────────────────────┬──────────────────────────┤
│ Byte │ Name │ Description          │ Example                  │
├──────┼──────┼──────────────────────┼──────────────────────────┤
│  0   │ NR   │ Negative Response    │ 0x7F                     │
│  1   │ SID  │ Requested SID        │ 0x23                     │
│  2   │ NRC  │ Response Code        │ 0x33 (Security Denied)   │
└──────┴──────┴──────────────────────┴──────────────────────────┘
```

---

## Address and Length Format Identifier (ALFID)

The **ALFID** byte encodes how many bytes are used for the address and memory size parameters.

### ALFID Byte Structure

```
┌────────────────────────────────────────────────────────────────┐
│                    ALFID BYTE FORMAT                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│        Bit 7-4: Memory Size Length (bytes)                     │
│        Bit 3-0: Memory Address Length (bytes)                  │
│                                                                │
│  Example: 0x44                                                 │
│    Binary: 0100 0100                                           │
│            ────┬──── ────┬────                                 │
│               │         │                                      │
│               4         4                                      │
│               │         │                                      │
│          Size: 4 bytes  │                                      │
│                    Address: 4 bytes                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Common ALFID Values

```
┌─────────┬──────────────┬────────────────┬────────────────────┐
│ ALFID   │ Address Len  │ Size Len       │ Use Case           │
├─────────┼──────────────┼────────────────┼────────────────────┤
│ 0x11    │ 1 byte       │ 1 byte         │ Small 8-bit MCUs   │
│ 0x22    │ 2 bytes      │ 2 bytes        │ 16-bit addressing  │
│ 0x33    │ 3 bytes      │ 3 bytes        │ 24-bit addressing  │
│ 0x44    │ 4 bytes      │ 4 bytes        │ 32-bit addressing  │
│ 0x88    │ 8 bytes      │ 8 bytes        │ 64-bit systems     │
│ 0x24    │ 4 bytes      │ 2 bytes        │ Mixed (common)     │
└─────────┴──────────────┴────────────────┴────────────────────┘
```

### ALFID Calculation Visual

```
Example: Read 256 bytes from address 0x00102030

┌──────────────────────────────────────────────────────────┐
│ Step 1: Determine Address Size                          │
│   Address: 0x00102030 → Requires 4 bytes (32-bit)       │
│                                                          │
│ Step 2: Determine Size Parameter                        │
│   Size: 256 (0x100) → Requires 2 bytes                  │
│                                                          │
│ Step 3: Build ALFID                                      │
│   High nibble: Size length = 2 → 0x20                   │
│   Low nibble: Address length = 4 → 0x04                 │
│   ALFID = 0x24                                           │
│                                                          │
│ Step 4: Complete Request                                │
│   [0x23][0x24][00 10 20 30][01 00]                      │
│    SID  ALFID  Address(4)   Size(2)                     │
└──────────────────────────────────────────────────────────┘
```

---

## Request/Response Examples

### Example 1: Read 16 Bytes from Address 0x00102030

```
  Tester                                ECU
    │                                    │
    │ REQUEST:                           │
    │ [23 44 00 10 20 30 00 00 00 10]    │
    │  │  │  └──────┬──────┘ └────┬───┘ │
    │  │  │      Address      Size       │
    │  │  └─ ALFID (4-byte addr/size)    │
    │  └──── SID 0x23                    │
    │────────────────────────────────────>│
    │                                    │
    │                                    │ ✓ Validate request
    │                                    │ ✓ Check security
    │                                    │ ✓ Read memory
    │                                    │
    │ RESPONSE:                          │
    │ [63 AA BB CC DD EE FF ... ]        │
    │  │  └────────┬──────────────┘      │
    │  │       16 bytes of data          │
    │  └──── Response SID 0x63           │
    │<────────────────────────────────────│
    │                                    │
```

### Example 2: Read 4 Bytes with 2-Byte Addressing

```
  Tester                                ECU
    │                                    │
    │ REQUEST:                           │
    │ [23 22 10 00 00 04]                │
    │  │  │  └─┬──┘ └─┬─┘                │
    │  │  │  Addr   Size                 │
    │  │  └─ ALFID 0x22                  │
    │  └──── SID 0x23                    │
    │────────────────────────────────────>│
    │                                    │
    │ RESPONSE:                          │
    │ [63 12 34 56 78]                   │
    │  │  └────┬────┘                    │
    │  │    4 bytes                      │
    │  └──── Response SID                │
    │<────────────────────────────────────│
    │                                    │
```

### Example 3: Security Access Denied

```
  Tester                                ECU
    │                                    │
    │ REQUEST:                           │
    │ [23 44 FF FF 00 00 00 00 01 00]    │
    │  (Trying to read protected region) │
    │────────────────────────────────────>│
    │                                    │
    │                                    │ ✗ Security check failed!
    │                                    │
    │ NEGATIVE RESPONSE:                 │
    │ [7F 23 33]                         │
    │  │  │  └─ NRC 0x33                 │
    │  │  │     (Security Access Denied) │
    │  │  └──── Requested SID            │
    │  └─────── Negative Response        │
    │<────────────────────────────────────│
    │                                    │
```

---

## Negative Response Codes (NRCs)

### NRC 0x13: Incorrect Message Length or Invalid Format

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x13 - INCORRECT MESSAGE LENGTH OR INVALID FORMAT      │
├────────────────────────────────────────────────────────────────┤
│ Response: [7F 23 13]                                           │
│                                                                │
│ WHAT IT MEANS:                                                 │
│   The request message has wrong number of bytes based on       │
│   the ALFID specification                                      │
│                                                                │
│ COMMON CAUSES:                                                 │
│   • Address bytes don't match ALFID low nibble                 │
│   • Size bytes don't match ALFID high nibble                   │
│   • Message truncated during transmission                      │
│   • Extra bytes appended to message                            │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Wrong vs Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: ALFID 0x44 but only 3 address bytes                 │
├────────────────────────────────────────────────────────────────┤
│  [23 44 00 10 20 00 00 00 10]                                  │
│   │  │  └──┬───┘ └────┬────┘                                  │
│   │  │   3 bytes!   4 bytes OK                                │
│   │  └─ Says 4-byte address                                   │
│   └──── SID                                                    │
│                                                                │
│  Result: ECU returns [7F 23 13]                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: ALFID 0x44 with proper 4-byte address/size        │
├────────────────────────────────────────────────────────────────┤
│  [23 44 00 10 20 30 00 00 00 10]                               │
│   │  │  └────┬─────┘ └────┬────┘                              │
│   │  │    4 bytes       4 bytes                               │
│   │  └─ ALFID 0x44                                            │
│   └──── SID                                                    │
│                                                                │
│  Result: ECU returns [63 ...data...]                           │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x22: Conditions Not Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x22 - CONDITIONS NOT CORRECT                          │
├────────────────────────────────────────────────────────────────┤
│ Response: [7F 23 22]                                           │
│                                                                │
│ WHAT IT MEANS:                                                 │
│   The ECU cannot fulfill the request due to current state      │
│   or conditions                                                │
│                                                                │
│ COMMON CAUSES:                                                 │
│   • ECU is in wrong diagnostic session                         │
│   • Memory region is temporarily locked                        │
│   • ECU is performing critical operation                       │
│   • Voltage out of acceptable range                            │
│   • Temperature protection active                              │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Wrong vs Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Trying to read in Default Session                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Current State: DEFAULT SESSION (0x01)                         │
│                                                                │
│  Tester ──[23 44 ...]──> ECU                                   │
│                          │                                     │
│                          └─> ✗ Wrong session!                  │
│                                                                │
│  Tester <──[7F 23 22]─── ECU                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Switch to Extended Session first                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Change session                                        │
│  Tester ──[10 03]──────> ECU                                   │
│  Tester <──[50 03]────── ECU ✓                                 │
│                                                                │
│  Current State: EXTENDED SESSION (0x03)                        │
│                                                                │
│  Step 2: Read memory                                           │
│  Tester ──[23 44 ...]──> ECU                                   │
│  Tester <──[63 data]──── ECU ✓                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x31: Request Out of Range

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x31 - REQUEST OUT OF RANGE                            │
├────────────────────────────────────────────────────────────────┤
│ Response: [7F 23 31]                                           │
│                                                                │
│ WHAT IT MEANS:                                                 │
│   The requested memory address or size is invalid              │
│                                                                │
│ COMMON CAUSES:                                                 │
│   • Address doesn't exist in ECU memory map                    │
│   • Size extends beyond valid memory region                    │
│   • Address + Size causes overflow                             │
│   • Accessing reserved/forbidden regions                       │
│   • Size parameter is 0 or exceeds maximum                     │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Memory Map

```
┌────────────────────────────────────────────────────────────────┐
│                    ECU MEMORY MAP                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  0x00000000 ┌──────────────────┐                               │
│             │   Reserved       │ ⚠️ Not accessible             │
│  0x00001000 ├──────────────────┤                               │
│             │   Flash Code     │ ✓ Readable                    │
│  0x00100000 ├──────────────────┤                               │
│             │   Calibration    │ ✓ Readable                    │
│  0x00200000 ├──────────────────┤                               │
│             │   Reserved       │ ⚠️ Not accessible             │
│  0x00300000 ├──────────────────┤                               │
│             │   RAM            │ ✓ Readable                    │
│  0x00400000 └──────────────────┘                               │
│             │  (Non-existent)  │ ❌ Invalid                     │
│             └──────────────────┘                               │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Wrong vs Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Reading past end of memory region                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: Address=0x001FFF00, Size=0x200 (512 bytes)           │
│                                                                │
│  0x001FFF00 ┌─────────────┐ ← Start reading here              │
│             │  Valid Data │                                    │
│  0x00200000 ├─────────────┤ ← Region boundary!                │
│  0x00200100 │  RESERVED   │ ← Trying to read into here ❌     │
│             └─────────────┘                                    │
│                                                                │
│  Result: [7F 23 31]                                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Stay within valid memory region                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: Address=0x001FFF00, Size=0x100 (256 bytes)           │
│                                                                │
│  0x001FFF00 ┌─────────────┐ ← Start reading here              │
│             │  Valid Data │                                    │
│  0x00200000 ├─────────────┤ ← Stop exactly at boundary ✓      │
│             │  RESERVED   │                                    │
│             └─────────────┘                                    │
│                                                                │
│  Result: [63 ...256 bytes...]                                  │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x33: Security Access Denied

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x33 - SECURITY ACCESS DENIED                          │
├────────────────────────────────────────────────────────────────┤
│ Response: [7F 23 33]                                           │
│                                                                │
│ WHAT IT MEANS:                                                 │
│   The requested memory region requires security access         │
│   which has not been unlocked                                  │
│                                                                │
│ COMMON CAUSES:                                                 │
│   • Security access (SID 0x27) not performed                   │
│   • Security access expired (timeout)                          │
│   • Wrong security level for requested memory                  │
│   • Session changed after security unlock                      │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Security States

```
┌────────────────────────────────────────────────────────────────┐
│                   SECURITY STATE DIAGRAM                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│      ┌──────────────┐                                          │
│      │   LOCKED 🔒  │  ← Initial state                         │
│      │              │                                          │
│      │  Public:  ✓  │  (Read public memory: OK)               │
│      │  Private: ✗  │  (Read private memory: NRC 0x33)        │
│      └──────┬───────┘                                          │
│             │                                                  │
│             │ SID 0x27 (Security Access)                       │
│             │ Seed + Key exchange                              │
│             │                                                  │
│             ▼                                                  │
│      ┌──────────────┐                                          │
│      │ UNLOCKED 🔓  │                                          │
│      │              │                                          │
│      │  Public:  ✓  │  (Read public memory: OK)               │
│      │  Private: ✓  │  (Read private memory: OK)              │
│      └──────┬───────┘                                          │
│             │                                                  │
│             │ Timeout / Session change                         │
│             │                                                  │
│             ▼                                                  │
│      ┌──────────────┐                                          │
│      │   LOCKED 🔒  │  ← Back to locked                        │
│      └──────────────┘                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Visual Example: Wrong vs Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Read protected memory without unlock                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  State: LOCKED 🔒                                              │
│                                                                │
│  Tester ──[23 44 FF000000 ...]──> ECU                          │
│            (Protected address)    │                            │
│                                   └─> ✗ Security check fails!  │
│                                                                │
│  Tester <──[7F 23 33]──────────── ECU                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock security first                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: Request seed                                          │
│  Tester ──[27 01]──────────────> ECU                           │
│  Tester <──[67 01 AB CD EF 12]── ECU (Seed)                    │
│                                                                │
│  Step 2: Send calculated key                                   │
│  Tester ──[27 02 XX XX XX XX]──> ECU                           │
│  Tester <──[67 02]──────────── ECU ✓                           │
│                                                                │
│  State: UNLOCKED 🔓                                            │
│                                                                │
│  Step 3: Read protected memory                                 │
│  Tester ──[23 44 FF000000 ...]──> ECU                          │
│  Tester <──[63 data...]────────── ECU ✓                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC 0x72: General Programming Failure

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x72 - GENERAL PROGRAMMING FAILURE                     │
├────────────────────────────────────────────────────────────────┤
│ Response: [7F 23 72]                                           │
│                                                                │
│ WHAT IT MEANS:                                                 │
│   The ECU encountered an internal error while reading memory   │
│                                                                │
│ COMMON CAUSES:                                                 │
│   • Hardware fault (memory controller error)                   │
│   • Corrupted memory region                                    │
│   • ECC/parity error detected                                  │
│   • Bus timeout reading memory                                 │
│   • Internal firmware error                                    │
└────────────────────────────────────────────────────────────────┘
```

---

### NRC Summary Table

```
┌──────┬──────────────────────────┬─────────────────────────────┐
│ NRC  │ Name                     │ Primary Cause               │
├──────┼──────────────────────────┼─────────────────────────────┤
│ 0x13 │ Incorrect Message Length │ ALFID mismatch              │
│ 0x22 │ Conditions Not Correct   │ Wrong session/state         │
│ 0x31 │ Request Out of Range     │ Invalid address/size        │
│ 0x33 │ Security Access Denied   │ Memory region locked 🔒     │
│ 0x72 │ General Program Failure  │ Hardware/memory error       │
└──────┴──────────────────────────┴─────────────────────────────┘
```

---

## Session State Requirements

### Session Behavior Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    SESSION REQUIREMENTS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────┐                                       │
│  │  DEFAULT SESSION    │                                       │
│  │      (0x01)         │                                       │
│  │                     │                                       │
│  │  SID 0x23: ✗        │  Most ECUs reject in default         │
│  └──────────┬──────────┘                                       │
│             │                                                  │
│             │ SID 0x10 0x03                                    │
│             │ (Switch to Extended)                             │
│             ▼                                                  │
│  ┌─────────────────────┐                                       │
│  │ EXTENDED SESSION    │                                       │
│  │      (0x03)         │                                       │
│  │                     │                                       │
│  │  SID 0x23: ✓        │  Read memory allowed                 │
│  └─────────────────────┘                                       │
│             │                                                  │
│             │ Optional for protected regions                   │
│             │                                                  │
│             ▼                                                  │
│  ┌─────────────────────┐                                       │
│  │ PROGRAMMING SESSION │                                       │
│  │      (0x02)         │                                       │
│  │                     │                                       │
│  │  SID 0x23: ✓        │  Full memory access                  │
│  └─────────────────────┘                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Typical Session Flow

```
  Tester                                     ECU
    │                                         │
    │                                         │ State: DEFAULT (0x01)
    │                                         │
    │ Try to read memory:                     │
    │ [23 44 00100000 00000100]               │
    │─────────────────────────────────────────>│
    │                                         │ ✗ Wrong session
    │ [7F 23 22]                              │
    │<─────────────────────────────────────────│
    │                                         │
    │                                         │
    │ Switch to Extended Session:             │
    │ [10 03]                                 │
    │─────────────────────────────────────────>│
    │                                         │ State: EXTENDED (0x03)
    │ [50 03 00 32 01 F4]                     │
    │<─────────────────────────────────────────│
    │                                         │
    │                                         │
    │ Retry read memory:                      │
    │ [23 44 00100000 00000100]               │
    │─────────────────────────────────────────>│
    │                                         │ ✓ Session OK
    │ [63 ...data...]                         │
    │<─────────────────────────────────────────│
    │                                         │
```

---

## Security Behavior

### Memory Region Security Levels

```
┌────────────────────────────────────────────────────────────────┐
│              MEMORY REGION SECURITY MAP                        │
├──────────────────────┬─────────────────┬──────────────────────┤
│ Memory Region        │ Security Level  │ Access Requirement   │
├──────────────────────┼─────────────────┼──────────────────────┤
│ Calibration (Public) │ Level 0 (None)  │ Extended Session     │
│ Calibration (OEM)    │ Level 1         │ Unlock + Ext Session │
│ Flash Code           │ Level 1         │ Unlock + Ext Session │
│ Security Keys        │ Level 2         │ Unlock L2 + Prog Ses │
│ Bootloader           │ Level 3         │ Unlock L3 + Prog Ses │
└──────────────────────┴─────────────────┴──────────────────────┘
```

### Security Level State Machine

```
┌────────────────────────────────────────────────────────────────┐
│                SECURITY LEVEL TRANSITIONS                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│           ┌──────────────┐                                     │
│      ┌────│   Level 0    │────┐                                │
│      │    │  (No Lock)   │    │                                │
│      │    └──────────────┘    │                                │
│      │                        │                                │
│   Public                   Protected                           │
│   Memory                   Regions                             │
│      │                        │                                │
│      │                        ▼                                │
│      │              ┌──────────────┐                           │
│      │         ┌────│   Level 1    │                           │
│      │         │    │   🔒 Locked  │                           │
│      │         │    └──────┬───────┘                           │
│      │         │           │                                   │
│      │         │       SID 0x27                                │
│      │         │     (Level 1 Unlock)                          │
│      │         │           │                                   │
│      │         │           ▼                                   │
│      │         │    ┌──────────────┐                           │
│      │         │    │   Level 1    │                           │
│      │         └───>│  🔓 Unlocked │                           │
│      │              └──────────────┘                           │
│      │                                                         │
│   Read OK              Read OK                                 │
│   No Security      After Unlock                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Interaction with Other SIDs

### Related Services

```
┌──────────────────────────────────────────────────────────────┐
│              SID 0x23 RELATED SERVICES                       │
├──────┬───────────────────────────┬──────────────────────────┤
│ SID  │ Service Name              │ Relationship             │
├──────┼───────────────────────────┼──────────────────────────┤
│ 0x10 │ Diagnostic Session Control│ Required: Set session    │
│ 0x27 │ Security Access           │ Required: Unlock memory  │
│ 0x3D │ Write Memory By Address   │ Opposite: Write memory   │
│ 0x34 │ Request Download          │ Alternative: Flash write │
│ 0x22 │ Read Data By Identifier   │ Alternative: Read data   │
│ 0x3E │ Tester Present            │ Maintain session timeout │
└──────┴───────────────────────────┴──────────────────────────┘
```

### Service Interaction Flow

```
         ┌────────────────┐
         │   SID 0x10     │  ← 1. Set Extended Session
         │ Session Control│
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │   SID 0x27     │  ← 2. Unlock Security (if needed)
         │Security Access │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │   SID 0x23     │  ← 3. Read Memory
         │ Read Memory    │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │   SID 0x3E     │  ← 4. Keep session alive
         │ Tester Present │     (during long operations)
         └────────────────┘
```

---

## ISO 14229-1:2020 Reference

### Specification Sections

```
┌────────────────────────────────────────────────────────────────┐
│                 ISO 14229-1:2020 REFERENCES                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Section 11.3: ReadMemoryByAddress Service                     │
│    • 11.3.1: Service description                               │
│    • 11.3.2: Request message definition                        │
│    • 11.3.3: Positive response message definition              │
│    • 11.3.4: Negative response codes                           │
│                                                                │
│  Section 7.5.5: AddressAndLengthFormatIdentifier               │
│    • ALFID byte format specification                           │
│    • Address/size encoding rules                               │
│                                                                │
│  Annex A: NRC definitions                                      │
│    • A.1: Common NRCs (0x13, 0x22, 0x31, 0x33)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Takeaways

```
┌────────────────────────────────────────────────────────────────┐
│                         KEY POINTS                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ SID 0x23 reads raw memory from ECU                          │
│  ✓ ALFID byte defines address/size parameter lengths           │
│  ✓ Requires Extended Diagnostic Session (0x03)                 │
│  ✓ Protected memory requires Security Access (SID 0x27)        │
│  ✓ Validate address range to avoid NRC 0x31                    │
│  ✓ Ensure ALFID matches actual parameter bytes (avoid 0x13)    │
│  ✓ Response SID is 0x63 (request SID + 0x40)                   │
│  ✓ Common with SID 0x3D (Write Memory) for memory operations   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x23 Theory Guide**
