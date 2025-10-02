import { UDSMessageBuilder } from '../../src/core/message-builder';
import { ServiceId } from '../../src/core/constants';

describe('UDSMessageBuilder', () => {
  describe('basic message construction', () => {
    it('should create a simple service request', () => {
      const request = new UDSMessageBuilder(ServiceId.TESTER_PRESENT)
        .withSubFunction(0x00)
        .build();

      expect(request.serviceId).toBe(ServiceId.TESTER_PRESENT);
      expect(request.subFunction).toBe(0x00);
    });

    it('should create request with data', () => {
      const request = new UDSMessageBuilder(ServiceId.WRITE_DATA_BY_IDENTIFIER)
        .withDataIdentifier(0xF190)
        .withData([0x01, 0x02, 0x03])
        .build();

      expect(request.data.length).toBeGreaterThan(2);
      expect(request.data[0]).toBe(0xF1);
      expect(request.data[1]).toBe(0x90);
    });
  });

  describe('convenience methods', () => {
    it('should create session control request', () => {
      const request = UDSMessageBuilder.createSessionControl(0x01);
      expect(request.serviceId).toBe(ServiceId.DIAGNOSTIC_SESSION_CONTROL);
      expect(request.subFunction).toBe(0x01);
    });

    it('should create tester present request', () => {
      const request = UDSMessageBuilder.createTesterPresent(false);
      expect(request.serviceId).toBe(ServiceId.TESTER_PRESENT);
      expect(request.suppressPositiveResponse).toBe(false);
    });

    it('should create tester present with suppress response', () => {
      const request = UDSMessageBuilder.createTesterPresent(true);
      expect(request.suppressPositiveResponse).toBe(true);
    });
  });

  describe('toBytes', () => {
    it('should convert to byte array', () => {
      const bytes = new UDSMessageBuilder(ServiceId.TESTER_PRESENT)
        .withSubFunction(0x00)
        .toBytes();

      expect(bytes[0]).toBe(ServiceId.TESTER_PRESENT);
      expect(bytes[1]).toBe(0x00);
    });
  });
});
