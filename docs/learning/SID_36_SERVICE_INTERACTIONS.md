# SID 0x36: Transfer Data - Service Interactions & Workflows

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.5

---

## 📋 Table of Contents

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
┌─────────────────────────────────────────────────────────────┐
│           SID 0x36 DEPENDENCY PYRAMID                       │
│        (Bottom dependencies required first)                 │
└─────────────────────────────────────────────────────────────┘


                    ┌──────────────────┐
                    │   SID 0x36       │  ← Transfer Data
                    │ Transfer Data    │     (Target Service)
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
         ┌──────────┴─────────┐  ┌────┴──────────────┐
         │   SID 0x34         │  │   SID 0x35        │
         │ Request Download   │  │ Request Upload    │
         └──────────┬─────────┘  └────┬──────────────┘
                    │                 │
         ───────────┴─────────────────┴──────────
                    │
         ┌──────────┴─────────┐
         │                    │
    ┌────┴──────────┐  ┌──────┴───────────┐
    │   SID 0x27    │  │   SID 0x10       │
    │Security Access│  │Session Control   │
    └───────────────┘  └──────────────────┘
         LEVEL 1            LEVEL 1
       (Security)          (Session)


  Dependency Rules:
  ─────────────────
  1. SID 0x10 must be called first (Programming/Extended Session)
  2. SID 0x27 must unlock security (for protected memory)
  3. SID 0x34 or 0x35 must establish transfer context
  4. Only then SID 0x36 is available
```

### Service Call Order

```
┌─────────────────────────────────────────────────────────────┐
│              MANDATORY SERVICE CALL SEQUENCE                │
└─────────────────────────────────────────────────────────────┘

    STEP 1              STEP 2              STEP 3
 ┌──────────┐       ┌──────────┐       ┌──────────┐
 │ SID 0x10 │──────▶│ SID 0x27 │──────▶│ SID 0x34 │
 │ Session  │       │ Security │       │ Request  │
 │ Control  │       │ Access   │       │ Download │
 └──────────┘       └──────────┘       └──────────┘
      │                  │                  │
      │                  │                  │
   REQUIRED           REQUIRED           REQUIRED
  (Programming)      (Unlocked)       (Transfer Setup)
      │                  │                  │
      └──────────────────┴──────────────────┘
                         │
                         ▼
                  ┌──────────┐
                  │ SID 0x36 │  ✓ NOW AVAILABLE
                  │ Transfer │
                  │ Data     │
                  └────┬─────┘
                       │
                       │ After all blocks
                       ▼
                  ┌──────────┐
                  │ SID 0x37 │
                  │ Transfer │
                  │ Exit     │
                  └──────────┘


  ⚠️  Skipping any step results in NRC rejection
```

### Related Services Overview

```
┌─────────────────────────────────────────────────────────────┐
│              SERVICES RELATED TO SID 0x36                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Before Transfer Data:                                      │
│  ────────────────────                                       │
│    SID 0x10 - Diagnostic Session Control (REQUIRED)         │
│    SID 0x27 - Security Access (REQUIRED for flash)          │
│    SID 0x28 - Communication Control (Optional: disable RX)  │
│    SID 0x34 - Request Download (REQUIRED for download)      │
│    SID 0x35 - Request Upload (REQUIRED for upload)          │
│                                                             │
│  During Transfer Data:                                      │
│  ────────────────────                                       │
│    SID 0x36 - Transfer Data (THIS SERVICE)                  │
│    SID 0x3E - Tester Present (Keep session alive)           │
│                                                             │
│  After Transfer Data:                                       │
│  ───────────────────                                        │
│    SID 0x37 - Request Transfer Exit (REQUIRED)              │
│    SID 0x31 - Routine Control (Checksum verification)       │
│    SID 0x22 - Read Data By ID (Verify programming)          │
│    SID 0x28 - Communication Control (Re-enable RX)          │
│    SID 0x11 - ECU Reset (Activate new software)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### Session Compatibility Table

```
┌────────────────────────┬──────────┬─────────────────────────┐
│   Session Type         │   Code   │ Transfer Data Support   │
├────────────────────────┼──────────┼─────────────────────────┤
│ Default Session        │   0x01   │   ❌ NOT SUPPORTED      │
├────────────────────────┼──────────┼─────────────────────────┤
│ Programming Session    │   0x02   │   ✅ SUPPORTED          │
├────────────────────────┼──────────┼─────────────────────────┤
│ Extended Session       │   0x03   │   ✅ SUPPORTED*         │
│                        │          │   (*for non-flash ops)  │
├────────────────────────┼──────────┼─────────────────────────┤
│ Safety System Session  │   0x04   │   ⚠️  ECU-DEPENDENT     │
└────────────────────────┴──────────┴─────────────────────────┘
```

