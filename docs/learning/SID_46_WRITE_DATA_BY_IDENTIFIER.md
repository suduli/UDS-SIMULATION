# SID 0x2E - WriteDataByIdentifier Service

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format](#message-format)
3. [Data Identifier (DID) Categories](#data-identifier-did-categories)
4. [Write Operations](#write-operations)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Write Verification](#write-verification)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### Purpose

WriteDataByIdentifier (SID 0x2E) allows a diagnostic tester to **write data** to the ECU using Data Identifiers (DIDs). This service is used for configuration, calibration, programming parameters, and setting ECU values.

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE OVERVIEW                         │
├─────────────────────────────────────────────────────────────┤
│  Service Name: WriteDataByIdentifier                        │
│  Request SID:  0x2E                                         │
│  Response SID: 0x6E                                         │
│  Function:     Write data to ECU memory via DIDs            │
│  Data Type:    Configuration, calibration, parameters       │
│  Relationship: Counterpart to SID 0x22 (Read)               │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ DID-Based Writing                                         │
│    └─> Use standardized identifiers for data access          │
│                                                               │
│  ✓ Session-Dependent                                         │
│    └─> Requires EXTENDED or PROGRAMMING session              │
│                                                               │
│  ✓ Security-Protected                                        │
│    └─> Most write operations require security unlock         │
│                                                               │
│  ✓ Single DID Per Request                                    │
│    └─> Unlike SID 0x22, only one DID at a time               │
│                                                               │
│  ✓ Immediate or Deferred Write                               │
│    └─> Data may be written to RAM or non-volatile memory     │
│                                                               │
│  ✓ Verification Recommended                                  │
│    └─> Use SID 0x22 to verify write success                  │
└──────────────────────────────────────────────────────────────┘
```

### SID 0x2E vs SID 0x22 Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│              WRITE (0x2E) vs READ (0x22) COMPARISON              │
├────────────────────┬─────────────────────┬───────────────────────┤
│   Aspect           │   SID 0x22 (Read)   │   SID 0x2E (Write)    │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Operation         │  Read data from ECU │  Write data to ECU    │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Session           │  DEFAULT (most)     │  EXTENDED/PROGRAMMING │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Security          │  Rarely required    │  Usually required     │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Multiple DIDs     │  ✅ Supported       │  ❌ One DID only      │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Request SID       │  0x22               │  0x2E                 │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Response SID      │  0x62               │  0x6E                 │
├────────────────────┼─────────────────────┼───────────────────────┤
│  Risk Level        │  Low (read-only)    │  High (modifies ECU)  │
└────────────────────┴─────────────────────┴───────────────────────┘
```

---

## Message Format

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  REQUEST MESSAGE FORMAT                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     SID (0x2E)                                        │
│              └─> Service Identifier                            │
│                                                                │
│  Byte 1-2:   Data Identifier (DID)                             │
│              ├─> High Byte (Byte 1)                            │
│              └─> Low Byte (Byte 2)                             │
│              Example: 0xF1 0x90 = DID 0xF190 (VIN)             │
│                                                                │
│  Byte 3-N:   Data Record                                       │
│              └─> Data to write (length depends on DID)         │
│                                                                │
│  Note: Only ONE DID per request (unlike SID 0x22)              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Example: Write VIN (DID 0xF190)

```
Request Breakdown:
┌──────────────────────────────────────────────────────────────┐
│  Byte 0:    0x2E          (WriteDataByIdentifier)            │
│  Byte 1:    0xF1          (DID High Byte)                    │
│  Byte 2:    0x90          (DID Low Byte → 0xF190)            │
│  Byte 3:    0x57 ('W')    ┐                                  │
│  Byte 4:    0x56 ('V')    │                                  │
│  Byte 5:    0x57 ('W')    │                                  │
│  Byte 6:    0x5A ('Z')    │                                  │
│  Byte 7:    0x5A ('Z')    │                                  │
│  Byte 8:    0x5A ('Z')    │ VIN: WVWZZZ1KZBW123456          │
│  Byte 9:    0x31 ('1')    │ (17 bytes ASCII)                 │
│  Byte 10:   0x4B ('K')    │                                  │
│  Byte 11:   0x5A ('Z')    │                                  │
│  Byte 12:   0x42 ('B')    │                                  │
│  Byte 13:   0x57 ('W')    │                                  │
│  Byte 14:   0x31 ('1')    │                                  │
│  Byte 15:   0x32 ('2')    │                                  │
│  Byte 16:   0x33 ('3')    │                                  │
│  Byte 17:   0x34 ('4')    │                                  │
│  Byte 18:   0x35 ('5')    │                                  │
│  Byte 19:   0x36 ('6')    ┘                                  │
│                                                              │
│  Total Length: 20 bytes                                      │
└──────────────────────────────────────────────────────────────┘
```

### Positive Response Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│              POSITIVE RESPONSE FORMAT                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0:     Response SID (0x6E)                               │
│              └─> Positive response identifier                  │
│                                                                │
│  Byte 1-2:   Data Identifier (DID)                             │
│              └─> Echo of requested DID                         │
│                                                                │
│  Note: No data record in response (write confirmation only)    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Example:
┌──────────────────────────────────────┐
│  6E F1 90                            │
│  │  └──┴─> DID 0xF190 (VIN)          │
│  └──────> Positive response          │
└──────────────────────────────────────┘
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
│  Byte 1:     Requested SID (0x2E)                              │
│              └─> Service that failed                           │
│                                                                │
│  Byte 2:     NRC (Negative Response Code)                      │
│              └─> Reason for rejection                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Identifier (DID) Categories

### DID Range Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DID RANGE CATEGORIES                              │
├──────────────────┬───────────────────────────────────────────────────────┤
│   DID Range      │   Description                                         │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0x0000-0x00FF   │  Reserved / Not used                                  │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0x0100-0xEFFF   │  Vehicle manufacturer specific                        │
│                  │  └─> Calibration, configuration, parameters           │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF000-0xF0FF   │  Network configuration                                │
│                  │  └─> CAN settings, node addresses                     │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF100-0xF18E   │  Vehicle manufacturer specific                        │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF18F          │  Reserved                                             │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF190-0xF19F   │  ⚠️  Standardized (typically READ-ONLY)               │
│                  │  └─> VIN, Serial Number, HW/SW versions               │
│                  │  └─> Writing usually requires special security        │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF1A0-0xF1EF   │  Vehicle manufacturer specific                        │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF1F0-0xF1FF   │  System supplier specific                             │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF200-0xF2FF   │  ECU software/hardware identification                 │
│                  │  └─> Boot software, application SW                    │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF300-0xF3FF   │  Reserved for future use                              │
├──────────────────┼───────────────────────────────────────────────────────┤
│  0xF400-0xF4FF   │  ODX file identifier                                  │
│                  │  └─> Diagnostic database references                   │
└──────────────────┴───────────────────────────────────────────────────────┘
```

### Common Writable DIDs

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     COMMON WRITABLE DIDs                                 │
├─────────┬────────────────────────────────┬──────────────────────────────┤
│   DID   │   Name                         │   Typical Use                │
├─────────┼────────────────────────────────┼──────────────────────────────┤
│ 0xF190  │  VIN (Vehicle ID Number)       │  Write during manufacturing  │
│         │  ⚠️  HIGH SECURITY             │  Rarely changed afterward    │
├─────────┼────────────────────────────────┼──────────────────────────────┤
│ 0xF18C  │  ECU Serial Number             │  Write during ECU production │
│         │  ⚠️  HIGH SECURITY             │  One-time write              │
├─────────┼────────────────────────────────┼──────────────────────────────┤
│ 0x0100+ │  Calibration Parameters        │  Tuning, optimization        │
│         │  (Manufacturer specific)       │  Requires security           │
├─────────┼────────────────────────────────┼──────────────────────────────┤
│ 0xF010+ │  Network Configuration         │  CAN settings, node ID       │
│         │                                │  Requires security           │
├─────────┼────────────────────────────────┼──────────────────────────────┤
│ 0xF1A0+ │  Programming Date/Time         │  Flash programming timestamp │
│         │                                │  May require security        │
└─────────┴────────────────────────────────┴──────────────────────────────┘
```

### Write Permission Levels

```
┌──────────────────────────────────────────────────────────────────┐
│                  WRITE PERMISSION HIERARCHY                      │
└──────────────────────────────────────────────────────────────────┘

Level 1: PUBLIC WRITE (Rare)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Session: EXTENDED                                     │
│  Security: NOT required                                │
│  Example: Diagnostic test counters, temporary flags    │
│  Risk: Low                                             │
└────────────────────────────────────────────────────────┘

Level 2: STANDARD SECURITY WRITE (Common)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Session: EXTENDED                                     │
│  Security: REQUIRED (Level 1)                          │
│  Example: Calibration parameters, configuration        │
│  Risk: Medium                                          │
└────────────────────────────────────────────────────────┘

Level 3: HIGH SECURITY WRITE (Typical)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Session: EXTENDED or PROGRAMMING                      │
│  Security: REQUIRED (High Level)                       │
│  Example: VIN, serial numbers, critical parameters     │
│  Risk: High                                            │
└────────────────────────────────────────────────────────┘

Level 4: OTP (One-Time Programmable) WRITE (Rare)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Session: PROGRAMMING                                  │
│  Security: REQUIRED (Manufacturer key)                 │
│  Example: ECU serial number (once only)                │
│  Risk: Critical (irreversible)                         │
│  Note: Can only be written ONCE in ECU lifetime        │
└────────────────────────────────────────────────────────┘
```

---

## Write Operations

### Write Operation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    WRITE OPERATION FLOW                          │
└──────────────────────────────────────────────────────────────────┘

Step 1: Validation
═══════════════════════════════════════════════════════════════════
  ┌────────────────────────────┐
  │  Receive Write Request     │
  │  (0x2E [DID] [data])       │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Validate Message Length   │
  │  └─> Correct for DID?      │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Check DID Exists          │
  │  └─> Supported?            │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Check DID is Writable     │
  │  └─> Not read-only?        │
  └─────────────┬──────────────┘
                │
                ▼

Step 2: Permission Check
═══════════════════════════════════════════════════════════════════
  ┌────────────────────────────┐
  │  Check Current Session     │
  │  └─> EXTENDED or higher?   │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Check Security State      │
  │  └─> Unlocked if needed?   │
  └─────────────┬──────────────┘
                │
                ▼

Step 3: Data Validation
═══════════════════════════════════════════════════════════════════
  ┌────────────────────────────┐
  │  Validate Data Format      │
  │  └─> Correct type/range?   │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Check Data Constraints    │
  │  └─> Within limits?        │
  └─────────────┬──────────────┘
                │
                ▼

Step 4: Write Execution
═══════════════════════════════════════════════════════════════════
  ┌────────────────────────────┐
  │  Write to Target Memory    │
  │  ├─> RAM (immediate)       │
  │  └─> EEPROM/Flash (queued) │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Verify Write Success      │
  │  └─> Read back check       │
  └─────────────┬──────────────┘
                │
                ▼
  ┌────────────────────────────┐
  │  Return Positive Response  │
  │  (0x6E [DID])              │
  └────────────────────────────┘
```

### Memory Write Types

```
┌──────────────────────────────────────────────────────────────────┐
│                  MEMORY WRITE TYPES                              │
└──────────────────────────────────────────────────────────────────┘

Type 1: RAM Write (Immediate)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────┐
│  Characteristics:                                   │
│  ├─> Immediate effect                               │
│  ├─> Lost on power cycle                            │
│  ├─> Fast operation                                 │
│  └─> Used for temporary configuration               │
│                                                     │
│  Example: Active diagnostic mode flags              │
│                                                     │
│  Timeline:                                          │
│  Tester → ECU: 2E [DID] [data]                      │
│  ECU writes to RAM                                  │
│  ECU → Tester: 6E [DID]   (< 50ms typically)        │
└─────────────────────────────────────────────────────┘

Type 2: EEPROM Write (Deferred)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────┐
│  Characteristics:                                   │
│  ├─> Deferred to safe moment                        │
│  ├─> Persistent across power cycles                 │
│  ├─> Slower operation                               │
│  └─> Used for configuration, calibration            │
│                                                     │
│  Example: VIN, serial number, calibration data      │
│                                                     │
│  Timeline:                                          │
│  Tester → ECU: 2E [DID] [data]                      │
│  ECU queues write to EEPROM                         │
│  ECU → Tester: 6E [DID]   (immediate confirmation)  │
│  ECU writes to EEPROM     (background, ~100-500ms)  │
└─────────────────────────────────────────────────────┘

Type 3: Flash Write (Programming Session)
═══════════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────┐
│  Characteristics:                                   │
│  ├─> Requires PROGRAMMING session                   │
│  ├─> Block-level operations                         │
│  ├─> Slow (erase + write)                           │
│  └─> Used for firmware, large data blocks           │
│                                                     │
│  Example: Application software, boot loader         │
│                                                     │
│  Note: Typically NOT done via SID 0x2E              │
│        Use SID 0x34/0x36/0x37 instead               │
└─────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### Common NRCs for SID 0x2E

```
┌──────────────────────────────────────────────────────────────────┐
│                        NRC OVERVIEW                              │
├──────┬───────────────────────────────┬───────────────────────────┤
│ NRC  │         Meaning               │    When It Occurs         │
├──────┼───────────────────────────────┼───────────────────────────┤
│ 0x13 │ Incorrect Message Length      │ Wrong data length for DID │
│ 0x22 │ Conditions Not Correct        │ Wrong session/state       │
│ 0x31 │ Request Out Of Range          │ Invalid DID or data       │
│ 0x33 │ Security Access Denied        │ Not unlocked when needed  │
│ 0x72 │ General Programming Failure   │ Write operation failed    │
│ 0x7F │ Service Not Supported (Active)│ DID is read-only          │
└──────┴───────────────────────────────┴───────────────────────────┘
```

### NRC 0x13: Incorrect Message Length

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 13                    │
│  │  │  └─> NRC: 0x13         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The data record length doesn't match what the DID expects.

**Common Causes:**
- Too few bytes (incomplete data)
- Too many bytes (extra data)
- Incorrect DID specification (wrong expected length)

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Incorrect Data Length                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  DID 0xF190 (VIN) expects 17 bytes                        │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E F1 90 57 56 57 5A ... │  (Only 10 bytes provided)   │
│  │ │  └──┴─> DID 0xF190     │                             │
│  │ └─────> SID 0x2E         │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 13                 │  (Incorrect length)         │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Proper Data Length                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 2E F1 90 57 56 57 5A 5A 5A 31 4B 5A 42 57 31 32 33  │ │
│  │         34 35 36                                     │ │
│  │ │  └──┴─> DID 0xF190 ✓                               │ │
│  │ │        17 bytes VIN ✓                              │ │
│  │ └─────> SID 0x2E                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6E F1 90                 │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x22: Conditions Not Correct

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 22                    │
│  │  │  └─> NRC: 0x22         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The ECU cannot write data due to current operating conditions.

**Common Causes:**
- Wrong diagnostic session (must be EXTENDED or higher)
- Vehicle moving (safety requirement)
- Engine running (for certain DIDs)
- Previous write operation in progress
- ECU in fault/limp mode

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Writing in Wrong Session                         │
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
│  │ 2E 01 23 45 67           │  (Try to write calibration) │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 22                 │  (Conditions not correct)   │
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
│  Step 2: Write Data                                        │
│  ┌──────────────────────────┐                             │
│  │ 2E 01 23 45 67           │                             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6E 01 23                 │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x31: Request Out Of Range

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 31                    │
│  │  │  └─> NRC: 0x31         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The DID is not supported, or the data value is outside acceptable range.

**Common Causes:**
- DID doesn't exist in this ECU
- DID is valid but not writable
- Data value exceeds min/max limits
- Data format invalid (e.g., non-ASCII in VIN field)

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Invalid Data Value                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  DID 0x0100: Speed Limit (valid range: 0-250 km/h)        │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E 01 00 01 F4           │  (500 km/h - invalid!)      │
│  │ │  └──┴─> DID 0x0100     │                             │
│  │ │        └──┴─> 500 ❌   │                             │
│  │ └─────> SID 0x2E         │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 31                 │  (Out of range)             │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Valid Data Value                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E 01 00 00 82           │  (130 km/h - valid)         │
│  │ │  └──┴─> DID 0x0100     │                             │
│  │ │        └──┴─> 130 ✓    │                             │
│  │ └─────> SID 0x2E         │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6E 01 00                 │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x33: Security Access Denied

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 33                    │
│  │  │  └─> NRC: 0x33         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The DID requires security access, but the ECU is currently locked.

**Common Causes:**
- Writing security-protected DID without unlocking
- Security level insufficient for requested DID
- Security timeout occurred (ECU re-locked)

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Writing Protected DID While Locked               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Security State: 🔒 LOCKED                                 │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E F1 90 [VIN data...]   │  (VIN requires security!)   │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 33                 │  (Security denied)          │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock First, Then Write                       │
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
│  Step 4: Write Data                                        │
│  ┌──────────────────────────┐                             │
│  │ 2E F1 90 [VIN data...]   │                             │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6E F1 90                 │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x72: General Programming Failure

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 72                    │
│  │  │  └─> NRC: 0x72         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The write operation failed due to an internal error.

**Common Causes:**
- EEPROM write failure
- Memory corruption detected
- Voltage too low for write operation
- Write protection active
- Checksum calculation failed

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Write During Low Voltage                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ECU Voltage: 10.5V (below 11V minimum for EEPROM write)  │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E 01 23 45 67           │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Internal:                                             │
│  ├─> Validate request ✓                                   │
│  ├─> Check voltage ✗                                      │
│  └─> Voltage too low for safe EEPROM write                │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 72                 │  (Programming failure)      │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Proper Voltage for Write                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ECU Voltage: 13.2V (safe for EEPROM write)                │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E 01 23 45 67           │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Internal:                                             │
│  ├─> Validate request ✓                                   │
│  ├─> Check voltage ✓                                      │
│  ├─> Write to EEPROM ✓                                    │
│  └─> Verify write ✓                                       │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 6E 01 23                 │  (Success!)                 │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### NRC 0x7F: Service Not Supported in Active Session

**Hex Format:**
```
┌──────────────────────────────┐
│  7F 2E 7F                    │
│  │  │  └─> NRC: 0x7F         │
│  │  └────> SID: 0x2E         │
│  └───────> Negative Response │
└──────────────────────────────┘
```

**What It Means:**
The DID exists but is READ-ONLY (cannot be written).

**Common Causes:**
- Attempting to write to read-only DIDs
- DID is readable (0x22) but not writable (0x2E)
- Manufacturer restriction

**Visual Comparison:**

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Attempting to Write Read-Only DID                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  DID 0xF191: ECU Hardware Number (READ-ONLY)              │
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 2E F1 91 [new HW number] │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 7F 2E 7F                 │  (Not supported - read-only)│
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Use Read (0x22) for Read-Only DIDs             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester Request:                                           │
│  ┌──────────────────────────┐                             │
│  │ 22 F1 91                 │  (Read instead of write)    │
│  └──────────────────────────┘                             │
│                                                            │
│  ECU Response:                                             │
│  ┌──────────────────────────┐                             │
│  │ 62 F1 91 [HW number]     │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
│  Alternative: Write to Writable DID                        │
│  ┌──────────────────────────┐                             │
│  │ 2E F1 90 [VIN data...]   │  (VIN is writable)          │
│  └──────────────────────────┘                             │
│  ┌──────────────────────────┐                             │
│  │ 6E F1 90                 │  (Success)                  │
│  └──────────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Session and Security Requirements

### Session Requirements

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     SESSION REQUIREMENTS                                 │
├─────────────────────┬────────────────┬────────────────────────────────────┤
│  Session Type       │  SID 0x2E      │  Notes                             │
│                     │  Supported?    │                                    │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  DEFAULT (0x01)     │  ❌ NO         │  Must change to EXTENDED first     │
│                     │                │  Request returns NRC 0x22 or 0x7F  │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  PROGRAMMING (0x02) │  ✅ YES        │  For flash-related writes          │
│                     │                │  High security level required      │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  EXTENDED (0x03)    │  ✅ YES        │  Primary session for SID 0x2E      │
│                     │                │  Most writable DIDs available      │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  SAFETY SYSTEM      │  ⚠️  MAYBE     │  Vehicle manufacturer specific     │
│  (0x04)             │                │  May support safety-related writes │
└─────────────────────┴────────────────┴────────────────────────────────────┘
```

### Security Requirements by DID Category

```
┌──────────────────────────────────────────────────────────────────┐
│              SECURITY REQUIREMENTS BY DID CATEGORY               │
└──────────────────────────────────────────────────────────────────┘

Public DIDs (Rare - Usually No Security)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Example DIDs:                                         │
│  ├─> 0x0105: Diagnostic test counter (reset)           │
│  └─> 0x010A: Temporary flag                            │
│                                                        │
│  Requirements:                                         │
│  ├─> Session: EXTENDED                                 │
│  └─> Security: NOT required 🔓                         │
└────────────────────────────────────────────────────────┘

Protected DIDs (Common - Security Required)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Example DIDs:                                         │
│  ├─> 0x0100-0xEFFF: Calibration parameters             │
│  ├─> 0xF010-0xF0FF: Network configuration              │
│  └─> 0xF1A0+: Programming date/time                    │
│                                                        │
│  Requirements:                                         │
│  ├─> Session: EXTENDED or PROGRAMMING                  │
│  └─> Security: REQUIRED (Level 1) 🔒                   │
└────────────────────────────────────────────────────────┘

High-Security DIDs (Critical - High Security)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Example DIDs:                                         │
│  ├─> 0xF190: VIN (Vehicle Identification Number)       │
│  ├─> 0xF18C: ECU Serial Number                         │
│  └─> 0xF187: Spare part number                         │
│                                                        │
│  Requirements:                                         │
│  ├─> Session: PROGRAMMING (usually)                    │
│  └─> Security: REQUIRED (High Level/OEM key) 🔒🔒      │
└────────────────────────────────────────────────────────┘
```

---

## Write Verification

### Read-After-Write Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                 READ-AFTER-WRITE VERIFICATION                    │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Step 1: Write Data
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 23 45 67               │  (Write DID 0x0123)
    │──────────────────────────────>│
    │                               ├─> Validate
    │                               ├─> Write to memory
    │  6E 01 23                     │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Write acknowledged
    │
    │
    │  Step 2: Verify by Reading Back
    │  ─────────────────────────────────────────────
    │                               │
    │  22 01 23                     │  (Read DID 0x0123)
    │──────────────────────────────>│
    │                               ├─> Read from memory
    │  62 01 23 45 67               │
    │<──────────────────────────────│
    │                               │
    │  Expected: 45 67
    │  Received: 45 67
    │
    │  Result: ✓ Write verified successfully
    │
    │
    │  Step 3: Persistent Storage Verification (Optional)
    │  ─────────────────────────────────────────────
    │                               │
    │  Wait for EEPROM write...     │
    │  (100-500ms typically)        │
    │                               │
    │  11 01                        │  (Hard reset)
    │──────────────────────────────>│
    │  51 01                        │
    │<──────────────────────────────│
    │                               │
    │  ... (wait for ECU reboot)
    │                               │
    │  10 01                        │  (Enter DEFAULT session)
    │──────────────────────────────>│
    │  50 01 [timing...]            │
    │<──────────────────────────────│
    │                               │
    │  22 01 23                     │  (Read again after reset)
    │──────────────────────────────>│
    │  62 01 23 45 67               │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Data persisted across power cycle
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
│  Section:   11.5 - WriteDataByIdentifier (0x2E)                  │
│  Title:     Road vehicles — Unified diagnostic services (UDS)    │
│             Part 1: Application layer                            │
│                                                                  │
│  Key Normative References:                                       │
│  ├─> Section 11.5.1: Service description                         │
│  ├─> Section 11.5.2: Message format definition                   │
│  ├─> Section 11.5.3: DID usage and restrictions                  │
│  ├─> Section 11.5.4: Write operation behavior                    │
│  └─> Section 11.5.5: NRC definitions                             │
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
│  ✓ Support at least one writable DID                             │
│  ✓ Validate message length matches DID specification             │
│  ✓ Enforce session requirements (not in DEFAULT)                 │
│  ✓ Enforce security requirements for protected DIDs              │
│  ✓ Return NRC 0x13 for incorrect message length                  │
│  ✓ Return NRC 0x22 for incorrect conditions                      │
│  ✓ Return NRC 0x31 for invalid DID or data                       │
│  ✓ Return NRC 0x33 when security required but denied             │
│  ✓ Return NRC 0x72 for write failures                            │
│  ✓ Return NRC 0x7F for read-only DIDs                            │
│                                                                  │
│  Optional (Vehicle Manufacturer Specific):                       │
│  ○ Number and types of writable DIDs                             │
│  ○ DID-specific data validation rules                            │
│  ○ Write operation timing (immediate vs deferred)                │
│  ○ Persistent storage mechanism (EEPROM, Flash)                  │
│  ○ Write verification procedures                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Quick Reference Card

```
┌──────────────────────────────────────────────────────────────────┐
│              SID 0x2E QUICK REFERENCE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request Format:                                                 │
│  ┌────────────────────────────────┐                             │
│  │ 2E [DID_Hi] [DID_Lo] [data...] │                             │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Positive Response:                                              │
│  ┌────────────────────────────────┐                             │
│  │ 6E [DID_Hi] [DID_Lo]           │                             │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Negative Response:                                              │
│  ┌────────────────────────────────┐                             │
│  │ 7F 2E [NRC]                    │                             │
│  └────────────────────────────────┘                             │
│                                                                  │
│  Common NRCs:                                                    │
│  ├─> 0x13: Incorrect Message Length                             │
│  ├─> 0x22: Conditions Not Correct                               │
│  ├─> 0x31: Request Out Of Range                                 │
│  ├─> 0x33: Security Access Denied                               │
│  ├─> 0x72: General Programming Failure                          │
│  └─> 0x7F: Service Not Supported (Read-Only DID)                │
│                                                                  │
│  Session Required: EXTENDED (0x03) or PROGRAMMING (0x02)         │
│  Security Required: Depends on DID (check ECU spec)              │
│                                                                  │
│  Key Differences from SID 0x22:                                  │
│  ├─> Only ONE DID per request                                   │
│  ├─> Requires higher session (not DEFAULT)                      │
│  ├─> Usually requires security unlock                           │
│  └─> More restrictive (fewer DIDs writable than readable)       │
│                                                                  │
│  Best Practice: Always verify with SID 0x22 after write         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x2E Theory Document**

For implementation guidance, see: `SID_46_PRACTICAL_IMPLEMENTATION.md`  
For service interactions, see: `SID_46_SERVICE_INTERACTIONS.md`
