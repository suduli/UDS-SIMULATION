# 🎨 Theme Testing Suite - UDS Protocol Simulator

Complete automated and manual testing solution for light and dark themes with WCAG compliance checking.

## 📦 What's Included

This theme testing suite provides:

✅ **Automated Testing**
- Playwright-based theme testing script
- WCAG AA/AAA contrast ratio checking
- Visual regression testing with pixel-perfect diffs
- CSS custom property extraction
- Focus outline visibility testing
- Theme persistence verification

✅ **Documentation**
- Comprehensive testing guide ([THEME_TESTING.md](./THEME_TESTING.md))
- Manual testing checklist ([THEME_CHECKLIST.md](./THEME_CHECKLIST.md))
- Test results summary ([THEME_TEST_RESULTS.md](./THEME_TEST_RESULTS.md))
- Common issues and fixes

✅ **CI/CD Integration**
- GitHub Actions workflow
- Automated PR comments with results
- Screenshot and report artifacts

---

## 🚀 Quick Start

### 1. Install Dependencies (Already Done ✓)

```bash
npm install --save-dev playwright pngjs pixelmatch
npx playwright install chromium
```

### 2. Run Tests

```bash
# Test local dev server (default: http://localhost:5173)
npm run test:theme

# Create visual diffs
npm run test:theme:diff

# Run both
npm run test:theme:all

# Test specific URL
node theme-test-playwright.cjs http://localhost:4173
```

### 3. Review Results

- **Report**: `results/report.json`
- **Screenshots**: `results/*.png`
- **Visual Diffs**: `results/diffs/*.png`
- **Summary**: [THEME_TEST_RESULTS.md](./THEME_TEST_RESULTS.md)

---

## 📋 Files Overview

### Scripts

| File | Purpose |
|------|---------|
| `theme-test-playwright.cjs` | Main automated testing script |
| `theme-test-visual-diff.cjs` | Visual regression diff generator |

### Documentation

| File | Purpose |
|------|---------|
| `THEME_TESTING.md` | Complete testing guide with best practices |
| `THEME_CHECKLIST.md` | Printable manual testing checklist |
| `THEME_TEST_RESULTS.md` | Latest test results and recommendations |
| `README_THEME_TESTING.md` | This file - overview and quick start |

### CI/CD

| File | Purpose |
|------|---------|
| `.github/workflows/theme-test.yml` | GitHub Actions workflow |

---

## 🔍 What Gets Tested

### Automated Checks

✅ **Theme Detection**
- Finds and clicks theme toggle
- Verifies theme switching works
- Checks localStorage/cookie persistence

✅ **Color Contrast (WCAG)**
- Body text: 4.5:1 minimum (AA)
- Large text: 3.0:1 minimum (AA)
- UI components: 3.0:1 minimum
- AAA compliance: 7.0:1 for normal text

✅ **Accessibility**
- Keyboard navigation (Tab key)
- Focus outline visibility
- Focus outline color and width
- Semantic HTML structure

✅ **Visual Regression**
- Desktop screenshots (1366x768)
- Mobile screenshots (375x812)
- Pixel-by-pixel diff images
- Percentage difference calculation

✅ **CSS Architecture**
- Extracts all CSS custom properties
- Documents color tokens
- Verifies design system usage

---

## 📊 Understanding Results

### Report Structure

```json
{
  "url": "http://localhost:5173",
  "timestamp": "2025-11-30T08:18:25.042Z",
  "light": {
    "colors": { /* Computed colors for key elements */ },
    "focus": { /* Focus outline details */ },
    "persistence": { /* localStorage/cookies */ },
    "cssVars": { /* CSS custom properties */ },
    "toggleFound": true/false,
    "screenshots": { /* Screenshot paths */ }
  },
  "dark": { /* Same structure as light */ },
  "checks": [
    {
      "theme": "light",
      "selector": "mainText",
      "fg": "#1a1a1a",
      "bg": "#ffffff",
      "ratio": 11.24,
      "wcagAA": true,
      "wcagAAA": true,
      "pass": true
    }
  ],
  "summary": {
    "pass": true,
    "totalChecks": 12,
    "failures": [],
    "warnings": [],
    "suggestions": []
  }
}
```

### Key Metrics

- **ratio**: Contrast ratio (higher is better)
- **wcagAA**: Passes WCAG AA (4.5:1 minimum)
- **wcagAAA**: Passes WCAG AAA (7.0:1 minimum)
- **pass**: Overall pass/fail

---

## 🛠️ Common Issues & Fixes

### ❌ Low Contrast

**Problem**: Text fails WCAG AA (< 4.5:1)

