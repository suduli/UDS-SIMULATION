# SID 0x2A - Service Interactions and Workflows

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.2

---

## Table of Contents

1. [Service Dependency Overview](#service-dependency-overview)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Overview

### Service Dependency Pyramid

```
┌──────────────────────────────────────────────────────────────────┐
│              SID 0x2A DEPENDENCY HIERARCHY                       │
└──────────────────────────────────────────────────────────────────┘

                     ┌─────────────────┐
                     │   SID 0x2A      │
                     │   Periodic Data │
                     │   (Target)      │
                     └────────┬────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
   ┌─────────────────┐           ┌─────────────────────┐
   │   SID 0x10      │           │   SID 0x27          │
   │   Session       │           │   Security Access   │
   │   Control       │           │   (Optional)        │
   │   (Required)    │           └─────────────────────┘
   └─────────────────┘
              │
              │ Enables EXTENDED session
              │
              ▼
   ┌─────────────────────────────────────────┐
   │  Session State: EXTENDED (0x03)         │
   │  └─> Required for SID 0x2A              │
   └─────────────────────────────────────────┘

Related Services (Data Source):
┌──────────────────────────────────────────────────────────────────┐
│  SID 0x22 - ReadDataByIdentifier                                 │
│  └─> PDIDs often map to DIDs internally                          │
│                                                                  │
│  SID 0x3E - TesterPresent                                        │
│  └─> Keeps session active during periodic transmission          │
│                                                                  │
│  SID 0x11 - ECU Reset                                            │
│  └─> Stops all periodic transmissions                           │
└──────────────────────────────────────────────────────────────────┘
```

### Service Interaction Map

```
┌──────────────────────────────────────────────────────────────────┐
│                SERVICE INTERACTION MAP                           │
└──────────────────────────────────────────────────────────────────┘

         SID 0x10               SID 0x27            SID 0x2A
    DiagnosticSession       SecurityAccess     ReadDataByPeriodic
    ┌──────────────┐        ┌──────────────┐   ┌──────────────┐
    │              │        │              │   │              │
    │  Session:    │──────>│  Unlocks     │──>│  Access      │
    │  EXTENDED    │ Enables│  Protected   │   │  Protected   │
    │              │        │  PDIDs       │   │  PDIDs       │
    └──────┬───────┘        └──────────────┘   └──────┬───────┘
           │                                           │
           │                                           │
           │ Session change                            │
           └──────────────────────────────────────────>│
                            Stops all periodic         │
                            transmissions              │
                                                       │
         SID 0x3E                                      │
      TesterPresent                                    │
    ┌──────────────┐                                   │
    │              │                                   │
    │  Keeps       │──────────────────────────────────>│
    │  Session     │   Prevents timeout                │
    │  Active      │   (maintains periodic tx)         │
    └──────────────┘                                   │
                                                       │
         SID 0x11                                      │
        ECU Reset                                      │
    ┌──────────────┐                                   │
    │              │                                   │
    │  Hard/Soft   │──────────────────────────────────>│
    │  Reset       │   Stops all periodic              │
    │              │   transmissions                   │
    └──────────────┘                                   │
                                                       │
         SID 0x22                                      │
    ReadDataByIdentifier                               │
    ┌──────────────┐                                   │
    │              │                                   │
    │  DIDs serve  │<──────────────────────────────────┤
    │  as data     │   PDIDs map to DIDs               │
    │  source      │   (ECU internal)                  │
    └──────────────┘                                   │
```

---

## Session Requirements Matrix

### Session Support Matrix

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 SID 0x2A SESSION REQUIREMENTS                            │
├─────────────────────┬────────────────┬────────────────────────────────────┤
│  Session Type       │  SID 0x2A      │  Notes                             │
│                     │  Supported?    │                                    │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  DEFAULT (0x01)     │  ❌ NO         │  Must change to EXTENDED first     │
│                     │                │  Request returns NRC 0x22          │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  PROGRAMMING (0x02) │  ⚠️  MAYBE     │  Vehicle manufacturer specific     │
│                     │                │  Usually disabled during flash     │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  EXTENDED (0x03)    │  ✅ YES        │  Primary session for SID 0x2A      │
│                     │                │  All public PDIDs available        │
├─────────────────────┼────────────────┼────────────────────────────────────┤
│  SAFETY SYSTEM      │  ⚠️  MAYBE     │  Vehicle manufacturer specific     │
│  (0x04)             │                │  May support safety-related PDIDs  │
└─────────────────────┴────────────────┴────────────────────────────────────┘
```

### Session Transition Impact

```
┌──────────────────────────────────────────────────────────────────┐
│           SESSION TRANSITIONS & PERIODIC TRANSMISSION            │
└──────────────────────────────────────────────────────────────────┘

Scenario 1: DEFAULT → EXTENDED
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Before:  Session = DEFAULT                            │
│           Periodic TX = N/A (not available)            │
│                                                        │
│  Change:  10 03 → 50 03                                │
│                                                        │
│  After:   Session = EXTENDED                           │
│           Periodic TX = Available (can request)        │
└────────────────────────────────────────────────────────┘
Impact: ✓ No existing periodic transmissions affected
        ✓ Can now request SID 0x2A


Scenario 2: EXTENDED (with active periodic) → DEFAULT
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Before:  Session = EXTENDED                           │
│           Periodic TX = Active (PDID 0x01 @ 100ms)     │
│                                                        │
│  Change:  10 01 → 50 01                                │
│                                                        │
│  After:   Session = DEFAULT                            │
│           Periodic TX = STOPPED (all cleared)          │
└────────────────────────────────────────────────────────┘
Impact: ⚠️  ALL periodic transmissions stopped
        ⚠️  Must re-request after returning to EXTENDED


Scenario 3: EXTENDED → PROGRAMMING
═══════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────┐
│  Before:  Session = EXTENDED                           │
│           Periodic TX = Active (multiple PDIDs)        │
│                                                        │
│  Change:  10 02 → 50 02                                │
│                                                        │
│  After:   Session = PROGRAMMING                        │
│           Periodic TX = STOPPED (all cleared)          │
└────────────────────────────────────────────────────────┘
Impact: ⚠️  ALL periodic transmissions stopped
        ⚠️  Periodic data usually not supported during programming
```

---

## Complete Workflow Examples

### Workflow 1: Basic Monitoring Session

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Basic Engine Parameter Monitoring                    │
├──────────────────────────────────────────────────────────────────┤
│  Goal: Monitor engine RPM and vehicle speed periodically         │
│  PDIDs: 0x01 (RPM), 0x02 (Speed)                                 │
│  Rate: Medium (100ms interval)                                   │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Step 1: Enter Extended Session
    │  ─────────────────────────────────────────────
    │                               │
    │  10 03                        │
    │──────────────────────────────>│
    │                               ├─> Change to EXTENDED
    │  50 03 00 32 01 F4            │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Session = EXTENDED
    │          ✓ P2 = 50ms, P2* = 5000ms
    │
    │
    │  Step 2: Request Periodic Data (RPM)
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 02 01                     │
    │──────────────────────────────>│
    │                               ├─> Validate request
    │                               ├─> Add PDID 0x01 to scheduler
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ PDID 0x01 scheduled @ medium rate
    │
    │
    │  Step 3: Request Periodic Data (Speed)
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 02 02                     │
    │──────────────────────────────>│
    │                               ├─> Validate request
    │                               ├─> Add PDID 0x02 to scheduler
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ PDID 0x02 scheduled @ medium rate
    │
    │
    │  Step 4: Receive Periodic Responses
    │  ─────────────────────────────────────────────
    │                               │
    │                               ├─> Timer: 100ms elapsed
    │  6A 01 0C 80                  │    (RPM = 3200)
    │<──────────────────────────────│
    │                               │
    │                               ├─> Timer: 100ms elapsed
    │  6A 02 00 3C                  │    (Speed = 60 km/h)
    │<──────────────────────────────│
    │                               │
    │                               ├─> Timer: 100ms elapsed
    │  6A 01 0D 00                  │    (RPM = 3328)
    │<──────────────────────────────│
    │                               │
    │                               ├─> Timer: 100ms elapsed
    │  6A 02 00 3D                  │    (Speed = 61 km/h)
    │<──────────────────────────────│
    │                               │
    │  ... (continues indefinitely)
    │
    │
    │  Step 5: Stop Periodic Transmission
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 04                        │
    │──────────────────────────────>│
    │                               ├─> Stop all periodic timers
    │                               ├─> Clear scheduler
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ All periodic transmissions stopped
    │
    │
    │  Step 6: Return to Default Session
    │  ─────────────────────────────────────────────
    │                               │
    │  10 01                        │
    │──────────────────────────────>│
    │                               ├─> Change to DEFAULT
    │  50 01 00 32 01 F4            │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Session = DEFAULT
    │          ✓ Workflow complete
```

---

### Workflow 2: Security-Protected Data Monitoring

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Monitoring Protected Calibration Data                │
├──────────────────────────────────────────────────────────────────┤
│  Goal: Monitor internal calibration parameter (requires unlock)  │
│  PDID: 0x0A (Calibration value - protected)                      │
│  Rate: Slow (500ms interval)                                     │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Step 1: Enter Extended Session
    │  ─────────────────────────────────────────────
    │                               │
    │  10 03                        │
    │──────────────────────────────>│
    │  50 03 00 32 01 F4            │
    │<──────────────────────────────│
    │                               │
    │  Session: EXTENDED ✓
    │  Security: 🔒 LOCKED
    │
    │
    │  Step 2: Attempt to Request Protected PDID
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 01 0A                     │
    │──────────────────────────────>│
    │                               ├─> Validate session ✓
    │                               ├─> Check security ✗
    │                               ├─> PDID 0x0A requires unlock
    │  7F 2A 33                     │
    │<──────────────────────────────│
    │                               │
    │  Result: ❌ NRC 0x33 (Security Access Denied)
    │
    │
    │  Step 3: Request Security Seed
    │  ─────────────────────────────────────────────
    │                               │
    │  27 01                        │
    │──────────────────────────────>│
    │                               ├─> Generate seed
    │  67 01 A5 3F 7B 91            │
    │<──────────────────────────────│
    │                               │
    │  Received Seed: A5 3F 7B 91
    │  Calculate Key: [algorithm]
    │  Key Result: 5A C0 84 6E
    │
    │
    │  Step 4: Send Security Key
    │  ─────────────────────────────────────────────
    │                               │
    │  27 02 5A C0 84 6E            │
    │──────────────────────────────>│
    │                               ├─> Validate key
    │                               ├─> Key correct!
    │  67 02                        │
    │<──────────────────────────────│
    │                               │
    │  Security: 🔓 UNLOCKED ✓
    │
    │
    │  Step 5: Retry Protected PDID Request
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 01 0A                     │
    │──────────────────────────────>│
    │                               ├─> Validate session ✓
    │                               ├─> Check security ✓
    │                               ├─> Add to scheduler
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ PDID 0x0A scheduled @ slow rate
    │
    │
    │  Step 6: Receive Periodic Responses
    │  ─────────────────────────────────────────────
    │                               │
    │                               ├─> Timer: 500ms elapsed
    │  6A 0A 12 34                  │    (Calibration = 0x1234)
    │<──────────────────────────────│
    │                               │
    │                               ├─> Timer: 500ms elapsed
    │  6A 0A 12 35                  │    (Calibration = 0x1235)
    │<──────────────────────────────│
    │                               │
    │  ... (monitoring continues)
    │
    │
    │  Step 7: Cleanup and Exit
    │  ─────────────────────────────────────────────
    │                               │
    │  2A 04                        │
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  10 01                        │
    │──────────────────────────────>│
    │  50 01 00 32 01 F4            │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Workflow complete
    │          ✓ Security re-locked
    │          ✓ Periodic TX stopped
```

---

### Workflow 3: Mixed Rate Multi-Parameter Monitoring

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW: Real-Time Multi-Sensor Monitoring                    │
├──────────────────────────────────────────────────────────────────┤
│  Goal: Monitor multiple parameters at different rates           │
│  Fast:   PDID 0x04 (Throttle Position) @ 50ms                   │
│  Medium: PDID 0x01 (Engine RPM) @ 100ms                          │
│  Slow:   PDID 0x03 (Coolant Temp) @ 1000ms                      │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Step 1: Setup Session
    │  ─────────────────────────────────────────────
    │  10 03                        │
    │──────────────────────────────>│
    │  50 03 00 32 01 F4            │
    │<──────────────────────────────│
    │
    │
    │  Step 2: Request Fast Rate (Throttle)
    │  ─────────────────────────────────────────────
    │  2A 03 04                     │
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  Scheduler State:
    │  ┌─────────────────────────────────┐
    │  │  Fast:   PDID 0x04 (50ms)       │
    │  │  Medium: (empty)                │
    │  │  Slow:   (empty)                │
    │  └─────────────────────────────────┘
    │
    │
    │  Step 3: Request Medium Rate (RPM)
    │  ─────────────────────────────────────────────
    │  2A 02 01                     │
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  Scheduler State:
    │  ┌─────────────────────────────────┐
    │  │  Fast:   PDID 0x04 (50ms)       │
    │  │  Medium: PDID 0x01 (100ms)      │
    │  │  Slow:   (empty)                │
    │  └─────────────────────────────────┘
    │
    │
    │  Step 4: Request Slow Rate (Temperature)
    │  ─────────────────────────────────────────────
    │  2A 01 03                     │
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  Scheduler State:
    │  ┌─────────────────────────────────┐
    │  │  Fast:   PDID 0x04 (50ms)       │
    │  │  Medium: PDID 0x01 (100ms)      │
    │  │  Slow:   PDID 0x03 (1000ms)     │
    │  └─────────────────────────────────┘
    │
    │
    │  Step 5: Observe Interleaved Responses
    │  ─────────────────────────────────────────────
    │
    │  Time: 50ms
    │  6A 04 32                     │  ← Fast: Throttle = 50%
    │<──────────────────────────────│
    │
    │  Time: 100ms
    │  6A 04 34                     │  ← Fast: Throttle = 52%
    │<──────────────────────────────│
    │  6A 01 0C 00                  │  ← Medium: RPM = 3072
    │<──────────────────────────────│
    │
    │  Time: 150ms
    │  6A 04 36                     │  ← Fast: Throttle = 54%
    │<──────────────────────────────│
    │
    │  Time: 200ms
    │  6A 04 38                     │  ← Fast: Throttle = 56%
    │<──────────────────────────────│
    │  6A 01 0C 80                  │  ← Medium: RPM = 3200
    │<──────────────────────────────│
    │
    │  ... (pattern continues)
    │
    │  Time: 1000ms
    │  6A 03 5A                     │  ← Slow: Temp = 90°C
    │<──────────────────────────────│
    │
    │  Analysis:
    │  ├─> Fast PDID:   Every 50ms  (20 Hz)
    │  ├─> Medium PDID: Every 100ms (10 Hz)
    │  └─> Slow PDID:   Every 1000ms (1 Hz)
    │
    │
    │  Step 6: Selective Stop (Fast only)
    │  ─────────────────────────────────────────────
    │
    │  Note: Cannot selectively stop individual PDIDs
    │        Mode 0x04 stops ALL periodic transmissions
    │
    │  Alternative: Re-request with updated PDID list
    │
    │  2A 04                        │  (Stop all)
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  2A 02 01                     │  (Re-start medium only)
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  2A 01 03                     │  (Re-start slow only)
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │
    │  Result: ✓ Fast stopped, Medium & Slow continue
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Periodic Monitoring with TesterPresent

```
┌──────────────────────────────────────────────────────────────────┐
│  PATTERN: Long-Duration Monitoring with Session Keepalive       │
├──────────────────────────────────────────────────────────────────┤
│  Problem: EXTENDED session has timeout (e.g., 5 seconds)        │
│  Solution: Send TesterPresent periodically to prevent timeout   │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Setup: Enter EXTENDED, request periodic data
    │  ─────────────────────────────────────────────
    │  10 03 → 50 03                │
    │  2A 02 01 → 6A                │
    │                               │
    │  Session Timer: 5000ms (P2* extended timeout)
    │
    │
    │  Monitoring Phase with TesterPresent
    │  ─────────────────────────────────────────────
    │
    │  Time: 0ms
    │  6A 01 [data]                 │  ← Periodic response
    │<──────────────────────────────│
    │
    │  Time: 100ms
    │  6A 01 [data]                 │
    │<──────────────────────────────│
    │
    │  ... (periodic responses continue)
    │
    │  Time: 4000ms (before timeout!)
    │  3E 80                        │  ← TesterPresent (suppress response)
    │──────────────────────────────>│
    │                               ├─> Reset session timer
    │                               │
    │  Session Timer: RESET to 5000ms ✓
    │
    │  Time: 4100ms
    │  6A 01 [data]                 │
    │<──────────────────────────────│
    │
    │  ... (monitoring continues)
    │
    │  Time: 8000ms (before timeout again!)
    │  3E 80                        │
    │──────────────────────────────>│
    │                               ├─> Reset session timer
    │                               │
    │  Session Timer: RESET to 5000ms ✓
    │
    │
    │  Result: ✓ Session stays active indefinitely
    │          ✓ Periodic transmission continues
    │          ✓ Send TesterPresent every ~4 seconds (before P2* timeout)
```

---

### Pattern 2: Diagnostic Read Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│  PATTERN: Compare Periodic Data (SID 0x2A) vs Single Read (0x22)│
├──────────────────────────────────────────────────────────────────┤
│  Use Case: Verify periodic data matches single-read data        │
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Step 1: Read Current Value (SID 0x22)
    │  ─────────────────────────────────────────────
    │  22 F4 0C                     │  (DID: Engine RPM)
    │──────────────────────────────>│
    │  62 F4 0C 0C 00               │  (RPM = 3072)
    │<──────────────────────────────│
    │                               │
    │  Snapshot: RPM = 3072 at Time T0
    │
    │
    │  Step 2: Start Periodic Monitoring
    │  ─────────────────────────────────────────────
    │  2A 02 01                     │  (PDID 0x01 maps to DID 0xF40C)
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Time: T0 + 100ms
    │  6A 01 0C 00                  │  (RPM = 3072)
    │<──────────────────────────────│
    │                               │
    │  Comparison: ✓ Matches SID 0x22 result
    │
    │  Time: T0 + 200ms
    │  6A 01 0C 40                  │  (RPM = 3136)
    │<──────────────────────────────│
    │                               │
    │  Observation: Value changed (engine acceleration)
    │
    │
    │  Step 3: Verify with Another Single Read
    │  ─────────────────────────────────────────────
    │  22 F4 0C                     │
    │──────────────────────────────>│
    │  62 F4 0C 0C 40               │  (RPM = 3136)
    │<──────────────────────────────│
    │                               │
    │  Comparison: ✓ Matches latest periodic response
    │
    │  Conclusion:
    │  ├─> SID 0x2A (periodic) and SID 0x22 (single) use same data source
    │  ├─> PDID 0x01 correctly maps to DID 0xF40C
    │  └─> Periodic data is real-time (not cached)
```

---

### Pattern 3: Error Recovery After ECU Reset

```
┌──────────────────────────────────────────────────────────────────┐
│  PATTERN: Re-establish Periodic Transmission After ECU Reset    │
├──────────────────────────────────────────────────────────────────┤
│  Scenario: ECU reset (SID 0x11) stops all periodic transmissions│
└──────────────────────────────────────────────────────────────────┘

  Tester                           ECU
    │                               │
    │  Initial State: Periodic transmission active
    │  ─────────────────────────────────────────────
    │  Session: EXTENDED
    │  Periodic TX: PDID 0x01 @ 100ms
    │
    │  6A 01 [data]                 │
    │<──────────────────────────────│
    │  6A 01 [data]                 │
    │<──────────────────────────────│
    │
    │
    │  Step 1: ECU Reset Triggered
    │  ─────────────────────────────────────────────
    │  11 01                        │  (Hard reset)
    │──────────────────────────────>│
    │  51 01                        │
    │<──────────────────────────────│
    │                               │
    │                               ├─> ECU rebooting...
    │                               ├─> Stop all periodic TX
    │                               ├─> Clear scheduler
    │                               ├─> Session → DEFAULT
    │                               ├─> Security → LOCKED
    │                               │
    │  ... (wait for ECU boot time, e.g., 2 seconds)
    │
    │
    │  Step 2: Detect Periodic Transmission Stopped
    │  ─────────────────────────────────────────────
    │
    │  Time: 2000ms+ after reset
    │  (No periodic responses)      │
    │                               │
    │  Observation: ⚠️  Periodic transmission stopped
    │
    │
    │  Step 3: Re-establish Session
    │  ─────────────────────────────────────────────
    │  10 03                        │
    │──────────────────────────────>│
    │  50 03 00 32 01 F4            │
    │<──────────────────────────────│
    │                               │
    │  Session: EXTENDED (re-established)
    │
    │
    │  Step 4: Re-request Periodic Data
    │  ─────────────────────────────────────────────
    │  2A 02 01                     │
    │──────────────────────────────>│
    │  6A                           │
    │<──────────────────────────────│
    │                               │
    │  Time: 100ms
    │  6A 01 [data]                 │
    │<──────────────────────────────│
    │                               │
    │  Result: ✓ Periodic transmission restored
    │
    │
    │  Best Practice Sequence:
    │  ┌────────────────────────────────────────┐
    │  │  1. Detect loss of periodic responses  │
    │  │  2. Confirm ECU is back online         │
    │  │  3. Re-enter EXTENDED session          │
    │  │  4. Re-authenticate if needed (0x27)   │
    │  │  5. Re-request all periodic data       │
    │  └────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Periodic Responses Stop Unexpectedly

```
┌──────────────────────────────────────────────────────────────────┐
│  SYMPTOM: Periodic responses were flowing, then suddenly stopped│
└──────────────────────────────────────────────────────────────────┘

Diagnostic Steps:
═══════════════════════════════════════════════════════════════════

Step 1: Check Session State
┌────────────────────────────────────────────────────────┐
│  Action: Send DiagnosticSessionControl read current    │
│  Command: 10 [current] or check last session change    │
│                                                        │
│  Possible Findings:                                    │
│  ├─> Session changed to DEFAULT                       │
│  │   └─> Cause: Timeout, user action, or auto-revert  │
│  │   └─> Fix: Re-enter EXTENDED, re-request periodic  │
│  │                                                     │
│  └─> Session still EXTENDED                           │
│      └─> Continue to Step 2                           │
└────────────────────────────────────────────────────────┘

Step 2: Check Security State
┌────────────────────────────────────────────────────────┐
│  Action: Attempt to access protected PDID              │
│  Command: 2A 02 [protected_pdid]                       │
│                                                        │
│  Response:                                             │
│  ├─> 7F 2A 33 (Security Access Denied)                │
│  │   └─> Cause: ECU re-locked (timeout, reset, etc.)  │
│  │   └─> Fix: Re-authenticate via SID 0x27            │
│  │                                                     │
│  └─> 6A (Success)                                     │
│      └─> Security OK, continue to Step 3              │
└────────────────────────────────────────────────────────┘

Step 3: Check for ECU Reset/Fault
┌────────────────────────────────────────────────────────┐
│  Action: Read DTC or ECU status                        │
│  Command: 19 02 FF (ReadDTCByStatusMask)               │
│                                                        │
│  Possible Findings:                                    │
│  ├─> ECU recently reset                               │
│  │   └─> Cause: Power cycle, watchdog, commanded      │
│  │   └─> Fix: Re-establish all diagnostic services    │
│  │                                                     │
│  ├─> ECU in fault state                               │
│  │   └─> Cause: Internal error, scheduler crash       │
│  │   └─> Fix: Clear fault, ECU reset if needed        │
│  │                                                     │
│  └─> No faults detected                               │
│      └─> Continue to Step 4                           │
└────────────────────────────────────────────────────────┘

Step 4: Check Network Communication
┌────────────────────────────────────────────────────────┐
│  Action: Verify CAN bus integrity                      │
│                                                        │
│  Tests:                                                │
│  ├─> Send TesterPresent (3E 00)                       │
│  │   └─> Response expected: 7E 00                     │
│  │   └─> If no response: Network issue               │
│  │                                                     │
│  ├─> Check bus load                                   │
│  │   └─> High bus load may cause packet loss          │
│  │                                                     │
│  └─> Verify physical connection                       │
│      └─> Loose cables, termination issues             │
└────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Periodic Responses at Wrong Rate

```
┌──────────────────────────────────────────────────────────────────┐
│  SYMPTOM: Requested medium rate (100ms) but receiving at 500ms  │
└──────────────────────────────────────────────────────────────────┘

Diagnostic Visual:
═══════════════════════════════════════════════════════════════════

Expected vs Actual Timing:
┌────────────────────────────────────────────────────────┐
│  Expected (Medium Rate):                               │
│  Time:  0ms   100ms  200ms  300ms  400ms  500ms        │
│         │     │      │      │      │      │            │
│  RX:    ▼─────▼──────▼──────▼──────▼──────▼            │
│                                                        │
│  Actual Observed:                                      │
│  Time:  0ms               500ms              1000ms    │
│         │                 │                  │         │
│  RX:    ▼─────────────────▼──────────────────▼         │
│                                                        │
│  Analysis: Receiving at SLOW rate instead of MEDIUM    │
└────────────────────────────────────────────────────────┘

Troubleshooting Steps:
┌────────────────────────────────────────────────────────┐
│  1. Verify request sent correctly                      │
│     ├─> Check: 2A 02 [pdid] (mode 0x02 = medium)      │
│     └─> Not:   2A 01 [pdid] (mode 0x01 = slow)        │
│                                                        │
│  2. Check ECU scheduler interpretation                 │
│     ├─> ECU may override rate if load too high        │
│     └─> Check ECU documentation for rate limits       │
│                                                        │
│  3. Verify no bus delays                               │
│     ├─> High bus load can delay transmissions         │
│     └─> Measure actual CAN bus utilization            │
│                                                        │
│  4. Check if ECU remapped modes                        │
│     ├─> Some ECUs define custom rate mapping          │
│     └─> Consult ECU-specific documentation            │
└────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### SID Relationship Table

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   RELATED SERVICES QUICK REFERENCE                       │
├──────┬─────────────────────────┬──────────────────────────────────────────┤
│ SID  │  Service Name           │  Relationship to SID 0x2A                │
├──────┼─────────────────────────┼──────────────────────────────────────────┤
│ 0x10 │ DiagnosticSession       │  Required: Must enter EXTENDED session   │
│      │ Control                 │  Impact: Session change stops periodic   │
├──────┼─────────────────────────┼──────────────────────────────────────────┤
│ 0x11 │ ECU Reset               │  Impact: Stops all periodic transmission │
│      │                         │  Requires: Re-request after reset        │
├──────┼─────────────────────────┼──────────────────────────────────────────┤
│ 0x22 │ ReadDataByIdentifier    │  Related: PDIDs often map to DIDs        │
│      │                         │  Use: Single-read vs periodic comparison │
├──────┼─────────────────────────┼──────────────────────────────────────────┤
│ 0x27 │ SecurityAccess          │  Required: For protected PDIDs           │
│      │                         │  Impact: Re-lock stops protected PDIDs   │
├──────┼─────────────────────────┼──────────────────────────────────────────┤
│ 0x3E │ TesterPresent           │  Required: Prevent session timeout       │
│      │                         │  Use: Keep periodic transmission alive   │
└──────┴─────────────────────────┴──────────────────────────────────────────┘
```

### Workflow Decision Matrix

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 WORKFLOW SELECTION GUIDE                                 │
├─────────────────────────┬────────────────────────────────────────────────┤
│  Your Requirement       │  Recommended Workflow                          │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Monitor public data     │  Workflow 1: Basic Monitoring                  │
│ (RPM, speed, etc.)      │  └─> Simple: EXTENDED + Request + Stop         │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Monitor protected data  │  Workflow 2: Security-Protected                │
│ (calibration, etc.)     │  └─> Add: SID 0x27 unlock step                 │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Monitor mixed-rate data │  Workflow 3: Mixed Rate Multi-Parameter        │
│ (fast + medium + slow)  │  └─> Request each PDID with different mode     │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Long-duration monitoring│  Pattern 1: Periodic + TesterPresent           │
│ (> 5 seconds)           │  └─> Add: SID 0x3E every ~4 seconds            │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Verify data accuracy    │  Pattern 2: Compare with SID 0x22              │
│                         │  └─> Cross-check periodic vs single read       │
├─────────────────────────┼────────────────────────────────────────────────┤
│ Recover after ECU reset │  Pattern 3: Error Recovery                     │
│                         │  └─> Re-establish session + re-request         │
└─────────────────────────┴────────────────────────────────────────────────┘
```

---

**End of SID 0x2A Service Interactions Document**

For service theory, see: `SID_42_READ_DATA_BY_PERIODIC_IDENTIFIER.md`  
For implementation guide, see: `SID_42_PRACTICAL_IMPLEMENTATION.md`
