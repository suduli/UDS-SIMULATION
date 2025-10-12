# SID 0x11 - ECU Reset Service Interactions

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.3

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

### ECU Reset Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│ SERVICE DEPENDENCY HIERARCHY FOR ECU RESET (0x11)            │
└──────────────────────────────────────────────────────────────┘

                        ECU Reset (0x11)
                              │
                              │ Uses/Requires
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ Diagnostic   │    │  Security    │      │  Tester      │
│ Session      │    │  Access      │      │  Present     │
│ Control      │    │  (Optional)  │      │  (Optional)  │
│   (0x10)     │    │   (0x27)     │      │   (0x3E)     │
└──────┬───────┘    └──────┬───────┘      └──────┬───────┘
       │                   │                     │
       │ REQUIRED          │ CONDITIONAL         │ OPTIONAL
       │                   │                     │
       └───────────────────┴─────────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  ECU can perform │
                 │  Reset (0x11)    │
                 └──────────────────┘
```

### Service Interaction Levels

```
Level 0: Foundation Services (Must be available)
┌─────────────────────────────────────────────────────────┐
│  • CAN/LIN Communication Stack                          │
│  • Diagnostic Address Recognition                       │
│  • Basic Message Processing                             │
└─────────────────────────────────────────────────────────┘

Level 1: Session Management (Usually required)
┌─────────────────────────────────────────────────────────┐
│  • SID 0x10 - Diagnostic Session Control                │
│  • Session timeout handling                             │
│  • Default session always available                     │
└─────────────────────────────────────────────────────────┘

Level 2: Security (Conditionally required)
┌─────────────────────────────────────────────────────────┐
│  • SID 0x27 - Security Access                           │
│  • Seed/Key algorithm                                   │
│  • Security level management                            │
└─────────────────────────────────────────────────────────┘

Level 3: Reset Service (Target service)
┌─────────────────────────────────────────────────────────┐
│  • SID 0x11 - ECU Reset                                 │
│  • Reset type selection                                 │
│  • Condition validation                                 │
│  • Reset execution                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### Reset Type vs Session Type Matrix

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ RESET TYPE SUPPORT BY SESSION TYPE                                          │
├────────────────────┬─────────┬──────────┬─────────────┬─────────────────────┤
│  Reset Type        │ Default │ Extended │ Programming │ Safety System       │
│  (Subfunction)     │ (0x01)  │ (0x03)   │ (0x02)      │ (0x04)              │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x01 Hard Reset    │  ⚠️     │    ✓     │     ✓       │    ⚠️               │
│                    │ Depends │  YES     │    YES      │  Depends            │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x02 Key Off/On    │  ⚠️     │    ✓     │     ✓       │    ⚠️               │
│                    │ Depends │  YES     │    YES      │  Depends            │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x03 Soft Reset    │    ✗    │    ✓     │     ✓       │    ⚠️               │
│                    │   NO    │  YES     │    YES      │  Depends            │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x04 Enable Rapid  │    ✗    │    ✓     │     ⚠️      │    ✗                │
│      Power Down    │   NO    │  YES     │  Depends    │   NO                │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x05 Disable Rapid │    ✗    │    ✓     │     ⚠️      │    ✗                │
│      Power Down    │   NO    │  YES     │  Depends    │   NO                │
├────────────────────┼─────────┼──────────┼─────────────┼─────────────────────┤
│ 0x80-0xFF Mfr      │  Varies │  Varies  │   Varies    │  Varies             │
│      Specific      │         │          │             │                     │
└────────────────────┴─────────┴──────────┴─────────────┴─────────────────────┘

Legend:
  ✓ = Typically Supported
  ✗ = Not Supported
  ⚠️ = Implementation Dependent
```

### Session Transition After Reset

```
┌──────────────────────────────────────────────────────────────┐
│ SESSION STATE BEFORE AND AFTER RESET                         │
└──────────────────────────────────────────────────────────────┘

BEFORE RESET                    AFTER RESET
─────────────────────────────────────────────────────────────

Default (0x01)                  Default (0x01)
   │                               │
   │ 11 01 (Hard Reset)            │ ✓ Stays Default
   └──────────────────────────────►│

Extended (0x03)                 Default (0x01)
   │                               │
   │ 11 01 (Hard Reset)            │ ✓ Returns to Default
   └──────────────────────────────►│

Programming (0x02)              Default (0x01)
   │                               │
   │ 11 01 (Hard Reset)            │ ✓ Returns to Default
   └──────────────────────────────►│

Extended (0x03)                 Default (0x01) OR Extended (0x03)
   │                               │
   │ 11 03 (Soft Reset)            │ ⚠️ Depends on Implementation
   └──────────────────────────────►│
