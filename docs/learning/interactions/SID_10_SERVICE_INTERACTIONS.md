# SID 10: Service Interaction Matrix

## Overview

This document explains how SID 10 (Diagnostic Session Control) interacts with all other UDS services, including session requirements, dependencies, and common workflows.

---

## Table of Contents

1. [Service Dependency Overview](#service-dependency-overview)
2. [Session Requirements by Service](#session-requirements-by-service)
3. [Service Interaction Patterns](#service-interaction-patterns)
4. [Complete Workflow Examples](#complete-workflow-examples)
5. [Troubleshooting Service Interactions](#troubleshooting-service-interactions)

---

## Service Dependency Overview

### Dependency Levels

```
┌────────────────────────────────────────────────────┐
│         SERVICE DEPENDENCY PYRAMID                 │
├────────────────────────────────────────────────────┤
│                                                    │
│              ┌─────────────────┐                   │
│              │  Programming    │                   │
│              │  Session (0x02) │                   │
│              │                 │                   │
│              │  • 0x34, 0x35   │                   │
│              │  • 0x36, 0x37   │                   │
│              │  • 0x3D         │                   │
│              └────────┬────────┘                   │
│                       │                            │
│         ┌─────────────┴─────────────┐              │
│         │     Extended Session      │              │
│         │        (0x03)             │              │
│         │                           │              │
│         │  • 0x27 (Security)        │              │
│         │  • 0x2E (Write Data)      │              │
│         │  • 0x31 (Routines)        │              │
│         │  • 0x14 (Clear DTC)       │              │
│         └──────────┬────────────────┘              │
│                    │                               │
│    ┌───────────────┴───────────────┐               │
│    │    Default Session (0x01)     │               │
│    │    [Always Available]         │               │
│    │                               │               │
│    │  • 0x10 (Session Control)     │               │
│    │  • 0x11 (ECU Reset)           │               │
│    │  • 0x19 (Read DTC)            │               │
│    │  • 0x22 (Read Data)           │               │
│    │  • 0x23 (Read Memory)*        │               │
│    │  • 0x28 (Communication)       │               │
│    │                               │               │
│    └───────────────────────────────┘               │
│                                                    │
│  * = May require security even in default session  │
└────────────────────────────────────────────────────┘
```

---

## Session Requirements by Service

### Level 1: Always Available (Default Session)

These services work in **ANY** session, including Default (0x01):

#### 0x10 - Diagnostic Session Control
```
Session Required: ANY (always available)
Security Required: NO
Purpose: Switch between sessions
```

**Interaction Example**:
```
┌────────────────────────────────────────────────────────┐
│ SCENARIO: Switch to Extended Session                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Current State:  DEFAULT Session                      │
│                                                        │
│  Tester → ECU:   [0x10, 0x03]                         │
│                  (Request Extended Session)           │
│                                                        │
│  ECU → Tester:   [0x50, 0x03, 0x00, 0x32, 0x01, 0xF4] │
│                  (Positive Response)                   │
│                                                        │
│  New State:      EXTENDED Session ✓                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x11 - ECU Reset
```
Session Required: DEFAULT or EXTENDED (typically)
Security Required: NO (usually)
Purpose: Reset the ECU
```

**Interaction with SID 10**:
```
┌────────────────────────────────────────────────────────┐
│ SCENARIO: ECU Reset returns to DEFAULT Session        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]    → Enter Extended Session    │
│           [0x50, 0x03, ...] ✓                          │
│           Current Session: EXTENDED                    │
│                                                        │
│  Step 2:  [0x11, 0x01]    → Hard Reset ECU            │
│           [0x51, 0x01] ✓                               │
│           [ECU Resets...]                              │
│                                                        │
│  Result:  Session automatically returns to DEFAULT    │
│           ⚠️ All session state is lost!                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x19 - Read DTC Information
```
Session Required: DEFAULT or EXTENDED
Security Required: NO
Purpose: Read diagnostic trouble codes
```

**Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Simple DTC Read                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x01]    → Default Session (optional)│
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
│  Step 2:  [0x19, 0x02, 0xFF] → Read all DTCs          │
│           [0x59, 0x02, DTC_DATA...] ✓                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x22 - Read Data By Identifier
```
Session Required: DEFAULT (most DIDs)
Security Required: NO (most DIDs)
Purpose: Read vehicle data
```

**Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Read Vehicle Data (VIN)                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x01]    → Default Session           │
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
│  Step 2:  [0x22, 0xF1, 0x90] → Read VIN (DID 0xF190)  │
│           [0x62, 0xF1, 0x90, VIN_DATA...] ✓            │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Read Protected DID                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Note: Some DIDs require Extended Session             │
│                                                        │
│  Step 1:  [0x10, 0x03]    → Extended Session          │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x22, 0xXX, 0xXX] → Read protected DID     │
│           [0x62, 0xXX, 0xXX, DATA...] ✓                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x28 - Communication Control
```
Session Required: DEFAULT or EXTENDED
Security Required: NO
Purpose: Control ECU communication
```

---

### Level 2: Extended Session Required

These services require **Extended Session (0x03)** or higher:

#### 0x27 - Security Access
```
Session Required: EXTENDED (0x03)
Security Required: NO (this service PROVIDES security)
Purpose: Unlock protected functions
```

**Always use SID 10 first**:
```
┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Trying to unlock in DEFAULT session         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tester → ECU:  [0x27, 0x01] (Request Seed)           │
│  ECU → Tester:  [0x7F, 0x27, 0x7F]                     │
│                 NRC 0x7F - Service Not Supported       │
│                 in Active Session ❌                    │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Enter Extended Session first              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]        → Extended Session      │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x27, 0x01]        → Request Seed          │
│           [0x67, 0x01, SEED] ✓                         │
│                                                        │
│  Step 3:  [0x27, 0x02, KEY]   → Send Key              │
│           [0x67, 0x02] ✓ Unlocked!                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Critical Pattern**:
```
 ALWAYS:  [0x10, 0x03] → [0x27, 0x01] → [0x27, 0x02]
 NEVER:   [0x27, 0x01] (without 0x10 0x03 first)
```

---

#### 0x2E - Write Data By Identifier
```
Session Required: EXTENDED (0x03)
Security Required: YES (most DIDs)
Purpose: Write configuration data
```

**Full Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Complete Write Sequence                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]        → Extended Session      │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x27, 0x01]        → Request Seed          │
│           [0x67, 0x01, SEED] ✓                         │
│                                                        │
│  Step 3:  [0x27, 0x02, KEY]   → Send Key              │
│           [0x67, 0x02] ✓ Unlocked!                     │
│                                                        │
│  Step 4:  [0x2E, 0xF1, 0x8C, DATA] → Write to DID     │
│           [0x6E, 0xF1, 0x8C] ✓                         │
│                                                        │
│  Step 5:  [0x10, 0x01]        → Return to Default     │
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Why this order?**
```
┌────────────────────────────────────────────────────────┐
│ SEQUENCE EXPLANATION                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1: SID 10 enables security access               │
│          → Must be in Extended Session                │
│                                                        │
│  Step 2-3: Unlock security                            │
│            → Security is required for write operations│
│                                                        │
│  Step 4: Write is now allowed                         │
│          → Both session + security requirements met   │
│                                                        │
│  Step 5: Clean up - return to safe state              │
│          → Prevents accidental writes                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x31 - Routine Control
```
Session Required: EXTENDED (0x03)
Security Required: Depends on routine
Purpose: Execute diagnostic routines
```

**Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Run Diagnostic Routine                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]        → Extended Session      │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x31, 0x01, 0x02, 0x03] → Start Routine    │
│           [0x71, 0x01, 0x02, 0x03] ✓ (Routine 0x0203) │
│                                                        │
│  Step 3:  [0x31, 0x03, 0x02, 0x03] → Get Results      │
│           [0x71, 0x03, 0x02, 0x03, RESULTS] ✓          │
│                                                        │
│  Step 4:  [0x31, 0x02, 0x02, 0x03] → Stop Routine     │
│           [0x71, 0x02, 0x02, 0x03] ✓                   │
│                                                        │
│  Step 5:  [0x10, 0x01]        → Return to Default     │
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x14 - Clear Diagnostic Information
```
Session Required: EXTENDED (0x03) [ECU-dependent]
Security Required: Sometimes
Purpose: Clear DTCs
```

**Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Clear All DTCs                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]        → Extended Session      │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x14, 0xFF, 0xFF, 0xFF] → Clear all DTCs   │
│           [0x54] ✓                                     │
│                                                        │
│  Step 3:  [0x19, 0x01, 0xFF]  → Verify (count DTCs)   │
│           [0x59, 0x01, 0x00] ✓ (0 DTCs remaining)      │
│                                                        │
│  Step 4:  [0x10, 0x01]        → Return to Default     │
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x23 - Read Memory By Address
```
Session Required: EXTENDED (0x03)
Security Required: YES
Purpose: Read ECU memory
```

**Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Read Memory by Address                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x03]        → Extended Session      │
│           [0x50, 0x03, ...] ✓                          │
│                                                        │
│  Step 2:  [0x27, 0x01]        → Request Seed          │
│           [0x67, 0x01, SEED] ✓                         │
│                                                        │
│  Step 3:  [0x27, 0x02, KEY]   → Send Key              │
│           [0x67, 0x02] ✓ Unlocked!                     │
│                                                        │
│  Step 4:  [0x23, ADDR, LEN]   → Read memory           │
│           (e.g., [0x23, 0x12, 0x34, 0x56, 0x78, 0x10]) │
│           [0x63, MEMORY_DATA...] ✓                     │
│           (Read 16 bytes from address 0x12345678)      │
│                                                        │
│  Step 5:  [0x10, 0x01]        → Return to Default     │
│           [0x50, 0x01, ...] ✓                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Level 3: Programming Session Required

These services require **Programming Session (0x02)**:

#### 0x34 - Request Download
```
Session Required: PROGRAMMING (0x02)
Security Required: YES
Purpose: Prepare for data transfer (flash)
```

