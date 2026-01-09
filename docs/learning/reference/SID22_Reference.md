# UDS SID 22 - Read Data By Identifier (RDBI)
## Complete Data Reference for Implementation

---

## 1. SERVICE OVERVIEW

| Property | Value |
|----------|-------|
| Service ID (Request) | 0x22 |
| Service ID (Positive Response) | 0x62 |
| Service Name | ReadDataByIdentifier (RDBI) |
| Purpose | Read one or more data records identified by Data Identifiers (DIDs) from an ECU |
| ISO Standard | ISO 14229-1 (UDS) |
| Has Subfunctions | No – service uses DID list only |
| Request Length | 3 bytes minimum (SID + first DID), then +2 bytes per additional DID |
| Response Length | 3 bytes minimum (SID + DID + at least 1 data byte), variable overall |
| Transport | ISO-TP, single or multi-frame depending on data size |

---

## 2. REQUEST MESSAGE FORMAT

### Byte Structure (Multiple DIDs Supported)

| Byte(s) | Field | Length | Range | Description |
|---------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x22 | ReadDataByIdentifier service identifier |
| 2–3 | DataIdentifier #1 | 2 | 0x0000–0xFFFF | First DID (high then low byte) |
| 4–5 | DataIdentifier #2 | 2 | 0x0000–0xFFFF | Second DID (optional) |
| 6–7 | DataIdentifier #3 | 2 | 0x0000–0xFFFF | Third DID (optional) |
| … | DataIdentifier #n | 2 each | 0x0000–0xFFFF | Further DIDs, same pattern (OEM may limit count) |

### General Rules

- **Total length ≥ 3 bytes** (at least one DID).
- Number of bytes after SID must be **even** (2 bytes per DID). If not → **NRC 0x13** (IncorrectMessageLengthOrInvalidFormat).[169][171]
- All DIDs are 2 bytes in classic ISO 14229 practice (newer revisions allow other lengths, but 2‑byte is overwhelmingly used).[169][172]
- Some servers limit the **maximum number of DIDs per request**; exceeding this can cause NRC 0x13 or 0x31 (OEM-specific behavior).[169]

### Example Requests

| Scenario | Request (Hex) | Description |
|----------|---------------|-------------|
| Read single DID (VIN) | 22 F1 90 | Request VIN (DID 0xF190)[169][172] |
| Read VIN + SW number | 22 F1 90 F1 8D | Request VIN and software part number |
| Read active session DID | 22 F1 86 | Request active diagnostic session (DID 0xF186)[169] |
| Invalid: odd bytes | 22 F1 90 F1 | Not multiple of 2 DID bytes → NRC 0x13[169] |

---

## 3. POSITIVE RESPONSE FORMAT

### Byte Structure

| Byte(s) | Field | Length | Range | Description |
|---------|-------|--------|-------|-------------|
| 1 | SID | 1 | 0x62 | Positive Response SID (0x22 + 0x40) |
| 2–3 | DataIdentifier #1 | 2 | 0x0000–0xFFFF | Echo of first DID |
| 4–(4 + o1 − 1) | dataRecord #1 | o1 | 0x00–0xFF | Data bytes for DID #1 |
| Next 2 | DataIdentifier #2 | 2 | 0x0000–0xFFFF | Echo of second DID (if requested) |
| Next o2 | dataRecord #2 | o2 | 0x00–0xFF | Data bytes for DID #2 |
| … | … | … | … | Repeated pattern per DID in original order |

Each DID is followed by its **complete data record**. Data length is defined in the ECU’s DID table, not in the protocol itself.[169]

### Example: Read Active Session (0xF186)

```text
Request:  22 F1 86
Response: 62 F1 86 02
```

- `0x62` – positive response SID[169]
- `F1 86` – DID (echo of 0xF186)
- `0x02` – data: active session (0x02 = Programming Session in this example)[169]

### Example: Read VIN (0xF190)

```text
Request:  22 F1 90
Response: 62 F1 90 57 56 31 23 45 67 89 01 23 45 67 89 01 23 45 67
```

- `F1 90` – VIN DID
- 17 ASCII bytes – VIN string (example)

---

## 4. NEGATIVE RESPONSE FORMAT

| Byte # | Field | Range | Description |
|--------|-------|-------|-------------|
| 1 | Response SID | 0x7F | Negative Response Indicator |
| 2 | Requested SID | 0x22 | Echo of failed service ID |
| 3 | NRC | See table below | Negative Response Code |

### Format

```text
7F 22 [NRC]
```

---

## 5. NEGATIVE RESPONSE CODES (NRC) FOR SID 22

