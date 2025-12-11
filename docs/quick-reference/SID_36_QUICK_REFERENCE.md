# SID 0x36 Transfer Data - Quick Reference

**Service**: Transfer Data (0x36)  
**ISO**: ISO 14229-1:2020 Section 10.5

---

## 🎯 Purpose

Core data transfer mechanism for ECU reprogramming (flash download/upload operations).

---

## 📋 Message Format

### Request
```
┌────────┬────────┬─────────────────────┐
│ SID    │  BSC   │  Transfer Data      │
│ (0x36) │ (1 B)  │  (1 to N bytes)     │
└────────┴────────┴─────────────────────┘
```

**Example**: `36 01 AA BB CC DD`
- `36` = Service ID
- `01` = Block Sequence Counter (BSC)
- `AA BB CC DD` = Data payload (4 bytes)

### Response (Success)
```
┌────────┬────────┐
│  SID   │  BSC   │
│ (0x76) │  Echo  │
└────────┴────────┘
```

**Example**: `76 01`
- `76` = Response SID (0x36 + 0x40)
- `01` = BSC echo

### Response (Error)
```
┌────────┬────────┬────────┐
│  NR    │  SID   │  NRC   │
│ (0x7F) │ (0x36) │  Code  │
└────────┴────────┴────────┘
```

**Example**: `7F 36 73`
- `7F` = Negative Response
- `36` = Requested SID
- `73` = NRC (Wrong BSC)

---

## ⚙️ Prerequisites

### Required Sequence

```
1. Enter PROGRAMMING Session    → SID 0x10 (0x02)
2. Unlock Security               → SID 0x27 (seed + key)
3. Request Download/Upload       → SID 0x34 or 0x35
4. Transfer Data (multiple)      → SID 0x36 ✓
5. Complete Transfer             → SID 0x37
```

### State Requirements

| Requirement | Status | NRC if Failed |
|-------------|--------|---------------|
| Session = PROGRAMMING or EXTENDED | ✅ | 0x7F |
| Security = UNLOCKED | ✅ | 0x33 |
| Download/Upload in progress | ✅ | 0x24 |
| Ignition = ON | ✅ | 0x22 |

---

## 🔢 Block Sequence Counter (BSC)

### BSC Rules

1. **Starts at**: `0x01` (after Request Download/Upload)
2. **Increments**: Sequentially (`0x01` → `0x02` → `0x03` → ...)
3. **Wraps**: `0xFF` → `0x01` (**NEVER** `0x00`)
4. **Validation**: Must match expected value exactly

### BSC Flow

```
Block 1:  BSC = 0x01  →  Response: 76 01  →  Next expected: 0x02
Block 2:  BSC = 0x02  →  Response: 76 02  →  Next expected: 0x03
...
Block 255: BSC = 0xFF  →  Response: 76 FF  →  Next expected: 0x01
Block 256: BSC = 0x01  →  Response: 76 01  →  Next expected: 0x02 (wrap)
```

### ⚠️ Common BSC Errors

| Error | BSC Sent | Expected | Result |
|-------|----------|----------|--------|
| **Skip** | `0x03` | `0x02` | NRC 0x73 |
| **Repeat** | `0x02` | `0x03` | NRC 0x73 |
| **Invalid** | `0x00` | `0x01` | NRC 0x73 |

---

## 🚨 Negative Response Codes (NRCs)

| NRC | Name | Cause | Solution |
|-----|------|-------|----------|
| **0x13** | Incorrect Message Length | Invalid message structure | Check BSC + data present |
| **0x24** | Request Sequence Error | No active download/upload | Call SID 0x34/0x35 first |
| **0x33** | Security Access Denied | Security locked | Unlock with SID 0x27 |
| **0x73** | Wrong Block Sequence Counter | BSC mismatch | Send correct BSC |
| **0x7F** | Service Not Supported | Wrong session | Enter PROGRAMMING/EXTENDED |
| **0x92** | Voltage Too High | V > max threshold | Check power supply |
| **0x93** | Voltage Too Low | V < min threshold | Increase voltage |

---

## ⚡ Voltage Monitoring

### 12V Systems
- **Minimum**: 11.0V
- **Maximum**: 15.5V
- **Typical**: 12.0V - 14.5V

### 24V Systems
- **Minimum**: 22.0V
- **Maximum**: 28.0V
- **Typical**: 24.0V - 27.0V

### NRCs
- **Too Low**: `7F 36 93`
- **Too High**: `7F 36 92`

---

## 💻 Code Examples

### Example 1: Basic Transfer

```typescript
// Prerequisites done (session, security, request download)

// Transfer Block 1
const response = await processRequest({
  sid: 0x36,
  data: [0x01, 0xAA, 0xBB, 0xCC, 0xDD]
});

// Expected: { data: [0x76, 0x01], isNegative: false }
```

### Example 2: Multiple Blocks

```typescript
// Block 1
await processRequest({ sid: 0x36, data: [0x01, ...data1] });
// → 76 01

// Block 2
await processRequest({ sid: 0x36, data: [0x02, ...data2] });
// → 76 02

// Block 3
await processRequest({ sid: 0x36, data: [0x03, ...data3] });
// → 76 03
```

