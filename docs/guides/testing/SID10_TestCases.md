# UDS SID 10 - Diagnostic Session Control Test Cases
## Comprehensive Automotive ECU Testing Suite
### Based on ISO 14229-1:2020 and Real-World ECU Testing Standards

---

## Document Overview

This test case document provides **fullproof testing scenarios** for UDS Service ID 10 (Diagnostic Session Control), designed to simulate real ECU testing in the automotive sector. It covers:

- ✅ Positive Response Conditions
- ✅ Negative Response Conditions (NRCs)
- ✅ Session Transition Validation
- ✅ Service Interaction Testing
- ✅ Error Recovery Procedures
- ✅ Timing Compliance Testing
- ✅ Security State Management
- ✅ Edge Cases and Stress Testing
- ✅ Production ECU Simulation

---

## Test Environment Configuration

### ECU Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Initial Session | Default (0x01) | Power-on default state |
| P2 Server (Default) | 50ms (0x0032) | Standard response timeout |
| P2 Server (Extended) | 100ms (0x0064) | Extended session response timeout |
| P2* Server | 5000ms (0x01F4) | Enhanced timeout for complex operations |
| S3 Timeout | 5000ms | Session inactivity timeout |

### Supported Sessions

| Session | Code | P2 Timing | Services Enabled |
|---------|------|-----------|------------------|
| Default | 0x01 | 50ms | Read-only (0x10, 0x11, 0x19, 0x22, 0x28) |
| Programming | 0x02 | 50ms | Flash operations (0x34-0x37, 0x3D) + Security |
| Extended | 0x03 | 100ms | Advanced diagnostics (0x27, 0x2E, 0x31, 0x14, 0x23) |
| Safety | 0x04 | 50ms | Safety-critical diagnostics |

### Vehicle Condition Requirements

| Condition | Default | Programming | Extended | Safety |
|-----------|---------|-------------|----------|--------|
| Ignition | ON | ON | ON | ON |
| Vehicle Speed | Any | 0 km/h | Any | 0 km/h |
| Engine State | Any | OFF (preferred) | Any | Depends |
| Battery Voltage | 9-16V | 11-14V | 9-16V | 9-16V |

---

## Part 1: Positive Response Conditions

### Conditions for Positive Response (0x50)

A positive response is sent when ALL the following conditions are met:

1. **Message Format Valid**
   - Request length = exactly 2 bytes
   - SID = 0x10

2. **Subfunction Valid**
   - Value in supported range: 0x01, 0x02, 0x03, 0x04
   - OR valid manufacturer/supplier range (if implemented)

3. **Session Transition Allowed**
   - Transition follows ISO 14229-1 state machine rules
   - See Session Transition Matrix below

4. **Vehicle Conditions Met**
   - All preconditions for target session satisfied
   - No safety interlocks active

5. **ECU State Ready**
   - No pending operations blocking session change
   - Internal state machine allows transition

### Session Transition Matrix

| From → To | Default (0x01) | Programming (0x02) | Extended (0x03) | Safety (0x04) |
|-----------|:--------------:|:------------------:|:---------------:|:-------------:|
| **Default (0x01)** | ✓ OK | ✓ OK | ✓ OK | ✓ OK |
| **Programming (0x02)** | ✓ OK | ✗ NRC 0x22 | ✗ NRC 0x22 | ✗ NRC 0x22 |
| **Extended (0x03)** | ✓ OK | ✗ NRC 0x22 | ✓ OK (re-enter) | ✗ NRC 0x22 |
| **Safety (0x04)** | ✓ OK | ✗ NRC 0x22 | ✗ NRC 0x22 | ✓ OK (re-enter) |

---

## Part 2: Negative Response Codes (NRCs)

### NRC Decision Priority (Processing Order)

```
1. Check Message Length → NRC 0x13 if wrong
2. Check Subfunction Exists → NRC 0x13 if missing
3. Check Subfunction Valid → NRC 0x12 if invalid
4. Check Session Transition → NRC 0x22 if blocked
5. Check Vehicle Conditions → NRC 0x22 if not met
6. SUCCESS → Positive Response 0x50
```

### NRC Reference Table

