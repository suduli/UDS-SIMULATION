# SID 0x22: Service Interactions & Workflows

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.2

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
                         ┌─────────────────┐
                         │   SID 0x22      │
                         │ (Read Data By   │
                         │  Identifier)    │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
      ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
      │   SID 0x10   │    │   SID 0x27   │   │   SID 0x3E   │
      │  Diagnostic  │    │   Security   │   │   Tester     │
      │   Session    │    │    Access    │   │   Present    │
      │   Control    │    │              │   │              │
      └──────────────┘    └──────────────┘   └──────────────┘
            │                     │                   │
            └─────────────────────┴───────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  Transport      │
                         │  Layer          │
                         │  (ISO-TP)       │
                         └─────────────────┘
```

### Dependency Relationships

```
┌──────────────────────────────────────────────────────────────┐
│             SID 0x22 DEPENDS ON:                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SID 0x10 (Diagnostic Session Control)                       │
│  ├─ Required to access session-specific DIDs                 │
│  ├─ DEFAULT session: Basic identification DIDs               │
│  ├─ EXTENDED session: Runtime data, sensors                  │
│  └─ PROGRAMMING session: Flash/programming status            │
│                                                              │
│  SID 0x27 (Security Access)                                  │
│  ├─ Required for secured/protected DIDs                      │
│  ├─ Calibration data access                                  │
│  ├─ Proprietary information                                  │
│  └─ Safety-critical parameters                               │
│                                                              │
│  SID 0x3E (Tester Present)                                   │
│  ├─ Maintains active session (prevents timeout)              │
│  ├─ Keeps security unlocked                                  │
│  └─ Required for long diagnostic sequences                   │
│                                                              │
│  SID 0x2A (Read Data By Periodic Identifier)                 │
│  ├─ Alternative for continuous monitoring                    │
│  └─ Uses same DID definitions as 0x22                        │
│                                                              │
│  SID 0x2E (Write Data By Identifier)                         │
│  ├─ Write counterpart to 0x22 (read)                         │
│  └─ Often used together for calibration                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Session Requirements Matrix

### DID Access by Session Type

```
┌───────────────┬──────────┬──────────┬─────────────┬──────────┐
│ DID Category  │ DEFAULT  │ EXTENDED │ PROGRAMMING │ Security │
│               │  (0x01)  │  (0x03)  │   (0x02)    │ Required │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Vehicle ID    │    ✓     │    ✓     │      ✓      │    NO    │
│ (0xF190-F19F) │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ ECU Info      │    ✓     │    ✓     │      ✓      │    NO    │
│ (0xF1A0-F1EF) │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Active        │    ✓     │    ✓     │      ✓      │    NO    │
│ Session       │          │          │             │          │
│ (0xF186)      │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Sensor Data   │    ✗     │    ✓     │      ✗      │    NO    │
│ (Mfr specific)│          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ DTC Info      │    ✗     │    ✓     │      ✗      │    NO    │
│ (0xF400-F4FF) │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Calibration   │    ✗     │    ✓     │      ✓      │   YES    │
│ Data          │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Programming   │    ✗     │    ✗     │      ✓      │   YES    │
│ Status        │          │          │             │          │
├───────────────┼──────────┼──────────┼─────────────┼──────────┤
│ Immobilizer   │    ✗     │    ✗     │      ✓      │   YES    │
│ Data          │          │          │             │  (High)  │
└───────────────┴──────────┴──────────┴─────────────┴──────────┘

Legend:
✓ = Accessible in this session
✗ = NOT accessible (will return NRC 0x7F)
```

---

## Complete Workflow Examples