### Security Requirements by Operation Type

```
┌────────────────────────┬──────────────┬─────────────────────┐
│   Operation Type       │ Session Req  │ Security Required   │
├────────────────────────┼──────────────┼─────────────────────┤
│ Flash Programming      │  0x02 (Prog) │  ✅ YES (Level 1+)  │
├────────────────────────┼──────────────┼─────────────────────┤
│ Calibration Data       │  0x02/0x03   │  ✅ YES (Level 1+)  │
├────────────────────────┼──────────────┼─────────────────────┤
│ Read Fault Memory      │  0x03 (Ext)  │  ❌ NO              │
├────────────────────────┼──────────────┼─────────────────────┤
│ Configuration Upload   │  0x03 (Ext)  │  ⚠️  MAYBE          │
├────────────────────────┼──────────────┼─────────────────────┤
│ Bootloader Update      │  0x02 (Prog) │  ✅ YES (Level 2+)  │
└────────────────────────┴──────────────┴─────────────────────┘
```

### Timing Requirements

```
┌────────────────────────┬──────────────┬─────────────────────┐
│   Timing Parameter     │ Typical Value│ Description         │
├────────────────────────┼──────────────┼─────────────────────┤
│ P2 Server (Normal)     │  50-150 ms   │ Response time       │
├────────────────────────┼──────────────┼─────────────────────┤
│ P2* Extended           │  5000 ms     │ Flash write time    │
├────────────────────────┼──────────────┼─────────────────────┤
│ S3 Server Timeout      │  5000 ms     │ Session timeout     │
├────────────────────────┼──────────────┼─────────────────────┤
│ Inter-block Delay      │  0-50 ms     │ Between blocks      │
├────────────────────────┼──────────────┼─────────────────────┤
│ Tester Present Interval│  2000 ms     │ Keep-alive period   │
└────────────────────────┴──────────────┴─────────────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Simple Flash Programming (Single Region)

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: Flash Programming (64KB Application)          │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ PHASE 1: Setup                 │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  1. SID 0x10 Sub 0x02                  │
    │     (Programming Session)              │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 50 02 [P2*]                 │
    │◀───────────────────────────────────────│
    │         ✓ Session Active               │
    │                                        │
    │  2. SID 0x27 Sub 0x01                  │
    │     (Request Seed)                     │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 67 01 [Seed]                │
    │◀───────────────────────────────────────│
    │                                        │
    │  3. SID 0x27 Sub 0x02                  │
    │     (Send Key)                         │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 67 02                       │
    │◀───────────────────────────────────────│
    │         ✓ Security Unlocked 🔓         │
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ PHASE 2: Initiate Transfer     │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  4. SID 0x34                           │
    │     Data Format: 0x00                  │
    │     Address: 00 00 01 00 00 (0x10000)  │
    │     Size:    00 00 01 00 00 (64KB)     │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 74 20                       │
    │     maxBlockLength: 0x1000 (4096 bytes)│
    │◀───────────────────────────────────────│
    │         ✓ Transfer Ready               │
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ PHASE 3: Transfer Data         │     │
    │ │ (16 blocks × 4096 bytes)       │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  5. SID 0x36 BSC 01 [4096 bytes]       │
    │───────────────────────────────────────▶│
    │  Response: 76 01                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 1 Written              │
    │                                        │
    │  6. SID 0x36 BSC 02 [4096 bytes]       │
    │───────────────────────────────────────▶│
    │  Response: 76 02                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 2 Written              │
    │                                        │
    │     ... (Blocks 3-15) ...              │
    │                                        │
    │  21. SID 0x36 BSC 10 [4096 bytes]      │
    │───────────────────────────────────────▶│
    │  Response: 76 10                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 16 Written             │
    │         ✓ All 65536 bytes transferred  │
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ PHASE 4: Finalize & Verify     │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  22. SID 0x37                          │
    │      (Request Transfer Exit)           │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │         ✓ Transfer Complete            │
    │                                        │
    │  23. SID 0x31 Sub 0x01                 │
    │      Routine ID: 0x0202 (CRC Check)    │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 71 01 02 02 [CRC OK]        │
    │◀───────────────────────────────────────│
    │         ✓ Checksum Valid               │
    │                                        │
    │  24. SID 0x11 Sub 0x01                 │
    │      (Hard Reset)                      │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 51 01                       │
    │◀───────────────────────────────────────│
    │                                        │
    │      [ECU Reboots with new software]   │
    │                                        │
    │         ✅ PROGRAMMING COMPLETE         │
```

---

