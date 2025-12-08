/**
 * Enhanced Background Component
 * Combines the original ParticleBackground with Aceternity Sparkles for a richer visual effect
 * Adapts to light/dark theme automatically
 * Includes bright green neon sparkles for high contrast mode
 * Respects prefers-reduced-motion accessibility preference
 */
import React from 'react';
import { SparklesCore } from '@/components/ui/sparkles';
import ParticleBackground from './ParticleBackground';
import { useTheme } from '../context/ThemeContext';

const EnhancedBackground: React.FC = () => {
 const { theme, highContrast } = useTheme();
 
 // Theme-specific sparkle configurations
 const sparkleConfig = highContrast
 ? {
 // High Contrast: Green neon sparkles (optimized for smooth performance)
 particleColor: '#00FF00', // Bright green neon
 minSize: 0.8,
 maxSize: 2.5,
 particleDensity: 100, // Reduced from 150 for smoother animation
 speed: 8 // Reduced from 12 for better performance
 }
 : theme === 'dark' 
 ? {
 particleColor: '#60A5FA', // Light blue for dark theme
 minSize: 0.4,
 maxSize: 1.2,
 particleDensity: 80,
 speed: 10,
 useMultiColor: false
 }
 : {
 particleColor: '#3B82F6', // Deeper blue for light theme
 minSize: 0.3,
 maxSize: 0.9,
 particleDensity: 80, // Reduced from 60 for cleaner appearance
 speed: 7.5, // Increased from 1.5 for more dynamic movement
 useMultiColor: false
 };
 
 return (
 <>
 {/* Original particle system for ambient effects */}
 <ParticleBackground />
 
 {/* Aceternity Sparkles overlay for enhanced visual depth */}
 {highContrast ? (
 // High Contrast: Green neon sparkles
 <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
 <SparklesCore
 id="uds-sparkles-highcontrast"
 background="transparent"
 minSize={sparkleConfig.minSize}
 maxSize={sparkleConfig.maxSize}
 particleDensity={sparkleConfig.particleDensity}
 className="w-full h-full"
 particleColor={sparkleConfig.particleColor}
 speed={sparkleConfig.speed}
 />
 </div>
 ) : (
 // Normal theme: Single color sparkles
 <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
 <SparklesCore
 id="uds-sparkles-background"
 background="transparent"
 minSize={sparkleConfig.minSize}
 maxSize={sparkleConfig.maxSize}
 particleDensity={sparkleConfig.particleDensity}
 className="w-full h-full"
 particleColor={sparkleConfig.particleColor}
 speed={sparkleConfig.speed}
 />
 </div>
 )}
 </>
 );
};

export default EnhancedBackground;
