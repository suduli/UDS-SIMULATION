# UDS SID 10 - Diagnostic Session Control
## Complete Data Reference for Implementation

---

## 1. SERVICE OVERVIEW

| Property | Value |
|----------|-------|
| Service ID (Request) | 0x10 |
| Service ID (Response) | 0x50 |
| Service Name | Diagnostic Session Control |
| Purpose | Change the ECU diagnostic session type |
| ISO Standard | ISO 14229-1:2020 |
| Message Length (Request) | 2 bytes |
| Message Length (Response) | 6 bytes (minimum) |

---

## 2. SUBFUNCTIONS (0x01 - 0x7E)

### Standard Subfunctions (Mandatory per ISO 14229-1)

| Code | Name | Description | Purpose | Supported |
|------|------|-------------|---------|-----------|
| 0x01 | Default Session | Entry point on ECU power-up | Basic diagnostics, reading identifiers, DTC reading | Yes |
| 0x02 | Programming Session | Software update and ECU flash | Flash memory operations, reprogramming | Yes |
| 0x03 | Extended Diagnostic Session | Advanced diagnostics | Sensor adjustment, read/write values, actuator testing | Yes |
| 0x04 | Safety System Diagnostic Session | Safety-critical testing | Airbag, seat belt, ABS, braking system diagnostics | Yes |

### Reserved Subfunctions

| Range | Name | Description | Supported |
|-------|------|-------------|-----------|
| 0x05-0x3F | ISO Reserved | Reserved for future ISO standards | No |
| 0x40-0x5F | Vehicle Manufacturer Specific | OEM-defined diagnostic sessions | Optional |
| 0x60-0x7E | System Supplier Specific | Tier-1/supplier-defined sessions | Optional |
| 0x7F | ISO Reserved | Reserved for future use | No |

---

## 3. SESSION TIMING PARAMETERS

| Parameter | Default (0x01) | Programming (0x02) | Extended (0x03) | Safety (0x04) |
|-----------|---|---|---|---|
| **P2 Server Max (ms)** | 50 | 50 | 100 | 50 |
| **P2 Server Max (hex)** | 0x32 | 0x32 | 0x64 | 0x32 |
| **P2* Server Max (ms)** | 5000 | 5000 | 5000 | 5000 |
| **P2* Server Max (hex)** | 0x01F4 | 0x01F4 | 0x01F4 | 0x01F4 |
| **S3 Timeout (ms)** | 5000 | 5000 | 5000 | 5000 |

### Timing Parameter Definitions

- **P2 Server Max**: Maximum time from tester request to ECU response (1ms resolution)
- **P2* Server Max**: Extended response time for long operations (10ms resolution), sent with NRC 0x78
- **S3 Timeout**: Session timeout - if no activity within this period, ECU automatically reverts to default session

---

## 4. REQUEST MESSAGE FORMAT

### Byte Structure

| Byte # | Field Name | Range | Description |
|--------|-----------|-------|-------------|
| 1 | SID | 0x10 | Diagnostic Session Control Service ID |
| 2 | SubfunctionParameter | 0x01-0x7E | Session type to transition to |

### Subfunction Byte Bit Structure

| Bit(s) | Field | Value | Notes |
|--------|-------|-------|-------|
| Bit 7 | suppressPositiveResponseBit | 0 or 1 | 0=Send response, 1=Suppress response |
| Bits 6-0 | SessionType | 0x01-0x7E | Actual session identifier |

### Request Examples

| Scenario | Message (Hex) | Description |
|----------|---------------|-------------|
| Request Default Session | 10 01 | Enter default diagnostic session |
| Request Programming Session | 10 02 | Enter programming/flash session |
| Request Extended Session | 10 03 | Enter extended diagnostic session |
| Request Safety Session | 10 04 | Enter safety system diagnostic session |
| Suppress Response (Extended) | 10 83 | Enter extended session, suppress positive response |

---

## 5. POSITIVE RESPONSE FORMAT

### Byte Structure

