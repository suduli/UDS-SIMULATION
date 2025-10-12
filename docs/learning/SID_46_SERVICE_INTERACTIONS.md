# SID 0x2E - WriteDataByIdentifier Service Interactions

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**Companion To**: SID_46_WRITE_DATA_BY_IDENTIFIER.md, SID_46_PRACTICAL_IMPLEMENTATION.md

---

## Table of Contents

1. [Service Dependency Overview](#service-dependency-overview)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Multi-Service Workflows](#multi-service-workflows)
4. [Integration with Related Services](#integration-with-related-services)
5. [Common Interaction Patterns](#common-interaction-patterns)
6. [Troubleshooting Multi-Service Scenarios](#troubleshooting-multi-service-scenarios)

---

## Service Dependency Overview

### Service Dependency Pyramid

```
┌──────────────────────────────────────────────────────────────────┐
│              SID 0x2E SERVICE DEPENDENCY PYRAMID                 │
└──────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   SID 0x2E      │
                    │ WriteDataByID   │
                    │  (Target Goal)  │
                    └────────┬────────┘
                             │
                             │ Depends on
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
    ┌───────────────┐               ┌───────────────┐
    │   SID 0x10    │               │   SID 0x27    │
    │ Session Ctrl  │               │   Security    │
    │  (EXTENDED)   │               │    Access     │
    └───────┬───────┘               └───────┬───────┘
            │                               │
            │ Enables session               │ Unlocks protected DIDs
            │                               │
            └───────────────┬───────────────┘
                            │
                            │ Foundation
                            │
                    ┌───────┴───────┐
                    │   SID 0x3E    │
                    │ TesterPresent │
                    │ (Keep Alive)  │
                    └───────────────┘
```

### Service Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                SERVICE RELATIONSHIP DIAGRAM                      │
└──────────────────────────────────────────────────────────────────┘

    SID 0x10                     SID 0x27                  SID 0x2E
DiagnosticSession              SecurityAccess           WriteDataByID
┌─────────────┐               ┌─────────────┐           ┌─────────────┐
│             │──Enable────>  │             │──Unlock──>│             │
│  Switch to  │   Higher      │  Provide    │  Protected│  Write Data │
│  EXTENDED   │   Session     │  Key/Seed   │    DIDs   │  to ECU     │
│             │<──Required──  │             │           │             │
└─────────────┘               └─────────────┘           └──────┬──────┘
       │                             │                         │
       │                             │                         │
       │                             │                         │
       └─────────────────┬───────────┴─────────────────────────┘
                         │
                         │ All require
                         │
                         ▼
                  ┌─────────────┐
                  │  SID 0x3E   │
                  │TesterPresent│  (Prevents session timeout)
                  └─────────────┘


    SID 0x2E                     SID 0x22                  SID 0x11
WriteDataByID                ReadDataByID                 ECUReset
┌─────────────┐               ┌─────────────┐           ┌─────────────┐
│             │──Verify────>  │             │           │             │
│  Write Data │   Using       │  Read Data  │           │  Reset to   │
│  to DID     │               │  from DID   │<─After──  │  Apply New  │
│             │               │             │  Write    │  Settings   │
└─────────────┘               └─────────────┘           └─────────────┘
```

---

## Session Requirements Matrix

### Session vs Service Availability

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                SESSION REQUIREMENTS MATRIX                                   │
├──────────────────┬───────────┬───────────┬───────────┬────────────────────────┤
│  Service         │  DEFAULT  │ EXTENDED  │PROGRAMMING│  Notes                 │
│                  │   (0x01)  │  (0x03)   │  (0x02)   │                        │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x10 Session     │    ✅     │    ✅     │    ✅     │ Always available       │
│     Control      │           │           │           │                        │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x27 Security    │    ❌     │    ✅     │    ✅     │ Only in higher session │
│     Access       │           │           │           │                        │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x22 Read Data   │    ✅     │    ✅     │    ✅     │ Most DIDs in DEFAULT   │
│     By ID        │  (Some)   │   (All)   │   (All)   │ All DIDs in EXTENDED   │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x2E Write Data  │    ❌     │    ✅     │    ✅     │ MUST be in EXTENDED+   │
│     By ID        │           │   (Most)  │   (All)   │ Security often needed  │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x3E Tester      │    ✅     │    ✅     │    ✅     │ Keep session alive     │
│     Present      │           │           │           │                        │
├──────────────────┼───────────┼───────────┼───────────┼────────────────────────┤
│ 0x11 ECU Reset   │    ⚠️     │    ✅     │    ✅     │ Hard reset always OK   │
│                  │ (Hard)    │   (All)   │   (All)   │ Soft needs EXTENDED    │
└──────────────────┴───────────┴───────────┴───────────┴────────────────────────┘
```

### DID Security Requirements by Session

```
┌──────────────────────────────────────────────────────────────────┐
│          DID SECURITY REQUIREMENTS BY SESSION                    │
└──────────────────────────────────────────────────────────────────┘

Session: DEFAULT (0x01)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│ SID 0x2E:  ❌ NOT ALLOWED                              │
│                                                        │
│ All write operations rejected with NRC 0x22            │
│ Must switch to EXTENDED or PROGRAMMING first           │
└────────────────────────────────────────────────────────┘

Session: EXTENDED (0x03)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│ Public DIDs (No Security):                             │
│ ├─> 0x0105: Diagnostic counters                        │
│ └─> 0x010A: Temporary flags                            │
│     Session: EXTENDED ✅                                │
│     Security: NOT required 🔓                           │
│                                                        │
│ Protected DIDs (Security Level 1):                     │
│ ├─> 0x0100-0xEFFF: Calibration parameters              │
│ ├─> 0xF010-0xF0FF: Network configuration               │
│ └─> 0xF1A0+: Programming metadata                      │
│     Session: EXTENDED ✅                                │
│     Security: SID 0x27 required 🔒                      │
│                                                        │
│ High-Security DIDs (May require PROGRAMMING):          │
│ ├─> 0xF190: VIN                                        │
│ ├─> 0xF18C: ECU Serial Number                          │
│ └─> 0xF187: Spare part number                          │
│     Session: EXTENDED ⚠️ (may work)                     │
│     Security: High-level unlock required 🔒🔒           │
└────────────────────────────────────────────────────────┘

Session: PROGRAMMING (0x02)
═══════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│ All Writable DIDs Available                            │
│                                                        │
│ Standard DIDs:                                         │
│     Session: PROGRAMMING ✅                             │
│     Security: May still be required 🔒                  │
│                                                        │
│ High-Security DIDs:                                    │
│     Session: PROGRAMMING ✅                             │
│     Security: High-level unlock required 🔒🔒           │
│                                                        │
│ OTP (One-Time) DIDs:                                   │
│     Session: PROGRAMMING ✅                             │
│     Security: Manufacturer key required 🔒🔒🔒          │
│     Note: Can only be written ONCE                     │
└────────────────────────────────────────────────────────┘
```

---

## Multi-Service Workflows

### Workflow 1: Basic Configuration Write

```
┌──────────────────────────────────────────────────────────────────┐
│      WORKFLOW 1: BASIC CONFIGURATION WRITE (No Security)         │
└──────────────────────────────────────────────────────────────────┘

Objective: Write simple configuration parameter

┌────────────────────────────────────────────────────────┐
│ Target DID: 0x0105 (Diagnostic Test Counter)          │
│ Security Required: NO                                  │
│ Session Required: EXTENDED                             │
└────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │ PHASE 1: Session Setup
    │ ─────────────────────────────────────────────
    │                               │
    │  10 03                        │  (SID 0x10: DiagnosticSessionControl)
    │  (Switch to EXTENDED)         │
    │──────────────────────────────>│
    │                               ├─> Store session = EXTENDED
    │                               ├─> Start session timer (5s)
    │  50 03 00 32 00 C8            │
    │  (P2 = 50ms, P2* = 2s)        │
    │<──────────────────────────────│
    │                               │
    │  Session: EXTENDED ✅
    │                               │
    │ PHASE 2: Write Operation
    │ ─────────────────────────────────────────────
    │                               │
    │  2E 01 05 00 42               │  (SID 0x2E: WriteDataByIdentifier)
    │  (DID 0x0105, value = 0x0042) │
    │──────────────────────────────>│
    │                               ├─> Validate: Session OK ✅
    │                               ├─> Validate: Security not needed ✅
    │                               ├─> Validate: Data OK ✅
    │                               ├─> Write to RAM
    │  6E 01 05                     │
    │<──────────────────────────────│
    │                               │
    │  Write confirmed ✅
    │                               │
    │ PHASE 3: Verification
    │ ─────────────────────────────────────────────
    │                               │
    │  22 01 05                     │  (SID 0x22: ReadDataByIdentifier)
    │──────────────────────────────>│
    │                               ├─> Read DID 0x0105
    │  62 01 05 00 42               │
    │<──────────────────────────────│
    │                               │
    │  Verified: Value = 0x0042 ✅
    │                               │
    │ PHASE 4: Return to DEFAULT
    │ ─────────────────────────────────────────────
    │                               │
    │  10 01                        │  (Return to DEFAULT session)
    │──────────────────────────────>│
    │                               ├─> Store session = DEFAULT
    │  50 01 00 32 00 C8            │
    │<──────────────────────────────│
    │                               │
    │  Complete ✅
    │
```

### Workflow 2: Security-Protected Parameter Write

```
┌──────────────────────────────────────────────────────────────────┐
│   WORKFLOW 2: SECURITY-PROTECTED CALIBRATION WRITE               │
└──────────────────────────────────────────────────────────────────┘

Objective: Write calibration parameter requiring security unlock

┌────────────────────────────────────────────────────────┐
│ Target DID: 0x0100 (Speed Limit Configuration)        │
│ Security Required: YES (Level 1)                       │
│ Session Required: EXTENDED                             │
│ Memory Type: EEPROM                                    │
└────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │ PHASE 1: Session Setup
    │ ─────────────────────────────────────────────
    │                               │
    │  10 03                        │  (SID 0x10)
    │──────────────────────────────>│
    │  50 03 00 32 00 C8            │
    │<──────────────────────────────│
    │                               │
    │  Session: EXTENDED ✅
    │  Security: 🔒 LOCKED
    │                               │
    │ PHASE 2: Security Unlock
    │ ─────────────────────────────────────────────
    │                               │
    │  27 01                        │  (SID 0x27: Request Seed)
    │──────────────────────────────>│
    │                               ├─> Generate seed
    │  67 01 A3 B4 C5 D6            │
    │  (Seed = 0xA3B4C5D6)          │
    │<──────────────────────────────│
    │                               │
    │  (Tester calculates key using seed)
    │  Algorithm: key = f(seed, secret)
    │                               │
    │  27 02 12 34 56 78            │  (SID 0x27: Send Key)
    │  (Key = 0x12345678)           │
    │──────────────────────────────>│
    │                               ├─> Verify key
    │                               ├─> Key matches ✅
    │  67 02                        │
    │<──────────────────────────────│
    │                               │
    │  Security: 🔓 UNLOCKED
    │                               │
    │ PHASE 3: Write Operation
    │ ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (SID 0x2E)
    │  (DID 0x0100, value = 130 km/h)│
    │──────────────────────────────>│
    │                               ├─> Validate: Session OK ✅
    │                               ├─> Validate: Security OK ✅
    │                               ├─> Validate: Data in range ✅
    │                               ├─> Queue EEPROM write
    │  6E 01 00                     │
    │<──────────────────────────────│
    │                               │
    │  Write queued ✅               │
    │                               │
    │  ... (Wait 500ms for EEPROM write)
    │                               │  (Background: ECU writes to EEPROM)
    │                               │
    │ PHASE 4: Verification
    │ ─────────────────────────────────────────────
    │                               │
    │  22 01 00                     │  (SID 0x22)
    │──────────────────────────────>│
    │  62 01 00 00 82               │
    │<──────────────────────────────│
    │                               │
    │  Verified: Value = 130 km/h ✅
    │                               │
    │ PHASE 5: Persistence Verification
    │ ─────────────────────────────────────────────
    │                               │
    │  11 01                        │  (SID 0x11: Hard Reset)
    │──────────────────────────────>│
    │  51 01                        │
    │<──────────────────────────────│
    │                               │  (ECU reboots)
    │                               │
    │  ... (Wait for ECU to boot)
    │                               │
    │  10 01                        │  (Enter DEFAULT session)
    │──────────────────────────────>│
    │  50 01 [...]                  │
    │<──────────────────────────────│
    │                               │
    │  22 01 00                     │  (Read again)
    │──────────────────────────────>│
    │  62 01 00 00 82               │
    │<──────────────────────────────│
    │                               │
    │  Persisted ✅ Value still 130 km/h after reset
    │
```

### Workflow 3: VIN Write with High Security

```
┌──────────────────────────────────────────────────────────────────┐
│        WORKFLOW 3: VIN WRITE WITH HIGH SECURITY                  │
└──────────────────────────────────────────────────────────────────┘

Objective: Write Vehicle Identification Number (manufacturing scenario)

┌────────────────────────────────────────────────────────┐
│ Target DID: 0xF190 (VIN)                               │
│ Security Required: YES (High Level - Manufacturing)    │
│ Session Required: PROGRAMMING                          │
│ Memory Type: EEPROM (One-time or very rare write)     │
└────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │ PHASE 1: Session Setup
    │ ─────────────────────────────────────────────
    │                               │
    │  10 02                        │  (SID 0x10: PROGRAMMING session)
    │──────────────────────────────>│
    │                               ├─> Check: Vehicle conditions safe
    │                               ├─> Check: Voltage OK
    │  50 02 00 32 01 F4            │
    │  (P2 = 50ms, P2* = 5s)        │
    │<──────────────────────────────│
    │                               │
    │  Session: PROGRAMMING ✅
    │  Security: 🔒 LOCKED
    │                               │
    │ PHASE 2: High-Level Security Unlock
    │ ─────────────────────────────────────────────
    │                               │
    │  27 03                        │  (Request Seed, Level 2 - Programming)
    │──────────────────────────────>│
    │                               ├─> Generate high-security seed
    │  67 03 DE AD BE EF CA FE      │
    │  (Seed = 0xDEADBEEFCAFE)      │
    │<──────────────────────────────│
    │                               │
    │  (Tester calculates high-level key)
    │  Uses manufacturer secret algorithm
    │                               │
    │  27 04 FE ED FA CE BA BE      │  (Send Key, Level 2)
    │──────────────────────────────>│
    │                               ├─> Verify high-level key
    │  67 04                        │
    │<──────────────────────────────│
    │                               │
    │  Security: 🔓 UNLOCKED (High Level)
    │                               │
    │ PHASE 3: Write VIN
    │ ─────────────────────────────────────────────
    │                               │
    │  2E F1 90 57 56 57 5A 5A 5A   │  (SID 0x2E)
    │  31 4B 5A 42 57 31 32 33 34   │
    │  35 36                        │
    │  (VIN: WVWZZZ1KZBW123456)     │
    │──────────────────────────────>│
    │                               ├─> Validate: Session OK ✅
    │                               ├─> Validate: Security high-level ✅
    │                               ├─> Validate: VIN format ✅
    │                               ├─> Check: VIN not already written
    │                               ├─> Queue critical EEPROM write
    │  6E F1 90                     │
    │<──────────────────────────────│
    │                               │
    │  Write queued ✅               │
    │                               │
    │  ... (Wait 1000ms for critical write)
    │                               │  (Background: ECU writes VIN)
    │                               │  (May lock VIN from further writes)
    │                               │
    │ PHASE 4: Verification
    │ ─────────────────────────────────────────────
    │                               │
    │  22 F1 90                     │  (SID 0x22)
    │──────────────────────────────>│
    │  62 F1 90 57 56 57 5A 5A 5A   │
    │  31 4B 5A 42 57 31 32 33 34   │
    │  35 36                        │
    │<──────────────────────────────│
    │                               │
    │  Verified ✅ VIN = WVWZZZ1KZBW123456
    │                               │
    │ PHASE 5: Lock VIN (Optional)
    │ ─────────────────────────────────────────────
    │                               │
    │  (Some ECUs lock VIN after first write)
    │  (Subsequent writes will fail with NRC 0x22 or 0x7F)
    │                               │
    │ PHASE 6: Return to DEFAULT
    │ ─────────────────────────────────────────────
    │                               │
    │  11 01                        │  (Hard Reset)
    │──────────────────────────────>│
    │  51 01                        │
    │<──────────────────────────────│
    │                               │  (ECU reboots, applies VIN)
    │
```

---

## Integration with Related Services

### SID 0x2E ↔ SID 0x22 (Write ↔ Read)

```
┌──────────────────────────────────────────────────────────────────┐
│              SID 0x2E ↔ SID 0x22 INTEGRATION                     │
└──────────────────────────────────────────────────────────────────┘

Pattern: Write-Verify-Confirm

  Tester                           ECU
    │                               │
    │  Step 1: Read current value (optional)
    │  ─────────────────────────────────────────────
    │                               │
    │  22 01 00                     │  (Read DID 0x0100)
    │──────────────────────────────>│
    │  62 01 00 00 64               │  (Current: 100 km/h)
    │<──────────────────────────────│
    │                               │
    │  Step 2: Write new value
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (Write 130 km/h)
    │──────────────────────────────>│
    │  6E 01 00                     │  (Write confirmed)
    │<──────────────────────────────│
    │                               │
    │  Step 3: Verify new value
    │  ─────────────────────────────────────────────
    │                               │
    │  22 01 00                     │  (Read again)
    │──────────────────────────────>│
    │  62 01 00 00 82               │  (Verified: 130 km/h)
    │<──────────────────────────────│
    │                               │
    │  Complete: Value changed from 100 → 130 km/h ✅
    │

Key Points:
┌────────────────────────────────────────────────────────┐
│ • Always verify writes with SID 0x22                   │
│ • SID 0x22 can read in DEFAULT session                 │
│ • SID 0x2E requires EXTENDED or higher                 │
│ • Same DID can be used for both read and write         │
│ • Read-only DIDs cannot be written (NRC 0x7F)          │
└────────────────────────────────────────────────────────┘
```

### SID 0x2E + SID 0x3E (TesterPresent)

```
┌──────────────────────────────────────────────────────────────────┐
│          SID 0x2E + SID 0x3E (TESTER PRESENT) PATTERN            │
└──────────────────────────────────────────────────────────────────┘

Problem: Session timeout during long operations
Solution: Periodic TesterPresent messages

  Tester                           ECU
    │                               │
    │  10 03                        │  (Enter EXTENDED)
    │──────────────────────────────>│
    │  50 03 00 32 00 C8            │  (Timeout: 5000ms)
    │<──────────────────────────────│
    │                               │
    │  Timer starts ⏱️  5000ms
    │                               │
    │  ... (Tester prepares data, user input, etc.)
    │  ... Time elapsed: 3000ms
    │                               │
    │  3E 00                        │  (TesterPresent)
    │──────────────────────────────>│
    │                               ├─> Reset timer ⏱️  → 5000ms
    │  7E 00                        │
    │<──────────────────────────────│
    │                               │
    │  ... Time elapsed: 3000ms
    │                               │
    │  3E 00                        │  (TesterPresent again)
    │──────────────────────────────>│
    │                               ├─> Reset timer ⏱️  → 5000ms
    │  7E 00                        │
    │<──────────────────────────────│
    │                               │
    │  Now ready to write
    │                               │
    │  2E 01 00 00 82               │  (Write data)
    │──────────────────────────────>│
    │  6E 01 00                     │
    │<──────────────────────────────│
    │                               │

Best Practice:
┌────────────────────────────────────────────────────────┐
│ Send TesterPresent (0x3E 00) every 2-3 seconds         │
│ when session timeout is 5 seconds                      │
│                                                        │
│ Formula: TesterPresent interval = Timeout × 0.5        │
│ Example: 5000ms timeout → Send every 2500ms            │
└────────────────────────────────────────────────────────┘
```

### SID 0x2E + SID 0x11 (Write + Reset)

```
┌──────────────────────────────────────────────────────────────────┐
│           SID 0x2E + SID 0x11 (WRITE + RESET) PATTERN            │
└──────────────────────────────────────────────────────────────────┘

Use Case: Apply new configuration after write

  Tester                           ECU
    │                               │
    │  (Assume: EXTENDED session, unlocked)
    │                               │
    │  Step 1: Write multiple parameters
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (Write DID 0x0100)
    │──────────────────────────────>│
    │  6E 01 00                     │
    │<──────────────────────────────│
    │                               │
    │  2E 01 01 12 34               │  (Write DID 0x0101)
    │──────────────────────────────>│
    │  6E 01 01                     │
    │<──────────────────────────────│
    │                               │
    │  2E 01 02 AB CD               │  (Write DID 0x0102)
    │──────────────────────────────>│
    │  6E 01 02                     │
    │<──────────────────────────────│
    │                               │
    │  ... (Wait for EEPROM writes to complete)
    │  ... 500-1000ms
    │                               │
    │  Step 2: Reset ECU to apply changes
    │  ─────────────────────────────────────────────
    │                               │
    │  11 01                        │  (Hard Reset)
    │──────────────────────────────>│
    │  51 01                        │
    │<──────────────────────────────│
    │                               │  (ECU reboots)
    │                               │  (New values take effect)
    │                               │
    │  ... (Wait for ECU boot: 2-5 seconds)
    │                               │
    │  Step 3: Verify in DEFAULT session
    │  ─────────────────────────────────────────────
    │                               │
    │  10 01                        │  (Enter DEFAULT)
    │──────────────────────────────>│
    │  50 01 [...]                  │
    │<──────────────────────────────│
    │                               │
    │  22 01 00                     │  (Verify DID 0x0100)
    │──────────────────────────────>│
    │  62 01 00 00 82               │  (Confirmed ✅)
    │<──────────────────────────────│
    │                               │

When to Use Reset After Write:
┌────────────────────────────────────────────────────────┐
│ ✅ DO reset after:                                     │
│   • CAN configuration changes                          │
│   • Network parameter updates                          │
│   • Critical system settings                           │
│   • Multiple related parameter changes                 │
│                                                        │
│ ❌ DON'T reset after:                                  │
│   • Simple calibration tweaks                          │
│   • Diagnostic counter resets                          │
│   • Temporary test flags                               │
└────────────────────────────────────────────────────────┘
```

---

## Common Interaction Patterns

### Pattern 1: Batch Configuration Update

```
┌──────────────────────────────────────────────────────────────────┐
│            PATTERN 1: BATCH CONFIGURATION UPDATE                 │
└──────────────────────────────────────────────────────────────────┘

Scenario: Update multiple related configuration parameters

  Tester                           ECU
    │                               │
    │  Setup: Enter EXTENDED + Unlock
    │  ─────────────────────────────────────────────
    │  10 03                        │
    │  → 50 03                      │
    │  27 01 → 67 01 [seed]         │
    │  27 02 [key] → 67 02          │
    │                               │
    │  Batch Write Loop
    │  ─────────────────────────────────────────────
    │                               │
    │  FOR EACH DID in config_list:
    │                               │
    │    2E [DID] [data]            │
    │  ──────────────────────────>  │
    │    6E [DID]                   │
    │  <──────────────────────────  │
    │                               │
    │    (Optional: Verify)
    │    22 [DID]                   │
    │  ──────────────────────────>  │
    │    62 [DID] [data]            │
    │  <──────────────────────────  │
    │                               │
    │    (Send TesterPresent every 2-3s to prevent timeout)
    │                               │
    │  END FOR
    │                               │
    │  Cleanup
    │  ─────────────────────────────────────────────
    │                               │
    │  11 01                        │  (Reset to apply)
    │  → 51 01                      │
    │                               │

Example DIDs:
┌────────────────────────────────────────────────────────┐
│ DID 0x0100: Speed limit = 130 km/h                     │
│ DID 0x0101: Fuel type = 0x02 (Diesel)                  │
│ DID 0x0102: Region code = 0x45 (Europe)                │
│ DID 0x0103: Units = 0x00 (Metric)                      │
└────────────────────────────────────────────────────────┘
```

### Pattern 2: Write-Verify-Retry

```
┌──────────────────────────────────────────────────────────────────┐
│              PATTERN 2: WRITE-VERIFY-RETRY                       │
└──────────────────────────────────────────────────────────────────┘

Scenario: Ensure write success with verification and retry logic

  Tester                           ECU
    │                               │
    │  Attempt 1
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (Write DID 0x0100 = 130)
    │──────────────────────────────>│
    │  6E 01 00                     │
    │<──────────────────────────────│
    │                               │
    │  ... Wait 500ms
    │                               │
    │  22 01 00                     │  (Verify)
    │──────────────────────────────>│
    │  62 01 00 00 82               │  (Value = 130 ✅)
    │<──────────────────────────────│
    │                               │
    │  Success! No retry needed
    │

Alternative: Write Failed Scenario
  Tester                           ECU
    │                               │
    │  Attempt 1
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │
    │──────────────────────────────>│
    │  7F 2E 72                     │  (NRC 0x72: Programming failure)
    │<──────────────────────────────│
    │                               │
    │  Failure! Retry
    │                               │
    │  ... Wait 1000ms (allow ECU to recover)
    │                               │
    │  Attempt 2
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (Retry same write)
    │──────────────────────────────>│
    │  6E 01 00                     │  (Success this time)
    │<──────────────────────────────│
    │                               │
    │  ... Wait 500ms
    │                               │
    │  22 01 00                     │  (Verify)
    │──────────────────────────────>│
    │  62 01 00 00 82               │  (Confirmed ✅)
    │<──────────────────────────────│
    │                               │

Retry Logic:
┌────────────────────────────────────────────────────────┐
│ Max Retries: 3                                         │
│ Retry Delay: 1000ms (allow ECU recovery)               │
│ Verify After Each Write: YES                           │
│ Give Up After: 3 failed attempts                       │
│ Log All Attempts: YES (for diagnostics)                │
└────────────────────────────────────────────────────────┘
```

### Pattern 3: Conditional Write Based on Current Value

```
┌──────────────────────────────────────────────────────────────────┐
│       PATTERN 3: CONDITIONAL WRITE (Read-Modify-Write)           │
└──────────────────────────────────────────────────────────────────┘

Scenario: Only write if current value is different

  Tester                           ECU
    │                               │
    │  Step 1: Read current value
    │  ─────────────────────────────────────────────
    │                               │
    │  22 01 00                     │
    │──────────────────────────────>│
    │  62 01 00 00 64               │  (Current: 100 km/h)
    │<──────────────────────────────│
    │                               │
    │  Decision: Target = 130 km/h
    │            Current = 100 km/h
    │            Different → Proceed with write
    │                               │
    │  Step 2: Write new value
    │  ─────────────────────────────────────────────
    │                               │
    │  2E 01 00 00 82               │  (Write 130 km/h)
    │──────────────────────────────>│
    │  6E 01 00                     │
    │<──────────────────────────────│
    │                               │

Alternative: Value Already Correct
  Tester                           ECU
    │                               │
    │  22 01 00                     │
    │──────────────────────────────>│
    │  62 01 00 00 82               │  (Current: 130 km/h)
    │<──────────────────────────────│
    │                               │
    │  Decision: Target = 130 km/h
    │            Current = 130 km/h
    │            Same → Skip write
    │                               │
    │  No write needed ✅
    │

Benefits:
┌────────────────────────────────────────────────────────┐
│ • Reduces unnecessary EEPROM writes                    │
│ • Extends EEPROM lifespan                              │
│ • Faster operation (skip write if not needed)          │
│ • Lower risk of write failures                         │
└────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Multi-Service Scenarios

### Scenario 1: Session Timeout During Write

```
┌──────────────────────────────────────────────────────────────────┐
│         TROUBLESHOOTING: SESSION TIMEOUT DURING WRITE            │
└──────────────────────────────────────────────────────────────────┘

Problem Sequence:
  Tester                           ECU
    │                               │
    │  10 03                        │  (Enter EXTENDED)
    │  → 50 03 00 32 00 C8          │  (Timeout: 5000ms)
    │                               │
    │  ... (User interaction delay: 6000ms)
    │                               │  Session timeout! 💥
    │                               │  ECU returns to DEFAULT
    │                               │
    │  2E 01 00 00 82               │  (Try to write)
    │──────────────────────────────>│
    │                               ├─> Check session: DEFAULT ✗
    │  7F 2E 22                     │  (NRC 0x22: Conditions not correct)
    │<──────────────────────────────│
    │                               │

Root Cause:
┌────────────────────────────────────────────────────────┐
│ • Session timeout occurred (5000ms elapsed)            │
│ • ECU automatically returned to DEFAULT session        │
│ • Write rejected because DEFAULT doesn't allow 0x2E    │
└────────────────────────────────────────────────────────┘

Solution:
  Tester                           ECU
    │                               │
    │  10 03                        │  (Re-enter EXTENDED)
    │  → 50 03 00 32 00 C8          │
    │                               │
    │  3E 00                        │  (Send TesterPresent every 2-3s)
    │  → 7E 00                      │
    │                               │
    │  ... (User interaction)
    │                               │
    │  3E 00                        │  (Keep session alive)
    │  → 7E 00                      │
    │                               │
    │  2E 01 00 00 82               │  (Write now succeeds)
    │  → 6E 01 00                   │
    │                               │

Prevention:
┌────────────────────────────────────────────────────────┐
│ ✅ Send TesterPresent (0x3E 00) periodically           │
│ ✅ Interval = Session timeout × 0.5                    │
│ ✅ Example: 5s timeout → Send every 2.5s               │
│ ✅ Use background thread for TesterPresent             │
└────────────────────────────────────────────────────────┘
```

### Scenario 2: Security Lock After Timeout

```
┌──────────────────────────────────────────────────────────────────┐
│       TROUBLESHOOTING: SECURITY LOCK AFTER TIMEOUT               │
└──────────────────────────────────────────────────────────────────┘

Problem Sequence:
  Tester                           ECU
    │                               │
    │  10 03 → 50 03                │  (EXTENDED)
    │  27 01 → 67 01 [seed]         │
    │  27 02 [key] → 67 02          │  (Unlocked 🔓)
    │                               │
    │  ... (Delay: 6000ms - session timeout!)
    │                               │  Session → DEFAULT
    │                               │  Security → LOCKED 🔒
    │                               │
    │  2E F1 90 [VIN]               │  (Try to write VIN)
    │──────────────────────────────>│
    │  7F 2E 22                     │  (NRC 0x22: Wrong session)
    │<──────────────────────────────│
    │                               │

Root Cause:
┌────────────────────────────────────────────────────────┐
│ • Session timeout → ECU returned to DEFAULT            │
│ • Security state reset → ECU re-locked automatically   │
│ • Must re-establish BOTH session AND security          │
└────────────────────────────────────────────────────────┘

Solution:
  Tester                           ECU
    │                               │
    │  10 03                        │  (Re-enter EXTENDED)
    │  → 50 03                      │
    │                               │
    │  27 01                        │  (Re-request seed)
    │  → 67 01 [new seed]           │
    │                               │
    │  27 02 [new key]              │  (Re-unlock)
    │  → 67 02                      │  (Unlocked again 🔓)
    │                               │
    │  2E F1 90 [VIN]               │  (Write now succeeds)
    │  → 6E F1 90                   │
    │                               │
```

### Scenario 3: Write Fails After Multiple Reads

```
┌──────────────────────────────────────────────────────────────────┐
│      TROUBLESHOOTING: WRITE FAILS AFTER MULTIPLE READS           │
└──────────────────────────────────────────────────────────────────┘

Problem Sequence:
  Tester                           ECU
    │                               │
    │  (DEFAULT session)
    │                               │
    │  22 01 00 → 62 01 00 [data]   │  (Read OK in DEFAULT)
    │  22 01 01 → 62 01 01 [data]   │  (Read OK in DEFAULT)
    │  22 01 02 → 62 01 02 [data]   │  (Read OK in DEFAULT)
    │                               │
    │  2E 01 00 00 82               │  (Try to write)
    │──────────────────────────────>│
    │  7F 2E 22                     │  (NRC 0x22: Conditions not correct)
    │<──────────────────────────────│
    │                               │

Root Cause:
┌────────────────────────────────────────────────────────┐
│ • SID 0x22 (Read) works in DEFAULT session             │
│ • SID 0x2E (Write) DOES NOT work in DEFAULT            │
│ • Common mistake: Assuming read/write same permissions │
└────────────────────────────────────────────────────────┘

Solution:
  Tester                           ECU
    │                               │
    │  10 03                        │  (Enter EXTENDED first)
    │  → 50 03                      │
    │                               │
    │  2E 01 00 00 82               │  (Write now succeeds)
    │  → 6E 01 00                   │
    │                               │

Key Lesson:
┌────────────────────────────────────────────────────────┐
│ SID 0x22 (Read) ≠ SID 0x2E (Write) session requirements│
│                                                        │
│ SID 0x22: Mostly works in DEFAULT session             │
│ SID 0x2E: REQUIRES EXTENDED or PROGRAMMING            │
│                                                        │
│ Always check session before attempting write!          │
└────────────────────────────────────────────────────────┘
```

---

## Summary

### Service Interaction Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│           SID 0x2E SERVICE INTERACTION CHECKLIST                 │
└──────────────────────────────────────────────────────────────────┘

Before Writing Data:
═══════════════════════════════════════════════════════════════
☐ Use SID 0x10 to enter EXTENDED or PROGRAMMING session
☐ Use SID 0x27 to unlock security if DID requires it
☐ Send SID 0x3E (TesterPresent) periodically to prevent timeout
☐ Optionally use SID 0x22 to read current value

During Write Operation:
═══════════════════════════════════════════════════════════════
☐ Send SID 0x2E with correct DID and data
☐ Verify positive response (0x6E)
☐ Handle negative responses appropriately
☐ Wait for EEPROM write completion if applicable (100-500ms)

After Writing Data:
═══════════════════════════════════════════════════════════════
☐ Use SID 0x22 to verify written value
☐ Optionally use SID 0x11 to reset ECU (apply changes)
☐ Verify persistence after reset if critical
☐ Return to DEFAULT session when done (SID 0x10 with 0x01)

Error Recovery:
═══════════════════════════════════════════════════════════════
☐ If NRC 0x22: Check session, re-enter EXTENDED
☐ If NRC 0x33: Re-unlock with SID 0x27
☐ If NRC 0x72: Check voltage, retry after delay
☐ If NRC 0x13/0x31: Verify DID specification and data
☐ Use retry logic for transient failures (max 3 attempts)

Best Practices:
═══════════════════════════════════════════════════════════════
☐ Always verify writes with SID 0x22
☐ Use TesterPresent to prevent session timeout
☐ Wait appropriate time for EEPROM writes
☐ Log all write operations for audit trail
☐ Implement conditional write (only if value changed)
☐ Batch related writes before reset
☐ Use manufacturer-specific security keys correctly
```

---

**End of SID 0x2E Service Interactions Document**

For theory, see: `SID_46_WRITE_DATA_BY_IDENTIFIER.md`  
For implementation, see: `SID_46_PRACTICAL_IMPLEMENTATION.md`
