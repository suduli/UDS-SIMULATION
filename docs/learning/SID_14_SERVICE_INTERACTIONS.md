# SID 0x14 - Service Interactions and Workflows

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

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

### SID 0x14 Dependency Pyramid

```
                    ┌──────────────┐
                    │  SID 0x14    │
                    │  Clear DTC   │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ SID 0x10│      │ SID 0x27│      │ SID 0x3E│
    │ Session │      │ Security│      │ Tester  │
    │ Control │      │ Access  │      │ Present │
    └─────────┘      └─────────┘      └─────────┘
    REQUIRED         CONDITIONAL       OPTIONAL
       │                  │                │
       │                  │                │
    Used to          Used when         Used to
    enter proper     ECU requires      maintain
    diagnostic       unlock for        session
    session          clearing          during long
                                       operations

         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ SID 0x19│      │ SID 0x85│      │ SID 0x28│
    │ Read DTC│      │ Control │      │ Comm    │
    │         │      │ DTC Set │      │ Control │
    └─────────┘      └─────────┘      └─────────┘
    RELATED          RELATED           RELATED
       │                  │                │
       │                  │                │
    Used before/     Used to stop      Used to
    after clear      new DTCs while    manage bus
    to verify        testing           communication
```

### Service Relationship Matrix

```
┌─────────┬──────────┬──────────┬─────────────────────┐
│ Service │ Relation │ Required │ Purpose             │
├─────────┼──────────┼──────────┼─────────────────────┤
│ 0x10    │ Before   │ Yes      │ Enter session       │
│ 0x27    │ Before   │ Maybe    │ Unlock if needed    │
│ 0x3E    │ During   │ No       │ Keep session alive  │
│ 0x19    │ Before   │ No       │ Read current DTCs   │
│ 0x19    │ After    │ No       │ Verify clear worked │
│ 0x85    │ Before   │ No       │ Stop new DTCs       │
│ 0x28    │ Before   │ No       │ Isolate ECU         │
└─────────┴──────────┴──────────┴─────────────────────┘
```

---

## Session Requirements Matrix

### Session Type Support

```
┌───────────────────────┬─────────┬─────────┬──────────┐
│ Session Type          │ SID 0x14│ Group   │ Security │
│                       │ Allowed │ Limits  │ Required │
├───────────────────────┼─────────┼─────────┼──────────┤
│ Default Session       │   ✓     │ Some    │ Varies   │
│ (0x01)                │         │ Restrict│          │
├───────────────────────┼─────────┼─────────┼──────────┤
│ Programming Session   │   ✗     │ N/A     │ N/A      │
│ (0x02)                │         │         │          │
├───────────────────────┼─────────┼─────────┼──────────┤
│ Extended Diagnostic   │   ✓     │ Full    │ Varies   │
│ (0x03)                │         │ Access  │          │
├───────────────────────┼─────────┼─────────┼──────────┤
│ Safety System         │   ✓     │ Limited │ Yes      │
│ (0x04)                │         │         │          │
└───────────────────────┴─────────┴─────────┴──────────┘
```

### Session Transition Flow

```
         ┌──────────────┐
         │  DEFAULT     │
         │  SESSION     │
         │  (0x01)      │
         └──────┬───────┘
                │
                │ 10 03 (Extended)
                │
                ▼
         ┌──────────────┐
         │  EXTENDED    │
         │  SESSION     │
         │  (0x03)      │
         └──────┬───────┘
                │
                │ 14 FF FF FF
                │ (Clear allowed)
                │
                ▼
         ┌──────────────┐
         │  Clear DTCs  │
         │  ✓ Success   │
         └──────┬───────┘
                │
                │ Timeout (5s)
                │ or 10 01
                │
                ▼
         ┌──────────────┐
         │  DEFAULT     │
         │  SESSION     │
         │  (0x01)      │
         └──────────────┘
```

---

## Complete Workflow Examples

### Workflow 1: Basic DTC Clear (No Security)

