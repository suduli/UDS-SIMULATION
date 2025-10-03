import { UDSProtocol, NegativeResponseCode } from '../../../src/core/uds/uds-protocol';

describe('UDS Protocol edge cases and latency guards', () => {
  it('handles empty response data gracefully', () => {
    expect(() => {
      UDSProtocol.decodeResponse(new Uint8Array([]));
    }).toThrow('Empty response data');
  });

  it('handles malformed negative response', () => {
    // Negative response must have at least 3 bytes: 0x7F <SID> <NRC>
    expect(() => {
      UDSProtocol.decodeResponse(new Uint8Array([0x7f, 0x22]));
    }).toThrow('Invalid negative response format');
  });

  it('decodes positive response correctly', () => {
    const response = UDSProtocol.decodeResponse(new Uint8Array([0x62, 0xf1, 0x90, 0x01, 0x02]));
    expect(response.isPositive).toBe(true);
    expect(response.sid).toBe(0x22);
    expect(Array.from(response.data)).toEqual([0xf1, 0x90, 0x01, 0x02]);
  });

  it('decodes negative response correctly', () => {
    const response = UDSProtocol.decodeResponse(new Uint8Array([0x7f, 0x22, 0x13]));
    expect(response.isPositive).toBe(false);
    expect(response.sid).toBe(0x22);
    expect(response.nrc).toBe(NegativeResponseCode.IncorrectMessageLengthOrInvalidFormat);
  });

  it('validates SID range boundaries', () => {
    expect(UDSProtocol.isValidSID(0x10)).toBe(true);
    expect(UDSProtocol.isValidSID(0x85)).toBe(true);
    expect(UDSProtocol.isValidSID(0x0f)).toBe(false);
    expect(UDSProtocol.isValidSID(0x00)).toBe(false);
    expect(UDSProtocol.isValidSID(0xff)).toBe(true);
  });

  it('encodes request with sub-function correctly', () => {
    const request = {
      sid: 0x10,
      subFunction: 0x03,
      data: new Uint8Array([0x01, 0x02]),
      transport: 'CAN' as const,
      securityLevelRequired: 'default' as const,
      expectedNrc: [],
    };

    const encoded = UDSProtocol.encodeRequest(request);
    expect(Array.from(encoded)).toEqual([0x10, 0x03, 0x01, 0x02]);
  });

  it('encodes request without sub-function correctly', () => {
    const request = {
      sid: 0x22,
      data: new Uint8Array([0xf1, 0x90]),
      transport: 'DoIP' as const,
      securityLevelRequired: 'supplier' as const,
      expectedNrc: [],
    };

    const encoded = UDSProtocol.encodeRequest(request);
    expect(Array.from(encoded)).toEqual([0x22, 0xf1, 0x90]);
  });

  it('matches expected NRC correctly', () => {
    const nrcResponse = UDSProtocol.decodeResponse(new Uint8Array([0x7f, 0x27, 0x35]));
    expect(UDSProtocol.matchesExpectedNRC(nrcResponse, [0x35])).toBe(true);
    expect(UDSProtocol.matchesExpectedNRC(nrcResponse, [0x33, 0x35])).toBe(true);
    expect(UDSProtocol.matchesExpectedNRC(nrcResponse, [0x33])).toBe(false);
  });

  it('matches positive response with empty expected NRC list', () => {
    const positiveResponse = UDSProtocol.decodeResponse(new Uint8Array([0x67, 0x01]));
    expect(UDSProtocol.matchesExpectedNRC(positiveResponse, [])).toBe(true);
    expect(UDSProtocol.matchesExpectedNRC(positiveResponse, [0x35])).toBe(false);
  });

  it('provides readable NRC descriptions', () => {
    expect(UDSProtocol.getNRCDescription(NegativeResponseCode.SecurityAccessDenied)).toContain(
      'Security access denied',
    );
    expect(UDSProtocol.getNRCDescription(NegativeResponseCode.InvalidKey)).toContain('Invalid key');
    expect(UDSProtocol.getNRCDescription(0x99)).toContain('Unknown NRC');
  });

  it('provides readable service names', () => {
    expect(UDSProtocol.getServiceName(0x22)).toBe('ReadDataByIdentifier');
    expect(UDSProtocol.getServiceName(0x27)).toBe('SecurityAccess');
    expect(UDSProtocol.getServiceName(0x99)).toContain('Unknown Service');
  });

  it('handles maximum payload size', () => {
    const largeData = new Uint8Array(4096);
    const request = {
      sid: 0x36,
      data: largeData,
      transport: 'CAN' as const,
      securityLevelRequired: 'oem' as const,
      expectedNrc: [],
    };

    const encoded = UDSProtocol.encodeRequest(request);
    expect(encoded.length).toBe(4097); // SID + 4096 bytes
  });

  it('handles response pending NRC (0x78)', () => {
    const response = UDSProtocol.decodeResponse(new Uint8Array([0x7f, 0x31, 0x78]));
    expect(response.isPositive).toBe(false);
    expect(response.nrc).toBe(NegativeResponseCode.RequestCorrectlyReceivedResponsePending);
  });
});