| NRC | Hex | Name | Trigger Condition | Recovery Action |
|-----|-----|------|-------------------|-----------------|
| 0x12 | Sub-Function Not Supported | Subfunction not in valid range | Use 0x01, 0x02, 0x03, or 0x04 |
| 0x13 | Incorrect Message Length | Request ≠ 2 bytes | Send exactly 2 bytes |
| 0x22 | Conditions Not Correct | Invalid transition or vehicle state | Return to Default first or fix conditions |
| 0x33 | Security Access Denied | Session requires security (rare for SID 10) | Unlock security first |
| 0x7F | Service Not Supported in Active Session | Session-specific restriction | Change session first |

---

## Part 3: Test Cases - Basic Validation

## TC-01: Valid Session Transitions (Positive Response)

### TC-01.1: Default Session Entry/Re-entry
**Objective**: Verify Default session can be entered from any state

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Power cycle ECU | Session = Default | Verify via 0x22 F1 86 |
| 1 | Send: `10 01` | `50 01 00 32 01 F4` | Byte 0 = 0x50, Byte 1 = 0x01 |
| 2 | Verify P2 timing | P2 = 0x0032 (50ms) | Bytes 2-3 correct |
| 3 | Verify P2* timing | P2* = 0x01F4 (5000ms) | Bytes 4-5 correct |
| Post | Verify session | Session = 0x01 | State machine updated |

---

### TC-01.2: Default to Programming Session
**Objective**: Verify Programming session entry from Default

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset to Default: `10 01` | Session = 0x01 | Confirmed |
| Pre | Verify vehicle stationary | Speed = 0 km/h | Required for Programming |
| 1 | Send: `10 02` | `50 02 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x02 | Changed to Programming |
| 3 | Verify security state | Security = LOCKED | Auto-locked on entry |
| Post | Verify S3 timer started | Inactivity monitoring | Active |

---

### TC-01.3: Default to Extended Session
**Objective**: Verify Extended session entry with correct P2 timing change

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset to Default: `10 01` | Session = 0x01 | Confirmed |
| 1 | Send: `10 03` | `50 03 00 64 01 F4` | Positive response |
| 2 | Verify P2 timing change | P2 = 0x0064 (100ms) | Extended timing applied |
| 3 | Verify session state | Session = 0x03 | Changed to Extended |
| Post | Attempt Security Access: `27 01` | `67 01 [SEED]` | Now available |

---

### TC-01.4: Default to Safety Session
**Objective**: Verify Safety session entry

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset to Default: `10 01` | Session = 0x01 | Confirmed |
| 1 | Send: `10 04` | `50 04 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x04 | Changed to Safety |
| 3 | Verify UI display | Shows "Safety" | Not "Unknown" |

---

### TC-01.5: Extended to Default Session
**Objective**: Verify return to Default from Extended

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Extended: `10 03` | Session = 0x03 | Confirmed |
| 1 | Send: `10 01` | `50 01 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x01 | Changed to Default |
| 3 | Verify P2 timing | P2 = 0x0032 (50ms) | Default timing restored |

---

### TC-01.6: Programming to Default Session
**Objective**: Verify return to Default from Programming

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Programming: `10 02` | Session = 0x02 | Confirmed |
| 1 | Send: `10 01` | `50 01 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x01 | Changed to Default |

---

### TC-01.7: Safety to Default Session
**Objective**: Verify return to Default from Safety

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Safety: `10 04` | Session = 0x04 | Confirmed |
| 1 | Send: `10 01` | `50 01 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x01 | Changed to Default |

---

### TC-01.8: Extended Session Re-entry
**Objective**: Verify Extended session can be re-entered (preserves state)

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Extended: `10 03` | Session = 0x03 | Confirmed |
| 1 | Send: `10 03` | `50 03 00 64 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x03 | Remains Extended |

---

### TC-01.9: Safety Session Re-entry
**Objective**: Verify Safety session can be re-entered

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Safety: `10 04` | Session = 0x04 | Confirmed |
| 1 | Send: `10 04` | `50 04 00 32 01 F4` | Positive response |
| 2 | Verify session state | Session = 0x04 | Remains Safety |