```
┌──────────────────────────────────────────────────┐
│  WORKFLOW: Simple DTC Clear                      │
│  Prerequisites: No security required             │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 1: Read DTCs        │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 02 P0301 P0420     │
    │  (2 DTCs found)              │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 2: Enter Extended   │ │
    │ └──────────────────────────┘ │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 00 32 01 F4           │
    │  (Extended session active)   │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 3: Clear DTCs       │ │
    │ └──────────────────────────┘ │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  54                          │
    │  (Success!)                  │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 4: Verify Clear     │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 00                 │
    │  (0 DTCs - verified!)        │
    │<─────────────────────────────│
    │                              │

┌──────────────────────────────────────────────────┐
│  RESULT: ✅ DTCs cleared successfully            │
│  Duration: ~200ms                                │
│  DTCs cleared: 2                                 │
└──────────────────────────────────────────────────┘
```

---

### Workflow 2: DTC Clear with Security Access

```
┌──────────────────────────────────────────────────┐
│  WORKFLOW: Secure DTC Clear                      │
│  Prerequisites: Security unlock required         │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 1: Enter Extended   │ │
    │ └──────────────────────────┘ │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 00 32 01 F4           │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 2: Try Clear        │ │
    │ │         (will fail)      │ │
    │ └──────────────────────────┘ │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  7F 14 33                    │
    │  (Security denied 🔒)        │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 3: Request Seed     │ │
    │ └──────────────────────────┘ │
    │  27 01                       │
    │─────────────────────────────>│
    │  67 01 AB CD EF 12           │
    │  (Seed provided)             │
    │<─────────────────────────────│
    │                              │
    │  [Calculate Key]             │
    │  Key = Algorithm(Seed)       │
    │  Key = 12 34 56 78           │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 4: Send Key         │ │
    │ └──────────────────────────┘ │
    │  27 02 12 34 56 78           │
    │─────────────────────────────>│
    │  67 02                       │
    │  (Unlocked! 🔓)              │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 5: Clear DTCs       │ │
    │ └──────────────────────────┘ │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  54                          │
    │  (Success!)                  │
    │<─────────────────────────────│
    │                              │

┌──────────────────────────────────────────────────┐
│  RESULT: ✅ DTCs cleared after unlock            │
│  Duration: ~500ms                                │
│  Security: Required and successful               │
└──────────────────────────────────────────────────┘
```

---

### Workflow 3: Clear Specific DTC Group (Powertrain Only)

```
┌──────────────────────────────────────────────────┐
│  WORKFLOW: Selective Group Clear                 │
│  Goal: Clear only powertrain DTCs                │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 1: Read All DTCs    │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 04                 │
    │  P0301 P0420 C1234 U0100     │
    │  (4 DTCs: 2P, 1C, 1U)        │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Current DTCs:            │ │
    │ │ ✓ P0301 (Powertrain)     │ │
    │ │ ✓ P0420 (Powertrain)     │ │
    │ │ ✓ C1234 (Chassis)        │ │
    │ │ ✓ U0100 (Network)        │ │
    │ └──────────────────────────┘ │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 2: Enter Extended   │ │
    │ └──────────────────────────┘ │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 00 32 01 F4           │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 3: Clear Powertrain │ │
    │ └──────────────────────────┘ │
    │  14 FF FF 00                 │
    │  └───────────┘               │
    │  GroupOfDTC = Powertrain     │
    │─────────────────────────────>│
    │  54                          │
    │  (Success!)                  │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 4: Verify Result    │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 02                 │
    │  C1234 U0100                 │
    │  (2 DTCs remain)             │
    │<─────────────────────────────│
    │                              │

┌──────────────────────────────────────────────────┐
│  BEFORE:                  AFTER:                 │
│  ✓ P0301 (P)              ✗ P0301 (cleared)      │
│  ✓ P0420 (P)              ✗ P0420 (cleared)      │
│  ✓ C1234 (C)              ✓ C1234 (kept)         │
│  ✓ U0100 (U)              ✓ U0100 (kept)         │
│                                                  │
│  RESULT: ✅ Selective clear successful           │
└──────────────────────────────────────────────────┘
```

