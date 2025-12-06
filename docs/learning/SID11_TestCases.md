# UDS SID 11 - ECU Reset Test Cases
## Based on ISO 14229-1:2020 Specification

---

## Test Environment Setup

| Parameter | Value |
|-----------|-------|
| Initial Session | Default (0x01) |
| P2 Default | 50ms |
| P2* | 5000ms |
| Hard Reset Execution | 100-500ms |
| Key Off-On Execution | 200-1000ms |
| Soft Reset Execution | 10-100ms |

---

## TC-01: Valid Reset Type Requests

### TC-01.1: Hard Reset (0x01)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 01` | Response: `51 01` |
| Post | Wait for reset execution (100-500ms) | ECU resets |
| Post | Verify session state | Returns to Default (0x01) |
| Post | Verify security | Security access LOCKED |

### TC-01.2: Key Off-On Reset (0x02)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 02` | Response: `51 02` |
| Post | Wait for reset execution (200-1000ms) | ECU simulates ignition cycle |
| Post | Verify session state | Returns to Default (0x01) |
| Post | Verify NVM data | Non-volatile memory PRESERVED |

### TC-01.3: Soft Reset (0x03)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 03` | Response: `51 03` |
| Post | Wait for reset execution (10-100ms) | ECU application restarts |
| Post | Verify session state | Returns to Default (0x01) |
| Post | Verify RAM data | Volatile memory NOT fully reinitialized |

### TC-01.4: Enable Rapid Power Shutdown (0x04)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 04 32` (500ms timeout) | Response: `51 04 32` |
| Post | Verify RPS feature | RPS enabled with 500ms power-down time |

### TC-01.5: Disable Rapid Power Shutdown (0x05)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enable RPS first via `11 04 32` | RPS enabled |
| 1 | Send: `11 05` | Response: `51 05` |
| Post | Verify RPS feature | RPS disabled |

---

## TC-02: Reset in Different Sessions

### TC-02.1: Hard Reset from Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `11 01` | Response: `51 01` |
| Post | Wait for reset | ECU resets |
| Post | Verify session state | Returns to Default (0x01) |

### TC-02.2: Soft Reset from Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `11 03` | Response: `51 03` |
| Post | Verify session state | Returns to Default (0x01) |

### TC-02.3: Reset Blocked in Safety Session - Hard Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `11 01` | Response: `7F 11 7E` (Sub-Function Not Supported In Active Session) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-02.4: Reset Blocked in Safety Session - Key Off-On
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `11 02` | Response: `7F 11 7E` (Sub-Function Not Supported In Active Session) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-02.5: Reset Blocked in Safety Session - Soft Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `11 03` | Response: `7F 11 7E` (Sub-Function Not Supported In Active Session) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-02.6: Soft Reset Blocked in Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| 1 | Send: `11 03` | Response: `7F 11 7E` (Sub-Function Not Supported In Active Session) |
| Post | Verify session state | Remains in Programming (0x02) |

### TC-02.7: Hard Reset Limited in Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| Pre | Simulate flash operation in progress | Flash active |
| 1 | Send: `11 01` | Response: `7F 11 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Programming (0x02) |

---

## TC-03: Subfunction Validation (NRC 0x12)

### TC-03.1: Invalid Subfunction 0x00 (Reserved)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 00` | Response: `7F 11 12` (Sub-Function Not Supported) |

### TC-03.2: Reserved ISO Range (0x06-0x3F)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 06` | Response: `7F 11 12` (Sub-Function Not Supported) |
| 2 | Send: `11 20` | Response: `7F 11 12` (Sub-Function Not Supported) |
| 3 | Send: `11 3F` | Response: `7F 11 12` (Sub-Function Not Supported) |

### TC-03.3: Vehicle Manufacturer Range (0x40-0x5F) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 40` | Response: `7F 11 12` (Sub-Function Not Supported) |
| 2 | Send: `11 5F` | Response: `7F 11 12` (Sub-Function Not Supported) |

### TC-03.4: System Supplier Range (0x60-0x7E) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 60` | Response: `7F 11 12` (Sub-Function Not Supported) |
| 2 | Send: `11 7E` | Response: `7F 11 12` (Sub-Function Not Supported) |

### TC-03.5: Reserved Subfunction 0x7F
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 7F` | Response: `7F 11 12` (Sub-Function Not Supported) |

### TC-03.6: Invalid Range Above 0x7F (Without Suppress Bit)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 80` | Response: `7F 11 12` (Sub-Function Not Supported) |
| 2 | Send: `11 FF` | Response: `7F 11 12` (Sub-Function Not Supported) |

---

## TC-04: Message Length Validation (NRC 0x13)

### TC-04.1: Message Too Short (1 byte)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11` | Response: `7F 11 13` (Incorrect Message Length) |

### TC-04.2: Standard Reset with Extra Bytes (3 bytes)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 01 00` | Response: `7F 11 13` (Incorrect Message Length) |
| 2 | Send: `11 02 00` | Response: `7F 11 13` (Incorrect Message Length) |
| 3 | Send: `11 03 00` | Response: `7F 11 13` (Incorrect Message Length) |

