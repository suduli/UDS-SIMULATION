# Visual Testing Guide - Week 5 Features 👁️

**Quick Visual Verification Checklist**

---

## 🖥️ Desktop Testing (≥ 1024px)

### 1. Header
- [ ] Logo is **12x12** (w-12 h-12)
- [ ] Full title: "UDS Protocol Simulator"
- [ ] Subtitle visible: "Unified Diagnostic Services"
- [ ] **6 buttons visible:** Help, Export, Import, Light/Dark, High Contrast
- [ ] NO hamburger menu icon
- [ ] Buttons have hover states (cyan background)

### 2. Main Layout
- [ ] **2-column grid** for main content
- [ ] Left: Request Builder → Quick Examples
- [ ] Right: Response Visualizer → Timing Metrics
- [ ] Generous spacing (24px gaps)

### 3. Focus Indicators
- [ ] Tab through elements
- [ ] **2px cyan outline** visible on every element
- [ ] **4px shadow** around focused buttons
- [ ] Focus order is logical (top to bottom, left to right)

---

## 📱 Mobile Testing (< 768px)

### 1. Header
- [ ] Logo is **8x8** (w-8 h-8) on phones, **10x10** on tablets
- [ ] Title: "UDS Simulator" (shortened)
- [ ] Subtitle **hidden** on mobile
- [ ] **Hamburger menu (≡)** visible in top-right
- [ ] NO desktop buttons visible

### 2. Hamburger Menu
- [ ] Click hamburger → menu slides down
- [ ] Icon changes to **X** when open
- [ ] **6 full-width buttons** with icons
- [ ] Left-aligned text
- [ ] Click any button → menu closes
- [ ] Click X → menu closes

### 3. Mobile Layout
- [ ] **Single column** (stacked vertically)
- [ ] Order: Response Visualizer → Request Builder → Quick Examples → Timing
- [ ] Smaller gaps (16px)
- [ ] Padding: 16px (py-4)

### 4. Touch Targets
- [ ] Open Chrome DevTools (F12)
- [ ] Enable device toolbar (Ctrl+Shift+M)
- [ ] Select "iPhone SE" (375x667)
- [ ] Inspect any button → should be **minimum 44x44px**
- [ ] Test tapping buttons → should feel easy to hit

### 5. Form Inputs
- [ ] Tap any input field
- [ ] Phone should **NOT zoom in automatically**
- [ ] Font size should be **16px** (check inspector)
- [ ] Cursor should appear immediately

---

## 🎨 High Contrast Mode Testing

### Enable High Contrast
1. Click "Normal Contrast" button (or "High Contrast" if already enabled)
2. Button text changes to "High Contrast"
3. Entire page transforms

