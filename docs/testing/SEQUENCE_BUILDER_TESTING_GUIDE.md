# Sequence Builder Testing Guide

## Overview
This guide provides comprehensive testing procedures for the newly implemented Sequence Builder feature (P2-03).

## Feature Components

### 1. SequenceBuilder Component
- **Location**: `src/components/SequenceBuilder.tsx`
- **Purpose**: Visual workflow builder for creating and managing diagnostic sequences
- **Key Features**:
  - Create, edit, and delete sequences
  - Step editor with comprehensive configuration
  - Validation with error/warning reporting
  - Template library integration
  - LocalStorage persistence

### 2. SequenceExecutionPanel Component
- **Location**: `src/components/SequenceExecutionPanel.tsx`
- **Purpose**: Real-time execution monitoring and control
- **Key Features**:
  - Play/Pause/Stop controls
  - Speed adjustment (0.5x to 10x)
  - Progress tracking
  - Execution log with results
  - Success/failure statistics

### 3. SequenceStepCard Component
- **Location**: `src/components/SequenceStepCard.tsx`
- **Purpose**: Individual step display and management
- **Key Features**:
  - Step reordering (move up/down)
  - Edit/Delete controls
  - Breakpoint toggle
  - Expandable details view

### 4. SequenceEngine Service
- **Location**: `src/services/SequenceEngine.ts`
- **Purpose**: Core execution logic
- **Key Features**:
  - Sequence validation
  - Step-by-step execution
  - Conditional logic evaluation
  - Variable substitution (planned)

## Testing Procedures

### Test 1: Access the Feature
**Steps**:
1. Start the application
2. Locate the "Sequences" button in the header toolbar
3. Click the button

**Expected Results**:
- SequenceBuilder modal opens
- Modal displays empty state or existing sequences
- UI is responsive and accessible

---

### Test 2: Create a New Sequence
**Steps**:
1. Click "New Sequence" button
2. Enter sequence details:
   - Name: "Test Diagnostic Workflow"
   - Description: "Testing sequence creation"
   - Tags: "test, diagnostic"
3. Click "Create"

**Expected Results**:
- New sequence created in the list
- Sequence editor view opens
- Sequence appears in saved sequences list

---

### Test 3: Add Steps to Sequence
**Steps**:
1. In sequence editor, click "Add Step"
2. Configure step:
   - Service: DiagnosticSessionControl (0x10)
   - Label: "Enter Diagnostic Session"
   - SubFunction: 0x01
   - Data: (empty)
   - Delay: 100ms
   - Continue on Error: false
   - Condition: "always"
3. Click "Add Step"
4. Repeat to add 3-5 steps

**Expected Results**:
- Each step appears in the step list
- Steps are numbered sequentially
- Step cards show service name and label
- No validation errors

---

### Test 4: Reorder Steps
**Steps**:
1. Select a step in the middle of the sequence
2. Click "Move Up" button
3. Click "Move Down" button

**Expected Results**:
- Step order updates correctly
- Step numbers update automatically
- No errors occur

---

### Test 5: Edit Step
**Steps**:
1. Click "Edit" button on a step
2. Modify the label and delay
3. Click "Update"

**Expected Results**:
- Step updates with new values
- Card reflects changes immediately
- Validation re-runs successfully

---

### Test 6: Set Breakpoints
**Steps**:
1. Click the breakpoint indicator (circle) on 2-3 steps
2. Observe the visual change

**Expected Results**:
- Breakpoint indicators turn red when active
- Multiple breakpoints can be set
- Breakpoints persist when editing sequence

---

### Test 7: Sequence Validation
**Steps**:
1. Create a sequence with at least 5 steps
2. Add a step with an invalid service ID (if possible)
3. Observe the validation panel

**Expected Results**:
- Validation runs automatically
- Errors are displayed in red
- Warnings are displayed in yellow
- Detailed error messages provided

---

### Test 8: Load Template
**Steps**:
1. Click "Load Template" button
2. Browse available templates:
   - Basic Diagnostic Workflow
   - Security Access Sequence
   - DTC Management Flow
   - Memory Read Operations
   - Complete Diagnostic Workflow
3. Select "Basic Diagnostic Workflow"
4. Click "Load"

**Expected Results**:
- Template loads into current sequence
- All steps from template appear
- Step configuration matches template
- Validation passes

---

### Test 9: Execute Sequence
**Steps**:
1. Open a valid sequence
2. Click "Execute" button in execution panel
3. Observe execution progress

**Expected Results**:
- Execution starts immediately
- Progress bar advances
- Current step highlights
- Execution log updates in real-time
- Statistics update (completed count, success rate)

---