```

### Security Requirements by Reset Type

```
┌──────────────────────────────────────────────────────────────┐
│ SECURITY ACCESS REQUIREMENTS                                 │
├────────────────────┬──────────────┬──────────────────────────┤
│  Reset Type        │  Security    │  Common Use Cases        │
├────────────────────┼──────────────┼──────────────────────────┤
│ 0x01 Hard Reset    │  Optional*   │  • Post-programming      │
│                    │              │  • Configuration update  │
│                    │              │  • Diagnostic recovery   │
├────────────────────┼──────────────┼──────────────────────────┤
│ 0x02 Key Off/On    │  Optional*   │  • Parameter activation  │
│                    │              │  • Learned value reset   │
│                    │              │  • Cycle simulation      │
├────────────────────┼──────────────┼──────────────────────────┤
│ 0x03 Soft Reset    │  Optional*   │  • Application restart   │
│                    │              │  • Quick recovery        │
│                    │              │  • Testing scenarios     │
├────────────────────┼──────────────┼──────────────────────────┤
│ 0x04 Enable Rapid  │  Required**  │  • EOL testing           │
│      Power Down    │              │  • Power management test │
├────────────────────┼──────────────┼──────────────────────────┤
│ 0x05 Disable Rapid │  Required**  │  • Restore normal mode   │
│      Power Down    │              │  • After testing         │
└────────────────────┴──────────────┴──────────────────────────┘

* Optional: ECU-specific; some require security, others don't
** Required: Typically requires security due to safety impact
```

---

## Complete Workflow Examples

### Workflow 1: Complete Software Update with Reset

```
┌──────────────────────────────────────────────────────────────┐
│ COMPLETE SOFTWARE REPROGRAMMING SEQUENCE                     │
└──────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │                                        │ [Initial State]
    │                                        │ Session: Default (0x01)
    │                                        │ Security: 🔒 Locked
    │                                        │
    │ ═══════ STEP 1: ENTER PROGRAMMING SESSION ═══════
    │                                        │
    │  10 02 (Programming Session)           │
    │───────────────────────────────────────>│
    │                                        │
    │  50 02 00 32 00 0A                     │
    │<───────────────────────────────────────│
    │  (Session active, timeout=5000ms)      │
    │                                        │ Session: Programming (0x02)
    │                                        │
    │ ═══════ STEP 2: UNLOCK SECURITY ═══════
    │                                        │
    │  27 01 (Request Seed - Level 1)        │
    │───────────────────────────────────────>│
    │                                        │
    │  67 01 A5 B3 C7 D9                     │
    │<───────────────────────────────────────│
    │  (Seed value)                          │
    │                                        │
    │  [Tester calculates key from seed]     │
    │                                        │
    │  27 02 E4 F1 82 A6 (Send Key)          │
    │───────────────────────────────────────>│
    │                                        │
    │  67 02                                 │
    │<───────────────────────────────────────│
    │  (Security unlocked)                   │
    │                                        │ Security: 🔓 Unlocked
    │                                        │
    │ ═══════ STEP 3: DISABLE COMMUNICATION ═══════
    │                                        │
    │  28 03 01 (Disable Non-Diagnostic)     │
    │───────────────────────────────────────>│
    │                                        │
    │  68 03 01                              │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 4: ERASE FLASH MEMORY ═══════
    │                                        │
    │  31 01 FF 00 (Erase Memory Routine)    │
    │───────────────────────────────────────>│
    │                                        │
    │  71 01 FF 00                           │
    │<───────────────────────────────────────│
    │  (Erase started)                       │
    │                                        │
    │  [Wait for erase completion ~10s]      │
    │                                        │
    │  3E 00 (Tester Present - keep alive)   │
    │───────────────────────────────────────>│
    │  7E 00                                 │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 5: REQUEST DOWNLOAD ═══════
    │                                        │
    │  34 00 00 00 80 00 00 20 00 00         │
    │  (Address: 0x008000, Size: 0x2000)     │
    │───────────────────────────────────────>│
    │                                        │
    │  74 20 FF                              │
    │<───────────────────────────────────────│
    │  (Max block length: 0xFF bytes)        │
    │                                        │
    │ ═══════ STEP 6: TRANSFER DATA ═══════
    │                                        │
    │  36 01 [256 bytes of data...]          │
    │───────────────────────────────────────>│
    │  76 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  36 02 [256 bytes of data...]          │
    │───────────────────────────────────────>│
    │  76 02                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  ... (repeat for all blocks)           │
    │                                        │
    │  36 20 [final block data...]           │
    │───────────────────────────────────────>│
    │  76 20                                 │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 7: EXIT TRANSFER ═══════
    │                                        │
    │  37 (Request Transfer Exit)            │
    │───────────────────────────────────────>│
    │                                        │
    │  77                                    │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 8: VERIFY CHECKSUM ═══════
    │                                        │
    │  31 01 FF 01 A5 B3 (Checksum Routine)  │
    │───────────────────────────────────────>│
    │                                        │
    │  71 01 FF 01 00 (Checksum OK)          │
    │<───────────────────────────────────────│
    │                                   ✓    │
    │                                        │
    │ ═══════ ★ STEP 9: RESET ECU ★ ═══════
    │                                        │
    │  11 01 (Hard Reset)                    │
    │───────────────────────────────────────>│
    │                                        │
    │  51 01                                 │
    │<───────────────────────────────────────│
    │  (Reset acknowledged)                  │
    │                                        │
    │         [ECU RESETS - OFFLINE]         │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │         [Duration: 5-15 seconds]       │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │                                        │
    │         [ECU COMES BACK ONLINE]        │
    │<═══════════════════════════════════════│
    │                                        │ [New State]
    │                                        │ Session: Default (0x01)
    │                                        │ Security: 🔒 Locked
    │                                        │ Software: NEW VERSION
    │                                        │
    │ ═══════ STEP 10: VERIFY NEW SOFTWARE ═══════
    │                                        │
    │  22 F1 95 (Read Software Version)      │
    │───────────────────────────────────────>│
    │                                        │
    │  62 F1 95 [new version string]         │
    │<───────────────────────────────────────│
    │                                   ✓    │
    │                                        │
    │ ═══════ COMPLETE ✓ ═══════             │
