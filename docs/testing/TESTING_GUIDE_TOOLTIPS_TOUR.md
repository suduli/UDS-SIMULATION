# 🧪 Testing Guide: Tooltips & Onboarding Tour

## Quick Start Testing

### Prerequisites
```powershell
# Ensure dev server is running
npm run dev

# Open browser to http://localhost:5173/UDS-SIMULATION/
```

---

## 🔍 Interactive Tooltips Testing

### Test 1: Basic Tooltip Display (Mouse)
**Steps:**
1. Navigate to the Request Builder section
2. Hover over any service card (e.g., "0x10 - Diagnostic Session Control")
3. Wait 300ms (delay duration)

**Expected Result:**
- ✅ Tooltip appears with smooth fade-in animation
- ✅ Contains all sections:
  - Header with service ID (cyan) and name
  - Description text (gray)
  - "Common Use Cases" (purple)
  - "Key Parameters" (green)
  - "Example" (pink)
- ✅ Arrow points to the service card
- ✅ Tooltip stays within viewport bounds

**Pass/Fail:** ⬜

---

### Test 2: Keyboard Navigation
**Steps:**
1. Click anywhere to focus the page
2. Press Tab repeatedly until a service card is focused
3. Service card should show focus outline (3px cyan)
4. Tooltip should appear automatically when focused

**Expected Result:**
- ✅ Service cards are focusable
- ✅ Focus indicator visible (cyber-blue outline)
- ✅ Tooltip shows on focus (not just hover)
- ✅ Pressing Esc dismisses tooltip

**Pass/Fail:** ⬜

---

### Test 3: All 16 Services Have Tooltips
**Steps:**
1. Hover over each service in the Request Builder dropdown:
   - 0x10 - Diagnostic Session Control
   - 0x11 - ECU Reset
   - 0x14 - Clear Diagnostic Information
   - 0x19 - Read DTC Information
   - 0x22 - Read Data By Identifier
   - 0x23 - Read Memory By Address
   - 0x27 - Security Access
   - 0x28 - Communication Control
   - 0x2A - Read Data By Periodic ID
   - 0x2E - Write Data By Identifier
   - 0x31 - Routine Control
   - 0x34 - Request Download
   - 0x35 - Request Upload
   - 0x36 - Transfer Data
   - 0x37 - Request Transfer Exit
   - 0x3D - Write Memory By Address

**Expected Result:**
- ✅ All 16 services show tooltips
- ✅ Each tooltip has unique, relevant content
- ✅ Examples match the service description

**Pass/Fail:** ⬜

---

### Test 4: Tooltip Content Quality
**Steps:**
1. Open tooltip for "0x22 - Read Data By Identifier"
2. Verify content quality

**Expected Result:**
- ✅ Description: "Reads specific data values from ECU using standardized data identifiers (DIDs). Most commonly used diagnostic service."
- ✅ Use Cases (3 items):
  - Read VIN (Vehicle Identification Number)
  - Check ECU software version
  - Monitor sensor values in real-time
- ✅ Parameters: "Data Identifier (DID): 2-byte hex value (e.g., 0xF190 for VIN)"
- ✅ Example: "Request: 22 F1 90 → Read VIN"

**Pass/Fail:** ⬜

---

### Test 5: Mobile/Touch Support
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Switch to mobile view (e.g., iPhone 12)
4. Tap on a service card

**Expected Result:**
- ✅ Tooltip appears on tap
- ✅ Tooltip is readable on small screen
- ✅ Tap outside closes tooltip
- ✅ Content doesn't overflow

**Pass/Fail:** ⬜

---

### Test 6: High Contrast Mode
**Steps:**
1. Click "High Contrast" button in header
2. Hover over service cards

**Expected Result:**
- ✅ Tooltip background is pure black
- ✅ Text is high contrast (white/cyan)
- ✅ Border is bright cyan (3px)
- ✅ All text readable (WCAG AAA)

**Pass/Fail:** ⬜

---

## 🎓 Onboarding Tour Testing

### Test 7: First-Time User Experience
**Steps:**
1. Open browser console (F12)
2. Run: `localStorage.removeItem('uds-tour-completed')`
3. Refresh page (F5)
4. Wait 1 second

**Expected Result:**
- ✅ Tour starts automatically after 1s delay
- ✅ Backdrop appears (semi-transparent black)
- ✅ Protocol Dashboard is highlighted with pulsing cyan glow
- ✅ Tour tooltip shows:
  - Title: "📊 Protocol State Dashboard"
  - Content: "Monitor your UDS session status..."
  - Progress dots: ● ○ ○ ○ ○ (1 filled, 4 empty)
  - Buttons: "Skip Tour", "Next"
- ✅ Arrow points to Protocol Dashboard

**Pass/Fail:** ⬜

---

### Test 8: Tour Navigation - Forward
**Steps:**
1. Start tour (clear localStorage and refresh)
2. Click "Next" button 4 times