| Code | Name | Description | Typical Cause |
|------|------|-------------|---------------|
| 0x11 | ServiceNotSupported | ECU does not implement SID 0x22 | Very simple ECUs without RDBI support |
| 0x13 | IncorrectMessageLengthOrInvalidFormat | Byte length is not 1 + 2·n or no DID present | Odd DID bytes, empty request[169][171] |
| 0x22 | ConditionsNotCorrect | Environment/state does not allow read | E.g. reading certain DIDs while engine running or during programming[20][174] |
| 0x31 | RequestOutOfRange | DID not supported or not readable in this context | Wrong DID value, blocked in this session[169][171] |
| 0x33 | SecurityAccessDenied | Required security level not active | DID protected by security (e.g. coding, keys)[20][174] |

Other generic NRCs like **0x21 (BusyRepeatRequest)** or **0x78 (ResponsePending)** may also be used if the server needs more time or is busy.[174]

---

## 6. DID CATEGORIES (GENERIC)

Exact DID assignments are **OEM and ECU specific**, but a common structure is:

| DID Range | Category | Standardized / OEM | Typical Data Length |
|----------|----------|--------------------|---------------------|
| 0x0000–0x0FFF | Low-level / supplier specific | ECU / supplier specific | 1–8 bytes |
| 0x1000–0x1FFF | Application internal data | OEM specific | 1–64 bytes |
| 0x2000–0x2FFF | Vehicle/customer specific | OEM specific | 1–64 bytes |
| 0xF180–0xF1FF | Informational / identification | ISO 14229 Annex examples + OEM | 1–32 bytes |
| 0xF190 | Vehicle Identification Number (VIN) | widely used | 17 bytes (ASCII)[169] |
| 0xF18C | ECU serial number (example) | OEM defined | 8–16 bytes |
| 0xF18D | ECU software / part number (example) | OEM defined | 8–16 bytes |
| 0xF186 | Active diagnostic session | ISO 14229 example | 1 byte (session ID)[169] |

---

## 7. COMMONLY USED STANDARD‑LIKE DIDs (EXAMPLES)

| DID | Name | Length | Description |
|-----|------|--------|-------------|
| 0xF190 | Vehicle Identification Number (VIN) | 17 | 17‑byte VIN, ASCII encoded[169] |
| 0xF18C | ECU Serial Number | 8 | Unique ECU hardware ID (length is OEM-specific) |
| 0xF18D | ECU Software Number / Part Number | 8 | SW identifier, part number or calibration ID |
| 0xF186 | Active Diagnostic Session | 1 | 0x01=Default, 0x02=Programming, 0x03=Extended (example)[169] |

These values are **examples** derived from typical implementations and ISO 14229 annex examples – always check the specific ECU’s DID list.

---

## 8. SESSION SUPPORT FOR RDBI

Access to DIDs is usually restricted by **session** and **security level**.

| DID Group | Default (0x01) | Programming (0x02) | Extended (0x03) | Safety (0x04) |
|-----------|----------------|--------------------|-----------------|---------------|
| Identity DIDs (e.g. VIN, ECU ID) | Yes | Yes | Yes | OEM dependent |
| Coding/configuration DIDs | OEM dependent | Yes | Yes | OEM dependent |
| Security-sensitive DIDs (keys, immobilizer) | No | OEM dependent | With security access | OEM dependent |
| Live measurement DIDs | Often Yes | Yes | Yes | OEM dependent |

If a DID is requested in a session where it is not allowed, servers typically respond with **NRC 0x31 (RequestOutOfRange)** or sometimes 0x7E/0x7F depending on configuration.[169][171]

---

## 9. ISO‑TP FRAMING FOR SID 22

### Single‑Frame Requests

Most SID 0x22 requests are small and use **single frames**:

| Scenario | PCI | Data | Description |
|----------|-----|------|-------------|
| Single DID | 0x03 | 22 F1 90 | Length=3 (SID+2 bytes DID) → Single Frame[169] |
| Two DIDs | 0x05 | 22 F1 90 F1 8D | Length=5 → Single Frame (if ≤7) |

### Positive Response – Single vs Multi‑Frame

- If total response (SID + DIDs + data) ≤ 7 bytes → Single Frame.
- Longer responses (e.g. VIN + several DIDs) → First Frame + Consecutive Frames with flow control.[169][170]

Example (high‑level):

```text
Request:  22 F1 90
Response: 62 F1 90 [long VIN data …]
  → If length > 7, ECU sends First Frame (0x10 xx), tester replies FlowControl, ECU continues with CF frames.
```

---

## 10. TYPICAL USAGE SCENARIOS

### Scenario 1 – Read VIN

```text
Tester → ECU: 22 F1 90
ECU    → Tester: 62 F1 90 [17-byte VIN]
```

Used in **diagnostic tools**, OBD readers, and telematics to identify the vehicle.[168][169]

