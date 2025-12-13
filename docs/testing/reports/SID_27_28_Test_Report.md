Here is a **combined protocol test report for UDS SID 27 (Security Access) and SID 28 (Communication Control)** according to ISO 14229-1:[1]

***

### **Critical Bugs & Security Violations**

| Bug | Severity | Description | Evidence | Impact |
|-----|----------|-------------|----------|--------|
| **1** | **Critical** | SID 28 is **NOT protected** by Security Access. Communication Control requests succeed while Security Access is locked (before/unlocked/after lockout). | 28 03 01, 28 01 01, 28 02 01, 28 03 03, 28 01 03 all returned a positive response without SID 27 unlock | Major security vulnerability: attackers can change ECU comms with no authentication |
| **2** | **Critical** | SID 28 works **after Security Access lockout** (after 3 failed attempts / NRC 0x36) | Requests to SID 28 work while Security Access is locked out | Security bypass: even after lockout, comms control is possible |
| **3** | **High** | **Session changes do not reset Security Access attempt counter** | After changing diagnostic session (SID 10), lockout ($$3/3$$ attempts) persists for SID 27 | Permanent lockout unless ECU is reset; violates ISO |
| **4** | **Medium** | **Hex parser loses bytes with value 0x00** | "28 00 01" is parsed as "28 01" (NRC 0x13) not as a 3-byte message | Protocol errors and inability to test/control certain comm. types |

***

### **Verified Correct Behaviors:**
- Message length validation for SID 28—SID only ("28") returns NRC 0x13
- SID 27: Proper seed generated, invalid keys correctly return NRC 0x35, attempt counter enforced (NRC 0x36)
- Lockout applies *across all security access levels* (01, 03, 05)
- Diagnostic Session Control (SID 10) functions are correct
- UI shows lockout, attempts, session, and comms states accurately

***

### **ISO 14229-1 Violations**
- **SID 28 (Communication Control) must require successful security access (NRC 0x33 if locked)**
- **Session control should reset security attempt counter on session changes (SID 10)**
- **SID 28 should not process requests when lockout is active**

***

### **UI/UX Issues**
- Security/comms/session display accurate
- **No warning to user that SID 28 bypasses security requirement (potentially misleading)**

***

### **Recommendations**
1. **URGENT:** Enforce security access checks for all SID 28 requests before processing (block with NRC 0x33 if locked/lockout)
2. **HIGH:** Reset security access counter on session change (SID 10)
3. **MEDIUM:** Fix input parser for leading 0x00 bytes to enable all allowed command types
4. **LOW:** Add visible warnings in UI when a service is accessible without required security level

***

**Summary:**  
Currently, your simulator allows critical security bypasses in combined SID 27/28 flows. Attackers can control ECU communication without authentication, and lockout is ineffective against these attacks.  
**Immediate fixes are needed to enforce protocol security, proper state handling, and robust parsing.**[1]