**Firmware Update Workflow**:
```
┌────────────────────────────────────────────────────────┐
│ WORKFLOW: Firmware Update (Flash Programming)         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x02]        → Programming Session   │
│           [0x50, 0x02, ...] ✓                          │
│                                                        │
│  Step 2:  [0x27, 0x01]        → Request Seed          │
│           [0x67, 0x01, SEED] ✓                         │
│                                                        │
│  Step 3:  [0x27, 0x02, KEY]   → Send Key              │
│           [0x67, 0x02] ✓ Unlocked!                     │
│                                                        │
│  Step 4:  [0x34, 0x00, 0x44, ...] → Request Download  │
│           [0x74, MAX_BLOCK_SIZE] ✓                     │
│                                                        │
│  Step 5:  [0x36, 0x01, DATA]  → Transfer Data Block 1 │
│           [0x76, 0x01] ✓                               │
│                                                        │
│  Step 6:  [0x36, 0x02, DATA]  → Transfer Data Block 2 │
│           [0x76, 0x02] ✓                               │
│                                                        │
│    ...    [Continue for all blocks]                   │
│                                                        │
│  Step N:  [0x37]              → Request Transfer Exit │
│           [0x77] ✓                                     │
│                                                        │
│  Step N+1: [0x10, 0x01]       → Return to Default     │
│            [0x50, 0x01, ...] ✓                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x35 - Request Upload
```
Session Required: PROGRAMMING (0x02)
Security Required: YES
Purpose: Prepare to read flash memory
```

---

#### 0x36 - Transfer Data
```
Session Required: PROGRAMMING (0x02)
Security Required: YES (via 0x34/0x35)
Purpose: Transfer data blocks
```

**Must follow 0x34 or 0x35**:
```
┌────────────────────────────────────────────────────────┐
│ ❌ WRONG: Transfer without Request Download           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tester → ECU:  [0x36, 0x01, 0xAA, 0xBB, 0xCC]        │
│                 (Transfer Data without setup)          │
│                                                        │
│  ECU → Tester:  [0x7F, 0x36, 0x24]                     │
│                 NRC 0x24 - Request Sequence Error ❌    │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✅ CORRECT: Request Download first                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Step 1:  [0x10, 0x02]        → Programming Session   │
│           [0x50, 0x02, ...] ✓                          │
│                                                        │
│  Step 2:  [0x27, 0x01/02]     → Unlock security       │
│           [0x67, ...] ✓                                │
│                                                        │
│  Step 3:  [0x34, ...]         → Request Download      │
│           [0x74, ...] ✓                                │
│                                                        │
│  Step 4:  [0x36, 0x01, DATA]  → Transfer Data         │
│           [0x76, 0x01] ✓ Now works!                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

#### 0x37 - Request Transfer Exit
```
Session Required: PROGRAMMING (0x02)
Security Required: YES (via 0x34/0x35)
Purpose: Finalize data transfer
```

---

#### 0x3D - Write Memory By Address
```
Session Required: PROGRAMMING (0x02)
Security Required: YES
Purpose: Write directly to memory
```

---

## Service Interaction Patterns

### Pattern 1: Read-Only Diagnostic

**Services Used**: 0x10, 0x22, 0x19

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN: Read-Only Diagnostic                         │
├─────────────────────────────────────────────────────────┤
│  Session: DEFAULT (0x01)                                │
│  Security: Not Required                                 │
│  Use Case: Basic vehicle info                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WORKFLOW STEPS                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: [0x10, 0x01]     → Enter Default Session      │
│          [0x50, 0x01, ...] ✓                            │
│                                                         │
│  Step 2: [0x22, 0xF1, 0x90] → Read VIN                 │
│          [0x62, 0xF1, 0x90, VIN...] ✓                   │
│                                                         │
│  Step 3: [0x22, 0xF1, 0x87] → Read Part Number         │
│          [0x62, 0xF1, 0x87, PART_NUM...] ✓              │
│                                                         │
│  Step 4: [0x19, 0x01, 0xFF] → Count DTCs               │
│          [0x59, 0x01, COUNT] ✓                          │
│                                                         │
│  Step 5: [0x19, 0x02, 0xFF] → Read all DTCs            │
│          [0x59, 0x02, DTC_DATA...] ✓                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why this works**:
```
┌─────────────────────────────────────────────────────────┐
│  EXPLANATION                                            │
├─────────────────────────────────────────────────────────┤
│  • All services available in Default Session            │
│  • No security needed                                   │
│  • Safe operations only (read-only)                     │
└─────────────────────────────────────────────────────────┘
```

---

### Pattern 2: Write Configuration

**Services Used**: 0x10, 0x27, 0x2E

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN: Write Configuration                          │
├─────────────────────────────────────────────────────────┤
│  Session: EXTENDED (0x03)                               │
│  Security: Required                                     │
│  Use Case: Calibration, settings                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WORKFLOW STEPS                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: [0x10, 0x03]        → Extended Session        │
│          [0x50, 0x03, ...] ✓                            │
│                                                         │
│  Step 2: [0x27, 0x01]        → Request Seed            │
│          [0x67, 0x01, SEED] ✓                           │
│                                                         │
│  Step 3: [0x27, 0x02, KEY]   → Send Key                │
│          [0x67, 0x02] ✓ Unlocked!                       │
│                                                         │
│  Step 4: [0x2E, 0xF1, 0x8C, DATA] → Write config       │
│          [0x6E, 0xF1, 0x8C] ✓                           │
│                                                         │
│  Step 5: [0x22, 0xF1, 0x8C]  → Verify write            │
│          [0x62, 0xF1, 0x8C, DATA] ✓                     │
│                                                         │
│  Step 6: [0x10, 0x01]        → Return to Default       │
│          [0x50, 0x01, ...] ✓                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why this order**:
```
┌─────────────────────────────────────────────────────────┐
│  SEQUENCE EXPLANATION                                   │
├─────────────────────────────────────────────────────────┤
│  1. SID 10 (0x03) enables security service              │
│  2. SID 27 unlocks protected operations                 │
│  3. SID 2E can now write data                           │
│  4. SID 22 verifies the write                           │
│  5. SID 10 (0x01) returns to safe state                 │
└─────────────────────────────────────────────────────────┘
```

