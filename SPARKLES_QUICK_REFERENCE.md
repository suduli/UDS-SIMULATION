# 🎯 Sparkles Quick Reference Card

## ✨ What's New

Your UDS Simulator now has **Aceternity Sparkles** effects integrated with **full Light & Dark theme support**!

---

## 🚀 Running the App

```bash
npm run dev
```

App is live at: **http://localhost:5175/UDS-SIMULATION/**

---

## 📍 Where to See Sparkles

1. **Background** - Full-screen sparkles overlay (adapts to theme)
2. **Header Logo** - Animated sparkles around the logo (theme-aware)
3. **Toggle theme** - Click sun/moon icon to see both versions!

---

## 🌓 Theme Support

### Dark Theme
- Light blue sparkles (`#60A5FA`)
- 80 particles
- Larger size (0.4-1.2px)

### Light Theme  
- Deep blue sparkles (`#3B82F6`)
- 60 particles
- Smaller size (0.3-0.9px)

**All components auto-switch when you toggle theme!**

---

## 🎨 Quick Usage Examples

### Add Sparkles to Any Component

```tsx
import { SparklesCore } from '@/components/ui/sparkles';

<div className="relative h-64">
  <SparklesCore
    background="transparent"
    minSize={0.4}
    maxSize={1}
    particleDensity={100}
    className="w-full h-full"
    particleColor="#60A5FA"
  />
</div>
```

### Wrap a Card with Sparkles

```tsx
import CardWithSparkles from '@/components/CardWithSparkles';

// Same color for both themes
<CardWithSparkles sparkleColor="#60A5FA" particleDensity={50}>
  <YourCardContent />
</CardWithSparkles>

// Different colors per theme
<CardWithSparkles 
  sparkleColor="#60A5FA"        // Dark theme
  lightThemeColor="#3B82F6"     // Light theme
  particleDensity={50}
>
  <YourCardContent />
</CardWithSparkles>
```

### Theme-Aware Manual Setup

```tsx
import { useTheme } from '../context/ThemeContext';

const { theme } = useTheme();

<SparklesCore
  particleColor={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
  particleDensity={theme === 'dark' ? 100 : 80}
/>
```

---

## ⚙️ Quick Settings

| Setting | Light Effect | Medium Effect | Heavy Effect |
|---------|--------------|---------------|--------------|
| **particleDensity** | 30-50 | 80-120 | 200-500 |
| **minSize** | 0.3 | 0.4 | 0.6 |
| **maxSize** | 0.8 | 1.2 | 2.0 |
| **speed** | 1 | 2 | 4 |

---

## 🎨 Color Presets (Your Theme)

### Dark Theme
```tsx
// Cyan (Primary)
particleColor="#60A5FA"

// Bright Cyan
particleColor="#38BDF8"

// Purple (Accent)
particleColor="#A855F7"

// Green (Success)
particleColor="#10B981"

// White
particleColor="#FFFFFF"
```

### Light Theme
```tsx
// Blue (Primary)
particleColor="#3B82F6"

// Sky Blue
particleColor="#0EA5E9"

// Purple (Accent)
particleColor="#8B5CF6"

// Green (Success)
particleColor="#059669"

// Dark Blue
particleColor="#1E40AF"
```

---

## 📁 Key Files

- **Main Component**: `src/components/ui/sparkles.tsx`
- **Enhanced Background**: `src/components/EnhancedBackground.tsx`
- **Wrapper**: `src/components/CardWithSparkles.tsx`
- **Demos**: `src/components/SparklesDemo.tsx`
- **Utils**: `src/lib/utils.ts`

---

## 📖 Full Documentation

- **Complete Guide**: `SPARKLES_GUIDE.md`
- **Implementation Summary**: `SPARKLES_IMPLEMENTATION_SUMMARY.md`
- **Online Demo**: https://21st.dev/aceternity/sparkles/default

---

## 🔧 Common Tweaks

**Make sparkles more visible:**
```tsx
particleDensity={200}  // More particles
maxSize={2}            // Larger particles
```

**Make sparkles subtle:**
```tsx
particleDensity={30}   // Fewer particles
maxSize={0.8}          // Smaller particles
speed={1}              // Slower animation
```

**Change color to match theme:**
```tsx
particleColor="#38BDF8"  // Your cyber-blue
```

---

## ✅ Installation Complete

All dependencies installed, components created, and effects integrated!

**Enjoy your enhanced UDS Simulator! ✨**
