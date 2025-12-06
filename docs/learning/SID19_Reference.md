# UDS SID 19 - Read DTC Information
## Complete Data Reference for Implementation

---

## 1. SERVICE OVERVIEW

| Property | Value |
|----------|-------|
| Service ID (Request) | 0x19 |
| Service ID (Response) | 0x59 |
| Service Name | Read DTC (Diagnostic Trouble Code) Information |
| Purpose | Retrieve stored, pending, and mirror memory DTCs with status info |
| ISO Standard | ISO 14229-1:2020 |
| Message Length (Request) | 2-3 bytes (SID + Subfunc + optional mask) |
| Message Length (Response) | Variable (2 bytes minimum, multi-frame possible) |
| Data Returned | DTC codes, status bytes, snapshot records, extended data |

---

## 2. SUBFUNCTIONS (0x01 - 0x0F Standard)

### Mandatory Subfunctions

| Code | Name | Description | Returns | Common Use |
|------|------|-------------|---------|------------|
| **0x01** | Report Number of DTCs | Count DTCs matching status mask | DTC count (uint16) | Get # of faults quickly |
| **0x02** | Report DTC by Status Mask | Get all DTCs with specific status | List of DTCs + status | Read all stored DTCs |
| **0x03** | Report DTC by Severity | Get DTCs by severity level | DTCs filtered by severity | Priority-based diagnostics |
| **0x04** | Report Snapshot ID | Get snapshot data for DTC | Snapshot records | Debug conditions at fault |
| **0x05** | Report Extended Data ID | Get extended data for DTC | Extended data bytes | Detailed fault analysis |
| **0x06** | Report Extended Data by DTC | Get extended data by DTC code | Extended data records | Full diagnostic info |
| **0x07** | Report Number by Severity | Count DTCs by severity level | DTC count per severity | Fault statistics |
| **0x08** | Report Snapshot Record | Get snapshot record number | Snapshot identification | Data capture info |
| **0x09** | Report Extended Data Record | Get extended data record number | Extended data ID | Data organization |
| **0x0A** | Report Supported DTCs | Get all supported DTCs | Supported DTC list | ECU capability check |
| **0x0B** | Report First Test Failed | Get first test failed DTC | First failed DTC | Failure sequence |
| **0x0C** | Report First Confirmed | Get first confirmed DTC | First confirmed DTC | Failure history |
| **0x0D** | Report Most Recent Failed | Get most recent failed DTC | Most recent DTC | Latest failure |
| **0x0E** | Report Most Recent Confirmed | Get most recent confirmed DTC | Most recent confirmed DTC | Current issues |
| **0x0F** | Report Mirror Memory | Get DTCs from mirror memory | Mirror memory DTCs | Post-clear history |

### Extended Subfunctions

| Range | Name | Description | Supported |
|-------|------|-------------|-----------|
| 0x10-0x13 | Mirror Memory Extended | Mirror memory with extended data | Yes |
| 0x14-0x3F | ISO Reserved | Reserved for future use | No |
| 0x40-0x5F | Manufacturer Specific | OEM-defined DTC subfunctions | Optional |
| 0x60-0x7E | Supplier Specific | Tier-1 supplier extensions | Optional |
| 0x7F | ISO Reserved | Reserved | No |

---

## 3. DTC STATUS BYTE (8 bits)

### Bit Structure and Meaning

| Bit | Name | Full Name | Meaning |
|-----|------|-----------|---------|
| **Bit 0** | TF | testFailed | DTC currently failed (real-time) |
| **Bit 1** | TFTMC | testFailedThisMonitoringCycle | Failed during current monitor cycle |
| **Bit 2** | P | pendingDTC | Fault pending (not yet confirmed) |
| **Bit 3** | C | confirmedDTC | Fault confirmed and stored |
| **Bit 4** | TNCTSLC | testNotCompletedSinceLastClear | Test incomplete since last clear |
| **Bit 5** | TFSLC | testFailedSinceLastClear | Test failed since last clear |
| **Bit 6** | TNCTMC | testNotCompletedThisMonitoringCycle | Test not completed this cycle |
| **Bit 7** | WIR | warningIndicatorRequested | Warning indicator (MIL) requested |

### Common Status Mask Values

| Mask | Binary | Meaning | Use Case |
|------|--------|---------|----------|
| 0x00 | 00000000 | No filter (empty) | Rarely used |
| 0x01 | 00000001 | Test Failed only | Current failures |
| 0x08 | 00001000 | Pending DTCs only | Pre-confirmed faults |
| 0x10 | 00010000 | Confirmed DTCs only | Stored confirmed faults |
| 0x20 | 00100000 | Test not completed | Incomplete tests |
| 0x40 | 01000000 | Test failed since clear | Failure history |
| 0x55 | 01010101 | Active or Pending | TF | P (0x01 | 0x08 | 0x40 | 0x08) |
| 0xFF | 11111111 | All DTCs | Complete DTC list |

