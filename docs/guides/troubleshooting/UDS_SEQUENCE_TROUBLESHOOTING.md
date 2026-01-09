# UDS Sequence Execution Troubleshooting Guide

## Common NRC (Negative Response Code) Issues and Solutions

### NRC 0x12: Sub-Function Not Supported

**Symptom**: Sequence fails at first step with "Negative Response (NRC: 0x12 - Sub-Function Not Supported)"

**Common Causes**:

#### 1. Invalid Sub-Function Value
**Problem**: The sub-function value doesn't exist for the requested service.

**Solution**: Use valid sub-functions for each service:

**Service 0x10 (Diagnostic Session Control)**:
- `0x01` - Default Diagnostic Session
- `0x02` - Programming Session
- `0x03` - Extended Diagnostic Session

**Service 0x27 (Security Access)**:
- `0x01` - Request Seed (Level 1)
- `0x02` - Send Key (Level 1)
- `0x03` - Request Seed (Level 2)
- `0x04` - Send Key (Level 2)

**Service 0x19 (Read DTC Information)**:
- `0x01` - Report Number of DTCs by Status Mask
- `0x02` - Report DTC by Status Mask
- `0x04` - Report DTC Snapshot Data
- `0x06` - Report DTC Extended Data Record

**Service 0x11 (ECU Reset)**:
- `0x01` - Hard Reset
- `0x02` - Key Off/On Reset
- `0x03` - Soft Reset

**Service 0x14 (Clear DTC)**:
- No sub-function required (set to `undefined` or omit)

#### 2. Sub-Function Field Missing
**Problem**: Sub-function is `undefined` when required.

**Solution**: Always provide sub-function for services that require it (0x10, 0x11, 0x19, 0x27, etc.)

```typescript
// ❌ Wrong - missing subFunction
request: {
  sid: 0x10,
  data: [],
}

// ✅ Correct
request: {
  sid: 0x10,
  subFunction: 0x01, // Default session
  data: [],
}
```

#### 3. Empty String vs Undefined
**Problem**: Sub-function field is empty string `""` instead of numeric value.

**Solution**: In the UI, either enter a value or leave the field truly empty (not whitespace).

---

### NRC 0x11: Service Not Supported

**Symptom**: "Negative Response (NRC: 0x11 - Service Not Supported)"

**Cause**: The Service ID (SID) is not in the ECU's supported services list.

**Supported Services in this Simulator**:
- `0x10` - Diagnostic Session Control
- `0x11` - ECU Reset
- `0x14` - Clear Diagnostic Information
- `0x19` - Read DTC Information
- `0x22` - Read Data By Identifier
- `0x23` - Read Memory By Address
- `0x27` - Security Access
- `0x28` - Communication Control
- `0x2E` - Write Data By Identifier
- `0x31` - Routine Control
- `0x34` - Request Download
- `0x35` - Request Upload
- `0x36` - Transfer Data
- `0x37` - Request Transfer Exit
- `0x3D` - Write Memory By Address
- `0x3E` - Tester Present
- `0x85` - Control DTC Setting

**Solution**: Only use services from the supported list above.

---

### NRC 0x13: Incorrect Message Length

**Symptom**: "Negative Response (NRC: 0x13 - Incorrect Message Length)"

**Causes**:
1. Data array is too short or too long for the service
2. Required data parameters are missing

**Examples**:

**Read Data By Identifier (0x22)**:
```typescript
// ❌ Wrong - missing data identifier
request: {
  sid: 0x22,
  data: [],
}

// ✅ Correct - 2-byte data identifier
request: {
  sid: 0x22,
  data: [0xF1, 0x90], // VIN identifier
}
```

**Write Data By Identifier (0x2E)**:
```typescript
// ❌ Wrong - missing value to write
request: {
  sid: 0x2E,
  data: [0xF1, 0x90],
}

// ✅ Correct - identifier + data to write
request: {
  sid: 0x2E,
  data: [0xF1, 0x90, 0x41, 0x42, 0x43], // Write "ABC"
}
```

---

### NRC 0x33: Security Access Denied

**Symptom**: "Negative Response (NRC: 0x33 - Security Access Denied)"

**Cause**: Attempting to use a protected service without proper security access.

**Protected Services** (require security unlock):
- `0x27` - Security Access (after level 1, requires unlock for level 2)
- `0x28` - Communication Control
- `0x31` - Routine Control
- `0x34` - Request Download
- `0x35` - Request Upload
- `0x3D` - Write Memory By Address

**Solution**: Perform security access sequence BEFORE protected services:

```typescript
// Correct sequence:
1. Enter Extended Session (0x10 with subFunction 0x03)
2. Request Security Seed (0x27 with subFunction 0x01)
3. Send Security Key (0x27 with subFunction 0x02)
4. Now protected services will work
```

