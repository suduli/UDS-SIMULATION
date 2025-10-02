# Data Model

## DiagnosticScenarioTemplate

- **Purpose**: Represents reusable sequences of UDS services with predefined parameters.
- **Primary Fields**:
  - `id: string` (UUID)
  - `name: string` (1–64 chars)
  - `description: string` (≤256 chars)
  - `services: UDSServiceRequest[]`
  - `targetEcuId: string`
  - `createdAt: ISODate`
  - `updatedAt: ISODate`
  - `isTemplate: boolean` (distinguish saved scenario vs ad-hoc)
- **Validation Rules**:
  - Must contain ≥1 service.
  - `name` unique per user persona (engineer, trainer, auditor).
  - `services` total payload ≤ 4096 bytes to remain within simulation limits.
- **Relationships**:
  - References `VirtualEcuProfile` via `targetEcuId`.
  - Generates `DiagnosticAuditEntry` upon execution.

## UDSServiceRequest

- **Purpose**: Encodes a single UDS service invocation.
- **Primary Fields**:
  - `sid: number` (0x10–0x3E, 0x85)
  - `subFunction: number | null`
  - `data: Uint8Array`
  - `transport: 'CAN' | 'DoIP'`
  - `securityLevelRequired: 'default' | 'supplier' | 'oem'`
  - `expectedNrc: number[]` (list of acceptable negative response codes)
- **Validation Rules**:
  - SID must match ISO 14229 catalogue.
  - Data length validated against service-specific constraints.
  - Transport toggles must be available for every service.
- **Relationships**:
  - Owned by `DiagnosticScenarioTemplate` or ad-hoc execution.
  - Used to create `AutomatedTestStep` records within `AutomatedTestRun`.

## VirtualEcuProfile

- **Purpose**: Captures simulated ECU characteristics.
- **Primary Fields**:
  - `id: string`
  - `label: 'Engine' | 'Body' | 'Gateway' | string`
  - `supportedSessions: string[]`
  - `dtcCatalog: DtcEntry[]`
  - `dataIdentifiers: DataIdentifier[]`
  - `timingProfile: 'fast' | 'nominal' | 'extended'`
  - `defaultSecurityLevel: 'default' | 'supplier' | 'oem'`
  - `capabilities: { routineControl: boolean; fileTransfer: boolean; periodicId: boolean }`
- **Validation Rules**:
  - At least one diagnostic session supported.
  - DTC identifiers must be unique per ECU.
  - Timing profile drives latency budgets defined in research.
- **Relationships**:
  - Referenced by scenarios, live sessions, and automation runs.
  - Contributes to audit entries and metrics snapshots.

## DiagnosticAuditEntry

- **Purpose**: Immutable record of each diagnostic interaction.
- **Primary Fields**:
  - `id: string`
  - `timestamp: ISODate`
  - `userPersona: 'engineer' | 'trainer' | 'auditor'`
  - `scenarioId: string | null`
  - `ecuId: string`
  - `serviceSid: number`
  - `transport: 'CAN' | 'DoIP'`
  - `securityLevelUsed: 'default' | 'supplier' | 'oem'`
  - `result: 'success' | 'nrc' | 'error'`
  - `nrcCode: number | null`
  - `durationMs: number`
- **Validation Rules**:
  - Entries expire after 30 days; cleanup job must run on app launch and idle.
  - `durationMs` must track CAN and DoIP variance ≤1000 ms.
- **Relationships**:
  - Linked to `UsageMetricsSnapshot` aggregates.
  - Read-only from UI except export functionality.

## AutomatedTestRun

- **Purpose**: Stores scheduled or executed automation sequences.
- **Primary Fields**:
  - `id: string`
  - `scenarioId: string`
  - `status: 'queued' | 'running' | 'paused' | 'passed' | 'failed'`
  - `startedAt: ISODate | null`
  - `finishedAt: ISODate | null`
  - `steps: AutomatedTestStep[]`
  - `log: string[]`
- **Validation Rules**:
  - When `status` transitions to terminal state, `finishedAt` must be populated.
  - Steps executed within Web Worker to avoid blocking UI.
- **Relationships**:
  - Generates `DiagnosticAuditEntry` per step.
  - Summaries feed `UsageMetricsSnapshot`.

## AutomatedTestStep

- **Purpose**: Represents individual command within a test run.
- **Primary Fields**:
  - `stepId: string`
  - `request: UDSServiceRequest`
  - `expectedResult: 'success' | 'nrc'`
  - `assertions: AssertionDescriptor[]`
- **Validation Rules**:
  - Each step must have at least one assertion.
  - Steps inherit security requirements from request.
- **Relationships**:
  - Nested inside `AutomatedTestRun`.

## UsageMetricsSnapshot

- **Purpose**: Local-only aggregate of anonymized simulator usage.
- **Primary Fields**:
  - `id: string`
  - `windowStart: ISODate`
  - `windowEnd: ISODate`
  - `topTemplates: Array<{ templateId: string; runCount: number }>`
  - `serviceUsage: Record<string, number>`
  - `feedbackRatings: number[]`
- **Validation Rules**:
  - Snapshots reset when browser data cleared; no sync beyond device.
  - Window length ≤7 days to maintain freshness.
- **Relationships**:
  - Derived from audit entries and automation runs.

## SecuritySession

- **Purpose**: Tracks current diagnostic session security context.
- **Primary Fields**:
  - `sessionId: string`
  - `ecuId: string`
  - `currentLevel: 'default' | 'supplier' | 'oem'`
  - `seed: Uint8Array | null`
  - `expiresAt: ISODate`
- **Validation Rules**:
  - Sessions expire after configurable idle timeout (default 5 minutes).
  - Seeds must be invalidated after three failed key attempts.
- **Relationships**:
  - Referenced by `UDSServiceRequest` executor prior to invocation.
  - Failures produce audit entries.

## Supporting Types

- **DtcEntry**: `{ code: string; statusMask: string; description: string }`
- **DataIdentifier**: `{ id: number; label: string; length: number; format: 'numeric' | 'ascii' | 'binary' }`
- **AssertionDescriptor**: `{ type: 'equal' | 'range' | 'nrc'; expected: unknown; actualPath: string }`
