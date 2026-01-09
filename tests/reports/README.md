# Test Reports

This directory contains test execution reports in CSV and JSON formats.

---

## 📊 Report Types

### CSV Reports
Human-readable test execution summaries
- Service-level pass/fail rates
- Test case results
- Performance metrics

### JSON Reports
Machine-readable detailed test results
- Full request/response data
- Execution timestamps
- Error details

---

## 📁 Available Reports

| Service | SID | CSV Report | Description |
|---------|-----|------------|-------------|
| Diagnostic Session Control | 0x10 | `SID_10_REPORT.csv` | Session switching tests |
| ECU Reset | 0x11 | `SID_11_REPORT.csv` | Reset operation tests |
| Read Data By Identifier | 0x22 | `SID_22_REPORT.csv` | DID reading tests |
| Read Data By Periodic ID | 0x2A | `SID_2A_Report.csv` | Periodic data tests |
| Request Download | 0x34 | `SID_34_REPORT.csv` | Download tests |
| Request Upload | 0x35 | `SID_35_REPORT.csv` | Upload tests |

---

## 📈 HTML Reports

For HTML format reports with visual charts and detailed analysis, see:
**`artifacts/reports/`**

---

## 🔍 Report Contents

Each CSV report contains:
- ✅ Test ID
- ✅ Test Description
- ✅ Status (Pass/Fail)
- ✅ Request Hex
- ✅ Expected Response
- ✅ Actual Response
- ✅ Execution Time
- ✅ Error Messages (if failed)

---

## 📝 Generating Reports

Reports are automatically generated when running tests:

```bash
# Run tests and generate reports
npm test

# Generate reports only
npm run test:report
```

---

## 🔗 Related Resources

- **Test Data:** `tests/test-data/sid-XX/`
- **HTML Reports:** `artifacts/reports/`
- **Testing Guides:** `docs/guides/testing/`

---

**Last Updated:** 2026-01-06