```

### Workflow 2: Configuration Parameter Update

```
┌──────────────────────────────────────────────────────────────┐
│ CONFIGURATION PARAMETER UPDATE WITH KEY CYCLE RESET          │
└──────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │                                        │ [Initial State]
    │                                        │ Session: Default (0x01)
    │                                        │ Config: OLD VALUES
    │                                        │
    │ ═══════ STEP 1: ENTER EXTENDED SESSION ═══════
    │                                        │
    │  10 03 (Extended Diagnostic Session)   │
    │───────────────────────────────────────>│
    │                                        │
    │  50 03 00 32 00 0A                     │
    │<───────────────────────────────────────│
    │                                        │ Session: Extended (0x03)
    │                                        │
    │ ═══════ STEP 2: READ CURRENT VALUES ═══════
    │                                        │
    │  22 F1 90 (Read VIN)                   │
    │───────────────────────────────────────>│
    │  62 F1 90 [VIN data]                   │
    │<───────────────────────────────────────│
    │                                        │
    │  22 10 00 (Read Parameter Set 1)       │
    │───────────────────────────────────────>│
    │  62 10 00 [old parameter values]       │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 3: WRITE NEW PARAMETERS ═══════
    │                                        │
    │  2E 10 00 [new parameter values]       │
    │───────────────────────────────────────>│
    │                                        │
    │  6E 10 00                              │
    │<───────────────────────────────────────│
    │  (Parameters written to RAM/EEPROM)    │
    │                                   ✓    │
    │                                        │
    │  2E 10 01 [more parameters]            │
    │───────────────────────────────────────>│
    │  6E 10 01                              │
    │<───────────────────────────────────────│
    │                                   ✓    │
    │                                        │
    │ ═══════ ★ STEP 4: KEY OFF/ON RESET ★ ═══════
    │                                        │
    │  11 02 (Key Off/On Reset)              │
    │───────────────────────────────────────>│
    │                                        │
    │  51 02 05                              │
    │<───────────────────────────────────────│
    │  (Reset in 5 seconds)                  │
    │                                        │
    │     [ECU SIMULATES KEY CYCLE]          │
    │     • Shutdown sequence                │
    │     • Save parameters                  │
    │     • Simulate key-off delay           │
    │     • Power-up sequence                │
    │     • Load new parameters              │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │         [Duration: 8-12 seconds]       │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │                                        │
    │<═══════════════════════════════════════│
    │                                        │ [New State]
    │                                        │ Session: Default (0x01)
    │                                        │ Config: NEW VALUES ACTIVE
    │                                        │
    │ ═══════ STEP 5: VERIFY NEW VALUES ═══════
    │                                        │
    │  10 03 (Back to Extended)              │
    │───────────────────────────────────────>│
    │  50 03 00 32 00 0A                     │
    │<───────────────────────────────────────│
    │                                        │
    │  22 10 00 (Read Parameters Again)      │
    │───────────────────────────────────────>│
    │                                        │
    │  62 10 00 [NEW parameter values]       │
    │<───────────────────────────────────────│
    │                                   ✓    │
    │                                        │
    │ ═══════ COMPLETE ✓ ═══════             │
