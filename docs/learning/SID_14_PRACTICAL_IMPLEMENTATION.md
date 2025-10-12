# SID 0x14 - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## 📋 Table of Contents

1. [Request Processing Flow](#request-processing-flow)
2. [State Machine Diagrams](#state-machine-diagrams)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [Memory Management Workflows](#memory-management-workflows)
5. [Testing Scenarios](#testing-scenarios)
6. [Debugging Guide](#debugging-guide)
7. [Best Practices](#best-practices)

---

## Request Processing Flow

### Complete Processing Flowchart

```
                        START
                          │
                          ▼
                ┌─────────────────┐
                │ Receive Request │
                │   (4 bytes)     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
           ┌────┤ Length = 4?     │────┐
           │    └─────────────────┘    │
          YES                          NO
           │                            │
           ▼                            ▼
    ┌─────────────┐            ┌──────────────┐
    │ Parse       │            │ Return NRC   │
    │ GroupOfDTC  │            │ 0x13         │
    └──────┬──────┘            └──────────────┘
           │                            │
           ▼                            │
    ┌─────────────────┐                │
    │ Validate        │                │
    │ GroupOfDTC      │                │
    └────────┬────────┘                │
             │                         │
        ┌────┴────┐                    │
        │         │                    │
      VALID    INVALID                 │
        │         │                    │
        │         ▼                    │
        │  ┌──────────────┐            │
        │  │ Return NRC   │            │
        │  │ 0x31         │            │
        │  └──────────────┘            │
        │         │                    │
        ▼         │                    │
    ┌─────────────────┐                │
    │ Check Session   │                │
    └────────┬────────┘                │
             │                         │
        ┌────┴────┐                    │
        │         │                    │
    ALLOWED   NOT ALLOWED              │
        │         │                    │
        │         ▼                    │
        │  ┌──────────────┐            │
        │  │ Return NRC   │            │
        │  │ 0x7F         │            │
        │  └──────────────┘            │
        │         │                    │
        ▼         │                    │
    ┌─────────────────┐                │
    │ Check Security  │                │
    └────────┬────────┘                │
             │                         │
        ┌────┴────┐                    │
        │         │                    │
    UNLOCKED   LOCKED                  │
        │         │                    │
        │         ▼                    │
        │  ┌──────────────┐            │
        │  │ Return NRC   │            │
        │  │ 0x33         │            │
        │  └──────────────┘            │
        │         │                    │
        ▼         │                    │
    ┌─────────────────┐                │
    │ Check           │                │
    │ Conditions      │                │
    └────────┬────────┘                │
             │                         │
        ┌────┴────┐                    │
        │         │                    │
       OK     NOT OK                   │
        │         │                    │
        │         ▼                    │
        │  ┌──────────────┐            │
        │  │ Return NRC   │            │
        │  │ 0x22         │            │
        │  └──────────────┘            │
        │         │                    │
        ▼         │                    │
    ┌─────────────────┐                │
    │ Send NRC 0x78   │                │
    │ (Processing)    │                │
    └────────┬────────┘                │
             │                         │
             ▼                         │
    ┌─────────────────┐                │
    │ Clear DTCs      │                │
    │ from Memory     │                │
    └────────┬────────┘                │
             │                         │
        ┌────┴────┐                    │
        │         │                    │
    SUCCESS   FAILURE                  │
        │         │                    │
        │         ▼                    │
        │  ┌──────────────┐            │
        │  │ Return NRC   │            │
        │  │ 0x72         │            │
        │  └──────────────┘            │
        │         │                    │
        ▼         └────────────────────┘
    ┌─────────────────┐                │
    │ Send Positive   │                │
    │ Response (0x54) │                │
    └────────┬────────┘                │
             │                         │
             ▼                         │
           END  ◄───────────────────────┘
```

---

## State Machine Diagrams

### ECU State Transitions During Clear Operation

```
┌─────────────────────────────────────────────────────┐
│  STATE MACHINE: SID 0x14 PROCESSING                 │
└─────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   IDLE       │
    │   STATE      │
    └───────┬──────┘
            │
            │ Request Received (0x14)
            │
            ▼
    ┌──────────────┐
    │ VALIDATION   │
    │   STATE      │
    └───────┬──────┘
            │
            │ ┌─────────────────┐
            │ │ Checks:         │
            │ │ • Length        │
            │ │ • GroupOfDTC    │
            │ │ • Session       │
            │ │ • Security      │
            │ │ • Conditions    │
            │ └─────────────────┘
            │
       ┌────┴────┐
       │         │
   PASS        FAIL
       │         │
       │         ▼
       │    ┌──────────────┐
       │    │   ERROR      │
       │    │   STATE      │
       │    └───────┬──────┘
       │            │
       │            │ Send NRC
       │            │
       │            ▼
       │       ┌──────────────┐
       │       │   IDLE       │
       │       │   STATE      │
       │       └──────────────┘
       │
       ▼
    ┌──────────────┐
    │ PROCESSING   │
    │   STATE      │
    └───────┬──────┘
            │
            │ Send NRC 0x78 (pending)
            │
            ▼
    ┌──────────────┐
    │ CLEARING     │
    │   STATE      │
    └───────┬──────┘
            │
            │ ┌─────────────────┐
            │ │ Actions:        │
            │ │ • Erase DTCs    │
            │ │ • Clear frames  │
            │ │ • Reset counters│
            │ │ • Write EEPROM  │
            │ └─────────────────┘
            │
       ┌────┴────┐
       │         │
   SUCCESS    FAILURE
       │         │
       │         ▼
       │    ┌──────────────┐
       │    │   FAILURE    │
       │    │   STATE      │
       │    └───────┬──────┘
       │            │
       │            │ Send NRC 0x72
       │            │
       │            ▼
       │       ┌──────────────┐
       │       │   IDLE       │
       │       │   STATE      │
       │       └──────────────┘
       │
       ▼
    ┌──────────────┐
    │  COMPLETE    │
    │   STATE      │
    └───────┬──────┘
            │
            │ Send 0x54 (success)
            │
            ▼
    ┌──────────────┐
    │   IDLE       │
    │   STATE      │
    └──────────────┘
```

### Session State Impact

```
┌──────────────────────────────────────────────────┐
│  SESSION STATE BEHAVIOR                          │
└──────────────────────────────────────────────────┘

DEFAULT SESSION (0x01)
    │
    │ SID 0x14 Request
    │
    ▼
┌─────────────────┐
│ Check Group     │
│ Restrictions    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
ALLOWED   RESTRICTED
    │         │
    │         ▼
    │    ┌──────────────┐
    │    │ Return NRC   │
    │    │ (varies)     │
    │    └──────────────┘
    │
    ▼
┌──────────────┐
│ Process      │
│ Clear        │
└──────────────┘


EXTENDED SESSION (0x03)
    │
    │ SID 0x14 Request
    │
    ▼
┌─────────────────┐
│ Full Access     │
│ All Groups      │
└────────┬────────┘
         │
         ▼
    ┌──────────────┐
    │ Process      │
    │ Clear        │
    └──────────────┘


PROGRAMMING SESSION (0x02)
    │
    │ SID 0x14 Request
    │
    ▼
┌─────────────────┐
│ Typically       │
│ Not Allowed     │
└────────┬────────┘
         │
         ▼
    ┌──────────────┐
    │ Return NRC   │
    │ 0x7F         │
    └──────────────┘
```

### Security State Impact

```
┌──────────────────────────────────────────────────┐
│  SECURITY STATE TRANSITIONS                      │
└──────────────────────────────────────────────────┘

    ┌──────────────┐
    │  LOCKED      │
    │  STATE 🔒    │
    └───────┬──────┘
            │
            │ SID 0x14 (protected group)
            │
            ▼
       ┌──────────────┐
       │ Return NRC   │
       │ 0x33         │
       └──────────────┘


    ┌──────────────┐
    │  LOCKED      │
    │  STATE 🔒    │
    └───────┬──────┘
            │
            │ SID 0x27 (unlock)
            │
            ▼
    ┌──────────────┐
    │  UNLOCKED    │
    │  STATE 🔓    │
    └───────┬──────┘
            │
            │ SID 0x14 (any group)
            │
            ▼
       ┌──────────────┐
       │ Process      │
       │ Clear ✓      │
       └──────────────┘
```

---

## NRC Decision Trees

### Master NRC Decision Tree

```
                    SID 0x14 REQUEST
                          │
                          ▼
                ┌──────────────────┐
           ┌────┤ Message Length   │────┐
           │    │    = 4 bytes?    │    │
           │    └──────────────────┘    │
          YES                           NO
           │                             │
           │                             ▼
           │                    ┌──────────────────┐
           │                    │ NRC 0x13         │
           │                    │ Incorrect        │
           │                    │ Message Length   │
           │                    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ GroupOfDTC       │────┐
    │ Valid?           │    │
    └──────────────────┘    │
           │               NO
          YES               │
           │                ▼
           │       ┌──────────────────┐
           │       │ NRC 0x31         │
           │       │ Request Out      │
           │       │ Of Range         │
           │       └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Session          │────┐
    │ Allows Service?  │    │
    └──────────────────┘    │
           │               NO
          YES               │
           │                ▼
           │       ┌──────────────────┐
           │       │ NRC 0x7F         │
           │       │ Service Not      │
           │       │ Supported        │
           │       └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Security         │────┐
    │ Unlocked?        │    │
    └──────────────────┘    │
           │               NO
          YES               │
           │                ▼
           │       ┌──────────────────┐
           │       │ NRC 0x33         │
           │       │ Security Access  │
           │       │ Denied           │
           │       └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Conditions       │────┐
    │ Correct?         │    │
    └──────────────────┘    │
           │               NO
          YES               │
           │                ▼
           │       ┌──────────────────┐
           │       │ NRC 0x22         │
           │       │ Conditions Not   │
           │       │ Correct          │
           │       └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Send NRC 0x78    │
    │ (Processing)     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Clear Memory     │────┐
    │ Successful?      │    │
    └──────────────────┘    │
             │           FAILURE
           SUCCESS           │
             │               ▼
             │      ┌──────────────────┐
             │      │ NRC 0x72         │
             │      │ General          │
             │      │ Programming      │
             │      │ Failure          │
             │      └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Positive         │
    │ Response 0x54    │
    └──────────────────┘
```

### Conditions Check Decision Tree

```
            CONDITIONS CHECK
                  │
                  ▼
        ┌──────────────────┐
    ┌───┤ Vehicle Speed    │───┐
    │   │    = 0 km/h?     │   │
    │   └──────────────────┘   │
   YES                         NO
    │                           │
    │                           ▼
    │                  ┌──────────────────┐
    │                  │ NRC 0x22         │
    │                  │ (Vehicle must    │
    │                  │  be stationary)  │
    │                  └──────────────────┘
    │
    ▼
┌──────────────────┐
│ Ignition State   │───┐
│   = ON/ACC?      │   │
└──────────────────┘   │
    │                 NO
   YES                 │
    │                  ▼
    │         ┌──────────────────┐
    │         │ NRC 0x22         │
    │         │ (Ignition must   │
    │         │  be ON)          │
    │         └──────────────────┘
    │
    ▼
┌──────────────────┐
│ Active Faults?   │───┐
│                  │   │
└──────────────────┘   │
    │                YES
    NO                 │
    │                  ▼
    │         ┌──────────────────┐
    │         │ NRC 0x22         │
    │         │ (Repair fault    │
    │         │  first)          │
    │         └──────────────────┘
    │
    ▼
┌──────────────────┐
│ Battery Voltage  │───┐
│    >= 11V?       │   │
└──────────────────┘   │
    │                 NO
   YES                 │
    │                  ▼
    │         ┌──────────────────┐
    │         │ NRC 0x22         │
    │         │ (Voltage too     │
    │         │  low)            │
    │         └──────────────────┘
    │
    ▼
┌──────────────────┐
│ ECU State        │───┐
│  = Normal?       │   │
└──────────────────┘   │
    │                 NO
   YES                 │
    │                  ▼
    │         ┌──────────────────┐
    │         │ NRC 0x22         │
    │         │ (ECU busy/       │
    │         │  flashing)       │
    │         └──────────────────┘
    │
    ▼
┌──────────────────┐
│ ALL CONDITIONS   │
│ MET ✓            │
│ PROCEED          │
└──────────────────┘
```

---

## Memory Management Workflows

### EEPROM Clear Operation

```
┌──────────────────────────────────────────────────┐
│  EEPROM CLEAR WORKFLOW                           │
└──────────────────────────────────────────────────┘

    START
      │
      ▼
┌─────────────────┐
│ Calculate       │
│ Memory Address  │
│ Range           │
└────────┬────────┘
         │
         │ Based on GroupOfDTC
         │
         ▼
    ┌─────────────────┐
    │ Determine       │
    │ DTCs to Clear   │
    └────────┬────────┘
             │
             ▼
        ┌─────────────────┐
        │ FOR EACH DTC:   │
        ├─────────────────┤
        │ 1. DTC Code     │
        │ 2. Status Byte  │
        │ 3. Freeze Frame │
        │ 4. Extended Data│
        │ 5. Counters     │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Lock Memory     │
        │ (prevent writes)│
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Erase DTC Entry │
        │ (write 0xFF)    │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Clear Status    │
        │ (write 0x00)    │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Clear Freeze    │
        │ Frame Data      │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Clear Extended  │
        │ Data Records    │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Reset Counters  │
        │ (aging, occur.) │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Verify Erase    │
        │ (read back)     │
        └────────┬────────┘
                 │
            ┌────┴────┐
            │         │
        VERIFIED   FAILED
            │         │
            │         ▼
            │    ┌─────────────────┐
            │    │ Retry Erase     │
            │    │ (up to 3 times) │
            │    └────────┬────────┘
            │             │
            │        ┌────┴────┐
            │        │         │
            │     SUCCESS   FAILURE
            │        │         │
            │        │         ▼
            │        │    ┌─────────────────┐
            │        │    │ Report Error    │
            │        │    │ NRC 0x72        │
            │        │    └─────────────────┘
            │        │
            ▼        ▼
        ┌─────────────────┐
        │ Unlock Memory   │
        └────────┬────────┘
                 │
                 ▼
               END
```

### Memory Map Example

```
┌──────────────────────────────────────────────────┐
│  ECU EEPROM MEMORY LAYOUT                        │
└──────────────────────────────────────────────────┘

EEPROM Address Range: 0x0000 - 0xFFFF

┌────────────────────────────────────────┐
│ 0x0000 - 0x00FF: Configuration Data    │ ← NOT cleared
│                  (Protected)           │
├────────────────────────────────────────┤
│ 0x0100 - 0x01FF: Security Keys         │ ← NOT cleared
│                  (Protected)           │
├────────────────────────────────────────┤
│ 0x0200 - 0x05FF: DTC Storage           │ ← CLEARED by 0x14
│  ├─ 0x0200: DTC Count                  │
│  ├─ 0x0201: DTC #1 (High)              │
│  ├─ 0x0202: DTC #1 (Mid)               │
│  ├─ 0x0203: DTC #1 (Low)               │
│  ├─ 0x0204: DTC #1 Status              │
│  ├─ 0x0205: DTC #1 Occurrence Count    │
│  ├─ 0x0206: DTC #1 Aging Counter       │
│  └─ ... (repeat for each DTC slot)     │
├────────────────────────────────────────┤
│ 0x0600 - 0x0BFF: Freeze Frame Data     │ ← CLEARED by 0x14
│  ├─ Frame #1: DTC + Snapshot           │
│  ├─ Frame #2: DTC + Snapshot           │
│  └─ ... (up to 10 frames)              │
├────────────────────────────────────────┤
│ 0x0C00 - 0x0FFF: Extended Data Records │ ← CLEARED by 0x14
│  ├─ Record #1: Additional fault info   │
│  └─ ... (varies by DTC)                │
├────────────────────────────────────────┤
│ 0x1000 - 0x1FFF: Learned Values        │ ← NOT cleared
│                  (Adaptations)         │
├────────────────────────────────────────┤
│ 0x2000 - 0xFFFF: Other Data            │ ← NOT cleared
└────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Scenario 1: Basic Clear All DTCs

```
┌──────────────────────────────────────────────────┐
│  TEST CASE: Clear All DTCs                       │
├──────────────────────────────────────────────────┤
│  Preconditions:                                  │
│  • Default or Extended session active            │
│  • Multiple DTCs present (P0301, P0420, C1234)   │
│  • Vehicle stationary, ignition ON               │
│  • No active faults                              │
└──────────────────────────────────────────────────┘

Test Steps:
┌────┬──────────────────────────┬──────────────────┐
│ #  │ Action                   │ Expected Result  │
├────┼──────────────────────────┼──────────────────┤
│ 1  │ Read DTCs (19 02 AF)     │ 3 DTCs present   │
│ 2  │ Clear DTCs (14 FF FF FF) │ 54 (success)     │
│ 3  │ Read DTCs (19 02 AF)     │ 0 DTCs present   │
│ 4  │ Check freeze frames      │ All cleared      │
│ 5  │ Check counters           │ All reset to 0   │
└────┴──────────────────────────┴──────────────────┘

Sequence Diagram:
  Tester                          ECU
    │                              │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 03 P0301 ...       │
    │<─────────────────────────────│
    │                              │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │  54                          │
    │<─────────────────────────────│
    │                              │
    │  19 02 AF                    │
    │─────────────────────────────>│
    │  59 02 AF 00                 │
    │  (0 DTCs)                    │
    │<─────────────────────────────│
    │                              │

Result: ✅ PASS
```

### Test Scenario 2: Clear Specific DTC Group

```
┌──────────────────────────────────────────────────┐
│  TEST CASE: Clear Powertrain DTCs Only           │
├──────────────────────────────────────────────────┤
│  Preconditions:                                  │
│  • Extended session (10 03)                      │
│  • Mixed DTCs: P0301, P0420, C1234, U0100        │
│  • Vehicle conditions correct                    │
└──────────────────────────────────────────────────┘

Test Steps:
┌────┬──────────────────────────┬──────────────────┐
│ #  │ Action                   │ Expected Result  │
├────┼──────────────────────────┼──────────────────┤
│ 1  │ Read all DTCs            │ 4 DTCs (P,P,C,U) │
│ 2  │ Clear powertrain         │ 54 (success)     │
│    │ (14 FF FF 00)            │                  │
│ 3  │ Read all DTCs            │ 2 DTCs (C,U)     │
│ 4  │ Verify P-codes gone      │ 0 P-codes        │
│ 5  │ Verify C,U codes remain  │ C1234, U0100 ✓   │
└────┴──────────────────────────┴──────────────────┘

Visual Result:
BEFORE Clear:
┌────────────────────────────┐
│ DTCs Present:              │
│ ✓ P0301 (Powertrain)       │
│ ✓ P0420 (Powertrain)       │
│ ✓ C1234 (Chassis)          │
│ ✓ U0100 (Network)          │
└────────────────────────────┘

Request: 14 FF FF 00
         └───────────┘
         Powertrain group

AFTER Clear:
┌────────────────────────────┐
│ DTCs Present:              │
│ ✗ P0301 (cleared)          │
│ ✗ P0420 (cleared)          │
│ ✓ C1234 (Chassis)          │
│ ✓ U0100 (Network)          │
└────────────────────────────┘

Result: ✅ PASS
```

### Test Scenario 3: Security Access Required

```
┌──────────────────────────────────────────────────┐
│  TEST CASE: Clear DTCs with Security             │
├──────────────────────────────────────────────────┤
│  Preconditions:                                  │
│  • Extended session                              │
│  • ECU requires security for clear               │
│  • DTCs present                                  │
│  • ECU initially locked 🔒                       │
└──────────────────────────────────────────────────┘

Test Steps:
┌────┬──────────────────────────┬──────────────────┐
│ #  │ Action                   │ Expected Result  │
├────┼──────────────────────────┼──────────────────┤
│ 1  │ Try clear (locked)       │ 7F 14 33         │
│ 2  │ Request seed (27 01)     │ 67 01 [seed]     │
│ 3  │ Send key (27 02 [key])   │ 67 02 (unlock)   │
│ 4  │ Clear DTCs (14 FF FF FF) │ 54 (success)     │
└────┴──────────────────────────┴──────────────────┘

Sequence Diagram:
  Tester                          ECU
    │                              │
    │  14 FF FF FF                 │
    │  (while locked)              │
    │─────────────────────────────>│
    │  7F 14 33                    │
    │  (security denied)           │
    │<─────────────────────────────│
    │                              │
    │  27 01                       │
    │  (request seed)              │
    │─────────────────────────────>│
    │  67 01 AB CD EF 12           │
    │  (here's seed)               │
    │<─────────────────────────────│
    │                              │
    │  27 02 12 34 56 78           │
    │  (send key)                  │
    │─────────────────────────────>│
    │  67 02                       │
    │  (unlocked! 🔓)              │
    │<─────────────────────────────│
    │                              │
    │  14 FF FF FF                 │
    │  (try clear again)           │
    │─────────────────────────────>│
    │  54                          │
    │  (success!)                  │
    │<─────────────────────────────│
    │                              │

Result: ✅ PASS
```

### Test Scenario 4: Conditions Not Correct (Vehicle Moving)

```
┌──────────────────────────────────────────────────┐
│  TEST CASE: Attempt Clear While Moving           │
├──────────────────────────────────────────────────┤
│  Preconditions:                                  │
│  • Extended session active                       │
│  • DTCs present                                  │
│  • Vehicle speed: 30 km/h (moving!)              │
└──────────────────────────────────────────────────┘

Test Steps:
┌────┬──────────────────────────┬──────────────────┐
│ #  │ Action                   │ Expected Result  │
├────┼──────────────────────────┼──────────────────┤
│ 1  │ Clear DTCs (moving)      │ 7F 14 22         │
│ 2  │ Stop vehicle (0 km/h)    │ Speed = 0        │
│ 3  │ Clear DTCs (stationary)  │ 54 (success)     │
└────┴──────────────────────────┴──────────────────┘

Visual:
┌────────────────────────────────────────┐
│ ❌ Attempt 1: FAILED                  │
├────────────────────────────────────────┤
│  Condition: 🚗 Speed = 30 km/h        │
│  Request: 14 FF FF FF                  │
│  Response: 7F 14 22                    │
│  Reason: Vehicle must be stationary    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ Attempt 2: SUCCESS                 │
├────────────────────────────────────────┤
│  Condition: 🛑 Speed = 0 km/h         │
│  Request: 14 FF FF FF                  │
│  Response: 54                          │
│  Result: DTCs cleared                  │
└────────────────────────────────────────┘

Result: ✅ PASS (correct NRC behavior)
```

### Test Scenario 5: Long Processing Time (NRC 0x78)

```
┌──────────────────────────────────────────────────┐
│  TEST CASE: Large Clear Operation                │
├──────────────────────────────────────────────────┤
│  Preconditions:                                  │
│  • Extended session                              │
│  • 100+ DTCs stored (worst case)                 │
│  • Many freeze frames and extended data          │
└──────────────────────────────────────────────────┘

Timing Diagram:
  Tester                          ECU
    │                              │
    │ t=0ms                        │
    │  14 FF FF FF                 │
    │─────────────────────────────>│
    │                              │
    │ t=45ms                       │
    │  7F 14 78 (wait)             │
    │<─────────────────────────────│
    │                              │
    │      [Processing...]         │
    │      - Erase 100 DTCs        │
    │      - Clear 50 frames       │
    │      - Reset all counters    │
    │                              │
    │ t=4500ms                     │
    │  7F 14 78 (still wait)       │
    │<─────────────────────────────│
    │                              │
    │      [Still processing...]   │
    │                              │
    │ t=8200ms                     │
    │  54 (done!)                  │
    │<─────────────────────────────│
    │                              │

Expected Behavior:
┌────────────────────────────────────────┐
│ NRC 0x78 sent every ~4500ms            │
│ Final response within 10 seconds       │
│ Total time depends on DTC count        │
└────────────────────────────────────────┘

Result: ✅ PASS
```

---

## Debugging Guide

### Common Issues and Solutions

```
┌──────────────────────────────────────────────────┐
│  ISSUE #1: NRC 0x13 (Incorrect Length)           │
├──────────────────────────────────────────────────┤
│  Symptom: Always get 7F 14 13                    │
│                                                  │
│  Debug Steps:                                    │
│  1. Check request length                         │
│     ┌────────────────────────┐                   │
│     │ Expected: 4 bytes      │                   │
│     │ Check: Actual length?  │                   │
│     └────────────────────────┘                   │
│                                                  │
│  2. Verify all bytes present                     │
│     ┌────┬────┬────┬────┐                        │
│     │ 14 │ XX │ XX │ XX │                        │
│     └────┴────┴────┴────┘                        │
│       ✓    ✓    ✓    ✓                          │
│                                                  │
│  3. Check for trailing/leading bytes            │
│                                                  │
│  Solution:                                       │
│  ✅ Send exactly 4 bytes                        │
│  ✅ No padding, no extra data                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  ISSUE #2: NRC 0x22 (Conditions Not Correct)     │
├──────────────────────────────────────────────────┤
│  Symptom: Clear fails in certain conditions      │
│                                                  │
│  Debug Checklist:                                │
│  ┌──────────────────────────┬────────┐           │
│  │ Condition                │ Status │           │
│  ├──────────────────────────┼────────┤           │
│  │ Vehicle speed = 0?       │ □      │           │
│  │ Ignition ON?             │ □      │           │
│  │ No active faults?        │ □      │           │
│  │ Battery >= 11V?          │ □      │           │
│  │ ECU not flashing?        │ □      │           │
│  │ Correct session?         │ □      │           │
│  └──────────────────────────┴────────┘           │
│                                                  │
│  Solutions:                                      │
│  ✅ Repair active faults first                  │
│  ✅ Stop vehicle completely                     │
│  ✅ Ensure stable power supply                  │
│  ✅ Wait for ECU to finish operations           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  ISSUE #3: DTCs Not Actually Cleared             │
├──────────────────────────────────────────────────┤
│  Symptom: Response 54, but DTCs still there      │
│                                                  │
│  Debug Steps:                                    │
│  1. Verify positive response received            │
│     Response: 54 ✓                               │
│                                                  │
│  2. Wait before re-reading                       │
│     ┌───────────────────────┐                    │
│     │ Wait 100-500ms        │                    │
│     │ Allow EEPROM write    │                    │
│     └───────────────────────┘                    │
│                                                  │
│  3. Re-read DTCs properly                        │
│     Request: 19 02 AF (all DTCs)                 │
│     Check response carefully                     │
│                                                  │
│  4. Check for permanent DTCs                     │
│     ┌───────────────────────┐                    │
│     │ Permanent DTCs cannot │                    │
│     │ be cleared by SID 0x14│                    │
│     │ (OBD-II requirement)  │                    │
│     └───────────────────────┘                    │
│                                                  │
│  Solutions:                                      │
│  ✅ Allow time for memory write                 │
│  ✅ Understand permanent DTC behavior           │
│  ✅ Verify GroupOfDTC matches DTCs              │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  ISSUE #4: Intermittent NRC 0x72                 │
├──────────────────────────────────────────────────┤
│  Symptom: Sometimes works, sometimes fails       │
│                                                  │
│  Root Causes:                                    │
│  • Low/unstable battery voltage                  │
│  • EEPROM wear/failure                           │
│  • Thermal issues                                │
│  • Concurrent memory access                      │
│                                                  │
│  Debug Process:                                  │
│  1. Monitor battery voltage                      │
│     ┌───────────────────────┐                    │
│     │ Should be: 12-14V     │                    │
│     │ Minimum: 11V          │                    │
│     └───────────────────────┘                    │
│                                                  │
│  2. Check EEPROM health                          │
│     - Read/write test                            │
│     - Error counter check                        │
│                                                  │
│  3. Temperature monitoring                       │
│     - ECU temp within spec?                      │
│                                                  │
│  Solutions:                                      │
│  ✅ Ensure stable 12V supply                    │
│  ✅ Check for ECU hardware faults               │
│  ✅ Retry with delay on failure                 │
└──────────────────────────────────────────────────┘
```

### Diagnostic Flow for Failures

```
        CLEAR FAILED
              │
              ▼
        ┌──────────────┐
        │ What NRC?    │
        └──────┬───────┘
               │
     ┌─────────┼─────────┬─────────┐
     │         │         │         │
   0x13      0x22      0x33      0x72
     │         │         │         │
     ▼         ▼         ▼         ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Check   │ │ Check  │ │ Unlock │ │ Check  │
│ Message │ │ Vehicle│ │ ECU    │ │ Power  │
│ Format  │ │ Condi- │ │ with   │ │ and    │
│         │ │ tions  │ │ SID 27 │ │ Memory │
└────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Fix     │ │ Stop   │ │ Send   │ │ Check  │
│ Length  │ │ Vehicle│ │ Seed/  │ │ Battery│
│ to 4    │ │ Repair │ │ Key    │ │ >= 11V │
│ bytes   │ │ Faults │ │        │ │        │
└────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │          │          │          │
     └──────────┴──────────┴──────────┘
                    │
                    ▼
              ┌──────────┐
              │ RETRY    │
              │ SID 0x14 │
              └──────────┘
```

---

## Best Practices

### Implementation Best Practices

```
┌──────────────────────────────────────────────────┐
│  ✅ DO:                                          │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Always validate request length first         │
│     └─ Prevents processing invalid requests      │
│                                                  │
│  2. Check all conditions before clearing         │
│     └─ Vehicle speed, ignition, faults, etc.     │
│                                                  │
│  3. Send NRC 0x78 for long operations            │
│     └─ Keep tester informed of progress          │
│                                                  │
│  4. Verify EEPROM write success                  │
│     └─ Read back to confirm erasure              │
│                                                  │
│  5. Implement retry logic for write failures     │
│     └─ Up to 3 attempts with delays              │
│                                                  │
│  6. Clear all related data atomically            │
│     └─ DTC + freeze frame + counters together    │
│                                                  │
│  7. Log clear operations for diagnostics         │
│     └─ Timestamp, GroupOfDTC, result             │
│                                                  │
│  8. Support standard GroupOfDTC values           │
│     └─ 0xFFFFFF, 0x000000, category groups       │
│                                                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  ❌ DON'T:                                       │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Don't clear while faults are active          │
│     └─ Can cause confusion and hide issues       │
│                                                  │
│  2. Don't allow clear while vehicle moving       │
│     └─ Safety requirement                        │
│                                                  │
│  3. Don't clear configuration data               │
│     └─ Only diagnostic information               │
│                                                  │
│  4. Don't ignore EEPROM write errors             │
│     └─ Must return NRC 0x72 on failure           │
│                                                  │
│  5. Don't block forever during clear             │
│     └─ Implement timeout protection              │
│                                                  │
│  6. Don't forget permanent DTCs                  │
│     └─ OBD-II permanent DTCs require drive cycle │
│                                                  │
│  7. Don't clear security state                   │
│     └─ Unlock status should persist              │
│                                                  │
│  8. Don't accept invalid GroupOfDTC values       │
│     └─ Return NRC 0x31 for unsupported groups    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Testing Best Practices

```
┌──────────────────────────────────────────────────┐
│  COMPREHENSIVE TESTING CHECKLIST                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  □ Test with 0 DTCs (should still succeed)       │
│  □ Test with 1 DTC                               │
│  □ Test with maximum DTCs (stress test)          │
│  □ Test all GroupOfDTC patterns                  │
│    ├─ □ 0xFFFFFF (all DTCs)                      │
│    ├─ □ 0x000000 (emissions)                     │
│    ├─ □ 0xFFFF00 (powertrain)                    │
│    ├─ □ 0xFFFF33 (network)                       │
│    └─ □ Specific DTC codes                       │
│  □ Test security required/not required           │
│  □ Test in each diagnostic session               │
│  □ Test with vehicle moving (should fail)        │
│  □ Test with low battery (should fail/retry)     │
│  □ Test with active faults present               │
│  □ Verify freeze frames cleared                  │
│  □ Verify extended data cleared                  │
│  □ Verify counters reset                         │
│  □ Verify learned values NOT cleared             │
│  □ Test NRC 0x78 for large clears                │
│  □ Test EEPROM write failure scenario            │
│  □ Verify permanent DTCs NOT cleared             │
│  □ Test rapid successive clears                  │
│  □ Test clear during other operations            │
│  □ Verify response timing (< P2 or send 0x78)    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Error Recovery Pattern

```
┌──────────────────────────────────────────────────┐
│  ROBUST ERROR HANDLING PATTERN                   │
└──────────────────────────────────────────────────┘

        Clear Request Received
                │
                ▼
        ┌──────────────┐
        │ Try Clear    │
        │ Operation    │
        └──────┬───────┘
               │
          ┌────┴────┐
          │         │
      SUCCESS    FAILURE
          │         │
          │         ▼
          │    ┌──────────────┐
          │    │ Retry Count  │───┐
          │    │ < 3?         │   │
          │    └──────┬───────┘   │
          │           │          NO
          │          YES          │
          │           │           ▼
          │           ▼     ┌──────────────┐
          │    ┌──────────────┐ │ Return NRC   │
          │    │ Wait 50ms    │ │ 0x72         │
          │    └──────┬───────┘ │ (permanent   │
          │           │         │  failure)    │
          │           │         └──────────────┘
          │           │
          │           └──────┐
          │                  │
          ▼                  │
    ┌──────────────┐         │
    │ Return 0x54  │         │
    │ (success)    │         │
    └──────────────┘         │
                             │
                             ▼
                        (retry loop)
```

---

**End of Document**
