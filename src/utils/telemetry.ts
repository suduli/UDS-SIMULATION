// Telemetry utilities
export interface TelemetryEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

export class Telemetry {
  static track(event: TelemetryEvent): void {
    // eslint-disable-next-line no-console
    console.log('Telemetry:', event);
  }

  static aggregateMetrics(events: TelemetryEvent[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    events.forEach((event) => {
      metrics[event.type] = (metrics[event.type] || 0) + 1;
    });
    return metrics;
  }
}