```

### Workflow 3: Fault Clearing and Reset

```
┌──────────────────────────────────────────────────────────────┐
│ DIAGNOSTIC FAULT CLEARING WITH HARD RESET                    │
└──────────────────────────────────────────────────────────────┘

  Tester                                    ECU
    │                                        │
    │                                        │ [Initial State]
    │                                        │ DTCs: Multiple Faults
    │                                        │ Session: Default (0x01)
    │                                        │
    │ ═══════ STEP 1: READ FAULTS ═══════
    │                                        │
    │  19 02 FF (Read DTC by Status Mask)    │
    │───────────────────────────────────────>│
    │                                        │
    │  59 02 FF 05                           │
    │     P0134 (O2 Sensor)                  │
    │     P0301 (Cylinder 1 Misfire)         │
    │     P0420 (Catalyst)                   │
    │     C1234 (ABS Fault)                  │
    │     U0100 (Lost Comm)                  │
    │<───────────────────────────────────────│
    │  (5 DTCs present)                      │
    │                                        │
    │ ═══════ STEP 2: READ FREEZE FRAMES ═══════
    │                                        │
    │  19 04 P0134 (Read Freeze Frame)       │
    │───────────────────────────────────────>│
    │  59 04 [freeze frame data...]          │
    │<───────────────────────────────────────│
    │                                        │
    │ ═══════ STEP 3: ENTER EXTENDED SESSION ═══════
    │                                        │
    │  10 03                                 │
    │───────────────────────────────────────>│
    │  50 03 00 32 00 0A                     │
    │<───────────────────────────────────────│
    │                                        │ Session: Extended (0x03)
    │                                        │
    │ ═══════ STEP 4: CLEAR ALL DTCS ═══════
    │                                        │
    │  14 FF FF FF (Clear All DTCs)          │
    │───────────────────────────────────────>│
    │                                        │
    │  54                                    │
    │<───────────────────────────────────────│
    │  (DTCs cleared from memory)            │
    │                                   ✓    │
    │                                        │
    │ ═══════ STEP 5: VERIFY CLEARED ═══════
    │                                        │
    │  19 02 FF                              │
    │───────────────────────────────────────>│
    │                                        │
    │  59 02 FF 00                           │
    │<───────────────────────────────────────│
    │  (0 DTCs - all cleared)                │
    │                                   ✓    │
    │                                        │
    │ ═══════ ★ STEP 6: HARD RESET ★ ═══════
    │                                        │
    │  11 01 (Hard Reset)                    │
    │───────────────────────────────────────>│
    │                                        │
    │  51 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │         [ECU RESETS]                   │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │         [Fresh Start]                  │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │<═══════════════════════════════════════│
    │                                        │ [New State]
    │                                        │ DTCs: 0 (Clean start)
    │                                        │ Session: Default (0x01)
    │                                        │
    │ ═══════ STEP 7: FINAL VERIFICATION ═══════
    │                                        │
    │  19 02 FF (Check DTCs Again)           │
    │───────────────────────────────────────>│
    │                                        │
    │  59 02 FF 00                           │
    │<───────────────────────────────────────│
    │  (Still 0 DTCs)                        │
    │                                   ✓    │
    │                                        │
    │ ═══════ COMPLETE ✓ ═══════             │
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Reset After Routine Execution

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Execute Routine → Reset ECU                         │
└──────────────────────────────────────────────────────────────┘

Use Case: Self-test routine that requires reset to apply results

  Tester                                    ECU
    │                                        │
    │  10 03 (Extended Session)              │
    │───────────────────────────────────────>│
    │  50 03                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  31 01 12 34 (Start Routine 0x1234)    │
    │───────────────────────────────────────>│
    │  71 01 12 34                           │
    │<───────────────────────────────────────│
    │  (Routine running...)                  │
    │                                        │
    │  [Wait for completion]                 │
    │                                        │
    │  31 03 12 34 (Get Routine Results)     │
    │───────────────────────────────────────>│
    │  71 03 12 34 [results]                 │
    │<───────────────────────────────────────│
    │  (Routine complete - reset needed)     │
    │                                        │
    │  ★ 11 01 (Hard Reset) ★                │
    │───────────────────────────────────────>│
    │  51 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU applies routine results]         │

Services Used:
  • 0x10 - Diagnostic Session Control
  • 0x31 - Routine Control
  • 0x11 - ECU Reset
```

### Pattern 2: Multi-ECU Coordinated Reset

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Reset Multiple ECUs in Sequence                     │
└──────────────────────────────────────────────────────────────┘

Use Case: System-wide update requiring all ECUs to reset

  Tester          ECU #1 (Engine)    ECU #2 (TCM)    ECU #3 (BCM)
    │                  │                  │                │
    │ ─────────────────────────────────────────────────────────
    │ Step 1: Reset Engine ECU
    │ ─────────────────────────────────────────────────────────
    │                  │                  │                │
    │  11 01           │                  │                │
    │─────────────────>│                  │                │
    │  51 01           │                  │                │
    │<─────────────────│                  │                │
    │                  │                  │                │
    │  [ECU #1 offline]│                  │                │
    │ · · · · · · · · ·│                  │                │
    │  [ECU #1 online] │                  │                │
    │<═════════════════│                  │                │
    │                  │                  │                │
    │ ─────────────────────────────────────────────────────────
    │ Step 2: Reset Transmission ECU
    │ ─────────────────────────────────────────────────────────
    │                  │                  │                │
    │  11 01           │                  │                │
    │──────────────────────────────────────>│                │
    │  51 01           │                  │                │
    │<──────────────────────────────────────│                │
    │                  │                  │                │
    │                  │  [ECU #2 offline]│                │
    │                  │ · · · · · · · · ·│                │
    │                  │  [ECU #2 online] │                │
    │                  │<═════════════════│                │
    │                  │                  │                │
    │ ─────────────────────────────────────────────────────────
    │ Step 3: Reset Body Control ECU
    │ ─────────────────────────────────────────────────────────
    │                  │                  │                │
    │  11 01           │                  │                │
    │───────────────────────────────────────────────────────>│
    │  51 01           │                  │                │
    │<───────────────────────────────────────────────────────│
    │                  │                  │                │
    │                  │                  │ [ECU #3 offline]│
    │                  │                  │ · · · · · · · · │
    │                  │                  │ [ECU #3 online] │
    │                  │                  │<════════════════│
    │                  │                  │                │
    │ ═══════ ALL ECUS RESET COMPLETE ═══════

Important: Reset ECUs in order of dependency!
```

