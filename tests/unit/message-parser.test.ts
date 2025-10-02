import { UDSMessageParser } from '../../src/core/message-parser';
import { ServiceId, NegativeResponseCode } from '../../src/core/constants';

describe('UDSMessageParser', () => {
  describe('parseRequest', () => {
    it('should parse simple request', () => {
      const bytes = new Uint8Array([ServiceId.TESTER_PRESENT, 0x00]);
      const request = UDSMessageParser.parseRequest(bytes);

      expect(request.serviceId).toBe(ServiceId.TESTER_PRESENT);
      expect(request.subFunction).toBe(0x00);
    });

    it('should parse request with data', () => {
      const bytes = new Uint8Array([ServiceId.READ_DATA_BY_IDENTIFIER, 0xF1, 0x90]);
      const request = UDSMessageParser.parseRequest(bytes);

      expect(request.serviceId).toBe(ServiceId.READ_DATA_BY_IDENTIFIER);
      expect(request.data.length).toBe(2);
    });

    it('should detect suppress positive response bit', () => {
      const bytes = new Uint8Array([ServiceId.TESTER_PRESENT, 0x80]);
      const request = UDSMessageParser.parseRequest(bytes);

      expect(request.suppressPositiveResponse).toBe(true);
      expect(request.subFunction).toBe(0x00);
    });
  });

  describe('parseResponse', () => {
    it('should parse positive response', () => {
      const bytes = new Uint8Array([0x50, 0x01]); // Positive response to session control
      const response = UDSMessageParser.parseResponse(bytes);

      expect(response.isPositive).toBe(true);
      expect(response.serviceId).toBe(ServiceId.DIAGNOSTIC_SESSION_CONTROL);
    });

    it('should parse negative response', () => {
      const bytes = new Uint8Array([0x7F, ServiceId.TESTER_PRESENT, NegativeResponseCode.SERVICE_NOT_SUPPORTED]);
      const response = UDSMessageParser.parseResponse(bytes);

      expect(response.isPositive).toBe(false);
      expect(response.serviceId).toBe(ServiceId.TESTER_PRESENT);
      expect(response.nrc).toBe(NegativeResponseCode.SERVICE_NOT_SUPPORTED);
    });
  });

  describe('formatMessage', () => {
    it('should format message as hex string', () => {
      const bytes = new Uint8Array([0x3E, 0x00]);
      const formatted = UDSMessageParser.formatMessage(bytes);

      expect(formatted).toBe('3E 00');
    });
  });

  describe('parseDataIdentifier', () => {
    it('should parse data identifier', () => {
      const data = new Uint8Array([0xF1, 0x90, 0x01, 0x02]);
      const did = UDSMessageParser.parseDataIdentifier(data);

      expect(did).toBe(0xF190);
    });
  });
});