### Workflow 1: Basic Vehicle Identification

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASE: Identify vehicle and ECU                         │
│  GOAL: Read VIN, Serial Number, and Software Version        │
│  SESSION: DEFAULT                                            │
│  SECURITY: Not required                                      │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ Step 1: Read VIN                │
    │ Request: 22 F1 90               │
    │────────────────────────────────>│
    │                                 │ [Lookup DID 0xF190]
    │                                 │ [Session: DEFAULT ✓]
    │                                 │ [Security: Not needed ✓]
    │                                 │ [Get VIN data]
    │                                 │
    │ Response: 62 F1 90 + [17 bytes] │
    │<────────────────────────────────│
    │ ✓ VIN: "1HGBH41JXMN109186"      │
    │                                 │
    │ Step 2: Read Serial Number      │
    │ Request: 22 F1 8C               │
    │────────────────────────────────>│
    │                                 │ [Lookup DID 0xF18C]
    │                                 │ [Get serial number]
    │                                 │
    │ Response: 62 F1 8C + [10 bytes] │
    │<────────────────────────────────│
    │ ✓ Serial: "ABC1234567"          │
    │                                 │
    │ Step 3: Read SW Version         │
    │ Request: 22 F1 89               │
    │────────────────────────────────>│
    │                                 │ [Lookup DID 0xF189]
    │                                 │ [Get SW version]
    │                                 │
    │ Response: 62 F1 89 + [bytes]    │
    │<────────────────────────────────│
    │ ✓ Version: "V1.2.3"             │
    │                                 │

┌──────────────────────────────────────────────────────────────┐
│  RESULT: ✓ SUCCESS                                           │
│  All identification data retrieved successfully              │
│  No session change needed, no security required              │
└──────────────────────────────────────────────────────────────┘
```

### Workflow 2: Read Live Sensor Data (Extended Session)

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASE: Monitor engine parameters                         │
│  GOAL: Read engine temperature and RPM                       │
│  SESSION: EXTENDED (required)                                │
│  SECURITY: Not required                                      │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ Step 1: Enter EXTENDED session  │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │                                 │ [Switch to EXTENDED]
    │                                 │ [Start session timer]
    │                                 │
    │ Response: 50 03 00 32 01 F4     │
    │<────────────────────────────────│
    │ ✓ Session: EXTENDED             │
    │   P2=50ms, P2*=500ms            │
    │                                 │
    │ Step 2: Read multiple sensors   │
    │ Request: 22 01 05 01 0C         │
    │         (Temp + RPM)            │
    │────────────────────────────────>│
    │                                 │ [Session check: EXTENDED ✓]
    │                                 │ [Get temperature: 90°C]
    │                                 │ [Get RPM: 3000]
    │                                 │
    │ Response: 62 01 05 5A           │
    │              01 0C 0B B8         │
    │<────────────────────────────────│
    │ ✓ Temp: 90°C (0x5A)             │
    │ ✓ RPM: 3000 (0x0BB8)            │
    │                                 │
    │ Step 3: Continue monitoring...  │
    │ (Send TesterPresent to maintain)│
    │ Request: 3E 80                  │
    │────────────────────────────────>│
    │ Response: 7E 80                 │
    │<────────────────────────────────│
    │ ✓ Session maintained            │
    │                                 │
    │ Step 4: Return to DEFAULT       │
    │ Request: 10 01                  │
    │────────────────────────────────>│
    │ Response: 50 01                 │
    │<────────────────────────────────│
    │ ✓ Session: DEFAULT              │
    │                                 │

┌──────────────────────────────────────────────────────────────┐
│  RESULT: ✓ SUCCESS                                           │
│  Live data read successfully in EXTENDED session             │
│  Session properly managed (enter → maintain → exit)          │
└──────────────────────────────────────────────────────────────┘
```