### Pattern 3: Reset with DTC Control

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Disable DTC Setting → Reset → Re-enable DTCs        │
└──────────────────────────────────────────────────────────────┘

Use Case: Reset without generating new fault codes

  Tester                                    ECU
    │                                        │
    │  10 03 (Extended Session)              │
    │───────────────────────────────────────>│
    │  50 03                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  85 02 (Disable DTC Setting)           │
    │───────────────────────────────────────>│
    │  C5 02                                 │
    │<───────────────────────────────────────│
    │  (DTCs won't be stored)                │
    │                                        │
    │  ★ 11 01 (Hard Reset) ★                │
    │───────────────────────────────────────>│
    │  51 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU Resets - no new DTCs stored]     │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │<═══════════════════════════════════════│
    │                                        │
    │  10 03 (Back to Extended)              │
    │───────────────────────────────────────>│
    │  50 03                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  85 01 (Enable DTC Setting)            │
    │───────────────────────────────────────>│
    │  C5 01                                 │
    │<───────────────────────────────────────│
    │  (DTCs will be stored again)           │

Services Used:
  • 0x10 - Diagnostic Session Control
  • 0x85 - Control DTC Setting
  • 0x11 - ECU Reset
```

### Pattern 4: Reset with Communication Control

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Disable Normal Comm → Update → Reset → Enable       │
└──────────────────────────────────────────────────────────────┘

Use Case: Prevent normal messages during update/reset

  Tester                                    ECU
    │                                        │
    │  10 02 (Programming Session)           │
    │───────────────────────────────────────>│
    │  50 02                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  27 XX (Security Access)               │
    │<──────────────────────────────────────>│
    │  (Unlocked 🔓)                         │
    │                                        │
    │  28 03 01 (Disable Tx and Rx)          │
    │───────────────────────────────────────>│
    │  68 03 01                              │
    │<───────────────────────────────────────│
    │  (Normal messages disabled)            │
    │                                        │
    │  [Perform updates...]                  │
    │  2E XX XX [data writes...]             │
    │<──────────────────────────────────────>│
    │                                        │
    │  ★ 11 01 (Hard Reset) ★                │
    │───────────────────────────────────────>│
    │  51 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU Resets]                          │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │<═══════════════════════════════════════│
    │  (Communication auto-enabled after     │
    │   reset to Default Session)            │

Services Used:
  • 0x10 - Diagnostic Session Control
  • 0x27 - Security Access
  • 0x28 - Communication Control
  • 0x2E - Write Data By Identifier
  • 0x11 - ECU Reset
```

### Pattern 5: Soft Reset for Quick Recovery

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Soft Reset to Recover from Error State              │
└──────────────────────────────────────────────────────────────┘

Use Case: Application hung, need quick restart without full reset

  Tester                                    ECU
    │                                        │
    │                                        │ [Application Error]
    │  [Detect: ECU not responding properly] │ [Watchdog not expired]
    │                                        │
    │  10 03 (Extended Session)              │
    │───────────────────────────────────────>│
    │  50 03                                 │
    │<───────────────────────────────────────│
    │  (Diagnostic layer still works)        │
    │                                        │
    │  ★ 11 03 (Soft Reset) ★                │
    │───────────────────────────────────────>│
    │  51 03                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [Quick Application Restart: 1-3s]     │
    │  • Stop app tasks                      │
    │  • Clear app RAM                       │
    │  • Reinit application                  │
    │  • Resume operation                    │
    │                                        │
    │<═══════════════════════════════════════│
    │  (ECU functional again)                │
    │                                        │
    │  22 F1 86 (Read Active Diag Session)   │
    │───────────────────────────────────────>│
    │  62 F1 86 03                           │
    │<───────────────────────────────────────│
    │  (Session preserved!)                  │

Advantages:
  ✓ Fast recovery (1-5 seconds vs 5-15)
  ✓ May maintain diagnostic session
  ✓ Communication may stay active
  ✓ Less disruptive to vehicle
