# Week 5 Testing Protocol - Step-by-Step Guide

**Testing Date:** October 4, 2025  
**Tester:** [Your Name]  
**Version:** 1.0.0  
**Environment:** http://localhost:5173/UDS-SIMULATION/

---

## 🎯 Testing Objectives

1. ✅ Verify all accessibility features work correctly
2. ✅ Confirm mobile responsiveness across breakpoints
3. ✅ Validate WCAG compliance
4. ✅ Test keyboard navigation
5. ✅ Verify high contrast mode
6. ✅ Cross-browser compatibility

---

## 📋 Test Session 1: Chrome DevTools Lighthouse Audit

### Prerequisites
- Chrome browser open
- Development server running at http://localhost:5173/UDS-SIMULATION/
- Chrome DevTools available (F12)

### Steps

#### 1. Run Lighthouse Accessibility Audit
```
1. Open http://localhost:5173/UDS-SIMULATION/ in Chrome
2. Press F12 to open DevTools
3. Click "Lighthouse" tab (if not visible, click >> and find it)
4. Configuration:
   ✅ Device: Desktop
   ✅ Categories: ✓ Accessibility ✓ Best Practices ✓ SEO
   ✅ Clear storage: ✓
5. Click "Analyze page load"
6. Wait for report to generate (30-60 seconds)
```

#### 2. Record Results
```
Target Scores:
- Accessibility: ≥ 90 (target: 95+)
- Best Practices: ≥ 90
- SEO: ≥ 90

Actual Scores:
- Accessibility: ______ / 100
- Best Practices: ______ / 100
- SEO: ______ / 100
- Performance: ______ / 100 (bonus)
```

#### 3. Review Issues
If score < 90, review "Opportunities" section:
```
Common issues to check:
□ Missing alt text on images
□ Low contrast text
□ Missing form labels
□ Missing ARIA attributes
□ Duplicate IDs
□ Missing meta viewport tag
```

#### 4. Re-run on Mobile
```
1. Change Device to "Mobile"
2. Run audit again
3. Record scores:
   - Accessibility: ______ / 100
   - Best Practices: ______ / 100
   - SEO: ______ / 100
```

**Status:** ⏳ Pending  
**Issues Found:** _______________________  
**Pass/Fail:** _______

---

## 📋 Test Session 2: Mobile Responsiveness

### Test 1: Extra Small Mobile (320px)
```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "Responsive"
4. Set dimensions: 320 x 568
5. Refresh page (F5)
```

**Checklist:**
- [ ] No horizontal scroll
- [ ] All text readable (minimum 14px)
- [ ] Hamburger menu visible
- [ ] Touch targets ≥ 44px (use ruler in DevTools)
- [ ] All content accessible
- [ ] Images/logos scale correctly

**Screenshot:** 📸 Take screenshot if issues found  
**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

### Test 2: iPhone SE (375px)
```
1. Select "iPhone SE" from device dropdown
2. Refresh page
```

**Checklist:**
- [ ] Hamburger menu works
- [ ] Click hamburger → menu slides down
- [ ] Menu shows 6 buttons
- [ ] Menu icon changes to X
- [ ] Click action → menu closes
- [ ] Touch targets feel comfortable
- [ ] No input zoom when focusing (test by clicking any input)
- [ ] Response visualizer appears first (above request builder)

**Hamburger Menu Actions Test:**
- [ ] Help button opens modal
- [ ] Export button works (if history exists)
- [ ] Import button works
- [ ] Theme toggle works
- [ ] High Contrast toggle works
- [ ] Menu closes after each action

**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

### Test 3: Tablet (768px)
```
1. Select "iPad" from device dropdown
2. Refresh page
```

**Checklist:**
- [ ] Still shows hamburger menu (not full desktop nav)
- [ ] Layout looks good with more space
- [ ] Touch targets still comfortable
- [ ] No layout breaks

**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

### Test 4: Desktop (1280px)
```
1. Set dimensions: 1280 x 720
2. OR disable device toolbar
3. Refresh page
```

**Checklist:**
- [ ] Full desktop navigation visible
- [ ] NO hamburger menu
- [ ] 6 buttons in header: Help, Export, Import, Theme, High Contrast
- [ ] 2-column layout for main content
- [ ] Left column: Request Builder + Quick Examples
- [ ] Right column: Response Visualizer + Timing Metrics
- [ ] All hover states work
- [ ] Generous spacing

**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

## 📋 Test Session 3: Keyboard Navigation

