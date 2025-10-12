# SID 0x27: Security Access - Practical Implementation Guide

**Version:** 2.0  
**Last Updated:** October 12, 2025  
**Compliance:** ISO 14229-1:2020 Section 9.3  
**Format:** Visual diagrams only - NO programming code

---

## 📋 Table of Contents

1. [Seed Generation Flowchart](#seed-generation-flowchart)
2. [Key Validation Logic](#key-validation-logic)
3. [Security State Machine](#security-state-machine)
4. [Timeout Handling](#timeout-handling)
5. [Attempt Counter Logic](#attempt-counter-logic)
6. [Testing Scenarios](#testing-scenarios)
7. [Debugging Flowcharts](#debugging-flowcharts)

---

## Seed Generation Flowchart

### Complete Request Processing

```
                         START: Receive Request
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Parse Request Message    │
                    │ Extract: SID, Sub-Func   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Validate SID = 0x27?     │
                    └────────────┬─────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                       YES               NO
                        │                 │
                        ▼                 ▼
            ┌───────────────────┐   ┌──────────────┐
            │ Check Sub-Func    │   │ Wrong SID    │
            │ Odd or Even?      │   │ Route to     │
            └─────────┬─────────┘   │ other service│
                      │             └──────────────┘
            ┌─────────┴─────────┐
            │                   │
           ODD                EVEN
    (Request Seed)      (Send Key)
            │                   │
            ▼                   ▼
  ┌──────────────────┐  ┌──────────────────┐
  │ SEED REQUEST     │  │ KEY VALIDATION   │
  │ Processing       │  │ Processing       │
  └─────────┬────────┘  └─────────┬────────┘
            │                     │
            ▼                     ▼
    (See detailed              (See key
     flowchart below)           validation below)
```

### Seed Request Detailed Flow

```
                    START: Odd Sub-Function Received
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Check Current Session    │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              Extended/Prog              Default
                    │                         │
                    ▼                         ▼
         ┌─────────────────┐      ┌──────────────────┐
         │ Session OK      │      │ Return NRC 0x7F  │
         │ Continue...     │      │ (Service Not     │
         └────────┬────────┘      │  Supported in    │
                  │               │  Active Session) │
                  ▼               └──────────────────┘
         ┌─────────────────┐
         │ Sub-Func         │
         │ Supported?       │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
        YES               NO
         │                 │
         ▼                 ▼
┌────────────────┐  ┌──────────────────┐
│ Check if       │  │ Return NRC 0x12  │
│ already        │  │ (Sub-Function    │
│ unlocked       │  │  Not Supported)  │
└───────┬────────┘  └──────────────────┘
        │
┌───────┴────────┐
│                │
│           Already
Locked         Unlocked
│                │
▼                ▼
┌────────────┐  ┌──────────────────┐
│ Generate   │  │ Return seed =    │
│ Random     │  │ all zeros        │
│ Seed       │  │ [0x67][SF][00...│
└─────┬──────┘  └──────────────────┘
      │
      ▼
┌────────────────┐
│ Store Seed     │
│ internally     │
│ (for later     │
│  validation)   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Start Seed     │
│ Timeout Timer  │
│ (e.g., 5s)     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Set State =    │
│ SEED_REQUESTED │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│ Return Positive        │
│ Response:              │
│ [0x67][SF][SEED...]    │
└────────────────────────┘
        │
        ▼
      END
```

### Random Seed Generation Requirements

```
┌────────────────────────────────────────────────────────────────┐
│                SEED GENERATION REQUIREMENTS                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Randomness Properties:                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Cryptographically strong random number generator       │  │
│  │ • No predictable patterns                                │  │
│  │ • Each seed unique per request                           │  │
│  │ • Sufficient entropy (typically ≥ 32 bits)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Seed Sources:                                                  │
│  ┌─────────────────────┐                                        │
│  │ Hardware RNG        │ ← Best security                        │
│  ├─────────────────────┤                                        │
│  │ Timer + Counter     │ ← Medium security                      │
│  ├─────────────────────┤                                        │
│  │ Pseudo-RNG + Seed   │ ← Acceptable if seeded properly        │
│  └─────────────────────┘                                        │
│                                                                 │
│  Anti-Pattern: DO NOT USE                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ❌ Sequential numbers (0x0001, 0x0002, 0x0003...)        │  │
│  │ ❌ Timestamp only (predictable)                          │  │
│  │ ❌ Fixed seed (same seed every time)                     │  │
│  │ ❌ Simple XOR patterns                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Validation Logic

### Complete Validation Decision Tree

```
                    START: Receive Key (Even Sub-Func)
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Check Current State      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              SEED_REQUESTED              Other State
                    │                         │
                    ▼                         ▼
         ┌─────────────────┐      ┌──────────────────┐
         │ State OK        │      │ Return NRC 0x22  │
         │ Continue...     │      │ (Conditions Not  │
         └────────┬────────┘      │  Correct - No    │
                  │               │  Seed Requested) │
                  ▼               └──────────────────┘
         ┌─────────────────┐
         │ Sub-Func Matches │
         │ Seed Request?    │
         │ (Even = Odd+1)   │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
        YES               NO
         │                 │
         ▼                 ▼
┌────────────────┐  ┌──────────────────┐
│ Check Message  │  │ Return NRC 0x24  │
│ Length         │  │ (Request         │
└───────┬────────┘  │  Sequence Error) │
        │           └──────────────────┘
┌───────┴────────┐
│                │
Correct      Incorrect
Length         Length
│                │
▼                ▼
┌────────────┐  ┌──────────────────┐
│ Check      │  │ Return NRC 0x13  │
│ Attempt    │  │ (Incorrect       │
│ Counter    │  │  Message Length) │
└─────┬──────┘  └──────────────────┘
      │
┌─────┴──────┐
│            │
Below      At/Above
Limit       Limit
│            │
▼            ▼
┌──────────┐  ┌──────────────────┐
│ Check    │  │ Return NRC 0x36  │
│ Delay    │  │ (Exceeded        │
│ Timer    │  │  Attempts)       │
└────┬─────┘  └──────────────────┘
     │
┌────┴─────┐
│          │
Expired  Active
│          │
▼          ▼
┌────────────┐  ┌──────────────────┐
│ Calculate  │  │ Return NRC 0x37  │
│ Expected   │  │ (Time Delay Not  │
│ Key        │  │  Expired)        │
└─────┬──────┘  └──────────────────┘
      │
      ▼
┌─────────────────┐
│ Compare Keys:   │
│ Received vs     │
│ Expected        │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
  Match    Mismatch
    │          │
    ▼          ▼
┌────────────┐  ┌──────────────────┐
│ SUCCESS!   │  │ FAILURE!         │
│            │  │                  │
│ • Reset    │  │ • Increment      │
│   counter  │  │   attempt counter│
│ • Set      │  │ • Start delay    │
│   state =  │  │   timer          │
│   UNLOCKED │  │ • Keep state =   │
│ • Return   │  │   LOCKED         │
│   0x67 SF  │  │ • Return         │
│            │  │   NRC 0x35       │
└────────────┘  └──────────────────┘
```

### Key Calculation Example

```
┌────────────────────────────────────────────────────────────────┐
│              KEY CALCULATION PROCESS                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input:                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Seed Received:    0x12 0x34 0x56 0x78                    │  │
│  │ Secret Key:       0xAB 0xCD 0xEF 0x01 (stored in ECU)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Algorithm Options:                                             │
│                                                                 │
│  Option 1: Simple XOR (NOT RECOMMENDED - Too Weak)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Seed:     12 34 56 78                                  │  │
│  │   XOR Key:  AB CD EF 01                                  │  │
│  │   ─────────────────────                                  │  │
│  │   Result:   B9 F9 B9 79                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Option 2: AES Encryption (RECOMMENDED)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Key = AES_Encrypt(Seed, Secret_AES_Key)                │  │
│  │   Result: [Cryptographically Strong Output]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Option 3: Custom Proprietary Algorithm                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Key = OEM_Crypto_Func(Seed, Secret)                    │  │
│  │   Note: Algorithm shared between Tester & ECU            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Both Tester and ECU MUST use identical algorithm!              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Security State Machine

### Complete State Diagram

```
                          ┌─────────────────┐
                          │   POWER ON /    │
                          │  SESSION CHANGE │
                          └────────┬────────┘
                                   │
                                   ▼
                    ╔══════════════════════════╗
                    ║       LOCKED STATE       ║
                    ║  • No protected access   ║
                    ║  • Counter = 0           ║
                    ║  • No active seed        ║
                    ╚═══════════┬══════════════╝
                                │
                                │ Request Seed (0x27 Odd)
                                │ ↓ Response: Seed
                                ▼
                    ╔══════════════════════════╗
                    ║   SEED_REQUESTED STATE   ║
                    ║  • Seed generated        ║
                    ║  • Seed timeout active   ║
                    ║  • Waiting for key       ║
                    ╚═══════════┬══════════════╝
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              Valid Key    Invalid Key  Timeout
              (0x27 Even)  (0x27 Even)  (5 seconds)
                    │           │           │
                    ▼           ▼           ▼
        ╔═══════════════╗  ┌────────────┐  ┌────────────┐
        ║   UNLOCKED    ║  │  Counter++ │  │ Return to  │
        ║    STATE      ║  │  Delay     │  │  LOCKED    │
        ║ • Protected   ║  │  Timer     │  │  STATE     │
        ║   access OK   ║  │  Start     │  │            │
        ║ • S3 timer    ║  │            │  │            │
        ║   active      ║  └──────┬─────┘  └────────────┘
        ╚═══════┬═══════╝         │
                │                 │
                │                 └──► Back to LOCKED
                │                      (NRC 0x35)
                │
                │ Protected Operation
                │ (e.g., Write DID)
                │
                ▼
        ┌───────────────┐
        │  Operation    │
        │  Executes     │
        └───────┬───────┘
                │
                │
    ┌───────────┼───────────┐
    │           │           │
S3 Timeout  Session    TesterPresent
 (5 sec)     Change     (Keep Alive)
    │           │           │
    ▼           ▼           │
┌─────────┐ ┌─────────┐    │
│ Return  │ │ Return  │    │
│ to      │ │ to      │    │
│ LOCKED  │ │ LOCKED  │    │
└─────────┘ └─────────┘    │
                            │
                            └──► Stay UNLOCKED
                                 (Reset S3 timer)
```

### State Transition Table

```
┌──────────────┬─────────────────┬─────────────┬──────────────────┐
│ Current      │ Event           │ Next State  │ Action           │
│ State        │                 │             │                  │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ LOCKED       │ Request Seed    │ SEED_REQ    │ Generate seed,   │
│              │ (0x27 Odd)      │             │ start timeout    │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ LOCKED       │ Send Key        │ LOCKED      │ NRC 0x22         │
│              │ (0x27 Even)     │             │ (No seed req'd)  │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ SEED_REQ     │ Valid Key       │ UNLOCKED    │ Reset counter,   │
│              │                 │             │ start S3 timer   │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ SEED_REQ     │ Invalid Key     │ LOCKED      │ Counter++,       │
│              │                 │             │ NRC 0x35, delay  │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ SEED_REQ     │ Seed Timeout    │ LOCKED      │ Clear seed       │
│              │ (5 sec)         │             │                  │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ UNLOCKED     │ S3 Timeout      │ LOCKED      │ Lost security    │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ UNLOCKED     │ Session Change  │ LOCKED      │ Lost security    │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ UNLOCKED     │ TesterPresent   │ UNLOCKED    │ Reset S3 timer   │
│              │ (0x3E)          │             │                  │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ UNLOCKED     │ Request Seed    │ UNLOCKED    │ Return zeros     │
│              │ (same level)    │             │ (already open)   │
├──────────────┼─────────────────┼─────────────┼──────────────────┤
│ Any          │ Power Cycle     │ LOCKED      │ Reset all        │
└──────────────┴─────────────────┴─────────────┴──────────────────┘
```

---

## Timeout Handling

### Seed Timeout Logic

```
                    SEED GENERATED & SENT
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Start Timeout Timer │
                  │ Duration: 5 seconds │
                  └──────────┬──────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   TIMER RUNNING (0-5s)   │
              └──────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Key Received    Timeout Expires  New Seed Request
    before 5s         at 5s            (overwrites old)
         │               │               │
         ▼               ▼               ▼
┌────────────────┐  ┌─────────────┐  ┌────────────────┐
│ Stop Timer     │  │ Stop Timer  │  │ Cancel Old     │
│ Validate Key   │  │ Clear Seed  │  │ Generate New   │
│                │  │ State =     │  │ Start New      │
│ If Valid:      │  │ LOCKED      │  │ Timer          │
│   UNLOCKED     │  │             │  │                │
│                │  │ Next key    │  └────────────────┘
│ If Invalid:    │  │ attempt     │
│   LOCKED       │  │ needs new   │
│   NRC 0x35     │  │ seed req    │
└────────────────┘  └─────────────┘
```

### S3 Timeout (Session Alive)

```
               SECURITY UNLOCKED
                      │
                      ▼
          ┌───────────────────────┐
          │ Start S3 Timer        │
          │ Duration: 5 seconds   │
          │ (Typical Value)       │
          └───────────┬───────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ S3 TIMER COUNTDOWN (0-5s)   │
        └─────────────┬───────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    TesterPresent  Timeout    Protected
      (0x3E)       (5s)       Operation
          │           │           │
          ▼           ▼           ▼
  ┌───────────┐  ┌─────────┐  ┌───────────┐
  │ Reset S3  │  │ Session │  │ Operation │
  │ Timer to  │  │ Timeout │  │ Executes  │
  │ 5 seconds │  │         │  │           │
  │           │  │ State = │  │ S3 keeps  │
  │ Stay      │  │ Default │  │ running   │
  │ UNLOCKED  │  │         │  │           │
  └─────┬─────┘  │ State = │  └─────┬─────┘
        │        │ LOCKED  │        │
        │        └─────────┘        │
        │                           │
        └───────────┬───────────────┘
                    │
                    ▼
              Keep Monitoring
```

### Delay Timer (After Invalid Key)

```
           INVALID KEY SENT (NRC 0x35)
                      │
                      ▼
          ┌───────────────────────┐
          │ Start Delay Timer     │
          │ Duration: 10 seconds  │
          │ Increment Counter     │
          └───────────┬───────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ DELAY ACTIVE (0-10s)        │
        │ Cannot request seed         │
        └─────────────┬───────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    Delay Active  Delay      Power Cycle
    (0-9 sec)     Expired    (Reset all)
          │        (10s)         │
          ▼           ▼           ▼
  ┌───────────┐  ┌─────────┐  ┌───────────┐
  │ Seed      │  │ Can     │  │ Counter = │
  │ Request?  │  │ request │  │ 0         │
  │           │  │ seed    │  │ Delay =   │
  │ → NRC 0x37│  │ again   │  │ 0         │
  │ (Time     │  │         │  │ State =   │
  │  delay    │  │ Counter │  │ LOCKED    │
  │  not      │  │ still   │  └───────────┘
  │  expired) │  │ counts  │
  └───────────┘  │ failures│
                 └─────────┘
```

---

## Attempt Counter Logic

### Counter State Machine

```
                    ┌─────────────────┐
                    │   POWER ON /    │
                    │  VALID UNLOCK   │
                    └────────┬────────┘
                             │
                             ▼
                  ╔══════════════════════╗
                  ║   COUNTER = 0        ║
                  ║   Ready for attempts ║
                  ╚═════════┬════════════╝
                            │
                            │ Invalid Key
                            ▼
                  ╔══════════════════════╗
                  ║   COUNTER = 1        ║
                  ║   Warning: 2 left    ║
                  ╚═════════┬════════════╝
                            │
                            │ Invalid Key
                            ▼
                  ╔══════════════════════╗
                  ║   COUNTER = 2        ║
                  ║   Warning: 1 left    ║
                  ╚═════════┬════════════╝
                            │
                            │ Invalid Key
                            ▼
                  ╔══════════════════════╗
                  ║   COUNTER = 3        ║
                  ║   LOCKOUT!           ║
                  ║   NRC 0x36           ║
                  ╚═════════┬════════════╝
                            │
                ┌───────────┴───────────┐
                │                       │
          Power Cycle              Wait Period
          (Immediate)              (10 minutes)
                │                       │
                ▼                       ▼
        ┌───────────────┐      ┌───────────────┐
        │ Counter = 0   │      │ Counter = 0   │
        │ Delay = 0     │      │ Delay = 0     │
        │ State = LOCKED│      │ State = LOCKED│
        └───────────────┘      └───────────────┘
```

### Counter Management Flowchart

```
                    Receive Send Key Request
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Check Attempt       │
                  │ Counter             │
                  └──────────┬──────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
           Counter < Max           Counter >= Max
           (e.g., < 3)             (e.g., >= 3)
                 │                       │
                 ▼                       ▼
      ┌─────────────────────┐   ┌──────────────────┐
      │ Validate Key        │   │ Return NRC 0x36  │
      └──────────┬──────────┘   │ (Exceeded        │
                 │               │  Attempts)       │
     ┌───────────┴────────┐     │                  │
     │                    │     │ Ignore key       │
  Valid Key          Invalid    │ validation       │
     │                    │     └──────────────────┘
     ▼                    ▼
┌─────────────┐   ┌──────────────────┐
│ SUCCESS!    │   │ FAILURE!         │
│             │   │                  │
│ • Counter   │   │ • Counter++      │
│   = 0       │   │ • Start delay    │
│ • Delay = 0 │   │   timer (10s)    │
│ • State =   │   │ • Return         │
│   UNLOCKED  │   │   NRC 0x35       │
└─────────────┘   └─────────┬────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │ Check if Counter    │
                  │ reached Max         │
                  └──────────┬──────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          Still Below Max          At Max Now
           (e.g., 1 or 2)           (e.g., 3)
                 │                       │
                 ▼                       ▼
      ┌─────────────────────┐   ┌──────────────────┐
      │ Can try again       │   │ LOCKOUT ACTIVE   │
      │ after delay         │   │ Need power cycle │
      └─────────────────────┘   │ or long wait     │
                                └──────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Successful Unlock (Happy Path)

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 1: Successful Security Unlock                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Diagnostic Session (0x10 0x03)                │
│ • Security state = LOCKED                                       │
│ • Attempt counter = 0                                           │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Request Seed                                            │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x67] [0x01] [SEED_4_BYTES]                    │
│   Verify:       ✓ Positive response                             │
│                 ✓ Seed is non-zero                              │
│                 ✓ Seed length = 4 bytes                         │
│                                                                 │
│ Step 2: Calculate Key                                           │
│   Key = CryptoAlgorithm(Seed, Secret)                           │
│   Example: If seed = 0x12345678                                 │
│            Then key = 0xABCDEF01 (from algorithm)               │
│                                                                 │
│ Step 3: Send Key                                                │
│   Tester → ECU: [0x27] [0x02] [0xAB] [0xCD] [0xEF] [0x01]      │
│   Expected:     [0x67] [0x02]                                   │
│   Verify:       ✓ Positive response                             │
│                 ✓ Response length = 2 bytes                     │
│                                                                 │
│ Step 4: Verify Unlock                                           │
│   Tester → ECU: [0x2E] [0xF1] [0x90] [0x12] [0x34]             │
│                 (Write to protected DID)                        │
│   Expected:     [0x6E] [0xF1] [0x90]                            │
│   Verify:       ✓ Protected operation succeeds                  │
│                 ✓ No NRC 0x33 (security not met)                │
│                                                                 │
│ Postconditions:                                                 │
│ • Security state = UNLOCKED                                     │
│ • Attempt counter = 0 (reset)                                   │
│ • Can perform protected operations                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Invalid Key

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 2: Invalid Key Response                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Session                                       │
│ • Security state = LOCKED                                       │
│ • Attempt counter = 0                                           │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Request Seed                                            │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x67] [0x01] [SEED]                            │
│                                                                 │
│ Step 2: Send WRONG Key                                          │
│   Tester → ECU: [0x27] [0x02] [0x00] [0x00] [0x00] [0x00]      │
│                 (Intentionally wrong)                           │
│   Expected:     [0x7F] [0x27] [0x35]                            │
│   Verify:       ✓ NRC 0x35 (Invalid Key)                        │
│                                                                 │
│ Step 3: Attempt Counter Check                                   │
│   Internal State: Counter = 1                                   │
│                                                                 │
│ Step 4: Try Protected Operation                                 │
│   Tester → ECU: [0x2E] [0xF1] [0x90] [DATA]                     │
│   Expected:     [0x7F] [0x2E] [0x33]                            │
│   Verify:       ✓ NRC 0x33 (Security Access Denied)             │
│                 ✓ Still locked                                  │
│                                                                 │
│ Step 5: Immediate Retry (Delay Active)                          │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x7F] [0x27] [0x37]                            │
│   Verify:       ✓ NRC 0x37 (Time Delay Not Expired)             │
│                                                                 │
│ Step 6: Wait for Delay (10 seconds)                             │
│   Wait Time: 10 seconds                                         │
│                                                                 │
│ Step 7: Request Seed Again                                      │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x67] [0x01] [NEW_SEED]                        │
│   Verify:       ✓ New seed provided (different from Step 1)     │
│                                                                 │
│ Postconditions:                                                 │
│ • Security state = SEED_REQUESTED                               │
│ • Attempt counter = 1                                           │
│ • Delay timer expired                                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Timeout During Seed Request

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 3: Seed Timeout                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Session                                       │
│ • Seed timeout configured = 5 seconds                           │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Request Seed                                            │
│   Time 0:00 - Tester → ECU: [0x27] [0x01]                       │
│   Expected:            ECU → Tester: [0x67] [0x01] [SEED]       │
│   Verify:   ✓ Seed received                                     │
│                                                                 │
│ Step 2: Wait Beyond Timeout                                     │
│   Time 0:06 - (6 seconds elapsed, > 5 second timeout)           │
│   Action: Send key (too late)                                   │
│                                                                 │
│   Tester → ECU: [0x27] [0x02] [CORRECT_KEY]                     │
│   Expected:     [0x7F] [0x27] [0x22]                            │
│   Verify:       ✓ NRC 0x22 (Conditions Not Correct)             │
│                 ✓ Seed expired, state = LOCKED                  │
│                                                                 │
│ Step 3: Request New Seed                                        │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x67] [0x01] [NEW_SEED]                        │
│   Verify:       ✓ New seed generated                            │
│                 ✓ Different from Step 1 seed                    │
│                                                                 │
│ Step 4: Send Key Promptly (< 5 seconds)                         │
│   Time 0:08 - Calculate key for NEW_SEED                        │
│   Time 0:09 - Send key (within 3 seconds)                       │
│                                                                 │
│   Tester → ECU: [0x27] [0x02] [NEW_KEY]                         │
│   Expected:     [0x67] [0x02]                                   │
│   Verify:       ✓ Unlocked successfully                         │
│                                                                 │
│ Postconditions:                                                 │
│ • Security state = UNLOCKED                                     │
│ • Old seed discarded                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 4: Attempt Limit Reached

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 4: Exceeded Number of Attempts                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Session                                       │
│ • Max attempts = 3                                              │
│ • Delay per attempt = 10 seconds                                │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Attempt 1:                                                      │
│   Request Seed:  [0x27] [0x01]                                  │
│   Response:      [0x67] [0x01] [SEED1]                          │
│   Send Bad Key:  [0x27] [0x02] [WRONG]                          │
│   Response:      [0x7F] [0x27] [0x35]  ← Invalid Key            │
│   Counter:       1/3                                            │
│   Wait:          10 seconds                                     │
│                                                                 │
│ Attempt 2:                                                      │
│   Request Seed:  [0x27] [0x01]                                  │
│   Response:      [0x67] [0x01] [SEED2]                          │
│   Send Bad Key:  [0x27] [0x02] [WRONG]                          │
│   Response:      [0x7F] [0x27] [0x35]  ← Invalid Key            │
│   Counter:       2/3                                            │
│   Wait:          10 seconds                                     │
│                                                                 │
│ Attempt 3:                                                      │
│   Request Seed:  [0x27] [0x01]                                  │
│   Response:      [0x67] [0x01] [SEED3]                          │
│   Send Bad Key:  [0x27] [0x02] [WRONG]                          │
│   Response:      [0x7F] [0x27] [0x35]  ← Invalid Key            │
│   Counter:       3/3 (MAX REACHED)                              │
│   State:         LOCKOUT ACTIVE                                 │
│                                                                 │
│ Attempt 4 (Blocked):                                            │
│   Wait:          10 seconds                                     │
│   Request Seed:  [0x27] [0x01]                                  │
│   Response:      [0x7F] [0x27] [0x36]  ← Exceeded Attempts!     │
│   Verify:        ✓ Lockout enforced                             │
│                  ✓ No seed provided                             │
│                                                                 │
│ Recovery:                                                       │
│   Option A: Power cycle ECU                                     │
│           → Counter = 0, can try again                          │
│                                                                 │
│   Option B: Wait lockout period (e.g., 10 minutes)              │
│           → Counter = 0, can try again                          │
│                                                                 │
│ Postconditions:                                                 │
│ • Cannot unlock until reset/wait                                │
│ • Security event logged                                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 5: Wrong Session

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 5: Security in Wrong Session                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Default Session (0x01)                                 │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Attempt Seed Request in Default Session                 │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x7F] [0x27] [0x7F]                            │
│   Verify:       ✓ NRC 0x7F (Service Not Supported in           │
│                              Active Session)                    │
│                                                                 │
│ Step 2: Switch to Extended Session                              │
│   Tester → ECU: [0x10] [0x03]                                   │
│   Expected:     [0x50] [0x03] [P2*] [P2*]                       │
│   Verify:       ✓ Session changed                               │
│                                                                 │
│ Step 3: Request Seed (Now Allowed)                              │
│   Tester → ECU: [0x27] [0x01]                                   │
│   Expected:     [0x67] [0x01] [SEED]                            │
│   Verify:       ✓ Seed provided                                 │
│                                                                 │
│ Step 4: Unlock Successfully                                     │
│   Tester → ECU: [0x27] [0x02] [CORRECT_KEY]                     │
│   Expected:     [0x67] [0x02]                                   │
│   Verify:       ✓ Unlocked                                      │
│                                                                 │
│ Step 5: Switch Back to Default Session                          │
│   Tester → ECU: [0x10] [0x01]                                   │
│   Expected:     [0x50] [0x01] [P2*] [P2*]                       │
│   Verify:       ✓ Session changed                               │
│                                                                 │
│ Step 6: Verify Security Lost                                    │
│   Tester → ECU: [0x2E] [0xF1] [0x90] [DATA]                     │
│                 (Protected operation)                           │
│   Expected:     [0x7F] [0x2E] [0x7F]                            │
│   Verify:       ✓ NRC 0x7F (Service not supported)              │
│                 ✓ Security unlocked state lost                  │
│                                                                 │
│ Postconditions:                                                 │
│ • Must unlock again if switching back to Extended               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 6: S3 Timeout (Session Timeout)

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 6: S3 Timeout Loses Security                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Session                                       │
│ • Security UNLOCKED (Level 1)                                   │
│ • S3 timeout = 5 seconds                                        │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Verify Unlocked State                                   │
│   Time 0:00 - Tester → ECU: [0x2E] [0xF1] [0x90] [DATA]         │
│   Expected: [0x6E] [0xF1] [0x90]                                │
│   Verify:   ✓ Protected write succeeds                          │
│                                                                 │
│ Step 2: Wait Without Communication                              │
│   Time 0:00 to 0:06 - No messages sent                          │
│   (S3 timeout expires at 0:05)                                  │
│                                                                 │
│ Step 3: Attempt Protected Operation                             │
│   Time 0:06 - Tester → ECU: [0x2E] [0xF1] [0x90] [DATA]         │
│   Expected:        ECU → Tester: [0x7F] [0x2E] [0x7F]           │
│   Verify:          ✓ NRC 0x7F (Session timeout)                 │
│                    ✓ Returned to Default Session                │
│                    ✓ Security lost                              │
│                                                                 │
│ Step 4: Re-establish Session & Security                         │
│   Switch Session:  [0x10] [0x03] → [0x50] [0x03]                │
│   Request Seed:    [0x27] [0x01] → [0x67] [0x01] [SEED]         │
│   Send Key:        [0x27] [0x02] [KEY] → [0x67] [0x02]          │
│   Verify:          ✓ Re-unlocked                                │
│                                                                 │
│ Step 5: Keep Alive with TesterPresent                           │
│   Time 0:10 - [0x3E] [0x00] → [0x7E] [0x00]                     │
│   Time 0:14 - [0x3E] [0x00] → [0x7E] [0x00]                     │
│   Time 0:18 - [0x3E] [0x00] → [0x7E] [0x00]                     │
│   (Every 4 seconds, before 5 second timeout)                    │
│                                                                 │
│ Step 6: Verify Security Maintained                              │
│   Time 0:20 - Tester → ECU: [0x2E] [0xF1] [0x90] [DATA]         │
│   Expected:         ECU → Tester: [0x6E] [0xF1] [0x90]          │
│   Verify:           ✓ Still unlocked                            │
│                     ✓ Protected operation succeeds              │
│                                                                 │
│ Postconditions:                                                 │
│ • Security maintained with periodic TesterPresent               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 7: Already Unlocked (Zero Seed)

```
┌────────────────────────────────────────────────────────────────┐
│ TEST CASE 7: Request Seed When Already Unlocked                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Preconditions:                                                  │
│ • ECU in Extended Session                                       │
│ • Security Level 1 UNLOCKED                                     │
│                                                                 │
│ Test Steps:                                                     │
│                                                                 │
│ Step 1: Request Seed for Same Level                             │
│   Tester → ECU: [0x27] [0x01]  (Request Level 1 seed)           │
│   Expected:     [0x67] [0x01] [0x00] [0x00] [0x00] [0x00]       │
│   Verify:       ✓ All-zero seed                                 │
│                 ✓ Indicates already unlocked                    │
│                 ✓ No key needed                                 │
│                                                                 │
│ Step 2: Try Different Level                                     │
│   Tester → ECU: [0x27] [0x03]  (Request Level 2 seed)           │
│   Expected:     [0x67] [0x03] [REAL_SEED]                       │
│   Verify:       ✓ Non-zero seed (Level 2 still locked)          │
│                 ✓ Different levels independent                  │
│                                                                 │
│ Step 3: Verify Level 1 Still Unlocked                           │
│   Tester → ECU: [0x2E] [Level1_Protected_DID] [DATA]            │
│   Expected:     [0x6E] [DID]                                    │
│   Verify:       ✓ Level 1 operations still work                 │
│                                                                 │
│ Postconditions:                                                 │
│ • Level 1 remains unlocked                                      │
│ • Level 2 still locked (independent)                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Debugging Flowcharts

### Troubleshooting NRC 0x35 (Invalid Key)

```
                  NRC 0x35 Received (Invalid Key)
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Check #1: Algorithm    │
                 │ Match?                 │
                 └────────┬───────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
          Tester & ECU             Mismatch!
          use same algo                │
              │                        ▼
              ▼               ┌────────────────┐
     ┌────────────────┐       │ FIX: Update    │
     │ Check #2:      │       │ tester to use  │
     │ Seed Captured  │       │ correct crypto │
     │ Correctly?     │       │ algorithm      │
     └────────┬───────┘       └────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
 Correct             Incorrect
 Seed Used           Seed Used
    │                    │
    ▼                    ▼
┌─────────────┐   ┌──────────────────┐
│ Check #3:   │   │ FIX: Ensure      │
│ Secret Key  │   │ using seed from  │
│ Correct?    │   │ immediate prior  │
└──────┬──────┘   │ seed response    │
       │          └──────────────────┘
┌──────┴───────┐
│              │
Correct     Wrong Key
Key Used    Stored
│              │
▼              ▼
┌────────────┐  ┌──────────────────┐
│ Check #4:  │  │ FIX: Verify      │
│ Byte Order │  │ secret key in    │
│ Correct?   │  │ tester config    │
└─────┬──────┘  └──────────────────┘
      │
┌─────┴──────┐
│            │
Big      Little
Endian   Endian
Match    Mismatch
│            │
▼            ▼
┌──────────┐  ┌──────────────────┐
│ Check #5 │  │ FIX: Swap byte   │
│ Key      │  │ order to match   │
│ Length?  │  │ ECU expectation  │
└────┬─────┘  └──────────────────┘
     │
┌────┴─────┐
│          │
Correct  Wrong
Length   Length
│          │
▼          ▼
┌─────────┐  ┌──────────────────┐
│ Contact │  │ FIX: Verify key  │
│ ECU     │  │ should be N bytes│
│ Vendor  │  │ (check spec)     │
└─────────┘  └──────────────────┘
```

### Troubleshooting NRC 0x36 (Lockout)

```
              NRC 0x36 Received (Exceeded Attempts)
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Step 1: Stop Trying!   │
                 │ More attempts won't    │
                 │ help                   │
                 └────────┬───────────────┘
                          │
                          ▼
                 ┌────────────────────────┐
                 │ Step 2: Determine      │
                 │ Reset Method           │
                 └────────┬───────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
        Power Cycle                Time Delay
        Available?                 Available?
              │                        │
              ▼                        ▼
     ┌────────────────┐       ┌────────────────┐
     │ Option A:      │       │ Option B:      │
     │ • Turn ECU off │       │ • Wait N mins  │
     │ • Wait 10s     │       │   (e.g., 10)   │
     │ • Turn ECU on  │       │ • Counter      │
     │ • Counter = 0  │       │   resets       │
     └────────┬───────┘       └────────┬───────┘
              │                        │
              └────────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ Step 3: Re-unlock  │
                  │ with CORRECT key   │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ Step 4: If still   │
                  │ failing, verify:   │
                  │ • Algorithm        │
                  │ • Secret key       │
                  │ • Seed capture     │
                  └────────────────────┘
```

### Troubleshooting Session/Security Loss

```
        Protected Operation Fails (NRC 0x33 or 0x7F)
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Check Current Session  │
                 └────────┬───────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
         Extended/Prog              Default
              │                        │
              ▼                        ▼
     ┌────────────────┐       ┌────────────────┐
     │ Session OK     │       │ ISSUE: Session │
     │ Check Security │       │ timeout (S3)   │
     └────────┬───────┘       │                │
              │               │ FIX: Send      │
              ▼               │ TesterPresent  │
     ┌────────────────┐       │ every 4s       │
     │ Request Seed   │       └────────────────┘
     │ [0x27][0x01]   │
     └────────┬───────┘
              │
    ┌─────────┴──────────┐
    │                    │
  All Zeros          Real Seed
  Returned           Returned
    │                    │
    ▼                    ▼
┌─────────────┐   ┌──────────────────┐
│ ISSUE:      │   │ ISSUE: Security  │
│ Already     │   │ was lost         │
│ unlocked!   │   │                  │
│ (Unexpected)│   │ Possible causes: │
│             │   │ • Session change │
│ Recheck DID │   │ • S3 timeout     │
│ protection  │   │ • Power glitch   │
│ level       │   │                  │
└─────────────┘   │ FIX: Re-unlock   │
                  │ then retry op    │
                  └──────────────────┘
```

---

## 📚 Related Documentation

- **Theory Guide:** `SID_27_SECURITY_ACCESS.md`
- **Service Interactions:** `SID_27_SERVICE_INTERACTIONS.md`
- **ISO 14229-1:2020:** Section 9.3 - Security Access Service

---

**End of SID 0x27 Practical Implementation Guide**
