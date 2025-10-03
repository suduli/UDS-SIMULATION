// Audit logger for diagnostic interactions
export interface DiagnosticAuditEntry {
  id: string;
  timestamp: string;
  userPersona: 'engineer' | 'trainer' | 'auditor';
  scenarioId: string | null;
  ecuId: string;
  serviceSid: number;
  transport: 'CAN' | 'DoIP';
  securityLevelUsed: 'default' | 'supplier' | 'oem';
  result: 'success' | 'nrc' | 'error';
  nrcCode: number | null;
  durationMs: number;
}

export class AuditLogger {
  // eslint-disable-next-line class-methods-use-this
  async log(entry: Omit<DiagnosticAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: DiagnosticAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // In production, save to IndexedDB
    // eslint-disable-next-line no-console
    console.log('Audit entry:', auditEntry);
  }
}
