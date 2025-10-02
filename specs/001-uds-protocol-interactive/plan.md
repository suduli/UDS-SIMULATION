# Implementation Plan: UDS Protocol Interactive Website

**Branch**: `[001-uds-protocol-interactive]` | **Date**: 2025-09-30 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `/specs/001-uds-protocol-interactive/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Deliver a browser-first, offline-capable UDS diagnostics laboratory that lets engineers compose service sequences visually or through an advanced editor, execute them against virtual ECUs over simulated CAN and DoIP transports, and capture audits, metrics, and automation flows while honoring ISO 14229 fidelity and security controls.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict` mode, DOM libs, Web Worker types  
**Primary Dependencies**: Webpack build pipeline, Jest + Playwright for smoke flows, native HTML5 drag-and-drop, IndexedDB wrappers, Workbox or custom service worker tooling  
**Storage**: IndexedDB stores for templates, ECU profiles, audit entries (30-day rolling window), test runs, and local-only usage metrics  
**Testing**: Jest unit + integration tests, Playwright smoke suite for drag-drop and offline caching validation, CI executed via GitHub Actions  
**Target Platform**: Chromium, Firefox, Safari (desktop + tablet) served from GitHub Pages as a PWA  
**Project Type**: Layered client-side simulator (core protocol, transport, services, simulation, UI, security, automation, storage)  
**Performance Goals**: ≤150 ms ECU response simulation median, ≤1 s CAN vs DoIP latency delta, <2 MB initial bundle, background automation limited to 75% main thread utilization  
**Constraints**: Pure client execution, offline-first service worker, strong ISO 14229 compliance, security level enforcement, GitHub Pages static hosting  
**Scale/Scope**: 20 core UDS services at launch, 3 ECU personas (engine/body/gateway), hybrid visual+advanced workflows for engineers, trainers, auditors

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Client-Side Simulation First** — Design keeps all simulation, storage, and automation in browser contexts with service-worker caching and IndexedDB persistence.
- [x] **Typed Layered Architecture** — Contracts and data models reinforce separation among core, transport, services, UI, security, automation, and storage layers.
- [x] **UDS Service Fidelity** — Requirements explicitly track ISO 14229 service coverage, NRC handling, and CAN/DoIP parity across the simulator pipeline.
- [x] **Diagnostic Test Discipline** — Plan front-loads failing Jest + Playwright tests for services, transports, and workflows prior to implementation.
- [x] **Secure & Auditable Sessions** — Security access tiers, audit retention windows, and local-only metrics collection are incorporated into design tasks.

Document any violations in Complexity Tracking with remediation steps or blockers.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
src/
├── core/uds/
│   ├── uds-protocol.ts              # Extend message encoder/decoder and NRC handling
│   ├── message-builder.ts           # Visual + advanced authoring logic
│   └── message-parser.ts            # Shared request/response parsing utilities
├── transport/
│   ├── iso-tp.ts                    # Simulated CAN transport timings & segmentation
│   └── doip-simulator.ts            # DoIP edge-node discovery + message tunneling
├── services/
│   └── index.ts                     # Service registry + 20 UDS service descriptors
├── simulation/
│   ├── virtual-ecu.ts               # Core ECU execution engine
│   └── ecu-models/
│       ├── engine-ecu.ts
│       ├── body-ecu.ts
│       └── gateway-ecu.ts
├── ui/
│   ├── components/
│   │   ├── drag-drop-builder.tsx
│   │   ├── protocol-selector.tsx
│   │   └── response-viewer.tsx
│   └── styles/
├── security/
│   ├── security-manager.ts
│   └── audit-logger.ts
├── automation/
│   ├── test-sequence-engine.ts
│   └── test-results.ts
├── storage/
│   ├── indexeddb-manager.ts
│   ├── audit-store.ts
│   └── usage-metrics-store.ts       # New local-only metrics persistence
└── utils/
   ├── validators.ts
   └── constants.ts

