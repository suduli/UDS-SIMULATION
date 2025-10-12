# SID 0x28: Communication Control - Practical Implementation Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## Table of Contents

1. [Overview](#overview)
2. [Request Processing Flowchart](#request-processing-flowchart)
3. [Control Type Decision Tree](#control-type-decision-tree)
4. [Communication Type Validation](#communication-type-validation)
5. [State Machine Diagrams](#state-machine-diagrams)
6. [NRC Decision Trees](#nrc-decision-trees)
7. [Subnet Targeting Logic](#subnet-targeting-logic)
8. [Session and Security Validation](#session-and-security-validation)
9. [Communication State Management](#communication-state-management)
10. [Testing Scenarios](#testing-scenarios)
11. [Integration Patterns](#integration-patterns)
12. [Debugging Flowcharts](#debugging-flowcharts)
13. [Best Practices Checklist](#best-practices-checklist)

---

## Overview

This document provides **hands-on implementation guidance** for SID 0x28 (Communication Control) using:
- **Flowcharts** for request processing logic
- **State machines** for communication state transitions
- **Decision trees** for NRC generation
- **Testing scenarios** with expected outcomes
- **Debugging techniques** for common issues

**Target Audience**: Developers implementing UDS simulators, ECU firmware, or diagnostic tools

---

## Request Processing Flowchart

### Complete Request Processing Flow

```
                    ┌──────────────────────┐
                    │  Receive Request     │
                    │  [28 XX XX ...]      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Check Message       │
                    │  Length              │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
          Length = 3     Length = 5    Length = other
           (No Node)     (With Node)         │
                │              │              │
                │              │              ▼
                │              │      ┌──────────────┐
                │              │      │ Return NRC   │
                │              │      │ 0x13         │
                │              │      └──────────────┘
                │              │
                └──────┬───────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Validate Session    │
            │  (Extended or        │
            │   Programming?)      │
            └──────────┬───────────┘
                       │
            ┌──────────┼──────────┐
            │                     │
         Valid               Invalid
            │                     │
            │                     ▼
            │             ┌──────────────┐
            │             │ Return NRC   │
            │             │ 0x7F         │
            │             └──────────────┘
            │
            ▼
┌──────────────────────┐
│  Check Security      │
│  (If required)       │
└──────────┬───────────┘
           │
┌──────────┼──────────┐
│                     │
Unlocked          Locked
│                     │
│                     ▼
│             ┌──────────────┐
│             │ Return NRC   │
│             │ 0x33         │
│             └──────────────┘
│
▼
┌──────────────────────┐
│  Validate Control    │
│  Type (Byte 1)       │
│  0x00-0x05           │
└──────────┬───────────┘
           │
┌──────────┼──────────┐
│                     │
Valid             Invalid
│                     │
│                     ▼
│             ┌──────────────┐
│             │ Return NRC   │
│             │ 0x12         │
│             └──────────────┘
│
▼
┌──────────────────────┐
│  Validate Comm Type  │
│  (Byte 2)            │
│  0x01-0x03           │
└──────────┬───────────┘
           │
┌──────────┼──────────┐
│                     │
Valid             Invalid
│                     │
│                     ▼
│             ┌──────────────┐
│             │ Return NRC   │
│             │ 0x31         │
│             └──────────────┘
│
▼
┌──────────────────────┐
│  Check ECU State     │
│  (Conditions OK?)    │
└──────────┬───────────┘
           │
┌──────────┼──────────┐
│                     │
OK                Not OK
│                     │
│                     ▼
│             ┌──────────────┐
│             │ Return NRC   │
│             │ 0x22         │
│             └──────────────┘
│
▼
┌──────────────────────┐
│  Apply Communication │
│  Control             │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Update Internal     │
│  State Flags         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Send Positive       │
│  Response [68 XX]    │
└──────────────────────┘
```

---

## Control Type Decision Tree

### Determining RX/TX State

```
                    Control Type Byte?
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     0x00               0x01               0x02
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐       ┌─────────┐
   │ RX: ON  │        │ RX: ON  │       │ RX: OFF │
   │ TX: OFF │        │ TX: ON  │       │ TX: ON  │
   └─────────┘        └─────────┘       └─────────┘
        │                  │                  │
        │                  │                  │
        │         ┌────────┴────────┐         │
        │         │                 │         │
        │      0x03              0x04-0x05    │
        │         │                 │         │
        │         ▼                 ▼         │
        │    ┌─────────┐       ┌─────────┐   │
        │    │ RX: OFF │       │Enhanced │   │
        │    │ TX: OFF │       │Addressing│   │
        │    └─────────┘       └─────────┘   │
        │                                     │
        └──────────────┬──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ Update Communication │
            │ State Flags          │
            └──────────────────────┘
```

### Implementation Logic

```
┌────────────────────────────────────────────────────┐
│ Pseudo-Logic for Control Type Processing          │
├────────────────────────────────────────────────────┤
│                                                    │
│  IF Control Type = 0x00:                          │
│     SET RX_ENABLED = TRUE                         │
│     SET TX_ENABLED = FALSE                        │
│                                                    │
│  ELSE IF Control Type = 0x01:                     │
│     SET RX_ENABLED = TRUE                         │
│     SET TX_ENABLED = TRUE                         │
│                                                    │
│  ELSE IF Control Type = 0x02:                     │
│     SET RX_ENABLED = FALSE                        │
│     SET TX_ENABLED = TRUE                         │
│                                                    │
│  ELSE IF Control Type = 0x03:                     │
│     SET RX_ENABLED = FALSE                        │
│     SET TX_ENABLED = FALSE                        │
│                                                    │
│  ELSE IF Control Type = 0x04 OR 0x05:             │
│     HANDLE_ENHANCED_ADDRESSING()                  │
│                                                    │
│  ELSE:                                            │
│     RETURN NRC 0x12 (Sub-Function Not Supported)  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Communication Type Validation

### Communication Type Decision Flow

```
                Communication Type Byte?
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     0x01               0x02               0x03
        │                  │                  │
        ▼                  ▼                  ▼
   ┌──────────┐       ┌──────────┐      ┌──────────┐
   │ Normal   │       │ Network  │      │ Both     │
   │ Messages │       │ Mgmt     │      │ Types    │
   │ Only     │       │ Only     │      │          │
   └────┬─────┘       └────┬─────┘      └────┬─────┘
        │                  │                  │
        ▼                  ▼                  ▼
   ┌──────────┐       ┌──────────┐      ┌──────────┐
   │ Control  │       │ Control  │      │ Control  │
   │ App Data │       │ NM Msgs  │      │ ALL Non- │
   │ Transmit │       │ Transmit │      │ Diag Msg │
   └──────────┘       └──────────┘      └──────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Apply to Target │
                  │ (All or Subnet) │
                  └─────────────────┘
```

### Validation Logic

```
┌────────────────────────────────────────────────────┐
│ Communication Type Validation                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  READ communication_type FROM request[2]           │
│                                                    │
│  IF communication_type = 0x01:                    │
│     TARGET = NORMAL_MESSAGES                      │
│     VALID = TRUE                                  │
│                                                    │
│  ELSE IF communication_type = 0x02:               │
│     TARGET = NETWORK_MANAGEMENT_MESSAGES          │
│     VALID = TRUE                                  │
│                                                    │
│  ELSE IF communication_type = 0x03:               │
│     TARGET = ALL_NON_DIAGNOSTIC_MESSAGES          │
│     VALID = TRUE                                  │
│                                                    │
│  ELSE:                                            │
│     RETURN NRC 0x31 (Request Out Of Range)        │
│                                                    │
│  APPLY control_type TO TARGET messages            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## State Machine Diagrams

### Communication Control State Machine

```
                    ┌─────────────────────┐
        ┌───────────│   NORMAL_MODE       │◄──────────┐
        │           │   RX: ✅  TX: ✅    │           │
        │           └──────────┬──────────┘           │
        │                      │                      │
        │         ┌────────────┼────────────┐         │
        │         │            │            │         │
        │    [28 00 XX]   [28 03 XX]  [28 02 XX]     │
        │         │            │            │         │
        │         ▼            ▼            ▼         │
        │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
        │  │RX_ONLY   │ │ISOLATED  │ │TX_ONLY   │    │
        │  │RX: ✅    │ │RX: ❌    │ │RX: ❌    │    │
        │  │TX: ❌    │ │TX: ❌    │ │TX: ✅    │    │
        │  └────┬─────┘ └────┬─────┘ └────┬─────┘    │
        │       │            │            │           │
        │       └────────────┴────────────┘           │
        │                    │                        │
        │              [28 01 XX]                     │
        │                    │                        │
        └────────────────────┘                        │
                                                      │
        ┌─────────────────────────────────────────────┘
        │
        │ Auto-Restore Triggers:
        │   • ECU Reset (SID 0x11)
        │   • Session Timeout → Default
        │   • Power Cycle
        │
        └─────────────────────────────────────────────┐
                                                      │
                                                      ▼
                                              ┌─────────────┐
                                              │NORMAL_MODE  │
                                              │(Restored)   │
                                              └─────────────┘
```

### Session-Aware State Transitions

```
  Session State          Communication State
┌──────────────┐        ┌──────────────────┐
│  DEFAULT     │        │  NORMAL_MODE     │
│  (0x01)      │───────▶│  (Always)        │
└──────────────┘        └──────────────────┘
       │ 
       │ [10 03]
       ▼
┌──────────────┐        ┌──────────────────┐
│  EXTENDED    │        │  Can Control     │
│  (0x03)      │◄──────▶│  Communication   │
└──────────────┘        └──────────────────┘
       │                         │
       │                         │ [28 03 03]
       │                         ▼
       │                ┌──────────────────┐
       │                │  ISOLATED        │
       │                │  RX:❌ TX:❌     │
       │                └────────┬─────────┘
       │                         │
       │ Session Timeout         │
       │ (> S3_Server)           │
       ▼                         │
┌──────────────┐                 │
│  DEFAULT     │                 │
│  (Auto)      │                 │
└──────────────┘                 │
       │                         │
       └─────────────────────────┘
                │
                ▼
        ┌──────────────────┐
        │  NORMAL_MODE     │
        │  (Auto-Restored) │
        └──────────────────┘
```

---

## NRC Decision Trees

### NRC 0x12: Sub-Function Not Supported

```
                   Control Type Valid?
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    0x00-0x03          0x04-0x05          Others
        │                  │                  │
        ▼                  ▼                  ▼
    ✅ VALID         Enhanced Support?    ❌ INVALID
        │                  │                  │
        │         ┌────────┴────────┐         │
        │         │                 │         │
        │    Supported        Not Supported   │
        │         │                 │         │
        │         ▼                 ▼         │
        │     ✅ VALID         ❌ INVALID     │
        │                           │         │
        └───────────────────────────┴─────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │ Return NRC   │
                            │ 0x12         │
                            └──────────────┘
```

### NRC 0x13: Incorrect Message Length

```
                   Message Length?
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Length = 3        Length = 5        Other Length
        │                  │                  │
        ▼                  ▼                  ▼
   ✅ VALID           ✅ VALID           ❌ INVALID
   (No Node ID)       (With Node ID)         │
        │                  │                  │
        └──────────────────┘                  │
                │                             │
                ▼                             ▼
        Process Request                ┌──────────────┐
                                       │ Return NRC   │
                                       │ 0x13         │
                                       └──────────────┘

Examples:
✅ [28 03 03]           → Length 3 (VALID)
✅ [28 03 03 F0 00]     → Length 5 (VALID)
❌ [28 03]              → Length 2 (INVALID - missing comm type)
❌ [28 03 03 F0]        → Length 4 (INVALID - incomplete Node ID)
❌ [28 03 03 F0 00 XX]  → Length 6 (INVALID - extra byte)
```

### NRC 0x22: Conditions Not Correct

```
                    ECU Conditions Check
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    Vehicle Moving?   Flash Active?    Critical System?
         │                  │                  │
    ┌────┴────┐        ┌────┴────┐       ┌────┴────┐
    │         │        │         │       │         │
   Yes       No       Yes       No      Yes       No
    │         │        │         │       │         │
    ▼         │        ▼         │       ▼         │
   NRC        │       NRC        │      NRC        │
   0x22       │       0x22       │      0x22       │
              │                  │                 │
              └──────────────────┴─────────────────┘
                               │
                               ▼
                        ALL CONDITIONS OK
                               │
                               ▼
                        Process Request
```

### NRC 0x31: Request Out Of Range

```
            Communication Type Byte Value?
                        │
        ┌───────────────┼───────────────┐
        │               │               │
      0x01            0x02            0x03
        │               │               │
        ▼               ▼               ▼
    ✅ VALID        ✅ VALID        ✅ VALID
   (Normal Msg)    (NM Msg)       (Both)
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
                 Process Request

            Any other value (0x00, 0x04+)?
                        │
                        ▼
                 ┌──────────────┐
                 │ Return NRC   │
                 │ 0x31         │
                 └──────────────┘
```

### NRC 0x33: Security Access Denied

```
                Security Required?
                        │
        ┌───────────────┼───────────────┐
        │                               │
     Required                      Not Required
        │                               │
        ▼                               ▼
   Check Security State          Process Request
        │
    ┌───┴────┐
    │        │
 Locked   Unlocked
    │        │
    ▼        ▼
   NRC    Continue
   0x33   Processing
```

### NRC 0x7F: Service Not Supported In Active Session

```
                Current Session?
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    DEFAULT        EXTENDED       PROGRAMMING
      0x01            0x03            0x02
        │               │               │
        ▼               ▼               ▼
   ❌ NOT           ✅ ALLOWED      ✅ ALLOWED
    ALLOWED
        │               │               │
        │               └───────────────┘
        │                       │
        ▼                       ▼
  ┌──────────────┐      Process Request
  │ Return NRC   │
  │ 0x7F         │
  └──────────────┘
```

---

## Subnet Targeting Logic

### Node ID Processing Flow

```
                  Message Length?
                        │
        ┌───────────────┴───────────────┐
        │                               │
    Length = 3                      Length = 5
 (No Node ID)                    (With Node ID)
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Apply to ALL     │          │ Extract Node ID  │
│ Subnets/Nodes    │          │ Bytes 3-4        │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │                              ▼
         │                    ┌──────────────────┐
         │                    │ Parse:           │
         │                    │ High Byte = B[3] │
         │                    │ Low Byte  = B[4] │
         │                    └────────┬─────────┘
         │                              │
         │                              ▼
         │                    ┌──────────────────┐
         │                    │ Node ID =        │
         │                    │ (B[3] << 8)|B[4] │
         │                    └────────┬─────────┘
         │                              │
         │                              ▼
         │                    ┌──────────────────┐
         │                    │ Apply ONLY to    │
         │                    │ Specified Node   │
         │                    └────────┬─────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ Update Comm      │
              │ State for Target │
              └──────────────────┘
```

### Subnet Matching Logic

```
┌────────────────────────────────────────────────────┐
│ Subnet Targeting Algorithm                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  IF message_length = 3:                           │
│     // No Node ID specified                       │
│     FOR EACH subnet IN vehicle_network:           │
│        FOR EACH node IN subnet:                   │
│           APPLY communication_control(node)       │
│                                                    │
│  ELSE IF message_length = 5:                      │
│     // Node ID specified                          │
│     target_node_id = (request[3] << 8) | request[4]│
│                                                    │
│     FOR EACH node IN vehicle_network:             │
│        IF node.id = target_node_id:               │
│           APPLY communication_control(node)       │
│        ELSE:                                      │
│           SKIP (leave unchanged)                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Example: Multi-Subnet Vehicle

```
┌─────────────────────────────────────────────────────┐
│ Vehicle Network Topology                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Subnet 0xF0 (Powertrain)                           │
│    ├─ Node 0xF010 (Engine ECU)                      │
│    ├─ Node 0xF020 (Transmission ECU)                │
│    └─ Node 0xF030 (Hybrid Controller)               │
│                                                     │
│  Subnet 0xF1 (Chassis)                              │
│    ├─ Node 0xF110 (ABS ECU)                         │
│    ├─ Node 0xF120 (Steering ECU)                    │
│    └─ Node 0xF130 (Suspension ECU)                  │
│                                                     │
│  Subnet 0xF2 (Body)                                 │
│    ├─ Node 0xF210 (BCM)                             │
│    ├─ Node 0xF220 (Door Module L)                   │
│    └─ Node 0xF230 (Door Module R)                   │
│                                                     │
└─────────────────────────────────────────────────────┘

Command: [28 03 03]
Effect: ALL nodes disabled (RX:❌ TX:❌)

Command: [28 03 03 F0 00]
Effect: 
  - Subnet 0xF0 nodes: DISABLED (0xF010, 0xF020, 0xF030)
  - Other subnets: UNCHANGED

Command: [28 03 03 F1 10]
Effect:
  - Node 0xF110 (ABS): DISABLED
  - All other nodes: UNCHANGED
```

---

## Session and Security Validation

### Session Validation Flow

```
                Session Validation
                        │
                        ▼
            ┌─────────────────────┐
            │ Read Current Session│
            └──────────┬──────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    DEFAULT        EXTENDED      PROGRAMMING
      0x01           0x03           0x02
        │              │              │
        ▼              ▼              ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │Return NRC│   │ ALLOWED  │   │ ALLOWED  │
  │  0x7F    │   │Continue  │   │Continue  │
  └──────────┘   └────┬─────┘   └────┬─────┘
                      │              │
                      └──────┬───────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ Proceed to Security│
                  │ Check              │
                  └────────────────────┘
```

### Security Validation Flow

```
              Security Check Required?
                        │
        ┌───────────────┴───────────────┐
        │                               │
    Required                      Not Required
        │                               │
        ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│ Check Security  │            │ Skip Security   │
│ State           │            │ Check           │
└────────┬────────┘            └────────┬────────┘
         │                              │
    ┌────┴────┐                         │
    │         │                         │
 LOCKED   UNLOCKED                      │
    │         │                         │
    ▼         ▼                         │
  NRC      Continue                     │
  0x33                                  │
            │                           │
            └───────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Process Control │
              │ Request         │
              └─────────────────┘
```

### Combined Session + Security Check

```
┌────────────────────────────────────────────────────┐
│ Complete Access Validation                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  STEP 1: Check Session                            │
│    IF current_session = DEFAULT:                  │
│       RETURN NRC 0x7F                             │
│                                                    │
│  STEP 2: Check Security (if required)             │
│    IF security_required:                          │
│       IF security_state = LOCKED:                 │
│          RETURN NRC 0x33                          │
│                                                    │
│  STEP 3: All Checks Passed                        │
│    PROCEED to communication control               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Communication State Management

### State Flag Structure

```
┌────────────────────────────────────────────────────┐
│ Communication State Flags (Internal ECU State)     │
├────────────────────────────────────────────────────┤
│                                                    │
│  NORMAL_MESSAGES_RX_ENABLED    : Boolean           │
│  NORMAL_MESSAGES_TX_ENABLED    : Boolean           │
│  NM_MESSAGES_RX_ENABLED        : Boolean           │
│  NM_MESSAGES_TX_ENABLED        : Boolean           │
│  DIAGNOSTIC_RX_ENABLED         : Boolean (always)  │
│  DIAGNOSTIC_TX_ENABLED         : Boolean (always)  │
│  TARGETED_SUBNET               : uint16 or NULL    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### State Update Logic

```
┌────────────────────────────────────────────────────┐
│ Apply Communication Control                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  INPUT:                                           │
│    control_type      (byte 1)                     │
│    communication_type (byte 2)                     │
│    node_id           (bytes 3-4, optional)        │
│                                                    │
│  DETERMINE RX/TX states from control_type:        │
│    (0x00 → RX:ON, TX:OFF)                         │
│    (0x01 → RX:ON, TX:ON)                          │
│    (0x03 → RX:OFF, TX:OFF)                        │
│    etc.                                           │
│                                                    │
│  DETERMINE message target from communication_type: │
│    (0x01 → Normal messages)                       │
│    (0x02 → NM messages)                           │
│    (0x03 → Both)                                  │
│                                                    │
│  UPDATE FLAGS:                                    │
│    IF communication_type = 0x01 OR 0x03:          │
│       SET NORMAL_MESSAGES_RX = calculated_rx      │
│       SET NORMAL_MESSAGES_TX = calculated_tx      │
│                                                    │
│    IF communication_type = 0x02 OR 0x03:          │
│       SET NM_MESSAGES_RX = calculated_rx          │
│       SET NM_MESSAGES_TX = calculated_tx          │
│                                                    │
│  SAVE targeted_subnet = node_id (if provided)     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Message Transmission Check

```
┌────────────────────────────────────────────────────┐
│ Before Transmitting Any Message                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  IF message_type = DIAGNOSTIC:                    │
│     ALLOW (diagnostic always enabled)             │
│                                                    │
│  ELSE IF message_type = NORMAL_APPLICATION:       │
│     IF NORMAL_MESSAGES_TX_ENABLED = TRUE:         │
│        CHECK subnet match (if targeted):          │
│           IF targeted_subnet = NULL OR            │
│              targeted_subnet = current_subnet:    │
│              ALLOW transmission                   │
│           ELSE:                                   │
│              BLOCK transmission                   │
│     ELSE:                                         │
│        BLOCK transmission                         │
│                                                    │
│  ELSE IF message_type = NETWORK_MANAGEMENT:       │
│     IF NM_MESSAGES_TX_ENABLED = TRUE:             │
│        CHECK subnet match (if targeted):          │
│           ALLOW or BLOCK based on subnet          │
│     ELSE:                                         │
│        BLOCK transmission                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Basic Communication Disable/Enable

```
┌────────────────────────────────────────────────────┐
│ TEST CASE 1: Basic Disable and Re-enable          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Initial State:                                   │
│    Session: DEFAULT                               │
│    RX: ✅  TX: ✅  (Normal operation)             │
│                                                    │
│  Step 1: Enter Extended Session                   │
│    Tester → ECU: [10 03]                          │
│    ECU → Tester: [50 03 00 32 01 F4]              │
│    Result: ✅ Session changed                     │
│                                                    │
│  Step 2: Disable All Communication                │
│    Tester → ECU: [28 03 03]                       │
│    ECU → Tester: [68 03]                          │
│    Result: ✅ Both RX and TX disabled             │
│                                                    │
│  Step 3: Verify State                             │
│    Monitor network traffic                        │
│    Expected: No normal/NM messages from ECU       │
│              Diagnostic messages still work       │
│    Result: ✅ Communication isolated              │
│                                                    │
│  Step 4: Re-enable Communication                  │
│    Tester → ECU: [28 01 03]                       │
│    ECU → Tester: [68 01]                          │
│    Result: ✅ Both RX and TX enabled              │
│                                                    │
│  Step 5: Verify Restoration                       │
│    Monitor network traffic                        │
│    Expected: Normal/NM messages resume            │
│    Result: ✅ PASS                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 2: Security-Protected Operation

```
┌────────────────────────────────────────────────────┐
│ TEST CASE 2: Communication Control with Security  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Precondition: ECU requires security for SID 0x28 │
│                                                    │
│  Step 1: Enter Extended Session                   │
│    Tester → ECU: [10 03]                          │
│    ECU → Tester: [50 03 ...]                      │
│    Result: ✅ Session active                      │
│                                                    │
│  Step 2: Try Without Security (Should Fail)       │
│    Tester → ECU: [28 03 03]                       │
│    ECU → Tester: [7F 28 33]                       │
│    Result: ✅ NRC 0x33 (Security Denied) - EXPECTED│
│                                                    │
│  Step 3: Request Seed                             │
│    Tester → ECU: [27 01]                          │
│    ECU → Tester: [67 01 AB CD EF 12]              │
│    Result: ✅ Seed received                       │
│                                                    │
│  Step 4: Send Key (Calculated from seed)          │
│    Tester → ECU: [27 02 12 34 56 78]              │
│    ECU → Tester: [67 02]                          │
│    Result: ✅ Security unlocked 🔓                │
│                                                    │
│  Step 5: Retry Communication Control              │
│    Tester → ECU: [28 03 03]                       │
│    ECU → Tester: [68 03]                          │
│    Result: ✅ Communication disabled successfully │
│                                                    │
│  Step 6: Verify                                   │
│    Monitor network: No normal/NM messages         │
│    Result: ✅ PASS                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 3: Subnet-Specific Control

```
┌────────────────────────────────────────────────────┐
│ TEST CASE 3: Target Specific Subnet               │
├────────────────────────────────────────────────────┤
│                                                    │
│  Vehicle Network:                                 │
│    Subnet 0xF0 (Powertrain)                       │
│    Subnet 0xF1 (Chassis)                          │
│                                                    │
│  Step 1: Setup                                    │
│    Enter Extended Session: [10 03]                │
│    Result: ✅                                     │
│                                                    │
│  Step 2: Disable Powertrain Subnet Only           │
│    Tester → ECU: [28 03 03 F0 00]                 │
│    ECU → Tester: [68 03]                          │
│    Result: ✅                                     │
│                                                    │
│  Step 3: Verify Subnet 0xF0 Disabled              │
│    Monitor 0xF0 network traffic                   │
│    Expected: No messages from 0xF0 nodes          │
│    Result: ✅ 0xF0 silent                         │
│                                                    │
│  Step 4: Verify Subnet 0xF1 Still Active          │
│    Monitor 0xF1 network traffic                   │
│    Expected: Normal messages continue on 0xF1     │
│    Result: ✅ 0xF1 still active                   │
│                                                    │
│  Step 5: Re-enable Subnet 0xF0                    │
│    Tester → ECU: [28 01 03 F0 00]                 │
│    ECU → Tester: [68 01]                          │
│    Result: ✅                                     │
│                                                    │
│  Step 6: Verify Full Restoration                  │
│    Monitor all subnets                            │
│    Expected: All subnets transmitting normally    │
│    Result: ✅ PASS                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 4: Invalid Request Handling

```
┌────────────────────────────────────────────────────┐
│ TEST CASE 4: NRC Generation                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Setup: Enter Extended Session [10 03]            │
│                                                    │
│  Test 4a: Invalid Control Type                    │
│    Tester → ECU: [28 FF 03]                       │
│                   │  └─── Invalid control (0xFF)  │
│                   └────── SID 0x28                │
│    ECU → Tester: [7F 28 12]                       │
│                   └─── NRC 0x12 (Sub-Func Not Sup)│
│    Result: ✅ Correct NRC                         │
│                                                    │
│  Test 4b: Invalid Communication Type              │
│    Tester → ECU: [28 03 FF]                       │
│                        └─── Invalid type (0xFF)   │
│    ECU → Tester: [7F 28 31]                       │
│                   └─── NRC 0x31 (Out Of Range)    │
│    Result: ✅ Correct NRC                         │
│                                                    │
│  Test 4c: Wrong Message Length                    │
│    Tester → ECU: [28 03]                          │
│                   └─── Only 2 bytes (need 3+)     │
│    ECU → Tester: [7F 28 13]                       │
│                   └─── NRC 0x13 (Incorrect Length)│
│    Result: ✅ Correct NRC                         │
│                                                    │
│  Test 4d: Incomplete Node ID                      │
│    Tester → ECU: [28 03 03 F0]                    │
│                             └─ Only 1 byte (need 2)│
│    ECU → Tester: [7F 28 13]                       │
│    Result: ✅ Correct NRC                         │
│                                                    │
│  Test 4e: Wrong Session                           │
│    Return to Default: [10 01]                     │
│    Tester → ECU: [28 03 03]                       │
│    ECU → Tester: [7F 28 7F]                       │
│                   └─── NRC 0x7F (Not in Session)  │
│    Result: ✅ PASS                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Test Case 5: Flash Programming Integration

```
┌────────────────────────────────────────────────────┐
│ TEST CASE 5: Complete Flash Programming Workflow  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Step 1: Enter Programming Session                │
│    Tester → ECU: [10 02]                          │
│    ECU → Tester: [50 02 00 32 01 F4]              │
│    Result: ✅                                     │
│                                                    │
│  Step 2: Unlock Security                          │
│    [27 01] → [67 01 ...]                          │
│    [27 02 KEY] → [67 02]                          │
│    Result: ✅ Unlocked                            │
│                                                    │
│  Step 3: Disable Communication                    │
│    Tester → ECU: [28 03 03]                       │
│    ECU → Tester: [68 03]                          │
│    Result: ✅ ECU isolated                        │
│                                                    │
│  Step 4: Start TesterPresent                      │
│    Send [3E 80] every 2 seconds                   │
│    (Prevents session timeout)                     │
│                                                    │
│  Step 5: Flash Programming                        │
│    [34 ...] Request Download                      │
│    [36 ...] Transfer Data (multiple)              │
│    [37] Request Transfer Exit                     │
│    Result: ✅ Flash complete                      │
│                                                    │
│  Step 6: Re-enable Communication                  │
│    Tester → ECU: [28 01 03]                       │
│    ECU → Tester: [68 01]                          │
│    Result: ✅                                     │
│                                                    │
│  Step 7: Reset ECU                                │
│    Tester → ECU: [11 01]                          │
│    ECU → Tester: [51 01]                          │
│    (ECU reboots with new firmware)                │
│    Result: ✅ PASS                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Session + Communication Control

```
  Tester                           ECU
    │                               │
    │  [10 03] Extended Session     │
    │──────────────────────────────>│
    │                               │ ✓ Session changed
    │  [50 03 ...]                  │
    │<──────────────────────────────│
    │                               │
    │  [28 03 03] Disable All       │
    │──────────────────────────────>│
    │                               │ ✓ Comm disabled
    │  [68 03]                      │
    │<──────────────────────────────│
    │                               │
    │  ... Perform operations ...   │
    │                               │
    │  [28 01 03] Enable All        │
    │──────────────────────────────>│
    │                               │ ✓ Comm restored
    │  [68 01]                      │
    │<──────────────────────────────│
    │                               │
```

### Pattern 2: Security + Communication Control

```
  Tester                           ECU
    │                               │
    │  [10 03] Extended Session     │
    │──────────────────────────────>│
    │  [50 03 ...]                  │
    │<──────────────────────────────│
    │                               │
    │  [27 01] Request Seed         │
    │──────────────────────────────>│
    │  [67 01 AB CD EF 12]          │
    │<──────────────────────────────│
    │                               │
    │  [27 02 KEY] Send Key         │
    │──────────────────────────────>│
    │  [67 02]                      │ 🔓 Unlocked
    │<──────────────────────────────│
    │                               │
    │  [28 03 03] Disable Comm      │
    │──────────────────────────────>│
    │  [68 03]                      │ ✓ Allowed
    │<──────────────────────────────│
    │                               │
```

### Pattern 3: TesterPresent During Isolated State

```
  Tester                           ECU
    │                               │
    │  [28 03 03] Disable All       │
    │──────────────────────────────>│
    │  [68 03]                      │
    │<──────────────────────────────│
    │                               │ State: RX:❌ TX:❌
    │                               │ (Normal messages)
    │                               │
    │  [3E 80] TesterPresent        │ ◄─── Diagnostic!
    │──────────────────────────────>│      (Always works)
    │  [7E 80]                      │
    │<──────────────────────────────│
    │                               │
    │  ... Wait 2 seconds ...       │
    │                               │
    │  [3E 80] TesterPresent        │
    │──────────────────────────────>│
    │  [7E 80]                      │
    │<──────────────────────────────│
    │                               │
    │  (Repeat every 2s to prevent  │
    │   session timeout)            │
    │                               │
```

### Pattern 4: Multi-Subnet Sequential Control

```
  Tester                           ECU
    │                               │
    │  Disable Subnet 0xF0          │
    │  [28 03 03 F0 00]             │
    │──────────────────────────────>│
    │  [68 03]                      │
    │<──────────────────────────────│ 0xF0: ❌
    │                               │
    │  Disable Subnet 0xF1          │
    │  [28 03 03 F1 00]             │
    │──────────────────────────────>│
    │  [68 03]                      │
    │<──────────────────────────────│ 0xF1: ❌
    │                               │
    │  ... Perform testing ...      │
    │                               │
    │  Enable Subnet 0xF0           │
    │  [28 01 03 F0 00]             │
    │──────────────────────────────>│
    │  [68 01]                      │
    │<──────────────────────────────│ 0xF0: ✅
    │                               │
    │  Enable Subnet 0xF1           │
    │  [28 01 03 F1 00]             │
    │──────────────────────────────>│
    │  [68 01]                      │
    │<──────────────────────────────│ 0xF1: ✅
    │                               │
```

---

## Debugging Flowcharts

### Debug: "Communication Not Disabled"

```
           ECU Still Transmitting?
                     │
                     ▼
         ┌───────────────────────┐
         │ Check Response Code   │
         └───────────┬───────────┘
                     │
      ┌──────────────┼──────────────┐
      │                             │
   [68 03]                       [7F 28 XX]
  (Success)                       (Failed)
      │                             │
      ▼                             ▼
┌─────────────┐            ┌──────────────┐
│What messages│            │Check NRC code│
│still sending?│            │See NRC guide │
└──────┬──────┘            └──────────────┘
       │
   ┌───┴────┐
   │        │
Diagnostic  Normal/NM
Messages    Messages
   │           │
   ▼           ▼
✅ NORMAL   ❌ PROBLEM
(Expected)      │
                │
        ┌───────┴────────┐
        │                │
  Wrong Comm Type   Wrong Subnet
        │                │
        ▼                ▼
  Use 0x03         Check Node ID
  (not 0x01)       matches target
```

### Debug: "Cannot Re-Enable"

```
        Re-enable Command Sent
        [28 01 03] but no effect?
                │
                ▼
        ┌──────────────────┐
        │ Check Response   │
        └────────┬─────────┘
                 │
      ┌──────────┼──────────┐
      │                     │
   [68 01]              [7F 28 XX]
  (Success)              (Failed)
      │                     │
      ▼                     ▼
  ┌────────┐         ┌────────────┐
  │ Wait   │         │Check NRC:  │
  │100-500ms│         │0x22,0x33,  │
  │for ECU │         │0x7F        │
  │to apply│         └────────────┘
  └───┬────┘
      │
      ▼
  Still not
  working?
      │
      ▼
┌──────────────────┐
│ Try ECU Reset:   │
│ [11 01]          │
│ (Forces restore) │
└──────────────────┘
```

### Debug: NRC 0x7F in Extended Session

```
       NRC 0x7F but I'm in Extended?
                    │
                    ▼
          ┌──────────────────┐
          │ Verify Session   │
          │ [22 F1 86]       │
          └────────┬─────────┘
                   │
        ┌──────────┼──────────┐
        │                     │
    Returns 03           Returns 01
   (Extended OK)         (Default!)
        │                     │
        ▼                     ▼
  ┌────────────┐      ┌─────────────┐
  │ECU doesn't │      │Session timed│
  │support 0x28│      │out - use    │
  │in Extended │      │[3E 80]      │
  └────────────┘      └─────────────┘
```

---

## Best Practices Checklist

### Implementation Checklist

```
┌────────────────────────────────────────────────────┐
│ ✅ Communication Control Implementation            │
├────────────────────────────────────────────────────┤
│                                                    │
│ Request Validation:                               │
│  □ Check message length (3 or 5 bytes only)       │
│  □ Validate control type (0x00-0x05)              │
│  □ Validate communication type (0x01-0x03)        │
│  □ Parse Node ID correctly if present             │
│                                                    │
│ Session & Security:                               │
│  □ Enforce Extended/Programming session only      │
│  □ Check security if required by ECU              │
│  □ Return correct NRC for each failure            │
│                                                    │
│ State Management:                                 │
│  □ Update RX/TX flags based on control type       │
│  □ Apply to correct message types (0x01/02/03)    │
│  □ Store subnet target if Node ID provided        │
│  □ Never disable diagnostic messages              │
│                                                    │
│ Communication Handling:                           │
│  □ Check flags before each message transmission   │
│  □ Verify subnet match if targeted                │
│  □ Allow all diagnostic messages regardless       │
│                                                    │
│ Auto-Restore:                                     │
│  □ Restore on ECU reset (SID 0x11)                │
│  □ Restore on session timeout                     │
│  □ Restore on power cycle                         │
│                                                    │
│ Response Generation:                              │
│  □ Send [68 + control_type] on success           │
│  □ Send [7F 28 NRC] on failure                    │
│  □ Echo control type in positive response         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Testing Checklist

```
┌────────────────────────────────────────────────────┐
│ ✅ Testing Requirements                            │
├────────────────────────────────────────────────────┤
│                                                    │
│ Basic Function Tests:                             │
│  □ Test disable all (0x28 0x03 0x03)              │
│  □ Test enable all (0x28 0x01 0x03)               │
│  □ Test RX-only mode (0x28 0x00 0x03)             │
│  □ Test each communication type (0x01/02/03)      │
│                                                    │
│ NRC Tests:                                        │
│  □ Test NRC 0x12 (invalid control type)           │
│  □ Test NRC 0x13 (wrong length)                   │
│  □ Test NRC 0x22 (wrong conditions)               │
│  □ Test NRC 0x31 (invalid comm type)              │
│  □ Test NRC 0x33 (security required)              │
│  □ Test NRC 0x7F (wrong session)                  │
│                                                    │
│ Subnet Tests:                                     │
│  □ Test without Node ID (affects all)             │
│  □ Test with Node ID (affects target only)        │
│  □ Test multiple subnets sequentially             │
│                                                    │
│ Integration Tests:                                │
│  □ Test with flash programming workflow           │
│  □ Test with TesterPresent during isolation       │
│  □ Test session timeout auto-restore              │
│  □ Test ECU reset auto-restore                    │
│                                                    │
│ Network Verification:                             │
│  □ Monitor network to confirm disable             │
│  □ Verify diagnostic messages still work          │
│  □ Confirm re-enable restores traffic             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Debugging Checklist

```
┌────────────────────────────────────────────────────┐
│ 🔍 Troubleshooting Steps                           │
├────────────────────────────────────────────────────┤
│                                                    │
│ Communication Not Disabled:                       │
│  □ Verify positive response [68 XX] received      │
│  □ Check what messages still transmitting         │
│  □ Diagnostic messages are EXPECTED (normal)      │
│  □ Try communication type 0x03 (both types)       │
│  □ Use network monitor to verify                  │
│                                                    │
│ Cannot Re-Enable:                                 │
│  □ Check if session timeout occurred              │
│  □ Try ECU reset [11 01] as last resort           │
│  □ Verify Node ID matches disable command         │
│  □ Check security still unlocked                  │
│                                                    │
│ Getting NRCs:                                     │
│  □ NRC 0x7F: Enter Extended session first         │
│  □ NRC 0x33: Unlock security before command       │
│  □ NRC 0x22: Check ECU state (not in motion, etc.)│
│  □ NRC 0x13: Verify message length (3 or 5 bytes) │
│                                                    │
│ Flash Programming Issues:                         │
│  □ Send [3E 80] every 2 seconds                   │
│  □ Disable comm BEFORE flash, not during          │
│  □ Wait 100ms after comm control                  │
│  □ Ensure stable power supply                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**End of SID 0x28 Practical Implementation Guide**

**Next Steps**:
- Review: [SID_28_COMMUNICATION_CONTROL.md](./SID_28_COMMUNICATION_CONTROL.md) for theory
- Read: [SID_28_SERVICE_INTERACTIONS.md](./SID_28_SERVICE_INTERACTIONS.md) for workflows
