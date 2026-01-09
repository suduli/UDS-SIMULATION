# SID 19 Read DTC Information - Automotive Grade Test Suite v2.0

Comprehensive test documentation for UDS Service ID 19 (ReadDTCInformation) based on ISO 14229-1:2020.

---

## Test Suite Overview

| Metric | Value |
|--------|-------|
| **Total Tests** | 128 |
| **Version** | 2.0.0 |
| **Coverage** | All 15 ISO 14229-1 Subfunctions |
| **Duration** | ~120 seconds |

---

## Test Categories

### Original Tests (TC-01 to TC-18)

| Category | Tests | Description |
|----------|-------|-------------|
| **TC-01** | SF 0x01 | Count DTCs by Status Mask (6 tests) |
| **TC-02** | SF 0x02 | Read DTCs by Status Mask (5 tests) |
| **TC-03** | SF 0x03 | Snapshot Identification (1 test) |
| **TC-04** | SF 0x04 | Snapshot Records (4 tests) |
| **TC-05** | SF 0x06 | Extended Data Records (3 tests) |
| **TC-06** | SF 0x07 | Count by Severity (3 tests) |
| **TC-07** | SF 0x08 | Read by Severity (2 tests) |
| **TC-08** | SF 0x09 | Severity Information (2 tests) |
| **TC-09** | SF 0x0A | Supported DTCs (1 test) |
| **TC-10** | SF 0x0B-0x0E | First/Recent Failed/Confirmed (4 tests) |
| **TC-11** | SF 0x0F | Mirror Memory - Extended Session (2 tests) |
| **TC-12** | NRC 0x22 | Session Restriction (1 test) |
| **TC-13** | NRC 0x13 | Message Length Errors (5 tests) |
| **TC-14** | NRC 0x12 | Invalid Subfunctions (4 tests) |
| **TC-15** | Sessions | Session Compatibility (5 tests) |
| **TC-16** | Clear+Verify | Integration with SID 0x14 (4 tests) |
| **TC-17** | SPR Bit | Suppress Positive Response (3 tests) |
| **TC-18** | Stress | Rapid Consecutive Requests (4 tests) |

### NEW Automotive-Grade Tests (TC-19 to TC-27)

| Category | Tests | Description |
|----------|-------|-------------|
| **TC-19** | Error Recovery | Session switch recovery after NRC 0x22 |
| **TC-20** | Session Maintenance | Tester Present (0x3E) integration |
| **TC-21** | Full Workflow | Complete diagnostic session (7 steps) |
| **TC-22** | DTC Lifecycle | Pending/Confirmed status transitions |
| **TC-23** | Boundary Cases | Record 0, 0xFE, 0xFF variations |
| **TC-24** | Cross-Validation | Count vs Read, First vs Recent (7 tests) |
| **TC-25** | Status Combos | Combined status mask patterns |
| **TC-26** | Additional NRC | Invalid DTC values, missing params |
| **TC-27** | Multi-DTC | P/C/B/U code snapshot tests |

---

## NRC Validation Coverage

| NRC | Description | Test Cases |
|-----|-------------|------------|
| **0x12** | SubfunctionNotSupported | TC-14.1 to TC-14.4 |
| **0x13** | IncorrectMessageLength | TC-13.1 to TC-13.5, TC-26.4, TC-26.5 |
| **0x22** | ConditionsNotCorrect | TC-12.1, TC-19.1 |
| **0x31** | RequestOutOfRange | TC-04.4, TC-26.1 to TC-26.3 |

---

## Service Interaction Coverage

| Service | Interaction | Test Cases |
|---------|-------------|------------|
| **SID 0x10** | Session Control | All SETUP steps |
| **SID 0x14** | Clear DTCs | TC-16, TC-21.6 |
| **SID 0x3E** | Tester Present | TC-20.2, TC-20.4 |

---

## Status Mask Coverage

| Mask | Bit(s) | Description | Test Cases |
|------|--------|-------------|------------|
| 0xFF | All | All statuses | TC-01.1, TC-02.1, TC-24.1 |
| 0x08 | Bit 3 | Confirmed | TC-01.2, TC-02.2 |
| 0x04 | Bit 2 | Pending | TC-01.3, TC-02.3, TC-22.1 |
| 0x01 | Bit 0 | Test Failed | TC-01.4 |
| 0x80 | Bit 7 | MIL Active | TC-01.5, TC-02.5 |
| 0x09 | Bits 0+3 | Failed+Confirmed | TC-02.4 |
| 0x0C | Bits 2+3 | Pending+Confirmed | TC-22.3 |
| 0x40 | Bit 6 | TFTOC | TC-22.4 |
| 0x49 | Complex | TF+TFTOC+Confirmed | TC-25.1 |
| 0x19 | Complex | TF+Confirmed+WIR | TC-25.2 |

---

## Usage

1. Import `SID19_TestCases.json` into the UDS Simulator
2. Run the complete test suite
3. Export the test report
4. Validate results against expected behaviors

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-05 | Initial release with 80 tests |
| 2.0.0 | 2025-12-12 | Automotive-grade enhancement (+48 tests) |