tests/
├── unit/uds/
├── integration/
│   ├── simulator.spec.ts            # Drag-drop + transport parity flows
│   └── security-access.spec.ts
└── e2e/
   └── playwright/diagnostics.spec.ts

public/
├── index.html
├── manifest.json
└── assets/
   ├── icons/
   └── odx-samples/
```

**Structure Decision**: Reuse layered directories, add `usage-metrics-store.ts` under storage, expand UI components for hybrid mode, and introduce targeted integration/e2e test suites covering audit retention and offline automation.

## Phase 0: Outline & Research

1. **Key research themes**
   - Service worker caching strategy that balances <2 MB shell with lazy module loading for 20+ UDS services.
   - Deterministic ISO 14229 timing windows for simulated ECU responses (CAN vs DoIP) in a browser environment.
   - Client-side seed-key security algorithms suitable for demo use without exposing proprietary secrets.
   - IndexedDB compaction + auto-expiry pattern to enforce 30-day audit retention and local-only metrics.
   - Web Worker orchestration for automated test sequences without starving UI threads.

2. **Research execution**
   - Survey PWA guidance (Workbox, manual caching) → choose hybrid precache + runtime caching list.
   - Review ISO 14229 timing classes and map them to setTimeout/MessageChannel budgets.
   - Evaluate open seed-key examples; adopt reversible polynomial approach with pluggable hooks for OEM extension.
   - Prototype IndexedDB stores with TTL indices and periodic cleanup.
   - Validate Web Worker message contract for long-running automation vs. main thread render budget.

3. **Output**
   - Captured in [`research.md`](./research.md) with decision/rationale/alternative tables; all outstanding unknowns resolved or deferred with justification.

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Data modeling**
   - Document Diagnostic Scenario Template, UDS Service Request, Virtual ECU Profile, Diagnostic Audit Entry, Automated Test Run, Usage Metrics Snapshot, and Security Session in [`data-model.md`](./data-model.md).
   - Capture field types, validation rules (e.g., SID range checks, retention TTL), and relationships between scenarios, ECUs, and audits.

2. **Contracts**
   - Define Web Worker RPC surface between UI and automation engine, and messaging contracts between UI and transport layer in `/contracts/worker-contracts.ts` (TypeScript interface bundle) and `/contracts/telemetry-contracts.ts`.
   - Provide OpenAPI-style schema for local pseudo-endpoints exposed by service worker to keep format consistent with layered architecture.

3. **Contract tests**
   - Author Jest test skeletons under `/contracts/__tests__/` that import the interfaces and assert schema completeness using `expectTypeOf`/placeholder failing assertions.
   - Ensure tests fail initially via `fail('not implemented')` markers to drive TDD.

4. **Quickstart**
   - Translate primary user journeys into a smoke checklist inside [`quickstart.md`](./quickstart.md), covering cache warm-up, drag/drop, CAN vs DoIP comparison, automation run, and audit verification.

5. **Agent context update**
   - After contracts and quickstart are drafted, run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` to inject new architectural choices (Web Worker RPC, audit TTL, local-only metrics) into Copilot guidance.

**Output**: data-model.md, `/contracts/*`, `/contracts/__tests__/*`, quickstart.md, updated `.github/copilot-instructions.md` (if present).

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base.
- Derive tasks from design assets: one contract test + implementation pair per worker/UI message surface, one entity modeling + persistence task per data-model entity, one integration/e2e test per user scenario, and supporting UI/transport/security work.
- Flag storage cleanup, offline caching, and audit expiry tasks as dependent chain (no [P]); mark template visualization enhancements and documentation updates as [P] where safe.

**Ordering Strategy**:

- Enforce TDD: contract/unit tests, integration tests, e2e smoke tests before implementation tasks.
- Sequence persistence and security foundations before UI automation to honor constitution.
- Group offline/PWA work prior to telemetry features to ensure cache stability before metrics logging.

**Estimated Output**: 28–32 numbered tasks with dependency annotations and ≈20% parallelizable ([P])

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  |            |                                      |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v1.0.0 - See `/memory/constitution.md`_
