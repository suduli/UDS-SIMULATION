# DTC Clearing Procedures Guide

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Purpose**: Procedures for clearing diagnostic history with permission levels

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Permission Levels](#permission-levels)
3. [Pre-Clear Checklist](#pre-clear-checklist)
4. [Clearing Procedures](#clearing-procedures)
5. [Verification Steps](#verification-steps)
6. [What Gets Cleared](#what-gets-cleared)
7. [What Does NOT Get Cleared](#what-does-not-get-cleared)
8. [Session Requirements](#session-requirements)
9. [Troubleshooting Clear Failures](#troubleshooting-clear-failures)

---

## Overview

DTC clearing uses **SID 0x14 (Clear Diagnostic Information)** to remove stored fault codes and associated data from ECU memory. This is a critical operation that affects vehicle diagnostic history.

### Key Points

⚠️ **Before Clearing**:
- Document all DTCs and freeze frames
- Verify repair has been completed
- Ensure proper session/security access

✅ **After Clearing**:
- Verify zero DTCs with fresh read
- Perform test drive for readiness monitors
- Re-check for returning faults

---

## Permission Levels

### Level 1: Default Session (0x01)

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION LEVEL 1                        │
│                    Default Session                           │
├─────────────────────────────────────────────────────────────┤
│ Access: Basic diagnostic functions                           │
│                                                              │
│ Can Clear:                                                   │
│   ✅ Emissions-related DTCs (OBD-II required)               │
│   ✅ General powertrain DTCs                                 │
│                                                              │
│ Cannot Clear:                                                │
│   ❌ Manufacturer-specific protected DTCs                   │
│   ❌ Safety-critical DTCs (airbag, ABS)                     │
│   ❌ Security-related fault memory                          │
│                                                              │
│ Requirements: None (always available)                        │
└─────────────────────────────────────────────────────────────┘

Command: 14 FF FF FF
Expected: 54 (positive) or 7F 14 22 (conditions not correct)
```

### Level 2: Extended Session (0x03)

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION LEVEL 2                        │
│                    Extended Session                          │
├─────────────────────────────────────────────────────────────┤
│ Access: Full diagnostic capabilities                         │
│                                                              │
│ Can Clear:                                                   │
│   ✅ All Level 1 DTCs                                       │
│   ✅ Chassis DTCs (ABS, stability control)                  │
│   ✅ Body DTCs (BCM, comfort systems)                       │
│   ✅ Network DTCs (communication faults)                    │
│                                                              │
│ Cannot Clear:                                                │
│   ❌ Security-locked manufacturer DTCs                      │
│   ❌ Crash data (requires special tools)                    │
│                                                              │
│ Requirements: Enter extended session first                   │
└─────────────────────────────────────────────────────────────┘

Sequence:
1. 10 03          → Enter extended session
2. Wait for 50 03 response
3. 14 FF FF FF    → Clear all DTCs
4. Wait for 54 response
```

### Level 3: Security Unlocked

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION LEVEL 3                        │
│                 Security Access Required                     │
├─────────────────────────────────────────────────────────────┤
│ Access: Protected manufacturer functions                     │
│                                                              │
│ Can Clear:                                                   │
│   ✅ All Level 1 and 2 DTCs                                 │
│   ✅ Manufacturer-specific protected DTCs                   │
│   ✅ ECU internal fault counters                            │
│   ✅ Long-term adaptation values                            │
│                                                              │
│ Cannot Clear:                                                │
│   ❌ Permanent DTCs (require specific conditions)           │
│   ❌ Some crash event data                                  │
│                                                              │
│ Requirements: Security Access (0x27) unlocked               │
└─────────────────────────────────────────────────────────────┘

Sequence:
1. 10 03          → Enter extended session
2. 27 01          → Request seed
3. 27 02 [key]    → Send calculated key
4. Wait for 67 02 (access granted)
5. 14 FF FF FF    → Clear all DTCs
```

---

## Pre-Clear Checklist

### ☐ Documentation Phase

```
Before clearing ANY DTCs, document the following:

Step 1: Read all DTCs
   Command: 19 02 FF
   ☐ Record all DTC codes
   ☐ Record all status bytes
   ☐ Note timestamp

Step 2: Read freeze frames
   Command: 19 04 [DTC] 01 (for each DTC)
   ☐ Vehicle speed
   ☐ Engine RPM
   ☐ Coolant temperature
   ☐ Engine load
   ☐ Battery voltage

Step 3: Read extended data
   Command: 19 06 [DTC] FF (for each DTC)
   ☐ Occurrence counters
   ☐ Aging counters
   ☐ First occurrence date

Step 4: Export/save data
   ☐ Export session log
   ☐ Save to customer file
```

### ☐ Repair Verification Phase

```
☐ Root cause identified
☐ Repair completed
☐ Parts replaced (if applicable)
☐ Wiring inspected
☐ Connections secure
```

---

## Clearing Procedures

### Procedure A: Clear All DTCs

**Use When**: Routine service after repair completion

```
┌──────────────────────────────────────────────────────────────┐
│           CLEAR ALL DTCs PROCEDURE                           │
└──────────────────────────────────────────────────────────────┘

Step 1: Verify session
   Current session should be Extended (0x03) for full access
   
Step 2: Send clear command
   Request:  14 FF FF FF
             │  └──┬──┘
             │     └── Group: 0xFFFFFF = All DTCs
             └── SID: Clear Diagnostic Information

Step 3: Wait for response
   Positive: 54
   Negative: 7F 14 [NRC]
             │     │
             │     ├── 0x13: Incorrect message length
             │     ├── 0x22: Conditions not correct
             │     └── 0x72: General programming failure

Step 4: Verify clear success
   Request:  19 01 FF (count DTCs)
   Expected: 59 01 FF 01 00 00 (0 DTCs)
```

### Procedure B: Clear Specific DTC Group

**Use When**: Need to clear only specific category

```
┌──────────────────────────────────────────────────────────────┐
│           CLEAR SPECIFIC GROUP PROCEDURE                     │
└──────────────────────────────────────────────────────────────┘

Group Parameter Values:
┌────────────────┬────────────────────────────────────────────┐
│ Group Code     │ Description                                │
├────────────────┼────────────────────────────────────────────┤
│ FF FF FF       │ All DTCs (universal)                       │
│ 00 00 00       │ Emissions-related (OBD-II)                 │
│ 01 xx xx       │ Powertrain DTCs                            │
│ 02 xx xx       │ Chassis DTCs                               │
│ 03 xx xx       │ Body DTCs                                  │
│ 04 xx xx       │ Network DTCs                               │
└────────────────┴────────────────────────────────────────────┘

Example: Clear only Chassis DTCs
   Request: 14 02 00 00
```

### Procedure C: Full Clear with Security

**Use When**: Maximum access required

```
┌──────────────────────────────────────────────────────────────┐
│        FULL CLEAR WITH SECURITY ACCESS                       │
└──────────────────────────────────────────────────────────────┘

Step 1: Enter Extended Session
   TX: 10 03
   RX: 50 03 00 32 01 F4 ✓

Step 2: Request Security Seed
   TX: 27 01
   RX: 67 01 [4-byte seed]

Step 3: Calculate and Send Key
   TX: 27 02 [calculated key]
   RX: 67 02 ✓ (Access Granted)

Step 4: Clear All DTCs
   TX: 14 FF FF FF
   RX: 54 ✓

Step 5: Verify Clear
   TX: 19 01 FF
   RX: 59 01 FF 01 00 00 ✓ (0 DTCs)

Step 6: Return to Default Session
   TX: 10 01
   RX: 50 01 00 32 01 F4 ✓
```

---

## Verification Steps

### Post-Clear Verification

```
┌──────────────────────────────────────────────────────────────┐
│             POST-CLEAR VERIFICATION CHECKLIST                │
└──────────────────────────────────────────────────────────────┘

☐ Step 1: Immediate read
   TX: 19 02 FF
   Expected: 59 02 FF (no DTCs in response)

☐ Step 2: Key cycle
   - Turn ignition OFF
   - Wait 30 seconds
   - Turn ignition ON

☐ Step 3: Post-key-cycle read
   TX: 19 02 FF
   Expected: Still 0 DTCs

☐ Step 4: Short test drive (if applicable)
   - Drive for 5-10 minutes
   - Include various conditions
   - Return and re-check

☐ Step 5: Final verification
   TX: 19 01 FF
   Expected: 59 01 FF 01 00 00
```

---

## What Gets Cleared

### Always Cleared by SID 0x14

```
✓ DTC Code (3-byte fault identifier)
✓ DTC Status Byte (all 8 bits reset to 0)
✓ Freeze Frame Data (snapshot records)
✓ Extended Data Records:
  - Occurrence counters → 0
  - Aging counters → 0
  - First/most recent failure timestamps
✓ MIL (Malfunction Indicator Lamp) status
✓ Readiness monitors → Reset to "incomplete"
```

---

## What Does NOT Get Cleared

### Permanent Memory (Some ECUs)

```
✗ Permanent DTCs (P1xxx manufacturer-specific)
  - Require specific drive cycles
  - Some require dealer tool
  
✗ Emissions-related permanent codes
  - California Air Resources Board (CARB) requirement
  - Cannot be cleared by service tool
  
✗ Crash event data (airbag module)
  - Requires OEM-specific procedure
  
✗ Some security-related faults
  - Immobilizer attempts
  - Security access failures
```

---

## Session Requirements

### Session Permission Matrix

| Operation | Default (0x01) | Extended (0x03) | Programming (0x02) |
|-----------|:--------------:|:---------------:|:------------------:|
| Clear OBD-II | ✅ | ✅ | ❌ |
| Clear Powertrain | ⚠️ | ✅ | ❌ |
| Clear Chassis | ❌ | ✅ | ❌ |
| Clear Body | ❌ | ✅ | ❌ |
| Clear Network | ❌ | ✅ | ❌ |
| Clear Protected | ❌ | ⚠️ | ❌ |

⚠️ = May require additional security access

---

## Troubleshooting Clear Failures

### NRC 0x22: Conditions Not Correct

```
Cause: Session or security requirements not met

Solution:
1. Check current session
   TX: 22 F1 86 (Read active session DID)
   
2. Enter correct session
   TX: 10 03 (Extended)
   
3. Check if security needed
   TX: 27 01 (Request seed)
   
4. Retry clear
   TX: 14 FF FF FF
```

### NRC 0x72: General Programming Failure

```
Cause: ECU internal error during erase

Solution:
1. Wait 5 seconds
2. Retry clear command
3. If persistent, ECU may need hard reset
   TX: 11 01 (Hard reset)
4. Re-enter session and retry
```

### NRC 0x33: Security Access Denied

```
Cause: Protected DTCs require security unlock

Solution:
1. Enter extended session: 10 03
2. Request seed: 27 01
3. Send correct key: 27 02 [key]
4. Verify access: Wait for 67 02
5. Retry clear: 14 FF FF FF
```

### DTCs Return After Clear

```
Likely Causes:
- Fault condition still present
- Repair incomplete
- Related fault triggering

Diagnosis:
1. Read DTCs immediately after clear
2. If same DTC returns, check:
   - Wiring/connections
   - Component function
   - Related systems
```

---

## Quick Reference

### Command Summary

| Action | Command | Success Response |
|--------|---------|------------------|
| Enter Extended | `10 03` | `50 03...` |
| Request Seed | `27 01` | `67 01 [seed]` |
| Send Key | `27 02 [key]` | `67 02` |
| Clear All | `14 FF FF FF` | `54` |
| Verify | `19 01 FF` | `59 01 FF 01 00 00` |
| Return Default | `10 01` | `50 01...` |

---

**End of Document**
