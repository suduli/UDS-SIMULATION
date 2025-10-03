import { MetricsEvent, MetricsSnapshot, MetricsStore } from '../telemetry-contracts';

declare function describe(description: string, fn: () => void): void;
declare function it(description: string, fn: () => void): void;
declare function expect(actual: unknown): {
  toHaveProperty(key: string): void;
  toBe(value: unknown): void;
  toBeGreaterThan(value: number): void;
};

describe('Telemetry contract expectations', () => {
  it('requires persona and payload typing', () => {
    const event: MetricsEvent = {
      id: 'metric-1',
      event: 'TEMPLATE_RUN',
      occurredAt: Date.now(),
      persona: 'engineer',
      payload: {
        templateId: 'tmpl-1',
        scenarioType: 'visual',
        transportModes: ['CAN', 'DoIP'],
        result: 'success',
      },
    };

    expect(event.payload).toHaveProperty('templateId');
    throw new Error('Telemetry contract validation pending implementation');
  });

  it('captures snapshot time windows', () => {
    const snapshot: MetricsSnapshot = {
      snapshotId: 'snap-1',
      windowStart: Date.now() - 3600_000,
      windowEnd: Date.now(),
      templateTotals: [],
      serviceUsage: {},
      averageRatings: 4.5,
    };

    expect(snapshot.windowEnd).toBeGreaterThan(snapshot.windowStart);
    throw new Error('Snapshot schema assertions not implemented');
  });

  it('defines store operations for local-only data', () => {
    const store: MetricsStore = {
      saveEvent: async () => undefined,
      loadEventsSince: async () => [],
      generateSnapshot: async () => ({
        snapshotId: 'snap-2',
        windowStart: 0,
        windowEnd: 0,
        templateTotals: [],
        serviceUsage: {},
        averageRatings: 0,
      }),
      clearAll: async () => undefined,
    };

    expect(store).toHaveProperty('clearAll');
    throw new Error('Metrics store contract tests must be implemented');
  });
});
