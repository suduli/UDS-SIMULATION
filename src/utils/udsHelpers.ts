/**
 * UDS Protocol Utility Functions
 * Helper functions for protocol operations
 */

import type { HexString, DTCStatusMask, NegativeResponseCode } from '../types/uds';

/**
 * Convert byte array to hex string
 */
export const toHex = (data: number[]): HexString => {
  return data.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
};

/**
 * Convert hex string to byte array
 */
export const fromHex = (hex: HexString): number[] => {
  const cleaned = hex.replace(/\s+/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.substr(i, 2), 16));
  }
  return bytes;
};

/**
 * Convert byte array to ASCII string
 */
export const toASCII = (data: number[]): string => {
  return data.map(byte => {
    if (byte >= 32 && byte <= 126) {
      return String.fromCharCode(byte);
    }
    return '.';
  }).join('');
};

/**
 * Convert ASCII string to byte array
 */
export const fromASCII = (ascii: string): number[] => {
  return Array.from(ascii).map(char => char.charCodeAt(0));
};

/**
 * Calculate checksum for data
 */
export const calculateChecksum = (data: number[]): number => {
  return data.reduce((sum, byte) => (sum + byte) & 0xFF, 0);
};

/**
 * Generate security seed (random bytes)
 */
export const generateSeed = (length: number = 4): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * 256));
};

/**
 * Calculate security key from seed using XOR algorithm
 */
export const calculateKeyXOR = (seed: number[], secret: number[] = [0xA5, 0x5A, 0xF0, 0x0F]): number[] => {
  return seed.map((byte, index) => byte ^ secret[index % secret.length]);
};

/**
 * Calculate security key from seed using ADD algorithm
 */
export const calculateKeyADD = (seed: number[], secret: number[] = [0x12, 0x34, 0x56, 0x78]): number[] => {
  return seed.map((byte, index) => (byte + secret[index % secret.length]) & 0xFF);
};

/**
 * Parse DTC status byte to status mask
 */
export const parseDTCStatus = (statusByte: number): DTCStatusMask => {
  return {
    testFailed: !!(statusByte & 0x01),
    testFailedThisOperationCycle: !!(statusByte & 0x02),
    pendingDTC: !!(statusByte & 0x04),
    confirmedDTC: !!(statusByte & 0x08),
    testNotCompletedSinceLastClear: !!(statusByte & 0x10),
    testFailedSinceLastClear: !!(statusByte & 0x20),
    testNotCompletedThisOperationCycle: !!(statusByte & 0x40),
    warningIndicatorRequested: !!(statusByte & 0x80),
  };
};

/**
 * Convert DTC status mask to byte
 */
export const dtcStatusToByte = (status: DTCStatusMask): number => {
  let byte = 0;
  if (status.testFailed) byte |= 0x01;
  if (status.testFailedThisOperationCycle) byte |= 0x02;
  if (status.pendingDTC) byte |= 0x04;
  if (status.confirmedDTC) byte |= 0x08;
  if (status.testNotCompletedSinceLastClear) byte |= 0x10;
  if (status.testFailedSinceLastClear) byte |= 0x20;
  if (status.testNotCompletedThisOperationCycle) byte |= 0x40;
  if (status.warningIndicatorRequested) byte |= 0x80;
  return byte;
};

/**
 * Get service name from SID
 */
export const getServiceName = (sid: number): string => {
  const services: Record<number, string> = {
    0x10: 'Diagnostic Session Control',
    0x11: 'ECU Reset',
    0x14: 'Clear Diagnostic Information',
    0x19: 'Read DTC Information',
    0x22: 'Read Data By Identifier',
    0x23: 'Read Memory By Address',
    0x27: 'Security Access',
    0x28: 'Communication Control',
    0x2A: 'Read Data By Periodic Identifier',
    0x2E: 'Write Data By Identifier',
    0x31: 'Routine Control',
    0x34: 'Request Download',
    0x35: 'Request Upload',
    0x36: 'Transfer Data',
    0x37: 'Request Transfer Exit',
    0x3D: 'Write Memory By Address',
  };
  return services[sid] || `Unknown Service (0x${sid.toString(16).toUpperCase()})`;
};

/**
 * Get NRC description
 */