### Workflow 2: Multi-Region Flash Programming

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: Multi-Region Flash (Bootloader + Application) │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Setup Phase - Same as Workflow 1]    │
    │  (Session 0x10, Security 0x27)         │
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ REGION 1: Bootloader (32KB)    │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  SID 0x34                              │
    │  Address: 0x00000000 (Flash Start)     │
    │  Size:    0x00008000 (32KB)            │
    │───────────────────────────────────────▶│
    │  Response: 74 20 (maxBlock=4KB)        │
    │◀───────────────────────────────────────│
    │                                        │
    │  Transfer Loop: 8 blocks               │
    │  SID 0x36 BSC 01 → 08                  │
    │───────────────────────────────────────▶│
    │  Response: 76 01 → 76 08               │
    │◀───────────────────────────────────────│
    │         ✓ Bootloader Transferred       │
    │                                        │
    │  SID 0x37 (Exit)                       │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ REGION 2: Application (128KB)  │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  SID 0x34                              │
    │  Address: 0x00010000                   │
    │  Size:    0x00020000 (128KB)           │
    │───────────────────────────────────────▶│
    │  Response: 74 20 (maxBlock=4KB)        │
    │◀───────────────────────────────────────│
    │                                        │
    │  Transfer Loop: 32 blocks              │
    │  SID 0x36 BSC 01 → 20 (hex)            │
    │───────────────────────────────────────▶│
    │  Response: 76 01 → 76 20               │
    │◀───────────────────────────────────────│
    │         ✓ Application Transferred      │
    │                                        │
    │  SID 0x37 (Exit)                       │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ REGION 3: Calibration (16KB)   │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  SID 0x34                              │
    │  Address: 0x00030000                   │
    │  Size:    0x00004000 (16KB)            │
    │───────────────────────────────────────▶│
    │  Response: 74 20 (maxBlock=4KB)        │
    │◀───────────────────────────────────────│
    │                                        │
    │  Transfer Loop: 4 blocks               │
    │  SID 0x36 BSC 01 → 04                  │
    │───────────────────────────────────────▶│
    │  Response: 76 01 → 76 04               │
    │◀───────────────────────────────────────│
    │         ✓ Calibration Transferred      │
    │                                        │
    │  SID 0x37 (Exit)                       │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │  Verify All Regions + Reset            │
    │                                        │
    │  ✅ MULTI-REGION PROGRAMMING COMPLETE   │


  ⚠️  NOTE: BSC counter restarts at 0x01 for each new SID 0x34
```

---

### Workflow 3: Data Upload from ECU

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 3: Upload Fault Memory Data from ECU             │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  1. SID 0x10 Sub 0x03                  │
    │     (Extended Diagnostic Session)      │
    │───────────────────────────────────────▶│
    │  Response: 50 03                       │
    │◀───────────────────────────────────────│
    │         ✓ Extended Session Active      │
    │                                        │
    │  2. SID 0x35 (Request Upload)          │
    │     Address: 0x80000000 (Fault Memory) │
    │     Size:    0x00001000 (4KB)          │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 75 20                       │
    │     maxBlockLength: 0x0400 (1024 bytes)│
    │◀───────────────────────────────────────│
    │         ✓ Upload Ready                 │
    │                                        │
    │  3. SID 0x36 BSC 01 (Request Block)    │
    │     (No data sent, request only)       │
    │───────────────────────────────────────▶│
    │                                        │
    │  Response: 76 01 [1024 bytes of data]  │
    │◀───────────────────────────────────────│
    │         ✓ Received Block 1             │
    │                                        │
    │  4. SID 0x36 BSC 02                    │
    │───────────────────────────────────────▶│
    │  Response: 76 02 [1024 bytes]          │
    │◀───────────────────────────────────────│
    │         ✓ Received Block 2             │
    │                                        │
    │  5. SID 0x36 BSC 03                    │
    │───────────────────────────────────────▶│
    │  Response: 76 03 [1024 bytes]          │
    │◀───────────────────────────────────────│
    │         ✓ Received Block 3             │
    │                                        │
    │  6. SID 0x36 BSC 04                    │
    │───────────────────────────────────────▶│
    │  Response: 76 04 [1024 bytes]          │
    │◀───────────────────────────────────────│
    │         ✓ Received Block 4             │
    │         ✓ All 4096 bytes uploaded      │
    │                                        │
    │  7. SID 0x37 (Transfer Exit)           │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │  ✅ UPLOAD COMPLETE                     │
    │  (Fault memory data now in tester)     │


  Difference from Download:
  ─────────────────────────
  • Upload: SID 0x35 → SID 0x36 (ECU sends data TO tester)
  • Download: SID 0x34 → SID 0x36 (Tester sends data TO ECU)
  • Upload requests are smaller (just SID + BSC, no data)
  • Upload responses contain the actual data
```