```

### Pattern 6: Reset After Memory Write

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Write to Memory → Verify → Reset to Apply           │
└──────────────────────────────────────────────────────────────┘

Use Case: Configuration stored in EEPROM needs reset to activate

  Tester                                    ECU
    │                                        │
    │  10 03 (Extended Session)              │
    │───────────────────────────────────────>│
    │  50 03                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  3D 11 22 33 44 08 [data]              │
    │  (Write Memory Address 0x11223344)     │
    │───────────────────────────────────────>│
    │  7D 11 22 33 44 08                     │
    │<───────────────────────────────────────│
    │  (Memory written)                 ✓    │
    │                                        │
    │  23 11 22 33 44 08                     │
    │  (Read Memory to Verify)               │
    │───────────────────────────────────────>│
    │  63 [data matches]                     │
    │<───────────────────────────────────────│
    │  (Verification successful)        ✓    │
    │                                        │
    │  ★ 11 02 (Key Off/On Reset) ★          │
    │───────────────────────────────────────>│
    │  51 02                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [ECU loads new config from EEPROM]    │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │<═══════════════════════════════════════│
    │  (New configuration active)            │

Services Used:
  • 0x10 - Diagnostic Session Control
  • 0x3D - Write Memory By Address
  • 0x23 - Read Memory By Address
  • 0x11 - ECU Reset
```

### Pattern 7: Security Timeout Recovery

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN: Security Locked → Reset → Re-authenticate           │
└──────────────────────────────────────────────────────────────┘

Use Case: Security timeout occurred, need fresh start

  Tester                                    ECU
    │                                        │
    │  10 02 (Programming Session)           │
    │───────────────────────────────────────>│
    │  50 02                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  27 XX (Security Access)               │
    │<──────────────────────────────────────>│
    │  (Unlocked 🔓)                         │
    │                                        │
    │  [Long operation - security times out] │
    │  [Wait > 5 minutes]                    │
    │                                        │
    │  2E XX XX (Try to write)               │
    │───────────────────────────────────────>│
    │  7F 2E 33 (Security Access Denied)     │
    │<───────────────────────────────────────│
    │  (Security locked again! 🔒)           │
    │                                        │
    │  ★ 11 01 (Hard Reset) ★                │
    │───────────────────────────────────────>│
    │  51 01                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  [Fresh Start]                         │
    │ · · · · · · · · · · · · · · · · · · · · · │
    │<═══════════════════════════════════════│
    │                                        │
    │  10 02 (Programming Session Again)     │
    │───────────────────────────────────────>│
    │  50 02                                 │
    │<───────────────────────────────────────│
    │                                        │
    │  27 XX (Re-authenticate)               │
    │<──────────────────────────────────────>│
    │  (Unlocked 🔓 - Ready to continue)     │
```

---

## Troubleshooting Scenarios

### Scenario 1: Reset Request Rejected

```
┌──────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING: NRC 0x22 - Conditions Not Correct           │
└──────────────────────────────────────────────────────────────┘

SYMPTOM:
  Tester                  ECU
    │                      │
    │  11 01               │
    │─────────────────────>│
    │  7F 11 22            │ ❌
    │<─────────────────────│

DIAGNOSTIC TREE:

1. Check Vehicle State
   ┌──────────────────────┐
   │ Read vehicle speed   │
   │ (SID 0x22, PID)      │
   └────────┬─────────────┘
            │
    ┌───────┴────────┐
   = 0?            > 0?
    │                │
    │                └─> ❌ PROBLEM: Vehicle moving
    │                    SOLUTION: Stop vehicle
    ▼
2. Check Engine State
   ┌──────────────────────┐
   │ Read engine RPM      │
   │ (SID 0x22, PID)      │
   └────────┬─────────────┘
            │
    ┌───────┴────────┐
   = 0?            > 0?
    │                │
    │                └─> ❌ PROBLEM: Engine running
    │                    SOLUTION: Turn off engine
    ▼
3. Check Battery Voltage
   ┌──────────────────────┐
   │ Read battery voltage │
   │ (SID 0x22, PID)      │
   └────────┬─────────────┘
            │
    ┌───────┴────────┐
  Normal?        Low/High?
    │                │
    │                └─> ❌ PROBLEM: Voltage out of range
    │                    SOLUTION: Check battery/charging
    ▼
4. Check Active Faults
   ┌──────────────────────┐
   │ Read DTCs (SID 0x19) │
   └────────┬─────────────┘
            │
    ┌───────┴────────┐
  None?          Present?
    │                │
    │                └─> ❌ PROBLEM: Critical fault active
    │                    SOLUTION: Diagnose and clear
    ▼
    ✓ All checks passed
    (Retry reset request)
```

### Scenario 2: ECU Doesn't Come Back After Reset

```
┌──────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING: ECU Offline After Reset                     │
└──────────────────────────────────────────────────────────────┘

SYMPTOM:
  Tester                  ECU
    │                      │
    │  11 01               │
    │─────────────────────>│
    │  51 01               │
    │<─────────────────────│
    │                      │
    │  [Wait 20 seconds]   │
    │  [No response]       │ ❌
    │                      │

DIAGNOSTIC STEPS:

Step 1: Check Expected Reset Time
┌────────────────────────────────┐
│ Hard Reset: 5-15 seconds       │
│ Key Off/On: 8-20 seconds       │
│ Soft Reset: 1-5 seconds        │
└────────────────────────────────┘
         │
         │ If exceeded max time
         ▼