---

### Pattern 3: DTC Management

**Services Used**: 0x10, 0x19, 0x14

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN: DTC Management                                │
├─────────────────────────────────────────────────────────┤
│  Session: DEFAULT → EXTENDED                            │
│  Security: Not Required (usually)                       │
│  Use Case: Read and clear faults                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WORKFLOW STEPS                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: [0x10, 0x01]        → Default Session         │
│          [0x50, 0x01, ...] ✓                            │
│                                                         │
│  Step 2: [0x19, 0x01, 0xFF]  → Count DTCs              │
│          [0x59, 0x01, COUNT] ✓                          │
│                                                         │
│  Step 3: [0x19, 0x02, 0xFF]  → Read all DTCs           │
│          [0x59, 0x02, DTC_DATA...] ✓                    │
│                                                         │
│  Step 4: [0x10, 0x03]        → Extended Session        │
│          [0x50, 0x03, ...] ✓                            │
│                                                         │
│  Step 5: [0x14, 0xFF, 0xFF, 0xFF] → Clear all DTCs     │
│          [0x54] ✓                                       │
│                                                         │
│  Step 6: [0x19, 0x01, 0xFF]  → Verify cleared          │
│          [0x59, 0x01, 0x00] ✓ (0 DTCs)                  │
│                                                         │
│  Step 7: [0x10, 0x01]        → Return to Default       │
│          [0x50, 0x01, ...] ✓                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Session transitions**:
```
┌─────────────────────────────────────────────────────────┐
│  SESSION FLOW                                           │
├─────────────────────────────────────────────────────────┤
│  • Read DTCs in Default (safer)                         │
│  • Switch to Extended for clearing                      │
│  • Return to Default when done                          │
└─────────────────────────────────────────────────────────┘
```

---

### Pattern 4: Routine Execution

**Services Used**: 0x10, 0x27, 0x31

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN: Diagnostic Routine                            │
├─────────────────────────────────────────────────────────┤
│  Session: EXTENDED (0x03)                               │
│  Security: May be required                              │
│  Use Case: Component tests                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WORKFLOW STEPS                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: [0x10, 0x03]        → Extended Session        │
│          [0x50, 0x03, ...] ✓                            │
│                                                         │
│  Step 2: [0x27, 0x01]        → Request Seed (if needed)│
│          [0x67, 0x01, SEED] ✓                           │
│                                                         │
│  Step 3: [0x27, 0x02, KEY]   → Send Key (if needed)    │
│          [0x67, 0x02] ✓ Unlocked!                       │
│                                                         │
│  Step 4: [0x31, 0x01, 0x02, 0x03] → Start Routine      │
│          [0x71, 0x01, 0x02, 0x03] ✓                     │
│                                                         │
│  Step 5: [0x31, 0x03, 0x02, 0x03] → Request Results    │
│          [0x71, 0x03, 0x02, 0x03, RESULTS] ✓            │
│                                                         │
│  Step 6: [0x31, 0x02, 0x02, 0x03] → Stop Routine       │
│          [0x71, 0x02, 0x02, 0x03] ✓                     │
│                                                         │
│  Step 7: [0x10, 0x01]        → Return to Default       │
│          [0x50, 0x01, ...] ✓                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Pattern 5: Firmware Update

