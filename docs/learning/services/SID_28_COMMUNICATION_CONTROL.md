# SID 0x28: Communication Control - Complete Learning Guide

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## Table of Contents

1. [Overview](#overview)
2. [What is SID 0x28?](#what-is-sid-0x28)
3. [When to Use SID 0x28](#when-to-use-sid-0x28)
4. [Message Structure](#message-structure)
5. [Control Types (Subfunctions)](#control-types-subfunctions)
6. [Communication Types](#communication-types)
7. [Subnet and Node Identification](#subnet-and-node-identification)
8. [Negative Response Codes (NRCs)](#negative-response-codes-nrcs)
9. [Session and Security Requirements](#session-and-security-requirements)
10. [Communication State Behavior](#communication-state-behavior)
11. [Common Use Cases](#common-use-cases)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Quick Reference Card](#quick-reference-card)
14. [ISO 14229-1 References](#iso-14229-1-references)

---

## Overview

SID 0x28 (Communication Control) is a UDS service that **enables or disables specific types of network communication** on an ECU. This service is critical for:

- **Preventing network interference** during diagnostic operations
- **Isolating ECUs** during firmware updates
- **Controlling message traffic** during testing
- **Managing multi-network vehicle architectures**

**Key Concept**: SID 0x28 acts like a **network traffic controller** - it can selectively enable/disable different types of messages (application messages, network management messages) on different network segments.

---

## What is SID 0x28?

### Service Identifier
```
┌─────────────────────────────────────────┐
│ SID 0x28: Communication Control        │
├─────────────────────────────────────────┤
│  Hex Value: 0x28                        │
│  Decimal:   40                          │
│  Category:  Diagnostic Service          │
│  Response:  0x68 (positive)             │
│  Purpose:   Control network messages    │
└─────────────────────────────────────────┘
```

### Purpose

SID 0x28 allows a diagnostic tester to:

✅ **Enable** specific communication types  
✅ **Disable** specific communication types  
✅ **Enable RX only, disable TX** (receive-only mode)  
✅ **Enable TX only, disable RX** (transmit-only mode)  
✅ **Target specific network subnets**  
✅ **Control message categories** (application vs. network management)

---

## When to Use SID 0x28

### Common Scenarios

#### Scenario 1: Firmware Update Isolation
```
┌────────────────────────────────────────────┐
│ Problem: Other ECUs sending messages      │
│          during flash programming         │
│                                            │
│ Solution: Disable ECU's TX/RX before      │
│          starting firmware download       │
├────────────────────────────────────────────┤
│  Step 1: 28 00 03 → Disable all comm     │
│  Step 2: 34/36/37 → Flash programming    │
│  Step 3: 28 01 03 → Enable all comm      │
└────────────────────────────────────────────┘
```

#### Scenario 2: Network Diagnostics
```
┌────────────────────────────────────────────┐
│ Problem: Need to test one ECU without     │
│          interference from others         │
│                                            │
│ Solution: Disable normal messages,        │
│          keep diagnostic messages active  │
├────────────────────────────────────────────┤
│  28 00 01 → Disable normal app messages  │
│  (Diagnostic messages still work)         │
└────────────────────────────────────────────┘
```

#### Scenario 3: End-of-Line Testing
```
┌────────────────────────────────────────────┐
│ Problem: Production line testing requires │
│          controlled communication states  │
│                                            │
│ Solution: Enable/disable specific subnets │
├────────────────────────────────────────────┤
│  28 00 01 F0 → Disable subnet 0xF0 apps  │
│  (Test without production network traffic)│
└────────────────────────────────────────────┘
```

---

## Message Structure

### Request Message Format

```
┌────────────────────────────────────────────────────────────┐
│ BYTE 0: SID (0x28)                                         │
├────────────────────────────────────────────────────────────┤
│ BYTE 1: Control Type (Subfunction)                         │
│         - 0x00: Enable RX and Disable TX                   │
│         - 0x01: Enable RX and TX                           │
│         - 0x02: Disable RX and Enable TX                   │
│         - 0x03: Disable RX and TX                          │
│         - 0x04: Enable RX and Disable TX with Enhanced...  │
│         - 0x05: Enable RX and TX with Enhanced...          │
├────────────────────────────────────────────────────────────┤
│ BYTE 2: Communication Type (what to control)               │
│         - 0x01: Normal communication messages              │
│         - 0x02: Network management messages                │
│         - 0x03: Both (0x01 + 0x02)                         │
├────────────────────────────────────────────────────────────┤
│ BYTE 3: Node Identification (high byte) [OPTIONAL]         │
│ BYTE 4: Node Identification (low byte)  [OPTIONAL]         │
│         - If present: Target specific node                 │
│         - If absent: Apply to all nodes on subnet          │
└────────────────────────────────────────────────────────────┘
```

### Response Message Format

```
┌────────────────────────────────────────────┐
│ POSITIVE RESPONSE (0x68)                   │
├────────────────────────────────────────────┤
│  Byte 0: 0x68 (SID + 0x40)                 │
│  Byte 1: Control Type (echo request)       │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ NEGATIVE RESPONSE (0x7F)                   │
├────────────────────────────────────────────┤
│  Byte 0: 0x7F                              │
│  Byte 1: 0x28 (requested SID)              │
│  Byte 2: NRC code (error reason)           │
└────────────────────────────────────────────┘
```

### Example Messages

#### Example 1: Disable All Communication
```
Request:  [28 03 03]
           │  │  └─── Communication Type: Both (0x03)
           │  └────── Control Type: Disable RX and TX (0x03)
           └───────── SID: Communication Control (0x28)

Response: [68 03]
           │  └─── Echo: Control Type 0x03
           └────── Positive Response
```

#### Example 2: Enable Normal Messages Only
```
Request:  [28 01 01]
           │  │  └─── Communication Type: Normal messages (0x01)
           │  └────── Control Type: Enable RX and TX (0x01)
           └───────── SID: Communication Control (0x28)

Response: [68 01]
```

#### Example 3: Target Specific Subnet
```
Request:  [28 00 03 F0 00]
           │  │  │  │  └─── Node ID Low Byte
           │  │  │  └────── Node ID High Byte (Subnet 0xF0)
           │  │  └───────── Communication Type: Both
           │  └──────────── Control Type: Enable RX, Disable TX
           └─────────────── SID: 0x28

Response: [68 00]
```

---

## Control Types (Subfunctions)

### Overview Table

```
┌────────┬──────────────────────────────┬─────────┬─────────┐
│ Value  │ Name                         │   RX    │   TX    │
├────────┼──────────────────────────────┼─────────┼─────────┤
│ 0x00   │ Enable RX, Disable TX        │ ENABLED │DISABLED │
│ 0x01   │ Enable RX and TX             │ ENABLED │ ENABLED │
│ 0x02   │ Disable RX, Enable TX        │DISABLED │ ENABLED │
│ 0x03   │ Disable RX and TX            │DISABLED │DISABLED │
│ 0x04   │ Enable RX, Disable TX +Enh   │ ENABLED │DISABLED │
│ 0x05   │ Enable RX and TX +Enh        │ ENABLED │ ENABLED │
└────────┴──────────────────────────────┴─────────┴─────────┘
```

### Control Type 0x00: Enable RX, Disable TX

**Purpose**: Allow ECU to **receive** messages but **not transmit** (listen-only mode)

```
         ECU State After Command
┌──────────────────────────────────────┐
│  📥 RX:  ✅ ENABLED                  │
│         Can receive messages         │
│                                      │
│  📤 TX:  ❌ DISABLED                 │
│         Cannot send messages         │
└──────────────────────────────────────┘

Use Case: Monitoring network traffic without interfering
```

### Control Type 0x01: Enable RX and TX

**Purpose**: **Normal communication** - both receive and transmit enabled

```
         ECU State After Command
┌──────────────────────────────────────┐
│  📥 RX:  ✅ ENABLED                  │
│         Can receive messages         │
│                                      │
│  📤 TX:  ✅ ENABLED                  │
│         Can send messages            │
└──────────────────────────────────────┘

Use Case: Restore normal operation after diagnostic work
```

### Control Type 0x02: Disable RX, Enable TX

**Purpose**: Allow ECU to **transmit** but **not receive** (rare, special testing)

```
         ECU State After Command
┌──────────────────────────────────────┐
│  📥 RX:  ❌ DISABLED                 │
│         Cannot receive messages      │
│                                      │
│  📤 TX:  ✅ ENABLED                  │
│         Can send messages            │
└──────────────────────────────────────┘

Use Case: Testing transmission without external influence
```

### Control Type 0x03: Disable RX and TX

**Purpose**: **Complete communication shutdown** (except diagnostics)

```
         ECU State After Command
┌──────────────────────────────────────┐
│  📥 RX:  ❌ DISABLED                 │
│         Cannot receive messages      │
│                                      │
│  📤 TX:  ❌ DISABLED                 │
│         Cannot send messages         │
│                                      │
│  🔧 Diagnostic: ✅ STILL WORKS       │
│         (SID 0x28, 0x3E, etc.)       │
└──────────────────────────────────────┘

Use Case: Complete isolation for firmware updates
```

### Enhanced Addressing (0x04, 0x05)

**Purpose**: Extended control with additional node addressing capabilities

```
┌────────────────────────────────────────────┐
│ Enhanced Addressing Features:              │
├────────────────────────────────────────────┤
│  • Support for complex network topologies  │
│  • Additional node identification bytes    │
│  • Extended subnet control                 │
│  • Manufacturer-specific enhancements      │
└────────────────────────────────────────────┘

Note: Implementation varies by manufacturer
```

---

## Communication Types

### Communication Type Byte Values

```
┌────────┬───────────────────────────────┬─────────────────────┐
│ Value  │ Name                          │ Affects             │
├────────┼───────────────────────────────┼─────────────────────┤
│ 0x01   │ Normal Communication Messages │ Application data    │
│ 0x02   │ Network Management Messages   │ NM messages         │
│ 0x03   │ Both Types                    │ All non-diagnostic  │
└────────┴───────────────────────────────┴─────────────────────┘
```

### Type 0x01: Normal Communication Messages

**What it controls**: Application-layer messages (sensor data, actuator commands, status updates)

```
┌────────────────────────────────────────────┐
│ Normal Messages (0x01)                     │
├────────────────────────────────────────────┤
│  ✅ Controlled:                            │
│     • Engine RPM broadcasts               │
│     • Vehicle speed messages              │
│     • Sensor data transmissions           │
│     • Actuator control signals            │
│     • Status update messages              │
│                                            │
│  ❌ NOT Controlled:                        │
│     • Diagnostic messages (0x7DF, etc.)   │
│     • Network management (NM)             │
└────────────────────────────────────────────┘
```

### Type 0x02: Network Management Messages

**What it controls**: Network management layer messages (node alive, sleep requests, etc.)

```
┌────────────────────────────────────────────┐
│ Network Management Messages (0x02)         │
├────────────────────────────────────────────┤
│  ✅ Controlled:                            │
│     • Node alive messages                 │
│     • Sleep/wakeup requests               │
│     • Bus-off notifications               │
│     • Network state transitions           │
│     • Ring messages (OSEK NM)             │
│                                            │
│  ❌ NOT Controlled:                        │
│     • Diagnostic messages                 │
│     • Application messages                │
└────────────────────────────────────────────┘
```

### Type 0x03: Both Types

**What it controls**: All non-diagnostic communication

```
┌────────────────────────────────────────────┐
│ Both Types (0x03)                          │
├────────────────────────────────────────────┤
│  ✅ Controlled:                            │
│     • All normal messages (0x01)          │
│     • All NM messages (0x02)              │
│     • Essentially all non-diagnostic      │
│                                            │
│  ❌ NOT Controlled (Always Active):        │
│     • SID 0x28 (Communication Control)    │
│     • SID 0x3E (TesterPresent)            │
│     • SID 0x10 (Session Control)          │
│     • All other diagnostic services       │
└────────────────────────────────────────────┘
```

### Visual Comparison

```
              Network Traffic
        ┌─────────────────────────┐
        │                         │
        │  ┌──────────────────┐   │
        │  │  Diagnostic      │   │  ◄─── NEVER affected by 0x28
        │  │  (0x7DF, etc.)   │   │
        │  └──────────────────┘   │
        │                         │
        │  ┌──────────────────┐   │
        │  │  Normal Messages │   │  ◄─── Controlled by Type 0x01
        │  │  (App Data)      │   │
        │  └──────────────────┘   │
        │                         │
        │  ┌──────────────────┐   │
        │  │  Network Mgmt    │   │  ◄─── Controlled by Type 0x02
        │  │  (NM Messages)   │   │
        │  └──────────────────┘   │
        │                         │
        └─────────────────────────┘
                                       Type 0x03 controls BOTH
```

---

## Subnet and Node Identification

### Optional Parameter: Node Identification

```
┌─────────────────────────────────────────────────────┐
│ Request WITH Node ID (5 bytes total)                │
├─────────────────────────────────────────────────────┤
│  Byte 0: 0x28 (SID)                                 │
│  Byte 1: Control Type                               │
│  Byte 2: Communication Type                         │
│  Byte 3: Node ID High Byte                          │
│  Byte 4: Node ID Low Byte                           │
│                                                     │
│  Effect: Applies ONLY to specified subnet/node     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Request WITHOUT Node ID (3 bytes total)             │
├─────────────────────────────────────────────────────┤
│  Byte 0: 0x28 (SID)                                 │
│  Byte 1: Control Type                               │
│  Byte 2: Communication Type                         │
│                                                     │
│  Effect: Applies to ALL subnets/nodes              │
└─────────────────────────────────────────────────────┘
```

### Subnet Targeting

```
┌──────────────────────────────────────────────────────┐
│ Example Vehicle Network Architecture                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Subnet 0xF0 (Powertrain CAN)                        │
│    ├─ Engine ECU                                     │
│    ├─ Transmission ECU                               │
│    └─ Hybrid Controller                              │
│                                                      │
│  Subnet 0xF1 (Chassis CAN)                           │
│    ├─ ABS ECU                                        │
│    ├─ Steering ECU                                   │
│    └─ Suspension ECU                                 │
│                                                      │
│  Subnet 0xF2 (Body CAN)                              │
│    ├─ BCM (Body Control)                             │
│    ├─ Door Modules                                   │
│    └─ HVAC                                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Targeting Examples

#### Example 1: Disable All Subnets
```
Request: [28 03 03]
         (No Node ID = applies to ALL)

Effect:
  Subnet 0xF0: ❌ DISABLED
  Subnet 0xF1: ❌ DISABLED
  Subnet 0xF2: ❌ DISABLED
```

#### Example 2: Disable Only Powertrain Subnet
```
Request: [28 03 03 F0 00]
                  └──┴─── Subnet 0xF0

Effect:
  Subnet 0xF0: ❌ DISABLED
  Subnet 0xF1: ✅ STILL ACTIVE
  Subnet 0xF2: ✅ STILL ACTIVE
```

#### Example 3: Disable Specific Node
```
Request: [28 03 03 F0 10]
                  └──┴─── Node 0x10 on Subnet 0xF0

Effect:
  Node 0xF010 (Engine ECU): ❌ DISABLED
  Other nodes on 0xF0:      ✅ STILL ACTIVE
  Other subnets:            ✅ STILL ACTIVE
```

---

## Negative Response Codes (NRCs)

### Common NRCs for SID 0x28

```
┌────────┬────────────────────────────────┬──────────────────┐
│  NRC   │ Name                           │ Common Cause     │
├────────┼────────────────────────────────┼──────────────────┤
│ 0x12   │ Sub-Function Not Supported     │ Invalid control  │
│ 0x13   │ Incorrect Message Length       │ Wrong byte count │
│ 0x22   │ Conditions Not Correct         │ Wrong state      │
│ 0x31   │ Request Out Of Range           │ Invalid comm type│
│ 0x33   │ Security Access Denied         │ Not unlocked     │
│ 0x7F   │ Service Not Supported In...    │ Wrong session    │
└────────┴────────────────────────────────┴──────────────────┘
```

### NRC 0x12: Sub-Function Not Supported

**Meaning**: The requested control type is not implemented by this ECU

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Using unsupported control type          │
├────────────────────────────────────────────────────┤
│  Request:  [28 06 03]                              │
│             │  └─── Control Type 0x06 (invalid)    │
│             └────── SID 0x28                       │
│                                                    │
│  Response: [7F 28 12]                              │
│             │  │  └─── NRC: Sub-Function Not Sup.  │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Use supported control type            │
├────────────────────────────────────────────────────┤
│  Step 1: Check ECU documentation for supported    │
│          control types (usually 0x00-0x03)        │
│                                                    │
│  Step 2: Use valid control type                   │
│                                                    │
│  Request:  [28 03 03]                              │
│             │  └─── Control Type 0x03 (valid)      │
│             └────── SID 0x28                       │
│                                                    │
│  Response: [68 03]                                 │
│             └──── Success!                         │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Using control types 0x04, 0x05 when ECU doesn't support enhanced addressing
- Requesting manufacturer-specific control types on generic ECUs
- Using reserved/undefined subfunction values

---

### NRC 0x13: Incorrect Message Length Or Invalid Format

**Meaning**: Request has wrong number of bytes

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Missing communication type byte         │
├────────────────────────────────────────────────────┤
│  Request:  [28 03]                                 │
│             └─── Only 2 bytes (need 3 minimum)     │
│                                                    │
│  Response: [7F 28 13]                              │
│             │  │  └─── NRC: Incorrect Length       │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Complete message structure            │
├────────────────────────────────────────────────────┤
│  Request:  [28 03 03]                              │
│             │  │  └─── Communication Type          │
│             │  └────── Control Type                │
│             └───────── SID                         │
│                                                    │
│  Response: [68 03]                                 │
│             └──── Success!                         │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Sending only 2 bytes instead of minimum 3
- Including only 1 byte of Node ID instead of 2
- Adding extra unnecessary bytes

---

### NRC 0x22: Conditions Not Correct

**Meaning**: ECU state doesn't allow this operation right now

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Trying to disable comm during flash     │
├────────────────────────────────────────────────────┤
│  Current State: Programming session active         │
│                 Firmware transfer in progress      │
│                                                    │
│  Request:  [28 03 03]                              │
│             └─── Try to disable all communication  │
│                                                    │
│  Response: [7F 28 22]                              │
│             │  │  └─── NRC: Conditions Not Correct │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
│                                                    │
│  Why: Cannot disable diagnostics during active    │
│       programming operation                        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Use before starting flash             │
├────────────────────────────────────────────────────┤
│  Step 1: Enter programming session                │
│          Request:  [10 02]                         │
│          Response: [50 02 ...]                     │
│                                                    │
│  Step 2: Disable communication BEFORE flash       │
│          Request:  [28 03 03]                      │
│          Response: [68 03] ✓                       │
│                                                    │
│  Step 3: Perform flash programming                │
│          Request:  [34 ...] [36 ...] [37]         │
│                                                    │
│  Step 4: Re-enable communication                   │
│          Request:  [28 01 03]                      │
│          Response: [68 01] ✓                       │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Vehicle in motion (some ECUs prevent comm control while driving)
- Critical system active (engine running, brakes applied)
- Another diagnostic session owns communication control
- ECU in safe mode or limp home mode

---

### NRC 0x31: Request Out Of Range

**Meaning**: The communication type byte value is invalid

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Invalid communication type              │
├────────────────────────────────────────────────────┤
│  Request:  [28 03 05]                              │
│             │  │  └─── Comm Type 0x05 (invalid)    │
│             │  └────── Control Type 0x03           │
│             └───────── SID 0x28                    │
│                                                    │
│  Response: [7F 28 31]                              │
│             │  │  └─── NRC: Request Out Of Range   │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
│                                                    │
│  Why: Only 0x01, 0x02, 0x03 are valid             │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Use valid communication type          │
├────────────────────────────────────────────────────┤
│  Valid Values:                                     │
│    0x01 = Normal messages only                    │
│    0x02 = Network management only                 │
│    0x03 = Both types                              │
│                                                    │
│  Request:  [28 03 03]                              │
│             │  │  └─── Valid type (0x03)           │
│             │  └────── Control Type                │
│             └───────── SID                         │
│                                                    │
│  Response: [68 03]                                 │
│             └──── Success!                         │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Using 0x00 or values > 0x03 for communication type
- Confusing communication type with control type
- Typo in diagnostic script

---

### NRC 0x33: Security Access Denied

**Meaning**: This operation requires security unlock, but ECU is still locked

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Trying to control comm without unlock   │
├────────────────────────────────────────────────────┤
│  Current State: Security LOCKED 🔒                 │
│                                                    │
│  Request:  [28 03 03]                              │
│             └─── Try to disable communication      │
│                                                    │
│  Response: [7F 28 33]                              │
│             │  │  └─── NRC: Security Access Denied │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Unlock security first                 │
├────────────────────────────────────────────────────┤
│  Step 1: Enter appropriate session                │
│          Request:  [10 03]                         │
│          Response: [50 03 ...] ✓                   │
│                                                    │
│  Step 2: Request security seed                    │
│          Request:  [27 01]                         │
│          Response: [67 01 AB CD EF 12]             │
│                                                    │
│  Step 3: Send security key                        │
│          Request:  [27 02 XX XX XX XX]             │
│          Response: [67 02] ✓ (UNLOCKED 🔓)         │
│                                                    │
│  Step 4: Now control communication                │
│          Request:  [28 03 03]                      │
│          Response: [68 03] ✓                       │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Attempting to disable critical communication without security
- Security level expired (timeout)
- Wrong security level unlocked (need higher level)
- Session changed (security reset)

---

### NRC 0x7F: Service Not Supported In Active Session

**Meaning**: SID 0x28 is not allowed in current diagnostic session

```
┌────────────────────────────────────────────────────┐
│ ❌ WRONG: Using in default session                │
├────────────────────────────────────────────────────┤
│  Current Session: DEFAULT (0x01)                   │
│                                                    │
│  Request:  [28 03 03]                              │
│             └─── Try to control communication      │
│                                                    │
│  Response: [7F 28 7F]                              │
│             │  │  └─── NRC: Service Not Supported  │
│             │  └────── SID 0x28                    │
│             └───────── Negative Response           │
│                                                    │
│  Why: Most ECUs require Extended or Programming   │
│       session for communication control            │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ✅ CORRECT: Enter proper session first            │
├────────────────────────────────────────────────────┤
│  Step 1: Enter Extended or Programming session    │
│          Request:  [10 03]                         │
│          Response: [50 03 ...] ✓                   │
│                                                    │
│  Step 2: Now use communication control            │
│          Request:  [28 03 03]                      │
│          Response: [68 03] ✓                       │
└────────────────────────────────────────────────────┘
```

**Common Causes**:
- Trying to use SID 0x28 in Default Session
- Session timeout (reverted to Default automatically)
- Forgot to enter Extended/Programming session

---

## Session and Security Requirements

### Session Requirements

```
┌───────────────────┬──────────────────────────────────┐
│ Session Type      │ SID 0x28 Availability            │
├───────────────────┼──────────────────────────────────┤
│ DEFAULT (0x01)    │ ❌ Usually NOT supported         │
│ PROGRAMMING (0x02)│ ✅ Supported (for flash isolation)│
│ EXTENDED (0x03)   │ ✅ Supported (for diagnostics)   │
└───────────────────┴──────────────────────────────────┘
```

### Security Requirements by Use Case

```
┌─────────────────────────────┬──────────────────────┐
│ Use Case                    │ Security Required?   │
├─────────────────────────────┼──────────────────────┤
│ Disable normal messages     │ ⚠️ Sometimes         │
│ Disable all communication   │ ✅ Usually YES       │
│ Control specific subnet     │ ✅ Usually YES       │
│ Re-enable communication     │ ⚠️ Sometimes         │
│ During firmware update      │ ✅ YES               │
└─────────────────────────────┴──────────────────────┘
```

### Complete Access Flow

```
     Session State              Security State        Comm Control
┌──────────────────┐       ┌──────────────────┐   ┌──────────────┐
│   DEFAULT        │       │   LOCKED 🔒      │   │   Cannot     │
│   (0x01)         │       │                  │   │   Use 0x28   │
└────────┬─────────┘       └──────────────────┘   └──────────────┘
         │
         │ SID 0x10
         │ [10 03]
         ▼
┌──────────────────┐       ┌──────────────────┐   ┌──────────────┐
│   EXTENDED       │       │   LOCKED 🔒      │   │   Limited    │
│   (0x03)         │       │                  │   │   (May work) │
└────────┬─────────┘       └────────┬─────────┘   └──────────────┘
         │                          │
         │                          │ SID 0x27
         │                          │ [27 01] [27 02 KEY]
         │                          ▼
         │                 ┌──────────────────┐   ┌──────────────┐
         │                 │ UNLOCKED 🔓      │   │   Full       │
         └─────────────────│                  │───│   Access ✅  │
                           └──────────────────┘   └──────────────┘
```

---

## Communication State Behavior

### State Transition Diagram

```
        Initial State: Normal Operation
              (RX ✅, TX ✅)
                    │
                    │ SID 0x28 0x00 0x03
                    │ (Enable RX, Disable TX)
                    ▼
        ┌─────────────────────────┐
        │  RX Enabled  ✅         │
        │  TX Disabled ❌         │
        └───────────┬─────────────┘
                    │
                    │ SID 0x28 0x03 0x03
                    │ (Disable RX and TX)
                    ▼
        ┌─────────────────────────┐
        │  RX Disabled ❌         │
        │  TX Disabled ❌         │
        │  (Isolated for flash)   │
        └───────────┬─────────────┘
                    │
                    │ SID 0x28 0x01 0x03
                    │ (Enable RX and TX)
                    ▼
        ┌─────────────────────────┐
        │  RX Enabled  ✅         │
        │  TX Enabled  ✅         │
        │  (Normal operation)     │
        └─────────────────────────┘
```

### Persistent vs. Volatile State

```
┌────────────────────────────────────────────────────┐
│ Communication Control State Persistence            │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⚠️ VOLATILE (Lost on):                           │
│     • ECU reset (hard reset, power cycle)         │
│     • Session timeout → Default session           │
│     • Explicit restore command (0x28 0x01 0x03)   │
│                                                    │
│  ✅ PERSISTENT (Survives):                        │
│     • Diagnostic requests                         │
│     • TesterPresent messages                      │
│     • Session changes (Extended ↔ Programming)    │
│     • Security unlock/lock                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Auto-Restore Conditions

```
┌────────────────────────────────────────────────────┐
│ Automatic Communication Restore                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Communication automatically re-enabled when:     │
│                                                    │
│  1. ECU Reset (SID 0x11)                          │
│     └─ All communication returns to normal        │
│                                                    │
│  2. Session Timeout                               │
│     └─ Return to Default → normal comm restored   │
│                                                    │
│  3. Power Cycle                                   │
│     └─ Hard reset clears all states               │
│                                                    │
│  4. Explicit Enable Command                       │
│     └─ SID 0x28 0x01 0x03                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: Flash Programming Isolation

**Goal**: Prevent network interference during firmware update

```
┌──────────────────────────────────────────────────────────┐
│ Complete Flash Programming Workflow                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Enter Programming Session                      │
│          Tester → ECU: [10 02]                           │
│          ECU → Tester: [50 02 00 32 01 F4]               │
│                                                          │
│  Step 2: Unlock Security                                │
│          Tester → ECU: [27 01]                           │
│          ECU → Tester: [67 01 AB CD EF 12]               │
│          Tester → ECU: [27 02 XX XX XX XX]               │
│          ECU → Tester: [67 02] 🔓                        │
│                                                          │
│  Step 3: ⭐ Disable All Communication ⭐                │
│          Tester → ECU: [28 03 03]                        │
│          ECU → Tester: [68 03] ✓                         │
│          (ECU now isolated from network)                 │
│                                                          │
│  Step 4: Perform Flash Operations                       │
│          [34 ...] Request Download                       │
│          [36 ...] Transfer Data (multiple blocks)        │
│          [37]     Request Transfer Exit                  │
│          [31 ...] Check Programming Dependencies         │
│                                                          │
│  Step 5: ⭐ Re-enable Communication ⭐                  │
│          Tester → ECU: [28 01 03]                        │
│          ECU → Tester: [68 01] ✓                         │
│                                                          │
│  Step 6: Reset ECU                                      │
│          Tester → ECU: [11 01]                           │
│          ECU → Tester: [51 01]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why This Matters**:
- Prevents bus errors during flash write operations
- Reduces electromagnetic interference
- Ensures flash data integrity
- Prevents other ECUs from triggering safety shutdowns

---

### Use Case 2: Network Diagnostic Testing

**Goal**: Test one ECU without interference from others

```
┌──────────────────────────────────────────────────────────┐
│ Isolate ECU for Diagnostic Testing                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Scenario: Test ABS ECU without stability control       │
│            interfering                                   │
│                                                          │
│  Step 1: Enter Extended Session                         │
│          Tester → ECU: [10 03]                           │
│          ECU → Tester: [50 03 ...]                       │
│                                                          │
│  Step 2: Disable Normal App Messages                    │
│          Tester → ECU: [28 00 01]                        │
│                        │  │  └─ Normal messages only     │
│                        │  └──── Enable RX, Disable TX    │
│                        └─────── SID 0x28                 │
│                                                          │
│          ECU → Tester: [68 00] ✓                         │
│                                                          │
│          Result: ECU can READ sensor data from network  │
│                  but won't SEND control commands         │
│                  Diagnostic messages still work          │
│                                                          │
│  Step 3: Perform Diagnostic Tests                       │
│          [31 ...] Execute diagnostic routines            │
│          [22 ...] Read sensor values                     │
│                                                          │
│  Step 4: Restore Normal Communication                   │
│          Tester → ECU: [28 01 01]                        │
│          ECU → Tester: [68 01] ✓                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Use Case 3: Multi-Subnet Control

**Goal**: Control communication on specific network segments only

```
┌──────────────────────────────────────────────────────────┐
│ Disable Powertrain Network During Body Testing          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Vehicle Network:                                        │
│    Subnet 0xF0 = Powertrain CAN (Engine, Trans)         │
│    Subnet 0xF1 = Chassis CAN (ABS, Steering)            │
│    Subnet 0xF2 = Body CAN (BCM, Doors, HVAC)            │
│                                                          │
│  Goal: Test Body CAN without powertrain interference    │
│                                                          │
│  Step 1: Disable Powertrain Subnet ONLY                 │
│          Tester → ECU: [28 03 03 F0 00]                  │
│                        │  │  │  └──┴─ Subnet 0xF0        │
│                        │  │  └─────── Both types         │
│                        │  └────────── Disable RX/TX      │
│                        └───────────── SID 0x28           │
│                                                          │
│          ECU → Tester: [68 03] ✓                         │
│                                                          │
│  Current State:                                          │
│    Subnet 0xF0 (Powertrain): ❌ SILENT                  │
│    Subnet 0xF1 (Chassis):    ✅ ACTIVE                  │
│    Subnet 0xF2 (Body):       ✅ ACTIVE                  │
│                                                          │
│  Step 2: Perform Body Network Tests                     │
│          (Test door modules, HVAC, BCM, etc.)            │
│                                                          │
│  Step 3: Re-enable Powertrain Subnet                    │
│          Tester → ECU: [28 01 03 F0 00]                  │
│          ECU → Tester: [68 01] ✓                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Guide

### Problem 1: NRC 0x7F (Service Not Supported)

```
┌────────────────────────────────────────────────────┐
│ Symptom: Always get NRC 0x7F                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  ❓ Check Current Session                         │
│     ├─ Use: [22 F1 86] (Read active session)      │
│     └─ Or: [10 01] then [10 03] to enter Extended │
│                                                    │
│  ❓ Check ECU Capabilities                        │
│     ├─ Some ECUs don't support SID 0x28 at all   │
│     └─ Check: ECU datasheet or [22 F1 A0]         │
│                                                    │
│  ❓ Verify Session Timeout                        │
│     ├─ Session may have expired → Default         │
│     └─ Use: SID 0x3E (TesterPresent) regularly    │
│                                                    │
│  ✅ Solution:                                     │
│     1. Send [10 03] (Extended Session)            │
│     2. Immediately send [28 XX XX]                │
│     3. Use [3E 80] to keep session alive          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Problem 2: Communication Not Disabled

```
┌────────────────────────────────────────────────────┐
│ Symptom: Sent [28 03 03] but ECU still transmitting│
├────────────────────────────────────────────────────┤
│                                                    │
│  ❓ Check Response Code                           │
│     ├─ Did you get [68 03]? (success)             │
│     └─ Or [7F 28 XX]? (failure with NRC)          │
│                                                    │
│  ❓ Diagnostic Messages Always Active             │
│     ├─ SID 0x28 NEVER disables diagnostics        │
│     ├─ You'll still see: 0x3E (TesterPresent)     │
│     │                    0x22 (Read Data)          │
│     │                    etc.                      │
│     └─ This is NORMAL and EXPECTED                │
│                                                    │
│  ❓ Wrong Communication Type                      │
│     ├─ Did you use Type 0x01 (normal only)?       │
│     └─ Try Type 0x03 (both normal + NM)           │
│                                                    │
│  ❓ Wrong Target Subnet                           │
│     ├─ Did you specify a subnet that's not active?│
│     └─ Try without Node ID (affects all subnets)  │
│                                                    │
│  ✅ Solution:                                     │
│     1. Verify [68 03] response received           │
│     2. Use network monitor to check traffic       │
│     3. Ignore diagnostic messages (they persist)  │
│     4. Use [28 03 03] without Node ID             │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Problem 3: Cannot Re-Enable Communication

```
┌────────────────────────────────────────────────────┐
│ Symptom: Disabled comm with [28 03 03] but        │
│          [28 01 03] doesn't restore it             │
├────────────────────────────────────────────────────┤
│                                                    │
│  ❓ Check If ECU Reset                            │
│     ├─ Reset automatically restores communication │
│     ├─ Use: [11 01] to reset                      │
│     └─ Or: Power cycle the ECU                    │
│                                                    │
│  ❓ Session Changed                               │
│     ├─ Did session timeout?                       │
│     ├─ Communication control is session-specific  │
│     └─ Re-enter: [10 03]                          │
│                                                    │
│  ❓ Security Lock                                 │
│     ├─ Re-enable may require security             │
│     └─ Unlock: [27 01] [27 02 KEY]                │
│                                                    │
│  ❓ Wrong Target                                  │
│     ├─ Did you disable subnet 0xF0 but trying to  │
│     │   enable without specifying subnet?         │
│     └─ Use same Node ID in enable as disable      │
│                                                    │
│  ✅ Solution:                                     │
│     1. Reset ECU: [11 01] (easiest)               │
│     2. Or match disable/enable parameters exactly │
│     3. Power cycle as last resort                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Problem 4: Flash Programming Fails After Comm Disable

```
┌────────────────────────────────────────────────────┐
│ Symptom: [28 03 03] works, but flash fails with   │
│          timeout or NRC 0x78                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  ❓ TesterPresent Not Sent                        │
│     ├─ Even with comm disabled, need [3E 80]      │
│     └─ Send every 2 seconds during flash          │
│                                                    │
│  ❓ Diagnostic Subnet Also Disabled               │
│     ├─ Did you disable the diagnostic subnet too? │
│     └─ Keep diagnostic CAN active                 │
│                                                    │
│  ❓ Timing Issue                                  │
│     ├─ Some ECUs need delay after [28 03 03]      │
│     └─ Wait 100ms before [34 ...] command         │
│                                                    │
│  ❓ Power Supply Dropped                          │
│     ├─ Disabling TX may affect power management   │
│     └─ Ensure external power supply connected     │
│                                                    │
│  ✅ Solution:                                     │
│     1. Send [3E 80] every 2s throughout flash     │
│     2. Only disable non-diagnostic subnets        │
│     3. Add 100ms delay after comm control         │
│     4. Use stable power supply                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Command Quick Reference

```
┌──────────────────────┬──────────────────────────────────┐
│ Command              │ Purpose                          │
├──────────────────────┼──────────────────────────────────┤
│ 28 00 01             │ Disable TX, normal messages      │
│ 28 00 03             │ Disable TX, all messages         │
│ 28 01 01             │ Enable all, normal messages      │
│ 28 01 03             │ Enable all, all messages         │
│ 28 03 01             │ Disable all, normal messages     │
│ 28 03 03             │ Disable all, all messages        │
│ 28 03 03 F0 00       │ Disable subnet 0xF0              │
└──────────────────────┴──────────────────────────────────┘
```

### Control Type Summary

```
┌──────┬────────────────────┬─────┬─────┐
│ Type │ Name               │  RX │ TX  │
├──────┼────────────────────┼─────┼─────┤
│ 0x00 │ RX only            │  ✅ │ ❌  │
│ 0x01 │ Both enabled       │  ✅ │ ✅  │
│ 0x02 │ TX only            │  ❌ │ ✅  │
│ 0x03 │ Both disabled      │  ❌ │ ❌  │
└──────┴────────────────────┴─────┴─────┘
```

### Communication Type Summary

```
┌──────┬────────────────────────────────┐
│ Type │ Affects                        │
├──────┼────────────────────────────────┤
│ 0x01 │ Normal application messages    │
│ 0x02 │ Network management messages    │
│ 0x03 │ Both (all non-diagnostic)      │
└──────┴────────────────────────────────┘
```

### Session Requirements

```
┌────────────┬─────────────────┐
│ Session    │ SID 0x28 Status │
├────────────┼─────────────────┤
│ DEFAULT    │ ❌ Usually NO   │
│ EXTENDED   │ ✅ YES          │
│ PROGRAMMING│ ✅ YES          │
└────────────┴─────────────────┘
```

### Common NRCs

```
┌──────┬────────────────────────────────┐
│ NRC  │ Meaning                        │
├──────┼────────────────────────────────┤
│ 0x12 │ Invalid control type           │
│ 0x13 │ Wrong message length           │
│ 0x22 │ Wrong ECU state                │
│ 0x31 │ Invalid communication type     │
│ 0x33 │ Security required              │
│ 0x7F │ Wrong session                  │
└──────┴────────────────────────────────┘
```

### Best Practices Checklist

```
✅ Enter Extended/Programming session first
✅ Unlock security if required (check ECU specs)
✅ Use [3E 80] to maintain session during operations
✅ Disable communication BEFORE flash programming
✅ Re-enable communication AFTER flash complete
✅ Reset ECU to restore normal operation
✅ Remember: Diagnostics always stay active
✅ Match disable/enable Node IDs if using subnet targeting
✅ Wait 100ms after comm control before next operation
✅ Monitor network to verify disable/enable worked
```

---

## ISO 14229-1 References

### Primary Reference

```
┌─────────────────────────────────────────────────────┐
│ ISO 14229-1:2020                                    │
│ Section 9.5: CommunicationControl (0x28)           │
├─────────────────────────────────────────────────────┤
│  • Message format specifications                   │
│  • Control type definitions                        │
│  • Communication type definitions                  │
│  • Subnet/node identification parameter            │
│  • Negative response code definitions              │
│  • State persistence behavior                      │
└─────────────────────────────────────────────────────┘
```

### Related Sections

- **Section 6.2**: Diagnostic session types (when to use 0x28)
- **Section 7.5**: Negative response codes (NRC definitions)
- **Section 9.1**: Session control (session requirements)
- **Section 9.3**: Security access (security requirements)
- **Section 11.11**: ECU reset (auto-restore on reset)

---

**End of SID 0x28 Main Theoretical Guide**

**Next Steps**:
- Read: [SID_28_PRACTICAL_IMPLEMENTATION.md](./SID_28_PRACTICAL_IMPLEMENTATION.md) for flowcharts and state machines
- Read: [SID_28_SERVICE_INTERACTIONS.md](./SID_28_SERVICE_INTERACTIONS.md) for multi-service workflows
