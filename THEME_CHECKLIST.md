# Theme Testing Checklist

Quick reference for manual theme testing. Print this out or keep it handy during QA.

## 🎨 Visual Quality

### Light Theme
- [ ] Background is light and comfortable to read
- [ ] Text is dark enough for good contrast
- [ ] All images/icons are visible
- [ ] Borders and dividers are visible
- [ ] Shadows enhance depth appropriately
- [ ] No "washed out" colors

### Dark Theme
- [ ] Background is dark but not pure black (#000000)
- [ ] Text is light enough for good contrast
- [ ] All images/icons are visible (not invisible black on dark)
- [ ] Borders and dividers are visible
- [ ] Shadows work with dark background
- [ ] No eye-straining bright colors

## 🔘 Interactive Elements

### Buttons
- [ ] Primary buttons have clear hover state
- [ ] Primary buttons have clear active/pressed state
- [ ] Disabled buttons are visually distinct
- [ ] Button text meets contrast requirements
- [ ] Focus outline is visible when tabbing

### Form Inputs
- [ ] Input fields are clearly visible
- [ ] Placeholder text is readable
- [ ] Input text has good contrast
- [ ] Focus state is clear
- [ ] Error states are visible and distinct
- [ ] Disabled inputs are visually distinct

### Links
- [ ] Links are distinguishable from body text
- [ ] Hover state is clear
- [ ] Visited links are distinguishable (if applicable)
- [ ] Focus outline is visible

## ⌨️ Keyboard Navigation

- [ ] Tab key moves focus to interactive elements
- [ ] Focus outline is clearly visible in both themes
- [ ] Focus order is logical
- [ ] Skip links work (if present)
- [ ] All interactive elements are keyboard accessible

## 🎯 Theme Functionality

- [ ] Theme toggle button is visible and discoverable
- [ ] Toggle has proper label (aria-label or visible text)
- [ ] Clicking toggle switches theme immediately
- [ ] Theme persists after page reload
- [ ] Theme persists across different routes/pages
- [ ] OS-level theme preference is respected initially
- [ ] No flash of wrong theme on page load (FOUC)

## 📱 Responsive Design

### Desktop (1366x768+)
- [ ] Layout is appropriate for large screens
- [ ] All elements are visible and accessible
- [ ] Text is readable at normal viewing distance

### Tablet (768x1024)
- [ ] Layout adapts appropriately
- [ ] Touch targets are large enough (44x44px minimum)
- [ ] All functionality is accessible

### Mobile (375x812)
- [ ] Layout is mobile-friendly
- [ ] Text is readable without zooming
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling
- [ ] Theme toggle is accessible

## 🧩 Components

### Navigation
- [ ] Nav items are visible in both themes
- [ ] Active/current page is clearly indicated
- [ ] Hover states work
- [ ] Mobile menu works (if applicable)

### Cards/Panels
- [ ] Card backgrounds are distinct from page background
- [ ] Card borders are visible (if used)
- [ ] Card shadows work in both themes
- [ ] Card text is readable

### Modals/Dialogs
- [ ] Modal overlay is visible
- [ ] Modal content is readable
- [ ] Close button is visible and accessible
- [ ] Focus is trapped in modal when open
- [ ] Modal works in both themes

### Toasts/Notifications
- [ ] Notifications are visible
- [ ] Text is readable
- [ ] Icons are visible
- [ ] Different types (success, error, warning) are distinguishable

### Code Blocks
- [ ] Code text is readable
- [ ] Syntax highlighting works in both themes
- [ ] Background is distinct from page
- [ ] Copy button is visible (if present)

### Tables
- [ ] Headers are clearly distinct
- [ ] Row alternation is visible (if used)
- [ ] Borders are visible
- [ ] Cell text is readable

## ♿ Accessibility

### Contrast
- [ ] Normal text: minimum 4.5:1 (WCAG AA)
- [ ] Large text (18pt+): minimum 3.0:1 (WCAG AA)
- [ ] UI components: minimum 3.0:1
- [ ] Aim for 7.0:1 for AAA compliance

### Screen Readers
- [ ] Theme toggle has proper aria-label
- [ ] Current theme is announced (aria-live region)
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Headings are in logical order

### Motion
- [ ] Respect `prefers-reduced-motion`
- [ ] Animations can be disabled
- [ ] No auto-playing videos/animations

## 🔍 Edge Cases

- [ ] Very long text doesn't break layout
- [ ] Empty states are visible
- [ ] Loading states are visible
- [ ] Error states are visible
- [ ] Disabled states are distinguishable
- [ ] Selected/active states are clear

## 🖨️ Print & Export

- [ ] Print preview is legible (if applicable)
- [ ] PDF export works (if applicable)
- [ ] Print styles respect theme or use light theme

## 🌐 Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Automated Tests

- [ ] Run `npm run test:theme`
- [ ] Review `results/report.json`
- [ ] Check screenshots in `results/`
- [ ] Review visual diffs in `results/diffs/`
- [ ] All WCAG AA checks pass
- [ ] No critical issues in report

---

## ✅ Sign-off

**Tester**: ___________________________  
**Date**: ___________________________  
**Theme**: ⬜ Light  ⬜ Dark  ⬜ Both  
**Status**: ⬜ Pass  ⬜ Fail  ⬜ Needs Work  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

## 📝 Issue Template

If you find issues, use this template:

```
**Issue**: [Brief description]
**Theme**: Light / Dark / Both
**Component**: [Button, Input, Modal, etc.]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Screenshot**: [Attach if possible]
**Suggested Fix**: [If you have one]
```

---

**Last Updated**: 2025-11-30  
**Version**: 1.0
