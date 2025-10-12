# SID 0x22: Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.2

---

## Table of Contents

1. [Request Processing Flow](#request-processing-flow)
2. [DID Lookup Logic](#did-lookup-logic)
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
                    │   (SID 0x22)     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Validate Length  │
               ┌────┤ (1 + N×2 bytes)? │────┐
               │    └──────────────────┘    │
              NO                            YES
               │                             │
               ▼                             ▼
        ┌─────────────┐           ┌──────────────────┐
        │ Return NRC  │           │ Extract DIDs     │
        │    0x13     │           │ from message     │
        └─────────────┘           └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ For each DID:    │
                                  │ 1. Validate      │
                                  │ 2. Check Session │
                                  │ 3. Check Security│
                                  │ 4. Get Data      │
                                  └────────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                   Fail                  Pass                   Fail
                    │                      │                   (Later)
                    ▼                      ▼                      │
            ┌──────────────┐      ┌──────────────┐              │
            │ Return First │      │ Build        │              │
            │ NRC Found    │      │ Response     │◄─────────────┘
            └──────────────┘      │ (0x62 + data)│
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Send Response│
                                  └──────────────┘
```

### Detailed Request Validation Flow

```
         ┌─────────────────────┐
         │ Start Validation    │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Check byte 0 = 0x22?│
         └──────────┬──────────┘
                    │
              ┌─────┴─────┐
             NO           YES
              │             │
              ▼             ▼
         ┌─────────┐   ┌──────────────────┐
         │ Ignore  │   │ Length Check:    │
         │ (not    │   │ (Len-1) mod 2=0? │
         │ 0x22)   │   └────────┬─────────┘
         └─────────┘            │
                          ┌─────┴─────┐
                         NO           YES
                          │             │
                          ▼             ▼
                   ┌──────────┐   ┌──────────────┐
                   │Return NRC│   │ Extract DIDs │
                   │   0x13   │   │ Count =      │
                   └──────────┘   │ (Len-1)/2    │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Proceed to   │
                                  │ DID Lookup   │
                                  └──────────────┘
```

---

## DID Lookup Logic

### DID Table Lookup Process

```
┌────────────────────────────────────────────────────────────┐
│                   DID LOOKUP ALGORITHM                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Input: DID value (2 bytes)                                │
│                                                            │
│  Step 1: Search DID Configuration Table                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ DID Table Structure (Example)                    │     │
│  ├────────┬──────────┬─────────┬──────────┬────────┤     │
│  │  DID   │  Length  │ Session │ Security │ Handler│     │
│  ├────────┼──────────┼─────────┼──────────┼────────┤     │
│  │ 0xF190 │ 17 bytes │ ANY     │ NONE     │ VIN()  │     │
│  │ 0xF18C │ 10 bytes │ ANY     │ NONE     │ SN()   │     │
│  │ 0x0105 │ 1 byte   │ EXT     │ NONE     │ TEMP() │     │
│  │ 0x2000 │ Variable │ EXT     │ L1       │ CAL()  │     │
│  └────────┴──────────┴─────────┴──────────┴────────┘     │
│                                                            │
│  Step 2: Check if DID exists                               │
│  ├─ Found → Continue                                       │
│  └─ Not Found → Return NRC 0x31                            │
│                                                            │
│  Step 3: Validate Session Requirement                      │
│  ├─ Current session matches → Continue                     │
│  └─ Session mismatch → Return NRC 0x7F                     │
│                                                            │
│  Step 4: Validate Security Requirement                     │
│  ├─ Security OK or not needed → Continue                   │
│  └─ Security locked → Return NRC 0x33                      │
│                                                            │
│  Step 5: Check Additional Conditions                       │
│  ├─ Conditions met → Continue                              │
│  └─ Conditions not met → Return NRC 0x22                   │
│                                                            │
│  Step 6: Execute DID Handler & Get Data                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Multi-DID Processing Flow

```
   DID List: [0xF190, 0xF18C, 0x2000]
        │
        ▼
   ┌──────────────┐
   │ Process      │
   │ DID 0xF190   │
   └──────┬───────┘
          │
     ✓ Success
          │
          ▼
   ┌──────────────┐
   │ Store data   │
   │ in buffer    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Process      │
   │ DID 0xF18C   │
   └──────┬───────┘
          │
     ✓ Success
          │
          ▼
   ┌──────────────┐
   │ Append data  │
   │ to buffer    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Process      │
   │ DID 0x2000   │
   └──────┬───────┘
          │
     ✗ Fail (NRC 0x33 - Security)
          │
          ▼
   ┌──────────────┐
   │ Discard      │
   │ buffer       │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Return NRC   │
   │    0x33      │
   └──────────────┘

   ⚠️ IMPORTANT: If ANY DID fails, entire request fails!
```

---

## NRC Decision Trees

### Master NRC Decision Tree

```
                        Start Processing
                              │
                              ▼
                    ┌──────────────────┐
                    │ Message length   │
               ┌────┤ = 1 + (N×2)?     │────┐
              NO    └──────────────────┘   YES
               │                             │
               ▼                             ▼
          NRC 0x13                  ┌────────────────┐
                                    │ All DIDs exist │
                               ┌────┤ in ECU?        │────┐
                              NO    └────────────────┘   YES
                               │                           │
                               ▼                           ▼
                          NRC 0x31              ┌──────────────────┐
                                                │ Session          │
                                           ┌────┤ requirements OK? │────┐
                                          NO    └──────────────────┘   YES
                                           │                             │
                                           ▼                             ▼
                                      NRC 0x7F              ┌─────────────────┐
                                                            │ Security        │
                                                       ┌────┤ requirements OK?│────┐
                                                      NO    └─────────────────┘   YES
                                                       │                            │
                                                       ▼                            ▼
                                                  NRC 0x33              ┌────────────────┐
                                                                        │ Vehicle        │
                                                                   ┌────┤ conditions OK? │────┐
                                                                  NO    └────────────────┘   YES
                                                                   │                           │
                                                                   ▼                           ▼
                                                              NRC 0x22              ┌──────────────┐
                                                                                    │ Response     │
                                                                               ┌────┤ fits buffer? │────┐
                                                                              NO    └──────────────┘   YES
                                                                               │                         │
                                                                               ▼                         ▼
                                                                          NRC 0x14              Positive Response
                                                                                                      0x62
```

### Specific Condition Decision Trees

#### Session Validation Tree

```
       Current Session?
              │
    ┌─────────┼─────────┬─────────┐
    │         │         │         │
DEFAULT    EXTENDED  PROGRAMMING OTHER
    │         │         │         │
    ▼         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  DID   │ │  DID   │ │  DID   │ │ Return │
│requires│ │requires│ │requires│ │NRC 0x7F│
└───┬────┘ └───┬────┘ └───┬────┘ └────────┘
    │          │          │
    ▼          ▼          ▼
Compare   Compare    Compare
    │          │          │
┌───┴───┐  ┌───┴───┐  ┌───┴───┐
│       │  │       │  │       │
OK     Fail OK    Fail OK    Fail
│       │  │       │  │       │
▼       ▼  ▼       ▼  ▼       ▼
Continue  NRC Continue NRC Continue NRC
         0x7F        0x7F         0x7F
```

#### Security Validation Tree

```
       DID Security Level Required?
                  │
        ┌─────────┼─────────┐
        │         │         │
      NONE       L1      L2/L3
        │         │         │
        ▼         ▼         ▼
    Continue  ┌────────┐ ┌────────┐
              │Security│ │Security│
              │Unlocked│ │Unlocked│
              │   ?    │ │   ?    │
              └───┬────┘ └───┬────┘
                  │          │
            ┌─────┴─────┐ ┌──┴──────┐
           YES          NO YES      NO
            │            │  │        │
            ▼            ▼  ▼        ▼
        ┌────────┐  ┌────────┐  ┌────────┐
        │ Check  │  │ Return │  │ Return │
        │ Level  │  │NRC 0x33│  │NRC 0x33│
        │ Match  │  └────────┘  └────────┘
        └───┬────┘
            │
      ┌─────┴─────┐
     Match     Mismatch
      │            │
      ▼            ▼
  Continue    NRC 0x33
```

---

## State Machine Diagrams

### Session State Transitions with SID 0x22

```
┌──────────────────────────────────────────────────────────────┐
│              SESSION STATE MACHINE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│        ┌─────────────────────────────────┐                  │
│        │   DEFAULT SESSION (0x01)        │                  │
│        │                                 │                  │
│        │  Available DIDs:                │                  │
│        │  • VIN (0xF190)                 │                  │
│        │  • Serial (0xF18C)              │                  │
│        │  • Basic Info DIDs              │                  │
│        └─────────┬───────────────────────┘                  │
│                  │                                          │
│                  │ SID 0x10 0x03                            │
│                  │ (Enter Extended)                         │
│                  ▼                                          │
│        ┌─────────────────────────────────┐                  │
│        │  EXTENDED SESSION (0x03)        │                  │
│        │                                 │                  │
│        │  Available DIDs:                │                  │
│        │  • All DEFAULT DIDs             │                  │
│        │  • Live Sensor Data             │                  │
│        │  • Runtime Parameters           │                  │
│        │  • Secured DIDs (if unlocked)   │                  │
│        └─────────┬───────────────────────┘                  │
│                  │                                          │
│                  │ SID 0x10 0x02                            │
│                  │ (Enter Programming)                      │
│                  ▼                                          │
│        ┌─────────────────────────────────┐                  │
│        │ PROGRAMMING SESSION (0x02)      │                  │
│        │                                 │                  │
│        │  Available DIDs:                │                  │
│        │  • Programming Status           │                  │
│        │  • Flash State                  │                  │
│        │  • Limited Diagnostic DIDs      │                  │
│        └─────────────────────────────────┘                  │
│                                                              │
│   Timeout or SID 0x10 0x01 returns to DEFAULT               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Security State Transitions

```
┌──────────────────────────────────────────────────────────────┐
│            SECURITY STATE FOR DID ACCESS                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐                                          │
│  │  LOCKED 🔒     │                                          │
│  │                │                                          │
│  │  SID 0x22:     │                                          │
│  │  • Public DIDs │────────────────────┐                    │
│  │    ✓ Allowed   │                    │                    │
│  │  • Secured DIDs│                    │                    │
│  │    ✗ NRC 0x33  │                    │                    │
│  └────────┬───────┘                    │                    │
│           │                            │                    │
│           │ SID 0x27 (Request Seed)    │                    │
│           ▼                            │                    │
│  ┌────────────────┐                    │                    │
│  │ SEED SENT      │                    │                    │
│  └────────┬───────┘                    │                    │
│           │                            │                    │
│           │ SID 0x27 (Send Key)        │                    │
│           ▼                            │                    │
│     ┌─────┴──────┐                     │                    │
│    Correct    Wrong                    │                    │
│     │            │                     │                    │
│     ▼            ▼                     │                    │
│  ┌────────┐  ┌────────┐               │                    │
│  │UNLOCKED│  │LOCKED  │               │                    │
│  │  🔓    │  │COUNTER++│──────────────┘                    │
│  │        │  └────────┘                                    │
│  │SID 0x22│                                                 │
│  │ • All  │                                                 │
│  │  DIDs  │                                                 │
│  │  ✓ OK  │                                                 │
│  └────┬───┘                                                 │
│       │                                                     │
│       │ Timeout (5s) or Session Change                      │
│       ▼                                                     │
│  ┌────────────────┐                                          │
│  │  LOCKED 🔒     │                                          │
│  │  (Auto-lock)   │                                          │
│  └────────────────┘                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Basic VIN Read

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Read Vehicle Identification Number                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session: DEFAULT                                         │
│ • Security: LOCKED (not needed)                            │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  22 F1 90              │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Lookup DID 0xF190]        │
│     │                         │ [Found: VIN, 17 bytes]     │
│     │                         │ [Session: OK]              │
│     │                         │ [Security: Not required]   │
│     │                         │ [Get VIN data]             │
│     │                         │                            │
│     │  62 F1 90 + [17 bytes]  │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Response: 0x62 F1 90 [VIN data]                            │
│                                                            │
│ Verify:                                                    │
│ • Response starts with 0x62                                │
│ • DID echoed back (F1 90)                                  │
│ • Data length = 17 bytes                                   │
│ • VIN format valid (alphanumeric)                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 2: Multiple DIDs Read

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Read VIN + Serial Number + SW Version               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session: DEFAULT                                         │
│ • Security: LOCKED (not needed)                            │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  22 F190 F18C F189      │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Process DID 0xF190: OK]   │
│     │                         │ [Process DID 0xF18C: OK]   │
│     │                         │ [Process DID 0xF189: OK]   │
│     │                         │ [Build combined response]  │
│     │                         │                            │
│     │  62 F190[17B] F18C[10B] │                            │
│     │     F189[variable]      │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ SUCCESS                                 │
│ Response contains all three DIDs + data                    │
│                                                            │
│ Verify:                                                    │
│ • All DIDs echoed in order requested                       │
│ • All data present and correct length                      │
│ • Total message length reasonable                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 3: Invalid DID (NRC 0x31)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Request non-existent DID                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  22 99 99              │ (DID 0x9999 doesn't exist) │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Search DID table]         │
│     │                         │ [0x9999 NOT FOUND]         │
│     │                         │                            │
│     │  7F 22 31              │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x31 (Request Out Of Range)                            │
│                                                            │
│ Verify:                                                    │
│ • Byte 0 = 0x7F                                            │
│ • Byte 1 = 0x22 (requested SID)                            │
│ • Byte 2 = 0x31 (NRC)                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 4: Wrong Session (NRC 0x7F)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Read EXTENDED-only DID in DEFAULT session           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session: DEFAULT                                         │
│ • Target DID: 0x0105 (requires EXTENDED)                   │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  22 01 05              │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Found DID 0x0105]         │
│     │                         │ [Requires: EXTENDED]       │
│     │                         │ [Current: DEFAULT]         │
│     │                         │ [MISMATCH!]                │
│     │                         │                            │
│     │  7F 22 7F              │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x7F (Service Not Supported In Active Session)        │
│                                                            │
│ Solution: Switch to EXTENDED session first (SID 0x10 0x03) │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Test Case 5: Security Required (NRC 0x33)