---

### Workflow 4: Clear with Tester Present (Long Session)

```
┌──────────────────────────────────────────────────┐
│  WORKFLOW: Clear with Session Maintenance        │
│  Scenario: Large clear operation + keep session  │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 00 32 01 F4           │
    │  (P2* = 5000ms)              │
    │<─────────────────────────────│
    │                              │
    │  14 FF FF FF                 │
    │  (Clear request)             │
    │─────────────────────────────>│
    │                              │
    │ t=45ms                       │
    │  7F 14 78 (wait...)          │
    │<─────────────────────────────│
    │                              │
    │      [ECU processing]        │
    │      Clearing 100+ DTCs      │
    │                              │
    │ t=2000ms                     │
    │  3E 80                       │
    │  (Tester Present)            │
    │─────────────────────────────>│
    │  7E 80                       │
    │<─────────────────────────────│
    │                              │
    │ t=4500ms                     │
    │  7F 14 78 (still wait...)    │
    │<─────────────────────────────│
    │                              │
    │      [Still processing]      │
    │                              │
    │ t=4000ms                     │
    │  3E 80                       │
    │  (Tester Present)            │
    │─────────────────────────────>│
    │  7E 80                       │
    │<─────────────────────────────│
    │                              │
    │ t=8200ms                     │
    │  54 (complete!)              │
    │<─────────────────────────────│
    │                              │

┌──────────────────────────────────────────────────┐
│  KEY POINTS:                                     │
│  • Tester Present sent every 2 seconds           │
│  • Prevents session timeout during long clear    │
│  • NRC 0x78 keeps tester informed                │
│  • Total time: 8.2 seconds                       │
└──────────────────────────────────────────────────┘
```

---

### Workflow 5: Clear with DTC Setting Control

```
┌──────────────────────────────────────────────────┐
│  WORKFLOW: Prevent New DTCs During Testing       │
│  Goal: Clear DTCs and prevent new ones           │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 1: Enter Extended   │ │
    │ └──────────────────────────┘ │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 00 32 01 F4           │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 2: Disable DTC      │ │
    │ │         Setting          │ │
    │ └──────────────────────────┘ │
    │  85 02                       │
    │  (Stop storing DTCs)         │
    │─────────────────────────────>│
    │  C5 02                       │
    │  (DTC setting OFF)           │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 3: Clear Existing   │ │
    │ └──────────────────────────┘ │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  54                          │
    │  (Cleared!)                  │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 4: Perform Tests    │ │
    │ │ (faults won't be stored) │ │
    │ └──────────────────────────┘ │
    │                              │
    │  [Testing operations...]     │
    │  • Disconnect sensors        │
    │  • Test components           │
    │  • Verify repairs            │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 5: Re-enable DTC    │ │
    │ └──────────────────────────┘ │
    │  85 01                       │
    │  (Resume storing DTCs)       │
    │─────────────────────────────>│
    │  C5 01                       │
    │  (DTC setting ON)            │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 6: Verify No DTCs   │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 00                 │
    │  (Still 0 DTCs)              │
    │<─────────────────────────────│
    │                              │

┌──────────────────────────────────────────────────┐
│  USE CASE:                                       │
│  • During repair verification                    │
│  • Component testing without storing faults      │
│  • Diagnostic development                        │
│                                                  │
│  RESULT: ✅ Clean testing environment            │
└──────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Complete Diagnostic Cycle

```
┌──────────────────────────────────────────────────┐
│  PATTERN: Full Diagnostic Workflow               │
│  Read → Repair → Clear → Verify                  │
└──────────────────────────────────────────────────┘

    START: Fault Light ON
          │
          ▼
    ┌─────────────────┐
    │ 1. Read DTCs    │
    │    (SID 0x19)   │
    └────────┬────────┘
             │
             │ Found: P0301 (Misfire)
             │
             ▼
    ┌─────────────────┐
    │ 2. Read Freeze  │
    │    Frame Data   │
    │    (SID 0x19)   │
    └────────┬────────┘
             │
             │ Data: RPM=3000, Load=80%
             │
             ▼
    ┌─────────────────┐
    │ 3. Analyze &    │
    │    Diagnose     │
    │ (Technician)    │
    └────────┬────────┘
             │
             │ Root cause: Bad spark plug
             │
             ▼
    ┌─────────────────┐
    │ 4. Perform      │
    │    Repair       │
    │ (Replace plug)  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 5. Clear DTCs   │
    │    (SID 0x14)   │
    └────────┬────────┘
             │
             │ Response: 54 (success)
             │
             ▼
    ┌─────────────────┐
    │ 6. Verify Clear │
    │    (SID 0x19)   │
    └────────┬────────┘
             │
             │ Result: 0 DTCs
             │
             ▼
    ┌─────────────────┐
    │ 7. Test Drive   │
    │    & Monitor    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 8. Re-check DTCs│
    │    (SID 0x19)   │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
    NO DTCs    DTC RETURNS
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ Fault not fixed │
        │    │ Repeat diagnosis│
        │    └─────────────────┘
        │
        ▼
    ┌─────────────────┐
    │ REPAIR COMPLETE │
    │ ✓ Success       │
    └─────────────────┘
