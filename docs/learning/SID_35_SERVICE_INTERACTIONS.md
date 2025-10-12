# SID 0x35: Service Interactions and Workflows

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.6

---

## Table of Contents
1. [Service Dependency Pyramid](#service-dependency-pyramid)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Workflow Examples](#workflow-examples)
4. [Multi-Service Patterns](#multi-service-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Pyramid

### Upload Service Stack

```
┌────────────────────────────────────────────────────────────────┐
│              SERVICE DEPENDENCY HIERARCHY                       │
│                  (Bottom to Top)                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    ┌─────────────────┐                         │
│                    │   Application   │                         │
│                    │  Layer (Tester) │                         │
│                    │  Data Storage   │                         │
│                    └────────┬────────┘                         │
│                             │                                  │
│                             │ Uses                             │
│                             ▼                                  │
│              ┌──────────────────────────┐                      │
│              │  Request Transfer Exit   │                      │
│              │       (0x37)             │                      │
│              │  Finalizes upload        │                      │
│              └──────────┬───────────────┘                      │
│                         │                                      │
│                         │ Completes                            │
│                         ▼                                      │
│              ┌──────────────────────────┐                      │
│              │   Transfer Data (0x36)   │                      │
│              │   Receives data blocks   │                      │
│              │   from ECU               │                      │
│              └──────────┬───────────────┘                      │
│                         │                                      │
│                         │ Initiated by                         │
│                         ▼                                      │
│              ┌──────────────────────────┐                      │
│              │  Request Upload (0x35)   │ ◄── YOU ARE HERE    │
│              │  Starts upload sequence  │                      │
│              └──────────┬───────────────┘                      │
│                         │                                      │
│             ┌───────────┴────────────┐                         │
│             │                        │                         │
│             ▼                        ▼                         │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │ Security Access  │    │ Session Control  │                 │
│  │    (0x27)        │    │     (0x10)       │                 │
│  │  Unlocks ECU     │    │  Sets PROG mode  │                 │
│  └──────────────────┘    └──────────────────┘                 │
│           │                        │                           │
│           └────────────┬───────────┘                           │
│                        │                                       │
│                   Prerequisites                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Service Call Order

```
┌────────────────────────────────────────────────────────────────┐
│                  MANDATORY CALL SEQUENCE                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1️⃣  Diagnostic Session Control (0x10 0x02)                   │
│      └─> Switches to PROGRAMMING session                       │
│                                                                │
│  2️⃣  Security Access (0x27 0x01 + 0x27 0x02)                  │
│      └─> Unlocks ECU for protected operations                  │
│                                                                │
│  3️⃣  Request Upload (0x35)                                    │
│      └─> Initiates upload, ECU prepares memory                 │
│                                                                │
│  4️⃣  Transfer Data (0x36) [Multiple calls]                    │
│      └─> ECU sends data blocks to tester                       │
│                                                                │
│  5️⃣  Request Transfer Exit (0x37)                             │
│      └─> Finalizes upload, cleanup                             │
│                                                                │
│  Optional: Tester Present (0x3E)                               │
│      └─> Prevents timeout during long operations               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### Session Compatibility Table

```
┌──────────────────────┬──────────┬──────────┬──────────────────┐
│ Service              │ DEFAULT  │ EXTENDED │ PROGRAMMING      │
│                      │  (0x01)  │  (0x03)  │    (0x02)        │
├──────────────────────┼──────────┼──────────┼──────────────────┤
│ Request Upload       │    ❌    │    ❌    │       ✅         │
│ (0x35)               │   0x70   │   0x70   │   Allowed        │
├──────────────────────┼──────────┼──────────┼──────────────────┤
│ Transfer Data        │    ❌    │    ❌    │   ✅ (if active) │
│ (0x36)               │   N/A    │   N/A    │   Allowed        │
├──────────────────────┼──────────┼──────────┼──────────────────┤
│ Transfer Exit        │    ❌    │    ❌    │   ✅ (if active) │
│ (0x37)               │   N/A    │   N/A    │   Allowed        │
├──────────────────────┼──────────┼──────────┼──────────────────┤
│ Security Access      │    ✅    │    ✅    │       ✅         │
│ (0x27)               │ Allowed  │ Allowed  │   Allowed        │
├──────────────────────┼──────────┼──────────┼──────────────────┤
│ Tester Present       │    ✅    │    ✅    │       ✅         │
│ (0x3E)               │ Allowed  │ Allowed  │   Allowed        │
└──────────────────────┴──────────┴──────────┴──────────────────┘
```

### Security Level Requirements

```
┌────────────────────────────────────────────────────────────────┐
│           SECURITY STATE REQUIREMENTS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Service: Request Upload (0x35)                                │
│                                                                │
│  ┌─────────────────┐                                           │
│  │  LOCKED 🔒      │  ──────> NRC 0x33 (Security Denied)       │
│  └─────────────────┘                                           │
│                                                                │
│  ┌─────────────────┐                                           │
│  │  UNLOCKED 🔓    │  ──────> Upload Allowed ✓                 │
│  └─────────────────┘                                           │
│                                                                │
│  How to Unlock:                                                │
│    1. Send Security Access Request Seed (0x27 0x01)            │
│    2. Receive seed from ECU                                    │
│    3. Calculate key from seed                                  │
│    4. Send Security Access Send Key (0x27 0x02 + key)          │
│    5. Receive confirmation (0x67 0x02)                         │
│    6. State becomes UNLOCKED 🔓                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Workflow Examples

### Example 1: Basic Firmware Backup

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: Complete Firmware Backup (Single Region)          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: Read 64KB firmware from flash memory                    │
│  Address: 0x00100000                                           │
│  Size: 65536 bytes (0x10000)                                   │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ 1. Session Control (0x10 0x02)   │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Session: PROGRAMMING   │
│    │ Response: [0x50][0x02][timing]   │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ 2. Request Seed (0x27 0x01)      │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Generate seed          │
│    │ Response: [0x67][0x01][seed...]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Calculate key from seed          │                        │
│    │                                  │                        │
│    │ 3. Send Key (0x27 0x02 + key)    │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Validate key           │
│    │ Response: [0x67][0x02]           │ State: UNLOCKED 🔓     │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ 4. Request Upload (0x35)         │                        │
│    │    [0x35][0x00][0x44]            │                        │
│    │    [0x00][0x10][0x00][0x00]      │                        │
│    │    [0x00][0x01][0x00][0x00]      │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare memory read    │
│    │                                  │ Upload state: ACTIVE   │
│    │ Response: [0x75][0x20][0x04][0x00]                        │
│    │          (max 1024 bytes/block)  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ 5. Transfer Data Loop            │                        │
│    │    Request: [0x36][0x01]         │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read block 1           │
│    │ Response: [0x76][0x01][data...]  │ 1024 bytes             │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │    Request: [0x36][0x02]         │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read block 2           │
│    │ Response: [0x76][0x02][data...]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │    ... (repeat for 64 blocks)    │                        │
│    │                                  │                        │
│    │    Request: [0x36][0x40]         │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read block 64 (last)   │
│    │ Response: [0x76][0x40][data...]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ 6. Request Transfer Exit (0x37)  │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Cleanup resources      │
│    │                                  │ Upload state: IDLE     │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Save 65536 bytes to file ✓       │                        │
│    │                                  │                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Example 2: Multi-Region Firmware Backup

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: Multi-Region Upload (Bootloader + Application)    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ [Session setup + Security 0x27]  │                        │
│    │ (same as Workflow 1)             │                        │
│    │                                  │                        │
│    │ Region 1: Bootloader             │                        │
│    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   Address: 0x00080000            │                        │
│    │   Size: 16384 bytes (16KB)       │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75][LFI][maxBlock]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36) loop        │                        │
│    │ [16 blocks of 1024 bytes]        │                        │
│    │<────────────────────────────────>│                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ✓ Bootloader saved: 16KB         │                        │
│    │                                  │                        │
│    │ Region 2: Application Firmware   │                        │
│    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   Address: 0x00100000            │                        │
│    │   Size: 131072 bytes (128KB)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75][LFI][maxBlock]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36) loop        │                        │
│    │ [128 blocks of 1024 bytes]       │                        │
│    │<────────────────────────────────>│                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ✓ Application saved: 128KB       │                        │
│    │                                  │                        │
│    │ Region 3: Calibration Data       │                        │
│    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   Address: 0x08000000            │                        │
│    │   Size: 8192 bytes (8KB)         │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75][LFI][maxBlock]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36) loop        │                        │
│    │ [8 blocks of 1024 bytes]         │                        │
│    │<────────────────────────────────>│                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ✓ Calibration saved: 8KB         │                        │
│    │                                  │                        │
│    │ Total backup: 152KB complete ✓   │                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Example 3: Compressed Data Upload

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 3: Upload with Compression                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: Upload 32KB data using compression                      │
│  Compression Method: 1 (e.g., DEFLATE)                         │
│  DFI: 0x10 (compression method 1, no encryption)               │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ [Setup: Session 0x10, Security 0x27]                      │
│    │                                  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   [0x35][0x10][0x44]             │ DFI=0x10 (compressed)  │
│    │   [address][size=32768]          │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare compression    │
│    │ Response: [0x75][0x20][0x04][0x00]                        │
│    │          (max 1024 bytes/block)  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x01)        │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read + compress block  │
│    │ Response: [0x76][0x01][data...]  │ ~600 bytes (compressed)│
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Decompress block 1 locally ✓     │                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x02)        │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read + compress block  │
│    │ Response: [0x76][0x02][data...]  │ ~580 bytes (compressed)│
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ... (continue for all blocks)    │                        │
│    │ Total compressed: ~19KB          │                        │
│    │ Uncompressed: 32KB               │                        │
│    │ Compression ratio: 59% ✓         │                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Bandwidth saved: ~13KB ✓         │                        │
│    │ Transfer time reduced 41% ✓      │                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Example 4: Encrypted Data Upload

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 4: Upload with Encryption                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: Securely upload sensitive calibration data              │
│  Encryption Method: 1 (e.g., AES-128)                          │
│  DFI: 0x01 (no compression, encryption method 1)               │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ [Setup: Session + Security]      │                        │
│    │                                  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   [0x35][0x01][0x44]             │ DFI=0x01 (encrypted)   │
│    │   [address=0x08000000]           │                        │
│    │   [size=4096]                    │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare encryption     │
│    │ Response: [0x75][0x20][0x02][0x00]                        │
│    │          (max 512 bytes/block)   │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x01)        │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read + encrypt block   │
│    │ Response: [0x76][0x01][encrypted]│ 512 bytes (encrypted)  │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Decrypt block 1 with key ✓       │                        │
│    │ Verify plaintext integrity ✓     │                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x02)        │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x76][0x02][encrypted]│                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ... (8 blocks total)             │                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ All data decrypted ✓             │                        │
│    │ Calibration data secure ✓        │                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Example 5: Upload with Keep-Alive

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 5: Large Upload with Tester Present                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: Upload very large firmware (512KB) without timeout      │
│  Session timeout: P2* = 5000ms                                 │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ [Setup: Session + Security]      │                        │
│    │                                  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   [address][size=524288]         │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75][LFI][maxBlock]  │ Start P2* timer (5s)   │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x01)        │                        │
│    │─────────────────────────────────>│ Reset timer ✓          │
│    │ Response: [0x76][0x01][data...]  │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ... (blocks 2-20)                │                        │
│    │                                  │ Timer at 3500ms        │
│    │                                  │                        │
│    │ Tester Present (0x3E 0x80)       │                        │
│    │─────────────────────────────────>│ Reset timer ✓          │
│    │ Response: [0x7E]                 │ Timer reset to 0       │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x15-0x28)   │                        │
│    │ ... (blocks 21-40)               │                        │
│    │                                  │ Timer at 3200ms        │
│    │                                  │                        │
│    │ Tester Present (0x3E 0x80)       │                        │
│    │─────────────────────────────────>│ Reset timer ✓          │
│    │ Response: [0x7E]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ ... (continue pattern)           │                        │
│    │ Send 0x3E every 20 blocks        │                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x200)       │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x76][0x200][data...] │ Last block ✓           │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ 512KB uploaded successfully ✓    │                        │
│    │ No timeout errors ✓              │                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Example 6: Diagnostic Log Extraction

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 6: Extract Diagnostic Logs from ECU                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Goal: Read crash logs and diagnostic data                     │
│  Log region: 0x20008000 (RAM)                                  │
│  Size: 2048 bytes                                              │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │                        │
│    │ [Setup: Session + Security]      │                        │
│    │                                  │                        │
│    │ Request Upload (0x35)            │                        │
│    │   [0x35][0x00][0x44]             │                        │
│    │   [0x20][0x00][0x80][0x00]       │ RAM log address        │
│    │   [0x00][0x00][0x08][0x00]       │ 2048 bytes             │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare log read       │
│    │ Response: [0x75][0x20][0x04][0x00]                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x01)        │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Read log block 1       │
│    │ Response: [0x76][0x01][log data] │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Parse log entry:                 │                        │
│    │   Timestamp: 2025-10-12 14:32:01 │                        │
│    │   Event: CAN Bus Error           │                        │
│    │   Code: 0xC0DE01                 │                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x02)        │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x76][0x02][log data] │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Save to: diagnostic_log.bin ✓    │                        │
│    │ Parse and display to user ✓      │                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Example 7: Upload vs Download Comparison

```
┌────────────────────────────────────────────────────────────────┐
│  WORKFLOW 7: Upload (0x35) vs Download (0x34) Comparison       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  UPLOAD (0x35): Read FROM ECU                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│  Tester                              ECU                       │
│    │ Request Upload (0x35)            │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare to SEND        │
│    │ Response: [0x75][maxBlock]       │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data REQUEST (0x36)     │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ ECU sends data →       │
│    │ Transfer Data RESPONSE (data)    │                        │
│    │<─────────────────────────────────│                        │
│    │ ▲                                │                        │
│    │ └─ Data flows FROM ECU to Tester │                        │
│    │                                  │                        │
│                                                                │
│  DOWNLOAD (0x34): Write TO ECU                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                           │
│  Tester                              ECU                       │
│    │ Request Download (0x34)          │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ Prepare to RECEIVE     │
│    │ Response: [0x74][maxBlock]       │                        │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 + data)      │                        │
│    │─────────────────────────────────>│                        │
│    │                                  │ ← Tester sends data    │
│    │ Transfer Data RESPONSE (ACK)     │ ECU receives           │
│    │<─────────────────────────────────│                        │
│    │                                  │ ▼                      │
│    │                                  │ └─ Data flows FROM     │
│    │                                  │    Tester to ECU       │
│    │                                  │                        │
│                                                                │
│  KEY DIFFERENCES:                                              │
│  ┌──────────────────┬─────────────────┬─────────────────────┐ │
│  │ Aspect           │ Upload (0x35)   │ Download (0x34)     │ │
│  ├──────────────────┼─────────────────┼─────────────────────┤ │
│  │ Direction        │ ECU → Tester    │ Tester → ECU        │ │
│  │ 0x36 Request     │ Empty (seq only)│ Contains data       │ │
│  │ 0x36 Response    │ Contains data   │ ACK only            │ │
│  │ Use case         │ Backup/Read     │ Flash/Write         │ │
│  └──────────────────┴─────────────────┴─────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Patterns

### Pattern 1: Session Management

```
┌────────────────────────────────────────────────────────────────┐
│         PATTERN: Complete Session Lifecycle                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Start → Enter PROG → Upload → Exit PROG → End                │
│                                                                │
│  Tester                              ECU                       │
│    │                                  │ Session: DEFAULT       │
│    │ Session Control (0x10 0x02)      │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x50][0x02][timing]   │ Session: PROGRAMMING   │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ [Security Access 0x27]           │                        │
│    │<────────────────────────────────>│ State: UNLOCKED        │
│    │                                  │                        │
│    │ [Request Upload + Transfer Data] │                        │
│    │<────────────────────────────────>│ Upload complete        │
│    │                                  │                        │
│    │ Session Control (0x10 0x01)      │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x50][0x01]           │ Session: DEFAULT       │
│    │<─────────────────────────────────│ State: LOCKED          │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Error Recovery

```
┌────────────────────────────────────────────────────────────────┐
│         PATTERN: Upload Error Recovery                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester                              ECU                       │
│    │ Request Upload (0x35)            │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75]                 │ Upload: ACTIVE         │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x01-0x05)   │                        │
│    │<────────────────────────────────>│ 5 blocks received      │
│    │                                  │                        │
│    │ ⚠️ Network error / timeout       │                        │
│    │                                  │ Session timeout!       │
│    │                                  │ Upload: IDLE (reset)   │
│    │                                  │                        │
│    │ Transfer Data (0x36 0x06)        │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: NRC 0x24 (Seq Error)   │ ❌ No active upload    │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Recovery: Restart upload         │                        │
│    │                                  │                        │
│    │ Session Control (0x10 0x02)      │                        │
│    │─────────────────────────────────>│ Re-enter PROGRAMMING   │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Security Access (0x27)           │                        │
│    │<────────────────────────────────>│ Re-unlock              │
│    │                                  │                        │
│    │ Request Upload (0x35) again      │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x75]                 │ Upload: ACTIVE (new)   │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
│    │ Transfer Data from block 0x01    │                        │
│    │<────────────────────────────────>│ Restart from beginning │
│    │                                  │                        │
│    │ Request Transfer Exit (0x37)     │                        │
│    │─────────────────────────────────>│                        │
│    │ Response: [0x77]                 │ Success ✓              │
│    │<─────────────────────────────────│                        │
│    │                                  │                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: NRC 0x70 - Upload Not Accepted