### TC-04.3: Enable RPS Missing PowerDownTime
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04` (missing powerDownTime) | Response: `7F 11 13` (Incorrect Message Length) |

### TC-04.4: Enable RPS with Extra Bytes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04 32 00` | Response: `7F 11 13` (Incorrect Message Length) |

### TC-04.5: Disable RPS with Extra Bytes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 05 00` | Response: `7F 11 13` (Incorrect Message Length) |

---

## TC-05: Suppress Positive Response Bit

### TC-05.1: Suppress Response for Hard Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 81` | No response (positive response suppressed) |
| Post | Wait for reset execution | ECU resets |
| Post | Verify session state | Returns to Default (0x01) |

### TC-05.2: Suppress Response for Key Off-On Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 82` | No response (positive response suppressed) |
| Post | Verify session state | Returns to Default (0x01) |

### TC-05.3: Suppress Response for Soft Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 83` | No response (positive response suppressed) |
| Post | Verify session state | Returns to Default (0x01) |

### TC-05.4: Suppress Response - Negative Response Still Sent
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `11 81` (Suppress + Hard Reset) | Response: `7F 11 7E` (NRC sent despite suppress bit) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-05.5: Suppress Response for Enable RPS
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `11 84 32` (Suppress + Enable RPS) | No response (positive response suppressed) |
| Post | Verify RPS feature | RPS enabled with 500ms timeout |

---

## TC-06: Post-Reset Behavior Verification

### TC-06.1: Security Access Reset After Hard Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Perform Security Access unlock | Security unlocked |
| 2 | Send Hard Reset: `11 01` | Response: `51 01` |
| Post | Verify security state | Security access LOCKED |

### TC-06.2: Security Access Reset After Soft Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Perform Security Access unlock | Security unlocked |
| 2 | Send Soft Reset: `11 03` | Response: `51 03` |
| Post | Verify security state | Security access LOCKED |

### TC-06.3: Session Returns to Default After Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send Soft Reset: `11 03` | Response: `51 03` |
| Post | Verify session state | Returns to Default (0x01) |
| Post | Verify communication | Ready for new requests |

### TC-06.4: Verify Memory Impact - Hard Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Store adaptive values in RAM and NVM | Values stored |
| 1 | Send Hard Reset: `11 01` | Response: `51 01` |
| Post | Check RAM data | Completely reinitialized |
| Post | Check NVM data | Reset to factory defaults |
| Post | Check adaptive data | Lost |

### TC-06.5: Verify Memory Impact - Key Off-On Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Store adaptive values in RAM and NVM | Values stored |
| 1 | Send Key Off-On Reset: `11 02` | Response: `51 02` |
| Post | Check RAM data | Reinitialized |
| Post | Check NVM data | Preserved |
| Post | Check adaptive data | Preserved |

### TC-06.6: Verify Memory Impact - Soft Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Store adaptive values in RAM and NVM | Values stored |
| 1 | Send Soft Reset: `11 03` | Response: `51 03` |
| Post | Check RAM data | NOT fully reinitialized |
| Post | Check NVM data | Preserved |
| Post | Check adaptive data | Preserved |

---

## TC-07: Conditions Not Correct (NRC 0x22)

### TC-07.1: Reset During Flash Operation
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Start flash operation (simulated) | Flash in progress |
| 1 | Send: `11 01` | Response: `7F 11 22` (Conditions Not Correct) |
| Post | Wait for flash completion | Flash complete |
| 2 | Retry: `11 01` | Response: `51 01` |

### TC-07.2: Reset During Routine Control Active
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Start routine control (simulated) | Routine active |
| 1 | Send: `11 03` | Response: `7F 11 22` (Conditions Not Correct) |
| Post | Stop routine | — |
| 2 | Retry: `11 03` | Response: `51 03` |

### TC-07.3: Reset With Unstable Power Supply
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Simulate unstable power condition | Power unstable |
| 1 | Send: `11 01` | Response: `7F 11 22` (Conditions Not Correct) |

---

## TC-08: Power-Down Time Parameter

### TC-08.1: Enable RPS with Minimum Timeout (0ms)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04 00` | Response: `51 04 00` |
| Post | Verify timeout | 0ms (immediate shutdown) |

### TC-08.2: Enable RPS with Standard Timeout (500ms)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04 32` (0x32 = 50 decimal) | Response: `51 04 32` |
| Post | Verify timeout | 50 × 10ms = 500ms |

### TC-08.3: Enable RPS with Extended Timeout (1000ms)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04 64` (0x64 = 100 decimal) | Response: `51 04 64` |
| Post | Verify timeout | 100 × 10ms = 1000ms |

### TC-08.4: Enable RPS with Maximum Timeout (2550ms)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 04 FF` (0xFF = 255 decimal) | Response: `51 04 FF` |
| Post | Verify timeout | 255 × 10ms = 2550ms |

