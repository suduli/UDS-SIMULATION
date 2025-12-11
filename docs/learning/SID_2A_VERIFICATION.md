# SID 0x2A Implementation Verification Walkthrough

## Overview
This document outlines the usage and verification of the newly implemented Service 0x2A (Read Data By Periodic Identifier) in the UDS Simulator.

## 1. Prerequisites
- Ensure the UDS Simulator is running (`npm run dev`).
- Open the application in your browser.

## 2. Supported PDIDs
The simulation supports the following Periodic Data Identifiers (PDIDs), mapping to corresponding Data Identifiers (DIDs):

| PDID | Rate Mode | Mapped DID | Description      | Security Required? |
|------|-----------|------------|------------------|--------------------|
| 0x01 | Any       | 0x010C     | Engine RPM       | No                 |
| 0x02 | Any       | 0x010D     | Vehicle Speed    | No                 |
| 0x03 | Any       | 0x0105     | Coolant Temp     | No                 |
| 0x04 | Any       | 0x0110     | MAF              | No                 |
| 0x0A | Any       | 0x0142     | Battery Voltage  | Yes (Level 1)      |

## 3. Transmission Modes (Sub-function)
- `0x01`: SendAtSlowRate (1000ms)
- `0x02`: SendAtMediumRate (500ms)
- `0x03`: SendAtFastRate (100ms)
- `0x04`: StopSending (Stops ALL periodic transmission)

## 4. Verification Scenarios

### Scenario A: Basic Periodic Transmission
1. **Enter Extended Session**
   - Send: `10 03`
   - Expect: `50 03 ...`
2. **Start Fast Transmission of RPM**
   - Send: `2A 03 01` (Mode 03, PDID 01)
   - Expect: `6A 03` (Positive Response)
   - Observe: New entries appearing in the dashboard/log every ~100ms with generic data (e.g. `6A 01 ...`).
3. **Stop Transmission**
   - Send: `2A 04`
   - Expect: `6A 04`
   - Observe: Periodic entries stop.

### Scenario B: Multiple Rates
1. **Enter Extended Session**
   - Send: `10 03`
2. **Start Slow Speed**
   - Send: `2A 01 02` (Mode 01, PDID 02)
   - Observe: Speed data every ~1000ms.
3. **Start Fast RPM**
   - Send: `2A 03 01` (Mode 03, PDID 01)
   - Observe: RPM data every ~100ms mixed with Speed data every ~1000ms.

### Scenario C: Session Interaction
1. **Setup**
   - Start periodic transmission (as in Scenario A).
2. **Change to Default Session**
   - Send: `10 01`
   - Expect: `50 01 ...`
   - Observe: Periodic transmission stops immediately.
3. **Try Requesting in Default Session**
   - Send: `2A 02 01`
   - Expect: `7F 2A 22` (Conditions Not Correct).

### Scenario D: Security Interaction
1. **Enter Extended Session**
   - Send: `10 03`
2. **Request Protected Data (Voltage)**
   - Send: `2A 01 0A` (PDID 0x0A)
   - Expect: `7F 2A 33` (Security Access Denied).
3. **Unlock Security**
   - Request Seed: `27 01` -> Receive Seed (e.g. `67 01 AA BB CC DD`).
   - Send Key: `27 02 [Calculated Key]` -> `67 02` (Unlocked).
4. **Request Protected Data Again**
   - Send: `2A 01 0A`
   - Expect: `6A 01`
   - Observe: Periodic voltage data flows.

## 5. Notes
- The simulator uses a 50ms internal tick for the scheduler.
- Responses are injected into the request history as synthetic requests for visualization.
