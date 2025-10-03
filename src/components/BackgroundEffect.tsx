/**
 * Background Effect Component
 * Animated background with cyber grid effect
 */

import React from 'react';

const BackgroundEffect: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #00f3ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f3ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}></div>
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      
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
