# SID 0x3D (61): Write Memory By Address - Service Interactions Guide

**Document Version**: 2.0  
**Last Updated**: 2025-10-12  
**Format**: Visual Diagrams (Service Dependencies, Workflows, Sequence Diagrams)  
**ISO Reference**: ISO 14229-1:2020 Section 11.4

---

## Table of Contents

1. [Overview](#overview)
2. [Service Dependency Pyramid](#service-dependency-pyramid)
3. [Session Requirements Matrix](#session-requirements-matrix)
4. [Complete Workflow Examples](#complete-workflow-examples)
5. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
6. [Integration with Specific Services](#integration-with-specific-services)
7. [Troubleshooting Multi-Service Scenarios](#troubleshooting-multi-service-scenarios)
8. [Quick Reference Tables](#quick-reference-tables)

---

## Overview

SID 0x3D (Write Memory By Address) rarely operates in isolation. This guide shows how it interacts with other UDS services to form complete diagnostic workflows.

### Key Integration Points

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D Depends On:                              │
│    • SID 0x10 - Session Control (EXTENDED/PROGRAM) │
│    • SID 0x27 - Security Access (unlock)           │
│    • SID 0x3E - TesterPresent (keep alive)         │
│                                                    │
│  SID 0x3D Works With:                              │
│    • SID 0x23 - Read Memory (verification)         │
│    • SID 0x2E - Write Data By Identifier           │
│    • SID 0x31 - Routine Control (pre/post checks)  │
│    • SID 0x11 - ECU Reset (finalize changes)       │
│                                                    │
│  SID 0x3D Enables:                                 │
│    • Calibration workflows                         │
│    • Configuration programming                     │
│    • Manufacturing operations                      │
│    • Firmware patching (temporary)                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Service Dependency Pyramid

### Hierarchical Dependencies

```
                            ┌─────────────────┐
                            │   SID 0x3D      │
                            │ Write Memory    │
                            │                 │
                            │ (Top: Final Op) │
                            └────────┬────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
            ┌────────▼────────┐ ┌───▼────────┐ ┌───▼────────┐
            │   SID 0x27      │ │ SID 0x3E   │ │ SID 0x23   │
            │ Security Access │ │ Tester     │ │ Read Memory│
            │                 │ │ Present    │ │            │
            │ (Required)      │ │ (Optional) │ │ (Verify)   │
            └────────┬────────┘ └────────────┘ └────────────┘
                     │
            ┌────────▼────────┐
            │   SID 0x10      │
            │ Session Control │
            │                 │
            │ (Foundation)    │
            └─────────────────┘


Reading the Pyramid:
  • Bottom (SID 0x10): Must execute first
  • Middle (SID 0x27): Required before write
  • Middle (SID 0x3E): Keep session alive during ops
  • Middle (SID 0x23): Verify write success
  • Top (SID 0x3D): Final write operation
```

### Dependency Levels

```
┌─────────┬─────────────────────┬──────────────────────┐
│ Level   │ Service             │ Purpose              │
├─────────┼─────────────────────┼──────────────────────┤
│ Level 1 │ SID 0x10            │ Enable correct       │
│         │ (Session Control)   │ diagnostic session   │
├─────────┼─────────────────────┼──────────────────────┤
│ Level 2 │ SID 0x27            │ Unlock security for  │
│         │ (Security Access)   │ protected memory     │
├─────────┼─────────────────────┼──────────────────────┤
│ Level 3 │ SID 0x3E            │ Keep session active  │
│         │ (TesterPresent)     │ during long ops      │
│         │                     │                      │
│         │ SID 0x23            │ Verify written data  │
│         │ (Read Memory)       │                      │
├─────────┼─────────────────────┼──────────────────────┤
│ Level 4 │ SID 0x3D            │ Perform write        │
│         │ (Write Memory)      │ operation            │
└─────────┴─────────────────────┴──────────────────────┘
```

---

## Session Requirements Matrix

### Session Compatibility Table

```
┌──────────────────┬──────────┬──────────┬──────────┐
│ Memory Region    │ DEFAULT  │ EXTENDED │ PROGRAM  │
│                  │  (0x01)  │  (0x03)  │  (0x02)  │
├──────────────────┼──────────┼──────────┼──────────┤
│ RAM              │    ❌    │    ✅    │    ✅    │
│ (Calibration)    │          │  Level 1 │  Level 1 │
├──────────────────┼──────────┼──────────┼──────────┤
│ EEPROM           │    ❌    │    ✅    │    ✅    │
│ (Configuration)  │          │  Level 1 │  Level 1 │
├──────────────────┼──────────┼──────────┼──────────┤
│ Flash            │    ❌    │    ❌    │    ✅    │
│ (Firmware)       │          │          │  Level 3 │
├──────────────────┼──────────┼──────────┼──────────┤
│ OTP              │    ❌    │    ❌    │    ✅    │
│ (One-Time Prog)  │          │          │  Level 5 │
└──────────────────┴──────────┴──────────┴──────────┘

Legend:
  ✅ = Allowed with security unlock
  ❌ = Not allowed (returns NRC 0x7F or 0x33)
  Level X = Required security level
```

### Session Transition Impact

```
┌────────────────────────────────────────────────────┐
│            SESSION TRANSITIONS                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  DEFAULT → EXTENDED (10 03)                        │
│    • Security state: RESET (must re-unlock)        │
│    • Write capability: RAM, EEPROM enabled         │
│    • Flash writes: Still disabled                  │
│                                                    │
│  EXTENDED → PROGRAMMING (10 02)                    │
│    • Security state: RESET (must re-unlock)        │
│    • Write capability: ALL regions enabled         │
│    • Requires higher security for flash/OTP        │
│                                                    │
│  EXTENDED → EXTENDED (10 03 again)                 │
│    • Security state: PRESERVED ✓                   │
│    • Write capability: Unchanged                   │
│    • Useful for refreshing timeout                 │
│                                                    │
│  * → DEFAULT (10 01 or timeout)                    │
│    • Security state: RESET                         │
│    • Write capability: NONE                        │
│    • All writes blocked (NRC 0x7F)                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: RAM Calibration Update

```
  Tester                                    ECU
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 1: Session Setup                │
    │═══════════════════════════════════════│
    │                                        │
    │  10 03 (Extended Session)              │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  50 03 ✓                               │
    │                                        │
    │  Session: EXTENDED 🟢                  │
    │  Security: LOCKED 🔒                   │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 2: Security Unlock              │
    │═══════════════════════════════════════│
    │                                        │
    │  27 01 (Request Seed)                  │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  67 01 12 34 56 78 (Seed)              │
    │                                        │
    │  [Tester calculates key from seed]     │
    │                                        │
    │  27 02 AA BB CC DD (Send Key)          │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  67 02 ✓                               │
    │                                        │
    │  Security: UNLOCKED 🔓 (Level 1)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 3: Read Current Value           │
    │═══════════════════════════════════════│
    │                                        │
    │  23 44 20 00 10 00 00 00 00 04         │
    │  (Read 4 bytes from 0x20001000)        │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 00 00 00 64 (Current: 100)         │
    │                                        │
    │  Current calibration value: 100        │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 4: Write New Value              │
    │═══════════════════════════════════════│
    │                                        │
    │  3D 44 20 00 10 00 00 00 00 04         │
    │     00 00 00 C8                        │
    │  (Write 200 to 0x20001000)             │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7D 44 20 00 10 00 ✓                   │
    │                                        │
    │  New calibration value written: 200    │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 5: Verify Write                 │
    │═══════════════════════════════════════│
    │                                        │
    │  23 44 20 00 10 00 00 00 00 04         │
    │  (Read back to verify)                 │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 00 00 00 C8 ✓                      │
    │                                        │
    │  Verification: SUCCESS ✅              │
    │  Expected: 200, Got: 200               │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 6: Return to Default            │
    │═══════════════════════════════════════│
    │                                        │
    │  10 01 (Default Session)               │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  50 01 ✓                               │
    │                                        │
    │  Session: DEFAULT 🔵                   │
    │  Security: LOCKED 🔒 (reset)           │
    │                                        │
```

---

### Workflow 2: EEPROM Configuration Programming

```
  Tester                                    ECU
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 1: Session + Security           │
    │═══════════════════════════════════════│
    │                                        │
    │  10 03 → 50 03 ✓                       │
    │  27 01 → 67 01 [seed]                  │
    │  27 02 → 67 02 ✓                       │
    │                                        │
    │  Session: EXTENDED 🟢                  │
    │  Security: UNLOCKED 🔓 (Level 1)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 2: Write Configuration Block    │
    │═══════════════════════════════════════│
    │                                        │
    │  3D 84 08 08 00 00 00 00 00 08         │
    │     01 02 03 04 05 06 07 08            │
    │  (Write 8-byte config to EEPROM)       │
    │────────────────────────────────────>   │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Queue    │  │
    │                          │ EEPROM   │  │
    │                          │ Write    │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Write    │  │
    │                          │ (50ms)   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Verify   │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 84 08 08 00 00 ✓                   │
    │                                        │
    │  ⏱️ Response time: ~50ms (EEPROM)      │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 3: Wait for EEPROM Settle       │
    │═══════════════════════════════════════│
    │                                        │
    │  [Wait 100ms for EEPROM stabilization] │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 4: Verify Configuration         │
    │═══════════════════════════════════════│
    │                                        │
    │  23 84 08 08 00 00 00 00 00 08         │
    │  (Read back configuration)             │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 01 02 03 04 05 06 07 08 ✓          │
    │                                        │
    │  Verification: SUCCESS ✅              │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 5: Reset to Apply Config        │
    │═══════════════════════════════════════│
    │                                        │
    │  11 01 (Hard Reset)                    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  51 01 ✓                               │
    │                                        │
    │  [ECU resets and loads new config]     │
    │                                        │
```

---

### Workflow 3: Manufacturing Data Programming (OTP)

```
  Tester                                    ECU
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 1: Programming Session          │
    │═══════════════════════════════════════│
    │                                        │
    │  10 02 (Programming Session)           │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  50 02 ✓                               │
    │                                        │
    │  Session: PROGRAMMING 🔴               │
    │  Security: LOCKED 🔒                   │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 2: High Security Unlock         │
    │═══════════════════════════════════════│
    │                                        │
    │  27 0B (Request Seed - Level 5)        │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  67 0B AA BB CC DD EE FF (Seed)        │
    │                                        │
    │  [Tester calculates Level 5 key]       │
    │                                        │
    │  27 0C 11 22 33 44 55 66 (Send Key)    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  67 0C ✓                               │
    │                                        │
    │  Security: UNLOCKED 🔓 (Level 5)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 3: Verify OTP is Blank          │
    │═══════════════════════════════════════│
    │                                        │
    │  23 84 FF FF 00 00 00 00 00 10         │
    │  (Read 16 bytes from OTP region)       │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 FF FF FF FF FF FF FF FF            │
    │     FF FF FF FF FF FF FF FF            │
    │                                        │
    │  OTP Status: BLANK ✅ (all 0xFF)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 4: Write Serial Number (OTP)    │
    │═══════════════════════════════════════│
    │                                        │
    │  ⚠️  CRITICAL: This can only be done   │
    │      ONCE. Double-check data!          │
    │                                        │
    │  3D 84 FF FF 00 00 00 00 00 10         │
    │     53 4E 31 32 33 34 35 36            │
    │     37 38 39 30 41 42 43 44            │
    │  (Write "SN1234567890ABCD")            │
    │────────────────────────────────────>   │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Validate │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Program  │  │
    │                          │ OTP      │  │
    │                          │ (ONCE)   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Lock     │  │
    │                          │ Cells    │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Verify   │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 84 FF FF 00 00 ✓                   │
    │                                        │
    │  OTP Written: PERMANENT ⚠️             │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 5: Verify Serial Number         │
    │═══════════════════════════════════════│
    │                                        │
    │  23 84 FF FF 00 00 00 00 00 10         │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 53 4E 31 32 33 34 35 36            │
    │     37 38 39 30 41 42 43 44 ✓          │
    │                                        │
    │  Verification: SUCCESS ✅              │
    │  Serial: "SN1234567890ABCD"            │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 6: Reset ECU                    │
    │═══════════════════════════════════════│
    │                                        │
    │  11 01 (Hard Reset)                    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  51 01 ✓                               │
    │                                        │
    │  [ECU resets with programmed serial]   │
    │                                        │
```

---

### Workflow 4: Flash Patching (Temporary Fix)

```
  Tester                                    ECU
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 1: Programming Session Setup    │
    │═══════════════════════════════════════│
    │                                        │
    │  10 02 → 50 02 ✓                       │
    │  27 05 → 67 05 [seed]                  │
    │  27 06 → 67 06 ✓                       │
    │                                        │
    │  Session: PROGRAMMING 🔴               │
    │  Security: UNLOCKED 🔓 (Level 3)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 2: Read Current Flash Value     │
    │═══════════════════════════════════════│
    │                                        │
    │  23 44 08 00 10 00 00 00 00 04         │
    │  (Read 4 bytes from flash 0x08001000)  │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 E7 FE 07 00 (Original instruction) │
    │                                        │
    │  Original: 0xE7FE0700 (BL instruction) │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 3: Write Patched Instruction    │
    │═══════════════════════════════════════│
    │                                        │
    │  3D 44 08 00 10 00 00 00 00 04         │
    │     E7 FE 08 00                        │
    │  (Patch branch offset)                 │
    │────────────────────────────────────>   │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Erase    │  │
    │                          │ Flash    │  │
    │                          │ Sector   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Write    │  │
    │                          │ Flash    │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Verify   │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 44 08 00 10 00 ✓                   │
    │                                        │
    │  Patch Applied: TEMPORARY ⚠️           │
    │  (Lost on firmware update)             │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 4: Verify Patch                 │
    │═══════════════════════════════════════│
    │                                        │
    │  23 44 08 00 10 00 00 00 00 04         │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 E7 FE 08 00 ✓                      │
    │                                        │
    │  Verification: SUCCESS ✅              │
    │  Patched: 0xE7FE0800 (Fixed branch)    │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 5: Reset to Apply Patch         │
    │═══════════════════════════════════════│
    │                                        │
    │  11 01 (Hard Reset)                    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  51 01 ✓                               │
    │                                        │
    │  [ECU resets with patched code]        │
    │                                        │
```

---

### Workflow 5: Multi-Region Calibration Update

```
  Tester                                    ECU
    │                                        │
    │  (Session + Security already set up)   │
    │  Session: EXTENDED 🟢                  │
    │  Security: UNLOCKED 🔓 (Level 1)       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 1: Write RAM Calibration #1     │
    │═══════════════════════════════════════│
    │                                        │
    │  3D 44 20 00 10 00 00 00 00 04         │
    │     00 00 01 2C (Fuel map value: 300)  │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7D 44 20 00 10 00 ✓                   │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 2: Send TesterPresent           │
    │═══════════════════════════════════════│
    │                                        │
    │  3E 00 (Keep session alive)            │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7E 00 ✓                               │
    │                                        │
    │  S3 Timer: RESET ✅                    │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 3: Write RAM Calibration #2     │
    │═══════════════════════════════════════│
    │                                        │
    │  3D 44 20 00 20 00 00 00 00 04         │
    │     00 00 00 64 (Ignition map: 100)    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7D 44 20 00 20 00 ✓                   │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 4: Write EEPROM Configuration   │
    │═══════════════════════════════════════│
    │                                        │
    │  3E 00 (TesterPresent)                 │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7E 00 ✓                               │
    │                                        │
    │  3D 84 08 08 00 00 00 00 00 08         │
    │     01 02 03 04 05 06 07 08            │
    │  (Config block)                        │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  7D 84 08 08 00 00 ✓                   │
    │                                        │
    │  ⏱️ EEPROM write took 50ms             │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 5: Verify All Writes            │
    │═══════════════════════════════════════│
    │                                        │
    │  23 44 20 00 10 00 00 00 00 04         │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 00 00 01 2C ✓ (Fuel map OK)        │
    │                                        │
    │  23 44 20 00 20 00 00 00 00 04         │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 00 00 00 64 ✓ (Ignition OK)        │
    │                                        │
    │  23 84 08 08 00 00 00 00 00 08         │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  63 01 02 03 04 05 06 07 08 ✓          │
    │  (Config OK)                           │
    │                                        │
    │  All Writes Verified: SUCCESS ✅       │
    │                                        │
    │═══════════════════════════════════════│
    │  PHASE 6: Activate Changes             │
    │═══════════════════════════════════════│
    │                                        │
    │  31 01 FF 01 (Start Routine: Apply)    │
    │────────────────────────────────────>   │
    │  <────────────────────────────────────│
    │  71 01 FF 01 00 ✓                      │
    │                                        │
    │  Calibration Applied: ACTIVE ✅        │
    │                                        │
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Session → Security → Write → Verify

```
┌────────────────────────────────────────────────────┐
│  Pattern: Secure Write with Verification           │
├────────────────────────────────────────────────────┤
│                                                    │
│  Step 1: SID 0x10 (Change Session)                 │
│    └─> Enable write capability                     │
│                                                    │
│  Step 2: SID 0x27 (Unlock Security)                │
│    └─> Grant access to protected memory            │
│                                                    │
│  Step 3: SID 0x3D (Write Memory)                   │
│    └─> Perform actual write                        │
│                                                    │
│  Step 4: SID 0x23 (Read Memory)                    │
│    └─> Verify write success                        │
│                                                    │
│  Use Cases:                                        │
│    • Calibration updates                           │
│    • Configuration changes                         │
│    • Parameter programming                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Pattern 2: TesterPresent Integration

```
┌────────────────────────────────────────────────────┐
│  Pattern: Long Operations with Keep-Alive          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Initial Setup:                                    │
│    SID 0x10 → SID 0x27 (Session + Security)        │
│                                                    │
│  Repeated Loop:                                    │
│    ┌─────────────────────────────────┐            │
│    │ 1. SID 0x3E (TesterPresent)     │            │
│    │    └─> Reset S3 timeout          │            │
│    │                                  │            │
│    │ 2. SID 0x3D (Write Memory)       │            │
│    │    └─> Write operation           │            │
│    │                                  │            │
│    │ 3. Delay if needed (EEPROM)      │            │
│    │                                  │            │
│    │ 4. SID 0x23 (Verify)             │            │
│    │    └─> Check write               │            │
│    └─────────────────────────────────┘            │
│         │                                          │
│         └─> Repeat for multiple writes             │
│                                                    │
│  Use Cases:                                        │
│    • Batch calibration updates                     │
│    • Multi-region programming                      │
│    • Long calibration sequences                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Pattern 3: Write → Routine → Reset

```
┌────────────────────────────────────────────────────┐
│  Pattern: Write with Activation and Reset          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Step 1: SID 0x10 + 0x27 (Setup)                   │
│    └─> Session + Security                          │
│                                                    │
│  Step 2: SID 0x3D (Write Data)                     │
│    └─> Update configuration/calibration            │
│                                                    │
│  Step 3: SID 0x23 (Verify)                         │
│    └─> Confirm write success                       │
│                                                    │
│  Step 4: SID 0x31 (Start Routine)                  │
│    └─> Apply/activate changes                      │
│         Examples:                                  │
│         • Recalculate checksums                    │
│         • Apply configuration                      │
│         • Validate data integrity                  │
│                                                    │
│  Step 5: SID 0x11 (ECU Reset)                      │
│    └─> Restart with new data                       │
│                                                    │
│  Use Cases:                                        │
│    • EEPROM configuration programming              │
│    • Manufacturing data writes                     │
│    • Firmware patches                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Integration with Specific Services

### SID 0x10 (Session Control)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x10 Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Session Control Determines Write Access:          │
│                                                    │
│    DEFAULT (0x01):                                 │
│      • SID 0x3D → NRC 0x7F ❌                      │
│      • No write access                             │
│                                                    │
│    EXTENDED (0x03):                                │
│      • SID 0x3D → Allowed for RAM/EEPROM ✅        │
│      • Requires security unlock                    │
│                                                    │
│    PROGRAMMING (0x02):                             │
│      • SID 0x3D → Allowed for all regions ✅       │
│      • Higher security for flash/OTP               │
│                                                    │
│  Session Timeout Impact:                           │
│    • S3 timeout (5s) returns to DEFAULT            │
│    • SID 0x3E prevents timeout                     │
│    • Security reset on session change              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x27 (Security Access)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x27 Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Security Levels by Memory Type:                   │
│                                                    │
│    RAM Write:                                      │
│      27 01/02 (Level 1) → 3D ... ✅                │
│                                                    │
│    EEPROM Write:                                   │
│      27 01/02 (Level 1) → 3D ... ✅                │
│                                                    │
│    Flash Write:                                    │
│      27 05/06 (Level 3) → 3D ... ✅                │
│      Lower levels → NRC 0x33 ❌                    │
│                                                    │
│    OTP Write:                                      │
│      27 0B/0C (Level 5) → 3D ... ✅                │
│      Lower levels → NRC 0x33 ❌                    │
│                                                    │
│  Security State Preservation:                      │
│    • 10 03 (EXTENDED) → Preserves security         │
│    • 10 02/01 → Resets security 🔒                 │
│    • Timeout → Resets security 🔒                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x23 (Read Memory By Address)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x23 Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Write-Verify Pattern:                             │
│                                                    │
│    1. Write: 3D 44 20 00 10 00 00 00 00 04         │
│               12 34 56 78                          │
│       Response: 7D 44 20 00 10 00 ✓                │
│                                                    │
│    2. Read:  23 44 20 00 10 00 00 00 00 04         │
│       Response: 63 12 34 56 78 ✓                   │
│                                                    │
│    3. Compare: Written = Read?                     │
│       ✅ Match → Success                           │
│       ❌ Mismatch → Retry or fail                  │
│                                                    │
│  Use Same ALFID:                                   │
│    • 3D uses ALFID 0x44                            │
│    • 23 uses ALFID 0x44 (same)                     │
│    • Same address and size                         │
│                                                    │
│  Timing Consideration:                             │
│    • RAM: Immediate read-back OK                   │
│    • EEPROM: Wait 50-100ms before read             │
│    • Flash: Immediate read-back OK                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x3E (TesterPresent)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x3E Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Prevent Session Timeout During Long Operations:   │
│                                                    │
│    Scenario: Multiple EEPROM writes                │
│                                                    │
│      FOR each calibration value:                   │
│        1. Send TesterPresent (3E 00)               │
│           └─> Reset S3 timer to 5s                 │
│                                                    │
│        2. Write value (3D ...)                     │
│           └─> May take 50ms                        │
│                                                    │
│        3. Verify (23 ...)                          │
│           └─> Check write                          │
│                                                    │
│        4. Process next value                       │
│                                                    │
│  Timing Strategy:                                  │
│    • S3 timeout: 5000ms                            │
│    • Each EEPROM write: 50ms                       │
│    • Send 3E every 2-3 seconds                     │
│    • Ensures no timeout during batch writes        │
│                                                    │
│  TesterPresent Frequency:                          │
│    • Fast operations: Every 10-20 writes           │
│    • Slow operations (EEPROM): Every 2-3 writes    │
│    • Very long sequences: Every 2 seconds          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x31 (Routine Control)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x31 Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Pre-Write Routines:                               │
│    31 01 FF 00 (Prepare Memory)                    │
│      └─> Unlock write protection                   │
│      └─> Disable watchdog                          │
│      └─> Prepare memory controller                 │
│                                                    │
│  Post-Write Routines:                              │
│    31 01 FF 01 (Apply Changes)                     │
│      └─> Recalculate checksums                     │
│      └─> Validate data integrity                   │
│      └─> Activate new configuration                │
│                                                    │
│  Example Workflow:                                 │
│    1. 10 03 + 27 01/02 (Setup)                     │
│    2. 31 01 FF 00 (Prepare)                        │
│    3. 3D ... (Write data)                          │
│    4. 23 ... (Verify)                              │
│    5. 31 01 FF 01 (Apply)                          │
│    6. 11 01 (Reset)                                │
│                                                    │
│  Common Routines:                                  │
│    • 0xFF00: Prepare write                         │
│    • 0xFF01: Apply/finalize                        │
│    • 0xFF02: Validate checksum                     │
│    • 0xFF03: Restore defaults                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### SID 0x11 (ECU Reset)

```
┌────────────────────────────────────────────────────┐
│  SID 0x3D ↔ SID 0x11 Integration                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Reset After Write Operations:                     │
│                                                    │
│    EEPROM Configuration Write:                     │
│      1. Write config (3D ...)                      │
│      2. Verify (23 ...)                            │
│      3. Reset ECU (11 01)                          │
│         └─> Load new configuration                 │
│                                                    │
│    OTP Programming:                                │
│      1. Write OTP (3D ...)                         │
│      2. Verify (23 ...)                            │
│      3. Hard reset (11 01)                         │
│         └─> Lock OTP cells permanently             │
│                                                    │
│    Flash Patch:                                    │
│      1. Write patch (3D ...)                       │
│      2. Verify (23 ...)                            │
│      3. Reset (11 01)                              │
│         └─> Execute patched code                   │
│                                                    │
│  Reset Types for Write Operations:                 │
│    • 11 01 (Hard Reset): Most common               │
│    • 11 03 (Soft Reset): RAM changes only          │
│    • 11 04 (RapidPowerShutdown): Flash changes     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Troubleshooting Multi-Service Scenarios

### Problem 1: Security Works but Write Fails (NRC 0x31)

```
┌────────────────────────────────────────────────────┐
│  Symptom: Security unlocked, but write returns     │
│           NRC 0x31 (Request Out Of Range)          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Observed Sequence:                                │
│    10 03 → 50 03 ✓                                 │
│    27 01 → 67 01 ... ✓                             │
│    27 02 → 67 02 ✓ (Security unlocked)             │
│    3D 44 08 00 10 00 ... → 7F 3D 31 ❌             │
│                                                    │
│  Root Causes:                                      │
│    1. Wrong session for memory type                │
│       • Flash requires PROGRAMMING (10 02)         │
│       • Currently in EXTENDED (10 03)              │
│                                                    │
│    2. Address not writable                         │
│       • May be in ROM region                       │
│       • May be protected code area                 │
│                                                    │
│  Solutions:                                        │
│    Solution A: Switch to Programming Session       │
│      10 02 → 50 02 ✓                               │
│      27 05 → ... (Re-unlock for Level 3)           │
│      3D 44 08 00 10 00 ... → 7D ... ✓              │
│                                                    │
│    Solution B: Use RAM/EEPROM Address              │
│      3D 44 20 00 10 00 ... (RAM) → 7D ... ✓        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 2: Write Succeeds but Verification Fails

```
┌────────────────────────────────────────────────────┐
│  Symptom: Positive response from write, but        │
│           read-back shows different value          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Observed Sequence:                                │
│    3D 44 08 08 00 00 00 00 00 04                   │
│       AA BB CC DD → 7D 44 08 08 00 00 ✓            │
│                                                    │
│    23 44 08 08 00 00 00 00 00 04                   │
│       → 63 AA BB 00 00 ❌ (Last 2 bytes wrong)     │
│                                                    │
│  Root Causes:                                      │
│    1. EEPROM not settled yet                       │
│       • Read too soon after write                  │
│       • EEPROM needs 50-100ms to stabilize         │
│                                                    │
│    2. Memory corruption                            │
│       • Hardware failure                           │
│       • Voltage drop during write                  │
│                                                    │
│    3. Wrong address read                           │
│       • Typo in read address                       │
│       • Off-by-one error                           │
│                                                    │
│  Solutions:                                        │
│    Solution A: Wait for EEPROM                     │
│      3D ... (Write EEPROM)                         │
│      [Wait 100ms]                                  │
│      23 ... (Read back) → Should match now ✓       │
│                                                    │
│    Solution B: Retry Write                         │
│      3D ... (Retry write)                          │
│      23 ... (Verify again)                         │
│                                                    │
│    Solution C: Check Hardware                      │
│      • Verify battery voltage > 11.5V              │
│      • Check for memory errors                     │
│      • May need ECU replacement                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 3: Session Timeout During Batch Writes

```
┌────────────────────────────────────────────────────┐
│  Symptom: First few writes succeed, then get       │
│           NRC 0x7F or need to re-establish session │
├────────────────────────────────────────────────────┤
│                                                    │
│  Observed Sequence:                                │
│    10 03 → 50 03 ✓                                 │
│    27 01/02 → Unlocked ✓                           │
│    3D ... (Write 1) → 7D ... ✓                     │
│    3D ... (Write 2) → 7D ... ✓                     │
│    [2 seconds pass]                                │
│    3D ... (Write 3) → 7D ... ✓                     │
│    [3 more seconds pass]                           │
│    3D ... (Write 4) → 7F 3D 7F ❌                  │
│    (Session timed out after 5s total)              │
│                                                    │
│  Root Cause:                                       │
│    • S3 timeout (5000ms) expired                   │
│    • No TesterPresent sent                         │
│    • Session returned to DEFAULT                   │
│                                                    │
│  Solution: Add TesterPresent                       │
│    10 03 + 27 01/02 (Setup)                        │
│                                                    │
│    FOR each write:                                 │
│      3E 00 → 7E 00 ✓ (Reset timer)                 │
│      3D ... → 7D ... ✓ (Write)                     │
│      23 ... → 63 ... ✓ (Verify)                    │
│                                                    │
│  TesterPresent Strategy:                           │
│    • Send every 2-3 seconds                        │
│    • OR before each write operation                │
│    • Ensures S3 timer never expires                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Problem 4: Security Lost After Session Change

```
┌────────────────────────────────────────────────────┐
│  Symptom: Security unlocked, then lost after       │
│           changing session                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Observed Sequence:                                │
│    10 03 → 50 03 ✓                                 │
│    27 01/02 → Unlocked ✓ (Level 1)                 │
│    3D ... (RAM write) → 7D ... ✓                   │
│                                                    │
│    10 02 → 50 02 ✓ (Switch to PROGRAMMING)         │
│    Security: RESET 🔒                              │
│                                                    │
│    3D ... (Flash write) → 7F 3D 33 ❌              │
│    (Security access denied)                        │
│                                                    │
│  Root Cause:                                       │
│    • Changing to PROGRAMMING session resets security│
│    • Security state not preserved                  │
│                                                    │
│  Solution: Re-unlock After Session Change          │
│    10 03 → 50 03 ✓                                 │
│    27 01/02 → Unlocked ✓                           │
│    3D ... (RAM writes) → ✓                         │
│                                                    │
│    10 02 → 50 02 ✓                                 │
│    27 05/06 → Unlocked ✓ (Re-unlock Level 3)       │
│    3D ... (Flash write) → 7D ... ✓                 │
│                                                    │
│  Exception: Staying in Same Session                │
│    10 03 → 50 03 ✓                                 │
│    27 01/02 → Unlocked ✓                           │
│    10 03 → 50 03 ✓ (Same session)                  │
│    Security: PRESERVED ✓                           │
│    3D ... → 7D ... ✓ (Still works)                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Memory Region Reference

```
┌────────────┬─────────────────┬──────────┬────────────┐
│ Region     │ Address Range   │ Session  │ Security   │
├────────────┼─────────────────┼──────────┼────────────┤
│ ROM        │ 0x00000000-     │ N/A      │ N/A        │
│            │ 0x0007FFFF      │ ❌       │ ❌         │
│            │                 │ Not      │ Read-Only  │
│            │                 │ Writable │            │
├────────────┼─────────────────┼──────────┼────────────┤
│ Flash      │ 0x08000000-     │ PROGRAM  │ Level 3    │
│            │ 0x0807FFFF      │ (0x02)   │ (27 05/06) │
├────────────┼─────────────────┼──────────┼────────────┤
│ RAM        │ 0x20000000-     │ EXTENDED │ Level 1    │
│            │ 0x2001FFFF      │ (0x03)   │ (27 01/02) │
├────────────┼─────────────────┼──────────┼────────────┤
│ EEPROM     │ 0x08080000-     │ EXTENDED │ Level 1    │
│            │ 0x080807FF      │ (0x03)   │ (27 01/02) │
├────────────┼─────────────────┼──────────┼────────────┤
│ OTP        │ 0xFFFF0000-     │ PROGRAM  │ Level 5    │
│            │ 0xFFFF00FF      │ (0x02)   │ (27 0B/0C) │
└────────────┴─────────────────┴──────────┴────────────┘
```

### ALFID Quick Reference

```
┌──────┬────────┬──────────┬───────────────────┐
│ ALFID│ Addr   │ Size     │ Example Use       │
├──────┼────────┼──────────┼───────────────────┤
│ 0x11 │ 1 byte │ 1 byte   │ Small MCU test    │
│ 0x24 │ 2 bytes│ 2 bytes  │ 16-bit systems    │
│ 0x44 │ 4 bytes│ 4 bytes  │ Most common (32b) │
│ 0x48 │ 4 bytes│ 8 bytes  │ 64-bit data       │
│ 0x84 │ 4 bytes│ 8 bytes  │ Config blocks     │
│ 0xF4 │ 4 bytes│ 15 bytes │ Maximum data size │
└──────┴────────┴──────────┴───────────────────┘
```

### NRC Quick Reference

```
┌──────┬────────────────────┬──────────────────────┐
│ NRC  │ Name               │ Common Cause         │
├──────┼────────────────────┼──────────────────────┤
│ 0x13 │ Incorrect Length   │ ALFID mismatch       │
│ 0x22 │ Conditions Not OK  │ Engine running       │
│ 0x31 │ Out Of Range       │ ROM/Invalid address  │
│ 0x33 │ Security Denied    │ Not unlocked         │
│ 0x72 │ Programming Fail   │ Hardware error       │
│ 0x7F │ Not Supported      │ Wrong session        │
└──────┴────────────────────┴──────────────────────┘
```

### Related Services Quick Reference

```
┌──────┬───────────────────┬───────────────────────┐
│ SID  │ Name              │ Use with SID 0x3D     │
├──────┼───────────────────┼───────────────────────┤
│ 0x10 │ Session Control   │ Enable write access   │
│ 0x23 │ Read Memory       │ Verify write          │
│ 0x27 │ Security Access   │ Unlock protection     │
│ 0x2E │ Write DID         │ Alternative (struct)  │
│ 0x31 │ Routine Control   │ Pre/post operations   │
│ 0x3E │ TesterPresent     │ Keep session alive    │
│ 0x11 │ ECU Reset         │ Apply changes         │
└──────┴───────────────────┴───────────────────────┘
```

---

**End of SID 0x3D Service Interactions Guide**
