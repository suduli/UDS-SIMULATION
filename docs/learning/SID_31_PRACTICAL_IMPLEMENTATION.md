# SID 0x31 - Routine Control (Practical Implementation Guide)

**Document Version**: 2.0  
**Last Updated**: October 12, 2025  
**Format**: Visual Diagrams (No Code)  
**ISO Reference**: ISO 14229-1:2020 Section 9.5

---

## 📋 Table of Contents

1. [Request Processing Flowchart](#request-processing-flowchart)
2. [State Machine Diagrams](#state-machine-diagrams)
3. [NRC Decision Trees](#nrc-decision-trees)
4. [Session Timeout Management](#session-timeout-management)
5. [Testing Scenarios](#testing-scenarios)
6. [Integration Patterns](#integration-patterns)
7. [Debugging Flowcharts](#debugging-flowcharts)
8. [Best Practices Checklist](#best-practices-checklist)

---

## Request Processing Flowchart

### Overall Request Handling

```
                    ┌──────────────────┐
                    │  Receive Request │
                    │   SID 0x31       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Message Length   │
                ┌───┤ >= 4 bytes?      │───┐
                │   └──────────────────┘   │
               YES                         NO
                │                           │
                ▼                           ▼
       ┌──────────────────┐        ┌──────────────┐
       │ Valid SubFunction│        │ Return NRC   │
   ┌───┤ (0x01/0x02/0x03)?│───┐    │ 0x13         │
   │   └──────────────────┘   │    └──────────────┘
  YES                        NO
   │                          │
   ▼                          ▼
┌──────────────┐      ┌──────────────┐
│ Check Session│      │ Return NRC   │
│ Requirements │      │ 0x12         │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────────┐
│ Current Session  │
│ Allows This      │
│ Routine?         │
└──────┬───────────┘
       │
   ┌───┴───┐
  YES     NO
   │       │
   │       ▼
   │   ┌──────────────┐
   │   │ Return NRC   │
   │   │ 0x7F         │
   │   └──────────────┘
   │
   ▼
┌──────────────────┐
│ Check Security   │
│ Requirements     │
└──────┬───────────┘
       │
   ┌───┴────┐
  YES      NO
   │        │
   │        ▼
   │   ┌──────────────┐
   │   │ Is Security  │
   │   │ Unlocked?    │
   │   └──────┬───────┘
   │          │
   │         NO
   │          │
   │          ▼
   │   ┌──────────────┐
   │   │ Return NRC   │
   │   │ 0x33         │
   │   └──────────────┘
   │
   ▼
┌──────────────────┐
│ Check RID        │
│ Supported?       │
└──────┬───────────┘
       │
   ┌───┴───┐
  YES     NO
   │       │
   │       ▼
   │   ┌──────────────┐
   │   │ Return NRC   │
   │   │ 0x31         │
   │   └──────────────┘
   │
   ▼
┌──────────────────┐
│ Route to         │
│ SubFunction      │
│ Handler          │
└──────┬───────────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
  0x01     0x02     0x03     │
   │        │        │        │
   ▼        ▼        ▼        ▼
┌──────┐┌──────┐┌──────┐┌──────┐
│Start ││Stop  ││Get   ││Error │
│Logic ││Logic ││Result││Path  │
└──────┘└──────┘└──────┘└──────┘
```

### Start Routine (0x01) Detailed Flow

```
        ┌────────────────────────┐
        │ Start Routine Request  │
        │ SF = 0x01              │
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ Check if Routine       │
    ┌───┤ Already Running?       │───┐
    │   └────────────────────────┘   │
   YES                               NO
    │                                 │
    ▼                                 ▼
┌──────────────┐         ┌────────────────────────┐
│ Return NRC   │         │ Check Pre-Conditions:  │
│ 0x24         │         │ • Vehicle state        │
│ (Sequence    │         │ • Voltage level        │
│  Error)      │         │ • Temperature          │
└──────────────┘         │ • Speed = 0            │
                         │ • Engine state         │
                         └───────────┬────────────┘
                                     │
                             ┌───────┴────────┐
                            MET            NOT MET
                             │                 │
                             ▼                 ▼
                  ┌────────────────┐   ┌──────────────┐
                  │ Parse Option   │   │ Return NRC   │
                  │ Record (if any)│   │ 0x22         │
                  └───────┬────────┘   └──────────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │ Initialize     │
                  │ Routine        │
                  │ State Machine  │
                  └───────┬────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │ Start Execution│
                  │ (Background or │
                  │  Immediate)    │
                  └───────┬────────┘
                          │
                      ┌───┴────┐
                  SUCCESS   FAIL
                      │        │
                      ▼        ▼
              ┌──────────┐ ┌──────────┐
              │ Return   │ │ Return   │
              │ 71 01 RID│ │ NRC 0x72 │
              │ + Status │ │          │
              └──────────┘ └──────────┘
```

### Stop Routine (0x02) Detailed Flow

```
        ┌────────────────────────┐
        │ Stop Routine Request   │
        │ SF = 0x02              │
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ Is Routine             │
    ┌───┤ Currently Running?     │───┐
    │   └────────────────────────┘   │
   YES                               NO
    │                                 │
    ▼                                 ▼
┌────────────────┐         ┌──────────────────┐
│ Can Routine Be │         │ Return NRC 0x24  │
│ Stopped?       │         │ (Not running)    │
└────┬───────────┘         └──────────────────┘
     │
 ┌───┴────┐
YES      NO
 │        │
 │        ▼
 │   ┌──────────────┐
 │   │ Return NRC   │
 │   │ 0x22         │
 │   │ (Cannot stop)│
 │   └──────────────┘
 │
 ▼
┌────────────────┐
│ Send Stop      │
│ Signal to      │
│ Routine        │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Wait for       │
│ Graceful       │
│ Shutdown       │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Cleanup        │
│ Resources      │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Mark as        │
│ Stopped        │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Return 71 02   │
│ RID + Status   │
└────────────────┘
```

### Request Results (0x03) Detailed Flow

```
        ┌────────────────────────┐
        │ Request Results        │
        │ SF = 0x03              │
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ Has Routine Been       │
    ┌───┤ Started Before?        │───┐
    │   └────────────────────────┘   │
   YES                               NO
    │                                 │
    ▼                                 ▼
┌────────────────┐         ┌──────────────────┐
│ Check Routine  │         │ Return NRC 0x24  │
│ State          │         │ (Never started)  │
└────┬───────────┘         └──────────────────┘
     │
     ▼
┌────────────────────────┐
│ Routine State?         │
└────┬───────────────────┘
     │
 ┌───┼────┬────────┐
 │   │    │        │
RUN DONE FAIL   STOPPED
 │   │    │        │
 │   │    │        │
 ▼   ▼    ▼        ▼
┌─────────────────────────────────┐
│ Gather Results:                 │
│ • Current status                │
│ • Progress percentage           │
│ • Test values                   │
│ • Pass/Fail indication          │
│ • Error codes (if applicable)   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Format Status Record            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Return 71 03 RID + Results      │
└─────────────────────────────────┘
```

---

## State Machine Diagrams

### Routine Lifecycle States

```
┌────────────────────────────────────────────────────────────────┐
│                    ROUTINE STATE MACHINE                       │
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   IDLE       │◄──────────────┐
                    │  (No routine │               │
                    │   running)   │               │
                    └──────┬───────┘               │
                           │                       │
                    Start  │ (0x01)                │
                           │                       │
                           ▼                       │
                    ┌──────────────┐               │
              ┌────►│   RUNNING    │               │
              │     │  (Executing) │               │
              │     └──────┬───────┘               │
              │            │                       │
              │      ┌─────┼─────┬────────┐       │
              │      │     │     │        │       │
              │  Results  Stop Complete  Fail     │
              │   (0x03) (0x02)  │        │       │
              │      │     │     │        │       │
              └──────┘     │     ▼        ▼       │
                           │  ┌──────┐ ┌──────┐   │
                           │  │DONE  │ │FAILED│   │
                           │  │(Pass)│ │(Error│   │
                           │  └───┬──┘ └───┬──┘   │
                           │      │        │       │
                           │      │        │       │
                           ▼      ▼        ▼       │
                        ┌──────────────────────┐   │
                        │    STOPPED           │   │
                        │ (Cleanup complete)   │   │
                        └──────────┬───────────┘   │
                               Timeout or           │
                               New Request          │
                                   │                │
                                   └────────────────┘
```

### Session and Security State Integration

```
┌────────────────────────────────────────────────────────────────┐
│         ROUTINE ACCESS BASED ON SESSION & SECURITY             │
└────────────────────────────────────────────────────────────────┘

    SESSION STATE          SECURITY STATE         ROUTINE ACCESS
    
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│   DEFAULT    │         │   LOCKED 🔒  │       │  Basic Only  │
│   (0x01)     │────────►│              │──────►│  (Limited)   │
└──────────────┘         └──────────────┘       └──────────────┘
                                                                  
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│   EXTENDED   │         │   LOCKED 🔒  │       │  Standard    │
│   (0x03)     │────────►│              │──────►│  (More)      │
└──────────────┘         └──────────────┘       └──────────────┘
                                                                  
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│   EXTENDED   │         │ UNLOCKED 🔓  │       │  Advanced    │
│   (0x03)     │────────►│              │──────►│  (Full)      │
└──────────────┘         └──────────────┘       └──────────────┘
                                                                  
┌──────────────┐         ┌──────────────┐       ┌──────────────┐
│ PROGRAMMING  │         │ UNLOCKED 🔓  │       │ Programming  │
│   (0x02)     │────────►│              │──────►│  (All)       │
└──────────────┘         └──────────────┘       └──────────────┘
```

---

## NRC Decision Trees

### Which NRC to Return?

```
                    Request Received
                          │
                          ▼
                ┌──────────────────┐
                │ Message Length   │
                │ Correct?         │
                └────┬─────────────┘
                     │
            ┌────────┴────────┐
           NO                YES
            │                 │
            ▼                 ▼
      ┌──────────┐   ┌──────────────────┐
      │NRC 0x13  │   │ SubFunction      │
      │          │   │ Valid?           │
      └──────────┘   └────┬─────────────┘
                          │
                  ┌───────┴───────┐
                 NO              YES
                  │                │
                  ▼                ▼
            ┌──────────┐   ┌──────────────────┐
            │NRC 0x12  │   │ Session Allows?  │
            │          │   └────┬─────────────┘
            └──────────┘        │
                         ┌──────┴──────┐
                        NO            YES
                         │              │
                         ▼              ▼
                   ┌──────────┐   ┌──────────────────┐
                   │NRC 0x7F  │   │ Security OK?     │
                   │          │   └────┬─────────────┘
                   └──────────┘        │
                                ┌──────┴──────┐
                               NO            YES
                                │              │
                                ▼              ▼
                          ┌──────────┐   ┌──────────────────┐
                          │NRC 0x33  │   │ RID Supported?   │
                          │          │   └────┬─────────────┘
                          └──────────┘        │
                                       ┌──────┴──────┐
                                      NO            YES
                                       │              │
                                       ▼              ▼
                                 ┌──────────┐   ┌──────────────────┐
                                 │NRC 0x31  │   │ Sequence OK?     │
                                 │          │   └────┬─────────────┘
                                 └──────────┘        │
                                              ┌──────┴──────┐
                                             NO            YES
                                              │              │
                                              ▼              ▼
                                        ┌──────────┐   ┌──────────────┐
                                        │NRC 0x24  │   │ Conditions   │
                                        │          │   │ Met?         │
                                        └──────────┘   └────┬─────────┘
                                                            │
                                                     ┌──────┴──────┐
                                                    NO            YES
                                                     │              │
                                                     ▼              ▼
                                               ┌──────────┐   ┌──────────┐
                                               │NRC 0x22  │   │ Execute  │
                                               │          │   │ Routine  │
                                               └──────────┘   └────┬─────┘
                                                                   │
                                                            ┌──────┴──────┐
                                                         FAIL           OK
                                                            │              │
                                                            ▼              ▼
                                                      ┌──────────┐   ┌──────────┐
                                                      │NRC 0x72  │   │Positive  │
                                                      │          │   │Response  │
                                                      └──────────┘   └──────────┘
```

### Start Routine Sequence Check

```
                    Start Request (0x01)
                            │
                            ▼
                ┌────────────────────────┐
                │ Is Routine Already     │
            ┌───┤ Running?               │───┐
            │   └────────────────────────┘   │
           YES                               NO
            │                                 │
            ▼                                 ▼
      ┌──────────┐                   ┌──────────────┐
      │NRC 0x24  │                   │ Continue     │
      │(Already  │                   │ Processing   │
      │ running) │                   └──────────────┘
      └──────────┘
```

### Stop Routine Sequence Check

```
                    Stop Request (0x02)
                            │
                            ▼
                ┌────────────────────────┐
                │ Is Routine Currently   │
            ┌───┤ Running?               │───┐
            │   └────────────────────────┘   │
           NO                                YES
            │                                 │
            ▼                                 ▼
      ┌──────────┐                   ┌──────────────┐
      │NRC 0x24  │                   │ Can Be       │
      │(Not      │                   │ Stopped?     │
      │ running) │                   └──────┬───────┘
      └──────────┘                          │
                                     ┌──────┴──────┐
                                    NO            YES
                                     │              │
                                     ▼              ▼
                               ┌──────────┐   ┌──────────┐
                               │NRC 0x22  │   │Stop It   │
                               │(Cannot   │   │          │
                               │ stop)    │   └──────────┘
                               └──────────┘
```

---

## Session Timeout Management

### Timeout Behavior Diagram

```
┌────────────────────────────────────────────────────────────────┐
│               SESSION TIMEOUT WITH ROUTINE RUNNING             │
└────────────────────────────────────────────────────────────────┘

  Time: 0s                    5s (Timeout!)           
    │                          │                       
    │ Start Extended Session   │                       
    │──────────────────────────│                       
    │                          │                       
    │ Start Routine            │                       
    │ (Long execution)         │                       
    │                          │                       
    │ [Routine Running...]     │ Session Expires       
    │                          │                       
    │                          ▼                       
    │                    ┌──────────────┐              
    │                    │ Session →    │              
    │                    │ DEFAULT      │              
    │                    └──────────────┘              
    │                          │                       
    │                          │ Routine Stops         
    │                          │ (Auto-cleanup)        
    │                          │                       
    │                          ▼                       
    │                    ┌──────────────┐              
    │                    │ Return to    │              
    │                    │ IDLE State   │              
    │                    └──────────────┘              
```

### Preventing Timeout with Tester Present

```
  Tester                                    ECU
    │                                        │
    │  10 03 (Extended Session)              │
    │───────────────────────────────────────>│
    │                                        │
    │  31 01 12 34 (Start long routine)      │
    │───────────────────────────────────────>│
    │                          [Routine runs]│
    │                                        │
    │  3E 00 (Tester Present)                │
    │───────────────────────────────────────>│ ◄── Every 2-3 sec
    │  7E 00                                 │
    │<───────────────────────────────────────│
    │                          [Routine runs]│
    │                                        │
    │  3E 00 (Tester Present)                │
    │───────────────────────────────────────>│ ◄── Keep alive
    │  7E 00                                 │
    │<───────────────────────────────────────│
    │                          [Routine runs]│
    │                                        │
    │  31 03 12 34 (Get results)             │
    │───────────────────────────────────────>│
    │  71 03 12 34 [Results: PASS]           │
    │<───────────────────────────────────────│
    │                                        │
```

---

## Testing Scenarios

### Scenario 1: Basic Actuator Test

```
┌────────────────────────────────────────────────────────────────┐
│ TEST: Fuel Injector Activation Test (RID 0x1234)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Prerequisites:                                                 │
│  ✓ Vehicle stationary (speed = 0)                             │
│  ✓ Engine off                                                 │
│  ✓ Ignition on                                                │
│  ✓ Extended diagnostic session active                         │
│  ✓ Security unlocked (if required)                            │
│                                                                │
│ Test Sequence:                                                 │
│                                                                │
│  Step 1: Start Test                                           │
│    Tester → ECU: 31 01 12 34                                  │
│    ECU → Tester: 71 01 12 34 00                               │
│    [ECU pulses injector for 100ms]                            │
│                                                                │
│  Step 2: Get Results                                          │
│    Tester → ECU: 31 03 12 34                                  │
│    ECU → Tester: 71 03 12 34 01 [Status: PASS]                │
│                                                                │
│ Expected Result: ✅ PASS                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Long Running Calibration

```
┌────────────────────────────────────────────────────────────────┐
│ TEST: Throttle Position Calibration (RID 0xABCD)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Execution Time: ~30 seconds                                    │
│                                                                │
│  T=0s   Tester → ECU: 31 01 AB CD (Start)                     │
│         ECU → Tester: 71 01 AB CD 00                           │
│         [Calibration begins...]                                │
│                                                                │
│  T=2s   Tester → ECU: 3E 00 (Tester Present)                  │
│         ECU → Tester: 7E 00                                    │
│                                                                │
│  T=5s   Tester → ECU: 31 03 AB CD (Check progress)            │
│         ECU → Tester: 71 03 AB CD 00 14 (20% complete)        │
│                                                                │
│  T=7s   Tester → ECU: 3E 00 (Keep alive)                      │
│         ECU → Tester: 7E 00                                    │
│                                                                │
│  T=15s  Tester → ECU: 31 03 AB CD (Check progress)            │
│         ECU → Tester: 71 03 AB CD 00 32 (50% complete)        │
│                                                                │
│  T=30s  Tester → ECU: 31 03 AB CD (Final results)             │
│         ECU → Tester: 71 03 AB CD 01 64 (PASS, 100%)          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Routine Abortion

```
┌────────────────────────────────────────────────────────────────┐
│ TEST: User Cancels Routine Mid-Execution                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  T=0s   Tester → ECU: 31 01 56 78 (Start)                     │
│         ECU → Tester: 71 01 56 78 00                           │
│         [Routine executing...]                                 │
│                                                                │
│  T=5s   [User presses STOP button]                            │
│         Tester → ECU: 31 02 56 78 (Stop)                      │
│         ECU: [Stops routine, cleanup]                          │
│         ECU → Tester: 71 02 56 78 02 (Stopped by user)        │
│                                                                │
│  T=6s   Tester → ECU: 31 03 56 78 (Check final state)         │
│         ECU → Tester: 71 03 56 78 02 (Status: ABORTED)        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Scenario 4: Failure During Execution

```
┌────────────────────────────────────────────────────────────────┐
│ TEST: Component Test Fails                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tester → ECU: 31 01 99 AA (Start Lambda Sensor Test)         │
│  ECU → Tester: 71 01 99 AA 00                                 │
│                                                                │
│  [ECU tries to heat sensor... sensor doesn't respond]          │
│                                                                │
│  Tester → ECU: 31 03 99 AA (Get results)                      │
│  ECU → Tester: 7F 31 72 (General Programming Failure)         │
│                                                                │
│  Analysis:                                                     │
│  • Routine started OK                                          │
│  • Hardware component failed                                   │
│  • ECU returns NRC 0x72                                        │
│  • Technician needs to check sensor wiring                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Diagnostic Test Workflow

```
┌────────────────────────────────────────────────────────────────┐
│           COMPLETE DIAGNOSTIC TEST WORKFLOW                    │
└────────────────────────────────────────────────────────────────┘

    Tester                                ECU
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 1: Session Setup         │ │
      │ └────────────────────────────────┘ │
      │  10 03 (Extended Session)          │
      │───────────────────────────────────>│
      │  50 03                             │
      │<───────────────────────────────────│
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 2: Security Unlock       │ │
      │ └────────────────────────────────┘ │
      │  27 01 (Request Seed)              │
      │───────────────────────────────────>│
      │  67 01 [SEED]                      │
      │<───────────────────────────────────│
      │  27 02 [KEY]                       │
      │───────────────────────────────────>│
      │  67 02 🔓                          │
      │<───────────────────────────────────│
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 3: Pre-Test Checks       │ │
      │ └────────────────────────────────┘ │
      │  22 F1 90 (Read VIN)               │
      │───────────────────────────────────>│
      │  62 F1 90 [VIN DATA]               │
      │<───────────────────────────────────│
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 4: Execute Test          │ │
      │ └────────────────────────────────┘ │
      │  31 01 12 34 (Start Test)          │
      │───────────────────────────────────>│
      │  71 01 12 34 00                    │
      │<───────────────────────────────────│
      │                                    │
      │  [Wait for test completion]        │
      │  3E 00 (Keep alive)                │
      │───────────────────────────────────>│
      │  7E 00                             │
      │<───────────────────────────────────│
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 5: Get Results           │ │
      │ └────────────────────────────────┘ │
      │  31 03 12 34 (Results)             │
      │───────────────────────────────────>│
      │  71 03 12 34 [TEST RESULTS]        │
      │<───────────────────────────────────│
      │                                    │
      │ ┌────────────────────────────────┐ │
      │ │ Phase 6: Post-Test Actions     │ │
      │ └────────────────────────────────┘ │
      │  14 FF FF FF (Clear DTCs)          │
      │───────────────────────────────────>│
      │  54                                │
      │<───────────────────────────────────│
      │                                    │
      │  10 01 (Return to Default)         │
      │───────────────────────────────────>│
      │  50 01                             │
      │<───────────────────────────────────│
      │                                    │
```

### Pattern 2: Manufacturing End-of-Line Test

```
┌────────────────────────────────────────────────────────────────┐
│              END-OF-LINE MANUFACTURING TEST                    │
└────────────────────────────────────────────────────────────────┘

  Test Station                           ECU
      │                                   │
      │ ┌───────────────────────────────┐ │
      │ │ Initialize                    │ │
      │ └───────────────────────────────┘ │
      │  10 02 (Programming Session)      │
      │──────────────────────────────────>│
      │  50 02                            │
      │<──────────────────────────────────│
      │  27 XX XX (Unlock)                │
      │──────────────────────────────────>│
      │  67 XX 🔓                         │
      │<──────────────────────────────────│
      │                                   │
      │ ┌───────────────────────────────┐ │
      │ │ Test 1: Self-Test             │ │
      │ └───────────────────────────────┘ │
      │  31 01 F0 00 (ECU Self-Test)      │
      │──────────────────────────────────>│
      │  71 01 F0 00 01 (PASS)            │
      │<──────────────────────────────────│
      │                                   │
      │ ┌───────────────────────────────┐ │
      │ │ Test 2: Communication Test    │ │
      │ └───────────────────────────────┘ │
      │  31 01 F0 01 (CAN Test)           │
      │──────────────────────────────────>│
      │  71 01 F0 01 01 (PASS)            │
      │<──────────────────────────────────│
      │                                   │
      │ ┌───────────────────────────────┐ │
      │ │ Test 3: Actuator Test         │ │
      │ └───────────────────────────────┘ │
      │  31 01 F0 02 (Actuator Test)      │
      │──────────────────────────────────>│
      │  71 01 F0 02 01 (PASS)            │
      │<──────────────────────────────────│
      │                                   │
      │ ┌───────────────────────────────┐ │
      │ │ Finalize                      │ │
      │ └───────────────────────────────┘ │
      │  2E F1 5A [Manufacturing Date]    │
      │──────────────────────────────────>│
      │  6E F1 5A                         │
      │<──────────────────────────────────│
      │                                   │
      │  [ALL TESTS PASSED ✅]            │
      │                                   │
```

---

## Debugging Flowcharts

### Troubleshooting NRC 0x22 (Conditions Not Correct)

```
        Received NRC 0x22
              │
              ▼
    ┌──────────────────┐
    │ Check Vehicle    │
    │ State            │
    └────┬─────────────┘
         │
         ▼
    Is vehicle stopped?
         │
    ┌────┴────┐
   NO        YES
    │          │
    │          ▼
    │    Check Engine State
    │          │
    │     ┌────┴────┐
    │    OFF       ON
    │     │         │
    │     │         └──► [Stop engine]
    │     │
    │     ▼
    │    Check Voltage
    │     │
    │  ┌──┴───┐
    │ LOW   OK
    │  │     │
    │  │     ▼
    │  │  Check Temperature
    │  │     │
    │  │  ┌──┴────┐
    │  │ BAD    OK
    │  │  │      │
    │  │  │      ▼
    │  │  │  Check Other
    │  │  │  Conditions
    │  │  │      │
    ▼  ▼  ▼      ▼
[Fix and retry]  [Retry routine]
```

### Debugging Routine Execution Failure

```
    Routine Fails (NRC 0x72)
              │
              ▼
    ┌──────────────────────┐
    │ Read DTCs            │
    │ (Service 0x19)       │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Any fault codes      │
    │ stored?              │
    └──────────┬───────────┘
               │
        ┌──────┴──────┐
       YES           NO
        │              │
        ▼              ▼
    ┌─────────┐   ┌──────────────┐
    │Diagnose │   │Check wiring  │
    │fault    │   │and sensors   │
    │code     │   └──────────────┘
    └─────────┘
        │
        ▼
    ┌─────────────────┐
    │ Fix issue       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Clear DTCs      │
    │ (Service 0x14)  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Retry routine   │
    └────────┬────────┘
             │
        ┌────┴────┐
      PASS      FAIL
        │          │
        ▼          ▼
    [Done]  [Further diagnosis]
```

---

## Best Practices Checklist

### Before Starting a Routine

```
┌────────────────────────────────────────────────────────────────┐
│              PRE-ROUTINE EXECUTION CHECKLIST                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Session Management:                                           │
│    ☐ Correct diagnostic session active                        │
│    ☐ Tester Present mechanism running (for long routines)     │
│    ☐ Session timeout configured appropriately                 │
│                                                                │
│  Security:                                                     │
│    ☐ Security access unlocked (if required)                   │
│    ☐ Security level matches routine requirement               │
│    ☐ Security timeout not expired                             │
│                                                                │
│  Vehicle State:                                                │
│    ☐ Vehicle meets prerequisite conditions                    │
│    ☐ Battery voltage within range (11-15V typical)            │
│    ☐ Engine state correct (on/off as required)                │
│    ☐ Vehicle speed = 0 (if required)                          │
│    ☐ Transmission in Park/Neutral (if required)               │
│                                                                │
│  Routine Parameters:                                           │
│    ☐ RID value is supported                                   │
│    ☐ Option record formatted correctly                        │
│    ☐ Message length is correct                                │
│    ☐ Subfunction value valid (0x01, 0x02, or 0x03)            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### During Routine Execution

```
┌────────────────────────────────────────────────────────────────┐
│            ROUTINE EXECUTION BEST PRACTICES                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Monitoring:                                                   │
│    ☐ Send Tester Present (0x3E) periodically                  │
│    ☐ Poll for results at reasonable intervals                 │
│    ☐ Monitor for unexpected NRCs                              │
│    ☐ Watch for DTCs generated during test                     │
│                                                                │
│  Error Handling:                                               │
│    ☐ Implement timeout detection                              │
│    ☐ Handle NRC 0x72 gracefully                               │
│    ☐ Provide user feedback on progress                        │
│    ☐ Allow user cancellation (Stop routine)                   │
│                                                                │
│  Safety:                                                       │
│    ☐ Don't start conflicting routines                         │
│    ☐ Monitor vehicle safety conditions                        │
│    ☐ Implement emergency stop mechanism                       │
│    ☐ Log all routine activities                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### After Routine Completion

```
┌────────────────────────────────────────────────────────────────┐
│            POST-ROUTINE BEST PRACTICES                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Results Handling:                                             │
│    ☐ Request final results (0x03)                             │
│    ☐ Parse and validate status record                         │
│    ☐ Check for pass/fail indication                           │
│    ☐ Save results for documentation                           │
│                                                                │
│  Cleanup:                                                      │
│    ☐ Read any generated DTCs (0x19)                           │
│    ☐ Clear test DTCs if needed (0x14)                         │
│    ☐ Return to default session if appropriate (0x10 01)       │
│    ☐ Release security access                                  │
│                                                                │
│  Documentation:                                                │
│    ☐ Log test timestamp                                       │
│    ☐ Record test parameters used                              │
│    ☐ Save pass/fail status                                    │
│    ☐ Document any anomalies                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Common Pitfalls to Avoid

```
┌────────────────────────────────────────────────────────────────┐
│                  COMMON MISTAKES TO AVOID                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ❌ DON'T: Start routine without checking prerequisites        │
│  ✅ DO: Validate vehicle state first                           │
│                                                                │
│  ❌ DON'T: Forget Tester Present for long routines             │
│  ✅ DO: Send 0x3E every 2-3 seconds                            │
│                                                                │
│  ❌ DON'T: Ignore NRCs (assume everything is OK)               │
│  ✅ DO: Handle each NRC appropriately                          │
│                                                                │
│  ❌ DON'T: Start multiple routines simultaneously              │
│  ✅ DO: Wait for completion before starting next               │
│                                                                │
│  ❌ DON'T: Request results before starting routine             │
│  ✅ DO: Follow proper sequence (Start → Results)               │
│                                                                │
│  ❌ DON'T: Use unsupported RID values                          │
│  ✅ DO: Verify RID support with documentation                  │
│                                                                │
│  ❌ DON'T: Ignore security requirements                        │
│  ✅ DO: Unlock ECU before protected routines                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌────────────────────────────────────────────────────────────────┐
│         SID 0x31 PRACTICAL IMPLEMENTATION SUMMARY              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Key Implementation Points:                                    │
│                                                                │
│  1. Always validate message structure first                    │
│  2. Check session and security requirements                    │
│  3. Verify prerequisites before execution                      │
│  4. Handle state machine transitions correctly                 │
│  5. Implement proper timeout handling                          │
│  6. Return appropriate NRCs for all error conditions           │
│  7. Support graceful routine cancellation                      │
│  8. Provide detailed status in results                         │
│  9. Log all routine activities for debugging                   │
│  10. Test thoroughly with real vehicle conditions              │
│                                                                │
│  Remember:                                                     │
│  • Routines are powerful but potentially dangerous             │
│  • Always prioritize safety                                    │
│  • Provide clear feedback to users                             │
│  • Follow ISO 14229-1 specifications exactly                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**End of SID 0x31 Practical Implementation Guide**
