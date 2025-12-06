# UDS SID 14 - Clear Diagnostic Information
## Complete Data Reference for Implementation

---

## 1. SERVICE OVERVIEW

| Property | Value |
|----------|-------|
| Service ID (Request) | 0x14 |
| Service ID (Response) | 0x54 |
| Service Name | ClearDiagnosticInformation |
| Purpose | Clear Diagnostic Trouble Codes (DTCs) and related data from ECU primary error memory |
| ISO Standard | ISO 14229-1:2020 |
| Has Subfunctions | No – uses 3-byte **groupOfDTC** parameter |
| Request Length | 4 bytes (SID + 3 bytes groupOfDTC) |
| Response Length | 1 byte (0x54) |
| Affects Mirror Memory | No (mirror memory is not cleared) |

---

## 2. REQUEST MESSAGE FORMAT

### Byte Structure

| Byte # | Field | Length | Range | Description |
|--------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x14 | Clear Diagnostic Information Service ID |
| 2 | groupOfDTC_High | 1 | 0x00–0xFF | High byte of DTC group mask |
| 3 | groupOfDTC_Middle | 1 | 0x00–0xFF | Middle byte of DTC group mask |
| 4 | groupOfDTC_Low | 1 | 0x00–0xFF | Low byte of DTC group mask |

### General Rules

- **Message length must be exactly 4 bytes**.
- Request shorter or longer than 4 bytes → **NRC 0x13 (IncorrectMessageLengthOrInvalidFormat)**.[136]
- **groupOfDTC** is a 24‑bit mask selecting either:
  - All DTCs
  - A group/class of DTCs
  - A single specific DTC (mask equals DTC number)
- Actual interpretation of most mask values is **OEM-specific** – only a few have widely adopted semantics.[143][145]

### Example Requests

| Scenario | Request (Hex) | Description |
|----------|---------------|-------------|
| Clear **all** DTCs | 14 FF FF FF | Clear all DTCs in ECU memory (0xFFFFFF) – widely used convention[143][145][148] |
| Clear emission-related DTCs (example) | 14 FF FF 33 | Clear emission-related DTC group (OEM convention)[136] |
| Clear a specific DTC (example) | 14 01 01 01 | Clear only DTC 0x010101 (OEM convention) |

---

## 3. POSITIVE RESPONSE FORMAT

### Byte Structure

| Byte # | Field | Length | Value | Description |
|--------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x54 | Positive Response SID (0x14 + 0x40) |

### Semantics

- No additional data in the positive response.
- **0x54 means:**
  - Request format was valid
  - Server accepted the clear request
  - Requested DTCs and related data have been cleared (or there were no matching DTCs to clear)
- Many OEMs require the erase operation in NVM to be **completed before** 0x54 is sent.

### Examples

| Scenario | Request | Response |
|----------|---------|----------|
| Clear all DTCs | 14 FF FF FF | 54 |
| Clear emission group | 14 FF FF 33 | 54[136] |

---

## 4. NEGATIVE RESPONSE FORMAT

| Byte # | Field | Range | Description |
|--------|-------|-------|-------------|
| 1 | Response SID | 0x7F | Negative Response Indicator |
| 2 | Requested SID | 0x14 | Echo of failed service ID |
| 3 | NRC | See Table 5 | Negative Response Code |

### Format

```text
7F 14 [NRC]
```

---

## 5. NEGATIVE RESPONSE CODES (NRC)

| Code | Name | Description | Typical Cause |
|------|------|-------------|---------------|
| 0x11 | ServiceNotSupported | ECU does not implement SID 0x14 | Simple ECUs without DTC memory |
| 0x13 | IncorrectMessageLengthOrInvalidFormat | Message length ≠ 4 bytes | Missing or extra groupOfDTC bytes[136] |
| 0x22 | ConditionsNotCorrect | Environmental/operational conditions do not allow clear | Vehicle moving, engine running, flashing ongoing[136][148] |
| 0x31 | RequestOutOfRange | groupOfDTC value not supported | Mask not defined in ECU configuration[136] |
| 0x33 | SecurityAccessDenied | Required security level not unlocked | Clear DTCs protected by SID 0x27 security[45][148] |