### Workflow 3: Read Secured Calibration Data

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASE: Read protected calibration parameter             │
│  GOAL: Access secured DID 0x2000                             │
│  SESSION: EXTENDED (required)                                │
│  SECURITY: Level 1 (required)                                │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ Step 1: Enter EXTENDED session  │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │ Response: 50 03 00 32 01 F4     │
    │<────────────────────────────────│
    │ ✓ Session: EXTENDED             │
    │                                 │
    │ Step 2: Request Security Seed   │
    │ Request: 27 01                  │
    │────────────────────────────────>│
    │                                 │ [Generate random seed]
    │                                 │ [Start security timer]
    │                                 │
    │ Response: 67 01 A5 3C 7F 91     │
    │<────────────────────────────────│
    │ ✓ Seed received: A5 3C 7F 91    │
    │                                 │
    │ [Tester calculates key using    │
    │  proprietary algorithm]         │
    │ Key = F(seed) = B2 8D 4A C3     │
    │                                 │
    │ Step 3: Send Security Key       │
    │ Request: 27 02 B2 8D 4A C3      │
    │────────────────────────────────>│
    │                                 │ [Validate key]
    │                                 │ [Key correct! ✓]
    │                                 │ [Unlock security 🔓]
    │                                 │
    │ Response: 67 02                 │
    │<────────────────────────────────│
    │ ✓ Security: UNLOCKED 🔓         │
    │                                 │
    │ Step 4: Read Secured DID        │
    │ Request: 22 20 00               │
    │────────────────────────────────>│
    │                                 │ [Session: EXTENDED ✓]
    │                                 │ [Security: UNLOCKED ✓]
    │                                 │ [Get calibration data]
    │                                 │
    │ Response: 62 20 00 + [data]     │
    │<────────────────────────────────│
    │ ✓ Calibration data retrieved    │
    │                                 │
    │ Step 5: Return to DEFAULT       │
    │ Request: 10 01                  │
    │────────────────────────────────>│
    │                                 │ [Security auto-locks 🔒]
    │                                 │
    │ Response: 50 01                 │
    │<────────────────────────────────│
    │ ✓ Session: DEFAULT              │
    │ ✓ Security: LOCKED 🔒           │
    │                                 │

┌──────────────────────────────────────────────────────────────┐
│  RESULT: ✓ SUCCESS                                           │
│  Secured data accessed after proper authentication           │
│  Security automatically locked when session changed          │
└──────────────────────────────────────────────────────────────┘
```

### Workflow 4: Multi-DID Read with Error Recovery

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASE: Read multiple DIDs with mixed access levels      │
│  CHALLENGE: One DID requires higher session/security        │
│  STRATEGY: Separate requests by requirements                │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ Attempt 1: Read all at once     │
    │ Request: 22 F190 F18C 2000      │
    │         (VIN + Serial + Cal)    │
    │────────────────────────────────>│
    │                                 │ [DID 0xF190: OK]
    │                                 │ [DID 0xF18C: OK]
    │                                 │ [DID 0x2000: Security needed]
    │                                 │ [FAIL - abort all!]
    │                                 │
    │ Response: 7F 22 33              │
    │<────────────────────────────────│
    │ ✗ NRC 0x33: Security denied     │
    │                                 │
    │ RECOVERY STRATEGY:              │
    │ Read public DIDs first,         │
    │ then unlock and read secured    │
    │                                 │
    │ Step 1: Read public DIDs        │
    │ Request: 22 F190 F18C           │
    │────────────────────────────────>│
    │                                 │ [Both DIDs public ✓]
    │                                 │
    │ Response: 62 F190[17B] F18C[10B]│
    │<────────────────────────────────│
    │ ✓ Public data received          │
    │                                 │
    │ Step 2: Enter EXTENDED          │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │ Response: 50 03 ...             │
    │<────────────────────────────────│
    │                                 │
    │ Step 3: Unlock security         │
    │ Request: 27 01                  │
    │────────────────────────────────>│
    │ Response: 67 01 [seed]          │
    │<────────────────────────────────│
    │                                 │
    │ Request: 27 02 [key]            │
    │────────────────────────────────>│
    │ Response: 67 02 🔓              │
    │<────────────────────────────────│
    │                                 │
    │ Step 4: Read secured DID        │
    │ Request: 22 2000                │
    │────────────────────────────────>│
    │ Response: 62 2000 [data]        │
    │<────────────────────────────────│
    │ ✓ All data retrieved!           │
    │                                 │

┌──────────────────────────────────────────────────────────────┐
│  RESULT: ✓ SUCCESS (with recovery)                          │
│  LESSON: Group DIDs by access requirements                   │
│  BEST PRACTICE: Read public data first, secured data last    │
└──────────────────────────────────────────────────────────────┘
```

### Workflow 5: Continuous Monitoring with TesterPresent

