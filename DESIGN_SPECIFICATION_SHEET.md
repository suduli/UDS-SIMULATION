# Design Specification Sheet

## Precise Measurements & Specifications

This document provides exact pixel values, hex codes, and CSS properties for pixel-perfect implementation.

---

## 📐 Layout Specifications

### Grid System
```css
.card-container {
  display: grid;
  gap: 24px;
  margin-top: 24px;
  margin-bottom: 80px;
}

/* Mobile: < 640px */
@media (max-width: 639px) {
  .card-container {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 60px;
  }
}

/* Tablet: 640px - 1023px */
@media (min-width: 640px) and (max-width: 1023px) {
  .card-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .card-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

/* Large Desktop: >= 1440px */
@media (min-width: 1440px) {
  .card-container {
    gap: 32px;
  }
}
```

---

## 🎨 Color Palette (Exact Values)

### Primary Colors
```css
/* Session Stats - Cyan Theme */
--cyan-900: rgb(8, 51, 68);      /* #083344 */
--cyan-500: rgb(6, 182, 212);    /* #06b6d4 */
--cyan-400: rgb(34, 211, 238);   /* #22d3ee */
--cyan-300: rgb(103, 232, 249);  /* #67e8f9 */

/* Learning Center - Purple Theme */
--purple-900: rgb(76, 29, 149);   /* #4c1d95 */
--purple-500: rgb(168, 85, 247);  /* #a855f7 */
--purple-400: rgb(192, 132, 252); /* #c084fc */
--purple-300: rgb(216, 180, 254); /* #d8b4fe */

/* DTC Management - Orange Theme */
--orange-900: rgb(124, 45, 18);   /* #7c2d12 */
--orange-500: rgb(249, 115, 22);  /* #f97316 */
--orange-400: rgb(251, 146, 60);  /* #fb923c */
--orange-300: rgb(253, 186, 116); /* #fdba74 */
```

### Status Colors
```css
/* Success States */
--green-900: rgb(20, 83, 45);     /* #14532d */
--green-500: rgb(16, 185, 129);   /* #10b981 */
--green-400: rgb(52, 211, 153);   /* #34d399 */

/* Warning States */
--yellow-900: rgb(120, 53, 15);   /* #78350f */
--yellow-500: rgb(245, 158, 11);  /* #f59e0b */
--yellow-400: rgb(251, 191, 36);  /* #fbbf24 */

/* Error States */
--red-900: rgb(127, 29, 29);      /* #7f1d1d */
--red-500: rgb(239, 68, 68);      /* #ef4444 */
--red-400: rgb(248, 113, 113);    /* #f87171 */

/* Info States */
--blue-900: rgb(30, 58, 138);     /* #1e3a8a */
--blue-500: rgb(59, 130, 246);    /* #3b82f6 */
--blue-400: rgb(96, 165, 250);    /* #60a5fa */
```

### Neutral Colors
```css
/* Backgrounds */
--dark-900: rgb(10, 10, 15);      /* #0a0a0f */
--dark-800: rgb(19, 19, 24);      /* #131318 */
--dark-700: rgb(26, 26, 36);      /* #1a1a24 */
--dark-600: rgb(37, 37, 48);      /* #252530 */

/* Text */
--white: rgb(255, 255, 255);      /* #ffffff */
--gray-300: rgb(203, 213, 225);   /* #cbd5e1 */
--gray-400: rgb(148, 163, 184);   /* #94a3b8 */
--gray-500: rgb(100, 116, 139);   /* #64748b */
--gray-600: rgb(71, 85, 105);     /* #475569 */

/* Borders */
--slate-700: rgb(51, 65, 85);     /* #334155 */
--slate-800: rgb(30, 41, 59);     /* #1e293b */
```

---

## 📏 Typography Scale

### Font Sizes
```css
/* Display */
--text-4xl: 36px;   /* line-height: 40px */
--text-3xl: 30px;   /* line-height: 36px */
--text-2xl: 24px;   /* line-height: 32px */

/* Headings */
--text-xl: 20px;    /* line-height: 28px */
--text-lg: 18px;    /* line-height: 28px */
--text-base: 16px;  /* line-height: 24px */
--text-sm: 14px;    /* line-height: 20px */

/* Small Text */
--text-xs: 12px;    /* line-height: 16px */
--text-2xs: 10px;   /* line-height: 14px */
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Font Family
```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;
```

### Usage
```css
/* Card Title */
h3 {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: -0.01em;
}

