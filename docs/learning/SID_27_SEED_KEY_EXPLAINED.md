# UDS Security Access (SID 0x27) - Seed & Key Explained

## 🔐 What is Seed-Key Security?

**Seed-Key** is a challenge-response authentication mechanism used in automotive diagnostics to protect sensitive ECU operations from unauthorized access.

Think of it like a password system where:
- **Seed** = A random challenge question from the ECU
- **Key** = Your calculated answer to prove you're authorized

---

## 📋 How It Works (Step-by-Step)

### **1. The Challenge (Request Seed)**

When you want to access protected functions, you ask the ECU for a "challenge":

```
Request:  27 01
          │  └─ Sub-function: Request Seed (odd number = request)
          └─ SID 27 (Security Access)

Response: 67 01 12 34 56 78
          │  │  └──────────┘
          │  │       └─ Seed (4 bytes)
          │  └─ Echo sub-function
          └─ Positive Response SID (0x27 + 0x40 = 0x67)
```

**The ECU says:** *"Here's my challenge: `12 34 56 78`. Calculate the correct key!"*

---

### **2. The Calculation (Generate Key)**

You must calculate the correct **key** from the **seed** using a secret algorithm.

#### **In Production ECUs:**
The algorithm is kept **SECRET** by the manufacturer. Common methods:
- XOR operations
- Bitwise rotations
- Proprietary encryption algorithms
- Mathematical transformations

#### **In This Simulator:**
The key is **pre-calculated** for testing:
- **Seed**: `[0x12, 0x34, 0x56, 0x78]`
- **Key**: `[0xB7, 0x6E, 0xA6, 0x77]`

**Example Algorithm (simplified):**
```javascript
// Simple XOR-based algorithm (NOT production-grade!)
function calculateKey(seed) {
  const SECRET = [0xA5, 0x5A, 0xF0, 0x0F];
  return seed.map((byte, i) => byte ^ SECRET[i]);
}

// Example:
// Seed: [0x12, 0x34, 0x56, 0x78]
// Key:  [0x12^0xA5, 0x34^0x5A, 0x56^0xF0, 0x78^0x0F]
//     = [0xB7, 0x6E, 0xA6, 0x77]
```

---

### **3. The Response (Send Key)**

Once you calculate the key, send it back within **5 seconds**:

```
Request:  27 02 B7 6E A6 77
          │  │  └──────────┘
          │  │       └─ Calculated Key (4 bytes)
          │  └─ Sub-function: Send Key (even number = send)
          └─ SID 27 (Security Access)

Response: 67 02
          │  └─ Echo sub-function
          └─ Positive Response (Security UNLOCKED! ✅)
```

**The ECU says:** *"Correct! You're now authorized."*

---

## 🎯 Complete Workflow Example

### **Scenario:** You want to use SID 0x31 (Routine Control) which requires security

```bash
# Step 0: Check current session (optional)
# You need Extended or Programming session

10 03                    # Enter Extended Session
# Response: 50 03 00 64 01 F4 ✅

# Step 1: Request Seed
27 01                    # Request Seed for Security Level 1
# Response: 67 01 12 34 56 78 ✅
#           Seed: 12 34 56 78

# Step 2: Calculate Key (in real scenario, use algorithm)
# For this simulator: Key = B7 6E A6 77

# Step 3: Send Key (within 5 seconds!)
27 02 B7 6E A6 77       # Send calculated key
# Response: 67 02 ✅ (UNLOCKED!)

# Step 4: Now you can use protected services
31 01 AB CD             # Start Routine (requires security)
# Response: 71 01 AB CD XX XX ✅ (Works because security unlocked)
```

---

## 🔢 Security Levels

UDS supports multiple security levels for different access privileges:

| Level | Request Seed | Send Key | Purpose |
|-------|--------------|----------|---------|
| **1** | `27 01` | `27 02` | Basic protection (read calibration) |
| **2** | `27 03` | `27 04` | Medium protection (write calibration) |
| **3** | `27 05` | `27 06` | High protection (flash programming) |

**Example: Level 2 Access**
```
27 03                    # Request Seed Level 2
# Response: 67 03 12 34 56 78

27 04 B7 6E A6 77       # Send Key Level 2
# Response: 67 04 ✅
```

---

## ⏱️ Important Timing Rules

### **1. Seed Timeout: 5 Seconds**
After receiving the seed, you have **5 seconds** to send the key.

```
27 01                    # Request seed
# Response: 67 01 12 34 56 78

# ... wait 6 seconds ...

27 02 B7 6E A6 77       # Send key (TOO LATE!)
# Response: 7F 27 22 ❌ (NRC 0x22: Conditions Not Correct)
```

**If timeout occurs:**
- Request seed again: `27 01`

---

### **2. Invalid Key Delay: 10 Seconds**
After **3 failed attempts**, you must wait **10 seconds**.

