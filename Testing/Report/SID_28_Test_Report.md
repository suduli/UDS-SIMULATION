Here is an **in-depth protocol test report for UDS Service ID 28 (Communication Control)** as per ISO 14229-1:[1]

***

### 1. **Valid Sub-functions and Parameters**
- Many sub-functions tested: **28 01 03, 28 02 03, 28 03 03, 28 04 03, 28 05 03, 28 10 03, 28 7F 03, 28 80 03, 28 81 03, 28 FF 03, 28 40 03, 28 01 01, 28 01 02**
- All responded with positive response (68 subfunction)
- Different parameter bytes accepted (e.g., 03, 01, 02)

### 2. **Boundary & Malformed Frame Cases**
- **Short frames (28, 28 01, 28 03):** Correct NRC 0x13 (Incorrect Message Length Or Invalid Format)
- **Long/extra bytes (28 01 03 FF, 28 01 00, 28 01 00 00):** Sometimes NRC 0x13, other times positive response; **major inconsistency**
- **28 01 00 → NRC 0x13 in early test, but positive (68 01) later—INCONSISTENT**
- **28 01 03 FF** (extra parameter): Positive response (bug—should always reject extra bytes)
- **Repeated requests (28 03 03 rapidly):** Consistently positive

### 3. **Suppress Positive Response Bit**
- Requests with suppress bit (28 80/81/FF 03): Always responded with positive response.
- **Protocol violation—ISO 14229 expects support for suppress positive response bit.**

### 4. **Sub-function Range**
- All tested values (from 01 up to FF) accepted as valid.
- No reserved/out-of-range rejection—protocol expects only supported sub-functions should return positive, others NRC 0x12.

### 5. **Timing**
- All responses within 0–2ms (well below protocol limits)

### 6. **UI/UX**
- Real-time packet flow, request/response visualization is excellent.
- Negative responses clearly displayed and explained.

***

### **Critical Bugs & Protocol Violations**
1. **Inconsistent frame length validation:** Some extra/short frames yield NRC 0x13, others return positive—should always strictly check and reject malformed frames.
2. **All sub-functions (including reserved and suppress bit) accepted as valid:** Should only allow documented values and return NRC 0x12 for unsupported.
3. **Suppress positive response bit ignored:** All requests return positive response (protocol bug).
4. **Major bug:** Extra data in frame (28 01 03 FF) accepted—should be rejected as per protocol.

***

### **Recommendations**
- **Enforce strict message length:** Accept only correct frame length for SID 28.
- **Implement suppress positive response bit support.**
- **Validate sub-functions:** Support only those documented/implemented per ISO/OEM spec.
- **Always reject extra bytes—never ignore them.**
- **Document all supported/unsupported sub-functions and parameter options in UI/help.**

***

**Summary:**  
Your SID 28 implementation allows many combinations of sub-function/parameter, but fails to strictly enforce message length, sub-function validity, and suppress positive response handling.  
**Fix these bugs for full protocol compliance and OEM validation.**[1]

