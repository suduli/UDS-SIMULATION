/**
 * Enhanced Background Component
 * Combines the original ParticleBackground with Aceternity Sparkles for a richer visual effect
 * Adapts to light/dark theme automatically
 * Includes bright green neon sparkles for high contrast mode
 * Respects prefers-reduced-motion accessibility preference
 */

import React, { useMemo, memo } from 'react';
import { SparklesCore } from '@/components/ui/sparkles';
import ParticleBackground from './ParticleBackground';
import { useTheme } from '../context/ThemeContext';

const EnhancedBackground: React.FC = memo(() => {
  const { theme, highContrast } = useTheme();

  // Memoize sparkle configuration to prevent recreation on every render
  // This ensures the particle system doesn't reset when parent components re-render
  const sparkleConfig = useMemo(() => {
    if (highContrast) {
      return {
        // High Contrast: Green neon sparkles
        particleColor: '#00FF00',      // Bright green neon
        minSize: 0.8,
        maxSize: 2.5,
        particleDensity: 80,           // Balanced density for smooth performance
        speed: 0.7                     // Slow, stable animation
      };
    } else if (theme === 'dark') {
      return {
        particleColor: '#60A5FA',      // Light blue for dark theme
        minSize: 0.4,
        maxSize: 1.2,
        particleDensity: 80,
        speed: 0.7                     // Slow, smooth animation
      };
    } else {
      return {
        particleColor: '#3B82F6',      // Deeper blue for light theme
        minSize: 0.3,
        maxSize: 0.9,
        particleDensity: 80,           // Consistent density across themes
        speed: 0.8                     // Slightly faster but still smooth
      };
    }
  }, [highContrast, theme]);

  return (
    <>
      {/* Original particle system for ambient effects */}
      <ParticleBackground />

      {/* Aceternity Sparkles overlay for enhanced visual depth */}
      {/* Use a single stable ID to prevent remounting on theme/contrast changes */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <SparklesCore
          id="uds-sparkles-main"
          background="transparent"
          minSize={sparkleConfig.minSize}
          maxSize={sparkleConfig.maxSize}
          particleDensity={sparkleConfig.particleDensity}
          className="w-full h-full"
          particleColor={sparkleConfig.particleColor}
          speed={sparkleConfig.speed}
        />
      </div>
    </>
  );
});

EnhancedBackground.displayName = 'EnhancedBackground';

export default EnhancedBackground;