Step 2: Check Physical Indicators
┌────────────────────────────────┐
│ • LEDs blinking?               │
│ • CAN bus activity?            │
│ • Power supply stable?         │
└────────┬───────────────────────┘
         │
    ┌────┴─────┐
   Yes        No
    │          │
    │          └─> Check power/CAN hardware
    ▼
Step 3: Try to Reconnect
┌────────────────────────────────┐
│ • Different CAN ID?            │
│ • Bootloader mode?             │
│ • Send 10 01 (Default Session) │
└────────┬───────────────────────┘
         │
    ┌────┴─────┐
Response?   Silence?
    │          │
    │          └─> ECU may be bricked
    │              • Try bootloader recovery
    │              • Check for infinite reset loop
    ▼              • Reflash may be needed
   ✓ ECU responded
   (Check session/state)
```

### Scenario 3: Wrong Session After Reset

```
┌──────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING: ECU Not in Default Session After Reset      │
└──────────────────────────────────────────────────────────────┘

SYMPTOM:
  Before Reset: Extended Session (0x03)
  After Reset: Still Extended? OR Unknown Session?

DIAGNOSTIC:

1. Read Current Session
   ┌──────────────────────┐
   │ 22 F1 86             │
   │ (Read Active Session)│
   └────────┬─────────────┘
            │
            ▼
   ┌──────────────────────┐
   │ What session?        │
   └────────┬─────────────┘
            │
    ┌───────┴────────┬─────────────┐
    │                │             │
  0x01            0x03           Other
(Default)      (Extended)
    │                │             │
    ✓                ❌            ❌
  Correct        Wrong!         Wrong!
                    │             │
                    └─────┬───────┘
                          │
                          ▼
2. Check Reset Type Used
   ┌──────────────────────────────┐
   │ Was it Soft Reset (0x03)?    │
   └────────┬─────────────────────┘
            │
    ┌───────┴────────┐
   Yes              No
    │                │
    │                └─> Bug in ECU!
    │                    Session should reset
    │                    to Default (0x01)
    ▼
   ⚠️ Soft Reset may preserve session
   (Implementation-dependent)

SOLUTION:
  • Use Hard Reset (0x01) to force Default Session
  • Or manually switch: 10 01 (Default Session)
```

### Scenario 4: Security Access Required but Not Expected

```
┌──────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING: Unexpected NRC 0x33 (Security Denied)       │
└──────────────────────────────────────────────────────────────┘

SYMPTOM:
  Tester                  ECU
    │                      │
    │  11 01               │
    │─────────────────────>│
    │  7F 11 33            │ ❌
    │<─────────────────────│
    │  (Security Access    │
    │   Denied)            │

DIAGNOSTIC:

1. Check ECU Requirements
   ┌──────────────────────────────┐
   │ Does this ECU/reset type     │
   │ require security?            │
   └────────┬─────────────────────┘
            │
    ┌───────┴────────┐
   Yes              No
    │                │
    │                └─> Unexpected! Check ECU
    │                    documentation
    ▼
2. Check Current Security State
   ┌──────────────────────────────┐
   │ 27 01 (Request Seed)         │
   └────────┬─────────────────────┘
            │
    ┌───────┴────────┐
   Seed?       67 02?
    │            │
    │            └─> Already unlocked!
    │                But reset still rejected?
    │                (Check security level)
    ▼
   🔒 Locked

3. Unlock Security
   ┌──────────────────────────────┐
   │ Complete seed/key exchange:  │
   │ 1. 27 01 (Request Seed)      │
   │ 2. 67 01 [seed]              │
   │ 3. Calculate key             │
   │ 4. 27 02 [key]               │
   │ 5. 67 02 (Unlocked)          │
   └────────┬─────────────────────┘
            │
            ▼ 🔓
   ┌──────────────────────────────┐
   │ Retry reset request          │
   │ 11 01                        │
   │ Should succeed now ✓         │
   └──────────────────────────────┘
```

### Scenario 5: Rapid Power Shutdown Not Working

```
┌──────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING: Rapid Power Shutdown Enable/Disable Issues  │
└──────────────────────────────────────────────────────────────┘

SYMPTOM:
  Tester                  ECU
    │                      │
    │  11 04 (Enable)      │
    │─────────────────────>│
    │  51 04               │ ✓ Success
    │<─────────────────────│
    │                      │
    │  [Power down ECU]    │
    │  [Shutdown is still  │
    │   slow - 5+ seconds] │ ❌ Expected fast!

DIAGNOSTIC:

1. Verify Mode Setting
   ┌──────────────────────────────┐
   │ Is rapid_shutdown flag set?  │
   │ (Read via 0x22 if available) │
   └────────┬─────────────────────┘
            │
    ┌───────┴────────┐
   Set?          Not Set?
    │                │
    │                └─> ECU didn't apply setting!
    │                    • Check implementation
    │                    • May need reset first?
    ▼
