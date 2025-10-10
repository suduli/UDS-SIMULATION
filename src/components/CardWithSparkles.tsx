/**
 * Card with Sparkles Effect
 * Wrapper component that adds subtle sparkles to any card content
 * Automatically adapts to light/dark theme
 */

import React from 'react';
import type { ReactNode } from 'react';
import { SparklesCore } from '@/components/ui/sparkles';
import { useTheme } from '../context/ThemeContext';

interface CardWithSparklesProps {
  children: ReactNode;
  className?: string;
  sparkleColor?: string;
  lightThemeColor?: string;  // Optional separate color for light theme
  particleDensity?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

const CardWithSparkles: React.FC<CardWithSparklesProps> = ({
  children,
  className = '',
  sparkleColor = '#60A5FA',
  lightThemeColor,  // If not provided, will use sparkleColor for both themes
  particleDensity = 50,
  minSize = 0.3,
  maxSize = 0.8,
  speed = 1.5,
}) => {
  const { theme } = useTheme();
  
  // Use theme-specific color if provided, otherwise use default
  const effectiveColor = theme === 'dark' 
    ? sparkleColor 
    : (lightThemeColor || sparkleColor);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sparkles background layer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <SparklesCore
          background="transparent"
          minSize={minSize}
          maxSize={maxSize}
          particleDensity={particleDensity}
          className="w-full h-full"
          particleColor={effectiveColor}
          speed={speed}
        />
      </div>
      
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default CardWithSparkles;
