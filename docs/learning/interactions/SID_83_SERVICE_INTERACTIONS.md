# SID 0x83: Service Interactions & Workflows

**Document Version**: 2.0  
**Last Updated**: December 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.4

---

## Table of Contents

1. [Service Dependency Overview](#service-dependency-overview)
2. [Timing Parameter Management](#timing-parameter-management)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Overview

### Service Relationship Diagram

```
                    ┌─────────────────────┐
                    │   SID 0x83          │
                    │  (Access Timing)    │
                    └──────────┬──────────┘
                               │
                               │ Affects
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
      ┌────────────────┐ ┌──────────┐ ┌─────────────────┐
      │   SID 0x3E     │ │ ALL UDS  │ │Response Pending │
      │(Tester Present)│ │ Services │ │    (NRC 0x78)   │
      │ Uses P3Server  │ │Use P2/P2*│ │  Uses P2*Server │
      └────────────────┘ └──────────┘ └─────────────────┘
```

### Dependency Matrix

```
┌────────────────────┬──────────────────────────────────────┐
│ Service            │ Relationship with SID 0x83           │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x10           │ Session changes may reset timing     │
│ (Session Control)  │ parameters to defaults               │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x3E           │ P3Server timeout controlled by 0x83  │
│ (Tester Present)   │ interval must be < P3Server          │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x22/0x2E      │ Response timing governed by P2/P2*   │
│ (Read/Write DID)   │ set via 0x83                         │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x27           │ Seed request may need long P2*       │
│ (Security Access)  │ adjusted via 0x83                    │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x31           │ Long routines benefit from extended  │
│ (Routine Control)  │ P2* set via 0x83                     │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x34/0x36/0x37 │ Flashing requires very long P2*      │
│ (Download/Transfer)│ configured via 0x83                  │
├────────────────────┼──────────────────────────────────────┤
│ NRC 0x78           │ P2*Server determines how long to     │
│ (Response Pending) │ wait after receiving this NRC        │
└────────────────────┴──────────────────────────────────────┘
```

### Impact on Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│         HOW TIMING PARAMETERS AFFECT COMMUNICATION          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Default Timing (P2=50ms, P2*=5000ms):                     │
│                                                             │
│  Tester              ECU                                    │
│    │                 │                                      │
│    │  Request        │                                      │
│    │────────────────>│                                      │
│    │                 │                                      │
│    │  ◄── 50ms ──►   │ [Processing]                        │
│    │                 │                                      │
│    │  Response       │                                      │
│    │◄────────────────│                                      │
│    │                 │                                      │
│                                                             │
│  After Setting P2=200ms via SID 0x83:                       │
│                                                             │
│  Tester              ECU                                    │
│    │                 │                                      │
│    │  Request        │                                      │
│    │────────────────>│                                      │
│    │                 │                                      │
│    │  ◄── 200ms ──►  │ [More time allowed]                 │
│    │                 │                                      │
│    │  Response       │                                      │
│    │◄────────────────│                                      │
│    │                 │                                      │
│                                                             │
│  Benefit:  ECU has more time, fewer timeout errors           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Timing Parameter Management

### Basic Timing Query Workflow

```
  Tester                             ECU
    │                                 │
    │ ① Query Current Timing          │
    │ Request: 83 03                  │
    │────────────────────────────────>│
    │                                 │ [Lookup current parameters]
    │                                 │ [P2=50ms, P2*=5000ms]
    │                                 │
    │ Response: C3 03 01 00 32 13 88  │
    │◄────────────────────────────────│
    │                                 │
    │ ② Decode Values                 │
    │ P2Server:   0x0032 = 50ms        │
    │ P2*Server:  0x1388 = 5000ms      │
    │                                 │
```

### Timing Adjustment Workflow

```
  Tester                             ECU
    │                                 │
    │ ① Set New Timing Values         │
    │ Request: 83 02 01 00 C8 27 10   │
    │         (P2=200ms, P2*=10000ms) │
    │────────────────────────────────>│
    │                                 │ [Validate values]
    │                                 │ [Apply new timing]
    │                                 │ [Update internal timers]
    │                                 │
    │ Response: C3 02                 │
    │◄────────────────────────────────│
    │ ✓ Timing updated                │
    │                                 │
    │ ② Verify New Values             │
    │ Request: 83 03                  │
    │────────────────────────────────>│
    │                                 │
    │ Response: C3 03 01 00 C8 27 10  │
    │◄────────────────────────────────│
    │ ✓ Confirmed:  P2=200ms, P2*=10s  │
    │                                 │
    │ ③ Use New Timing                │
    │ [All subsequent requests now    │
    │  use 200ms/10000ms timeouts]    │
    │                                 │
```

---

## Complete Workflow Examples

### Workflow 1: ECU Flash Programming with Timing Adjustment

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Flash ECU firmware with proper timing           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Read Current Timing     │                      │
│    │ 83 03 ─────────────────────────>│                      │
│    │ C3 03 01 00 32 13 88 ◄──────────│                      │
│    │ (P2=50ms, P2*=5000ms - too low!)│                      │
│    │                                 │                      │
│    │ Step 2: Set Extended Timing     │                      │
│    │ 83 02 01 01 F4 75 30 ──────────>│                      │
│    │ (P2=500ms, P2*=30000ms)         │                      │
│    │ C3 02 ◄─────────────────────────│                      │
│    │ ✓ Extended timing active        │                      │
│    │                                 │                      │
│    │ Step 3: Enter Programming       │                      │
│    │ 10 02 ─────────────────────────>│                      │
│    │ 50 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 4: Unlock Security         │                      │
│    │ 27 01 ─────────────────────────>│                      │
│    │        [Wait up to 500ms]       │                      │
│    │ 67 01 [seed] ◄──────────────────│                      │
│    │ 27 02 [key] ───────────────────>│                      │
│    │ 67 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 5: Request Download        │                      │
│    │ 34 00 44 [addr/size] ──────────>│                      │
│    │                                 │ [Processing...]      │
│    │ 7F 34 78 ◄──────────────────────│ (Response Pending)   │
│    │        [Wait up to 30000ms! ]    │                      │
│    │                                 │ [Still processing...]│
│    │ 74 20 [params] ◄────────────────│ (Finally ready)      │
│    │ ✓ Success!                      │                      │
│    │                                 │                      │
│    │ Step 6: Transfer Data           │                      │
│    │ 36 01 [block1] ────────────────>│                      │
│    │ 7F 36 78 ◄──────────────────────│ (Pending)            │
│    │        [Wait 30000ms max]       │                      │
│    │ 76 01 ◄─────────────────────────│ (Complete)           │
│    │                                 │                      │
│    │ [Continue with more blocks...]   │                      │
│    │                                 │                      │
│    │ Step 7: Exit Transfer           │                      │
│    │ 37 ────────────────────────────>│                      │
│    │ 77 ◄────────────────────────────│                      │
│    │                                 │                      │
│    │ Step 8: Restore Default Timing  │                      │
│    │ 83 02 01 00 32 13 88 ──────────>│                      │
│    │ C3 02 ◄─────────────────────────│                      │
│    │ ✓ Back to normal timing         │                      │
│    │                                 │                      │
│                                                             │
│  WITHOUT Extended Timing:                                   │
│  ⚠️  Download would timeout after 5s                        │
│  ⚠️  Flash operation would fail                             │
│  ⚠️  ECU could become bricked!                               │
│                                                             │
│  WITH Extended Timing (30s):                                │
│  ✓ Download completes successfully                          │
│  ✓ All blocks transferred                                   │
│  ✓ ECU flashed safely                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 2: Adapt to Slow ECU

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: ECU frequently returns NRC 0x78                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Problem Scenario (Without Timing Adjustment):              │
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ 22 F190 (Read VIN) ────────────>│                      │
│    │                    [Wait 50ms]  │                      │
│    │ 7F 22 78 ◄──────────────────────│ (Pending - too slow!)│
│    │            [Wait 5000ms]        │                      │
│    │ 62 F190 [VIN] ◄─────────────────│                      │
│    │                                 │                      │
│    │ 22 F18C (Serial) ───────────────>│                      │
│    │                    [Wait 50ms]  │                      │
│    │ 7F 22 78 ◄──────────────────────│ (Pending again!)     │
│    │            [Wait 5000ms]        │                      │
│    │ 62 F18C [Serial] ◄──────────────│                      │
│    │                                 │                      │
│    │ Every request has 2-step response = SLOW!              │
│    │                                 │                      │
│                                                             │
│  Solution Workflow:                                         │
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1:  Analyze Problem         │                      │
│    │ Issue: P2=50ms too short        │                      │
│    │ ECU needs ~150ms to respond     │                      │
│    │                                 │                      │
│    │ Step 2: Adjust P2 Timing        │                      │
│    │ 83 02 01 00 C8 13 88 ──────────>│                      │
│    │ (P2=200ms, keep P2*=5000ms)     │                      │
│    │ C3 02 ◄─────────────────────────│                      │
│    │ ✓ P2 increased to 200ms         │                      │
│    │                                 │                      │
│    │ Step 3: Retry Operations        │                      │
│    │ 22 F190 (Read VIN) ────────────>│                      │
│    │                [Wait 200ms]     │                      │
│    │ 62 F190 [VIN] ◄─────────────────│ ✓ Direct response!   │
│    │                                 │                      │
│    │ 22 F18C (Serial) ───────────────>│                      │
│    │                [Wait 200ms]     │                      │
│    │ 62 F18C [Serial] ◄──────────────│ ✓ Direct response!   │
│    │                                 │                      │
│    │ 22 F189 (SW Ver) ───────────────>│                      │
│    │                [Wait 200ms]     │                      │
│    │ 62 F189 [Version] ◄─────────────│ ✓ Direct response!    │
│    │                                 │                      │
│                                                             │
│  Result:                                                     │
│  • No more NRC 0x78 "Response Pending"                      │
│  • Faster overall communication (single-step responses)     │
│  • Better user experience                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 3: Production Line Testing Optimization

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Fast ECU testing on production line             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup:  ECU on fast CAN-FD network, minimal processing      │
│         Goal: Test 100 ECUs per hour                        │
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Profile ECU Speed       │                      │
│    │ 22 F186 ───────────────────────>│                      │
│    │         [Measure:  8ms response] │                      │
│    │ 62 F186 01 ◄────────────────────│                      │
│    │                                 │                      │
│    │ 22 F190 ───────────────────────>│                      │
│    │         [Measure: 12ms response]│                      │
│    │ 62 F190 [VIN] ◄─────────────────│                      │
│    │                                 │                      │
│    │ 22 F18C ───────────────────────>│                      │
│    │         [Measure: 10ms response]│                      │
│    │ 62 F18C [Serial] ◄──────────────│                      │
│    │                                 │                      │
│    │ Analysis: Max response = 12ms   │                      │
│    │ Current P2 = 50ms (too long!)   │                      │
│    │                                 │                      │
│    │ Step 2: Optimize Timing         │                      │
│    │ 83 02 01 00 19 03 E8 ──────────>│                      │
│    │ (P2=25ms, P2*=1000ms)           │                      │
│    │ C3 02 ◄─────────────────────────│                      │
│    │ ✓ Optimized for fast ECU        │                      │
│    │                                 │                      │
│    │ Step 3: Run Test Sequence       │                      │
│    │ [Start timer]                   │                      │
│    │                                 │                      │
│    │ 22 F186 → 62 F186 01 (8ms)      │                      │
│    │ 22 F190 → 62 F190 [VIN] (12ms)  │                      │
│    │ 22 F18C → 62 F18C [SN] (10ms)   │                      │
│    │ 22 F189 → 62 F189 [Ver] (11ms)  │                      │
│    │ 19 02 FF → 59 02 [DTCs] (15ms)  │                      │
│    │ 31 01 F010 → 71 01 F010 (20ms)  │                      │
│    │                                 │                      │
│    │ [End timer:  76ms total]         │                      │
│    │                                 │                      │
│                                                             │
│  Comparison:                                                 │
│  ┌────────────────────┬──────────┬──────────┐              │
│  │ Timing Setup       │ Duration │ ECUs/Hr  │              │
│  ├────────────────────┼──────────┼──────────┤              │
│  │ Default (P2=50ms)  │ 300ms    │ 72       │              │
│  │ Optimized (P2=25ms)│ 76ms     │ 284      │              │
│  └────────────────────┴──────────┴──────────┘              │
│                                                             │
│  Benefit: 4x faster testing, higher throughput!              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 4: Tester Present Interval Coordination

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Coordinate timing with Tester Present           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Query P3Server Timeout                             │
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ 83 03 (Read timing) ───────────>│                      │
│    │ C3 03 01 00 32 13 88 ◄──────────│                      │
│    │ Decoded: P2=50ms, P2*=5000ms    │                      │
│    │                                 │                      │
│    │ Note: P3Server typically = P2*Server = 5000ms          │
│    │                                 │                      │
│    │ Step 2: Calculate Safe Tester Present Interval         │
│    │ Formula:  Interval = P3Server / 2                       │
│    │         = 5000ms / 2                                   │
│    │         = 2500ms (2.5 seconds)                         │
│    │                                 │                      │
│    │ Step 3: Enter Extended Session  │                      │
│    │ 10 03 ─────────────────────────>│                      │
│    │ 50 03 ◄─────────────────────────│                      │
│    │                                 │ [P3 timer starts]    │
│    │                                 │                      │
│    │ Step 4: Start Tester Present    │                      │
│    │ [Configure timer:  2500ms]       │                      │
│    │                                 │                      │
│    │ T=2.5s:  3E 80 ─────────────────>│                      │
│    │                                 │ [P3 reset:  5000ms]   │
│    │                                 │                      │
│    │ T=5.0s: 3E 80 ─────────────────>│                      │
│    │                                 │ [P3 reset: 5000ms]   │
│    │                                 │                      │
│    │ T=7.5s: 3E 80 ─────────────────>│                      │
│    │                                 │ [P3 reset: 5000ms]   │
│    │                                 │                      │
│    │ ✓ Session maintained indefinitely│                      │
│    │                                 │                      │
│                                                             │
│  Alternative:  Adjust P3 for Different Needs                 │
│                                                             │
│    │ Scenario:  Need longer idle time │                      │
│    │                                 │                      │
│    │ 83 02 01 00 32 75 30 ──────────>│                      │
│    │ (P2=50ms, P2*=30000ms = P3)     │                      │
│    │ C3 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ New Tester Present Interval:     │                      │
│    │ = 30000ms / 2 = 15000ms (15s)   │                      │
│    │                                 │                      │
│    │ T=15s: 3E 80 ──────────────────>│                      │
│    │                                 │ [P3 reset: 30000ms]  │
│    │                                 │                      │
│    │ Benefit: Less frequent messages,│                      │
│    │          lower bus load         │                      │
│    │                                 │                      │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 5: Multi-ECU Timing Management

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Manage different timing for multiple ECUs       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Setup: Vehicle with 3 ECUs, different capabilities         │
│                                                             │
│  Step 1: Profile Each ECU                                   │
│                                                             │
│  ECU1 (Engine): Fast response, 10ms typical                 │
│  ┌─────────────────────────────────────┐                   │
│  │ 83 03 → C3 03 01 00 32 13 88        │                   │
│  │ (P2=50ms, P2*=5000ms - default)     │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ECU2 (Gateway): Medium, 50ms typical                       │
│  ┌─────────────────────────────────────┐                   │
│  │ 83 03 → C3 03 01 00 64 13 88        │                   │
│  │ (P2=100ms, P2*=5000ms)              │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ECU3 (Body): Slow, 150ms typical                           │
│  ┌─────────────────────────────────────┐                   │
│  │ 83 03 → C3 03 01 00 C8 27 10        │                   │
│  │ (P2=200ms, P2*=10000ms)             │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Step 2: Optimize Each ECU                                  │
│                                                             │
│  ECU1:  Reduce timeout for speed                             │
│  ┌─────────────────────────────────────┐                   │
│  │ 83 02 01 00 19 03 E8                │                   │
│  │ (P2=25ms, P2*=1000ms)               │                   │
│  │ C3 02 ✓                             │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ECU2: Keep default (optimal)                               │
│  ┌─────────────────────────────────────┐                   │
│  │ No change needed                    │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ECU3: Increase timeout to avoid NRC 0x78                   │
│  ┌─────────────────────────────────────┐                   │
│  │ 83 02 01 01 2C 4E 20                │                   │
│  │ (P2=300ms, P2*=20000ms)             │                   │
│  │ C3 02 ✓                             │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Step 3: Execute Multi-ECU Diagnostic                       │
│                                                             │
│  [Tester switches between ECUs with appropriate timing]     │
│                                                             │
│  → ECU1: Fast queries (25ms timeout)                        │
│  → ECU2: Normal queries (100ms timeout)                     │
│  → ECU3: Patient queries (300ms timeout)                    │
│                                                             │
│  Result: Optimal performance across all ECUs                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Timing Setup Before Long Operation

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN: Proactive Timing Adjustment                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Use Before:                                                 │
│  • ECU programming/flashing                                 │
│  • Long routine execution                                   │
│  • Extensive DID reading                                    │
│  • DTC memory operations                                    │
│                                                             │
│  Workflow:                                                  │
│                                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 1. Query Current Timing (83 03)    │                    │
│  │    → Baseline understanding        │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 2. Set Extended Timing (83 02)     │                    │
│  │    → Adequate margins for operation│                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 3. Perform Long Operation          │                    │
│  │    → Executes without timeouts     │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 4. Restore Default Timing (83 02)  │                    │
│  │    → Return to normal operation    │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Dynamic Timing Adaptation

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN:  Adaptive Timing Based on Response               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Monitors response times and adjusts automatically          │
│                                                             │
│  ┌────────────────────────────────────┐                    │
│  │ Send diagnostic request            │                    │
│  │ Measure actual response time       │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ Response time > 80% of P2?          │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│          ┌────┴────┐                                       │
│         YES       NO                                       │
│          │         │                                       │
│          ▼         ▼                                       │
│  ┌─────────────┐  ┌──────────────┐                        │
│  │ Increase P2 │  │ Keep current │                        │
│  │ by 50%      │  │ timing       │                        │
│  │ (83 02)     │  └──────────────┘                        │
│  └─────────────┘                                           │
│                                                             │
│  Example:                                                    │
│  • P2=50ms, response takes 45ms → Too close!                │
│  • Increase P2 to 75ms                                      │
│  • Continue monitoring                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Frequent NRC 0x78 (Response Pending)

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: Every request gets NRC 0x78                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Request:  22 F190                                         │
│ • Response 1: 7F 22 78 (at ~50ms)                          │
│ • Response 2: 62 F190 [data] (at ~150ms)                   │
│ • Every single request has this pattern                    │
│                                                            │
│ Diagnosis:                                                 │
│ • P2Server timeout (50ms) is too short                     │
│ • ECU needs ~150ms to process                              │
│ • ECU sends "pending" because it can't finish in 50ms      │
│                                                            │
│ Solution:                                                    │
│                                                            │
│ Step 1: Measure actual response time                       │
│ → Average: 150ms for most requests                         │
│                                                            │
│ Step 2: Set P2 with safety margin                          │
│ Request: 83 02 01 00 C8 13 88                              │
│         (P2=200ms, keep P2*=5000ms)                        │
│ Response: C3 02                                            │
│                                                            │
│ Step 3: Verify improvement                                 │
│ Request: 22 F190                                           │
│ Response: 62 F190 [data] (at ~150ms)                       │
│ ✓ Direct response, no NRC 0x78!                             │
│                                                            │
│ Result: 2x faster communication (no 2-step responses)      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 2: Timeout During Flash Programming

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: Flash operation times out                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Programming starts successfully                          │
│ • During data transfer (SID 0x36), timeout occurs          │
│ • Error: "ECU not responding"                              │
│ • Flash fails, ECU may be bricked                          │
│                                                            │
│ Root Cause Analysis:                                       │
│                                                            │
│ Request: 36 01 [256 bytes of data]                         │
│                                                            │
│ ECU Process:                                               │
│ 1. Receive data (10ms)                                     │
│ 2. Write to flash memory (8000ms!) ← Very slow!            │
│ 3. Send response                                           │
│                                                            │
│ Problem: P2*=5000ms, but ECU needs 8000ms!                  │
│                                                            │
│ Solution:                                                  │
│                                                            │
│ Before starting flash:                                      │
│                                                            │
│ Step 1: Set very long P2* timeout                          │
│ Request: 83 02 01 01 F4 C3 50                              │
│         (P2=500ms, P2*=50000ms = 50 seconds!)              │
│ Response: C3 02                                            │
│                                                            │
│ Step 2: Now proceed with flash                             │
│ Request: 36 01 [data]                                      │
│ [ECU sends 7F 36 78 at 500ms]                              │
│ [Tester waits up to 50000ms]                               │
│ Response: 76 01 (at ~8000ms)                               │
│ ✓ Success!                                                  │
│                                                            │
│ Key Learning: Always set adequate P2* before flashing!     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 3: Timing Reset After Session Change

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: Timing reverts to default unexpectedly        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Scenario:                                                  │
│                                                            │
│ T=0s:   Set custom timing                                   │
│ Request: 83 02 01 00 C8 27 10                              │
│ Response: C3 02                                            │
│ ✓ P2=200ms, P2*=10000ms active                             │
│                                                            │
│ T=5s:  Enter EXTENDED session                               │
│ Request: 10 03                                             │
│ Response:  50 03                                            │
│                                                            │
│ T=10s: Diagnostic request times out                        │
│ Request: 22 F190                                           │
│ Response: [timeout] ✗                                      │
│                                                            │
│ Root Cause:                                                 │
│ • Session change (10 03) reset timing to defaults          │
│ • Custom timing lost                                       │
│ • Now using P2=50ms again (too short for this ECU)         │
│                                                            │
│ Solution:                                                  │
│                                                            │
│ Pattern: Set timing AFTER session change                   │
│                                                            │
│ Step 1: Enter session                                      │
│ Request: 10 03                                             │
│ Response: 50 03                                            │
│                                                            │
│ Step 2: Immediately set timing                             │
│ Request:  83 02 01 00 C8 27 10                              │
│ Response: C3 02                                            │
│ ✓ Custom timing now active in EXTENDED session             │
│                                                            │
│ Step 3: Proceed with diagnostics                           │
│ Request: 22 F190                                           │
│ Response: 62 F190 [data] ✓                                 │
│                                                            │
│ Best Practice: Re-set timing after every session change!   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Timing Parameter Quick Reference

```
┌────────────┬─────────────┬──────────┬────────────────────┐
│ Parameter  │ Default     │ Typical  │ When to Adjust     │
│            │ (ISO)       │ Range    │                    │
├────────────┼─────────────┼──────────┼────────────────────┤
│ P2Server   │ 50 ms       │ 10-500ms │ • Slow ECU         │
│            │             │          │ • Fast network     │
├────────────┼─────────────┼──────────┼────────────────────┤
│ P2*Server  │ 5000 ms     │ 100-     │ • Flash/program    │
│            │             │ 60000ms  │ • Long routines    │
├────────────┼─────────────┼──────────┼────────────────────┤
│ P3Server   │ 5000 ms     │ 1000-    │ • Long idle time   │
│            │             │ 60000ms  │ • Reduce Tester    │
│            │             │          │   Present frequency│
└────────────┴─────────────┴──────────┴────────────────────┘
```

### Sub-function Summary

```
┌────────┬────────────────────────────┬──────────────────┐
│Sub-fn  │ Name                       │ Use Case         │
├────────┼────────────────────────────┼──────────────────┤
│ 0x01   │ Read Extended Timing Set   │ Query caps       │
│ 0x02   │ Set Timing Parameters      │ Adjust timing    │
│ 0x03   │ Read Current Active Timing │ Verify settings  │
└────────┴────────────────────────────┴──────────────────┘
```

### Common Timing Presets

```
┌──────────────┬────────┬─────────┬──────────────────┐
│ Use Case     │ P2 (ms)│ P2*(ms) │ Command          │
├──────────────┼────────┼─────────┼──────────────────┤
│ Fast ECU     │ 25     │ 1000    │ 83 02 01 00 19   │
│ (production) │        │         │ 03 E8            │
├──────────────┼────────┼─────────┼──────────────────┤
│ Normal       │ 50     │ 5000    │ 83 02 01 00 32   │
│ (default)    │        │         │ 13 88            │
├──────────────┼────────┼─────────┼──────────────────┤
│ Slow ECU     │ 200    │ 10000   │ 83 02 01 00 C8   │
│              │        │         │ 27 10            │
├──────────────┼────────┼─────────┼──────────────────┤
│ Flash/Program│ 500    │ 30000   │ 83 02 01 01 F4   │
│              │        │         │ 75 30            │
├──────────────┼────────┼─────────┼──────────────────┤
│ Very Long Ops│ 500    │ 50000   │ 83 02 01 01 F4   │
│              │        │         │ C3 50            │
└──────────────┴────────┴─────────┴──────────────────┘
```

---

**End of Service Interactions Guide**

For theoretical concepts, see:  `SID_83_ACCESS_TIMING_PARAMETERS.md`  
For implementation details, see: `SID_83_PRACTICAL_IMPLEMENTATION.md`