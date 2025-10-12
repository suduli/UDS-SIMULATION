# SID 10: Diagnostic Session Control - Complete Learning Guide

## Table of Contents
1. [Overview](#overview)
2. [What is SID 10?](#what-is-sid-10)
3. [Subfunctions Explained](#subfunctions-explained)
4. [Request & Response Format](#request--response-format)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Why NRCs Are Created](#why-nrcs-are-created)
7. [Session State Management](#session-state-management)
8. [Interaction with Other SIDs](#interaction-with-other-sids)
9. [Practical Examples](#practical-examples)
10. [Common Troubleshooting](#common-troubleshooting)
11. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Overview

**Service ID (SID) 0x10** - Diagnostic Session Control is the **gateway service** in UDS protocol. It controls which diagnostic session the ECU operates in, thereby determining what operations are allowed.

Think of it like **security clearance levels**:
- **Default Session** = Public access (read-only operations)
- **Extended Session** = Advanced access (read/write, diagnostics)
- **Programming Session** = Full access (firmware updates, memory operations)

---

## What is SID 10?

### Purpose
- **Switches the ECU between different diagnostic sessions**
- **Enables or restricts access** to various diagnostic services
- **Controls the security and operational state** of the ECU
- **Always available** - can be used from any state

### Key Characteristics
- **Service ID**: `0x10`
- **Requires Subfunction**: Yes (mandatory)
- **Session Dependency**: None (always available)
- **Security Requirement**: None
- **Response Format**: Positive response includes timing parameters

---

## Subfunctions Explained

The subfunction byte specifies **which diagnostic session** to enter.

### 1. Default Diagnostic Session (0x01)

```
Subfunction: 0x01
```

**Purpose**: 
- Normal vehicle operation mode
- Basic diagnostic operations
- **Safest session** - always available

**Access Level**:
- ✅ Read-only operations
- ✅ Basic diagnostics (read DTCs, read VIN)
- ❌ No write operations
- ❌ No security-protected operations

**When to Use**:
- Starting point for most diagnostic sequences
- After completing advanced operations
- Resetting ECU to safe state
- Reading basic vehicle information

**State Changes**:
- Resets security access (if previously unlocked)
- Clears extended permissions
- Returns ECU to factory-default behavior

---

### 2. Programming Session (0x02)

```
Subfunction: 0x02
```

**Purpose**:
- ECU software reprogramming
- Firmware updates
- Memory flash operations

**Access Level**:
- ✅ Full memory access
- ✅ Flash programming
- ✅ Firmware updates
- ✅ Memory write operations (0x3D, 0x34, 0x36, 0x37)

**When to Use**:
- Updating ECU firmware
- Flash memory operations
- Request Download (0x34)
- Request Upload (0x35)
- Transfer Data (0x36)

**Requirements**:
- Often requires prior security access
- May require specific vehicle conditions (ignition on, vehicle stationary)

**State Changes**:
- May reset security (implementation-dependent)
- Disables normal vehicle operations
- Enables programming-specific services

---

### 3. Extended Diagnostic Session (0x03)

```
Subfunction: 0x03
```

**Purpose**:
- Advanced diagnostic operations
- Calibration and testing
- Security-protected operations

**Access Level**:
- ✅ Read/write operations
- ✅ Routine Control (0x31)
- ✅ Security Access (0x27)
- ✅ Write Data by Identifier (0x2E)
- ✅ Advanced DTC operations

**When to Use**:
- Before requesting security access
- Performing calibration
- Writing configuration data
- Advanced troubleshooting
- Running diagnostic routines

**State Changes**:
- **Preserves security access** (if already unlocked)
- Enables extended services
- May start session timeout timer

---

## Request & Response Format

### Request Format

```
Byte 0    Byte 1
[0x10]    [SubFunction]
  │            │
  │            └─── Session Type (0x01, 0x02, or 0x03)
  │
  └────────────── Service ID (Diagnostic Session Control)
```

**Example Requests**:

```hex
10 01    // Enter Default Session
10 02    // Enter Programming Session
10 03    // Enter Extended Session
```

**Message Length**: Exactly **2 bytes** (SID + Subfunction)

---

### Positive Response Format

```
Byte 0    Byte 1         Byte 2-3    Byte 4-5
[0x50]    [SubFunction]  [P2]        [P2*]
  │            │            │           │
  │            │            │           └─── Extended timeout (P2* timing)
  │            │            │
  │            │            └───────────── Default timeout (P2 timing)
  │            │
  │            └────────────────────────── Confirmed session type
  │
  └─────────────────────────────────────── Positive response SID (0x10 + 0x40)
```

**Example Response**:

```hex
50 03 00 32 01 F4
│  │  └──┬──┘ └──┬──┘
│  │     │       │
│  │     │       └────── P2* = 0x01F4 = 500ms (extended timeout)
│  │     │
│  │     └────────────── P2 = 0x0032 = 50ms (default timeout)
│  │
│  └──────────────────── Extended session confirmed
│
└─────────────────────── Positive response (0x10 + 0x40 = 0x50)
```

**Timing Parameters**:
- **P2**: Default maximum response time (typically 50ms)
- **P2***: Extended maximum response time (typically 500-5000ms)
- Used for services that take longer to complete

---

### Negative Response Format

```
Byte 0    Byte 1    Byte 2
[0x7F]    [0x10]    [NRC]
  │         │         │
  │         │         └─── Negative Response Code (reason for failure)
  │         │
  │         └─────────── Original Service ID
  │
  └───────────────────── Negative response indicator
```

---

## Negative Response Codes (NRCs)

### Common NRCs for SID 10

#### 1. NRC 0x12 - Sub-Function Not Supported

```hex
7F 10 12
```

**What it means**: The session type you requested doesn't exist or isn't supported by this ECU.

**Common Causes**:
- Invalid subfunction value (e.g., `0x10 0x99` instead of `0x10 0x01`)
- Typo in the subfunction byte
- ECU doesn't implement that session type (rare)

**Valid Subfunctions**:
- ✅ `0x01` - Default Session
- ✅ `0x02` - Programming Session
- ✅ `0x03` - Extended Session
- ❌ `0x04` - Invalid
- ❌ `0x99` - Invalid
- ❌ `0xFF` - Invalid

**How to Fix**:
```
┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Invalid Subfunction                         │
├────────────────────────────────────────────────────────┤
│  Request Structure:                                    │
│  ┌──────────────────────────────────────────┐         │
│  │ SID: 0x10                                │         │
│  │ SubFunction: 0xFF  ← Invalid! ❌         │         │
│  │ Data: []                                 │         │
│  └──────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Valid Subfunction                         │
├────────────────────────────────────────────────────────┤
│  Request Structure:                                    │
│  ┌──────────────────────────────────────────┐         │
│  │ SID: 0x10                                │         │
│  │ SubFunction: 0x01  ← Valid: Default ✓    │         │
│  │ Data: []                                 │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  Byte Sequence: [0x10, 0x01]                          │
└────────────────────────────────────────────────────────┘
```

---

#### 2. NRC 0x13 - Incorrect Message Length

```hex
7F 10 13
```

**What it means**: The request has the wrong number of bytes.

**Common Causes**:
- Missing subfunction byte
- Extra data bytes (SID 10 requires exactly 2 bytes)
- Malformed request

**How to Fix**:
```
┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Missing Subfunction                         │
├────────────────────────────────────────────────────────┤
│  Request Structure:                                    │
│  ┌──────────────────────────────────────────┐         │
│  │ SID: 0x10                                │         │
│  │ SubFunction: (missing!) ❌                │         │
│  │ Data: []                                 │         │
│  └──────────────────────────────────────────┘         │
│  Byte Sequence: [0x10] ← Only 1 byte! Wrong!          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Extra Data                                  │
├────────────────────────────────────────────────────────┤
│  Request Structure:                                    │
│  ┌──────────────────────────────────────────┐         │
│  │ SID: 0x10                                │         │
│  │ SubFunction: 0x03                        │         │
│  │ Data: [0x00, 0x01]  ← Extra bytes! ❌     │         │
│  └──────────────────────────────────────────┘         │
│  Byte Sequence: [0x10, 0x03, 0x00, 0x01]              │
│                  ← 4 bytes! Wrong!                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Exact 2 Bytes                             │
├────────────────────────────────────────────────────────┤
│  Request Structure:                                    │
│  ┌──────────────────────────────────────────┐         │
│  │ SID: 0x10                                │         │
│  │ SubFunction: 0x03 ✓                       │         │
│  │ Data: [] (No additional data needed)     │         │
│  └──────────────────────────────────────────┘         │
│  Byte Sequence: [0x10, 0x03] ← Exactly 2 bytes! ✓     │
└────────────────────────────────────────────────────────┘
```

---

#### 3. NRC 0x22 - Conditions Not Correct

```hex
7F 10 22
```

**What it means**: The ECU cannot enter the requested session due to current vehicle conditions.

**Common Causes**:
- Vehicle is moving (programming session requires stationary)
- Engine is running (some sessions require engine off)
- Other diagnostic operations in progress
- ECU is in a protected state

**Example Scenario**:
```
Trying to enter Programming Session while vehicle is driving
→ NRC 0x22 (Conditions Not Correct)

Solution: Stop vehicle, turn off engine, then retry
```

---

## Why NRCs Are Created

### 1. **Data Validation**
NRCs enforce correct protocol usage:
- Ensures requests are well-formed
- Validates subfunction values
- Checks message lengths

**Example**:
```
Request: 10 FF
         ↓
Invalid subfunction (0xFF)
         ↓
NRC 0x12 (Sub-Function Not Supported)
```

---

### 2. **State Management**
NRCs protect ECU state:
- Prevent unsafe operations
- Enforce prerequisites
- Maintain security

**Example**:
```
Request: 10 02 (Programming Session)
         ↓
Vehicle is moving
         ↓
NRC 0x22 (Conditions Not Correct)
```

---

### 3. **Security & Safety**
NRCs prevent:
- Unauthorized access
- Dangerous operations while driving
- Bricking the ECU

**Example**:
```
Request: 34 00 ... (Request Download)
         ↓
Not in Programming Session
         ↓
NRC 0x7F (Service Not Supported in Active Session)
```

---

### 4. **ISO 14229-1 Compliance**
NRCs ensure:
- Standard communication
- Predictable behavior
- Diagnostic tool compatibility

---

## What NRC Numbers Represent

### NRC Structure

```
0x12 = 18 (decimal)
  │
  └─── Each NRC has a unique meaning defined by ISO 14229-1
```

### Common NRC Categories

| NRC Range | Category | Examples |
|-----------|----------|----------|
| 0x10-0x14 | Message Format Errors | 0x11 (Service Not Supported), 0x12 (Sub-Function Not Supported), 0x13 (Incorrect Message Length) |
| 0x21-0x24 | Timing Errors | 0x21 (Busy Repeat Request), 0x24 (Request Sequence Error) |
| 0x31-0x37 | Security/Access Errors | 0x33 (Security Access Denied), 0x35 (Invalid Key), 0x36 (Exceed Number of Attempts) |
| 0x70-0x78 | Programming Errors | 0x70 (Upload/Download Not Accepted), 0x73 (Wrong Block Sequence Counter) |
| 0x7E-0x7F | Session Errors | 0x7E (Sub-Function Not Supported in Active Session), 0x7F (Service Not Supported in Active Session) |

---

## Session State Management

### State Diagram

```
┌──────────────────────────────────────────────────┐
│                                                  │
│         [DEFAULT SESSION] (0x01)                 │
│         ├─ Read-only access                      │
│         ├─ Basic diagnostics                     │
│         └─ Always available                      │
│                                                  │
└────────┬───────────────────────────────┬─────────┘
         │                               │
    10 03│                               │10 02
         │                               │
         ▼                               ▼
┌────────────────────┐         ┌────────────────────┐
│ EXTENDED SESSION   │         │ PROGRAMMING SESSION│
│      (0x03)        │         │      (0x02)        │
├────────────────────┤         ├────────────────────┤
│ • Security Access  │         │ • Flash Memory     │
│ • Write Operations │         │ • Firmware Update  │
│ • Routine Control  │         │ • Request Download │
│ • Calibration      │         │ • Transfer Data    │
└────────┬───────────┘         └────────┬───────────┘
         │                               │
         │         10 01                 │
         └───────────┬───────────────────┘
                     │
                     ▼
              [DEFAULT SESSION]
```

### State Transitions

```
┌────────────────────────────────────────────────────────┐
│ STATE TRANSITION EXAMPLES                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  SCENARIO 1: DEFAULT → EXTENDED                       │
│  ┌──────────────────────────────────────┐             │
│  │ Current Session: DEFAULT (0x01)      │             │
│  │                                      │             │
│  │ Tester → ECU: [0x10, 0x03]           │             │
│  │ ECU → Tester: [0x50, 0x03, 0x00,     │             │
│  │                0x32, 0x01, 0xF4]     │             │
│  │                                      │             │
│  │ Current Session: EXTENDED (0x03) ✓   │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  SCENARIO 2: EXTENDED → PROGRAMMING                   │
│  ┌──────────────────────────────────────┐             │
│  │ Current Session: EXTENDED (0x03)     │             │
│  │                                      │             │
│  │ Tester → ECU: [0x10, 0x02]           │             │
│  │ ECU → Tester: [0x50, 0x02, 0x00,     │             │
│  │                0x32, 0x01, 0xF4]     │             │
│  │                                      │             │
│  │ Current Session: PROGRAMMING (0x02) ✓│             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  SCENARIO 3: ANY → DEFAULT                            │
│  ┌──────────────────────────────────────┐             │
│  │ Current Session: (any session)       │             │
│  │                                      │             │
│  │ Tester → ECU: [0x10, 0x01]           │             │
│  │ ECU → Tester: [0x50, 0x01, 0x00,     │             │
│  │                0x32, 0x01, 0xF4]     │             │
│  │                                      │             │
│  │ Current Session: DEFAULT (0x01) ✓    │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Security Reset Behavior

**Important**: Changing sessions affects security state!

```
┌────────────────────────────────────────────────────────┐
│ SECURITY STATE DURING SESSION CHANGES                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  STEP 1: Unlock Security in Extended Session          │
│  ┌──────────────────────────────────────┐             │
│  │ Session: EXTENDED (0x03)             │             │
│  │                                      │             │
│  │ Send: [0x27, 0x01]  (Request Seed)   │             │
│  │ Receive: [0x67, 0x01, 0x12, 0x34,    │             │
│  │           0x56, 0x78]                │             │
│  │                                      │             │
│  │ Send: [0x27, 0x02, KEY]  (Send Key)  │             │
│  │ Receive: [0x67, 0x02]                │             │
│  │                                      │             │
│  │ Security: UNLOCKED ✓                 │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 2: Switch to Programming Session                │
│  ┌──────────────────────────────────────┐             │
│  │ Send: [0x10, 0x02]                   │             │
│  │ Receive: [0x50, 0x02, 0x00, 0x32,    │             │
│  │           0x01, 0xF4]                │             │
│  │                                      │             │
│  │ Session: PROGRAMMING (0x02) ✓        │             │
│  │ Security: LOCKED ✗                   │             │
│  │ ⚠️ Security reset!                    │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 3: Switch back to Extended                      │
│  ┌──────────────────────────────────────┐             │
│  │ Send: [0x10, 0x03]                   │             │
│  │ Receive: [0x50, 0x03, 0x00, 0x32,    │             │
│  │           0x01, 0xF4]                │             │
│  │                                      │             │
│  │ Session: EXTENDED (0x03) ✓           │             │
│  │ Security: UNLOCKED ✓                 │             │
│  │ Extended preserves security!         │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Rule**:
```
┌────────────────────────────────────────────────────────┐
│ SECURITY PRESERVATION RULES                            │
├────────────────────────────────────────────────────────┤
│  • Switching TO Extended Session                       │
│    → Security preserved (if already unlocked)          │
│                                                        │
│  • Switching FROM Extended to any other session        │
│    → Security reset                                    │
│                                                        │
│  • Switching between Default/Programming               │
│    → Security reset                                    │
└────────────────────────────────────────────────────────┘
```

---

## Interaction with Other SIDs

### SID 10 as a Prerequisite

Many services require a specific session before they can be used.

#### Services Requiring Extended Session (0x03)

```
┌─────────────────────────────────────┐
│  Must Enter Extended Session First  │
├─────────────────────────────────────┤
│ 0x27 - Security Access              │
│ 0x2E - Write Data by Identifier     │
│ 0x31 - Routine Control               │
│ 0x14 - Clear Diagnostic Information │
│ (ECU-dependent)                      │
└─────────────────────────────────────┘
```

**Example Sequence**:
```
┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Write without proper session                │
├────────────────────────────────────────────────────────┤
│  Step 1: [0x2E, 0xF1, 0x90, DATA]  → Write Data       │
│          [0x7F, 0x2E, 0x7F] ❌                          │
│          NRC 0x7F - Service Not Supported in Active    │
│          Session                                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Enter Extended Session first              │
├────────────────────────────────────────────────────────┤
│  Step 1: [0x10, 0x03]              → Extended Session │
│          [0x50, 0x03, ...] ✓                           │
│                                                        │
│  Step 2: [0x2E, 0xF1, 0x90, DATA]  → Write Data       │
│          [0x6E, 0xF1, 0x90] ✓ Success!                 │
└────────────────────────────────────────────────────────┘
```

---

#### Services Requiring Programming Session (0x02)

```
┌─────────────────────────────────────┐
│ Must Enter Programming Session First│
├─────────────────────────────────────┤
│ 0x34 - Request Download             │
│ 0x35 - Request Upload               │
│ 0x36 - Transfer Data                │
│ 0x37 - Request Transfer Exit        │
│ 0x3D - Write Memory by Address      │
└─────────────────────────────────────┘
```

**Example Sequence**:
```
┌────────────────────────────────────────────────────────┐
│ FIRMWARE UPDATE SEQUENCE                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x02]        → Programming Session    │
│          [0x50, 0x02, ...] ✓                           │
│                                                        │
│  Step 2: [0x27, 0x01]        → Request Security Seed  │
│          [0x67, 0x01, SEED] ✓                          │
│                                                        │
│  Step 3: [0x27, 0x02, KEY]   → Send Security Key      │
│          [0x67, 0x02] ✓                                │
│                                                        │
│  Step 4: [0x34, 0x00, 0x44, ...] → Request Download   │
│          [0x74, ...] ✓                                 │
│                                                        │
│  Step 5: [0x36, 0x01, DATA]  → Transfer Data Block 1  │
│          [0x76, 0x01] ✓                                │
│                                                        │
│  Step 6: [0x36, 0x02, DATA]  → Transfer Data Block 2  │
│          [0x76, 0x02] ✓                                │
│                                                        │
│  Step 7: [0x37]              → Request Transfer Exit  │
│          [0x77] ✓                                      │
│                                                        │
│  Step 8: [0x10, 0x01]        → Return to Default      │
│          [0x50, 0x01, ...] ✓                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Common Workflows with SID 10

#### Workflow 1: Basic Diagnostic Read

```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Basic Diagnostic Read                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x01]  → Enter Default Session        │
│          [0x50, 0x01, ...] ✓                           │
│          (Optional but recommended)                    │
│                                                        │
│  Step 2: [0x22, 0xF1, 0x90] → Read VIN                │
│          [0x62, 0xF1, 0x90, VIN_DATA] ✓                │
│                                                        │
│  Sessions used: DEFAULT                                │
│  Other SIDs: 0x22 (Read Data by Identifier)            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### Workflow 2: Secure Write Operation

```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Secure Write Operation                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x03]        → Extended Session       │
│          [0x50, 0x03, ...] ✓                           │
│                                                        │
│  Step 2: [0x27, 0x01]        → Request Security Seed  │
│          [0x67, 0x01, SEED] ✓                          │
│                                                        │
│  Step 3: [0x27, 0x02, KEY]   → Send Security Key      │
│          [0x67, 0x02] ✓                                │
│                                                        │
│  Step 4: [0x2E, 0xF1, 0x8C, DATA] → Write Data        │
│          [0x6E, 0xF1, 0x8C] ✓                          │
│          (Write to DID 0xF18C)                         │
│                                                        │
│  Step 5: [0x10, 0x01]        → Return to Default      │
│          [0x50, 0x01, ...] ✓                           │
│                                                        │
│  Sessions used: EXTENDED → DEFAULT                     │
│  Other SIDs: 0x27 (Security Access), 0x2E (Write Data) │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### Workflow 3: Clear DTCs

```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Clear DTCs                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x03]        → Extended Session       │
│          [0x50, 0x03, ...] ✓                           │
│                                                        │
│  Step 2: [0x14, 0xFF, 0xFF, 0xFF] → Clear all DTCs    │
│          [0x54] ✓                                      │
│                                                        │
│  Step 3: [0x19, 0x01, 0xFF]  → Verify DTCs cleared    │
│          [0x59, 0x01, 0x00] ✓ (0 DTCs)                 │
│                                                        │
│  Step 4: [0x10, 0x01]        → Return to Default      │
│          [0x50, 0x01, ...] ✓                           │
│                                                        │
│  Sessions used: EXTENDED → DEFAULT                     │
│  Other SIDs: 0x14 (Clear DTC), 0x19 (Read DTC)         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### Workflow 4: Run Diagnostic Routine

```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Run Diagnostic Routine                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x03]        → Extended Session       │
│          [0x50, 0x03, ...] ✓                           │
│                                                        │
│  Step 2: [0x31, 0x01, 0x02, 0x03] → Start Routine     │
│          [0x71, 0x01, 0x02, 0x03] ✓                    │
│          (Routine ID: 0x0203)                          │
│                                                        │
│  Step 3: [0x31, 0x03, 0x02, 0x03] → Request Results   │
│          [0x71, 0x03, 0x02, 0x03, RESULTS] ✓           │
│                                                        │
│  Step 4: [0x31, 0x02, 0x02, 0x03] → Stop Routine      │
│          [0x71, 0x02, 0x02, 0x03] ✓                    │
│                                                        │
│  Step 5: [0x10, 0x01]        → Return to Default      │
│          [0x50, 0x01, ...] ✓                           │
│                                                        │
│  Sessions used: EXTENDED → DEFAULT                     │
│  Other SIDs: 0x31 (Routine Control)                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### Workflow 5: Memory Read (Secure)

```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Memory Read (Secure)                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x03]        → Extended Session       │
│          [0x50, 0x03, ...] ✓                           │
│                                                        │
│  Step 2: [0x27, 0x01]        → Request Security Seed  │
│          [0x67, 0x01, SEED] ✓                          │
│                                                        │
│  Step 3: [0x27, 0x02, KEY]   → Send Security Key      │
│          [0x67, 0x02] ✓                                │
│                                                        │
│  Step 4: [0x23, 0x12, 0x34, 0x56, 0x78, 0x00, 0x10]   │
│          → Read 16 bytes from address 0x12345678       │
│          [0x63, MEMORY_DATA] ✓                         │
│                                                        │
│  Step 5: [0x10, 0x01]        → Return to Default      │
│          [0x50, 0x01, ...] ✓                           │
│                                                        │
│  Sessions used: EXTENDED → DEFAULT                     │
│  Other SIDs: 0x27 (Security Access), 0x23 (Read Memory)│
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Practical Examples

### Example 1: Session Switch with Error

```
┌────────────────────────────────────────────────────────┐
│ EXAMPLE: Session Switch with Error Handling           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ATTEMPT 1: Invalid Subfunction                       │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0xFF]               │             │
│  │ Response: [0x7F, 0x10, 0x12] ❌       │             │
│  │           NRC 0x12 - Sub-Function    │             │
│  │           Not Supported              │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ATTEMPT 2: Correct Request                           │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0x03]               │             │
│  │ Response: [0x50, 0x03, 0x00, 0x32,   │             │
│  │            0x01, 0xF4] ✓              │             │
│  │           Success! Extended Session  │             │
│  │           is now active              │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Example 2: Session-Dependent Service

```
┌────────────────────────────────────────────────────────┐
│ EXAMPLE: Session-Dependent Service                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  STEP 1: Try to write in Default Session              │
│  ┌──────────────────────────────────────┐             │
│  │ Current Session: DEFAULT             │             │
│  │                                      │             │
│  │ Request:  [0x2E, 0xF1, 0x90, DATA]   │             │
│  │           (Write Data)               │             │
│  │                                      │             │
│  │ Response: [0x7F, 0x2E, 0x7F] ❌       │             │
│  │           NRC 0x7F - Service Not     │             │
│  │           Supported in Active Session│             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 2: Switch to Extended Session                   │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0x03]               │             │
│  │ Response: [0x50, 0x03, 0x00, 0x32,   │             │
│  │            0x01, 0xF4] ✓              │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 3: Retry Write Data                             │
│  ┌──────────────────────────────────────┐             │
│  │ Current Session: EXTENDED            │             │
│  │                                      │             │
│  │ Request:  [0x2E, 0xF1, 0x90, DATA]   │             │
│  │ Response: [0x6E, 0xF1, 0x90] ✓       │             │
│  │           Success! Data written      │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Example 3: Full Diagnostic Sequence

```
┌────────────────────────────────────────────────────────┐
│ EXAMPLE: Full Diagnostic Sequence                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  STEP 1: Reset to known state                         │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0x01]               │             │
│  │ Response: [0x50, 0x01, 0x00, 0x32,   │             │
│  │            0x01, 0xF4] ✓              │             │
│  │ State: DEFAULT SESSION, LOCKED       │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 2: Read VIN (works in default)                  │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x22, 0xF1, 0x90]         │             │
│  │ Response: [0x62, 0xF1, 0x90, VIN...] │             │
│  │ Decoded:  VIN = "WVWZZZZ1K5887654"   │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 3: Enter Extended Session                       │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0x03]               │             │
│  │ Response: [0x50, 0x03, ...] ✓         │             │
│  │ State: EXTENDED SESSION, LOCKED      │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 4: Request Security Access                      │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x27, 0x01]               │             │
│  │ Response: [0x67, 0x01, 0x12, 0x34,   │             │
│  │            0x56, 0x78]                │             │
│  │ Seed: [0x12, 0x34, 0x56, 0x78]       │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 5: Calculate and send key (XOR algorithm)       │
│  ┌──────────────────────────────────────┐             │
│  │ Key: [0xED, 0xCB, 0xA9, 0x87]        │             │
│  │ Request:  [0x27, 0x02, 0xED, 0xCB,   │             │
│  │            0xA9, 0x87]                │             │
│  │ Response: [0x67, 0x02] ✓              │             │
│  │ State: EXTENDED SESSION, UNLOCKED    │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 6: Clear DTCs (requires extended + security)    │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x14, 0xFF, 0xFF, 0xFF]   │             │
│  │ Response: [0x54] ✓                    │             │
│  │ Result: All DTCs cleared             │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  STEP 7: Return to default                            │
│  ┌──────────────────────────────────────┐             │
│  │ Request:  [0x10, 0x01]               │             │
│  │ Response: [0x50, 0x01, ...] ✓         │             │
│  │ State: DEFAULT SESSION, LOCKED       │             │
│  └──────────────────────────────────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Common Troubleshooting

### Problem 1: "NRC 0x12 - Sub-Function Not Supported"

**Symptoms**:
```
Request:  10 05
Response: 7F 10 12
```

**Root Cause**: Invalid subfunction value

**Solution**:
```
┌────────────────────────────────────────────────────────┐
│ VALID SUBFUNCTIONS                                     │
├────────────────────────────────────────────────────────┤
│  0x01 - Default Session     ✓                          │
│  0x02 - Programming Session ✓                          │
│  0x03 - Extended Session    ✓                          │
│  0x05 - INVALID             ✗                          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ CORRECTED REQUEST                                      │
├────────────────────────────────────────────────────────┤
│  Use correct value:                                    │
│  Request: [0x10, 0x01]  or [0x10, 0x02]  or [0x10, 0x03]│
└────────────────────────────────────────────────────────┘
```

---

### Problem 2: "NRC 0x13 - Incorrect Message Length"

**Symptoms**:
```
Request:  10
Response: 7F 10 13
```

**Root Cause**: Missing subfunction byte

**Solution**:
```
┌────────────────────────────────────────────────────────┐
│ MESSAGE LENGTH COMPARISON                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ❌ WRONG - Only 1 byte                               │
│  ┌──────────────────────────────────────┐             │
│  │ SID: 0x10                            │             │
│  │ SubFunction: (missing)               │             │
│  │ Data: []                             │             │
│  └──────────────────────────────────────┘             │
│  Byte Sequence: [0x10]  ← Incomplete!                 │
│                                                        │
│  ✅ CORRECT - 2 bytes (SID + subfunction)             │
│  ┌──────────────────────────────────────┐             │
│  │ SID: 0x10                            │             │
│  │ SubFunction: 0x01                    │             │
│  │ Data: []                             │             │
│  └──────────────────────────────────────┘             │
│  Byte Sequence: [0x10, 0x01] ✓                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Problem 3: Service Fails After Session Change

**Symptoms**:
```
Step 1: 10 03     → Success
Step 2: 27 01     → Success
Step 3: 27 02 ... → Success (Security unlocked)
Step 4: 10 02     → Success (Programming Session)
Step 5: 34 ...    → NRC 0x33 (Security Access Denied)
```

**Root Cause**: Security reset when changing sessions

**Solution**:
```
┌────────────────────────────────────────────────────────┐
│ SOLUTION: Enter Programming FIRST, then unlock        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: [0x10, 0x02]        → Programming Session    │
│          [0x50, 0x02, ...] ✓                           │
│                                                        │
│  Step 2: [0x27, 0x01]        → Request Seed           │
│          [0x67, 0x01, SEED] ✓                          │
│                                                        │
│  Step 3: [0x27, 0x02, KEY]   → Send Key               │
│          [0x67, 0x02] ✓ Unlocked!                      │
│                                                        │
│  Step 4: [0x34, ...]         → Request Download       │
│          [0x74, ...] ✓ Now works!                      │
│                                                        │
│  ⚠️ KEY POINT: Security must be unlocked AFTER         │
│     entering the session where you'll use it           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Problem 4: Can't Enter Programming Session

**Symptoms**:
```
Request:  10 02
Response: 7F 10 22  // Conditions Not Correct
```

**Root Cause**: Vehicle conditions not met

**Solution Checklist**:
- ✓ Vehicle must be stationary (speed = 0)
- ✓ Engine may need to be off (ECU-dependent)
- ✓ Ignition must be in correct position
- ✓ No other diagnostic sessions active
- ✓ Battery voltage sufficient

---

## ISO 14229-1 Reference

### Official Specification

**ISO 14229-1:2020**
- Section 9.2: DiagnosticSessionControl (0x10) service

**Key Points**:
- Mandatory service in all UDS implementations
- Subfunction parameter is required
- Response includes timing parameters (P2, P2*)
- Session timeout typically 5 seconds (configurable)

---

### Message Format (ISO)

**Request Message**:
```
┌─────────────┬──────────────────┐
│ Byte        │ Description      │
├─────────────┼──────────────────┤
│ 0           │ 0x10 (SID)       │
│ 1           │ DiagnosticSession│
│             │ Type (subfunction)│
└─────────────┴──────────────────┘
```

**Positive Response**:
```
┌─────────────┬──────────────────────────────┐
│ Byte        │ Description                  │
├─────────────┼──────────────────────────────┤
│ 0           │ 0x50 (SID + 0x40)            │
│ 1           │ DiagnosticSessionType        │
│ 2-3         │ P2 timing (high byte first)  │
│ 4-5         │ P2* timing (high byte first) │
└─────────────┴──────────────────────────────┘
```

**Negative Response**:
```
┌─────────────┬──────────────────┐
│ Byte        │ Description      │
├─────────────┼──────────────────┤
│ 0           │ 0x7F             │
│ 1           │ 0x10             │
│ 2           │ NRC              │
└─────────────┴──────────────────┘
```

---

### Supported NRCs (ISO 14229-1)

| NRC | Name | When Used |
|-----|------|-----------|
| 0x12 | subFunctionNotSupported | Invalid session type |
| 0x13 | incorrectMessageLengthOrInvalidFormat | Wrong number of bytes |
| 0x22 | conditionsNotCorrect | Vehicle conditions prevent session change |
| 0x33 | securityAccessDenied | Security required for this session |

---

## Summary

### Key Takeaways

1. **SID 10 is the gateway** - Always used to control ECU access
2. **Three main sessions**: Default (0x01), Programming (0x02), Extended (0x03)
3. **Session determines permissions** - What services are available
4. **Security resets** when changing sessions (except staying in Extended)
5. **Always start with Default** - Safest, most reliable starting point
6. **NRCs enforce rules** - Validate data, protect state, ensure safety
7. **Required for workflows** - Most multi-step operations need session changes

### Best Practices

✅ **DO**:
- Start sequences with `10 01` (Default Session)
- Verify session before using other services
- Return to Default Session when done
- Handle NRCs gracefully

❌ **DON'T**:
- Assume current session state
- Skip session control in multi-step workflows
- Ignore timing parameters in response
- Forget to handle security resets

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│           SID 10 Quick Reference                    │
├─────────────────────────────────────────────────────┤
│ Service ID: 0x10                                    │
│                                                     │
│ Subfunctions:                                       │
│   0x01 - Default Session (read-only)                │
│   0x02 - Programming Session (flash/memory)         │
│   0x03 - Extended Session (read/write/security)     │
│                                                     │
│ Request Format:  10 [subfunction]                   │
│ Response Format: 50 [subfunction] [P2] [P2*]        │
│                                                     │
│ Common NRCs:                                        │
│   0x12 - Invalid subfunction                        │
│   0x13 - Wrong message length                       │
│   0x22 - Conditions not correct                     │
│                                                     │
│ Session Requirements:                               │
│   0x27 (Security) → Extended (0x03)                 │
│   0x2E (Write Data) → Extended (0x03) + Security    │
│   0x34 (Download) → Programming (0x02) + Security   │
└─────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-11  
**ISO Reference**: ISO 14229-1:2020 Section 9.2
