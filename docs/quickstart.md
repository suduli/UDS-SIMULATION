# Quick Start Guide

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Access the simulator at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

## Running Tests

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:ui

# With coverage
npm run test:coverage
```

## Key Features

- **Visual Builder**: Drag-and-drop UDS service creation
- **Advanced Editor**: Raw hex command input
- **Transport Simulation**: CAN and DoIP support
- **Security Access**: Seed/key authentication simulation
- **Offline Support**: PWA with service worker caching
- **Automation**: Background test execution via Web Workers

## Basic Workflow

1. Select an ECU profile
2. Choose transport mode (CAN or DoIP)
3. Build a diagnostic scenario using the service palette
4. Execute and view responses
5. Save as template for reuse

## Documentation

- Full documentation: [README.md](../README.md)
- Architecture: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Tasks: [specs/001-uds-protocol-interactive/tasks.md](../specs/001-uds-protocol-interactive/tasks.md)