```
┌────────────────────────────────────────────────────────────┐
│ TEST: Read secured DID without unlock                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Setup:                                                     │
│ • Session: EXTENDED                                        │
│ • Security: LOCKED                                         │
│ • Target DID: 0x2000 (requires security Level 1)           │
│                                                            │
│ Test Steps:                                                │
│                                                            │
│   Tester                     ECU                           │
│     │                         │                            │
│     │  22 20 00              │                            │
│     │────────────────────────>│                            │
│     │                         │                            │
│     │                         │ [Found DID 0x2000]         │
│     │                         │ [Requires: Security L1]    │
│     │                         │ [Current: LOCKED 🔒]       │
│     │                         │ [DENIED!]                  │
│     │                         │                            │
│     │  7F 22 33              │                            │
│     │<────────────────────────│                            │
│     │                         │                            │
│                                                            │
│ Expected Result: ✓ NEGATIVE RESPONSE                       │
│ NRC 0x33 (Security Access Denied)                          │
│                                                            │
│ Solution: Unlock security first using SID 0x27             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Session + Read Flow

```
Tester                      ECU
  │                          │
  │ 1. Enter EXTENDED        │
  │    10 03                 │
  │─────────────────────────>│
  │                          │
  │    50 03                 │
  │<─────────────────────────│
  │                          │
  │ 2. Read Sensor DIDs      │
  │    22 0105 010C          │
  │─────────────────────────>│
  │                          │
  │    62 0105[data]         │
  │       010C[data]         │
  │<─────────────────────────│
  │                          │
  │ 3. Return to DEFAULT     │
  │    10 01                 │
  │─────────────────────────>│
  │                          │
  │    50 01                 │
  │<─────────────────────────│
  │                          │