```

---

### Pattern 2: Multi-ECU Clear Sequence

```
┌──────────────────────────────────────────────────┐
│  PATTERN: Clear DTCs Across Multiple ECUs        │
│  Use case: After CAN bus repair                  │
└──────────────────────────────────────────────────┘

    START: Bus communication restored
          │
          ▼
    ┌─────────────────┐
    │ FOR EACH ECU:   │
    ├─────────────────┤
    │ • Engine ECU    │
    │ • Transmission  │
    │ • ABS Module    │
    │ • Body Control  │
    │ • Gateway       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │ ECU #1: Engine ECU                  │
    ├─────────────────────────────────────┤
    │  10 03 → 50 03                      │
    │  14 FF FF 33 → 54                   │
    │  (Clear network DTCs)               │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │ ECU #2: Transmission                │
    ├─────────────────────────────────────┤
    │  10 03 → 50 03                      │
    │  14 FF FF 33 → 54                   │
    │  (Clear network DTCs)               │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │ ECU #3: ABS Module                  │
    ├─────────────────────────────────────┤
    │  10 03 → 50 03                      │
    │  14 FF FF 33 → 54                   │
    │  (Clear network DTCs)               │
    └────────┬────────────────────────────┘
             │
             ▼
         (Continue for all ECUs)
             │
             ▼
    ┌─────────────────┐
    │ Verify All ECUs │
    │ (SID 0x19)      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ ALL NETWORK DTCs│
    │ CLEARED ✓       │
    └─────────────────┘

Timing:
  Tester     Engine    Trans     ABS
    │          │         │        │
    │  10 03   │         │        │
    │─────────>│         │        │
    │  50 03   │         │        │
    │<─────────│         │        │
    │  14 FF FF 33       │        │
    │─────────>│         │        │
    │  54      │         │        │
    │<─────────│         │        │
    │                    │        │
    │        10 03       │        │
    │───────────────────>│        │
    │        50 03       │        │
    │<───────────────────│        │
    │        14 FF FF 33 │        │
    │───────────────────>│        │
    │        54          │        │
    │<───────────────────│        │
    │                             │
    │              10 03          │
    │────────────────────────────>│
    │              50 03          │
    │<────────────────────────────│
    │              14 FF FF 33    │
    │────────────────────────────>│
    │              54             │
    │<────────────────────────────│
    │                             │
