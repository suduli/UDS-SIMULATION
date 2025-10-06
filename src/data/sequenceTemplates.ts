/**
 * Sequence Templates
 * Pre-built diagnostic workflow templates for common UDS operations
 */

import type { SequenceTemplate } from '../types/sequence';
import { ServiceId } from '../types/uds';

/**
 * Template: Basic Diagnostic Session
 * Enter diagnostic session and read VIN
 * 
 * NOTE: Starts with DEFAULT session (0x01) as a best practice,
 * then optionally transitions to EXTENDED (0x03) if needed.
 */
export const TEMPLATE_BASIC_DIAGNOSTIC: SequenceTemplate = {
  id: 'template_basic_diagnostic',
  name: 'Basic Diagnostic Workflow',
  description: 'Simple two-step diagnostic: Enter default session and read Vehicle Identification Number (VIN)',
  steps: [
    {
      id: 'step_diag_session',
      order: 0,
      request: {
        sid: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x01, // Default diagnostic session (safer starting point)
        data: [],
        timestamp: 0,
      },
      label: 'Enter Default Diagnostic Session',
      description: 'Switch ECU to default diagnostic mode (0x01)',
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
      expectedResponse: { isPositive: true },
    },
    {
      id: 'step_read_vin',
      order: 1,
      request: {
        sid: ServiceId.READ_DATA_BY_IDENTIFIER,
        data: [0xF1, 0x90], // VIN data identifier
        timestamp: 0,
      },
      label: 'Read VIN',
      description: 'Read Vehicle Identification Number (DID 0xF190)',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
      expectedResponse: { isPositive: true },
    },
  ],
  variables: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  isTemplate: true,
  category: 'diagnostic-session',
  difficulty: 'beginner',
  estimatedDuration: 500,
  tags: ['diagnostic', 'session', 'vin', 'beginner'],
};

/**
 * Template: Security Access Workflow
 * Complete security access sequence with proper session activation
 * 
 * NOTE: Security access typically requires Extended Diagnostic Session (0x03)
 */
export const TEMPLATE_SECURITY_ACCESS: SequenceTemplate = {
  id: 'template_security_access',
  name: 'Security Access Sequence',
  description: 'Enter extended session and perform security access authentication',
  steps: [
    {
      id: 'step_enter_extended',
      order: 0,
      request: {
        sid: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x03, // Extended diagnostic session
        data: [],
        timestamp: 0,
      },
      label: 'Enter Extended Diagnostic Session',
      description: 'Switch to extended session (required for security access)',
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
      expectedResponse: { isPositive: true },
    },
    {
      id: 'step_request_seed',
      order: 1,
      request: {
        sid: ServiceId.SECURITY_ACCESS,
        subFunction: 0x01, // Request seed
        data: [],
        timestamp: 0,
      },
      label: 'Request Security Seed',
      description: 'Request random seed from ECU for security calculation',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
      expectedResponse: { isPositive: true },
    },
    {
      id: 'step_send_key',
      order: 2,
      request: {
        sid: ServiceId.SECURITY_ACCESS,
        subFunction: 0x02, // Send key
        data: [0x12, 0x34, 0x56, 0x78], // Placeholder key (calculated from seed in real scenarios)
        timestamp: 0,
      },
      label: 'Send Security Key',
      description: 'Send calculated key to unlock ECU (using simplified key for demo)',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
      expectedResponse: { isPositive: true },
    },
  ],
  variables: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  isTemplate: true,
  category: 'security-access',
  difficulty: 'intermediate',
  estimatedDuration: 400,
  tags: ['security', 'authentication', 'extended-session'],
  prerequisites: ['Understanding of security access algorithms'],
};

/**
 * Template: DTC Management
 * Read and clear diagnostic trouble codes
 */