---

## 6. groupOfDTC PARAMETER

### General Definition

- **groupOfDTC** is a 24‑bit value: 
  
  \[
  groupOfDTC = \text{HighByte} \ll 16 + \text{MiddleByte} \ll 8 + \text{LowByte}
  \]

- It selects **which DTCs to clear**:
  - Complete memory
  - Functional groups (powertrain, chassis, body, network, emissions)
  - Single DTC

### Commonly Used Values

| groupOfDTC | Type | Description | Notes |
|-----------|------|-------------|-------|
| 0xFFFFFF | Standard convention | Clear **all** DTCs in ECU memory | Widely used in stacks and tools[143][144][145][148] |
| 0xFF FF 33 | OEM-specific | Clear emissions‑related DTCs only | Example from implementations[136] |
| 0x01 00 00 | OEM-specific | Powertrain group | Depends on OEM mapping |
| 0x02 00 00 | OEM-specific | Chassis group | Depends on OEM mapping |
| 0x04 00 00 | OEM-specific | Body/comfort group | Depends on OEM mapping |
| 0x08 00 00 | OEM-specific | Network/communication group | Depends on OEM mapping |
| Exact 3‑byte DTC | ECU-specific | Clear that single DTC only | Mask == DTC number |

**Important:** Except for 0xFFFFFF, all mappings are **OEM‑defined**. Always refer to the ECU’s DTC specification.[143][145]

---

## 7. EFFECT ON DIAGNOSTIC DATA

### Data Elements Affected by Successful SID 0x14

| Data Type | Cleared? | Notes |
|-----------|---------|-------|
| DTC status byte | **Yes** | TF, P, C, etc. bits reset for matching DTCs[139] |
| DTC entry | **Yes** | DTC removed from primary error memory |
| Snapshot records | **Yes** | Freeze‑frame style snapshots erased for cleared DTCs[139] |
| Extended data records | **Yes** | OBD extended data (e.g. 0x90–0xEF) cleared for matching DTCs[139] |
| First/most recent failed DTC info | **Yes** | Cleared when relevant DTCs are cleared[139] |
| First/most recent confirmed DTC info | **Yes** | Cleared when relevant DTCs are cleared[139] |
| Fault detection counters | Typically **Yes** | Implementation‑dependent, usually reset with DTC |
| Mirror memory | **No** | ClearDiagnosticInformation does **not** clear mirror memory[140] |

**Mirror memory** provides a persistent record of DTCs even after ClearDiagnosticInformation and is accessed via **SID 0x19 subfunction 0x0F**.[140]

---

## 8. CONDITIONS AND PREREQUISITES

### Typical Conditions for Allowing Clear

| Condition | Reason | Typical NRC on Violation |
|-----------|--------|--------------------------|
| Vehicle speed = 0 | Safety and legal reasons | 0x22 (ConditionsNotCorrect) |
| Engine stopped | Avoid clearing while engine running | 0x22 |
| No active programming/flashing | Avoid interfering with NVM programming | 0x22[136] |
| Supply voltage in valid range | Avoid NVM corruption | 0x22 |
| Security level satisfied | Protect sensitive DTCs (e.g. safety, immobilizer) | 0x33 (SecurityAccessDenied)[45][148] |
| Safety state non‑critical | Preserve evidence in crash/safety cases | 0x22 |

Conditions are **OEM / vehicle specific** but follow these general patterns.

---

## 9. SESSION SUPPORT