---

### Workflow 4: Programming with Voltage Drop Recovery

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 4: Flash Programming with Voltage Recovery       │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Setup + Start Transfer]              │
    │  (Session, Security, SID 0x34)         │
    │                                        │
    │  SID 0x36 BSC 01 [4096 bytes]          │
    │───────────────────────────────────────▶│
    │  Response: 76 01                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 1 OK                   │
    │                                        │
    │  SID 0x36 BSC 02 [4096 bytes]          │
    │───────────────────────────────────────▶│
    │  Response: 76 02                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 2 OK                   │
    │                                        │
    │  SID 0x36 BSC 03 [4096 bytes]          │
    │───────────────────────────────────────▶│
    │                                        │
    │      ⚠️  Voltage drops to 10.5V!       │
    │                                        │
    │  Response: 7F 36 93                    │
    │◀───────────────────────────────────────│
    │         ❌ Voltage Too Low              │
    │                                        │
    │  [Connect battery charger]             │
    │  [Wait for voltage to stabilize]       │
    │  [Voltage now 12.5V]                   │
    │                                        │
    │  SID 0x36 BSC 03 [4096 bytes]          │
    │  ← RETRY SAME BLOCK (BSC=03)           │
    │───────────────────────────────────────▶│
    │  Response: 76 03                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 3 OK (Recovered)       │
    │                                        │
    │  SID 0x36 BSC 04 [4096 bytes]          │
    │───────────────────────────────────────▶│
    │  Response: 76 04                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 4 OK                   │
    │                                        │
    │  [Continue normal transfer]            │
    │                                        │
    │  ✅ PROGRAMMING COMPLETE                │


  Recovery Strategy:
  ──────────────────
  • NRC 0x71 or 0x93: Recoverable errors
  • Do NOT increment BSC
  • Retry the SAME block after condition clears
  • Continue sequence normally after recovery
```

---

### Workflow 5: Programming Failure and Restart

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 5: Programming Failure Recovery                  │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Setup + Start Transfer]              │
    │                                        │
    │  SID 0x36 BSC 01 → 05 [Blocks 1-5]     │
    │───────────────────────────────────────▶│
    │  Response: 76 01 → 76 05               │
    │◀───────────────────────────────────────│
    │         ✓ Blocks 1-5 OK                │
    │                                        │
    │  SID 0x36 BSC 06 [4096 bytes]          │
    │───────────────────────────────────────▶│
    │                                        │
    │      ❌ Flash write failed!            │
    │      ❌ Memory verification error      │
    │                                        │
    │  Response: 7F 36 72                    │
    │◀───────────────────────────────────────│
    │         ❌ Programming Failure (CRITICAL)│
    │                                        │
    │  ⚠️  STOP ALL OPERATIONS               │
    │                                        │
    │  SID 0x11 Sub 0x01 (Hard Reset)        │
    │───────────────────────────────────────▶│
    │  Response: 51 01                       │
    │◀───────────────────────────────────────│
    │                                        │
    │      [ECU Reboots]                     │
    │      [Wait 2 seconds]                  │
    │                                        │
    │ ┌────────────────────────────────┐     │
    │ │ RESTART ENTIRE SEQUENCE        │     │
    │ └────────────────────────────────┘     │
    │                                        │
    │  1. SID 0x10 Sub 0x02 (Programming)    │
    │───────────────────────────────────────▶│
    │  Response: 50 02                       │
    │◀───────────────────────────────────────│
    │                                        │
    │  2. SID 0x27 (Security Access)         │
    │───────────────────────────────────────▶│
    │  [Complete seed/key exchange]          │
    │◀───────────────────────────────────────│
    │                                        │
    │  3. SID 0x34 (Request Download)        │
    │     RESTART FROM BEGINNING             │
    │───────────────────────────────────────▶│
    │  Response: 74 20                       │
    │◀───────────────────────────────────────│
    │                                        │
    │  4. SID 0x36 BSC 01 [4096 bytes]       │
    │     START FRESH (BSC=01)               │
    │───────────────────────────────────────▶│
    │  Response: 76 01                       │
    │◀───────────────────────────────────────│
    │                                        │
    │  [Complete all blocks successfully]    │
    │                                        │
    │  ✅ PROGRAMMING COMPLETE                │


  CRITICAL RULES for NRC 0x72:
  ─────────────────────────────
  • Programming Failure is NON-RECOVERABLE
  • Cannot retry same block
  • MUST reset ECU
  • MUST restart entire programming sequence
  • Start from SID 0x10 again
```

---

