import { VirtualECU } from '../../src/simulation/virtual-ecu';
import { ServiceFactory } from '../../src/services/service-factory';
import { ServiceId, DataIdentifier, DiagnosticSessionType } from '../../src/core/constants';
import { UDSMessageBuilder } from '../../src/core/message-builder';
import { ECUConfiguration } from '../../src/core/types';

describe('ECU Services Integration', () => {
  let ecu: VirtualECU;

  beforeEach(() => {
    const config: ECUConfiguration = {
      ecuId: 0x01,
      supportedServices: [
        ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        ServiceId.ECU_RESET,
        ServiceId.READ_DATA_BY_IDENTIFIER,
        ServiceId.WRITE_DATA_BY_IDENTIFIER,
        ServiceId.TESTER_PRESENT,
        ServiceId.SECURITY_ACCESS,
      ],
      dataIdentifiers: new Map([
        [DataIdentifier.VEHICLE_SPEED, new Uint8Array([0x00, 0x5A])],
        [DataIdentifier.VIN, new Uint8Array([65, 66, 67])], // ABC
      ]),
      dtcRecords: [],
    };

    ecu = new VirtualECU(config);
    ServiceFactory.registerAllServices(ecu);
  });

  describe('Tester Present', () => {
    it('should respond positively to tester present', async () => {
      const request = UDSMessageBuilder.createTesterPresent(false);
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(true);
      expect(response.serviceId).toBe(ServiceId.TESTER_PRESENT);
    });
  });

  describe('Session Control', () => {
    it('should change diagnostic session', async () => {
      const request = UDSMessageBuilder.createSessionControl(DiagnosticSessionType.EXTENDED_DIAGNOSTIC_SESSION);
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(true);
      expect(ecu.getState().currentSession).toBe(DiagnosticSessionType.EXTENDED_DIAGNOSTIC_SESSION);
    });
  });

  describe('Read Data By Identifier', () => {
    it('should read data identifier', async () => {
      const request = UDSMessageBuilder.createReadDataByIdentifier(DataIdentifier.VEHICLE_SPEED);
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(true);
      expect(response.data.length).toBeGreaterThan(2);
    });

    it('should reject unknown data identifier', async () => {
      const request = UDSMessageBuilder.createReadDataByIdentifier(0x9999);
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(false);
    });
  });

  describe('Security Access', () => {
    it('should request seed', async () => {
      const request = UDSMessageBuilder.createSecurityAccessRequest(0x01);
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(true);
      expect(response.data.length).toBeGreaterThan(1);
    });

    it('should unlock with correct key', async () => {
      // Request seed
      const seedRequest = UDSMessageBuilder.createSecurityAccessRequest(0x01);
      await ecu.handleRequest(seedRequest);

      // Send key (simplified - would normally calculate based on seed)
      const keyRequest = UDSMessageBuilder.createSecurityAccessSendKey(
        0x02,
        new Uint8Array([0x87, 0x65, 0x43, 0x21])
      );
      const response = await ecu.handleRequest(keyRequest);

      expect(response.isPositive).toBe(true);
      expect(ecu.getState().isSecurityUnlocked).toBe(true);
    });
  });

  describe('Write Data By Identifier', () => {
    it('should require security access', async () => {
      const request = UDSMessageBuilder.createWriteDataByIdentifier(
        DataIdentifier.VEHICLE_SPEED,
        new Uint8Array([0x00, 0xFF])
      );
      const response = await ecu.handleRequest(request);

      expect(response.isPositive).toBe(false);
    });
  });
});