/* Metric Value */
.metric-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.02em;
}

/* Body Text */
p, .text-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

/* Label Text */
.label {
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 🎴 Card Specifications

### Glass Card Base
```css
.glass-card {
  /* Sizing */
  width: 100%;
  min-height: 400px;
  padding: 24px;
  
  /* Border */
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 24px;
  
  /* Background */
  background: linear-gradient(
    140deg,
    rgba(15, 23, 42, 0.94),
    rgba(9, 14, 26, 0.88)
  );
  
  /* Blur Effect */
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  
  /* Shadow */
  box-shadow: 
    0 24px 64px rgba(2, 6, 23, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  
  /* Transition */
  transition: 
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 28px 70px rgba(2, 6, 23, 0.55),
    0 0 32px var(--card-border-glow);
}
```

### Gradient Border
```css
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: linear-gradient(
    140deg,
    var(--card-border-start),
    var(--card-border-end)
  );
  mask: linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box,
                linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
  opacity: 0.95;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.glass-card:hover::before {
  opacity: 1;
}
```

### Glow Effect
```css
.glass-card::after {
  content: '';
  position: absolute;
  inset: -25%;
  border-radius: 45% 55% 50% 60%;
  background: radial-gradient(
    70% 60% at 50% 0%,
    var(--card-border-glow),
    transparent 75%
  );
  filter: blur(24px);
  opacity: 0.6;
  pointer-events: none;
  transition: 
    opacity 0.3s ease,
    filter 0.3s ease;
  z-index: 0;
}

.glass-card:hover::after {
  opacity: 0.85;
  filter: blur(30px);
}
```

---

## 📊 Component Measurements

### Header Section
```css
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--icon-start), var(--icon-end));
}

.card-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  margin: 0;
}

.card-subtitle {
  font-size: 12px;
  color: rgb(100, 116, 139);
  line-height: 16px;
  margin: 0;
}
```

### Metric Row
```css
.metric-row {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgb(51, 65, 85);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  transition: 
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.metric-row:hover {
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-2px);
}

.metric-label {
  font-size: 12px;
  color: rgb(148, 163, 184);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
}

.metric-context {
  font-size: 12px;
  color: rgb(100, 116, 139);
  margin-top: 4px;
}
```

### Progress Bar
```css
.progress-container {
  width: 100%;
  height: 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--progress-start), var(--progress-end));
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animated variant */
@keyframes progressFill {
  from { width: 0%; }
  to { width: var(--progress-value); }
}

.progress-fill.animate {
  animation: progressFill 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

### Buttons
```css
.button-primary {
  /* Sizing */
  height: 40px;
  padding: 0 16px;
  min-width: 80px;
  
  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  
  /* Colors */
  background: rgba(var(--button-color-rgb), 0.2);
  border: 1px solid rgba(var(--button-color-rgb), 0.5);
  color: rgb(var(--button-color-rgb));
  
  /* Border */
  border-radius: 8px;
  
  /* Transition */
  transition: 
    background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Interaction */
  cursor: pointer;
  user-select: none;
}

.button-primary:hover {
  background: rgba(var(--button-color-rgb), 0.3);
}

.button-primary:active {
  transform: scale(0.98);
}

.button-primary:focus-visible {
  outline: 2px solid rgb(0, 243, 255);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 243, 255, 0.2);
}

/* Mobile: Larger touch target */
@media (max-width: 639px) {
  .button-primary {
    height: 44px;
    min-width: 44px;
    padding: 0 16px;
    font-size: 16px;
  }
}
```

### Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  border: 1px solid;
}

/* Severity Badges */
.badge-critical {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: rgb(239, 68, 68);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: rgb(245, 158, 11);
}

.badge-info {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: rgb(59, 130, 246);
}

/* Difficulty Badges */
.badge-beginner {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  color: rgb(16, 185, 129);
}

.badge-intermediate {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: rgb(245, 158, 11);
}

.badge-advanced {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: rgb(239, 68, 68);
}
```

---