### Test 10: Pause and Resume Execution
**Steps**:
1. Start executing a sequence with at least 5 steps
2. Click "Pause" button during execution
3. Wait 2 seconds
4. Click "Resume" button

**Expected Results**:
- Execution pauses immediately
- Current step remains highlighted
- Resume continues from paused step
- No steps are skipped

---

### Test 11: Stop Execution
**Steps**:
1. Start executing a sequence
2. Click "Stop" button mid-execution

**Expected Results**:
- Execution stops immediately
- All state resets
- Can start execution again from beginning

---

### Test 12: Execution Speed Control
**Steps**:
1. Execute a sequence with default speed
2. Stop and restart with 0.5x speed
3. Stop and restart with 10x speed

**Expected Results**:
- Slow speed (0.5x) executes noticeably slower
- Fast speed (10x) executes very quickly
- Step delays scale proportionally

---

### Test 13: Conditional Logic (if_positive)
**Steps**:
1. Create a sequence with 3 steps
2. Set step 2 condition to "if_positive"
3. Execute with successful responses

**Expected Results**:
- Step 2 executes when step 1 succeeds (positive response)
- Execution log shows condition evaluation

---

### Test 14: Continue on Error
**Steps**:
1. Create a sequence with 4 steps
2. Enable "Continue on Error" for step 2
3. Configure step 2 to potentially fail
4. Execute sequence

**Expected Results**:
- If step 2 fails, execution continues to step 3
- Error is logged but doesn't stop sequence
- Success rate reflects the failure

---

### Test 15: Breakpoint Execution
**Steps**:
1. Create a sequence with 5 steps
2. Set breakpoint on step 3
3. Execute sequence

**Expected Results**:
- Execution pauses automatically at step 3
- User can inspect state before continuing
- Must manually resume execution

---

### Test 16: Delete Step
**Steps**:
1. Create a sequence with 5 steps
2. Click "Delete" on step 3
3. Confirm deletion

**Expected Results**:
- Step is removed from sequence
- Remaining steps renumber correctly
- Validation updates

---

### Test 17: Delete Sequence
**Steps**:
1. Create a test sequence
2. Click "Delete Sequence" button
3. Confirm deletion

**Expected Results**:
- Sequence removed from list
- LocalStorage updated
- Returns to sequence list view

---

### Test 18: LocalStorage Persistence
**Steps**:
1. Create 2-3 sequences
2. Close the SequenceBuilder modal
3. Refresh the browser page
4. Reopen SequenceBuilder

**Expected Results**:
- All sequences persist across reload
- Step configurations remain intact
- No data loss

---

### Test 19: Search/Filter Sequences
**Steps**:
1. Create several sequences with different names and tags
2. Use search functionality (if available)

**Expected Results**:
- Can filter sequences by name
- Can filter by tags
- List updates dynamically

---

### Test 20: Responsive Design
**Steps**:
1. Open SequenceBuilder on desktop (1920px width)
2. Resize to tablet size (768px)
3. Resize to mobile size (375px)

**Expected Results**:
- Modal adapts to screen size
- All controls remain accessible
- Text remains readable
- No horizontal scrolling

---

## Edge Cases to Test

### Edge Case 1: Empty Sequence Execution
- Execute a sequence with 0 steps
- **Expected**: Error or informative message

### Edge Case 2: Very Long Sequence
- Create a sequence with 50+ steps
- **Expected**: Performance remains acceptable

### Edge Case 3: Rapid Button Clicking
- Click execute/pause/stop rapidly
- **Expected**: State remains consistent, no crashes

### Edge Case 4: Maximum Speed with Breakpoints
- Execute at 10x speed with breakpoints
- **Expected**: Breakpoints still trigger correctly

### Edge Case 5: Duplicate Step Labels
- Create multiple steps with identical labels
- **Expected**: System handles gracefully

---

## Known Limitations

1. **Variable Substitution**: Currently placeholder implementation
2. **Drag-and-Drop Reordering**: Structure in place but not fully implemented
3. **ServiceId Type Enforcement**: Some service IDs (like TESTER_PRESENT) require type assertions

---

## Bug Reporting

If you encounter issues during testing, please report:
1. Test case number
2. Steps to reproduce
3. Expected vs. actual behavior
4. Browser and version
5. Console error messages (if any)

---

## Success Criteria

✅ All 20 test cases pass
✅ No console errors during normal operation
✅ Sequences persist across page reloads
✅ Execution control works reliably
✅ Validation catches common errors
✅ Templates load correctly
✅ UI is responsive and accessible

---

## Next Steps After Testing

1. Address any bugs found during testing
2. Implement variable substitution fully
3. Add drag-and-drop reordering
4. Consider adding sequence export/import
5. Add more sophisticated conditional logic options
6. Performance optimization for large sequences
