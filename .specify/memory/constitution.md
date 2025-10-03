<!--
Sync Impact Report
Version change: n/a → 1.0.0
Added principles:
- I. Client-Side Simulation First
- II. Typed Layered Architecture
- III. UDS Service Fidelity
- IV. Diagnostic Test Discipline
- V. Secure & Auditable Sessions
Added sections:
- Platform Constraints & Performance Targets
- Development Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .github/prompts/constitution.prompt.md
Follow-up TODOs:
- None
-->

# UDS Protocol Interactive Website Constitution

## Core Principles

### I. Client-Side Simulation First

All diagnostic functionality MUST execute entirely in the browser so the platform can ship as static assets on GitHub Pages.
Implementations MUST preserve offline capability through service workers and deterministic virtual ECU behavior.
Any new feature MUST prove that removing remote dependencies does not degrade the interactive experience or data persistence.

### II. Typed Layered Architecture

Core, transport, service, simulation, UI, security, automation, and storage modules MUST remain decoupled according to the layered structure defined in `ARCHITECTURE.md`.
Every source file MUST be written in TypeScript 5.x with `strict` compiler settings, shared domain types, and exhaustive enums.
Cross-layer contracts MUST be declared in dedicated TypeScript interfaces so Copilot and reviewers can verify compile-time safety before runtime testing.

### III. UDS Service Fidelity

Each implemented service MUST conform to ISO 14229-1 request/response shapes, required negative response codes, and timing constraints.
Message builder, parser, and transport layers MUST support both CAN (ISO-TP) and DoIP paths with identical service coverage.
Regression tests MUST capture seeds, DIDs, DTCs, and routine parameters to guard against drift from the official UDS catalog.

### IV. Diagnostic Test Discipline

All work MUST begin with unit and integration tests that fail, covering happy paths, negative responses, timing errors, and transport edge cases.
Continuous integration MUST run Jest unit suites, integration harnesses, and scripted browser smoke tests before merging.
Trace logs, IndexedDB fixtures, and Web Worker automation MUST be included in tests to validate orchestration and concurrency requirements.

### V. Secure & Auditable Sessions

Security features (seed-key, session levels, communication control) MUST default to the strictest policy that still reflects production UDS behavior.
Every diagnostic interaction MUST generate an audit record with timestamp, requester context, service, and outcome stored in client-side persistence.
Cryptographic simulations MUST document algorithms used, rationale, and limitations so future hardening work can start from verified baselines.

## Platform Constraints & Performance Targets

- Ship the application as a Progressive Web App with manifest metadata, service worker caching, and offline replay of diagnostic sessions.
- Maintain sub-150ms response time for simulated ECU round-trips under nominal load and document variance when load testing introduces delays.
- Keep bundle sizes within limits suitable for GitHub Pages (<2 MB initial load) through code splitting and lazy-loading of service modules.
- Provide accessible UI interactions, keyboard shortcuts, and touch support for the drag-and-drop workflow across evergreen desktop and mobile browsers.

## Development Workflow & Quality Gates

- Follow the Spec → Plan → Tasks → Implementation cadence outlined in `.specify` templates; every phase MUST reference this constitution.
- No pull request merges without demonstrable passing tests, updated documentation, and constitution compliance checklist recorded in review notes.
- Research outputs, contracts, and quickstart guides MUST live alongside features in `/specs` folders and stay synchronized with runtime behavior.
- Any introduction of new tooling or dependencies MUST include risk assessment, mitigation strategy, and removal plan if the tool fails CI.

## Governance

This constitution supersedes ad hoc practices and applies to all contributors and automation.
Amendments require a documented proposal, alignment updates to `.specify/templates`, and version bumps according to semantic rules.
Reviews MUST reject contributions that bypass tests, violate architectural layering, or omit security and audit coverage.
Quarterly compliance reviews by maintainers MUST confirm principles remain valid; deviations demand remediation plans before new feature work.

**Version**: 1.0.0 | **Ratified**: 2025-09-29 | **Last Amended**: 2025-09-29
