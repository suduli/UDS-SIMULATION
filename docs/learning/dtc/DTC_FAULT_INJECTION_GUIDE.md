# DTC Fault Injection Guide

## Overview

This guide explains how to **generate Diagnostic Trouble Codes (DTCs) through fault insertion** on the Cluster Dashboard page of the UDS Simulator. By simulating real-world vehicle faults, you can practice reading, analyzing, and clearing DTCs using UDS Services 0x19 and 0x14.

## What is Fault Injection?

**Fault injection** is the process of deliberately introducing faults into a vehicle system to trigger diagnostic trouble codes. This is essential for:
- **Testing DTC detection logic** in ECU software development
- **Training technicians** on diagnostic procedures
- **Validating repair procedures** before applying to real vehicles
- **Understanding freeze frame data** capture mechanisms

## How DTCs Are Created

> [!IMPORTANT]
> **DTCs are created dynamically** when you inject a fault. The system starts with **zero DTCs** and creates them from predefined templates only when faults are triggered.

### DTC Template System

The simulator maintains a registry of **DTC templates** (defined in `mockECU.ts`). When you inject a fault:

1. The system looks up the corresponding DTC template by code
2. Creates a new DTC instance by deep-cloning the template
3. Initializes the DTC with cleared status (all flags false)
4. Activates the DTC by setting appropriate status bits
5. Captures freeze frame data from current vehicle operating conditions

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        DTC CREATION AND UDS INTERACTION FLOW                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════╗
║                              STEP 1: FAULT INJECTION                              ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   ┌──────────────────┐         ┌──────────────────┐         ┌─────────────────┐  ║
║   │  FAULT PANEL     │         │  INJECT BUTTON   │         │ updateDTCStatus │  ║
║   │  ┌────────────┐  │         │                  │         │                 │  ║
║   │  │ [✓] MAF    │──┼────────▶│    [INJECT]     │────────▶│ (0x010101, ON)  │  ║
║   │  │ [ ] Misfire│  │         │                  │         │                 │  ║
║   │  └────────────┘  │         └──────────────────┘         └────────┬────────┘  ║
║   └──────────────────┘                                               │           ║
║                                                                      ▼           ║
║                                    ┌─────────────────────────────────────────┐   ║
║                                    │            DTC EXISTS?                  │   ║
║                                    └─────────────────┬───────────────────────┘   ║
║                              ┌───────────────────────┼───────────────────────┐   ║
║                              │ NO                    │                   YES │   ║
║                              ▼                       │                       ▼   ║
║           ┌──────────────────────────────────┐       │    ┌──────────────────┐   ║
║           │      CLONE FROM TEMPLATE         │       │    │  UPDATE STATUS   │   ║
║           │  ┌────────────────────────────┐  │       │    │                  │   ║
║           │  │ dtcTemplates[0x010101]     │  │       │    │ TF=1, CD=1       │   ║
║           │  │ → Deep Copy                │  │       │    │ TFT=1, TFS=1     │   ║
║           │  │ → Reset Status to 0x00     │  │       │    │ occurrences++    │   ║
║           │  │ → Push to dtcs[]           │  │       │    │                  │   ║
║           │  └────────────────────────────┘  │       │    └────────┬─────────┘   ║
║           └────────────────┬─────────────────┘       │             │             ║
║                            │                         │             │             ║
║                            └─────────────────────────┴─────────────┘             ║
║                                              │                                    ║
║                                              ▼                                    ║
║                              ╔═══════════════════════════════════╗               ║
║                              ║        DTC NOW ACTIVE             ║               ║
║                              ║  mockECUConfig.dtcs[0] = P0101    ║               ║
║                              ║  Status Byte: 0x2B (TF+TFT+CD+TFS)║               ║
║                              ╚═══════════════════════════════════╝               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         STEP 2: READ DTCs (SID 0x19)                              ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   ┌────────────────────────────────────────────────────────────────────────────┐  ║
║   │                         SUBFUNCTION 0x02: Read by Status Mask              │  ║
║   └────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                   ║
║   ┌─────────────────┐            ┌─────────────────┐            ┌─────────────┐  ║
║   │  [READ ALL]     │───────────▶│   UDSSimulator  │───────────▶│   mockECU   │  ║
║   │                 │            │                 │            │             │  ║
║   └─────────────────┘            └─────────────────┘            └─────────────┘  ║
║                                                                                   ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │  REQUEST:  19 02 FF                                                         │ ║
║   │            ├──┤ ├──┤ ├──┤                                                   │ ║
║   │            SID  SF  StatusMask                                              │ ║
║   │                                                                             │ ║
║   │  • SID 0x19      = Read DTC Information                                     │ ║
║   │  • SubFunc 0x02  = reportDTCByStatusMask                                    │ ║
║   │  • Mask 0xFF     = All status bits (return all DTCs)                        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                         │                                         ║
║                                         ▼                                         ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │  RESPONSE: 59 02 FF 01 01 01 2B                                             │ ║
║   │            ├──┤ ├──┤ ├──┤ ├────────┤ ├──┤                                   │ ║
║   │            SID+40 SF AvailMask DTC(3 bytes) Status                          │ ║
║   │                                                                             │ ║
║   │  DECODED:                                                                   │ ║
║   │  ┌─────────────────────────────────────────────────────────────────────┐    │ ║
║   │  │ Byte 0: 59         = Positive Response (0x19 + 0x40)                │    │ ║
║   │  │ Byte 1: 02         = Subfunction echo                               │    │ ║
║   │  │ Byte 2: FF         = Status Availability Mask (all bits supported)  │    │ ║
║   │  │ Byte 3-5: 01 01 01 = DTC Code P0101 (0x010101)                      │    │ ║
║   │  │ Byte 6: 2B         = Status Byte (TF=1, TFT=1, CD=1, TFS=1)         │    │ ║
║   │  └─────────────────────────────────────────────────────────────────────┘    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   ┌────────────────────────────────────────────────────────────────────────────┐  ║
║   │                        OTHER SID 0x19 SUBFUNCTIONS                         │  ║
║   ├────────────────────────────────────────────────────────────────────────────┤  ║
║   │                                                                            │  ║
║   │  SF 0x01: reportNumberOfDTCByStatusMask                                    │  ║
║   │  ────────────────────────────────────────────────────────────────────────  │  ║
║   │  Request:  19 01 FF                                                        │  ║
║   │  Response: 59 01 FF 01 00 01                                               │  ║
║   │                     ├──┤ ├──┤ ├────┤                                       │  ║
║   │                    Avail FormatID Count(High+Low)=1 DTC                    │  ║
║   │                                                                            │  ║
║   │  SF 0x04: reportDTCSnapshotByDTCNumber (Freeze Frame)                      │  ║
║   │  ────────────────────────────────────────────────────────────────────────  │  ║
║   │  Request:  19 04 01 01 01 FF                                               │  ║
║   │                 ├────────┤ ├──┤                                            │  ║
║   │                 DTC Code   RecordNum (0xFF=all)                            │  ║
║   │  Response: 59 04 01 01 01 2B 01 [snapshot data...]                         │  ║
║   │                                                                            │  ║
║   │  SF 0x06: reportDTCExtDataByDTCNumber                                      │  ║
║   │  ────────────────────────────────────────────────────────────────────────  │  ║
║   │  Request:  19 06 01 01 01 FF                                               │  ║
║   │  Response: 59 06 01 01 01 2B 01 [extended data...]                         │  ║
║   │                                                                            │  ║
║   └────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         STEP 3: CLEAR DTCs (SID 0x14)                             ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   ┌─────────────────┐            ┌─────────────────┐            ┌─────────────┐  ║
║   │ [CLEAR ALL DTCs]│───────────▶│   UDSSimulator  │───────────▶│   mockECU   │  ║
║   │                 │            │                 │            │ dtcs = []   │  ║
║   └─────────────────┘            └─────────────────┘            └─────────────┘  ║
║                                                                                   ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │  REQUEST:  14 FF FF FF                                                      │ ║
║   │            ├──┤ ├────────┤                                                  │ ║
║   │            SID  groupOfDTC                                                  │ ║
║   │                                                                             │ ║
║   │  • SID 0x14         = Clear Diagnostic Information                          │ ║
║   │  • Group 0xFFFFFF   = All DTCs (all groups)                                 │ ║
║   │  • Group 0x0FFFFF   = Powertrain only                                       │ ║
║   │  • Group 0x010101   = Specific DTC P0101                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                         │                                         ║
║               ┌─────────────────────────┼─────────────────────────┐               ║
║               │                         │                         │               ║
║               ▼ SUCCESS                 ▼ NRC 0x13                ▼ NRC 0x22      ║
║   ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐ ║
║   │  RESPONSE: 54         │  │  RESPONSE: 7F 14 13   │  │  RESPONSE: 7F 14 22   │ ║
║   │                       │  │                       │  │                       │ ║
║   │  Positive Response    │  │  Incorrect Message    │  │  Conditions Not       │ ║
║   │  DTCs Cleared!        │  │  Length (!=3 bytes)   │  │  Correct (Safety Ses) │ ║
║   │                       │  │                       │  │                       │ ║
║   │  54 = 0x14 + 0x40     │  │  7F = NRC prefix      │  │  7F = NRC prefix      │ ║
║   │                       │  │  14 = SID echo        │  │  14 = SID echo        │ ║
║   │                       │  │  13 = NRC code        │  │  22 = NRC code        │ ║
║   └───────────────────────┘  └───────────────────────┘  └───────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           COMPLETE DTC LIFECYCLE SUMMARY                          ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        ║
║   │ NO DTC  │───▶│ INJECT  │───▶│ ACTIVE  │───▶│ DEACT   │───▶│ HISTORIC│        ║
║   │ dtcs=[] │    │ Fault   │    │ TF=1    │    │ TF=0    │    │ CD=1    │        ║
║   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘        ║
║        ▲                                                           │             ║
║        │                        ┌──────────────────────────────────┘             ║
║        │                        │                                                ║
║        │                        ▼                                                ║
║        │              ┌───────────────────┐                                      ║
║        │              │  SID 0x14 CLEAR   │                                      ║
║        │              │  14 FF FF FF      │                                      ║
║        │              │  Response: 54     │                                      ║
║        │              └─────────┬─────────┘                                      ║
║        │                        │                                                ║
║        └────────────────────────┘                                                ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

