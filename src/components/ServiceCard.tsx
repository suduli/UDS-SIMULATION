/**
 * ServiceCard Component
 * Visual card for UDS service selection with icon and description
 */

import React from 'react';
import { ServiceId } from '../types/uds';
import { ServiceTooltip } from './ServiceTooltip';
import { serviceTooltipData } from '../data/serviceTooltipData';

interface ServiceCardProps {
  id: ServiceId;
  name: string;
  icon: string;
  description: string;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  icon,
  description,
  isSelected,
  onClick
}) => {
  const serviceIdHex = `0x${id.toString(16).toUpperCase().padStart(2, '0')}`;
  const tooltipData = serviceTooltipData[serviceIdHex];

  const cardContent = (
    <button
      onClick={onClick}
      className={`group relative p-4 transition-all text-left overflow-hidden ${isSelected
        ? 'bg-cyber-blue/20 border-2 border-cyber-blue shadow-neon-cyan'
        : 'bg-dark-800/50 border border-dark-600 hover:border-cyber-blue/50 hover:bg-dark-800'
        } cyber-shape`}
      aria-pressed={isSelected}
      aria-label={`Select ${name.replace(/^0x\w+ - /, '')}`}
    >
      {/* Scan effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-blue/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

      <div className="flex items-center gap-3 mb-2 relative z-10">
        <span className="text-2xl filter drop-shadow-lg" aria-hidden="true">{icon}</span>
        <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${isSelected
          ? 'bg-cyber-blue text-dark-900'
          : 'bg-dark-900 text-cyber-blue border border-cyber-blue/30'
          }`}>
          {serviceIdHex}
        </span>
      </div>
      <h3 className={`font-bold text-sm mb-1 transition-colors relative z-10 ${isSelected ? 'text-cyber-blue text-glow' : 'text-gray-200 group-hover:text-cyber-blue'
        }`}>
        {name.replace(/^0x\w+ - /, '')}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 relative z-10">{description}</p>

      {isSelected && (
        <div className="absolute top-2 right-2 animate-fade-in z-10">
          <div className="w-2 h-2 bg-cyber-blue rounded-full shadow-neon-cyan animate-pulse" />
        </div>
      )}
    </button>
  );

  // Wrap with tooltip if data is available
  if (tooltipData) {
    return (
      <ServiceTooltip {...tooltipData}>
        {cardContent}
      </ServiceTooltip>
    );
  }

  return cardContent;
};

export default ServiceCard;