### Visual Checks
- [ ] Background is **pure black (#000000)** - no gradients
- [ ] Text is **pure white (#ffffff)**
- [ ] Accent color is **bright cyan (#00ffff)**
- [ ] **No blur effects** on glass panels
- [ ] **No shadow effects** anywhere
- [ ] **No gradients** on buttons/backgrounds
- [ ] Borders are **2px thick** (vs 1px normal)
- [ ] Focus indicators are **4px thick** (vs 2px normal)

### Contrast Check
1. Open Chrome DevTools
2. Right-click any text → Inspect
3. Look for contrast ratio in inspector
4. Should show **21:1** or higher ✅

---

## ⌨️ Keyboard Navigation Testing

### Initial Load
1. Open app in browser
2. Press **Tab** once
3. Should see **"Skip to main content"** link appear at top-left
4. Press **Enter** → should jump to main content

### Full Navigation
1. Press **Tab** repeatedly
2. Check focus order:
   ```
   Skip Link → Help → Export → Import → Theme → Contrast
   → Protocol Dashboard cards (4)
   → Service selector
   → Parameters input
   → Send button
   → Response history items
   → etc.
   ```
3. Press **Shift+Tab** → should reverse direction
4. All focus indicators should be **clearly visible**

### Shortcuts
- [ ] Press **F1** → Help modal opens
- [ ] Press **Escape** (in modal) → Modal closes
- [ ] **Enter/Space** on buttons → Activates button

---

## 📐 Breakpoint Testing

### Extra Small (320px)
```
Chrome DevTools → Responsive Design Mode
Width: 320px
```
- [ ] No horizontal scroll
- [ ] Text readable (14px body)
- [ ] Buttons slightly smaller but still **≥ 44x44px**
- [ ] All content visible

### Small Mobile (375px - iPhone SE)
```
Select "iPhone SE" in DevTools
```
- [ ] Hamburger menu works
- [ ] Touch targets feel comfortable
- [ ] No zoom on input focus
- [ ] All features accessible

### Medium Mobile (414px - iPhone 12/13)
```
Select "iPhone 12 Pro" in DevTools
```
- [ ] More breathing room
- [ ] Same layout as 375px
- [ ] Better readability

### Tablet (768px)
```
Select "iPad" in DevTools
```
- [ ] Still shows hamburger menu
- [ ] Slightly larger touch targets (40px)
- [ ] More columns in grids
- [ ] Comfortable spacing

### Desktop (1024px+)
```
Set width to 1280px or larger
```
- [ ] Full desktop navigation
- [ ] 2-column main layout
- [ ] All buttons in header
- [ ] Hover effects work

---

## 🧪 Reduced Motion Testing

### Enable in OS
**Windows:**
- Settings → Accessibility → Visual effects → Animation effects → Off

**macOS:**
- System Preferences → Accessibility → Display → Reduce motion

**Linux:**
- Settings → Accessibility → Reduce animations

### Visual Checks
- [ ] No pulse/glow animations
- [ ] No gradient shifts
- [ ] Instant fade-ins (no delay)
- [ ] No smooth scrolling
- [ ] Transitions are instant (0.01ms)

---

## 📱 Real Device Testing

### iOS Testing
**Devices to test:**
- iPhone SE (small screen)
- iPhone 12/13/14 (standard)
- iPad (tablet)

**Checks:**
- [ ] Safari renders correctly
- [ ] No zoom on input focus (16px font working)
- [ ] Pinch-to-zoom works
- [ ] Touch targets feel right
- [ ] Scrolling is smooth
- [ ] Hamburger menu works

### Android Testing
**Devices to test:**
- Small phone (< 400px)
- Standard phone (400-450px)
- Large phone (> 450px)
- Tablet

**Browsers to test:**
- Chrome
- Firefox
- Samsung Internet

**Checks:**
- [ ] Renders consistently across browsers
- [ ] Touch targets work
- [ ] No horizontal scroll
- [ ] Forms work correctly

---

## 🔍 Chrome DevTools Accessibility Audit

### Run Lighthouse
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"

### Target Scores
- [ ] **Accessibility: ≥ 90** (should be 95+)
- [ ] **Best Practices: ≥ 90**
- [ ] **SEO: ≥ 90**

### Common Issues to Fix
- Missing alt text → Add to all images
- Low contrast → Already fixed in high contrast mode
- Missing ARIA labels → Already added
- Form labels → Already associated

---

## 🎯 Quick Pass/Fail Checklist

### Desktop (1024px+)
- [ ] ✅ Full navigation visible
- [ ] ✅ 2-column layout
- [ ] ✅ Hover states work
- [ ] ✅ All buttons in header

### Mobile (< 768px)
- [ ] ✅ Hamburger menu works
- [ ] ✅ Single column layout
- [ ] ✅ Touch targets ≥ 44px
- [ ] ✅ No input zoom

### High Contrast
- [ ] ✅ Pure black/white colors
- [ ] ✅ No transparency/blur
- [ ] ✅ 2px borders
- [ ] ✅ 4px focus indicators

### Keyboard
- [ ] ✅ Skip link appears
- [ ] ✅ All interactive elements focusable
- [ ] ✅ Focus indicators visible
- [ ] ✅ Logical tab order

### Accessibility
- [ ] ✅ WCAG AA contrast (normal)
- [ ] ✅ WCAG AAA contrast (high)
- [ ] ✅ Screen reader friendly
- [ ] ✅ Reduced motion supported

---

## 🐛 Common Issues & Fixes

### Issue: Menu doesn't close on click
**Fix:** Check `onClick={() => { action(); setMobileMenuOpen(false); }}`

### Issue: Input zooms on iOS
**Fix:** Verify font-size is exactly **16px**, not 15px

### Issue: Horizontal scroll on mobile
**Fix:** Check all elements for fixed widths, use `max-w-full`

### Issue: Focus indicator not visible
**Fix:** Ensure `:focus-visible` has sufficient contrast

### Issue: High contrast not persisting
**Fix:** Check localStorage is enabled in browser

---

## 📊 Browser Compatibility Matrix

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ⏳ | ⏳ | Test :focus-visible |
| Safari | ⏳ | ⏳ | Test backdrop-filter |
| Edge | ⏳ | N/A | Should match Chrome |
| Samsung Internet | N/A | ⏳ | Test on Android |

---

## ✅ Final Verification

Before marking as complete:
1. [ ] Desktop layout perfect at 1920px
2. [ ] Mobile layout perfect at 375px
3. [ ] High contrast mode works
4. [ ] Keyboard navigation complete
5. [ ] No console errors
6. [ ] Skip link functional
7. [ ] Touch targets confirmed 44px
8. [ ] No zoom on iOS inputs
9. [ ] Lighthouse score ≥ 90
10. [ ] Documentation complete

---

**All checks passed?** → Week 5 is production ready! 🎉

**Issues found?** → Document in GitHub Issues and fix before deployment.

---

**Testing Guide Version:** 1.0.0  
**Last Updated:** October 4, 2025  
**Status:** Ready for testing
