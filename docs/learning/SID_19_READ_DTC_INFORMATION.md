# SID 19: Read DTC Information

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 10.8

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Message Format Visualization](#message-format-visualization)
3. [Subfunctions Reference](#subfunctions-reference)
4. [DTC Status Byte Breakdown](#dtc-status-byte-breakdown)
5. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
6. [Session and Security Requirements](#session-and-security-requirements)
7. [Service Interaction Map](#service-interaction-map)
8. [ISO 14229-1 Reference](#iso-14229-1-reference)

---

## Service Overview

### Purpose
**Read DTC Information** (Service ID `0x19`) allows the tester to retrieve Diagnostic Trouble Code (DTC) information from the ECU's memory. This includes DTC numbers, status bytes, snapshot data, and extended data records.

### Key Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│  SERVICE IDENTIFIER: 0x19                                   │
│  POSITIVE RESPONSE: 0x59                                    │
│  SESSION REQUIRED: DEFAULT or EXTENDED or PROGRAMMING       │
│  SECURITY REQUIRED: NO (for most subfunctions)              │
│  SUPPORTS SUBFUNCTIONS: YES (26+ subfunctions)              │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

```
        ┌──────────────────────────────────┐
        │   SID 0x19 Use Cases             │
        └───────────┬──────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│ Diagnostics   │      │ Maintenance   │
├───────────────┤      ├───────────────┤
│ • Read active │      │ • History     │
│   faults      │      │   review      │
│ • Check MIL   │      │ • Trend       │
│   status      │      │   analysis    │
│ • Emissions   │      │ • Repair      │
│   testing     │      │   validation  │
└───────────────┘      └───────────────┘
```

---

## Message Format Visualization

### Request Message Structure

```
┌────────────────────────────────────────────────────────────────┐
│ READ DTC INFORMATION - REQUEST                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0: Service ID (SID)                                      │
│          ┌────────┐                                            │
│          │  0x19  │                                            │
│          └────────┘                                            │
│                                                                │
│  Byte 1: SubFunction (DTCReportType)                           │
│          ┌────────┐                                            │
│          │  0xXX  │  ← Determines what DTC info to return      │
│          └────────┘                                            │
│                                                                │
│  Byte 2+: Additional Parameters (subfunction-dependent)        │
│          ┌────────┬────────┬────────┬─────┐                   │
│          │ Param1 │ Param2 │ Param3 │ ... │                   │
│          └────────┴────────┴────────┴─────┘                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Positive Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│ READ DTC INFORMATION - POSITIVE RESPONSE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0: Positive Response SID                                 │
│          ┌────────┐                                            │
│          │  0x59  │  (0x19 + 0x40)                             │
│          └────────┘                                            │
│                                                                │
│  Byte 1: SubFunction Echo (DTCReportType)                      │
│          ┌────────┐                                            │
│          │  0xXX  │  ← Same as request                         │
│          └────────┘                                            │
│                                                                │
│  Byte 2: DTCStatusAvailabilityMask                             │
│          ┌────────┐                                            │
│          │  0xYY  │  ← Indicates which status bits are valid   │
│          └────────┘                                            │
│                                                                │
│  Byte 3+: DTC Data (format depends on subfunction)             │
│          ┌─────────────────────────────────────┐               │
│          │  DTC 1 (3 bytes) + Status (1 byte)  │               │
│          ├─────────────────────────────────────┤               │
│          │  DTC 2 (3 bytes) + Status (1 byte)  │               │
│          ├─────────────────────────────────────┤               │
│          │  ...                                │               │
│          └─────────────────────────────────────┘               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Negative Response Structure

```
┌────────────────────────────────────────────────────────────────┐
│ READ DTC INFORMATION - NEGATIVE RESPONSE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Byte 0: Negative Response SID                                 │
│          ┌────────┐                                            │
│          │  0x7F  │                                            │
│          └────────┘                                            │
│                                                                │
│  Byte 1: Requested SID (Echo)                                  │
│          ┌────────┐                                            │
│          │  0x19  │                                            │
│          └────────┘                                            │
│                                                                │
│  Byte 2: Negative Response Code (NRC)                          │
│          ┌────────┐                                            │
│          │  0xXX  │  ← Error code (see NRC section)            │
│          └────────┘                                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Subfunctions Reference

### Common Subfunctions Overview

```
┌──────┬──────────────────────────────────────────┬──────────────┐
│ Hex  │ Subfunction Name                         │ Typical Use  │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x01 │ reportNumberOfDTCByStatusMask            │ Count DTCs   │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x02 │ reportDTCByStatusMask                    │ List DTCs    │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x03 │ reportDTCSnapshotIdentification          │ Snapshot IDs │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x04 │ reportDTCSnapshotRecordByDTCNumber       │ Get snapshot │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x06 │ reportDTCExtDataRecordByDTCNumber        │ Extended data│
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x08 │ reportDTCBySeverityMaskRecord            │ By severity  │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x0A │ reportSupportedDTC                       │ All DTCs     │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x0F │ reportMirrorMemoryDTCByStatusMask        │ Mirror mem   │
├──────┼──────────────────────────────────────────┼──────────────┤
│ 0x13 │ reportEmissionsRelatedOBDDTCByStatusMask │ OBD/Emissions│
└──────┴──────────────────────────────────────────┴──────────────┘
```

### Subfunction Parameter Patterns

```
PATTERN 1: By Status Mask
┌────────────────────────────────────────┐
│ Request:                               │
│ ┌──────┬──────────┬──────────────┐    │
│ │ 0x19 │ 0x01/02  │ StatusMask   │    │
│ └──────┴──────────┴──────────────┘    │
│                                        │
│ StatusMask filters DTCs by status:     │
│  0x00 = All DTCs                       │
│  0x08 = Test failed                    │
│  0x04 = Confirmed                      │
└────────────────────────────────────────┘

PATTERN 2: By DTC Number
┌────────────────────────────────────────┐
│ Request:                               │
│ ┌──────┬──────┬───────────────────┐   │
│ │ 0x19 │ 0x04 │ DTC (3 bytes)     │   │
│ └──────┴──────┴───────────────────┘   │
│                  │                     │
│                  └─ Example: P0301    │
│                     0x01 0x03 0x01    │
└────────────────────────────────────────┘

PATTERN 3: No Parameters
┌────────────────────────────────────────┐
│ Request:                               │
│ ┌──────┬──────┐                        │
│ │ 0x19 │ 0x0A │                        │
│ └──────┴──────┘                        │
│                                        │
│ Returns all supported DTCs             │
└────────────────────────────────────────┘
```

---

## DTC Status Byte Breakdown

### Status Byte Bit Definition

```
┌─────────────────────────────────────────────────────────────────┐
│ DTC STATUS BYTE (1 byte = 8 bits)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0 │
│  ┌────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │ TF │ TFTOC│ PDTC │ CDTC │ TNCSLC│ TFSLC│ TNCTOC│ WIR │       │
│  └────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│                                                                 │
│  Bit 0: WIR    - Warning Indicator Requested                    │
│  Bit 1: TNCTOC - Test Not Completed This Operation Cycle        │
│  Bit 2: TFSLC  - Test Failed Since Last Clear                   │
│  Bit 3: TNCSLC - Test Not Completed Since Last Clear            │
│  Bit 4: CDTC   - Confirmed DTC                                  │
│  Bit 5: PDTC   - Pending DTC                                    │
│  Bit 6: TFTOC  - Test Failed This Operation Cycle               │
│  Bit 7: TF     - Test Failed                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Status Byte Examples

```
EXAMPLE 1: Active Confirmed Fault
┌────────────────────────────────────────┐
│ Status Byte: 0x4C (binary: 01001100)  │
├────────────────────────────────────────┤
│                                        │
│  Bit 7 (TF):     0  ← Not failed now   │
│  Bit 6 (TFTOC):  1  ← Failed this cycle│
│  Bit 5 (PDTC):   0  ← Not pending      │
│  Bit 4 (CDTC):   0  ← Not confirmed    │
│  Bit 3 (TNCSLC): 1  ← Test incomplete  │
│  Bit 2 (TFSLC):  1  ← Failed since clr │
│  Bit 1 (TNCTOC): 0  ← Test completed   │
│  Bit 0 (WIR):    0  ← No warning light │
│                                        │
│ Interpretation: Recently failed fault  │
└────────────────────────────────────────┘

EXAMPLE 2: Pending DTC (Not Yet Confirmed)
┌────────────────────────────────────────┐
│ Status Byte: 0x20 (binary: 00100000)  │
├────────────────────────────────────────┤
│                                        │
│  Bit 7 (TF):     0  ← Not failed       │
│  Bit 6 (TFTOC):  0  ← Not this cycle   │
│  Bit 5 (PDTC):   1  ← ✓ PENDING        │
│  Bit 4 (CDTC):   0  ← Not confirmed    │
│  Bit 3 (TNCSLC): 0  ← Test complete    │
│  Bit 2 (TFSLC):  0  ← Not failed yet   │
│  Bit 1 (TNCTOC): 0  ← Test completed   │
│  Bit 0 (WIR):    0  ← No warning       │
│                                        │
│ Interpretation: Fault detected once,   │
│                 waiting for confirmation│
└────────────────────────────────────────┘

EXAMPLE 3: Confirmed DTC with MIL On
┌────────────────────────────────────────┐
│ Status Byte: 0xD9 (binary: 11011001)  │
├────────────────────────────────────────┤
│                                        │
│  Bit 7 (TF):     1  ← ✓ FAILED         │
│  Bit 6 (TFTOC):  1  ← ✓ This cycle     │
│  Bit 5 (PDTC):   0  ← Not pending      │
│  Bit 4 (CDTC):   1  ← ✓ CONFIRMED      │
│  Bit 3 (TNCSLC): 1  ← Test incomplete  │
│  Bit 2 (TFSLC):  0  ← Passed since clr │
│  Bit 1 (TNCTOC): 0  ← Test completed   │
│  Bit 0 (WIR):    1  ← ✓ MIL ON         │
│                                        │
│ Interpretation: Active confirmed fault │
│                 with check engine light│
└────────────────────────────────────────┘
```

### Status Availability Mask

```
┌─────────────────────────────────────────────────────────────────┐
│ DTCStatusAvailabilityMask                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Indicates which status bits the ECU supports:                   │
│                                                                 │
│  Mask: 0xFF (binary: 11111111)                                  │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┐                                             │
│  │1│1│1│1│1│1│1│1│  ← All bits supported                       │
│  └─┴─┴─┴─┴─┴─┴─┴─┘                                             │
│                                                                 │
│  Mask: 0x4F (binary: 01001111)                                  │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┐                                             │
│  │0│1│0│0│1│1│1│1│                                             │
│  └─┴─┴─┴─┴─┴─┴─┴─┘                                             │
│   │ │ │ │ │ │ │ └─ Bit 0: WIR supported                        │
│   │ │ │ │ │ │ └─── Bit 1: TNCTOC supported                     │
│   │ │ │ │ │ └───── Bit 2: TFSLC supported                      │
│   │ │ │ │ └─────── Bit 3: TNCSLC supported                     │
│   │ │ │ └───────── Bit 4: CDTC NOT supported                   │
│   │ │ └─────────── Bit 5: PDTC NOT supported                   │
│   │ └───────────── Bit 6: TFTOC supported                      │
│   └─────────────── Bit 7: TF NOT supported                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### NRC 0x12: Sub-Function Not Supported

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x12: Sub-Function Not Supported                        │
├────────────────────────────────────────────────────────────────┤
│ Response: 7F 19 12                                             │
│                                                                │
│ WHAT IT MEANS:                                                 │
│ The requested DTC report type (subfunction) is not             │
│ implemented in this ECU.                                       │
│                                                                │
│ COMMON CAUSES:                                                 │
│ • Requested subfunction 0x08 (severity) - not all ECUs support │
│ • Requested mirror memory (0x0F) - feature not available       │
│ • Requested extended data record - ECU doesn't store it        │
│ • Invalid subfunction value sent                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Requesting Unsupported Type  │
├────────────────────────────────────────┤
│  Tester                  ECU           │
│    │                      │            │
│    │  19 08 00 00         │            │
│    │─────────────────────>│            │
│    │    (Severity mask)   │            │
│    │                      │            │
│    │  7F 19 12            │            │
│    │<─────────────────────│            │
│    │  (Not supported)     │            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Use Supported Subfunctions │
├────────────────────────────────────────┤
│  Tester                  ECU           │
│    │                      │            │
│    │  19 02 08            │            │
│    │─────────────────────>│            │
│    │  (Standard list)     │            │
│    │                      │            │
│    │  59 02 4F [DTCs...]  │            │
│    │<─────────────────────│            │
│    │  ✓ Success           │            │
└────────────────────────────────────────┘
```

### NRC 0x13: Incorrect Message Length or Invalid Format

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x13: Incorrect Message Length or Invalid Format        │
├────────────────────────────────────────────────────────────────┤
│ Response: 7F 19 13                                             │
│                                                                │
│ WHAT IT MEANS:                                                 │
│ The request message has wrong number of bytes or               │
│ malformed parameters.                                          │
│                                                                │
│ COMMON CAUSES:                                                 │
│ • Missing status mask byte (SF 0x02 needs 1 byte)              │
│ • Missing DTC number (SF 0x04 needs 3 bytes for DTC)           │
│ • Extra unexpected bytes in message                            │
│ • Snapshot record number missing                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Missing Status Mask          │
├────────────────────────────────────────┤
│  Request:                              │
│  ┌──────┬──────┐                       │
│  │ 0x19 │ 0x02 │  ← Missing mask!      │
│  └──────┴──────┘                       │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┐                │
│  │ 0x7F │ 0x19 │ 0x13 │                │
│  └──────┴──────┴──────┘                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Complete Message           │
├────────────────────────────────────────┤
│  Request:                              │
│  ┌──────┬──────┬──────┐                │
│  │ 0x19 │ 0x02 │ 0x08 │  ✓ Has mask   │
│  └──────┴──────┴──────┘                │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┬─────────┐     │
│  │ 0x59 │ 0x02 │ 0x4F │ DTCs... │     │
│  └──────┴──────┴──────┴─────────┘     │
└────────────────────────────────────────┘
```

### NRC 0x22: Conditions Not Correct

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x22: Conditions Not Correct                            │
├────────────────────────────────────────────────────────────────┤
│ Response: 7F 19 22                                             │
│                                                                │
│ WHAT IT MEANS:                                                 │
│ The request is valid but current ECU conditions prevent        │
│ processing (e.g., vehicle moving, engine running).             │
│                                                                │
│ COMMON CAUSES:                                                 │
│ • DTC memory being cleared (SID 0x14 in progress)              │
│ • Vehicle speed > 0 (some subfunctions require stationary)     │
│ • Engine running (some data only available when off)           │
│ • System calibration in progress                               │
│ • Fault memory locked by another operation                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Reading During Clear         │
├────────────────────────────────────────┤
│  Time: T0                              │
│  ┌──────┬──────┬────────────┐          │
│  │ 0x14 │ 0xFF │ 0xFF 0xFF  │          │
│  └──────┴──────┴────────────┘          │
│  (Clear DTCs - takes 2 seconds)        │
│                                        │
│  Time: T0 + 500ms                      │
│  ┌──────┬──────┬──────┐                │
│  │ 0x19 │ 0x02 │ 0x08 │                │
│  └──────┴──────┴──────┘                │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┐                │
│  │ 0x7F │ 0x19 │ 0x22 │                │
│  └──────┴──────┴──────┘                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Wait for Clear Complete    │
├────────────────────────────────────────┤
│  Time: T0                              │
│  Clear DTCs (SID 0x14)                 │
│  Wait 3 seconds...                     │
│                                        │
│  Time: T0 + 3s                         │
│  ┌──────┬──────┬──────┐                │
│  │ 0x19 │ 0x02 │ 0x08 │                │
│  └──────┴──────┴──────┘                │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┬──────┐        │
│  │ 0x59 │ 0x02 │ 0x4F │ (No DTCs) │   │
│  └──────┴──────┴──────┴──────┘        │
│  ✓ Success - memory cleared            │
└────────────────────────────────────────┘
```

### NRC 0x31: Request Out of Range

```
┌────────────────────────────────────────────────────────────────┐
│ ❌ NRC 0x31: Request Out of Range                              │
├────────────────────────────────────────────────────────────────┤
│ Response: 7F 19 31                                             │
│                                                                │
│ WHAT IT MEANS:                                                 │
│ The requested DTC, record number, or parameter value           │
│ is outside the valid range.                                    │
│                                                                │
│ COMMON CAUSES:                                                 │
│ • DTC number doesn't exist in ECU (e.g., P0999)                │
│ • Snapshot record number out of range (e.g., 0xFE)             │
│ • Extended data record number invalid                          │
│ • Severity mask value not supported                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ❌ WRONG: Invalid DTC Number           │
├────────────────────────────────────────┤
│  Request: Read snapshot for P9999      │
│  ┌──────┬──────┬──────────────────┐    │
│  │ 0x19 │ 0x04 │ 0x99 0x99 0x99   │    │
│  └──────┴──────┴──────────────────┘    │
│             (Non-existent DTC)         │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┐                │
│  │ 0x7F │ 0x19 │ 0x31 │                │
│  └──────┴──────┴──────┘                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Valid DTC from List        │
├────────────────────────────────────────┤
│  Step 1: Get supported DTCs            │
│  ┌──────┬──────┐                       │
│  │ 0x19 │ 0x0A │                       │
│  └──────┴──────┘                       │
│  Response: List includes P0301         │
│                                        │
│  Step 2: Request valid DTC             │
│  ┌──────┬──────┬──────────────────┐    │
│  │ 0x19 │ 0x04 │ 0x01 0x03 0x01   │    │
│  └──────┴──────┴──────────────────┘    │
│             (P0301 - exists)           │
│                                        │
│  Response:                             │
│  ┌──────┬──────┬──────┬─────────┐     │
│  │ 0x59 │ 0x04 │ 0x4F │ Data... │     │
│  └──────┴──────┴──────┴─────────┘     │
│  ✓ Success                             │
└────────────────────────────────────────┘
```

### NRC 0x78: Request Correctly Received - Response Pending

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️  NRC 0x78: Request Correctly Received - Response Pending    │
├────────────────────────────────────────────────────────────────┤
│ Response: 7F 19 78                                             │
│                                                                │
│ WHAT IT MEANS:                                                 │
│ The request is valid and being processed, but takes time.      │
│ ECU will send final response when ready.                       │
│                                                                │
│ COMMON CAUSES:                                                 │
│ • Reading large number of DTCs (e.g., 0x0A - all DTCs)         │
│ • Collecting snapshot data from multiple sensors               │
│ • Processing extended data records                             │
│ • Calculating DTC severity information                         │
│                                                                │
│ NOTE: This is NOT an error - wait for final response!          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ EXPECTED: Response Pending Flow     │
├────────────────────────────────────────┤
│  Tester                  ECU           │
│    │                      │            │
│    │  19 0A               │            │
│    │─────────────────────>│            │
│    │  (Get all DTCs)      │            │
│    │                      │            │
│    │  7F 19 78            │            │
│    │<─────────────────────│            │
│    │  (Processing...)     │            │
│    │                      │            │
│    │  ... wait ...        │            │
│    │                      │            │
│    │  7F 19 78            │            │
│    │<─────────────────────│            │
│    │  (Still working...)  │            │
│    │                      │            │
│    │  59 0A 4F [200 DTCs] │            │
│    │<─────────────────────│            │
│    │  ✓ Final response    │            │
│                                        │
│ TIMING:                                │
│ • First 0x78: ~50ms                    │
│ • Repeat 0x78: Every 2-5 seconds       │
│ • Final response: When ready           │
└────────────────────────────────────────┘
```

### NRC Quick Reference Table

```
┌──────┬─────────────────────────────────┬──────────────────────┐
│ NRC  │ Name                            │ Typical Cause        │
├──────┼─────────────────────────────────┼──────────────────────┤
│ 0x12 │ Sub-Function Not Supported      │ Invalid subfunction  │
├──────┼─────────────────────────────────┼──────────────────────┤
│ 0x13 │ Incorrect Message Length        │ Missing parameters   │
├──────┼─────────────────────────────────┼──────────────────────┤
│ 0x22 │ Conditions Not Correct          │ ECU busy/wrong state │
├──────┼─────────────────────────────────┼──────────────────────┤
│ 0x31 │ Request Out of Range            │ Invalid DTC/record   │
├──────┼─────────────────────────────────┼──────────────────────┤
│ 0x78 │ Response Pending                │ Processing (OK)      │
└──────┴─────────────────────────────────┴──────────────────────┘
```

---

## Session and Security Requirements

### Session State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ SID 0x19 SESSION REQUIREMENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌──────────────────┐                                    │
│         │ DEFAULT SESSION  │                                    │
│         │   (0x01)         │                                    │
│         └────────┬─────────┘                                    │
│                  │                                              │
│        ┌─────────┴─────────┐                                    │
│        │                   │                                    │
│        ▼                   ▼                                    │
│  ┌──────────┐        ┌──────────┐                              │
│  │ 0x19 0x02│        │ 0x19 0x01│                              │
│  │ List DTCs│        │Count DTCs│                              │
│  └────┬─────┘        └─────┬────┘                              │
│       │                    │                                    │
│       └────────┬───────────┘                                    │
│                │                                                │
│                ▼                                                │
│         ✅ ALLOWED                                              │
│                                                                 │
│ Most subfunctions work in DEFAULT session                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ EXTENDED SESSION ACCESS                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     SID 0x10 0x03    ┌──────────────────┐    │
│  │   DEFAULT    │────────────────────>  │ EXTENDED SESSION │    │
│  │   SESSION    │                       │   (0x03)         │    │
│  └──────────────┘                       └─────────┬────────┘    │
│                                                   │              │
│                                                   │              │
│                         ┌─────────────────────────┘              │
│                         │                                        │
│                         ▼                                        │
│                   ┌──────────┐                                   │
│                   │ 0x19 0x06│                                   │
│                   │ Extended │  ← May require extended session   │
│                   │   Data   │     (ECU-dependent)               │
│                   └──────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Access Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│ SECURITY REQUIREMENTS FOR SID 0x19                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MOST SUBFUNCTIONS:                                             │
│  ┌────────────────────────────────────┐                         │
│  │ Security: NOT REQUIRED 🔓          │                         │
│  ├────────────────────────────────────┤                         │
│  │ • 0x01 - Count DTCs                │                         │
│  │ • 0x02 - List DTCs                 │                         │
│  │ • 0x03 - Snapshot IDs              │                         │
│  │ • 0x04 - Read snapshot             │                         │
│  │ • 0x0A - Supported DTCs            │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
│  SOME SUBFUNCTIONS (ECU-DEPENDENT):                             │
│  ┌────────────────────────────────────┐                         │
│  │ Security: MAY BE REQUIRED 🔒       │                         │
│  ├────────────────────────────────────┤                         │
│  │ • 0x06 - Extended data (sensitive) │                         │
│  │ • 0x18 - User defined memory       │                         │
│  │ • 0x19 - Extended data by number   │                         │
│  └────────────────────────────────────┘                         │
│                                                                 │
│  Security access via SID 0x27 if needed                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Complete Access Flow

```
  Tester                                  ECU
    │                                      │
    │  Step 1: Start session (if needed)   │
    │  ┌──────┬──────┬──────┐              │
    │  │ 0x10 │ 0x03 │ ...  │              │
    │  └──────┴──────┴──────┘              │
    │─────────────────────────────────────>│
    │                                      │
    │  ✓ Session established               │
    │<─────────────────────────────────────│
    │                                      │
    │  Step 2: Unlock (if required)        │
    │  ┌──────┬──────┐                     │
    │  │ 0x27 │ 0x01 │  (Request seed)     │
    │  └──────┴──────┘                     │
    │─────────────────────────────────────>│
    │                                      │
    │  Seed: XX XX XX XX                   │
    │<─────────────────────────────────────│
    │                                      │
    │  ┌──────┬──────┬────────────┐        │
    │  │ 0x27 │ 0x02 │ Key (calc) │        │
    │  └──────┴──────┴────────────┘        │
    │─────────────────────────────────────>│
    │                                      │
    │  ✓ Security unlocked 🔓              │
    │<─────────────────────────────────────│
    │                                      │
    │  Step 3: Read DTC information        │
    │  ┌──────┬──────┬─────────┐           │
    │  │ 0x19 │ 0x06 │ DTC ... │           │
    │  └──────┴──────┴─────────┘           │
    │─────────────────────────────────────>│
    │                                      │
    │  ✓ Extended data returned            │
    │<─────────────────────────────────────│
    │                                      │
```

---

## Service Interaction Map

### Related Services Diagram

```
                    ┌────────────────────┐
                    │   SID 0x19         │
                    │   Read DTC Info    │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐       ┌──────────┐
    │ SID 0x14 │        │ SID 0x10 │       │ SID 0x27 │
    │Clear DTCs│        │ Session  │       │ Security │
    └────┬─────┘        └────┬─────┘       └────┬─────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
             Clear → Switch → Unlock → Read
```

### SID 0x14: Clear Diagnostic Information

```
┌─────────────────────────────────────────────────────────────────┐
│ INTERACTION: SID 0x14 → SID 0x19                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BEFORE CLEAR:                                                  │
│  ┌──────┬──────┬──────┐                                         │
│  │ 0x19 │ 0x01 │ 0x08 │                                         │
│  └──────┴──────┴──────┘                                         │
│  Response: 5 DTCs found                                         │
│                                                                 │
│  CLEAR DTCs:                                                    │
│  ┌──────┬────────────────┐                                      │
│  │ 0x14 │ 0xFF 0xFF 0xFF │                                      │
│  └──────┴────────────────┘                                      │
│  Response: ✓ Cleared                                            │
│                                                                 │
│  AFTER CLEAR:                                                   │
│  ┌──────┬──────┬──────┐                                         │
│  │ 0x19 │ 0x01 │ 0x08 │                                         │
│  └──────┴──────┴──────┘                                         │
│  Response: 0 DTCs found                                         │
│                                                                 │
│  NOTE: Wait 2-3 seconds between clear and read                  │
│        to avoid NRC 0x22 (Conditions Not Correct)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SID 0x10: Diagnostic Session Control

```
┌─────────────────────────────────────────────────────────────────┐
│ INTERACTION: SID 0x10 → SID 0x19                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sequence:                                                      │
│                                                                 │
│  1. Switch to Extended Session                                  │
│     ┌──────┬──────┐                                             │
│     │ 0x10 │ 0x03 │                                             │
│     └──────┴──────┘                                             │
│     Response: ✓ Extended session active                         │
│                                                                 │
│  2. Read Extended DTC Data                                      │
│     ┌──────┬──────┬─────────────┐                               │
│     │ 0x19 │ 0x06 │ DTC + Rec # │                               │
│     └──────┴──────┴─────────────┘                               │
│     Response: ✓ Extended data returned                          │
│                                                                 │
│  WHY NEEDED:                                                    │
│  Some ECUs restrict extended data access to                     │
│  extended diagnostic session only.                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SID 0x27: Security Access

```
┌─────────────────────────────────────────────────────────────────┐
│ INTERACTION: SID 0x27 → SID 0x19                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sequence (for protected data):                                 │
│                                                                 │
│  1. Request seed                                                │
│     ┌──────┬──────┐                                             │
│     │ 0x27 │ 0x01 │                                             │
│     └──────┴──────┘                                             │
│     Response: Seed = 0x12345678                                 │
│                                                                 │
│  2. Send key                                                    │
│     ┌──────┬──────┬────────────┐                                │
│     │ 0x27 │ 0x02 │ Key (calc) │                                │
│     └──────┴──────┴────────────┘                                │
│     Response: ✓ Unlocked 🔓                                     │
│                                                                 │
│  3. Read protected DTC info                                     │
│     ┌──────┬──────┬──────┐                                      │
│     │ 0x19 │ 0x18 │ ...  │  (User memory)                       │
│     └──────┴──────┴──────┘                                      │
│     Response: ✓ Data returned                                   │
│                                                                 │
│  WITHOUT UNLOCK:                                                │
│  Response: 7F 19 33 (Security Access Denied)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Service Workflow Example

```
  Tester                                  ECU
    │                                      │
    │ 1. Check current DTCs                │
    │  ┌──────┬──────┬──────┐              │
    │  │ 0x19 │ 0x02 │ 0x08 │              │
    │  └──────┴──────┴──────┘              │
    │─────────────────────────────────────>│
    │                                      │
    │  Found: P0301, P0420                 │
    │<─────────────────────────────────────│
    │                                      │
    │ 2. Read P0301 snapshot               │
    │  ┌──────┬──────┬──────────────┐      │
    │  │ 0x19 │ 0x04 │ 0x01 0x03 01 │      │
    │  └──────┴──────┴──────────────┘      │
    │─────────────────────────────────────>│
    │                                      │
    │  Snapshot data: RPM, Load, Temp...   │
    │<─────────────────────────────────────│
    │                                      │
    │ 3. Clear DTCs                        │
    │  ┌──────┬────────────────┐           │
    │  │ 0x14 │ 0xFF 0xFF 0xFF │           │
    │  └──────┴────────────────┘           │
    │─────────────────────────────────────>│
    │                                      │
    │  ✓ Cleared                           │
    │<─────────────────────────────────────│
    │                                      │
    │ 4. Verify cleared                    │
    │  ┌──────┬──────┬──────┐              │
    │  │ 0x19 │ 0x01 │ 0x08 │              │
    │  └──────┴──────┴──────┘              │
    │─────────────────────────────────────>│
    │                                      │
    │  Count: 0 DTCs                       │
    │<─────────────────────────────────────│
    │  ✓ Success                           │
```

---

## ISO 14229-1 Reference

### Standard Compliance

```
┌─────────────────────────────────────────────────────────────────┐
│ ISO 14229-1:2020 REFERENCE                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Section 10.8: ReadDTCInformation (Service 0x19)                 │
│                                                                 │
│ Key Topics:                                                     │
│ • 10.8.1   Service description                                  │
│ • 10.8.2   Request message definition                           │
│ • 10.8.3   Positive response message definition                 │
│ • 10.8.4   Negative response codes                              │
│ • 10.8.5   DTC status byte definition                           │
│ • 10.8.6   DTCStatusAvailabilityMask                            │
│ • 10.8.7   Subfunction parameter definitions                    │
│                                                                 │
│ Related Sections:                                               │
│ • Annex D: DTC numbering and format (D.1)                       │
│ • Annex E: DTC status bit definitions (E.1)                     │
│ • 10.4: ClearDiagnosticInformation (0x14)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### DTC Numbering Format (ISO 14229 Annex D)

```
┌─────────────────────────────────────────────────────────────────┐
│ DTC FORMAT (3 bytes)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Byte 0      Byte 1      Byte 2                                 │
│  ┌────────┬─────────┬─────────┐                                 │
│  │ HB  LN │ HH  HL  │ LH  LL  │                                 │
│  └────────┴─────────┴─────────┘                                 │
│     │  │      │        │                                        │
│     │  │      │        └─ Fault code (00-FF)                    │
│     │  │      └────────── Fault code high nibble                │
│     │  └───────────────── Fault code low nibble                 │
│     └──────────────────── DTC high byte + type                  │
│                                                                 │
│  EXAMPLE: P0301 (Cylinder 1 Misfire)                            │
│  ┌────────┬─────────┬─────────┐                                 │
│  │  0x01  │  0x03   │  0x01   │                                 │
│  └────────┴─────────┴─────────┘                                 │
│     │                                                           │
│     └─ 0x01 = Powertrain (P)                                    │
│        0x00 = Body (B)                                          │
│        0x40 = Chassis (C)                                       │
│        0xC0 = Network (U)                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Subfunction Compliance Matrix

```
┌──────┬─────────────────────────────┬──────────────────────────┐
│ SF   │ ISO 14229-1 Section         │ Mandatory/Optional       │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x01 │ 10.8.7.1                    │ Mandatory                │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x02 │ 10.8.7.2                    │ Mandatory                │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x03 │ 10.8.7.3                    │ Optional (snapshot)      │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x04 │ 10.8.7.4                    │ Optional (snapshot)      │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x06 │ 10.8.7.6                    │ Optional (ext. data)     │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x0A │ 10.8.7.10                   │ Recommended              │
├──────┼─────────────────────────────┼──────────────────────────┤
│ 0x13 │ 10.8.7.19                   │ Optional (OBD)           │
└──────┴─────────────────────────────┴──────────────────────────┘
```

---

## Summary

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│ SID 0x19 QUICK REFERENCE                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SERVICE ID:        0x19                                         │
│ RESPONSE SID:      0x59                                         │
│ SUBFUNCTIONS:      26+ (most common: 0x01, 0x02, 0x04, 0x06)    │
│ SESSION:           DEFAULT (most), EXTENDED (some)              │
│ SECURITY:          NOT REQUIRED (most)                          │
│                                                                 │
│ COMMON OPERATIONS:                                              │
│ • Count DTCs:      19 01 [StatusMask]                           │
│ • List DTCs:       19 02 [StatusMask]                           │
│ • Read snapshot:   19 04 [DTC 3 bytes] [RecordNum]              │
│ • All supported:   19 0A                                        │
│                                                                 │
│ KEY NRCs:                                                       │
│ • 0x12 - Subfunction not supported                              │
│ • 0x13 - Wrong message length                                   │
│ • 0x22 - Conditions not correct                                 │
│ • 0x31 - Request out of range                                   │
│ • 0x78 - Response pending (OK)                                  │
│                                                                 │
│ RELATED SERVICES:                                               │
│ • 0x10 - Session control (for extended access)                  │
│ • 0x14 - Clear DTCs                                             │
│ • 0x27 - Security access (for protected data)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**End of Document**