export const getNRCDescription = (nrc: NegativeResponseCode): string => {
  const descriptions: Record<number, string> = {
    0x10: 'General Reject',
    0x11: 'Service Not Supported',
    0x12: 'Sub-Function Not Supported',
    0x13: 'Incorrect Message Length Or Invalid Format',
    0x14: 'Response Too Long',
    0x21: 'Busy Repeat Request',
    0x22: 'Conditions Not Correct',
    0x24: 'Request Sequence Error',
    0x31: 'Request Out Of Range',
    0x33: 'Security Access Denied',
    0x35: 'Invalid Key',
    0x36: 'Exceed Number Of Attempts',
    0x37: 'Required Time Delay Not Expired',
    0x70: 'Upload Download Not Accepted',
    0x71: 'Transfer Data Suspended',
    0x72: 'General Programming Failure',
    0x73: 'Wrong Block Sequence Counter',
    0x78: 'Request Correctly Received - Response Pending',
    0x7E: 'Sub-Function Not Supported In Active Session',
    0x7F: 'Service Not Supported In Active Session',
  };
  return descriptions[nrc] || 'Unknown NRC';
};

/**
 * Format timing value for display
 */
export const formatTiming = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * Validate request length for service
 */
export const validateRequestLength = (sid: number, data: number[]): boolean => {
  const minLengths: Record<number, number> = {
    0x10: 2,  // SID + SubFunction
    0x11: 2,  // SID + ResetType
    0x14: 4,  // SID + DTC high + DTC mid + DTC low
    0x19: 2,  // SID + SubFunction
    0x22: 3,  // SID + DID high + DID low
    0x27: 2,  // SID + SubFunction
    0x31: 4,  // SID + SubFunction + Routine ID high + low
  };

  const minLength = minLengths[sid] || 1;
  return data.length >= minLength;
};

/**
 * Create negative response
 */
export const createNegativeResponse = (sid: number, nrc: NegativeResponseCode): number[] => {
  return [0x7F, sid, nrc];
};

/**
 * Check if response is negative
 */
export const isNegativeResponse = (response: number[]): boolean => {
  return response.length >= 3 && response[0] === 0x7F;
};

/**
 * Extract NRC from negative response
 */
export const extractNRC = (response: number[]): NegativeResponseCode | null => {
  if (isNegativeResponse(response)) {
    return response[2] as NegativeResponseCode;
  }
  return null;
};

/**
 * Generate mock VIN (Vehicle Identification Number)
 */
export const generateMockVIN = (): string => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
};

/**
 * Generate realistic automotive data
 */
export const generateAutomotiveData = (type: string): number[] => {
  switch (type) {
    case 'engineRPM': {
      // Return 2 bytes (0-8000 RPM)
      const rpm = Math.floor(Math.random() * 3000) + 800;
      return [(rpm >> 8) & 0xFF, rpm & 0xFF];
    }

    case 'vehicleSpeed':
      // Return 1 byte (0-255 km/h)
      return [Math.floor(Math.random() * 120) + 20];

    case 'coolantTemp':
      // Return 1 byte (-40 to 215°C, offset by 40)
      return [Math.floor(Math.random() * 60) + 80];

    case 'batteryVoltage': {
      // Return 2 bytes (0-16V, scaled by 100)
      const voltage = Math.floor((Math.random() * 2 + 12) * 100);
      return [(voltage >> 8) & 0xFF, voltage & 0xFF];
    }

    default:
      return [0x00, 0x00];
  }
};

/**
 * Delay helper for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Format 3-byte DTC code to human-readable format (e.g., P0420, C0035)
 * @param code - 3-byte DTC code as number
 * @returns Formatted DTC string (e.g., "P0420")
 */
export const formatDTCCode = (code: number): string => {
  // Extract category from first nibble of first byte
  const firstByte = (code >> 16) & 0xFF;
  const category = (firstByte >> 4) & 0x0F;

  // Map category to P/C/B/U
  const categoryChars: Record<number, string> = {
    0x00: 'P', // Powertrain - Generic
    0x01: 'P', // Powertrain - Manufacturer specific
    0x02: 'C', // Chassis
    0x03: 'B', // Body
    0x04: 'U', // Network
  };

  const categoryChar = categoryChars[category] || 'P';

  // Format remaining digits
  const digit1 = firstByte & 0x0F;
  const digit2 = ((code >> 8) & 0xF0) >> 4;
  const digit3 = (code >> 8) & 0x0F;
  const digit4 = (code & 0xFF);

  return `${categoryChar}${digit1.toString(16).toUpperCase()}${digit2.toString(16).toUpperCase()}${digit3.toString(16).toUpperCase()}${digit4.toString(16).toUpperCase().padStart(2, '0')}`;
};

/**
 * Get DTC category from code
 */
export const getDTCCategory = (code: number): 'powertrain' | 'chassis' | 'body' | 'network' => {
  const firstByte = (code >> 16) & 0xFF;
  const category = (firstByte >> 4) & 0x0F;

  switch (category) {
    case 0x00:
    case 0x01:
      return 'powertrain';
    case 0x02:
      return 'chassis';
    case 0x03:
      return 'body';
    case 0x04:
      return 'network';
    default:
      return 'powertrain';
  }
};

