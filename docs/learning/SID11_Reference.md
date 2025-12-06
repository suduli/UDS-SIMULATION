# UDS SID 11 - ECU Reset
## Complete Data Reference for Implementation

---

## 1. SERVICE OVERVIEW

| Property | Value |
|----------|-------|
| Service ID (Request) | 0x11 |
| Service ID (Response) | 0x51 |
| Service Name | ECU Reset |
| Purpose | Reset/restart the ECU or all ECUs in a network |
| ISO Standard | ISO 14229-1:2020 |
| Message Length (Request) | 2 bytes (3 bytes with powerDownTime) |
| Message Length (Response) | 2 bytes (3 bytes with powerDownTime) |
| Reset Occurs | AFTER positive response is sent |

---

## 2. SUBFUNCTIONS (0x01 - 0x7E)

### Standard Subfunctions (Mandatory per ISO 14229-1)

| Code | Name | Description | Volatile Memory | Non-Volatile Memory | Typical Use |
|------|------|-------------|---|---|---|
| 0x01 | Hard Reset | Equivalent to power cycle/battery removal | Reinitialized | Reinitialized | System hangs, full reinitialization |
| 0x02 | Key Off-On Reset | Simulates ignition key OFF-ON sequence | Reinitialized | Preserved | Simulate user turning off ignition |
| 0x03 | Soft Reset | Software application restart (watchdog-like) | NOT reinitialized | Preserved | Fastest recovery, most common |
| 0x04 | Enable Rapid Power Shutdown | Enable controlled rapid ECU power-down | N/A | N/A | Enable RPS feature with timeout |
| 0x05 | Disable Rapid Power Shutdown | Disable rapid power shutdown feature | N/A | N/A | Disable RPS feature |

### Reserved and Extended Subfunctions

| Range | Name | Description | Supported |
|-------|------|-------------|-----------|
| 0x00 | Reserved | Reserved for future use | No |
| 0x06-0x3F | ISO Reserved | Reserved for future ISO standards | No |
| 0x40-0x5F | Vehicle Manufacturer Specific | OEM-defined reset types | Optional |
| 0x60-0x7E | System Supplier Specific | Tier-1/supplier-defined reset types | Optional |
| 0x7F | ISO Reserved | Reserved for future use | No |

---

## 3. RESET TYPE BEHAVIOR COMPARISON

### Memory Impact

| Aspect | Hard Reset | Key Off-On Reset | Soft Reset |
|--------|---|---|---|
| **Volatile Memory (RAM)** | Completely reinitialized | Reinitialized | NOT reinitialized |
| **Non-Volatile Memory (NVM)** | Reset to factory defaults | Preserved | Preserved |
| **Adaptive Data** | Lost | Preserved | Preserved |
| **Configuration** | Lost | Preserved | Preserved |
| **Long-term Learning** | Lost | Preserved | Preserved |
| **DTCs / Fault History** | May be cleared | Preserved | Preserved |
| **Freeze Frames** | May be cleared | Preserved | Preserved |

### Execution Characteristics

| Aspect | Hard Reset | Key Off-On Reset | Soft Reset |
|--------|---|---|---|
| **Hardware Init** | Full reinitialization | Simulated cycle | Minimal - app only |
| **Execution Speed** | Slowest (100-500ms) | Medium (200-1000ms) | Fastest (10-100ms) |
| **System Impact** | Maximum - full restart | Medium - ignition cycle | Minimal - app restart |
| **Use in Development** | High - debugging hangs | Medium - test persistence | Common - test cycles |
| **Use in Production** | Rare - causes data loss | Common - simulates user action | Very common - fast recovery |

---

## 4. REQUEST MESSAGE FORMAT

### Byte Structure

| Byte # | Field Name | Length | Range | Description |
|--------|-----------|--------|-------|-------------|
| 1 | SID | 1 | 0x11 | ECU Reset Service ID |
| 2 | SubfunctionParameter | 1 | 0x01-0x7E | Reset type (0x01-0x05 standard, 0x40-0x7E extended) |
| 3* | powerDownTime | 1 (optional) | 0x00-0xFF | Power-down time parameter (used with 0x04/0x05 only) |

