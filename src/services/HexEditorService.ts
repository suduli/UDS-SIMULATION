/**
 * Hex Editor Service
 * Provides validation, suggestions, and byte descriptions
 */

import type { ValidationResult, ByteSuggestion, ByteItem } from '../types/hexEditor';
import { SERVICE_IDS } from '../types/hexEditor';
import { ServiceId } from '../types/uds';

export class HexEditorService {
  /**
   * Validate a byte sequence
   */
  validateByteSequence(bytes: number[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if empty
    if (bytes.length === 0) {
      warnings.push('Empty byte sequence');
      return { valid: true, errors, warnings };
    }

    // Check first byte is a valid service ID
    const firstByte = bytes[0];
    if (!SERVICE_IDS[firstByte]) {
      warnings.push(`Byte 0x${firstByte.toString(16).toUpperCase().padStart(2, '0')} is not a standard UDS Service ID`);
    }

    // Service-specific validation
    switch (firstByte) {
      case ServiceId.DIAGNOSTIC_SESSION_CONTROL: // 0x10
        if (bytes.length < 2) {
          errors.push('Session Control requires sub-function (byte 2)');
        } else {
          const subFn = bytes[1];
          if (![0x01, 0x02, 0x03, 0x04].includes(subFn)) {
            warnings.push(`Sub-function 0x${subFn.toString(16).toUpperCase().padStart(2, '0')} may not be valid for Session Control`);
          }
        }
        if (bytes.length > 2) {
          warnings.push('Session Control typically only requires 2 bytes');
        }
        break;

      case ServiceId.ECU_RESET: // 0x11
        if (bytes.length < 2) {
          errors.push('ECU Reset requires sub-function (byte 2)');
        } else {
          const subFn = bytes[1];
          if (![0x01, 0x02, 0x03, 0x04, 0x05].includes(subFn)) {
            warnings.push(`Sub-function 0x${subFn.toString(16).toUpperCase().padStart(2, '0')} may not be valid for ECU Reset`);
          }
        }
        if (bytes.length > 2) {
          warnings.push('ECU Reset typically only requires 2 bytes');
        }
        break;

      case ServiceId.CLEAR_DIAGNOSTIC_INFORMATION: // 0x14
        if (bytes.length !== 4) {
          errors.push('Clear DTC requires exactly 4 bytes (SID + 3-byte group)');
        }
        break;

      case ServiceId.READ_DTC_INFORMATION: // 0x19
        if (bytes.length < 2) {
          errors.push('Read DTC requires sub-function (byte 2)');
        }
        break;

      case ServiceId.READ_DATA_BY_IDENTIFIER: // 0x22
        if (bytes.length < 3) {
          errors.push('Read Data By ID requires at least 3 bytes (SID + 2-byte DID)');
        } else if ((bytes.length - 1) % 2 !== 0) {
          warnings.push('Data Identifiers should be 2 bytes each');
        }
        break;

      case ServiceId.SECURITY_ACCESS: // 0x27
        if (bytes.length < 2) {
          errors.push('Security Access requires sub-function (byte 2)');
        } else {
          const subFn = bytes[1];
          // Odd = request seed, Even = send key
          if (subFn % 2 === 0 && bytes.length < 3) {
            errors.push('Security key send requires key bytes (typically 4-8 bytes)');
          }
        }
        break;

      case ServiceId.WRITE_DATA_BY_IDENTIFIER: // 0x2E
        if (bytes.length < 4) {
          errors.push('Write Data By ID requires at least 4 bytes (SID + 2-byte DID + data)');
        }
        break;

      case ServiceId.ROUTINE_CONTROL: // 0x31
        if (bytes.length < 4) {
          errors.push('Routine Control requires at least 4 bytes (SID + sub-fn + 2-byte RID)');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Suggest next byte based on current context
   */
  suggestNextByte(currentBytes: number[]): ByteSuggestion[] {
    const suggestions: ByteSuggestion[] = [];

    // If empty, suggest common service IDs
    if (currentBytes.length === 0) {
      return [
        { value: 0x10, reason: 'Diagnostic Session Control', confidence: 0.9 },
        { value: 0x22, reason: 'Read Data By Identifier', confidence: 0.8 },
        { value: 0x27, reason: 'Security Access', confidence: 0.7 },
        { value: 0x19, reason: 'Read DTC Information', confidence: 0.6 },
        { value: 0x3E, reason: 'Tester Present', confidence: 0.5 }
      ];
    }

    const firstByte = currentBytes[0];

    // Suggest based on first byte (service ID)
    switch (firstByte) {
      case ServiceId.DIAGNOSTIC_SESSION_CONTROL: // 0x10
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x01, reason: 'Default Session', confidence: 0.7 },
            { value: 0x03, reason: 'Extended Session', confidence: 0.9 },
            { value: 0x02, reason: 'Programming Session', confidence: 0.6 }
          );
        }
        break;

      case ServiceId.ECU_RESET: // 0x11
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x01, reason: 'Hard Reset', confidence: 0.8 },
            { value: 0x03, reason: 'Soft Reset', confidence: 0.7 },
            { value: 0x02, reason: 'Key Off/On Reset', confidence: 0.6 }
          );
        }
        break;