| Byte # | Field Name | Length | Range | Description |
|--------|-----------|--------|-------|-------------|
| 1 | SID | 1 | 0x50 | Positive Response SID |
| 2 | SubfunctionParameter | 1 | 0x01-0x7E | Echo of requested subfunctionparameter |
| 3-4 | P2 Server Max | 2 | 0x0000-0xFFFF | Response time in 1ms units |
| 5-7 | P2* Server Max | 3 | 0x000000-0xFFFFFF | Extended time in 10ms units |

### Response Calculation Examples

**Example 1: Default Session**
- Request: `10 01`
- Response: `50 01 00 32 01 F4`
  - P2 = 0x0032 = 50ms
  - P2* = 0x01F4 = 500 × 10ms = 5000ms

**Example 2: Extended Session**
- Request: `10 03`
- Response: `50 03 00 64 01 F4`
  - P2 = 0x0064 = 100ms
  - P2* = 0x01F4 = 500 × 10ms = 5000ms

---

## 6. NEGATIVE RESPONSE FORMAT

### Byte Structure

| Byte # | Field Name | Range | Description |
|--------|-----------|-------|-------------|
| 1 | Response SID | 0x7F | Negative Response Indicator |
| 2 | Requested SID | 0x10 | Original SID that failed |
| 3 | NRC Code | See Table 7 | Negative Response Code |

### Format
`7F 10 [NRC]`

---

## 7. NEGATIVE RESPONSE CODES (NRC)

| Code | Name | Description | Common Triggers | Handling |
|------|------|-------------|-----------------|----------|
| 0x10 | General Reject | General rejection for unspecified reasons | Various errors | Retry after delay |
| 0x12 | Sub-Function Not Supported | Requested subfunctionparameter not supported | Subfunc > 0x7E or unsupported manufacturer/supplier codes | Check supported ranges |
| 0x13 | Incorrect Message Length | Request has wrong length or format | Request ≠ 2 bytes | Send correct format |
| 0x22 | Conditions Not Correct | Invalid session transition | Try 0x02 from 0x03, or invalid path | Return to default first |
| 0x24 | Request Sequence Error | Request in wrong sequence | Out-of-order requests | Wait and retry |
| 0x25 | No Access to Resource | Insufficient resources | ECU in unsafe state | Wait for completion |
| 0x7E | Sub-Function Not Supported in Active Session | Session type not supported in current session | Session disabled in active session | Check service matrix |
| 0x7F | Service Not Supported in Active Session | SID 0x10 not available in current session | Rare - session control disabled | Unexpected error |

---

## 8. SESSION TRANSITIONS

### Valid Transitions Matrix

| From → To | 0x01 Default | 0x02 Programming | 0x03 Extended | 0x04 Safety |
|-----------|---|---|---|---|
| **0x01 Default** | OK (re-enter) | ✓ OK | ✓ OK | ✓ OK |
| **0x02 Programming** | ✓ OK | ✗ NRC 0x22 | ✗ NRC 0x22 | ✗ NRC 0x22 |
| **0x03 Extended** | ✓ OK | ✗ NRC 0x22 | OK (re-enter) | ✗ NRC 0x22 |
| **0x04 Safety** | ✓ OK | ✗ NRC 0x22 | ✗ NRC 0x22 | OK (re-enter) |

### Transition Rules

1. **Programming Session (0x02)**: Can ONLY be entered from default session (0x01)
   - From Extended or Safety → Must return to default first
   - From Programming → Cannot re-enter directly (return to 0x01 first)

2. **Extended Session (0x03)**: Can be entered from default session (0x01)
   - From Programming → Must return to default first
   - Can re-enter Extended from Extended (same session)

3. **Default Session (0x01)**: Always accessible from any session
   - Used as "safe state" to transition between other sessions
   - Automatically entered on S3 timeout

4. **Safety Session (0x04)**: Session-specific transition rules (OEM-dependent)
   - Typically requires return to default first
   - May have additional security requirements

---

## 9. SESSION TRANSITION ACTIONS

When transitioning between sessions, the following actions are automatically performed:

### Actions on Every Session Change

| Action | Effect | Timing |
|--------|--------|--------|
| **Lock Security Access** | All security levels locked | Immediate |
| **Reset Communication Control** | Communication state reset to defaults | Immediate |
| **Reset DTC Control** | DTC control settings reset | Immediate |
| **Start S3 Timer** | Begin 5-second inactivity timeout | After positive response |

### Actions on Transition TO Default Session (0x01)

| Action | Effect |
|--------|--------|
| Disable I/O Control (0x2F) | All output control requests cancelled |
| Stop Event Services (0x86) | All event listening cancelled |
| Stop Data Transmission (0x2A) | Periodic/on-demand transmission stopped |
| Clear Active Routines (0x31) | All running routines terminated |
| Revert to default services only | Only default session services available |

### Actions on Transition FROM Default TO Extended/Programming

| Session | Actions |
|---------|---------|
| **To Extended (0x03)** | Enable extended services; start allowing I/O control, routine control, write operations |
| **To Programming (0x02)** | Enable flash programming; disable most read services; require security access |
| **To Safety (0x04)** | Enable safety-specific routines; may require special security |

---

## 10. SECURITY ACCESS BEHAVIOR

| Session | Unlocked on Entry | Requires Re-Auth | Security Level | Access Type |
|---------|---|---|---|---|
| Default (0x01) | No | Yes | None | Read-only |
| Programming (0x02) | No | Yes | 0x01, 0x02, 0x03 | Write/Flash |
| Extended (0x03) | No | Yes | 0x01, 0x02, 0x03 | Read/Write/Control |
| Safety (0x04) | No | Yes | None | Limited/Safety |

### Key Points

- Security access is ALWAYS locked when entering a new session
- Previous security unlock is lost on session transition
- Must perform SID 0x27 (Security Access) after session change if write access needed
- Seeds/Keys are typically time-dependent or tied to session state

---

## 11. SERVICE AVAILABILITY BY SESSION

| Service | SID | Default | Programming | Extended | Safety |
|---------|-----|---------|---|---|---|
| Diagnostic Session Control | 0x10 | ✓ | ✓ | ✓ | ✓ |
| ECU Reset | 0x11 | ✓ | | ✓ | |
| Clear DTC | 0x14 | | | ✓ | |
| Read DTC | 0x19 | ✓ | | ✓ | ✓ |
| Read Data By Identifier | 0x22 | ✓ | | ✓ | ✓ |
| Read Memory By Address | 0x23 | | | ✓ | |
| Read Scaling Data | 0x24 | | | ✓ | |
| Security Access | 0x27 | | ✓ | ✓ | |
| Write Data By Identifier | 0x2E | | | ✓ | |
| Input/Output Control | 0x2F | | | ✓ | |
| Routine Control | 0x31 | | | ✓ | ✓ |
| Request Download | 0x34 | | ✓ | | |
| Request Upload | 0x35 | | ✓ | | |
| Transfer Data | 0x36 | | ✓ | | |
| Transfer Exit | 0x37 | | ✓ | | |
| Tester Present | 0x3E | ✓ | ✓ | ✓ | ✓ |

---

## 12. ISO-TP FRAMING

### Single Frame (SF) Examples for SID 10

| Scenario | Full Message | ISO-TP Framing | Description |
|----------|---|---|---|
| Request Default | 10 01 | 02 10 01 | PCI 0x02 = SF, len=2 |
| Response Default | 50 01 00 32 01 F4 | 06 50 01 00 32 01 F4 | PCI 0x06 = SF, len=6 |
| Negative Response | 7F 10 22 | 03 7F 10 22 | PCI 0x03 = SF, len=3 |

### PCI Byte Format

- **Bits 7-4**: Frame type (0x0=SF, 0x1=FF, 0x2=CF, 0x3=FC)
- **Bits 3-0**: Data length (SF) or remaining data length (FF/CF)

### Frame Type Examples