---

## TC-02: Invalid Session Transitions (NRC 0x22)

### TC-02.1: Extended → Programming (BLOCKED)
**Objective**: Verify transition from Extended to Programming is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01` | Session = 0x01 | Start fresh |
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` | Success |
| 2 | Attempt Programming: `10 02` | `7F 10 22` | **NRC 0x22** |
| 3 | Verify session unchanged | Session = 0x03 | Still Extended |
| Recovery | Return to Default: `10 01` | `50 01 00 32 01 F4` | Required path |
| Recovery | Now enter Programming: `10 02` | `50 02 00 32 01 F4` | Success |

---

### TC-02.2: Extended → Safety (BLOCKED)
**Objective**: Verify transition from Extended to Safety is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Enter Extended: `10 03` | Session = 0x03 | Confirmed |
| 1 | Attempt Safety: `10 04` | `7F 10 22` | **NRC 0x22** |
| 2 | Verify session unchanged | Session = 0x03 | Still Extended |

---

### TC-02.3: Programming → Extended (BLOCKED)
**Objective**: Verify transition from Programming to Extended is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01`, then: `10 02` | Session = 0x02 | In Programming |
| 1 | Attempt Extended: `10 03` | `7F 10 22` | **NRC 0x22** |
| 2 | Verify session unchanged | Session = 0x02 | Still Programming |

---

### TC-02.4: Programming → Programming Re-entry (BLOCKED)
**Objective**: Verify Programming session CANNOT be re-entered

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01`, then: `10 02` | Session = 0x02 | In Programming |
| 1 | Attempt re-enter: `10 02` | `7F 10 22` | **NRC 0x22 - Must go to Default first** |
| 2 | Verify session unchanged | Session = 0x02 | Still Programming |

---

### TC-02.5: Programming → Safety (BLOCKED)
**Objective**: Verify transition from Programming to Safety is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01`, then: `10 02` | Session = 0x02 | In Programming |
| 1 | Attempt Safety: `10 04` | `7F 10 22` | **NRC 0x22** |
| 2 | Verify session unchanged | Session = 0x02 | Still Programming |

---

### TC-02.6: Safety → Extended (BLOCKED)
**Objective**: Verify transition from Safety to Extended is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01`, then: `10 04` | Session = 0x04 | In Safety |
| 1 | Attempt Extended: `10 03` | `7F 10 22` | **NRC 0x22** |
| 2 | Verify session unchanged | Session = 0x04 | Still Safety |

---

### TC-02.7: Safety → Programming (BLOCKED)
**Objective**: Verify transition from Safety to Programming is blocked

| Step | Action | Expected Result | Pass Criteria |
|------|--------|-----------------|---------------|
| Pre | Reset: `10 01`, then: `10 04` | Session = 0x04 | In Safety |
| 1 | Attempt Programming: `10 02` | `7F 10 22` | **NRC 0x22** |
| 2 | Verify session unchanged | Session = 0x04 | Still Safety |

---

## TC-03: Subfunction Validation (NRC 0x12)

### TC-03.1: Invalid Subfunction 0x00
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 00` | `7F 10 12` (Sub-Function Not Supported) |

### TC-03.2: Reserved ISO Range (0x05-0x3F)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 05` | `7F 10 12` |
| 2 | Send: `10 20` | `7F 10 12` |
| 3 | Send: `10 3F` | `7F 10 12` |

### TC-03.3: Manufacturer Range (0x40-0x5F) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 40` | `7F 10 12` |
| 2 | Send: `10 5F` | `7F 10 12` |

### TC-03.4: Supplier Range (0x60-0x7E) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 60` | `7F 10 12` |
| 2 | Send: `10 7E` | `7F 10 12` |

### TC-03.5: Reserved Subfunction 0x7F
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 7F` | `7F 10 12` |

### TC-03.6: Invalid Range Above 0x7F
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 80` | `7F 10 12` |
| 2 | Send: `10 FF` | `7F 10 12` |

---

## TC-04: Message Length Validation (NRC 0x13)

### TC-04.1: Message Too Short (1 byte)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10` | `7F 10 13` (Incorrect Message Length) |