      case ServiceId.CLEAR_DIAGNOSTIC_INFORMATION: // 0x14
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0xFF, reason: 'All DTC groups (first byte)', confidence: 0.9 }
          );
        } else if (currentBytes.length === 2) {
          suggestions.push(
            { value: 0xFF, reason: 'All DTC groups (second byte)', confidence: 0.9 }
          );
        } else if (currentBytes.length === 3) {
          suggestions.push(
            { value: 0xFF, reason: 'All DTC groups (third byte)', confidence: 0.9 }
          );
        }
        break;

      case ServiceId.READ_DTC_INFORMATION: // 0x19
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x02, reason: 'Report DTC by status mask', confidence: 0.8 },
            { value: 0x0A, reason: 'Report supported DTCs', confidence: 0.6 }
          );
        } else if (currentBytes.length === 2 && currentBytes[1] === 0x02) {
          suggestions.push(
            { value: 0x08, reason: 'Test failed status mask', confidence: 0.8 }
          );
        }
        break;

      case ServiceId.READ_DATA_BY_IDENTIFIER: // 0x22
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0xF1, reason: 'Common DID prefix (VIN, etc.)', confidence: 0.7 }
          );
        } else if (currentBytes.length === 2 && currentBytes[1] === 0xF1) {
          suggestions.push(
            { value: 0x90, reason: 'VIN Data Identifier', confidence: 0.9 },
            { value: 0x87, reason: 'Part Number', confidence: 0.6 }
          );
        }
        break;

      case ServiceId.SECURITY_ACCESS: // 0x27
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x01, reason: 'Request Seed (Level 1)', confidence: 0.9 },
            { value: 0x02, reason: 'Send Key (Level 2)', confidence: 0.7 }
          );
        } else if (currentBytes.length === 2 && currentBytes[1] === 0x02) {
          suggestions.push(
            { value: 0x00, reason: 'Key byte placeholder', confidence: 0.5 }
          );
        }
        break;

      case ServiceId.ROUTINE_CONTROL: // 0x31
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x01, reason: 'Start Routine', confidence: 0.8 },
            { value: 0x02, reason: 'Stop Routine', confidence: 0.6 },
            { value: 0x03, reason: 'Request Routine Results', confidence: 0.5 }
          );
        }
        break;

      case 0x3E: // Tester Present
        if (currentBytes.length === 1) {
          suggestions.push(
            { value: 0x00, reason: 'Standard tester present', confidence: 0.9 }
          );
        }
        break;
    }

    return suggestions;
  }

  /**
   * Get description for a byte at a specific position
   */
  getByteDescription(byte: number, position: number, context: number[]): string {
    // First byte (Service ID)
    if (position === 0) {
      const service = SERVICE_IDS[byte];
      if (service) {
        return `${service.name} (0x${byte.toString(16).toUpperCase().padStart(2, '0')})`;
      }
      return `Unknown Service ID (0x${byte.toString(16).toUpperCase().padStart(2, '0')})`;
    }

    // Second byte (typically sub-function)
    if (position === 1 && context.length > 0) {
      const serviceId = context[0];
      
      switch (serviceId) {
        case ServiceId.DIAGNOSTIC_SESSION_CONTROL: {
          const sessions: Record<number, string> = {
            0x01: 'Default Session',
            0x02: 'Programming Session',
            0x03: 'Extended Diagnostic Session',
            0x04: 'Safety System Session'
          };
          return sessions[byte] || `Sub-function 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
        }

        case ServiceId.ECU_RESET: {
          const resets: Record<number, string> = {
            0x01: 'Hard Reset',
            0x02: 'Key Off/On Reset',
            0x03: 'Soft Reset',
            0x04: 'Enable Rapid Power Shutdown',
            0x05: 'Disable Rapid Power Shutdown'
          };
          return resets[byte] || `Reset Type 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
        }

        case ServiceId.SECURITY_ACCESS:
          if (byte % 2 === 1) {
            return `Request Seed (Level ${Math.floor(byte / 2) + 1})`;
          } else {
            return `Send Key (Level ${byte / 2})`;
          }

        case ServiceId.ROUTINE_CONTROL: {
          const routineTypes: Record<number, string> = {
            0x01: 'Start Routine',
            0x02: 'Stop Routine',
            0x03: 'Request Routine Results'
          };
          return routineTypes[byte] || `Routine Type 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
        }
      }
    }

    // Generic description
    return `Data byte 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  }

  /**
   * Detect protocol violations
   */
  detectProtocolViolations(bytes: number[]): string[] {
    const violations: string[] = [];

    if (bytes.length === 0) {
      return violations;
    }

    // Check for maximum message length (typically 8 bytes for CAN, but UDS can be longer with multi-frame)
    if (bytes.length > 4095) {
      violations.push('Message exceeds maximum UDS length (4095 bytes)');
    }

    // Check for service ID in valid range
    const sid = bytes[0];
    if (sid === 0x00 || (sid >= 0x40 && sid <= 0x4F) || (sid >= 0xC0 && sid <= 0xFF)) {
      violations.push(`Service ID 0x${sid.toString(16).toUpperCase().padStart(2, '0')} is reserved or invalid`);
    }

    return violations;
  }

  /**
   * Categorize a byte based on its value and position
   */
  categorizeByte(_byte: number, position: number, context: number[]): ByteItem['category'] {
    if (position === 0) {
      return 'sid';
    }
    
    if (position === 1 && context.length > 0) {
      const sid = context[0];
      // Most services use sub-function in byte 2
      if ([0x10, 0x11, 0x19, 0x27, 0x28, 0x2A, 0x31, 0x3E].includes(sid)) {
        return 'subfunction';
      }
    }

    // Data identifier detection (0x22, 0x2E typically have 2-byte DIDs)
    if (context[0] === 0x22 || context[0] === 0x2E) {
      if (position === 1 || position === 2) {
        return 'identifier';
      }
    }

    return 'data';
  }
}

// Export singleton instance
export const hexEditorService = new HexEditorService();