| Type | PCI | Meaning |
|------|-----|---------|
| Single Frame (SF) | 0x0n | n = data length (0-7 bytes) |
| First Frame (FF) | 0x10-0x1F | Multi-frame start with length |
| Consecutive Frame (CF) | 0x20-0x2F | Continuation frame, seq number |
| Flow Control (FC) | 0x30-0x3F | Flow control: FS, AA, BS |

---

## 13. NRC DECISION TREE

### Validation Sequence

```
Step 1: Is subfunctionparameter in range 0x01-0x7E?
   ├─ NO  → NRC 0x12 (Sub-Function Not Supported)
   └─ YES → Go to Step 2

Step 2: Is message length exactly 2 bytes?
   ├─ NO  → NRC 0x13 (Incorrect Message Length)
   └─ YES → Go to Step 3

Step 3: Is requested session supported by ECU?
   ├─ NO  → NRC 0x12 (Sub-Function Not Supported)
   └─ YES → Go to Step 4

Step 4: Is transition valid from current session?
   ├─ NO  → NRC 0x22 (Conditions Not Correct)
   └─ YES → Go to Step 5

Step 5: Are preconditions met (no blocking operations)?
   ├─ NO  → NRC 0x22 or 0x25 (Conditions/Resources)
   └─ YES → Generate Positive Response 0x50
```

---

## 14. STATE MACHINE REQUIREMENTS

### Session States

```
[POWER-UP]
    ↓
[DEFAULT (0x01)]  ← S3 Timeout auto-revert
    ├─→ [PROGRAMMING (0x02)]  ─→ [DEFAULT]
    ├─→ [EXTENDED (0x03)]     ─→ [DEFAULT]
    └─→ [SAFETY (0x04)]       ─→ [DEFAULT]
```

### State Variables to Track

| Variable | Type | Range | Purpose |
|----------|------|-------|---------|
| current_session | byte | 0x01-0x04 | Active session |
| security_unlocked | bool[] | 0-3 levels | Track unlock state per level |
| s3_timer_remaining | uint32 | 0-5000 | Milliseconds until timeout |
| p2_max | uint16 | 50-100 | Current session P2 timing |
| p2_star_max | uint32 | 5000 | Current session P2* timing |

---

## 15. TIMING PARAMETERS DETAIL

### P2 Server Max (Normal Response Time)

- **Resolution**: 1 millisecond
- **Range**: 0-65535 ms (0x0000-0xFFFF)
- **Encoding**: 2 bytes, big-endian (high byte first)
- **Typical Values**:
  - Default/Programming: 0x0032 (50 ms)
  - Extended: 0x0064 (100 ms)

### P2* Server Max (Extended Response Time)

- **Resolution**: 10 milliseconds
- **Range**: 0-655350 ms (0x000000-0xFFFFFF)
- **Encoding**: 3 bytes, big-endian (most significant byte first)
- **Used When**: NRC 0x78 (Response Pending) is sent
- **Typical Value**: 0x01F4 × 10 = 5000 ms (5 seconds)

### S3 Server Timeout

- **Definition**: Inactivity timeout for session
- **Value**: 5000 ms (5 seconds)
- **Trigger**: No UDS request received within S3 period
- **Action**: Automatically revert to default session (0x01)
- **Reset**: Any valid UDS request resets the timer

---

## 16. BIT-LEVEL DETAIL

### Subfunction Byte (Byte #2)

```
Bit: 7 | 6 5 4 3 2 1 0
    ---|---+---+---+---+---+---+---
    S  | SessionType (0x01-0x7E)
```

- **Bit 7 (S)**: suppressPositiveResponseBit
  - 0 = Send positive response (normal)
  - 1 = Suppress positive response (reduces network traffic)

- **Bits 6-0**: Session type identifier
  - 0x00 = Invalid
  - 0x01 = Default Session
  - 0x02 = Programming Session
  - 0x03 = Extended Diagnostic Session
  - 0x04 = Safety System Diagnostic Session
  - 0x05-0x3F = Reserved by ISO
  - 0x40-0x5F = Vehicle Manufacturer Specific
  - 0x60-0x7E = System Supplier Specific
  - 0x7F = Reserved by ISO