### Prerequisites
- Desktop view (≥ 1024px)
- No mouse usage during test

### Test Procedure
```
1. Load page
2. Click in address bar (to reset focus)
3. Press Tab key (DO NOT use mouse)
```

**Focus Order Checklist:**

**First Tab:**
- [ ] "Skip to main content" link appears at top-left
- [ ] Link has cyan background
- [ ] Text is readable

**Press Enter on Skip Link:**
- [ ] Focus jumps to main content area
- [ ] URL changes to #main-content

**Continue Tabbing Through Header:**
- [ ] Help button receives focus (visible outline)
- [ ] Export button receives focus
- [ ] Import button receives focus
- [ ] Theme toggle receives focus
- [ ] High Contrast button receives focus

**Tab Through Dashboard:**
- [ ] Each protocol card receives focus
- [ ] Total: 4 cards should be focusable

**Tab Through Request Builder:**
- [ ] Search input receives focus
- [ ] Service dropdown receives focus
- [ ] Parameters input receives focus
- [ ] Send button receives focus
- [ ] Quick example buttons receive focus

**Visual Focus Indicators:**
- [ ] All focus indicators are **visible**
- [ ] Focus outline is cyan/blue color
- [ ] Focus outline is **2-3px thick**
- [ ] Focus doesn't hide behind other elements

**Keyboard Shortcuts:**
- [ ] Press **F1** → Help modal opens
- [ ] Press **Escape** → Help modal closes
- [ ] Press **Enter** on buttons → Activates button
- [ ] Press **Space** on buttons → Activates button

**Reverse Navigation:**
- [ ] Press **Shift+Tab** → Focus moves backward
- [ ] No focus traps (can always move away)

**Status:** ⏳ Pending  
**Issues:** _______________________  
**Pass/Fail:** _______

---

## 📋 Test Session 4: High Contrast Mode

### Enable High Contrast
```
1. Find "Normal Contrast" button in header
2. Click it
3. Button text changes to "High Contrast"
```

### Visual Verification Checklist

