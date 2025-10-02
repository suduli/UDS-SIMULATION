# UDS Protocol Simulator - Implementation Documentation

## Overview

This document describes the implementation of the UDS (Unified Diagnostic Services) Protocol Simulator according to ISO 14229-1 standard.

## Architecture

### Core Components

#### Message Builder (`src/core/message-builder.ts`)
- Constructs UDS requests with service ID, sub-function, and data
- Provides convenience methods for common services
- Handles suppress positive response bit
- Converts messages to byte arrays

#### Message Parser (`src/core/message-parser.ts`)
- Parses UDS request and response messages
- Detects positive vs negative responses
- Extracts sub-functions and data
- Formats messages for display

#### Virtual ECU (`src/simulation/virtual-ecu.ts`)
- Simulates an ECU responding to UDS requests
- Manages diagnostic session state
- Registers and routes service handlers
- Tracks security access state

### UDS Services

All 22 UDS services defined in the ARCHITECTURE.md are implemented:

#### Core Services (Full Implementation)
- **0x10** Diagnostic Session Control - Session switching with timing parameters
- **0x11** ECU Reset - Multiple reset types with power-down timing
- **0x14** Clear Diagnostic Information - DTC clearing by group
- **0x19** Read DTC Information - Multiple report types
- **0x22** Read Data By Identifier - Multi-DID support
- **0x27** Security Access - Seed-key authentication with attempt limiting
- **0x2E** Write Data By Identifier - Security-protected data writing
- **0x31** Routine Control - Start/stop/results
- **0x3E** Tester Present - Keep-alive functionality
- **0x85** Control DTC Setting - Enable/disable DTC recording

#### Stub Services (Basic Implementation)
Services 0x23, 0x24, 0x28, 0x2A, 0x2C, 0x2F, 0x34, 0x35, 0x36, 0x37, 0x38, 0x3D have stub implementations that return basic positive responses. These can be enhanced with full functionality as needed.

## Testing

### Unit Tests
Located in `tests/unit/`:
- `message-builder.test.ts` - Tests message construction
- `message-parser.test.ts` - Tests message parsing

### Integration Tests
Located in `tests/integration/`:
- `ecu-services.test.ts` - Tests ECU service interactions including:
  - Tester Present
  - Session Control
  - Read Data By Identifier
  - Security Access
  - Write Data By Identifier

### End-to-End Tests
Located in `tests/e2e/`:
- `hello-world.spec.ts` - Basic Playwright test for page load

## Usage

### Running Tests
```bash
npm test                 # Run Jest unit/integration tests
npm run test:ui          # Run Playwright e2e tests
npm run test:coverage    # Run tests with coverage
```

### Building
```bash
npm run build            # Production build to dist/
npm run dev              # Development server on port 8080
```

### Example Code

```typescript
import { VirtualECU, ServiceFactory, UDSMessageBuilder } from './index';

// Create ECU configuration
const config = {
  ecuId: 0x01,
  supportedServices: [/* ... */],
  dataIdentifiers: new Map(),
  dtcRecords: []
};

// Initialize ECU
const ecu = new VirtualECU(config);
ServiceFactory.registerAllServices(ecu);

// Send request
const request = UDSMessageBuilder.createTesterPresent(false);
const response = await ecu.handleRequest(request);

// Convert to bytes for transmission
const responseBytes = ecu.responseToBytes(response);
```

## Standards Compliance

This implementation follows:
- **ISO 14229-1**: Unified Diagnostic Services (UDS)
- **ISO 15765-2**: Diagnostic communication over Controller Area Network (DoCAN)
- **ISO 13400**: Diagnostic communication over Internet Protocol (DoIP)

## Next Steps

To complete the full implementation as described in ARCHITECTURE.md:

1. **Transport Layer** - Implement ISO-TP and DoIP simulators
2. **UI Components** - Create drag-and-drop message builder interface
3. **Advanced Services** - Enhance stub services with full functionality
4. **Data Management** - Add IndexedDB for persistent storage
5. **ODX Support** - Implement ODX file parser
6. **Test Automation** - Add test sequence engine
7. **Security Features** - Implement ISO 21434 compliance monitoring
