# UDS Protocol Interactive Simulator

An interactive, browser-based simulator for UDS (Unified Diagnostic Services) protocol testing and learning. Built with TypeScript, React, and Web Components for offline-capable diagnostic scenario creation.

## Features

- **Hybrid Message Builder**: Visual drag-and-drop and advanced hex editor modes
- **Multi-Transport Support**: Simulate CAN and DoIP diagnostic sessions
- **Virtual ECU Profiles**: Pre-configured engine, body, gateway ECU models
- **Security Access**: Seed/key authentication simulation
- **Test Automation**: Background execution via Web Workers
- **Offline PWA**: Service worker caching for offline usage
- **Audit Logging**: ISO 21434-compliant diagnostic interaction tracking

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

See [Quick Start Guide](docs/quickstart.md) for detailed instructions.

## Architecture

The application follows a layered architecture:

- **Core Layer**: UDS protocol encoding/decoding, message parsing
- **Transport Layer**: ISO-TP and DoIP simulators
- **Simulation Layer**: Virtual ECU engine with configurable profiles
- **Security Layer**: Session management and audit logging
- **Storage Layer**: IndexedDB for templates, runs, and metrics
- **UI Layer**: React components with state management

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete details.

## Project Structure

```
src/
├── core/uds/              # UDS protocol implementation
├── transport/             # CAN and DoIP simulators
├── simulation/            # Virtual ECU engine
├── security/              # Security and audit
├── storage/               # IndexedDB stores
├── automation/            # Test execution engine
├── ui/                    # React components
└── pwa/                   # Service worker

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # Playwright E2E tests
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Commands

```bash
npm run dev              # Development server
npm run build            # Production build
npm run test             # Jest tests
npm run test:ui          # Playwright tests
npm run lint             # ESLint check
npm run lint:fix         # Fix linting issues
npm run format           # Prettier check
npm run format:fix       # Fix formatting
npm run perf:budget      # Check bundle size
```

## Testing

The project uses TDD approach with comprehensive test coverage:

- **Unit Tests**: Jest for core logic, stores, and utilities
- **Integration Tests**: Component interaction and workflow tests
- **E2E Tests**: Playwright for full user scenarios

Run all tests:
```bash
npm run test && npm run test:ui
```

## License

Apache-2.0 License - See [LICENSE](LICENSE) file for details.

## Documentation

- [Quick Start Guide](docs/quickstart.md)
- [Feature Specification](specs/001-uds-protocol-interactive/spec.md)
- [Implementation Plan](specs/001-uds-protocol-interactive/plan.md)
- [Task List](specs/001-uds-protocol-interactive/tasks.md)
