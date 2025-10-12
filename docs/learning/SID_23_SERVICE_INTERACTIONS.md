# SID 0x23: Read Memory By Address - Service Interactions

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.3

---

## Table of Contents

1. [Service Dependency Hierarchy](#service-dependency-hierarchy)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Hierarchy

### Dependency Pyramid

```
                     ┌─────────────────┐
                     │   SID 0x23      │
                     │  Read Memory    │  ← Target Service
                     └────────┬────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐             ┌─────▼──────┐
         │  SID 0x10   │             │  SID 0x27  │
         │   Session   │             │  Security  │  ← Required
         │   Control   │             │   Access   │     Services
         └──────┬──────┘             └─────┬──────┘
                │                           │
                │      ┌────────────────────┘
                │      │
         ┌──────▼──────▼──────┐
         │     SID 0x3E        │
         │  Tester Present     │  ← Supporting Service
         │  (Keep Alive)       │
         └─────────────────────┘
```

### Service Relationship Table

```
┌──────┬────────────────────┬────────────────┬──────────────────────┐
│ SID  │ Service            │ Relation       │ Purpose              │
├──────┼────────────────────┼────────────────┼──────────────────────┤
│ 0x10 │ Session Control    │ REQUIRED       │ Enable Extended Sess │
│ 0x27 │ Security Access    │ CONDITIONAL    │ Unlock protected mem │
│ 0x3E │ Tester Present     │ SUPPORTING     │ Prevent timeout      │
│ 0x3D │ Write Memory       │ COMPLEMENTARY  │ Opposite operation   │
│ 0x22 │ Read Data By ID    │ ALTERNATIVE    │ Structured read      │
│ 0x34 │ Request Download   │ ALTERNATIVE    │ Bulk data transfer   │
└──────┴────────────────────┴────────────────┴──────────────────────┘
```

---

## Session Requirements Matrix

### Session Compatibility Table

```
┌─────────────────────┬──────────┬────────────┬─────────────────────┐
│ Session Type        │ SID 0x23 │ Security   │ Typical Memory      │
│                     │ Allowed? │ Available? │ Access              │
├─────────────────────┼──────────┼────────────┼─────────────────────┤
│ Default (0x01)      │    ✗     │     ✗      │ None                │
│ Programming (0x02)  │    ✓     │     ✓      │ Full access         │
│ Extended (0x03)     │    ✓     │     ✓      │ Public + Protected  │
│ Custom (0x40-0x7F)  │ Depends  │  Depends   │ Vendor-specific     │
└─────────────────────┴──────────┴────────────┴─────────────────────┘
```

### Session State Transitions

```
┌──────────────┐   SID 0x10 0x02   ┌──────────────┐
│   DEFAULT    │──────────────────>│ PROGRAMMING  │
│    (0x01)    │                   │    (0x02)    │
└──────┬───────┘                   └──────┬───────┘
       │                                  │
       │ SID 0x10 0x03                    │ Timeout/Reset
       │                                  │
       ▼                                  ▼
┌──────────────┐   Timeout/Reset   ┌──────────────┐
│  EXTENDED    │──────────────────>│   DEFAULT    │
│    (0x03)    │                   │    (0x01)    │
└──────────────┘                   └──────────────┘

Note: SID 0x23 works in PROGRAMMING and EXTENDED sessions
```

---

## Complete Workflow Examples

### Workflow 1: Basic Public Memory Read

```
┌────────────────────────────────────────────────────────────────┐
│ WORKFLOW 1: Read Public Calibration Data                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: Read 256 bytes of public calibration data          │
│  Address: 0x00100000 (Public region, no security)             │
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │ Step 1: Enter Extended        │ State: DEFAULT            │
│    │ [10 03]                       │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Switch session          │
│    │ [50 03 00 32 01 F4]           │ State: EXTENDED           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 2: Read memory           │                           │
│    │ [23 44 00100000 00000100]     │                           │
│    │  │  │  └───┬───┘ └────┬───┘  │                           │
│    │  │  │   Address    Size       │                           │
│    │  │  └─ ALFID 0x44              │                           │
│    │  └──── SID 0x23                │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Validate request        │
│    │                               │ ✓ Session OK              │
│    │                               │ ✓ Address valid           │
│    │                               │ ✓ No security needed      │
│    │                               │ ✓ Read 256 bytes          │
│    │                               │                           │
│    │ [63 + 256 bytes of data]      │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ ✓ SUCCESS                     │                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Workflow 2: Protected Memory with Security

```
┌────────────────────────────────────────────────────────────────┐
│ WORKFLOW 2: Read Protected Flash Code                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: Read OEM flash code (requires Level 1 security)    │
│  Address: 0xFF000000 (Protected region)                       │
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │ Step 1: Enter Extended        │ State: DEFAULT            │
│    │ [10 03]                       │ Security: LOCKED 🔒       │
│    │──────────────────────────────>│                           │
│    │ [50 03 00 32 01 F4]           │ State: EXTENDED           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 2: Request Seed          │                           │
│    │ [27 01]                       │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Generate seed           │
│    │ [67 01 AB CD EF 12]           │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ (Tester calculates key        │                           │
│    │  using seed-key algorithm)    │                           │
│    │                               │                           │
│    │ Step 3: Send Key              │                           │
│    │ [27 02 12 34 56 78]           │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Validate key            │
│    │ [67 02]                       │ Security: UNLOCKED 🔓     │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 4: Read protected memory │                           │
│    │ [23 44 FF000000 00000040]     │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Security level OK       │
│    │                               │ ✓ Read 64 bytes           │
│    │ [63 + 64 bytes]               │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ ✓ SUCCESS                     │                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Workflow 3: Large Read with Tester Present

```
┌────────────────────────────────────────────────────────────────┐
│ WORKFLOW 3: Large Memory Read with Keep-Alive                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: Read 4KB data, prevent timeout during processing   │
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │ Step 1: Extended Session      │ Timeout: 5000ms           │
│    │ [10 03]                       │                           │
│    │──────────────────────────────>│                           │
│    │ [50 03 00 32 01 F4]           │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 2: Read 4KB              │ Timer: 0ms                │
│    │ [23 44 00100000 00001000]     │                           │
│    │──────────────────────────────>│                           │
│    │                               │ Reading... (slow)         │
│    │                               │ Timer: 2000ms             │
│    │                               │                           │
│    │ Step 3: Keep session alive    │                           │
│    │ [3E 80]                       │ Timer: 2000ms             │
│    │──────────────────────────────>│                           │
│    │ [7E 00]                       │ Timer: RESET to 0ms       │
│    │<──────────────────────────────│                           │
│    │                               │ Continue reading...       │
│    │                               │                           │
│    │ [63 + 4096 bytes]             │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ ✓ SUCCESS                     │                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Workflow 4: Read-Modify-Write Pattern

```
┌────────────────────────────────────────────────────────────────┐
│ WORKFLOW 4: Read-Modify-Write Calibration                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: Read calibration, modify, write back               │
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │ [10 03] Extended Session      │                           │
│    │──────────────────────────────>│                           │
│    │ [50 03 ...]                   │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ [27 01] [27 02 ...] Security  │                           │
│    │──────────────────────────────>│                           │
│    │ [67 01 ...] [67 02]           │ Security: UNLOCKED 🔓     │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 1: Read current value    │                           │
│    │ [23 44 00100000 00000004]     │                           │
│    │──────────────────────────────>│                           │
│    │ [63 AA BB CC DD]              │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ (Tester modifies:             │                           │
│    │  AA BB CC DD → 11 22 33 44)   │                           │
│    │                               │                           │
│    │ Step 2: Write modified value  │                           │
│    │ [3D 44 00100000 00000004      │                           │
│    │     11 22 33 44]              │                           │
│    │  (SID 0x3D = Write Memory)    │                           │
│    │──────────────────────────────>│                           │
│    │                               │ ✓ Write to memory         │
│    │ [7D 44 00100000 00000004]     │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Step 3: Verify write          │                           │
│    │ [23 44 00100000 00000004]     │                           │
│    │──────────────────────────────>│                           │
│    │ [63 11 22 33 44]              │                           │
│    │<──────────────────────────────│ ✓ Verified!               │
│    │                               │                           │
└────────────────────────────────────────────────────────────────┘
```

### Workflow 5: Multi-Region Read

```
┌────────────────────────────────────────────────────────────────┐
│ WORKFLOW 5: Reading from Multiple Memory Regions              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Scenario: Read from RAM, Flash, and Calibration separately   │
│                                                                │
│  Tester                           ECU                          │
│    │                               │                           │
│    │ [10 03] [27 01] [27 02]       │ Setup session + security  │
│    │──────────────────────────────>│                           │
│    │ [50 03] [67 01] [67 02]       │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Read 1: RAM (0x00300000)      │                           │
│    │ [23 44 00300000 00000100]     │                           │
│    │──────────────────────────────>│                           │
│    │ [63 + 256 bytes RAM data]     │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Read 2: Flash (0x00001000)    │                           │
│    │ [23 44 00001000 00000080]     │                           │
│    │──────────────────────────────>│                           │
│    │ [63 + 128 bytes Flash data]   │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ Read 3: Calib (0x00100000)    │                           │
│    │ [23 44 00100000 00000040]     │                           │
│    │──────────────────────────────>│                           │
│    │ [63 + 64 bytes Calib data]    │                           │
│    │<──────────────────────────────│                           │
│    │                               │                           │
│    │ ✓ All regions read            │                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Diagnostic Data Extraction

```
Purpose: Extract complete diagnostic snapshot
Services: 0x10, 0x27, 0x23, 0x19 (Read DTC)

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. [10 03] Enter Extended Session                             │
│  2. [27 01][27 02] Unlock Security                             │
│  3. [19 02 FF] Read all DTCs                                   │
│  4. [23 ...] Read fault memory buffer                          │
│  5. [23 ...] Read freeze frame data                            │
│  6. [23 ...] Read diagnostic counters                          │
│  7. [10 01] Return to Default Session                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Software Verification

```
Purpose: Verify ECU software integrity
Services: 0x10, 0x27, 0x23, 0x31 (Routine Control)

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. [10 03] Enter Extended Session                             │
│  2. [27 01][27 02] Unlock Security Level 1                     │
│  3. [23 ...] Read software version block                       │
│  4. [31 01 ...] Start checksum routine                         │
│  5. [23 ...] Read flash memory regions                         │
│  6. [31 03 ...] Get checksum result                            │
│  7. Compare local vs ECU checksums                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 3: Calibration Backup

```
Purpose: Backup all calibration data
Services: 0x10, 0x27, 0x23, 0x22 (Read Data)

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. [10 03] Enter Extended Session                             │
│  2. [22 F186] Read calibration memory layout                   │
│  3. Parse layout to get regions                                │
│  4. For each region:                                           │
│     a. [27 01][27 02] Unlock if needed                         │
│     b. [23 ...] Read region data                               │
│     c. [3E 80] Keep alive if large                             │
│  5. Save all data to file                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 4: Development Debug Session

```
Purpose: Live memory debugging during development
Services: 0x10, 0x27, 0x23, 0x2E (Write Data), 0x3E

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. [10 03] Enter Extended Session                             │
│  2. [27 01][27 02] Unlock Security                             │
│  3. Loop:                                                      │
│     a. [23 ...] Read debug variables                           │
│     b. Display in debugger UI                                  │
│     c. [3E 80] Keep session alive                              │
│     d. User modifies variables in UI                           │
│     e. [2E ...] Write modified variables                       │
│     f. Wait for next polling interval                          │
│  4. On exit: [10 01] Return to Default                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 5: Firmware Update Verification

```
Purpose: Verify firmware after flash programming
Services: 0x10, 0x27, 0x34, 0x36, 0x37, 0x23

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. [10 02] Enter Programming Session                          │
│  2. [27 01][27 02] Unlock Programming Security                 │
│  3. [34 ...] Request Download                                  │
│  4. [36 ...] Transfer Data (firmware blocks)                   │
│  5. [37] Request Transfer Exit                                 │
│  6. [31 01 ...] Start programming routine                      │
│  7. [10 03] Switch to Extended Session                         │
│  8. [23 ...] Read programmed memory                            │
│  9. Verify CRC/checksum                                        │
│ 10. [11 01] ECU Reset                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Intermittent NRC 0x22

```
┌────────────────────────────────────────────────────────────────┐
│ PROBLEM: Randomly getting NRC 0x22 (Conditions Not Correct)   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Diagnostic Flow:                                               │
│                                                                │
│       ┌────────────────────┐                                   │
│       │ NRC 0x22 received  │                                   │
│       └────────┬───────────┘                                   │
│                │                                               │
│                ▼                                               │
│       ┌────────────────────┐                                   │
│       │ Check: Session     │                                   │
│   ┌───┤ still Extended?    │───┐                               │
│   │   └────────────────────┘   │                               │
│  Yes                           No──► SESSION TIMEOUT            │
│   │                             │   FIX: Add [3E 80] periodic   │
│   │                             │   keep-alive every 2-3s       │
│   ▼                             │                               │
│ ┌────────────────────┐          │                               │
│ │ Check: ECU voltage │          │                               │
│ │ in range?          │          │                               │
│ └────────┬───────────┘          │                               │
│          │                      │                               │
│         No──► VOLTAGE ISSUE     │                               │
│          │    FIX: Stabilize    │                               │
│          │    power supply      │                               │
│         Yes                     │                               │
│          │                      │                               │
│          ▼                      │                               │
│ ┌────────────────────┐          │                               │
│ │ Check: ECU not in  │          │                               │
│ │ critical operation?│          │                               │
│ └────────┬───────────┘          │                               │
│          │                      │                               │
│         No──► ECU BUSY          │                               │
│               FIX: Wait & retry │                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: NRC 0x31 on Valid Address

```
┌────────────────────────────────────────────────────────────────┐
│ PROBLEM: Getting NRC 0x31 but address appears valid           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Diagnostic Checklist:                                          │
│                                                                │
│  ☐ Issue: Read size spans region boundary                     │
│    Example: addr=0x000FFFF0, size=0x20                         │
│    Fix: Split into two reads at boundary                       │
│                                                                │
│  ☐ Issue: Integer overflow                                    │
│    Example: addr=0xFFFFFF00, size=0x200                        │
│    Fix: Reduce size or use different address                   │
│                                                                │
│  ☐ Issue: Region not readable in current session              │
│    Example: Bootloader region needs Programming session        │
│    Fix: [10 02] switch to Programming session                  │
│                                                                │
│  ☐ Issue: Vendor-specific memory map                          │
│    Example: ECU has custom reserved regions                    │
│    Fix: Consult ECU memory map documentation                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: NRC 0x33 After Successful Unlock

```
┌────────────────────────────────────────────────────────────────┐
│ PROBLEM: Security unlocked but still getting NRC 0x33         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Timeline Analysis:                                             │
│                                                                │
│  T=0s    [27 01] Request seed                                  │
│  T=0.1s  [67 01 ...] Receive seed                              │
│  T=5s    Calculate key (SLOW!)                                 │
│  T=5.1s  [27 02 ...] Send key                                  │
│  T=5.2s  [7F 27 37] NRC 0x37 (Timeout)                         │
│                                                                │
│  Root Cause: Key calculation took too long                     │
│  Security timeout: 5000ms                                      │
│                                                                │
│  Fix 1: Optimize key calculation algorithm                     │
│  Fix 2: Request new seed, respond faster                       │
│  Fix 3: Check ECU timeout configuration                        │
│                                                                │
│  Alternative Issue: Wrong security level                       │
│   - Memory needs Level 2, only unlocked Level 1                │
│   - Fix: [27 03][27 04] Unlock higher level                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Common ALFID Values

```
┌──────────┬────────────┬──────────┬─────────────────────────────┐
│ ALFID    │ Addr Bytes │ Size Byt │ Example Use Case            │
├──────────┼────────────┼──────────┼─────────────────────────────┤
│ 0x11     │ 1          │ 1        │ Tiny 8-bit systems          │
│ 0x22     │ 2          │ 2        │ 16-bit MCUs                 │
│ 0x24     │ 4          │ 2        │ 32-bit addr, small reads    │
│ 0x33     │ 3          │ 3        │ 24-bit systems              │
│ 0x44     │ 4          │ 4        │ Standard 32-bit ECUs        │
│ 0x48     │ 8          │ 4        │ 64-bit addr, medium reads   │
│ 0x88     │ 8          │ 8        │ Full 64-bit systems         │
└──────────┴────────────┴──────────┴─────────────────────────────┘
```

### Typical Memory Regions

```
┌───────────────┬──────────────┬──────────┬─────────────────────┐
│ Region        │ Address      │ Security │ Session Required    │
├───────────────┼──────────────┼──────────┼─────────────────────┤
│ RAM           │ 0x00300000   │ None     │ Extended            │
│ Public Calib  │ 0x00100000   │ None     │ Extended            │
│ Flash Code    │ 0x00001000   │ Level 1  │ Extended + Unlock   │
│ OEM Calib     │ 0x00120000   │ Level 1  │ Extended + Unlock   │
│ Security Keys │ 0xFF000000   │ Level 2  │ Programming + Unloc │
│ Bootloader    │ 0xFFFF0000   │ Level 3  │ Programming + Unloc │
└───────────────┴──────────────┴──────────┴─────────────────────┘
```

### NRC Quick Lookup

```
┌──────┬─────────────────────┬─────────────────────────────────┐
│ NRC  │ Common Cause        │ Quick Fix                       │
├──────┼─────────────────────┼─────────────────────────────────┤
│ 0x13 │ ALFID mismatch      │ Check message length matches    │
│      │                     │ ALFID specification             │
├──────┼─────────────────────┼─────────────────────────────────┤
│ 0x22 │ Wrong session       │ [10 03] Enter Extended session  │
│      │ Session timeout     │ Add [3E 80] keep-alive          │
├──────┼─────────────────────┼─────────────────────────────────┤
│ 0x31 │ Invalid address     │ Check memory map, reduce size   │
│      │ Overflow            │ Split read at boundaries        │
├──────┼─────────────────────┼─────────────────────────────────┤
│ 0x33 │ Not unlocked        │ [27 01][27 02] Unlock security  │
│      │ Security timeout    │ Respond to seed faster          │
├──────┼─────────────────────┼─────────────────────────────────┤
│ 0x72 │ Hardware error      │ Check ECU health, retry         │
│      │ ECC/parity error    │ Memory may be corrupted         │
└──────┴─────────────────────┴─────────────────────────────────┘
```

### Timing Requirements

```
┌──────────────────────┬────────────┬──────────────────────────┐
│ Timing Parameter     │ Typical    │ Notes                    │
├──────────────────────┼────────────┼──────────────────────────┤
│ P2 (response time)   │ 50ms       │ Normal request response  │
│ P2* (enhanced)       │ 500ms      │ For slow operations      │
│ Session timeout      │ 5000ms     │ Reset with each request  │
│ Security timeout     │ 5000ms     │ From seed to key         │
│ Max read size        │ 4095 bytes │ Depends on ECU buffer    │
└──────────────────────┴────────────┴──────────────────────────┘
```

---

## Summary

### Integration Checklist

```
┌────────────────────────────────────────────────────────────────┐
│              SID 0x23 INTEGRATION CHECKLIST                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  PREREQUISITES                                                 │
│   ☐ ECU supports Extended Diagnostic Session (0x03)            │
│   ☐ Memory map documented with regions and permissions         │
│   ☐ Security seed-key algorithm available (if needed)          │
│   ☐ ALFID format determined based on address space             │
│                                                                │
│  INTEGRATION STEPS                                             │
│   ☐ Test basic read in Extended session (public memory)        │
│   ☐ Test security unlock sequence for protected memory         │
│   ☐ Implement keep-alive for long operations                   │
│   ☐ Handle all NRCs gracefully with retry logic                │
│   ☐ Validate against memory map boundaries                     │
│   ☐ Test session timeout recovery                              │
│   ☐ Test security timeout scenarios                            │
│                                                                │
│  COMMON PATTERNS                                               │
│   ☐ Use with SID 0x3D for read-modify-write                    │
│   ☐ Combine with SID 0x22 for structured+raw data              │
│   ☐ Add SID 0x3E keep-alive for large transfers                │
│   ☐ Pair with SID 0x31 for checksum verification               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x23 Service Interactions Guide**