### suppressPositiveResponseBit Usage

| Bit 7 | Behavior |
|-------|----------|
| 0 | Normal: Send positive response after session change |
| 1 | Suppress: Do NOT send positive response (reduces CAN traffic) |

---

## 17. RESPONSE PARAMETER CALCULATION FORMULAS

### Converting Timing Values to Hex

**P2 (1 ms resolution, 2 bytes)**
```
Hex_Value = P2_time_ms (as 16-bit big-endian)
Example: 50 ms → 0x0032
  High byte = (50 >> 8) & 0xFF = 0x00
  Low byte  = 50 & 0xFF = 0x32
```

**P2* (10 ms resolution, 3 bytes)**
```
P2*_in_10ms_units = P2*_time_ms / 10
Hex_Value = P2*_in_10ms_units (as 24-bit big-endian)
Example: 5000 ms → 500 × 10 ms units → 0x01F4
  Byte 1 = (500 >> 16) & 0xFF = 0x01
  Byte 2 = (500 >> 8) & 0xFF = 0xF4
  Byte 3 = 500 & 0xFF = 0x00
  Result: 0x01F400
```

### Example Responses

| Session | P2 (ms) | P2 Hex | P2* (ms) | P2* Units | P2* Hex | Full Response |
|---------|---------|--------|----------|-----------|---------|--------------|
| Default | 50 | 0x0032 | 5000 | 500 | 0x01F400 | 50 01 00 32 01 F4 00 |
| Programming | 50 | 0x0032 | 5000 | 500 | 0x01F400 | 50 02 00 32 01 F4 00 |
| Extended | 100 | 0x0064 | 5000 | 500 | 0x01F400 | 50 03 00 64 01 F4 00 |

---

## 18. TYPICAL MESSAGE SEQUENCES

### Scenario 1: Default Session Request

```
Tester → ECU:    10 01        (Request default session)
ECU → Tester:    50 01 00 32 01 F4   (Positive response, P2=50ms, P2*=5000ms)
```

### Scenario 2: Programming Session from Default

```
Tester → ECU:    10 02        (Request programming session from default)
ECU → Tester:    50 02 00 32 01 F4   (Positive response, ready for programming)
Tester → ECU:    27 01        (Request security seed)
ECU → Tester:    67 01 [seed] (Provide seed)
Tester → ECU:    27 02 [key]  (Send key)
ECU → Tester:    67 02        (Security unlocked)
Tester → ECU:    34 ...       (Start flash download)
```

### Scenario 3: Invalid Transition (Extended to Programming)

```
Tester → ECU:    10 03        (Enter extended session)
ECU → Tester:    50 03 00 64 01 F4   (Now in extended)
Tester → ECU:    10 02        (Try programming from extended - INVALID)
ECU → Tester:    7F 10 22     (Negative: Conditions not correct)
Tester → ECU:    10 01        (Return to default)
ECU → Tester:    50 01 00 32 01 F4   (Back to default)
Tester → ECU:    10 02        (Now request programming)
ECU → Tester:    50 02 00 32 01 F4   (Now in programming)
```

### Scenario 4: S3 Timeout

```
Tester → ECU:    10 03        (Enter extended session)
ECU → Tester:    50 03 00 64 01 F4   (In extended session)
[No activity for 5+ seconds]
ECU Automatically:          (S3 timeout triggers)
Current Session:           0x01 (Default)
Security Access:           Locked
```

---

## 19. MANUFACTURER-SPECIFIC CONSIDERATIONS

### Vehicle Manufacturer (0x40-0x5F) Specific Behaviors

- Range reserved for OEM-specific sessions
- Examples: BMW Proprietary, Mercedes-Benz specific, Audi-specific
- May include additional security or timing requirements
- OEM defines transition rules and supported services

### System Supplier (0x60-0x7E) Specific Behaviors

- Range for Tier-1/ECU supplier specific sessions
- Examples: Continental, Bosch, NVIDIA Drive, etc.
- May be used for supplier-specific calibration/testing
- Transition rules and services defined by supplier