### Example 3: BSC Wrap-Around

```typescript
// Block 255
await processRequest({ sid: 0x36, data: [0xFF, ...data255] });
// → 76 FF

// Block 256 (wraps to 0x01)
await processRequest({ sid: 0x36, data: [0x01, ...data256] });
// → 76 01
```

### Example 4: Error Handling

```typescript
// Try to skip BSC (send 0x03 when expecting 0x02)
const response = await processRequest({
  sid: 0x36,
  data: [0x03, 0xAA, 0xBB]
});

// Result: { data: [0x7F, 0x36, 0x73], isNegative: true, nrc: 0x73 }
```

---

## 🔍 Troubleshooting

### Problem: NRC 0x24 (Request Sequence Error)

**Cause**: No active download/upload  
**Solution**: 
```typescript
// Call Request Download first
await processRequest({
  sid: 0x34,
  data: [0x00, 0x44, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00]
});

// Then transfer data
await processRequest({ sid: 0x36, data: [0x01, ...data] });
```

### Problem: NRC 0x73 (Wrong BSC)

**Cause**: BSC doesn't match expected value  
**Solution**: Send correct BSC
```typescript
// Check expected BSC in simulator state
console.log(simulator.getState().transferBlockCounter);
// → 0x02

// Send block with BSC = 0x02
await processRequest({ sid: 0x36, data: [0x02, ...data] });
```

### Problem: NRC 0x7F (Wrong Session)

**Cause**: Not in PROGRAMMING or EXTENDED session  
**Solution**:
```typescript
// Enter PROGRAMMING session
await processRequest({ sid: 0x10, data: [0x02] });
// → 50 02

// Then transfer data
await processRequest({ sid: 0x36, data: [0x01, ...data] });
```

### Problem: NRC 0x33 (Security Locked)

**Cause**: Security not unlocked  
**Solution**:
```typescript
// Unlock security
await processRequest({ sid: 0x27, data: [0x01] });
// → 67 01 [seed]

await processRequest({ sid: 0x27, data: [0x02, key] });
// → 67 02

// Then transfer data
await processRequest({ sid: 0x36, data: [0x01, ...data] });
```

---

## 📐 Block Size Limits

### Maximum Block Length

Negotiated in Request Download (SID 0x34) response:

```
Request Download Response:
74 [lengthFormatIdentifier] [maxNumberOfBlockLength]
```

**Default**: 4096 bytes (if not specified)

### Block Size Rules

- **Full Blocks**: Must not exceed `maxNumberOfBlockLength`
- **Last Block**: Can be partial (< maxNumberOfBlockLength) ✅
- **Minimum**: 1 byte (BSC + at least 1 data byte)

---

## ✅ Complete Workflow

```typescript
// 1. Setup
await processRequest({ sid: 0x10, data: [0x02] });        // PROGRAMMING
await processRequest({ sid: 0x27, data: [0x01] });        // Get seed
await processRequest({ sid: 0x27, data: [0x02, key] });   // Send key

// 2. Request Download
await processRequest({
  sid: 0x34,
  data: [0x00, 0x44, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00]
});

// 3. Transfer blocks
await processRequest({ sid: 0x36, data: [0x01, ...block1] });  // BSC=1
await processRequest({ sid: 0x36, data: [0x02, ...block2] });  // BSC=2
await processRequest({ sid: 0x36, data: [0x03, ...block3] });  // BSC=3
await processRequest({ sid: 0x36, data: [0x04, ...block4] });  // BSC=4

// 4. Complete
await processRequest({ sid: 0x37 });  // Request Transfer Exit

// ✅ Download complete!
```

---

## 🧪 Testing

### Test Cases Available

**File**: `tests/SID_36_Test_Cases.json`  
**Total**: 20 test cases  
**Coverage**: 100% NRC coverage

### Key Test Categories

1. Basic Transfer (single/multiple blocks)
2. BSC Validation (wrap-around, errors)
3. Session Validation
4. Security Validation
5. Voltage Monitoring
6. Complete Workflows

---

## 📚 Documentation

### Complete Guides

- **Visual Guide**: `docs/learning/SID_36_TRANSFER_DATA.md`
- **Implementation**: `docs/implementation/SID_36_IMPLEMENTATION_WALKTHROUGH.md`
- **Summary**: `docs/implementation/SID_36_SUMMARY.md`
- **Test Suite**: `tests/SID_36_Test_Cases.json`

### Code Location

**File**: `src/services/UDSSimulator.ts`  
**Function**: `handleTransferData()`  
**Lines**: 2365-2509

---

## 🎯 Key Takeaways

✅ **BSC wraps**: `0xFF` → `0x01` (NEVER `0x00`)  
✅ **Sessions**: PROGRAMMING or EXTENDED only  
✅ **Security**: Must be unlocked  
✅ **Sequence**: SID 0x34/0x35 required first  
✅ **Voltage**: Monitor during flash programming  
✅ **Last block**: Can be partial size  

⚠️ **Common Mistakes**:
- Forgetting to call Request Download first
- Skipping BSC values
- Wrong session (DEFAULT/SAFETY)
- Security not unlocked

---

**Created**: December 11, 2025  
**Status**: ✅ Production Ready