```
┌──────────────────────────────────────────────────────────────┐
│  USE CASE: Long-term sensor monitoring                       │
│  CHALLENGE: Session timeout (typically 5 seconds)            │
│  SOLUTION: Periodic TesterPresent messages                   │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ Setup: Enter EXTENDED           │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │ Response: 50 03 ...             │
    │<────────────────────────────────│
    │ ✓ Session: EXTENDED             │
    │ ⏱ Timer started: 5000ms         │
    │                                 │
    │ T=0s: Read sensor               │
    │ Request: 22 01 05               │
    │────────────────────────────────>│
    │ Response: 62 01 05 5A           │
    │<────────────────────────────────│
    │ ✓ Temp: 90°C                    │
    │                                 │
    │ T=2s: Maintain session          │
    │ Request: 3E 80                  │
    │────────────────────────────────>│
    │ Response: 7E 80                 │
    │<────────────────────────────────│
    │ ✓ Timer reset ⏱                 │
    │                                 │
    │ T=4s: Read sensor again         │
    │ Request: 22 01 05               │
    │────────────────────────────────>│
    │ Response: 62 01 05 5C           │
    │<────────────────────────────────│
    │ ✓ Temp: 92°C                    │
    │                                 │
    │ T=6s: Maintain session          │
    │ Request: 3E 80                  │
    │────────────────────────────────>│
    │ Response: 7E 80                 │
    │<────────────────────────────────│
    │ ✓ Timer reset ⏱                 │
    │                                 │
    │ (Continue pattern...)           │
    │                                 │
    │ WITHOUT TesterPresent:          │
    │ ┌───────────────────────────┐   │
    │ │ T=0s: Read OK             │   │
    │ │ T=5s: [TIMEOUT! 🔥]       │   │
    │ │ T=6s: Read → NRC 0x7F     │   │
    │ │ (Session returned DEFAULT)│   │
    │ └───────────────────────────┘   │
    │                                 │

┌──────────────────────────────────────────────────────────────┐
│  RESULT: ✓ SUCCESS                                           │
│  BEST PRACTICE: Send TesterPresent every 2-3 seconds         │
│  NOTE: Use suppress positive response (0x80) to reduce       │
│        CAN bus traffic                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Read → Modify → Verify

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: Calibration Parameter Update                      │
│  SERVICES: 0x22 (Read) + 0x2E (Write) + 0x22 (Verify)        │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ 1. Enter EXTENDED + Unlock      │
    │    (SID 0x10 + 0x27)            │
    │────────────────────────────────>│
    │<────────────────────────────────│
    │                                 │
    │ 2. Read Current Value           │
    │    SID 0x22: 22 3001            │
    │────────────────────────────────>│
    │    Response: 62 3001 64         │
    │<────────────────────────────────│
    │ ✓ Current value: 0x64 (100)     │
    │                                 │
    │ 3. Write New Value              │
    │    SID 0x2E: 2E 3001 78         │
    │    (Write 120 = 0x78)           │
    │────────────────────────────────>│
    │                                 │ [Validate]
    │                                 │ [Write to memory]
    │                                 │
    │    Response: 6E 3001            │
    │<────────────────────────────────│
    │ ✓ Write successful              │
    │                                 │
    │ 4. Verify New Value             │
    │    SID 0x22: 22 3001            │
    │────────────────────────────────>│
    │    Response: 62 3001 78         │
    │<────────────────────────────────│
    │ ✓ Verified: 0x78 (120) ✓        │
    │                                 │
```

### Pattern 2: Diagnostic Data Collection

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: Complete Diagnostic Scan                          │
│  SERVICES: 0x10 + 0x22 (Multiple) + 0x19 (DTC Read)          │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ 1. Enter EXTENDED               │
    │    SID 0x10: 10 03              │
    │────────────────────────────────>│
    │    Response: 50 03              │
    │<────────────────────────────────│
    │                                 │
    │ 2. Read ECU Identification      │
    │    SID 0x22: 22 F190 F18C F189  │
    │────────────────────────────────>│
    │    Response: 62 F190[VIN]       │
    │              F18C[Serial]       │
    │              F189[SW Ver]       │
    │<────────────────────────────────│
    │ ✓ Identity collected            │
    │                                 │
    │ 3. Read DTCs                    │
    │    SID 0x19: 19 02 FF           │
    │────────────────────────────────>│
    │    Response: 59 02 [DTCs]       │
    │<────────────────────────────────│
    │ ✓ Fault codes collected         │
    │                                 │
    │ 4. Read Live Data               │
    │    SID 0x22: 22 0105 010C 010D  │
    │────────────────────────────────>│
    │    Response: 62 [sensors]       │
    │<────────────────────────────────│
    │ ✓ Snapshot data collected       │
    │                                 │
    │ 5. Generate Report              │
    │    [All data combined]          │
    │                                 │