### TC-08.5: Rapid Power Shutdown Sequence
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable RPS: `11 04 64` (1000ms) | Response: `51 04 64` |
| 2 | Simulate ignition OFF | — |
| 3 | Wait 1000ms | — |
| Post | Verify ECU state | ECU powered down gracefully |

---

## TC-09: Complex Workflow Scenarios

### TC-09.1: Software Update Recovery Workflow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming Session: `10 02` | Response: `50 02 00 32 01 F4` |
| 2 | Perform flash operation | Flash complete |
| 3 | Send Soft Reset: `11 03` | Response: `7F 11 7E` (blocked in Programming) |
| 4 | Return to Default: `10 01` | Response: `50 01 00 32 01 F4` |
| 5 | Send Soft Reset: `11 03` | Response: `51 03` |
| Post | Verify application | New code running |

### TC-09.2: Error Recovery Workflow
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Simulate ECU communication issue | — |
| 1 | Send Soft Reset: `11 03` | Response: `51 03` |
| 2 | Wait for reset completion | ECU restarts |
| 3 | Verify communication: `3E 00` | Response: `7E 00` |
| Post | Verify session | Default Session (0x01) |

### TC-09.3: Multi-Reset Type Sequence
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Soft Reset: `11 03` | Response: `51 03` |
| 2 | Wait for reset | — |
| 3 | Key Off-On Reset: `11 02` | Response: `51 02` |
| 4 | Wait for reset | — |
| 5 | Hard Reset: `11 01` | Response: `51 01` |
| Post | Verify final state | Default Session, Security Locked |

### TC-09.4: Enable/Disable RPS Sequence
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable RPS with 1000ms: `11 04 64` | Response: `51 04 64` |
| 2 | Verify RPS enabled | RPS active |
| 3 | Disable RPS: `11 05` | Response: `51 05` |
| Post | Verify RPS disabled | RPS inactive |

---

## TC-10: Edge Cases

### TC-10.1: Rapid Reset Requests
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 03` | Response: `51 03` |
| 2 | Immediately send: `11 03` (before reset completes) | May receive NRC or timeout |

### TC-10.2: Reset with Response Pending
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Simulate long processing condition | — |
| 1 | Send: `11 01` | Response: `7F 11 78` (Response Pending) |
| 2 | Wait for P2* timeout | — |
| 3 | Receive final response | Response: `51 01` |

### TC-10.3: Reset After Security Timeout
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session: `10 03` | Session = 0x03 |
| 1 | Wait for S3 timeout (5+ seconds) | Session reverts to Default |
| 2 | Send: `11 03` | Response: `51 03` (accepted in Default) |

### TC-10.4: Multiple Enable RPS Overwrite
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable RPS 500ms: `11 04 32` | Response: `51 04 32` |
| 2 | Enable RPS 1000ms: `11 04 64` | Response: `51 04 64` |
| Post | Verify timeout | 1000ms (last value) |

### TC-10.5: Disable RPS When Not Enabled
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure RPS is not enabled | RPS disabled |
| 1 | Send: `11 05` | Response: `51 05` (accepted, no change) |

---

## TC-11: Response Timing Verification

### TC-11.1: Verify Response Before Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 01` | Response received BEFORE reset begins |
| 2 | Measure response time | Within P2 (50ms) |
| Post | Reset occurs after response | — |

### TC-11.2: Verify P2 Compliance for Each Reset Type
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `11 01` and measure | Response within 50ms |
| 2 | Wait for reset, then: `11 02` | Response within 50ms |
| 3 | Wait for reset, then: `11 03` | Response within 50ms |
| 4 | Wait for reset, then: `11 04 32` | Response within 50ms |
| 5 | Then: `11 05` | Response within 50ms |

---

## Test Summary Matrix

| Category | Test Cases | Priority |
|----------|------------|----------|
| Valid Reset Types | TC-01.1 to TC-01.5 | High |
| Session Support | TC-02.1 to TC-02.7 | High |
| Subfunction Validation | TC-03.1 to TC-03.6 | High |
| Message Length | TC-04.1 to TC-04.5 | High |
| Suppress Response | TC-05.1 to TC-05.5 | Medium |
| Post-Reset Behavior | TC-06.1 to TC-06.6 | High |
| Conditions Not Correct | TC-07.1 to TC-07.3 | Medium |
| Power-Down Time | TC-08.1 to TC-08.5 | Medium |
| Complex Workflows | TC-09.1 to TC-09.4 | Medium |
| Edge Cases | TC-10.1 to TC-10.5 | Low |
| Response Timing | TC-11.1 to TC-11.2 | Medium |

---

## NRC Quick Reference

| NRC Code | Name | Common Triggers |
|----------|------|-----------------|
| 0x11 | Service Not Supported | SID 0x11 not supported by ECU |
| 0x12 | Sub-Function Not Supported | Invalid subfunction (0x00, 0x06-0x3F, 0x7F, etc.) |
| 0x13 | Incorrect Message Length | Wrong request length |
| 0x22 | Conditions Not Correct | Flash in progress, routine active |
| 0x33 | Security Access Denied | Reset requires authentication |
| 0x7E | Sub-Function Not Supported In Active Session | Reset blocked in Safety/Programming session |
| 0x78 | Response Pending | Processing delay, wait for final response |