```

---

### Pattern 3: Clear After Flash Programming

```
┌──────────────────────────────────────────────────┐
│  PATTERN: Post-Flash DTC Management              │
│  Scenario: After ECU software update             │
└──────────────────────────────────────────────────┘

  Tester                          ECU
    │                              │
    │ [Flash programming complete] │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 1: Exit Programming │ │
    │ └──────────────────────────┘ │
    │  10 01                       │
    │  (Return to default)         │
    │─────────────────────────────>│
    │  50 01 ...                   │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 2: Read Flash DTCs  │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 03                 │
    │  (Flash-related DTCs)        │
    │<─────────────────────────────│
    │                              │
    │  Expected DTCs:              │
    │  • Power loss during flash   │
    │  • Programming mode active   │
    │  • Memory write events       │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 3: Enter Extended   │ │
    │ └──────────────────────────┘ │
    │  10 03                       │
    │─────────────────────────────>│
    │  50 03 ...                   │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 4: Clear Flash DTCs │ │
    │ └──────────────────────────┘ │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  54                          │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 5: Verify Cleared   │ │
    │ └──────────────────────────┘ │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 00                 │
    │  (0 DTCs)                    │
    │<─────────────────────────────│
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 6: Perform Adapted  │ │
    │ │         Value Reset      │ │
    │ │ (SID 0x2F or 0x31)       │ │
    │ └──────────────────────────┘ │
    │                              │
    │ ┌──────────────────────────┐ │
    │ │ Step 7: Return to Default│ │
    │ └──────────────────────────┘ │
    │  10 01                       │
    │─────────────────────────────>│
    │  50 01 ...                   │
    │<─────────────────────────────│
    │                              │
    │  FLASH COMPLETE ✓            │
    │                              │
```

---

### Pattern 4: Emission Test Preparation

```
┌──────────────────────────────────────────────────┐
│  PATTERN: OBD-II Emission Test Prep              │
│  Goal: Clear DTCs for emission inspection        │
└──────────────────────────────────────────────────┘

    BEFORE TEST
          │
          ▼
    ┌─────────────────┐
    │ Read Emission   │
    │ DTCs (19 02 00) │
    └────────┬────────┘
             │
             │ Result: P0420 (Catalyst)
             │
             ▼
    ┌─────────────────┐
    │ Read Monitor    │
    │ Status (19 01)  │
    └────────┬────────┘
             │
             │ Monitors: Not ready
             │
             ▼
    ┌─────────────────┐
    │ Repair Fault    │
    │ (Replace cat)   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Clear Emission  │
    │ DTCs ONLY       │
    │ (14 00 00 00)   │
    └────────┬────────┘
             │
             │ Response: 54
             │
             ▼
    ┌─────────────────┐
    │ Perform Drive   │
    │ Cycle           │
    └────────┬────────┘
             │
             │ Purpose: Set monitors ready
             │
             ▼
    ┌─────────────────┐
    │ Check Monitor   │
    │ Readiness       │
    │ (19 01)         │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
    ALL READY  NOT READY
        │         │
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ Continue drive  │
        │    │ cycle           │
        │    └─────────────────┘
        │
        ▼
    ┌─────────────────┐
    │ Re-check DTCs   │
    │ (19 02 00)      │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
    NO DTCs   DTC PRESENT
        │         │
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ NOT READY       │
        │    │ FOR TEST        │
        │    └─────────────────┘
        │
        ▼
    ┌─────────────────┐
    │ READY FOR       │
    │ EMISSION TEST ✓ │
    └─────────────────┘