```

### Pattern 3: Programming Sequence

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN: ECU Reprogramming Workflow                         │
│  SERVICES: 0x10 + 0x27 + 0x22 + 0x34 + 0x36 + 0x37           │
└──────────────────────────────────────────────────────────────┘

  Tester                             ECU
    │                                 │
    │ 1. Read Current SW Version      │
    │    (DEFAULT session)            │
    │    SID 0x22: 22 F189            │
    │────────────────────────────────>│
    │    Response: 62 F189 [v1.0]     │
    │<────────────────────────────────│
    │ ✓ Current: v1.0                 │
    │                                 │
    │ 2. Enter PROGRAMMING Session    │
    │    SID 0x10: 10 02              │
    │────────────────────────────────>│
    │    Response: 50 02              │
    │<────────────────────────────────│
    │                                 │
    │ 3. Unlock Programming Security  │
    │    SID 0x27: 27 01 → 27 02      │
    │────────────────────────────────>│
    │<────────────────────────────────│
    │ ✓ Unlocked 🔓                   │
    │                                 │
    │ 4. Request Download             │
    │    SID 0x34: ...                │
    │────────────────────────────────>│
    │<────────────────────────────────│
    │                                 │
    │ 5. Transfer Data                │
    │    SID 0x36: ... (multiple)     │
    │────────────────────────────────>│
    │<────────────────────────────────│
    │                                 │
    │ 6. Exit Transfer                │
    │    SID 0x37: ...                │
    │────────────────────────────────>│
    │<────────────────────────────────│
    │                                 │
    │ 7. Reset ECU                    │
    │    SID 0x11: 11 01              │
    │────────────────────────────────>│
    │    Response: 51 01              │
    │<────────────────────────────────│
    │                                 │
    │ [ECU Reboots]                   │
    │                                 │
    │ 8. Verify New SW Version        │
    │    SID 0x22: 22 F189            │
    │────────────────────────────────>│
    │    Response: 62 F189 [v2.0]     │
    │<────────────────────────────────│
    │ ✓ Updated: v2.0 ✓               │
    │                                 │
```

---

## Troubleshooting Scenarios

### Scenario 1: Unexpected NRC 0x7F

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ PROBLEM: Reading DID returns NRC 0x7F                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Request: 22 01 05                                        │
│ • Response: 7F 22 7F                                       │
│                                                            │
│ Diagnostic Steps:                                          │
│                                                            │
│ Step 1: Check current session                              │
│ ┌──────────────────────────────────┐                      │
│ │ Request: 22 F1 86 (Read session) │                      │
│ │ Response: 62 F1 86 01            │                      │
│ │ → Currently in DEFAULT (0x01)    │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Step 2: Check DID requirements                             │
│ ┌──────────────────────────────────┐                      │
│ │ DID 0x0105 requires:             │                      │
│ │ • Session: EXTENDED (0x03)       │                      │
│ │ • Security: Not required         │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Step 3: Fix - Enter correct session                        │
│ ┌──────────────────────────────────┐                      │
│ │ Request: 10 03                   │                      │
│ │ Response: 50 03 ...              │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Step 4: Retry DID read                                     │
│ ┌──────────────────────────────────┐                      │
│ │ Request: 22 01 05                │                      │
│ │ Response: 62 01 05 [data]        │                      │
│ │ ✓ SUCCESS!                       │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 2: Response Too Long (NRC 0x14)

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ PROBLEM: Multiple DID request returns NRC 0x14          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Request: 22 F190 F18C F189 F191 F192                     │
│ • Response: 7F 22 14 (Response Too Long)                   │
│                                                            │
│ Cause Analysis:                                            │
│ ┌──────────────────────────────────┐                      │
│ │ DID sizes:                       │                      │
│ │ • F190: 17 bytes (VIN)           │                      │
│ │ • F18C: 10 bytes (Serial)        │                      │
│ │ • F189: 20 bytes (SW Ver)        │                      │
│ │ • F191: 15 bytes (HW Number)     │                      │
│ │ • F192: 12 bytes (HW Number)     │                      │
│ │                                  │                      │
│ │ Total: 3 + (5×2) + 74 = 87 bytes │                      │
│ │ ECU buffer limit: 64 bytes       │                      │
│ │ → TOO LARGE! ✗                   │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Solution: Split into smaller requests                      │
│                                                            │
│ Request 1:                                                 │
│ ┌──────────────────────────────────┐                      │
│ │ 22 F190 F18C                     │                      │
│ │ → 62 F190[17] F18C[10]           │                      │
│ │ Total: 30 bytes ✓                │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Request 2:                                                 │
│ ┌──────────────────────────────────┐                      │
│ │ 22 F189 F191                     │                      │
│ │ → 62 F189[20] F191[15]           │                      │
│ │ Total: 38 bytes ✓                │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│ Request 3:                                                 │
│ ┌──────────────────────────────────┐                      │
│ │ 22 F192                          │                      │
│ │ → 62 F192[12]                    │                      │
│ │ Total: 15 bytes ✓                │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### Common DID Quick Reference

