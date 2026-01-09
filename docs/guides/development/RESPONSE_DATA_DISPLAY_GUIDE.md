# Response Data Display - Quick Reference

## CSS Class Usage

### Apply the `.response-data-container` class to any element displaying UDS response hex data:

```tsx
// ✅ CORRECT - With response-data-container class
<div className="response-data-container font-mono text-base">
  {responseData.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
</div>

// ❌ INCORRECT - Without proper wrapping
<div className="font-mono text-xl">
  {responseData.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
</div>
```

## CSS Properties Explained

| Property | Value | Purpose |
|----------|-------|---------|
| `white-space` | `pre-wrap` | Preserves spaces, allows wrapping |
| `word-break` | `break-all` | Breaks long strings at any character |
| `max-width` | `100%` | Prevents overflow beyond parent |
| `width` | `100%` | Uses full available width |
| `overflow-x` | `auto` | Scrollbar if content exceeds width |
| `overflow-wrap` | `break-word` | Additional word breaking |
| `line-height` | `1.6` | Improves readability |

## Examples

### Short Response (No wrapping needed)
```
62 F1 86
```
**Display:** Single line, no issues

### Medium Response (Wraps naturally)
```
62 F1 86 56 41 55 44 49 20 20 20 20
20 20 20 20 20 20 20 20 00 00 00 00
```
**Display:** Wraps to multiple lines within container

### Long Response (Multiple lines)
```
62 F1 86 56 41 55 44 49 20 20 20 20
20 20 20 20 20 20 20 20 00 00 00 00
31 32 33 34 35 36 37 38 39 41 42 43
44 45 46 47 48 49 4A 4B 4C 4D 4E 4F
```
**Display:** Wraps to 4+ lines, maintains container width

## When to Use

### ✅ Use `.response-data-container` for:
- Hex string displays (`62 F1 86 ...`)
- ASCII representations
- Byte array visualizations
- Packet data in animations
- Expected response displays
- Any monospace data that could overflow

### ❌ Don't use for:
- Labels and headers
- Single byte displays
- Icon or emoji content
- Fixed-width buttons
- Navigation elements

## Responsive Behavior

```css
/* Desktop/Tablet (> 768px) */
.response-data-container {
  font-size: 1rem;      /* 16px */
  line-height: 1.6;     /* 25.6px */
}

/* Mobile (≤ 768px) */
@media (max-width: 768px) {
  .response-data-container {
    font-size: 0.875rem;  /* 14px */
    line-height: 1.5;     /* 21px */
  }
}
```

## Component Integration

### ResponseVisualizer.tsx
```tsx
// Hex string display
<div className={`response-data-container font-mono text-base font-bold mb-4 tracking-wide ${...}`}>
  {item.response.data.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
</div>

// ASCII representation
<div className="response-data-container font-mono text-sm text-gray-300 bg-dark-900/60 p-3 rounded-md border border-dark-600">
  {toASCII(item.response.data.slice(...))}
</div>
```

### PacketFlowVisualizer.tsx
```tsx
// Animated packets with max-width constraint
<div className="response-data-container ... max-w-[200px]">
  {packet.bytes.slice(0, 4).join(' ')}
  {packet.bytes.length > 4 && '...'}
</div>
```

### LessonExercise.tsx
```tsx
// Expected response code block
<code className="response-data-container block mt-2 bg-gray-800 p-2 rounded font-mono text-green-300 text-sm">
  {exercise.expectedResponse.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
</code>
```

## Common Pitfalls

### ❌ Pitfall 1: Using text-xl or larger fonts
**Problem:** Larger fonts increase likelihood of overflow  
**Solution:** Use `text-base` (16px) or `text-sm` (14px)

### ❌ Pitfall 2: Using whitespace-nowrap
**Problem:** Prevents wrapping, causes horizontal scroll  
**Solution:** Remove `whitespace-nowrap` or rely on class default

### ❌ Pitfall 3: Fixed width containers
**Problem:** Content may exceed fixed width  
**Solution:** Use `max-width` with `width: 100%` for flexibility

### ❌ Pitfall 4: Inline styles override class
**Problem:** Inline `style={{...}}` has higher specificity  
**Solution:** Remove conflicting inline styles

## Testing Scenarios

1. **Short Response (< 20 bytes)**
   - Should display on 1-2 lines
   - No horizontal scroll
   - Full visibility

2. **Medium Response (20-50 bytes)**
   - Should wrap naturally
   - 2-4 lines typical
   - Maintains container width

3. **Long Response (> 50 bytes)**
   - Multiple lines
   - Clean wrapping at word breaks
   - No layout shift

4. **Mobile View**
   - Smaller font size
   - Still readable
   - No horizontal overflow

## Browser DevTools Inspection

### Check in Chrome/Edge DevTools:
```
1. Right-click on hex data → Inspect
2. Verify computed styles:
   - white-space: pre-wrap ✓
   - word-break: break-all ✓
   - max-width: 100% ✓
3. Resize viewport to test wrapping
4. Check mobile breakpoint (< 768px)
```

---

**Last Updated:** October 11, 2025  
**Related:** `RESPONSE_DATA_STRETCHING_FIX.md`
