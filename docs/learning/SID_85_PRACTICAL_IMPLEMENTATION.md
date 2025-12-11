# SID 0x85: Practical Implementation Guide

**Document Version**:  2.0  
**Last Updated**: December 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9. 7

---

## Table of Contents

1. [Request Processing Flow](#request-processing-flow)
2. [State Management Logic](#state-management-logic)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [State Machine Diagrams](#state-machine-diagrams)
5. [Testing Scenarios](#testing-scenarios)
6. [Integration Patterns](#integration-patterns)
7. [Debugging Guide](#debugging-guide)
8. [Best Practices](#best-practices)

---

## Request Processing Flow

### High-Level Processing Flowchart

```
                    ┌──────────────────┐
                    │ Receive Request  │
                    │   (SID 0x85)     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Validate Session │
               ┌────┤ (EXTENDED/PROG?) │────┐
              NO    └──────────────────┘   YES
               │                             │
               ▼                             ▼
          NRC 0x7F              ┌────────────────────┐
       (Wrong Session)          │ Parse Sub-function │
                                └────────┬───────────┘
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                             0x01                  0x02
                         (Enable)              (Disable)
                              │                     │
                              ▼                     ▼
                    ┌──────────────┐      ┌──────────────┐
                    │ Check Security│      │Check Security│
               ┌────┤ If Required   │ ┌────┤If Required   │
              NO    └──────┬────────┘NO    └──────┬───────┘
               │           │YES              │           │YES
               ▼           ▼                 ▼           ▼
          NRC 0x33    ┌─────────┐      NRC 0x33   ┌─────────┐
                      │ Enable  │                 │Disable  │
                      │ DTC     │                 │DTC      │
                      │Recording│                 │Recording│
                      └────┬────┘                 └────┬────┘
                           │                           │
                           └──────────┬────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │Send Response │
                              │    0xC5      │
                              └──────────────┘
```

### Detailed Validation Flow

```
         ┌─────────────────────┐
         │ Start Processing    │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check byte 0 = 0x85?  │
         └──────────┬──────────┘
                    │
              ┌─────┴─────┐
             NO           YES
              │             │
              ▼             ▼
         ┌─────────┐   ┌──────────────────┐
         │ Ignore  │   │ Length Check:      │
         │         │   │ 2 or 3 bytes?     │
         └─────────┘   └────────┬─────────┘
                                │
                          ┌─────┴─────┐
                         NO           YES
                          │             │
                          ▼             ▼
                   ┌──────────┐   ┌──────────────┐
                   │Return NRC│   │ Parse        │
                   │   0x13   │   │ Sub-function │
                   └──────────┘   │ (byte 1)     │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Sub-fn is    │
                                  │ 0x01 or 0x02?  │
                                  └──────┬───────┘
                                         │
                                    ┌────┴────┐
                                   NO        YES
                                    │          │
                                    ▼          ▼
                              ┌──────────┐  ┌──────────┐
                              │Return NRC│  │Process   │
                              │   0x12   │  │Request   │
                              └──────────┘  └──────────┘
```

---

## State Management Logic

### DTC Recording State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│              DTC RECORDING STATE LOGIC                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Internal State Variable:  DTC_Recording_Enabled             │
│  Type: Boolean                                              │
│  Default: TRUE (enabled)                                    │
│                                                             │
│  State Transition Table:                                    │
│  ┌──────────────┬───────────┬──────────────┬──────────┐    │
│  │ Current State│ Event     │ New State    │ Action   │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ ENABLED      │ 85 02     │ DISABLED     │ Stop DTC │    │
│  │              │           │              │ updates  │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ DISABLED     │ 85 01     │ ENABLED      │ Resume   │    │
│  │              │           │              │ DTC ops  │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ DISABLED     │ Power OFF │ ENABLED      │ Reset on │    │
│  │              │           │              │ startup  │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ DISABLED     │ Session   │ ENABLED      │ Auto-    │    │
│  │              │ timeout   │              │ reset    │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ ENABLED      │ 85 01     │ ENABLED      │ No change│    │
│  │              │           │              │ (idempo- │    │
│  │              │           │              │  tent)   │    │
│  ├──────────────┼───────────┼──────────────┼──────────┤    │
│  │ DISABLED     │ 85 02     │ DISABLED     │ No change│    │
│  │              │           │              │ (idempo- │    │
│  │              │           │              │  tent)   │    │
│  └──────────────┴───────────┴──────────────┴──────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Selective DTC Control Logic

```
┌─────────────────────────────────────────────────────────────┐
│          SELECTIVE DTC CONTROL IMPLEMENTATION               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  If DTCSettingType parameter present (Byte 2):              │
│                                                             │
│  Internal State:  Array of DTC Category States               │
│  ┌────────────────────────────────┐                        │
│  │ DTC_State[ALL]         = TRUE  │                        │
│  │ DTC_State[EMISSIONS]   = TRUE  │                        │
│  │ DTC_State[SAFETY]      = TRUE  │                        │
│  │ DTC_State[CUSTOM_1]    = TRUE  │                        │
│  │ ...                             │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  Processing Logic:                                          │
│                                                             │
│  Request:  85 02 01 (Disable Emissions)                      │
│  ┌────────────────────────────────┐                        │
│  │ if DTCSettingType == 0x01:     │                        │
│  │   DTC_State[EMISSIONS] = FALSE │                        │
│  │   DTC_State[SAFETY] = TRUE     │  (unchanged)           │
│  │   DTC_State[CUSTOM_X] = TRUE   │  (unchanged)           │
│  └────────────────────────────────┘                        │
│                                                             │
│  Request: 85 01 01 (Enable Emissions)                       │
│  ┌────────────────────────────────┐                        │
│  │ if DTCSettingType == 0x01:     │                        │
│  │   DTC_State[EMISSIONS] = TRUE  │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  Request: 85 02 (Disable All - no type)                     │
│  ┌────────────────────────────────┐                        │
│  │ DTC_State[ALL] = FALSE         │                        │
│  │ OR                             │                        │
│  │ for each category:             │                        │
│  │   DTC_State[category] = FALSE  │                        │
│  └────────────────────────────────┘                        │
│                                                             │
│  Fault Detection Check:                                     │
│  ┌────────────────────────────────┐                        │
│  │ if fault_detected:             │                        │
│  │   category = get_DTC_category()│                        │
│  │   if DTC_State[category]:       │                        │
│  │     store_DTC()                │                        │
│  │   else:                        │                        │
│  │     skip_storage()             │                        │
│  └────────────────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## NRC Decision Trees

### Master NRC Decision Tree

```
                        Start Processing 0x85
                              │
                              ▼
                    ┌──────────────────┐
                    │ Session Type     │
               ┌────┤ Valid?            │────┐
              NO    │ (EXT or PROG)    │   YES
               │    └──────────────────┘    │
               ▼                             ▼
          NRC 0x7F              ┌────────────────────┐
       (Wrong Session)          │ Message Length     │
                           ┌────┤ 2 or 3 bytes?      │────┐
                          NO    └────────────────────┘   YES
                           │                              │
                           ▼                              ▼
                      NRC 0x13              ┌──────────────────┐
                   (Length Error)           │ Sub-function     │
                                       ┌────┤ 0x01 or 0x02?    │────┐
                                      NO    └──────────────────┘   YES
                                       │                            │
                                       ▼                            ▼
                                  NRC 0x12              ┌──────────────────┐
                              (Sub-fn Invalid)          │ If byte 2 present:│
                                                   ┌────┤ DTCSettingType    │────┐
                                                  NO    │ Valid?            │   YES
                                                   │    └──────────────────┘    │
                                                   ▼                            ▼
                                              NRC 0x31              ┌──────────────┐
                                          (Out of Range)            │ Security     │
                                                               ┌────┤ Required?     │────┐
                                                              NO    └──────────────┘   YES
                                                               │                        │
                                                               ▼                        ▼
                                                      Positive Response    ┌──────────────┐
                                                           0xC5            │ Security     │
                                                                      ┌────┤ Unlocked?    │────┐
                                                                     NO    └──────────────┘   YES
                                                                      │                        │
                                                                      ▼                        ▼
                                                                 NRC 0x33              Positive Response
                                                            (Security Denied)              0xC5
```

### Security Check Decision Tree

```
         ┌─────────────────────────┐
         │ Processing 0x85 Request │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Check ECU Configuration: │
         │ Security required?      │
         └──────────┬──────────────┘
                    │
              ┌─────┴─────┐
             NO           YES
              │             │
              ▼             ▼
        ┌──────────┐  ┌──────────────────┐
        │Continue  │  │ Check if byte 2  │
        │Processing│  │ (DTCSettingType) │
        └──────────┘  │ is safety-related│
                      └────────┬─────────┘
                               │
                         ┌─────┴─────┐
                        NO           YES
                         │             │
                         ▼             ▼
                   ┌──────────┐  ┌──────────────┐
                   │Continue  │  │ Check        │
                   │Processing│  │ Security     │
                   └──────────┘  │ State        │
                                 └──────┬───────┘
                                        │
                                  ┌─────┴─────┐
                              LOCKED      UNLOCKED
                                  │             │
                                  ▼             ▼
                            ┌──────────┐  ┌──────────┐
                            │NRC 0x33  │  │Continue  │
                            └──────────┘  └──────────┘
```

---

## State Machine Diagrams

### Complete DTC Control State Machine

```
┌─────────────────────────────────────────────────────────────┐
│           DTC CONTROL STATE MACHINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────┐                      │
│  │      POWER-ON / INITIALIZATION    │                      │
│  │                                   │                      │
│  │  • DTC Recording:  ENABLED         │                      │
│  │  • All categories: ACTIVE         │                      │
│  │  • Default safe state             │                      │
│  └────────────┬─────────────────────┘                      │
│               │                                             │
│               │ Enter EXTENDED Session                      │
│               │                                             │
│               ▼                                             │
│  ┌──────────────────────────────────┐                      │
│  │     EXTENDED SESSION ACTIVE       │                      │
│  │                                   │                      │
│  │  • DTC Recording: ENABLED (still) │                      │
│  │  • Can now control DTC setting    │                      │
│  └────────────┬─────────────────────┘                      │
│               │                                             │
│               │ Send:  85 02 (Disable)                       │
│               │                                             │
│               ▼                                             │
│  ┌──────────────────────────────────┐                      │
│  │      DTC RECORDING DISABLED       │                      │
│  │                                   │                      │
│  │  • New faults detected but NOT    │                      │
│  │    stored                         │                      │
│  │  • Existing DTCs preserved        │                      │
│  │  • Status updates suspended       │                      │
│  └────────┬────────┬────────────────┘                      │
│           │        │                                        │
│           │        │ Send: 85 01 (Enable)                   │
│           │        │                                        │
│           │        ▼                                        │
│           │   ┌──────────────────────┐                     │
│           │   │  DTC RECORDING       │                     │
│           │   │  RE-ENABLED          │                     │
│           │   │  (Manual)            │                     │
│           │   └──────────────────────┘                     │
│           │                                                 │
│           │ Timeout / Session Change / Power Cycle         │
│           │                                                 │
│           ▼                                                 │
│  ┌──────────────────────────────────┐                      │
│  │   AUTO-RESET TO ENABLED           │                      │
│  │                                   │                      │
│  │  • Safety feature                 │                      │
│  │  • Returns to safe default        │                      │
│  │  • Normal monitoring resumes      │                      │
│  └───────────────────────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fault Detection Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│         FAULT DETECTION WITH DTC CONTROL                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Continuous Loop (runs every diagnostic cycle):             │
│                                                             │
│  ┌────────────────────────────────┐                        │
│  │ Monitor System Parameters      │                        │
│  │ (sensors, actuators, etc.)     │                        │
│  └────────────┬───────────────────┘                        │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────┐                        │
│  │ Fault Condition Detected?       │                        │
│  └────────────┬───────────────────┘                        │
│               │                                             │
│          ┌────┴────┐                                       │
│         NO        YES                                      │
│          │          │                                       │
│          ▼          ▼                                       │
│    ┌─────────┐  ┌──────────────────┐                      │
│    │Continue │  │ Determine DTC     │                      │
│    │Monitoring│  │ Code (P0420, etc.)│                      │
│    └─────────┘  └────────┬─────────┘                      │
│                           │                                 │
│                           ▼                                 │
│              ┌────────────────────────┐                    │
│              │ Check DTC_Recording_   │                    │
│              │ Enabled flag           │                    │
│              └────────┬───────────────┘                    │
│                       │                                     │
│                 ┌─────┴─────┐                              │
│              FALSE         TRUE                            │
│                 │              │                            │
│                 ▼              ▼                            │
│      ┌──────────────┐   ┌─────────────────┐               │
│      │ Log internally│   │ Check category  │               │
│      │ (optional)    │   │ if selective    │               │
│      │ Do NOT store  │   │ control active  │               │
│      │ in DTC memory │   └────────┬────────┘               │
│      └──────────────┘            │                         │
│                                   ▼                         │
│                      ┌────────────────────────┐            │
│                      │ Category enabled?      │            │
│                      └────────┬───────────────┘            │
│                               │                             │
│                         ┌─────┴─────┐                      │
│                        NO          YES                     │
│                         │            │                      │
│                         ▼            ▼                      │
│                  ┌──────────┐  ┌──────────────┐            │
│                  │ Skip     │  │ Store DTC    │            │
│                  │ Storage  │  │ Update status│            │
│                  └──────────┘  │ Set MIL/lamp │            │
│                                └──────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Basic Enable/Disable

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Basic DTC control functionality                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session:  EXTENDED                                        │
│ • Security: Not required (or unlocked)                     │
│ • Initial state: DTC recording ENABLED                     │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │ ① Disable DTC Recording │                            │
│     │  85 02                  │                            │
│     │────────────────────────>│                            │
│     │                         │ [Set DTC_Recording=FALSE]  │
│     │  C5 02                  │                            │
│     │◄────────────────────────│                            │
│     │ ✓ Response correct      │                            │
│     │                         │                            │
│     │ ② Verify State          │                            │
│     │ [Trigger test fault]    │                            │
│     │                         │ [Fault detected]           │
│     │                         │ [DTC NOT stored ✓]         │
│     │                         │                            │
│     │ ③ Re-enable DTC         │                            │
│     │  85 01                  │                            │
│     │────────────────────────>│                            │
│     │                         │ [Set DTC_Recording=TRUE]   │
│     │  C5 01                  │                            │
│     │◄────────────────────────│                            │
│     │ ✓ Response correct      │                            │
│     │                         │                            │
│     │ ④ Verify State          │                            │
│     │ [Trigger test fault]    │                            │
│     │                         │ [Fault detected]           │
│     │                         │ [DTC stored ✓]             │
│     │                         │                            │
│                                                            │
│ Expected Result:  ✓ SUCCESS                                 │
│ • Disable command accepted                                 │
│ • Faults not stored when disabled                          │
│ • Enable command accepted                                  │
│ • Faults stored when enabled                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 2: Wrong Session (NRC 0x7F)

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Verify session requirement enforcement              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session:  DEFAULT (0x01)                                  │
│ • DTC recording: ENABLED                                   │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  85 02                  │                            │
│     │────────────────────────>│                            │
│     │                         │ [Check session:  DEFAULT]   │
│     │                         │ [Service not allowed! ]     │
│     │  7F 85 7F               │                            │
│     │◄────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x7F (Service Not Supported In Active Session)        │
│                                                            │
│ Verify:                                                     │
│ • Byte 0 = 0x7F                                            │
│ • Byte 1 = 0x85 (service echo)                             │
│ • Byte 2 = 0x7F (NRC)                                      │
│ • DTC state unchanged (still ENABLED)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 3: Selective DTC Control

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Selective DTC category control                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                      │
│ • Session: EXTENDED                                        │
│ • ECU supports selective control                           │
│ • All categories initially ENABLED                         │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │ ① Disable Emissions Only│                            │
│     │  85 02 01               │                            │
│     │────────────────────────>│                            │
│     │                         │ [Disable emissions DTCs]   │
│     │                         │ [Keep safety DTCs active]  │
│     │  C5 02                  │                            │
│     │◄────────────────────────│                            │
│     │                         │                            │
│     │ ② Trigger Emissions Fault│                           │
│     │ [Cause P0420 condition] │                            │
│     │                         │ [Detected but NOT stored ✓]│
│     │                         │                            │
│     │ ③ Trigger Safety Fault  │                            │
│     │ [Cause ABS fault]       │                            │
│     │                         │ [Detected AND stored ✓]    │
│     │                         │                            │
│     │ ④ Verify DTCs           │                            │
│     │  19 02 FF               │                            │
│     │────────────────────────>│                            │
│     │  59 02 FF 01 [ABS DTC]  │                            │
│     │◄────────────────────────│                            │
│     │ ✓ Only safety DTC stored│                            │
│     │ ✓ No emissions DTC      │                            │
│     │                         │                            │
│     │ ⑤ Re-enable Emissions   │                            │
│     │  85 01 01               │                            │
│     │────────────────────────>│                            │
│     │  C5 01                  │                            │
│     │◄────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Selective control working correctly                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 4: Auto-Reset on Timeout

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Verify auto-reset safety feature                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session: EXTENDED                                        │
│ • P3server timeout: 5000ms                                 │
│ • No Tester Present configured                             │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Time    Tester              ECU                          │
│     │                          │                           │
│   T=0    85 02 ────────────────>│                           │
│          C5 02 ◄────────────────│                           │
│          ✓ DTC disabled         │                           │
│                                 │                           │
│   T=1-4  [No activity]          │ [P3 timer counting]       │
│                                 │                           │
│   T=5    [Timeout! ]             │ [P3 timeout occurred]     │
│                                 │ [Return to DEFAULT]       │
│                                 │ [AUTO-RESET DTC:  ENABLED] │
│                                 │                           │
│   T=6    [Trigger fault]        │ [Fault detected]          │
│                                 │ [DTC STORED ✓]            │
│                                 │                           │
│   T=7    19 02 FF ──────────────>│                           │
│          59 02 FF 01 [DTC] ◄────│                           │
│          ✓ DTC was stored       │                           │
│                                 │                           │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Auto-reset safety feature working                          │
│                                                            │
│ Verify:                                                    │
│ • Session timeout triggered reset                          │
│ • DTC recording re-enabled automatically                   │
│ • New faults properly stored                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 5: Security Requirement

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Security access requirement                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                      │
│ • Session: EXTENDED                                        │
│ • Security:  LOCKED                                         │
│ • ECU requires security for DTC control                    │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │ ① Try Without Security  │                            │
│     │  85 02                  │                            │
│     │────────────────────────>│                            │
│     │                         │ [Check security:  LOCKED]   │
│     │  7F 85 33               │                            │
│     │◄────────────────────────│                            │
│     │ ✗ Security denied       │                            │
│     │                         │                            │
│     │ ② Unlock Security       │                            │
│     │  27 01                  │                            │
│     │────────────────────────>│                            │
│     │  67 01 [seed]           │                            │
│     │◄────────────────────────│                            │
│     │  27 02 [key]            │                            │
│     │────────────────────────>│                            │
│     │  67 02                  │                            │
│     │◄────────────────────────│                            │
│     │ ✓ Security unlocked     │                            │
│     │                         │                            │
│     │ ③ Retry DTC Control     │                            │
│     │  85 02                  │                            │
│     │────────────────────────>│                            │
│     │                         │ [Check security: UNLOCKED] │
│     │  C5 02                  │                            │
│     │◄────────────────────────│                            │
│     │ ✓ Success               │                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Security requirement properly enforced                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 6: Idempotent Operations

```
┌────────────────────────────────────────────────────────────┐
│ TEST:  Verify idempotent behavior                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Test A: Multiple Disable Commands                          │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  85 02 (first disable)  │                            │
│     │────────────────────────>│                            │
│     │  C5 02 ✓                │                            │
│     │◄────────────────────────│                            │
│     │                         │ [State:  DISABLED]          │
│     │  85 02 (second disable) │                            │
│     │────────────────────────>│                            │
│     │  C5 02 ✓                │                            │
│     │◄────────────────────────│                            │
│     │                         │ [State:  DISABLED (no change)]│
│     │ ✓ No error, idempotent  │                            │
│     │                         │                            │
│                                                            │
│ Test B: Multiple Enable Commands                           │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  85 01 (first enable)   │                            │
│     │────────────────────────>│                            │
│     │  C5 01 ✓                │                            │
│     │◄────────────────────────│                            │
│     │                         │ [State: ENABLED]           │
│     │  85 01 (second enable)  │                            │
│     │────────────────────────>│                            │
│     │  C5 01 ✓                │                            │
│     │◄────────────────────────│                            │
│     │                         │ [State:  ENABLED (no change)]│
│     │ ✓ No error, idempotent  │                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Commands are idempotent (safe to repeat)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: DTC Control in Maintenance Procedures

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN: Standard Maintenance Wrapper                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pre-Maintenance:                                           │
│  ┌────────────────────────────────────┐                    │
│  │ 1. Enter diagnostic session        │                    │
│  │    → Establish communication       │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 2. Read and save existing DTCs     │                    │
│  │    → Document current state        │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 3. Disable DTC recording           │                    │
│  │    → Prevent false codes           │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 4. Optionally clear DTCs           │                    │
│  │    → Clean baseline                │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 5. Perform maintenance work        │                    │
│  │    → Physical operations           │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  Post-Maintenance:                                          │
│  ┌────────────────────────────────────┐                    │
│  │ 6. Re-enable DTC recording         │                    │
│  │    → Resume monitoring             │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 7. Test component functionality    │                    │
│  │    → Verify repair                 │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 8. Check for new DTCs              │                    │
│  │    → Confirm no issues             │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 9. Exit diagnostic session         │                    │
│  │    → Normal operation              │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Error Recovery

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN:  Robust Error Handling                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  try {                                                      │
│    ┌────────────────────────────────┐                      │
│    │ Disable DTC (85 02)            │                      │
│    └────────┬───────────────────────┘                      │
│             │                                               │
│       ┌─────┴─────┐                                        │
│    Success      Failure                                    │
│       │            │                                        │
│       │            ▼                                        │
│       │      ┌──────────────────┐                          │
│       │      │ Handle NRC:       │                          │
│       │      │ • 0x7F → Session │                          │
│       │      │ • 0x33 → Security│                          │
│       │      │ • Retry or abort │                          │
│       │      └──────────────────┘                          │
│       │                                                     │
│       ▼                                                     │
│    ┌────────────────────────────────┐                      │
│    │ Perform maintenance            │                      │
│    └────────┬───────────────────────┘                      │
│             │                                               │
│  } finally {                                                │
│       ▼                                                     │
│    ┌────────────────────────────────┐                      │
│    │ ALWAYS re-enable DTCs          │                      │
│    │ Even if error occurred         │                      │
│    │ → 85 01                        │                      │
│    └────────────────────────────────┘                      │
│  }                                                          │
│                                                             │
│  Ensures DTCs never left disabled accidentally             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Debugging Guide

### Common Issues Checklist

```
┌────────────────────────────────────────────────────────────┐
│              TROUBLESHOOTING CHECKLIST                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Issue:  NRC 0x7F (Wrong Session)                            │
│ ☐ Current session is DEFAULT?                               │
│ ☐ Need to enter EXTENDED (10 03) first?                    │
│ ☐ Session timed out?                                       │
│ ☐ Using Tester Present to maintain session?                │
│                                                            │
│ Issue: NRC 0x33 (Security Denied)                          │
│ ☐ Does this ECU require security for DTC control?          │
│ ☐ Security successfully unlocked (27 01/02)?               │
│ ☐ Security timeout expired?                                 │
│ ☐ Trying to disable safety-critical DTCs?                  │
│                                                            │
│ Issue: NRC 0x31 (Out of Range)                             │
│ ☐ DTCSettingType value supported by ECU?                   │
│ ☐ Check ODX/CDD for supported types                        │
│ ☐ Try without type parameter (global control)              │
│                                                            │
│ Issue: DTCs still being recorded                           │
│ ☐ Disable command successful (C5 02)?                      │
│ ☐ Session timed out and auto-reset occurred?               │
│ ☐ Power cycle reset DTC setting?                           │
│ ☐ Selective control - wrong category disabled?             │
│                                                            │
│ Issue: Cannot re-enable DTCs                               │
│ ☐ Session still active?                                     │
│ ☐ Message format correct (85 01)?                          │
│ ☐ Check for error responses                                │
│                                                            │
│ Issue:  Existing DTCs disappeared                           │
│ ☐ Did you clear DTCs (14 FF FF FF)?                        │
│ ☐ Check if that was intentional                            │
│ ☐ Disabling DTCs does NOT clear them                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Debug Logging Template

```
┌─────────────────────────────────────────────────────────────┐
│                   DEBUG LOG TEMPLATE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Timestamp] [Level] [Component] Message                    │
│                                                             │
│  Example Logs:                                              │
│                                                             │
│  [00:00.000] [INFO] [SESSION] Entered EXTENDED (0x03)      │
│  [00:00.100] [INFO] [DTC] Current state: ENABLED           │
│  [00:00.110] [DEBUG] [TX] Sending:  85 02                   │
│  [00:00.150] [DEBUG] [RX] Received: C5 02                  │
│  [00:00.151] [INFO] [DTC] State changed:  DISABLED          │
│  [00:00.152] [INFO] [DTC] Recording suspended              │
│  [00:10.000] [DEBUG] [FAULT] Detected:  P0135               │
│  [00:10.001] [DEBUG] [DTC] Recording disabled, skipping    │
│  [00:10.002] [INFO] [DTC] Fault detected but NOT stored    │
│  [00:30.000] [DEBUG] [TX] Sending: 85 01                   │
│  [00:30.040] [DEBUG] [RX] Received: C5 01                  │
│  [00:30.041] [INFO] [DTC] State changed: ENABLED           │
│  [00:30.042] [INFO] [DTC] Recording resumed                │
│  [00:31.000] [INFO] [SESSION] Exiting to DEFAULT           │
│                                                             │
│  Error Example:                                             │
│                                                             │
│  [00:05.000] [DEBUG] [TX] Sending: 85 02                   │
│  [00:05.040] [DEBUG] [RX] Received: 7F 85 7F               │
│  [00:05.041] [ERROR] [DTC] Control failed: Wrong session   │
│  [00:05.042] [ERROR] [SESSION] Current session:  DEFAULT    │
│  [00:05.043] [INFO] [SESSION] Entering EXTENDED            │
│  [00:05.100] [DEBUG] [TX] Sending: 10 03                   │
│  [00:05.140] [DEBUG] [RX] Received: 50 03                  │
│  [00:05.141] [INFO] [SESSION] Session changed:  EXTENDED    │
│  [00:05.150] [DEBUG] [TX] Retry:  85 02                     │
│  [00:05.190] [DEBUG] [RX] Received: C5 02                  │
│  [00:05.191] [INFO] [DTC] Success: Recording disabled      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### DO's ✓

```
┌────────────────────────────────────────────────────────────┐
│                  BEST PRACTICES - DO's                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✓ ALWAYS re-enable DTCs after maintenance                  │
│   Reason: Ensure vehicle returns to safe diagnostic state  │
│                                                            │
│ ✓ Use try/finally pattern to guarantee re-enable           │
│   Reason: Even if error occurs, DTCs get re-enabled        │
│                                                            │
│ ✓ Document why DTCs were disabled in service records       │
│   Reason:  Audit trail, regulatory compliance               │
│                                                            │
│ ✓ Read and save existing DTCs before disabling             │
│   Reason: Don't lose information about pre-existing faults  │
│                                                            │
│ ✓ Use Tester Present during long operations                │
│   Reason:  Prevent auto-reset due to session timeout        │
│                                                            │
│ ✓ Use selective control (DTCSettingType) when available    │
│   Reason: Only disable what's needed, keep safety active    │
│                                                            │
│ ✓ Verify DTC state after re-enabling                       │
│   Reason:  Confirm operation succeeded                       │
│                                                            │
│ ✓ Test for new DTCs after maintenance                      │
│   Reason: Verify repair was successful                      │
│                                                            │
│ ✓ Enter correct session (EXTENDED) before trying           │
│   Reason:  Avoid NRC 0x7F errors                             │
│                                                            │
│ ✓ Check security requirements for specific ECU             │
│   Reason: Some ECUs require security unlock                 │
│                                                            │
│ ✓ Minimize time with DTCs disabled                         │
│   Reason: Reduce risk, comply with regulations             │
│                                                            │
│ ✓ Add timeout handling for session auto-reset              │
│   Reason:  Detect and handle unexpected state changes       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### DON'Ts ✗

```
┌────────────────────────────────────────────────────────────┐
│                 BEST PRACTICES - DON'Ts                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✗ Don't leave DTCs disabled after maintenance              │
│   Problem: Vehicle unsafe, regulations violated            │
│   Impact: Safety risk, legal liability                     │
│                                                            │
│ ✗ Don't disable DTCs without documenting reason            │
│   Problem:  Audit trail missing                             │
│   Impact:  Regulatory non-compliance                         │
│                                                            │
│ ✗ Don't try to disable DTCs in DEFAULT session             │
│   Problem:  Will fail with NRC 0x7F                          │
│   Solution: Enter EXTENDED session first                    │
│                                                            │
│ ✗ Don't assume selective control is supported              │
│   Problem: May get NRC 0x31 or 0x12                         │
│   Solution: Check ECU capabilities first                    │
│                                                            │
│ ✗ Don't forget about auto-reset on timeout                 │
│   Problem: DTCs re-enable unexpectedly                      │
│   Solution: Use Tester Present during long work            │
│                                                            │
│ ✗ Don't disable safety DTCs unless absolutely necessary    │
│   Problem: May not be allowed, safety risk                 │
│   Solution:  Use selective control, disable only what needed │
│                                                            │
│ ✗ Don't clear DTCs without reading them first              │
│   Problem: Lose diagnostic history                         │
│   Solution: Always read/save DTCs before clearing          │
│                                                            │
│ ✗ Don't ignore negative responses                          │
│   Problem: Operation may have failed silently              │
│   Solution:  Always check response, handle NRCs             │
│                                                            │
│ ✗ Don't disable DTCs for normal driving                    │
│   Problem:  Illegal, unsafe, unethical                      │
│   Impact: Legal consequences, vehicle damage               │
│                                                            │
│ ✗ Don't use DTC control to hide faults                     │
│   Problem: Masks real issues, safety hazard                │
│   Impact: Vehicle failure, accidents, liability            │
│                                                            │
│ ✗ Don't return vehicle to customer with DTCs disabled      │
│   Problem: Extremely dangerous and illegal                 │
│   Impact:  Serious legal and safety consequences            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Implementation Checklist

```
┌────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION CHECKLIST                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Design Phase:                                              │
│ ☐ Understand ECU-specific requirements                     │
│ ☐ Check if security unlock required                        │
│ ☐ Verify selective control support                         │
│ ☐ Plan for auto-reset scenarios                            │
│ ☐ Design error handling strategy                           │
│                                                            │
│ Implementation Phase:                                       │
│ ☐ Implement session management                             │
│ ☐ Implement security unlock (if needed)                    │
│ ☐ Implement DTC disable (85 02)                            │
│ ☐ Implement DTC enable (85 01)                             │
│ ☐ Implement Tester Present integration                     │
│ ☐ Implement NRC handling                                   │
│ ☐ Implement try/finally pattern                            │
│ ☐ Add state verification                                   │
│ ☐ Add logging/auditing                                     │
│                                                            │
│ Testing Phase:                                              │
│ ☐ Test basic enable/disable                                │
│ ☐ Test wrong session (NRC 0x7F)                            │
│ ☐ Test security requirement (if applicable)                │
│ ☐ Test selective control (if supported)                    │
│ ☐ Test auto-reset on timeout                               │
│ ☐ Test auto-reset on power cycle                           │
│ ☐ Test idempotent behavior                                 │
│ ☐ Test error recovery                                      │
│ ☐ Test with real faults                                    │
│                                                            │
│ Production Readiness:                                       │
│ ☐ Add comprehensive logging                                │
│ ☐ Document all DTC control operations                      │
│ ☐ Create operator training materials                       │
│ ☐ Implement audit trail                                    │
│ ☐ Add safeguards against misuse                            │
│ ☐ Test compliance with regulations                         │
│ ☐ Review legal/safety implications                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**End of Practical Implementation Guide**

For theoretical concepts, see:  `SID_85_CONTROL_DTC_SETTING. md`  
For service interactions, see: `SID_85_SERVICE_INTERACTIONS.md`

---

## ⚠️ CRITICAL SAFETY WARNING

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           ⚠️  CRITICAL SAFETY AND LEGAL WARNING ⚠️           │
│                                                             │
│  • DTC control is a powerful diagnostic tool               │
│  • Misuse can endanger vehicle safety                      │
│  • Misuse may violate emissions regulations                │
│  • Only trained, authorized technicians should use this    │
│  • ALWAYS re-enable DTCs before returning vehicle          │
│  • NEVER use to hide faults or bypass regulations          │
│  • Document all DTC control operations                     │
│                                                             │
│  Legal Consequences of Misuse:                              │
│  • Fines and penalties                                     │
│  • Criminal charges (emissions tampering)                  │
│  • Civil liability for accidents                           │
│  • Loss of technician certification                        │
│                                                             │
│  USE RESPONSIBLY AND ETHICALLY                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```