# SID 0x3E Tester Present - Verification Walkthrough

## Overview
This document outlines the steps to verify the implementation of UDS Service 0x3E (Tester Present) in the UDS Simulator.

## Verification Steps

### 1. Verify Service Availability
1. Open the UDS Simulator web interface.
2. Navigate to the "Request Builder" panel.
3. Click "Select a service..." or check the grid view.
4. Confirm **0x3E - Tester Present** is visible in the list.
5. Select it and verify the description and icon ("💓") appear.

### 2. Test Normal Response (0x00)
1. In Request Builder, select **0x3E - Tester Present**.
2. Enter Sub-Function: `00`.
3. Click **Send Request**.
4. **Expected Result**:
   - Positive Response: `7E 00`
   - Status: Success (Green)

### 3. Test Suppressed Response (0x80)
1. Enter Sub-Function: `80`.
2. Click **Send Request**.
3. **Expected Result**:
   - No response data displayed (or indication of suppressed response).
   - Simulator log might show "Suppressed Response".

### 4. Test Session Timeout Prevention
1. Enter **Extended Session** (0x10 03).
   - Response: `50 03 ...`
   - Observe the session timer (if visible) or wait 4 seconds.
2. Send **Tester Present** (0x3E 80) just before 5 seconds elapse.
3. Wait another 4 seconds.
4. Send **Read Data By Identifier** (0x22 F1 90) or any other request.
5. **Expected Result**:
   - The session should remain in **EXTENDED** (0x03).
   - If Tester Present works, the session will NOT revert to DEFAULT.

### 5. Test Invalid Sub-function (NRC 0x12)
1. Enter Sub-Function: `01` (or any value other than 00/80).
2. Click **Send Request**.
3. **Expected Result**:
   - Negative Response: `7F 3E 12`
   - Error: Sub-function Not Supported

### 6. Test Incorrect Message Length (NRC 0x13)
1. Switch to **Manual Mode**.
2. Enter `3E 00 FF` (extra byte).
3. Click **Send Request**.
4. **Expected Result**:
   - Negative Response: `7F 3E 13`
   - Error: Incorrect Message Length

## Automated Testing
(Future) A JSON test suite can be created to automate these checks.