**Services Used**: 0x10, 0x27, 0x34, 0x36, 0x37, 0x11

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN: Firmware Update (Flash)                      │
├─────────────────────────────────────────────────────────┤
│  Session: PROGRAMMING (0x02)                            │
│  Security: Required                                     │
│  Use Case: ECU reprogramming                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WORKFLOW STEPS                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1:  [0x10, 0x02]        → Programming Session    │
│           [0x50, 0x02, ...] ✓                           │
│                                                         │
│  Step 2:  [0x27, 0x01]        → Request Seed           │
│           [0x67, 0x01, SEED] ✓                          │
│                                                         │
│  Step 3:  [0x27, 0x02, KEY]   → Send Key               │
│           [0x67, 0x02] ✓ Unlocked!                      │
│                                                         │
│  Step 4:  [0x34, 0x00, 0x44, ...] → Request Download   │
│           [0x74, MAX_BLOCK_SIZE] ✓                      │
│                                                         │
│  Step 5:  [0x36, 0x01, BLOCK_1] → Transfer Data        │
│           [0x76, 0x01] ✓                                │
│                                                         │
│  Step 6:  [0x36, 0x02, BLOCK_2] → Transfer Data        │
│           [0x76, 0x02] ✓                                │
│                                                         │
│   ...     [Continue for all blocks]                    │
│                                                         │
│  Step N:  [0x36, 0xXX, BLOCK_N] → Transfer Data        │
│           [0x76, 0xXX] ✓                                │
│                                                         │
│  Step N+1: [0x37]             → Request Transfer Exit  │
│            [0x77] ✓                                     │
│                                                         │
│  Step N+2: [0x11, 0x01]       → Hard Reset ECU         │
│            [0x51, 0x01] ✓                               │
│            [ECU Resets...]                              │
│                                                         │
│  Result: Session automatically returns to DEFAULT      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Critical points**:
```
┌─────────────────────────────────────────────────────────┐
│  IMPORTANT CONSIDERATIONS                               │
├─────────────────────────────────────────────────────────┤
│  • Must use Programming Session (not Extended)          │
│  • Security required before 0x34                        │
│  • Maintain proper block sequence                       │
│  • ECU reset finalizes flash                            │
└─────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Examples

### Example 1: Complete Diagnostic Scan

```
┌────────────────────────────────────────────────────────────────┐
│         WORKFLOW EXAMPLE 1: COMPLETE DIAGNOSTIC SCAN           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Objective: Read all vehicle diagnostic information            │
│  Session: DEFAULT (0x01)                                       │
│  Services Used: 0x10, 0x22, 0x19                              │
│                                                                │
│  SEQUENCE DIAGRAM:                                             │
│                                                                │
│  Tester                  ECU                                   │
│    │                      │                                    │
│    │  10 01 (Default)     │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  50 01 ... (OK)      │                                    │
│    │<─────────────────────│                                    │
│    │                      │                                    │
│    │  22 F1 90 (Read VIN) │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  62 F1 90 [VIN data] │                                    │
│    │<─────────────────────│                                    │
│    │  Result: VIN = "WBA..." stored                            │
│    │                      │                                    │
│    │  22 F1 87 (Part No)  │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  62 F1 87 [Part data]│                                    │
│    │<─────────────────────│                                    │
│    │  Result: Part = "12345" stored                            │
│    │                      │                                    │
│    │  19 01 FF (Count DTC)│                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  59 01 FF 00 03 ...  │                                    │
│    │<─────────────────────│                                    │
│    │  Result: DTC Count = 3                                    │
│    │                      │                                    │
│    │  19 02 FF (Read DTCs)│                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  59 02 [DTC list]    │                                    │
│    │<─────────────────────│                                    │
│    │  Result: DTCs stored │                                    │
│    │                      │                                    │
│                                                                │
│  RESULTS COLLECTED:                                            │
│  ✓ VIN:         WBA1234567890                                 │
│  ✓ Part No:     ECU-12345-AB                                  │
│  ✓ DTC Count:   3                                             │
│  ✓ DTCs:        P0301, P0302, P0171                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

  // Step 5: Read DTCs (0x19 service, subfunction 0x02)
  if (results.dtcCount > 0) {
    console.log('Step 5: Reading DTCs...');
    response = await simulator.processRequest({
      sid: 0x19,
      subFunction: 0x02,
      data: [0xFF],
      timestamp: Date.now()
    });
    
    if (!response.isNegative) {
      // Parse DTCs from response
      // Each DTC is 4 bytes: 3 for code, 1 for status
      const dtcData = response.data.slice(3);
      for (let i = 0; i < dtcData.length; i += 4) {
        const code = (dtcData[i] << 16) | (dtcData[i+1] << 8) | dtcData[i+2];
        const status = dtcData[i+3];
        results.dtcs.push({ code, status });
      }
    }
  }

  console.log('✓ Diagnostic scan complete');
  console.log(`  VIN: ${results.vin}`);
  console.log(`  Part Number: ${results.partNumber}`);
  console.log(`  DTCs: ${results.dtcCount}`);

  return results;
}
```

---

### Example 2: Secure Calibration Write

```
┌────────────────────────────────────────────────────────────────┐
│      WORKFLOW EXAMPLE 2: SECURE CALIBRATION WRITE              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Objective: Write configuration data with security             │
│  Session: DEFAULT → EXTENDED (0x03)                           │
│  Services Used: 0x10, 0x27, 0x2E, 0x22                        │
│                                                                │
│  SEQUENCE DIAGRAM:                                             │
│                                                                │
│  Tester                  ECU                   State           │
│    │                      │                                    │
│    │  10 03 (Extended)    │                                    │
│    │─────────────────────>│                                    │
│    │                      │  Session: EXTENDED                 │
│    │  50 03 ... (OK)      │  Security: LOCKED 🔒               │
│    │<─────────────────────│                                    │
│    │                      │                                    │
│    │  27 01 (Req Seed)    │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  67 01 AA BB CC DD   │                                    │
│    │<─────────────────────│                                    │
│    │  Seed = [AA BB CC DD]                                     │
│    │  Calculate Key...    │                                    │
│    │  Key = [55 44 33 22] │                                    │
│    │                      │                                    │
│    │  27 02 55 44 33 22   │                                    │
│    │─────────────────────>│                                    │
│    │                      │  Session: EXTENDED                 │
│    │  67 02 (Unlocked!)   │  Security: UNLOCKED 🔓             │
│    │<─────────────────────│                                    │
│    │                      │                                    │
│    │  2E F1 8C 01 02 03   │                                    │
│    │  (Write to DID F18C) │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  6E F1 8C (Write OK) │                                    │
│    │<─────────────────────│                                    │
│    │  ✓ Data written!     │                                    │
│    │                      │                                    │
│    │  22 F1 8C (Verify)   │                                    │
│    │─────────────────────>│                                    │
│    │                      │                                    │
│    │  62 F1 8C 01 02 03   │                                    │
│    │<─────────────────────│                                    │
│    │  ✓ Verified!         │                                    │
│    │                      │                                    │
│    │  10 01 (Return to    │                                    │
│    │         Default)     │                                    │
│    │─────────────────────>│                                    │
│    │                      │  Session: DEFAULT                  │
│    │  50 01 ... (OK)      │  Security: LOCKED 🔒               │
│    │<─────────────────────│  (Security auto-cleared!)          │
│    │                      │                                    │
│                                                                │
│  CRITICAL SEQUENCE REQUIREMENTS:                               │
│  1. MUST enter Extended session FIRST                          │
│  2. MUST unlock security BEFORE writing                        │
│  3. SHOULD verify write with read-back                         │
│  4. SHOULD return to Default when done                         │
│                                                                │
│  KEY CALCULATION (Example - XOR):                              │
│  Seed:  [AA, BB, CC, DD]                                       │
│  XOR:    FF  FF  FF  FF                                        │
│  Key:   [55, 44, 33, 22]                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

    // Step 5: Verify write by reading back
    console.log('Step 5: Verifying write...');
    response = await simulator.processRequest({
      sid: 0x22,
      data: didBytes,
      timestamp: Date.now()
    });
    
    if (!response.isNegative) {
      const readData = response.data.slice(3);
      const match = readData.every((byte, idx) => byte === calibrationData[idx]);
      
      if (match) {
        console.log('  ✓ Verification successful - data matches');
      } else {
        console.warn('  ⚠ Verification warning - data mismatch');
      }
    }

    // Step 6: Return to Default Session
    console.log('Step 6: Returning to Default Session...');
    await simulator.processRequest({
      sid: 0x10,
      subFunction: 0x01,
      data: [],
      timestamp: Date.now()
    });
    
    console.log('✓ Calibration write complete');
    return { success: true };

  } catch (error) {
    console.error('✗ Calibration write failed:', error);
    
    // Always return to default on error
    await simulator.processRequest({
      sid: 0x10,
      subFunction: 0x01,
      data: [],
      timestamp: Date.now()
    });
    
    return { success: false, error };
  }
}

