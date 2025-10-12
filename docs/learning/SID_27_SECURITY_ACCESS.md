# SID 0x27: Security Access - Visual Learning Guide

**Version:** 2.0  
**Last Updated:** October 12, 2025  
**Compliance:** ISO 14229-1:2020 Section 9.3  
**Format:** Visual diagrams only - NO programming code

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Seed/Key Mechanism](#seedkey-mechanism)
3. [Security Levels](#security-levels)
4. [Message Format Diagrams](#message-format-diagrams)
5. [Negative Response Codes](#negative-response-codes)
6. [Session Requirements](#session-requirements)
7. [Timing Constraints](#timing-constraints)
8. [Visual Summary](#visual-summary)

---

## Service Overview

### What is SID 0x27?

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ACCESS SERVICE                       │
│                         (SID 0x27)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Unlock security-protected diagnostic functions        │
│           through cryptographic seed/key exchange               │
│                                                                  │
│  Use Cases:                                                      │
│  • Write protected configuration data (via SID 0x2E)            │
│  • Execute protected routines (via SID 0x31)                    │
│  • Download/upload software (via SID 0x34/0x35)                 │
│  • Clear DTCs in protected sessions (via SID 0x14)              │
│                                                                  │
│  Security Model:                                                 │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │  Locked  │  →   │ Request  │  →   │ Unlocked │              │
│  │  State   │      │ Seed+Key │      │  State   │              │
│  └──────────┘      └──────────┘      └──────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Seed/Key Mechanism

### Complete Exchange Flow

```
Tester                                                        ECU
  │                                                            │
  │  Step 1: Request Seed (Sub-Function = Odd Number)         │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x01]                                             │
  │                                                            │
  │                    Step 2: Seed Response                   │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x01] [SEED_BYTES...]                             │
  │                                                            │
  │  ┌──────────────────────────────────────────┐             │
  │  │ Tester calculates key using:              │             │
  │  │ Key = CryptoAlgorithm(Seed, SecretKey)   │             │
  │  └──────────────────────────────────────────┘             │
  │                                                            │
  │  Step 3: Send Key (Sub-Function = Odd Number + 1)          │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x02] [KEY_BYTES...]                              │
  │                                                            │
  │                    Step 4: Unlock Confirmation             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x02]                                             │
  │                                                            │
  │  ✅ Security Level UNLOCKED                                │
  │                                                            │
```

### Two-Step Process Explained

```
┌────────────────────────────────────────────────────────────────┐
│                    SEED REQUEST (Step 1)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tester asks: "Give me a challenge"                             │
│  ECU responds: Random seed (unpredictable number)               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Why random seed?                                     │       │
│  │ • Prevents replay attacks                            │       │
│  │ • Each unlock attempt uses different seed            │       │
│  │ • Old keys cannot be reused                          │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    KEY SENDING (Step 2)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tester: Calculates Key = f(Seed, Secret)                      │
│  Tester sends: The calculated key                              │
│  ECU validates: Does our calculation match theirs?              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Validation Process:                                  │       │
│  │                                                      │       │
│  │  ECU_Key = CryptoAlgorithm(Seed_Sent, Secret_Stored)│       │
│  │                                                      │       │
│  │  if (Tester_Key == ECU_Key):                         │       │
│  │      ✅ UNLOCK                                       │       │
│  │  else:                                               │       │
│  │      ❌ NRC 0x35 (Invalid Key)                       │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Security Levels

### Sub-Function Table

```
┌────────────────┬──────────────────┬─────────────────────────────┐
│ Sub-Function   │ Security Level   │ Purpose                     │
├────────────────┼──────────────────┼─────────────────────────────┤
│ 0x01 (Seed)    │ Level 1          │ Basic diagnostic access     │
│ 0x02 (Key)     │ Level 1 Unlock   │ Confirm Level 1 unlock      │
├────────────────┼──────────────────┼─────────────────────────────┤
│ 0x03 (Seed)    │ Level 2          │ Advanced diagnostics        │
│ 0x04 (Key)     │ Level 2 Unlock   │ Confirm Level 2 unlock      │
├────────────────┼──────────────────┼─────────────────────────────┤
│ 0x05 (Seed)    │ Level 3          │ Calibration/Tuning access   │
│ 0x06 (Key)     │ Level 3 Unlock   │ Confirm Level 3 unlock      │
├────────────────┼──────────────────┼─────────────────────────────┤
│ ...            │ ...              │ ...                         │
├────────────────┼──────────────────┼─────────────────────────────┤
│ 0x7D (Seed)    │ Level 63         │ OEM-specific Level 63       │
│ 0x7E (Key)     │ Level 63 Unlock  │ Confirm Level 63 unlock     │
├────────────────┼──────────────────┼─────────────────────────────┤
│ 0x7F (Seed)    │ Level 64         │ Maximum security level      │
│ 0x80 (Key)     │ Level 64 Unlock  │ Confirm Level 64 unlock     │
└────────────────┴──────────────────┴─────────────────────────────┘

Pattern: Odd sub-functions = Request Seed
         Even sub-functions = Send Key
```

### Security Level Hierarchy

```
                    ┌─────────────────────┐
                    │   Level 64 (0x7F)   │
                    │  MAXIMUM SECURITY   │
                    │  • Software Flash   │
                    │  • OTP Programming  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Level 3 (0x05)    │
                    │    CALIBRATION      │
                    │  • Tune Parameters  │
                    │  • Adjust Settings  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Level 2 (0x03)    │
                    │ ADVANCED DIAGNOSTIC │
                    │  • Protected DIDs   │
                    │  • Special Routines │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Level 1 (0x01)    │
                    │  BASIC DIAGNOSTIC   │
                    │  • Read Protected   │
                    │  • Write Public     │
                    └─────────────────────┘

Higher Level = More Restricted Access
```

---

## Message Format Diagrams

### Request Seed Format

```
┌──────────┬──────────────┬──────────────────────────────────────┐
│  Byte 0  │    Byte 1    │           Description                │
├──────────┼──────────────┼──────────────────────────────────────┤
│   0x27   │  Sub-Func    │  Sub-Func = Odd Number (0x01-0x7F)   │
│          │  (0x01)      │  Example: 0x01 = Level 1 seed        │
└──────────┴──────────────┴──────────────────────────────────────┘

Example: Request Seed for Level 1
┌─────┬─────┐
│ 27  │ 01  │  = "Give me seed for security level 1"
└─────┴─────┘

Example: Request Seed for Level 3
┌─────┬─────┐
│ 27  │ 05  │  = "Give me seed for security level 3"
└─────┴─────┘
```

### Positive Response to Seed Request

```
┌──────────┬──────────────┬─────────┬─────────┬─────┬─────────┐
│  Byte 0  │    Byte 1    │ Byte 2  │ Byte 3  │ ... │ Byte N  │
├──────────┼──────────────┼─────────┼─────────┼─────┼─────────┤
│   0x67   │  Sub-Func    │ Seed[0] │ Seed[1] │ ... │ Seed[N] │
│          │  (0x01)      │         │         │     │         │
└──────────┴──────────────┴─────────┴─────────┴─────┴─────────┘

Example: 4-byte seed response
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 67  │ 01  │ 12  │ 34  │ 56  │ 78  │
└─────┴─────┴─────┴─────┴─────┴─────┘
  ▲     ▲     ▲─────────────────────▲
  │     │              │
  │     │         Seed = 0x12345678
  │     └─ Echo sub-function
  └─ Positive response (0x27 + 0x40)
```

### Send Key Format

```
┌──────────┬──────────────┬─────────┬─────────┬─────┬─────────┐
│  Byte 0  │    Byte 1    │ Byte 2  │ Byte 3  │ ... │ Byte N  │
├──────────┼──────────────┼─────────┼─────────┼─────┼─────────┤
│   0x27   │  Sub-Func    │  Key[0] │  Key[1] │ ... │  Key[N] │
│          │  (0x02)      │         │         │     │         │
└──────────┴──────────────┴─────────┴─────────┴─────┴─────────┘

Sub-Func = Even Number (Seed Request + 1)

Example: Send key for Level 1
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 27  │ 02  │ AB  │ CD  │ EF  │ 01  │
└─────┴─────┴─────┴─────┴─────┴─────┘
        ▲     ▲─────────────────────▲
        │              │
        │         Key = 0xABCDEF01
        └─ 0x02 = Send key for level 1
```

### Positive Response to Send Key

```
┌──────────┬──────────────┐
│  Byte 0  │    Byte 1    │
├──────────┼──────────────┤
│   0x67   │  Sub-Func    │
│          │  (0x02)      │
└──────────┴──────────────┘

Example: Unlock confirmation
┌─────┬─────┐
│ 67  │ 02  │  = "Security level 1 UNLOCKED"
└─────┴─────┘

✅ No data bytes = Successful unlock
```

### Special Case: Already Unlocked

```
Request Seed when already unlocked:

Request:
┌─────┬─────┐
│ 27  │ 01  │
└─────┴─────┘

Response (Seed = All Zeros):
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 67  │ 01  │ 00  │ 00  │ 00  │ 00  │
└─────┴─────┴─────┴─────┴─────┴─────┘
              ▲─────────────────────▲
                All zeros = Already unlocked
                No need to send key
```

---

## Negative Response Codes

### NRC 0x12: Sub-Function Not Supported

```
❌ WRONG: Requesting invalid security level

Request:
┌─────┬─────┐
│ 27  │ 09  │  ← ECU only supports levels 1, 2, 3
└─────┴─────┘     (0x01, 0x03, 0x05)

Response:
┌─────┬─────┬─────┬─────┐
│ 7F  │ 27  │ 12  │ 09  │
└─────┴─────┴─────┴─────┘
              ▲     ▲
              │     └─ Sub-function that failed
              └─ Sub-function not supported

✅ CORRECT: Request supported level

Request:
┌─────┬─────┐
│ 27  │ 01  │  ← Level 1 is supported
└─────┴─────┘

Response:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 67  │ 01  │ 12  │ 34  │ 56  │ 78  │  ← Seed provided
└─────┴─────┴─────┴─────┴─────┴─────┘
```

---

### NRC 0x13: Incorrect Message Length

```
❌ WRONG: Send key with wrong length

Request (Key should be 4 bytes, sent 2):
┌─────┬─────┬─────┬─────┐
│ 27  │ 02  │ AB  │ CD  │  ← Only 2 bytes, need 4
└─────┴─────┴─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 13  │
└─────┴─────┴─────┘
              ▲
              └─ Incorrect message length

✅ CORRECT: Send key with correct length

Request:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 27  │ 02  │ AB  │ CD  │ EF  │ 01  │  ← 4 bytes as expected
└─────┴─────┴─────┴─────┴─────┴─────┘

Response:
┌─────┬─────┐
│ 67  │ 02  │  ← Unlocked
└─────┴─────┘
```

---

### NRC 0x22: Conditions Not Correct

```
❌ WRONG: Send key without requesting seed first

Sequence:
  Step 1: [SKIPPED - No seed request]
  Step 2: Send key directly
          ┌─────┬─────┬─────┬─────┬─────┬─────┐
          │ 27  │ 02  │ AB  │ CD  │ EF  │ 01  │
          └─────┴─────┴─────┴─────┴─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 22  │  ← Must request seed first
└─────┴─────┴─────┘

✅ CORRECT: Request seed, then send key

Sequence:
  Step 1: Request seed
          ┌─────┬─────┐
          │ 27  │ 01  │
          └─────┴─────┘

  Step 2: Receive seed
          ┌─────┬─────┬──────────┐
          │ 67  │ 01  │ [SEED]   │
          └─────┴─────┴──────────┘

  Step 3: Send key
          ┌─────┬─────┬──────────┐
          │ 27  │ 02  │ [KEY]    │
          └─────┴─────┴──────────┘

  Step 4: Unlocked
          ┌─────┬─────┐
          │ 67  │ 02  │
          └─────┴─────┘
```

---

### NRC 0x24: Request Sequence Error

```
❌ WRONG: Send key for wrong level

Sequence:
  Request:  0x27 0x01  (Request seed for Level 1)
  Response: 0x67 0x01 [SEED]
  
  Request:  0x27 0x04  (Send key for Level 2 - MISMATCH!)
            └──────┘
               ▲
               └─ Should be 0x02 (Level 1 key)

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 24  │  ← Sequence error
└─────┴─────┴─────┘

✅ CORRECT: Match seed/key levels

Sequence:
  Request:  0x27 0x01  (Request seed for Level 1)
  Response: 0x67 0x01 [SEED]
  
  Request:  0x27 0x02  (Send key for Level 1 - MATCH!)
            └──────┘
               ▲
               └─ Correct: 0x02 follows 0x01

Response:
┌─────┬─────┐
│ 67  │ 02  │  ← Unlocked
└─────┴─────┘
```

---

### NRC 0x31: Request Out of Range

```
❌ WRONG: Request seed with sub-function 0x00

Request:
┌─────┬─────┐
│ 27  │ 00  │  ← 0x00 is reserved/invalid
└─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 31  │
└─────┴─────┴─────┘

❌ WRONG: Even number for seed request

Request:
┌─────┬─────┐
│ 27  │ 02  │  ← 0x02 is for sending key, not requesting seed
└─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 31  │
└─────┴─────┴─────┘

✅ CORRECT: Odd number for seed request

Request:
┌─────┬─────┐
│ 27  │ 01  │  ← Odd number = Request seed
└─────┴─────┘

Response:
┌─────┬─────┬──────────┐
│ 67  │ 01  │ [SEED]   │
└─────┴─────┴──────────┘
```

---

### NRC 0x35: Invalid Key

```
❌ WRONG: Send incorrect key

Seed received: 0x12345678
Expected key:  0xABCDEF01
Sent key:      0x11111111  ← Wrong calculation

Request:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 27  │ 02  │ 11  │ 11  │ 11  │ 11  │
└─────┴─────┴─────┴─────┴─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 35  │  ← Invalid key
└─────┴─────┴─────┘

⚠️ Attempt counter incremented!

✅ CORRECT: Send correct key

Seed received: 0x12345678
Expected key:  0xABCDEF01
Sent key:      0xABCDEF01  ← Correct

Request:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│ 27  │ 02  │ AB  │ CD  │ EF  │ 01  │
└─────┴─────┴─────┴─────┴─────┴─────┘

Response:
┌─────┬─────┐
│ 67  │ 02  │  ← Unlocked, counter reset
└─────┴─────┘
```

---

### NRC 0x36: Exceeded Number of Attempts

```
❌ WRONG: Too many failed attempts

Attempt 1: Invalid key → NRC 0x35 (Counter = 1)
Attempt 2: Invalid key → NRC 0x35 (Counter = 2)
Attempt 3: Invalid key → NRC 0x36 (LOCKED OUT!)

Request (Attempt 4):
┌─────┬─────┐
│ 27  │ 01  │  ← Try to request seed again
└─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 36  │  ← Exceeded attempts, ECU locked
└─────┴─────┴─────┘

┌──────────────────────────────────────────────┐
│ Counter Reset Options:                        │
│ • Wait for delay period (e.g., 10 minutes)    │
│ • Power cycle ECU                             │
│ • Use emergency unlock procedure (if exists)  │
└──────────────────────────────────────────────┘

✅ CORRECT: Wait for reset, then retry

Wait 10 minutes...

Request:
┌─────┬─────┐
│ 27  │ 01  │
└─────┴─────┘

Response:
┌─────┬─────┬──────────┐
│ 67  │ 01  │ [SEED]   │  ← Counter reset, can try again
└─────┴─────┴──────────┘
```

---

### NRC 0x37: Required Time Delay Not Expired

```
❌ WRONG: Request seed too quickly after failure

Time 0:00:00 - Invalid key attempt
              ┌─────┬─────┬─────┬─────┬─────┬─────┐
              │ 27  │ 02  │ 11  │ 11  │ 11  │ 11  │
              └─────┴─────┴─────┴─────┴─────┴─────┘
              Response: NRC 0x35

Time 0:00:02 - Try again (Delay = 10 seconds required)
              ┌─────┬─────┐
              │ 27  │ 01  │
              └─────┴─────┘

Response:
┌─────┬─────┬─────┐
│ 7F  │ 27  │ 37  │  ← Must wait 8 more seconds
└─────┴─────┴─────┘

✅ CORRECT: Wait for required delay

Time 0:00:00 - Invalid key attempt
Time 0:00:10 - Wait 10 seconds completed

Request:
┌─────┬─────┐
│ 27  │ 01  │
└─────┴─────┘

Response:
┌─────┬─────┬──────────┐
│ 67  │ 01  │ [SEED]   │  ← Delay expired, can proceed
└─────┴─────┴──────────┘
```

---

## Session Requirements

### Session Compatibility Matrix

```
┌─────────────────────────┬───────────────────────────────────┐
│ Diagnostic Session      │ Security Access Allowed?          │
├─────────────────────────┼───────────────────────────────────┤
│ 0x01 Default            │ ❌ NO                             │
│                         │ Must switch to Extended/Prog      │
├─────────────────────────┼───────────────────────────────────┤
│ 0x02 Programming        │ ✅ YES                            │
│                         │ Required for flashing             │
├─────────────────────────┼───────────────────────────────────┤
│ 0x03 Extended           │ ✅ YES                            │
│                         │ Required for protected operations │
├─────────────────────────┼───────────────────────────────────┤
│ 0x40-0x5F Supplier      │ ⚠️ DEPENDS                        │
│                         │ Check ECU specification           │
└─────────────────────────┴───────────────────────────────────┘
```

### Session Transition Effects

```
┌────────────────────────────────────────────────────────────────┐
│           SECURITY STATE vs DIAGNOSTIC SESSION                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Unlocked State                                                 │
│  ┌──────────────┐                                               │
│  │ Level 1      │                                               │
│  │ UNLOCKED     │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ Session Change (0x10 0x01 = Default Session)          │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ Level 1      │  ← Security LOST!                             │
│  │ LOCKED       │                                               │
│  └──────────────┘                                               │
│                                                                 │
│  Rule: Changing session resets ALL security levels to LOCKED   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Typical Session + Security Flow

```
Tester                                                        ECU
  │                                                            │
  │  1. Switch to Extended Session                             │
  ├───────────────────────────────────────────────────────────>│
  │  [0x10] [0x03]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x50] [0x03]                                             │
  │                                                            │
  │  2. Request Seed (Level 1)                                 │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x01]                                             │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x01] [SEED]                                      │
  │                                                            │
  │  3. Send Key (Level 1)                                     │
  ├───────────────────────────────────────────────────────────>│
  │  [0x27] [0x02] [KEY]                                       │
  │<───────────────────────────────────────────────────────────┤
  │  [0x67] [0x02]  ✅ UNLOCKED                                │
  │                                                            │
  │  4. Perform protected operation (e.g., Write DID)          │
  ├───────────────────────────────────────────────────────────>│
  │  [0x2E] [0xF1] [0x90] [DATA]                               │
  │<───────────────────────────────────────────────────────────┤
  │  [0x6E] [0xF1] [0x90]  ✅ Write successful                 │
  │                                                            │
```

---

## Timing Constraints

### P2 Server Response Timing

```
┌────────────────────────────────────────────────────────────────┐
│                  TIMING REQUIREMENT (P2)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request Sent                    Response Required             │
│      │                                   │                     │
│      ▼                                   ▼                     │
│  ────●───────────────────────────────────●────>                │
│      └───────────── 50 ms ───────────────┘                     │
│                  (Typical P2)                                   │
│                                                                 │
│  If processing takes longer:                                    │
│  ────●────●────●────●────●────●────●─────●────>                │
│      │    │    │    │    │    │    │     │                     │
│      │    └ NRC 0x78 (Request Correctly Received)              │
│      │       (Response Pending)                                │
│      │                                                         │
│      └─ Original request                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Security Timeout (Post-Unlock)

```
┌────────────────────────────────────────────────────────────────┐
│              SECURITY UNLOCK TIMEOUT                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Time 0:00:00 - Security Unlocked                               │
│                 ┌─────────────┐                                 │
│                 │  UNLOCKED   │                                 │
│                 └─────────────┘                                 │
│                                                                 │
│  Time 0:04:50 - Tester sends TesterPresent (0x3E)               │
│                 (Reset timeout)                                 │
│                                                                 │
│  Time 0:09:40 - Tester sends TesterPresent (0x3E)               │
│                 (Reset timeout)                                 │
│                                                                 │
│  If no activity for 5 seconds (S3 timeout):                     │
│                                                                 │
│  Time 0:05:00 - NO TesterPresent received                       │
│                 ┌─────────────┐                                 │
│                 │   LOCKED    │  ← Security lost!               │
│                 │  + Session  │  ← Session returns to default   │
│                 │  = Default  │                                 │
│                 └─────────────┘                                 │
│                                                                 │
│  Must re-unlock to perform protected operations                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Delay After Invalid Attempt

```
┌────────────────────────────────────────────────────────────────┐
│         MANDATORY DELAY AFTER INVALID KEY                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Attempt Timeline:                                              │
│                                                                 │
│  0:00 ─── Invalid Key Sent                                      │
│       │                                                         │
│       ├─► NRC 0x35 (Invalid Key)                                │
│       │                                                         │
│       ├─► Delay Timer Starts (10 seconds)                       │
│       │                                                         │
│  0:05 ─── Try to request seed                                   │
│       │                                                         │
│       ├─► NRC 0x37 (Time Delay Not Expired)                     │
│       │   "Wait 5 more seconds"                                 │
│       │                                                         │
│  0:10 ─── Delay Expired                                         │
│       │                                                         │
│       └─► Can request seed again                                │
│                                                                 │
│  Delay Purposes:                                                │
│  • Prevent brute-force attacks                                  │
│  • Slow down unauthorized access attempts                       │
│  • Give ECU time to log security events                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Visual Summary

### Complete Security Access State Machine

```
                    ┌─────────────────────┐
                    │   INITIAL STATE     │
                    │      LOCKED         │
                    └──────────┬──────────┘
                               │
                               │ Request Seed (0x27 0x01)
                               ▼
                    ┌─────────────────────┐
                    │   SEED REQUESTED    │
                    │  Seed Generated &   │
                    │    Sent to Tester   │
                    └──────────┬──────────┘
                               │
                  ┌────────────┼────────────┐
                  │                         │
                  │ Valid Key               │ Invalid Key
                  │ (0x27 0x02)             │ (0x27 0x02)
                  ▼                         ▼
       ┌─────────────────────┐   ┌─────────────────────┐
       │     UNLOCKED        │   │  ATTEMPT FAILED     │
       │  Can access         │   │  Counter++          │
       │  protected funcs    │   │  NRC 0x35           │
       └──────────┬──────────┘   └──────────┬──────────┘
                  │                         │
                  │                         │ Counter >= Max?
                  │                         ▼
                  │              ┌─────────────────────┐
                  │         NO   │                     │  YES
                  │         ◄────┤  Check Attempts     ├─────►
                  │              │                     │
                  │              └─────────────────────┘
                  │                                    │
                  │                                    ▼
                  │                         ┌─────────────────────┐
                  │                         │    LOCKED OUT       │
                  │                         │   NRC 0x36          │
                  │                         │  Wait for reset     │
                  │                         └──────────┬──────────┘
                  │                                    │
                  │ Timeout (S3)                       │ Power Cycle
                  │ Session Change                     │ or Time Delay
                  │                                    │
                  └────────────────────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   RETURN TO LOCKED  │
                        └─────────────────────┘
```

### Quick Reference Card

```
┌────────────────────────────────────────────────────────────────┐
│            SECURITY ACCESS QUICK REFERENCE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Purpose:     Unlock security-protected diagnostic functions   │
│  SID:         0x27                                              │
│  Standard:    ISO 14229-1:2020 Section 9.3                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SEED REQUEST                                             │  │
│  │ Request:  [0x27] [Odd Sub-Func]                          │  │
│  │ Response: [0x67] [Odd Sub-Func] [Seed Bytes...]          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ KEY SENDING                                              │  │
│  │ Request:  [0x27] [Even Sub-Func] [Key Bytes...]          │  │
│  │ Response: [0x67] [Even Sub-Func]                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Sessions:    Extended (0x03) or Programming (0x02) required   │
│  Timing:      P2 = 50ms, S3 = 5 seconds (typical)              │
│                                                                 │
│  Common NRCs:                                                   │
│  • 0x12 - Sub-function not supported                            │
│  • 0x13 - Incorrect message length                              │
│  • 0x22 - Conditions not correct (no seed requested)            │
│  • 0x24 - Request sequence error (wrong seed/key pair)          │
│  • 0x31 - Request out of range (invalid sub-function)           │
│  • 0x35 - Invalid key                                           │
│  • 0x36 - Exceeded number of attempts                           │
│  • 0x37 - Required time delay not expired                       │
│                                                                 │
│  Security Levels:                                               │
│  • 0x01/0x02 - Level 1 (Basic)                                  │
│  • 0x03/0x04 - Level 2 (Advanced)                               │
│  • 0x05/0x06 - Level 3 (Calibration)                            │
│  • ...                                                          │
│  • 0x7F/0x80 - Level 64 (Maximum)                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- **Practical Implementation:** `SID_27_PRACTICAL_IMPLEMENTATION.md`
- **Service Interactions:** `SID_27_SERVICE_INTERACTIONS.md`
- **ISO 14229-1:2020:** Section 9.3 - Security Access Service

---

**End of SID 0x27 Theory Guide**