---

## 4. DTC CODE STRUCTURE

### 3-Byte DTC Format

```
Byte 1 (High): Class and Standard
  Bits 7-4: DTC Class (0x0-0x3)
  Bits 3-0: Standard designation

Byte 2 (Middle): Standard designation and identifier
  All 8 bits: Additional standard info

Byte 3 (Low): Identifier
  All 8 bits: Specific fault identifier
```

### DTC Class Encoding

| Class | Hex | Name | Systems | Examples |
|-------|-----|------|---------|----------|
| **P** | 0x0 | Powertrain | Engine, transmission, emissions | P0101 (MAF sensor), P0505 (Idle control) |
| **C** | 0x1 | Chassis | Brakes, suspension, steering | C0045 (ABS sensor), C0222 (Brake pressure) |
| **B** | 0x2 | Body | Lighting, wipers, doors | B0056 (Seat belt), B1801 (Headlight) |
| **U** | 0x3 | Network | CAN, LIN, Ethernet | U0101 (CAN error), U0154 (Network issue) |

### DTC Examples

| DTC Code | Class | Description |
|----------|-------|-------------|
| 0x010001 | P0001 | Fuel volume regulator control circuit |
| 0x020101 | C0101 | ABS modulator relay circuit |
| 0x020056 | B0056 | Seat belt pretensioner circuit |
| 0x030101 | U0101 | CAN bus off-line or error |

---

## 5. REQUEST MESSAGE FORMAT

### Byte Structure

| Byte | Field | Length | Range | Description |
|------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x19 | Read DTC Information Service ID |
| 2 | SubFunction | 1 | 0x01-0x0F | Subfunction type (0x01-0x0F standard) |
| 3* | statusMask | 1 | 0x00-0xFF | Status filter (required for 0x01, 0x02) |
| 3* | Data | Variable | Varies | Optional extended parameters |

### Request Examples

| Scenario | Message (Hex) | Description |
|----------|---------------|-------------|
| Get DTC count (all) | 19 01 FF | Count all DTCs (status mask = 0xFF) |
| Get active DTCs | 19 02 01 | Get test-failed DTCs only |
| Get pending DTCs | 19 02 08 | Get pending/tentative DTCs |
| Get confirmed DTCs | 19 02 10 | Get confirmed/stored DTCs |
| Get all DTCs | 19 02 FF | Get DTCs with any status |
| Get supported DTCs | 19 0A | List all supported DTCs |
| Get snapshot for DTC | 19 04 01 00 01 | Get snapshot for DTC 0x010001 |
| Get extended data | 19 06 01 00 01 | Get extended data for DTC 0x010001 |

---

## 6. POSITIVE RESPONSE FORMAT

### Byte Structure

| Byte | Field | Length | Range | Description |
|------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x59 | Positive Response SID |
| 2 | SubFunction | 1 | 0x01-0x0F | Echo of requested subfunctionparameter |
| 3-n | Response Data | Variable | Varies | DTC records, counts, or extended data |

### Response Data Format per Subfunc

| Subfunc | Response Structure | Size | Notes |
|---------|------------------|------|-------|
| 0x01 | Count (2 bytes) | 4 bytes | High byte, Low byte = count |
| 0x02 | [DTC(3) + Status(1)]* | 4+ bytes | Repeats per DTC |
| 0x03 | [Severity + DTC + Status]* | 5+ bytes | With severity level |
| 0x04 | [DTC(3) + SnapNum(1)]* | 4+ bytes | Snapshot number per DTC |
| 0x05 | [DTC(3) + ExtDataNum(1)]* | 4+ bytes | Extended data number per DTC |
| 0x06 | [DTC(3) + ExtData(n)]* | Variable | Extended data bytes |
| 0x0A | [DTC(3)]* | 3+ bytes | Supported DTC list |

### Response Examples

| Scenario | Response (Hex) | Description |
|----------|---|---|
| Count Response | 59 01 00 05 | 5 DTCs stored |
| Single DTC | 59 02 01 00 01 10 | DTC 0x010001 with status 0x10 (confirmed) |
| Multiple DTCs | 59 02 01 00 01 10 02 00 02 08 | Two DTCs: 0x010001 (confirmed), 0x020002 (pending) |
| Supported DTCs | 59 0A 01 00 01 02 00 02 03 00 01 | List of supported DTCs |

