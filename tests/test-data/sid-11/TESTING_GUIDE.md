# SID 11 Testing Guide

## 🎯 Objective
Verify that the session restriction fixes for SID 0x11 (ECU Reset) are working correctly.

## ⚙️ Prerequisites
- UDS Simulator is running in development mode (`npm run dev`)
- Browser is open to the simulator interface
- Access to `tests/test-data/sid-11/SID11_TestCases.json`

## 🧪 Quick Verification Test (Manual)

### Test the 3 Fixed Cases

1. **Open the UDS Simulator** in your browser (should already be running on localhost)

2. **Test TC-02.1: Soft Reset in Default Session**
   ```
   Step 1: Ensure you're in Default Session (0x01)
           - If not, send: 10 01
           
   Step 2: Try Soft Reset (should now FAIL with NRC 0x7E)
           - Send: 11 03
           - Expected: 7F 11 7E (Sub-Function Not Supported In Active Session)
           - Before fix: Would return 51 03 (Success) ✗
           - After fix: Returns 7F 11 7E (NRC) ✓
   ```

3. **Test TC-02.2: Enable RPS in Default Session**
   ```
   Step 1: Ensure you're in Default Session (0x01)
           - Send: 10 01
           
   Step 2: Try Enable RPS (should now FAIL with NRC 0x7E)
           - Send: 11 04 32
           - Expected: 7F 11 7E
           - Before fix: Would return 51 04 32 (Success) ✗
           - After fix: Returns 7F 11 7E (NRC) ✓
   ```

4. **Test TC-02.3: Disable RPS in Default Session**
   ```
   Step 1: Ensure you're in Default Session (0x01)
           - Send: 10 01
           
   Step 2: Try Disable RPS (should now FAIL with NRC 0x7E)
           - Send: 11 05
           - Expected: 7F 11 7E
           - Before fix: Would return 51 05 (Success) ✗
           - After fix: Returns 7F 11 7E (NRC) ✓
   ```

### Test That Operations Now Work in Extended Session

5. **Verify Soft Reset in Extended Session (Should Work)**
   ```
   Step 1: Enter Extended Session
           - Send: 10 03
           - Expected: 50 03 00 64 01 F4
           
   Step 2: Try Soft Reset (should NOW WORK)
           - Send: 11 03
           - Expected: 51 03 (Success)
   ```

6. **Verify RPS in Extended Session (Should Work)**
   ```
   Step 1: Ensure you're in Extended Session
           - Send: 10 03
           
   Step 2: Enable RPS (should work)
           - Send: 11 04 32
           - Expected: 51 04 32 (Success)
           
   Step 3: Disable RPS (should work)
           - Send: 11 05
           - Expected: 51 05 (Success)
   ```

## 📊 Full Test Suite Run

### Option 1: Using the UI (Recommended)

1. **Navigate to Test Suite Runner** in the simulator interface
2. **Load Test File**: Browse to `tests/test-data/sid-11/SID11_TestCases.json`
3. **Click "Run All Tests"** (103 test cases)
4. **Wait for completion** (~1-2 minutes)
5. **Generate Report**
6. **Export/View Results**

### Option 2: Terminal (if available)

```bash
# From the UDS-SIMULATION directory
npm run test:sid11

# Or if there's a generic test runner
npm test -- sid-11
```

## ✅ Expected Results

### Before Fix
```
Total Requests:        103
Successful Responses:  81
Negative Responses:    22
Success Rate:          78.64%

FAILED TEST CASES:
- TC-02.1 (Row 12): Expected NRC 0x7E, got Success ❌
- TC-02.2 (Row 13): Expected NRC 0x7E, got Success ❌
- TC-02.3 (Row 14): Expected NRC 0x7E, got Success ❌
```

### After Fix
```
Total Requests:        103
Successful Responses:  84
Negative Responses:    19
Success Rate:          81.55%

FIXED TEST CASES:
- TC-02.1 (Row 12): Returns NRC 0x7E as expected ✓
- TC-02.2 (Row 13): Returns NRC 0x7E as expected ✓
- TC-02.3 (Row 14): Returns NRC 0x7E as expected ✓
```