| Session | Clear All DTCs (0xFFFFFF) | Clear Group (mask) | Clear Single DTC | Notes |
|---------|---------------------------|--------------------|------------------|-------|
| Default (0x01) | Yes (often with security) | Yes | Yes | Typical for basic service tools |
| Programming (0x02) | Yes (OEM‑dependent) | Yes | Yes | Used after flashing or coding[147] |
| Extended (0x03) | Yes | Yes | Yes | Commonly used in diagnostics |
| Safety (0x04) | Usually No | OEM‑dependent | OEM‑dependent | Often blocked to preserve safety evidence |

---

## 10. ISO‑TP FRAMING

ClearDiagnosticInformation is compact and **normally uses a single‑frame ISO‑TP message**.

### Single‑Frame Examples

| Scenario | PCI | Payload | Description |
|----------|-----|---------|-------------|
| Clear all DTCs | 0x04 | 14 FF FF FF | 4 data bytes: SID + groupOfDTC (all)[136][148] |
| Clear emission group | 0x04 | 14 FF FF 33 | SID + emission‑related group[136] |

### Negative Response Example

| Scenario | Payload | Description |
|----------|---------|-------------|
| Invalid length | 7F 14 13 | NRC 0x13 IncorrectMessageLengthOrInvalidFormat[136] |

No multi‑frame handling is normally required for SID 0x14.

---

## 11. TYPICAL USAGE SCENARIOS

### Scenario 1 – Post‑Repair Clear of All DTCs

```text
Tester → ECU: 14 FF FF FF    (clear all DTCs)
ECU    → Tester: 54          (all matching DTCs cleared)
Tester → ECU: 19 01 FF       (read DTC count)
ECU    → Tester: 59 01 00 00 (0 DTCs stored)
```

### Scenario 2 – End‑of‑Line (EOL) Reset

```text
1. Run hardware and functional tests → multiple DTCs stored
2. Clear all:     14 FF FF FF → 54
3. Verification:  19 02 FF    → 59 02 (no DTCs)
4. Vehicle handed over with clean memory
```

### Scenario 3 – Component‑Level Testing

```text
1. Induce fault in specific component → DTC 0x010101 set
2. Clear only that DTC (OEM mapping): 14 01 01 01 → 54
3. Re‑test component; verify DTC behavior again
```

### Scenario 4 – Emission‑Only DTC Clear (Example)

```text
Tester → ECU: 14 FF FF 33   (clear emission group – OEM specific)
ECU    → Tester: 54
Tester → ECU: 19 02 FF      (read all DTCs)
ECU    → Tester: 59 02 [non‑emission DTCs only]
```

---

## 12. IMPLEMENTATION CHECKLIST

| Item | Status | Notes |
|------|--------|-------|
| Validate message length == 4 bytes | ✅ | If not, send NRC 0x13 |
| Validate groupOfDTC range (0x000000–0xFFFFFF) | ✅ | If unsupported, send NRC 0x31[136] |
| Check session permissions | ✅ | Block in safety session if required |
| Enforce security access policy | ✅ | Use SID 0x27, return 0x33 if locked[45][148] |
| Check operating conditions (speed, engine, voltage, flashing) | ✅ | Return 0x22 if not correct[136] |
| Perform erase safely in NVM | ✅ | Handle power‑loss, wear‑leveling |
| Update RAM DTC structures | ✅ | Ensure reads after clear see updated state |
| Clear snapshot and extended data with DTC | ✅ | Maintain consistency with SID 0x19[139] |
| Do not clear mirror memory | ✅ | Must remain for post‑clear diagnostics[140] |
| Send 0x54 only after erase completed | ✅ | Avoid reporting success prematurely |

---

## 13. ERROR HANDLING FLOW