/**
 * Get human-readable status bit descriptions
 */
export const getDTCStatusDescriptions = (status: DTCStatusMask): string[] => {
  const descriptions: string[] = [];

  if (status.testFailed) descriptions.push('Test Failed');
  if (status.testFailedThisOperationCycle) descriptions.push('Failed This Cycle');
  if (status.pendingDTC) descriptions.push('Pending');
  if (status.confirmedDTC) descriptions.push('Confirmed');
  if (status.testNotCompletedSinceLastClear) descriptions.push('Not Completed Since Clear');
  if (status.testFailedSinceLastClear) descriptions.push('Failed Since Clear');
  if (status.testNotCompletedThisOperationCycle) descriptions.push('Not Completed This Cycle');
  if (status.warningIndicatorRequested) descriptions.push('MIL On');

  return descriptions;
};

/**
 * Get SID 19 subfunction name
 */
export const getSID19SubfunctionName = (subFunction: number): string => {
  const names: Record<number, string> = {
    0x01: 'reportNumberOfDTCByStatusMask',
    0x02: 'reportDTCByStatusMask',
    0x03: 'reportDTCSnapshotIdentification',
    0x04: 'reportDTCSnapshotRecordByDTCNumber',
    0x05: 'reportDTCStoredDataByRecordNumber',
    0x06: 'reportDTCExtDataRecordByDTCNumber',
    0x07: 'reportNumberOfDTCBySeverityMaskRecord',
    0x08: 'reportDTCBySeverityMaskRecord',
    0x09: 'reportSeverityInformationOfDTC',
    0x0A: 'reportSupportedDTC',
    0x0B: 'reportFirstTestFailedDTC',
    0x0C: 'reportFirstConfirmedDTC',
    0x0D: 'reportMostRecentTestFailedDTC',
    0x0E: 'reportMostRecentConfirmedDTC',
    0x0F: 'reportMirrorMemoryDTCByStatusMask',
  };

  return names[subFunction & 0x7F] || `Unknown (0x${subFunction.toString(16).toUpperCase()})`;
};

/**
 * ALFID Parser for SID 0x23 (Read Memory By Address)
 * Parses Address and Length Format Identifier per ISO 14229-1
 * 
 * ALFID Format:
 *   Bits 7-4: Memory size length in bytes (0-15)
 *   Bits 3-0: Memory address length in bytes (0-15)
 * 
 * @param data - Request data bytes (excluding SID)
 * @returns Parsed ALFID result with address, size, and validity
 */
export interface ALFIDResult {
  addressLength: number;
  sizeLength: number;
  address: number;
  size: number;
  valid: boolean;
  errorMessage?: string;
}

export const parseALFID = (data: number[]): ALFIDResult => {
  // Minimum: 1 byte ALFID + at least 1 byte address + 1 byte size
  if (!data || data.length < 3) {
    return {
      addressLength: 0,
      sizeLength: 0,
      address: 0,
      size: 0,
      valid: false,
      errorMessage: 'Insufficient data length',
    };
  }

  const alfid = data[0];
  const addressLength = alfid & 0x0F;  // Low nibble
  const sizeLength = (alfid >> 4) & 0x0F;  // High nibble

  // Validate address and size lengths
  if (addressLength === 0 || addressLength > 8) {
    return {
      addressLength,
      sizeLength,
      address: 0,
      size: 0,
      valid: false,
      errorMessage: `Invalid address length: ${addressLength} (must be 1-8)`,
    };
  }

  if (sizeLength === 0 || sizeLength > 8) {
    return {
      addressLength,
      sizeLength,
      address: 0,
      size: 0,
      valid: false,
      errorMessage: `Invalid size length: ${sizeLength} (must be 1-8)`,
    };
  }

  // Expected message length: ALFID (1) + address + size
  const expectedLength = 1 + addressLength + sizeLength;
  if (data.length !== expectedLength) {
    return {
      addressLength,
      sizeLength,
      address: 0,
      size: 0,
      valid: false,
      errorMessage: `Incorrect message length: expected ${expectedLength}, got ${data.length}`,
    };
  }

  // Parse address (big-endian)
  let address = 0;
  for (let i = 0; i < addressLength; i++) {
    address = (address << 8) | data[1 + i];
  }

  // Parse size (big-endian)
  let size = 0;
  for (let i = 0; i < sizeLength; i++) {
    size = (size << 8) | data[1 + addressLength + i];
  }

  return {
    addressLength,
    sizeLength,
    address,
    size,
    valid: true,
  };
};

