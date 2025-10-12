# SID 0x11 - ECU Reset Service

**Document Version**: 2.0  
**Last Updated**: October 11, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.3

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Message Structure](#message-structure)
3. [Subfunctions](#subfunctions)
4. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
5. [Session Requirements](#session-requirements)
6. [Security Requirements](#security-requirements)
7. [Reset Behavior](#reset-behavior)
8. [Interaction with Other Services](#interaction-with-other-services)

---

## Service Overview

### Purpose

The ECU Reset service (`0x11`) allows a diagnostic tester to initiate a reset of the ECU. This service is critical for:

- Applying new configurations or software updates
- Clearing fault memory after repairs
- Transitioning between diagnostic modes
- Recovering from error states
- Validating reprogramming operations

### Service Identifier (SID)

```
┌─────────────────────────────────────────┐
│  Service ID (SID): 0x11                 │
│  Service Name: ECU Reset                │
│  Response SID: 0x51                     │
│  Type: Functional/Physical              │
└─────────────────────────────────────────┘
```

### Basic Operation Flow

```
  Tester                           ECU
    │                               │
    │  Request: ECU Reset (0x11)    │
    │──────────────────────────────>│
    │                               │
    │                      ┌────────┴────────┐
    │                      │ Validate Request │
    │                      └────────┬────────┘
    │                               │
    │  Response: 0x51 (Success)     │
    │<──────────────────────────────│
    │                               │
    │                      ┌────────┴────────┐
    │                      │  Execute Reset  │
    │                      │  [ECU Restarts] │
    │                      └─────────────────┘
    │                               │
    │        [Connection Lost]      │
    │ · · · · · · · · · · · · · · · │
    │                               │
    │     [ECU Comes Back Online]   │
    │<══════════════════════════════│
```

---

## Message Structure

### Request Message Format

```
┌────────────────────────────────────────────────────────┐
│ ECU RESET REQUEST MESSAGE                              │
├────────────────────────────────────────────────────────┤
│  Byte 0: SID (0x11)                                    │
│  Byte 1: Reset Type (Subfunction)                      │
│          0x01 = Hard Reset                             │
│          0x02 = Key Off/On Reset                       │
│          0x03 = Soft Reset                             │
│          0x04 = Enable Rapid Power Shutdown            │
│          0x05 = Disable Rapid Power Shutdown           │
│          0x06-0x7F = ISO/SAE Reserved                  │
│          0x80-0xFF = Vehicle Manufacturer Specific     │
└────────────────────────────────────────────────────────┘
```

### Positive Response Format

```
┌────────────────────────────────────────────────────────┐
│ ECU RESET POSITIVE RESPONSE                            │
├────────────────────────────────────────────────────────┤
│  Byte 0: Response SID (0x51)                           │
│  Byte 1: Reset Type Echo (Same as request)             │
│  Byte 2: Power Down Time (Optional)                    │
│          Time in seconds before reset occurs           │
└────────────────────────────────────────────────────────┘
```

### Negative Response Format

```
┌────────────────────────────────────────────────────────┐
│ NEGATIVE RESPONSE MESSAGE (NRC)                        │
├────────────────────────────────────────────────────────┤
│  Byte 0: Negative Response SID (0x7F)                  │
│  Byte 1: Requested SID (0x11)                          │
│  Byte 2: NRC Code (Error reason)                       │
└────────────────────────────────────────────────────────┘
```

---

## Subfunctions

### Subfunction Overview Table

```
┌──────────┬─────────────────────────────┬──────────────┬────────────┐
│   Hex    │     Reset Type              │  ECU Action  │  Security  │
├──────────┼─────────────────────────────┼──────────────┼────────────┤
│   0x01   │  Hard Reset                 │  Full Reset  │  May Need  │
│   0x02   │  Key Off/On Reset           │  Simulated   │  May Need  │
│   0x03   │  Soft Reset                 │  Partial     │  May Need  │
│   0x04   │  Enable Rapid Power Shutdown│  Enable Mode │  May Need  │
│   0x05   │  Disable Rapid Power Shutdwn│  Disable Mode│  May Need  │
│ 0x06-7F  │  ISO/SAE Reserved           │  N/A         │  N/A       │
│ 0x80-FF  │  Manufacturer Specific      │  Varies      │  Varies    │
└──────────┴─────────────────────────────┴──────────────┴────────────┘
```

### 0x01 - Hard Reset

```
┌───────────────────────────────────────────────────────────────┐
│ HARD RESET (0x01)                                             │
├───────────────────────────────────────────────────────────────┤
│  Description:                                                 │
│    • Complete ECU restart                                     │
│    • Similar to power cycle                                   │
│    • All volatile memory cleared                              │
│    • Non-volatile memory preserved                            │
│                                                                │
│  Typical Use Cases:                                           │
│    ✓ After software reprogramming                             │
│    ✓ After configuration changes                              │
│    ✓ Clearing diagnostic session                              │
│    ✓ Recovery from error states                               │
│                                                                │
│  Reset Sequence:                                              │
│    1. Send positive response (0x51 0x01)                      │
│    2. Save critical data to non-volatile memory               │
│    3. Terminate all active communications                     │
│    4. Perform hardware reset                                  │
│    5. Execute startup sequence                                │
│    6. Return to default diagnostic session                    │
└───────────────────────────────────────────────────────────────┘
```

### 0x02 - Key Off/On Reset

```
┌───────────────────────────────────────────────────────────────┐
│ KEY OFF/ON RESET (0x02)                                       │
├───────────────────────────────────────────────────────────────┤
│  Description:                                                 │
│    • Simulates ignition key cycle                             │
│    • Mimics power-down and power-up sequence                  │
│    • May be gentler than hard reset                           │
│                                                                │
│  Typical Use Cases:                                           │
│    ✓ After parameter updates                                  │
│    ✓ Clearing temporary fault codes                           │
│    ✓ Resetting learned values                                 │
│    ✓ Testing power-cycle behavior                             │
│                                                                │
│  Reset Sequence:                                              │
│    1. Send positive response (0x51 0x02)                      │
│    2. Execute shutdown procedures                             │
│    3. Simulate key-off state                                  │
│    4. Wait configured delay                                   │
│    5. Simulate key-on state                                   │
│    6. Execute startup procedures                              │
└───────────────────────────────────────────────────────────────┘
```

### 0x03 - Soft Reset

```
┌───────────────────────────────────────────────────────────────┐
│ SOFT RESET (0x03)                                             │
├───────────────────────────────────────────────────────────────┤
│  Description:                                                 │
│    • Partial ECU reset                                        │
│    • Application layer restart                                │
│    • Communication stack may remain active                    │
│    • Faster than hard reset                                   │
│                                                                │
│  Typical Use Cases:                                           │
│    ✓ Quick application restart                                │
│    ✓ After minor configuration changes                        │
│    ✓ Clearing application errors                              │
│    ✓ Maintaining communication during reset                   │
│                                                                │
│  Reset Sequence:                                              │
│    1. Send positive response (0x51 0x03)                      │
│    2. Stop application tasks                                  │
│    3. Keep communication layer active (optional)              │
│    4. Reinitialize application layer                          │
│    5. Resume normal operation                                 │
│    6. May stay in current diagnostic session                  │
└───────────────────────────────────────────────────────────────┘
```

### 0x04 - Enable Rapid Power Shutdown

```
┌───────────────────────────────────────────────────────────────┐
│ ENABLE RAPID POWER SHUTDOWN (0x04)                            │
├───────────────────────────────────────────────────────────────┤
│  Description:                                                 │
│    • Enables fast shutdown mode                               │
│    • Skips normal shutdown procedures                         │
│    • Used for quick power-down testing                        │
│                                                                │
│  Typical Use Cases:                                           │
│    ✓ End-of-line testing                                      │
│    ✓ Power management testing                                 │
│    ✓ Emergency shutdown simulation                            │
│                                                                │
│  Behavior:                                                    │
│    • Returns 0x51 0x04 response                               │
│    • Activates rapid shutdown mode                            │
│    • Next power-down will be accelerated                      │
└───────────────────────────────────────────────────────────────┘
```

### 0x05 - Disable Rapid Power Shutdown

```
┌───────────────────────────────────────────────────────────────┐
│ DISABLE RAPID POWER SHUTDOWN (0x05)                           │
├───────────────────────────────────────────────────────────────┤
│  Description:                                                 │
│    • Disables fast shutdown mode                              │
│    • Returns to normal shutdown procedures                    │
│    • Restores standard power management                       │
│                                                                │
│  Typical Use Cases:                                           │
│    ✓ After rapid shutdown testing                             │
│    ✓ Restoring normal operation                               │
│    ✓ End of diagnostic session                                │
│                                                                │
│  Behavior:                                                    │
│    • Returns 0x51 0x05 response                               │
│    • Deactivates rapid shutdown mode                          │
│    • Normal shutdown procedures resume                        │
└───────────────────────────────────────────────────────────────┘
```

---

## Negative Response Codes (NRCs)

### Common NRCs for ECU Reset

```
┌──────────┬────────────────────────────────────┬───────────────┐
│   NRC    │  Name                              │  When Sent    │
├──────────┼────────────────────────────────────┼───────────────┤
│   0x12   │  Sub-Function Not Supported        │  Common       │
│   0x13   │  Incorrect Message Length          │  Common       │
│   0x22   │  Conditions Not Correct            │  Very Common  │
│   0x31   │  Request Out Of Range              │  Occasional   │
│   0x33   │  Security Access Denied            │  Common       │
│   0x7F   │  Service Not Supported In Session  │  Common       │
│   0x78   │  Response Pending                  │  Rare         │
└──────────┴────────────────────────────────────┴───────────────┘
```

### NRC 0x12 - Sub-Function Not Supported

```
┌────────────────────────────────────────┐
│ NRC: 0x12                              │
│ Hex Format: 7F 11 12                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ WHAT IT MEANS                                                  │
├────────────────────────────────────────────────────────────────┤
│  The requested reset type (subfunction) is not supported       │
│  by this ECU or in the current configuration.                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ COMMON CAUSES                                                  │
├────────────────────────────────────────────────────────────────┤
│  • Invalid subfunction value (e.g., 0x06-0x7F undefined)       │
│  • Manufacturer-specific reset type not implemented            │
│  • ECU variant doesn't support requested reset type            │
│  • Requesting reserved subfunction                             │
└────────────────────────────────────────────────────────────────┘
```

**Visual Comparison:**

```
┌────────────────────────────────────────┐
│ ❌ WRONG                               │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 0A        │                    │
│    │─────────────>│                    │
│    │              │                    │
│    │ 7F 11 12     │ (0x0A not valid)   │
│    │<─────────────│                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT                             │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 01        │ (hardReset)        │
│    │─────────────>│                    │
│    │              │                    │
│    │ 51 01        │ ✓ Valid subfunction│
│    │<─────────────│                    │
└────────────────────────────────────────┘
```

### NRC 0x13 - Incorrect Message Length

```
┌────────────────────────────────────────┐
│ NRC: 0x13                              │
│ Hex Format: 7F 11 13                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ WHAT IT MEANS                                                  │
├────────────────────────────────────────────────────────────────┤
│  The request message length is incorrect. ECU Reset requires   │
│  exactly 2 bytes (SID + Subfunction).                          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ COMMON CAUSES                                                  │
├────────────────────────────────────────────────────────────────┤
│  • Message too short (only SID, missing subfunction)           │
│  • Message too long (extra unexpected bytes)                   │
│  • Corrupted message transmission                              │
└────────────────────────────────────────────────────────────────┘
```

**Visual Comparison:**

```
┌────────────────────────────────────────┐
│ ❌ WRONG                               │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11           │ (Missing byte 1!)  │
│    │─────────────>│                    │
│    │              │                    │
│    │ 7F 11 13     │ ❌ Too short       │
│    │<─────────────│                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT                             │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 01        │ (2 bytes correct)  │
│    │─────────────>│                    │
│    │              │                    │
│    │ 51 01        │ ✓ Correct length   │
│    │<─────────────│                    │
└────────────────────────────────────────┘
```

### NRC 0x22 - Conditions Not Correct

```
┌────────────────────────────────────────┐
│ NRC: 0x22                              │
│ Hex Format: 7F 11 22                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ WHAT IT MEANS                                                  │
├────────────────────────────────────────────────────────────────┤
│  The ECU cannot perform the reset because current conditions   │
│  are not suitable (safety, state, or operational reasons).     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ COMMON CAUSES                                                  │
├────────────────────────────────────────────────────────────────┤
│  • Vehicle is moving (speed > 0)                               │
│  • Engine is running (reset not safe)                          │
│  • Critical operation in progress                              │
│  • Flash programming active                                    │
│  • Hardware fault detected                                     │
│  • Temperature out of range                                    │
│  • Voltage out of acceptable range                             │
└────────────────────────────────────────────────────────────────┘
```

**Visual Comparison:**

```
┌────────────────────────────────────────┐
│ ❌ WRONG                               │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 01        │ [Vehicle Moving!]  │
│    │─────────────>│ [Speed: 60 km/h]   │
│    │              │                    │
│    │ 7F 11 22     │ ❌ Unsafe to reset │
│    │<─────────────│                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT                             │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 01        │ [Vehicle Stopped]  │
│    │─────────────>│ [Speed: 0 km/h]    │
│    │              │                    │
│    │ 51 01        │ ✓ Safe to reset    │
│    │<─────────────│                    │
└────────────────────────────────────────┘
```

### NRC 0x33 - Security Access Denied

```
┌────────────────────────────────────────┐
│ NRC: 0x33                              │
│ Hex Format: 7F 11 33                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ WHAT IT MEANS                                                  │
├────────────────────────────────────────────────────────────────┤
│  The requested reset type requires security access,            │
│  but the ECU is currently locked (security not unlocked).      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ COMMON CAUSES                                                  │
├────────────────────────────────────────────────────────────────┤
│  • Security access (SID 0x27) not performed                    │
│  • Security level expired or timed out                         │
│  • Wrong security level for this reset type                    │
│  • Attempting manufacturer-specific reset without security     │
└────────────────────────────────────────────────────────────────┘
```

**Visual Comparison:**

```
┌────────────────────────────────────────┐
│ ❌ WRONG                               │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 11 01        │ [Security: 🔒]     │
│    │─────────────>│ [LOCKED]           │
│    │              │                    │
│    │ 7F 11 33     │ ❌ Not authorized  │
│    │<─────────────│                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT                             │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 27 01        │ [Request Seed]     │
│    │─────────────>│                    │
│    │ 67 01 XX XX  │ [Seed Sent]        │
│    │<─────────────│                    │
│    │ 27 02 YY YY  │ [Send Key]         │
│    │─────────────>│                    │
│    │ 67 02        │ [Security: 🔓]     │
│    │<─────────────│ [UNLOCKED]         │
│    │              │                    │
│    │ 11 01        │                    │
│    │─────────────>│                    │
│    │ 51 01        │ ✓ Authorized       │
│    │<─────────────│                    │
└────────────────────────────────────────┘
```

### NRC 0x7F - Service Not Supported In Active Session

```
┌────────────────────────────────────────┐
│ NRC: 0x7F                              │
│ Hex Format: 7F 11 7F                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ WHAT IT MEANS                                                  │
├────────────────────────────────────────────────────────────────┤
│  ECU Reset is not allowed in the current diagnostic session.   │
│  May need to switch to a different session first.              │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ COMMON CAUSES                                                  │
├────────────────────────────────────────────────────────────────┤
│  • Attempting reset in Default Session (may be restricted)     │
│  • Wrong session for specific reset type                       │
│  • Session configuration doesn't allow resets                  │
└────────────────────────────────────────────────────────────────┘
```

**Visual Comparison:**

```
┌────────────────────────────────────────┐
│ ❌ WRONG                               │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │              │ [Session: DEFAULT] │
│    │ 11 01        │                    │
│    │─────────────>│                    │
│    │              │                    │
│    │ 7F 11 7F     │ ❌ Not in session  │
│    │<─────────────│                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT                             │
├────────────────────────────────────────┤
│  Tester          ECU                   │
│    │              │                    │
│    │ 10 03        │ [Switch to Extended│
│    │─────────────>│  Diagnostic]       │
│    │ 50 03        │                    │
│    │<─────────────│                    │
│    │              │ [Session: EXTENDED]│
│    │ 11 01        │                    │
│    │─────────────>│                    │
│    │ 51 01        │ ✓ Allowed now      │
│    │<─────────────│                    │
└────────────────────────────────────────┘
```

---

## Session Requirements

### Session Support Matrix

```
┌──────────────────┬─────────┬──────────┬─────────────┬──────────────┐
│  Reset Type      │ Default │ Extended │ Programming │ Custom       │
├──────────────────┼─────────┼──────────┼─────────────┼──────────────┤
│  Hard Reset      │  Maybe  │   YES    │    YES      │   Varies     │
│  Key Off/On      │  Maybe  │   YES    │    YES      │   Varies     │
│  Soft Reset      │   NO    │   YES    │    YES      │   Varies     │
│  Enable Rapid PD │   NO    │   YES    │    Maybe    │   Varies     │
│  Disable Rapid PD│   NO    │   YES    │    Maybe    │   Varies     │
└──────────────────┴─────────┴──────────┴─────────────┴──────────────┘

Legend:
  YES   = Typically supported ✓
  NO    = Typically not supported ✗
  Maybe = Implementation dependent ⚠️
  Varies= Manufacturer defined
```

### Session Transition After Reset

```
                    ┌─────────────────────┐
                    │   Before Reset      │
                    │  [Any Session]      │
                    └──────────┬──────────┘
                               │
                               │ Reset Request
                               │ (0x11 0x0X)
                               ▼
                    ┌─────────────────────┐
                    │  Positive Response  │
                    │     (0x51 0x0X)     │
                    └──────────┬──────────┘
                               │
                               │ ECU Resets
                               ▼
                    ┌─────────────────────┐
                    │   After Reset       │
                    │  [DEFAULT Session]  │
                    │   🔒 Security Locked│
                    └─────────────────────┘
```

**Important Notes:**

- Hard Reset (`0x01`) → **Always** returns to Default Session
- Key Off/On (`0x02`) → **Always** returns to Default Session
- Soft Reset (`0x03`) → **May** maintain current session (implementation-specific)
- Rapid Power Shutdown changes → **No** session change (just mode setting)

---

## Security Requirements

### Security Access Matrix

```
┌──────────────────────┬──────────────┬────────────────────────┐
│  Reset Type          │  Security    │  Typical Reason        │
├──────────────────────┼──────────────┼────────────────────────┤
│  Hard Reset (0x01)   │  Optional*   │  May affect safety     │
│  Key Off/On (0x02)   │  Optional*   │  Can clear configs     │
│  Soft Reset (0x03)   │  Optional*   │  Application restart   │
│  Enable Rapid PD     │  Required**  │  Affects power mgmt    │
│  Disable Rapid PD    │  Required**  │  Affects power mgmt    │
│  Mfr Specific        │  Varies      │  Depends on function   │
└──────────────────────┴──────────────┴────────────────────────┘

* Optional: Some ECUs require security for all resets
** Required: Manufacturer typically requires security for power modes
```

### Security State Impact

```
┌─────────────────────────────────────────────────────────────┐
│ SECURITY STATE BEFORE AND AFTER RESET                       │
└─────────────────────────────────────────────────────────────┘

Before Reset:
┌──────────────────────┐
│  Security: 🔓 OPEN   │
│  Level: 0x01         │
│  Timeout: Active     │
└──────────────────────┘
         │
         │ Hard Reset (0x01)
         │ or Key Off/On (0x02)
         ▼
┌──────────────────────┐
│  Security: 🔒 LOCKED │
│  Level: 0x00         │
│  Timeout: Cleared    │
└──────────────────────┘

Note: Soft Reset (0x03) behavior varies by manufacturer!
```

---

## Reset Behavior

### Reset Type Comparison

```
┌────────────────┬─────────┬──────────┬─────────┬───────────────┐
│  Aspect        │  Hard   │ Key Off/ │  Soft   │ Rapid PD      │
│                │  Reset  │ On Reset │  Reset  │ Enable/Disable│
├────────────────┼─────────┼──────────┼─────────┼───────────────┤
│ Duration       │ 5-15s   │  8-20s   │  1-5s   │  Immediate    │
│ Memory Clear   │  YES    │   YES    │ Partial │  NO           │
│ Comm Loss      │  YES    │   YES    │  Maybe  │  NO           │
│ Session Reset  │  YES    │   YES    │  Maybe  │  NO           │
│ Security Reset │  YES    │   YES    │  Maybe  │  NO           │
│ Hardware Reset │  YES    │Simulated │   NO    │  N/A          │
└────────────────┴─────────┴──────────┴─────────┴───────────────┘
```

### Timeline Visualization - Hard Reset

```
  Time
   │
   0s ├─ Tester sends: 11 01
   │  │
   1s ├─ ECU responds: 51 01
   │  │
   2s ├─ ECU saves critical data
   │  │
   3s ├─ Communication lost ❌
   │  │
   4s ├─ ECU hardware reset begins
   │  │
   5s ├─ Memory cleared
   │  │
   6s ├─ Bootloader starts
   │  │
   7s ├─ Application loads
   │  │
   8s ├─ CAN initialization
   │  │
  10s ├─ ECU back online ✓
   │  │
  11s ├─ Default session active
   │  │
  12s ├─ Ready for new requests
   │
```

### Memory State During Reset

```
┌──────────────────────────────────────────────────────────────┐
│ MEMORY REGIONS AFFECTED BY RESET TYPE                        │
└──────────────────────────────────────────────────────────────┘

                Hard Reset    Key Off/On    Soft Reset
                (0x01)        (0x02)         (0x03)
                ─────────     ──────────     ──────────

RAM (Volatile)     CLEARED       CLEARED       Partial
  └─ Variables        ✗             ✗          Maybe
  └─ Buffers          ✗             ✗          Maybe
  └─ Stack            ✗             ✗          Maybe

EEPROM/Flash       PRESERVED     PRESERVED     PRESERVED
  └─ Calibration      ✓             ✓            ✓
  └─ Program          ✓             ✓            ✓
  └─ Config           ✓             ✓            ✓

DTC Memory        PRESERVED     PRESERVED     PRESERVED
  └─ Stored DTCs      ✓             ✓            ✓
  └─ Freeze Frames    ✓             ✓            ✓

Learned Values     CLEARED       CLEARED       Maybe
  └─ Adaptations      ✗             ✗          Varies
  └─ Trim Values      ✗             ✗          Varies

Legend: ✓ = Kept, ✗ = Cleared
```

---

## Interaction with Other Services

### Common Service Sequences

```
┌─────────────────────────────────────────────────────────────┐
│ TYPICAL MULTI-SERVICE WORKFLOWS WITH ECU RESET              │
└─────────────────────────────────────────────────────────────┘
```

#### Workflow 1: Software Update

```
  Tester                          ECU
    │                              │
    │  1. Start Programming Session│
    │  (10 02)                     │
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │  2. Unlock Security (27 XX)  │
    │─────────────────────────────>│
    │                         🔓   │
    │                              │
    │  3. Download Software (34-36)│
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │  4. Reset ECU (11 01)        │
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │     [ECU Restarts]           │
    │ ································│
    │                              │
    │  5. Verify Software (22 F1xx)│
    │─────────────────────────────>│
    │                         ✓    │
```

#### Workflow 2: Parameter Configuration

```
  Tester                          ECU
    │                              │
    │  1. Extended Session (10 03) │
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │  2. Write Data (2E XX XX)    │
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │  3. Key Off/On Reset (11 02) │
    │─────────────────────────────>│
    │                         ✓    │
    │                              │
    │     [ECU Simulates Key Cycle]│
    │                              │
    │  4. Read New Values (22 XX)  │
    │─────────────────────────────>│
    │                         ✓    │
```

### Related Services

```
┌──────────┬─────────────────────────┬──────────────────────────┐
│   SID    │  Service Name           │  Relationship with 0x11  │
├──────────┼─────────────────────────┼──────────────────────────┤
│   0x10   │  Diagnostic Session     │  Required before reset   │
│   0x27   │  Security Access        │  May be required         │
│   0x28   │  Communication Control  │  Disabled during reset   │
│   0x2E   │  Write Data By ID       │  Often precedes reset    │
│   0x31   │  Routine Control        │  Alternative to reset    │
│   0x34   │  Request Download       │  Reset after download    │
│   0x36   │  Transfer Data          │  Reset after transfer    │
│   0x37   │  Request Transfer Exit  │  Reset follows exit      │
│   0x85   │  Control DTC Setting    │  Reset clears session    │
└──────────┴─────────────────────────┴──────────────────────────┘
```

---

## Summary Quick Reference

```
┌──────────────────────────────────────────────────────────────┐
│ ECU RESET (0x11) QUICK REFERENCE                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Request:  [0x11] [Reset Type]                               │
│  Response: [0x51] [Reset Type Echo] [Power Down Time?]       │
│                                                              │
│  Common Reset Types:                                         │
│    0x01 = Hard Reset (Full restart)                          │
│    0x02 = Key Off/On (Simulated key cycle)                   │
│    0x03 = Soft Reset (Application restart)                   │
│                                                              │
│  Session Requirements: Typically Extended or Programming     │
│  Security: Optional (depends on ECU and reset type)          │
│                                                              │
│  After Reset Behavior:                                       │
│    • ECU returns to Default Session                          │
│    • Security access is locked 🔒                            │
│    • Communication may be lost temporarily                   │
│    • All volatile data cleared (RAM)                         │
│    • Non-volatile data preserved (Flash/EEPROM)              │
│                                                              │
│  Common NRCs:                                                │
│    0x12 = Subfunction not supported                          │
│    0x13 = Incorrect message length                           │
│    0x22 = Conditions not correct (unsafe to reset)           │
│    0x33 = Security access denied                             │
│    0x7F = Service not supported in active session            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Additional Resources

**ISO 14229-1:2020 References:**
- Section 9.3: ECU Reset Service Definition
- Section 9.3.1: ECU Reset Request Message
- Section 9.3.2: ECU Reset Positive Response
- Annex A: Reset Type Definitions
- Annex B: Negative Response Codes

**Related Documentation:**
- `SID_10_DIAGNOSTIC_SESSION_CONTROL.md` - Session management
- `SID_27_SECURITY_ACCESS.md` - Security unlocking
- `SID_11_PRACTICAL_IMPLEMENTATION.md` - Implementation details
- `SID_11_SERVICE_INTERACTIONS.md` - Workflow examples

---

**End of Document**