```
┌────────────────────────────────────────────────────────────────┐
│  TROUBLESHOOTING: NRC 0x70 (Upload/Download Not Accepted)      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    Request Upload (0x35) → Response: [0x7F][0x35][0x70]        │
│                                                                │
│  Diagnostic Steps:                                             │
│                                                                │
│  Step 1: Check Current Session                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Send: Read Data By ID (0x22 0xF1 0x86)                   │ │
│  │ Response shows current session type                      │ │
│  │                                                           │ │
│  │ If not PROGRAMMING (0x02):                               │ │
│  │   → Send Session Control (0x10 0x02)                     │ │
│  │   → Verify positive response (0x50 0x02)                 │ │
│  │   → Retry Request Upload                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Step 2: Check ECU Configuration                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Some ECUs disable upload feature in production           │ │
│  │ Check:                                                    │ │
│  │   • ECU variant (development vs production)              │ │
│  │   • Software version supports upload                     │ │
│  │   • No active upload lock flags                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Step 3: Verify No Download Active                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Cannot upload while download (0x34) is active            │ │
│  │ If previous download in progress:                        │ │
│  │   → Send Request Transfer Exit (0x37)                    │ │
│  │   → Retry Request Upload                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Resolution Workflow:                                          │
│    1. Verify session type                                      │
│    2. Switch to PROGRAMMING if needed                          │
│    3. Complete any active transfer operations                  │
│    4. Retry Request Upload                                     │
│    5. If still fails, check ECU documentation                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Upload Hangs During Transfer

```
┌────────────────────────────────────────────────────────────────┐
│  TROUBLESHOOTING: Upload Hangs During Transfer Data            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    Request Upload successful, but Transfer Data stops          │
│    responding after several blocks                             │
│                                                                │
│  Diagnostic Flowchart:                                         │
│                                                                │
│           Upload starts OK                                     │
│                 │                                              │
│                 ▼                                              │
│      ┌────────────────────┐                                    │
│      │ Transfer Data      │                                    │
│      │ blocks 1-10 OK     │                                    │
│      └────────┬───────────┘                                    │
│               │                                                │
│               ▼                                                │
│      ┌────────────────────┐                                    │
│      │ Block 11 no        │                                    │
│      │ response           │                                    │
│      └────────┬───────────┘                                    │
│               │                                                │
│        ┌──────┴──────┐                                         │
│        │             │                                         │
│    Timeout       Wrong Seq                                     │
│        │             │                                         │
│        ▼             ▼                                         │
│  ┌──────────┐  ┌──────────┐                                   │
│  │ Check:   │  │ Check:   │                                   │
│  │ • Tester │  │ • Counter│                                   │
│  │   Present│  │   rolled │                                   │
│  │ • P2*    │  │   over?  │                                   │
│  │   timer  │  │ • Resync │                                   │
│  └──────────┘  └──────────┘                                   │
│                                                                │
│  Common Causes:                                                │
│                                                                │
│  1. Session Timeout                                            │
│     ┌────────────────────────────────────────────────────────┐│
│     │ P2* expired between Transfer Data requests            ││
│     │ Solution: Send Tester Present (0x3E) periodically      ││
│     │ Frequency: Every 2-3 seconds during long uploads       ││
│     └────────────────────────────────────────────────────────┘│
│                                                                │
│  2. Memory Read Error                                          │
│     ┌────────────────────────────────────────────────────────┐│
│     │ ECU encountered bad memory sector                      ││
│     │ Solution: Check for NRC 0x72 in delayed response       ││
│     │ May need to skip corrupted region                      ││
│     └────────────────────────────────────────────────────────┘│
│                                                                │
│  3. Sequence Counter Mismatch                                  │
│     ┌────────────────────────────────────────────────────────┐│
│     │ Block counter overflow or desync                       ││
│     │ Solution: Reset upload sequence (exit + restart)       ││
│     │ Ensure counter wraps correctly: FF → 00               ││
│     └────────────────────────────────────────────────────────┘│
│                                                                │
│  Recovery Steps:                                               │
│    1. Wait for delayed response (up to P2* ms)                 │
│    2. If timeout, send Tester Present to check session         │
│    3. If session lost, restart entire upload sequence          │
│    4. If NRC received, analyze and address root cause          │
│    5. Consider reducing block size for unstable connections    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Partial Data Corruption