```

### Pattern 2: Security + Read Flow

```
Tester                      ECU
  │                          │
  │ 1. Extended Session      │
  │    10 03                 │
  │─────────────────────────>│
  │    50 03                 │
  │<─────────────────────────│
  │                          │
  │ 2. Request Seed          │
  │    27 01                 │
  │─────────────────────────>│
  │    67 01 [seed]          │
  │<─────────────────────────│
  │                          │
  │ 3. Send Key              │
  │    27 02 [key]           │
  │─────────────────────────>│
  │    67 02   🔓            │
  │<─────────────────────────│
  │                          │
  │ 4. Read Secured DID      │
  │    22 2000               │
  │─────────────────────────>│
  │    62 2000 [data]        │
  │<─────────────────────────│
  │                          │
```

---

## Debugging Guide

### Common Issues Checklist

```
┌────────────────────────────────────────────────────────────┐
│              TROUBLESHOOTING CHECKLIST                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Issue: No response from ECU                                │
│ ☐ Is ECU powered?                                          │
│ ☐ Is CAN bus connected?                                    │
│ ☐ Correct baud rate?                                       │
│ ☐ Correct addressing (functional/physical)?                │
│                                                            │
│ Issue: NRC 0x13 (Incorrect Message Length)                 │
│ ☐ Message = 1 + (N × 2) bytes?                             │
│ ☐ Each DID has both high and low byte?                     │
│ ☐ No extra bytes in message?                               │
│                                                            │
│ Issue: NRC 0x31 (Request Out Of Range)                     │
│ ☐ DID exists in this ECU?                                  │
│ ☐ Check ODX/CDD file for supported DIDs                    │
│ ☐ DID byte order correct (big-endian)?                     │
│                                                            │
│ Issue: NRC 0x7F (Service Not Supported In Active Session)  │
│ ☐ Current session correct?                                 │
│ ☐ Use SID 0x22 F186 to check active session                │
│ ☐ Switch session first (SID 0x10)                          │
│                                                            │
│ Issue: NRC 0x33 (Security Access Denied)                   │
│ ☐ Security unlocked?                                       │
│ ☐ Correct security level?                                  │
│ ☐ Security timeout expired?                                │
│ ☐ Too many failed attempts?                                │
│                                                            │
│ Issue: NRC 0x22 (Conditions Not Correct)                   │
│ ☐ Vehicle state correct (speed, gear, etc.)?               │
│ ☐ Engine running if needed?                                │
│ ☐ Sensor initialized?                                      │
│ ☐ Voltage in acceptable range?                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### DO's ✓