### Scenario 2 – Read VIN and SW Number Together

```text
Tester → ECU: 22 F1 90 F1 8D
ECU    → Tester: 62 F1 90 [VIN] F1 8D [SW number]
```

Single response carries multiple DIDs in the same order as requested.[169]

### Scenario 3 – Invalid Length

```text
Tester → ECU: 22 F1 90 F1
ECU    → Tester: 7F 22 13
```

- After SID (0x22) only **3 bytes** follow, not a multiple of 2 → **NRC 0x13**.[169]

### Scenario 4 – Unsupported DID

```text
Tester → ECU: 22 12 34
ECU    → Tester: 7F 22 31
```

DID 0x1234 is not implemented → **NRC 0x31 RequestOutOfRange**.[169][171]

### Scenario 5 – Security‑Protected DID

```text
Tester → ECU: 22 F1 8C
ECU    → Tester: 7F 22 33
```

DID 0xF18C (e.g. serial number or configuration) requires security; no access yet → **NRC 0x33**.[20][174]

---

## 11. IMPLEMENTATION CHECKLIST

| Item | Status | Notes |
|------|--------|-------|
| Validate total length ≥ 3 bytes | ✅ | At least SID + 1 DID |
| Validate `(len - 1)` is even | ✅ | 2 bytes per DID; else NRC 0x13[169] |
| Validate at least one DID present | ✅ | Empty DID list is invalid |
| Look up each DID in DID table | ✅ | Unknown → NRC 0x31[169] |
| Check session access for each DID | ✅ | Block by configuration/session when required |
| Check security access (SID 0x27) for protected DIDs | ✅ | If locked → NRC 0x33[20][174] |
| Check environmental conditions (if DID requires) | ✅ | Use NRC 0x22 where appropriate[20] |
| Build response in same DID order as request | ✅ | Required by ISO 14229[169] |
| Use correct data length per DID | ✅ | From static DID table |
| Handle ISO‑TP multi-frame for long responses | ✅ | VIN, many DIDs, or long records[169][170] |

---

## 12. DID META‑INFORMATION (FOR ECU CONFIG)

Each DID entry in ECU configuration typically contains:

| Attribute | Description |
|-----------|-------------|
| DID | 2‑byte identifier, unique within ECU |
| Data Length | Fixed or variable, in bytes |
| Endianness | Big/little‑endian numeric layout for multi‑byte values |
| Encoding | Raw, ASCII, BCD, bitfield, etc. |
| Access Type | ReadOnly or Read/Write (if also via SID 0x2E) |
| Allowed Sessions | Which sessions (default, extended, programming) permit read |
| Required Security | Which security levels (if any) are required for read |

This table is **implementation‑defined** and is the backbone for RDBI and WDBI (0x2E) behavior.

---

## 13. COMPARISON WITH SID 2E (WriteDataByIdentifier)

| Aspect | SID 0x22 – ReadDataByIdentifier | SID 0x2E – WriteDataByIdentifier |
|--------|----------------------------------|----------------------------------|
| Purpose | Read DID data | Write DID data |
| Direction | Server → Client | Client → Server |
| Risk | No persistent change | Can change coding/calibration |
| Usage sequence | Often after 0x10 (session), used anytime | Often followed by 0x22 to verify |
| Typical protection | Medium – many DIDs readable | High – many writable DIDs protected |

Common pattern: **Write with 0x2E**, then **verify with 0x22** for the same DID.

---

## 14. QUICK REFERENCE

### Key Values

| Value | Meaning |
|-------|---------|
| 0x22 | ReadDataByIdentifier request SID |
| 0x62 | Positive response SID |
| 0x7F | Negative response SID |
| 0xF190 | Common VIN DID in many OEMs[169] |
| 0xF186 | Active diagnostic session DID (ISO example)[169] |
| 0x13 | NRC: IncorrectMessageLengthOrInvalidFormat[169] |
| 0x31 | NRC: RequestOutOfRange[169][171] |
| 0x33 | NRC: SecurityAccessDenied[20][174] |

### Recommended Tester Flow

1. Enter suitable session (e.g. 0x10 03 for extended).
2. Perform security access (0x27) if protected DIDs are needed.
3. Send 0x22 request with desired DIDs.
4. Decode 0x62 response, mapping each DID to its data.
5. For large blocks, ensure ISO‑TP handling is correct.

---

## 15. REFERENCES

- ISO 14229‑1 – Unified Diagnostic Services (UDS)[21]
- Read Data by Identifier service tutorials and examples[168][169][171]
- UDS NRC definitions and usage[20][174]
- ISO‑TP / data transmission behavior in UDS[170]

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Scope**: Complete SID 22 data reference for UDS simulator implementation
