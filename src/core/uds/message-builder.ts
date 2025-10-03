// Message builder for creating UDS diagnostic scenarios

import type { UDSServiceRequest } from './uds-protocol';

export interface DiagnosticScenarioTemplate {
  id: string;
  name: string;
  description: string;
  services: UDSServiceRequest[];
  targetEcuId: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
}

export class MessageBuilder {
  private services: UDSServiceRequest[] = [];

  private name = '';

  private description = '';

  private targetEcuId = '';

  /**
   * Set template name
   */
  setName(name: string): this {
    if (name.length > 64) {
      throw new Error('Template name must be 64 characters or less');
    }
    this.name = name;
    return this;
  }

  /**
   * Set template description
   */
  setDescription(description: string): this {
    if (description.length > 256) {
      throw new Error('Template description must be 256 characters or less');
    }
    this.description = description;
    return this;
  }

  /**
   * Set target ECU ID
   */
  setTargetEcu(ecuId: string): this {
    this.targetEcuId = ecuId;
    return this;
  }

  /**
   * Add a service to the scenario
   */
  addService(service: UDSServiceRequest): this {
    // Validate total payload size
    const totalSize =
      this.services.reduce((sum, s) => sum + s.data.length, 0) + service.data.length;
    if (totalSize > 4096) {
      throw new Error('Total services payload exceeds 4096 bytes');
    }

    this.services.push(service);
    return this;
  }

  /**
   * Build the diagnostic scenario template
   */
  build(): DiagnosticScenarioTemplate {
    if (this.services.length === 0) {
      throw new Error('Template must contain at least one service');
    }

    if (!this.name) {
      throw new Error('Template name is required');
    }

    if (!this.targetEcuId) {
      throw new Error('Target ECU ID is required');
    }

    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      name: this.name,
      description: this.description,
      services: [...this.services],
      targetEcuId: this.targetEcuId,
      createdAt: now,
      updatedAt: now,
      isTemplate: true,
    };
  }

  /**
   * Reset builder to initial state
   */
  reset(): this {
    this.services = [];
    this.name = '';
    this.description = '';
    this.targetEcuId = '';
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  private generateId(): string {
    return `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
