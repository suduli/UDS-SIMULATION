# UDS Protocol Interactive Website Delivery Plan

Auto-generated from all feature plans. Last updated: 2025-09-29

## Active Technologies

- TypeScript 5.x for protocol logic, simulators, and UI controllers
- HTML5 Drag & Drop API for the visual message builder
- Modular UI components (Web Components or React-style) with CSS modules
- IndexedDB for client-side persistence of audits, test cases, and configuration
- Web Workers for background automation and heavy parsing
- Progressive Web App stack (Service Worker + Web App Manifest) for GitHub Pages deployment
- Jest for automated unit, integration, and smoke testing
- GitHub Actions for CI, quality gates, and GitHub Pages publication

## Architecture Snapshot

- **Layered client app:** core UDS engine, transport simulation, services, ECU models, and UI rendered entirely in-browser for zero-backend hosting.
- **Transport abstraction:** ISO-TP and DoIP simulators share an extensible `transport-base` contract to plug additional protocols later.
- **Service library:** 20+ ISO 14229 diagnostic handlers registered via a service factory to keep interactions consistent.
- **Simulation runtime:** virtual ECUs expose data pools, DTC storage, and routine execution to mimic production ECUs.
- **Security & compliance:** ISO 21434-aligned managers deliver audit trails, session control, and crypto simulation.
- **Automation layer:** test sequence engine, parser, and results store enable batch validation and replayable scenarios.

## Development Roadmap

### Phase 1 – Foundation & Core Protocol (Weeks 1-3)

- **Goals:** Project scaffolding, TypeScript tooling, baseline protocol parsing, CI pipeline.
- **Workstreams:**
  - Bootstrap repo, linting, testing, bundler, and PWA manifest.
  - Implement `uds-protocol`, `message-parser`, and `message-builder` with full SID + NRC support.
  - Create minimal virtual ECU, data pools, and logging hooks.
- **Exit Criteria:** Dev server hot reload, Jest smoke suite, GitHub Actions CI green on main.

### Phase 2 – Transport & Foundational Services (Weeks 3-5)

- **Goals:** ISO-TP segmentation, DoIP discovery, and first diagnostic services.
- **Workstreams:**
  - Build `transport-base`, `iso-tp`, `can-simulator`, and `doip-simulator` with timing profiles.
  - Implement services 0x10, 0x11, 0x14, 0x19, 0x22 plus shared request/response validation.
  - Establish integration harness covering transport + service loops.
- **Exit Criteria:** Deterministic transport tests, service responses for happy path + NRC cases, trace logging viewable in console.

### Phase 3 – UI & Service Expansion (Weeks 5-8)

- **Goals:** Drag-and-drop builder, protocol selector, real-time response UI, full service coverage.
- **Workstreams:**
  - Ship core UI components (`service-palette`, `message-canvas`, `parameter-panel`, `response-viewer`).
  - Implement remaining services (0x23–0x3E, 0x85) with parameter schemas and validation helpers.
  - Connect IndexedDB-backed stores for test cases, audit history, and configurations.
- **Exit Criteria:** Interactive builder usable without reload, all services invocable, IndexedDB persistence verified via tests.

### Phase 4 – Security, Automation, and Visualization (Weeks 8-10)

- **Goals:** ISO 21434 feature set, automation engine, advanced visualizations.
- **Workstreams:**
  - Deliver `security-manager`, `session-manager`, `crypto-simulator`, and `audit-logger` with policy enforcement.
  - Build automation layer (`test-sequence-engine`, `test-case-builder`, `sequence-parser`, `test-results`) executed in Web Workers.
  - Add live protocol visualization canvas, presentation mode, and trending scenario surfacing.
- **Exit Criteria:** Security access challenge-response demo, automated regression suite running in background, visual dashboards stable across browsers.

### Phase 5 – Hardening, Docs, and Release (Weeks 10-12)

- **Goals:** Full QA sweep, documentation, deployment optimization.
- **Workstreams:**
  - Expand Jest coverage, add transport/service integration specs, e2e smoke checks in Playwright (optional).
  - Produce user guide, developer docs, API reference, and training templates.
  - Optimize bundle (code splitting, lazy loading), configure static asset caching, and finalize GitHub Pages workflow.