// Helper function (XOR algorithm example)
function calculateKeyXOR(seed: number[]): number[] {
  return seed.map(byte => byte ^ 0xFF);
}
```

```

---

## Troubleshooting Service Interactions

### Problem 1: Service Not Available

```
┌────────────────────────────────────────────────────────────────┐
│         PROBLEM 1: SERVICE NOT SUPPORTED IN SESSION            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SYMPTOM:                                                      │
│  Request:  [0x2E, 0xF1, 0x90, 0x01, 0x02, 0x03]              │
│  Response: [0x7F, 0x2E, 0x7F]                                 │
│  NRC: 0x7F - Service Not Supported in Active Session          │
│                                                                │
│  DIAGNOSIS:                                                    │
│  ┌──────────────────────┐                                     │
│  │ Current State:       │                                     │
│  │ • Session: DEFAULT   │  ✓ OK                               │
│  │ • Security: LOCKED   │  ✓ OK (for DEFAULT)                 │
│  └──────────────────────┘                                     │
│  ┌──────────────────────┐                                     │
│  │ Required for 0x2E:   │                                     │
│  │ • Session: EXTENDED  │  ✗ MISSING!                         │
│  │ • Security: UNLOCKED │  ✗ MISSING!                         │
│  └──────────────────────┘                                     │
│                                                                │
│  ROOT CAUSE: Wrong session type                               │
│                                                                │
│  SOLUTION:                                                     │
│  Step 1: [0x10, 0x03]  → Enter Extended Session               │
│  Step 2: [0x27, 0x01]  → Request Seed                         │
│  Step 3: [0x27, 0x02, key...] → Unlock Security               │
│  Step 4: [0x2E, 0xF1, 0x90, ...] → Now works! ✓               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem 2: Security Access Denied

```
┌────────────────────────────────────────────────────────────────┐
│            PROBLEM 2: SECURITY ACCESS DENIED                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SYMPTOM:                                                      │
│  Request:  [0x2E, 0xF1, 0x90, 0x01, 0x02, 0x03]              │
│  Response: [0x7F, 0x2E, 0x33]                                 │
│  NRC: 0x33 - Security Access Denied                           │
│                                                                │
│  DIAGNOSIS:                                                    │
│  ┌──────────────────────┐                                     │
│  │ Current State:       │                                     │
│  │ • Session: EXTENDED  │  ✓ OK                               │
│  │ • Security: LOCKED   │  ✗ PROBLEM!                         │
│  └──────────────────────┘                                     │
│  ┌──────────────────────┐                                     │
│  │ Required for 0x2E:   │                                     │
│  │ • Session: EXTENDED  │  ✓ OK                               │
│  │ • Security: UNLOCKED │  ✗ MISSING!                         │
│  └──────────────────────┘                                     │
│                                                                │
│  ROOT CAUSE: Security not unlocked                            │
│                                                                │
│  SOLUTION:                                                     │
│  Tester              ECU                State                 │
│    │                 │                                        │
│    │  27 01          │  Request Seed                          │
│    │────────────────>│                                        │
│    │  67 01 AA BB CC DD                                       │
│    │<────────────────│  (Seed received)                       │
│    │                 │                                        │
│    │  Calculate Key: [55 44 33 22]                            │
│    │                 │                                        │
│    │  27 02 55 44 33 22                                       │
│    │────────────────>│                                        │
│    │  67 02          │  Security: UNLOCKED 🔓                 │
│    │<────────────────│                                        │
│    │                 │                                        │
│    │  2E F1 90 ...   │  Now works! ✓                          │
│    │────────────────>│                                        │
│    │  6E F1 90       │                                        │
│    │<────────────────│                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
Step 3: 27 02 XX XX XX XX  // Send Key
Step 4: 2E F1 90 01 02 03  // Now works!
```

```