**Expected Results:**
- ✅ **Step 1:** Protocol Dashboard highlighted
- ✅ **Step 2:** Request Builder highlighted
  - Previous button appears
  - Progress dots: ○ ● ○ ○ ○
- ✅ **Step 3:** Quick Examples highlighted
  - Progress dots: ○ ○ ● ○ ○
- ✅ **Step 4:** Response Visualizer highlighted
  - Progress dots: ○ ○ ○ ● ○
- ✅ **Step 5:** Help Button highlighted
  - Progress dots: ○ ○ ○ ○ ●
  - "Next" button changes to "Finish"

**Pass/Fail:** ⬜

---

### Test 9: Tour Navigation - Backward
**Steps:**
1. Start tour
2. Click "Next" 3 times (go to step 4)
3. Click "Previous" 2 times

**Expected Result:**
- ✅ Tour goes back to step 2 (Request Builder)
- ✅ Highlight moves to correct element
- ✅ Progress dots update correctly
- ✅ "Previous" button disabled on step 1

**Pass/Fail:** ⬜

---

### Test 10: Tour Skip Functionality
**Steps:**
1. Start tour
2. Click "Skip Tour" button

**Expected Result:**
- ✅ Tour closes immediately
- ✅ Backdrop disappears
- ✅ Highlight removed from elements
- ✅ `localStorage.getItem('uds-tour-completed')` returns `"true"`
- ✅ Refreshing page doesn't restart tour

**Pass/Fail:** ⬜

---

### Test 11: Tour Completion
**Steps:**
1. Start tour
2. Click "Next" until step 5
3. Click "Finish" button

**Expected Result:**
- ✅ Tour closes
- ✅ `localStorage.getItem('uds-tour-completed')` returns `"true"`
- ✅ Page remains functional
- ✅ Tour doesn't auto-start on refresh

**Pass/Fail:** ⬜

---

### Test 12: Restart Tour from Help Menu
**Steps:**
1. Complete tour (or skip it)
2. Click "Help" button (or press F1)
3. Click "Start Tour" button in help modal

**Expected Result:**
- ✅ Help modal closes
- ✅ Tour starts from step 1
- ✅ Works even if tour was previously completed
- ✅ localStorage flag is cleared

**Pass/Fail:** ⬜

---

### Test 13: Tour Backdrop Click
**Steps:**
1. Start tour
2. Click on the dark backdrop (outside the tour tooltip)

**Expected Result:**
- ✅ Tour closes
- ✅ Saves completion to localStorage
- ✅ Can restart from Help menu

**Pass/Fail:** ⬜

---

### Test 14: Tour Highlight Animation
**Steps:**
1. Start tour
2. Observe the highlighted element

**Expected Result:**
- ✅ Element has pulsing cyan glow effect
- ✅ Glow expands from 0px to 8px (shadow ring)
- ✅ Animation is smooth (1.5s duration)
- ✅ Animation loops infinitely
- ✅ Animation stops when tour moves to next step

**Pass/Fail:** ⬜

---

### Test 15: Tour Accessibility
**Steps:**
1. Start tour
2. Use keyboard only:
   - Press Tab to focus "Next" button
   - Press Enter to activate
   - Repeat for all 5 steps

**Expected Result:**
- ✅ All buttons are keyboard accessible
- ✅ Focus indicators visible
- ✅ Enter key activates buttons
- ✅ Can complete entire tour with keyboard only

**Pass/Fail:** ⬜

---

## 🎨 Visual Quality Testing

### Test 16: Color Coding
**Steps:**
1. Open tooltip for any service
2. Verify color coding

