# Theme Testing Guide - UDS Protocol Simulator

Complete guide for testing light and dark themes with automated scripts and manual checklists.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev playwright pngjs pixelmatch
npx playwright install chromium
```

### 2. Run Theme Tests

```bash
# Test local dev server (default: http://localhost:5173)
node theme-test-playwright.cjs

# Test specific URL
node theme-test-playwright.cjs http://localhost:4173

# Create visual diffs (run after main test)
node theme-test-visual-diff.cjs
```

### 3. Review Results

- **Report**: `results/report.json` - Full JSON report with all test data
- **Screenshots**: `results/{light,dark}-{desktop,mobile}.png`
- **Visual Diffs**: `results/diffs/{desktop,mobile}-diff.png`

---

## 📋 What Gets Tested

### Automated Checks

✅ **Theme Detection & Toggle**
- Detects theme toggle button
- Tests theme switching functionality
- Verifies localStorage/cookie persistence

✅ **Color Contrast (WCAG)**
- Body text contrast
- Button contrast (enabled & disabled)
- Input field contrast
- Header/footer contrast
- Code block contrast
- Checks against WCAG AA (4.5:1) and AAA (7.0:1)

✅ **Focus Visibility**
- Keyboard navigation (Tab key)
- Focus outline detection
- Outline color and width measurement

✅ **CSS Variables**
- Extracts all CSS custom properties
- Documents color tokens used

✅ **Visual Regression**
- Desktop screenshots (1366x768)
- Mobile screenshots (375x812)
- Pixel-by-pixel diff images

---

## 📊 Understanding the Report

### Sample `report.json` Structure

```json
{
  "url": "http://localhost:5173",
  "timestamp": "2025-11-30T08:14:06.000Z",
  "light": {
    "colors": {
      "mainText": {
        "found": true,
        "color": "#1a1a1a",
        "background": "#f5f5f5"
      }
    },
    "focus": {
      "tag": "BUTTON",
      "outlineColor": "rgb(0, 120, 212)",
      "outlineWidth": "2px"
    },
    "persistence": {
      "localStorage": ["theme"],
      "cookies": ""
    },
    "cssVars": {
      "--bg-primary": "#ffffff",
      "--text-primary": "#1a1a1a"
    },
    "toggleFound": true
  },
  "dark": { /* same structure */ },
  "checks": [
    {
      "theme": "light",
      "selector": "mainText",
      "fg": "#1a1a1a",
      "bg": "#f5f5f5",
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
- **pass**: Overall pass/fail for the check

---

## 🔍 Manual Testing Checklist

Use this checklist for human QA after automated tests:

### Theme Functionality
- [ ] Theme toggle is visible and discoverable
- [ ] Toggle has proper `aria-label` (e.g., "Toggle theme")
- [ ] Theme changes immediately when toggled
- [ ] Theme persists after page reload
- [ ] Theme persists across different routes
- [ ] OS-level `prefers-color-scheme` is respected initially

### Visual Quality
- [ ] All text is readable in both themes
- [ ] No "invisible" elements (e.g., black icons on dark bg)
- [ ] Images/logos have appropriate variants or filters
- [ ] Borders and dividers are visible
- [ ] Shadows enhance depth without causing confusion
- [ ] Gradients and effects work in both themes

### Interactive Elements
- [ ] Buttons have clear hover/active states
- [ ] Focus outlines are clearly visible (keyboard nav)
- [ ] Form inputs are usable and visible
- [ ] Disabled states are distinguishable
- [ ] Links are distinguishable from body text
- [ ] Selection highlighting is visible

### Components
- [ ] Modals/dialogs overlay correctly
- [ ] Toasts/notifications are readable
- [ ] Tooltips have sufficient contrast
- [ ] Code blocks use appropriate syntax highlighting
- [ ] Tables have readable row alternation
- [ ] Charts/graphs use theme-appropriate colors

### Third-Party Content
- [ ] Embedded widgets render acceptably
- [ ] iframes don't clash with theme
- [ ] Maps/external content is visible

### Edge Cases
- [ ] Print view is legible (if applicable)
- [ ] PDF export works (if applicable)
- [ ] High contrast mode compatibility (Windows)
- [ ] Reduced motion preferences respected

---

## 🛠️ Common Issues & Fixes

### ❌ Low Contrast Ratio

**Problem**: Text fails WCAG AA (< 4.5:1)

**Solutions**:
```css
/* Increase text color brightness or darken background */
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

**Solutions**:
```css
/* Option 1: Use currentColor in SVGs */
svg {
  fill: currentColor;
  color: var(--text-primary);
}

/* Option 2: Invert raster images */
[data-theme="dark"] img.icon {
  filter: invert(1);
}

/* Option 3: Provide theme-specific images */
.logo-light { display: block; }
.logo-dark { display: none; }

[data-theme="dark"] .logo-light { display: none; }
[data-theme="dark"] .logo-dark { display: block; }
```

### ❌ Missing Focus Outline

**Problem**: No visible focus indicator for keyboard navigation

**Solution**:
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

**Problem**: Theme resets on page reload

**Solution**:
```javascript
// Save theme preference
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

// Load theme on init (before render to avoid flash)
const savedTheme = localStorage.getItem('theme') 
  || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.setAttribute('data-theme', savedTheme)
```

### ❌ Flash of Wrong Theme (FOUT)

**Problem**: Brief flash of wrong theme on page load

**Solution**:
```html
<!-- Add inline script in <head> BEFORE any CSS -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') 
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
  })()
</script>
```

---

## 🎨 Best Practices

### 1. Use CSS Custom Properties

```css
:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border: #e0e0e0;
  --focus: #0078d4;
}