## 🎬 Animation Specifications

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
```css
--duration-instant: 0ms;
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Keyframe Animations
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  from {
    background-position: -200% 0;
  }
  to {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 📱 Responsive Breakpoints

### Touch Targets (Mobile)
```css
/* Minimum touch target size: 44×44px (WCAG 2.5.5) */
@media (max-width: 639px) {
  button,
  a[role="button"],
  input,
  select,
  .interactive {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Prevent iOS zoom on input focus */
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}
```

### Spacing Adjustments
```css
/* Mobile: Reduced spacing */
@media (max-width: 639px) {
  .glass-card {
    padding: 16px;
  }
  
  .metric-row {
    padding: 10px;
    margin-bottom: 12px;
  }
  
  .card-header {
    margin-bottom: 16px;
  }
}

/* Tablet: Moderate spacing */
@media (min-width: 640px) and (max-width: 1023px) {
  .glass-card {
    padding: 20px;
  }
}

/* Desktop: Full spacing */
@media (min-width: 1024px) {
  .glass-card {
    padding: 24px;
  }
}

/* Large Desktop: Generous spacing */
@media (min-width: 1440px) {
  .glass-card {
    padding: 28px;
  }
}
```

---

## ♿ Accessibility Specifications

### Focus Indicators
```css
/* Default focus (keyboard navigation) */
*:focus-visible {
  outline: 2px solid rgb(0, 243, 255);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Enhanced focus for interactive elements */
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible {
  outline: 3px solid rgb(0, 243, 255);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 243, 255, 0.2);
}

/* Form inputs */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgb(0, 243, 255);
  outline-offset: 0;
  box-shadow: 0 0 0 4px rgba(0, 243, 255, 0.15);
}

/* Card focus-within */
.glass-card:focus-within {
  border-color: rgb(0, 243, 255);
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
}
```

### Color Contrast Ratios
```css
/* WCAG AA Compliance (4.5:1 minimum) */

/* Primary text on dark background */
color: rgb(255, 255, 255);           /* White on Dark-900: 18.5:1 ✅ */

/* Secondary text on dark background */
color: rgb(203, 213, 225);           /* Gray-300 on Dark-900: 12.8:1 ✅ */

/* Tertiary text on dark background */
color: rgb(148, 163, 184);           /* Gray-400 on Dark-900: 8.2:1 ✅ */

/* Interactive cyan on dark */
color: rgb(34, 211, 238);            /* Cyan-400 on Dark-900: 9.7:1 ✅ */

/* Success green on dark */
color: rgb(52, 211, 153);            /* Green-400 on Dark-900: 8.9:1 ✅ */

/* Warning yellow on dark */
color: rgb(251, 191, 36);            /* Yellow-400 on Dark-900: 10.3:1 ✅ */

/* Error red on dark */
color: rgb(248, 113, 113);           /* Red-400 on Dark-900: 5.8:1 ✅ */
```

### Screen Reader Support
```css
/* Visually hidden but screen-reader accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## 📦 Export Specifications

### Component API
```typescript
interface AdditionalFeaturesRedesignedProps {
  // Optional: Override default data
  dtcs?: DTCEntry[];
  lessons?: LearningModule[];
  stats?: StatMetric[];
  
  // Optional: Event handlers
  onDTCClick?: (code: string) => void;
  onLessonClick?: (lessonId: string) => void;
  onStatClick?: (statId: string) => void;
  
  // Optional: Customization
  showExpandedByDefault?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  theme?: 'cyan' | 'purple' | 'orange';
}
```

### CSS Variables (for easy theming)
```css
:root {
  /* Card colors (can be overridden) */
  --stats-primary: rgb(6, 182, 212);
  --learning-primary: rgb(168, 85, 247);
  --dtc-primary: rgb(249, 115, 22);
  
  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* Border radius scale */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
}
```

---

## ✅ Quality Checklist

### Visual Polish
- [ ] All colors match specification exactly
- [ ] Font sizes consistent across breakpoints
- [ ] Spacing follows 4/8/12/16/24px rhythm
- [ ] Border radius consistent (4/8/12/24px)
- [ ] Shadows smooth and subtle
- [ ] Gradients smooth without banding

### Performance
- [ ] Animations run at 60fps
- [ ] No layout shifts (CLS = 0)
- [ ] Images optimized (<100KB each)
- [ ] Total component size <10KB minified
- [ ] No unnecessary re-renders

### Accessibility
- [ ] All text meets 4.5:1 contrast ratio
- [ ] Focus indicators clearly visible
- [ ] Keyboard navigation functional
- [ ] Screen reader announces correctly
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] No motion for users with prefers-reduced-motion

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Samsung Internet
- [ ] Supports IE11 (if required)

---

**Specification Version**: 1.0  
**Last Updated**: October 5, 2025  
**Precision Level**: Pixel-perfect  
**Status**: Production Ready