---

## 7. NEGATIVE RESPONSE FORMAT

| Byte | Field | Range | Description |
|------|-------|-------|-------------|
| 1 | Response SID | 0x7F | Negative Response Indicator |
| 2 | Requested SID | 0x19 | Original SID that failed |
| 3 | NRC Code | See Table 8 | Negative Response Code |

---

## 8. NEGATIVE RESPONSE CODES (NRC)

| Code | Name | Description | Trigger | Solution |
|------|------|-------------|---------|----------|
| 0x11 | Service Not Supported | SID 0x19 not supported | ECU lacks diagnostics | Check ECU model |
| 0x12 | Sub-Function Not Supported | Invalid subfunctionparameter | Subfunc > 0x0F or unsupported | Use 0x01-0x0F |
| 0x13 | Incorrect Message Length | Wrong message format | Missing status mask byte | Add required mask byte |
| 0x22 | Conditions Not Correct | DTCs being cleared | Concurrent clear operation | Retry after clear |
| 0x24 | Request Sequence Error | Out-of-order requests | Invalid request sequence | Wait and retry |
| 0x25 | No Access to Resource | Response too large | Too many DTCs for buffer | Request in chunks |
| 0x31 | Request Out of Range | Invalid parameter | Status mask > 0xFF | Use valid mask |
| 0x7E | Sub-Function Not Supported In Active Session | DTC read disabled | Safety session active | Change to extended |
| 0x7F | Service Not Supported In Active Session | Read DTC disabled | Service not enabled | Check session support |

---

## 9. SESSION SUPPORT FOR DTC READ

### Availability by Session

| Subfunc | Default | Programming | Extended | Safety |
|---------|---------|-------------|----------|--------|
| 0x01 (Count) | YES | YES | YES | YES |
| 0x02 (List) | YES | YES | YES | YES |
| 0x03 (Severity) | YES | YES | YES | YES |
| 0x04-0x09 (Detail) | YES | YES | YES | LIMITED |
| 0x0A (Supported) | YES | YES | YES | YES |
| 0x0F (Mirror) | YES | LIMITED | YES | NO |

---

## 10. SNAPSHOT AND EXTENDED DATA

### Snapshot Records

- **Purpose**: Capture system state at time of fault
- **Content**: Vehicle speed, RPM, throttle position, temperatures, pressures
- **Size**: Typically 10-20 bytes per record
- **Retrieval**: Subfunctions 0x04, 0x08
- **Use**: Debug - understand what was happening when fault occurred

### Extended Data Records

- **Purpose**: Detailed diagnostic information about the fault
- **Content**: OBD monitors, freeze frame data, fault occurrence count
- **Size**: Typically 5-50 bytes per record
- **Retrieval**: Subfunctions 0x05, 0x06, 0x09
- **Use**: Analysis - detailed fault diagnostic information

---

## 11. MIRROR MEMORY

### Definition and Purpose

- **Mirror Memory**: Copy of DTC memory taken after last clear operation
- **Storage**: Separate non-volatile memory location
- **Retention**: Survives power cycles
- **Clear Trigger**: Next DTC clear operation
- **Use Case**: Verify what faults existed before clearing

### Subfunctions for Mirror Memory

- **0x0F**: Report Mirror Memory DTC
- **0x10-0x13**: Report Mirror Memory DTC Extended Data
- **Availability**: Most sessions (limited in programming)

---

## 12. SEVERITY LEVELS (Subfunc 0x03)

### DTC Severity Classification

| Severity | Hex | Condition | Examples | Action |
|----------|-----|-----------|----------|--------|
| **No Severity** | 0x00 | No fault severity assigned | Old cleared codes | None |
| **Maintenance Required** | 0x20 | Routine maintenance | Air filter replacement | Schedule service |
| **Check Operation** | 0x40 | Verify system operation | Sensor drift, minor issue | Diagnose and verify |
| **Check Immediately** | 0x60 | Safety-critical fault | Brake failure, airbag issue | Stop vehicle, seek service |

---

## 13. ISO-TP FRAMING FOR SID 19

### Message Framing

| Scenario | PCI | Data | Description |
|----------|-----|------|-------------|
| Get count | 0x03 | 3 bytes | SID(1) + Subfunc(1) + Mask(1) |
| Count response | 0x04 | 4 bytes | SID(1) + Subfunc(1) + Count(2) |
| Get DTCs | 0x03 | 3 bytes | SID(1) + Subfunc(1) + Mask(1) |
| DTC list (multi) | 0x10 XX XX | 7+ bytes | First frame with total length |
| Negative response | 0x03 | 3 bytes | SID(1) + Original(1) + NRC(1) |
| Flow Control | 0x30/0x31/0x32 | Varies | Handshake for multi-frame |