This means:
- **Reading DTCs (SID 0x19)** returns an empty list until faults are injected
- **DTC count starts at zero** on fresh page load
- **DTCs persist** in memory until cleared (SID 0x14) or page is refreshed

> [!TIP]
> For detailed command formats, NRC exceptions, and architecture diagrams, see [DTC_CREATION_PROCESS.md](./DTC_CREATION_PROCESS.md).

## Prerequisites

Before generating DTCs through fault injection, ensure:
1. Navigate to the **Cluster Dashboard page** (`/UDS-SIMULATION/cluster`)
2. **Ignition is ON** (required for most diagnostics - toggle the ignition switch to ON)
3. **Power supply is stable** (check voltage is nominal ~12-14V)

> [!NOTE]
> Some UDS services (like 0x14 Clear DTC and 0x19 Read DTC) work regardless of ignition state per ISO 14229 standards.

## Available Fault Triggers

The cluster page provides fault triggers organized by automotive system category. Each fault includes complete UDS command/response details.

---

### Powertrain Faults (P-codes)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          P0101 - MAF SENSOR FAULT                                 ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : MAF Sensor                                                   │ ║
║   │ DTC Code     : P0101 (0x010101)                                             │ ║
║   │ Description  : Mass Air Flow Sensor Range/Performance Problem               │ ║
║   │ Severity     : HIGH (0x60 - Check Immediately)                              │ ║
║   │ Category     : Powertrain (⚙️)                                               │ ║
║   │ WIR (MIL)    : YES - Check Engine Light ON                                  │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0xAB                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Bit 7 (WIR)  = 1  │ Warning Indicator Requested (MIL ON)                    │ ║
║   │ Bit 5 (TFS)  = 1  │ Test Failed Since Last Clear                            │ ║
║   │ Bit 3 (CD)   = 1  │ Confirmed DTC                                           │ ║
║   │ Bit 1 (TFT)  = 1  │ Test Failed This Operation Cycle                        │ ║
║   │ Bit 0 (TF)   = 1  │ Test Failed (currently failing)                         │ ║
║   │────────────────────────────────────────────────────────────────────────────│ ║
║   │ Binary: 1010 1011 = 0xAB                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND (SID 0x19 SF 0x02):                                            ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 01 01 01 AB                                              │ ║
║   │           ├──┤    ├────────┤ ├──┤                                           │ ║
║   │          Pos.Rsp  DTC Code   Status                                         │ ║
║   │                                                                             │ ║
║   │ RESPONSE DECODE:                                                            │ ║
║   │ • 59 = Positive response (0x19 + 0x40)                                      │ ║
║   │ • 02 = Subfunction echo                                                     │ ║
║   │ • FF = Status availability mask                                             │ ║
║   │ • 01 01 01 = DTC P0101 (High: 01, Mid: 01, Low: 01)                         │ ║
║   │ • AB = Status byte (TF, TFT, CD, TFS, WIR all set)                          │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS CLEAR COMMAND (SID 0x14):                                                   ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 14 01 01 01   (Clear specific DTC P0101)                          │ ║
║   │ Response: 54            (Success - DTC cleared)                             │ ║
║   │                                                                             │ ║
║   │ Request : 14 FF FF FF   (Clear all DTCs)                                    │ ║
║   │ Response: 54            (Success - All cleared)                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          P0171 - COOLANT SENSOR FAULT                             ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : Coolant Sensor                                               │ ║
║   │ DTC Code     : P0171 (0x010171)                                             │ ║
║   │ Description  : System Too Lean (Bank 1) - Coolant Temp Related              │ ║
║   │ Severity     : MEDIUM (0x40 - Check at Next Halt)                           │ ║
║   │ Category     : Powertrain (⚙️)                                               │ ║
║   │ WIR (MIL)    : NO - No warning light                                        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0x2B                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Bit 5 (TFS)  = 1  │ Test Failed Since Last Clear                            │ ║
║   │ Bit 3 (CD)   = 1  │ Confirmed DTC                                           │ ║
║   │ Bit 1 (TFT)  = 1  │ Test Failed This Operation Cycle                        │ ║
║   │ Bit 0 (TF)   = 1  │ Test Failed (currently failing)                         │ ║
║   │────────────────────────────────────────────────────────────────────────────│ ║
║   │ Binary: 0010 1011 = 0x2B                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 01 01 71 2B                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    P0171     Status=0x2B (no WIR)                           │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          P0300 - MISFIRE FAULT                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : Misfire                                                      │ ║
║   │ DTC Code     : P0300 (0x010300)                                             │ ║
║   │ Description  : Random/Multiple Cylinder Misfire Detected                    │ ║
║   │ Severity     : CRITICAL (0x60 - Check Immediately)                          │ ║
║   │ Category     : Powertrain (⚙️)                                               │ ║
║   │ WIR (MIL)    : YES - Check Engine Light FLASHING                            │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0xAB                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ All critical bits set: TF, TFT, CD, TFS, WIR                                │ ║
║   │ Binary: 1010 1011 = 0xAB                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 01 03 00 AB                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    P0300     Status=0xAB (WIR=1)                            │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          P0562 - FUEL PRESSURE FAULT                              ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : Fuel Pressure                                                │ ║
║   │ DTC Code     : P0562 (0x010562)                                             │ ║
║   │ Description  : System Voltage Low - Fuel Pressure Related                   │ ║
║   │ Severity     : LOW (0x20 - Maintenance Only)                                │ ║
║   │ Category     : Powertrain (⚙️)                                               │ ║
║   │ WIR (MIL)    : NO - No warning light                                        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0x2B                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ TF, TFT, CD, TFS set (no WIR for low severity)                              │ ║
║   │ Binary: 0010 1011 = 0x2B                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 01 05 62 2B                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    P0562     Status=0x2B                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