---

### Problem 3: Request Sequence Error

```
┌────────────────────────────────────────────────────────────────┐
│            PROBLEM 3: REQUEST SEQUENCE ERROR                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SYMPTOM:                                                      │
│  Request:  [0x36, 0x01, 0xAA, 0xBB, 0xCC]                     │
│  Response: [0x7F, 0x36, 0x24]                                 │
│  NRC: 0x24 - Request Sequence Error                           │
│                                                                │
│  DIAGNOSIS:                                                    │
│  ┌──────────────────────────────────┐                         │
│  │ Service 0x36 (Transfer Data)     │                         │
│  │ REQUIRES prior service:          │                         │
│  │ • 0x34 (Request Download) OR     │                         │
│  │ • 0x35 (Request Upload)          │                         │
│  │                                  │                         │
│  │ Previous Request: NONE ✗         │                         │
│  └──────────────────────────────────┘                         │
│                                                                │
│  ROOT CAUSE: Missing prerequisite service                     │
│                                                                │
│  SOLUTION - Correct Sequence:                                 │
│                                                                │
│  Tester              ECU                                       │
│    │                 │                                        │
│    │  10 02          │  Programming Session                   │
│    │────────────────>│                                        │
│    │  50 02 ...      │                                        │
│    │<────────────────│                                        │
│    │                 │                                        │
│    │  27 01 / 27 02  │  Unlock Security                       │
│    │────────────────>│                                        │
│    │  67 01/02 ...   │                                        │
│    │<────────────────│                                        │
│    │                 │                                        │
│    │  34 00 44 ...   │  Request Download ✓ REQUIRED!          │
│    │────────────────>│                                        │
│    │  74 20 10       │  (Ready for transfer)                  │
│    │<────────────────│                                        │
│    │                 │                                        │
│    │  36 01 [data]   │  Transfer Data - NOW WORKS! ✓          │
│    │────────────────>│                                        │
│    │  76 01          │                                        │
│    │<────────────────│                                        │
│    │                 │                                        │
│    │  36 02 [data]   │  Transfer Data Block 2                 │
│    │────────────────>│                                        │
│    │  76 02          │                                        │
│    │<────────────────│                                        │
│                                                                │
│  KEY RULE: 0x36 ONLY works after 0x34 or 0x35                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem 4: Security Reset After Session Change

```
┌────────────────────────────────────────────────────────────────┐
│         PROBLEM 4: SECURITY RESET ON SESSION CHANGE            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SYMPTOM:                                                      │
│  Timeline of events:                                           │
│  Step 1: [0x10, 0x03] → Success (Extended Session)           │
│  Step 2: [0x27, 0x01/02] → Success (Security Unlocked)        │
│  Step 3: [0x10, 0x02] → Success (Programming Session)         │
│  Step 4: [0x34, ...] → NRC 0x33 (Security Access Denied)      │
│                                                                │
│  DIAGNOSIS:                                                    │
│                                                                │
│  State Timeline:                                               │
│  ┌────────────┬──────────┬──────────┬──────────┐             │
│  │ After Step │ Session  │ Security │ Services │             │
│  ├────────────┼──────────┼──────────┼──────────┤             │
│  │ Step 1     │ EXTENDED │ LOCKED   │ Read     │             │
│  │ Step 2     │ EXTENDED │ UNLOCKED │ All ✓    │             │
│  │ Step 3     │ PROGRAM  │ LOCKED❌  │ Limited  │             │
│  │ Step 4     │ PROGRAM  │ LOCKED   │ Fails!   │             │
│  └────────────┴──────────┴──────────┴──────────┘             │
│                                                                │
│  ROOT CAUSE: Security is RESET when changing sessions!        │
│                                                                │
│  VISUAL FLOW:                                                  │
│                                                                │
│  ┌──────────┐  10 03   ┌──────────┐  27 01/02  ┌──────────┐ │
│  │ DEFAULT  │─────────>│ EXTENDED │───────────>│ EXTENDED │ │
│  │ LOCKED🔒 │          │ LOCKED🔒 │            │UNLOCKED🔓│ │
│  └──────────┘          └──────────┘            └─────┬────┘ │
│                                                       │       │
│                                            10 02      │       │
│                                         (SESSION CHG) │       │
│                                                       ▼       │
│                                                ┌──────────┐   │
│                                                │PROGRAMNG │   │
│                                                │ LOCKED🔒 │   │
│                                                │ (RESET!) │   │
│                                                └──────────┘   │
│                                                                │
│  ⚠️ CRITICAL RULE:                                            │
│  Changing sessions ALWAYS resets security (except 10 03→10 03)│
│                                                                │
│  SOLUTION 1: Enter Programming Session FIRST                  │
│  Step 1: [0x10, 0x02]  → Programming Session                  │
│  Step 2: [0x27, 0x01/02] → Unlock Security                    │
│  Step 3: [0x34, ...] → Works! ✓                               │
│                                                                │
│  SOLUTION 2: Re-unlock after session change                   │
│  Step 1: [0x10, 0x03]  → Extended                             │
│  Step 2: [0x27, 0x01/02] → Unlock                             │
│  Step 3: [0x10, 0x02]  → Programming (security reset!)        │
│  Step 4: [0x27, 0x01/02] → Unlock AGAIN                       │
│  Step 5: [0x34, ...] → Works! ✓                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
Step 4: 34 ...    → NRC 0x33 (Security Denied)
```

**Diagnosis**:
```
┌────────────────────────────────────────────────────────────┐
│ PROBLEM IDENTIFIED                                         │
├────────────────────────────────────────────────────────────┤
│ Security was reset when changing from Extended to          │
│ Programming session                                        │
│                                                            │
│ WHY: Session changes ALWAYS reset security state!         │
└────────────────────────────────────────────────────────────┘
```

**Solution**:
```
┌────────────────────────────────────────────────────────────┐
│ SOLUTION: Enter Programming Session FIRST, then unlock    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: [0x10, 0x02]        → Programming Session        │
│          Response: [0x50, 0x02, P2, P2*]                   │
│                                                            │
│  Step 2: [0x27, 0x01]        → Request Seed               │
│          Response: [0x67, 0x01, SEED...]                   │
│                                                            │
│  Step 3: [0x27, 0x02, KEY]   → Send Key                   │
│          Response: [0x67, 0x02] ✓ Unlocked!               │
│                                                            │
│  Step 4: [0x34, ...]         → Now works! ✓               │
│          Response: [0x74, ...]                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Service Interaction Quick Reference