## 📋 Detailed Test Matrix

| Test ID | Operation      | Session     | Expected Result | Before Fix | After Fix |
|---------|----------------|-------------|-----------------|------------|-----------|
| TC-02.1 | Soft Reset     | Default     | NRC 0x7E        | ❌ Success | ✅ NRC    |
| TC-02.2 | Enable RPS     | Default     | NRC 0x7E        | ❌ Success | ✅ NRC    |
| TC-02.3 | Disable RPS    | Default     | NRC 0x7E        | ❌ Success | ✅ NRC    |
| TC-02.4 | Hard Reset     | Safety      | NRC 0x7E        | ✅ NRC     | ✅ NRC    |
| TC-02.5 | Key Off/On     | Safety      | NRC 0x7E        | ✅ NRC     | ✅ NRC    |
| TC-02.6 | Soft Reset     | Safety      | NRC 0x7E        | ✅ NRC     | ✅ NRC    |
| TC-02.7 | Soft Reset     | Programming | NRC 0x7E        | ✅ NRC     | ✅ NRC    |

## 🔍 What to Look For

### In the Test Report

1. **NRC Breakdown Section**
   ```
   NRC Code | Description                                  | Count
   ---------|----------------------------------------------|-------
   0x7E     | Sub-Function Not Supported In Active Session | 9 (was 6)
   0x12     | Sub-Function Not Supported                   | 11
   0x13     | Incorrect Message Length                     | 5
   ```
   
   The count for NRC 0x7E should **increase from 6 to 9** (+3 cases).

2. **Test Log Entries** (Rows 12-14)
   ```
   Index | Description                                        | Response    | Status
   ------|---------------------------------------------------|-------------|--------
   12    | TC-02.1: Soft Reset in Default - expect NRC 0x7E  | 7F 11 7E    | NRC
   13    | TC-02.2: Enable RPS in Default - expect NRC 0x7E  | 7F 11 7E    | NRC
   14    | TC-02.3: Disable RPS in Default - expect NRC 0x7E | 7F 11 7E    | NRC
   ```

## 🐛 Troubleshooting

### If tests still fail:

1. **Clear browser cache** and reload
2. **Restart the dev server**:
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```
3. **Check the browser console** for errors
4. **Verify the code changes** in `src/services/UDSSimulator.ts` (lines 556-606)

### If session won't change:

- Send `10 01` to force return to Default Session
- Check that previous test didn't leave the ECU in a bad state
- Reset the simulator state if available in the UI

## 📝 Report Generation

After running the full test suite:

1. **Export the report** as CSV
2. **Save to**: `tests/test-data/sid-11/SID11_TestCases_report_AFTER_FIX.csv`
3. **Compare** with the old report to see the improvements

## 🎓 Understanding the Fix

### Session Hierarchy
```
Default (Basic)
  ├─ Hard Reset ✓
  ├─ Key Off/On ✓
  ├─ Soft Reset ✗ → Need Extended
  └─ RPS Control ✗ → Need Extended

Extended (Full Diagnostics)
  ├─ Hard Reset ✓
  ├─ Key Off/On ✓
  ├─ Soft Reset ✓
  └─ RPS Control ✓

Safety (Preserve State)
  ├─ Hard Reset ✗
  ├─ Key Off/On ✗
  ├─ Soft Reset ✗
  └─ RPS Control ✓ (For emergency shutdown)

Programming (Limited)
  ├─ Hard Reset ✓
  ├─ Key Off/On ✓
  ├─ Soft Reset ✗
  └─ RPS Control ✗
```

### Why This Matters

- **Default Session** is for basic diagnostics - shouldn't allow configuration changes
- **Extended Session** is for full diagnostic access - requires explicit tester request
- **Safety Session** preserves critical state - allows emergency shutdown but not restart
- **Programming Session** is for firmware updates - limits reset options

## 📚 Reference Documents

- Fix Summary: `tests/test-data/sid-11/SID11_FIX_SUMMARY.md`
- Before/After: `tests/test-data/sid-11/SID11_BEFORE_AFTER.md`
- ISO 14229-1:2020 Section 9.2 (ECU Reset Service)
