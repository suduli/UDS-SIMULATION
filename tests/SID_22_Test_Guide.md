# SID 22 Test Suite Guide

## Overview

The test suite contains **20 comprehensive test cases** organized into 12 categories, covering all aspects of the SID 22 (Read Data By Identifier) implementation.

**Location**: `tests/SID_22_Test_Cases.json`

## Test Categories

### 1. **Basic Single DID** (2 tests)
- Reading individual public DIDs (VIN, ECU HW Number)
- Verifies basic positive response format

### 2. **Multi-DID Support** (2 tests)
- Reading 2, 3, and 4 DIDs in a single request
- Verifies response concatenation

### 3. **Session Validation - Failure** (2 tests)
- Attempting to read sensor DIDs in DEFAULT session
- Expected: NRC 0x7F

### 4. **Session Validation - Success** (2 tests)
- Reading sensor DIDs after entering EXTENDED session
- Verifies session requirement enforcement works

### 5. **Session Validation - Mixed** (1 test)
- Multi-DID request mixing valid and invalid sessions
- Demonstrates **all-or-nothing** behavior

### 6. **Error - Invalid DID** (2 tests)
- Requesting non-existent DIDs
- Expected: NRC 0x31

### 7. **Error - Message Length** (3 tests)
- Empty request, incomplete DIDs, odd byte counts
- Expected: NRC 0x13

### 8. **Edge Case - Response Length** (2 tests)
- Large single DID, multiple large DIDs
- Verifies buffer accumulation

### 9. **Security Validation** (1 test)
- Framework verification (all current DIDs are public)

### 10. **Boundary Testing** (1 test)
- Minimum valid request size

### 11. **Session Transitions** (1 test)
- Multi-step test verifying behavior across session changes

### 12. **All Sessions Coverage** (1 test)
- Verifies DIDs are accessible in all required sessions

## NRC Coverage

| NRC  | Name                                      | Test Cases |
|------|-------------------------------------------|------------|
| 0x13 | Incorrect Message Length                  | SID22-012, 013, 014 |
| 0x14 | Response Too Long                         | Infrastructure ready* |
| 0x31 | Request Out Of Range                      | SID22-010, 011 |
| 0x7F | Service Not Supported In Active Session   | SID22-005, 006, 009 |

\* NRC 0x14 requires 100+ DIDs to trigger with current data sizes - infrastructure is in place but not easily testable

## How to Run Tests Manually

### Quick Test Commands

```
Test 1 - Read VIN:
Command: 22 F1 90
Expected: 62 F1 90 + 17 VIN bytes

Test 2 - Multi-DID (VIN + HW):
Command: 22 F1 90 F1 91
Expected: 62 F1 90 [VIN] F1 91 [HW]

Test 3 - Session Error:
Command: 22 01 05 (in DEFAULT session)
Expected: 7F 22 7F

Test 4 - Session Success:
1. Command: 10 03 (enter EXTENDED)
2. Command: 22 01 05
Expected: 62 01 05 + temp data

Test 5 - Invalid DID:
Command: 22 99 99
Expected: 7F 22 31

Test 6 - Bad Length:
Command: 22 F1 (only 1 byte)
Expected: 7F 22 13
```

### Full Test Execution

For each test case in the JSON file:

1. **Setup Preconditions**
   - Ensure correct session (DEFAULT, EXTENDED, etc.)
   - If `setup` array exists, execute those commands first

2. **Send Request**
   - Select Service ID from dropdown
   - Enter data bytes (space-separated hex)
   - Send command

3. **Verify Response**
   - Check response type (POSITIVE/NEGATIVE)
   - Verify SID and data pattern match expected
   - Confirm pass criteria

4. **Record Result**
   - Note actual response
   - Mark test as PASS/FAIL
   - Document any deviations

## Test Case Format

Each test case includes:

