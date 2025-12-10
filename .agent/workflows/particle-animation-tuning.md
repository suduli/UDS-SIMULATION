---
description: Troubleshoot and tune particle animation performance in SparklesCore
---

# Particle Animation Performance Tuning Workflow

This workflow helps verify, tune, and document particle animation configurations in the UDS Simulator's background effects.

---

## Step 1: Verify Current Implementation

Check the `EnhancedBackground.tsx` component to confirm the particle configuration values.

// turbo
1. Open and review the particle configuration in `src/components/EnhancedBackground.tsx`
2. Look for the `sparkleConfig` object and verify these expected values:

   **High Contrast Mode (Green Neon):**
   - `particleColor`: `#00FF00`
   - `particleDensity`: `80`
   - `speed`: `0.7`

   **Dark Theme (Light Blue):**
   - `particleColor`: `#60A5FA`
   - `particleDensity`: `80`
   - `speed`: `0.7`

   **Light Theme (Deeper Blue):**
   - `particleColor`: `#3B82F6`
   - `particleDensity`: `80`
   - `speed`: `0.8`

3. If values don't match, proceed to Step 2.

---

## Step 2: Tune Animation Parameters (If Needed)

Adjust the particle animation values if performance issues persist.

### Performance Tuning Guidelines

| Issue | Solution |
|-------|----------|
| Particles too fast/jittery | Reduce `speed` value (try 50% reduction) |
| Animation feels sluggish | Increase `speed` value slightly |
| Too many particles causing lag | Reduce `particleDensity` |
| Particles too sparse | Increase `particleDensity` (max recommended: 150) |
| High CPU usage | Reduce both `speed` and `particleDensity` |

### Recommended Value Ranges

- **speed**: 0.5-15 (lower = smoother, higher = more dynamic; current: 0.7-0.8)
- **particleDensity**: 50-150 (lower = better performance, higher = more particles; current: 80)
- **minSize**: 0.3-1.0
- **maxSize**: 0.9-3.0

### Testing Changes

// turbo
1. Make changes to `src/components/EnhancedBackground.tsx`
2. Run the dev server: `npm run dev`
3. Navigate to test pages:
   - Main page: `http://localhost:5174/UDS-SIMULATION/`
   - Cluster page: `http://localhost:5174/UDS-SIMULATION/cluster`
   - Learning page: `http://localhost:5174/UDS-SIMULATION/learning`
4. Toggle between themes using the theme switcher
5. Enable high contrast mode to test all configurations
6. Check for smooth animation without jitter or lag

---

## Step 3: Document Changes

Create or update technical documentation for the particle animation system.

1. Create documentation file at `docs/particle-animation.md` with:
   - Current configuration values for each theme
   - Performance considerations
   - Troubleshooting tips
   - Change history

2. Include the following sections:
   - **Overview**: Purpose of particle animations
   - **Configuration**: Current theme-specific values
   - **Performance**: Recommended ranges and trade-offs
   - **Troubleshooting**: Common issues and solutions

### Documentation Template

```markdown
# Particle Animation System

## Overview
The UDS Simulator uses the Aceternity SparklesCore library for background particle effects.
Particles are theme-aware and adjust their color, density, and speed based on the active theme.

## Current Configuration

### High Contrast Mode
- Color: #00FF00 (Bright Green Neon)
- Density: 80
- Speed: 0.7

### Dark Theme
- Color: #60A5FA (Light Blue)
- Density: 80
- Speed: 0.7

### Light Theme
- Color: #3B82F6 (Deeper Blue)
- Density: 80
- Speed: 0.8

## Performance Notes
- Higher density values (>150) may cause performance degradation
- Speed values above 12 can cause jittery movement
- High contrast mode uses brighter colors that make fast movement more noticeable

## Change History
- [DATE]: Optimized particle performance (reduced density/speed for smoother animation)
```

---

## Quick Reference Commands

// turbo
```bash
# Start dev server
npm run dev

# Build for production (to verify no build errors)
npm run build
```

---

## Related Files

- `src/components/EnhancedBackground.tsx` - Main particle configuration
- `src/components/ui/sparkles.tsx` - SparklesCore component (Aceternity library)
- `src/components/SparklesDemo.tsx` - Demo/test component

---

## Troubleshooting Checklist

- [ ] Verified configuration values match expected settings
- [ ] Tested in dark mode
- [ ] Tested in light mode
- [ ] Tested in high contrast dark mode
- [ ] Tested in high contrast light mode
- [ ] Checked all pages (Home, Learning, Cluster)
- [ ] No visible jitter or performance lag
- [ ] Documentation updated with any changes made
