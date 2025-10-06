/**
 * Byte Palette Component
 * Grid of all possible bytes (0x00-0xFF) for drag-and-drop
 */

import React, { useState, useMemo } from 'react';
import { SERVICE_IDS, BYTE_CATEGORIES } from '../types/hexEditor';
import type { DragData } from '../types/hexEditor';

interface BytePaletteProps {
  /** Callback when byte is selected */
  onByteSelect: (byte: number) => void;
  /** Recently used bytes to highlight */
  recentBytes: number[];
  /** Bytes to highlight (e.g., service IDs) */
  highlightedBytes?: number[];
}

export const BytePalette: React.FC<BytePaletteProps> = ({
  onByteSelect,
  recentBytes,
  highlightedBytes = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Generate all 256 bytes
  const allBytes = useMemo(() => {
    return Array.from({ length: 256 }, (_, i) => i);
  }, []);

  // Filter bytes based on search and category
  const filteredBytes = useMemo(() => {
    let bytes = allBytes;

    // Category filter
    if (categoryFilter !== 'all') {
      const category = BYTE_CATEGORIES.find(c => c.name === categoryFilter);
      if (category) {
        bytes = bytes.filter(b => category.bytes.includes(b));
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      bytes = bytes.filter(byte => {
        const hex = byte.toString(16).toUpperCase().padStart(2, '0');
        const dec = byte.toString();
        const service = SERVICE_IDS[byte];
        
        return (
          hex.includes(query.toUpperCase()) ||
          dec.includes(query) ||
          (service && service.name.toLowerCase().includes(query))
        );
      });
    }

    return bytes;
  }, [allBytes, categoryFilter, searchQuery]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, byte: number) => {
    const dragData: DragData = {
      type: 'palette-byte',
      byte,
      metadata: {
        description: SERVICE_IDS[byte]?.name
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Check if byte is in a category
  const getByteCategory = (byte: number) => {
    return BYTE_CATEGORIES.find(cat => cat.bytes.includes(byte));
  };

  // Render a single byte
  const renderByte = (byte: number) => {
    const isRecent = recentBytes.includes(byte);
    const isHighlighted = highlightedBytes.includes(byte);
    const isServiceId = !!SERVICE_IDS[byte];
    const category = getByteCategory(byte);
    
    const hex = byte.toString(16).toUpperCase().padStart(2, '0');

    return (
      <button
        key={byte}
        draggable
        onDragStart={(e) => handleDragStart(e, byte)}
        onClick={() => onByteSelect(byte)}
        className={`
          group relative px-2 py-1.5 rounded text-xs font-mono
          transition-all duration-200 border
          ${isServiceId 
            ? 'bg-cyber-blue/10 border-cyber-blue/50 hover:bg-cyber-blue/20' 
            : category
            ? `${category.colorClass} hover:opacity-80`
            : 'bg-dark-700/50 border-dark-600 hover:bg-dark-600'}
          ${isRecent ? 'ring-2 ring-purple-500/50' : ''}
          ${isHighlighted ? 'ring-2 ring-yellow-500/50' : ''}
          hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing
        `}
        title={SERVICE_IDS[byte]?.name || `Byte 0x${hex}`}
      >
        <span className="text-white">{hex}</span>
        
        {/* Tooltip on hover */}
        <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-900 border border-dark-600 rounded shadow-lg text-xs whitespace-nowrap z-50">
          {SERVICE_IDS[byte] ? (
            <>
              <div className="text-cyber-blue font-semibold">{SERVICE_IDS[byte].name}</div>
              <div className="text-gray-400 text-[10px]">0x{hex} ({byte})</div>
            </>
          ) : (
            <div className="text-gray-300">0x{hex} ({byte})</div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Byte Palette
        </h3>
        <p className="text-xs text-gray-400">Click or drag bytes to add them to your request</p>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hex, decimal, or service name..."
          className="w-full cyber-input text-xs"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            categoryFilter === 'all'
              ? 'bg-cyber-blue text-white'
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
        >
          All ({allBytes.length})
        </button>
        {BYTE_CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => setCategoryFilter(cat.name)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              categoryFilter === cat.name
                ? 'bg-cyber-blue text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
            title={cat.description}
          >
            {cat.name} ({cat.bytes.length})
          </button>
        ))}
      </div>

      {/* Recent Bytes */}
      {recentBytes.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs text-gray-400 mb-1.5">Recent</h4>
          <div className="flex flex-wrap gap-1.5">
            {recentBytes.slice(0, 8).map(renderByte)}
          </div>
        </div>
      )}

      {/* Byte Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-8 gap-1.5 pb-2">
          {filteredBytes.map(renderByte)}
        </div>
        
        {filteredBytes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No bytes found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-dark-600">
        <h4 className="text-xs text-gray-400 mb-2">Legend</h4>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-cyber-blue/10 border border-cyber-blue/50"></div>
            <span className="text-gray-400">Service ID</span>
          </div>
          {BYTE_CATEGORIES.slice(1).map(cat => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${cat.colorClass}`}></div>
              <span className="text-gray-400">{cat.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-dark-700/50 border border-dark-600"></div>
            <span className="text-gray-400">Other bytes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-dark-700/50 border border-dark-600 ring-2 ring-purple-500/50"></div>
            <span className="text-gray-400">Recently used</span>
          </div>
        </div>
      </div>
    </div>
  );
};