### Workflow 6: Long Transfer with Tester Present

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 6: Large Transfer with Session Keep-Alive        │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Setup Phase Complete]                │
    │  Session Timeout (S3): 5000 ms         │
    │                                        │
    │  Start Transfer (Large file: 512KB)    │
    │  Estimated time: 45 seconds            │
    │                                        │
    │  Time: 0s                              │
    │  SID 0x36 BSC 01-10 [Blocks 1-10]      │
    │───────────────────────────────────────▶│
    │  Response: 76 01-10                    │
    │◀───────────────────────────────────────│
    │         ✓ 10 blocks transferred        │
    │                                        │
    │  Time: 4s  (Approaching S3 timeout!)   │
    │  SID 0x3E Sub 0x00 (Tester Present)    │
    │───────────────────────────────────────▶│
    │  Response: 7E 00                       │
    │◀───────────────────────────────────────│
    │         ✓ Session Extended             │
    │                                        │
    │  SID 0x36 BSC 11-20 [Blocks 11-20]     │
    │───────────────────────────────────────▶│
    │  Response: 76 11-20                    │
    │◀───────────────────────────────────────│
    │                                        │
    │  Time: 8s                              │
    │  SID 0x3E Sub 0x00                     │
    │───────────────────────────────────────▶│
    │  Response: 7E 00                       │
    │◀───────────────────────────────────────│
    │         ✓ Session Extended             │
    │                                        │
    │  [Continue pattern: Transfer + 0x3E]   │
    │  ...                                   │
    │                                        │
    │  Time: 44s                             │
    │  SID 0x36 BSC 7F-80 [Final blocks]     │
    │───────────────────────────────────────▶│
    │  Response: 76 7F-80                    │
    │◀───────────────────────────────────────│
    │         ✓ All blocks transferred       │
    │                                        │
    │  SID 0x37 (Exit)                       │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │  ✅ LONG TRANSFER COMPLETE              │


  Tester Present Strategy:
  ────────────────────────
  • S3 timeout typically 5000 ms
  • Send SID 0x3E every 2000-3000 ms to be safe
  • Interleave between block transfers
  • Prevents session timeout during long operations
```

---

### Workflow 7: BSC Wrap-Around (256+ Blocks)

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW 7: Large Transfer with BSC Wrap-Around           │
└─────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │  [Setup for large transfer]            │
    │  Total Size: 1MB                       │
    │  Block Size: 4KB                       │
    │  Total Blocks: 256 blocks              │
    │                                        │
    │  Blocks 1-254                          │
    │  SID 0x36 BSC 01 → FE                  │
    │───────────────────────────────────────▶│
    │  Response: 76 01 → 76 FE               │
    │◀───────────────────────────────────────│
    │         ✓ Blocks 1-254 OK              │
    │                                        │
    │  Block 255                             │
    │  SID 0x36 BSC FF [4096 bytes]          │
    │───────────────────────────────────────▶│
    │  Response: 76 FF                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 255 OK                 │
    │                                        │
    │  ⚠️  BSC WRAP-AROUND POINT!             │
    │  Next BSC = 0x01 (NOT 0x00)            │
    │                                        │
    │  Block 256                             │
    │  SID 0x36 BSC 01 [4096 bytes]          │
    │  ← WRAPPED TO 0x01                     │
    │───────────────────────────────────────▶│
    │  Response: 76 01                       │
    │◀───────────────────────────────────────│
    │         ✓ Block 256 OK (Wrapped)       │
    │                                        │
    │  SID 0x37 (Exit)                       │
    │───────────────────────────────────────▶│
    │  Response: 77                          │
    │◀───────────────────────────────────────│
    │                                        │
    │  ✅ WRAP-AROUND TRANSFER COMPLETE       │


  BSC Wrap-Around Rules:
  ──────────────────────
  • BSC range: 0x01 to 0xFF (1-255)
  • After 0xFF, wrap to 0x01
  • NEVER use 0x00 as BSC
  • ECU tracks expected BSC internally
  • Tester must implement wrap logic
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Full ECU Reprogramming Sequence

```
┌─────────────────────────────────────────────────────────────┐
│        PATTERN 1: Complete ECU Reprogramming                │
└─────────────────────────────────────────────────────────────┘

    Service Flow                    Purpose
    ────────────                    ───────
    
    SID 0x10 (0x02)      →     Enter Programming Session
         │
         ▼
    SID 0x28 (0x03)      →     Disable Non-Diagnostic Messages
         │
         ▼
    SID 0x27 (0x01/0x02) →     Unlock Security (Seed/Key)
         │
         ▼
    SID 0x31 (0x01, 0xFF00) →  Erase Flash Memory
         │
         ▼
    SID 0x34             →     Request Download (Setup)
         │
         ▼
    SID 0x36 (Multiple)  →     Transfer All Blocks
         │
         ▼
    SID 0x37             →     Exit Transfer
         │
         ▼
    SID 0x31 (0x01, 0x0202) →  Verify Checksum/CRC
         │
         ▼
    SID 0x31 (0x01, 0xFF01) →  Check Dependencies
         │
         ▼
    SID 0x28 (0x00)      →     Re-enable Messages
         │
         ▼
    SID 0x11 (0x01)      →     Hard Reset ECU
         │
         ▼
      New Software Active