### Subfunction Byte Bit Structure

| Bit(s) | Field | Value | Notes |
|--------|-------|-------|-------|
| Bit 7 | suppressPositiveResponseBit | 0 or 1 | 0=Send response, 1=Suppress response |
| Bits 6-0 | ResetType | 0x01-0x7E | Actual reset type identifier |

### Request Examples

| Scenario | Message (Hex) | Description |
|----------|---------------|-------------|
| Request Hard Reset | 11 01 | Request full hardware reset |
| Request Key Off-On | 11 02 | Request ignition OFF-ON simulation |
| Request Soft Reset | 11 03 | Request software restart (fastest) |
| Enable RPS (500ms timeout) | 11 04 32 | Enable rapid power shutdown with 500ms timeout |
| Disable RPS | 11 05 | Disable rapid power shutdown feature |
| Suppress Response (Hard Reset) | 11 81 | Hard reset without response message |

---

## 5. POSITIVE RESPONSE FORMAT

### Byte Structure

| Byte # | Field Name | Length | Range | Description |
|--------|-----------|--------|-------|-------------|
| 1 | SID | 1 | 0x51 | Positive Response SID |
| 2 | SubfunctionParameter | 1 | 0x01-0x7E | Echo of requested subfunctionparameter |
| 3* | powerDownTime | 1 (optional) | 0x00-0xFF | Power-down time value (in 10ms units, if requested) |

### Response Timing

- **When Sent**: BEFORE the reset occurs
- **Purpose**: Confirm acceptance of reset request
- **After Response**: ECU performs the reset
- **Timeout**: Reset must complete within configured time period

### Response Examples

| Scenario | Message (Hex) | Description |
|----------|---------------|-------------|
| Response Hard Reset | 51 01 | Confirmation before hard reset begins |
| Response Key Off-On | 51 02 | Confirmation before ignition cycle simulation |
| Response Soft Reset | 51 03 | Confirmation before software restart |
| Response Enable RPS | 51 04 32 | Confirmation with power-down timeout value |
| Response Disable RPS | 51 05 | Confirmation RPS is disabled |

---

## 6. NEGATIVE RESPONSE FORMAT

### Byte Structure

| Byte # | Field Name | Range | Description |
|--------|-----------|-------|-------------|
| 1 | Response SID | 0x7F | Negative Response Indicator |
| 2 | Requested SID | 0x11 | Original SID that failed |
| 3 | NRC Code | See Table 7 | Negative Response Code |

### Format
`7F 11 [NRC]`

---

## 7. NEGATIVE RESPONSE CODES (NRC)

| Code | Name | Description | Common Triggers | Handling |
|------|------|-------------|-----------------|----------|
| 0x11 | Service Not Supported | SID 0x11 not supported by ECU | ECU does not support reset | Check ECU capabilities |
| 0x12 | Sub-Function Not Supported | Reset type not supported | Subfunc 0x00, 0x06-0x3F, or unsupported | Use supported reset types |
| 0x13 | Incorrect Message Length | Request has wrong length | Request ≠ 2 bytes (or 3 with powerDownTime) | Send correct format |
| 0x22 | Conditions Not Correct | Reset not allowed in current state | Reset during flash, incomplete init | Wait for safe state |
| 0x24 | Request Sequence Error | Reset request in wrong order | Out-of-order requests | Retry after delay |
| 0x25 | No Access to Resource | Insufficient resources | ECU in unsafe state | Wait for completion |
| 0x31 | Request Out of Range | Reset type code out of range | Subfunc value > 0x7E | Use valid range 0x01-0x7E |
| 0x33 | Security Access Denied | Security unlock required but not done | Some resets require SID 0x27 first | Perform security access first |
| 0x7E | Sub-Function Not Supported In Active Session | Reset disabled in session | Reset type disabled in active session | Change to appropriate session |
| 0x7F | Service Not Supported In Active Session | SID 0x11 not available | Reset service completely disabled | Unexpected - check session state |
| 0x83 | Engine Is Running | Engine running - reset not allowed | Actuator test constraint | Turn off engine first |
| 0x84 | Engine Is Not Running | Engine not running - reset not allowed | Actuator test constraint | Start engine first |