Important Notes:
┌────────────────────────────────────────┐
│ ⚠️ WARNING:                            │
│ • Permanent DTCs NOT cleared by 0x14   │
│ • Drive cycle required to clear        │
│ • Emission monitors must complete      │
│ • Test will fail if not ready          │
└────────────────────────────────────────┘
```

---

### Pattern 5: Production End-of-Line (EOL)

```
┌──────────────────────────────────────────────────┐
│  PATTERN: Factory EOL Testing                    │
│  Clear DTCs after manufacturing tests            │
└──────────────────────────────────────────────────┘

    VEHICLE BUILD COMPLETE
          │
          ▼
    ┌─────────────────┐
    │ Run EOL Tests   │
    ├─────────────────┤
    │ • Actuator test │
    │ • Sensor check  │
    │ • Network verify│
    │ • Calibration   │
    └────────┬────────┘
             │
             │ Tests generate DTCs
             │
             ▼
    ┌─────────────────┐
    │ Read All DTCs   │
    │ (19 02 AF)      │
    └────────┬────────┘
             │
             │ Result: Test DTCs present
             │
             ▼
    ┌─────────────────┐
    │ Verify Expected │
    │ DTCs Only       │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
    EXPECTED  UNEXPECTED
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ EOL TEST FAIL   │
        │    │ Investigate     │
        │    └─────────────────┘
        │
        ▼
    ┌─────────────────┐
    │ For Each ECU:   │
    │ • Engine        │
    │ • Trans         │
    │ • ABS           │
    │ • BCM           │
    │ • HVAC          │
    │ • etc.          │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ 10 03 (Extended)│
    │ 14 FF FF FF     │
    │ 10 01 (Default) │
    └────────┬────────┘
             │
             │ Repeat for all ECUs
             │
             ▼
    ┌─────────────────┐
    │ Final Verify    │
    │ All ECUs        │
    │ (19 02 AF)      │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
    NO DTCs   DTCs FOUND
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ EOL FAIL        │
        │    │ Re-clear/debug  │
        │    └─────────────────┘
        │
        ▼
    ┌─────────────────┐
    │ Set Production  │
    │ Flags           │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ VEHICLE READY   │
    │ FOR DELIVERY ✓  │
    └─────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Clear Succeeds But DTCs Return

```
┌──────────────────────────────────────────────────┐
│  PROBLEM: DTCs cleared but immediately return    │
└──────────────────────────────────────────────────┘

Symptom:
  14 FF FF FF → 54 (success)
  19 02 AF → 59 02 AF 00 (0 DTCs)
  [Wait 5 seconds]
  19 02 AF → 59 02 AF 01 (DTC back!)

Root Causes:
┌────────────────────────────────────────────────┐
│ 1. Active Fault Still Present                 │
├────────────────────────────────────────────────┤
│    Sensor disconnected                         │
│    Wire short/open                             │
│    Component failure                           │
│                                                │
│    Solution:                                   │
│    ✅ Repair actual fault first                │
│    ✅ Verify fault resolved before clear       │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 2. Diagnostic Routine Running                 │
├────────────────────────────────────────────────┤
│    Monitor immediately detects fault           │
│    Test cycle re-runs after clear              │
│                                                │
│    Solution:                                   │
│    ✅ Disable DTC setting (SID 0x85)           │
│    ✅ Complete repairs before enabling         │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 3. Permanent DTC (OBD-II)                      │
├────────────────────────────────────────────────┤
│    Emission-related permanent DTC              │
│    Cannot clear until drive cycle complete     │
│                                                │
│    Solution:                                   │
│    ✅ Repair fault                             │
│    ✅ Complete 3 consecutive good drive cycles │
│    ✅ Permanent DTC auto-clears                │
└────────────────────────────────────────────────┘

Diagnostic Flow:
       DTC Returns After Clear
                │
                ▼
        ┌──────────────┐
        │ Read DTC     │
        │ Status       │
        └──────┬───────┘
               │
          ┌────┴────┐
          │         │
     TEST FAILED  CONFIRMED
          │         │
          ▼         ▼
    ┌─────────┐ ┌─────────┐
    │ Active  │ │Permanent│
    │ Fault   │ │ DTC     │
    └─────────┘ └─────────┘
          │         │
          ▼         ▼
    ┌─────────┐ ┌─────────┐
    │ Repair  │ │ Drive   │
    │ Now     │ │ Cycle   │
    └─────────┘ └─────────┘
```

---

### Scenario 2: Security Access Keeps Failing

