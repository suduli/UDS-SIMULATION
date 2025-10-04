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
  color,
  isSelected,
  onClick
}) => {
  const serviceIdHex = `0x${id.toString(16).toUpperCase().padStart(2, '0')}`;
  const tooltipData = serviceTooltipData[serviceIdHex];

  const cardContent = (
    <button
      onClick={onClick}
      className={`group relative p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
        isSelected 
          ? 'border-cyber-blue bg-cyber-blue/10 shadow-neon' 
          : 'border-dark-600 hover:border-cyber-blue/50 bg-dark-800/50'
      }`}
      aria-pressed={isSelected}
      aria-label={`Select ${name.replace(/^0x\w+ - /, '')}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
        <span className={`font-mono text-sm font-bold ${isSelected ? 'text-cyber-blue' : color}`}>
          {serviceIdHex}
        </span>
      </div>
      <h3 className={`font-bold text-sm mb-1 transition-colors ${
        isSelected ? 'text-cyber-blue' : 'text-gray-200 group-hover:text-cyber-blue'
      }`}>
        {name.replace(/^0x\w+ - /, '')}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
      
      {isSelected && (
        <div className="absolute top-2 right-2 animate-fade-in">
          <svg className="w-5 h-5 text-cyber-blue" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
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
