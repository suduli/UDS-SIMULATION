// Automation run storage
import type { IndexedDBManager } from './indexeddb-manager';
import type { AutomatedTestRun } from '../automation/test-sequence-engine';

export class AutomationRunStore {
  constructor(private dbManager: IndexedDBManager) {}

  async save(run: AutomatedTestRun): Promise<void> {
    await this.dbManager.put('automation_runs', run);
  }

  async getById(id: string): Promise<AutomatedTestRun | undefined> {
    return this.dbManager.get<AutomatedTestRun>('automation_runs', id);
  }

  async getAll(): Promise<AutomatedTestRun[]> {
    return this.dbManager.getAll<AutomatedTestRun>('automation_runs');
  }
}