```
┌──────────────────────────────────────────────────┐
│  PROBLEM: Always get NRC 0x33                    │
└──────────────────────────────────────────────────┘

Symptom:
  14 FF FF FF → 7F 14 33 (every time)

Diagnostic Steps:
┌────────────────────────────────────────────────┐
│ Step 1: Verify ECU requires security          │
├────────────────────────────────────────────────┤
│ Check: ECU documentation                       │
│ Try: Different session                         │
│ Test: Different GroupOfDTC                     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Step 2: Attempt security unlock                │
├────────────────────────────────────────────────┤
│ 27 01 → 67 01 [seed]                           │
│ Calculate key from seed                        │
│ 27 02 [key] → 67 02 or 7F 27 35?              │
│                                                │
│ If 7F 27 35 (invalid key):                     │
│ ✅ Check key algorithm                         │
│ ✅ Verify seed-to-key calculation              │
│ ✅ Check security level                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Step 3: Check security attempts                │
├────────────────────────────────────────────────┤
│ After 3 failed attempts:                       │
│ • ECU locks out (NRC 0x36)                     │
│ • Must wait delay period                       │
│ • Or cycle power                               │
│                                                │
│ Solution:                                      │
│ ✅ Wait 10 minutes                             │
│ ✅ Or power cycle ECU                          │
│ ✅ Use correct key algorithm                   │
└────────────────────────────────────────────────┘

Visual Decision Tree:
        NRC 0x33 Received
                │
                ▼
        ┌──────────────┐
        │ Try Unlock   │
        │ (SID 0x27)   │
        └──────┬───────┘
               │
          ┌────┴────┐
          │         │
      SUCCESS    FAIL (NRC 0x35)
          │         │
          │         ▼
          │    ┌──────────────┐
          │    │ Check Key    │
          │    │ Algorithm    │
          │    └──────┬───────┘
          │           │
          │      ┌────┴────┐
          │      │         │
          │   CORRECT   WRONG
          │      │         │
          │      │         ▼
          │      │    ┌──────────────┐
          │      │    │ Fix Algorithm│
          │      │    └──────────────┘
          │      │
          │      ▼
          │ ┌──────────────┐
          │ │ Lockout?     │
          │ │ (NRC 0x36)   │
          │ └──────┬───────┘
          │        │
          │   ┌────┴────┐
          │   │         │
          │  YES        NO
          │   │         │
          │   ▼         │
          │ ┌────────┐  │
          │ │ Wait   │  │
          │ │ 10 min │  │
          │ └────────┘  │
          │   │         │
          └───┴─────────┘
              │
              ▼
        ┌──────────────┐
        │ Retry Clear  │
        │ (SID 0x14)   │
        └──────────────┘
```

---

### Scenario 3: NRC 0x22 - Unknown Condition

