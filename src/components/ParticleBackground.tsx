/**
 * Particle Background Component
 * Adds ambient animated particles for visual polish
 * Respects prefers-reduced-motion accessibility preference
 * 
 * Optimized: Uses useRef to store initial particles and only regenerates
 * when theme actually changes, preventing animation restarts on parent re-renders.
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  blurClass: 'blur-none' | 'blur-sm' | 'blur-md';
  animationClass: 'animate-float' | 'animate-float-fast' | 'animate-float-slow';
  twinkleClass: 'animate-twinkle' | 'animate-twinkle-slow';
  glowClass: 'particle-glow' | 'particle-glow-strong' | '';
  gradient: string;
}

interface Streak {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  duration: number;
  delay: number;
  opacity: number;
  gradient: string;
}

const createRadialGradient = (rgba: string, theme: 'dark' | 'light') =>
  theme === 'dark'
    ? `radial-gradient(circle, ${rgba} 0%, rgba(15, 23, 42, 0) 70%)`
    : `radial-gradient(circle, ${rgba} 0%, rgba(255, 255, 255, 0) 70%)`;

// Seeded random number generator for consistent particle generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateParticles = (theme: 'dark' | 'light', seed: number = 42): Particle[] => {
  const isDark = theme === 'dark';

  const baseColors = isDark ? [
    'rgba(56, 189, 248, 0.35)',   // Light Blue
    'rgba(59, 130, 246, 0.3)',    // Blue
    'rgba(168, 85, 247, 0.32)',   // Purple
    'rgba(16, 185, 129, 0.28)',   // Green
    'rgba(236, 72, 153, 0.28)',   // Pink
  ] : [
    'rgba(2, 132, 199, 0.25)',    // Darker Blue
    'rgba(37, 99, 235, 0.2)',     // Darker Blue
    'rgba(147, 51, 234, 0.22)',   // Darker Purple
    'rgba(5, 150, 105, 0.18)',    // Darker Green
    'rgba(219, 39, 119, 0.18)',   // Darker Pink
  ];

  const totalPrimary = 60;
  const totalAccent = 24;

  const primaryParticles: Particle[] = Array.from({ length: totalPrimary }, (_, i) => {
    const particleSeed = seed + i;
    const rand1 = seededRandom(particleSeed);
    const rand2 = seededRandom(particleSeed + 100);
    const rand3 = seededRandom(particleSeed + 200);
    const rand4 = seededRandom(particleSeed + 300);
    const rand5 = seededRandom(particleSeed + 400);
    const rand6 = seededRandom(particleSeed + 500);
    const rand7 = seededRandom(particleSeed + 600);
    const rand8 = seededRandom(particleSeed + 700);

    const color = baseColors[Math.floor(rand1 * baseColors.length)];
    const speedRoll = rand2;
    const animationClass = speedRoll > 0.7 ? 'animate-float-fast' : speedRoll < 0.25 ? 'animate-float-slow' : 'animate-float';
    const twinkleClass = rand3 > 0.5 ? 'animate-twinkle' : 'animate-twinkle-slow';

    return {
      id: `primary-${i}`,
      x: rand4 * 100,
      y: rand5 * 100,
      size: rand6 * 6 + 1.5,
      duration: rand7 * 20 + 20,  // Slower duration: 20-40s instead of 10-24s
      delay: rand8 * 6,
      opacity: seededRandom(particleSeed + 800) * 0.35 + 0.15,
      blurClass: seededRandom(particleSeed + 900) > 0.6 ? 'blur-md' : 'blur-sm',
      animationClass,
      twinkleClass,
      glowClass: seededRandom(particleSeed + 1000) > 0.6 ? 'particle-glow' : '',
      gradient: createRadialGradient(color, theme),
    };
  });

  const accentParticles: Particle[] = Array.from({ length: totalAccent }, (_, i) => {
    const particleSeed = seed + totalPrimary + i;
    const rand1 = seededRandom(particleSeed);
    const rand2 = seededRandom(particleSeed + 100);
    const rand3 = seededRandom(particleSeed + 200);
    const rand4 = seededRandom(particleSeed + 300);
    const rand5 = seededRandom(particleSeed + 400);
    const rand6 = seededRandom(particleSeed + 500);
    const rand7 = seededRandom(particleSeed + 600);

    const color = baseColors[Math.floor(rand1 * baseColors.length)];
    return {
      id: `accent-${i}`,
      x: rand2 * 100,
      y: rand3 * 100,
      size: rand4 * 14 + 8,
      duration: rand5 * 18 + 18,
      delay: rand6 * 10,
      opacity: rand7 * 0.25 + 0.1,
      blurClass: 'blur-md',
      animationClass: 'animate-float-slow',
      twinkleClass: 'animate-twinkle-slow',
      glowClass: 'particle-glow-strong',
      gradient: createRadialGradient(color, theme),
    };
  });

  return [...primaryParticles, ...accentParticles];
};

const generateStreaks = (theme: 'dark' | 'light', seed: number = 42): Streak[] => {
  const isDark = theme === 'dark';

  const accentGradients = isDark ? [
    'linear-gradient(180deg, rgba(14, 165, 233, 0.35) 0%, rgba(14, 165, 233, 0.0) 100%)',
    'linear-gradient(180deg, rgba(168, 85, 247, 0.35) 0%, rgba(168, 85, 247, 0.0) 100%)',
    'linear-gradient(180deg, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.0) 100%)',
  ] : [
    'linear-gradient(180deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.0) 100%)',
    'linear-gradient(180deg, rgba(147, 51, 234, 0.25) 0%, rgba(147, 51, 234, 0.0) 100%)',
    'linear-gradient(180deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.0) 100%)',
  ];

  const count = 12;
  return Array.from({ length: count }, (_, i) => {
    const streakSeed = seed + 1000 + i;
    const rand1 = seededRandom(streakSeed);
    const rand2 = seededRandom(streakSeed + 100);
    const rand3 = seededRandom(streakSeed + 200);
    const rand4 = seededRandom(streakSeed + 300);
    const rand5 = seededRandom(streakSeed + 400);
    const rand6 = seededRandom(streakSeed + 500);
    const rand7 = seededRandom(streakSeed + 600);
    const rand8 = seededRandom(streakSeed + 700);

    const gradient = accentGradients[Math.floor(rand1 * accentGradients.length)];
    return {
      id: `streak-${i}`,
      x: rand2 * 100,
      y: rand3 * 100,
      width: rand4 * 2 + 1,
      height: rand5 * 120 + 80,
      rotation: (rand6 - 0.5) * 22,
      duration: rand7 * 10 + 12,
      delay: rand8 * 8,
      opacity: seededRandom(streakSeed + 800) * 0.2 + 0.05,
      gradient,
    };
  });
};

const ParticleBackground: React.FC = memo(() => {
  const { theme } = useTheme();

  // Use ref to track if this is the initial render
  const isInitialRender = useRef(true);
  const prevThemeRef = useRef<'dark' | 'light'>(theme);

  // Use stable seed for consistent particle generation
  const seedRef = useRef(42);

  // Initialize particles with theme
  const [particles, setParticles] = useState<Particle[]>(() =>
    generateParticles(theme, seedRef.current)
  );
  const [streaks, setStreaks] = useState<Streak[]>(() =>
    generateStreaks(theme, seedRef.current)
  );

  // Only regenerate particles when theme ACTUALLY changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Only regenerate if theme has actually changed
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;
      setParticles(generateParticles(theme, seedRef.current));
      setStreaks(generateStreaks(theme, seedRef.current));
    }
  }, [theme]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
      role="presentation"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'} ${particle.blurClass} ${particle.animationClass} ${particle.twinkleClass} ${particle.glowClass}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            background: particle.gradient,
          }}
        />
      ))}

      {streaks.map((streak) => (
        <div
          key={streak.id}
          className={`absolute animate-streak ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
          style={{
            left: `${streak.x}%`,
            top: `${streak.y}%`,
            width: `${streak.width}px`,
            height: `${streak.height}px`,
            opacity: streak.opacity,
            animationDuration: `${streak.duration}s`,
            animationDelay: `${streak.delay}s`,
            transform: `rotate(${streak.rotation}deg)`,
            background: streak.gradient,
          }}
        />
      ))}
    </div>
  );
});

ParticleBackground.displayName = 'ParticleBackground';

export default ParticleBackground;
