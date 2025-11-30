/**
 * Particle Background Component
 * Adds ambient animated particles for visual polish
 * Respects prefers-reduced-motion accessibility preference
 */

import React, { useMemo } from 'react';
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

const ParticleBackground: React.FC = () => {
  const { theme } = useTheme();

  const particles = useMemo(() => {
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
      const color = baseColors[Math.floor(Math.random() * baseColors.length)];
      const speedRoll = Math.random();
      const animationClass = speedRoll > 0.7 ? 'animate-float-fast' : speedRoll < 0.25 ? 'animate-float-slow' : 'animate-float';
      const twinkleClass = Math.random() > 0.5 ? 'animate-twinkle' : 'animate-twinkle-slow';

      return {
        id: `primary-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 1.5,
        duration: Math.random() * 14 + 10,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.35 + 0.15,
        blurClass: Math.random() > 0.6 ? 'blur-md' : 'blur-sm',
        animationClass,
        twinkleClass,
        glowClass: Math.random() > 0.6 ? 'particle-glow' : '',
        gradient: createRadialGradient(color, theme),
      };
    });

    const accentParticles: Particle[] = Array.from({ length: totalAccent }, (_, i) => {
      const color = baseColors[Math.floor(Math.random() * baseColors.length)];
      return {
        id: `accent-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 14 + 8,
        duration: Math.random() * 18 + 18,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.25 + 0.1,
        blurClass: 'blur-md',
        animationClass: 'animate-float-slow',
        twinkleClass: 'animate-twinkle-slow',
        glowClass: 'particle-glow-strong',
        gradient: createRadialGradient(color, theme),
      };
    });

    return [...primaryParticles, ...accentParticles];
  }, [theme]);

  const streaks = useMemo<Streak[]>(() => {
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
      const gradient = accentGradients[Math.floor(Math.random() * accentGradients.length)];
      return {
        id: `streak-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: Math.random() * 2 + 1,
        height: Math.random() * 120 + 80,
        rotation: (Math.random() - 0.5) * 22,
        duration: Math.random() * 10 + 12,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.2 + 0.05,
        gradient,
      };
    });
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
};

export default ParticleBackground;