```
┌──────────────────────────────────────────────────┐
│  PROBLEM: NRC 0x22 but all conditions seem OK    │
└──────────────────────────────────────────────────┘

Symptom:
  Vehicle stopped ✓
  Ignition ON ✓
  No active faults ✓
  14 FF FF FF → 7F 14 22 (why?)

Hidden Conditions Checklist:
┌────────────────────────────────────────────────┐
│ □ Transmission in Park/Neutral?               │
│ □ Engine OFF (for some ECUs)?                 │
│ □ Parking brake applied?                      │
│ □ All doors closed?                           │
│ □ Hood closed?                                │
│ □ Battery voltage >= 11V?                     │
│ □ ECU not in programming mode?                │
│ □ No active CAN communication errors?         │
│ □ Throttle at idle position?                  │
│ □ Brake pedal not pressed?                    │
│ □ Clutch pedal not pressed (manual)?          │
│ □ Temperature within range?                   │
│ □ System voltage stable (no spikes)?          │
│ □ No security alarm active?                   │
│ □ No immobilizer active?                      │
└────────────────────────────────────────────────┘

Debugging Process:
    NRC 0x22 Received
          │
          ▼
    ┌─────────────────┐
    │ Read DTC Status │
    │ for each fault  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Any status bit  │
    │ 0 (testFailed)? │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
       YES        NO
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ Check vehicle   │
        │    │ signals via     │
        │    │ SID 0x22        │
        │    └────────┬────────┘
        │             │
        │             ▼
        │    ┌─────────────────┐
        │    │ Read:           │
        │    │ • Vehicle speed │
        │    │ • Engine RPM    │
        │    │ • Gear position │
        │    │ • Brake status  │
        │    │ • etc.          │
        │    └────────┬────────┘
        │             │
        ▼             ▼
    ┌─────────────────┐
    │ Repair active   │
    │ fault first     │
    └─────────────────┘

Solution Path:
┌────────────────────────────────────────────────┐
│ 1. Use SID 0x22 to read current data          │
│    └─ Read all relevant sensor values         │
│                                                │
│ 2. Check ECU-specific requirements             │
│    └─ Consult service manual                  │
│                                                │
│ 3. Monitor conditions while attempting clear   │
│    └─ Use data logging                        │
│                                                │
│ 4. Try different sessions                      │
│    └─ Default vs Extended                     │
└────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Service ID Quick Reference

```
┌────────┬─────────────────────────┬──────────────┐
│  SID   │  Service Name           │  Use with    │
│        │                         │  0x14        │
├────────┼─────────────────────────┼──────────────┤
│  0x10  │ Session Control         │ Before       │
│  0x11  │ ECU Reset               │ After        │
│  0x14  │ Clear DTC               │ -            │
│  0x19  │ Read DTC Information    │ Before/After │
│  0x22  │ Read Data By ID         │ Check cond.  │
│  0x27  │ Security Access         │ Before       │
│  0x28  │ Communication Control   │ Before       │
│  0x2E  │ Write Data By ID        │ After        │
│  0x2F  │ Input/Output Control    │ During test  │
│  0x31  │ Routine Control         │ After        │
│  0x3E  │ Tester Present          │ During       │
│  0x85  │ Control DTC Setting     │ Before       │
└────────┴─────────────────────────┴──────────────┘
```

### GroupOfDTC Values Reference

```
┌──────────────┬─────────────────────────────────┐
│  Value       │  Description                    │
├──────────────┼─────────────────────────────────┤
│  0xFFFFFF    │  All DTCs (most common)         │
│  0x000000    │  Emissions-related (OBD-II)     │
│  0xFFFF00    │  All powertrain (P-codes)       │
│  0xFFFF33    │  All network communication      │
│  0xFFFF40    │  All chassis (C-codes)          │
│  0xFFFF80    │  All body (B-codes)             │
│  0xFFFFC0    │  All network (U-codes)          │
│  0xPXXXXX    │  Specific DTC (P-code)          │
│  0xCXXXXX    │  Specific DTC (C-code)          │
│  0xBXXXXX    │  Specific DTC (B-code)          │
│  0xUXXXXX    │  Specific DTC (U-code)          │
└──────────────┴─────────────────────────────────┘
```

### NRC Quick Lookup

```
┌────────┬─────────────────┬──────────────────────┐
│  NRC   │  Name           │  Quick Fix           │
├────────┼─────────────────┼──────────────────────┤
│  0x13  │ Bad Length      │ Send exactly 4 bytes │
│  0x22  │ Conditions      │ Check vehicle state  │
│  0x31  │ Out of Range    │ Use valid group code │
│  0x33  │ Security Denied │ Unlock with SID 0x27 │
│  0x72  │ Program Failure │ Check battery/memory │
│  0x78  │ Response Pending│ Wait (not an error)  │
│  0x7F  │ Not Supported   │ Change session       │
└────────┴─────────────────┴──────────────────────┘
```

### Timing Parameters

```
┌──────────────┬─────────┬──────────────────────┐
│  Parameter   │  Value  │  Description         │
├──────────────┼─────────┼──────────────────────┤
│  P2 (max)    │  50ms   │  Normal response     │
│  P2* (max)   │  5000ms │  With NRC 0x78       │
│  Clear time  │  Varies │  Based on DTC count  │
│  • Small     │  50ms   │  < 10 DTCs           │
│  • Medium    │  500ms  │  10-50 DTCs          │
│  • Large     │  5000ms │  50+ DTCs            │
│  Retry delay │  50ms   │  Between write tries │
└──────────────┴─────────┴──────────────────────┘
```

---

**End of Document**
