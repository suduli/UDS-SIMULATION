# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: tooling, manifests, shared types
   → Tests: Jest unit/integration smoke suites (MUST precede implementation)
   → Core: protocol engine, transport adapters, service handlers
   → UI: drag-and-drop components, visualization panels, styles
   → Storage & Security: IndexedDB stores, audit logging, session policies
   → Polish: performance budgets, documentation, accessibility, bundle checks
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All documented diagnostic flows implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- Source lives under `src/` following architecture folders (`core/`, `transport/`, `services/`, `simulation/`, `ui/`, `security/`, `automation/`, `integration/`, `storage/`, `utils/`).
- Tests reside under `tests/unit/`, `tests/integration/`, and `tests/e2e/` with mirrored folder structure.
- Static assets and PWA files sit in `public/`.
- Adjust paths when a feature introduces new directories—call them out explicitly in the task description.

## Phase 3.1: Setup

- [ ] T001 Ensure required folders exist (`src/<feature-path>/`, matching tests directories)
- [ ] T002 Update shared TypeScript types or enums in `src/utils/constants.ts`
- [ ] T003 [P] Configure or extend tooling (ESLint rules, Jest config, webpack aliases) if the feature demands it

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written in TypeScript and MUST FAIL before ANY implementation**

- [ ] T004 [P] Jest unit spec in `tests/unit/<domain>/` covering the new protocol/service logic
- [ ] T005 [P] Jest integration spec in `tests/integration/<domain>/` simulating CAN + DoIP flows
- [ ] T006 [P] Automation/Web Worker test in `tests/integration/automation/` when background execution changes
- [ ] T007 [P] UI interaction test in `tests/e2e/` (Playwright or equivalent) validating drag-and-drop or response viewer behavior

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T008 [P] Implement protocol logic in `src/core/` (e.g., message builder/parser updates)
- [ ] T009 [P] Extend transports in `src/transport/` ensuring parity across CAN and DoIP
- [ ] T010 [P] Add or update service handlers in `src/services/` with sid-specific validation
- [ ] T011 Update simulation models in `src/simulation/` and data pools for new parameters
- [ ] T012 Wire UI components in `src/ui/` to surface new functionality and traces
- [ ] T013 Persist session/test data via `src/storage/` or audit updates in `src/security/`
- [ ] T014 Ensure logging and telemetry hooks capture outcomes for audits

## Phase 3.4: Integration

- [ ] T015 Exercise end-to-end flows in integration tests, verifying message timing and NRC handling
- [ ] T016 Validate offline caching/service worker manifest updates if assets changed
- [ ] T017 Update automation sequences or IndexedDB migrations when schemas evolve
- [ ] T018 Review accessibility, localization, and responsiveness adjustments

## Phase 3.5: Polish

- [ ] T019 [P] Expand Jest coverage for edge cases introduced during implementation
- [ ] T020 Run performance and bundle size checks (<2 MB initial load, latency budgets)
- [ ] T021 [P] Update docs (`docs/user-guide/`, `docs/api/`) and in-app help
- [ ] T022 Audit console logs, feature flags, and remove temporary instrumentation
- [ ] T023 Execute manual smoke checklist or quickstart instructions, capture screenshots if UI changed

## Dependencies

- Tests (T004-T007) before implementation (T008-T014)
- Transport/service updates (T009/T010) block simulation or UI tasks that depend on them
- Automation and storage tasks (T006/T013) must complete before performing migrations or background runs (T017)
- Implementation before polish (T019-T023)

## Parallel Example

```
# Launch T004-T007 together:
Task: "Jest unit spec for uds-protocol in tests/unit/core/uds-protocol.spec.ts"
Task: "Integration spec for ISO-TP + DoIP round-trip in tests/integration/transport/iso-tp-doip.spec.ts"
Task: "Automation worker spec in tests/integration/automation/test-sequence-engine.spec.ts"
Task: "UI drag-and-drop smoke test in tests/e2e/ui/message-builder.spec.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each service or transport contract (`/contracts/*.md` or `/contracts/*.yaml`) → contract/spec test task [P]
   - Each documented diagnostic flow → implementation task covering both CAN and DoIP paths
2. **From Data Model**:
   - Each entity → data pool or IndexedDB store task [P]
   - Relationships → service factory or simulation linkage tasks
3. **From User Stories**:
   - Each story → integration or UI test [P]
   - Quickstart scenarios → automation or documentation tasks

4. **Ordering**:
   - Setup → Tests → Protocol/Transport → Services → UI/Storage → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked by main() before returning_

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
