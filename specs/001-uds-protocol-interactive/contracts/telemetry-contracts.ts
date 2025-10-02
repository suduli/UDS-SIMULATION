// Telemetry contract definitions for local-only metrics aggregation.

export interface MetricsEvent {
  id: string;
  event: MetricsEventType;
  occurredAt: number;
  persona: 'engineer' | 'trainer' | 'auditor';
  payload: TemplateRunEvent | ServiceUsageEvent | FeedbackEvent;
}

export type MetricsEventType = 'TEMPLATE_RUN' | 'SERVICE_USED' | 'FEEDBACK_SUBMITTED';

export interface TemplateRunEvent {
  templateId: string;
  scenarioType: 'visual' | 'advanced' | 'automation';
  transportModes: Array<'CAN' | 'DoIP'>;
  result: 'success' | 'nrc' | 'error';
}

export interface ServiceUsageEvent {
  sid: number;
  transport: 'CAN' | 'DoIP';
  durationMs: number;
}

export interface FeedbackEvent {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface MetricsSnapshot {
  snapshotId: string;
  windowStart: number;
  windowEnd: number;
  templateTotals: Array<{ templateId: string; runCount: number }>;
  serviceUsage: Record<string, number>;
  averageRatings: number;
}

export interface MetricsStore {
  saveEvent(event: MetricsEvent): Promise<void>;
  loadEventsSince(timestamp: number): Promise<MetricsEvent[]>;
  generateSnapshot(windowMs: number): Promise<MetricsSnapshot>;
  clearAll(): Promise<void>;
}