### Chassis Faults (C-codes) - Brakes/ABS/ESP

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          C0035 - WHEEL SPEED FL FAULT                             ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : Wheel Speed FL                                               │ ║
║   │ DTC Code     : C0035 (0x020035)                                             │ ║
║   │ Description  : Left Front Wheel Speed Sensor Circuit                        │ ║
║   │ Severity     : HIGH (0x60 - Check Immediately)                              │ ║
║   │ Category     : Chassis (🔧)                                                  │ ║
║   │ WIR (MIL)    : YES - ABS Warning Light ON                                   │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0xAB                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ All critical bits: TF=1, TFT=1, CD=1, TFS=1, WIR=1                          │ ║
║   │ Binary: 1010 1011 = 0xAB                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 02 00 35 AB                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    C0035     Status=0xAB                                    │ ║
║   │                                                                             │ ║
║   │ NOTE: DTC byte pattern 02 00 35 decodes as:                                 │ ║
║   │   • Byte 0: 02 = Chassis category (C-code)                                  │ ║
║   │   • Bytes 1-2: 00 35 = Fault code 0035                                      │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          C0045 - ABS PUMP FAULT                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : ABS Pump                                                     │ ║
║   │ DTC Code     : C0045 (0x020045)                                             │ ║
║   │ Description  : ABS Hydraulic Pump Motor Circuit                             │ ║
║   │ Severity     : CRITICAL (0x60 - Check Immediately)                          │ ║
║   │ Category     : Chassis (🔧)                                                  │ ║
║   │ WIR (MIL)    : YES - ABS + BRAKE Warning Lights ON                          │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 02 00 45 AB                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    C0045     Status=0xAB (Critical)                         │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