---

**Document Version**: 1.1  
**Created**: December 2025  
**Based On**: SID11_Reference.md (ISO 14229-1:2020)

---

## Importable JSON Test Cases

The following JSON structure can be imported into the UDS Simulator for automated testing, analysis, and report generation.

```json
{
  "metadata": {
    "name": "SID11_ECUReset_TestSuite",
    "version": "1.0.0",
    "serviceId": "0x11",
    "serviceName": "ECU Reset",
    "description": "Comprehensive test suite for UDS Service ID 11 (ECU Reset) based on ISO 14229-1:2020",
    "createdDate": "2025-12-05",
    "author": "UDS Simulator",
    "standard": "ISO 14229-1:2020"
  },
  "environment": {
    "initialSession": "0x01",
    "p2Default": 50,
    "p2Star": 5000,
    "hardResetExecution": { "min": 100, "max": 500 },
    "keyOffOnExecution": { "min": 200, "max": 1000 },
    "softResetExecution": { "min": 10, "max": 100 }
  },
  "categories": [
    {
      "id": "TC-01",
      "name": "Valid Reset Type Requests",
      "priority": "high",
      "testCases": [
        {
          "id": "TC-01.1",
          "name": "Hard Reset",
          "description": "Verify Hard Reset (0x01) functionality",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "51 01" }
          ],
          "postconditions": [
            { "type": "wait", "duration": "100-500ms", "description": "Wait for reset execution" },
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" },
            { "type": "verify", "check": "security", "expected": "locked", "description": "Security access LOCKED" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-01.2",
          "name": "Key Off-On Reset",
          "description": "Verify Key Off-On Reset (0x02) functionality",
          "subfunction": "0x02",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 02", "expectedResponse": "51 02" }
          ],
          "postconditions": [
            { "type": "wait", "duration": "200-1000ms", "description": "Wait for ignition cycle simulation" },
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" },
            { "type": "verify", "check": "nvm", "expected": "preserved", "description": "Non-volatile memory PRESERVED" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-01.3",
          "name": "Soft Reset",
          "description": "Verify Soft Reset (0x03) functionality",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03" }
          ],
          "postconditions": [
            { "type": "wait", "duration": "10-100ms", "description": "Wait for application restart" },
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" },
            { "type": "verify", "check": "ram", "expected": "partial", "description": "Volatile memory NOT fully reinitialized" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-01.4",
          "name": "Enable Rapid Power Shutdown",
          "description": "Verify Enable RPS (0x04) with 500ms timeout",
          "subfunction": "0x04",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 04 32", "expectedResponse": "51 04 32" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 500, "description": "RPS enabled with 500ms power-down time" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-01.5",
          "name": "Disable Rapid Power Shutdown",
          "description": "Verify Disable RPS (0x05) functionality",
          "subfunction": "0x05",
          "preconditions": [
            { "type": "send", "request": "11 04 32", "description": "Enable RPS first" }
          ],
          "steps": [
            { "action": "send", "request": "11 05", "expectedResponse": "51 05" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "disabled", "description": "RPS disabled" }
          ],
          "expectedResult": "positive"
        }
      ]
    },
    {
      "id": "TC-02",
      "name": "Reset in Different Sessions",
      "priority": "high",
      "testCases": [
        {
          "id": "TC-02.1",
          "name": "Hard Reset from Extended Session",
          "description": "Verify Hard Reset works from Extended Session",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "51 01" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Returns to Default Session" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-02.2",
          "name": "Soft Reset from Extended Session",
          "description": "Verify Soft Reset works from Extended Session",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Returns to Default Session" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-02.3",
          "name": "Reset Blocked in Safety Session - Hard Reset",
          "description": "Verify Hard Reset is blocked in Safety Session with NRC 0x7E",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "send", "request": "10 04", "description": "Enter Safety Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "7F 11 7E" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x04", "description": "Remains in Safety Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x7E"
        },
        {
          "id": "TC-02.4",
          "name": "Reset Blocked in Safety Session - Key Off-On",
          "description": "Verify Key Off-On Reset is blocked in Safety Session with NRC 0x7E",
          "subfunction": "0x02",
          "preconditions": [
            { "type": "send", "request": "10 04", "description": "Enter Safety Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 02", "expectedResponse": "7F 11 7E" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x04", "description": "Remains in Safety Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x7E"
        },
        {
          "id": "TC-02.5",
          "name": "Reset Blocked in Safety Session - Soft Reset",
          "description": "Verify Soft Reset is blocked in Safety Session with NRC 0x7E",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "send", "request": "10 04", "description": "Enter Safety Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "7F 11 7E" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x04", "description": "Remains in Safety Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x7E"
        },
        {
          "id": "TC-02.6",
          "name": "Soft Reset Blocked in Programming Session",
          "description": "Verify Soft Reset is blocked in Programming Session with NRC 0x7E",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "send", "request": "10 02", "description": "Enter Programming Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "7F 11 7E" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x02", "description": "Remains in Programming Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x7E"
        },
        {
          "id": "TC-02.7",
          "name": "Hard Reset Limited in Programming Session",
          "description": "Verify Hard Reset blocked during flash operation with NRC 0x22",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "send", "request": "10 02", "description": "Enter Programming Session" },
            { "type": "simulate", "condition": "flashInProgress", "description": "Simulate flash operation in progress" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "7F 11 22" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x02", "description": "Remains in Programming Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x22"
        }
      ]
    },
    {
      "id": "TC-03",
      "name": "Subfunction Validation (NRC 0x12)",
      "priority": "high",
      "testCases": [
        {
          "id": "TC-03.1",
          "name": "Invalid Subfunction 0x00 (Reserved)",
          "description": "Verify reserved subfunction 0x00 returns NRC 0x12",
          "subfunction": "0x00",
          "steps": [
            { "action": "send", "request": "11 00", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        },
        {
          "id": "TC-03.2",
          "name": "Reserved ISO Range (0x06-0x3F)",
          "description": "Verify reserved ISO range subfunctions return NRC 0x12",
          "steps": [
            { "action": "send", "request": "11 06", "expectedResponse": "7F 11 12" },
            { "action": "send", "request": "11 20", "expectedResponse": "7F 11 12" },
            { "action": "send", "request": "11 3F", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        },
        {
          "id": "TC-03.3",
          "name": "Vehicle Manufacturer Range (0x40-0x5F)",
          "description": "Verify unsupported vehicle manufacturer range returns NRC 0x12",
          "steps": [
            { "action": "send", "request": "11 40", "expectedResponse": "7F 11 12" },
            { "action": "send", "request": "11 5F", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        },
        {
          "id": "TC-03.4",
          "name": "System Supplier Range (0x60-0x7E)",
          "description": "Verify unsupported system supplier range returns NRC 0x12",
          "steps": [
            { "action": "send", "request": "11 60", "expectedResponse": "7F 11 12" },
            { "action": "send", "request": "11 7E", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        },
        {
          "id": "TC-03.5",
          "name": "Reserved Subfunction 0x7F",
          "description": "Verify reserved subfunction 0x7F returns NRC 0x12",
          "subfunction": "0x7F",
          "steps": [
            { "action": "send", "request": "11 7F", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        },
        {
          "id": "TC-03.6",
          "name": "Invalid Range Above 0x7F (Without Suppress Bit)",
          "description": "Verify invalid subfunctions 0x80-0xFF return NRC 0x12",
          "steps": [
            { "action": "send", "request": "11 80", "expectedResponse": "7F 11 12" },
            { "action": "send", "request": "11 FF", "expectedResponse": "7F 11 12" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x12"
        }
      ]
    },
    {
      "id": "TC-04",
      "name": "Message Length Validation (NRC 0x13)",
      "priority": "high",
      "testCases": [
        {
          "id": "TC-04.1",
          "name": "Message Too Short (1 byte)",
          "description": "Verify message with only SID returns NRC 0x13",
          "steps": [
            { "action": "send", "request": "11", "expectedResponse": "7F 11 13" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x13"
        },
        {
          "id": "TC-04.2",
          "name": "Standard Reset with Extra Bytes (3 bytes)",
          "description": "Verify standard reset requests with extra bytes return NRC 0x13",
          "steps": [
            { "action": "send", "request": "11 01 00", "expectedResponse": "7F 11 13" },
            { "action": "send", "request": "11 02 00", "expectedResponse": "7F 11 13" },
            { "action": "send", "request": "11 03 00", "expectedResponse": "7F 11 13" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x13"
        },
        {
          "id": "TC-04.3",
          "name": "Enable RPS Missing PowerDownTime",
          "description": "Verify Enable RPS without powerDownTime returns NRC 0x13",
          "steps": [
            { "action": "send", "request": "11 04", "expectedResponse": "7F 11 13" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x13"
        },
        {
          "id": "TC-04.4",
          "name": "Enable RPS with Extra Bytes",
          "description": "Verify Enable RPS with extra bytes returns NRC 0x13",
          "steps": [
            { "action": "send", "request": "11 04 32 00", "expectedResponse": "7F 11 13" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x13"
        },
        {
          "id": "TC-04.5",
          "name": "Disable RPS with Extra Bytes",
          "description": "Verify Disable RPS with extra bytes returns NRC 0x13",
          "steps": [
            { "action": "send", "request": "11 05 00", "expectedResponse": "7F 11 13" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x13"
        }
      ]
    },
    {
      "id": "TC-05",
      "name": "Suppress Positive Response Bit",
      "priority": "medium",
      "testCases": [
        {
          "id": "TC-05.1",
          "name": "Suppress Response for Hard Reset",
          "description": "Verify no response sent when suppress bit is set for Hard Reset",
          "subfunction": "0x81",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 81", "expectedResponse": null, "suppressResponse": true }
          ],
          "postconditions": [
            { "type": "wait", "duration": "100-500ms", "description": "Wait for reset execution" },
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" }
          ],
          "expectedResult": "suppressed"
        },
        {
          "id": "TC-05.2",
          "name": "Suppress Response for Key Off-On Reset",
          "description": "Verify no response sent when suppress bit is set for Key Off-On Reset",
          "subfunction": "0x82",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 82", "expectedResponse": null, "suppressResponse": true }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" }
          ],
          "expectedResult": "suppressed"
        },
        {
          "id": "TC-05.3",
          "name": "Suppress Response for Soft Reset",
          "description": "Verify no response sent when suppress bit is set for Soft Reset",
          "subfunction": "0x83",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 83", "expectedResponse": null, "suppressResponse": true }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Session returns to Default" }
          ],
          "expectedResult": "suppressed"
        },
        {
          "id": "TC-05.4",
          "name": "Suppress Response - Negative Response Still Sent",
          "description": "Verify NRC is still sent despite suppress bit when conditions fail",
          "subfunction": "0x81",
          "preconditions": [
            { "type": "send", "request": "10 04", "description": "Enter Safety Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 81", "expectedResponse": "7F 11 7E" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x04", "description": "Remains in Safety Session" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x7E"
        },
        {
          "id": "TC-05.5",
          "name": "Suppress Response for Enable RPS",
          "description": "Verify no response sent when suppress bit is set for Enable RPS",
          "subfunction": "0x84",
          "preconditions": [
            { "type": "session", "value": "0x01", "description": "Ensure ECU is in Default Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 84 32", "expectedResponse": null, "suppressResponse": true }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 500, "description": "RPS enabled with 500ms timeout" }
          ],
          "expectedResult": "suppressed"
        }
      ]
    },
    {
      "id": "TC-06",
      "name": "Post-Reset Behavior Verification",
      "priority": "high",
      "testCases": [
        {
          "id": "TC-06.1",
          "name": "Security Access Reset After Hard Reset",
          "description": "Verify security is locked after Hard Reset",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" },
            { "type": "simulate", "condition": "securityUnlocked", "description": "Perform Security Access unlock" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "51 01" }
          ],
          "postconditions": [
            { "type": "verify", "check": "security", "expected": "locked", "description": "Security access LOCKED" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-06.2",
          "name": "Security Access Reset After Soft Reset",
          "description": "Verify security is locked after Soft Reset",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" },
            { "type": "simulate", "condition": "securityUnlocked", "description": "Perform Security Access unlock" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03" }
          ],
          "postconditions": [
            { "type": "verify", "check": "security", "expected": "locked", "description": "Security access LOCKED" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-06.3",
          "name": "Session Returns to Default After Reset",
          "description": "Verify session returns to Default after reset from Extended",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Returns to Default Session" },
            { "type": "verify", "check": "communication", "expected": "ready", "description": "Ready for new requests" }
          ],
          "expectedResult": "positive"
        }
      ]
    },
    {
      "id": "TC-07",
      "name": "Conditions Not Correct (NRC 0x22)",
      "priority": "medium",
      "testCases": [
        {
          "id": "TC-07.1",
          "name": "Reset During Flash Operation",
          "description": "Verify reset blocked during flash operation with NRC 0x22",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "simulate", "condition": "flashInProgress", "description": "Start flash operation" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "7F 11 22" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x22"
        },
        {
          "id": "TC-07.2",
          "name": "Reset During Routine Control Active",
          "description": "Verify reset blocked during active routine with NRC 0x22",
          "subfunction": "0x03",
          "preconditions": [
            { "type": "simulate", "condition": "routineActive", "description": "Start routine control" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "7F 11 22" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x22"
        },
        {
          "id": "TC-07.3",
          "name": "Reset With Unstable Power Supply",
          "description": "Verify reset blocked with unstable power with NRC 0x22",
          "subfunction": "0x01",
          "preconditions": [
            { "type": "simulate", "condition": "unstablePower", "description": "Simulate unstable power condition" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "7F 11 22" }
          ],
          "expectedResult": "negative",
          "expectedNRC": "0x22"
        }
      ]
    },
    {
      "id": "TC-08",
      "name": "Power-Down Time Parameter",
      "priority": "medium",
      "testCases": [
        {
          "id": "TC-08.1",
          "name": "Enable RPS with Minimum Timeout (0ms)",
          "description": "Verify Enable RPS with 0ms (immediate) timeout",
          "subfunction": "0x04",
          "steps": [
            { "action": "send", "request": "11 04 00", "expectedResponse": "51 04 00" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 0, "description": "Immediate shutdown" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-08.2",
          "name": "Enable RPS with Standard Timeout (500ms)",
          "description": "Verify Enable RPS with 500ms timeout",
          "subfunction": "0x04",
          "steps": [
            { "action": "send", "request": "11 04 32", "expectedResponse": "51 04 32" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 500, "description": "50 × 10ms = 500ms" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-08.3",
          "name": "Enable RPS with Extended Timeout (1000ms)",
          "description": "Verify Enable RPS with 1000ms timeout",
          "subfunction": "0x04",
          "steps": [
            { "action": "send", "request": "11 04 64", "expectedResponse": "51 04 64" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 1000, "description": "100 × 10ms = 1000ms" }
          ],
          "expectedResult": "positive"
        },
        {
          "id": "TC-08.4",
          "name": "Enable RPS with Maximum Timeout (2550ms)",
          "description": "Verify Enable RPS with maximum 2550ms timeout",
          "subfunction": "0x04",
          "steps": [
            { "action": "send", "request": "11 04 FF", "expectedResponse": "51 04 FF" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 2550, "description": "255 × 10ms = 2550ms" }
          ],
          "expectedResult": "positive"
        }
      ]
    },
    {
      "id": "TC-09",
      "name": "Complex Workflow Scenarios",
      "priority": "medium",
      "testCases": [
        {
          "id": "TC-09.1",
          "name": "Software Update Recovery Workflow",
          "description": "Verify complete software update recovery workflow",
          "steps": [
            { "action": "send", "request": "10 02", "expectedResponse": "50 02 00 32 01 F4", "description": "Enter Programming Session" },
            { "action": "simulate", "condition": "flashComplete", "description": "Perform flash operation" },
            { "action": "send", "request": "11 03", "expectedResponse": "7F 11 7E", "description": "Soft Reset blocked in Programming" },
            { "action": "send", "request": "10 01", "expectedResponse": "50 01 00 32 01 F4", "description": "Return to Default Session" },
            { "action": "send", "request": "11 03", "expectedResponse": "51 03", "description": "Soft Reset now allowed" }
          ],
          "expectedResult": "workflow"
        },
        {
          "id": "TC-09.2",
          "name": "Error Recovery Workflow",
          "description": "Verify ECU error recovery via Soft Reset",
          "preconditions": [
            { "type": "simulate", "condition": "communicationIssue", "description": "Simulate ECU communication issue" }
          ],
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03", "description": "Soft Reset" },
            { "action": "wait", "duration": "100ms", "description": "Wait for reset" },
            { "action": "send", "request": "3E 00", "expectedResponse": "7E 00", "description": "Verify communication" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Default Session" }
          ],
          "expectedResult": "workflow"
        },
        {
          "id": "TC-09.3",
          "name": "Multi-Reset Type Sequence",
          "description": "Verify sequential execution of all reset types",
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03", "description": "Soft Reset" },
            { "action": "wait", "duration": "100ms", "description": "Wait for reset" },
            { "action": "send", "request": "11 02", "expectedResponse": "51 02", "description": "Key Off-On Reset" },
            { "action": "wait", "duration": "500ms", "description": "Wait for reset" },
            { "action": "send", "request": "11 01", "expectedResponse": "51 01", "description": "Hard Reset" }
          ],
          "postconditions": [
            { "type": "verify", "check": "session", "expected": "0x01", "description": "Default Session" },
            { "type": "verify", "check": "security", "expected": "locked", "description": "Security Locked" }
          ],
          "expectedResult": "workflow"
        },
        {
          "id": "TC-09.4",
          "name": "Enable/Disable RPS Sequence",
          "description": "Verify RPS enable/disable cycle",
          "steps": [
            { "action": "send", "request": "11 04 64", "expectedResponse": "51 04 64", "description": "Enable RPS with 1000ms" },
            { "action": "verify", "check": "rps", "expected": "enabled", "description": "Verify RPS enabled" },
            { "action": "send", "request": "11 05", "expectedResponse": "51 05", "description": "Disable RPS" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "disabled", "description": "RPS inactive" }
          ],
          "expectedResult": "workflow"
        }
      ]
    },
    {
      "id": "TC-10",
      "name": "Edge Cases",
      "priority": "low",
      "testCases": [
        {
          "id": "TC-10.1",
          "name": "Rapid Reset Requests",
          "description": "Verify behavior when sending rapid consecutive resets",
          "steps": [
            { "action": "send", "request": "11 03", "expectedResponse": "51 03" },
            { "action": "send", "request": "11 03", "expectedResponse": "7F 11 22", "immediate": true, "description": "Sent before reset completes" }
          ],
          "expectedResult": "edge_case"
        },
        {
          "id": "TC-10.2",
          "name": "Reset with Response Pending",
          "description": "Verify Response Pending (0x78) handling during long processing",
          "preconditions": [
            { "type": "simulate", "condition": "longProcessing", "description": "Simulate long processing condition" }
          ],
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "7F 11 78", "description": "Response Pending" },
            { "action": "wait", "duration": "P2*", "description": "Wait for P2* timeout" },
            { "action": "receive", "expectedResponse": "51 01", "description": "Final positive response" }
          ],
          "expectedResult": "edge_case"
        },
        {
          "id": "TC-10.3",
          "name": "Reset After Security Timeout",
          "description": "Verify reset behavior after S3 timeout",
          "preconditions": [
            { "type": "send", "request": "10 03", "description": "Enter Extended Session" }
          ],
          "steps": [
            { "action": "wait", "duration": "5000ms", "description": "Wait for S3 timeout" },
            { "action": "send", "request": "11 03", "expectedResponse": "51 03", "description": "Reset accepted in Default" }
          ],
          "expectedResult": "edge_case"
        },
        {
          "id": "TC-10.4",
          "name": "Multiple Enable RPS Overwrite",
          "description": "Verify RPS timeout can be overwritten",
          "steps": [
            { "action": "send", "request": "11 04 32", "expectedResponse": "51 04 32", "description": "Enable RPS 500ms" },
            { "action": "send", "request": "11 04 64", "expectedResponse": "51 04 64", "description": "Enable RPS 1000ms" }
          ],
          "postconditions": [
            { "type": "verify", "check": "rps", "expected": "enabled", "timeout": 1000, "description": "Last value (1000ms)" }
          ],
          "expectedResult": "edge_case"
        },
        {
          "id": "TC-10.5",
          "name": "Disable RPS When Not Enabled",
          "description": "Verify Disable RPS accepted when RPS is not enabled",
          "preconditions": [
            { "type": "verify", "check": "rps", "expected": "disabled", "description": "Ensure RPS is not enabled" }
          ],
          "steps": [
            { "action": "send", "request": "11 05", "expectedResponse": "51 05" }
          ],
          "expectedResult": "positive"
        }
      ]
    },
    {
      "id": "TC-11",
      "name": "Response Timing Verification",
      "priority": "medium",
      "testCases": [
        {
          "id": "TC-11.1",
          "name": "Verify Response Before Reset",
          "description": "Verify response is sent before reset execution begins",
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "51 01", "maxResponseTime": 50 }
          ],
          "postconditions": [
            { "type": "timing", "check": "responseBeforeReset", "description": "Reset occurs after response" }
          ],
          "expectedResult": "timing"
        },
        {
          "id": "TC-11.2",
          "name": "Verify P2 Compliance for Each Reset Type",
          "description": "Verify all reset types respond within P2 timeout (50ms)",
          "steps": [
            { "action": "send", "request": "11 01", "expectedResponse": "51 01", "maxResponseTime": 50 },
            { "action": "wait", "duration": "resetComplete" },
            { "action": "send", "request": "11 02", "expectedResponse": "51 02", "maxResponseTime": 50 },
            { "action": "wait", "duration": "resetComplete" },
            { "action": "send", "request": "11 03", "expectedResponse": "51 03", "maxResponseTime": 50 },
            { "action": "wait", "duration": "resetComplete" },
            { "action": "send", "request": "11 04 32", "expectedResponse": "51 04 32", "maxResponseTime": 50 },
            { "action": "send", "request": "11 05", "expectedResponse": "51 05", "maxResponseTime": 50 }
          ],
          "expectedResult": "timing"
        }
      ]
    }
  ],
  "nrcDefinitions": [
    { "code": "0x11", "name": "serviceNotSupported", "description": "SID 0x11 not supported by ECU" },
    { "code": "0x12", "name": "subFunctionNotSupported", "description": "Invalid subfunction (0x00, 0x06-0x3F, 0x7F, etc.)" },
    { "code": "0x13", "name": "incorrectMessageLengthOrInvalidFormat", "description": "Wrong request length" },
    { "code": "0x22", "name": "conditionsNotCorrect", "description": "Flash in progress, routine active, unstable power" },
    { "code": "0x33", "name": "securityAccessDenied", "description": "Reset requires authentication" },
    { "code": "0x7E", "name": "subFunctionNotSupportedInActiveSession", "description": "Reset blocked in Safety/Programming session" },
    { "code": "0x78", "name": "responsePending", "description": "Processing delay, wait for final response" }
  ],
  "statistics": {
    "totalTestCases": 49,
    "byPriority": {
      "high": 22,
      "medium": 20,
      "low": 7
    },
    "byExpectedResult": {
      "positive": 15,
      "negative": 24,
      "suppressed": 5,
      "workflow": 4,
      "edge_case": 5,
      "timing": 2
    }
  }
}
```

### Usage Instructions

1. **Import**: Copy the JSON above and use the simulator's import functionality to load these test cases
2. **Execute**: Run tests individually or as a complete suite
3. **Analyze**: View pass/fail results, timing metrics, and NRC validation
4. **Export**: Generate test reports in JSON, CSV, or PDF format

### JSON Schema Notes

| Field | Description |
|-------|-------------|
| `metadata` | Test suite identification and versioning |
| `environment` | Timing parameters and session defaults |
| `categories` | Grouped test cases by functionality |
| `testCases[].steps` | Individual request/response pairs |
| `testCases[].preconditions` | Setup requirements before test |
| `testCases[].postconditions` | Validation checks after test |
| `testCases[].expectedResult` | `positive`, `negative`, `suppressed`, `workflow`, `edge_case`, `timing` |
| `nrcDefinitions` | NRC code reference table |
| `statistics` | Test suite summary metrics |
