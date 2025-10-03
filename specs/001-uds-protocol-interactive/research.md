# Phase 0 Research Findings

## Overview

Research focused on delivering an offline-first UDS simulator that honours ISO 14229 fidelity, security access patterns, and GitHub Pages hosting constraints.

## Decisions

### Service Worker & Asset Strategy

- **Decision**: Adopt a hybrid caching approach using Workbox precache for core shell (<2 MB) and runtime caching for large service bundles and ODX samples.
- **Rationale**: Keeps initial payload lightweight while allowing lazy loading of less-frequent services; aligns with PWA best practices.
- **Alternatives Considered**:
  - Full precache of all modules → exceeded size targets and increased cache churn.
  - Pure runtime caching → risked offline regressions for core UI components.

### ISO 14229 Timing Simulation

- **Decision**: Establish canonical response windows (fast: 50 ms, nominal: 120 ms, extended: 300 ms) and enforce CAN vs DoIP variance ≤1 s using `MessageChannel` callbacks.
- **Rationale**: Keeps timing deterministic for tests while mimicking realistic transport delays.
- **Alternatives Considered**:
  - Randomized latency profiles → harmed repeatability and test determinism.
  - Fixed 0 ms response → misrepresented transport behaviour and negative response handling.

### Seed-Key Security Model

- **Decision**: Use a configurable polynomial rolling cipher with pluggable seed generators and key validation hooks exposed to advanced mode users.
- **Rationale**: Demonstrates challenge-response mechanics without leaking proprietary OEM algorithms; supports educator overrides.
- **Alternatives Considered**:
  - Static key pairs → trivial to bypass and not representative of real security access flows.
  - External crypto library → violated client-only constraint and added bundle weight.

### IndexedDB Retention & Metrics Handling

- **Decision**: Implement per-store TTL metadata with cleanup on session start and when background automation is idle; metrics stored locally-only and cleared on browser data purge.
- **Rationale**: Satisfies 30-day audit retention requirement and privacy expectation for anonymized metrics.
- **Alternatives Considered**:
  - Manual deletion by user → risk of stale data and compliance gaps.
  - Cloud sync metrics → conflicts with local-only requirement and offline guarantee.

### Automation Worker Orchestration

- **Decision**: Run automation sequences in a dedicated Web Worker using batched command queues and progress events; throttle to keep main-thread idle >25%.
- **Rationale**: Prevents UI jank during long automated sequences and supports background execution.
- **Alternatives Considered**:
  - Main-thread execution → conflicts with drag-drop responsiveness.
  - Service worker execution → lacks direct DOM access needed for live visualization updates.

## Outstanding Notes

- None. All clarification requirements addressed; future research will focus on performance tuning once implementation metrics available.
