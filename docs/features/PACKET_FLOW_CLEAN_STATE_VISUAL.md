# Packet Flow - Clean State Visualization

## Complete Animation Flow with Data States

### Timeline: Diagnostic Session Control (0x10 0x01)

```
═══════════════════════════════════════════════════════════════════════
                          STAGE 1: REQUEST SENT
                           T = 0ms - 2500ms
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   CLIENT                                                 ECU          │
│   ┌────────┐                                        ┌────────┐       │
│   │   💻   │  [10 01] ➔ ➔ ➔ ➔ ➔ ➔ ➔ ➔ ➔ ➔        │   🖥   │       │
│   │ Client │                                        │  ECU   │       │
│   │        │  (Request traveling...)                │        │       │
│   └────────┘                                        └────────┘       │
│                                                                       │
│   Data State:                                                         │
│   • Client: [CLEAN] ✅ - Sent request, waiting                      │
│   • ECU:    [CLEAN] ✅ - Not yet received                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                    STAGE 2: ECU PROCESSING REQUEST
                           T = 2500ms - 5000ms
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   CLIENT                                                 ECU          │
│   ┌────────┐                                        ┌────────┐       │
│   │   💻   │  ← ← ← ← [50 01 00 32 01 F4] ← ←     │   🖥   │       │
│   │ Client │                                        │  ECU   │       │
│   │        │  (Response traveling...)               │ ┌────┐ │       │
│   └────────┘                                        │ │1001│ │       │
│                                                      │ └────┘ │       │
│                                                      └────────┘       │
│                                                                       │
│   Data State:                                                         │
│   • Client: [CLEAN] ✅ - Waiting for response                       │
│   • ECU:    [10 01] ⚙️  - Processing request                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                    STAGE 3: RESPONSE RECEIVED, COMPLETE
                              T = 5000ms+
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   CLIENT                                                 ECU          │
│   ┌────────┐                                        ┌────────┐       │
│   │   💻   │                                        │   🖥   │       │
│   │ Client │                                        │  ECU   │       │
│   │ ┌────┐ │                                        │        │       │
│   │ │5001│ │                                        │        │       │
│   │ │0032│ │                                        └────────┘       │
│   │ │01F4│ │                                                         │
│   │ └────┘ │                                                         │
│   └────────┘                                                         │
│                                                                       │
│   Data State:                                                         │
│   • Client: [50 01 00 32 01 F4] ✅ - Response received!             │
│   • ECU:    [CLEAN] ✅ - Request processed, ready for next          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data State Machine

```
┌──────────────┐
│  NEW REQUEST │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────┐
│ STAGE 1: SENDING                   │
│ ─────────────────────────────────  │
│ Client: null (clean)               │
│ ECU:    null (clean)               │
│                                    │
│ Duration: 2500ms                   │
└──────┬─────────────────────────────┘
       │ Request arrives at ECU
       ▼
┌────────────────────────────────────┐
│ STAGE 2: PROCESSING                │
│ ─────────────────────────────────  │
│ Client: null (waiting)             │
│ ECU:    requestBytes (processing)  │
│                                    │
│ Duration: 2500ms                   │
└──────┬─────────────────────────────┘
       │ Response arrives at Client
       ▼
┌────────────────────────────────────┐
│ STAGE 3: COMPLETE                  │
│ ─────────────────────────────────  │
│ Client: responseBytes (received)   │
│ ECU:    null (ready)               │
│                                    │
│ Duration: Until next request       │
└────────────────────────────────────┘
```

## Color Coding Reference

### Request Data at ECU
- **Background:** Cyan/Blue tint (`bg-cyan-500/20`)
- **Border:** Cyan (`border-cyan-400/30`)
- **Text:** Cyan (`text-cyan-300`)
- **Meaning:** ECU is currently processing this request
- **Visibility:** Only during Stage 2 (2.5 seconds)

### Response Data at Client
- **Background:** Purple/Pink tint (`bg-purple-500/20`)
- **Border:** Purple (`border-purple-400/30`)
- **Text:** Purple (`text-purple-300`)
- **Meaning:** Client has received this response
- **Visibility:** Stage 3 onwards (persists for review)

## Comparison: Before vs After

### Before Fix ❌

```
Stage 1: Client → [10 01] → ECU
         Both: [CLEAN]

Stage 2: Client ← [Response] ← ECU
         Client: [CLEAN]
         ECU:    [10 01] ← Visible

Stage 3: Complete
         Client: [50 01 00 32 01 F4] ← Visible
         ECU:    [10 01] ← Still visible! ❌

Problem: Both nodes show data, unclear state
```

### After Fix ✅

```
Stage 1: Client → [10 01] → ECU
         Client: [CLEAN] ✅
         ECU:    [CLEAN] ✅

Stage 2: Client ← [Response] ← ECU
         Client: [CLEAN] ✅
         ECU:    [10 01] ✅ Processing indicator

Stage 3: Complete
         Client: [50 01 00 32 01 F4] ✅ Result
         ECU:    [CLEAN] ✅ Ready for next

Benefit: Clear state at each stage
```

## Real-World Analogy

Think of this like a restaurant order:

### Stage 1: Placing Order
- **Customer (Client):** Gives order → Clean hands, waiting
- **Kitchen (ECU):** Clean, ready to receive

### Stage 2: Cooking
- **Customer (Client):** Empty-handed, waiting
- **Kitchen (ECU):** Has order ticket, cooking (shows `[10 01]`)

### Stage 3: Order Ready
- **Customer (Client):** Holding food (shows `[50 01 00 32 01 F4]`)
- **Kitchen (ECU):** Clean, ready for next order

## Key Benefits

| Feature | Before | After |
|---------|--------|-------|
| Client after send | Shows nothing ✅ | Shows nothing ✅ |
| ECU while processing | Shows request ❌ (persisted) | Shows request ✅ (temporarily) |
| ECU after response | Shows request ❌ | Clean ✅ |
| Client after receive | Shows response ✅ | Shows response ✅ |
| Clear completion | ❌ Both show data | ✅ Only Client shows result |
| Ready state | ❌ Unclear | ✅ ECU visually ready |

## Technical Implementation

```typescript
// Stage 1: Request starts
setCompletedPacket(null);  // Both clean

// Stage 2: Request arrives at ECU (T=2500ms)
setCompletedPacket({
  requestBytes: ['10', '01'],  // ECU shows
  responseBytes: null,         // Client clean
  timestamp: Date.now()
});

// Stage 3: Response arrives at Client (T=5000ms)
setCompletedPacket({
  requestBytes: null,                              // ECU clears
  responseBytes: ['50', '01', '00', '32', '01', 'F4'],  // Client shows
  timestamp: Date.now()
});
```

## User Guidance

When using the simulator, you'll see:

1. **Clean slate** → Both nodes empty when you click send
2. **ECU working** → ECU shows request bytes while processing
3. **Response received** → Only Client shows the final response
4. **Ready for next** → ECU is visually clear and ready

This makes it easy to understand:
- ✅ When ECU is busy (shows request data)
- ✅ When ECU is ready (clean, no data)
- ✅ What the final result is (Client response data)
- ✅ When a transaction is complete (ECU clean)
