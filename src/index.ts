/**
 * UDS Protocol Simulator - Main Entry Point
 */

import { VirtualECU } from './simulation/virtual-ecu';
import { ServiceFactory } from './services/service-factory';
import { ServiceId, DataIdentifier } from './core/constants';
import { ECUConfiguration } from './core/types';
import { UDSMessageBuilder } from './core/message-builder';
import { UDSMessageParser } from './core/message-parser';

// Initialize the application
function initializeApp(): void {
  console.log('UDS Protocol Simulator initializing...');

  // Create ECU configuration
  const config: ECUConfiguration = {
    ecuId: 0x01,
    supportedServices: [
      ServiceId.DIAGNOSTIC_SESSION_CONTROL,
      ServiceId.ECU_RESET,
      ServiceId.CLEAR_DIAGNOSTIC_INFORMATION,
      ServiceId.READ_DTC_INFORMATION,
      ServiceId.READ_DATA_BY_IDENTIFIER,
      ServiceId.WRITE_DATA_BY_IDENTIFIER,
      ServiceId.SECURITY_ACCESS,
      ServiceId.TESTER_PRESENT,
      ServiceId.ROUTINE_CONTROL,
      ServiceId.CONTROL_DTC_SETTING,
    ],
    dataIdentifiers: new Map([
      [DataIdentifier.VEHICLE_SPEED, new Uint8Array([0x00, 0x00])],
      [DataIdentifier.ENGINE_RPM, new Uint8Array([0x00, 0x00])],
      [DataIdentifier.VIN, new Uint8Array([...Array(17)].map((_, i) => 65 + i))], // 'ABCDEFGHIJKLMNOPQ'
      [DataIdentifier.ECU_SOFTWARE_VERSION, new Uint8Array([0x01, 0x02, 0x03])],
    ]),
    dtcRecords: [
      { dtcCode: 0xC00101, statusMask: 0x08 },
      { dtcCode: 0xC00102, statusMask: 0x09 },
    ],
  };

  // Create virtual ECU
  const ecu = new VirtualECU(config);

  // Register all services
  ServiceFactory.registerAllServices(ecu);

  console.log('Virtual ECU initialized with', config.supportedServices.length, 'services');

  // Example: Send a tester present message
  demonstrateUsage(ecu);

  // Set up UI
  setupUI(ecu);
}

async function demonstrateUsage(ecu: VirtualECU): Promise<void> {
  console.log('\n--- Demonstrating UDS Communication ---');

  // Create and send a tester present request
  const testerPresentRequest = UDSMessageBuilder.createTesterPresent(false);
  const testerPresentBytes = new UDSMessageBuilder(ServiceId.TESTER_PRESENT)
    .withSubFunction(0x00)
    .toBytes();

  console.log('Request:', UDSMessageParser.formatMessage(testerPresentBytes));

  const response = await ecu.handleRequest(testerPresentRequest);
  const responseBytes = ecu.responseToBytes(response);

  console.log('Response:', UDSMessageParser.formatMessage(responseBytes));
  console.log('---\n');
}

function setupUI(ecu: VirtualECU): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Simple UI for demonstration
  const statusDiv = document.createElement('div');
  statusDiv.innerHTML = `
    <h2>ECU Status</h2>
    <p>Services registered: ${ecu.getConfig().supportedServices.length}</p>
    <p>Session: ${ecu.getState().currentSession.toString(16).toUpperCase()}</p>
    <p>Security: ${ecu.getState().isSecurityUnlocked ? 'Unlocked' : 'Locked'}</p>
  `;
  
  app.appendChild(statusDiv);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export { VirtualECU, ServiceFactory, UDSMessageBuilder, UDSMessageParser };
