/**
 * Background Effect Component
 * Enhanced animated background with cyber grid and floating particles
 * IMPROVEMENT: Added floating particles and enhanced visual depth per user review
 */

import React from 'react';

const BackgroundEffect: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"></div>
      
      {/* Enhanced Grid pattern with subtle animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}></div>
      </div>
      
      {/* Floating Particles - addresses review feedback on depth and visual appeal */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      {/* Glowing orbs with enhanced colors */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00f3ff 2px, #00f3ff 4px)',
        }}></div>
      </div>
    </div>
  );
};

export default BackgroundEffect;