**Example Template**: Use "Security Access Sequence" template as reference.

---

### NRC 0x7F: Service Not Supported in Active Session

**Symptom**: "Negative Response (NRC: 0x7F - Service Not Supported in Active Session)"

**Cause**: The service requires a specific diagnostic session but you're in the wrong session.

**Session Requirements**:

| Service | Required Session |
|---------|------------------|
| Most diagnostic reads | Default (0x01) or Extended (0x03) |
| Security Access | Extended (0x03) |
| Programming services | Programming (0x02) |
| Routine Control | Extended (0x03) or Programming (0x02) |
| Memory operations | Programming (0x02) |

**Solution**: Enter the correct session before using the service.

```typescript
// Example: Memory operations need programming session
steps: [
  {
    // Step 1: Enter programming session
    request: { sid: 0x10, subFunction: 0x02, data: [] },
  },
  {
    // Step 2: Now can read memory
    request: { sid: 0x23, data: [0x44, 0x00, 0x10, 0x00, 0x00, 0x10] },
    condition: { type: 'if_positive' }, // Only if session change succeeded
  },
]
```

---

## Best Practices for Sequence Design

### 1. Session Management

**Always start sequences with session control**:

```typescript
// ✅ Good practice
Step 1: Enter Default Session (0x10, subFunction 0x01)
Step 2: Your diagnostic operations...

// or for advanced operations:
Step 1: Enter Extended Session (0x10, subFunction 0x03)
Step 2: Security Access if needed...
Step 3: Protected operations...
```

**Why?** Ensures known starting state regardless of previous operations.

### 2. Conditional Execution

**Use conditions to prevent cascading failures**:

```typescript
{
  id: 'step_2',
  condition: { type: 'if_positive' }, // ✅ Only run if previous step succeeded
  continueOnError: false,
}
```

**Condition Types**:
- `always` - Always execute (use for first step and recovery steps)
- `if_positive` - Execute only if previous step succeeded
- `if_negative` - Execute only if previous step failed (error handling)
- `if_value` - Execute if specific value matched (advanced)

### 3. Error Handling

**Configure per-step error tolerance**:

```typescript
{
  // Critical step - must succeed
  label: 'Enter Security Access',
  continueOnError: false, // ✅ Stop on failure
}

{
  // Optional step - can fail
  label: 'Read Optional Parameter',
  continueOnError: true, // ✅ Continue even if fails
}
```

### 4. Delays

**Add appropriate delays between steps**:

```typescript
{
  label: 'ECU Reset',
  delay: 2000, // ✅ Long delay for reset to complete
}

{
  label: 'Read VIN',
  delay: 100, // ✅ Normal delay for standard request
}
```

**Guidelines**:
- Normal diagnostic operations: 50-200ms
- Session changes: 100-200ms
- ECU reset: 1000-3000ms
- Programming operations: 500-1000ms

### 5. Data Formatting

**Use correct data format**:

```typescript
// ✅ Correct - hex values as numbers
data: [0xF1, 0x90]

// ✅ Also correct - decimal values
data: [241, 144]

// ❌ Wrong - strings
data: ["F1", "90"]

// ❌ Wrong - hex strings
data: ["0xF1", "0x90"]
```

---

## Debugging Failed Sequences

### Step-by-Step Debugging Process

1. **Identify the Failing Step**
   - Check execution log for red X icon
   - Note the step number and NRC code

2. **Understand the NRC**
   - Use the NRC reference above
   - Common codes: 0x11, 0x12, 0x13, 0x33, 0x7F

3. **Check Prerequisites**
   - Is the correct session active?
   - Is security access unlocked (if needed)?
   - Are all required data bytes present?

4. **Verify Step Configuration**
   - Service ID is correct
   - Sub-function is correct (if required)
   - Data array has right length and values

5. **Test in Isolation**
   - Create a new sequence with ONLY the failing step
   - Add session control before it if needed
   - Execute to see if it passes alone

6. **Use Breakpoints**
   - Set breakpoint on step before failing step
   - Examine ECU state at that point
   - Verify session and security status

---

## Updated Template Reference

### Template: Basic Diagnostic Workflow (UPDATED)

**Now uses DEFAULT session (0x01) - Guaranteed to work**:

```typescript
Step 1: Enter Default Diagnostic Session (0x10, subFunction 0x01)
Step 2: Read VIN (0x22, data [0xF1, 0x90])
```

**Why Changed?**
- DEFAULT session is always available
- Safer starting point for beginners
- No prerequisites required

### Template: Security Access Sequence (UPDATED)

**Now includes session activation**:

```typescript
Step 1: Enter Extended Diagnostic Session (0x10, subFunction 0x03)
Step 2: Request Security Seed (0x27, subFunction 0x01)
Step 3: Send Security Key (0x27, subFunction 0x02, data [0x12, 0x34, 0x56, 0x78])
```