```json
{
  "id": "SID22-XXX",
  "category": "Category Name",
  "name": "Test Name",
  "description": "What this test verifies",
  "preconditions": {
    "session": "DEFAULT|EXTENDED|PROGRAMMING",
    "security": "LOCKED|UNLOCKED",
    "ignition": "ON|OFF",
    "setup": [] // Optional setup commands
  },
  "request": {
    "sid": "0x22",
    "data": ["0xXX", "0xYY", ...]
  },
  "expectedResponse": {
    "type": "POSITIVE|NEGATIVE",
    "sid": "0x62|0x7F",
    "nrc": "0xXX", // If negative
    "dataPattern": {} // If positive
  },
  "passCriteria": "Human-readable pass condition"
}
```

## Key Features Tested

### ✅ Multi-DID Processing
- **SID22-003**: 2 DIDs
- **SID22-004**: 3 DIDs
- **SID22-008**: Multiple sensor DIDs
- **SID22-016**: 4 large DIDs

### ✅ All-or-Nothing Behavior
- **SID22-009**: Valid + session-invalid DID → entire request fails
- **SID22-011**: Valid + non-existent DID → entire request fails

### ✅ Session Requirements
- **SID22-005, 006**: Fail in wrong session
- **SID22-007, 008**: Success in correct session
- **SID22-019**: Transition testing
- **SID22-020**: Multi-session coverage

### ✅ Error Handling
- **Length validation**: Empty, incomplete, odd-length requests
- **Invalid DIDs**: Non-existent DID codes
- **Session mismatch**: Sensor DIDs in DEFAULT session

## Expected Results Summary

### Test Distribution
- **Positive Response**: 11 tests
- **Negative Response (NRC 0x7F)**: 3 tests
- **Negative Response (NRC 0x31)**: 2 tests
- **Negative Response (NRC 0x13)**: 3 tests
- **Multi-Step Tests**: 1 test

### Session Requirements
- **DEFAULT Session**: Works for public DIDs (VIN, HW, SW, Date)
- **EXTENDED Session**: Required for sensor DIDs (RPM, Speed, Temp, Voltage, MAF)
- **PROGRAMMING Session**: Works for public DIDs

## Automated Testing (Future)

The JSON format is designed to be machine-readable for future automated testing:

```javascript
// Pseudo-code for automated test runner
testCases.forEach(testCase => {
  // Setup preconditions
  if (testCase.preconditions.setup) {
    executSetup(testCase.preconditions.setup);
  }
  
  // Send request
  const response = sendUDSRequest(testCase.request);
  
  // Verify response
  const passed = verifyResponse(response, testCase.expectedResponse);
  
  // Report result
  logTestResult(testCase.id, passed);
});
```

## Notes

1. **Security Tests**: All current DIDs have `requiredSecurity: 0`, so they work without security unlock. The framework supports secured DIDs for future use.

2. **Response Length**: NRC 0x14 is implemented but difficult to test without 100+ DIDs in a single request.

3. **Conditions Check**: NRC 0x22 infrastructure is ready but not used by current DIDs.

4. **Test Order**: Tests can be run in any order, but session-based tests should reset to DEFAULT between tests.

5. **Data Values**: Some DIDs return dynamic data (e.g., sensors). Tests should verify structure, not exact values.

## Quick Reference - DID Reference

### Public DIDs (Available in DEFAULT)
- **0xF186**: Active Diagnostic Session (1 byte)
- **0xF190**: VIN (17 bytes)
- **0xF191**: ECU HW Number (11 bytes)
- **0xF194**: ECU SW Number (11 bytes)
- **0xF195**: Manufacturing Date (8 bytes)

### Sensor DIDs (Require EXTENDED)
- **0x010C**: Engine RPM
- **0x010D**: Vehicle Speed
- **0x0105**: Coolant Temperature
- **0x0142**: Battery Voltage
- **0x0110**: Mass Air Flow

---

**Total Test Cases**: 20  
**Total Category Coverage**: 12 categories  
**NRC Coverage**: 4 negative response codes  
**Feature Coverage**: Multi-DID, Session Validation, Security Framework, Error Handling