### Response Size Considerations

| DTC Count | Expected Size | Frame Type | Notes |
|-----------|---------------|-----------|-------|
| 1-5 DTCs | 20-40 bytes | Single Frame | Fits in one CAN frame |
| 5-20 DTCs | 40-100 bytes | Single or Multi | May exceed 7 bytes |
| 20+ DTCs | 100-500+ bytes | Multi-frame | Definitely multi-frame |
| + Extended Data | 5000+ bytes | Multi-frame | Requires flow control |

---

## 14. DTC READ DECISION TREE

### Validation Sequence

```
Step 1: Is SID 0x19 supported?
   ├─ NO  → NRC 0x11 (Service Not Supported)
   └─ YES → Go to Step 2

Step 2: Is subfunc 0x01-0x0F or valid 0x40-0x7E?
   ├─ NO  → NRC 0x12 (Sub-Function Not Supported)
   └─ YES → Go to Step 3

Step 3: Is message format correct for subfunc?
   ├─ NO  → NRC 0x13 (Incorrect Message Length)
   └─ YES → Go to Step 4

Step 4: Is status mask valid (if required)?
   ├─ NO  → NRC 0x31 (Request Out of Range)
   └─ YES → Go to Step 5

Step 5: Are resources available for response?
   ├─ NO  → NRC 0x25 (No Access to Resource)
   └─ YES → Go to Step 6

Step 6: Is DTC read allowed in current session?
   ├─ NO  → NRC 0x7E (Sub-Function Not Supported In Active Session)
   └─ YES → Generate Positive Response 0x59
```

---

## 15. TYPICAL USAGE SCENARIOS

### Scenario 1: Check for Active Faults

```
Tester → ECU:  19 01 01     (Get count of test-failed DTCs)
ECU → Tester:  59 01 00 02  (2 active faults)
Tester → ECU:  19 02 01     (Get test-failed DTCs)
ECU → Tester:  59 02 01 00 01 01 02 00 02 01  (DTCs 0x010001, 0x020002)
```

### Scenario 2: Read Confirmed DTCs

```
Tester → ECU:  19 02 10     (Get confirmed DTCs, status = 0x10)
ECU → Tester:  59 02 01 00 01 10  (DTC 0x010001 with status confirmed)
```

### Scenario 3: Get Extended Fault Data

```
Tester → ECU:  19 06 01 00 01    (Get extended data for DTC 0x010001)
ECU → Tester:  59 06 [Extended data bytes]
```

### Scenario 4: Read Mirror Memory After Clear

```
Tester → ECU:  19 0F         (Get mirror memory DTCs)
ECU → Tester:  59 0F [Mirror memory DTC list]
```

---

## 16. MESSAGE SEQUENCE EXAMPLES

### Example 1: Complete DTC Readout

```
1. Enter extended diagnostic session (SID 0x10, subfunc 0x03)
2. Get DTC count: 19 01 FF → 59 01 00 03 (3 DTCs)
3. Get DTC list: 19 02 FF → 59 02 [3 DTCs with status]
4. Get extended data for first DTC: 19 06 01 00 01 → 59 06 [Data]
5. Get snapshot: 19 04 01 00 01 → 59 04 [Snapshot]
```

### Example 2: After Service Clear

```
1. Clear DTCs (SID 0x14)
2. Read mirror memory: 19 0F → 59 0F [Previous DTCs from mirror]
3. Verify new count: 19 01 FF → 59 01 00 00 (0 DTCs)
```

---

## 17. IMPLEMENTATION CHECKLIST

### Core Requirements

- ✅ Subfunction validation (0x01-0x0F standard)
- ✅ Status mask validation (0x00-0xFF)
- ✅ Message format verification per subfunc
- ✅ DTC database access and retrieval
- ✅ Multi-frame response handling
- ✅ Proper response structure per subfunc
- ✅ NRC code generation
- ✅ Session support checking

### Data Management

- ✅ DTC storage (3-byte code + 1-byte status)
- ✅ Snapshot record storage
- ✅ Extended data record storage
- ✅ Mirror memory separate storage
- ✅ Status bit tracking
- ✅ Timestamp or occurrence tracking

### Response Handling

