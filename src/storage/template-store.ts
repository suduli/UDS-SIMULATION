// Template store for persisting diagnostic scenarios

import type { IndexedDBManager } from './indexeddb-manager';
import type { DiagnosticScenarioTemplate } from '../core/uds/message-builder';

export class TemplateStore {
  private dbManager: IndexedDBManager;

  private readonly storeName = 'templates';

  constructor(dbManager: IndexedDBManager) {
    this.dbManager = dbManager;
  }

  /**
   * Save a template
   */
  async save(template: DiagnosticScenarioTemplate): Promise<void> {
    // Validate template
    this.validateTemplate(template);

    // Check for name uniqueness (simplified - in production would check by persona)
    const existing = await this.findByName(template.name);
    if (existing && existing.id !== template.id) {
      throw new Error('Template name must be unique');
    }

    await this.dbManager.put(this.storeName, template);
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<DiagnosticScenarioTemplate | undefined> {
    return this.dbManager.get<DiagnosticScenarioTemplate>(this.storeName, id);
  }

  /**
   * Find template by name
   */
  async findByName(name: string): Promise<DiagnosticScenarioTemplate | undefined> {
    const templates = await this.dbManager.queryByIndex<DiagnosticScenarioTemplate>(
      this.storeName,
      'by_name',
      name,
    );
    return templates[0];
  }

  /**
   * Get all templates
   */
  async getAll(): Promise<DiagnosticScenarioTemplate[]> {
    return this.dbManager.getAll<DiagnosticScenarioTemplate>(this.storeName);
  }

  /**
   * Delete template by ID
   */
  async delete(id: string): Promise<void> {
    await this.dbManager.delete(this.storeName, id);
  }

  /**
   * Validate template constraints
   */
  // eslint-disable-next-line class-methods-use-this
  private validateTemplate(template: DiagnosticScenarioTemplate): void {
    if (!template.name || template.name.length > 64) {
      throw new Error('Template name must be 1-64 characters');
    }

    if (template.description.length > 256) {
      throw new Error('Template description must be 256 characters or less');
    }

    if (template.services.length === 0) {
      throw new Error('Template must contain at least one service');
    }

    // Validate total payload size
    const totalSize = template.services.reduce((sum, service) => sum + service.data.length, 0);
    if (totalSize > 4096) {
      throw new Error('Total services payload exceeds 4096 bytes');
    }

    // Validate each service
    template.services.forEach((service) => {
      if (service.sid < 0x10 || service.sid > 0x85) {
        throw new Error('Invalid SID range');
      }

      if (!['CAN', 'DoIP'].includes(service.transport)) {
        throw new Error('Invalid transport mode');
      }

      if (!['default', 'supplier', 'oem'].includes(service.securityLevelRequired)) {
        throw new Error('Invalid security level');
      }
    });
  }
}
