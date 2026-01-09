# Test Data - UDS Service Test Cases

This directory contains JSON test case definitions for all UDS services, organized by Service ID (SID).

---

## 📂 Directory Structure

Each service has its own subdirectory containing:
- `SIDXX_TestCases.json` - Test case definitions
- `SIDXX_TestCases_report.json` - Test execution results (auto-generated)

---

## 🧪 Available Test Suites

| Service | SID | Directory | Test Cases |
|---------|-----|-----------|------------|
| Diagnostic Session Control | 0x10 | [sid-10/](./sid-10/) | Session switching, NRC validation |
| ECU Reset | 0x11 | [sid-11/](./sid-11/) | Reset types, state management |
| Clear DTC Information | 0x14 | [sid-14/](./sid-14/) | DTC clearing, group operations |
| Read DTC Information | 0x19 | [sid-19/](./sid-19/) | DTC reading, status bytes |
| Read Data By Identifier | 0x22 | [sid-22/](./sid-22/) | DID reading, multiple DIDs |
| Read Memory By Address | 0x23 | [sid-23/](./sid-23/) | Memory access, ALFID validation |
| Security Access | 0x27 | [sid-27/](./sid-27/) | Seed/key, authentication |
| Communication Control | 0x28 | [sid-28/](./sid-28/) | Communication state control |
| Read Data By Periodic ID | 0x2A | [sid-2a/](./sid-2a/) | Periodic data, transmission modes |
| Write Data By Identifier | 0x2E | [sid-2e/](./sid-2e/) | DID writing, validation |
| Routine Control | 0x31 | [sid-31/](./sid-31/) | Routine execution, results |
| Request Download | 0x34 | [sid-34/](./sid-34/) | Download initiation, ALFID |
| Request Upload | 0x35 | [sid-35/](./sid-35/) | Upload initiation, memory |
| Transfer Data | 0x36 | [sid-36/](./sid-36/) | Data transfer, sequencing |
| Request Transfer Exit | 0x37 | [sid-37/](./sid-37/) | Transfer completion |
| Write Memory By Address | 0x3D | [sid-3d/](./sid-3d/) | Memory writing, validation |
| Tester Present | 0x3E | [sid-3e/](./sid-3e/) | Keep-alive, session timeout |
| Access Timing Parameters | 0x83 | [sid-83/](./sid-83/) | Timing modification |
| Control DTC Setting | 0x85 | [sid-85/](./sid-85/) | DTC enable/disable |

---

## 📝 Test Case Format

Each test case follows this structure:

```json
{
  "testId": "TC-XX-01",
  "description": "Test description",
  "request": "10 01",
  "expectedResponse": "50 01 00 32 01 F4",
  "expectedNRC": null,
  "session": "DEFAULT",
  "securityLevel": 0
}
```

---

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific service tests
npm test -- --service=0x10

# Run with coverage
npm test -- --coverage
```

---

## 📊 Test Reports

Test execution results are stored in:
- **JSON Reports:** `SIDXX_TestCases_report.json` (in each service directory)
- **CSV Reports:** see `tests/reports/` directory
- **HTML Reports:** see `artifacts/reports/` directory

---

## 🔍 Related Documentation

- **Service Reference:** `docs/learning/services/`
- **Practical Guides:** `docs/learning/practical/`
- **Testing Guides:** `docs/guides/testing/`

---

**Last Updated:** 2026-01-06