---

## 8. SESSION SUPPORT FOR RESET

### Reset Availability by Session

| Reset Type | Default (0x01) | Programming (0x02) | Extended (0x03) | Safety (0x04) |
|---|---|---|---|---|
| Hard Reset (0x01) | Supported | Limited | Supported | Not Allowed |
| Key Off-On (0x02) | Supported | Limited | Supported | Not Allowed |
| Soft Reset (0x03) | Supported | Not Allowed | Supported | Not Allowed |
| Enable RPS (0x04) | Supported | Limited | Supported | Not Allowed |
| Disable RPS (0x05) | Supported | Limited | Supported | Not Allowed |

### Session Notes

- **Default Session**: Most resets supported
- **Programming Session**: Resets usually limited to prevent flash interruption
- **Extended Session**: Full reset support for diagnostics
- **Safety Session**: Resets typically not allowed to prevent safety issues

---

## 9. POST-RESET BEHAVIOR

### After Reset Completes

| Behavior | Hard Reset | Key Off-On Reset | Soft Reset |
|----------|---|---|---|
| Active Session | Default (0x01) | Default (0x01) | Default (0x01) |
| Security Access | Locked | Locked | Locked |
| Communication | Reset to defaults | Reset to defaults | Reset to defaults |
| DTC Status | May be cleared | Preserved | Preserved |
| Freeze Frames | May be cleared | Preserved | Preserved |
| Adaptive Data | Lost | Preserved | Preserved |
| Calibration Data | Reset to defaults | Preserved | Preserved |
| Application State | Restart from main() | Restart from main() | Restart app, keep state |

### Key Points

- **Always** transitions to default session after reset
- **Always** locks all security access levels
- **Always** resets communication control settings
- Hard Reset may clear diagnostic data
- Key Off-On and Soft Reset preserve learned values

---

## 10. TIMING PARAMETERS

### Reset Timing Values

| Parameter | Value | Description |
|-----------|-------|-------------|
| **P2 (Normal Response Time)** | 50ms | Max time from reset request to positive response |
| **P2* (Extended Response Time)** | 5000ms | Extended time if NRC 0x78 (Response Pending) sent |
| **Hard Reset Execution** | 100-500ms | Time from response until ECU restart (implementation-specific) |
| **Key Off-On Execution** | 200-1000ms | Time to simulate ignition OFF-ON cycle |
| **Soft Reset Execution** | 10-100ms | Time to restart application (fastest) |
| **S3 Timeout After Reset** | 5000ms | Session inactivity timeout after reset completes |

### Timing Sequence

```
Tester Request → ECU Processes (< P2)
            ↓
         Response Sent (51 XX)
            ↓
    Reset Execution Begins
            ↓
    Reset Time Expires (50-1000ms)
            ↓
    ECU Restarted in Default Session
```

---

## 11. POWER-DOWN TIME PARAMETER

### Specification

| Aspect | Value |
|--------|-------|
| **Parameter Byte Range** | 0x00 - 0xFF |
| **Valid Values** | 0 to 255 |
| **Resolution** | 10 milliseconds per unit |
| **Minimum Timeout** | 0 (0ms) |
| **Maximum Timeout** | 255 × 10 = 2550ms |
| **Unit** | 10ms increments |
| **Used With** | SubFunction 0x04 (Enable Rapid Power Shutdown) |

### Power-Down Time Calculation

```
Actual Time (ms) = powerDownTime × 10

Examples:
  0x32 (50 decimal) → 50 × 10 = 500ms
  0x64 (100 decimal) → 100 × 10 = 1000ms
  0xFA (250 decimal) → 250 × 10 = 2500ms
```

### Typical Values

| Use Case | Time (ms) | Hex Value |
|----------|-----------|-----------|
| Immediate shutdown | 0 | 0x00 |
| Quick shutdown | 100 | 0x0A |
| Standard timeout | 500 | 0x32 |
| Extended timeout | 1000 | 0x64 |
| Long timeout | 2500 | 0xFA |

---

## 12. RESET CONDITIONS & PREREQUISITES

### When Reset is Not Allowed

