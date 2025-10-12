# SID 0x19 - Service Interactions Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.7

---

## 📋 Table of Contents

1. [Service Dependency Pyramid](#service-dependency-pyramid)
2. [Session Requirements Matrix](#session-requirements-matrix)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Pyramid

### Hierarchical Service Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│           SID 0x19 DEPENDENCY PYRAMID                        │
└──────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │  SID 0x19   │
                    │  Read DTC   │
                    │ Information │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  SID 0x10    │   │  SID 0x27    │   │  SID 0x3E    │
│  Session     │   │  Security    │   │  Tester      │
│  Control     │   │  Access      │   │  Present     │
│  (Required)  │   │  (Optional)  │   │  (Optional)  │
└──────────────┘   └──────────────┘   └──────────────┘

RELATED SERVICES (Peer Level):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  SID 0x14    │  SID 0x85    │  SID 0x22    │  SID 0x04    │
│  Clear DTC   │  Control DTC │  Read Data   │  Read        │
│              │  Setting     │  by ID       │  Scaling     │
└──────────────┴──────────────┴──────────────┴──────────────┘

DEPENDENCY EXPLANATION:
• SID 0x10: Must establish session before reading DTCs
• SID 0x27: May be required for protected/manufacturer DTCs
• SID 0x3E: Keeps session alive during long DTC operations
• SID 0x14: Clears DTCs that SID 0x19 reads
• SID 0x85: Controls whether new DTCs are stored
• SID 0x22: Reads current data (compare with snapshot)
• SID 0x04: Provides scaling for snapshot data values
```

---

## Session Requirements Matrix

### Subfunction Session Requirements

```
┌──────────────────────────────────────────────────────────────┐
│        SESSION REQUIREMENTS BY SUBFUNCTION                   │
├────────┬──────────────────────────────────┬─────────────────┤
│ SubFunc│ Description                      │ Session Required│
├────────┼──────────────────────────────────┼─────────────────┤
│ 0x01   │ reportNumberOfDTCByStatusMask    │ DEFAULT ✓       │
│ 0x02   │ reportDTCByStatusMask            │ DEFAULT ✓       │
│ 0x03   │ reportDTCSnapshotIdentification  │ DEFAULT ✓       │
│ 0x04   │ reportDTCSnapshotRecordByDTC     │ DEFAULT ✓       │
│ 0x05   │ reportDTCStoredDataByRecNum      │ DEFAULT ✓       │
│ 0x06   │ reportDTCExtDataRecordByDTC      │ DEFAULT ✓       │
│ 0x07   │ reportNumberOfDTCBySeverity      │ DEFAULT ✓       │
│ 0x08   │ reportDTCBySeverityMaskRecord    │ DEFAULT ✓       │
│ 0x09   │ reportSeverityInformationOfDTC   │ DEFAULT ✓       │
│ 0x0A   │ reportSupportedDTC               │ DEFAULT ✓       │
│ 0x0B   │ reportFirstTestFailedDTC         │ DEFAULT ✓       │
│ 0x0C   │ reportFirstConfirmedDTC          │ DEFAULT ✓       │
│ 0x0D   │ reportMostRecentTestFailedDTC    │ DEFAULT ✓       │
│ 0x0E   │ reportMostRecentConfirmedDTC     │ DEFAULT ✓       │
├────────┼──────────────────────────────────┼─────────────────┤
│ 0x0F   │ reportMirrorMemoryDTCByStatus    │ EXTENDED        │
│ 0x10   │ reportMirrorMemDTCExtDataByDTC   │ EXTENDED        │
│ 0x11   │ reportNumberOfMirrorMemDTC       │ EXTENDED        │
│ 0x12   │ reportNumberOfEmissionsOBDDTC    │ DEFAULT ✓       │
│ 0x13   │ reportEmissionsOBDDTCByStatus    │ DEFAULT ✓       │
│ 0x14   │ reportDTCFaultDetectionCounter   │ DEFAULT ✓       │
│ 0x15   │ reportDTCWithPermanentStatus     │ DEFAULT ✓       │
│ 0x16   │ reportDTCExtDataRecordByRecNum   │ DEFAULT ✓       │
│ 0x17   │ reportUserDefMemoryDTCByStatus   │ EXTENDED        │
│ 0x18   │ reportUserDefMemDTCSnapshotByDTC │ EXTENDED        │
│ 0x19   │ reportUserDefMemDTCExtDataByDTC  │ EXTENDED        │
├────────┼──────────────────────────────────┼─────────────────┤
│ 0x42   │ reportWWH-OBD DTCByMaskRecord    │ DEFAULT ✓       │
│ 0x55   │ reportWWH-OBD DTCWithPermanent   │ DEFAULT ✓       │
└────────┴──────────────────────────────────┴─────────────────┘

NOTES:
✓ = Works in DEFAULT session (0x01)
EXTENDED = Requires EXTENDED session (0x03)
Some ECUs may have different requirements - check documentation
```

### Security Access Requirements

```
┌──────────────────────────────────────────────────────────────┐
│           SECURITY ACCESS MATRIX                             │
├──────────────────────────┬───────────────────────────────────┤
│ DTC Type                 │ Security Required?                │
├──────────────────────────┼───────────────────────────────────┤
│ P-codes (Powertrain)     │ Usually NO 🔓                     │
│ C-codes (Chassis)        │ Sometimes (manufacturer-specific) │
│ B-codes (Body)           │ Sometimes (manufacturer-specific) │
│ U-codes (Network)        │ Sometimes (manufacturer-specific) │
│ Extended Data (All)      │ Sometimes (check ECU docs)        │
│ Snapshot Data (All)      │ Usually NO 🔓                     │
│ Mirror Memory (0x0F-0x11)│ Often YES 🔒                      │
│ User-Defined (0x17-0x19) │ Often YES 🔒                      │
└──────────────────────────┴───────────────────────────────────┘

🔓 = Public access (no security needed)
🔒 = Security access required (SID 0x27)
```

---

## Complete Workflow Examples

### Workflow 1: Basic Diagnostic Scan

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: Standard Diagnostic Scan                        │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Connect & Establish Session  │
    │────────────────────────────────>│ [DEFAULT Session Active]
    │                                │
    │ ② Count DTCs                   │
    │  19 01 FF                      │
    │────────────────────────────────>│
    │                                │
    │  59 01 19 01 00 03             │ (3 DTCs found)
    │<────────────────────────────────│
    │                                │
    │ ③ Read DTC Details             │
    │  19 02 08                      │ (Confirmed DTCs only)
    │────────────────────────────────>│
    │                                │
    │  59 02 19 P0135 08             │
    │         P0420 09               │
    │         C1234 08               │
    │<────────────────────────────────│
    │                                │
    │ ④ Read Snapshot for P0420      │
    │  19 04 P0 04 20 01             │
    │────────────────────────────────>│
    │                                │
    │  59 04 P0 04 20 09 01          │
    │  [RPM:1500][Speed:45][Temp:85] │
    │<────────────────────────────────│
    │                                │
    │ ⚙ [Technician analyzes data]   │
    │                                │
    
Result: Identified 3 DTCs with freeze frame data
Action: Proceed to repair based on diagnostic codes
```

### Workflow 2: DTC Investigation with Extended Data

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: Deep DTC Analysis                               │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Read Specific DTC            │
    │  19 02 08                      │ (Confirmed DTCs)
    │────────────────────────────────>│
    │  59 02 19 P0420 09             │ (Status: Active + Confirmed)
    │<────────────────────────────────│
    │                                │
    │ ② Get Extended Data            │
    │  19 06 P0 04 20 FF             │ (All extended records)
    │────────────────────────────────>│
    │                                │
    │  59 06 P0 04 20 09             │
    │  [Rec 01: Occurrence=18]       │
    │  [Rec 02: Aging=0]             │
    │  [Rec 50: MfrData...]          │
    │<────────────────────────────────│
    │                                │
    │ ③ Compare with Live Data       │
    │  22 01 0D                      │ (SID 0x22: Read vehicle speed)
    │────────────────────────────────>│
    │  62 01 0D 00                   │ (Speed: 0 km/h - stationary)
    │<────────────────────────────────│
    │                                │
    │ ④ Check Fault Detection        │
    │  19 14                         │ (Fault detection counters)
    │────────────────────────────────>│
    │  59 14 [DTC][Counter:-45]      │ (Fault strongly present)
    │<────────────────────────────────│
    │                                │

Analysis:
• DTC P0420 occurred 18 times (persistent issue)
• Currently active (status 0x09)
• Fault detection counter shows strong failure
• Requires component replacement
```

### Workflow 3: Clear DTCs and Verify

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 3: Clear DTCs After Repair                         │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Verify DTCs Before Clear     │
    │  19 01 FF                      │
    │────────────────────────────────>│
    │  59 01 19 01 00 03             │ (3 DTCs present)
    │<────────────────────────────────│
    │                                │
    │ ② Clear All DTCs (SID 0x14)    │
    │  14 FF FF FF                   │
    │────────────────────────────────>│
    │  54                            │ ✓ Clear successful
    │<────────────────────────────────│
    │                                │
    │ ③ Verify Clear Succeeded       │
    │  19 01 FF                      │
    │────────────────────────────────>│
    │  59 01 19 01 00 00             │ (0 DTCs) ✓
    │<────────────────────────────────│
    │                                │
    │ ④ Confirm No DTCs in Memory    │
    │  19 02 FF                      │
    │────────────────────────────────>│
    │  59 02 19                      │ (No DTC data) ✓
    │<────────────────────────────────│
    │                                │
    │ ⚙ [Perform Test Drive]         │
    │                                │
    │ ⑤ Re-check After Test          │
    │  19 02 FF                      │
    │────────────────────────────────>│
    │  59 02 19                      │ (Still no DTCs) ✓
    │<────────────────────────────────│
    │                                │

Result: DTCs cleared and verified absent after test drive
```

### Workflow 4: Protected DTC Access with Security

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 4: Read Protected Manufacturer DTCs                │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Switch to Extended Session   │
    │  10 03                         │
    │────────────────────────────────>│
    │  50 03 00 32 01 F4             │ ✓ Extended session active
    │<────────────────────────────────│
    │                                │
    │ ② Try Reading Protected DTC    │
    │  19 06 C1 23 45 FF             │ (Manufacturer-specific)
    │────────────────────────────────>│
    │  7F 19 33                      │ ❌ Security Access Denied
    │<────────────────────────────────│
    │                                │
    │ ③ Request Seed (SID 0x27)      │
    │  27 01                         │
    │────────────────────────────────>│
    │  67 01 AB CD EF 12             │ (Seed provided)
    │<────────────────────────────────│
    │                                │
    │ ④ Calculate Key and Send       │
    │  27 02 [KEY]                   │
    │────────────────────────────────>│
    │  67 02                         │ ✓ Security unlocked 🔓
    │<────────────────────────────────│
    │                                │
    │ ⑤ Retry Reading Protected DTC  │
    │  19 06 C1 23 45 FF             │
    │────────────────────────────────>│
    │  59 06 C1 23 45 08             │ ✓ Success - data returned
    │  [Extended Data Records...]    │
    │<────────────────────────────────│
    │                                │

Note: Security unlocked state persists for session duration
```

### Workflow 5: DTC Monitoring During Testing

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 5: Monitor DTCs During Component Testing           │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Disable DTC Setting          │
    │  85 02                         │ (SID 0x85: DTC Off)
    │────────────────────────────────>│
    │  C5 02                         │ ✓ DTC setting disabled
    │<────────────────────────────────│
    │                                │
    │ ⚙ [Perform component tests]    │
    │   [Intentional fault injection]│
    │                                │
    │ ② Verify No New DTCs Stored    │
    │  19 01 FF                      │
    │────────────────────────────────>│
    │  59 01 19 01 00 00             │ (Still 0 DTCs) ✓
    │<────────────────────────────────│
    │                                │
    │ ③ Re-enable DTC Setting        │
    │  85 01                         │ (SID 0x85: DTC On)
    │────────────────────────────────>│
    │  C5 01                         │ ✓ DTC setting enabled
    │<────────────────────────────────│
    │                                │
    │ ④ Normal Operation Resumes     │
    │  [DTCs will now be stored]     │
    │                                │
    │ ⑤ Monitor for New DTCs         │
    │  19 02 FF                      │
    │────────────────────────────────>│
    │  59 02 19                      │ (No DTCs stored during test)
    │<────────────────────────────────│
    │                                │

Use Case: Testing components without generating false DTCs
```

### Workflow 6: Session Timeout Handling

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 6: Keep Session Alive During Long DTC Read         │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Enter Extended Session       │
    │  10 03                         │
    │────────────────────────────────>│
    │  50 03 00 32 01 F4             │ (Timeout: 5000ms)
    │<────────────────────────────────│
    │                                │
    │ ② Start DTC Read Operation     │
    │  19 0F FF                      │ (Mirror memory - large data)
    │────────────────────────────────>│
    │  78                            │ ⏳ Response Pending
    │<────────────────────────────────│
    │                                │
    │ [Wait 4 seconds]               │
    │                                │
    │ ③ Send Tester Present          │
    │  3E 00                         │ (Keep session alive)
    │────────────────────────────────>│
    │  7E 00                         │ ✓ Session extended
    │<────────────────────────────────│
    │                                │
    │ [Wait for DTC processing]      │
    │                                │
    │ ④ DTC Response Ready           │
    │  59 0F 19 [Mirror DTCs...]     │ ✓ Complete response
    │<────────────────────────────────│
    │                                │

Best Practice: Send SID 0x3E every 3-4 seconds during long ops
```

### Workflow 7: Compare Snapshot with Live Data

```
┌──────────────────────────────────────────────────────────────┐
│  WORKFLOW 7: Snapshot vs. Current Data Comparison            │
└──────────────────────────────────────────────────────────────┘

  Tester                            ECU
    │                                │
    │ ① Read DTC with Snapshot       │
    │  19 04 P0 01 35 01             │ (O2 sensor heater)
    │────────────────────────────────>│
    │  59 04 P0 01 35 08 01          │
    │  [DID 0x05: Temp=85°C]         │ ← Snapshot when fault occurred
    │  [DID 0x0C: RPM=1500]          │
    │  [DID 0x0D: Speed=60 km/h]     │
    │<────────────────────────────────│
    │                                │
    │ ② Read Current Temperature     │
    │  22 00 05                      │ (SID 0x22: Current temp)
    │────────────────────────────────>│
    │  62 00 05 55                   │ (Current: 85°C)
    │<────────────────────────────────│
    │                                │
    │ ③ Read Current RPM             │
    │  22 00 0C                      │
    │────────────────────────────────>│
    │  62 00 0C 00 00                │ (Current: 0 RPM - engine off)
    │<────────────────────────────────│
    │                                │
    │ ④ Read Current Speed           │
    │  22 00 0D                      │
    │────────────────────────────────>│
    │  62 00 0D 00                   │ (Current: 0 km/h - stationary)
    │<────────────────────────────────│
    │                                │

Analysis:
Snapshot: Fault occurred at highway speed (60 km/h), 1500 RPM
Current: Vehicle now stopped, engine off
Conclusion: Intermittent fault - occurred during driving
```

---

## Multi-Service Interaction Patterns

### Pattern 1: Full Diagnostic Session

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN 1: Complete Diagnostic Workflow                     │
│  Services: 0x10, 0x19, 0x22, 0x14, 0x3E                      │
└──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ Start: Connect to ECU                       │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x10 0x03 → Extended Session              │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x19 0x01 → Count DTCs                    │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x19 0x02 → Read All DTCs                 │
  └────────────────┬───────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
  ┌─────────┐            ┌─────────┐
  │ Snapshot│            │Extended │
  │ 0x19 0x04            │ 0x19 0x06
  └────┬────┘            └────┬────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x22 → Read Live Data (compare)           │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ ⚙ Analyze & Repair                            │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x14 → Clear DTCs                         │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌────────────────────────────────────────────────┐
  │ SID 0x19 0x01 → Verify Clear (count=0)        │
  └────────────────┬───────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ End: Diagnostic Complete                    │
  └─────────────────────────────────────────────┘
```

### Pattern 2: Security-Protected DTC Access

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN 2: Protected DTC Reading                            │
│  Services: 0x10, 0x27, 0x19                                  │
└──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ SID 0x10 0x03 → Extended Session            │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x19 0x06 C1 23 45 FF → Try read        │
  │ Response: 7F 19 33 (Security Denied) ❌     │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x27 0x01 → Request Seed                │
  │ Response: 67 01 [SEED]                      │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ [Calculate Key from Seed]                   │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x27 0x02 [KEY] → Send Key              │
  │ Response: 67 02 (Unlocked 🔓)               │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x19 0x06 C1 23 45 FF → Retry read      │
  │ Response: 59 06 [Data] ✓                    │
  └─────────────────────────────────────────────┘
```

### Pattern 3: DTC Control During Testing

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN 3: Test Mode with DTC Disabled                      │
│  Services: 0x85, 0x19, 0x31 (Routine Control)                │
└──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ SID 0x85 0x02 → Disable DTC Setting         │
  │ Response: C5 02 ✓                           │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ ⚙ Perform Tests:                            │
  │   • Component actuations (SID 0x31)         │
  │   • Intentional fault injection             │
  │   • Boundary condition testing              │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x19 0x01 FF → Verify no new DTCs      │
  │ Response: 59 01 19 01 00 00 (Still 0) ✓    │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x85 0x01 → Re-enable DTC Setting       │
  │ Response: C5 01 ✓                           │
  └─────────────────────────────────────────────┘
```

### Pattern 4: Periodic DTC Monitoring

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN 4: Long-Term DTC Monitoring                         │
│  Services: 0x10, 0x19, 0x3E                                  │
└──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ SID 0x10 0x03 → Extended Session            │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ╔═════════════════════════════════════════════╗
  ║ MONITORING LOOP (Every 10 seconds)          ║
  ╠═════════════════════════════════════════════╣
  ║                                             ║
  ║  ┌─────────────────────────────────────┐   ║
  ║  │ SID 0x19 0x01 FF → Count DTCs       │   ║
  ║  │ Response: Current count              │   ║
  ║  └────────────┬────────────────────────┘   ║
  ║               │                             ║
  ║               ▼                             ║
  ║  ┌─────────────────────────────────────┐   ║
  ║  │ Count Changed?                       │   ║
  ║  └────┬──────────────────────┬─────────┘   ║
  ║       │                      │              ║
  ║      YES                    NO              ║
  ║       │                      │              ║
  ║       ▼                      ▼              ║
  ║  ┌─────────┐         ┌───────────────┐     ║
  ║  │Read New │         │Continue       │     ║
  ║  │DTCs     │         │Monitoring     │     ║
  ║  │0x19 0x02│         └───────────────┘     ║
  ║  └─────────┘                               ║
  ║                                             ║
  ║  ┌─────────────────────────────────────┐   ║
  ║  │ SID 0x3E 00 → Keep Session Alive    │   ║
  ║  │ (Every 3 seconds)                   │   ║
  ║  └─────────────────────────────────────┘   ║
  ║                                             ║
  ║  [Wait 10 seconds, repeat loop]            ║
  ║                                             ║
  ╚═════════════════════════════════════════════╝
```

### Pattern 5: Snapshot Data Analysis

```
┌──────────────────────────────────────────────────────────────┐
│  PATTERN 5: Deep Snapshot Analysis                           │
│  Services: 0x19 (0x04), 0x22, 0x04 (Read Scaling)            │
└──────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ SID 0x19 0x04 [DTC] 0x01 → Get Snapshot     │
  │ Response: Raw data values                   │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ Extract Data Identifiers (DIDs):            │
  │   • DID 0x0C (RPM) = 0x05 DC               │
  │   • DID 0x0D (Speed) = 0x3C                │
  │   • DID 0x05 (Temp) = 0x55                 │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x04 0x0C → Get Scaling for RPM         │
  │ Response: Formula, units, range             │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ Convert Raw → Engineering Units:            │
  │   • RPM: 1500 (0x05DC / 4)                  │
  │   • Speed: 60 km/h (0x3C)                   │
  │   • Temp: 85°C (0x55)                       │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────────────────────┐
  │ SID 0x22 [DIDs] → Read Current Values       │
  │ Compare with snapshot to find delta         │
  └─────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Session Timeout During DTC Read

```
┌──────────────────────────────────────────────────────────────┐
│  PROBLEM: Extended session times out during DTC operations  │
└──────────────────────────────────────────────────────────────┘

SYMPTOMS:
  • Request sent in extended session
  • Response: 7F 19 22 (Conditions Not Correct)
  • Session has reverted to DEFAULT

DIAGNOSIS FLOWCHART:
                  ┌──────────────┐
                  │ Symptom:     │
                  │ NRC 0x22     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
             ┌────┤ Check: How   │
             │    │ long since   │
             │    │ last request?│
             │    └──────┬───────┘
             │           │
           > 5s        < 5s
             │           │
             ▼           ▼
      ┌──────────┐  ┌──────────┐
      │ Timeout  │  │ Check if │
      │ occurred │  │ subfunction
      └────┬─────┘  │ requires │
           │        │ EXTENDED │
           │        └────┬─────┘
           │             │
           ▼             ▼
    ┌──────────┐  ┌──────────┐
    │ SOLUTION │  │Different │
    │ Below    │  │ issue    │
    └──────────┘  └──────────┘

SOLUTION:
  Step 1: Re-enter extended session
    Tester → ECU: 10 03
    ECU → Tester: 50 03 00 32 01 F4

  Step 2: Send Tester Present periodically
    [Every 3 seconds during long operations]
    Tester → ECU: 3E 00
    ECU → Tester: 7E 00

  Step 3: Retry DTC operation
    Tester → ECU: 19 [subfunction] [params]
    ECU → Tester: 59 [data] ✓

PREVENTION:
  • Implement automatic SID 0x3E every 3-4 seconds
  • Monitor session timeout value from response
  • Set reminder timer for Tester Present
```

### Scenario 2: Unexpected Empty DTC Response

```
┌──────────────────────────────────────────────────────────────┐
│  PROBLEM: Request returns no DTCs when faults are present   │
└──────────────────────────────────────────────────────────────┘

SYMPTOMS:
  • MIL/Warning light is ON
  • SID 0x19 0x02 returns: 59 02 19 (no DTCs)
  • Or count shows 0 DTCs

DIAGNOSIS:
         ┌────────────────────┐
         │ Is MIL really ON?  │
         └─────┬──────────────┘
               │
          ┌────┴────┐
          │         │
         YES       NO
          │         │
          ▼         ▼
   ┌──────────┐ ┌──────────┐
   │Continue  │ │No actual │
   │diagnosis │ │problem   │
   └────┬─────┘ └──────────┘
        │
        ▼
   ┌────────────────────┐
   │ Check status mask  │
   │ Used: 0xFF?        │
   └────┬───────────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   ▼         ▼
┌──────┐ ┌──────────────┐
│Check │ │Try 0xFF mask │
│next  │ │SID 0x19 0x02 │
└──┬───┘ │0xFF          │
   │     └──────────────┘
   ▼
┌──────────────────────┐
│ DTC Setting enabled? │
│ (SID 0x85 status)    │
└────┬─────────────────┘
     │
┌────┴────┐
│         │
ENABLED DISABLED
│         │
▼         ▼
┌──────┐ ┌──────────────┐
│Check │ │Enable DTC    │
│next  │ │SID 0x85 0x01 │
└──┬───┘ └──────────────┘
   │
   ▼
┌──────────────────────┐
│ DTCs in different    │
│ memory? Try:         │
│ • 0x0F (Mirror)      │
│ • 0x17 (User-Def)    │
│ • 0x13 (OBD/Emis)    │
└──────────────────────┘

SOLUTIONS:
  1. Use comprehensive status mask (0xFF)
  2. Check all DTC memory types
  3. Verify DTC setting is enabled
  4. Check for manufacturer-specific subfunctions
```

### Scenario 3: Corrupted Snapshot Data

```
┌──────────────────────────────────────────────────────────────┐
│  PROBLEM: Snapshot data appears corrupted or nonsensical    │
└──────────────────────────────────────────────────────────────┘

SYMPTOMS:
  • Snapshot values don't match expected ranges
  • Data structure doesn't align with DIDs
  • Parsing errors

VERIFICATION:
  Step 1: Re-request snapshot
    19 04 [DTC] 0xFF  (All records)
    Compare with previous response

  Step 2: Check response structure
    ┌──────┬──────┬──────┬────────┬──────┬──────────┐
    │ 0x59 │ 0x04 │ DTC  │ Status │ RecNum│ Data... │
    └──────┴──────┴──────┴────────┴──────┴──────────┘
    Verify each field is present and correct length

  Step 3: Validate individual data records
    Each record format:
    ┌────────────┬────────┬──────────────┐
    │ DataID (2B)│ Length │ Value        │
    └────────────┴────────┴──────────────┘

  Step 4: Cross-check with live data
    Use SID 0x22 to read same DIDs
    Verify data format matches

COMMON CAUSES:
  ❌ Wrong record number (no data at that index)
  ❌ DTC doesn't support snapshots
  ❌ Snapshot data cleared but DTC remains
  ❌ Incorrect DID interpretation
  ❌ Endianness mismatch (multi-byte values)

SOLUTION:
  • Request supported DTCs (0x0A) to verify capabilities
  • Use record 0xFF to get all available records
  • Parse according to ECU documentation
  • Apply correct scaling using SID 0x04
```

### Scenario 4: NRC 0x31 for Valid DTC

```
┌──────────────────────────────────────────────────────────────┐
│  PROBLEM: NRC 0x31 returned for seemingly valid DTC         │
└──────────────────────────────────────────────────────────────┘

REQUEST:
  19 06 P0 04 20 01  (Extended data for P0420, Record 1)
  Response: 7F 19 31 (Request Out of Range)

DIAGNOSIS CHECKLIST:
  ☐ Is DTC actually stored?
    → Use SID 0x19 0x02 to list stored DTCs
    → Verify P0420 appears in the list

  ☐ Does this DTC support extended data?
    → Not all DTCs store extended data
    → Try record 0xFF to get all available records

  ☐ Is record number valid?
    → Record 1 may not exist for this DTC
    → Try record 0x00 or 0xFF

  ☐ Is DTC format correct?
    → Verify 3-byte format: [High][Mid][Low]
    → P0420 = 0xP0 0x04 0x20 (check encoding)

SOLUTION WORKFLOW:
  Step 1: Confirm DTC exists
    19 02 08  (Read confirmed DTCs)
    Look for P0420 in response

  Step 2: Try all extended records
    19 06 P0 04 20 FF  (Record 0xFF = all)

  Step 3: If still failing, try snapshot instead
    19 04 P0 04 20 01  (Snapshot may be available)

  Step 4: Check supported DTCs
    19 0A  (Lists all DTCs ECU can detect)
    Verify P0420 is in the list
```

### Scenario 5: Inconsistent DTC Count

```
┌──────────────────────────────────────────────────────────────┐
│  PROBLEM: DTC count doesn't match actual DTCs returned      │
└──────────────────────────────────────────────────────────────┘

EXAMPLE:
  Request: 19 01 08  (Count confirmed DTCs)
  Response: 59 01 19 01 00 05  (5 DTCs)

  Request: 19 02 08  (Read confirmed DTCs)
  Response: 59 02 19 P0135 08 P0420 08 C1234 08  (Only 3 DTCs!)

POSSIBLE CAUSES:
  1. DTCs in different memory regions
  2. Some DTCs require security access
  3. Status bits changed between requests
  4. Buffer/pagination limitations

DIAGNOSIS:
         ┌────────────────────┐
         │ Recount DTCs       │
         │ 19 01 08           │
         └─────┬──────────────┘
               │
               ▼
         ┌────────────────────┐
    ┌────┤ Count still 5?     │────┐
    │    └────────────────────┘    │
   NO                              YES
    │                               │
    ▼                               ▼
┌────────┐                   ┌────────────┐
│Status  │                   │Some DTCs   │
│changed │                   │are hidden  │
│between │                   │(security)  │
│calls   │                   └──────┬─────┘
└────────┘                          │
                                    ▼
                             ┌────────────┐
                             │Unlock via  │
                             │SID 0x27    │
                             └──────┬─────┘
                                    │
                                    ▼
                             ┌────────────┐
                             │Retry read  │
                             │19 02 08    │
                             └────────────┘

VERIFICATION:
  • Check mirror memory: 19 11 (Count mirror DTCs)
  • Check user memory: 19 17 (User-defined DTCs)
  • Try with security unlocked (SID 0x27)
  • Use 0xFF mask to get ALL DTCs regardless of status
```

---

## Quick Reference Tables

### Service Interaction Summary

```
┌──────────────────────────────────────────────────────────────┐
│         QUICK SERVICE INTERACTION REFERENCE                  │
├────────┬──────────────────────────────────────┬──────────────┤
│ SID    │ Interaction with 0x19                │ When to Use  │
├────────┼──────────────────────────────────────┼──────────────┤
│ 0x10   │ Establishes session for DTC access  │ Always first │
│ 0x14   │ Clears DTCs read by 0x19             │ After repair │
│ 0x22   │ Reads live data (compare w/snapshot)│ Analysis     │
│ 0x27   │ Unlocks protected DTCs               │ If needed    │
│ 0x3E   │ Keeps session alive during DTC ops   │ Long ops     │
│ 0x85   │ Controls DTC storage on/off          │ Testing      │
│ 0x04   │ Gets scaling for snapshot data       │ Data parsing │
│ 0x31   │ Actuate components (with DTC off)    │ Testing      │
└────────┴──────────────────────────────────────┴──────────────┘
```

### Common Workflow Patterns

```
┌──────────────────────────────────────────────────────────────┐
│         WORKFLOW PATTERN QUICK REFERENCE                     │
├──────┬──────────────────────────────────┬───────────────────┤
│ Use  │ Workflow                         │ Services Used     │
│ Case │                                  │                   │
├──────┼──────────────────────────────────┼───────────────────┤
│ Scan │ Basic diagnostic scan            │ 0x19 (0x01,0x02)  │
├──────┼──────────────────────────────────┼───────────────────┤
│ Deep │ Detailed DTC analysis            │ 0x19 (0x04,0x06)  │
│      │                                  │ 0x22, 0x04        │
├──────┼──────────────────────────────────┼───────────────────┤
│ Clear│ Clear and verify DTCs            │ 0x14, 0x19 (0x01) │
├──────┼──────────────────────────────────┼───────────────────┤
│ Secure│ Protected DTC access            │ 0x10, 0x27, 0x19  │
├──────┼──────────────────────────────────┼───────────────────┤
│ Test │ Component test w/DTC disabled    │ 0x85, 0x31, 0x19  │
├──────┼──────────────────────────────────┼───────────────────┤
│ Monitor│ Long-term DTC monitoring       │ 0x10, 0x19, 0x3E  │
├──────┼──────────────────────────────────┼───────────────────┤
│ Compare│ Snapshot vs. live data         │ 0x19 (0x04), 0x22 │
└──────┴──────────────────────────────────┴───────────────────┘
```

### Typical Request Sequences

```
┌──────────────────────────────────────────────────────────────┐
│         TYPICAL REQUEST SEQUENCES                            │
└──────────────────────────────────────────────────────────────┘

Sequence 1: Quick Scan
  ① 19 01 FF → Count all DTCs
  ② 19 02 FF → Read all DTCs

Sequence 2: Detailed Investigation
  ① 19 02 08 → Read confirmed DTCs
  ② 19 04 [DTC] 01 → Get snapshot
  ③ 19 06 [DTC] FF → Get extended data
  ④ 22 [DIDs] → Read live values

Sequence 3: Clear and Verify
  ① 19 01 FF → Count before clear
  ② 14 FF FF FF → Clear all
  ③ 19 01 FF → Verify count = 0

Sequence 4: Protected Access
  ① 10 03 → Extended session
  ② 27 01 → Request seed
  ③ 27 02 [KEY] → Send key
  ④ 19 06 [DTC] FF → Read protected data

Sequence 5: Test Mode
  ① 85 02 → DTC off
  ② [Perform tests]
  ③ 19 01 FF → Verify no new DTCs
  ④ 85 01 → DTC on
```

---

**End of Document**