### TC-04.2: Message Too Long (3 bytes)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01 00` | `7F 10 13` |

### TC-04.3: Message Too Long (4+ bytes)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01 00 00` | `7F 10 13` |
| 2 | Send: `10 01 AA BB CC DD` | `7F 10 13` |

---

## TC-05: Suppress Positive Response Bit

### TC-05.1: Suppress for Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 81` | No response (suppressed) |
| Post | Verify session | Session = 0x01 (changed!) |

### TC-05.2: Suppress for Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Reset: `10 01` | Session = 0x01 |
| 1 | Send: `10 83` | No response (suppressed) |
| Post | Verify session | Session = 0x03 (changed!) |

### TC-05.3: Suppress for Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Reset: `10 01` | Session = 0x01 |
| 1 | Send: `10 82` | No response (suppressed) |
| Post | Verify session | Session = 0x02 (changed!) |

### TC-05.4: Suppress Does NOT Apply to Negative Responses
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended: `10 03` | Session = 0x03 |
| 1 | Send: `10 82` (Suppress + Programming) | `7F 10 22` (**NRC still sent!**) |
| Post | Verify session | Session = 0x03 (unchanged) |

---

## Part 4: Service Interaction Testing

## TC-06: Security Access Behavior

### TC-06.1: Security Reset on Session Change (Extended → Default)
**Objective**: Verify security is locked when leaving Extended

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Request Seed: `27 01` | `67 01 [SEED]` |
| 3 | Send Key: `27 02 [KEY]` | `67 02` - Security UNLOCKED |
| 4 | Verify write access: `2E F1 90 [DATA]` | `6E F1 90` - Success |
| 5 | Change to Default: `10 01` | `50 01 00 32 01 F4` |
| 6 | Attempt write: `2E F1 90 [DATA]` | `7F 2E 7F` (Service Not Supported) |
| Post | Security state | **LOCKED** (reset by session change!) |

---

### TC-06.2: Security Reset on Extended Re-entry
**Objective**: Verify security is reset even when re-entering Extended

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Unlock Security: `27 01`/`27 02` | Security UNLOCKED |
| 3 | Re-enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 4 | Attempt protected write | `7F 2E 33` (Security Access Denied) |
| Post | Security state | **LOCKED** (reset by re-entry!) |

---

### TC-06.3: Security in Programming Session
**Objective**: Test security flow in Programming session

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming: `10 02` | `50 02 00 32 01 F4` |
| 2 | Attempt Download: `34 00 44...` | `7F 34 33` (Security Required) |
| 3 | Request Seed: `27 01` | `67 01 [SEED]` |
| 4 | Send Key: `27 02 [KEY]` | `67 02` - Security UNLOCKED |
| 5 | Retry Download: `34 00 44...` | `74...` - Success |

---

## TC-07: S3 Session Timeout Behavior

### TC-07.1: Timeout in Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Wait 5+ seconds (no activity) | S3 timer expires |
| Post | Verify session | Auto-reverted to Default (0x01) |
| Post | Verify security | Security LOCKED |

---

### TC-07.2: Timeout in Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming: `10 02` | `50 02 00 32 01 F4` |
| 2 | Wait 5+ seconds (no activity) | S3 timer expires |
| Post | Verify session | Auto-reverted to Default (0x01) |

---

### TC-07.3: S3 Reset by Tester Present (0x3E)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Wait 4 seconds | Timer counting |
| 3 | Send Tester Present: `3E 00` | `7E 00` - Timer RESET |
| 4 | Wait 4 seconds | Timer counting again |
| Post | Verify session | Still Extended (0x03) |

---

### TC-07.4: S3 Reset by Any Valid Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Wait 4 seconds | Timer counting |
| 3 | Send Read DTC: `19 02 FF` | Valid response - Timer RESET |
| 4 | Wait 4 seconds | Timer counting again |
| Post | Verify session | Still Extended (0x03) |

---

## TC-08: Response Timing Parameters

### TC-08.1: P2 Timing in Default Session
| Step | Action | Expected/Actual |
|------|--------|-----------------|
| 1 | Send: `10 01` | Response received |
| 2 | Parse Bytes 2-3 | P2 = 0x0032 = 50ms |
| 3 | Parse Bytes 4-5 | P2* = 0x01F4 = 5000ms |

