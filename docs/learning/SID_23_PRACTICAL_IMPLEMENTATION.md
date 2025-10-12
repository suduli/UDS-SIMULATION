# SID 0x23: Read Memory By Address - Practical Implementation

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 11.3

---

## Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [ALFID Validation Logic](#alfid-validation-logic)
3. [Memory Address Validation](#memory-address-validation)
4. [Security Check Decision Tree](#security-check-decision-tree)
5. [Session State Validation](#session-state-validation)
6. [Memory Read Operation](#memory-read-operation)
7. [NRC Decision Tree](#nrc-decision-tree)
8. [Testing Scenarios](#testing-scenarios)
9. [Debugging Flowcharts](#debugging-flowcharts)
10. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Complete Request Handler Flow

```
                    ┌──────────────────┐
                    │  Receive Request │
                    │   (SID 0x23)     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Message Length   │
                ┌───┤ >= 2 bytes?      │───┐
                │   └──────────────────┘   │
               Yes                         No
                │                           │
                ▼                           ▼
       ┌──────────────────┐        ┌──────────────┐
       │ Extract ALFID    │        │ Return NRC   │
       │ from byte[1]     │        │    0x13      │
       └────────┬─────────┘        └──────────────┘
                │
                ▼
       ┌──────────────────┐
       │ Parse ALFID:     │
       │ addrLen = low    │
       │ sizeLen = high   │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │ Expected length  │
   ┌───┤ = 2 + addrLen +  │───┐
   │   │   sizeLen ?      │   │
  Yes  └──────────────────┘   No
   │                           │
   ▼                           ▼
┌──────────────────┐   ┌──────────────┐
│ Extract Address  │   │ Return NRC   │
│ and Size params  │   │    0x13      │
└────────┬─────────┘   └──────────────┘
         │
         ▼
┌──────────────────┐
│ Validate current │
│ diagnostic       │───┐
│ session          │   │
└────────┬─────────┘   │
         │             │
        Yes       Session OK?
         │             │
         ▼             No
┌──────────────────┐   │
│ Validate address │   ▼
│ range against    │───┐  ┌──────────────┐
│ memory map       │   │  │ Return NRC   │
└────────┬─────────┘   │  │    0x22      │
         │             │  └──────────────┘
        Yes      Valid?  │
         │             │ No
         ▼             │
┌──────────────────┐   │
│ Check security   │   ▼
│ level for this   │───┐  ┌──────────────┐
│ memory region    │   │  │ Return NRC   │
└────────┬─────────┘   │  │    0x31      │
         │             │  └──────────────┘
   Security OK?        │
         │             No
        Yes            │
         │             ▼
         │     ┌──────────────┐
         │     │ Return NRC   │
         │     │    0x33      │
         │     └──────────────┘
         ▼
┌──────────────────┐
│ Read memory      │
│ from address     │
│ for size bytes   │
└────────┬─────────┘
         │
    Read success?
         │
        Yes
         │
         ▼
┌──────────────────┐
│ Build response:  │
│ [0x63][data...]  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Send positive    │
│ response         │
└──────────────────┘
```

---

## ALFID Validation Logic

### ALFID Parsing Flowchart

```
                ┌──────────────────┐
                │ Read ALFID byte  │
                │  (byte[1])       │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Split into       │
                │ nibbles:         │
                │ high = bits 7-4  │
                │ low = bits 3-0   │
                └────────┬─────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ sizeLen = high nibble          │
        │ addrLen = low nibble           │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
    ┌───┤ sizeLen in range [1-15]?       │───┐
    │   │ addrLen in range [1-15]?       │   │
   Yes  └────────────────────────────────┘   No
    │                                         │
    │                                         ▼
    │                               ┌──────────────────┐
    │                               │ Invalid ALFID    │
    │                               │ Return NRC 0x13  │
    │                               └──────────────────┘
    │
    ▼
┌────────────────────────────────┐
│ Calculate expected msg length: │
│ expected = 2 + addrLen +       │
│            sizeLen             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ actual = received message len  │
└────────┬───────────────────────┘
         │
         ▼
    ┌────────────────┐
┌───┤ actual ==      │───┐
│   │ expected?      │   │
│   └────────────────┘   │
Yes                      No
│                         │
▼                         ▼
┌─────────────┐   ┌──────────────────┐
│ ALFID Valid │   │ Length mismatch  │
│ Continue... │   │ Return NRC 0x13  │
└─────────────┘   └──────────────────┘
```

### ALFID Validation Examples

```
┌────────────────────────────────────────────────────────────────┐
│ Example 1: ALFID 0x44                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ALFID = 0x44 = 0100 0100 (binary)                             │
│                 ────┬──── ────┬────                            │
│                     4         4                                │
│                     │         │                                │
│              sizeLen = 4  addrLen = 4                          │
│                                                                │
│  Expected message length:                                      │
│    2 (SID + ALFID) + 4 (address) + 4 (size) = 10 bytes         │
│                                                                │
│  Valid request: [23 44 00 10 20 30 00 00 01 00]                │
│                  │  │  └────┬────┘ └────┬────┘                │
│                  │  │     4 bytes     4 bytes                  │
│                  │  └─ ALFID                                   │
│                  └──── SID                                     │
│                                                                │
│  Length check: 10 bytes received = 10 expected ✓               │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Example 2: ALFID 0x24                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ALFID = 0x24 = 0010 0100 (binary)                             │
│                 ────┬──── ────┬────                            │
│                     2         4                                │
│                     │         │                                │
│              sizeLen = 2  addrLen = 4                          │
│                                                                │
│  Expected message length:                                      │
│    2 (SID + ALFID) + 4 (address) + 2 (size) = 8 bytes          │
│                                                                │
│  Valid request: [23 24 00 10 20 30 01 00]                      │
│                  │  │  └────┬────┘ └─┬──┘                     │
│                  │  │     4 bytes   2 bytes                    │
│                  │  └─ ALFID                                   │
│                  └──── SID                                     │
│                                                                │
│  Length check: 8 bytes received = 8 expected ✓                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Memory Address Validation

### Address Range Check Flowchart

```
                ┌──────────────────┐
                │ Extract address  │
                │ and size from    │
                │ request          │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
            ┌───┤ size > 0 ?       │───┐
            │   └──────────────────┘   │
           Yes                         No
            │                           │
            ▼                           ▼
   ┌──────────────────┐        ┌──────────────┐
   │ endAddr =        │        │ Invalid size │
   │ address + size   │        │ Return 0x31  │
   └────────┬─────────┘        └──────────────┘
            │
            ▼
   ┌──────────────────┐
┌──┤ Check overflow:  │──┐
│  │ endAddr >        │  │
│  │ address?         │  │
│  └──────────────────┘  │
No                      Yes
│                        │
▼                        ▼
┌──────────────┐  ┌──────────────────┐
│ Overflow!    │  │ Loop through     │
│ Return 0x31  │  │ memory regions   │
└──────────────┘  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
              ┌───┤ Region found     │───┐
              │   │ containing       │   │
              │   │ [address,        │   │
             Yes  │  endAddr)?       │   No
              │   └──────────────────┘   │
              │                          │
              ▼                          ▼
     ┌──────────────────┐       ┌──────────────┐
     │ Check region     │       │ No valid     │
     │ permissions      │       │ region       │
     └────────┬─────────┘       │ Return 0x31  │
              │                 └──────────────┘
              ▼
     ┌──────────────────┐
 ┌───┤ Readable?        │───┐
 │   └──────────────────┘   │
Yes                         No
 │                           │
 ▼                           ▼
┌──────────────┐    ┌──────────────────┐
│ Valid ✓      │    │ Not readable     │
│ Continue...  │    │ Return 0x31      │
└──────────────┘    └──────────────────┘
```

### Memory Map Structure Example

```
┌────────────────────────────────────────────────────────────────┐
│                    MEMORY MAP VALIDATION                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Memory Regions Table:                                         │
│                                                                │
│  ┌────────────┬────────────┬───────────┬──────────────┐        │
│  │ Start Addr │  End Addr  │   Type    │  Readable?   │        │
│  ├────────────┼────────────┼───────────┼──────────────┤        │
│  │ 0x00000000 │ 0x00000FFF │ Reserved  │      No      │        │
│  │ 0x00001000 │ 0x000FFFFF │ Flash     │     Yes      │        │
│  │ 0x00100000 │ 0x001FFFFF │ Calib     │     Yes      │        │
│  │ 0x00200000 │ 0x002FFFFF │ Reserved  │      No      │        │
│  │ 0x00300000 │ 0x003FFFFF │ RAM       │     Yes      │        │
│  └────────────┴────────────┴───────────┴──────────────┘        │
│                                                                │
│  Validation Logic:                                             │
│                                                                │
│  Request: address=0x00100500, size=0x100                       │
│                                                                │
│  Step 1: Calculate endAddr                                     │
│    endAddr = 0x00100500 + 0x100 = 0x00100600                   │
│                                                                │
│  Step 2: Find containing region                                │
│    Check: 0x00100500 >= 0x00100000? Yes                        │
│           0x00100600 <= 0x001FFFFF? Yes                        │
│    Region: Calibration                                         │
│                                                                │
│  Step 3: Check permissions                                     │
│    Readable? Yes ✓                                             │
│                                                                │
│  Result: VALID - proceed with read                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Address Validation Error Cases

```
┌────────────────────────────────────────────────────────────────┐
│ ERROR CASE 1: Address before any region                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: address=0x00000100, size=0x10                        │
│                                                                │
│  0x00000000 ┌──────────────┐                                   │
│             │  Reserved    │                                   │
│  0x00000100 │   ← HERE     │  ✗ Not readable                   │
│             │              │                                   │
│  0x00001000 ├──────────────┤                                   │
│             │  Flash       │                                   │
│                                                                │
│  Result: NRC 0x31 (Request Out of Range)                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ERROR CASE 2: Range spans multiple regions                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: address=0x000FFF00, size=0x200                       │
│  endAddr: 0x000FFF00 + 0x200 = 0x00100100                      │
│                                                                │
│  0x000FFFFF ┌──────────────┐                                   │
│             │  Flash       │ ← Start here                      │
│  0x00100000 ├──────────────┤ ← Crosses boundary!               │
│             │ Calibration  │ ← Ends here                       │
│  0x00100100 │              │                                   │
│                                                                │
│  Result: NRC 0x31 (spans multiple regions - not allowed)       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ERROR CASE 3: Integer overflow                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Request: address=0xFFFFFF00, size=0x200                       │
│  endAddr: 0xFFFFFF00 + 0x200 = 0x00000100 (wraps!)             │
│                                                                │
│  Overflow detection:                                           │
│    if (endAddr < address) → OVERFLOW                           │
│    0x00000100 < 0xFFFFFF00 → TRUE                              │
│                                                                │
│  Result: NRC 0x31 (overflow detected)                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Security Check Decision Tree

### Security Validation Flow

```
                ┌──────────────────┐
                │ Get memory       │
                │ region for       │
                │ address          │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
            ┌───┤ Region requires  │───┐
            │   │ security?        │   │
            │   └──────────────────┘   │
           Yes                         No
            │                           │
            ▼                           ▼
   ┌──────────────────┐        ┌──────────────┐
   │ Get required     │        │ No security  │
   │ security level   │        │ needed ✓     │
   └────────┬─────────┘        └──────────────┘
            │
            ▼
   ┌──────────────────┐
   │ Get current      │
   │ security state   │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
┌──┤ Security level   │──┐
│  │ unlocked >=      │  │
│  │ required level?  │  │
Yes└──────────────────┘  No
│                        │
▼                        ▼
┌──────────────┐  ┌──────────────────┐
│ Check not    │  │ Security locked  │
│ expired      │  │ Return NRC 0x33  │
└──────┬───────┘  └──────────────────┘
       │
       ▼
┌──────────────────┐
│ Current time <   │──┐
│ unlock_time +    │  │
│ timeout?         │  │
└──────────────────┘  │
       │              │
      Yes             No
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────┐
│ Security OK  │  │ Security expired │
│ Continue ✓   │  │ Return NRC 0x33  │
└──────────────┘  └──────────────────┘
```

### Security Level Matrix

```
┌────────────────────────────────────────────────────────────────┐
│             SECURITY LEVEL REQUIREMENTS                        │
├─────────────────────┬──────────────┬────────────────────────────┤
│ Memory Region       │ Sec Level    │ Unlock Command             │
├─────────────────────┼──────────────┼────────────────────────────┤
│ Public Calibration  │ Level 0      │ None needed                │
│ Flash Code          │ Level 1      │ SID 0x27 0x01/0x02         │
│ OEM Calibration     │ Level 1      │ SID 0x27 0x01/0x02         │
│ Security Data       │ Level 2      │ SID 0x27 0x03/0x04         │
│ Bootloader          │ Level 3      │ SID 0x27 0x05/0x06         │
└─────────────────────┴──────────────┴────────────────────────────┘
```

### Security State Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                   SECURITY STATE MACHINE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Initial State:                                                │
│  ┌───────────────┐                                             │
│  │  ALL LOCKED   │                                             │
│  │     🔒        │                                             │
│  │  Level 0: ✓   │  (Public always accessible)                │
│  │  Level 1: ✗   │                                             │
│  │  Level 2: ✗   │                                             │
│  │  Level 3: ✗   │                                             │
│  └───────┬───────┘                                             │
│          │                                                     │
│          │ SID 0x27 0x01/0x02 (Unlock Level 1)                 │
│          │                                                     │
│          ▼                                                     │
│  ┌───────────────┐                                             │
│  │ LEVEL 1       │                                             │
│  │ UNLOCKED 🔓   │                                             │
│  │  Level 0: ✓   │                                             │
│  │  Level 1: ✓   │  ← Can read Flash, OEM Calib               │
│  │  Level 2: ✗   │                                             │
│  │  Level 3: ✗   │                                             │
│  └───────┬───────┘                                             │
│          │                                                     │
│          │ SID 0x27 0x03/0x04 (Unlock Level 2)                 │
│          │                                                     │
│          ▼                                                     │
│  ┌───────────────┐                                             │
│  │ LEVEL 2       │                                             │
│  │ UNLOCKED 🔓   │                                             │
│  │  Level 0: ✓   │                                             │
│  │  Level 1: ✓   │                                             │
│  │  Level 2: ✓   │  ← Can read Security Data                  │
│  │  Level 3: ✗   │                                             │
│  └───────────────┘                                             │
│                                                                │
│  Lock conditions (return to ALL LOCKED):                       │
│    • Session timeout                                           │
│    • Session change (SID 0x10)                                 │
│    • Security timeout (5000ms default)                         │
│    • ECU reset                                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Session State Validation

### Session Check Flowchart

```
                ┌──────────────────┐
                │ Get current      │
                │ diagnostic       │
                │ session          │
                └────────┬─────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │ Session is one of:         │
        │ • Extended (0x03)          │
    ┌───┤ • Programming (0x02)       │───┐
    │   │ • Custom diagnostic        │   │
   Yes  └────────────────────────────┘   No
    │                                    │
    ▼                                    ▼
┌──────────────────┐            ┌──────────────────┐
│ Check session    │            │ Wrong session    │
│ timeout          │            │ Return NRC 0x22  │
└────────┬─────────┘            └──────────────────┘
         │
         ▼
┌──────────────────┐
│ Current time <   │──┐
│ session_start +  │  │
│ timeout?         │  │
└──────────────────┘  │
         │            │
        Yes           No
         │            │
         ▼            ▼
┌──────────────┐  ┌──────────────────┐
│ Session OK ✓ │  │ Session timeout  │
│ Continue...  │  │ Return NRC 0x22  │
└──────────────┘  └──────────────────┘
```

### Session Timeout Visualization

```
┌────────────────────────────────────────────────────────────────┐
│                    SESSION TIMEOUT TIMELINE                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Time: 0ms                                                     │
│  ├──► SID 0x10 0x03 (Enter Extended Session)                   │
│  │    Response: [50 03 00 32 01 F4]                            │
│  │              P3Server=50ms, P3*Server=500ms                 │
│  │                                                             │
│  │    Session Active: EXTENDED (0x03)                          │
│  │    Timeout: 5000ms                                          │
│  │                                                             │
│  Time: 1000ms                                                  │
│  ├──► SID 0x23 ... (Read Memory)                               │
│  │    Response: [63 ...] ✓                                     │
│  │    Session timeout reset to 5000ms                          │
│  │                                                             │
│  Time: 2000ms                                                  │
│  ├──► SID 0x3E 0x80 (Tester Present)                           │
│  │    Response: [7E 00] ✓                                      │
│  │    Session timeout reset to 5000ms                          │
│  │                                                             │
│  Time: 7000ms (no activity for 5000ms)                         │
│  ├──► Session timeout!                                         │
│  │    Auto-switch to DEFAULT SESSION (0x01)                    │
│  │                                                             │
│  Time: 7100ms                                                  │
│  └──► SID 0x23 ... (Read Memory)                               │
│       Response: [7F 23 22] ✗                                   │
│       (Conditions not correct - wrong session)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Memory Read Operation

### Physical Memory Read Flow

```
                ┌──────────────────┐
                │ All validations  │
                │ passed ✓         │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Calculate start  │
                │ pointer:         │
                │ ptr = base +     │
                │       address    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Allocate buffer  │
                │ for response:    │
                │ buf[1 + size]    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ buf[0] = 0x63    │
                │ (response SID)   │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Initialize       │
                │ byte counter = 0 │
                └────────┬─────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Loop while           │
          ┌───┤ counter < size       │───┐
          │   └──────────────────────┘   │
         Yes                             No
          │                               │
          ▼                               ▼
 ┌──────────────────┐            ┌──────────────┐
 │ Try read byte    │            │ All bytes    │
 │ from ptr+counter │            │ read ✓       │
 └────────┬─────────┘            └──────┬───────┘
          │                              │
          ▼                              │
 ┌──────────────────┐                    │
 │ Read successful? │──┐                 │
 └──────────────────┘  │                 │
          │            │                 │
         Yes           No                │
          │            │                 │
          ▼            ▼                 │
 ┌──────────────┐  ┌──────────────┐     │
 │ buf[1+cnt]=  │  │ Memory error │     │
 │ data_byte    │  │ Return 0x72  │     │
 └──────┬───────┘  └──────────────┘     │
        │                                │
        ▼                                │
 ┌──────────────┐                        │
 │ counter++    │                        │
 └──────┬───────┘                        │
        │                                │
        └────► Loop                      │
                                         │
                                         ▼
                                ┌──────────────┐
                                │ Send buf[]   │
                                │ to tester    │
                                └──────────────┘
```

### Memory Access Error Handling

```
┌────────────────────────────────────────────────────────────────┐
│              MEMORY ACCESS ERROR SCENARIOS                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Scenario 1: ECC/Parity Error                                   │
│  ┌────────────────────────────────────────────┐                │
│  │ Read byte at address 0x00100500            │                │
│  │ Hardware detects ECC error                 │                │
│  │ → Cannot return corrupted data             │                │
│  │ → Return NRC 0x72 (General Program Fail)   │                │
│  └────────────────────────────────────────────┘                │
│                                                                │
│ Scenario 2: Bus Timeout                                        │
│  ┌────────────────────────────────────────────┐                │
│  │ Read byte from slow memory region          │                │
│  │ Wait 100ms... timeout!                     │                │
│  │ → Memory not responding                    │                │
│  │ → Return NRC 0x72 (General Program Fail)   │                │
│  └────────────────────────────────────────────┘                │
│                                                                │
│ Scenario 3: Access Violation                                   │
│  ┌────────────────────────────────────────────┐                │
│  │ Try to read hardware register              │                │
│  │ Processor raises exception                 │                │
│  │ → Catch exception in handler               │                │
│  │ → Return NRC 0x72 (General Program Fail)   │                │
│  └────────────────────────────────────────────┘                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## NRC Decision Tree

### Complete NRC Selection Logic

```
                    ┌──────────────────┐
                    │ Request received │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                ┌───┤ Length >= 2?     │───┐
                │   └──────────────────┘   │
               Yes                         No──► NRC 0x13
                │
                ▼
       ┌──────────────────┐
   ┌───┤ ALFID valid?     │───┐
   │   │ (nibbles 1-15)   │   │
  Yes  └──────────────────┘   No──► NRC 0x13
   │
   ▼
┌──────────────────┐
│ Parse address    │
│ and size lengths │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Actual length == │───┐
│ expected?        │   │
└──────────────────┘   │
         │             No──► NRC 0x13
        Yes
         │
         ▼
┌──────────────────┐
│ Session is       │───┐
│ Extended/Prog?   │   │
└──────────────────┘   │
         │             No──► NRC 0x22
        Yes
         │
         ▼
┌──────────────────┐
│ Session not      │───┐
│ timed out?       │   │
└──────────────────┘   │
         │             No──► NRC 0x22
        Yes
         │
         ▼
┌──────────────────┐
│ Size > 0?        │───┐
└──────────────────┘   │
         │             No──► NRC 0x31
        Yes
         │
         ▼
┌──────────────────┐
│ No overflow?     │───┐
└──────────────────┘   │
         │             No──► NRC 0x31
        Yes
         │
         ▼
┌──────────────────┐
│ Address in       │───┐
│ valid region?    │   │
└──────────────────┘   │
         │             No──► NRC 0x31
        Yes
         │
         ▼
┌──────────────────┐
│ Region readable? │───┐
└──────────────────┘   │
         │             No──► NRC 0x31
        Yes
         │
         ▼
┌──────────────────┐
│ Security level   │───┐
│ sufficient?      │   │
└──────────────────┘   │
         │             No──► NRC 0x33
        Yes
         │
         ▼
┌──────────────────┐
│ Security not     │───┐
│ expired?         │   │
└──────────────────┘   │
         │             No──► NRC 0x33
        Yes
         │
         ▼
┌──────────────────┐
│ Perform memory   │
│ read operation   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Read successful? │───┐
└──────────────────┘   │
         │             No──► NRC 0x72
        Yes
         │
         ▼
┌──────────────────┐
│ Send positive    │
│ response 0x63    │
└──────────────────┘
```

---

## Testing Scenarios

### Test Case 1: Basic Read - Happy Path

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 1: Successful Memory Read                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Preconditions:                                                 │
│   • ECU in Extended Diagnostic Session                         │
│   • No security required for target address                    │
│   • Address 0x00100000 contains known test pattern             │
│                                                                │
│ Test Steps:                                                    │
│                                                                │
│   Step 1: Setup                                                │
│   ├─► SID 0x10 0x03 (Enter Extended Session)                   │
│   └─► Expected: [50 03 00 32 01 F4]                            │
│                                                                │
│   Step 2: Read 8 bytes from 0x00100000                         │
│   ├─► Request: [23 44 00 10 00 00 00 00 00 08]                 │
│   │            │  │  └────┬────┘ └────┬────┘                  │
│   │            │  │    Address      Size                       │
│   │            │  └─ ALFID 0x44                                │
│   │            └──── SID 0x23                                  │
│   │                                                            │
│   └─► Expected: [63 AA BB CC DD EE FF 00 11]                   │
│                 │  └──────────┬──────────────┘                │
│                 │          8 bytes                             │
│                 └──── Response SID                             │
│                                                                │
│ Pass Criteria:                                                 │
│   ✓ Response SID = 0x63                                        │
│   ✓ Data length = 8 bytes                                      │
│   ✓ Data matches expected test pattern                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Case 2: Security Required

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 2: Protected Memory Read with Security              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Preconditions:                                                 │
│   • ECU in Extended Session                                    │
│   • Address 0xFF000000 requires Level 1 security               │
│   • Security is currently locked 🔒                            │
│                                                                │
│ Test Steps:                                                    │
│                                                                │
│   Step 1: Try read without unlock (should fail)                │
│   ├─► Request: [23 44 FF 00 00 00 00 00 00 04]                 │
│   └─► Expected: [7F 23 33]  (Security Access Denied)           │
│                                                                │
│   Step 2: Unlock security Level 1                              │
│   ├─► Request Seed: [27 01]                                    │
│   ├─► Response: [67 01 12 34 56 78]                            │
│   ├─► Calculate Key (algorithm specific)                       │
│   ├─► Send Key: [27 02 AB CD EF 01]                            │
│   └─► Response: [67 02] ✓ (Unlocked 🔓)                        │
│                                                                │
│   Step 3: Retry read (should succeed)                          │
│   ├─► Request: [23 44 FF 00 00 00 00 00 00 04]                 │
│   └─► Expected: [63 XX XX XX XX]                               │
│                 │  └────┬─────┘                                │
│                 │    4 bytes                                   │
│                 └──── Success!                                 │
│                                                                │
│ Pass Criteria:                                                 │
│   ✓ Step 1 returns NRC 0x33                                    │
│   ✓ Step 2 unlocks security                                    │
│   ✓ Step 3 returns positive response                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Case 3: Invalid Address

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 3: Out of Range Address                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Preconditions:                                                 │
│   • ECU in Extended Session                                    │
│   • Address 0xFFFFFFFF is beyond valid memory map              │
│                                                                │
│ Test Steps:                                                    │
│                                                                │
│   Step 1: Read from invalid address                            │
│   ├─► Request: [23 44 FF FF FF FF 00 00 00 10]                 │
│   │            │  │  └────┬────┘ └────┬────┘                  │
│   │            │  │    Invalid       Size                      │
│   │            │  │    address                                 │
│   │            │  └─ ALFID 0x44                                │
│   │            └──── SID 0x23                                  │
│   │                                                            │
│   └─► Expected: [7F 23 31]  (Request Out of Range)             │
│                                                                │
│ Pass Criteria:                                                 │
│   ✓ Response is NRC 0x31                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Case 4: ALFID Mismatch

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 4: Incorrect Message Length                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Preconditions:                                                 │
│   • ECU in Extended Session                                    │
│                                                                │
│ Test Steps:                                                    │
│                                                                │
│   Step 1: Send ALFID 0x44 but only 3 address bytes             │
│   ├─► Request: [23 44 00 10 20 00 00 00 10]                    │
│   │            │  │  └──┬──┘ └────┬────┘                      │
│   │            │  │   3 bytes!  4 bytes                        │
│   │            │  └─ Says 4-byte address                       │
│   │            └──── SID 0x23                                  │
│   │                                                            │
│   │  Expected length: 2 + 4 + 4 = 10 bytes                     │
│   │  Actual length: 2 + 3 + 4 = 9 bytes                        │
│   │                                                            │
│   └─► Expected: [7F 23 13]  (Incorrect Message Length)         │
│                                                                │
│ Pass Criteria:                                                 │
│   ✓ Response is NRC 0x13                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Test Case 5: Session Timeout

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 5: Session Timeout During Long Operation            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Preconditions:                                                 │
│   • ECU in Extended Session with 5s timeout                    │
│                                                                │
│ Test Steps:                                                    │
│                                                                │
│   Step 1: Enter Extended Session                               │
│   ├─► Request: [10 03]                                         │
│   └─► Response: [50 03 00 32 01 F4] (timeout = 5000ms)         │
│                                                                │
│   Step 2: Wait 6 seconds (exceed timeout)                      │
│   └─► ECU auto-switches to Default Session                     │
│                                                                │
│   Step 3: Try to read memory                                   │
│   ├─► Request: [23 44 00 10 00 00 00 00 00 10]                 │
│   └─► Expected: [7F 23 22] (Conditions Not Correct)            │
│                                                                │
│ Pass Criteria:                                                 │
│   ✓ After timeout, SID 0x23 returns NRC 0x22                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### Debugging NRC 0x13 (Length Error)

```
┌────────────────────────────────────────────────────────────────┐
│              DEBUGGING NRC 0x13 FLOWCHART                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    Start: Got NRC 0x13                         │
│                           │                                    │
│                           ▼                                    │
│                  ┌────────────────┐                            │
│                  │ Log request    │                            │
│                  │ byte array     │                            │
│                  └───────┬────────┘                            │
│                          │                                     │
│                          ▼                                     │
│                  ┌────────────────┐                            │
│              ┌───┤ Request has    │───┐                        │
│              │   │ >= 2 bytes?    │   │                        │
│             Yes  └────────────────┘   No                       │
│              │                         │                       │
│              ▼                         ▼                       │
│     ┌────────────────┐        ┌────────────────┐              │
│     │ Extract ALFID  │        │ Message too    │              │
│     │ byte[1]        │        │ short!         │              │
│     └───────┬────────┘        │ FIX: Check     │              │
│             │                 │ transmission   │              │
│             ▼                 └────────────────┘              │
│     ┌────────────────┐                                        │
│     │ Parse ALFID:   │                                        │
│     │ high = byte>>4 │                                        │
│     │ low = byte&0xF │                                        │
│     └───────┬────────┘                                        │
│             │                                                 │
│             ▼                                                 │
│     ┌────────────────┐                                        │
│     │ Expected len = │                                        │
│     │ 2+high+low     │                                        │
│     └───────┬────────┘                                        │
│             │                                                 │
│             ▼                                                 │
│     ┌────────────────┐                                        │
│     │ Actual len =   │                                        │
│     │ message.length │                                        │
│     └───────┬────────┘                                        │
│             │                                                 │
│             ▼                                                 │
│        ┌────────────────────┐                                 │
│    ┌───┤ Expected ==        │───┐                             │
│    │   │ Actual?            │   │                             │
│   Yes  └────────────────────┘   No                            │
│    │                             │                            │
│    ▼                             ▼                            │
│ ┌──────────┐           ┌────────────────┐                     │
│ │ ALFID OK │           │ LENGTH         │                     │
│ │ Bug else-│           │ MISMATCH!      │                     │
│ │ where    │           │                │                     │
│ └──────────┘           │ FIX OPTIONS:   │                     │
│                        │ 1. Wrong ALFID │                     │
│                        │ 2. Missing     │                     │
│                        │    bytes       │                     │
│                        │ 3. Extra bytes │                     │
│                        └────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Debugging NRC 0x31 (Out of Range)

```
┌────────────────────────────────────────────────────────────────┐
│            DEBUGGING NRC 0x31 FLOWCHART                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  Start: Got NRC 0x31                           │
│                         │                                      │
│                         ▼                                      │
│                ┌────────────────┐                              │
│                │ Log requested  │                              │
│                │ address & size │                              │
│                └───────┬────────┘                              │
│                        │                                       │
│                        ▼                                       │
│                ┌────────────────┐                              │
│            ┌───┤ Size == 0?     │───┐                          │
│            │   └────────────────┘   │                          │
│           Yes                       No                         │
│            │                         │                         │
│            ▼                         ▼                         │
│   ┌────────────────┐        ┌────────────────┐                │
│   │ INVALID SIZE   │        │ Calculate:     │                │
│   │ FIX: Size must │        │ endAddr =      │                │
│   │ be > 0         │        │ addr + size    │                │
│   └────────────────┘        └───────┬────────┘                │
│                                     │                         │
│                                     ▼                         │
│                            ┌────────────────┐                  │
│                        ┌───┤ endAddr >      │───┐              │
│                        │   │ address?       │   │              │
│                       Yes  └────────────────┘   No             │
│                        │                         │             │
│                        ▼                         ▼             │
│               ┌────────────────┐       ┌────────────────┐      │
│               │ Check memory   │       │ OVERFLOW!      │      │
│               │ map for        │       │ FIX: Reduce    │      │
│               │ address range  │       │ size or adjust │      │
│               └───────┬────────┘       │ address        │      │
│                       │                └────────────────┘      │
│                       ▼                                        │
│              ┌────────────────┐                                │
│          ┌───┤ Region found?  │───┐                            │
│          │   └────────────────┘   │                            │
│         Yes                       No                           │
│          │                         │                           │
│          ▼                         ▼                           │
│  ┌────────────────┐       ┌────────────────┐                  │
│  │ Check if range │       │ ADDRESS NOT IN │                  │
│  │ fits entirely  │       │ MEMORY MAP     │                  │
│  │ in region      │       │ FIX: Use valid │                  │
│  └───────┬────────┘       │ address range  │                  │
│          │                └────────────────┘                  │
│          ▼                                                     │
│     ┌────────────────┐                                         │
│ ┌───┤ Fits in region?│───┐                                     │
│ │   └────────────────┘   │                                     │
│Yes                       No                                    │
│ │                         │                                    │
│ ▼                         ▼                                    │
│┌──────────┐      ┌────────────────┐                            │
││Check     │      │ SPANS MULTIPLE │                            │
││region    │      │ REGIONS        │                            │
││readable  │      │ FIX: Reduce    │                            │
│└────┬─────┘      │ size to stay   │                            │
│     │            │ in one region  │                            │
│     ▼            └────────────────┘                            │
│ ┌────────────┐                                                 │
│ │ NOT        │                                                 │
│ │ READABLE   │                                                 │
│ │ FIX: Region│                                                 │
│ │ forbidden  │                                                 │
│ └────────────┘                                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Best Practices Checklist

### Implementation Checklist

```
┌────────────────────────────────────────────────────────────────┐
│              SID 0x23 IMPLEMENTATION BEST PRACTICES            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ REQUEST VALIDATION                                             │
│  ☐ Check minimum message length (>= 2 bytes)                   │
│  ☐ Validate ALFID nibbles are in range [1-15]                  │
│  ☐ Calculate expected length from ALFID                        │
│  ☐ Verify actual length matches expected                       │
│  ☐ Extract address and size parameters correctly               │
│                                                                │
│ SESSION VALIDATION                                             │
│  ☐ Check current session is Extended (0x03) or Programming     │
│  ☐ Verify session has not timed out                            │
│  ☐ Reset session timer on successful request                   │
│                                                                │
│ ADDRESS VALIDATION                                             │
│  ☐ Verify size parameter > 0                                   │
│  ☐ Check for integer overflow (endAddr >= address)             │
│  ☐ Find memory region containing address range                 │
│  ☐ Ensure entire range fits within single region               │
│  ☐ Verify region has read permission                           │
│                                                                │
│ SECURITY VALIDATION                                            │
│  ☐ Determine required security level for region                │
│  ☐ Check if current security level is sufficient               │
│  ☐ Verify security has not timed out                           │
│  ☐ Reset security timer on successful request                  │
│                                                                │
│ MEMORY READ OPERATION                                          │
│  ☐ Allocate response buffer (1 + size bytes)                   │
│  ☐ Set response SID to 0x63                                    │
│  ☐ Use safe memory read (handle exceptions)                    │
│  ☐ Detect and handle ECC/parity errors                         │
│  ☐ Implement read timeout protection                           │
│                                                                │
│ ERROR HANDLING                                                 │
│  ☐ Return 0x13 for length/ALFID errors                         │
│  ☐ Return 0x22 for session errors                              │
│  ☐ Return 0x31 for address/size errors                         │
│  ☐ Return 0x33 for security errors                             │
│  ☐ Return 0x72 for memory hardware errors                      │
│  ☐ Log all errors for diagnostics                              │
│                                                                │
│ RESPONSE GENERATION                                            │
│  ☐ Positive response format: [0x63][data bytes]                │
│  ☐ Negative response format: [0x7F][0x23][NRC]                 │
│  ☐ Ensure response length is correct                           │
│                                                                │
│ TESTING                                                        │
│  ☐ Test valid address with correct session/security            │
│  ☐ Test invalid ALFID values                                   │
│  ☐ Test address out of range scenarios                         │
│  ☐ Test security denied scenarios                              │
│  ☐ Test session timeout behavior                               │
│  ☐ Test boundary conditions (region edges)                     │
│  ☐ Test maximum size reads                                     │
│                                                                │
│ PERFORMANCE                                                    │
│  ☐ Optimize for common read sizes                              │
│  ☐ Implement DMA for large transfers if available              │
│  ☐ Cache memory region lookup results                          │
│  ☐ Monitor and limit max response time                         │
│                                                                │
│ SECURITY                                                       │
│  ☐ Never expose security keys or sensitive data                │
│  ☐ Implement rate limiting for repeated failures               │
│  ☐ Log security violations                                     │
│  ☐ Clear security on session change                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Code Review Checklist

```
┌────────────────────────────────────────────────────────────────┐
│                   CODE REVIEW CHECKLIST                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ CORRECTNESS                                                    │
│  ☐ All NRCs returned in correct scenarios                      │
│  ☐ ALFID parsing handles all valid values                      │
│  ☐ Address arithmetic prevents overflow                        │
│  ☐ Memory access is bounds-checked                             │
│                                                                │
│ ROBUSTNESS                                                     │
│  ☐ No buffer overflows possible                                │
│  ☐ All pointers validated before use                           │
│  ☐ Exception handlers catch memory errors                      │
│  ☐ Timeouts prevent infinite loops                             │
│                                                                │
│ COMPLIANCE                                                     │
│  ☐ Follows ISO 14229-1:2020 specification                      │
│  ☐ Response timing meets P2/P2* requirements                   │
│  ☐ All mandatory NRCs implemented                              │
│                                                                │
│ MAINTAINABILITY                                                │
│  ☐ Clear variable names used                                   │
│  ☐ Complex logic has explanatory comments                      │
│  ☐ Magic numbers replaced with named constants                 │
│  ☐ Error paths are clearly documented                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Implementation Points

```
┌────────────────────────────────────────────────────────────────┐
│                     IMPLEMENTATION SUMMARY                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. ALWAYS validate ALFID before parsing parameters            │
│  2. ALWAYS check for integer overflow in address calculations  │
│  3. ALWAYS verify session state before memory operations       │
│  4. ALWAYS enforce security for protected regions              │
│  5. ALWAYS handle memory read errors gracefully (NRC 0x72)     │
│  6. ALWAYS reset session/security timers on valid requests     │
│  7. NEVER trust address/size without validation                │
│  8. NEVER expose internal memory outside defined regions       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x23 Practical Implementation Guide**