```

---

### Pattern 2: Calibration Data Update

```
┌─────────────────────────────────────────────────────────────┐
│        PATTERN 2: Calibration Data Update Only              │
└─────────────────────────────────────────────────────────────┘

    Service Flow                    Purpose
    ────────────                    ───────
    
    SID 0x10 (0x02)      →     Enter Programming Session
         │
         ▼
    SID 0x27 (0x01/0x02) →     Unlock Security
         │
         ▼
    SID 0x34             →     Request Download (Calibration Area)
         │                     Address: 0x00030000
         │                     Size: 16KB
         ▼
    SID 0x36 (×4)        →     Transfer 4 blocks of calibration
         │
         ▼
    SID 0x37             →     Exit Transfer
         │
         ▼
    SID 0x2E (DID 0xF15A)→     Write Calibration Version Number
         │
         ▼
    SID 0x11 (0x01)      →     Reset to Apply Changes
         │
         ▼
      Updated Calibration Active
```

---

### Pattern 3: Read ECU Flash for Backup

```
┌─────────────────────────────────────────────────────────────┐
│        PATTERN 3: Flash Memory Backup (Upload)              │
└─────────────────────────────────────────────────────────────┘

    Service Flow                    Purpose
    ────────────                    ───────
    
    SID 0x10 (0x03)      →     Enter Extended Session
         │
         ▼
    SID 0x27 (0x01/0x02) →     Unlock Security (if required)
         │
         ▼
    SID 0x35             →     Request Upload
         │                     Address: 0x00000000
         │                     Size: Full Flash (512KB)
         ▼
    SID 0x36 (Multiple)  →     Read All Blocks FROM ECU
         │                     (ECU sends data in response)
         ▼
    SID 0x37             →     Exit Upload
         │
         ▼
    Save to File         →     Store backup on tester
         │
         ▼
      Backup Complete
```

---

### Pattern 4: Failed Programming Recovery

```
┌─────────────────────────────────────────────────────────────┐
│        PATTERN 4: Programming Failure Recovery              │
└─────────────────────────────────────────────────────────────┘

    Failure Detection              Recovery Actions
    ─────────────────              ────────────────
    
    SID 0x36 Block N     →     Returns NRC 0x72
         │                     (Programming Failure)
         ▼
    STOP Transfer        →     Do NOT send more blocks
         │
         ▼
    SID 0x11 (0x01)      →     Hard Reset ECU
         │
         ▼
    [Wait 2 seconds]     →     Allow ECU to stabilize
         │
         ▼
    SID 0x10 (0x02)      →     Re-enter Programming Session
         │
         ▼
    SID 0x27 (Seed/Key)  →     Re-authenticate
         │
         ▼
    SID 0x31 (Erase)     →     Erase flash again
         │
         ▼
    SID 0x34             →     Restart Download (from beginning)
         │
         ▼
    SID 0x36 (All)       →     Re-transfer ALL blocks
         │
         ▼
    SID 0x37             →     Complete transfer
         │
         ▼
    SID 0x31 (Verify)    →     Verify successful
         │
         ▼
      Programming Complete
```

---

### Pattern 5: Partial Region Update with Verification

```
┌─────────────────────────────────────────────────────────────┐
│    PATTERN 5: Update Single Region with Read-Back Verify   │
└─────────────────────────────────────────────────────────────┘

    Service Flow                    Purpose
    ────────────                    ───────
    
    SID 0x10 (0x02)      →     Enter Programming Session
         │
         ▼
    SID 0x27             →     Unlock Security
         │
         ▼
    SID 0x22 (DID 0xF18C)→     Read Current Software Version
         │                     (Before update)
         ▼
    SID 0x34             →     Request Download (Region 2 only)
         │                     Address: 0x00010000
         │                     Size: 128KB
         ▼
    SID 0x36 (×32)       →     Transfer 32 blocks
         │
         ▼
    SID 0x37             →     Exit Transfer
         │
         ▼
    SID 0x35             →     Request Upload (Read-Back Verify)
         │                     Same Address & Size
         ▼
    SID 0x36 (×32)       →     Read back uploaded data
         │
         ▼
    SID 0x37             →     Exit Upload
         │
         ▼
    Compare Data         →     Verify uploaded = downloaded
         │
         ▼
    SID 0x22 (DID 0xF18C)→     Read New Software Version
         │                     (After update)
         ▼
    SID 0x11 (0x01)      →     Reset ECU
         │
         ▼
      Verified Update Complete
