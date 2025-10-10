# Color System Quick Reference

## 🎨 Color Palette Overview

### Theme Colors

#### Light Mode
```
Background:  #E3EDF7  (light-50)   - Main background
Panel:       #F7FAFB  (light-100)  - Cards & panels
Secondary:   #ECECEC  (light-200)  - Secondary panels
Border:      #E0E0E0  (light-300)  - Borders & dividers
Text:        #1A334D  (light-900)  - Primary text
```

#### Dark Mode
```
Background:  #0a0a0f  (dark-900)   - Main background
Panel Dark:  #131318  (dark-800)   - Cards & panels
Panel Mid:   #1a1a24  (dark-700)   - Interactive elements
Border:      #252530  (dark-600)   - Borders
Lighter:     #30303c  (dark-500)   - Hover states
Text:        #f3f4f6  (gray-100)   - Primary text
```

### Status Colors

| Status | Light Mode | Dark Mode | Use Case |
|--------|-----------|-----------|----------|
| 🔴 Critical | `#D32F2F` | `#FF4444` | Errors, critical alerts |
| 🟠 Warning | `#F57C00` | `#FFEB3B` | Warnings, cautions |
| 🟢 Success | `#43A047` | `#00C853` | Success, confirmations |
| 🔵 Info | `#1976D2` | `#42A5F5` | Information, tips |

### Cyber Accent Colors (Theme Independent)
```
Cyber Blue:    #00f3ff  - Primary accent
Cyber Purple:  #bf00ff  - Secondary accent
Cyber Pink:    #ff006e  - Tertiary accent
Cyber Green:   #00ff9f  - Success accent
Cyber Yellow:  #ffea00  - Warning accent
```

## 🛠️ Utility Classes

### Status Text Colors
```tsx
<div className="status-critical">Error message</div>
<div className="status-warning">Warning message</div>
<div className="status-success">Success message</div>
<div className="status-info">Info message</div>
```

### Status Backgrounds
```tsx
<div className="bg-status-critical border">Critical alert box</div>
<div className="bg-status-warning border">Warning alert box</div>
<div className="bg-status-success border">Success alert box</div>
<div className="bg-status-info border">Info alert box</div>
```

### Component Classes
```tsx
<div className="glass-panel">         {/* Auto-themed panel */}
<div className="glass-card">          {/* Auto-themed card */}
<button className="cyber-button">     {/* Auto-themed button */}
<input className="cyber-input">       {/* Auto-themed input */}
```

### Disabled States
```tsx
<button disabled className="text-disabled-light dark:text-disabled-dark">
```

### Secondary Text
```tsx
<p className="text-secondary-light dark:text-secondary-dark">Helper text</p>
```

## ✅ Best Practices

### 1. Always Use Semantic Status Classes
```tsx
// ❌ Bad
<div className="text-red-500">Error occurred</div>

// ✅ Good
<div className="status-critical">Error occurred</div>
```

### 2. Include Icons with Status
```tsx
// ❌ Bad
<div className="status-critical">Connection failed</div>

// ✅ Good
<div className="flex items-center gap-2 status-critical">
  <span aria-hidden="true">⚠️</span>
  <span>Connection failed</span>
</div>
```

### 3. Use Theme-Aware Colors
```tsx
// ❌ Bad - Hard-coded color
<div className="bg-white text-black">Content</div>

// ✅ Good - Theme-aware
<div className="bg-light-100 dark:bg-dark-800 text-light-900 dark:text-gray-100">
  Content
</div>

// ✅ Better - Use utility class
<div className="glass-panel">Content</div>
```

### 4. Proper Contrast
```tsx
// ❌ Bad - Poor contrast
<div className="text-gray-400">Important text</div>

// ✅ Good - Accessible contrast
<div className="text-light-900 dark:text-gray-100">Important text</div>
<div className="text-secondary-light dark:text-secondary-dark">Helper text</div>
```

## 📊 Contrast Ratios (WCAG)

| Element | Light Mode | Dark Mode | Standard |
|---------|-----------|-----------|----------|
| Body Text | ~8:1 | ~15:1 | ✅ AAA |
| Critical | ~6:1 | ~7:1 | ✅ AA/AAA |
| Warning | ~5:1 | ~12:1 | ✅ AA/AAA |
| Success | ~5:1 | ~8:1 | ✅ AA/AAA |
| Info | ~5:1 | ~7:1 | ✅ AA/AAA |
| Disabled | ~6:1 | ~6:1 | ✅ AA |

## 🎯 Common Patterns

### Alert Box
```tsx
<div 
  className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-status-critical"
  role="alert"
>
  <span className="text-xl" aria-hidden="true">⚠️</span>
  <div>
    <p className="font-bold">Error</p>
    <p className="text-sm">Connection to ECU failed</p>
  </div>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border bg-status-success">
  <span aria-hidden="true">✓</span>
  <span>Active</span>
</span>
```

### Info Card
```tsx
<div className="glass-card p-4">
  <div className="flex items-start gap-3">
    <span className="text-2xl status-info" aria-hidden="true">ℹ️</span>
    <div>
      <h3 className="font-bold text-lg mb-2">Did you know?</h3>
      <p className="text-secondary-light dark:text-secondary-dark">
        UDS is the standard diagnostic protocol for automotive systems.
      </p>
    </div>
  </div>
</div>
```

## 🔧 Tailwind Config Reference

```javascript
// Using status colors in custom components
import { theme } from './tailwind.config'

const criticalColor = theme.colors.status.critical.dark  // '#FF4444'
const warningColor = theme.colors.status.warning.light   // '#F57C00'
```

## 🧪 Testing

### Color Blindness Simulators
- Chrome DevTools > Rendering > Emulate vision deficiencies
- Stark plugin for Chrome/Figma
- Coblis Color Blindness Simulator

### Contrast Checkers
- WebAIM: https://webaim.org/resources/contrastchecker/
- Chrome DevTools Color Picker
- Contrast Ratio: https://contrast-ratio.com/

## 📚 Related Documentation

- `COLOR_PALETTE_CORRECTIONS.md` - Full implementation details
- `COLOR_CONTRAST_AUDIT.md` - WCAG compliance audit
- `COLOR_BLIND_ACCESSIBILITY.md` - Accessibility guidelines
- `Color_review.md` - Original review and recommendations

---

**Quick Tip:** When in doubt, use the semantic utility classes (`.status-*`, `.glass-*`, `.cyber-*`) - they're pre-configured for accessibility and theme support!
