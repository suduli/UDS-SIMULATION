/**
 * Advanced Hex Editor Component
 * Visual hex editor with drag-and-drop, templates, and validation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BytePalette } from './BytePalette';
import { ByteCanvas } from './ByteCanvas';
import { hexEditorService } from '../services/HexEditorService';
import { BUILTIN_TEMPLATES } from '../types/hexEditor';
import type { ByteItem, ByteTemplate } from '../types/hexEditor';

interface AdvancedHexEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when bytes are applied */
  onApply: (bytes: number[]) => void;
  /** Initial bytes to load */
  initialBytes?: number[];
}

export const AdvancedHexEditor: React.FC<AdvancedHexEditorProps> = ({
  isOpen,
  onClose,
  onApply,
  initialBytes = []
}) => {
  const [bytes, setBytes] = useState<ByteItem[]>([]);
  const [recentBytes, setRecentBytes] = useState<number[]>([]);
  const [customTemplates, setCustomTemplates] = useState<ByteTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Load initial bytes when modal opens
  useEffect(() => {
    if (isOpen && initialBytes.length > 0) {
      const initialByteItems: ByteItem[] = initialBytes.map((byte, index) => ({
        value: byte,
        id: `byte-init-${index}`,
        category: hexEditorService.categorizeByte(byte, index, initialBytes),
        description: hexEditorService.getByteDescription(byte, index, initialBytes)
      }));
      setBytes(initialByteItems);
    }
  }, [isOpen, initialBytes]);

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hexEditor_customTemplates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    }

    const savedRecent = localStorage.getItem('hexEditor_recentBytes');
    if (savedRecent) {
      try {
        setRecentBytes(JSON.parse(savedRecent));
      } catch (error) {
        console.error('Error loading recent bytes:', error);
      }
    }
  }, []);

  // Validation result
  const validation = useMemo(() => {
    return hexEditorService.validateByteSequence(bytes.map(b => b.value));
  }, [bytes]);

  // Suggestions
  const suggestions = useMemo(() => {
    if (!showSuggestions || bytes.length > 20) return [];
    return hexEditorService.suggestNextByte(bytes.map(b => b.value));
  }, [bytes, showSuggestions]);

  // Handle byte selection from palette
  const handleByteSelect = (byte: number) => {
    const newByte: ByteItem = {
      value: byte,
      id: `byte-${Date.now()}-${Math.random()}`,
      category: hexEditorService.categorizeByte(byte, bytes.length, bytes.map(b => b.value)),
      description: hexEditorService.getByteDescription(byte, bytes.length, bytes.map(b => b.value))
    };
    
    setBytes([...bytes, newByte]);
    
    // Update recent bytes
    const newRecent = [byte, ...recentBytes.filter(b => b !== byte)].slice(0, 16);
    setRecentBytes(newRecent);
    localStorage.setItem('hexEditor_recentBytes', JSON.stringify(newRecent));
  };

  // Handle template load
  const handleLoadTemplate = (templateId: string) => {
    const template = [...BUILTIN_TEMPLATES, ...customTemplates].find(t => t.id === templateId);
    if (template) {
      const templateBytes: ByteItem[] = template.bytes.map((byte, index) => ({
        value: byte,
        id: `byte-template-${index}`,
        category: hexEditorService.categorizeByte(byte, index, template.bytes),
        description: hexEditorService.getByteDescription(byte, index, template.bytes)
      }));
      setBytes(templateBytes);
      setShowTemplates(false);
    }
  };

  // Save as custom template
  const handleSaveTemplate = () => {
    if (bytes.length === 0) return;

    const name = prompt('Enter template name:');
    if (!name) return;

    const description = prompt('Enter template description:');
    if (!description) return;

    const newTemplate: ByteTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      bytes: bytes.map(b => b.value),
      category: 'Custom'
    };

    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('hexEditor_customTemplates', JSON.stringify(updated));
    
    alert('Template saved!');
  };

  // Handle apply
  const handleApply = () => {
    if (validation.errors.length > 0) {
      if (!confirm('There are validation errors. Apply anyway?')) {
        return;
      }
    }

    onApply(bytes.map(b => b.value));
    onClose();
  };

  // Handle suggestion click
  const handleSuggestionClick = (byte: number) => {
    handleByteSelect(byte);
  };

  if (!isOpen) return null;

  // Group templates by category
  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];
  const templatesByCategory = allTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ByteTemplate[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[90vh] bg-dark-900 rounded-xl border-2 border-cyber-blue/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Advanced Hex Editor
            </h2>
            <p className="text-sm text-gray-400 mt-1">Visual byte-level request builder</p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-dark-700 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Palette */}
          <div className="w-80 border-r border-dark-700 p-4 overflow-y-auto custom-scrollbar">
            <BytePalette
              onByteSelect={handleByteSelect}
              recentBytes={recentBytes}
            />
          </div>

          {/* Right Panel - Canvas and Info */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <ByteCanvas
                bytes={bytes}
                onBytesChange={setBytes}
              />
            </div>

            {/* Bottom Panel - Validation & Suggestions */}
            <div className="border-t border-dark-700 p-4 bg-dark-800/50">
              {/* Validation */}
              {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                <div className="mb-3">
                  {validation.errors.map((error, idx) => (
                    <div key={`error-${idx}`} className="text-xs text-red-400 flex items-start mb-1">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  ))}
                  {validation.warnings.map((warning, idx) => (
                    <div key={`warning-${idx}`} className="text-xs text-yellow-400 flex items-start mb-1">
                      <svg className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs text-gray-400 mb-2">Suggested Next Bytes</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 5).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion.value)}
                        className="px-2 py-1 rounded text-xs bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue/30 transition-colors"
                        title={`Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`}
                      >
                        0x{suggestion.value.toString(16).toUpperCase().padStart(2, '0')} - {suggestion.reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates */}
              <div>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs text-gray-400 hover:text-gray-200 flex items-center mb-2 transition-colors"
                >
                  <svg className={`w-4 h-4 mr-1 transition-transform ${showTemplates ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Templates ({allTemplates.length})
                </button>
                
                {showTemplates && (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {Object.entries(templatesByCategory).map(([category, templates]) => (
                      <React.Fragment key={category}>
                        <div className="col-span-2 text-xs text-gray-500 font-semibold mt-2 first:mt-0">
                          {category}
                        </div>
                        {templates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleLoadTemplate(template.id)}
                            className="text-left px-2 py-1.5 rounded text-xs bg-dark-700 hover:bg-dark-600 transition-colors border border-dark-600"
                            title={template.description}
                          >
                            <div className="text-white font-medium truncate">{template.name}</div>
                            <div className="text-gray-500 text-[10px] font-mono">
                              {template.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                            </div>
                          </button>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-dark-700">
          <div className="flex gap-2">
            {bytes.length > 0 && (
              <button
                onClick={handleSaveTemplate}
                className="px-3 py-2 rounded text-sm bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors"
              >
                💾 Save as Template
              </button>
            )}
            <label className="flex items-center text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showSuggestions}
                onChange={(e) => setShowSuggestions(e.target.checked)}
                className="mr-2"
              />
              Show suggestions
            </label>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={bytes.length === 0}
              className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                bytes.length === 0
                  ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white hover:shadow-neon'
              }`}
            >
              Apply to Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