```
┌────────────────────────────────────────────────────────────────┐
│  TROUBLESHOOTING: Uploaded Data Corrupted                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Symptom:                                                      │
│    Upload completes successfully, but data verification fails  │
│                                                                │
│  Diagnostic Comparison:                                        │
│                                                                │
│  Expected Checksum: 0xABCD1234                                 │
│  Received Checksum: 0xABCD5678  ❌ Mismatch!                   │
│                                                                │
│  Investigation Steps:                                          │
│                                                                │
│  Step 1: Verify Data Format Identifier (DFI)                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ❌ WRONG: DFI mismatch                                    │ │
│  │ ┌────────────────────────────────────────────────────┐   │ │
│  │ │ ECU sent compressed data (DFI=0x10)                │   │ │
│  │ │ Tester expected uncompressed (DFI=0x00)            │   │ │
│  │ │ → Data appears corrupted but is just compressed    │   │ │
│  │ └────────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │ ✅ CORRECT: Match DFI handling                            │ │
│  │ ┌────────────────────────────────────────────────────┐   │ │
│  │ │ Check DFI in Request Upload (0x35)                 │   │ │
│  │ │ Apply same compression/encryption to received data │   │ │
│  │ │ → Decompress if DFI bits 7-4 set                   │   │ │
│  │ │ → Decrypt if DFI bits 3-0 set                      │   │ │
│  │ └────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Step 2: Check for Network Errors                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CAN bus errors can corrupt individual bytes              │ │
│  │ Check:                                                    │ │
│  │   • CAN error counters                                   │ │
│  │   • Bus load during upload                               │ │
│  │   • Termination resistance                               │ │
│  │ Solution: Retry upload with lower bus load               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Step 3: Verify Block Assembly Order                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ❌ WRONG: Blocks assembled out of sequence              │ │
│  │ ┌────────────────────────────────────────────────────┐   │ │
│  │ │ Received: Block 01, Block 03, Block 02             │   │ │
│  │ │ Assembled in receive order → corruption            │   │ │
│  │ └────────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │ ✅ CORRECT: Use sequence counter for ordering            │ │
│  │ ┌────────────────────────────────────────────────────┐   │ │
│  │ │ Sort blocks by sequence counter before assembly    │   │ │
│  │ │ Block 01 → offset 0                                │   │ │
│  │ │ Block 02 → offset 1024                             │   │ │
│  │ │ Block 03 → offset 2048                             │   │ │
│  │ └────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Verification Workflow:                                        │
│    1. Re-upload same region                                    │
│    2. Compare both uploads byte-by-byte                        │
│    3. If identical → ECU memory may be corrupted               │
│    4. If different → network/protocol issue                    │
│    5. Check ECU for memory errors or bad sectors               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Timing Parameters

```
┌──────────────────────┬─────────────────┬────────────────────┐
│ Parameter            │ Typical Value   │ Description        │
├──────────────────────┼─────────────────┼────────────────────┤
│ P2 (CAN)             │ 50 ms           │ ECU response time  │
│ P2* (Enhanced)       │ 5000 ms         │ Extended timeout   │
│ S3 (Session timeout) │ 5000 ms         │ Session keep-alive │
│ Block transfer time  │ 10-50 ms        │ Per 1KB block      │
│ Max upload size      │ 16 MB           │ Typical ECU limit  │
└──────────────────────┴─────────────────┴────────────────────┘
```

### ALFID Common Values

```
┌──────────┬──────────────┬─────────────┬──────────────────┐
│ ALFID    │ Addr Length  │ Size Length │ Total Param Bytes│
├──────────┼──────────────┼─────────────┼──────────────────┤
│ 0x11     │ 1 byte       │ 1 byte      │ 2 bytes          │
│ 0x22     │ 2 bytes      │ 2 bytes     │ 4 bytes          │
│ 0x33     │ 3 bytes      │ 3 bytes     │ 6 bytes          │
│ 0x44     │ 4 bytes      │ 4 bytes     │ 8 bytes          │
│ 0x24     │ 4 bytes      │ 2 bytes     │ 6 bytes          │
│ 0x42     │ 2 bytes      │ 4 bytes     │ 6 bytes          │
└──────────┴──────────────┴─────────────┴──────────────────┘
```

### DFI Common Values

```
┌────────┬─────────────────┬──────────────────┬────────────────┐
│ DFI    │ Compression     │ Encryption       │ Use Case       │
├────────┼─────────────────┼──────────────────┼────────────────┤
│ 0x00   │ None            │ None             │ Raw data       │
│ 0x01   │ None            │ Method 1 (AES)   │ Secure cal     │
│ 0x10   │ Method 1 (ZIP)  │ None             │ Large firmware │
│ 0x11   │ Method 1        │ Method 1         │ Secure + small │
│ 0x20   │ Method 2 (LZ4)  │ None             │ Fast compress  │
└────────┴─────────────────┴──────────────────┴────────────────┘
```

### NRC Quick Lookup

```
┌──────┬─────────────────────────┬───────────────────────────┐
│ NRC  │ Name                    │ Most Common Cause         │
├──────┼─────────────────────────┼───────────────────────────┤
│ 0x13 │ Incorrect Length        │ ALFID mismatch            │
│ 0x22 │ Conditions Not Correct  │ Upload already active     │
│ 0x31 │ Request Out of Range    │ Invalid memory address    │
│ 0x33 │ Security Access Denied  │ Not unlocked (0x27)       │
│ 0x70 │ Upload Not Accepted     │ Wrong session type        │
│ 0x72 │ General Prog Failure    │ ECU internal error        │
└──────┴─────────────────────────┴───────────────────────────┘
```

### Service Response SIDs

```
┌─────────────────────┬──────────────┬─────────────────────┐
│ Request SID         │ Response SID │ Purpose             │
├─────────────────────┼──────────────┼─────────────────────┤
│ 0x35 (Req Upload)   │ 0x75         │ Upload initiated    │
│ 0x36 (Transfer Data)│ 0x76         │ Data block received │
│ 0x37 (Transfer Exit)│ 0x77         │ Upload finalized    │
│ 0x10 (Session Ctrl) │ 0x50         │ Session changed     │
│ 0x27 (Security)     │ 0x67         │ Security unlocked   │
│ 0x3E (Tester Pres)  │ 0x7E         │ Session kept alive  │
│ Any (Negative)      │ 0x7F         │ Error response      │
└─────────────────────┴──────────────┴─────────────────────┘
```

### Memory Region Examples

```
┌──────────────┬─────────────────┬─────────────┬──────────────┐
│ Region       │ Start Address   │ Size        │ Readable?    │
├──────────────┼─────────────────┼─────────────┼──────────────┤
│ Bootloader   │ 0x00080000      │ 16 KB       │ Yes          │
│ Application  │ 0x00100000      │ 512 KB      │ Yes          │
│ Calibration  │ 0x08000000      │ 8 KB        │ Yes          │
│ RAM (logs)   │ 0x20000000      │ 64 KB       │ Yes          │
│ Protected    │ 0xFFF00000      │ Varies      │ No (0x31)    │
└──────────────┴─────────────────┴─────────────┴──────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│              SID 0x35 SERVICE INTERACTIONS SUMMARY              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Service Dependencies:                                         │
│    • Requires Session Control (0x10) → PROGRAMMING             │
│    • Requires Security Access (0x27) → UNLOCKED                │
│    • Works with Transfer Data (0x36) → data blocks             │
│    • Finalized by Transfer Exit (0x37) → cleanup               │
│    • Maintained by Tester Present (0x3E) → keep-alive          │
│                                                                │
│  Common Workflows:                                             │
│    1. Basic firmware backup (single region)                    │
│    2. Multi-region backup (bootloader + app + cal)             │
│    3. Compressed uploads (save bandwidth)                      │
│    4. Encrypted uploads (secure data)                          │
│    5. Large uploads with keep-alive                            │
│    6. Diagnostic log extraction                                │
│    7. Upload vs Download comparison                            │
│                                                                │
│  Multi-Service Patterns:                                       │
│    • Complete session lifecycle management                     │
│    • Error recovery and retry mechanisms                       │
│    • Timeout prevention strategies                             │
│                                                                │
│  Troubleshooting Focus:                                        │
│    • NRC 0x70: Check session type                              │
│    • Upload hangs: Monitor timeouts and keep-alive             │
│    • Data corruption: Verify DFI, network, block order         │
│                                                                │
│  Best Practices:                                               │
│    ✓ Always enter PROGRAMMING session first                    │
│    ✓ Unlock security before upload                             │
│    ✓ Send Tester Present for long uploads                      │
│    ✓ Verify data integrity after upload                        │
│    ✓ Handle errors gracefully with retries                     │
│    ✓ Return to DEFAULT session when done                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x35 Service Interactions Documentation**
