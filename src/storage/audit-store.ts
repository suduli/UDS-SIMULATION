// Audit entry storage
import type { IndexedDBManager } from './indexeddb-manager';
import type { DiagnosticAuditEntry } from '../security/audit-logger';

export class AuditStore {
  constructor(private dbManager: IndexedDBManager) {}

  async save(entry: DiagnosticAuditEntry): Promise<void> {
    await this.dbManager.put('audit_entries', entry);
  }

  async getAll(): Promise<DiagnosticAuditEntry[]> {
    return this.dbManager.getAll<DiagnosticAuditEntry>('audit_entries');
  }

  async cleanupExpired(maxAgeMs: number): Promise<number> {
    return this.dbManager.cleanupExpired('audit_entries', {
      enabled: true,
      fieldName: 'timestamp',
      maxAgeMs,
    });
  }
}