```
┌────────────────────────────────────────────────────────────┐
│                  BEST PRACTICES - DO's                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✓ Verify DID support using ODX/CDD files                   │
│                                                            │
│ ✓ Check session requirements before reading                │
│                                                            │
│ ✓ Unlock security if needed (SID 0x27)                     │
│                                                            │
│ ✓ Handle NRC 0x78 (Response Pending) properly              │
│                                                            │
│ ✓ Request multiple DIDs in one message when possible       │
│                                                            │
│ ✓ Validate response DID echo matches request               │
│                                                            │
│ ✓ Check data length matches expected value                 │
│                                                            │
│ ✓ Parse multi-DID responses carefully (DID+data pairs)     │
│                                                            │
│ ✓ Use proper timeout values (P2/P2*)                       │
│                                                            │
│ ✓ Log all requests and responses for debugging             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### DON'Ts ✗

```
┌────────────────────────────────────────────────────────────┐
│                 BEST PRACTICES - DON'Ts                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✗ Don't request too many large DIDs at once                │
│   (may exceed buffer → NRC 0x14)                           │
│                                                            │
│ ✗ Don't assume all DIDs available in all sessions          │
│   (check requirements first)                               │
│                                                            │
│ ✗ Don't ignore negative responses                          │
│   (they contain important diagnostic info)                 │
│                                                            │
│ ✗ Don't hard-code DID lists                                │
│   (different ECUs support different DIDs)                  │
│                                                            │
│ ✗ Don't read secured DIDs without unlocking                │
│   (will always fail with NRC 0x33)                         │
│                                                            │
│ ✗ Don't forget to maintain session                         │
│   (use TesterPresent SID 0x3E to prevent timeout)          │
│                                                            │
│ ✗ Don't mix little-endian and big-endian                   │
│   (UDS uses big-endian for DIDs)                           │
│                                                            │
│ ✗ Don't retry immediately after NRC 0x22                   │
│   (conditions won't change instantly)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**End of Practical Implementation Guide**

For theoretical concepts, see: `SID_22_READ_DATA_BY_IDENTIFIER.md`  
For service interactions, see: `SID_22_SERVICE_INTERACTIONS.md`