```

---

## Troubleshooting Scenarios

### Scenario 1: Transfer Stuck After Few Blocks

```
┌─────────────────────────────────────────────────────────────┐
│  PROBLEM: Transfer stops responding after 3-5 blocks        │
└─────────────────────────────────────────────────────────────┘

  SYMPTOMS:
  ─────────
  • First few blocks transfer successfully (76 01, 76 02...)
  • Suddenly no response from ECU
  • Timeout on subsequent requests

  DIAGNOSTIC STEPS:
  ─────────────────
  
    Step 1: Check Session Timeout
    ┌──────────────────────────────────┐
    │ Has S3 timeout expired?          │
    │ Default: 5000 ms                 │
    │                                  │
    │ Solution:                        │
    │ Send SID 0x3E (Tester Present)   │
    │ every 2-3 seconds during transfer│
    └──────────────────────────────────┘
    
    Step 2: Check Voltage
    ┌──────────────────────────────────┐
    │ Monitor vehicle voltage          │
    │ Required: 11.0V - 15.5V          │
    │                                  │
    │ Solution:                        │
    │ Connect battery maintainer       │
    │ Retry from last successful block │
    └──────────────────────────────────┘
    
    Step 3: Check CAN Bus
    ┌──────────────────────────────────┐
    │ Verify CAN communication active  │
    │ Check for bus errors             │
    │                                  │
    │ Solution:                        │
    │ Reset CAN adapter                │
    │ Verify connections               │
    │ Restart from SID 0x34            │
    └──────────────────────────────────┘
```

---

### Scenario 2: Receiving NRC 0x24 on Every Block

```
┌─────────────────────────────────────────────────────────────┐
│  PROBLEM: Sequence error on every transfer attempt          │
└─────────────────────────────────────────────────────────────┘

  SYMPTOMS:
  ─────────
  • SID 0x36 BSC 01 returns: 7F 36 24
  • Every block returns sequence error
  • Cannot transfer any data

  DIAGNOSTIC STEPS:
  ─────────────────
  
    Step 1: Verify SID 0x34 was called
    ┌──────────────────────────────────┐
    │ Did you call SID 0x34 first?     │
    │                                  │
    │ Solution:                        │
    │ 1. Send SID 0x34                 │
    │ 2. Wait for positive response    │
    │ 3. THEN send SID 0x36 BSC 01     │
    └──────────────────────────────────┘
    
    Step 2: Check BSC Starting Value
    ┌──────────────────────────────────┐
    │ BSC must start at 0x01           │
    │ NOT 0x00, NOT 0x02               │
    │                                  │
    │ Solution:                        │
    │ Start first block with BSC=0x01  │
    │ After each SID 0x34, reset to 01 │
    └──────────────────────────────────┘
    
    Step 3: Check for Previous Failed Transfer
    ┌──────────────────────────────────┐
    │ ECU may be in stuck state from   │
    │ previous incomplete transfer     │
    │                                  │
    │ Solution:                        │
    │ 1. SID 0x11 (Reset ECU)          │
    │ 2. Wait 2 seconds                │
    │ 3. Restart from SID 0x10         │
    └──────────────────────────────────┘
```

---

### Scenario 3: Transfer Completes but Checksum Fails

```
┌─────────────────────────────────────────────────────────────┐
│  PROBLEM: All blocks transfer OK, but verification fails    │
└─────────────────────────────────────────────────────────────┘

  SYMPTOMS:
  ─────────
  • All SID 0x36 blocks return 76 XX (success)
  • SID 0x37 returns 77 (success)
  • SID 0x31 checksum routine fails

  DIAGNOSTIC STEPS:
  ─────────────────
  
    Step 1: Verify Block Boundaries
    ┌──────────────────────────────────┐
    │ Check if data was split correctly│
    │ at block boundaries              │
    │                                  │
    │ Verify:                          │
    │ • Total bytes = exact file size  │
    │ • No extra bytes added/removed   │
    │ • Last block sized correctly     │
    └──────────────────────────────────┘
    
    Step 2: Check Byte Order
    ┌──────────────────────────────────┐
    │ Verify endianness                │
    │ • Intel format (little-endian)?  │
    │ • Motorola (big-endian)?         │
    │                                  │
    │ Solution:                        │
    │ Convert file to ECU's expected   │
    │ byte order before transfer       │
    └──────────────────────────────────┘
    
    Step 3: Upload and Compare
    ┌──────────────────────────────────┐
    │ Use SID 0x35 to read back data   │
    │ Compare byte-by-byte with source │
    │                                  │
    │ Find:                            │
    │ • Where mismatch occurs          │
    │ • Pattern of corruption          │
    │ • Specific block with issue      │
    └──────────────────────────────────┘
