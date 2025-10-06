/**
 * Byte Canvas Component
 * Interactive canvas for building request bytes with drag-and-drop
 */

import React, { useState } from 'react';
import type { ByteItem, DragData } from '../types/hexEditor';
import { hexEditorService } from '../services/HexEditorService';

interface ByteCanvasProps {
  /** Current bytes in the canvas */
  bytes: ByteItem[];
  /** Callback when bytes change */
  onBytesChange: (bytes: ByteItem[]) => void;
  /** Callback when hovering over a byte */
  onByteHover?: (byte: ByteItem, index: number) => void;
}

export const ByteCanvas: React.FC<ByteCanvasProps> = ({
  bytes,
  onBytesChange,
  onByteHover
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
      
      if (data.type === 'palette-byte') {
        // Adding new byte from palette
        const newByte: ByteItem = {
          value: data.byte,
          id: `byte-${Date.now()}-${Math.random()}`,
          category: hexEditorService.categorizeByte(
            data.byte,
            targetIndex,
            bytes.map(b => b.value)
          ),
          description: hexEditorService.getByteDescription(
            data.byte,
            targetIndex,
            bytes.map(b => b.value)
          )
        };
        
        const newBytes = [...bytes];
        newBytes.splice(targetIndex, 0, newByte);
        
        // Recategorize all bytes
        const recategorized = newBytes.map((byte, idx) => ({
          ...byte,
          category: hexEditorService.categorizeByte(
            byte.value,
            idx,
            newBytes.map(b => b.value)
          ),
          description: hexEditorService.getByteDescription(
            byte.value,
            idx,
            newBytes.map(b => b.value)
          )
        }));
        
        onBytesChange(recategorized);
      } else if (data.type === 'editor-byte' && data.sourceIndex !== undefined) {
        // Reordering existing byte
        if (data.sourceIndex !== targetIndex) {
          const newBytes = [...bytes];
          const [movedByte] = newBytes.splice(data.sourceIndex, 1);
          const insertIndex = data.sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
          newBytes.splice(insertIndex, 0, movedByte);
          
          // Recategorize all bytes
          const recategorized = newBytes.map((byte, idx) => ({
            ...byte,
            category: hexEditorService.categorizeByte(
              byte.value,
              idx,
              newBytes.map(b => b.value)
            ),
            description: hexEditorService.getByteDescription(
              byte.value,
              idx,
              newBytes.map(b => b.value)
            )
          }));
          
          onBytesChange(recategorized);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Handle drop at end of list
  const handleDropAtEnd = (e: React.DragEvent) => {
    handleDrop(e, bytes.length);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drag start from canvas
  const handleDragStart = (e: React.DragEvent, byte: ByteItem, index: number) => {
    const dragData: DragData = {
      type: 'editor-byte',
      byte: byte.value,
      sourceIndex: index,
      metadata: {
        label: byte.label,
        category: byte.category,
        description: byte.description
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Delete byte
  const handleDelete = (index: number) => {
    const newBytes = bytes.filter((_, i) => i !== index);
    
    // Recategorize remaining bytes
    const recategorized = newBytes.map((byte, idx) => ({
      ...byte,
      category: hexEditorService.categorizeByte(
        byte.value,
        idx,
        newBytes.map(b => b.value)
      ),
      description: hexEditorService.getByteDescription(
        byte.value,
        idx,
        newBytes.map(b => b.value)
      )
    }));
    
    onBytesChange(recategorized);
    setSelectedIndex(null);
  };

  // Clear all bytes
  const handleClear = () => {
    if (bytes.length > 0) {
      if (confirm('Clear all bytes?')) {
        onBytesChange([]);
        setSelectedIndex(null);
      }
    }
  };

  // Get color class for category
  const getCategoryColor = (category?: ByteItem['category']) => {
    switch (category) {
      case 'sid':
        return 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue';
      case 'subfunction':
        return 'bg-purple-500/20 border-purple-500 text-purple-300';
      case 'identifier':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      case 'data':
        return 'bg-green-500/20 border-green-500 text-green-300';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Request Builder
          </h3>
          <p className="text-xs text-gray-400">
            {bytes.length} byte{bytes.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {bytes.length > 0 && (
          <button
            onClick={handleClear}
            className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Clear all bytes"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className="flex-1 min-h-[200px] bg-dark-800/50 rounded-lg border-2 border-dashed border-dark-600 p-4 overflow-y-auto custom-scrollbar"
        onDrop={handleDropAtEnd}
        onDragOver={(e) => {
          e.preventDefault();
          if (bytes.length === 0) {
            setDragOverIndex(0);
          }
        }}
        onDragLeave={() => setDragOverIndex(null)}
      >
        {bytes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium">Drag bytes here</p>
            <p className="text-xs mt-1">or click bytes in the palette to add them</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bytes.map((byte, index) => {
              const hex = byte.value.toString(16).toUpperCase().padStart(2, '0');
              const isSelected = selectedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <React.Fragment key={byte.id}>
                  {/* Drop indicator */}
                  {isDragOver && (
                    <div className="w-1 h-8 bg-cyber-blue rounded animate-pulse"></div>
                  )}
                  
                  {/* Byte item */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, byte, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onClick={() => {
                      setSelectedIndex(isSelected ? null : index);
                      onByteHover?.(byte, index);
                    }}
                    className={`
                      group relative px-3 py-2 rounded border-2 cursor-move
                      transition-all duration-200
                      ${getCategoryColor(byte.category)}
                      ${isSelected ? 'ring-2 ring-cyber-blue shadow-neon' : ''}
                      hover:scale-105 active:scale-95 active:cursor-grabbing
                    `}
                  >
                    {/* Position badge */}
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-dark-900 border border-dark-600 rounded-full flex items-center justify-center text-[9px] text-gray-400 font-mono">
                      {index}
                    </div>

                    {/* Byte value */}
                    <div className="font-mono text-sm font-bold">{hex}</div>
                    
                    {/* Label if exists */}
                    {byte.label && (
                      <div className="text-[9px] mt-0.5 opacity-70">{byte.label}</div>
                    )}

                    {/* Delete button on hover/select */}
                    {(isSelected || index === selectedIndex) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                        title="Delete byte"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Tooltip */}
                    <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-900 border border-dark-600 rounded shadow-lg text-xs whitespace-nowrap z-50">
                      <div className="text-white font-semibold">{byte.description || `Byte ${index}`}</div>
                      <div className="text-gray-400 text-[10px]">Position: {index} | Value: 0x{hex} ({byte.value})</div>
                      {byte.category && (
                        <div className="text-gray-500 text-[10px] capitalize">Type: {byte.category}</div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            
            {/* Final drop zone */}
            {dragOverIndex === bytes.length && (
              <div className="w-1 h-8 bg-cyber-blue rounded animate-pulse"></div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mt-3 bg-dark-900/50 rounded-lg p-3 border border-dark-600">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs text-gray-400">Hex Preview</h4>
          {bytes.length > 0 && (
            <button
              onClick={() => {
                const hexString = bytes.map(b => b.value.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                navigator.clipboard.writeText(hexString);
              }}
              className="text-xs text-cyber-blue hover:text-cyber-blue/80 transition-colors"
              title="Copy to clipboard"
            >
              Copy
            </button>
          )}
        </div>
        <div className="font-mono text-cyber-green text-sm break-all">
          {bytes.length > 0 
            ? bytes.map(b => b.value.toString(16).toUpperCase().padStart(2, '0')).join(' ')
            : 'No bytes yet...'}
        </div>
      </div>
    </div>
  );
};
