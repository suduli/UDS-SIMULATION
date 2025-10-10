/**
 * Example: Enhanced Session Stats Card with Sparkles
 * This shows how you can enhance your existing cards with sparkles
 */

import React from 'react';
import SessionStatsCardRedesigned from '../SessionStatsCardRedesigned';
import CardWithSparkles from '../CardWithSparkles';

/**
 * Option 1: Wrap the entire card
 */
export const SessionStatsWithSparkles: React.FC = () => {
  return (
    <CardWithSparkles 
      sparkleColor="#38BDF8"
      particleDensity={40}
      minSize={0.3}
      maxSize={0.9}
      speed={1.5}
      className="rounded-xl"
    >
      <SessionStatsCardRedesigned />
    </CardWithSparkles>
  );
};

/**
 * Option 2: Add sparkles as a background layer inside the card
 * (More control over positioning)
 */
export const SessionStatsWithCustomSparkles: React.FC = () => {
  return (
    <div className="relative">
      {/* Sparkles layer */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <CardWithSparkles 
            sparkleColor="#60A5FA"
            particleDensity={30}
          >
            <div className="w-full h-full" />
          </CardWithSparkles>
        </div>
      </div>
      
      {/* Content layer */}
      <div className="relative z-10">
        <SessionStatsCardRedesigned />
      </div>
    </div>
  );
};

/**
 * Option 3: Conditional sparkles (on hover or when active)
 */
export const SessionStatsWithHoverSparkles: React.FC = () => {
  const [showSparkles, setShowSparkles] = React.useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowSparkles(true)}
      onMouseLeave={() => setShowSparkles(false)}
    >
      {/* Sparkles appear on hover */}
      {showSparkles && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <CardWithSparkles 
            sparkleColor="#A855F7"
            particleDensity={60}
            speed={2}
          >
            <div className="w-full h-full" />
          </CardWithSparkles>
        </div>
      )}
      
      <div className="relative z-10 transition-transform duration-300 hover:scale-105">
        <SessionStatsCardRedesigned />
      </div>
    </div>
  );
};

export default SessionStatsWithSparkles;