**Why Changed?**
- Security access requires extended session
- Prevents NRC 0x7F (service not supported in active session)
- Shows complete workflow

### Template: Complete Diagnostic Workflow

**Proper session progression**:

```typescript
Step 1: Reset to Default Session (0x10, subFunction 0x01)
Step 2: Enter Extended Session (0x10, subFunction 0x03)
Step 3: Read VIN
Step 4: Get DTC Count
Step 5: Read All DTCs
Step 6: Tester Present (keep session alive)
```

**Best Practices Demonstrated**:
- ✅ Start with known state (default session)
- ✅ Transition to required session
- ✅ Perform diagnostic operations
- ✅ Maintain session with tester present

---

## Quick Fix Checklist

When you get an NRC error:

- [ ] Is my Service ID in the supported services list?
- [ ] Does this service require a sub-function? Is it correct?
- [ ] Am I in the right diagnostic session?
- [ ] Do I have security access unlocked (if needed)?
- [ ] Is my data array the right length?
- [ ] Are my hex values formatted correctly (0x##)?
- [ ] Did I add the `continueOnError` and `condition` settings?
- [ ] Is there enough delay between steps?

---

## Testing Strategy

### 1. Start Simple

```typescript
// First, test basic session control
Sequence 1: Just enter default session
  Step 1: sid 0x10, subFunction 0x01

// Then, add one operation
Sequence 2: Session + Read
  Step 1: sid 0x10, subFunction 0x01
  Step 2: sid 0x22, data [0xF1, 0x90]

// Finally, build complex sequences
Sequence 3: Full workflow
  [Multiple steps as tested individually]
```

### 2. Use Templates as Foundation

- Load a working template
- Modify ONE step at a time
- Test after each modification
- Understand why each step is there

### 3. Verify Each Service Independently

Before building sequences, test each service individually:
- Create 1-step sequence
- Execute
- Verify positive response
- Then combine into larger sequences

---

## Simulator-Specific Notes

### Current Simulator State

**Initial State**:
- Session: DEFAULT (0x01)
- Security: Locked
- Communication: Enabled

**Session Transitions**:
- From DEFAULT → EXTENDED: ✅ Allowed
- From DEFAULT → PROGRAMMING: ✅ Allowed
- From any session → DEFAULT: ✅ Allowed
- Direct EXTENDED → PROGRAMMING: ✅ Allowed

**Security Requirements**:
- Level 1 seed/key: Available in EXTENDED session
- Protected services require security unlock
- Security resets when leaving EXTENDED session

---

## Examples of Working Sequences

### Example 1: Simple VIN Read

```typescript
{
  name: "Read VIN - Simple",
  steps: [
    {
      order: 0,
      label: "Enter Default Session",
      request: { sid: 0x10, subFunction: 0x01, data: [] },
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
    },
    {
      order: 1,
      label: "Read VIN",
      request: { sid: 0x22, data: [0xF1, 0x90] },
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
  ]
}
```

### Example 2: DTC Workflow

```typescript
{
  name: "DTC Management",
  steps: [
    {
      order: 0,
      label: "Enter Extended Session",
      request: { sid: 0x10, subFunction: 0x03, data: [] },
      delay: 100,
    },
    {
      order: 1,
      label: "Read DTCs",
      request: { sid: 0x19, subFunction: 0x02, data: [0xFF] },
      delay: 150,
      condition: { type: 'if_positive' },
    },
    {
      order: 2,
      label: "Clear DTCs",
      request: { sid: 0x14, data: [0xFF, 0xFF, 0xFF] },
      delay: 150,
      condition: { type: 'if_positive' },
    },
    {
      order: 3,
      label: "Verify Cleared",
      request: { sid: 0x19, subFunction: 0x01, data: [0xFF] },
      delay: 150,
      condition: { type: 'if_positive' },
    },
  ]
}
```

---

## Summary

**Key Takeaways**:

1. ✅ **Always start with session control** (usually 0x10 with subFunction 0x01)
2. ✅ **Use correct sub-functions** (reference table above)
3. ✅ **Check session requirements** before using services
4. ✅ **Unlock security** before protected operations
5. ✅ **Use conditional execution** to prevent cascading failures
6. ✅ **Add appropriate delays** between steps
7. ✅ **Test incrementally** - start simple, build complexity
8. ✅ **Use templates** as learning examples

**When in doubt**:
- Use "Basic Diagnostic Workflow" template (now uses DEFAULT session)
- Test each service individually first
- Check this troubleshooting guide for your specific NRC
- Verify simulator state before and after each step

---

**Document Version**: 1.0  
**Last Updated**: 2024-10-06  
**Related**: SEQUENCE_BUILDER_TESTING_GUIDE.md, SEQUENCE_EXECUTION_FIX.md
