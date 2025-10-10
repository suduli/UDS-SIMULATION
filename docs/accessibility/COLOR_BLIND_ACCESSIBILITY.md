# Color-Blind Accessibility Guidelines

## Overview
To ensure the UDS Simulator is accessible to users with color vision deficiency, all status indicators and critical information must use **multiple visual cues** beyond color alone.

## WCAG Requirements
- **WCAG 2.1 Success Criterion 1.4.1**: Use of Color - Color is not used as the only visual means of conveying information.

## Implementation Guidelines

### Status Indicators

All status types must include:
1. **Color** - For visual distinction
2. **Icon** - For non-color-based recognition
3. **Text Label** - For clarity and screen readers

#### Status Types and Their Indicators

| Status | Color (Dark) | Color (Light) | Icon | Text Label |
|--------|-------------|---------------|------|------------|
| Critical/Error | `#FF4444` | `#D32F2F` | ❌ or ⚠️ | "Critical" or "Error" |
| Warning | `#FFEB3B` | `#FFA726` | ⚠️ | "Warning" |
| Success | `#00C853` | `#43A047` | ✓ or ✅ | "Success" |
| Info | `#2196F3` | `#1976D2` | ℹ️ or 🔵 | "Info" |

### CSS Classes for Status

Use the new standardized status classes:

```css
/* Dark Mode (default) */
.status-critical  /* Red text */
.status-warning   /* Yellow text */
.status-success   /* Green text */
.status-info      /* Blue text */

/* With backgrounds */
.bg-status-critical  /* Red background with border */
.bg-status-warning   /* Yellow background with border */
.bg-status-success   /* Green background with border */
.bg-status-info      /* Blue background with border */
```

### Example Usage

#### ❌ Bad (Color only)
```tsx
<div className="text-status-critical">
  Connection failed
</div>
```

#### ✅ Good (Color + Icon + Label)
```tsx
<div className="flex items-center gap-2 text-status-critical">
  <span className="text-lg" aria-hidden="true">⚠️</span>
  <span className="font-bold">Error:</span>
  <span>Connection failed</span>
</div>
```

#### ✅ Better (With background and semantic HTML)
```tsx
<div className="flex items-center gap-2 px-3 py-2 rounded border bg-status-critical" role="alert">
  <span className="text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
  <div>
    <span className="font-bold">Error:</span>
    <span>Connection failed</span>
  </div>
</div>
```

### Component Pattern

Create a reusable StatusMessage component:

```tsx
interface StatusMessageProps {
  type: 'critical' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  icon?: string;
}

const STATUS_CONFIG = {
  critical: { icon: '⚠️', label: 'Error', class: 'status-critical' },
  warning: { icon: '⚠️', label: 'Warning', class: 'status-warning' },
  success: { icon: '✓', label: 'Success', class: 'status-success' },
  info: { icon: 'ℹ️', label: 'Info', class: 'status-info' },
};

export const StatusMessage: React.FC<StatusMessageProps> = ({ 
  type, 
  title, 
  message,
  icon 
}) => {
  const config = STATUS_CONFIG[type];
  
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-2 rounded border bg-${type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">
        {icon || config.icon}
      </span>
      <div>
        {title && <span className="font-bold">{title}: </span>}
        <span>{message}</span>
      </div>
    </div>
  );
};
```

## Additional Considerations

### Disabled States
- Use opacity AND a disabled icon/cursor
- Add "Disabled" or "Inactive" text label
- Ensure contrast ratio still meets AA standards (4.5:1 for text)

### Interactive Elements
- Use borders, underlines, or icons for hover/focus states
- Don't rely on color change alone

### Charts and Graphs
- Use patterns, textures, or labels in addition to colors
- Provide alternative text descriptions

### Testing
Test with color blindness simulators:
- **Protanopia** (red-blind)
- **Deuteranopia** (green-blind)
- **Tritanopia** (blue-blind)
- **Monochromacy** (total color blindness)

Tools:
- Chrome DevTools Vision Deficiency Emulator
- Stark plugin for Figma/Chrome
- Coblis - Color Blindness Simulator

## Migration Checklist

- [ ] Audit all status indicators in the application
- [ ] Add icons to all critical/warning/success messages
- [ ] Replace color-only indicators with multi-cue indicators
- [ ] Create StatusMessage component
- [ ] Update DTC status displays
- [ ] Update protocol state indicators
- [ ] Update response visualizer status
- [ ] Add legends/keys where needed
- [ ] Test with color blindness simulators
- [ ] Document icon meanings in user guide

## Resources
- [WCAG 2.1 - Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)
- [A11y Project - Color Contrast](https://www.a11yproject.com/posts/what-is-color-contrast/)
- [WebAIM - Color Blindness](https://webaim.org/articles/visual/colorblind)
