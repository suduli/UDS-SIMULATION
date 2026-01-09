# SID 0x85: Service Interactions & Workflows

**Document Version**:  2.0  
**Last Updated**: December 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.7

---

## Table of Contents

1. [Service Dependency Overview](#service-dependency-overview)
2. [DTC Control Management](#dtc-control-management)
3. [Complete Workflow Examples](#complete-workflow-examples)
4. [Multi-Service Interaction Patterns](#multi-service-interaction-patterns)
5. [Troubleshooting Scenarios](#troubleshooting-scenarios)
6. [Quick Reference Tables](#quick-reference-tables)

---

## Service Dependency Overview

### Service Relationship Diagram

```
                    ┌─────────────────────┐
                    │   SID 0x85          │
                    │  (Control DTC)      │
                    └──────────┬──────────┘
                               │
                               │ Affects
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
      ┌────────────────┐ ┌──────────┐ ┌─────────────────┐
      │   SID 0x19     │ │SID 0x14  │ │Fault Detection  │
      │(Read DTC)      │ │(Clear DTC)│ │    Systems      │
      │Can still read  │ │Can still │ │Monitor but      │
      │existing DTCs   │ │clear DTCs│ │don't record     │
      └────────────────┘ └──────────┘ └─────────────────┘
```

### Dependency Matrix

```
┌────────────────────┬──────────────────────────────────────┐
│ Service            │ Relationship with SID 0x85           │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x10           │ Session change auto-resets DTC       │
│ (Session Control)  │ setting to ENABLED                   │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x14           │ Can clear DTCs even when recording   │
│ (Clear DTC)        │ is disabled                          │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x19           │ Can read existing DTCs even when     │
│ (Read DTC)         │ recording disabled                   │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x27           │ May be required before disabling     │
│ (Security Access)  │ safety-critical DTCs                 │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x31           │ Routine control often used with      │
│ (Routine Control)  │ DTC disabled during tests            │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x2E           │ Write DID often used with DTC        │
│ (Write DID)        │ disabled during calibration          │
├────────────────────┼──────────────────────────────────────┤
│ SID 0x34/0x36/0x37 │ Programming typically done with      │
│ (Download/Transfer)│ DTCs disabled                        │
└────────────────────┴──────────────────────────────────────┘
```

### Impact on DTC Operations

```
┌─────────────────────────────────────────────────────────────┐
│         HOW DTC CONTROL AFFECTS OTHER OPERATIONS            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DTC Recording ENABLED (Normal State):                      │
│  ┌──────────────────────────────────────────┐              │
│  │ Fault Detection:        ✓ Active          │              │
│  │ DTC Storage:           ✓ Active          │              │
│  │ DTC Status Updates:    ✓ Active          │              │
│  │ Read DTCs (0x19):      ✓ Works           │              │
│  │ Clear DTCs (0x14):     ✓ Works           │              │
│  │ MIL/Warning Lights:    ✓ Active          │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  DTC Recording DISABLED (Maintenance Mode):                 │
│  ┌──────────────────────────────────────────┐              │
│  │ Fault Detection:       ✓ Active          │              │
│  │ DTC Storage:           ✗ DISABLED        │              │
│  │ DTC Status Updates:    ✗ DISABLED        │              │
│  │ Read DTCs (0x19):      ✓ Works (existing)│              │
│  │ Clear DTCs (0x14):     ✓ Works           │              │
│  │ MIL/Warning Lights:     ⚠️  Existing only  │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  Key Insight:                                               │
│  • Monitoring continues, but results not stored             │
│  • Existing DTCs remain accessible                          │
│  • New faults invisible to external tools                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DTC Control Management

### Basic Enable/Disable Workflow

```
  Tester                             ECU
    │                                 │
    │ ① Enter EXTENDED Session        │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │                                 │
    │ Response: 50 03                 │
    │◄────────────────────────────────│
    │                                 │
    │ ② Disable DTC Recording         │
    │ Request: 85 02                  │
    │────────────────────────────────>│
    │                                 │ [Set DTC_Recording = OFF]
    │                                 │ [Stop DTC updates]
    │                                 │
    │ Response: C5 02                 │
    │◄────────────────────────────────│
    │ ✓ DTCs disabled                 │
    │                                 │
    │ ③ Perform Maintenance           │
    │ [Component replacement,         │
    │  testing, calibration, etc.]    │
    │                                 │
    │ ④ Re-enable DTC Recording       │
    │ Request: 85 01                  │
    │────────────────────────────────>│
    │                                 │ [Set DTC_Recording = ON]
    │                                 │ [Resume DTC updates]
    │                                 │
    │ Response: C5 01                 │
    │◄────────────────────────────────│
    │ ✓ DTCs re-enabled               │
    │                                 │
    │ ⑤ Exit Session                  │
    │ Request: 10 01                  │
    │────────────────────────────────>│
    │                                 │
    │ Response: 50 01                 │
    │◄────────────────────────────────│
    │                                 │
```

### Selective DTC Control Workflow

```
  Tester                             ECU
    │                                 │
    │ ① Setup Session                 │
    │ Request: 10 03                  │
    │────────────────────────────────>│
    │ Response: 50 03                 │
    │◄────────────────────────────────│
    │                                 │
    │ ② Disable Emissions DTCs Only   │
    │ Request:  85 02 01               │
    │         (OFF, Emissions type)   │
    │────────────────────────────────>│
    │                                 │ [Disable emissions DTCs]
    │                                 │ [Keep safety DTCs active]
    │                                 │
    │ Response: C5 02                 │
    │◄────────────────────────────────│
    │ ✓ Emissions DTCs disabled       │
    │ ✓ Safety DTCs still active      │
    │                                 │
    │ ③ Perform Emissions Test        │
    │ [Test may trigger false codes]  │
    │ [Safety systems still monitored]│
    │                                 │
    │ ④ Re-enable Emissions DTCs      │
    │ Request: 85 01 01               │
    │────────────────────────────────>│
    │                                 │
    │ Response: C5 01                 │
    │◄────────────────────────────────│
    │ ✓ All DTCs active               │
    │                                 │
```

---

## Complete Workflow Examples

### Workflow 1: Oxygen Sensor Replacement

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Replace faulty O2 sensor                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Check Existing DTCs     │                      │
│    │ 10 03 (EXTENDED) ───────────────>│                      │
│    │ 50 03 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ 19 02 08 (Read Emissions DTCs) >│                      │
│    │ 59 02 08 02 P0420 P0135 ◄───────│                      │
│    │ Found: P0420 (Cat), P0135 (O2)  │                      │
│    │                                 │                      │
│    │ Step 2: Disable Emissions DTCs  │                      │
│    │ 85 02 01 ───────────────────────>│                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │ ✓ Emissions DTCs suspended      │                      │
│    │                                 │                      │
│    │ Step 3: Clear Existing DTCs     │                      │
│    │ 14 FF FF FF ────────────────────>│                      │
│    │ 54 ◄────────────────────────────│                      │
│    │ ✓ DTCs cleared                  │                      │
│    │                                 │                      │
│    │ [Technician Unplugs Old Sensor] │                      │
│    │                                 │ [Detects open circuit]│
│    │                                 │ [Would trigger P0135] │
│    │                                 │ [But NOT stored!  ✓]   │
│    │                                 │                      │
│    │ [Technician Installs New Sensor]│                      │
│    │                                 │ [Detects sensor OK]   │
│    │                                 │                      │
│    │ Step 4: Re-enable Emissions DTCs│                      │
│    │ 85 01 01 ───────────────────────>│                      │
│    │ C5 01 ◄─────────────────────────│                      │
│    │ ✓ Normal monitoring resumed     │                      │
│    │                                 │                      │
│    │ Step 5: Verify No New DTCs      │
│    │ 19 02 08 ───────────────────────>│                      │
│    │ 59 02 08 00 ◄───────────────────│                      │
│    │ ✓ No DTCs (clean memory)        │                      │
│    │                                 │                      │
│    │ Step 6: Drive Cycle Test        │                      │
│    │ [Start engine, warm up]         │                      │
│    │ [O2 sensor heats and functions] │                      │
│    │ [No DTCs triggered ✓]           │                      │
│    │                                 │                      │
│    │ Step 7: Final Check             │                      │
│    │ 19 02 08 ───────────────────────>│                      │
│    │ 59 02 08 00 ◄───────────────────│                      │
│    │ ✓ Still no DTCs                 │                      │
│    │                                 │                      │
│    │ 10 01 (Return DEFAULT) ─────────>│                      │
│    │ 50 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│                                                             │
│  Result:                                                     │
│  • Sensor replaced successfully                             │
│  • No false DTCs from disconnection                         │
│  • Clean diagnostic memory                                  │
│  • Vehicle ready for customer                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 2: ECU Software Update

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Flash ECU with new software                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Enter Programming       │                      │
│    │ 10 02 ─────────────────────────>│                      │
│    │ 50 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 2: Disable All DTCs        │                      │
│    │ 85 02 ─────────────────────────>│                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │ ✓ DTC recording OFF             │                      │
│    │                                 │                      │
│    │ Step 3: Unlock Security         │                      │
│    │ 27 01 ─────────────────────────>│                      │
│    │ 67 01 [seed] ◄──────────────────│                      │
│    │ 27 02 [key] ───────────────────>│                      │
│    │ 67 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 4: Request Download        │                      │
│    │ 34 00 44 [addr/size] ──────────>│                      │
│    │ 74 20 [params] ◄────────────────│                      │
│    │                                 │                      │
│    │ Step 5: Transfer Data (100 blocks)                     │
│    │ 36 01 [block1] ────────────────>│                      │
│    │ 76 01 ◄─────────────────────────│                      │
│    │                                 │ [During flash:]       │
│    │                                 │ • Systems offline     │
│    │                                 │ • Sensors inactive    │
│    │                                 │ • Comms interrupted   │
│    │                                 │ • Would trigger 50+   │
│    │                                 │   DTCs normally!       │
│    │                                 │ • But recording OFF   │
│    │                                 │ • Nothing stored ✓    │
│    │ ...                              │                      │
│    │ 36 64 [block100] ───────────────>│                      │
│    │ 76 64 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 6: Exit Transfer           │                      │
│    │ 37 ────────────────────────────>│                      │
│    │ 77 ◄────────────────────────────│                      │
│    │                                 │                      │
│    │ Step 7: ECU Reset               │                      │
│    │ 11 01 ─────────────────────────>│                      │
│    │ 51 01 ◄─────────────────────────│                      │
│    │                                 │ [Rebooting...]        │
│    │                                 │                      │
│    │ [ECU Powers Up]                 │                      │
│    │                                 │ [AUTO-RESET:]         │
│    │                                 │ [DTC recording ON ✓]  │
│    │                                 │                      │
│    │ Step 8: Verify Clean Memory     │                      │
│    │ 19 02 FF ───────────────────────>│                      │
│    │ 59 02 FF 00 ◄───────────────────│                      │
│    │ ✓ No DTCs stored                │                      │
│    │                                 │                      │
│    │ Step 9: Test Systems            │                      │
│    │ [Start engine]                  │                      │
│    │ [All systems initialize]        │                      │
│    │ [No faults detected ✓]          │                      │
│    │                                 │                      │
│                                                             │
│  Result:                                                    │
│  • ECU successfully updated                                 │
│  • No false DTCs from programming                           │
│  • Clean start with new software                            │
│  • Ready for road test                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 3: Throttle Body Cleaning

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE:  Clean throttle body and relearn idle            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Prepare                 │                      │
│    │ 10 03 ─────────────────────────>│                      │
│    │ 50 03 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 2: Disable DTCs            │                      │
│    │ 85 02 ─────────────────────────>│                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ [Technician Disconnects TPS]   │                      │
│    │                                 │ [Fault:  No signal]    │
│    │                                 │ [NOT stored ✓]        │
│    │                                 │                      │
│    │ [Technician Cleans TB]          │                      │
│    │                                 │                      │
│    │ [Technician Reconnects TPS]    │                      │
│    │                                 │ [Signal returns]      │
│    │                                 │                      │
│    │ Step 3: Idle Relearn Routine    │                      │
│    │ 31 01 F030 ────────────────────>│                      │
│    │ 71 01 F030 ◄────────────────────│                      │
│    │ [Routine started]               │                      │
│    │                                 │ [Opening/closing TB]  │
│    │                                 │ [Learning positions]  │
│    │                                 │ [Abnormal operation]  │
│    │                                 │ [Would trigger DTCs]  │
│    │                                 │ [But NOT stored ✓]    │
│    │                                 │                      │
│    │ [Wait 30 seconds]               │                      │
│    │                                 │                      │
│    │ 31 03 F030 ────────────────────>│                      │
│    │ 71 03 F030 01 ◄─────────────────│                      │
│    │ ✓ Relearn complete              │                      │
│    │                                 │                      │
│    │ Step 4: Re-enable DTCs          │                      │
│    │ 85 01 ─────────────────────────>│                      │
│    │ C5 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 5: Test Idle               │                      │
│    │ [Start engine]                  │                      │
│    │ [Idle smooth and stable ✓]     │                      │
│    │                                 │                      │
│    │ Step 6: Verify                  │                      │
│    │ 19 02 FF ───────────────────────>│                      │
│    │ 59 02 FF 00 ◄───────────────────│                      │
│    │ ✓ No DTCs                       │                      │
│    │                                 │                      │
│    │ 10 01 ─────────────────────────>│                      │
│    │ 50 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│                                                             │
│  Result:                                                    │
│  • Throttle body cleaned                                    │
│  • Idle relearned successfully                              │
│  • No false DTCs                                            │
│  • Engine running properly                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 4: Injector Balance Test

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Test fuel injectors individually                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Setup                   │                      │
│    │ 10 03 ─────────────────────────>│                      │
│    │ 50 03 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 2: Disable Emissions DTCs  │                      │
│    │ 85 02 01 (OFF, Emissions) ─────>│                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │ ✓ Emissions DTCs suspended      │                      │
│    │ ✓ Other DTCs still active       │                      │
│    │                                 │                      │
│    │ Step 3: Test Cylinder 1         │                      │
│    │ 31 01 F101 01 ─────────────────>│                      │
│    │ (Disable injectors 2,3,4)       │                      │
│    │ 71 01 F101 01 ◄─────────────────│                      │
│    │                                 │ [Engine runs rough]   │
│    │                                 │ [Cylinders 2,3,4      │
│    │                                 │  misfiring]           │
│    │                                 │ [Would trigger P0300, │
│    │                                 │  P0302, P0303, P0304] │
│    │                                 │ [But NOT stored!  ✓]   │
│    │                                 │                      │
│    │ [Monitor pressure/RPM]          │                      │
│    │ 22 F101 ───────────────────────>│                      │
│    │ 62 F101 [data] ◄────────────────│                      │
│    │ ✓ Cyl 1 contribution:  15%       │                      │
│    │                                 │                      │
│    │ Step 4: Test Cylinder 2         │                      │
│    │ 31 01 F101 02 ─────────────────>│                      │
│    │ 71 01 F101 02 ◄─────────────────│                      │
│    │ 22 F101 ───────────────────────>│                      │
│    │ 62 F101 [data] ◄────────────────│                      │
│    │ ✓ Cyl 2 contribution: 14%       │                      │
│    │                                 │                      │
│    │ Step 5: Test Cylinders 3, 4     │                      │
│    │ [Repeat for remaining cylinders]│                      │
│    │ ✓ Cyl 3:  16%                    │                      │
│    │ ✓ Cyl 4: 15%                    │                      │
│    │                                 │                      │
│    │ Step 6: Stop Test               │                      │
│    │ 31 03 F101 ────────────────────>│                      │
│    │ 71 03 F101 ◄────────────────────│                      │
│    │ [All injectors active]          │                      │
│    │ [Engine running smoothly]       │                      │
│    │                                 │                      │
│    │ Step 7: Re-enable Emissions DTCs│                      │
│    │ 85 01 01 ───────────────────────>│                      │
│    │ C5 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 8: Verify Results          │                      │
│    │ Analysis:                        │                      │
│    │ • All injectors balanced        │                      │
│    │ • No weak/clogged injectors     │                      │
│    │ • No DTCs from test ✓           │                      │
│    │                                 │                      │
│    │ 10 01 ─────────────────────────>│                      │
│    │ 50 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│                                                             │
│  Result:                                                    │
│  • All injectors tested                                     │
│  • Balance within spec                                      │
│  • No false misfire codes                                   │
│  • System performing correctly                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 5: ABS Module Replacement

```
┌─────────────────────────────────────────────────────────────┐
│  USE CASE: Replace ABS control module                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tester                             ECU                     │
│    │                                 │                      │
│    │ Step 1: Setup (May need security)│                     │
│    │ 10 03 ─────────────────────────>│                      │
│    │ 50 03 ◄─────────────────────────│                      │
│    │ 27 01 ─────────────────────────>│                      │
│    │ 67 01 [seed] ◄──────────────────│                      │
│    │ 27 02 [key] ───────────────────>│                      │
│    │ 67 02 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 2: Try Disable Safety DTCs │                      │
│    │ 85 02 02 (OFF, Safety type) ───>│                      │
│    │                                 │                      │
│    │ Option A: Allowed               │                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │ ✓ Safety DTCs suspended         │                      │
│    │                                 │                      │
│    │ Option B: Not Allowed (common)  │                      │
│    │ 7F 85 31 ◄──────────────────────│                      │
│    │ ✗ Cannot disable safety DTCs    │                      │
│    │                                 │                      │
│    │ Fallback: Disable All DTCs      │                      │
│    │ 85 02 ─────────────────────────>│                      │
│    │ C5 02 ◄─────────────────────────│                      │
│    │ ✓ All DTCs suspended            │                      │
│    │                                 │                      │
│    │ [Technician Disconnects Module] │                      │
│    │                                 │ [Faults: CAN timeout, │
│    │                                 │  wheel speed loss,    │
│    │                                 │  system offline]      │
│    │                                 │ [Would trigger C0035, │
│    │                                 │  C1234, C2500, etc.]  │
│    │                                 │ [But NOT stored!  ✓]   │
│    │                                 │                      │
│    │ [Technician Installs New Module]│                      │
│    │                                 │                      │
│    │ [Technician Powers Up System]   │                      │
│    │                                 │ [New module detected] │
│    │                                 │                      │
│    │ Step 3: Configure New Module    │                      │
│    │ 2E F100 [VIN] ─────────────────>│                      │
│    │ 6E F100 ◄───────────────────────│                      │
│    │ 2E F101 [config] ───────────────>│                      │
│    │ 6E F101 ◄───────────────────────│                      │
│    │                                 │                      │
│    │ Step 4: Calibrate               │                      │
│    │ 31 01 FF00 ────────────────────>│                      │
│    │ 71 01 FF00 ◄────────────────────│                      │
│    │ [Drive wheels for calibration]  │                      │
│    │ 31 03 FF00 ────────────────────>│                      │
│    │ 71 03 FF00 01 ◄─────────────────│                      │
│    │ ✓ Calibration complete          │                      │
│    │                                 │                      │
│    │ Step 5: Re-enable DTCs          │                      │
│    │ 85 01 ─────────────────────────>│                      │
│    │ C5 01 ◄─────────────────────────│                      │
│    │                                 │                      │
│    │ Step 6: Clear Any Old DTCs      │                      │
│    │ 14 FF FF FF ────────────────────>│                      │
│    │ 54 ◄────────────────────────────│                      │
│    │                                 │                      │
│    │ Step 7: Test System             │                      │
│    │ [Drive vehicle, test ABS]       │                      │
│    │ [System functioning ✓]          │                      │
│    │                                 │                      │
│    │ 19 02 FF ───────────────────────>│                      │
│    │ 59 02 FF 00 ◄───────────────────│                      │
│    │ ✓ No DTCs                       │                      │
│    │                                 │                      │
│                                                             │
│  Result:                                                    │
│  • ABS module replaced                                      │
│  • Configuration transferred                                │
│  • System calibrated                                        │
│  • No false DTCs from replacement                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Service Interaction Patterns

### Pattern 1: DTC Control + Component Replacement

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN: Safe Component Replacement                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Standard Sequence:                                         │
│                                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 1. Enter EXTENDED Session (0x10)   │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 2. Read Existing DTCs (0x19)       │                    │
│  │    → Document pre-existing faults  │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 3. Disable DTC Recording (0x85 0x02)│                   │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 4. Optionally Clear DTCs (0x14)    │                    │
│  │    → Start with clean slate        │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 5. Replace Component               │                    │
│  │    → Physical work                 │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 6. Re-enable DTC Recording (0x85 0x01)│                 │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 7. Verify No New DTCs (0x19)       │                    │
│  │    → Confirm repair successful     │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 8. Return to DEFAULT Session (0x10)│                    │
│  └────────────────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: DTC Control + Calibration

```
┌─────────────────────────────────────────────────────────────┐
│  PATTERN: Calibration With DTC Protection                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 1. Enter EXTENDED + Security       │                    │
│  │    → 0x10, 0x27                    │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 2. Disable DTC Recording           │                    │
│  │    → 0x85 0x02                     │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 3. Write Calibration Data          │                    │
│  │    → 0x2E (multiple DIDs)          │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 4. Execute Calibration Routine     │                    │
│  │    → 0x31 (learn values)           │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 5. Verify Calibration              │                    │
│  │    → 0x22 (read back values)       │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 6. Re-enable DTCs                  │                    │
│  │    → 0x85 0x01                     │                    │
│  └────────────┬───────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ 7. Test System Operation           │                    │
│  │    → Verify no faults triggered    │                    │
│  └────────────────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Scenarios

### Scenario 1: Cannot Disable DTCs (NRC 0x7F)

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: DTC control rejected - wrong session           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Request:  85 02                                           │
│ • Response: 7F 85 7F                                       │
│ • Current session: DEFAULT                                 │
│                                                            │
│ Diagnosis:                                                 │
│ • SID 0x85 not supported in DEFAULT session                │
│ • Must be in EXTENDED or PROGRAMMING session               │
│                                                            │
│ Solution:                                                  │
│                                                            │
│ Step 1: Check current session                              │
│ Request: 22 F186                                           │
│ Response:  62 F186 01 (DEFAULT)                             │
│ → Confirmed wrong session                                  │
│                                                            │
│ Step 2: Enter EXTENDED session                             │
│ Request: 10 03                                             │
│ Response:  50 03                                            │
│                                                            │
│ Step 3: Retry DTC control                                  │
│ Request: 85 02                                             │
│ Response:  C5 02 ✓                                          │
│                                                            │
│ ✓ SUCCESS                                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 2: DTCs Re-enable Unexpectedly

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: DTCs recording resumed automatically           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Scenario:                                                  │
│                                                            │
│ T=0:   Disabled DTCs (85 02) → C5 02 ✓                     │
│ T=60:  Session timeout (no Tester Present)                 │
│ T=61:  Session returned to DEFAULT                         │
│ T=62:  DTCs AUTO-ENABLED                                   │
│ T=63:  New fault occurs → DTC stored!                       │
│                                                            │
│ Root Cause:                                                 │
│ • Session timed out (P3server expired)                     │
│ • Auto-reset safety feature enabled DTCs                   │
│ • Did not send Tester Present (0x3E)                       │
│                                                            │
│ Solution:                                                  │
│                                                            │
│ Option 1: Use Tester Present                               │
│ ┌────────────────────────────────────┐                    │
│ │ While DTCs disabled:                 │                    │
│ │ • Send 3E 80 every 2 seconds       │                    │
│ │ • Keeps session alive              │                    │
│ │ • Prevents auto-reset              │                    │
│ └────────────────────────────────────┘                    │
│                                                            │
│ Option 2: Complete work quickly                            │
│ ┌────────────────────────────────────┐                    │
│ │ • Finish maintenance < 5 seconds   │                    │
│ │ • Re-enable DTCs before timeout    │                    │
│ └────────────────────────────────────┘                    │
│                                                            │
│ Best Practice:                                              │
│ Always use Tester Present during long operations           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Scenario 3: Cannot Disable Safety DTCs

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  PROBLEM: Safety DTCs cannot be disabled                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Symptoms:                                                  │
│ • Request: 85 02 02 (Disable safety type)                  │
│ • Response: 7F 85 31 (Out of range)                        │
│ • or:  7F 85 12 (Sub-function not supported)                │
│                                                            │
│ Explanation:                                                │
│ • Many ECUs do NOT allow disabling safety-critical DTCs    │
│ • Regulatory/safety requirement                            │
│ • Examples: ABS, airbag, stability control                 │
│                                                            │
│ Workarounds:                                                │
│                                                            │
│ Option 1: Disable all DTCs (if allowed)                    │
│ Request: 85 02 (no type specified)                         │
│ → May disable all including safety                         │
│ → ECU-dependent                                            │
│                                                            │
│ Option 2: Disable non-safety DTCs only                     │
│ Request: 85 02 01 (Emissions only)                         │
│ → Safety DTCs remain active                                │
│ → Acceptable for most maintenance                          │
│                                                            │
│ Option 3: Accept the DTCs and clear after                  │
│ → Perform work                                             │
│ → Clear DTCs when done (0x14)                              │
│ → Less elegant but functional                              │
│                                                            │
│ Note: This is intentional safety design!                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Tables

### DTC Control Quick Reference

```
┌────────────┬─────────────────────┬──────────────────────┐
│ Sub-fn     │ Action              │ Use Case             │
├────────────┼─────────────────────┼──────────────────────┤
│ 0x01       │ Enable DTC setting  │ Resume normal ops    │
│ 0x02       │ Disable DTC setting │ During maintenance   │
└────────────┴─────────────────────┴──────────────────────┘
```

### DTCSettingType Values

```
┌────────┬─────────────────────────────┬──────────────────┐
│ Type   │ Category                    │ Support          │
├────────┼─────────────────────────────┼──────────────────┤
│ 0x00   │ All DTCs                    │ Common           │
│ 0x01   │ Emissions-related           │ Common           │
│ 0x02   │ Safety-related              │ Often restricted │
│ 0x03+  │ Manufacturer-specific       │ Varies           │
└────────┴─────────────────────────────┴──────────────────┘
```

### Session Requirements

```
┌──────────────┬────────────────────────────────────────┐
│ Session      │ SID 0x85 Support                       │
├──────────────┼────────────────────────────────────────┤
│ DEFAULT      │ ✗ Not supported                        │
│ EXTENDED     │ ✓ Typically supported                  │
│ PROGRAMMING  │ ✓ Typically supported                  │
└──────────────┴────────────────────────────────────────┘
```

---

**End of Service Interactions Guide**

For theoretical concepts, see:  `SID_85_CONTROL_DTC_SETTING. md`  
For implementation details, see: `SID_85_PRACTICAL_IMPLEMENTATION.md`