```

---

## Quick Reference Tables

### SID 0x36 Quick Facts

```
┌────────────────────────┬────────────────────────────────────┐
│   Attribute            │   Value                            │
├────────────────────────┼────────────────────────────────────┤
│ Service ID             │   0x36                             │
├────────────────────────┼────────────────────────────────────┤
│ Response SID           │   0x76                             │
├────────────────────────┼────────────────────────────────────┤
│ Minimum Length         │   3 bytes (SID + BSC + 1 data byte)│
├────────────────────────┼────────────────────────────────────┤
│ BSC Range              │   0x01 to 0xFF (wraps to 0x01)     │
├────────────────────────┼────────────────────────────────────┤
│ Required Session       │   Programming (0x02) or Extended   │
├────────────────────────┼────────────────────────────────────┤
│ Security Required      │   YES (for flash/protected memory) │
├────────────────────────┼────────────────────────────────────┤
│ Must Follow            │   SID 0x34 or SID 0x35             │
├────────────────────────┼────────────────────────────────────┤
│ Must Precede           │   SID 0x37 (Request Transfer Exit) │
└────────────────────────┴────────────────────────────────────┘
```

### Common NRC Quick Reference

```
┌──────┬─────────────────────┬──────────────────────────────────┐
│ NRC  │  Meaning            │  Typical Cause                   │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x13 │ Incorrect Length    │ Block size doesn't match expected│
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x22 │ Conditions Not OK   │ No SID 0x34, wrong session       │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x24 │ Sequence Error      │ BSC out of order                 │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x31 │ Out of Range        │ Exceeded memory size             │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x33 │ Security Denied     │ Security not unlocked            │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x71 │ Transfer Suspended  │ Voltage/temp issue (recoverable) │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x72 │ Programming Failure │ Flash write failed (CRITICAL)    │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x92 │ Voltage Too High    │ Voltage > 15.5V                  │
├──────┼─────────────────────┼──────────────────────────────────┤
│ 0x93 │ Voltage Too Low     │ Voltage < 11.0V                  │
└──────┴─────────────────────┴──────────────────────────────────┘
```

### Service Interaction Summary

```
┌───────────┬──────────────────────┬───────────────────────────┐
│  Service  │  When Used with 0x36 │  Purpose                  │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x10      │  BEFORE (Required)   │  Enter programming session│
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x27      │  BEFORE (Required)   │  Unlock security access   │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x28      │  BEFORE (Optional)   │  Disable non-diag msgs    │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x31      │  BEFORE (Optional)   │  Erase flash              │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x34      │  BEFORE (Required)   │  Setup download context   │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x35      │  BEFORE (Alternative)│  Setup upload context     │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x3E      │  DURING (Recommended)│  Keep session alive       │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x37      │  AFTER (Required)    │  Complete transfer        │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x31      │  AFTER (Recommended) │  Verify checksum/CRC      │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x22      │  AFTER (Optional)    │  Read version/status      │
├───────────┼──────────────────────┼───────────────────────────┤
│ 0x11      │  AFTER (Common)      │  Reset ECU                │
└───────────┴──────────────────────┴───────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│         SID 0x36 SERVICE INTERACTIONS SUMMARY               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ SID 0x36 requires strict service call sequence          │
│  ✓ Always start with: 0x10 → 0x27 → 0x34/0x35 → 0x36       │
│  ✓ BSC restarts at 0x01 for each new SID 0x34              │
│  ✓ Use SID 0x3E during long transfers (keep session alive) │
│  ✓ Always complete with SID 0x37 before next operation     │
│  ✓ NRC 0x71/0x93: Recoverable - retry same block           │
│  ✓ NRC 0x72: Critical - restart entire programming         │
│  ✓ Verify programming with SID 0x31 (checksum) after 0x37  │
│  ✓ Multi-region programming: repeat 0x34→0x36→0x37 cycle   │
│  ✓ Upload (SID 0x35) uses same 0x36 but ECU sends data     │
│  ✓ Monitor voltage continuously during flash operations    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Complete Documentation Set:**
- Read: [SID_36_TRANSFER_DATA.md](SID_36_TRANSFER_DATA.md) - Theoretical concepts and message formats
- Read: [SID_36_PRACTICAL_IMPLEMENTATION.md](SID_36_PRACTICAL_IMPLEMENTATION.md) - Implementation flowcharts and testing
- **You are here:** [SID_36_SERVICE_INTERACTIONS.md](SID_36_SERVICE_INTERACTIONS.md) - Complete workflows and patterns