| Condition | Reason | NRC | Solution |
|-----------|--------|-----|----------|
| Flash operation in progress | Safety - preserve flash data | 0x22 | Wait for flash completion |
| Security access required | Reset needs authentication | 0x33 | Perform SID 0x27 first |
| Engine running | Safety constraint | 0x83 | Turn off engine |
| Vehicle moving | Safety constraint | 0x22 | Stop vehicle |
| Routine control active | Can be interrupted | 0x22 | Stop routine first |
| Power supply unstable | Data integrity risk | 0x22 | Wait for stable power |

### OEM-Specific Restrictions

- Hard Reset: OEM may restrict during critical operations
- Key Off-On: OEM may restrict during certain states
- Soft Reset: Usually allowed in most states
- Safety Session: Resets typically blocked entirely

---

## 13. ISO-TP FRAMING FOR SID 11

### Frame Types and Sizes

| Scenario | PCI | Data Length | Description |
|----------|-----|-------------|-------------|
| Request Standard | 0x02 | 2 bytes | SID(1) + Subfunc(1) |
| Response Standard | 0x02 | 2 bytes | SID(1) + Subfunc(1) |
| Request with PowerDown | 0x03 | 3 bytes | SID(1) + Subfunc(1) + Time(1) |
| Response with PowerDown | 0x03 | 3 bytes | SID(1) + Subfunc(1) + Time(1) |
| Negative Response | 0x03 | 3 bytes | SID(1) + Original(1) + NRC(1) |

### Frame Structure Examples

```
Single Frame (SF) with 2-byte data:
  PCI: 0x02 (SF, len=2)
  Data: [SID] [Subfunc]

Single Frame (SF) with 3-byte data:
  PCI: 0x03 (SF, len=3)
  Data: [SID] [Subfunc] [PowerDownTime]

Negative Response:
  PCI: 0x03 (SF, len=3)
  Data: [0x7F] [0x11] [NRC]
```

---

## 14. NRC DECISION TREE

### Validation Sequence

```
Step 1: Is SID 0x11 supported?
   ├─ NO  → NRC 0x11 (Service Not Supported)
   └─ YES → Go to Step 2

Step 2: Is subfunction 0x01-0x05 or valid 0x40-0x7E?
   ├─ NO  → NRC 0x12 (Sub-Function Not Supported)
   └─ YES → Go to Step 3

Step 3: Is message length correct (2 or 3 bytes)?
   ├─ NO  → NRC 0x13 (Incorrect Message Length)
   └─ YES → Go to Step 4

Step 4: Is reset allowed in current session?
   ├─ NO  → NRC 0x7E (Sub-Function Not Supported In Active Session)
   └─ YES → Go to Step 5

Step 5: Are preconditions met (no ongoing operations)?
   ├─ NO  → NRC 0x22 (Conditions Not Correct)
   └─ YES → Go to Step 6

Step 6: Does ECU allow reset in current state?
   ├─ NO  → NRC 0x83/0x84 (Engine state) or NRC 0x22
   └─ YES → Generate Positive Response 0x51
```

---

## 15. MESSAGE SEQUENCE EXAMPLES

### Example 1: Hard Reset from Default Session

```
Tester → ECU:  11 01           (Request hard reset)
ECU → Tester:  51 01           (Positive response - reset begins)
[ECU resets]
ECU → Tester:  Ready in Default Session (0x01)
```

### Example 2: Soft Reset from Extended Session

```
Tester → ECU:  10 03           (Enter extended session)
ECU → Tester:  50 03 00 64 01 F4   (Extended session established)
Tester → ECU:  11 03           (Request soft reset)
ECU → Tester:  51 03           (Positive response)
[ECU restarts]
ECU → Tester:  Ready in Default Session (0x01)
Tester → ECU:  10 03           (Re-enter extended if needed)
```

### Example 3: Enable RPS with Timeout

```
Tester → ECU:  11 04 32        (Enable RPS, 500ms timeout)
ECU → Tester:  51 04 32        (Positive response)
[RPS enabled - ECU will shutdown 500ms after ignition off]
```

### Example 4: Invalid Reset Attempt (During Flash)