### Chart: Session → Available Services

```
┌──────────────┬───────────────────────────────────────────┐
│   Session    │         Available Services                │
├──────────────┼───────────────────────────────────────────┤
│              │                                           │
│   DEFAULT    │  ✓ 0x10 (Session Control)                 │
│   (0x01)     │  ✓ 0x11 (ECU Reset)                       │
│              │  ✓ 0x19 (Read DTC)                        │
│              │  ✓ 0x22 (Read Data)                       │
│              │  ✓ 0x28 (Communication Control)           │
│              │  ✗ 0x27 (Security) - need Extended        │
│              │  ✗ 0x2E (Write Data) - need Extended      │
│              │  ✗ 0x31 (Routine) - need Extended         │
│              │  ✗ 0x34-37 (Flash) - need Programming     │
│              │                                           │
├──────────────┼───────────────────────────────────────────┤
│              │                                           │
│   EXTENDED   │  ✓ All DEFAULT services                   │
│   (0x03)     │  ✓ 0x27 (Security Access)                 │
│              │  ✓ 0x2E (Write Data) + security           │
│              │  ✓ 0x31 (Routine Control)                 │
│              │  ✓ 0x14 (Clear DTC)                       │
│              │  ✓ 0x23 (Read Memory) + security          │
│              │  ✗ 0x34-37 (Flash) - need Programming     │
│              │                                           │
├──────────────┼───────────────────────────────────────────┤
│              │                                           │
│ PROGRAMMING  │  ✓ All DEFAULT services                   │
│   (0x02)     │  ✓ 0x27 (Security Access)                 │
│              │  ✓ 0x34 (Request Download) + security     │
│              │  ✓ 0x35 (Request Upload) + security       │
│              │  ✓ 0x36 (Transfer Data) + security        │
│              │  ✓ 0x37 (Transfer Exit) + security        │
│              │  ✓ 0x3D (Write Memory) + security         │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

---

## Summary

### Key Principles

1. **SID 10 is the foundation** - Always the first service in complex workflows
2. **Session determines permissions** - Each session unlocks different services
3. **Security is session-dependent** - Must unlock in the correct session
4. **Order matters** - Some services require prerequisites
5. **Always clean up** - Return to Default Session when done

### Common Patterns

```
Read-Only:     10 01 → 22/19 → (done)
Write:         10 03 → 27 → 2E → 10 01
Routine:       10 03 → 27 → 31 → 10 01
Flash:         10 02 → 27 → 34 → 36... → 37 → 11
```

### Decision Tree

```
Do you need to READ data?
  └─→ Use DEFAULT session (10 01) + Read services (22, 19)

Do you need to WRITE data?
  └─→ Use EXTENDED session (10 03) + Security (27) + Write (2E)

Do you need to FLASH firmware?
  └─→ Use PROGRAMMING session (10 02) + Security (27) + Flash services (34, 36, 37)

Do you need to RUN a routine?
  └─→ Use EXTENDED session (10 03) + possibly Security (27) + Routine (31)
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-11  
**Related Documents**:
- `SID_10_DIAGNOSTIC_SESSION_CONTROL.md` - Full SID 10 reference
- `SID_10_PRACTICAL_IMPLEMENTATION.md` - Implementation guide