### TC-08.2: P2 Timing in Extended Session
| Step | Action | Expected/Actual |
|------|--------|-----------------|
| 1 | Send: `10 03` | Response received |
| 2 | Parse Bytes 2-3 | P2 = 0x0064 = 100ms |
| 3 | Parse Bytes 4-5 | P2* = 0x01F4 = 5000ms |

### TC-08.3: P2 Timing in Programming Session
| Step | Action | Expected/Actual |
|------|--------|-----------------|
| 1 | Send: `10 02` | Response received |
| 2 | Parse Bytes 2-3 | P2 = 0x0032 = 50ms |

### TC-08.4: P2 Timing in Safety Session
| Step | Action | Expected/Actual |
|------|--------|-----------------|
| 1 | Send: `10 04` | Response received |
| 2 | Parse Bytes 2-3 | P2 = 0x0032 = 50ms |

---

## Part 5: Error Recovery Testing

## TC-09: Error Recovery Procedures

### TC-09.1: Recovery from Invalid Transition Attempt
**Objective**: Verify correct recovery path from blocked transition

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Attempt Programming: `10 02` | `7F 10 22` (BLOCKED) |
| 3 | Verify session | Still Extended |
| 4 | **Recovery**: Return to Default: `10 01` | `50 01 00 32 01 F4` |
| 5 | Now enter Programming: `10 02` | `50 02 00 32 01 F4` ✓ |

---

### TC-09.2: Recovery from Security Lost After Session Switch
**Objective**: Demonstrate proper security handling across sessions

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | Success |
| 2 | Unlock Security: `27 01`/`27 02` | Security UNLOCKED |
| 3 | Change to Default: `10 01` | Success (Security LOST!) |
| 4 | **Wrong**: Enter Programming: `10 02` | Success |
| 5 | Attempt Download: `34...` | `7F 34 33` (Security Denied) |
| 6 | **Recovery**: Unlock again: `27 01`/`27 02` | Security UNLOCKED |
| 7 | Retry Download: `34...` | Success ✓ |

---

### TC-09.3: Recovery from S3 Timeout
**Objective**: Verify state recovery after timeout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | Success |
| 2 | Unlock Security | Success |
| 3 | Wait 5+ seconds | S3 timeout triggers |
| 4 | Verify session | Auto-reverted to Default |
| 5 | **Recovery**: Re-enter Extended: `10 03` | Success |
| 6 | Re-unlock Security | Required again |
| 7 | Continue operations | Success ✓ |

---

### TC-09.4: Recovery from Communication Loss
**Objective**: Verify ECU returns to safe state

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming: `10 02` | Success |
| 2 | Simulate communication loss | No requests for S3 period |
| 3 | After S3 timeout | ECU reverts to Default |
| 4 | Reconnect and verify | Session = Default, Security = LOCKED |

---

## Part 6: Service Interaction Workflows

## TC-10: Complex Workflow Scenarios

### TC-10.1: Read-Only Diagnostic Workflow
**Pattern**: No session change needed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Optional Default: `10 01` | `50 01 00 32 01 F4` |
| 2 | Read VIN: `22 F1 90` | `62 F1 90 [VIN_DATA]` |
| 3 | Read Part Number: `22 F1 87` | `62 F1 87 [PART_DATA]` |
| 4 | Count DTCs: `19 01 FF` | `59 01 [COUNT]` |
| 5 | Read DTCs: `19 02 FF` | `59 02 [DTC_DATA]` |

---

### TC-10.2: Secure Write Configuration Workflow
**Pattern**: Extended Session + Security Required

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Request Seed: `27 01` | `67 01 [SEED]` |
| 3 | Send Key: `27 02 [KEY]` | `67 02` (Unlocked) |
| 4 | Write Config: `2E F1 8C [DATA]` | `6E F1 8C` (Success) |
| 5 | Verify Write: `22 F1 8C` | `62 F1 8C [DATA]` (Confirmed) |
| 6 | Return to Default: `10 01` | `50 01 00 32 01 F4` |

