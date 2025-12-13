# SID 10 Subfunction 04 (Safety System Diagnostic Session) - Test Cases

**Service**: Diagnostic Session Control (0x10)  
**Subfunction**: Safety System Diagnostic Session (0x04)  
**ISO Reference**: ISO 14229-1:2020 Section 9.2  
**Test Date**: 2025-12-05

---

## Test Environment
- UDS Simulator running at `http://localhost:5173`
- Initial State: Default Session (0x01)

---

## Test Cases

### 1. Positive Response Tests

| ID | Description | Request | Expected Response | Result |
|----|-------------|---------|-------------------|--------|
| TC-01 | Enter Safety Session from Default | `10 04` | `50 04 00 32 01 F4` | |
| TC-02 | Re-enter Safety Session | `10 04` | `50 04 00 32 01 F4` | |
| TC-03 | Return to Default from Safety | `10 01` | `50 01 00 32 01 F4` | |
| TC-04 | Suppress positive response bit | `10 84` | (no response) | |

### 2. Session Transition Tests (From Default)

| ID | Description | Request | Expected Response | Result |
|----|-------------|---------|-------------------|--------|
| TC-05 | Default → Safety | `10 04` | `50 04 00 32 01 F4` | |
| TC-06 | Default → Programming | `10 02` | `50 02 00 32 01 F4` | |
| TC-07 | Default → Extended | `10 03` | `50 03 00 64 01 F4` | |

### 3. Invalid Transition Tests

| ID | Description | Setup | Request | Expected Response | Result |
|----|-------------|-------|---------|-------------------|--------|
| TC-08 | Extended → Safety | Enter Extended first | `10 04` | `7F 10 22` | |
| TC-09 | Programming → Safety | Enter Programming first | `10 04` | `7F 10 22` | |
| TC-10 | Safety → Extended | Enter Safety first | `10 03` | `7F 10 22` | |
| TC-11 | Safety → Programming | Enter Safety first | `10 02` | `7F 10 22` | |

### 4. Error Handling Tests

| ID | Description | Request | Expected Response | Result |
|----|-------------|---------|-------------------|--------|
| TC-12 | Invalid subfunction (0x00) | `10 00` | `7F 10 12` | |
| TC-13 | Reserved subfunction (0x05) | `10 05` | `7F 10 12` | |
| TC-14 | Extra bytes in request | `10 04 AA` | `7F 10 13` | |
| TC-15 | Missing subfunction | `10` | `7F 10 13` | |

---

## Timing Parameter Verification

| Session | P2 Server Max | P2* Server Max | Response Bytes 3-6 |
|---------|---------------|----------------|-------------------|
| Default (0x01) | 50ms | 5000ms | `00 32 01 F4` |
| Programming (0x02) | 50ms | 5000ms | `00 32 01 F4` |
| Extended (0x03) | 100ms | 5000ms | `00 64 01 F4` |
| Safety (0x04) | 50ms | 5000ms | `00 32 01 F4` |

---

## Security Access Reset Verification

**Expected Behavior**: Security access should be locked when transitioning to Safety session.

| ID | Test Steps | Expected |
|----|------------|----------|
| TC-16 | 1. Enter Extended (10 03)<br>2. Unlock security (27 01, 27 02)<br>3. Enter Safety (10 01, 10 04)<br>4. Attempt security-protected operation | Security locked, operation rejected |

---

## Notes
- All test cases assume initial state is Default Session
- NRC 0x22 = Conditions Not Correct
- NRC 0x12 = Sub-Function Not Supported  
- NRC 0x13 = Incorrect Message Length
