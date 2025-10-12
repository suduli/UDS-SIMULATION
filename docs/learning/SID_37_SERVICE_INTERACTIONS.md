# SID 0x37: Request Transfer Exit - Service Interactions Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

---

## Table of Contents

1. [Service Dependencies](#service-dependencies)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependencies

### Dependency Hierarchy

```
                        ┌─────────────────────┐
                        │   SID 0x10          │
                        │   Session Control   │
                        │   (Programming)     │
                        └──────────┬──────────┘
                                   │
                        ESTABLISHES SESSION
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   SID 0x27          │
                        │   Security Access   │
                        │   (Unlock ECU)      │
                        └──────────┬──────────┘
                                   │
                        ENABLES SECURE OPERATIONS
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   SID 0x28          │
                        │   Communication     │
                        │   Control (Disable) │
                        └──────────┬──────────┘
                                   │
                        OPTIONAL: REDUCE BUS TRAFFIC
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   SID 0x31          │
                        │   Routine Control   │
                        │   (Erase Memory)    │
                        └──────────┬──────────┘
                                   │
                        PREPARES MEMORY FOR WRITE
                                   │
                                   ▼
                ┌───────────────────┴───────────────────┐
                │                                       │
                ▼                                       ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │   SID 0x34          │               │   SID 0x35          │
    │   Request Download  │               │   Request Upload    │
    │   (ECU ← Tester)    │               │   (ECU → Tester)    │
    └──────────┬──────────┘               └──────────┬──────────┘
               │                                     │
               └─────────────┬───────────────────────┘
                             │
                    INITIATES TRANSFER
                             │
                             ▼
                ┌─────────────────────────┐
                │   SID 0x36              │
                │   Transfer Data         │
                │   (Multiple Blocks)     │
                └───────────┬─────────────┘
                            │
                    TRANSFERS DATA BLOCKS
                            │
                            ▼
                ┌─────────────────────────┐
                │   SID 0x37 ◄────────────┼─── YOU ARE HERE
                │   Request Transfer Exit │
                └───────────┬─────────────┘
                            │
                    FINALIZES TRANSFER
                            │
                            ▼
                ┌─────────────────────────┐
                │   SID 0x31              │
                │   Routine Control       │
                │   (Verify Checksum)     │
                └───────────┬─────────────┘
                            │
                    VERIFIES PROGRAMMING
                            │
                            ▼
                ┌─────────────────────────┐
                │   SID 0x28              │
                │   Communication Control │
                │   (Enable)              │
                └───────────┬─────────────┘
                            │
                    RESTORES COMMUNICATIONS
                            │
                            ▼
                ┌─────────────────────────┐
                │   SID 0x11              │
                │   ECU Reset             │
                │   (Activate Firmware)   │
                └─────────────────────────┘
```

### Mandatory vs Optional Services

```
┌────────────────────────────────────────────────────────────────┐
│  SERVICES REQUIRED BEFORE SID 0x37                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  MANDATORY (Must Execute):                                     │
│    ✅ SID 0x10 - Diagnostic Session Control                   │
│       → Must be in Programming session (0x02)                  │
│                                                                │
│    ✅ SID 0x34 OR SID 0x35 - Initiate Transfer                │
│       → Establishes transfer session                           │
│                                                                │
│    ✅ SID 0x36 - Transfer Data (at least once)                │
│       → Actually transfers data blocks                         │
│                                                                │
│  USUALLY REQUIRED:                                             │
│    🔒 SID 0x27 - Security Access                              │
│       → Required for write operations                          │
│       → May be optional for read-only uploads                  │
│                                                                │
│  OPTIONAL:                                                     │
│    ⚙️  SID 0x28 - Communication Control                       │
│       → Reduces bus traffic during transfer                    │
│                                                                │
│    ⚙️  SID 0x31 - Routine Control (Pre-erase)                │
│       → Prepares flash memory                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  SERVICES COMMONLY USED AFTER SID 0x37                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  VERIFICATION:                                                 │
│    ✓ SID 0x31 - Routine Control (Checksum Verification)       │
│       → Confirms programming integrity                         │
│                                                                │
│    ✓ SID 0x31 - Check Programming Dependencies                │
│       → Verifies compatibility                                 │
│                                                                │
│  FINALIZATION:                                                 │
│    ✓ SID 0x28 - Communication Control (Re-enable)             │
│       → Restores normal communications                         │
│                                                                │
│    ✓ SID 0x11 - ECU Reset                                     │
│       → Activates new firmware                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### SID 0x37 Session Compatibility

```
┌────────────────────────────────────────────────────────────────┐
│  SESSION TYPE SUPPORT MATRIX                                   │
├──────────────────┬──────────────────────┬──────────────────────┤
│  Session Type    │  Support Level       │  Notes               │
├──────────────────┼──────────────────────┼──────────────────────┤
│  DEFAULT (0x01)  │  ❌ Not Supported   │  Transfer services   │
│                  │                      │  typically blocked   │
├──────────────────┼──────────────────────┼──────────────────────┤
│  PROGRAMMING     │  ✅ FULLY SUPPORTED │  Primary use case    │
│  (0x02)          │                      │  Flash programming   │
├──────────────────┼──────────────────────┼──────────────────────┤
│  EXTENDED (0x03) │  ⚠️  PARTIAL        │  May support non-    │
│                  │                      │  critical transfers  │
│                  │                      │  (calibration data)  │
├──────────────────┼──────────────────────┼──────────────────────┤
│  SAFETY SYSTEM   │  ⚠️  CONDITIONAL    │  OEM-specific        │
│  (0x04)          │                      │  May be restricted   │
└──────────────────┴──────────────────────┴──────────────────────┘
```

### Security Level Requirements

```
┌────────────────────────────────────────────────────────────────┐
│  SECURITY ACCESS REQUIREMENTS                                  │
├──────────────────┬──────────────────────┬──────────────────────┤
│  Operation Type  │  Security Required   │  Typical Level       │
├──────────────────┼──────────────────────┼──────────────────────┤
│  Download        │  🔒 ALWAYS          │  Level 0x01 or 0x03  │
│  (SID 0x34)      │                      │  (Programming)       │
├──────────────────┼──────────────────────┼──────────────────────┤
│  Upload          │  🔒 USUALLY         │  Level 0x01 or 0x03  │
│  (SID 0x35)      │                      │  (Protects IP)       │
├──────────────────┼──────────────────────┼──────────────────────┤
│  Calibration     │  🔓 OPTIONAL        │  May not require     │
│  Data Transfer   │                      │  security            │
└──────────────────┴──────────────────────┴──────────────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Basic Firmware Download

```
┌────────────────────────────────────────────────────────────────┐
│  COMPLETE FIRMWARE DOWNLOAD SEQUENCE                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Objective: Download 64 KB firmware file to ECU                │
│  Block Size: 256 bytes                                         │
│  Total Blocks: 256 blocks                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │                                        │
    ├─ STEP 1: Enter Programming Session ───┤
    │                                        │
    │  SID 0x10 0x02                         │
    │  [10 02]                               │
    │───────────────────────────────────────>│
    │                                        │  • Switch to Programming
    │                                        │  • Disable normal functions
    │                                        │  • Prepare for update
    │                                        │
    │  Response: [50 02 00 32 01 F4]         │
    │            │  │  └───┴───┘             │
    │            │  │     P2/P2* times       │
    │            │  └─ Session echoed        │
    │            └─ Positive response        │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Programming Session Active ✓  │
    │                                        │
    │                                        │
    ├─ STEP 2: Unlock Security ─────────────┤
    │                                        │
    │  SID 0x27 0x01 (Request Seed)          │
    │  [27 01]                               │
    │───────────────────────────────────────>│
    │                                        │  • Generate seed
    │                                        │  • Return to tester
    │                                        │
    │  Response: [67 01 AA BB CC DD]         │
    │                   └────────┘           │
    │                   Random Seed          │
    │<───────────────────────────────────────│
    │                                        │
    │  (Tester calculates key from seed)     │
    │   Key = Algorithm(Seed) = 0x11223344   │
    │                                        │
    │  SID 0x27 0x02 + Key                   │
    │  [27 02 11 22 33 44]                   │
    │───────────────────────────────────────>│
    │                                        │  • Verify key
    │                                        │  • Unlock ECU
    │                                        │
    │  Response: [67 02]                     │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: ECU Unlocked 🔓               │
    │                                        │
    │                                        │
    ├─ STEP 3: Erase Flash Memory ──────────┤
    │                                        │
    │  SID 0x31 0x01 0xFF00 (Erase Routine)  │
    │  [31 01 FF 00]                         │
    │───────────────────────────────────────>│
    │                                        │  • Erase flash sectors
    │                                        │  • Prepare for new data
    │                                        │  (May take 2-5 seconds)
    │                                        │
    │  Response: [71 01 FF 00 00]            │
    │                          │             │
    │                          └─ Status OK  │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Flash Erased ✓                │
    │                                        │
    │                                        │
    ├─ STEP 4: Request Download ────────────┤
    │                                        │
    │  SID 0x34 + Parameters                 │
    │  [34 00 44 00 10 00 00 00 01 00 00]    │
    │   │  │  │  │  │  └────────┴────────┘   │
    │   │  │  │  │  │    Size: 64KB          │
    │   │  │  │  │  └─ Address length: 4     │
    │   │  │  │  └─ Address: 0x00100000      │
    │   │  │  └─ Format: 4+4 bytes           │
    │   │  └─ Data format identifier         │
    │   └─ SID                               │
    │───────────────────────────────────────>│
    │                                        │  • Validate address
    │                                        │  • Allocate buffer
    │                                        │  • Calculate blocks
    │                                        │
    │  Response: [74 20 01 00]               │
    │               │  └──┘                  │
    │               │   Max block: 256 bytes │
    │               └─ Length format         │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Ready to Receive Data ✓       │
    │          Block Size: 256 bytes         │
    │          Expected Blocks: 256          │
    │                                        │
    │                                        │
    ├─ STEP 5: Transfer Data Blocks ────────┤
    │                                        │
    │  Block 1:                              │
    │  SID 0x36 0x01 + [256 bytes]           │
    │  [36 01 FF FF 00 00 ... data ...]      │
    │───────────────────────────────────────>│
    │                                        │  • Receive block
    │                                        │  • Verify counter (01)
    │                                        │  • Store in buffer
    │                                        │
    │  Response: [76 01]                     │
    │               └─ Block 1 ACK           │
    │<───────────────────────────────────────│
    │                                        │
    │  Block 2:                              │
    │  SID 0x36 0x02 + [256 bytes]           │
    │───────────────────────────────────────>│
    │  Response: [76 02]                     │
    │<───────────────────────────────────────│
    │                                        │
    │  Block 3:                              │
    │  SID 0x36 0x03 + [256 bytes]           │
    │───────────────────────────────────────>│
    │  Response: [76 03]                     │
    │<───────────────────────────────────────│
    │                                        │
    │  ... (Blocks 4-255) ...                │
    │                                        │
    │  Block 256 (Last):                     │
    │  SID 0x36 0x00 + [256 bytes]           │
    │  (Counter wraps: 256 mod 256 = 0)      │
    │───────────────────────────────────────>│
    │  Response: [76 00]                     │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: All 256 Blocks Transferred ✓  │
    │          Total: 65,536 bytes (64 KB)   │
    │                                        │
    │                                        │
    ├─ STEP 6: Request Transfer Exit ───────┤
    │            (WITH CRC-32)               │
    │                                        │
    │  (Tester calculates CRC-32 of all data)│
    │   CRC-32 = 0xDEADBEEF                  │
    │                                        │
    │  SID 0x37 + CRC                        │
    │  [37 DE AD BE EF]                      │
    │      └────────┘                        │
    │      CRC-32                            │
    │───────────────────────────────────────>│
    │                                        │  • Verify all 256 blocks
    │                                        │  • Calculate ECU CRC-32
    │                                        │  • Result: 0xDEADBEEF
    │                                        │  • Compare: MATCH ✓
    │                                        │  • Write to flash
    │                                        │  • Verify flash write
    │                                        │
    │  Response: [77 01]                     │
    │               └─ Verification OK       │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Transfer Complete ✓           │
    │          Data Written to Flash ✓       │
    │          CRC Verified ✓                │
    │                                        │
    │                                        │
    ├─ STEP 7: Verify Programming ──────────┤
    │                                        │
    │  SID 0x31 0x01 0xFF01 (Check Routine)  │
    │  [31 01 FF 01]                         │
    │───────────────────────────────────────>│
    │                                        │  • Verify flash integrity
    │                                        │  • Check dependencies
    │                                        │  • Validate checksums
    │                                        │
    │  Response: [71 01 FF 01 00]            │
    │                          │             │
    │                          └─ All OK     │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Programming Verified ✓        │
    │                                        │
    │                                        │
    ├─ STEP 8: Reset ECU ────────────────────┤
    │                                        │
    │  SID 0x11 0x01 (Hard Reset)            │
    │  [11 01]                               │
    │───────────────────────────────────────>│
    │                                        │  • Save state
    │  Response: [51 01]                     │  • Trigger reset
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU Resets - 2-3 seconds]            │
    │                                        │
    │  [New Firmware Active]                 │
    │                                        │
    │  ✓✓✓ FIRMWARE UPDATE COMPLETE ✓✓✓     │
    │                                        │
```

---

### Workflow 2: Calibration Data Upload (ECU → Tester)

```
┌────────────────────────────────────────────────────────────────┐
│  COMPLETE CALIBRATION UPLOAD SEQUENCE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Objective: Read 8 KB calibration data from ECU                │
│  Block Size: 512 bytes                                         │
│  Total Blocks: 16 blocks                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    ├─ STEP 1: Enter Extended Session ──────┤
    │                                        │
    │  SID 0x10 0x03                         │
    │───────────────────────────────────────>│
    │  Response: [50 03 ...]                 │
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    ├─ STEP 2: Unlock Security ─────────────┤
    │                                        │
    │  SID 0x27 (Seed/Key Exchange)          │
    │<──────────────────────────────────────>│
    │  Status: Unlocked 🔓                   │
    │                                        │
    │                                        │
    ├─ STEP 3: Request Upload ──────────────┤
    │                                        │
    │  SID 0x35 + Address/Size               │
    │  [35 00 44 00 20 00 00 00 00 20 00]    │
    │         │  │  │  └────────┴────────┘   │
    │         │  │  │    Size: 8KB           │
    │         │  │  └─ Address: 0x00200000   │
    │         │  └─ Format: 4+4 bytes        │
    │         └─ Data format                 │
    │───────────────────────────────────────>│
    │                                        │  • Validate address
    │                                        │  • Prepare data
    │                                        │  • Set block size
    │                                        │
    │  Response: [75 20 02 00]               │
    │               │  └──┘                  │
    │               │   Max block: 512 bytes │
    │               └─ Length format         │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: ECU Ready to Send ✓           │
    │          Block Size: 512 bytes         │
    │          Total Blocks: 16              │
    │                                        │
    │                                        │
    ├─ STEP 4: Transfer Data Blocks ────────┤
    │    (ECU SENDS, Tester Receives)        │
    │                                        │
    │  Request Block 1:                      │
    │  SID 0x36 0x01                         │
    │  [36 01]                               │
    │───────────────────────────────────────>│
    │                                        │  • Read from memory
    │                                        │  • Prepare 512 bytes
    │                                        │
    │  Response: Block 1 Data                │
    │  [76 01 + 512 bytes of data]           │
    │<───────────────────────────────────────│
    │                                        │
    │  (Tester stores block 1)               │
    │  (Tester updates running CRC)          │
    │                                        │
    │  Request Block 2:                      │
    │  [36 02]                               │
    │───────────────────────────────────────>│
    │  Response: [76 02 + 512 bytes]         │
    │<───────────────────────────────────────│
    │                                        │
    │  ... (Blocks 3-15) ...                 │
    │                                        │
    │  Request Block 16 (Last):              │
    │  [36 10]  (0x10 = 16 decimal)          │
    │───────────────────────────────────────>│
    │  Response: [76 10 + 512 bytes]         │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: All 16 Blocks Received ✓      │
    │          Total: 8,192 bytes (8 KB)     │
    │          Tester CRC: 0x12345678        │
    │                                        │
    │                                        │
    ├─ STEP 5: Request Transfer Exit ───────┤
    │                                        │
    │  SID 0x37 (No checksum - simple exit)  │
    │  [37]                                  │
    │───────────────────────────────────────>│
    │                                        │  • Verify all blocks sent
    │                                        │  • Clean up resources
    │                                        │  • Return to ready state
    │                                        │
    │  Response: [77]                        │
    │<───────────────────────────────────────│
    │                                        │
    │  Status: Upload Complete ✓             │
    │          8 KB Calibration Data Saved   │
    │                                        │
    │                                        │
    ├─ STEP 6: Return to Default Session ───┤
    │                                        │
    │  SID 0x10 0x01                         │
    │───────────────────────────────────────>│
    │  Response: [50 01]                     │
    │<───────────────────────────────────────│
    │                                        │
    │  ✓✓✓ UPLOAD COMPLETE ✓✓✓              │
    │                                        │
```

---

### Workflow 3: Multi-File Flash Programming

```
┌────────────────────────────────────────────────────────────────┐
│  MULTI-FILE FIRMWARE UPDATE                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Objective: Update 3 separate memory regions                   │
│    File 1: Bootloader (16 KB) → 0x00000000                    │
│    File 2: Application (256 KB) → 0x00010000                  │
│    File 3: Calibration (32 KB) → 0x00050000                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    ├─ SETUP PHASE ──────────────────────────┤
    │                                        │
    │  1. SID 0x10 0x02 (Programming)        │
    │  2. SID 0x27 (Unlock)                  │
    │  3. SID 0x28 0x03 (Disable Comms)      │
    │<──────────────────────────────────────>│
    │                                        │
    │  Status: Ready for Multi-File Update   │
    │                                        │
    │                                        │
    ├─ FILE 1: BOOTLOADER ───────────────────┤
    │                                        │
    │  SID 0x31 (Erase Bootloader Region)    │
    │───────────────────────────────────────>│
    │  [71 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x34 (Download to 0x00000000)     │
    │  Size: 16 KB                           │
    │───────────────────────────────────────>│
    │  [74 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x36 ... (64 blocks × 256 bytes)  │
    │<──────────────────────────────────────>│
    │                                        │
    │  SID 0x37 + CRC-32                     │
    │  [37 AA BB CC DD]                      │
    │───────────────────────────────────────>│
    │                                        │
    │  [77 01] (Bootloader Complete) ✓       │
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    ├─ FILE 2: APPLICATION ──────────────────┤
    │                                        │
    │  SID 0x31 (Erase Application Region)   │
    │───────────────────────────────────────>│
    │  [71 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x34 (Download to 0x00010000)     │
    │  Size: 256 KB                          │
    │───────────────────────────────────────>│
    │  [74 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x36 ... (1024 blocks × 256 bytes)│
    │<──────────────────────────────────────>│
    │                                        │
    │  SID 0x37 + CRC-32                     │
    │  [37 11 22 33 44]                      │
    │───────────────────────────────────────>│
    │                                        │
    │  [77 01] (Application Complete) ✓      │
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    ├─ FILE 3: CALIBRATION ──────────────────┤
    │                                        │
    │  SID 0x31 (Erase Calibration Region)   │
    │───────────────────────────────────────>│
    │  [71 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x34 (Download to 0x00050000)     │
    │  Size: 32 KB                           │
    │───────────────────────────────────────>│
    │  [74 ... OK]                           │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x36 ... (128 blocks × 256 bytes) │
    │<──────────────────────────────────────>│
    │                                        │
    │  SID 0x37 + CRC-32                     │
    │  [37 55 66 77 88]                      │
    │───────────────────────────────────────>│
    │                                        │
    │  [77 01] (Calibration Complete) ✓      │
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    ├─ VERIFICATION PHASE ───────────────────┤
    │                                        │
    │  SID 0x31 0x01 0xFF01                  │
    │  (Check All Programming Dependencies)  │
    │───────────────────────────────────────>│
    │                                        │
    │  [71 01 FF 01 00] (All Regions OK) ✓   │
    │<───────────────────────────────────────│
    │                                        │
    │                                        │
    ├─ FINALIZATION PHASE ───────────────────┤
    │                                        │
    │  SID 0x28 0x00 (Enable Comms)          │
    │───────────────────────────────────────>│
    │  [68 00]                               │
    │<───────────────────────────────────────│
    │                                        │
    │  SID 0x11 0x01 (Reset)                 │
    │───────────────────────────────────────>│
    │  [51 01]                               │
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU Boots with All New Firmware]     │
    │                                        │
    │  ✓✓✓ MULTI-FILE UPDATE COMPLETE ✓✓✓   │
    │     • Bootloader: 16 KB ✓              │
    │     • Application: 256 KB ✓            │
    │     • Calibration: 32 KB ✓             │
    │     • Total: 304 KB Updated            │
    │                                        │
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Download with Pre/Post Verification

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Secure Download with Full Verification              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Use Case: Critical firmware update requiring maximum safety  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Step-by-Step:

1. Pre-Flight Checks
   ├─ SID 0x22 (Read VIN, ECU Info)
   │  └─ Verify correct ECU
   │
   ├─ SID 0x22 (Read Battery Voltage)
   │  └─ Ensure >= 12V
   │
   └─ SID 0x22 (Read Vehicle Speed)
      └─ Ensure speed = 0

2. Session Setup
   ├─ SID 0x10 0x02 (Programming Session)
   │
   ├─ SID 0x27 (Security Unlock)
   │
   └─ SID 0x28 0x03 (Disable Non-Essential Comms)

3. Memory Preparation
   ├─ SID 0x31 0x01 0xFF02 (Check Memory)
   │  └─ Verify flash is healthy
   │
   └─ SID 0x31 0x01 0xFF00 (Erase Memory)
      └─ Prepare for new data

4. Data Transfer
   ├─ SID 0x34 (Request Download)
   │
   ├─ SID 0x36 ... (Transfer All Blocks)
   │
   └─ SID 0x37 + CRC-32 (Exit with Verification) ◄── YOU ARE HERE

5. Post-Transfer Verification
   ├─ SID 0x31 0x01 0xFF01 (Checksum Verification)
   │  └─ Verify flash integrity
   │
   ├─ SID 0x31 0x01 0xFF03 (Check Dependencies)
   │  └─ Ensure compatibility
   │
   └─ SID 0x22 (Read Software Version)
      └─ Confirm new version

6. Finalization
   ├─ SID 0x28 0x00 (Re-enable Communications)
   │
   └─ SID 0x11 0x01 (ECU Reset)

Result: Firmware updated with full verification chain ✓
```

---

### Pattern 2: Quick Calibration Update (Minimal Security)

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Fast Calibration Download (No Erase)                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Use Case: Quick calibration tweak, no critical changes       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Step-by-Step:

1. Minimal Setup
   ├─ SID 0x10 0x03 (Extended Session)
   │  └─ No full programming needed
   │
   └─ SID 0x27 (Optional - may not be required)

2. Direct Download
   ├─ SID 0x34 (Request Download to calibration area)
   │  └─ Typically: 0x00080000 - 0x0008FFFF
   │
   ├─ SID 0x36 ... (Transfer calibration blocks)
   │  └─ Small file: 10-50 blocks
   │
   └─ SID 0x37 (Exit - no checksum) ◄── YOU ARE HERE
      └─ Quick exit, ECU verifies internally

3. Soft Reset
   └─ SID 0x11 0x03 (Soft Reset - no full reboot)
      └─ Apply calibration immediately

Result: Calibration updated in < 5 seconds ✓
```

---

### Pattern 3: Diagnostic Data Extraction (Upload)

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Extract Diagnostic Logs from ECU                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Use Case: Read crash logs, diagnostic data, or DTCs           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Step-by-Step:

1. Session Setup
   ├─ SID 0x10 0x03 (Extended Session)
   │  └─ Read-only operations
   │
   └─ SID 0x27 (Unlock - read protection)

2. Read DTC Information First
   └─ SID 0x19 0x02 (Read DTCs by Status Mask)
      └─ Get overview of issues

3. Upload Detailed Logs
   ├─ SID 0x35 (Request Upload from log area)
   │  └─ Address: 0x00400000, Size: 16 KB
   │
   ├─ SID 0x36 0x01... (Request blocks from ECU)
   │  └─ ECU sends blocks to tester
   │
   └─ SID 0x37 (Exit - simple) ◄── YOU ARE HERE
      └─ No checksum needed for read

4. Additional Data Reads
   ├─ SID 0x22 (Read Freeze Frame Data)
   │
   └─ SID 0x22 (Read Extended Data Records)

5. Return to Normal
   └─ SID 0x10 0x01 (Default Session)

Result: Diagnostic data extracted for analysis ✓
```

---

### Pattern 4: Incremental Software Update (Block Verification)

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Download with Per-Block Verification                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Use Case: Ultra-reliable update with block-level CRC         │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Step-by-Step:

1. Setup
   ├─ SID 0x10 0x02 (Programming)
   ├─ SID 0x27 (Unlock)
   └─ SID 0x31 (Erase)

2. Download with Block CRC
   ├─ SID 0x34 (Request Download)
   │
   ├─ FOR EACH BLOCK:
   │  │
   │  ├─ SID 0x36 0xNN + block data + CRC-16
   │  │  └─ Each block carries its own checksum
   │  │
   │  ├─ ECU verifies block immediately
   │  │
   │  └─ If block invalid: Retry 3 times
   │     └─ If still failing: Abort transfer
   │
   └─ After all blocks successful:

3. Final Verification
   ├─ SID 0x37 + Global CRC-32 ◄── YOU ARE HERE
   │  └─ Verify entire transfer integrity
   │
   └─ ECU compares:
      ├─ Sum of all block CRCs
      └─ Global CRC-32
         └─ Must match for success

4. Finalization
   └─ SID 0x11 (Reset)

Result: Maximum reliability, can recover from single block errors ✓
```

---

### Pattern 5: Network-Wide Flash (Multiple ECUs)

```
┌────────────────────────────────────────────────────────────────┐
│  PATTERN: Coordinated Multi-ECU Update                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Use Case: Update engine ECU, transmission ECU, and BCM        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Sequence:

1. Pre-Check All ECUs
   ├─ For each ECU (0x7E0, 0x7E1, 0x7E2):
   │  ├─ SID 0x22 (Read Software Version)
   │  ├─ SID 0x22 (Read Hardware Version)
   │  └─ Verify compatibility

2. Prepare All ECUs
   ├─ ECU 1 (Engine): SID 0x10 0x02, SID 0x27
   ├─ ECU 2 (Trans): SID 0x10 0x02, SID 0x27
   └─ ECU 3 (BCM): SID 0x10 0x02, SID 0x27

3. Sequential Update
   │
   ├─ UPDATE ECU 1:
   │  ├─ SID 0x34 → SID 0x36... → SID 0x37 ✓
   │  └─ SID 0x31 (Verify)
   │
   ├─ UPDATE ECU 2:
   │  ├─ SID 0x34 → SID 0x36... → SID 0x37 ✓ ◄── YOU ARE HERE
   │  └─ SID 0x31 (Verify)
   │
   └─ UPDATE ECU 3:
      ├─ SID 0x34 → SID 0x36... → SID 0x37 ✓
      └─ SID 0x31 (Verify)

4. System-Wide Reset
   ├─ All ECUs: SID 0x11 0x01
   │
   └─ Wait for all ECUs to reboot

5. Post-Update Verification
   ├─ For each ECU:
   │  ├─ SID 0x22 (Verify new version)
   │  └─ SID 0x19 (Check for DTCs)
   │
   └─ Verify inter-ECU communication

Result: All ECUs updated and synchronized ✓
```

---

## Troubleshooting Scenarios

### Scenario 1: Transfer Exit Fails After Successful Blocks

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: SID 0x37 Returns NRC 0x72 Despite Successful 0x36   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptoms:                                                     │
│    • All SID 0x36 blocks acknowledged (76 responses)           │
│    • SID 0x37 returns: 7F 37 72 (Programming Failure)          │
│    • Transfer appears complete but fails at exit               │
│                                                                │
│  Investigation Steps:                                          │
│                                                                │
│    1. Compare Checksums                                        │
│       ┌────────────────────────────────────────┐              │
│       │ Tester CRC-32:  0xDEADBEEF             │              │
│       │ ECU CRC-32:     0xDEADBEEE (different!)│              │
│       └────────────────────────────────────────┘              │
│                                                                │
│    2. Check Data Integrity                                     │
│       • Request re-upload of random blocks                     │
│       • SID 0x35 + SID 0x36 to read back                       │
│       • Compare with original data                             │
│                                                                │
│    3. Verify Algorithm                                         │
│       • Are tester and ECU using same CRC algorithm?           │
│       • Check polynomial: 0x04C11DB7 (standard CRC-32)         │
│       • Verify initial value and final XOR                     │
│                                                                │
│    4. Check Endianness                                         │
│       • Big endian vs little endian                            │
│       • Tester sends: [37 DE AD BE EF]                         │
│       • ECU expects: [37 EF BE AD DE]  ← Reversed!             │
│                                                                │
│  Solutions:                                                    │
│    ✓ Use same CRC algorithm as ECU specification               │
│    ✓ Match byte order (check OEM documentation)                │
│    ✓ Verify no bit flips during transmission                   │
│    ✓ Test with known-good data file and checksum               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Timeout Between Last Block and Exit

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: ECU Times Out Before SID 0x37 Sent                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Timeline:                                                     │
│                                                                │
│  T=0s     Last SID 0x36 sent (block 256)                       │
│  │        ECU responds: 76 00                                  │
│  │        ECU enters TRANSFER_READY state                      │
│  │                                                             │
│  T=1s     Tester processing...                                 │
│  │                                                             │
│  T=2s     Tester calculating CRC...                            │
│  │                                                             │
│  T=3s     Tester preparing SID 0x37...                         │
│  │                                                             │
│  T=5s     ⏱️ ECU TIMEOUT! (5 second limit)                     │
│  │        ECU aborts transfer                                  │
│  │        ECU state → IDLE                                     │
│  │                                                             │
│  T=5.5s   Tester sends: SID 0x37                               │
│  │                                                             │
│  T=5.6s   ECU responds: 7F 37 24 (Sequence Error)              │
│           "No active transfer!"                                │
│                                                                │
│  Root Cause:                                                   │
│    • Tester took too long to send SID 0x37                     │
│    • CRC calculation was slow                                  │
│    • ECU timeout too short for large transfers                 │
│                                                                │
│  Solutions:                                                    │
│    ✓ Calculate CRC incrementally during transfer               │
│      (don't wait until end)                                    │
│    ✓ Send SID 0x37 within 2 seconds of last SID 0x36           │
│    ✓ Use faster CRC algorithm (lookup table)                   │
│    ✓ Request longer timeout via SID 0x83 (Access Timing)       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Scenario 3: Security Access Expires During Transfer

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: SID 0x37 Returns NRC 0x33 (Security Denied)          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Sequence:                                                     │
│                                                                │
│  T=0s     SID 0x27 (Unlock)                                    │
│           Security: UNLOCKED 🔓                                │
│           Timeout: 60 seconds                                  │
│                                                                │
│  T=5s     SID 0x34 (Request Download)                          │
│                                                                │
│  T=10s    Start SID 0x36 transfers                             │
│           ... (large file, 1000 blocks)                        │
│                                                                │
│  T=60s    ⏱️ Security timeout!                                 │
│           ECU re-locks: LOCKED 🔒                              │
│                                                                │
│  T=65s    Last SID 0x36 sent                                   │
│           ECU still responds: 76 (block accepted)              │
│           (Transfer continues in locked state)                 │
│                                                                │
│  T=67s    SID 0x37 sent                                        │
│           ECU checks security: LOCKED!                         │
│           ECU responds: 7F 37 33                               │
│                                                                │
│  Root Cause:                                                   │
│    • Security timeout (60s) < transfer time (67s)              │
│    • Large file took too long                                  │
│    • No security refresh during transfer                       │
│                                                                │
│  Solutions:                                                    │
│    ✓ Keep security alive with periodic SID 0x3E (Tester       │
│      Present) during long transfers                            │
│    ✓ Or re-execute SID 0x27 mid-transfer if timeout is near    │
│    ✓ Increase block size to reduce total transfer time         │
│    ✓ Request extended security timeout (if supported)          │
│                                                                │
│  Prevention:                                                   │
│    • Estimate transfer time BEFORE starting                    │
│    • Transfer time = (total size / block size) × block delay   │
│    • If transfer time > 50% of security timeout:               │
│      → Use SID 0x3E every 30 seconds                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Scenario 4: Flash Write Failure During Exit

```
┌────────────────────────────────────────────────────────────────┐
│  PROBLEM: Data Transfer OK, But Flash Programming Fails        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Sequence:                                                     │
│                                                                │
│  Phase 1: Transfer (Success)                                   │
│    • SID 0x34 → 74 (OK)                                        │
│    • SID 0x36 × 500 → All successful                           │
│    • Data in RAM buffer ✓                                      │
│    • CRC verified ✓                                            │
│                                                                │
│  Phase 2: SID 0x37 Processing                                  │
│    1. Tester sends: 37 + CRC                                   │
│    2. ECU verifies CRC: MATCH ✓                                │
│    3. ECU attempts flash write...                              │
│       ┌─────────────────────────────────────┐                 │
│       │ Flash Write Operation               │                 │
│       │ Address: 0x00010000                 │                 │
│       │ Size: 128 KB                        │                 │
│       │                                     │                 │
│       │ [Progress: ▓▓▓▓▓░░░░░ 50%]          │                 │
│       │                                     │                 │
│       │ ERROR: Flash sector protected!      │                 │
│       │ Write failed at 0x00018000          │                 │
│       └─────────────────────────────────────┘                 │
│    4. ECU responds: 7F 37 72 (Programming Failure)             │
│                                                                │
│  Root Causes:                                                  │
│    • Flash memory not properly erased                          │
│    • Write protection still enabled                            │
│    • Voltage dropped below threshold during write              │
│    • Flash memory hardware failure                             │
│    • Attempting to write bootloader without special mode       │
│                                                                │
│  Diagnostic Actions:                                           │
│    1. Read flash status                                        │
│       SID 0x22 (Read Flash Status Register)                    │
│                                                                │
│    2. Verify erase was successful                              │
│       SID 0x31 0x01 0xFF02 (Check Memory Status)               │
│                                                                │
│    3. Check voltage during operation                           │
│       SID 0x22 (Read Real-Time Voltage)                        │
│       → Must be 12V-16V for flash operations                   │
│                                                                │
│  Solutions:                                                    │
│    ✓ Re-run erase routine: SID 0x31 0x01 0xFF00                │
│    ✓ Disable write protection: SID 0x31 0x01 0xFF04            │
│    ✓ Ensure stable 13V+ power supply                           │
│    ✓ Retry SID 0x37 after addressing issue                     │
│    ✓ For bootloader: Enter special boot mode first             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### SID 0x37 Command Summary

```
┌────────────────────────────────────────────────────────────────┐
│  SID 0x37 QUICK REFERENCE                                      │
├──────────────────┬─────────────────────────────────────────────┤
│  Parameter       │  Value                                      │
├──────────────────┼─────────────────────────────────────────────┤
│  Service ID      │  0x37                                       │
│  Response SID    │  0x77 (positive)                            │
│  Min Length      │  1 byte (SID only)                          │
│  Max Length      │  Variable (depends on parameters)           │
│  Session         │  Programming (0x02) - typical               │
│  Security        │  Usually required 🔒                        │
│  Timing          │  Send within 2-5s after last SID 0x36       │
└──────────────────┴─────────────────────────────────────────────┘
```

### NRC Priority Matrix

```
┌────────────────────────────────────────────────────────────────┐
│  NRC TROUBLESHOOTING PRIORITY                                  │
├──────────┬────────────────────────────┬──────────────────────┤
│  NRC     │  First Check               │  Most Likely Cause   │
├──────────┼────────────────────────────┼──────────────────────┤
│  0x13    │  Message byte count        │  Wrong param format  │
│  0x22    │  Vehicle state             │  Engine running      │
│  0x24    │  Transfer sequence         │  No active transfer  │
│  0x31    │  Parameter values          │  Block count wrong   │
│  0x33    │  Security status           │  Not unlocked        │
│  0x70    │  Block counter             │  Missing blocks      │
│  0x72    │  Checksum calculation      │  CRC mismatch        │
│  0x92/93 │  Battery voltage           │  Voltage out of spec │
└──────────┴────────────────────────────┴──────────────────────┘
```

### Service Call Order Reference

```
┌────────────────────────────────────────────────────────────────┐
│  TYPICAL SERVICE CALL ORDER (DOWNLOAD)                         │
├────┬───────────────────────────────────────────────────────────┤
│  # │  Service Call                                             │
├────┼───────────────────────────────────────────────────────────┤
│  1 │  SID 0x10 0x02 (Programming Session)                      │
│  2 │  SID 0x27 0x01 (Request Seed)                             │
│  3 │  SID 0x27 0x02 + Key (Send Key)                           │
│  4 │  SID 0x28 0x03 (Disable Communications - optional)        │
│  5 │  SID 0x31 0x01 0xFF00 (Erase Memory - optional)           │
│  6 │  SID 0x34 (Request Download) ← START TRANSFER             │
│  7 │  SID 0x36 Block 1 (Transfer Data)                         │
│  8 │  SID 0x36 Block 2                                         │
│... │  ... (more blocks)                                        │
│ N  │  SID 0x36 Block N (last block)                            │
│N+1 │  SID 0x37 + CRC (Transfer Exit) ◄── CURRENT SERVICE       │
│N+2 │  SID 0x31 0x01 0xFF01 (Verify Checksum - optional)        │
│N+3 │  SID 0x28 0x00 (Enable Communications - if disabled)      │
│N+4 │  SID 0x11 0x01 (ECU Reset)                                │
└────┴───────────────────────────────────────────────────────────┘
```

### Timing Constraints Summary

```
┌────────────────────────────────────────────────────────────────┐
│  TIMING CONSTRAINTS                                            │
├─────────────────────────────┬──────────────────────────────────┤
│  Event                      │  Time Limit                      │
├─────────────────────────────┼──────────────────────────────────┤
│  Last SID 0x36 → SID 0x37   │  2-5 seconds (typical)           │
│  SID 0x37 → ECU Response    │  < 50ms (simple exit)            │
│                             │  < 500ms (with verification)     │
│                             │  < 5s (with flash programming)   │
│  Security timeout           │  60 seconds (typical)            │
│  Session timeout (S3)       │  5 seconds (send SID 0x3E)       │
│  Flash write operation      │  1-10 seconds (depends on size)  │
└─────────────────────────────┴──────────────────────────────────┘
```

---

## Related Documentation

For complete understanding of SID 0x37, also review:

1. **SID_37_REQUEST_TRANSFER_EXIT.md** - Theoretical concepts and message formats
2. **SID_37_PRACTICAL_IMPLEMENTATION.md** - Implementation flowcharts and debugging
3. **SID_34_REQUEST_DOWNLOAD.md** - Initiating download transfers
4. **SID_35_REQUEST_UPLOAD.md** - Initiating upload transfers
5. **SID_36_TRANSFER_DATA.md** - Transferring data blocks
6. **SID_27_SECURITY_ACCESS.md** - Security unlock procedures
7. **SID_10_DIAGNOSTIC_SESSION_CONTROL.md** - Session management
8. **SID_31_ROUTINE_CONTROL.md** - Erase, verify, and checksum routines

---

**End of SID 0x37 Service Interactions Guide**
