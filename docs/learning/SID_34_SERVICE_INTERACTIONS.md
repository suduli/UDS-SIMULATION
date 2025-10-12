# SID 0x34: Request Download - Service Interactions Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.5

---

## Table of Contents
1. [Service Dependency Pyramid](#service-dependency-pyramid)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Pyramid

### Hierarchical Service Dependencies

```
                        ┌─────────────────┐
                        │   Verification  │
                        │   Services      │
                        │   (Optional)    │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    ECU Reset (0x11)     │
                    │    [Optional - Apply    │
                    │     new firmware]       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │  Request Transfer Exit  │
                    │      (0x37)             │
                    │  [REQUIRED - Finalize]  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Transfer Data (0x36)  │
                    │   [REQUIRED - Multiple] │
                    │   Send actual data      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ ►►Request Download◄◄    │
                    │       (0x34)            │
                    │  [REQUIRED - Initiate]  │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        ┌────────┴────────┐           ┌──────────┴─────────┐
        │  Security Access│           │ Diagnostic Session │
        │     (0x27)      │           │   Control (0x10)   │
        │  [REQUIRED]     │           │   [REQUIRED]       │
        │  UNLOCKED 🔓    │           │  PROGRAMMING (0x02)│
        └─────────────────┘           └────────────────────┘
```

### Dependency Rules

```
┌──────────────────────────────────────────────────────────────┐
│                  DEPENDENCY RULES                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Rule 1: Session First                                       │
│  ├─> Must switch to PROGRAMMING session before security      │
│  └─> Session change resets security to LOCKED               │
│                                                              │
│  Rule 2: Security Before Download                            │
│  ├─> 0x27 (Security Access) MUST complete before 0x34        │
│  └─> Security state persists within session                 │
│                                                              │
│  Rule 3: Download Before Transfer                            │
│  ├─> 0x34 MUST succeed before any 0x36 requests              │
│  └─> 0x34 response provides max block size for 0x36         │
│                                                              │
│  Rule 4: Transfer Before Exit                                │
│  ├─> At least one 0x36 must be sent (even if zero data)     │
│  └─> 0x37 finalizes the sequence started by 0x34            │
│                                                              │
│  Rule 5: Exit Before New Download                            │
│  ├─> 0x37 MUST complete before starting new 0x34            │
│  └─> Cannot have multiple concurrent downloads              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### Service vs Session Compatibility

```
┌────────────────────┬──────────┬──────────┬────────────┐
│ Service            │ DEFAULT  │ EXTENDED │ PROGRAMMING│
│                    │  (0x01)  │  (0x03)  │   (0x02)   │
├────────────────────┼──────────┼──────────┼────────────┤
│ Session Control    │    ✓     │    ✓     │     ✓      │
│ (0x10)             │          │          │            │
├────────────────────┼──────────┼──────────┼────────────┤
│ Security Access    │    ❌    │    ✓     │     ✓      │
│ (0x27)             │          │          │            │
├────────────────────┼──────────┼──────────┼────────────┤
│ Request Download   │    ❌    │    ❌    │     ✓      │
│ (0x34) ◄── HERE    │          │          │            │
├────────────────────┼──────────┼──────────┼────────────┤
│ Transfer Data      │    ❌    │    ❌    │     ✓      │
│ (0x36)             │          │          │   (if 0x34)│
├────────────────────┼──────────┼──────────┼────────────┤
│ Request Exit       │    ❌    │    ❌    │     ✓      │
│ (0x37)             │          │          │   (if 0x36)│
├────────────────────┼──────────┼──────────┼────────────┤
│ Tester Present     │    ✓     │    ✓     │     ✓      │
│ (0x3E)             │          │          │            │
├────────────────────┼──────────┼──────────┼────────────┤
│ ECU Reset          │    ✓     │    ✓     │     ✓      │
│ (0x11)             │          │          │            │
└────────────────────┴──────────┴──────────┴────────────┘

Legend:
  ✓  = Allowed
  ❌ = Not allowed (returns NRC 0x7F or 0x70)
```

### Session State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│              SESSION LIFECYCLE FOR DOWNLOAD                   │
└──────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │   DEFAULT    │
   │  Session     │
   │   (0x01)     │
   └──────┬───────┘
          │
          │ 0x10 0x02 (Switch to Programming)
          │
          ▼
   ┌──────────────┐
   │ PROGRAMMING  │◄────────┐
   │  Session     │         │ 0x3E (Keep Alive)
   │   (0x02)     │─────────┘
   └──────┬───────┘
          │
          │ Security: LOCKED 🔒
          │
          │ 0x27 (Seed/Key)
          │
          ▼
   ┌──────────────┐
   │ PROGRAMMING  │◄────────┐
   │  Session     │         │ 0x3E (Keep Alive)
   │ + UNLOCKED   │─────────┘
   │     🔓       │
   └──────┬───────┘
          │
          │ Now 0x34 is allowed
          │
          ▼
   ┌──────────────┐
   │  Download    │
   │   Active     │
   │  (0x34 done) │
   └──────┬───────┘
          │
          │ 0x36 → 0x37
          │
          ▼
   ┌──────────────┐
   │  Download    │
   │  Complete    │
   └──────┬───────┘
          │
          │ 0x11 (Reset) or Timeout
          │
          ▼
   ┌──────────────┐
   │   DEFAULT    │
   │  Session     │
   │   (0x01)     │
   └──────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Basic Firmware Download (Single Region)

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Download 128KB Firmware to 0x00100000              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ STEP 1: Enter Programming Session                      │
│    │ ─────────────────────────────────────                  │
│    │  0x10 0x02                          │                   │
│    │────────────────────────────────────>│                   │
│    │  0x50 0x02 [00 32 01 F4]            │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │ Session: PROG     │
│    │                                     │ P2=50ms P2*=500ms │
│    │                                     │                   │
│    │ STEP 2: Unlock Security                                │
│    │ ─────────────────────────────────────                  │
│    │  0x27 0x01                          │                   │
│    │────────────────────────────────────>│                   │
│    │  0x67 0x01 [12 34 56 78]            │                   │
│    │<────────────────────────────────────│ Seed sent         │
│    │                                     │                   │
│    │  [Tester calculates key]           │                   │
│    │                                     │                   │
│    │  0x27 0x02 [9A BC DE F0]            │                   │
│    │────────────────────────────────────>│                   │
│    │  0x67 0x02                          │                   │
│    │<────────────────────────────────────│ UNLOCKED 🔓       │
│    │                                     │                   │
│    │ STEP 3: Initiate Download                              │
│    │ ─────────────────────────────────────                  │
│    │  0x34 0x00 0x44                     │                   │
│    │  [00 10 00 00]                      │ Address           │
│    │  [00 02 00 00]                      │ Size: 128KB       │
│    │────────────────────────────────────>│                   │
│    │  0x74 0x20 [02 00]                  │                   │
│    │<────────────────────────────────────│ Max: 512 bytes    │
│    │                                     │ Download ACTIVE   │
│    │                                     │                   │
│    │ STEP 4: Transfer Data (256 blocks × 512 bytes)         │
│    │ ─────────────────────────────────────                  │
│    │  0x36 0x01 [512 bytes data]         │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│ Block 1 OK        │
│    │                                     │                   │
│    │  0x36 0x02 [512 bytes data]         │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x02                          │                   │
│    │<────────────────────────────────────│ Block 2 OK        │
│    │                                     │                   │
│    │  ... (repeat for blocks 3-255)      │                   │
│    │                                     │                   │
│    │  0x36 0x00 [512 bytes data]         │ (Counter wraps)   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x00                          │                   │
│    │<────────────────────────────────────│ Block 256 OK      │
│    │                                     │                   │
│    │ STEP 5: Finalize Transfer                              │
│    │ ─────────────────────────────────────                  │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU verifies CRC, writes flash]   │                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│ Download complete │
│    │                                     │ State: IDLE       │
│    │                                     │                   │
│    │ STEP 6: Reset ECU                                      │
│    │ ─────────────────────────────────────                  │
│    │  0x11 0x01                          │                   │
│    │────────────────────────────────────>│                   │
│    │  0x51 0x01                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │ [Rebooting...]    │
│    │                                     │                   │
│                                                              │
│  ✓ Total time: ~8-10 seconds                                 │
│  ✓ Blocks transferred: 256                                   │
│  ✓ Data transferred: 131,072 bytes                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 2: Multi-Region Download

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Download Application + Calibration                │
│  Region 1: 0x00100000 (App, 256KB)                           │
│  Region 2: 0x00200000 (Cal, 64KB)                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ STEP 1-2: Session + Security (once)                    │
│    │ ─────────────────────────────────────                  │
│    │  0x10 0x02 → 0x50 0x02              │                   │
│    │  0x27 seed/key → Unlocked           │                   │
│    │                                     │                   │
│    │ STEP 3A: Download Region 1 (Application)               │
│    │ ─────────────────────────────────────                  │
│    │  0x34 [addr=0x00100000, size=256KB] │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 [maxBlock=512]                │                   │
│    │<────────────────────────────────────│ Region 1 active   │
│    │                                     │                   │
│    │  0x36 0x01 [data] ... 0x36 0x00     │                   │
│    │  (512 blocks)                       │                   │
│    │<───────────────────────────────────>│                   │
│    │                                     │                   │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│ Region 1 complete │
│    │                                     │                   │
│    │ STEP 3B: Download Region 2 (Calibration)               │
│    │ ─────────────────────────────────────                  │
│    │  0x34 [addr=0x00200000, size=64KB]  │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 [maxBlock=512]                │                   │
│    │<────────────────────────────────────│ Region 2 active   │
│    │                                     │                   │
│    │  0x36 0x01 [data] ... 0x36 0x80     │                   │
│    │  (128 blocks)                       │                   │
│    │<───────────────────────────────────>│                   │
│    │                                     │                   │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│ Region 2 complete │
│    │                                     │                   │
│    │ STEP 4: Verify & Reset                                 │
│    │ ─────────────────────────────────────                  │
│    │  0x11 0x01                          │                   │
│    │────────────────────────────────────>│                   │
│    │  0x51 0x01                          │                   │
│    │<────────────────────────────────────│ Rebooting...      │
│    │                                     │                   │
│                                                              │
│  ✓ Two separate download sequences                           │
│  ✓ Each has its own 0x34 → 0x36 → 0x37 cycle                │
│  ✓ Security remains unlocked between regions                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 3: Download with Checksum Verification

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Download with Pre/Post Verification               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ STEP 1-2: Session + Security                           │
│    │ ─────────────────────────────────────                  │
│    │  (Standard 0x10 0x02 and 0x27)      │                   │
│    │                                     │                   │
│    │ STEP 3: Read Current Checksum (Optional)               │
│    │ ─────────────────────────────────────                  │
│    │  0x22 [DID for checksum]            │                   │
│    │────────────────────────────────────>│                   │
│    │  0x62 [DID] [old checksum]          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │ STEP 4: Initiate Download                              │
│    │ ─────────────────────────────────────                  │
│    │  0x34 0x00 0x44 [addr] [size]       │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 0x20 [maxBlock]               │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │ STEP 5: Transfer Data                                  │
│    │ ─────────────────────────────────────                  │
│    │  0x36 0x01 [data] ...               │                   │
│    │  (multiple blocks)                  │                   │
│    │<───────────────────────────────────>│                   │
│    │                                     │                   │
│    │ STEP 6: Finalize with Checksum                         │
│    │ ─────────────────────────────────────                  │
│    │  0x37 [Optional: expected checksum] │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU calculates CRC]               │                   │
│    │  [ECU compares with expected]       │                   │
│    │                                     │                   │
│    │  If checksum matches:               │                   │
│    │  0x77 [calculated checksum]         │                   │
│    │<────────────────────────────────────│ ✓ Success         │
│    │                                     │                   │
│    │  If checksum fails:                 │                   │
│    │  0x7F 0x37 0x72                     │                   │
│    │  (Programming Failure)              │                   │
│    │<────────────────────────────────────│ ✗ CRC Error       │
│    │                                     │                   │
│    │ STEP 7: Verify New Checksum (Optional)                 │
│    │ ─────────────────────────────────────                  │
│    │  0x22 [DID for checksum]            │                   │
│    │────────────────────────────────────>│                   │
│    │  0x62 [DID] [new checksum]          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │ STEP 8: Reset                                          │
│    │ ─────────────────────────────────────                  │
│    │  0x11 0x01                          │                   │
│    │────────────────────────────────────>│                   │
│    │                                     │                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 4: Download with Compression

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Compressed Data Download                           │
│  Using dataFormatIdentifier = 0x10 (Compression Method 1)    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ Prerequisites:                                         │
│    │ • ECU supports compression method 1                    │
│    │ • Tester has compressed data ready                     │
│    │                                     │                   │
│    │ STEP 1-2: Session + Security                           │
│    │ ─────────────────────────────────────                  │
│    │  (Standard setup)                   │                   │
│    │                                     │                   │
│    │ STEP 3: Request Download with Compression              │
│    │ ─────────────────────────────────────                  │
│    │  0x34 0x10 0x44                     │                   │
│    │       ││                            │                   │
│    │       │└─ ALFID (4+4 bytes)         │                   │
│    │       └── DFI: Compression=1,       │                   │
│    │            Encryption=0             │                   │
│    │  [00 10 00 00]  ← Address           │                   │
│    │  [00 01 00 00]  ← Size (64KB)       │                   │
│    │                  (uncompressed size)│                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 0x20 [02 00]                  │                   │
│    │<────────────────────────────────────│ Max: 512 bytes    │
│    │                                     │                   │
│    │ STEP 4: Transfer COMPRESSED Data                       │
│    │ ─────────────────────────────────────                  │
│    │  0x36 0x01 [512 bytes compressed]   │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU decompresses on-the-fly]      │                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  0x36 0x02 [512 bytes compressed]   │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x02                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  ... (fewer blocks due to          │                   │
│    │       compression!)                 │                   │
│    │                                     │                   │
│    │ STEP 5: Finalize                                       │
│    │ ─────────────────────────────────────                  │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU verifies decompressed data]   │                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│                                                              │
│  Benefits:                                                   │
│  • Reduced transfer time (less data sent)                    │
│  • Reduced bus load                                          │
│  • Same end result in flash                                  │
│                                                              │
│  Note: Actual compressed size depends on data entropy        │
│        Typical: 30-70% reduction                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 5: Download with Encryption

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Encrypted Data Download                            │
│  Using dataFormatIdentifier = 0x01 (Encryption Method 1)     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ Prerequisites:                                         │
│    │ • Shared encryption key established                    │
│    │ • Both sides support encryption method 1               │
│    │                                     │                   │
│    │ STEP 1-2: Session + Security                           │
│    │ ─────────────────────────────────────                  │
│    │  (Standard setup, establishes key)  │                   │
│    │                                     │                   │
│    │ STEP 3: Request Download with Encryption               │
│    │ ─────────────────────────────────────                  │
│    │  0x34 0x01 0x44                     │                   │
│    │       ││                            │                   │
│    │       │└─ ALFID (4+4 bytes)         │                   │
│    │       └── DFI: Compression=0,       │                   │
│    │            Encryption=1             │                   │
│    │  [00 10 00 00]  ← Address           │                   │
│    │  [00 02 00 00]  ← Size (128KB)      │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 0x20 [02 00]                  │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │ STEP 4: Transfer ENCRYPTED Data                        │
│    │ ─────────────────────────────────────                  │
│    │  [Tester encrypts block 1]          │                   │
│    │  0x36 0x01 [512 bytes encrypted]    │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU decrypts using shared key]    │                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  [Tester encrypts block 2]          │                   │
│    │  0x36 0x02 [512 bytes encrypted]    │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x02                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  ... (all blocks encrypted)         │                   │
│    │                                     │                   │
│    │ STEP 5: Finalize                                       │
│    │ ─────────────────────────────────────                  │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  [ECU verifies decrypted data]      │                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│                                                              │
│  Security Benefits:                                          │
│  • Protects firmware IP during transfer                      │
│  • Prevents man-in-the-middle attacks                        │
│  • Ensures only authorized firmware loaded                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 6: Download with Compression + Encryption

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Compressed AND Encrypted Download                  │
│  Using dataFormatIdentifier = 0x11                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester Processing Pipeline:                                │
│                                                              │
│  Raw Data → Compress → Encrypt → Transfer                    │
│            Method 1   Method 1                               │
│                                                              │
│  ECU Processing Pipeline:                                   │
│                                                              │
│  Receive → Decrypt → Decompress → Write to Flash             │
│           Method 1   Method 1                                │
│                                                              │
│  Request:                                                    │
│  0x34 0x11 0x44 [address] [size]                             │
│       ││                                                     │
│       │└── ALFID                                             │
│       └─── DFI: 0x11 = Compress(1) + Encrypt(1)              │
│                                                              │
│  Benefits:                                                   │
│  ✓ Maximum transfer speed (compressed)                       │
│  ✓ Maximum security (encrypted)                              │
│  ✓ Optimal for large firmware updates                        │
│                                                              │
│  Trade-offs:                                                 │
│  ⚠️  Higher CPU load on both tester and ECU                  │
│  ⚠️  More complex error handling                             │
│  ⚠️  Requires robust encryption/compression support          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Workflow 7: Resume After Interruption

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW: Recovery from Communication Failure                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ Initial Download Attempt:                              │
│    │ ─────────────────────────────────────                  │
│    │  0x10 0x02, 0x27 (unlock)           │                   │
│    │  0x34 [addr=0x00100000, size=256KB] │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 [maxBlock=512]                │                   │
│    │<────────────────────────────────────│ Download ACTIVE   │
│    │                                     │                   │
│    │  0x36 0x01 [data]                   │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│ Block 1 OK        │
│    │                                     │                   │
│    │  0x36 0x02 [data]                   │                   │
│    │────────────────────────────────────>│                   │
│    │  ⚡ COMMUNICATION LOST ⚡            │                   │
│    │  (Cable disconnect, etc.)           │                   │
│    │                                     │                   │
│    │  [After timeout...]                 │                   │
│    │                                     │ Session timeout   │
│    │                                     │ → Return DEFAULT  │
│    │                                     │ → Clear download  │
│    │                                     │                   │
│    │ Recovery Procedure:                                    │
│    │ ─────────────────────────────────────                  │
│    │  [Connection restored]              │                   │
│    │                                     │                   │
│    │  Option 1: ABORT and RESTART                           │
│    │  ────────────────────────────────────                  │
│    │  (Recommended for safety)           │                   │
│    │                                     │                   │
│    │  0x10 0x02                          │                   │
│    │────────────────────────────────────>│                   │
│    │  0x50 0x02                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  0x27 (re-unlock)                   │                   │
│    │<───────────────────────────────────>│                   │
│    │                                     │                   │
│    │  0x34 [SAME parameters]             │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 [maxBlock]                    │                   │
│    │<────────────────────────────────────│ Fresh start       │
│    │                                     │                   │
│    │  0x36 0x01 [data] (from beginning)  │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  ... complete all blocks ...        │                   │
│    │                                     │                   │
│    │  0x37                               │                   │
│    │────────────────────────────────────>│                   │
│    │  0x77                               │                   │
│    │<────────────────────────────────────│ Complete          │
│    │                                     │                   │
│                                                              │
│  Note: UDS does NOT support resume from specific block.      │
│        Must restart entire download sequence.                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Bootloader Update Sequence

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: Update Bootloader (Special Procedure)               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Download New Bootloader to Temporary Area         │
│  ──────────────────────────────────────────────────────────  │
│    0x10 0x02 → Programming Session                           │
│    0x27 → Unlock (Level 2, High Security)                    │
│    0x31 0x01 0xFF 0x01 → Routine: Prepare Bootloader Update  │
│    0x34 [addr=TEMP_REGION] [size] → Download to temp         │
│    0x36 ... → Transfer blocks                                │
│    0x37 → Finalize                                           │
│                                                              │
│  Phase 2: Verify New Bootloader                             │
│  ──────────────────────────────────────────────────────────  │
│    0x31 0x01 0xFF 0x02 → Routine: Verify Bootloader          │
│    0x22 [DID] → Read verification status                     │
│                                                              │
│  Phase 3: Flash New Bootloader                              │
│  ──────────────────────────────────────────────────────────  │
│    0x31 0x01 0xFF 0x03 → Routine: Flash from Temp to Boot    │
│    [ECU copies TEMP → BOOTLOADER region]                     │
│    0x31 0x03 0xFF 0x03 → Get routine results                 │
│                                                              │
│  Phase 4: Reset and Verify                                  │
│  ──────────────────────────────────────────────────────────  │
│    0x11 0x01 → Hard Reset                                    │
│    [ECU boots with new bootloader]                           │
│    0x22 [Bootloader Version DID] → Confirm version           │
│                                                              │
│  ⚠️  CRITICAL: Never directly write to bootloader region!    │
│      Always use temp region + verified copy procedure        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Pattern 2: Delta (Differential) Firmware Update

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: Delta Update (Only Changed Blocks)                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Scenario: Update from v1.0 to v1.1 (only 10% changed)       │
│                                                              │
│  Traditional Full Update:                                    │
│    Download: 256 KB (entire firmware)                        │
│    Time: ~10 seconds                                         │
│                                                              │
│  Delta Update Approach:                                      │
│    Download: 25.6 KB (only changed blocks)                   │
│    Time: ~1 second                                           │
│                                                              │
│  Workflow:                                                   │
│  ──────────────────────────────────────────────────────────  │
│    1. Read current firmware version (0x22)                   │
│    2. Determine delta blocks needed                          │
│    3. For each changed region:                               │
│       a. Request Download for that region                    │
│          0x34 [addr=region_X] [size=small]                   │
│       b. Transfer only changed data                          │
│          0x36 ... (fewer blocks)                             │
│       c. Finalize region                                     │
│          0x37                                                │
│    4. ECU merges delta with existing firmware                │
│    5. Verify complete firmware checksum                      │
│    6. Reset                                                  │
│                                                              │
│  Example: 3 Changed Regions                                  │
│  ──────────────────────────────────────────────────────────  │
│    Region A: 0x00100000, 4 KB                                │
│    Region B: 0x00108000, 8 KB                                │
│    Region C: 0x00120000, 12 KB                               │
│                                                              │
│    Sequence:                                                 │
│    0x34 [0x00100000] [0x1000] → 0x36 (8 blocks) → 0x37       │
│    0x34 [0x00108000] [0x2000] → 0x36 (16 blocks) → 0x37      │
│    0x34 [0x00120000] [0x3000] → 0x36 (24 blocks) → 0x37      │
│                                                              │
│  Benefits: 90% time reduction, less bus traffic              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Pattern 3: Download with Live Progress Monitoring

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: Progress Tracking During Download                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Use Case: Provide user feedback during long downloads       │
│                                                              │
│  Tester                                 ECU                  │
│    │                                     │                   │
│    │ Setup: Session + Security + Download                   │
│    │ ─────────────────────────────────────                  │
│    │  0x34 [addr] [size=1MB]             │                   │
│    │────────────────────────────────────>│                   │
│    │  0x74 [maxBlock=2048]               │                   │
│    │<────────────────────────────────────│                   │
│    │                                     │                   │
│    │  Total blocks: 512                  │                   │
│    │  Progress tracking:                 │                   │
│    │                                     │                   │
│    │  0x36 0x01 [data]                   │                   │
│    │────────────────────────────────────>│                   │
│    │  0x76 0x01                          │                   │
│    │<────────────────────────────────────│ [0.2% complete]   │
│    │                                     │                   │
│    │  ... (blocks 2-99) ...              │                   │
│    │                                     │                   │
│    │  Optional: Read Progress DID                           │
│    │  0x22 [Progress DID]                │                   │
│    │────────────────────────────────────>│                   │
│    │  0x62 [DID] [00 64]                 │                   │
│    │<────────────────────────────────────│ [100/512 = 19.5%] │
│    │                                     │                   │
│    │  ... continue transfer ...          │                   │
│    │                                     │                   │
│    │  Display to user:                   │                   │
│    │  "Downloading: 256/512 blocks"      │                   │
│    │  "Progress: 50%"                    │                   │
│    │  "ETA: 5 seconds"                   │                   │
│    │                                     │                   │
│                                                              │
│  Progress Indicators:                                        │
│  • Block counter (from 0x36 sequence number)                 │
│  • Optional DID read (if ECU supports)                       │
│  • Time-based estimation                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Diagnostic Box 1: NRC 0x70 Received

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  PROBLEM: Received NRC 0x70 (Upload/Download NA)         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Error Response: [0x7F] [0x34] [0x70]                        │
│                                                              │
│  Diagnostic Steps:                                           │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  1️⃣  Check Current Session                                  │
│     └─> Send: 0x22 [Active Session DID]                      │
│         Expected: PROGRAMMING (0x02)                         │
│         If not: Send 0x10 0x02 first                         │
│                                                              │
│  2️⃣  Verify ECU Capabilities                                │
│     └─> Check: Does ECU support downloads?                   │
│         Some ECUs disable programming feature                │
│         Read: Configuration/Capability DID                   │
│                                                              │
│  3️⃣  Check for Active Conditions                            │
│     └─> Vehicle speed must be 0                              │
│         Engine may need to be off                            │
│         Ignition in specific position                        │
│         Read relevant DIDs to verify                         │
│                                                              │
│  4️⃣  Verify No Other Active Processes                       │
│     └─> No other tester connected                            │
│         No ongoing diagnostics                               │
│         Clear any active routines (0x31)                     │
│                                                              │
│  Resolution:                                                 │
│  ──────────────────────────────────────────────────────────  │
│    ✓ Switch to Programming session                           │
│    ✓ Ensure all preconditions met                            │
│    ✓ Retry Request Download                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Diagnostic Box 2: Download Hangs During Transfer

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  PROBLEM: No Response During Transfer Data (0x36)        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Symptom: Tester sends 0x36, ECU doesn't respond             │
│                                                              │
│  Diagnostic Steps:                                           │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  1️⃣  Check Block Size                                       │
│     └─> Sent block size > maxNumberOfBlockLength?            │
│         Review 0x74 response from Request Download           │
│         Reduce block size if exceeded                        │
│                                                              │
│  2️⃣  Verify Sequence Counter                                │
│     └─> Sequence must increment: 0x01, 0x02, ..., 0xFF, 0x00 │
│         Check for duplicates or skipped numbers              │
│                                                              │
│  3️⃣  Check for Session Timeout                              │
│     └─> Have you sent Tester Present (0x3E)?                 │
│         If gap > P2* timeout, session expired                │
│         Must restart from 0x10 0x02                          │
│                                                              │
│  4️⃣  Verify CAN Bus Health                                  │
│     └─> Check for bus errors                                 │
│         Verify termination resistors                         │
│         Check baud rate (typically 500 kbps)                 │
│         Look for electromagnetic interference                │
│                                                              │
│  5️⃣  ECU Memory Full                                        │
│     └─> ECU may have run out of buffer space                 │
│         Check if data exceeds declared memorySize            │
│         Verify flash memory available                        │
│                                                              │
│  Resolution:                                                 │
│  ──────────────────────────────────────────────────────────  │
│    ✓ Send 0x37 to abort current download                     │
│    ✓ Fix identified issue                                    │
│    ✓ Restart download sequence from 0x34                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Diagnostic Box 3: NRC 0x72 on Transfer Exit

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  PROBLEM: NRC 0x72 When Sending Request Transfer Exit    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Error: [0x7F] [0x37] [0x72] (General Programming Failure)   │
│                                                              │
│  Diagnostic Steps:                                           │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  1️⃣  Checksum/CRC Verification Failed                       │
│     └─> ECU calculated CRC doesn't match expected            │
│         Possible causes:                                     │
│         • Data corruption during transfer                    │
│         • Wrong data sent                                    │
│         • Block missing or duplicated                        │
│         Action: Retry entire download                        │
│                                                              │
│  2️⃣  Flash Write Failure                                    │
│     └─> ECU unable to write data to flash                    │
│         Possible causes:                                     │
│         • Low ECU voltage (< 11V)                            │
│         • Flash memory worn out                              │
│         • Flash controller hardware fault                    │
│         Action: Check voltage, verify hardware               │
│                                                              │
│  3️⃣  Incomplete Data Transfer                               │
│     └─> Transferred bytes < expected memorySize              │
│         Check total blocks sent                              │
│         Verify no blocks skipped                             │
│         Action: Ensure all blocks transferred                │
│                                                              │
│  4️⃣  Memory Region Issues                                   │
│     └─> Target region became write-protected                 │
│         Overlap with protected area detected                 │
│         Action: Verify memory map, check protection          │
│                                                              │
│  Resolution:                                                 │
│  ──────────────────────────────────────────────────────────  │
│    ✓ Verify data integrity before retry                      │
│    ✓ Ensure stable power supply (11-15V)                     │
│    ✓ Check for ECU hardware faults                           │
│    ✓ Retry download with same parameters                     │
│    ✓ If persistent, may indicate ECU defect                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Service Timing Parameters

```
┌────────────────────────┬─────────────────────────────────────┐
│  Timing Parameter      │  Typical Value                      │
├────────────────────────┼─────────────────────────────────────┤
│  P2 (Response time)    │  50 ms (from 0x10 0x02 response)    │
│  P2* (Enhanced time)   │  500-5000 ms (session dependent)    │
│  S3 (Session timeout)  │  5000 ms (requires Tester Present)  │
│  Flash write time      │  10-100 ms per block (ECU dependent)│
│  Block transfer time   │  5-20 ms (network + processing)     │
└────────────────────────┴─────────────────────────────────────┘
```

### Memory Address Format Examples

```
┌──────────┬──────────────┬──────────────┬─────────────────────┐
│  ALFID   │  Addr Bytes  │  Size Bytes  │  Example Usage      │
├──────────┼──────────────┼──────────────┼─────────────────────┤
│  0x11    │      1       │      1       │  Very small regions │
│  0x22    │      2       │      2       │  8-bit MCUs         │
│  0x33    │      3       │      3       │  24-bit addressing  │
│  0x44    │      4       │      4       │  32-bit MCUs (most) │
│  0x88    │      8       │      8       │  64-bit systems     │
└──────────┴──────────────┴──────────────┴─────────────────────┘
```

### Data Format Identifier Quick Reference

```
┌──────────┬────────────────┬────────────────┬────────────────┐
│  DFI     │  Compression   │  Encryption    │  Use Case      │
├──────────┼────────────────┼────────────────┼────────────────┤
│  0x00    │  None          │  None          │  Standard      │
│  0x01    │  None          │  Method 1      │  Secure only   │
│  0x10    │  Method 1      │  None          │  Fast transfer │
│  0x11    │  Method 1      │  Method 1      │  Secure + fast │
└──────────┴────────────────┴────────────────┴────────────────┘
```

### Common NRC Quick Lookup

```
┌──────────┬─────────────────────────┬──────────────────────┐
│  NRC     │  Meaning                │  Most Likely Cause   │
├──────────┼─────────────────────────┼──────────────────────┤
│  0x13    │  Incorrect Length       │  ALFID mismatch      │
│  0x22    │  Conditions Not Correct │  Download active     │
│  0x31    │  Request Out of Range   │  Invalid address     │
│  0x33    │  Security Denied        │  Not unlocked        │
│  0x70    │  Download Not Accepted  │  Wrong session       │
│  0x72    │  Programming Failure    │  Flash write error   │
│  0x7E    │  Subfunction (N/A)      │  No subfunction used │
│  0x7F    │  Service Not Supported  │  Session timeout     │
└──────────┴─────────────────────────┴──────────────────────┘
```

### Service Sequence Checklist

```
┌──────┬─────────────────────────────────────┬────────────────┐
│ Step │  Action                             │  Required?     │
├──────┼─────────────────────────────────────┼────────────────┤
│  1   │  Diagnostic Session Control (0x10) │  ✓ REQUIRED    │
│  2   │  Security Access (0x27)             │  ✓ REQUIRED    │
│  3   │  Request Download (0x34)            │  ✓ REQUIRED    │
│  4   │  Tester Present (0x3E) [periodic]   │  ✓ RECOMMENDED │
│  5   │  Transfer Data (0x36) [loop]        │  ✓ REQUIRED    │
│  6   │  Request Transfer Exit (0x37)       │  ✓ REQUIRED    │
│  7   │  Verification routine (0x31)        │  ⚪ OPTIONAL   │
│  8   │  ECU Reset (0x11)                   │  ⚪ OPTIONAL   │
└──────┴─────────────────────────────────────┴────────────────┘
```

---

**End of SID 0x34 Service Interactions Guide**
