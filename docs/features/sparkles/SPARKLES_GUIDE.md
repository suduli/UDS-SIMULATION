# Sparkles Component - Usage Guide

The Sparkles component from Aceternity UI has been successfully installed and configured in your project.

## 📦 Installation Complete

The following has been set up:
- ✅ Sparkles component installed at `src/components/ui/sparkles.tsx`
- ✅ Path aliases configured (`@/*` → `./src/*`)
- ✅ Required dependencies installed (clsx, tailwind-merge, framer-motion, @tsparticles packages)
- ✅ Utils file created at `src/lib/utils.ts`

## 🚀 Quick Start

### Basic Usage

```tsx
import { SparklesCore } from "@/components/ui/sparkles";

function MyComponent() {
  return (
    <div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
      <h1 className="text-7xl font-bold text-center text-white relative z-20">
        Your Title Here
      </h1>
      
      <div className="w-[40rem] h-40 relative">
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
    </div>
  );
}
```

## 🎨 Examples

### 1. Hero Section with Sparkles

```tsx
import { SparklesDemo } from "@/components/SparklesDemo";

// Use in your app
<SparklesDemo />
```

### 2. Full Page Background

```tsx
import { SparklesBackground } from "@/components/SparklesDemo";

<SparklesBackground />
```

### 3. Compact Card Version

```tsx
import { SparklesCompact } from "@/components/SparklesDemo";

<SparklesCompact />
```

## ⚙️ Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | auto-generated | Unique identifier for the particles instance |
| `className` | `string` | `""` | Additional CSS classes |
| `background` | `string` | `"#0d47a1"` | Background color (use "transparent" for overlay effect) |
| `minSize` | `number` | `1` | Minimum particle size |
| `maxSize` | `number` | `3` | Maximum particle size |
| `speed` | `number` | `4` | Animation speed for opacity changes |
| `particleColor` | `string` | `"#ffffff"` | Color of the particles |
| `particleDensity` | `number` | `120` | Number of particles to render |

## 🎯 Usage Examples

### Example 1: Dark Theme with Blue Sparkles

```tsx
<SparklesCore
  background="transparent"
  minSize={0.6}
  maxSize={1.4}
  particleDensity={100}
  className="w-full h-full"
  particleColor="#60A5FA"
  speed={3}
/>
```

### Example 2: Dense Golden Sparkles

```tsx
<SparklesCore
  background="transparent"
  minSize={0.3}
  maxSize={0.8}
  particleDensity={2000}
  className="w-full h-full"
  particleColor="#FFD700"
  speed={2}
/>
```

### Example 3: Slow Moving Purple Sparkles

```tsx
<SparklesCore
  background="transparent"
  minSize={1}
  maxSize={2}
  particleDensity={50}
  className="w-full h-full"
  particleColor="#A855F7"
  speed={1}
/>
```

## 🎨 Styling Tips

### Adding Gradients

Combine sparkles with gradient overlays for enhanced visual effects:

```tsx
<div className="relative">
  {/* Top gradient line */}
  <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] blur-sm" />
  
  {/* Sparkles */}
  <SparklesCore {...props} />
  
  {/* Radial mask for soft edges */}
  <div className="absolute inset-0 bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
</div>
```

### Layering with Content

Always use `z-index` to ensure your content appears above the sparkles:

```tsx
<div className="relative h-screen">
  <SparklesCore className="absolute inset-0" {...props} />
  <div className="relative z-20">
    {/* Your content here */}
  </div>
</div>
```

## 💡 Integration Ideas

1. **Hero Section**: Add sparkles to your main landing section
2. **Feature Cards**: Use compact version in feature highlights
3. **Background Effect**: Replace or complement your existing ParticleBackground
4. **Loading States**: Animated sparkles during data loading
5. **Success States**: Celebration effect after successful operations
6. **Section Dividers**: Visual separator between content sections

## 🔧 Customization

The sparkles effect is built on `@tsparticles/react`, so you can modify the `options` object in `src/components/ui/sparkles.tsx` for advanced customization:

- Change particle shapes (circle, square, polygon, etc.)
- Add interactivity (hover effects, click effects)
- Modify movement patterns
- Add connections between particles
- Custom animations and effects

## 📝 Example: Replace Existing Background

To replace your current `ParticleBackground` component:

```tsx
// In App.tsx, replace
<ParticleBackground />

// With
<div className="fixed inset-0 z-0">
  <SparklesCore
    background="transparent"
    minSize={0.6}
    maxSize={1.4}
    particleDensity={100}
    className="w-full h-full"
    particleColor="#60A5FA"
  />
</div>
```

## 🎯 Live Demo Reference

Check out the original demo at: https://21st.dev/aceternity/sparkles/default

## 📚 Additional Resources

- [Aceternity UI Documentation](https://ui.aceternity.com)
- [TSParticles Documentation](https://particles.js.org/)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**Ready to use!** Import `SparklesCore` or use the pre-made examples from `SparklesDemo.tsx` to get started.