2. Test Shutdown Behavior
   ┌──────────────────────────────┐
   │ Trigger actual power-down    │
   │ • Ignition OFF               │
   │ • Or voltage drop            │
   └────────┬─────────────────────┘
            │
    ┌───────┴────────┐
  Fast?          Slow?
  (< 1s)      (> 3s)
    │            │
    ✓            ❌
  Working!    Not working
                │
                ▼
   Possible Issues:
   • Feature not implemented
   • Requires different session
   • Needs security access
   • Only works after next reset
   • Manufacturing mode only

SOLUTION:
  • Check ECU documentation
  • Verify feature availability
  • Try: Enable → Reset → Power down
```

---

## Quick Reference Tables

### Service ID Quick Reference

```
┌──────────┬─────────────────────────┬──────────────────────────┐
│   SID    │  Service Name           │  Relation to Reset       │
├──────────┼─────────────────────────┼──────────────────────────┤
│   0x10   │  Diagnostic Session     │  Required prerequisite   │
│   0x11   │  ECU Reset              │  ★ TARGET SERVICE ★      │
│   0x14   │  Clear DTC              │  Often precedes reset    │
│   0x19   │  Read DTC               │  Diagnostic before reset │
│   0x22   │  Read Data              │  Verify pre/post reset   │
│   0x23   │  Read Memory            │  Verify writes           │
│   0x27   │  Security Access        │  May be required         │
│   0x28   │  Communication Control  │  Use during programming  │
│   0x2E   │  Write Data             │  Often followed by reset │
│   0x31   │  Routine Control        │  May require reset after │
│   0x34   │  Request Download       │  Programming sequence    │
│   0x36   │  Transfer Data          │  Programming sequence    │
│   0x37   │  Transfer Exit          │  Then reset ECU          │
│   0x3D   │  Write Memory           │  Followed by reset       │
│   0x3E   │  Tester Present         │  Keep session alive      │
│   0x85   │  Control DTC            │  Disable before reset    │
└──────────┴─────────────────────────┴──────────────────────────┘
```

### Reset Type Selection Guide

```
┌─────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH RESET TYPE                                │
├────────────────────────┬────────────────────────────────────┤
│  Situation             │  Recommended Reset Type            │
├────────────────────────┼────────────────────────────────────┤
│  After software update │  0x01 - Hard Reset                 │
│  After calibration     │  0x02 - Key Off/On Reset           │
│  Application hung      │  0x03 - Soft Reset                 │
│  Clear all states      │  0x01 - Hard Reset                 │
│  Activate parameters   │  0x02 - Key Off/On Reset           │
│  Quick recovery        │  0x03 - Soft Reset                 │
│  EOL testing           │  0x04/0x05 - Rapid PD modes        │
│  Flash programming     │  0x01 - Hard Reset                 │
│  Config changes        │  0x02 - Key Off/On Reset           │
│  Diagnostic recovery   │  0x01 - Hard Reset                 │
└────────────────────────┴────────────────────────────────────┘
```

### NRC Quick Lookup

```
┌──────────┬─────────────────────────────┬──────────────────────┐
│   NRC    │  Meaning                    │  Quick Fix           │
├──────────┼─────────────────────────────┼──────────────────────┤
│   0x12   │  Sub-Function Not Supported │  Use valid subfunction│
│   0x13   │  Incorrect Message Length   │  Send exactly 2 bytes│
│   0x22   │  Conditions Not Correct     │  Check speed/voltage │
│   0x31   │  Request Out Of Range       │  Check subfunction   │
│   0x33   │  Security Access Denied     │  Unlock with 0x27    │
│   0x7F   │  Not Supported In Session   │  Switch session (0x10)│
│   0x78   │  Response Pending           │  Wait for completion │
└──────────┴─────────────────────────────┴──────────────────────┘
```

### Timing Reference

```
┌────────────────────────┬──────────┬──────────┬──────────────┐
│  Reset Type            │  Min     │  Typical │  Max         │
├────────────────────────┼──────────┼──────────┼──────────────┤
│  Hard Reset (0x01)     │  2s      │  5-10s   │  15s         │
│  Key Off/On (0x02)     │  3s      │  8-12s   │  20s         │
│  Soft Reset (0x03)     │  0.5s    │  1-3s    │  5s          │
│  Rapid PD Enable (0x04)│  Instant │  Instant │  Instant     │
│  Rapid PD Disable(0x05)│  Instant │  Instant │  Instant     │
└────────────────────────┴──────────┴──────────┴──────────────┘
```

---

**End of Document**

**Related Documentation:**
- `SID_11_ECU_RESET.md` - Main theoretical guide
- `SID_11_PRACTICAL_IMPLEMENTATION.md` - Implementation details
- ISO 14229-1:2020 Section 9.3 - Official specification

**Additional Resources:**
- SAE J1979 - OBD-II Diagnostic Standards
- ISO 15765-3 - Diagnostic communication over CAN
- ISO 14229-1:2020 - Unified Diagnostic Services specification
