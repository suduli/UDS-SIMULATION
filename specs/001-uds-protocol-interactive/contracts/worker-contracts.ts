// Worker-side contract definitions for UDS automation and transport orchestration.
// These interfaces will be copied into the runtime source during implementation.

export interface AutomationCommand {
  id: string;
  type: 'RUN_SCENARIO' | 'PAUSE_RUN' | 'RESUME_RUN' | 'CANCEL_RUN' | 'PING';
  payload: RunScenarioPayload | PauseRunPayload | ResumeRunPayload | CancelRunPayload | PingPayload;
  issuedAt: number; // epoch ms
}

export interface RunScenarioPayload {
  scenarioId: string;
  steps: AutomationStep[];
  ecuProfileId: string;
  transportMode: 'CAN' | 'DoIP' | 'BOTH';
  retries: number;
  securityLevel: 'default' | 'supplier' | 'oem';
  allowOfflineCache: boolean;
}

export interface PauseRunPayload {
  runId: string;
}

export interface ResumeRunPayload {
  runId: string;
}

export interface CancelRunPayload {
  runId: string;
  reason: string;
}

export interface PingPayload {
  correlationId: string;
}

export interface AutomationStep {
  stepId: string;
  request: EncodedUdsRequest;
  expectedOutcome: 'SUCCESS' | 'NRC';
  assertions: AssertionDescriptor[];
}

export interface AssertionDescriptor {
  id: string;
  type: 'equal' | 'range' | 'nrc';
  path: string;
  expectedValue: unknown;
}

export interface EncodedUdsRequest {
  sid: number;
  subFunction?: number;
  data: number[]; // byte values 0-255
  transport: 'CAN' | 'DoIP';
  securityLevelRequired: 'default' | 'supplier' | 'oem';
}

export interface AutomationEvent {
  id: string;
  runId: string;
  type:
    | 'RUN_STARTED'
    | 'STEP_STARTED'
    | 'STEP_COMPLETED'
    | 'RUN_COMPLETED'
    | 'RUN_FAILED'
    | 'RUN_PAUSED'
    | 'RUN_CANCELLED'
    | 'HEARTBEAT';
  payload:
    | RunStartedPayload
    | StepStartedPayload
    | StepCompletedPayload
    | RunCompletedPayload
    | RunFailedPayload
    | RunPausedPayload
    | RunCancelledPayload
    | HeartbeatPayload;
  emittedAt: number;
}

export interface RunStartedPayload {
  runId: string;
  scenarioId: string;
  ecuProfileId: string;
}

export interface StepStartedPayload {
  runId: string;
  stepId: string;
  sid: number;
  transport: 'CAN' | 'DoIP';
}

export interface StepCompletedPayload {
  runId: string;
  stepId: string;
  durationMs: number;
  result: 'SUCCESS' | 'NRC' | 'ERROR';
  nrcCode?: number;
}

export interface RunCompletedPayload {
  runId: string;
  totalDurationMs: number;
  passedSteps: number;
  failedSteps: number;
}

export interface RunFailedPayload {
  runId: string;
  failingStepId: string;
  errorMessage: string;
}

export interface RunPausedPayload {
  runId: string;
  reason: 'USER' | 'SECURITY' | 'NETWORK';
}

export interface RunCancelledPayload {
  runId: string;
  reason: string;
}

export interface HeartbeatPayload {
  runId: string;
  cpuUtilization: number; // percentage
  queueDepth: number;
}

export interface TransportExchange {
  requestId: string;
  runId?: string;
  rawRequest: number[];
  rawResponse?: number[];
  transport: 'CAN' | 'DoIP';
  durationMs?: number;
  securityLevelUsed: 'default' | 'supplier' | 'oem';
  error?: string;
}

export interface WorkerConfiguration {
  maxConcurrentRuns: number;
  heartbeatIntervalMs: number;
  timeoutMs: number;
}
