// Usage metrics storage
import type { IndexedDBManager } from './indexeddb-manager';

export interface UsageMetricsSnapshot {
  id: string;
  windowStart: string;
  windowEnd: string;
  topTemplates: Array<{ templateId: string; runCount: number }>;
  serviceUsage: Record<string, number>;
  feedbackRatings: number[];
}

export class UsageMetricsStore {
  constructor(private dbManager: IndexedDBManager) {}

  async saveSnapshot(snapshot: UsageMetricsSnapshot): Promise<void> {
    await this.dbManager.put('metrics_snapshots', snapshot);
  }

  async getAll(): Promise<UsageMetricsSnapshot[]> {
    return this.dbManager.getAll<UsageMetricsSnapshot>('metrics_snapshots');
  }
}
