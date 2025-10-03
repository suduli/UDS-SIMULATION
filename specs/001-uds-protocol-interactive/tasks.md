# Tasks: UDS Protocol Interactive Website

**Input**: Design documents from `/specs/001-uds-protocol-interactive/`
**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Task List

- [x] T001 Initialize Node + TypeScript + React + Webpack workspace (`package.json`, `tsconfig.json`, `webpack.config.ts`, `babel.config.cjs`, `public/index.html`, `src/index.tsx`).
- [X] T002 Configure linting and formatting with ESLint (Airbnb TypeScript rules) and Prettier (`.eslintrc.cjs`, `.prettierrc`, `package.json` scripts).
- [X] T003 Set up Jest + Playwright testing harness with TypeScript support (`jest.config.ts`, `tests/setup/jest-setup.ts`, `playwright.config.ts`, `package.json` scripts).
- [ ] T004 [P] Author failing worker contract spec covering automation commands/events (`tests/unit/contracts/worker-contracts.spec.ts`).
- [ ] T005 [P] Author failing telemetry contract spec validating metrics events/snapshots (`tests/unit/contracts/telemetry-contracts.spec.ts`).
- [ ] T006 [P] Create failing unit spec for `DiagnosticScenarioTemplate` + `UDSServiceRequest` persistence rules (`tests/unit/storage/template-store.spec.ts`).
- [ ] T007 [P] Create failing unit spec for `VirtualEcuProfile` timing and capability validation (`tests/unit/simulation/virtual-ecu.spec.ts`).
- [ ] T008 [P] Create failing unit spec for `DiagnosticAuditEntry` retention + metrics aggregation (`tests/unit/security/audit-metrics.spec.ts`).
- [ ] T009 [P] Create failing unit spec for `AutomatedTestRun` and `AutomatedTestStep` sequencing (`tests/unit/automation/test-sequence-engine.spec.ts`).
- [ ] T010 [P] Create failing unit spec for `SecuritySession` lifecycle and seed/key enforcement (`tests/unit/security/security-session.spec.ts`).
- [ ] T011 [P] Draft integration spec for hybrid builder flow comparing CAN vs DoIP timelines (`tests/integration/ui/hybrid-builder.spec.ts`).
- [ ] T012 [P] Draft integration spec for advanced editor + automation background execution (`tests/integration/automation/advanced-mode.spec.ts`).
- [ ] T013 [P] Draft Playwright smoke spec covering offline readiness, advanced editing, and security access handshake (`tests/e2e/pwa/offline-security.spec.ts`).
- [ ] T014 Implement `UDSServiceRequest` codec and NRC mapping in `src/core/uds/uds-protocol.ts` (satisfy FR-002/FR-004).
- [ ] T015 Build shared IndexedDB manager with schema migrations and TTL hooks (`src/storage/indexeddb-manager.ts`).
- [ ] T016 Implement `DiagnosticScenarioTemplate` builder and persistence pipeline (`src/core/uds/message-builder.ts`, `src/storage/template-store.ts`).
- [ ] T017 Implement response parser plus service registry descriptors (`src/core/uds/message-parser.ts`, `src/services/index.ts`).
- [ ] T018 Implement ISO-TP and DoIP simulators with timing profiles (`src/transport/iso-tp.ts`, `src/transport/doip-simulator.ts`).
- [ ] T019 Implement virtual ECU engine and persona modules for `VirtualEcuProfile` (`src/simulation/virtual-ecu.ts`, `src/simulation/ecu-models/`).
- [ ] T020 Implement security session manager covering `SecuritySession` lifecycle (`src/security/security-manager.ts`).
- [ ] T021 Implement audit logger and store enforcing `DiagnosticAuditEntry` TTL (`src/security/audit-logger.ts`, `src/storage/audit-store.ts`).
- [ ] T022 Implement automation sequence engine, worker bridge, and run store for `AutomatedTestRun`/`AutomatedTestStep` (`src/automation/test-sequence-engine.ts`, `src/automation/worker/index.ts`, `src/storage/automation-run-store.ts`).
- [ ] T023 Implement usage metrics store and telemetry aggregator for `UsageMetricsSnapshot` (`src/storage/usage-metrics-store.ts`, `src/utils/telemetry.ts`).
- [ ] T024 Implement simulator state store orchestrating transports, services, and storage (`src/ui/state/simulator-store.ts`).
- [ ] T025 Build hybrid builder UI components (service palette, message canvas, parameter panel, response viewer) (`src/ui/components/`).
- [ ] T026 Build security access, automation manager, presentation, analytics, and knowledge UI surfaces (`src/ui/components/security-access-dialog.tsx`, `src/ui/components/automation-manager.tsx`, `src/ui/components/presentation-mode.tsx`, `src/ui/components/analytics-panel.tsx`, `src/ui/components/service-knowledge-panel.tsx`).
- [ ] T027 Compose application shell, routing, and providers (`src/App.tsx`, `src/index.tsx`).
- [ ] T028 Configure Workbox service worker, manifest caching, and webpack bundling for workers/PWA (`src/pwa/service-worker.ts`, `public/manifest.json`, `webpack.config.ts`).
- [ ] T029 [P] Add Jest edge-case coverage for negative responses and latency guards (`tests/unit/core/uds/uds-protocol.edge.spec.ts`).
- [ ] T030 Run performance and bundle budget checks, wiring CI gating (`scripts/perf-budget.cjs`, `package.json` scripts).
- [ ] T031 [P] Update documentation and onboarding guides with new workflows (`README.md`, `docs/quickstart.md`).
- [ ] T032 Execute quickstart checklist and capture results (`docs/QA/quickstart-report.md`).

## Dependencies & Ordering Notes

- T001 → T003 establish tooling required by all subsequent tasks.
- T004–T013 (tests) must land and fail before beginning implementation tasks T014–T028 (TDD gate).
- T015 depends on T014 for shared type definitions; T016–T023 rely on the data layer produced by T015.
- T024 requires completion of transport, security, storage, and automation tasks (T018–T023).
- UI tasks T025–T027 depend on state management (T024) and underlying services/stores.
- PWA infrastructure T028 should run after the app shell (T027) to wire entry points.
- Polish tasks (T029–T032) execute after all functional work passes tests and builds.

## Parallel Execution Example

```
# Kick off contract and model specs together
Task.run T004
Task.run T005
Task.run T006
Task.run T007

# After TDD gate, run documentation polish in parallel with edge-case tests
Task.run T029
Task.run T031
```
