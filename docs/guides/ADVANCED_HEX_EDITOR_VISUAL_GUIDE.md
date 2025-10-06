# Advanced Hex Editor - Visual Quick Reference

```
┌──────────────────────────────────────────────────────────────────────┐
│                    🎯 ADVANCED HEX EDITOR                             │
│                    Visual Byte-Level Request Builder                  │
└──────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                         HOW TO ACCESS                                  ║
╚═══════════════════════════════════════════════════════════════════════╝

  Request Builder (Main Screen)
  ┌─────────────────────────────────────────┐
  │  [○ Normal Mode  ● Manual Hex Mode]     │  ← 1. Toggle to Manual Mode
  │                                          │
  │  Manual Hex Frame                        │
  │  ┌────────────────────────────────────┐ │
  │  │ 10 03                              │ │
  │  └────────────────────────────────────┘ │
  │                    [📊 Visual Editor]   │  ← 2. Click this button
  └─────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                       EDITOR LAYOUT                                    ║
╚═══════════════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────────────┐
│ 🎨 Advanced Hex Editor                                          [✕]   │
├──────────────────┬────────────────────────────────────────────────────┤
│   BYTE PALETTE   │              REQUEST BUILDER                       │
│                  │                                                    │
│ 🔍 Search...     │  Drag bytes here                                   │
│ ┌──────────────┐ │  ┌──────────────────────────────────────────────┐ │
│ │session       │ │  │                                              │ │
│ └──────────────┘ │  │   [0]    [1]    [2]    [3]                  │ │
│                  │  │   10     03     F1     90                    │ │
│ [All] [Services] │  │   SID    Sub    DID    DID                   │ │
│                  │  │                                              │ │
│ 📌 Recent        │  │   [×]    [×]    [×]    [×]                  │ │
│ 10 22 27 19      │  │                                              │ │
│ ═══════════════  │  └──────────────────────────────────────────────┘ │
│                  │                                                    │
│ Service IDs      │  Hex Preview: 10 03 F1 90        [Copy]           │
│ ┌──┬──┬──┬──┐   │  ────────────────────────────────────────────────  │
│ │10│11│14│19│   │  ✅ Valid sequence                                 │
│ └──┴──┴──┴──┘   │                                                    │
│ ┌──┬──┬──┬──┐   │  💡 Suggested Next Bytes:                         │
│ │22│23│27│28│   │  [0x01 - Default Session] [0x03 - Extended]       │
│ └──┴──┴──┴──┘   │                                                    │
│ ┌──┬──┬──┬──┐   │  📚 Templates (11)                                │
│ │2A│2E│31│34│   │  ▼ Session Control                                │
│ └──┴──┴──┴──┘   │    • Default Session (10 01)                      │
│ ┌──┬──┬──┬──┐   │    • Extended Session (10 03)                     │
│ │36│37│3D│3E│   │    • Programming Session (10 02)                  │
│ └──┴──┴──┴──┘   │  ▼ Security Access                                │
│                  │    • Security Seed Request (27 01)                │
│ All Bytes        │    • Security Key Send (27 02 00 00 00 00)       │
│ (scroll for      │  ▼ Read Data                                      │
│  more...)        │    • Read VIN (22 F1 90)                          │
│                  │  ▼ DTC                                            │
│ Legend:          │    • Read Current DTCs (19 02 08)                 │
│ 🔵 Service ID    │    • Clear All DTCs (14 FF FF FF)                 │
│ 🟣 Sub-function  │                                                    │
│ 🟡 Identifier    │                                                    │
│ 🟢 Data          │                                                    │
├──────────────────┴────────────────────────────────────────────────────┤
│ [💾 Save as Template]  [✓ Show suggestions]     [Cancel] [Apply]     │
└───────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                    COLOR CODING SYSTEM                                 ║
╚═══════════════════════════════════════════════════════════════════════╝

  Position 0 (Service ID):      🔵 CYAN/BLUE
  ┌────────┐
  │   10   │  ← Diagnostic Session Control
  │  SID   │
  └────────┘

  Position 1 (Sub-Function):    🟣 PURPLE
  ┌────────┐
  │   03   │  ← Extended Session
  │Sub-Fn  │
  └────────┘

  Data Identifiers:             🟡 YELLOW
  ┌────────┐ ┌────────┐
  │   F1   │ │   90   │  ← VIN Identifier
  │  DID   │ │  DID   │
  └────────┘ └────────┘

  Data Bytes:                   🟢 GREEN
  ┌────────┐
  │   AA   │  ← Generic data
  │  DATA  │
  └────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                      INTERACTION METHODS                               ║
╚═══════════════════════════════════════════════════════════════════════╝

  Method 1: CLICK TO ADD
  ════════════════════
  Palette               Canvas
  ┌────┐               ┌──────────────────┐
  │ 10 │   ──click──>  │ [0] 10           │
  └────┘               └──────────────────┘
                              ↓ click again
  ┌────┐               ┌──────────────────┐
  │ 03 │   ──click──>  │ [0] 10  [1] 03   │
  └────┘               └──────────────────┘


  Method 2: DRAG AND DROP
  ══════════════════════
  Palette               Canvas
  ┌────┐               ┌──────────────────┐
  │ 22 │               │ [0] 10  [1] 03   │
  └────┘               └──────────────────┘
    │                         ▲
    └──────drag──────────────┘
                              ↓
                       ┌──────────────────────────┐
                       │ [0] 10  [1] 22  [2] 03   │
                       └──────────────────────────┘


  Method 3: LOAD TEMPLATE
  ═══════════════════════
  Templates                   Canvas
  ┌──────────────────┐       ┌──────────────────┐
  │ Read VIN         │       │                  │
  │ 22 F1 90         │ ─┬─>  │ [0] [1] [2]      │
  └──────────────────┘  │    │ 22  F1  90       │
                        │    └──────────────────┘
  ┌──────────────────┐  │
  │ Extended Session │  │
  │ 10 03            │ ─┘
  └──────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                   BYTE MANIPULATION                                    ║
╚═══════════════════════════════════════════════════════════════════════╝

  REORDER (Drag):
  Before:  [0] 10  [1] 03  [2] F1  [3] 90
           ═══════════════════════════════
           Drag [1] to position 3
           ═══════════════════════════════
  After:   [0] 10  [1] F1  [2] 90  [3] 03


  DELETE (Click):
  Before:  [0] 10  [1] 03  [2] F1  [3] 90
                    ┌────┐
                    │ 03 │ ← Click to select
                    └────┘
                      [×] ← Click delete button
           ═══════════════════════════════
  After:   [0] 10  [1] F1  [2] 90


  CLEAR ALL:
  Before:  [0] 10  [1] 03  [2] F1  [3] 90
           
           Click [Clear All] button
           ═══════════════════════════════
  After:   (empty canvas)
           Drag bytes here...


╔═══════════════════════════════════════════════════════════════════════╗
║                  VALIDATION EXAMPLES                                   ║
╚═══════════════════════════════════════════════════════════════════════╝

  ✅ VALID (No Issues):
  ┌──────────────────────────────────────┐
  │ [0] 10  [1] 03                       │
  └──────────────────────────────────────┘
  ✅ Valid sequence
  💡 Session Control: Extended Session


  ⚠️ WARNING (Non-Critical):
  ┌──────────────────────────────────────┐
  │ [0] 10  [1] 05                       │
  └──────────────────────────────────────┘
  ⚠️ Sub-function 0x05 may not be valid for Session Control
  (You can still apply this)


  ❌ ERROR (Must Fix):
  ┌──────────────────────────────────────┐
  │ [0] 10                               │
  └──────────────────────────────────────┘
  ❌ Session Control requires sub-function (byte 2)
  (Cannot apply until fixed)


╔═══════════════════════════════════════════════════════════════════════╗
║                    SMART SUGGESTIONS                                   ║
╚═══════════════════════════════════════════════════════════════════════╝

  Scenario: Building Session Control Request
  ═══════════════════════════════════════════

  Step 1: Add Service ID
  Canvas:  [0] 10
  
  Suggestions appear:
  ┌────────────────────────────────────────────┐
  │ 💡 Suggested Next Bytes:                   │
  │ [0x01 - Default Session]      (70% conf)   │
  │ [0x03 - Extended Session]     (90% conf)   │  ← High confidence
  │ [0x02 - Programming Session]  (60% conf)   │
  └────────────────────────────────────────────┘
  
  Step 2: Click suggestion "0x03 - Extended"
  Canvas:  [0] 10  [1] 03  ✅ Complete!


╔═══════════════════════════════════════════════════════════════════════╗
║                  BUILT-IN TEMPLATES                                    ║
╚═══════════════════════════════════════════════════════════════════════╝

  SESSION CONTROL
  • Default Session        → 10 01
  • Extended Session       → 10 03
  • Programming Session    → 10 02

  SECURITY ACCESS
  • Security Seed Request  → 27 01
  • Security Key Send      → 27 02 00 00 00 00

  READ DATA
  • Read VIN               → 22 F1 90

  DTC MANAGEMENT
  • Read Current DTCs      → 19 02 08
  • Clear All DTCs         → 14 FF FF FF

  ECU RESET
  • Hard ECU Reset         → 11 01
  • Soft ECU Reset         → 11 03

  COMMUNICATION
  • Tester Present         → 3E 00


╔═══════════════════════════════════════════════════════════════════════╗
║                    WORKFLOW EXAMPLES                                   ║
╚═══════════════════════════════════════════════════════════════════════╝

  Example 1: Read VIN (Quick)
  ═══════════════════════════
  1. Open Advanced Hex Editor
  2. Click "Templates" → "Read VIN"
  3. Canvas shows: [0] 22  [1] F1  [2] 90
  4. Click "Apply to Request"
  5. Done! ✅


  Example 2: Custom Security Key (Manual)
  ════════════════════════════════════════
  1. Open Advanced Hex Editor
  2. Click byte 27 (Security Access)
  3. Click byte 02 (Send Key sub-function)
  4. Add your 4 key bytes: AA BB CC DD
  5. Canvas shows: [0] 27  [1] 02  [2] AA  [3] BB  [4] CC  [5] DD
  6. Click "Apply to Request"
  7. Done! ✅


  Example 3: Save Custom Template
  ════════════════════════════════
  1. Build your request (e.g., custom routine)
  2. Canvas shows: [0] 31  [1] 01  [2] FF  [3] 00
  3. Click "Save as Template"
  4. Enter name: "My Custom Routine"
  5. Enter description: "Starts routine FF00"
  6. Template saved! ✅
  7. Next time: Find it under "Custom" category


╔═══════════════════════════════════════════════════════════════════════╗
║                      KEYBOARD TIPS                                     ║
╚═══════════════════════════════════════════════════════════════════════╝

  • Type in search box to filter bytes
  • Tab to navigate between elements
  • Enter to confirm dialogs
  • Esc to close editor (coming soon)


╔═══════════════════════════════════════════════════════════════════════╗
║                    TROUBLESHOOTING                                     ║
╚═══════════════════════════════════════════════════════════════════════╝

  Problem: "Visual Editor" button not visible
  Solution: Make sure you're in Manual Hex Mode
            (Toggle at top of Request Builder)

  Problem: Drag and drop not working
  Solution: Try clicking bytes instead
            All features work with clicks too!

  Problem: Can't find byte 0xA5
  Solution: Use search! Type "a5" or "165" (decimal)

  Problem: Too many validation warnings
  Solution: Warnings are informational only
            You can still apply the request


╔═══════════════════════════════════════════════════════════════════════╗
║                         PRO TIPS                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

  🌟 Start with templates - Faster than building from scratch
  🌟 Watch suggestions - They show the right next step
  🌟 Use search frequently - Faster than scrolling
  🌟 Save common sequences - Build your template library
  🌟 Check validation first - Fix errors early
  🌟 Hover for info - Every byte has a tooltip


═══════════════════════════════════════════════════════════════════════════
                           HAPPY HEX EDITING! 🚀
═══════════════════════════════════════════════════════════════════════════
```
