# Light Theme Background - Quick Reference

## 🎨 Color Quick Lookup

### Background Colors
```css
/* Main App Background */
[data-theme="light"]: linear-gradient(135deg, #F0F4F8, #E3EDF7, #D6E4F0)

/* Panels & Cards */
bg-dark-900     → #FFFFFF (Pure white)
bg-dark-800     → #FFFFFF (Pure white)
bg-dark-700     → #F7FAFB (Very light blue-gray)
bg-dark-600     → #ECECEC (Light gray)

/* Semi-transparent */
bg-dark-800/50  → rgba(255, 255, 255, 0.95)
bg-dark-800/60  → rgba(255, 255, 255, 0.95)
bg-dark-700/50  → rgba(247, 250, 251, 0.8)
bg-dark-900/50  → rgba(255, 255, 255, 0.9)
```

### Text Colors
```css
text-gray-100   → #1A334D (Dark navy)
text-gray-200   → #1A334D (Dark navy)
text-gray-300   → #475569 (Slate gray)
text-gray-400   → #475569 (Slate gray)
text-gray-500   → #64748b (Medium slate)
```

### Border Colors
```css
border-dark-600       → #D0D7DE
border-dark-700       → #C0C7CE
border-slate-700/30   → rgba(192, 199, 206, 0.5)
```

### Hover States
```css
hover:bg-dark-600     → #E3EDF7
hover:bg-dark-700     → #F0F4F8
hover:bg-dark-800/80  → rgba(255, 255, 255, 0.98)
```

## 🚀 Quick Implementation

### Method 1: Automatic (Recommended)
No changes needed! The CSS overrides handle everything:
```tsx
// This works automatically in both themes
<div className="bg-dark-800 text-gray-100">
  Content
</div>
```

### Method 2: Theme-Specific Classes
For new components, use Tailwind's theme utilities:
```tsx
<div className="bg-white dark:bg-dark-800 text-light-900 dark:text-gray-100">
  Content
</div>
```

## 📋 Testing Checklist

- [ ] Background is light blue gradient
- [ ] Panels/cards are white or very light
- [ ] Text is dark navy blue
- [ ] Borders are visible gray
- [ ] Hover states are lighter blue-gray
- [ ] Theme toggle transitions smoothly (300ms)
- [ ] No dark theme elements visible

## 🔍 Debugging Tips

### Background Still Dark?
1. Check `[data-theme="light"]` is set on `<html>` or `<body>`
2. Clear browser cache (Ctrl+Shift+R)
3. Check CSS file is loaded after Tailwind

### Text Not Readable?
- All text should be `#1A334D` or darker
- Check for hardcoded text colors
- Verify contrast ratio ≥ 4.5:1

### Borders Not Visible?
- Should be `#D0D7DE` or darker
- Verify border-width ≥ 1px
- Check border-color overrides are applied

## 📊 Color Values Reference

| Variable | Hex | RGB | Use Case |
|----------|-----|-----|----------|
| `light-50` | `#E3EDF7` | `227, 237, 247` | Main background |
| `light-100` | `#F7FAFB` | `247, 250, 251` | Panel background |
| `light-150` | `#F0F4F8` | `240, 244, 248` | Secondary surface |
| `light-200` | `#ECECEC` | `236, 236, 236` | Tertiary surface |
| `light-300` | `#D0D7DE` | `208, 215, 222` | Borders |
| `light-350` | `#C0C7CE` | `192, 199, 206` | Strong borders |
| `light-900` | `#1A334D` | `26, 51, 77` | Primary text |

## 🎯 Common Patterns

### Card Component
```tsx
<div className="glass-panel p-6">
  {/* Automatically white in light theme */}
</div>
```

### Button Component  
```tsx
<button className="cyber-button">
  {/* Automatically light blue in light theme */}
</button>
```

### Input Component
```tsx
<input className="cyber-input" />
{/* Automatically white background in light theme */}
```

## ⚡ Performance Notes

- All styling is CSS-only (no JS overhead)
- Uses CSS cascade for efficiency
- Transitions are GPU-accelerated
- No runtime color calculations

## 🔗 Related Files

- `tailwind.config.js` - Color definitions
- `src/index.css` - Theme overrides
- `src/App.tsx` - Main background gradient
- `LIGHT_THEME_BACKGROUND_REDESIGN.md` - Full documentation
- `docs/design/LIGHT_THEME_BACKGROUND_VISUAL_GUIDE.md` - Visual guide

## 📞 Support

Issues? Check:
1. Dev server is running: `npm run dev`
2. Browser DevTools > Elements > Check `[data-theme]` attribute
3. Browser DevTools > Network > Verify CSS loaded
4. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-10  
**Status:** ✅ Production Ready