[data-theme="dark"] {
  /* Dark theme overrides */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border: #333333;
  --focus: #4cc2ff;
}

/* Use variables everywhere */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### 2. Semantic Color Naming

```css
/* ❌ Avoid color-based names */
--blue-500: #0078d4;
--gray-100: #f5f5f5;

/* ✅ Use semantic names */
--color-primary: #0078d4;
--color-surface: #f5f5f5;
--color-text: #1a1a1a;
```

### 3. Test with Real Content

- Use actual text lengths, not Lorem Ipsum
- Test with user-generated content (long names, special characters)
- Include edge cases (empty states, error states)

### 4. Accessibility First

- Always meet WCAG AA minimum (4.5:1 for normal text)
- Aim for AAA when possible (7.0:1)
- Test with keyboard navigation
- Test with screen readers

---

## 🚦 CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/theme-test.yml`:

```yaml
name: Theme Testing

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  theme-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install chromium
          
      - name: Build
        run: npm run build
        
      - name: Preview
        run: npm run preview &
        
      - name: Wait for server
        run: npx wait-on http://localhost:4173
        
      - name: Run theme tests
        run: node theme-test-playwright.cjs http://localhost:4173
        
      - name: Create visual diffs
        run: node theme-test-visual-diff.cjs
        
      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: theme-test-results
          path: results/
          
      - name: Comment PR
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs')
            const report = JSON.parse(fs.readFileSync('results/report.json', 'utf8'))
            const summary = report.summary
            
            const comment = `## 🎨 Theme Test Results
            
            - **Total Checks**: ${summary.totalChecks}
            - **Failures**: ${summary.failures.length}
            - **Warnings**: ${summary.warnings.length}
            
            ${summary.failures.length > 0 ? '### ❌ Failures\n' + summary.failures.map(f => 
              `- ${f.theme} - ${f.selector}: ${f.ratio}:1 (need 4.5:1)`
            ).join('\n') : '✅ All checks passed!'}
            
            [View full report in artifacts](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            })
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
3. Add new selectors to `inspectSelectors` in test script if needed
4. Update this guide with component-specific considerations

---

**Last Updated**: 2025-11-30