```
┌────────┬────────────────────┬─────────┬──────────┬──────────┐
│  DID   │ Description        │ Session │ Security │ Size     │
├────────┼────────────────────┼─────────┼──────────┼──────────┤
│ 0xF186 │ Active Session     │ ANY     │ NO       │ 1 byte   │
│ 0xF187 │ Spare Part Number  │ DEFAULT │ NO       │ Variable │
│ 0xF188 │ ECU SW Number      │ DEFAULT │ NO       │ Variable │
│ 0xF189 │ ECU SW Version     │ DEFAULT │ NO       │ Variable │
│ 0xF18A │ Supplier ID        │ DEFAULT │ NO       │ Variable │
│ 0xF18B │ Mfg Date           │ DEFAULT │ NO       │ 3-4 byte │
│ 0xF18C │ ECU Serial Number  │ DEFAULT │ NO       │ Variable │
│ 0xF18E │ System Name        │ DEFAULT │ NO       │ Variable │
│ 0xF190 │ VIN                │ DEFAULT │ NO       │ 17 bytes │
│ 0xF191 │ Vehicle HW Number  │ DEFAULT │ NO       │ Variable │
│ 0xF192 │ System HW Number   │ DEFAULT │ NO       │ Variable │
│ 0xF193 │ System HW Version  │ DEFAULT │ NO       │ Variable │
│ 0xF194 │ System SW Number   │ DEFAULT │ NO       │ Variable │
│ 0xF195 │ System SW Version  │ DEFAULT │ NO       │ Variable │
│ 0xF197 │ System Name/Engine │ DEFAULT │ NO       │ Variable │
│ 0xF198 │ Tester Serial      │ DEFAULT │ NO       │ Variable │
│ 0xF199 │ Programming Date   │ DEFAULT │ NO       │ 3-4 byte │
│ 0xF19E │ ODX File DID       │ DEFAULT │ NO       │ Variable │
└────────┴────────────────────┴─────────┴──────────┴──────────┘
```

### NRC Quick Lookup

```
┌──────┬──────────────────────┬────────────────────────────┐
│ NRC  │ Name                 │ Quick Fix                  │
├──────┼──────────────────────┼────────────────────────────┤
│ 0x13 │ Incorrect Length     │ Check: (len-1) mod 2 = 0   │
│ 0x14 │ Response Too Long    │ Request fewer DIDs         │
│ 0x22 │ Conditions Not       │ Check vehicle state        │
│      │ Correct              │ (speed, gear, etc.)        │
│ 0x31 │ Request Out Of Range │ Verify DID exists in ECU   │
│ 0x33 │ Security Denied      │ Unlock using SID 0x27      │
│ 0x7E │ Subfunction Not      │ N/A (0x22 has no subfunc)  │
│      │ Supported            │                            │
│ 0x7F │ Wrong Session        │ Enter correct session      │
│      │                      │ (SID 0x10)                 │
│ 0x78 │ Response Pending     │ Wait, ECU still processing │
└──────┴──────────────────────┴────────────────────────────┘
```

---

**End of Service Interactions Guide**

For theoretical concepts, see: `SID_22_READ_DATA_BY_IDENTIFIER.md`  
For implementation details, see: `SID_22_PRACTICAL_IMPLEMENTATION.md`