**Color Changes:**
- [ ] Background is pure black (#000000)
- [ ] Text is pure white (#ffffff)
- [ ] Accents are bright cyan (#00ffff)
- [ ] NO gray tones visible
- [ ] NO gradients visible

**Effects Removed:**
- [ ] NO blur effects on panels
- [ ] NO shadow effects
- [ ] NO transparency (everything solid)
- [ ] NO gradient backgrounds

**Border & Focus Changes:**
- [ ] Borders are **2px thick** (check with inspector)
- [ ] Tab through elements → Focus outlines are **4px thick**
- [ ] Focus has additional cyan shadow (6px)

**Contrast Ratio Check:**
```
1. Right-click on any text
2. Select "Inspect"
3. In Styles panel, look for contrast ratio
4. Should show 21:1 or higher
5. WCAG indicator should show AAA ✓
```

**Test All Components:**
- [ ] Header text: white on black ✓
- [ ] Buttons: cyan border, black background ✓
- [ ] Cards: black background, cyan border ✓
- [ ] Input fields: white text, black background ✓
- [ ] Response bytes: colored but high contrast ✓

**Persistence Test:**
- [ ] Refresh page → High contrast persists
- [ ] Close tab, reopen → High contrast persists
- [ ] Toggle off → Returns to normal mode
- [ ] Toggle on again → High contrast reactivates

**Status:** ⏳ Pending  
**Contrast Ratio:** ______ : 1  
**Pass/Fail:** _______

---

## 📋 Test Session 5: Reduced Motion

### Enable Reduced Motion (OS-level)

**Windows:**
```
Settings → Accessibility → Visual effects → Animation effects → OFF
```

**macOS:**
```
System Preferences → Accessibility → Display → Reduce motion → ON
```

**Linux:**
```
Settings → Accessibility → Reduce animations → ON
```

### Test Procedure
```
1. Enable reduced motion in OS
2. Refresh browser page
3. Observe animations
```

**Checklist:**
- [ ] NO pulse animations on logo
- [ ] NO gradient shift animations
- [ ] NO smooth scrolling
- [ ] Fade-in appears instantly (no delay)
- [ ] Byte animations appear instantly
- [ ] Transitions are instant (< 10ms)
- [ ] Page still functional (just no animations)

**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

## 📋 Test Session 6: Cross-Browser Testing

### Firefox
```
1. Open Firefox browser
2. Navigate to http://localhost:5173/UDS-SIMULATION/
3. Run all previous tests
```

**Checklist:**
- [ ] Layout renders correctly
- [ ] Mobile menu works
- [ ] High contrast mode works
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] No console errors

**Firefox-Specific Issues:** _______________________  
**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

### Safari (if available on macOS)
```
1. Open Safari
2. Navigate to localhost:5173/UDS-SIMULATION/
3. Test mobile responsiveness
```

**Checklist:**
- [ ] Backdrop-filter (blur) works
- [ ] Layout correct
- [ ] Mobile menu works
- [ ] No rendering issues

**Safari-Specific Issues:** _______________________  
**Status:** ⏳ Pending / N/A  
**Pass/Fail:** _______

---

### Microsoft Edge
```
1. Open Edge browser
2. Navigate to localhost:5173/UDS-SIMULATION/
3. Verify same as Chrome (Chromium-based)
```

**Checklist:**
- [ ] Identical to Chrome behavior
- [ ] No unique issues

**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

## 📋 Test Session 7: Form Input Testing

### Mobile Input Zoom Prevention (Requires Real Device or Good Emulation)

**Test on iPhone/iOS Simulator:**
```
1. Open Safari on iPhone
2. Navigate to app
3. Tap any input field
4. Observe if page zooms
```

**Expected Behavior:**
- [ ] Page does NOT zoom when input focused
- [ ] Keyboard appears
- [ ] Input receives focus immediately
- [ ] Can type normally

**If zoom occurs:** Font size is < 16px (bug)  
**Status:** ⏳ Pending (needs real device)  
**Pass/Fail:** _______

---

## 📋 Test Session 8: Touch Target Verification

### Measure Touch Targets (Chrome DevTools)
```
1. Open DevTools (F12)
2. Toggle device toolbar
3. Select iPhone SE
4. Right-click on any button → Inspect
5. In Computed panel, check:
   - width: should be ≥ 44px
   - height: should be ≥ 44px
   - padding: should be 12px+ vertical
```

**Buttons to Check:**
- [ ] Send button: ____px × ____px
- [ ] Help button: ____px × ____px
- [ ] Menu buttons: ____px × ____px
- [ ] Service cards: ____px × ____px
- [ ] Quick example buttons: ____px × ____px

**All targets ≥ 44x44px?** YES / NO  
**Status:** ⏳ Pending  
**Pass/Fail:** _______

---

## 📊 Final Results Summary

### Test Completion Status

| Test Session | Status | Pass/Fail | Issues |
|--------------|--------|-----------|--------|
| 1. Lighthouse Audit | ⏳ | - | - |
| 2. Mobile Responsive | ⏳ | - | - |
| 3. Keyboard Navigation | ⏳ | - | - |
| 4. High Contrast | ⏳ | - | - |
| 5. Reduced Motion | ⏳ | - | - |
| 6. Cross-Browser | ⏳ | - | - |
| 7. Form Input | ⏳ | - | - |
| 8. Touch Targets | ⏳ | - | - |

### Lighthouse Scores
- Desktop Accessibility: ______ / 100
- Mobile Accessibility: ______ / 100
- Best Practices: ______ / 100
- SEO: ______ / 100

### WCAG Compliance
- [ ] Level A: PASS / FAIL
- [ ] Level AA: PASS / FAIL
- [ ] Level AAA (High Contrast): PASS / FAIL

### Issues Found
```
1. [Issue Title]
   - Severity: Critical / High / Medium / Low
   - Description: _______________________
   - Steps to reproduce: _______________________
   - Expected: _______________________
   - Actual: _______________________

2. [Issue Title]
   - ...
```

### Recommendations
```
1. _______________________
2. _______________________
3. _______________________
```

---

## ✅ Sign-Off

**Tested By:** _______________________  
**Date:** October 4, 2025  
**Environment:** Chrome DevTools + http://localhost:5173/UDS-SIMULATION/  
**Overall Status:** PASS / CONDITIONAL PASS / FAIL  

**Ready for Production?** YES / NO  
**Reason:** _______________________

---

**Next Steps:**
1. Fix any critical/high issues found
2. Re-test failed areas
3. Get approval from stakeholders
4. Proceed to Week 6: Advanced Features

---

## 📝 Notes & Observations

```
[Add any additional observations, edge cases found, or suggestions for improvement]






```

---

**Testing Protocol Version:** 1.0.0  
**Created:** October 4, 2025  
**Last Updated:** October 4, 2025