---

### TC-10.3: DTC Management Workflow
**Pattern**: Read in Default, Clear in Extended

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Read DTCs: `19 02 FF` | `59 02 [DTC_DATA]` |
| 2 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 3 | Clear DTCs: `14 FF FF FF` | `54` (Success) |
| 4 | Verify cleared: `19 01 FF` | `59 01 00` (0 DTCs) |
| 5 | Return to Default: `10 01` | `50 01 00 32 01 F4` |

---

### TC-10.4: Routine Control Workflow
**Pattern**: Extended Session + Optional Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | `50 03 00 64 01 F4` |
| 2 | Start Routine: `31 01 02 03` | `71 01 02 03` |
| 3 | Get Results: `31 03 02 03` | `71 03 02 03 [RESULTS]` |
| 4 | Stop Routine: `31 02 02 03` | `71 02 02 03` |
| 5 | Return to Default: `10 01` | `50 01 00 32 01 F4` |

---

### TC-10.5: Full Firmware Update Workflow
**Pattern**: Programming Session + Security + Flash Services

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming: `10 02` | `50 02 00 32 01 F4` |
| 2 | Request Seed: `27 01` | `67 01 [SEED]` |
| 3 | Send Key: `27 02 [KEY]` | `67 02` (Unlocked) |
| 4 | Request Download: `34 00 44...` | `74 [MAX_BLOCK]` |
| 5 | Transfer Block 1: `36 01 [DATA]` | `76 01` |
| 6 | Transfer Block 2: `36 02 [DATA]` | `76 02` |
| ... | Continue for all blocks | `76 [N]` |
| N | Request Transfer Exit: `37` | `77` |
| N+1 | ECU Reset: `11 01` | `51 01` → Auto Default |

---

## TC-11: Edge Cases and Stress Testing

### TC-11.1: Rapid Session Changes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01` | `50 01 00 32 01 F4` |
| 2 | Immediately: `10 03` | `50 03 00 64 01 F4` |
| 3 | Immediately: `10 01` | `50 01 00 32 01 F4` |
| 4 | Immediately: `10 04` | `50 04 00 32 01 F4` |
| 5 | Immediately: `10 01` | `50 01 00 32 01 F4` |

---

### TC-11.2: Session Change at S3 Timeout Boundary
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | Success |
| 2 | Wait exactly 4900ms | Just before timeout |
| 3 | Send: `10 03` | `50 03 00 64 01 F4` (timer reset) |
| Post | Verify session | Still Extended |

---