---

## 20. ERROR HANDLING CHECKLIST

### Before Accepting Session Transition

- ✓ Subfunctionparameter is 0x01-0x7E
- ✓ Message length is exactly 2 bytes
- ✓ Requested session is supported by ECU
- ✓ Transition is valid from current session (check matrix)
- ✓ No blocking operations in progress
- ✓ ECU has sufficient resources
- ✓ Current session allows transition service

### After Session Transition

- ✓ Lock all security levels
- ✓ Stop active I/O controls
- ✓ Clear any pending operations
- ✓ Reset timing parameters to new session values
- ✓ Start S3 inactivity timer
- ✓ Update service availability matrix
- ✓ Log session change event

---

## 21. QUICK REFERENCE - KEY VALUES

### Critical Hex Values

| Value | Meaning |
|-------|---------|
| 0x10 | Service ID: Diagnostic Session Control |
| 0x50 | Positive Response SID (0x10 + 0x40) |
| 0x7F | Negative Response SID |
| 0x01 | Default Session |
| 0x02 | Programming Session |
| 0x03 | Extended Diagnostic Session |
| 0x04 | Safety System Diagnostic Session |
| 0x22 | NRC: Conditions Not Correct (invalid transition) |
| 0x32 | 50 ms (typical P2 value in decimal) |
| 0x64 | 100 ms (extended P2 value in decimal) |
| 0x01F4 | 500 (5000 ms / 10 ms resolution) |

### Timing Values Summary

| Parameter | Value | Unit | Hex (if 1-byte) |
|-----------|-------|------|-----------------|
| P2 Default | 50 | ms | 0x32 |
| P2 Extended | 100 | ms | 0x64 |
| P2* Standard | 5000 | ms | 0x01F4 |
| S3 Timeout | 5000 | ms | N/A (uint32) |

---

## 22. ISO STANDARD COMPLIANCE

### ISO 14229-1:2020 Requirements Met

- ✓ Service ID 0x10 for session control
- ✓ Four mandatory subfunctions (0x01-0x04)
- ✓ Transition rules enforcement
- ✓ Security access reset on transition
- ✓ P2 and P2* timing in response
- ✓ S3 timeout handling
- ✓ Proper NRC codes
- ✓ sessionParameterRecord format
- ✓ ISO-TP transport compliance
- ✓ Service availability per session

### Common Implementation Standards

- ISO 11898-1: CAN Physical Layer
- ISO 11898-2: CAN High-Speed Physical Layer
- ISO 15765-2: ISO-TP Transport Protocol
- ISO 14229-1: UDS Protocol Definition
- AUTOSAR: Automotive Software Architecture

---

## 23. TEST CASES FOR VALIDATION

### Unit Test Cases

1. **Test Subfunction Validation**
   - Valid range (0x01-0x7E): Should accept
   - Invalid range (0x00, 0xFF): Should reject with NRC 0x12

2. **Test Transition Rules**
   - Default → Extended: Valid
   - Extended → Programming: Invalid (NRC 0x22)
   - Programming → Default: Valid

3. **Test Message Format**
   - Correct length (2 bytes): Accept
   - Wrong length (1 or 3 bytes): Reject with NRC 0x13

4. **Test Security Reset**
   - Unlock security in extended
   - Change to default
   - Verify security is locked again

5. **Test S3 Timeout**
   - Enter extended session
   - Wait 5+ seconds
   - Verify automatic return to default

### Integration Test Cases

- Full diagnostic workflow (request → transition → execute services → return)
- Multi-frame message handling
- Concurrent requests
- Error recovery

---

## 24. REFERENCES

- ISO 14229-1:2020 - Unified Diagnostic Services (UDS)
- ISO 11898-1:2015 - CAN Protocol
- ISO 15765-2:2016 - ISO-TP Transport
- AUTOSAR Diagnostic Services Specification
- OEM-specific diagnostic documentation

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Scope**: Complete SID 10 data reference for UDS simulator implementation