```
27 01                    # Request seed
67 01 12 34 56 78       # Seed received

27 02 AA BB CC DD       # Wrong key! (Attempt 1)
7F 27 35 ❌             # NRC 0x35: Invalid Key

27 01                    # Request seed again
27 02 11 22 33 44       # Wrong key! (Attempt 2)
7F 27 35 ❌

27 01                    # Request seed again
27 02 FF FF FF FF       # Wrong key! (Attempt 3)
7F 27 35 ❌

27 01                    # Try again immediately
7F 27 36 ❌             # NRC 0x36: Exceed Number of Attempts

# ... wait 10 seconds ...

27 01                    # Now it works again
67 01 12 34 56 78 ✅
```

---

## 🛡️ Already Unlocked Behavior

If you request a seed when **already unlocked** at that level, the ECU returns an **all-zero seed**:

```
27 01                    # Request seed (already unlocked)
# Response: 67 01 00 00 00 00 (Zero seed = already unlocked)
```

This tells you: *"No need to unlock, you're already good!"*

---

## 🚨 Common Error Codes (NRCs)

| NRC | Code | Name | Cause | Solution |
|-----|------|------|-------|----------|
| **0x7F** | `7F 27 7F` | Service Not Supported in Active Session | Not in Extended/Programming session | Send `10 03` first |
| **0x12** | `7F 27 12` | Sub-function Not Supported | Invalid level (not 0x01, 0x03, 0x05) | Use correct odd value |
| **0x13** | `7F 27 13` | Incorrect Message Length | Wrong key length | Key must be 4 bytes |
| **0x22** | `7F 27 22` | Conditions Not Correct | No seed requested or seed expired | Request seed first |
| **0x35** | `7F 27 35` | Invalid Key | Wrong key sent | Recalculate or check algorithm |
| **0x36** | `7F 27 36` | Exceed Number of Attempts | 3 failed attempts | Wait 10 seconds |
| **0x37** | `7F 27 37` | Required Time Delay Not Expired | Tried before 10-second delay | Wait longer |

---

## 📝 Testing in Your Simulator

### **Quick Test Sequence:**
```bash
# Copy-paste this entire sequence:

10 03                    # Enter Extended Session
27 01                    # Request Seed
27 02 B7 6E A6 77       # Send Key (correct)
27 01                    # Request Seed again (should return zeros)
```

**Expected Results:**
1. `50 03 00 64 01 F4` - Session entered
2. `67 01 12 34 56 78` - Seed received
3. `67 02` - **UNLOCKED!** ✅
4. `67 01 00 00 00 00` - Already unlocked (zero seed)

---

## 🔑 How to Send Commands in Your UI

### **Method 1: Builder Mode (Recommended)**
1. Select service: **0x27 - Security Access**
2. Enter sub-function: `01` (for request seed)
3. Data: (leave empty)
4. Click **Send Request**
5. Wait for response with seed
6. Change sub-function to: `02`
7. Enter data: `B7 6E A6 77`
8. Click **Send Request**

### **Method 2: Manual Mode**
1. Click **Manual Mode**
2. Type: `27 01`
3. Click Send
4. Type: `27 02 B7 6E A6 77`
5. Click Send

---

## 🎓 Real-World Applications

### **What Requires Security Access?**

| Service | Typical Requirement | Why |
|---------|---------------------|-----|
| **0x27** | None (public) | This IS the security service |
| **0x2E** | Level 1 | Write calibration data |
| **0x31** | Level 1 | Start diagnostic routines |
| **0x34/35** | Level 1 | Flash programming |
| **0x3D** | Level 1 | Write memory |
| **0x14** | Sometimes Level 1 | Clear DTCs (in some ECUs) |

---

## 🔬 Advanced: Seed Generation in Real ECUs

In production ECUs, seeds are often:
- **Random** (changes each time)
- **Time-based** (includes timestamp)
- **Session-based** (linked to current session ID)
- **Counter-based** (increments with each request)

**Example Real Seed:**
```
Request 1: 67 01 A3 7F 92 4E  (Random)
Request 2: 67 01 B1 2C 8D 65  (Different!)
```

This prevents replay attacks where you reuse old keys.

---

## 📚 Summary

```
┌─────────────────────────────────────────────────┐
│  SECURITY ACCESS FLOW - ISO 14229-1:2020       │
└─────────────────────────────────────────────────┘

1. Enter Extended Session
   └─► 10 03

2. Request Seed (Challenge)
   └─► 27 01
       ├─► ECU generates random seed
       └─► Response: 67 01 [SEED]

3. Calculate Key (Your Secret Algorithm)
   └─► Key = YourAlgorithm(Seed)

4. Send Key (Response)
   └─► 27 02 [KEY]
       ├─► ECU validates key
       ├─► If correct: 67 02 ✅
       └─► If wrong: 7F 27 35 ❌

5. Security Unlocked!
   └─► Can now use protected services
```

**Key Points:**
- ⏱️ Send key within **5 seconds**
- 🔄 Max **3 attempts**, then **10-second** delay
- 🔐 Key algorithm is **manufacturer secret**
- ✅ This simulator uses **fixed seed** for testing

Now you understand the complete seed-key authentication process! 🎉