**Expected Result:**
- ✅ Service ID: Cyber-blue (#00f3ff)
- ✅ "Common Use Cases" heading: Cyber-purple (#a855f7)
- ✅ "Key Parameters" heading: Cyber-green (#10b981)
- ✅ "Example" heading: Cyber-pink (#ec4899)
- ✅ Description text: Gray (#d1d5db)
- ✅ Example code block: Cyan text on black background

**Pass/Fail:** ⬜

---

### Test 17: Animation Smoothness
**Steps:**
1. Hover over service cards rapidly
2. Start/stop tour multiple times

**Expected Result:**
- ✅ Tooltip fade-in is smooth (0.2s ease-out)
- ✅ Tour tooltip slide-up is smooth (0.4s ease-out)
- ✅ Tour highlight pulse is smooth (1.5s ease-in-out)
- ✅ No janky animations or lag
- ✅ Consistent 60fps

**Pass/Fail:** ⬜

---

## 📱 Responsive Design Testing

### Test 18: Small Screen (Mobile)
**Steps:**
1. Open DevTools → Device Toolbar
2. Select "iPhone SE" (375px width)
3. Test tooltips and tour

**Expected Result:**
- ✅ Tooltips fit within screen width
- ✅ Tooltips are readable without horizontal scroll
- ✅ Tour tooltip is responsive (max-w-80 = 320px)
- ✅ Tour buttons are touch-friendly (44x44px min)
- ✅ Progress dots visible

**Pass/Fail:** ⬜

---

### Test 19: Large Screen (Desktop)
**Steps:**
1. View on 1920x1080 resolution
2. Test tooltips and tour

**Expected Result:**
- ✅ Tooltips don't appear too large (max-w-md = 448px)
- ✅ Tour tooltip positioned correctly
- ✅ Arrow points to correct elements
- ✅ Highlights visible on large screens

**Pass/Fail:** ⬜

---

## 🔒 Edge Cases & Error Handling

### Test 20: Multiple Tooltips
**Steps:**
1. Hover over service card A
2. Quickly move to service card B before tooltip A disappears

**Expected Result:**
- ✅ Tooltip A closes smoothly
- ✅ Tooltip B opens smoothly
- ✅ No overlapping tooltips
- ✅ No flickering

**Pass/Fail:** ⬜

---

### Test 21: Tour with Missing Target
**Steps:**
1. Open browser console
2. Run: `document.querySelector('.protocol-dashboard').remove()`
3. Start tour

**Expected Result:**
- ✅ Tour handles missing element gracefully
- ✅ No JavaScript errors
- ✅ Tour continues or shows error message

**Pass/Fail:** ⬜

---

### Test 22: Rapid Tour Navigation
**Steps:**
1. Start tour
2. Click "Next" rapidly 10 times
3. Click "Previous" rapidly 10 times

**Expected Result:**
- ✅ Tour state remains consistent
- ✅ No visual glitches
- ✅ Progress dots accurate
- ✅ Highlight moves correctly

**Pass/Fail:** ⬜

---

## 📊 Performance Testing

### Test 23: Bundle Size Impact
**Steps:**
1. Run: `npm run build`
2. Check output bundle sizes

**Expected Result:**
- ✅ Tooltip data file < 3KB
- ✅ Tour component < 5KB
- ✅ Total impact < 15KB gzipped
- ✅ No significant performance degradation

**Pass/Fail:** ⬜

---

### Test 24: Memory Leaks
**Steps:**
1. Open DevTools → Performance → Memory
2. Take heap snapshot
3. Open/close tooltips 50 times
4. Start/stop tour 20 times
5. Take another heap snapshot
6. Compare memory usage

**Expected Result:**
- ✅ Memory usage stable (no continuous growth)
- ✅ Event listeners cleaned up
- ✅ No detached DOM nodes
- ✅ Memory delta < 1MB

**Pass/Fail:** ⬜

---

## 🌐 Browser Compatibility

### Test 25: Chrome
**Browser:** Chrome 130+
**Pass/Fail:** ⬜

### Test 26: Firefox
**Browser:** Firefox 131+
**Pass/Fail:** ⬜

### Test 27: Safari
**Browser:** Safari 17+
**Pass/Fail:** ⬜

### Test 28: Edge
**Browser:** Edge 130+
**Pass/Fail:** ⬜

---

## 🎯 Testing Summary

**Total Tests:** 28  
**Passed:** ___ / 28  
**Failed:** ___ / 28  
**Completion:** ____%

---

## 🐛 Bug Report Template

```markdown
### Bug Title
[Concise description]

### Severity
[ ] Critical - Feature broken
[ ] Major - Significant issue
[ ] Minor - Small visual/UX issue

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[If applicable]

### Environment
- Browser: 
- OS: 
- Screen size: 
- Device: 

### Additional Context
[Any other relevant info]
```

---

## ✅ Quick Verification Script

**Run in browser console to check implementation:**

```javascript
// Check if all services have tooltip data
const serviceIds = [
  '0x10', '0x11', '0x14', '0x19', '0x22', '0x23',
  '0x27', '0x28', '0x2A', '0x2E', '0x31', '0x34',
  '0x35', '0x36', '0x37', '0x3D'
];

// Check tour target elements exist
const tourTargets = [
  '.protocol-dashboard',
  '.request-builder',
  '.quick-examples',
  '.response-visualizer',
  '.help-button'
];

console.log('🔍 Verification Results:');
console.log('========================');

// Check tour targets
let allTargetsExist = true;
tourTargets.forEach(target => {
  const exists = document.querySelector(target) !== null;
  console.log(`${exists ? '✅' : '❌'} Tour target: ${target}`);
  if (!exists) allTargetsExist = false;
});

// Check localStorage
const tourCompleted = localStorage.getItem('uds-tour-completed');
console.log(`\n📦 LocalStorage:`);
console.log(`Tour completed: ${tourCompleted || 'false'}`);

// Check animations
const animations = [
  'tourHighlight',
  'fadeIn',
  'slideUp',
  'tooltipFadeIn'
];
console.log(`\n🎨 CSS Animations:`);
console.log('(Check computed styles for animation names)');

console.log(`\n${allTargetsExist ? '✅' : '❌'} All tour targets exist`);
console.log('\n💡 To reset tour: localStorage.removeItem("uds-tour-completed")');
```

---

**Happy Testing! 🚀**
