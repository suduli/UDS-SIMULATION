# SID 0x22: Read Data By Identifier (RDBI)

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.2

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Structure](#message-structure)
3. [Data Identifier (DID) Concepts](#data-identifier-did-concepts)
4. [Positive Response](#positive-response)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Common Use Cases](#common-use-cases)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### What is Read Data By Identifier?

**Purpose**: Request ECU to return the current value(s) of one or more Data Identifiers (DIDs)

```
┌─────────────────────────────────────────────────────────────┐
│                  SID 0x22 - READ DATA BY IDENTIFIER         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Allows tester to READ:                                    │
│  • Vehicle Identification Number (VIN)                     │
│  • Software Version Numbers                                │
│  • Sensor Values (temperature, pressure, speed)            │
│  • Fault Counters                                          │
│  • Configuration Data                                      │
│  • Calibration Parameters                                  │
│  • And many more ECU-specific data items                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

```
┌──────────────────────┬────────────────────────────────────┐
│ Characteristic       │ Value                              │
├──────────────────────┼────────────────────────────────────┤
│ Service ID (SID)     │ 0x22                               │
│ Response SID         │ 0x62                               │
│ Subfunction?         │ NO (uses DIDs instead)             │
│ Multiple DIDs?       │ YES (can request multiple at once) │
│ Session Required     │ Varies by DID                      │
│ Security Required    │ Varies by DID                      │
│ Request Length       │ 1 + (2 × number of DIDs) bytes     │
│ Response Length      │ Variable (depends on DID data)     │
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
│  Byte 0:       SID = 0x22                                  │
│  Byte 1-2:     Data Identifier #1 (DID) - High/Low byte   │
│  Byte 3-4:     Data Identifier #2 (DID) - Optional        │
│  Byte 5-6:     Data Identifier #3 (DID) - Optional        │
│  ...           (more DIDs if needed)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Single DID Request Example

```
┌────────────────────────────────────────────┐
│ Read VIN (DID 0xF190)                     │
├────────────────────────────────────────────┤
│                                            │
│  Request Bytes:                            │
│  ┌──────┬──────┬──────┐                   │
│  │ 0x22 │ 0xF1 │ 0x90 │                   │
│  └──────┴──────┴──────┘                   │
│    SID    DID-Hi DID-Lo                   │
│                                            │
│  Length: 3 bytes                           │
│                                            │
└────────────────────────────────────────────┘
```

### Multiple DIDs Request Example

```
┌────────────────────────────────────────────────────────┐
│ Read VIN (0xF190) + ECU Serial Number (0xF18C)        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Request Bytes:                                        │
│  ┌──────┬──────┬──────┬──────┬──────┐                │
│  │ 0x22 │ 0xF1 │ 0x90 │ 0xF1 │ 0x8C │                │
│  └──────┴──────┴──────┴──────┴──────┘                │
│    SID   DID1-Hi DID1-Lo DID2-Hi DID2-Lo             │
│                                                        │
│  Length: 5 bytes (1 SID + 2 DIDs × 2 bytes)           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Data Identifier (DID) Concepts

### What is a DID?

```
┌─────────────────────────────────────────────────────────────┐
│                  DATA IDENTIFIER (DID)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A DID is a 2-byte (16-bit) identifier that represents     │
│  a specific piece of data in the ECU.                      │
│                                                             │
│  Format: 0xAABB                                            │
│          ├─┘└─┘                                            │
│          │   └─ Low Byte                                   │
│          └───── High Byte                                  │
│                                                             │
│  Example: 0xF190 = VIN (Vehicle Identification Number)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DID Range Categories

```
┌──────────────────────┬─────────────────────────────────────┐
│ DID Range            │ Category / Usage                    │
├──────────────────────┼─────────────────────────────────────┤
│ 0x0000 - 0x00FF      │ Reserved (ISO)                      │
│ 0x0100 - 0xEFFF      │ Vehicle Manufacturer Specific       │
│ 0xF000 - 0xF0FF      │ Network Configuration               │
│ 0xF100 - 0xF18F      │ Vehicle Manufacturer Specific       │
│ 0xF190 - 0xF19F      │ Vehicle Identification              │
│ 0xF1A0 - 0xF1EF      │ ECU Identification                  │
│ 0xF1F0 - 0xF1FF      │ Vehicle Manufacturer Specific       │
│ 0xF200 - 0xF2FF      │ Periodic Data (not used with 0x22)  │
│ 0xF300 - 0xF3FF      │ Dynamically Defined DIDs            │
│ 0xF400 - 0xF4FF      │ OBD-related DIDs                    │
│ 0xF500 - 0xF5FF      │ CDR (Crash Data Recorder)           │
│ 0xF600 - 0xF6FF      │ Safety System Application           │
│ 0xF700 - 0xF7FF      │ Diagnostic Data Identifier          │
│ 0xF800 - 0xF8FF      │ Vehicle Manufacturer Specific       │
│ 0xF900 - 0xF9FF      │ Reserved for Future Use             │
│ 0xFA00 - 0xFA0F      │ Vehicle Speed Information           │
│ 0xFA10 - 0xFEFF      │ Vehicle Manufacturer Specific       │
│ 0xFF00 - 0xFFFF      │ Reserved (Network Management)       │
└──────────────────────┴─────────────────────────────────────┘
```

### Common Standard DIDs

```
┌────────┬───────────────────────────────────┬──────────────┐
│  DID   │ Description                       │ Typical Size │
├────────┼───────────────────────────────────┼──────────────┤
│ 0xF186 │ Active Diagnostic Session         │ 1 byte       │
│ 0xF187 │ Vehicle Manufacturer Spare Part   │ Variable     │
│        │ Number                            │              │
│ 0xF188 │ Vehicle Manufacturer ECU Software │ Variable     │
│        │ Number                            │              │
│ 0xF189 │ Vehicle Manufacturer ECU Software │ Variable     │
│        │ Version Number                    │              │
│ 0xF18A │ System Supplier Identifier        │ Variable     │
│ 0xF18B │ ECU Manufacturing Date            │ 3-4 bytes    │
│ 0xF18C │ ECU Serial Number                 │ Variable     │
│ 0xF18E │ System Name or Engine Type        │ Variable     │
│ 0xF190 │ VIN (Vehicle Identification       │ 17 bytes     │
│        │ Number)                           │              │
│ 0xF191 │ Vehicle Manufacturer Hardware     │ Variable     │
│        │ Number                            │              │
│ 0xF192 │ System Supplier ECU Hardware      │ Variable     │
│        │ Number                            │              │
│ 0xF193 │ System Supplier ECU Hardware      │ Variable     │
│        │ Version Number                    │              │
│ 0xF194 │ System Supplier ECU Software      │ Variable     │
│        │ Number                            │              │
│ 0xF195 │ System Supplier ECU Software      │ Variable     │
│        │ Version Number                    │              │
│ 0xF197 │ System Name or Engine Type        │ Variable     │
│ 0xF198 │ Repair Shop Code or Tester Serial │ Variable     │
│        │ Number                            │              │
│ 0xF199 │ Programming Date                  │ 3-4 bytes    │
│ 0xF19E │ ODX File Data Identifier          │ Variable     │
└────────┴───────────────────────────────────┴──────────────┘
```

---

## Positive Response

### Response Message Format

```
┌─────────────────────────────────────────────────────────────┐
│                  POSITIVE RESPONSE STRUCTURE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Byte 0:       Response SID = 0x62                         │
│  Byte 1-2:     Data Identifier #1 (Echo)                   │
│  Byte 3-N:     Data Record #1 (actual data)                │
│  Byte N+1-N+2: Data Identifier #2 (Echo) - If requested    │
│  Byte N+3-M:   Data Record #2 (actual data) - If requested │
│  ...           (more DID+Data pairs if multiple requested) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Single DID Response Example

```
┌────────────────────────────────────────────────────────────┐
│ VIN Read Response (DID 0xF190)                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Response Bytes:                                           │
│  ┌──────┬──────┬──────┬─────────────────────────┐        │
│  │ 0x62 │ 0xF1 │ 0x90 │ 17 bytes of VIN data    │        │
│  └──────┴──────┴──────┴─────────────────────────┘        │
│   Resp   DID-Hi DID-Lo   Data Record                     │
│   SID                                                     │
│                                                            │
│  Example VIN: "1HGBH41JXMN109186"                         │
│  Bytes: 31 48 47 42 48 34 31 4A 58 4D 4E 31 30 39 31 38 36│
│         (ASCII encoding)                                   │
│                                                            │
│  Total Length: 20 bytes (1 + 2 + 17)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Multiple DIDs Response Example

```
┌─────────────────────────────────────────────────────────────┐
│ VIN (0xF190) + ECU Serial Number (0xF18C) Response        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Response Structure:                                        │
│  ┌──────┬──────┬──────┬─────────┬──────┬──────┬─────────┐ │
│  │ 0x62 │ 0xF1 │ 0x90 │ VIN     │ 0xF1 │ 0x8C │ Serial  │ │
│  │      │      │      │ (17 B)  │      │      │ (10 B)  │ │
│  └──────┴──────┴──────┴─────────┴──────┴──────┴─────────┘ │
│   Resp  DID1-Hi DID1-Lo  Data1   DID2-Hi DID2-Lo Data2    │
│   SID                                                       │
│                                                             │
│  Total Length: 30 bytes (1 + 2+17 + 2+10)                  │
│                                                             │
│  ✓ DIDs are echoed back in the response                    │
│  ✓ Data appears in the same order as requested             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
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
│  Byte 1:  0x22 (Requested Service ID - Echo)               │
│  Byte 2:  NRC Code (Reason for rejection)                  │
│                                                             │
│  Total Length: Always 3 bytes                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Common NRCs for SID 0x22

```
┌──────┬─────────────────────────────┬───────────────────────┐
│ NRC  │ Name                        │ When It Occurs        │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x13 │ Incorrect Message Length    │ Wrong number of bytes │
│      │ Or Invalid Format           │ in request            │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x14 │ Response Too Long           │ Data won't fit in     │
│      │                             │ single frame          │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x22 │ Conditions Not Correct      │ Vehicle conditions    │
│      │                             │ not met (speed, etc.) │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x31 │ Request Out Of Range        │ DID doesn't exist     │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x33 │ Security Access Denied      │ Security level not    │
│      │                             │ unlocked              │
├──────┼─────────────────────────────┼───────────────────────┤
│ 0x7F │ Service Not Supported In    │ Wrong diagnostic      │
│      │ Active Session              │ session active        │
└──────┴─────────────────────────────┴───────────────────────┘
```

---

### NRC 0x13: Incorrect Message Length Or Invalid Format

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Incomplete DID in request                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester sends:                                             │
│  ┌──────┬──────┐                                          │
│  │ 0x22 │ 0xF1 │  ← Missing low byte of DID!              │
│  └──────┴──────┘                                          │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x13 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Complete DID(s) provided                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester sends:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0xF1 │ 0x90 │  ✓ Complete 2-byte DID            │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU responds with positive response (0x62 + data)         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Request length is not (1 + N×2) bytes where N = number of DIDs
- Missing high or low byte of DID
- Extra bytes in message
- Empty request (only SID 0x22 with no DIDs)

---

### NRC 0x14: Response Too Long

```
┌────────────────────────────────────────────────────────────┐
│ ❌ PROBLEM: Requesting too many large DIDs                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester requests 10 DIDs that total 500 bytes of data      │
│                                                            │
│  ECU Response Buffer: 256 bytes max                        │
│                                                            │
│  Result: Cannot fit all data!                              │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x14 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ SOLUTION: Request fewer DIDs or use multiple requests  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Request #1: Read 3 DIDs (fits in buffer)                  │
│  Request #2: Read 3 more DIDs                              │
│  Request #3: Read remaining DIDs                           │
│                                                            │
│  ✓ Each response fits within ECU buffer limits             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Too many DIDs requested at once
- Individual DID data is very large
- Combined response exceeds transport protocol limits
- Exceeds ISO-TP single frame limit (typically 7 bytes for CAN)

**Note**: Some ECUs support multi-frame responses (ISO-TP), others don't.

---

### NRC 0x22: Conditions Not Correct

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Reading speed sensor while vehicle is parked    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Some DIDs require specific conditions:                    │
│                                                            │
│  Vehicle State: PARKED, ENGINE OFF                         │
│                                                            │
│  Tester requests: DID 0xFA10 (Vehicle Speed)               │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0xFA │ 0x10 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU checks: Is vehicle moving?  → NO                      │
│  ECU checks: Is sensor active?   → NO                      │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x22 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Read DID when conditions are met              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Vehicle State: DRIVING, ENGINE ON                         │
│                                                            │
│  Tester requests: DID 0xFA10 (Vehicle Speed)               │
│                                                            │
│  ECU checks: Is vehicle moving?  → YES ✓                   │
│  ECU checks: Is sensor active?   → YES ✓                   │
│                                                            │
│  ECU responds: 0x62 FA 10 [speed data]                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- Vehicle not in correct gear (Park/Neutral/Drive)
- Engine not running
- Sensor not initialized
- Voltage too low/high
- Temperature out of range
- Transmission not in correct mode

---

### NRC 0x31: Request Out Of Range

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Requesting non-existent DID                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester requests: DID 0x1234 (doesn't exist in ECU)        │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0x12 │ 0x34 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU searches DID table...                                 │
│  ┌──────────┬──────────┬──────────┐                       │
│  │ 0xF190   │ 0xF18C   │ 0xF186   │                       │
│  │ (VIN)    │ (Serial) │ (Session)│                       │
│  └──────────┴──────────┴──────────┘                       │
│                                                            │
│  0x1234 NOT FOUND!                                         │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x31 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Request DIDs that exist in ECU                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tester requests: DID 0xF190 (VIN - exists)                │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0xF1 │ 0x90 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU finds 0xF190 in DID table ✓                           │
│                                                            │
│  ECU responds with positive response + data                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- DID not supported by this ECU
- DID number is invalid
- Typo in DID value
- Using DID from different ECU type
- DID reserved by ISO but not implemented

**Tip**: Use SID 0x2A (Read Data By Identifier Periodic) supported DID list or ODX/CDD files to find valid DIDs.

---

### NRC 0x33: Security Access Denied

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Reading secured DID without unlocking           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Security State: 🔒 LOCKED                                 │
│                                                            │
│  Tester requests: DID 0x2000 (Calibration Data - secured)  │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0x20 │ 0x00 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU checks security: Is unlocked? → NO 🔒                 │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x33 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock security before reading secured DID    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Request Seed (SID 0x27 0x01)                      │
│  Step 2: Calculate Key                                     │
│  Step 3: Send Key (SID 0x27 0x02 [key])                    │
│                                                            │
│  Security State: 🔓 UNLOCKED                               │
│                                                            │
│  Step 4: Now read secured DID                              │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0x20 │ 0x00 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU checks security: Is unlocked? → YES ✓ 🔓              │
│  ECU responds with positive response + data                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- DID requires security unlock (SID 0x27)
- Security session expired
- Wrong security level unlocked
- Security blocked due to failed attempts

---

### NRC 0x7F: Service Not Supported In Active Session

```
┌────────────────────────────────────────────────────────────┐
│ ❌ WRONG: Reading session-restricted DID in wrong session │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Current Session: DEFAULT (0x01)                           │
│                                                            │
│  Tester requests: DID 0x3000 (requires EXTENDED session)   │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0x30 │ 0x00 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU checks session requirements:                          │
│  DID 0x3000 requires: EXTENDED                             │
│  Current session: DEFAULT                                  │
│  Match? → NO                                               │
│                                                            │
│  ECU responds:                                             │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x7F │ 0x22 │ 0x7F │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Switch to required session first              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Switch to EXTENDED session                        │
│  ┌──────┬──────┐                                          │
│  │ 0x10 │ 0x03 │  (SID 0x10 = Diagnostic Session Control) │
│  └──────┴──────┘                                          │
│                                                            │
│  Current Session: EXTENDED (0x03) ✓                        │
│                                                            │
│  Step 2: Now read the DID                                  │
│  ┌──────┬──────┬──────┐                                   │
│  │ 0x22 │ 0x30 │ 0x00 │                                   │
│  └──────┴──────┴──────┘                                   │
│                                                            │
│  ECU checks session: EXTENDED → Match ✓                    │
│  ECU responds with positive response + data                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Common Causes:**
- DID only available in EXTENDED session
- DID only available in PROGRAMMING session
- Currently in DEFAULT session
- Session timeout occurred

---

## Session and Security Requirements

### Session Requirement Matrix

```
┌──────────────────┬──────────┬──────────┬─────────────┐
│ DID Category     │ DEFAULT  │ EXTENDED │ PROGRAMMING │
├──────────────────┼──────────┼──────────┼─────────────┤
│ Identification   │    ✓     │    ✓     │      ✓      │
│ (0xF190-0xF19F)  │          │          │             │
├──────────────────┼──────────┼──────────┼─────────────┤
│ ECU Info         │    ✓     │    ✓     │      ✓      │
│ (0xF1A0-0xF1EF)  │          │          │             │
├──────────────────┼──────────┼──────────┼─────────────┤
│ Active Session   │    ✓     │    ✓     │      ✓      │
│ (0xF186)         │          │          │             │
├──────────────────┼──────────┼──────────┼─────────────┤
│ Runtime Data     │    ✗     │    ✓     │      ✗      │
│ (manufacturer)   │          │          │             │
├──────────────────┼──────────┼──────────┼─────────────┤
│ Calibration      │    ✗     │    ✓*    │      ✓*     │
│ Data             │          │ (Secured)│  (Secured)  │
├──────────────────┼──────────┼──────────┼─────────────┤
│ Programming      │    ✗     │    ✗     │      ✓*     │
│ Status           │          │          │  (Secured)  │
└──────────────────┴──────────┴──────────┴─────────────┘

Legend:
✓  = Allowed
✗  = Not Allowed
✓* = Allowed but requires security unlock (SID 0x27)
```

### Security Access Requirements

```
┌─────────────────────────────────────────────────────────────┐
│              SECURITY LEVELS FOR DID ACCESS                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 0: 🔓 No Security Required                           │
│  ├─ Standard identification DIDs (VIN, Serial, etc.)       │
│  ├─ Public sensor data                                     │
│  └─ Session information                                    │
│                                                             │
│  Level 1: 🔒 Security Required (Read-Only)                  │
│  ├─ Diagnostic trouble codes details                       │
│  ├─ Live sensor calibration values                         │
│  └─ Performance data                                       │
│                                                             │
│  Level 2: 🔒🔒 Security Required (Sensitive)                │
│  ├─ Calibration parameters                                 │
│  ├─ Proprietary algorithms                                 │
│  └─ Manufacturing data                                     │
│                                                             │
│  Level 3: 🔒🔒🔒 Security Required (Critical)               │
│  ├─ Immobilizer data                                       │
│  ├─ Encryption keys                                        │
│  └─ Safety-critical parameters                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: Read Vehicle Identification

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: Technician needs to identify the vehicle        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Read VIN                                           │
│  Request:  22 F1 90                                         │
│  Response: 62 F1 90 + 17 bytes ASCII VIN                    │
│                                                             │
│  Step 2: Read ECU Hardware Number                           │
│  Request:  22 F1 91                                         │
│  Response: 62 F1 91 + hardware part number                  │
│                                                             │
│  Step 3: Read ECU Software Version                          │
│  Request:  22 F1 89                                         │
│  Response: 62 F1 89 + software version string               │
│                                                             │
│  Session Required: DEFAULT (0x01) - Basic                   │
│  Security Required: None                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 2: Read Multiple Identification DIDs at Once

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: Read VIN + Serial Number + Software Version     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Single Request with 3 DIDs:                                │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │ 0x22 │ 0xF1 │ 0x90 │ 0xF1 │ 0x8C │ 0xF1 │ 0x89 │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│   SID    VIN DID      Serial DID    SW Ver DID            │
│                                                             │
│  Response:                                                  │
│  0x62 + F190 + [17B VIN] + F18C + [10B Serial] +           │
│        F189 + [variable SW version]                         │
│                                                             │
│  Benefit: Single request instead of 3 separate ones!       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 3: Read Live Sensor Data

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: Monitor engine temperature and RPM              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prerequisite: Switch to EXTENDED session                   │
│  Request: 10 03                                             │
│  Response: 50 03 (session changed)                          │
│                                                             │
│  Read Engine Temperature (DID 0x0105):                      │
│  Request:  22 01 05                                         │
│  Response: 62 01 05 5A (90°C in hex)                        │
│                                                             │
│  Read Engine RPM (DID 0x010C):                              │
│  Request:  22 01 0C                                         │
│  Response: 62 01 0C 0B B8 (3000 RPM = 0x0BB8)               │
│                                                             │
│  Session Required: EXTENDED (0x03)                          │
│  Security Required: None (public sensor data)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Use Case 4: Read Secured Calibration Data

```
┌─────────────────────────────────────────────────────────────┐
│  SCENARIO: Read ECU calibration parameter (secured)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Enter EXTENDED session                             │
│  Request:  10 03                                            │
│  Response: 50 03                                            │
│                                                             │
│  Step 2: Request Security Seed                              │
│  Request:  27 01                                            │
│  Response: 67 01 [4 bytes seed]                             │
│                                                             │
│  Step 3: Send Security Key                                  │
│  Request:  27 02 [4 bytes calculated key]                   │
│  Response: 67 02 (unlocked! 🔓)                             │
│                                                             │
│  Step 4: NOW read secured DID                               │
│  Request:  22 20 00 (calibration parameter)                 │
│  Response: 62 20 00 + [calibration data]                    │
│                                                             │
│  Session Required: EXTENDED                                 │
│  Security Required: YES (Level 1+)                          │
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
│  Document: ISO 14229-1:2020                                 │
│  Section:  9.2 - ReadDataByIdentifier (0x22) service       │
│                                                             │
│  Key Topics Covered:                                        │
│  • Service description and purpose                          │
│  • Request message format                                   │
│  • Response message format                                  │
│  • Data identifier ranges and categories                    │
│  • Negative response codes                                  │
│  • Session and security behavior                            │
│  • Multi-DID request handling                               │
│  • Response length limitations                              │
│                                                             │
│  Related Sections:                                          │
│  • Section 6.2: Data Identifier Definition                  │
│  • Section 8.2: Diagnostic Session Control (SID 0x10)       │
│  • Section 8.6: Security Access (SID 0x27)                  │
│  • Annex A: Data Identifier Ranges                          │
│  • Annex C: Negative Response Code Definitions              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Timing

```
┌─────────────────────────────────────────────────────────────┐
│                    TIMING PARAMETERS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  P2 (Default): Maximum time for ECU to start responding     │
│  └─ Typical: 50 ms                                          │
│  └─ Can be adjusted via Timing Parameters (SID 0x83)        │
│                                                             │
│  P2* (Extended): Maximum time when ECU sends NRC 0x78       │
│  └─ Typical: 5000 ms (5 seconds)                            │
│  └─ Used when ECU needs more time to fetch data             │
│                                                             │
│  Response Pending Flow:                                     │
│                                                             │
│  Tester              ECU                                    │
│    │                  │                                     │
│    │  22 F1 90        │                                     │
│    │─────────────────>│                                     │
│    │                  │ (Processing large DID...)           │
│    │                  │                                     │
│    │  7F 22 78        │ (Response Pending)                  │
│    │<─────────────────│                                     │
│    │                  │                                     │
│    │                  │ (Still working...)                  │
│    │                  │                                     │
│    │  62 F1 90 [data] │ (Final Response)                    │
│    │<─────────────────│                                     │
│    │                  │                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  SID 0x22 QUICK REFERENCE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purpose: Read data from ECU using Data Identifiers (DIDs)  │
│                                                             │
│  Request Format:                                            │
│  [0x22] [DID_Hi] [DID_Lo] [DID2_Hi] [DID2_Lo] ...          │
│                                                             │
│  Response Format:                                           │
│  [0x62] [DID_Hi] [DID_Lo] [Data...] [DID2...] [Data2...]   │
│                                                             │
│  Key Features:                                              │
│  ✓ Can request multiple DIDs in one message                 │
│  ✓ DIDs are echoed back in response                         │
│  ✓ Data returned in same order as requested                 │
│  ✓ Different DIDs have different session requirements       │
│  ✓ Some DIDs require security unlock                        │
│                                                             │
│  Common NRCs:                                               │
│  • 0x13 - Incorrect message length                          │
│  • 0x14 - Response too long                                 │
│  • 0x22 - Conditions not correct                            │
│  • 0x31 - DID doesn't exist                                 │
│  • 0x33 - Security access denied                            │
│  • 0x7F - Wrong session                                     │
│                                                             │
│  Best Practices:                                            │
│  • Check ODX/CDD for supported DIDs                         │
│  • Verify session requirements before reading               │
│  • Unlock security if needed (SID 0x27)                     │
│  • Don't request too many large DIDs at once                │
│  • Handle NRC 0x78 (Response Pending) properly              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x22 Theoretical Guide**

For practical implementation details, see: `SID_22_PRACTICAL_IMPLEMENTATION.md`  
For service interaction workflows, see: `SID_22_SERVICE_INTERACTIONS.md`