**Fix**:
```css
:root {
  --text-primary: #1a1a1a; /* Darker text */
  --bg-primary: #ffffff;   /* Lighter background */
}

[data-theme="dark"] {
  --text-primary: #e0e0e0; /* Lighter text */
  --bg-primary: #0a0a0a;   /* Darker background */
}
```

### ❌ Invisible Icons

**Problem**: Black icons disappear on dark backgrounds

**Fix**:
```css
/* Use currentColor in SVGs */
svg {
  fill: currentColor;
  color: var(--text-primary);
}

/* Or invert raster images */
[data-theme="dark"] img.icon {
  filter: invert(1);
}
```

### ❌ Missing Focus Outline

**Problem**: No visible focus indicator

**Fix**:
```css
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

:root {
  --focus-color: #0078d4;
}

[data-theme="dark"] {
  --focus-color: #4cc2ff;
}
```

### ❌ Theme Not Persisting

**Problem**: Theme resets on reload

**Fix**:
```typescript
const setTheme = (theme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

// Load on init
useEffect(() => {
  const saved = localStorage.getItem('theme') as 'light' | 'dark'
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light'
  setTheme(saved || system)
}, [])
```

---

## 🎯 Best Practices

### 1. Use CSS Custom Properties

```css
:root {
  /* Semantic naming */
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent: #0078d4;
}

[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --text-primary: #e0e0e0;
  --accent: #4cc2ff;
}
```

### 2. Prevent Flash of Unstyled Content

```html
<!-- In <head> before any CSS -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') 
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
  })()
</script>
```

### 3. Accessible Theme Toggle

```tsx
<button 
  data-theme-toggle
  aria-label="Toggle theme"
  onClick={handleThemeToggle}
>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

### 4. Test with Real Content

- Use actual text lengths
- Test with user-generated content
- Include edge cases (empty states, errors)

---

## 🚦 CI/CD Integration

The GitHub Actions workflow (`.github/workflows/theme-test.yml`) automatically:

1. ✅ Runs on every PR and push to main
2. ✅ Builds and previews the application
3. ✅ Executes theme tests
4. ✅ Creates visual diffs
5. ✅ Uploads screenshots and reports as artifacts
6. ✅ Comments on PRs with test results

### Example PR Comment

```markdown
## 🎨 Theme Test Results

- **Total Checks**: 12
- **Failures**: 0 ❌
- **Warnings**: 2 ⚠️
- **Overall**: ✅ PASS

### ⚠️ Warnings (AA but not AAA)
- **light** - primaryButton: 5.2:1 (Meets AA but not AAA 7.0:1)
- **dark** - input: 6.8:1 (Meets AA but not AAA 7.0:1)

📸 [View screenshots and full report in artifacts](...)
```

---

## 📚 Additional Resources

- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Playwright Documentation](https://playwright.dev/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

---

## 🤝 Contributing

When adding new UI components:

1. Run theme tests before committing
2. Ensure all new elements pass WCAG AA
3. Add new selectors to test script if needed
4. Update documentation

---

## 📝 Current Status

**Last Test Run**: 2025-11-30T08:18:25.042Z  
**Status**: ⚠️ Needs Attention  
**Details**: See [THEME_TEST_RESULTS.md](./THEME_TEST_RESULTS.md)

### Key Findings

- ✅ Code blocks have excellent contrast (14.73:1)
- ❌ Missing semantic HTML elements
- ❌ No theme toggle detected
- ❌ No theme persistence
- ❌ No CSS custom properties found

### Immediate Actions Required

1. Add semantic HTML structure (`<header>`, `<nav>`, `<main>`, `<footer>`)
2. Implement theme toggle button with proper ARIA labels
3. Add theme persistence with localStorage
4. Define CSS custom properties for theming

---

## 🎓 Learning Resources

### For Developers

- **THEME_TESTING.md** - Complete guide with code examples
- **theme-test-playwright.cjs** - Well-commented test script
- **Common Issues & Fixes** - Section above

### For QA/Testers

- **THEME_CHECKLIST.md** - Printable manual testing checklist
- **THEME_TEST_RESULTS.md** - Latest automated test results
- **Issue Template** - In THEME_CHECKLIST.md

---

## 💬 Support

For questions or issues:

1. Check [THEME_TESTING.md](./THEME_TESTING.md) for detailed documentation
2. Review [THEME_TEST_RESULTS.md](./THEME_TEST_RESULTS.md) for current status
3. See common issues and fixes above

---

**Version**: 1.0  
**Last Updated**: 2025-11-30  
**Maintainer**: UDS Protocol Simulator Team