### Body/Comfort Faults (B-codes)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          B0056 - DOOR SWITCH FAULT                                ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : Door Switch                                                  │ ║
║   │ DTC Code     : B0056 (0x030056)                                             │ ║
║   │ Description  : Driver Seat Position Sensor Circuit (Door Related)           │ ║
║   │ Severity     : LOW (0x20 - Maintenance Only)                                │ ║
║   │ Category     : Body (🚗)                                                     │ ║
║   │ WIR (MIL)    : NO - No warning light                                        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0x2B                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Low severity = No WIR bit set                                               │ ║
║   │ TF=1, TFT=1, CD=1, TFS=1                                                    │ ║
║   │ Binary: 0010 1011 = 0x2B                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 03 00 56 2B                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    B0056     Status=0x2B                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

### Network/CAN Faults (U-codes)

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          U0100 - CAN ENGINE FAULT                                 ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : CAN Engine                                                   │ ║
║   │ DTC Code     : U0100 (0x040100)                                             │ ║
║   │ Description  : Lost Communication With ECM/PCM "A"                          │ ║
║   │ Severity     : HIGH (0x60 - Check Immediately)                              │ ║
║   │ Category     : Network (📡)                                                  │ ║
║   │ WIR (MIL)    : YES - Multiple warning lights possible                       │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE ON ACTIVATION: 0xAB                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Network faults are critical: All bits including WIR                         │ ║
║   │ Binary: 1010 1011 = 0xAB                                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 04 01 00 AB                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    U0100     Status=0xAB                                    │ ║
║   │                                                                             │ ║
║   │ NOTE: DTC byte pattern 04 01 00 decodes as:                                 │ ║
║   │   • Byte 0: 04 = Network category (U-code)                                  │ ║
║   │   • Bytes 1-2: 01 00 = Fault code 0100                                      │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝


╔═══════════════════════════════════════════════════════════════════════════════════╗
║                          U0121 - CAN ABS FAULT                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   FAULT INFO:                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Toggle Name  : CAN ABS                                                      │ ║
║   │ DTC Code     : U0121 (0x040121)                                             │ ║
║   │ Description  : Lost Communication With ABS Control Module                   │ ║
║   │ Severity     : HIGH (0x60 - Check Immediately)                              │ ║
║   │ Category     : Network (📡)                                                  │ ║
║   │ WIR (MIL)    : YES - ABS Warning Light ON                                   │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   UDS READ COMMAND:                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Request : 19 02 FF                                                          │ ║
║   │ Response: 59 02 FF 04 01 21 AB                                              │ ║
║   │                    ├────────┤ ├──┤                                          │ ║
║   │                    U0121     Status=0xAB                                    │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

### Response Code Reference

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         UDS RESPONSE CODE REFERENCE                               ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║   POSITIVE RESPONSES:                                                             ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Code │ Service      │ Meaning                                               │ ║
║   │──────┼──────────────┼───────────────────────────────────────────────────────│ ║
║   │ 54   │ SID 0x14     │ Clear DTC - Success (0x14 + 0x40 = 0x54)              │ ║
║   │ 59   │ SID 0x19     │ Read DTC - Success (0x19 + 0x40 = 0x59)               │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   NEGATIVE RESPONSES (7F [SID] [NRC]):                                            ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ NRC  │ Name                        │ Cause & Solution                       │ ║
║   │──────┼─────────────────────────────┼────────────────────────────────────────│ ║
║   │ 0x12 │ Sub-Function Not Supported  │ Invalid subfunction for SID 0x19       │ ║
║   │      │                             │ → Use valid SF: 01,02,03,04,06,09,0A   │ ║
║   │──────┼─────────────────────────────┼────────────────────────────────────────│ ║
║   │ 0x13 │ Incorrect Message Length    │ Wrong number of data bytes             │ ║
║   │      │                             │ → SID 0x14 needs exactly 3 bytes       │ ║
║   │      │                             │ → SID 0x19 SF 0x02 needs 1 byte (mask) │ ║
║   │──────┼─────────────────────────────┼────────────────────────────────────────│ ║
║   │ 0x22 │ Conditions Not Correct      │ Operation blocked by current state     │ ║
║   │      │                             │ → Safety Session blocks SID 0x14       │ ║
║   │      │                             │ → Switch to Default/Extended session   │ ║
║   │──────┼─────────────────────────────┼────────────────────────────────────────│ ║
║   │ 0x31 │ Request Out of Range        │ DTC not found for snapshot/ext request │ ║
║   │      │                             │ → Verify DTC exists with SF 0x02 first │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   STATUS BYTE BIT DEFINITIONS:                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Bit │ Abbr │ Name                              │ Meaning                     │ ║
║   │─────┼──────┼───────────────────────────────────┼─────────────────────────────│ ║
║   │  0  │ TF   │ Test Failed                       │ Currently failing           │ ║
║   │  1  │ TFT  │ Test Failed This Operation Cycle  │ Failed this drive cycle     │ ║
║   │  2  │ PD   │ Pending DTC                       │ Awaiting confirmation       │ ║
║   │  3  │ CD   │ Confirmed DTC                     │ Fault is confirmed          │ ║
║   │  4  │ TNCL │ Test Not Completed Since Clear    │ Not tested yet              │ ║
║   │  5  │ TFS  │ Test Failed Since Last Clear      │ Has failed since clear      │ ║
║   │  6  │ TNCT │ Test Not Completed This Cycle     │ Not tested this cycle       │ ║
║   │  7  │ WIR  │ Warning Indicator Requested       │ MIL/Warning light ON        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
║   COMMON STATUS BYTE VALUES:                                                      ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │ Value │ Binary     │ Bits Set        │ Interpretation                       │ ║
║   │───────┼────────────┼─────────────────┼──────────────────────────────────────│ ║
║   │ 0xAB  │ 1010 1011  │ WIR,TFS,CD,TFT,TF│ Critical active fault with MIL      │ ║
║   │ 0x2B  │ 0010 1011  │ TFS,CD,TFT,TF   │ Active fault, no warning light       │ ║
║   │ 0x28  │ 0010 1000  │ TFS,CD          │ Historic fault (no longer failing)   │ ║
║   │ 0x00  │ 0000 0000  │ (none)          │ Cleared/no fault                     │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

