# SID 0x3D (61): Write Memory By Address - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: 2025-10-12  
**Format**: Visual Diagrams (Flowcharts, State Machines, Decision Trees)  
**ISO Reference**: ISO 14229-1:2020 Section 11.4

---

## Table of Contents

1. [Overview](#overview)
2. [Request Processing Flowchart](#request-processing-flowchart)
3. [ALFID Parsing and Validation](#alfid-parsing-and-validation)
4. [Memory Address Validation](#memory-address-validation)
5. [Security Check Decision Tree](#security-check-decision-tree)
6. [Write Operation State Machine](#write-operation-state-machine)
7. [NRC Decision Trees](#nrc-decision-trees)
8. [Memory Write Workflows](#memory-write-workflows)
9. [Write Verification Logic](#write-verification-logic)
10. [Testing Scenarios](#testing-scenarios)
11. [Debugging Flowcharts](#debugging-flowcharts)
12. [Best Practices Checklist](#best-practices-checklist)

---

## Overview

This guide provides **implementation-focused** visual diagrams for building a robust SID 0x3D (Write Memory By Address) handler. All examples use **flowcharts, state machines, and decision trees** - no programming code.

---

## Request Processing Flowchart

### Complete Write Request Flow

```
                    ┌──────────────────┐
                    │ Receive Request  │
                    │   (SID 0x3D)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Parse ALFID Byte │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────────┐
                 ┌──┤ ALFID Valid?         │──┐
                 │  └──────────────────────┘  │
                NO                           YES
                 │                             │
                 ▼                             ▼
         ┌───────────────┐          ┌─────────────────┐
         │  Return       │          │ Extract Address │
         │  NRC 0x13     │          │ Size from ALFID │
         └───────────────┘          └────────┬────────┘
                                              │
                                     ┌────────▼─────────────┐
                                     │ Extract Memory Size  │
                                     │ from ALFID           │
                                     └────────┬─────────────┘
                                              │
                                     ┌────────▼───────────────┐
                                  ┌──┤ Message Length OK?     │──┐
                                  │  └────────────────────────┘  │
                                 NO                             YES
                                  │                               │
                                  ▼                               ▼
                          ┌───────────────┐          ┌──────────────────┐
                          │  Return       │          │ Extract Address  │
                          │  NRC 0x13     │          │ (N bytes)        │
                          └───────────────┘          └────────┬─────────┘
                                                               │
                                                      ┌────────▼──────────┐
                                                      │ Extract Size      │
                                                      │ (M bytes)         │
                                                      └────────┬──────────┘
                                                               │
                                                      ┌────────▼──────────┐
                                                      │ Extract Data      │
                                                      │ (Size bytes)      │
                                                      └────────┬──────────┘
                                                               │
                                                      ┌────────▼─────────────┐
                                                   ┌──┤ Session Valid?       │──┐
                                                   │  └──────────────────────┘  │
                                                  NO                           YES
                                                   │                             │
                                                   ▼                             ▼
                                           ┌───────────────┐          ┌─────────────────┐
                                           │  Return       │          │ Check Security  │
                                           │  NRC 0x7F     │          │ State           │
                                           └───────────────┘          └────────┬────────┘
                                                                                │
                                                                       ┌────────▼──────────────┐
                                                                    ┌──┤ Security Unlocked?    │──┐
                                                                    │  └───────────────────────┘  │
                                                                   NO                           YES
                                                                    │                             │
                                                                    ▼                             ▼
                                                            ┌───────────────┐          ┌──────────────────┐
                                                            │  Return       │          │ Validate Address │
                                                            │  NRC 0x33     │          │ Range            │
                                                            └───────────────┘          └────────┬─────────┘
                                                                                                 │
                                                                                        ┌────────▼───────────┐
                                                                                     ┌──┤ Address Valid?     │──┐
                                                                                     │  └────────────────────┘  │
                                                                                    NO                         YES
                                                                                     │                           │
                                                                                     ▼                           ▼
                                                                             ┌───────────────┐        ┌──────────────┐
                                                                             │  Return       │        │ Check Write  │
                                                                             │  NRC 0x31     │        │ Conditions   │
                                                                             └───────────────┘        └──────┬───────┘
                                                                                                             │
                                                                                                    ┌────────▼──────────┐
                                                                                                 ┌──┤ Conditions OK?    │──┐
                                                                                                 │  └───────────────────┘  │
                                                                                                NO                        YES
                                                                                                 │                          │
                                                                                                 ▼                          ▼
                                                                                         ┌───────────────┐        ┌──────────────┐
                                                                                         │  Return       │        │ WRITE MEMORY │
                                                                                         │  NRC 0x22     │        └──────┬───────┘
                                                                                         └───────────────┘               │
                                                                                                                ┌────────▼────────┐
                                                                                                             ┌──┤ Write Success?  │──┐
                                                                                                             │  └─────────────────┘  │
                                                                                                            NO                     YES
                                                                                                             │                       │
                                                                                                             ▼                       ▼
                                                                                                     ┌───────────────┐     ┌──────────────┐
                                                                                                     │  Return       │     │ Return       │
                                                                                                     │  NRC 0x72     │     │ 7D + ALFID   │
                                                                                                     └───────────────┘     │ + Address    │
                                                                                                                           └──────────────┘
```

---

## ALFID Parsing and Validation

### ALFID Extraction Flowchart

```
         ┌───────────────────┐
         │ ALFID Byte        │
         │ (e.g., 0x44)      │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ Split into Nibbles│
         └─────────┬─────────┘
                   │
         ┌─────────▼────────────────────┐
         │ High Nibble (bits 7-4) → A   │
         │ Low Nibble (bits 3-0) → B    │
         └─────────┬────────────────────┘
                   │
         ┌─────────▼─────────────────────┐
         │ addressSize = B (0-15 bytes)  │
         │ memorySize = A (0-15 bytes)   │
         └─────────┬─────────────────────┘
                   │
         ┌─────────▼──────────┐
      ┌──┤ A > 0 AND B > 0?   │──┐
      │  └────────────────────┘  │
     NO                         YES
      │                           │
      ▼                           ▼
┌────────────┐             ┌───────────┐
│ NRC 0x13   │             │ VALID ✓   │
│ (Invalid)  │             └───────────┘
└────────────┘
```

### ALFID Examples

```
Example 1: ALFID 0x44

  Binary: 0100 0100
          └──┬──┘ └─┬─┘
             A=4    B=4
  
  Result:
    addressSize = 4 bytes
    memorySize  = 4 bytes
    
  ✅ Valid


Example 2: ALFID 0x84

  Binary: 1000 0100
          └──┬──┘ └─┬─┘
             A=8    B=4
  
  Result:
    addressSize = 4 bytes
    memorySize  = 8 bytes
    
  ✅ Valid


Example 3: ALFID 0x00

  Binary: 0000 0000
          └──┬──┘ └─┬─┘
             A=0    B=0
  
  Result:
    addressSize = 0 bytes ❌
    memorySize  = 0 bytes ❌
    
  ❌ Invalid → NRC 0x13
```

### Message Length Validation

```
         ┌──────────────────────────────┐
         │ Calculate Expected Length:   │
         │                              │
         │ Expected = 1 (SID)           │
         │          + 1 (ALFID)         │
         │          + addressSize       │
         │          + memorySize        │
         │          + dataSize          │
         └──────────────┬───────────────┘
                        │
         ┌──────────────▼──────────────┐
      ┌──┤ Actual Length = Expected?   │──┐
      │  └─────────────────────────────┘  │
     NO                                  YES
      │                                    │
      ▼                                    ▼
┌─────────────┐                    ┌────────────┐
│ NRC 0x13    │                    │ Valid ✓    │
└─────────────┘                    └────────────┘


Example: ALFID 0x44, Write 4 bytes to 4-byte address

Request: 3D 44 20 00 10 00 00 00 00 04 12 34 56 78
         │  │  └────┬────┘ └────┬────┘ └────┬────┘
         │  │     Addr(4)    Size(4)     Data(4)
         │  │
         │  ALFID
         SID

Expected Length:
  1 (SID) + 1 (ALFID) + 4 (Addr) + 4 (Size) + 4 (Data) = 14 bytes

Actual Length: 14 bytes

✅ MATCH → Continue processing
```

---

## Memory Address Validation

### Address Range Check Flowchart

```
         ┌──────────────────┐
         │ Extracted Address│
         │ (e.g., 0x20001000)│
         └────────┬─────────┘
                  │
         ┌────────▼──────────┐
      ┌──┤ Address in Memory │──┐
      │  │ Map?               │  │
      │  └────────────────────┘  │
     NO                         YES
      │                           │
      ▼                           ▼
┌────────────┐          ┌─────────────────┐
│ NRC 0x31   │          │ Determine Region│
└────────────┘          │ Type            │
                        └────────┬────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Check Region Type│
                        └────────┬─────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │   ROM    │        │   RAM    │        │ EEPROM   │
      └────┬─────┘        └────┬─────┘        └────┬─────┘
           │                   │                    │
           ▼                   ▼                    ▼
      ┌──────────┐        ┌──────────┐        ┌──────────┐
      │ NRC 0x31 │        │ Writable │        │ Writable │
      │(Read-Only)│       │  ✓       │        │  ✓       │
      └──────────┘        └────┬─────┘        └────┬─────┘
                               │                    │
                               └──────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                              ┌──┤ Address + Size   │──┐
                              │  │ Within Region?   │  │
                              │  └──────────────────┘  │
                             NO                       YES
                              │                         │
                              ▼                         ▼
                        ┌────────────┐          ┌────────────┐
                        │ NRC 0x31   │          │ Valid ✓    │
                        │ (Overflow) │          └────────────┘
                        └────────────┘
```

### Region Boundary Validation

```
Example: Memory Map

┌───────────────────────────────────────────┐
│ 0x00000000 - 0x0007FFFF │ ROM (512KB)     │ ❌ Read-Only
│ 0x08000000 - 0x0807FFFF │ Flash (512KB)   │ ⚠️ Restricted
│ 0x20000000 - 0x2001FFFF │ RAM (128KB)     │ ✅ Writable
│ 0x08080000 - 0x080807FF │ EEPROM (2KB)    │ ✅ Writable
└───────────────────────────────────────────┘


Test Case 1: Valid RAM Write
  Address: 0x20001000
  Size:    0x00000004 (4 bytes)
  End:     0x20001003
  
  Check: 0x20000000 ≤ 0x20001000 ≤ 0x2001FFFF ✓
  Check: 0x20000000 ≤ 0x20001003 ≤ 0x2001FFFF ✓
  
  Result: ✅ Valid


Test Case 2: ROM Write Attempt
  Address: 0x00000100
  Size:    0x00000004
  
  Region: ROM (0x00000000 - 0x0007FFFF)
  
  Result: ❌ NRC 0x31 (ROM is read-only)


Test Case 3: Overflow Beyond Region
  Address: 0x2001FFFE
  Size:    0x00000004 (4 bytes)
  End:     0x20020001
  
  Check: 0x20020001 > 0x2001FFFF ❌
  
  Result: ❌ NRC 0x31 (Exceeds RAM boundary)
```

---

## Security Check Decision Tree

### Security Validation Logic

```
                    ┌─────────────────────┐
                    │ Get Memory Region   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Determine Required  │
                    │ Security Level      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │   RAM    │         │ EEPROM   │         │  Flash   │
    │ Level 1  │         │ Level 1  │         │ Level 3  │
    └────┬─────┘         └────┬─────┘         └────┬─────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                   ┌──────────▼───────────┐
                ┌──┤ Current Security ≥   │──┐
                │  │ Required Security?   │  │
                │  └──────────────────────┘  │
               NO                           YES
                │                             │
                ▼                             ▼
        ┌───────────────┐            ┌───────────────┐
        │  NRC 0x33     │            │  Proceed to   │
        │(Access Denied)│            │  Write        │
        └───────────────┘            └───────────────┘
```

### Security Level Matrix

```
┌────────────────┬────────────────┬────────────────┐
│ Memory Region  │ Required Level │ Session        │
├────────────────┼────────────────┼────────────────┤
│ RAM            │ Level 1 🔒     │ EXTENDED       │
│ EEPROM         │ Level 1 🔒     │ EXTENDED       │
│ Flash          │ Level 3 🔒🔒🔒  │ PROGRAMMING    │
│ OTP            │ Level 5 🔒🔒🔒🔒🔒│ PROGRAMMING   │
└────────────────┴────────────────┴────────────────┘


Decision Example:

Request: Write to Flash (0x08001000)
Current Security: Level 1 (unlocked)
Required Security: Level 3

Check: Level 1 < Level 3 ❌

Result: NRC 0x33 (Security Access Denied)


Solution:
  1. Unlock Level 3 security: 27 05/06
  2. Retry write: 3D ...
```

---

## Write Operation State Machine

### Memory Write State Transitions

```
         ┌──────────────────┐
         │      IDLE        │
         │  (No operation)  │
         └────────┬─────────┘
                  │
        Receive Write Request
                  │
                  ▼
         ┌──────────────────┐
         │   VALIDATING     │
         │  (Check request) │
         └────────┬─────────┘
                  │
            ┌─────┴─────┐
           Valid     Invalid
            │             │
            ▼             ▼
   ┌──────────────┐  ┌─────────┐
   │  WRITING     │  │ REJECT  │
   │ (Perform op) │  │(Return  │
   └──────┬───────┘  │ NRC)    │
          │          └────┬────┘
          │               │
     ┌────┴────┐          │
  Success   Failure       │
     │         │          │
     ▼         ▼          │
┌─────────┐┌────────┐    │
│VERIFYING││ FAILED │    │
│(Check   ││(Return │    │
│ write)  ││ NRC)   │    │
└────┬────┘└───┬────┘    │
     │         │         │
Match Mismatch │         │
     │         │         │
     ▼         ▼         │
┌─────────┐┌────────┐   │
│SUCCESS  ││ FAILED │   │
│(Return  ││(Retry  │   │
│ 7D)     ││ or NRC)│   │
└────┬────┘└───┬────┘   │
     │         │        │
     └─────────┴────────┴────────┐
                                 │
                                 ▼
                        ┌──────────────┐
                        │    IDLE      │
                        └──────────────┘
```

### State Descriptions

```
┌────────────────────────────────────────────────────┐
│ IDLE → VALIDATING                                  │
│   Trigger: Receive Write Request (0x3D)            │
│   Actions:                                         │
│     • Parse ALFID                                  │
│     • Extract address, size, data                  │
│     • Validate message length                      │
├────────────────────────────────────────────────────┤
│ VALIDATING → WRITING (Valid)                       │
│   Conditions:                                      │
│     • ALFID valid ✓                                │
│     • Session correct ✓                            │
│     • Security unlocked ✓                          │
│     • Address valid ✓                              │
│     • Conditions OK ✓                              │
├────────────────────────────────────────────────────┤
│ VALIDATING → REJECT (Invalid)                      │
│   Any validation fails                             │
│   Return appropriate NRC                           │
├────────────────────────────────────────────────────┤
│ WRITING → VERIFYING (Success)                      │
│   Memory write completed                           │
│   Read back data for verification                  │
├────────────────────────────────────────────────────┤
│ WRITING → FAILED (Failure)                         │
│   Hardware error during write                      │
│   Return NRC 0x72                                  │
├────────────────────────────────────────────────────┤
│ VERIFYING → SUCCESS (Match)                        │
│   Written data = Read data                         │
│   Return positive response (7D)                    │
├────────────────────────────────────────────────────┤
│ VERIFYING → FAILED (Mismatch)                      │
│   Written data ≠ Read data                         │
│   Retry (up to 3x) or return NRC 0x72              │
└────────────────────────────────────────────────────┘
```

---

## NRC Decision Trees

### NRC Selection Logic

```
                        ┌──────────────┐
                        │ Write Request│
                        └──────┬───────┘
                               │
                    ┌──────────▼──────────┐
                 ┌──┤ Message Length OK?   │──┐
                 │  └─────────────────────┘  │
                NO                          YES
                 │                            │
                 ▼                            │
         ┌───────────────┐                   │
         │  NRC 0x13     │                   │
         │ (Bad Length)  │                   │
         └───────────────┘                   │
                                             │
                                   ┌─────────▼──────────┐
                                ┌──┤ Session Correct?   │──┐
                                │  └────────────────────┘  │
                               NO                        YES
                                │                          │
                                ▼                          │
                        ┌───────────────┐                 │
                        │  NRC 0x7F     │                 │
                        │(Wrong Session)│                 │
                        └───────────────┘                 │
                                                          │
                                                ┌─────────▼──────────┐
                                             ┌──┤ Security Unlocked? │──┐
                                             │  └────────────────────┘  │
                                            NO                        YES
                                             │                          │
                                             ▼                          │
                                     ┌───────────────┐                 │
                                     │  NRC 0x33     │                 │
                                     │(Security Deny)│                 │
                                     └───────────────┘                 │
                                                                       │
                                                             ┌─────────▼─────────┐
                                                          ┌──┤ Address Valid?    │──┐
                                                          │  └───────────────────┘  │
                                                         NO                       YES
                                                          │                         │
                                                          ▼                         │
                                                  ┌───────────────┐                │
                                                  │  NRC 0x31     │                │
                                                  │(Out of Range) │                │
                                                  └───────────────┘                │
                                                                                   │
                                                                         ┌─────────▼─────────┐
                                                                      ┌──┤ Conditions OK?    │──┐
                                                                      │  └───────────────────┘  │
                                                                     NO                       YES
                                                                      │                         │
                                                                      ▼                         │
                                                              ┌───────────────┐                │
                                                              │  NRC 0x22     │                │
                                                              │(Conditions)   │                │
                                                              └───────────────┘                │
                                                                                               │
                                                                                     ┌─────────▼─────────┐
                                                                                     │ Perform Write     │
                                                                                     └─────────┬─────────┘
                                                                                               │
                                                                                     ┌─────────▼─────────┐
                                                                                  ┌──┤ Write Success?    │──┐
                                                                                  │  └───────────────────┘  │
                                                                                 NO                       YES
                                                                                  │                         │
                                                                                  ▼                         ▼
                                                                          ┌───────────────┐        ┌────────────┐
                                                                          │  NRC 0x72     │        │  7D (OK)   │
                                                                          │(Program Fail) │        └────────────┘
                                                                          └───────────────┘
```

---

## Memory Write Workflows

### RAM Write Workflow

```
  Tester                                    ECU
    │                                        │
    │  STEP 1: Extended Session              │
    │────────────────────────────────────>   │
    │  10 03                                 │
    │  <────────────────────────────────────│
    │  50 03 ✓                               │
    │                                        │
    │  STEP 2: Security Unlock (Level 1)     │
    │────────────────────────────────────>   │
    │  27 01                                 │
    │  <────────────────────────────────────│
    │  67 01 12 34 56 78 (Seed)              │
    │────────────────────────────────────>   │
    │  27 02 AA BB CC DD (Key)               │
    │  <────────────────────────────────────│
    │  67 02 ✓                               │
    │                                        │
    │  Security: 🔓 UNLOCKED (Level 1)       │
    │                                        │
    │  STEP 3: Write to RAM                  │
    │────────────────────────────────────>   │
    │  3D 44 20 00 10 00 00 00 00 04         │
    │     12 34 56 78                        │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Validate │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Write   │  │
    │                          │  RAM     │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Verify  │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 44 20 00 10 00 ✓                   │
    │                                        │
    │  ✅ Write successful                   │
    │                                        │
```

### EEPROM Write Workflow

```
  Tester                                    ECU
    │                                        │
    │  (Session + Security already done)     │
    │                                        │
    │  STEP 1: Write to EEPROM               │
    │────────────────────────────────────>   │
    │  3D 84 08 08 00 00 00 00 00 08         │
    │     AA BB CC DD 11 22 33 44            │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Validate │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Queue   │  │
    │                          │  Write   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Write   │  │
    │                          │ EEPROM   │  │
    │                          │ (5-50ms) │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Verify  │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 84 08 08 00 00 ✓                   │
    │                                        │
    │  ⏱️ Note: 50ms delay for EEPROM        │
    │                                        │
```

### Flash Write Workflow (Restricted)

```
  Tester                                    ECU
    │                                        │
    │  STEP 1: Programming Session           │
    │────────────────────────────────────>   │
    │  10 02                                 │
    │  <────────────────────────────────────│
    │  50 02 ✓                               │
    │                                        │
    │  STEP 2: High Security (Level 3)       │
    │────────────────────────────────────>   │
    │  27 05                                 │
    │  <────────────────────────────────────│
    │  67 05 XX XX XX XX (Seed)              │
    │────────────────────────────────────>   │
    │  27 06 YY YY YY YY (Key)               │
    │  <────────────────────────────────────│
    │  67 06 ✓                               │
    │                                        │
    │  Security: 🔓 UNLOCKED (Level 3)       │
    │                                        │
    │  STEP 3: Write to Flash                │
    │────────────────────────────────────>   │
    │  3D 44 08 00 10 00 00 00 00 04         │
    │     FF FF FF FF                        │
    │                                        │
    │                          ┌──────────┐  │
    │                          │ Validate │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │ Erase    │  │
    │                          │ Sector   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Write   │  │
    │                          │  Flash   │  │
    │                          └────┬─────┘  │
    │                          ┌────▼─────┐  │
    │                          │  Verify  │  │
    │                          └────┬─────┘  │
    │                               │        │
    │  <────────────────────────────────────│
    │  7D 44 08 00 10 00 ✓                   │
    │                                        │
    │  ⚠️ Flash writes are SLOW and LIMITED  │
    │                                        │
```

---

## Write Verification Logic

### Internal Verification Flowchart

```
         ┌──────────────────┐
         │ Write Complete   │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Read Back Data   │
         │ from Address     │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Compare:         │
         │ Written vs Read  │
         └────────┬─────────┘
                  │
         ┌────────▼──────────┐
      ┌──┤ Data Matches?     │──┐
      │  └───────────────────┘  │
     NO                        YES
      │                         │
      ▼                         ▼
┌─────────────┐          ┌────────────┐
│ Increment   │          │ Return     │
│ Retry Count │          │ Success    │
└──────┬──────┘          │ (7D)       │
       │                 └────────────┘
┌──────▼───────┐
│ Retry < 3?   │
└──────┬───────┘
       │
  ┌────┴────┐
 YES       NO
  │         │
  ▼         ▼
┌────────┐┌──────────┐
│ Retry  ││ Return   │
│ Write  ││ NRC 0x72 │
└────────┘└──────────┘
```

### Verification Example

```
Scenario: Write 0x12345678 to 0x20001000

ATTEMPT 1:
  Write:     12 34 56 78
  Read Back: 12 34 56 78
  Compare:   ✅ MATCH
  Result:    Return 7D 44 20 00 10 00


Scenario: Transient Error

ATTEMPT 1:
  Write:     12 34 56 78
  Read Back: 12 34 56 00 ❌
  Compare:   ❌ MISMATCH
  Action:    Retry

ATTEMPT 2:
  Write:     12 34 56 78
  Read Back: 12 34 56 78
  Compare:   ✅ MATCH
  Result:    Return 7D 44 20 00 10 00


Scenario: Hardware Failure

ATTEMPT 1:
  Write:     12 34 56 78
  Read Back: 12 34 00 00 ❌
  Compare:   ❌ MISMATCH
  Action:    Retry

ATTEMPT 2:
  Write:     12 34 56 78
  Read Back: 12 34 00 00 ❌
  Compare:   ❌ MISMATCH
  Action:    Retry

ATTEMPT 3:
  Write:     12 34 56 78
  Read Back: 12 34 00 00 ❌
  Compare:   ❌ MISMATCH
  Action:    Max retries reached
  Result:    Return 7F 3D 72 (Programming Failure)
```

---

## Testing Scenarios

### Test Case 1: Basic RAM Write

```
┌────────────────────────────────────────────────────┐
│ TEST: Basic RAM Write                              │
├────────────────────────────────────────────────────┤
│                                                    │
│ Preconditions:                                     │
│   • ECU in EXTENDED session                        │
│   • Security Level 1 unlocked                      │
│                                                    │
│ Request:                                           │
│   3D 44 20 00 10 00 00 00 00 04 12 34 56 78        │
│                                                    │
│ Expected Response:                                 │
│   7D 44 20 00 10 00                                │
│                                                    │
│ Verification:                                      │
│   Read back: 23 44 20 00 10 00 00 00 00 04         │
│   Expected:  63 12 34 56 78                        │
│                                                    │
│ Pass Criteria:                                     │
│   ✅ Positive response received                    │
│   ✅ Data written correctly                        │
│   ✅ Read-back matches written value               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 2: Security Not Unlocked

```
┌────────────────────────────────────────────────────┐
│ TEST: Security Access Denied                       │
├────────────────────────────────────────────────────┤
│                                                    │
│ Preconditions:                                     │
│   • ECU in EXTENDED session                        │
│   • Security LOCKED 🔒                             │
│                                                    │
│ Request:                                           │
│   3D 44 20 00 10 00 00 00 00 04 12 34 56 78        │
│                                                    │
│ Expected Response:                                 │
│   7F 3D 33                                         │
│                                                    │
│ Verification:                                      │
│   Read back: 23 44 20 00 10 00 00 00 00 04         │
│   Expected:  Original value (unchanged)            │
│                                                    │
│ Pass Criteria:                                     │
│   ✅ NRC 0x33 received                             │
│   ✅ Memory NOT modified                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 3: Invalid Address (ROM)

```
┌────────────────────────────────────────────────────┐
│ TEST: Write to Read-Only Memory                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ Preconditions:                                     │
│   • ECU in EXTENDED session                        │
│   • Security Level 1 unlocked                      │
│                                                    │
│ Request:                                           │
│   3D 44 00 00 01 00 00 00 00 04 12 34 56 78        │
│   (Trying to write to ROM at 0x00000100)           │
│                                                    │
│ Expected Response:                                 │
│   7F 3D 31                                         │
│                                                    │
│ Pass Criteria:                                     │
│   ✅ NRC 0x31 received                             │
│   ✅ ROM protection working                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 4: Wrong Session

```
┌────────────────────────────────────────────────────┐
│ TEST: Write in DEFAULT Session                     │
├────────────────────────────────────────────────────┤
│                                                    │
│ Preconditions:                                     │
│   • ECU in DEFAULT session (0x01)                  │
│                                                    │
│ Request:                                           │
│   3D 44 20 00 10 00 00 00 00 04 12 34 56 78        │
│                                                    │
│ Expected Response:                                 │
│   7F 3D 7F                                         │
│                                                    │
│ Pass Criteria:                                     │
│   ✅ NRC 0x7F received                             │
│   ✅ Session enforcement working                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 5: EEPROM Write with Verification

```
┌────────────────────────────────────────────────────┐
│ TEST: EEPROM Write and Verify                      │
├────────────────────────────────────────────────────┤
│                                                    │
│ Preconditions:                                     │
│   • ECU in EXTENDED session                        │
│   • Security Level 1 unlocked                      │
│                                                    │
│ Request:                                           │
│   3D 84 08 08 00 00 00 00 00 08                    │
│      AA BB CC DD 11 22 33 44                       │
│                                                    │
│ Expected Response:                                 │
│   7D 84 08 08 00 00                                │
│   (May take 50ms due to EEPROM write time)         │
│                                                    │
│ Verification:                                      │
│   Wait 100ms for EEPROM settle                     │
│   Read back: 23 84 08 08 00 00 00 00 00 08         │
│   Expected:  63 AA BB CC DD 11 22 33 44            │
│                                                    │
│ Pass Criteria:                                     │
│   ✅ Positive response received                    │
│   ✅ Data written correctly                        │
│   ✅ Read-back matches after EEPROM settle         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### NRC 0x13 Debugging

```
         ┌──────────────────┐
         │ Getting NRC 0x13 │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Log Request Bytes│
         └────────┬─────────┘
                  │
         ┌────────▼──────────┐
      ┌──┤ ALFID Nibbles OK? │──┐
      │  └───────────────────┘  │
     NO                        YES
      │                         │
      ▼                         ▼
┌─────────────┐          ┌────────────────┐
│ Fix ALFID   │          │ Check Addr Size│
│ Calculation │          └────────┬───────┘
└─────────────┘                   │
                         ┌────────▼────────┐
                      ┌──┤ Addr Bytes Match│──┐
                      │  │ ALFID?          │  │
                     NO  └─────────────────┘ YES
                      │                      │
                      ▼                      ▼
              ┌──────────────┐        ┌────────────────┐
              │ Fix Address  │        │ Check Data Size│
              │ Length       │        └────────┬───────┘
              └──────────────┘                 │
                                      ┌────────▼────────┐
                                   ┌──┤ Data Bytes Match│──┐
                                   │  │ ALFID?          │  │
                                  NO  └─────────────────┘ YES
                                   │                      │
                                   ▼                      ▼
                           ┌──────────────┐        ┌──────────┐
                           │ Fix Data     │        │ Check for│
                           │ Length       │        │ Extra    │
                           └──────────────┘        │ Bytes    │
                                                   └──────────┘
```

### NRC 0x31 Debugging

```
         ┌──────────────────┐
         │ Getting NRC 0x31 │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │ Check Memory Map │
         └────────┬─────────┘
                  │
         ┌────────▼──────────┐
      ┌──┤ Address in Map?   │──┐
      │  └───────────────────┘  │
     NO                        YES
      │                         │
      ▼                         ▼
┌─────────────┐          ┌────────────────┐
│ Use Valid   │          │ Check Region   │
│ Address     │          │ Type           │
└─────────────┘          └────────┬───────┘
                                  │
                         ┌────────▼────────┐
                      ┌──┤ Region Writable?│──┐
                      │  └─────────────────┘  │
                     NO                      YES
                      │                       │
                      ▼                       ▼
              ┌──────────────┐        ┌─────────────┐
              │ Use RAM/     │        │ Check Bounds│
              │ EEPROM       │        └──────┬──────┘
              └──────────────┘               │
                                    ┌────────▼────────┐
                                 ┌──┤ Addr+Size Within│──┐
                                 │  │ Region?         │  │
                                NO  └─────────────────┘ YES
                                 │                      │
                                 ▼                      ▼
                         ┌──────────────┐        ┌──────────┐
                         │ Reduce Size  │        │ Should   │
                         │ or Change    │        │ Work Now │
                         │ Address      │        └──────────┘
                         └──────────────┘
```

### NRC 0x33 Debugging

```
         ┌──────────────────┐
         │ Getting NRC 0x33 │
         └────────┬─────────┘
                  │
         ┌────────▼────────────┐
      ┌──┤ Security Unlocked?  │──┐
      │  └─────────────────────┘  │
     NO                          YES
      │                           │
      ▼                           ▼
┌─────────────┐          ┌────────────────┐
│ Perform     │          │ Check Security │
│ 27 01/02    │          │ Level          │
│ Unlock      │          └────────┬───────┘
└─────────────┘                   │
                         ┌────────▼────────┐
                      ┌──┤ Level Sufficient│──┐
                      │  └─────────────────┘  │
                     NO                      YES
                      │                       │
                      ▼                       ▼
              ┌──────────────┐        ┌─────────────┐
              │ Unlock Higher│        │ Check       │
              │ Level        │        │ Timeout     │
              │ (e.g., 27 05)│        └──────┬──────┘
              └──────────────┘               │
                                    ┌────────▼────────┐
                                 ┌──┤ Within S3 Time? │──┐
                                 │  └─────────────────┘  │
                                NO                      YES
                                 │                       │
                                 ▼                       ▼
                         ┌──────────────┐        ┌──────────┐
                         │ Re-unlock    │        │ Should   │
                         │ Security     │        │ Work Now │
                         │ (Timed out)  │        └──────────┘
                         └──────────────┘
```

---

## Best Practices Checklist

### Implementation Checklist

```
┌────────────────────────────────────────────────────┐
│ ✅ MUST IMPLEMENT                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ Request Validation:                                │
│  □ Parse ALFID correctly (high/low nibbles)        │
│  □ Validate message length matches ALFID           │
│  □ Extract address, size, data correctly           │
│  □ Check session type (EXTENDED/PROGRAMMING)       │
│  □ Verify security unlock state                    │
│                                                    │
│ Address Validation:                                │
│  □ Check address exists in memory map              │
│  □ Verify region is writable (not ROM)             │
│  □ Ensure address + size within bounds             │
│  □ Validate security level for region              │
│                                                    │
│ Write Operation:                                   │
│  □ Check write conditions (voltage, etc.)          │
│  □ Perform write to memory                         │
│  □ Verify write success (read-back)                │
│  □ Retry on transient failures (max 3x)            │
│                                                    │
│ Response Handling:                                 │
│  □ Return correct positive response (7D + data)    │
│  □ Return appropriate NRC on failure               │
│  □ Echo ALFID and address in response              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Security Checklist

```
┌────────────────────────────────────────────────────┐
│ 🔒 SECURITY REQUIREMENTS                           │
├────────────────────────────────────────────────────┤
│                                                    │
│  □ Enforce session requirements                    │
│    • DEFAULT session → NRC 0x7F                    │
│    • EXTENDED session → RAM/EEPROM only            │
│    • PROGRAMMING session → All regions             │
│                                                    │
│  □ Enforce security level by region                │
│    • RAM → Level 1 minimum                         │
│    • EEPROM → Level 1 minimum                      │
│    • Flash → Level 3 minimum                       │
│    • OTP → Level 5 minimum                         │
│                                                    │
│  □ Protect critical regions                        │
│    • ROM → Always deny (NRC 0x31)                  │
│    • Boot loader → Always deny                     │
│    • Safety code → High security required          │
│                                                    │
│  □ Validate security timeout                       │
│    • Check S3 timeout hasn't expired               │
│    • Return NRC 0x33 if timed out                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Testing Checklist

```
┌────────────────────────────────────────────────────┐
│ ✅ TEST COVERAGE                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Positive Tests:                                    │
│  □ RAM write (EXTENDED + Level 1)                  │
│  □ EEPROM write (EXTENDED + Level 1)               │
│  □ Flash write (PROGRAMMING + Level 3)             │
│  □ Write verification success                      │
│                                                    │
│ Negative Tests:                                    │
│  □ Wrong ALFID → NRC 0x13                          │
│  □ Wrong message length → NRC 0x13                 │
│  □ ROM write attempt → NRC 0x31                    │
│  □ Invalid address → NRC 0x31                      │
│  □ Address overflow → NRC 0x31                     │
│  □ No security unlock → NRC 0x33                   │
│  □ Wrong security level → NRC 0x33                 │
│  □ DEFAULT session → NRC 0x7F                      │
│  □ Write failure → NRC 0x72                        │
│                                                    │
│ Edge Cases:                                        │
│  □ Boundary addresses (first/last byte of region)  │
│  □ Maximum data size (15 bytes)                    │
│  □ Minimum data size (1 byte)                      │
│  □ EEPROM write timing                             │
│  □ Security timeout during write                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**End of SID 0x3D Practical Implementation Guide**