- ✅ Small response (single frame) - direct transmission
- ✅ Large response (multi-frame) - ISO-TP flow control
- ✅ Count responses (2-byte uint16)
- ✅ DTC list formatting
- ✅ Extended data transmission
- ✅ Error handling and NRC generation

---

## 18. QUICK REFERENCE VALUES

### Critical Hex Values

| Value | Meaning |
|-------|---------|
| 0x19 | Service ID: Read DTC Information |
| 0x59 | Positive Response SID (0x19 + 0x40) |
| 0x7F | Negative Response SID |
| 0x01 | Status mask: Test Failed only |
| 0x08 | Status mask: Pending DTCs only |
| 0x10 | Status mask: Confirmed DTCs only |
| 0xFF | Status mask: All DTCs (no filter) |

### Subfunc Quick Lookup

| Subfunc | Purpose | Mask Required |
|---------|---------|---------------|
| 0x01 | Count DTCs | YES |
| 0x02 | List DTCs | YES |
| 0x03 | By Severity | YES |
| 0x0A | Supported DTCs | NO |
| 0x0B | First Failed | NO |
| 0x0F | Mirror Memory | NO |

---

## 19. ISO STANDARD COMPLIANCE

### ISO 14229-1:2020 Requirements Met

- ✓ Service ID 0x19 for DTC reading
- ✓ 15 subfunctions (0x01-0x0F mandatory)
- ✓ Status byte structure and bits
- ✓ DTC code format (3 bytes)
- ✓ Status mask filtering
- ✓ Snapshot and extended data retrieval
- ✓ Mirror memory support
- ✓ Severity level classification
- ✓ Multi-frame response support
- ✓ Proper NRC codes
- ✓ ISO-TP transport compliance

---

## 20. COMPARISON WITH RELATED SERVICES

### SID 19 vs SID 14 (Clear DTC)

| Aspect | SID 19 (Read) | SID 14 (Clear) |
|--------|---|---|
| Purpose | Read DTC information | Clear DTC memory |
| Data Loss | No data loss | Permanent DTC loss |
| Mirror Memory | Can read mirror | Creates mirror copy |
| Session Support | Most sessions | Limited sessions |

### SID 19 vs SID 87 (Link Control)

| Aspect | SID 19 (DTC) | SID 87 (Link) |
|--------|---|---|
| Scope | Fault codes and data | Communication control |
| Data Retrieved | DTCs, snapshots, extended | N/A |
| Use | Diagnostics, debugging | Network optimization |

---

## 21. TESTING RECOMMENDATIONS

### Unit Tests

1. **Subfunction Validation**
   - Valid range (0x01-0x0F): Accept
   - Invalid range (0x00, 0x10-0x3F): Reject with NRC 0x12

2. **Status Mask Validation**
   - Valid mask (0x00-0xFF): Accept
   - Invalid mask (> 0xFF): Reject with NRC 0x31

3. **Response Formatting**
   - Count response: 2-byte uint16
   - DTC list: 3-byte code + 1-byte status per entry
   - Extended data: Correct byte sequencing

4. **Multi-frame Handling**
   - Large DTC list: Proper ISO-TP segmentation
   - Flow control: Correct handshake
   - Timeout handling

### Integration Tests

- DTC count accuracy
- DTC list completeness
- Status filtering correctness
- Extended data retrieval
- Mirror memory accuracy
- Concurrent clear/read operations
- Session support enforcement

---

## 22. REAL-WORLD DTC EXAMPLES

### Example 1: MAF Sensor Fault

```
DTC Code: 0x010101 (P0101)
Status: 0x10 (Confirmed)
Description: MAF Sensor Range/Performance
Snapshot: Speed, RPM, Load, Temperature
Action: Check sensor for carbon buildup
```

### Example 2: CAN Bus Error

```
DTC Code: 0x030101 (U0101)
Status: 0x08 (Pending)
Description: CAN Communication Bus Off-Line/Error
Snapshot: Last valid CAN message, error count
Action: Check CAN wiring and termination
```

### Example 3: ABS Sensor

```
DTC Code: 0x010045 (C0045)
Status: 0x01 (Current Failure)
Description: LH Front ABS Sensor Malfunction
Snapshot: Wheel speed, brake status
Action: Check sensor wiring, wheel bearing
```

---

## 23. REFERENCES

- ISO 14229-1:2020 - Unified Diagnostic Services (UDS)
- ISO 11898-1:2015 - CAN Protocol
- ISO 15765-2:2016 - ISO-TP Transport
- SAE J1979 - OBD Standard
- AUTOSAR Diagnostic Services Specification
- OEM-specific diagnostic documentation

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Scope**: Complete SID 19 data reference for UDS simulator implementation