> [!TIP]
> Start with **low-severity faults** (e.g., P0562 System Voltage Low) to understand the basics before testing critical faults.

## Step-by-Step: Generating a DTC

### Example: Generating P0101 - MAF Sensor Fault

Follow these steps to generate and verify a diagnostic trouble code:

#### Step 1: Set Operating Conditions (Optional but Recommended)

Set realistic vehicle operating conditions to generate meaningful freeze frame data:

1. Navigate to the **Operating Conditions** panel
2. Adjust sliders:
   - **Engine RPM**: 2500
   - **Speed**: 65 km/h
   - **Coolant**: 92°C
   - **Fuel Level**: 60%
3. Click **Apply Operating Conditions** button

> [!NOTE]
> These conditions will be captured in the DTC's **freeze frame** (snapshot) data when the fault is injected.

#### Step 2: Trigger the Fault

1. Locate the **Faults** panel on the right side of the cluster page
2. Expand the **Powertrain** section
3. Toggle **MAF Sensor** switch to ON (it will turn red)
4. Click the **Inject** button at the bottom of the Faults panel

You should see console logs confirming the DTC activation:
```
DTC 0x010101 ACTIVATED - Mass Air Flow Sensor Range/Performance Problem
```

#### Step 3: Verify DTC was Generated

Use the **DTC Management Panel** to verify the DTC was created:

1. Locate the **DTC Management** panel below the cluster (or scroll down)
2. Click the **Read All** button (uses UDS Service 0x19, Subfunction 0x02)
3. The DTC list will update, showing:
   - **DTC Code**: P0101
   - **Status**: Confirmed DTC, Test Failed
   - **Category**: Powertrain (⚙️ icon)
   - **Severity**: High (orange/yellow badge)
   - **Description**: Mass Air Flow Sensor Range/Performance Problem

#### Step 4: Inspect Freeze Frame Data

To view the captured freeze frame (snapshot) data:

1. Click on the **P0101 DTC card** to expand it
2. Scroll to the **Status Byte** visualization section:
   - Observe which bits are set (e.g., TF=1, CD=1, TFT=1, TFS=1, WIR=1)
3. View **Counters**:
   - **Occurrences**: Number of times this fault occurred
   - **Aging Counter**: How long the DTC has been inactive
4. Click the **Read Snapshot** button (uses SID 0x19, Subfunction 0x04)
5. View freeze frame data showing vehicle conditions when fault occurred:
   - Vehicle Speed: 65 km/h
   - Engine RPM: 2500
   - Coolant Temp: 92°C
   - Battery Voltage, Fuel Level, Oil Pressure, etc.