```
Tester → ECU:  11 01           (Request hard reset during flash)
ECU → Tester:  7F 11 22        (NRC 0x22: Conditions not correct)
[Tester waits for flash completion]
Tester → ECU:  11 01           (Retry after flash completes)
ECU → Tester:  51 01           (Now accepted)
```

---

## 16. BIT-LEVEL SPECIFICATION

### Subfunction Byte (Byte #2)

```
Bit: 7 | 6 5 4 3 2 1 0
    ---|---+---+---+---+---+---+---
    S  | ResetType (0x01-0x7E)
```

- **Bit 7 (S)**: suppressPositiveResponseBit
  - 0 = Send positive response (normal)
  - 1 = Suppress positive response

- **Bits 6-0**: Reset type identifier
  - 0x01 = Hard Reset
  - 0x02 = Key Off-On Reset
  - 0x03 = Soft Reset
  - 0x04 = Enable RPS
  - 0x05 = Disable RPS
  - 0x40-0x5F = Manufacturer Specific
  - 0x60-0x7E = Supplier Specific

---

## 17. QUICK REFERENCE - KEY VALUES

### Critical Hex Values

| Value | Meaning |
|-------|---------|
| 0x11 | Service ID: ECU Reset |
| 0x51 | Positive Response SID (0x11 + 0x40) |
| 0x7F | Negative Response SID |
| 0x01 | Hard Reset |
| 0x02 | Key Off-On Reset |
| 0x03 | Soft Reset |
| 0x04 | Enable Rapid Power Shutdown |
| 0x05 | Disable Rapid Power Shutdown |
| 0x22 | NRC: Conditions Not Correct |
| 0x32 | 50 (500ms in 10ms units) |
| 0x64 | 100 (1000ms in 10ms units) |

### Reset Type Selection Guide

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| System hangs | 0x01 (Hard) | Full reinitialization needed |
| After software update | 0x02 (Key Off-On) | Preserve calibration, simulate user action |
| Restart application | 0x03 (Soft) | Fastest, most common |
| Test recovery | 0x03 (Soft) | Quick cycle for testing |
| Safe error recovery | 0x02 (Key Off-On) | Preserve learned data |
| OBD compliance | 0x02 (Key Off-On) | Most compatible with tools |

---

## 18. ISO STANDARD COMPLIANCE

### ISO 14229-1:2020 Requirements Met

- ✓ Service ID 0x11 for ECU reset
- ✓ Five subfunctions (0x01-0x05 mandatory)
- ✓ Reset types with different memory impact
- ✓ Optional powerDownTime parameter
- ✓ Response BEFORE reset execution
- ✓ Auto-transition to default session
- ✓ Security access reset after reset
- ✓ Proper NRC codes per condition
- ✓ Session support rules
- ✓ ISO-TP transport compliance

### Common Implementation Standards

- ISO 11898-1: CAN Physical Layer
- ISO 11898-2: CAN High-Speed
- ISO 15765-2: ISO-TP Transport Protocol
- ISO 14229-1: UDS Protocol Definition
- AUTOSAR: Automotive Software Architecture

---

## 19. IMPLEMENTATION CHECKLIST

### Core Requirements

- ✅ Subfunction validation (0x01-0x05 standard, 0x40-0x7E extended)
- ✅ Message length check (2 or 3 bytes)
- ✅ Session support verification
- ✅ Pre-reset condition checks (flash, resources, engine state)
- ✅ Positive response generation and transmission
- ✅ Reset execution after response sent
- ✅ Automatic transition to default session
- ✅ Security access reset on completion
- ✅ Proper NRC code generation
- ✅ PowerDownTime parameter handling (for 0x04/0x05)

### Reset Type Implementation

- ✅ Hard Reset: Full hardware reinitialization
- ✅ Key Off-On: Simulated ignition cycle
- ✅ Soft Reset: Application restart only
- ✅ Enable RPS: Power-down timer configuration
- ✅ Disable RPS: RPS feature disable

### Robustness Features

- ✅ Timeout protection (100-500ms per reset type)
- ✅ Flash operation detection (prevent reset during write)
- ✅ Engine state checking (if applicable)
- ✅ Resource availability verification
- ✅ Communication error handling
- ✅ Reset failure recovery