- **Exit Criteria:** CI pipeline running lint + test + build gates, docs published, GitHub Pages deployment verified with PWA install.

## Feature Backlog

### Core Protocol & Transport

- Robust SID catalog with encoding/decoding helpers and NRC mapping utilities.
- Transport timing configuration presets (default, high latency, stress test) exposed via UI.
- Fault injection toggles for simulating bus errors, lost frames, and invalid checksums.

### UI & Experience

- Animated drag-and-drop message builder with template starter flows and inline parameter editors.
- Live protocol visualization canvas showing CAN/DoIP traffic pulses and highlighting errors.
- Block library of reusable panels (DTC table, routine control, communication toggles) and presentation mode for demos.
- Monaco- or CodeMirror-powered "Simulation Lab" tab for editable TypeScript automation snippets.

### Security & Compliance

- Role-based access levels mapped to UDS service permissions.
- Audit trail viewer with filter/search and export to CSV/JSON.
- Security access workflow with configurable seed-key algorithms and policy breach alerts.

### Automation & Integrations

- Visual test sequence builder with drag-in steps, data-driven iterations, and scheduled playback.
- ODX/OTX import wizard populating service definitions and data identifiers.
- Export manager supporting workspace snapshots and embeddable/forkable scenarios.

## Milestones & Checkpoints

- **M1 (Week 1):** Project bootstrapped, continuous integration passing, baseline parser running.
- **M2 (Week 4):** Transport stack stable with foundational services and integration tests.
- **M3 (Week 7):** UI builder feature-complete, all ISO services available.
- **M4 (Week 9):** Security and automation features demo-ready, performance within targets.
- **M5 (Week 12):** Full documentation set, production build deployed, regression suite green.

## Testing & Quality Strategy

- Enforce Jest unit tests per module plus transport and service integration suites.
- Utilize snapshot tests for UI components and Storybook visual regression (optional add-on).
- Run performance benchmarks on message throughput and response latency per release.
- Validate cross-browser compatibility (Chrome, Edge, Firefox, Safari) via automated smoke matrix.
- Gate merges through GitHub Actions workflow: lint → unit tests → integration tests → build → deploy preview.

## Deployment & Operations

- Dedicated GitHub Actions workflows: `ci.yml` for lint/test/build and `deploy.yml` for GitHub Pages promotion.
- Preview builds served via `npm run preview`; final bundles uploaded to `gh-pages` branch with cache-busting.
- Service worker handles offline caching of core shell, templates, and ODX samples; update manifests per release.
- Monitor client-side performance with lightweight analytics (e.g., Web Vitals logging) written to IndexedDB for optional upload/export.

## Commands

- `npm install` — install project dependencies
- `npm run dev` — launch local development server with hot reload
- `npm run build` — produce optimized production bundle for GitHub Pages
- `npm run test` — execute Jest unit and integration suites
- `npm run lint` — enforce linting/formatting rules (ESLint + Prettier)
- `npm run preview` — smoke-test the built bundle locally before deploy

## Implementation Guidelines

- Use strict TypeScript typing with enums/interfaces aligned to ISO 14229; include NRC enumerations and timing budgets.
- Prefer functional composition for protocol pipelines; keep simulators responsible for side effects and timing.
- Keep UI components declarative, accessible, and themed via BEM-style CSS modules with motion-defining utility classes.
- Document UDS services with JSDoc, outlining supported sub-functions, NRCs, timing, and ISO references.
- Maintain consistent naming: `service-name.ts` for handlers, `*-manager.ts` for stateful modules, `*-store.ts` for IndexedDB wrappers.
- Enforce formatting with Prettier (2 spaces, semicolons on, single quotes) and lint with ESLint Airbnb TypeScript ruleset.

## Recent Changes

1. Converted architecture brief into a delivery-focused roadmap with milestones and exit criteria.
2. Organized feature backlog across protocol, UI, security, and automation domains.
3. Expanded quality and deployment strategy to cover CI gates, performance tracking, and GitHub Pages rollout.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
