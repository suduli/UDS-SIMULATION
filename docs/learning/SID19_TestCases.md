# SID 19 Test Cases Documentation

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Test Suite File**: `SID19_TestCases.json`  
**Total Test Cases**: 80 requests

---

## Overview

This test suite provides comprehensive coverage for UDS Service ID 19 (ReadDTCInformation) as defined in ISO 14229-1:2020. It covers all 15 subfunctions and validates both positive and negative response handling.

---

## Test Categories

### TC-01: Subfunction 0x01 - Report Number of DTCs by Status Mask

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-01.1 | Count All DTCs (Mask 0xFF) | 59 01 FF 01 [count] |
| TC-01.2 | Count Confirmed (Mask 0x08) | 59 01 08 01 [count] |
| TC-01.3 | Count Pending (Mask 0x04) | 59 01 04 01 [count] |
| TC-01.4 | Count testFailed (Mask 0x01) | 59 01 01 01 [count] |
| TC-01.5 | Count MIL Active (Mask 0x80) | 59 01 80 01 [count] |
| TC-01.6 | Count with Zero Mask | 59 01 00 01 00 00 |

---

### TC-02: Subfunction 0x02 - Report DTC by Status Mask

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-02.1 | Read All DTCs (Mask 0xFF) | 59 02 FF [DTCs+Status] |
| TC-02.2 | Read Confirmed (Mask 0x08) | 59 02 08 [DTCs+Status] |
| TC-02.3 | Read Pending (Mask 0x04) | 59 02 04 [DTCs+Status] |
| TC-02.4 | Read Confirmed OR Failed (0x09) | 59 02 09 [DTCs+Status] |
| TC-02.5 | Read MIL Active (0x80) | 59 02 80 [DTCs+Status] |

---

### TC-03: Subfunction 0x03 - Report DTC Snapshot Identification

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-03.1 | Get all snapshot identifiers | 59 03 [DTCs+RecordNums] |

---

### TC-04: Subfunction 0x04 - Report DTC Snapshot Record

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-04.1 | Read Snapshot for 0x010101, Rec 1 | 59 04 [DTC] [Status] 01 [data] |
| TC-04.2 | Read All Snapshots (Rec 0xFF) | 59 04 [DTC] [Status] [all records] |
| TC-04.3 | Read Snapshot for P0300 | 59 04 01 03 00 [Status] [data] |
| TC-04.4 | Invalid DTC 0xFFFFFF | 7F 19 31 (Request Out of Range) |

---

### TC-05: Subfunction 0x06 - Report Extended Data Record

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-05.1 | Read Ext Data Rec 1 for 0x010101 | 59 06 [DTC] [Status] 01 [data] |
| TC-05.2 | Read All Ext Data (Rec 0xFF) | 59 06 [DTC] [Status] [all records] |
| TC-05.3 | Read Ext Data for P0300 | 59 06 01 03 00 [Status] [data] |

---

### TC-06: Subfunction 0x07 - Report Number by Severity Mask

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-06.1 | Count High Severity (0x60) | 59 07 [count] |
| TC-06.2 | Count Medium Severity (0x40) | 59 07 [count] |
| TC-06.3 | Count Low Severity (0x20) | 59 07 [count] |

---

### TC-07: Subfunction 0x08 - Report DTC by Severity Mask

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-07.1 | Read High Severity DTCs | 59 08 [Severity] [DTC] [Status] |
| TC-07.2 | Read Medium + Confirmed | 59 08 [Severity] [DTC] [Status] |

---

### TC-08: Subfunction 0x09 - Report Severity Information

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-08.1 | Get Severity for 0x010101 | 59 09 [Severity] [DTC] [Status] |
| TC-08.2 | Get Severity for P0300 | 59 09 [Severity] [DTC] [Status] |

---

### TC-09: Subfunction 0x0A - Report Supported DTCs

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-09.1 | Get ALL Supported DTCs | 59 0A [Mask] [DTCs...] |

---

### TC-10: Subfunctions 0x0B-0x0E - First/Most Recent

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-10.1 | SF 0x0B - First Test Failed | 59 0B [DTC] [Status] |
| TC-10.2 | SF 0x0C - First Confirmed | 59 0C [DTC] [Status] |
| TC-10.3 | SF 0x0D - Most Recent Failed | 59 0D [DTC] [Status] |
| TC-10.4 | SF 0x0E - Most Recent Confirmed | 59 0E [DTC] [Status] |

---

### TC-11: Subfunction 0x0F - Mirror Memory (Extended Session)

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-11.1 | Enter Extended Session | 50 03 [timing] |
| TC-11.2 | SF 0x0F in Extended | 59 0F [DTCs+Status] |

---

### TC-12: Session Restriction Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-12.1 | SF 0x0F in Default Session | 7F 19 22 (Conditions Not Correct) |

---

### TC-13: Message Length Validation (NRC 0x13)

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-13.1 | SF 0x01 - Missing Status Mask | 7F 19 13 |
| TC-13.2 | SF 0x02 - Missing Status Mask | 7F 19 13 |
| TC-13.3 | SF 0x04 - Incomplete DTC (2 bytes) | 7F 19 13 |
| TC-13.4 | SF 0x04 - Missing Record Number | 7F 19 13 |
| TC-13.5 | SF 0x06 - Incomplete DTC | 7F 19 13 |

---

### TC-14: Invalid Subfunction Tests (NRC 0x12)

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-14.1 | Subfunction 0x00 | 7F 19 12 |
| TC-14.2 | Subfunction 0x20 | 7F 19 12 |
| TC-14.3 | Subfunction 0xFF | 7F 19 12 |
| TC-14.4 | Subfunction 0x63 | 7F 19 12 |

---

### TC-15: Session Compatibility Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-15.1 | SF 0x01 in Default | 59 01 [response] ✓ |
| TC-15.3 | SF 0x01 in Extended | 59 01 [response] ✓ |
| TC-15.5 | SF 0x01 in Programming | May be restricted |

---

### TC-16: Clear and Verify Integration

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-16.1 | Count DTCs Before Clear | 59 01 [count > 0] |
| TC-16.2 | Clear All DTCs (SID 0x14) | 54 |
| TC-16.3 | Count After Clear | 59 01 FF 01 00 00 |
| TC-16.4 | Read DTCs After Clear | 59 02 FF (empty) |

---

### TC-17: Suppress Positive Response (SPR) Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-17.1 | SF 0x01 + SPR (0x81) | No response (suppressed) |
| TC-17.2 | SF 0x02 + SPR (0x82) | No response (suppressed) |
| TC-17.3 | SF 0x0A + SPR (0x8A) | No response (suppressed) |

---

### TC-18: Stress Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| TC-18.1-4 | 4 Rapid Requests (100ms apart) | All valid responses |

---

## NRC Summary

| NRC | Name | Triggering Condition |
|-----|------|---------------------|
| 0x12 | subFunctionNotSupported | Invalid subfunction value |
| 0x13 | incorrectMessageLengthOrInvalidFormat | Missing parameters |
| 0x22 | conditionsNotCorrect | Wrong session for subfunction |
| 0x31 | requestOutOfRange | Invalid DTC number |

---

## Usage

```
1. Import SID19_TestCases.json via the Import button
2. Click "Run Scenario" to execute all tests
3. Export results as SID19_TestCases_report.json
4. Review pass/fail rates and NRC handling
```

---

**End of Document**
