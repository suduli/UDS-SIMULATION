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