> [!NOTE]
> Freeze frame data helps technicians diagnose the root cause by showing vehicle operating conditions when the fault occurred.

## Advanced Scenarios

### Generating Multiple DTCs Simultaneously

You can inject multiple faults at once to simulate complex failure scenarios:

1. Toggle multiple fault switches ON across different categories:
   - Powertrain: **MAF Sensor** + **Misfire**
   - Chassis: **Wheel Speed FL**
   - Network: **CAN Engine**
2. Click **Inject** button
3. Run **Read All** in DTC Management Panel
4. Observe **4 DTCs** with different categories and severities

### Simulating Intermittent Faults

To simulate a fault that comes and goes:

1. Inject a fault (e.g., **MAF Sensor**)
2. Read DTCs - observe **Test Failed = true**
3. Toggle the fault switch OFF
4. Click **Inject** again
5. Read DTCs - observe:
   - **Test Failed = false** (fault no longer present)
   - **Confirmed DTC = true** (historic evidence of fault)
   - **Aging Counter** increments (DTC is aging out)

> [!TIP]
> Intermittent faults are common in real vehicles. This behavior matches ISO 14229 DTC aging logic.

### DTC History Mode 

**History mode** is a critical feature that preserves diagnostic evidence even after a fault is no longer active:

**How It Works:**
1. **Active Fault** → DTC status shows: `testFailed: true`, `confirmedDTC: true`
2. **Fault Deactivated** → DTC transitions to history mode: `testFailed: false`, `confirmedDTC: true`
3. **Aging Process** → DTC remains in memory with incrementing aging counter
4. **Manual Clear** → DTC removed completely using SID 0x14

**Status Byte Changes in History Mode:**

| Bit | Active Fault | History Mode | Cleared |
|-----|--------------|--------------|---------|
| Bit 0 (TF) | 1 | 0 | N/A |
| Bit 3 (CD) | 1 | 1 | N/A |
| Aging Counter | 0 | 1+ | N/A |

**Testing History Mode:**
```
1. Inject fault  "MAF Sensor" ON → Click "Inject"
2. Read DTCs → Observe: testFailed=1, confirmedDTC=1
3. Remove fault → "MAF Sensor" OFF → Click "Inject"  
4. Read DTCs → Observe: testFailed=0, confirmedDTC=1 ✅ Historic!
5. "Confirmed Only" filter still shows this DTC
```

> [!IMPORTANT]
> Historic DTCs are crucial for warranty claims and diagnosis. They prove a fault occurred even if it's intermittent. Only clear DTCs after confirming repairs are complete.

### Testing DTC Clearing Procedures

Test the **SID 0x14 Clear Diagnostic Information** service:

1. Generate one or more DTCs using fault injection
2. Verify DTCs exist using **Read All** button
3. Click **Clear All DTCs** button (uses SID 0x14 with groupOfDTC 0xFFFFFF)
4. Click **Read All** again
5. Verify DTC list is **empty**

> [!WARNING]
> Clearing DTCs removes all diagnostic history, including freeze frames and extended data. In real vehicles, this should only be done after repairs are complete.

## Understanding DTC Status Byte

When you inject a fault, the DTC's **status byte** is updated according to ISO 14229-1:

| Bit | Name | Description | Set on Inject? |
|-----|------|-------------|----------------|
| **Bit 0** | TF | Test Failed | ✅ Yes |
| **Bit 1** | TFT | Test Failed This Operation Cycle | ✅ Yes |
| **Bit 2** | PD | Pending DTC | ❌ No (set on 2nd occurrence) |
| **Bit 3** | CD | Confirmed DTC | ✅ Yes |
| **Bit 4** | TNC | Test Not Completed Since Last Clear | ❌ No |
| **Bit 5** | TFS | Test Failed Since Last Clear | ✅ Yes |
| **Bit 6** | TNC | Test Not Completed This Cycle | ❌ No |
| **Bit 7** | WIR | Warning Indicator Requested | ✅ Yes (for high/critical) |

View this in the DTC Management Panel by expanding any DTC and observing the colored bit visualization.

## Integration with UDS Services

### Reading DTCs (SID 0x19)

After injecting faults, practice these SID 0x19 subfunctions:

| Button | Subfunction | Description |
|--------|-------------|-------------|
| **Count All** | 0x01 | Count DTCs matching status mask 0xFF |
| **Read All** | 0x02 | Read all DTCs with status bytes |
| **Confirmed Only** | 0x08 (mask) | Read only confirmed DTCs |
| **Pending Only** | 0x04 (mask) | Read only pending DTCs |
| **Supported DTCs** | 0x0A | List all DTCs the ECU can detect |

See [SID_19_READ_DTC_INFORMATION.md](./SID_19_READ_DTC_INFORMATION.md) for complete reference.

### Clearing DTCs (SID 0x14)

The **Clear All DTCs** button sends:
```
Request: 14 FF FF FF
         │  └──┴──┴── groupOfDTC (0xFFFFFF = all DTCs)
         └── SID 0x14

Response: 54
          └── Positive response (0x40 + 0x14)
```

See [SID_14_CLEAR_DIAGNOSTIC_INFORMATION.md](./SID_14_CLEAR_DIAGNOSTIC_INFORMATION.md) for complete reference.

## Troubleshooting

### DTCs Not Appearing After Injection

**Possible Causes:**
1. **Ignition is OFF** - Turn ignition to ON position
2. **Fault not clicked "Inject"** - Remember to click the Inject button after toggling faults
3. **DTC already existed** - The occurrence counter increments, but you'll still see it

**Solution:**
- Refresh the page and try again
- Check browser console for error messages

### Status Bits Don't Match Expected Values

Some status bits require multiple occurrence cycles or specific conditions:
- **Pending DTC (Bit 2)**: Typically set on 2nd occurrence, not 1st
- **Test Not Completed**: Requires drive cycle completion logic (simplified in simulator)

### Cannot Clear DTCs

**Possible Causes:**
1. **Safety Session Active** - SID 0x14 is blocked in Safety Session (0x04)
2. **ECU Power OFF** - Ensure power supply is ON

**Solution:**
- Switch to Default Session (0x01) or Extended Session (0x03)
- Toggle ECU power ON in Power Supply Dashboard

## Real-World Application

This fault injection system simulates real diagnostic scenarios:

### Typical Workshop Workflow

1. **Customer Complaint**: "Check engine light is on"
2. **Initial Scan**: Technician uses **Read All DTCs** (SID 0x19-02)
3. **Diagnosis**: Reviews freeze frame data to understand operating conditions
4. **Repair**: Fixes the root cause (e.g., replaces MAF sensor)
5. **Verification**: Uses **Clear All DTCs** (SID 0x14)
6. **Road Test**: Confirms fault does not return

### Training Scenarios

Use fault injection for training exercises:
- **Scenario 1**: Multiple misfires (P0300) - practice diagnosing ignition system
- **Scenario 2**: Network fault (U0100) - practice CAN bus troubleshooting
- **Scenario 3**: ABS fault (C0035) - practice wheel speed sensor diagnosis

## Summary

| Action | Location | UDS Service |
|--------|----------|-------------|
| **Inject Fault** | Cluster Page → Faults Panel → Toggle + Inject button | N/A (simulation) |
| **Read DTCs** | DTC Management Panel → Read All button | SID 0x19, Subfunction 0x02 |
| **View Freeze Frame** | DTC Management Panel → Expand DTC → Read Snapshot | SID 0x19, Subfunction 0x04 |
| **Clear DTCs** | DTC Management Panel → Clear All DTCs button | SID 0x14 |

## Related Documentation

- [DTC_CREATION_PROCESS.md](./DTC_CREATION_PROCESS.md) - **Technical reference with architecture diagrams, command formats, and NRC exceptions**
- [DTC_FUNDAMENTALS.md](./DTC_FUNDAMENTALS.md) - Deep dive into DTC structure and ISO standards
- [DTC_INTERPRETATION_GUIDE.md](./DTC_INTERPRETATION_GUIDE.md) - How to analyze DTCs like a pro
- [SID_19_PRACTICAL_IMPLEMENTATION.md](./SID_19_PRACTICAL_IMPLEMENTATION.md) - Advanced SID 0x19 usage
- [DTC_CLEARING_PROCEDURES.md](./DTC_CLEARING_PROCEDURES.md) - Best practices for clearing DTCs

## Next Steps

1. **Practice the basic flow**: Inject → Read → Clear
2. **Experiment with different fault combinations**
3. **Study freeze frame data patterns** for different operating conditions
4. **Try intermittent fault scenarios** to understand aging logic
5. **Integrate with other UDS services** (e.g., SID 0x27 Security Access before write operations)
