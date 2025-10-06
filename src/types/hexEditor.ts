/**
 * Hex Editor Type Definitions
 * Advanced byte-level editing types for visual hex editor
 */

/**
 * Represents a single byte in the hex editor
 */
export interface ByteItem {
  /** Byte value (0x00-0xFF) */
  value: number;
  /** Unique identifier for drag-and-drop */
  id: string;
  /** Optional label for display (e.g., "SID", "Sub-Fn") */
  label?: string;
  /** Category for color coding */
  category?: 'sid' | 'subfunction' | 'data' | 'identifier' | 'address' | 'length';
  /** Tooltip description */
  description?: string;
}

/**
 * Template for common byte patterns
 */
export interface ByteTemplate {
  /** Unique template ID */
  id: string;
  /** Template name */
  name: string;
  /** Description of what this template does */
  description: string;
  /** Byte sequence */
  bytes: number[];
  /** Category for organization */
  category: string;
  /** Tags for search */
  tags?: string[];
}

/**
 * State of the hex editor
 */
export interface HexEditorState {
  /** Current bytes in the editor */
  bytes: ByteItem[];
  /** Index of selected byte (for editing/deletion) */
  selectedByteIndex: number | null;
  /** Recently used bytes */
  recentBytes: number[];
  /** User-saved custom templates */
  customTemplates: ByteTemplate[];
}

/**
 * Data transferred during drag operations
 */
export interface DragData {
  /** Source of drag */
  type: 'palette-byte' | 'editor-byte';
  /** Byte value being dragged */
  byte: number;
  /** Original index if dragging from editor */
  sourceIndex?: number;
  /** Optional metadata */
  metadata?: {
    label?: string;
    category?: ByteItem['category'];
    description?: string;
  };
}

/**
 * Validation result for byte sequences
 */
export interface ValidationResult {
  /** Whether the sequence is valid */
  valid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages (non-critical) */
  warnings: string[];
}

/**
 * Byte suggestion for smart assistance
 */
export interface ByteSuggestion {
  /** Suggested byte value */
  value: number;
  /** Reason for suggestion */
  reason: string;
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Byte category metadata for palette organization
 */
export interface ByteCategoryInfo {
  /** Category name */
  name: string;
  /** Display color class */
  colorClass: string;
  /** Description */
  description: string;
  /** Byte values in this category */
  bytes: number[];
}

/**
 * Built-in templates for common UDS requests
 */
export const BUILTIN_TEMPLATES: ByteTemplate[] = [
  {
    id: 'template-session-default',
    name: 'Default Session',
    description: 'Switch to default diagnostic session',
    bytes: [0x10, 0x01],
    category: 'Session Control',
    tags: ['session', 'default', 'basic']
  },
  {
    id: 'template-session-extended',
    name: 'Extended Session',
    description: 'Switch to extended diagnostic session',
    bytes: [0x10, 0x03],
    category: 'Session Control',
    tags: ['session', 'extended']
  },
  {
    id: 'template-session-programming',
    name: 'Programming Session',
    description: 'Switch to programming session',
    bytes: [0x10, 0x02],
    category: 'Session Control',
    tags: ['session', 'programming', 'flash']
  },
  {
    id: 'template-security-seed',
    name: 'Security Seed Request',
    description: 'Request security access seed (level 1)',
    bytes: [0x27, 0x01],
    category: 'Security Access',
    tags: ['security', 'seed', 'unlock']
  },
  {
    id: 'template-security-key',
    name: 'Security Key Send',
    description: 'Send security key (level 2) - placeholder bytes',
    bytes: [0x27, 0x02, 0x00, 0x00, 0x00, 0x00],
    category: 'Security Access',
    tags: ['security', 'key', 'unlock']
  },
  {
    id: 'template-read-vin',
    name: 'Read VIN',
    description: 'Read Vehicle Identification Number',
    bytes: [0x22, 0xF1, 0x90],
    category: 'Read Data',
    tags: ['read', 'vin', 'identifier']
  },
  {
    id: 'template-read-dtc-current',
    name: 'Read Current DTCs',
    description: 'Read current diagnostic trouble codes',
    bytes: [0x19, 0x02, 0x08],
    category: 'DTC',
    tags: ['dtc', 'trouble', 'current']
  },
  {
    id: 'template-clear-dtc',
    name: 'Clear All DTCs',
    description: 'Clear all diagnostic trouble codes',
    bytes: [0x14, 0xFF, 0xFF, 0xFF],
    category: 'DTC',
    tags: ['clear', 'dtc', 'reset']
  },
  {
    id: 'template-ecu-reset-hard',
    name: 'Hard ECU Reset',
    description: 'Perform hard reset of ECU',
    bytes: [0x11, 0x01],
    category: 'ECU Reset',
    tags: ['reset', 'hard', 'reboot']
  },
  {
    id: 'template-ecu-reset-soft',
    name: 'Soft ECU Reset',
    description: 'Perform soft reset of ECU',
    bytes: [0x11, 0x03],
    category: 'ECU Reset',
    tags: ['reset', 'soft', 'reboot']
  },
  {
    id: 'template-tester-present',
    name: 'Tester Present',
    description: 'Keep session active with tester present',
    bytes: [0x3E, 0x00],
    category: 'Communication',
    tags: ['tester', 'present', 'keepalive']
  }
];

/**
 * Common UDS Service IDs with descriptions
 */
export const SERVICE_IDS: Record<number, { name: string; description: string }> = {
  0x10: { name: 'Diagnostic Session Control', description: 'Control diagnostic session type' },
  0x11: { name: 'ECU Reset', description: 'Reset the ECU' },
  0x14: { name: 'Clear DTC', description: 'Clear diagnostic trouble codes' },
  0x19: { name: 'Read DTC Information', description: 'Read diagnostic trouble codes' },
  0x22: { name: 'Read Data By Identifier', description: 'Read data using identifier' },
  0x23: { name: 'Read Memory By Address', description: 'Read memory at specific address' },
  0x27: { name: 'Security Access', description: 'Unlock security access' },
  0x28: { name: 'Communication Control', description: 'Control communication' },
  0x2A: { name: 'Read Data By Periodic ID', description: 'Read periodic data' },
  0x2E: { name: 'Write Data By Identifier', description: 'Write data using identifier' },
  0x31: { name: 'Routine Control', description: 'Control ECU routines' },
  0x34: { name: 'Request Download', description: 'Initiate download sequence' },
  0x36: { name: 'Transfer Data', description: 'Transfer data blocks' },
  0x37: { name: 'Request Transfer Exit', description: 'Exit transfer mode' },
  0x3D: { name: 'Write Memory By Address', description: 'Write to memory address' },
  0x3E: { name: 'Tester Present', description: 'Keep session active' }
};

/**
 * Byte category definitions for palette organization
 */
export const BYTE_CATEGORIES: ByteCategoryInfo[] = [
  {
    name: 'Service IDs',
    colorClass: 'bg-cyber-blue/20 border-cyber-blue',
    description: 'UDS Service Identifiers',
    bytes: [0x10, 0x11, 0x14, 0x19, 0x22, 0x23, 0x27, 0x28, 0x2A, 0x2E, 0x31, 0x34, 0x36, 0x37, 0x3D, 0x3E]
  },
  {
    name: 'Common Sub-Functions',
    colorClass: 'bg-purple-500/20 border-purple-500',
    description: 'Frequently used sub-function bytes',
    bytes: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]
  },
  {
    name: 'Common Data',
    colorClass: 'bg-green-500/20 border-green-500',
    description: 'Common data bytes',
    bytes: [0x00, 0xFF]
  }
];
