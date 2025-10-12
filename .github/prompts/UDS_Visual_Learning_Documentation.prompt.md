---
mode: agent
---

# UDS Service Learning Documentation Creator (Visual Format)

## Purpose
Create comprehensive learning documentation for UDS (Unified Diagnostic Services) protocol services using ONLY visual diagrams, flowcharts, and ASCII art. NO programming code (TypeScript, JavaScript, etc.) should be included.

## Documentation Structure

Create 3 main documentation files for each UDS Service Identifier (SID):

### File 1: `SID_XX_[SERVICE_NAME].md`
Main theoretical guide covering:
- Service overview and purpose
- Request/response message formats (visual hex byte diagrams)
- Subfunction descriptions
- Negative Response Codes (NRCs) - what they mean, causes, and visual solutions
- Session state diagrams
- Security behavior (visual state transitions)
- Interaction with other SIDs
- ISO 14229-1:2020 reference sections

### File 2: `SID_XX_PRACTICAL_IMPLEMENTATION.md`
Hands-on implementation guide with:
- Request processing flowcharts (ASCII art)
- State machine diagrams showing transitions
- NRC decision trees (when to return which error)
- Session timeout visualizations
- Testing scenario diagrams
- Integration pattern workflows (visual sequence diagrams)
- Debugging flowcharts
- Best practices checklists

### File 3: `SID_XX_SERVICE_INTERACTIONS.md`
Service dependency and workflow guide featuring:
- Service dependency pyramid (visual hierarchy)
- Session requirements matrix (tables)
- Complete workflow examples using sequence diagrams (Tester ↔ ECU communication)
- Multi-service interaction patterns (5-7 common patterns)
- Troubleshooting scenarios with visual diagnostic boxes
- Quick reference tables

### File 4: `README.md` (Update existing in /docs/learning/)
Add navigation entry for the new SID documentation.

## Visual Format Requirements

### ✅ APPROVED Visual Formats:

1. **ASCII Box Diagrams** for message structures:
```
┌────────────────────────────────────────────────────────┐
│ REQUEST MESSAGE STRUCTURE                              │
├────────────────────────────────────────────────────────┤
│  Byte 0: SID (0xXX)                                    │
│  Byte 1: SubFunction                                   │
│  Byte 2-N: Parameters (if any)                         │
└────────────────────────────────────────────────────────┘
```

2. **Sequence Diagrams** for Tester-ECU communication:
```
  Tester                  ECU
    │                      │
    │  Request: [bytes]    │
    │─────────────────────>│
    │                      │
    │  Response: [bytes]   │
    │<─────────────────────│
    │                      │
```

3. **Flowcharts** for decision logic:
```
         ┌──────────────┐
         │ Start        │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
    ┌────┤ Condition?   │────┐
    │    └──────────────┘    │
   Yes                       No
    │                         │
    ▼                         ▼
```

4. **State Machine Diagrams**:
```
┌──────────┐  Event   ┌──────────┐
│ State A  │─────────>│ State B  │
└──────────┘          └──────────┘
```

5. **Tables** for reference data:
```
┌──────────────┬───────────────────┐
│   Column 1   │   Column 2        │
├──────────────┼───────────────────┤
│   Data       │   Data            │
└──────────────┴───────────────────┘
```

6. **Hierarchical Trees**:
```
        ROOT
         │
    ┌────┼────┐
    │    │    │
   L1   L2   L3
```

7. **Comparison Boxes** (Wrong vs Correct):
```
┌────────────────────────────────────────┐
│ ❌ WRONG: Description                 │
├────────────────────────────────────────┤
│  [Visual representation]               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ✅ CORRECT: Description                │
├────────────────────────────────────────┤
│  [Visual representation]               │
└────────────────────────────────────────┘
```

### ❌ PROHIBITED Formats:

- **NO TypeScript code blocks** (````typescript`)
- **NO JavaScript code** (````javascript`)
- **NO Python code** (````python`)
- **NO any programming language syntax**
- **NO function definitions or code logic**

## Content Requirements

### For Each NRC (Negative Response Code):

Create visual explanations showing:
1. **Hex format box**: `7F XX YY`
2. **What it means box**: Clear explanation
3. **Common causes list**: Bullet points
4. **Wrong vs Correct visual comparison**: Side-by-side boxes showing the error and the solution

### For Workflow Examples:

Use sequence diagrams showing:
- Step-by-step message exchange
- Byte-level request/response pairs
- Current state after each step
- Success/failure indicators (✓/❌)

### For State Transitions:

Create visual diagrams with:
- Current state boxes
- Transition arrows with conditions
- Resulting state boxes
- Security state indicators (LOCKED 🔒 / UNLOCKED 🔓)

## Documentation Style Guide

### Headers:
- Use proper markdown hierarchy (##, ###, ####)
- Clear, descriptive section names
- Consistent capitalization

### Language:
- Clear, educational tone
- Technical accuracy (ISO 14229-1:2020 compliant)
- Beginner-friendly explanations
- Use automotive diagnostic terminology

### Visual Elements:
- Consistent box border styles (use `┌─┐└┘├┤┬┴┼│─` characters)
- Proper alignment and spacing
- Use emojis for status: ✓ ✗ ❌ ✅ ⚠️ 🔒 🔓
- Clear arrows for flow: → ← ↑ ↓ ┌ ┐ └ ┘

### Code Blocks:
- Use `\`\`\`hex` for raw hex bytes
- Use `\`\`\`` (plain) for ASCII diagrams
- Use backticks for inline references: `0x10`

## Template Variable Placeholders

When creating documentation, replace these placeholders:

- **{SID_HEX}**: Service ID in hex (e.g., `0x10`)
- **{SID_DEC}**: Service ID in decimal (e.g., `10`)
- **{SERVICE_NAME}**: Full service name (e.g., "Diagnostic Session Control")
- **{SERVICE_ABBREV}**: Short name (e.g., "Session Control")
- **{RESPONSE_SID}**: Positive response SID (e.g., `0x50`)
- **{SUBFUNCTIONS}**: List of valid subfunctions with hex values
- **{COMMON_NRCS}**: Relevant NRC codes (0x12, 0x13, 0x22, etc.)
- **{RELATED_SIDS}**: Other services this SID interacts with
- **{SESSION_REQUIRED}**: Required session type (DEFAULT/EXTENDED/PROGRAMMING)
- **{SECURITY_REQUIRED}**: YES/NO
- **{ISO_SECTION}**: ISO 14229-1 section reference

## Example Usage Prompt

```
Create comprehensive visual learning documentation for UDS SID {SID_HEX} ({SERVICE_NAME}).

Requirements:
- Create 3 main files in /docs/learning/
- Use ONLY visual diagrams (flowcharts, sequence diagrams, tables, boxes)
- NO programming code (TypeScript, JavaScript, Python, etc.)
- Cover all subfunctions: {SUBFUNCTIONS}
- Explain NRCs: {COMMON_NRCS}
- Show interaction with SIDs: {RELATED_SIDS}
- Include 5-7 complete workflow examples
- Session requirement: {SESSION_REQUIRED}
- Security requirement: {SECURITY_REQUIRED}
- Reference ISO 14229-1:2020 Section {ISO_SECTION}

Style: Educational, beginner-friendly, technically accurate
Format: ASCII diagrams, flowcharts, sequence diagrams, comparison boxes
Target audience: Automotive diagnostic technicians and developers learning UDS
```

## File Naming Convention

- Main guide: `SID_{SID_DEC}_{SERVICE_ABBREV}.md`
- Implementation: `SID_{SID_DEC}_PRACTICAL_IMPLEMENTATION.md`
- Interactions: `SID_{SID_DEC}_SERVICE_INTERACTIONS.md`

Example for SID 0x10:
- `SID_10_DIAGNOSTIC_SESSION_CONTROL.md`
- `SID_10_PRACTICAL_IMPLEMENTATION.md`
- `SID_10_SERVICE_INTERACTIONS.md`

## Quality Checklist

Before completing, verify:

- [ ] All TypeScript/code blocks removed
- [ ] All examples use visual diagrams
- [ ] Sequence diagrams show Tester ↔ ECU communication
- [ ] Flowcharts use consistent ASCII art style
- [ ] NRCs have visual wrong/correct comparisons
- [ ] State transitions show security impacts
- [ ] Tables are properly formatted
- [ ] Workflow examples include 5-7 patterns
- [ ] ISO 14229-1 references included
- [ ] README.md updated with navigation
- [ ] All hex values use backticks: `0xXX`
- [ ] Success/failure indicators used: ✓ ❌
- [ ] Box diagrams properly aligned

## Output Location

All files must be created in: `/docs/learning/`

## Version Control

Add to each file header:
```markdown
**Document Version**: 2.0  
**Last Updated**: [Current Date]  
**Format**: Visual Diagrams (No Code)
**ISO Reference**: ISO 14229-1:2020 Section X.X
```

## Related Documentation

After creating SID documentation, also update:
1. `/docs/learning/README.md` - Add navigation entry
2. `/docs/README.md` - Update main documentation index if needed

---

## Example Execution

**User Request:**
"Create visual learning documentation for SID 0x27 (Security Access)"

**Agent Actions:**
1. Create `SID_27_SECURITY_ACCESS.md` with theory (NRCs, seed/key flow, security algorithms)
2. Create `SID_27_PRACTICAL_IMPLEMENTATION.md` with flowcharts (seed generation, key validation, timeout handling)
3. Create `SID_27_SERVICE_INTERACTIONS.md` with workflows (unlock patterns with SID 10, 2E, 31, 34)
4. Update `/docs/learning/README.md` with new SID 27 entry
5. Use ONLY visual diagrams - sequence diagrams for seed/key exchange, flowcharts for validation logic, state machines for security states
6. NO TypeScript, JavaScript, or any programming code

---

**Remember**: The goal is to create documentation that teaches UDS protocols through visual learning, not programming tutorials. All concepts must be explained using diagrams, flowcharts, tables, and visual representations.