---

## 20. DIFFERENCES FROM SID 10 (Diagnostic Session Control)

| Aspect | SID 10 | SID 11 |
|--------|--------|--------|
| **Purpose** | Change diagnostic session | Reset/restart ECU |
| **Duration** | Temporary, until S3 timeout | One-time operation |
| **Data Impact** | No memory changes | Memory reinit depends on type |
| **Response Timing** | Immediately changes session | Reset occurs AFTER response |
| **Security** | Reset on each entry | Reset after completion |
| **S3 Timer** | Used during session | Reset triggers new session |
| **Transitions** | Can chain multiple times | Completes in one operation |
| **Typical Usage** | Session management | Recovery, testing, feature enable |

---

## 21. COMPARISON WITH OTHER RESET SERVICES

### SID 11 vs SID 87 (Link Control)

| Aspect | SID 11 (Reset) | SID 87 (Link Control) |
|--------|---|---|
| Scope | ECU reset/restart | Communication state control |
| Effect | Restart application/hardware | Modify message transmission |
| Data Loss | Possible (Hard Reset) | No data loss |
| Usage | Recovery, diagnostics | Communication optimization |

---

## 22. REAL-WORLD SCENARIOS

### Scenario 1: After Software Update

```
1. Flash new software (SID 0x34-0x37)
2. Send soft reset (11 03)
3. ECU restarts with new code
4. Verify application (read DIDs)
```

### Scenario 2: Error Recovery

```
1. Detect ECU communication lost
2. Send soft reset (11 03) to recover
3. Restart diagnostic session
4. Re-establish communication
```

### Scenario 3: Enable Power-Down Feature

```
1. Send enable RPS with 1000ms timeout (11 04 64)
2. Ignition turned off
3. ECU remains powered for 1000ms
4. ECU powers down gracefully
```

### Scenario 4: Production Calibration

```
1. Flash calibration data
2. Send key off-on reset (11 02)
3. ECU learns new calibration
4. Verify with extended diagnostics (10 03)
```

---

## 23. ERROR HANDLING FLOWCHART

```
Reset Request Received
    │
    ├─→ Subfunction Valid? ──NO──→ NRC 0x12
    │
    ├─→ Message Length OK? ──NO──→ NRC 0x13
    │
    ├─→ Session Allows Reset? ──NO──→ NRC 0x7E
    │
    ├─→ No Flash in Progress? ──NO──→ NRC 0x22
    │
    ├─→ Engine State OK? ──NO──→ NRC 0x83/0x84
    │
    ├─→ Resources Available? ──NO──→ NRC 0x25
    │
    └─→ Send Positive Response (51 XX)
            │
            ├─→ Perform Reset
            │
            └─→ Transition to Default Session
```

---

## 24. TESTING RECOMMENDATIONS

### Unit Tests

1. **Subfunction Validation**
   - Valid range (0x01-0x05): Accept
   - Invalid range (0x00, 0x06-0x3F, 0xFF): Reject with NRC 0x12

2. **Message Format**
   - Correct length (2 bytes): Accept
   - Wrong length (1 or 3 without proper format): Reject with NRC 0x13

3. **Post-Reset Behavior**
   - Hard Reset: Verify NVM reinitialized
   - Key Off-On: Verify NVM preserved
   - Soft Reset: Verify RAM not fully reinitialized

4. **Session Management**
   - After reset: Must be in Default Session
   - Security: Must be locked after reset

### Integration Tests

- Multi-frame message handling (if extended subfuncs used)
- Reset during ongoing operations
- S3 timeout after reset completes
- Concurrent reset requests
- Error recovery sequences

---

## 25. REFERENCES

- ISO 14229-1:2020 - Unified Diagnostic Services (UDS)
- ISO 11898-1:2015 - CAN Protocol
- ISO 15765-2:2016 - ISO-TP Transport
- AUTOSAR Diagnostic Services Specification
- OEM-specific diagnostic documentation
- Vehicle-specific reset requirements

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Scope**: Complete SID 11 data reference for UDS simulator implementation