```text
1. Check: Is SID 0x14 supported?
   ├─ NO  → 7F 14 11  (ServiceNotSupported)
   └─ YES → Step 2

2. Check: Is message length == 4 bytes?
   ├─ NO  → 7F 14 13  (IncorrectMessageLengthOrInvalidFormat)
   └─ YES → Step 3

3. Check: Is groupOfDTC supported?
   ├─ NO  → 7F 14 31  (RequestOutOfRange)
   └─ YES → Step 4

4. Check: Session, security, and environmental conditions OK?
   ├─ NO  → 7F 14 22 or 7F 14 33 (ConditionsNotCorrect / SecurityAccessDenied)
   └─ YES → Step 5

5. Perform erase in NVM and update RAM structures
   ├─ Erase failed → 7F 14 72 (optional OEM usage)
   └─ Erase success → 54 (positive response)
```

---

## 14. COMPARISON WITH SID 19 (ReadDTCInformation)

| Aspect | SID 14 – ClearDiagnosticInformation | SID 19 – ReadDTCInformation |
|--------|-------------------------------------|-----------------------------|
| Purpose | Clear DTCs and associated data | Read DTCs and associated data |
| Data flow | Client → Erase request → Server | Client ↔ Query / response |
| Data loss risk | **Yes** – primary memory cleared | **No** – read‑only |
| Mirror memory | Not cleared | Can be read via 0x0F[140] |
| Typical sequence | 19 (read) → 14 (clear) → 19 (verify) | 19 only |
| Safety / legal sensitivity | High | Medium |

---

## 15. TEST CASES (EXAMPLES)

| Test Case | Request | Expected Response |
|-----------|---------|-------------------|
| Valid clear all | 14 FF FF FF | 54 |
| Invalid length | 14 FF FF (only 3 bytes) | 7F 14 13 |
| Flashing active | 14 FF FF FF | 7F 14 22 |
| Unsupported groupOfDTC | 14 12 34 56 | 7F 14 31 |
| Security required but locked | 14 FF FF FF | 7F 14 33 |

---

## 16. SAFETY AND LOGGING CONSIDERATIONS

- **Legal / regulatory**:
  - Some regions restrict clearing certain DTCs (e.g. emissions, safety) without conditions.
  - Workshops may be required to document clears for inspection.
- **Warranty / traceability**:
  - OEMs often log each ClearDiagnosticInformation event for later analysis.
- **Crash / safety DTCs**:
  - Airbag or crash‑related DTCs may be protected or only clearable with special tools.
- **Mirror memory**:
  - Retains pre‑clear diagnostics, especially for safety and legal analyses.[140]
- **Tester behavior**:
  - Always **read and store DTCs (SID 19)** before issuing SID 14.

---

## 17. QUICK REFERENCE

### Key Values

| Value | Meaning |
|-------|---------|
| 0x14 | ClearDiagnosticInformation request SID |
| 0x54 | Positive response SID |
| 0x7F | Negative response SID |
| 0xFFFFFF | Clear all DTCs in ECU memory[143][145][148] |
| 0x13 | NRC: IncorrectMessageLengthOrInvalidFormat[136] |
| 0x22 | NRC: ConditionsNotCorrect[136] |
| 0x31 | NRC: RequestOutOfRange[136] |
| 0x33 | NRC: SecurityAccessDenied[45][148] |

### Recommended Usage Pattern

1. **Read** current DTCs: SID 0x19 (various subfunctions)
2. **Log** or store DTCs and extended data
3. **Clear** with SID 0x14 (e.g. 14 FF FF FF)
4. **Verify** with SID 0x19 (no remaining DTCs or only expected ones)

---

## 18. REFERENCES

- ISO 14229‑1:2020 – Unified Diagnostic Services (UDS)
- ISO 15765‑2 – ISO‑TP Transport Protocol
- Autosar Diagnostics Specification[17]
- piEmbSysTech – Clear Diagnostic Information (0x14) service article[136]
- NI / third‑party UDS tool documentation for groupOfDTC 0xFFFFFF semantics[143][145][144]
- Mirror memory and interaction with ClearDiagnosticInformation[140]

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Scope**: Complete SID 14 data reference for UDS simulator implementation