### TC-11.3: Multiple Suppress Bit Requests
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 81` | No response |
| 2 | Send: `10 83` | No response |
| 3 | Send: `10 01` | `50 01 00 32 01 F4` |
| Post | Session history | Default → Extended → Default |

---

### TC-11.4: Service Dependency Violations
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | In Default Session | Session = 0x01 |
| 1 | Attempt Write: `2E F1 90 [DATA]` | `7F 2E 7F` (Wrong Session) |
| 2 | Attempt Security: `27 01` | `7F 27 7F` (Wrong Session) |
| 3 | Attempt Download: `34...` | `7F 34 7F` (Wrong Session) |

---

### TC-11.5: Transfer Data Without Request Download
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming, Unlock Security | Ready |
| 1 | Attempt Transfer: `36 01 [DATA]` | `7F 36 24` (Request Sequence Error) |
| 2 | **Fix**: Request Download: `34...` | `74...` |
| 3 | Retry Transfer: `36 01 [DATA]` | `76 01` (Success) |

---

## Part 7: Automotive Production Testing

## TC-12: Production ECU Simulation

### TC-12.1: ECU Power-On Default State
| Verification | Expected |
|--------------|----------|
| Session at power-on | Default (0x01) |
| Security at power-on | LOCKED |
| S3 timer | Not active in Default |
| Communication ready | Within 100ms of power |

---

### TC-12.2: Vehicle Speed Interlock (Programming Session)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Set vehicle speed = 10 km/h | Moving |
| 1 | Attempt Programming: `10 02` | `7F 10 22` (Conditions Not Correct) |
| 2 | Set vehicle speed = 0 km/h | Stationary |
| 3 | Retry Programming: `10 02` | `50 02 00 32 01 F4` (Success) |

---

### TC-12.3: Ignition State Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Turn ignition OFF | ECU in standby |
| 1 | Send any request | `7F [SID] 22` (Conditions Not Correct) |
| 2 | Turn ignition ON | ECU active |
| 3 | Retry request | Valid response |

---

### TC-12.4: Battery Voltage Monitoring
| Condition | Expected Behavior |
|-----------|-------------------|
| Voltage < 9V | May reject programming operations |
| Voltage 9V-16V | Normal operation |
| Voltage > 16V | May protect ECU |

---

## Part 8: Test Summary and Traceability

### Test Coverage Matrix

| Category | Test Cases | Priority | ISO Reference |
|----------|------------|----------|---------------|
| Valid Transitions | TC-01.1 - TC-01.9 | **CRITICAL** | ISO 14229-1 §9.2.2 |
| Invalid Transitions | TC-02.1 - TC-02.7 | **CRITICAL** | ISO 14229-1 Table 8 |
| Subfunction Validation | TC-03.1 - TC-03.6 | **HIGH** | ISO 14229-1 §9.2.1 |
| Message Length | TC-04.1 - TC-04.3 | **HIGH** | ISO 14229-1 §8.2.2 |
| Suppress Response | TC-05.1 - TC-05.4 | **MEDIUM** | ISO 14229-1 §8.1.2 |
| Security Interaction | TC-06.1 - TC-06.3 | **CRITICAL** | ISO 14229-1 §9.4 |
| S3 Timeout | TC-07.1 - TC-07.4 | **HIGH** | ISO 14229-1 §7.5 |
| Timing Parameters | TC-08.1 - TC-08.4 | **MEDIUM** | ISO 14229-1 §7.2 |
| Error Recovery | TC-09.1 - TC-09.4 | **HIGH** | Best Practice |
| Service Workflows | TC-10.1 - TC-10.5 | **CRITICAL** | Integration |
| Edge Cases | TC-11.1 - TC-11.5 | **MEDIUM** | Robustness |
| Production Testing | TC-12.1 - TC-12.4 | **HIGH** | OEM Requirements |

### NRC Coverage Table

| NRC | Meaning | Test Cases |
|-----|---------|------------|
| 0x12 | Sub-Function Not Supported | TC-03.x |
| 0x13 | Incorrect Message Length | TC-04.x |
| 0x22 | Conditions Not Correct | TC-02.x, TC-05.4, TC-12.2, TC-12.3 |
| 0x24 | Request Sequence Error | TC-11.5 |
| 0x33 | Security Access Denied | TC-06.3, TC-09.2 |
| 0x7F | Service Not Supported in Active Session | TC-06.1, TC-11.4 |

---

## Appendix A: Quick Reference

### Request Format
```
Byte 0: 0x10 (SID)
Byte 1: SubFunction (0x01-0x04, or with bit 7 = suppress)
```

### Positive Response Format
```
Byte 0: 0x50 (SID + 0x40)
Byte 1: SubFunction echo
Bytes 2-3: P2 timing (high byte first)
Bytes 4-5: P2* timing (high byte first)
```

### Negative Response Format
```
Byte 0: 0x7F (Negative indicator)
Byte 1: 0x10 (Original SID)
Byte 2: NRC (error code)
```

### Common Test Sequences
```
Reset to Default:     10 01 → 50 01 00 32 01 F4
Enter Extended:       10 03 → 50 03 00 64 01 F4
Enter Programming:    10 02 → 50 02 00 32 01 F4 (from Default only!)
Enter Safety:         10 04 → 50 04 00 32 01 F4
Suppress Response:    10 8X → (no response, session changed)
```

---

**Document Version**: 2.0  
**Last Updated**: December 2025  
**Based On**: ISO 14229-1:2020, SID_10_DIAGNOSTIC_SESSION_CONTROL.md, SID_10_PRACTICAL_IMPLEMENTATION.md, SID_10_SERVICE_INTERACTIONS.md  
**Compliance**: Automotive ECU Production Testing Standards