export const TEMPLATE_DTC_MANAGEMENT: SequenceTemplate = {
  id: 'template_dtc_management',
  name: 'DTC Management',
  description: 'Read diagnostic trouble codes and clear them',
  steps: [
    {
      id: 'step_read_dtc',
      order: 0,
      request: {
        sid: ServiceId.READ_DTC_INFORMATION,
        subFunction: 0x02, // Report DTC by status mask
        data: [0xFF], // All DTCs
        timestamp: 0,
      },
      label: 'Read All DTCs',
      description: 'Read all stored diagnostic trouble codes',
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
      expectedResponse: { isPositive: true },
    },
    {
      id: 'step_clear_dtc',
      order: 1,
      request: {
        sid: ServiceId.CLEAR_DIAGNOSTIC_INFORMATION,
        data: [0xFF, 0xFF, 0xFF], // Clear all DTCs (group mask)
        timestamp: 0,
      },
      label: 'Clear All DTCs',
      description: 'Clear all diagnostic trouble codes from ECU memory',
      delay: 200,
      continueOnError: true,
      condition: { type: 'always' },
      expectedResponse: { isPositive: true },
    },
    {
      id: 'step_verify_clear',
      order: 2,
      request: {
        sid: ServiceId.READ_DTC_INFORMATION,
        subFunction: 0x02,
        data: [0xFF],
        timestamp: 0,
      },
      label: 'Verify DTCs Cleared',
      description: 'Confirm that DTCs have been cleared',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
  ],
  variables: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  isTemplate: true,
  category: 'dtc-management',
  difficulty: 'beginner',
  estimatedDuration: 600,
  tags: ['dtc', 'diagnostics', 'clear'],
};

/**
 * Template: Memory Operations
 * Read memory and write data
 */
export const TEMPLATE_MEMORY_OPERATIONS: SequenceTemplate = {
  id: 'template_memory_operations',
  name: 'Memory Read/Write',
  description: 'Read and write ECU memory with security access',
  steps: [
    {
      id: 'step_diag_session',
      order: 0,
      request: {
        sid: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x03,
        data: [],
        timestamp: 0,
      },
      label: 'Enter Programming Session',
      description: 'Enter programming diagnostic session',
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
    },
    {
      id: 'step_security_seed',
      order: 1,
      request: {
        sid: ServiceId.SECURITY_ACCESS,
        subFunction: 0x01,
        data: [],
        timestamp: 0,
      },
      label: 'Request Seed',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
    {
      id: 'step_security_key',
      order: 2,
      request: {
        sid: ServiceId.SECURITY_ACCESS,
        subFunction: 0x02,
        data: [0x12, 0x34, 0x56, 0x78],
        timestamp: 0,
      },
      label: 'Send Key',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
    {
      id: 'step_read_memory',
      order: 3,
      request: {
        sid: ServiceId.READ_MEMORY_BY_ADDRESS,
        data: [0x44, 0x00, 0x10, 0x00, 0x00, 0x10], // Address and size
        timestamp: 0,
      },
      label: 'Read Memory Block',
      description: 'Read 16 bytes from address 0x001000',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
  ],
  variables: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  isTemplate: true,
  category: 'memory-operations',
  difficulty: 'advanced',
  estimatedDuration: 600,
  tags: ['memory', 'security', 'programming'],
  prerequisites: ['Security access unlocked', 'Programming session'],
};

/**
 * Template: Complete Diagnostic Workflow
 * Full diagnostic sequence with session control, DTC reading, and data collection
 */
export const TEMPLATE_COMPLETE_WORKFLOW: SequenceTemplate = {
  id: 'template_complete_workflow',
  name: 'Complete Diagnostic Workflow',
  description: 'Comprehensive diagnostic sequence covering multiple services',
  steps: [
    {
      id: 'step_default_session',
      order: 0,
      request: {
        sid: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x01, // Default session
        data: [],
        timestamp: 0,
      },
      label: 'Reset to Default Session',
      delay: 100,
      continueOnError: true,
      condition: { type: 'always' },
    },
    {
      id: 'step_extended_session',
      order: 1,
      request: {
        sid: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x03, // Extended session
        data: [],
        timestamp: 0,
      },
      label: 'Enter Extended Session',
      delay: 100,
      continueOnError: false,
      condition: { type: 'always' },
    },
    {
      id: 'step_read_vin',
      order: 2,
      request: {
        sid: ServiceId.READ_DATA_BY_IDENTIFIER,
        data: [0xF1, 0x90],
        timestamp: 0,
      },
      label: 'Read VIN',
      delay: 100,
      continueOnError: false,
      condition: { type: 'if_positive' },
    },
    {
      id: 'step_read_dtc_count',
      order: 3,
      request: {
        sid: ServiceId.READ_DTC_INFORMATION,
        subFunction: 0x01, // Number of DTCs by status mask
        data: [0xFF],
        timestamp: 0,
      },
      label: 'Get DTC Count',
      delay: 100,
      continueOnError: true,
      condition: { type: 'if_positive' },
    },
    {
      id: 'step_read_dtcs',
      order: 4,
      request: {
        sid: ServiceId.READ_DTC_INFORMATION,
        subFunction: 0x02, // Report DTCs
        data: [0xFF],
        timestamp: 0,
      },
      label: 'Read All DTCs',
      delay: 100,
      continueOnError: true,
      condition: { type: 'if_positive' },
    },
    {
      id: 'step_tester_present',
      order: 5,
      request: {
        sid: 0x3E as ServiceId, // Tester Present (0x3E - valid UDS service)
        subFunction: 0x00,
        data: [],
        timestamp: 0,
      },
      label: 'Send Tester Present',
      description: 'Keep session alive',
      delay: 100,
      continueOnError: true,
      condition: { type: 'always' },
    },
  ],
  variables: {},
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  isTemplate: true,
  category: 'complete-workflow',
  difficulty: 'intermediate',
  estimatedDuration: 1000,
  tags: ['workflow', 'diagnostics', 'comprehensive'],
};

/**
 * All available templates
 */
export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  TEMPLATE_BASIC_DIAGNOSTIC,
  TEMPLATE_SECURITY_ACCESS,
  TEMPLATE_DTC_MANAGEMENT,
  TEMPLATE_MEMORY_OPERATIONS,
  TEMPLATE_COMPLETE_WORKFLOW,
];

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): SequenceTemplate | undefined => {
  return SEQUENCE_TEMPLATES.find(t => t.id === id);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): SequenceTemplate[] => {
  return SEQUENCE_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get templates by difficulty
 */
export const getTemplatesByDifficulty = (difficulty: string): SequenceTemplate[] => {
  return SEQUENCE_TEMPLATES.filter(t => t.difficulty === difficulty);
};
