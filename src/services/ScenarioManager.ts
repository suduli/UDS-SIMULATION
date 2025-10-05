/**
 * Scenario Manager Service
 * Handles export, import, validation, and CRUD operations for scenarios
 */

import type {
  EnhancedScenario,
  ScenarioLibrary,
  ScenarioMetadata,
  ScenarioValidationResult,
  ExportFormat,
  CSVScenarioRow,
  ScenarioStatistics,
} from '../types/scenario';
import type { UDSRequest, UDSResponse } from '../types/uds';
import { getServiceName } from '../utils/udsHelpers';

const STORAGE_KEY = 'uds_enhanced_scenarios';
const STORAGE_VERSION = '1.0.0';

export class ScenarioManager {
  /**
   * Export scenario as JSON blob
   */
  async exportScenario(scenario: EnhancedScenario, format: ExportFormat = 'json'): Promise<Blob> {
    if (format === 'csv') {
      return this.exportToCSV(scenario);
    }

    const jsonString = JSON.stringify(scenario, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export scenario as CSV
   */
  async exportToCSV(scenario: EnhancedScenario): Promise<Blob> {
    const rows: CSVScenarioRow[] = [];

    scenario.requests.forEach((request, index) => {
      const response = scenario.responses?.[index];
      rows.push({
        step: index + 1,
        timestamp: new Date(request.timestamp).toISOString(),
        service: getServiceName(request.sid),
        sid: `0x${request.sid.toString(16).toUpperCase().padStart(2, '0')}`,
        subFunction: request.subFunction
          ? `0x${request.subFunction.toString(16).toUpperCase().padStart(2, '0')}`
          : undefined,
        data: request.data?.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') || '',
        responseType: response?.isNegative ? 'negative' : 'positive',
        nrc: response?.nrc ? `0x${response.nrc.toString(16).toUpperCase().padStart(2, '0')}` : undefined,
        responseData: response?.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') || '',
        timing: scenario.timings[index] || 0,
      });
    });

    // Create CSV header
    const headers = [
      'Step',
      'Timestamp',
      'Service',
      'SID',
      'SubFunction',
      'Request Data',
      'Response Type',
      'NRC',
      'Response Data',
      'Timing (ms)',
    ];

    // Create CSV content
    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        [
          row.step,
          `"${row.timestamp}"`,
          `"${row.service}"`,
          row.sid,
          row.subFunction || '',
          `"${row.data}"`,
          row.responseType,
          row.nrc || '',
          `"${row.responseData}"`,
          row.timing,
        ].join(',')
      ),
    ];

    const csvString = csvLines.join('\n');
    return new Blob([csvString], { type: 'text/csv' });
  }

  /**
   * Import scenario from file
   */
  async importScenario(file: File): Promise<EnhancedScenario> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          const validationResult = this.validateScenario(data);

          if (!validationResult.isValid) {
            reject(new Error(`Invalid scenario: ${validationResult.errors.join(', ')}`));
            return;
          }

          if (validationResult.scenario) {
            resolve(validationResult.scenario);
          } else {
            reject(new Error('Validation passed but no scenario returned'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse scenario file: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate scenario data
   */
  validateScenario(data: unknown): ScenarioValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Scenario must be an object');
      return { isValid: false, errors, warnings };
    }

    const scenario = data as Partial<EnhancedScenario>;

    // Required fields
    if (!scenario.id) errors.push('Missing required field: id');
    if (!scenario.name) errors.push('Missing required field: name');
    if (!scenario.requests || !Array.isArray(scenario.requests)) {
      errors.push('Missing or invalid field: requests');
    }
    if (!scenario.createdAt) errors.push('Missing required field: createdAt');

    // Version check
    if (!scenario.version) {
      warnings.push('No version specified, assuming current version');
      scenario.version = STORAGE_VERSION;
    }

    // Metadata validation
    if (!scenario.metadata) {
      warnings.push('No metadata found');
      scenario.metadata = {
        description: scenario.description || '',
        tags: [],
        duration: 0,
        totalRequests: scenario.requests?.length || 0,
        successRate: 0,
      };
    }

    // Timings validation
    if (!scenario.timings || !Array.isArray(scenario.timings)) {
      warnings.push('No timing data found, using defaults');
      scenario.timings = new Array(scenario.requests?.length || 0).fill(100);
    } else if (scenario.timings.length !== scenario.requests?.length) {
      warnings.push('Timing array length mismatch, padding with defaults');
      while (scenario.timings.length < (scenario.requests?.length || 0)) {
        scenario.timings.push(100);
      }
    }

    // Validate each request
    if (scenario.requests && Array.isArray(scenario.requests)) {
      scenario.requests.forEach((request, index) => {
        if (typeof request.sid !== 'number') {
          errors.push(`Request ${index}: Invalid SID`);
        }
        if (!request.timestamp) {
          warnings.push(`Request ${index}: Missing timestamp, using current time`);
          request.timestamp = Date.now();
        }
      });
    }

    // Validate responses if present
    if (scenario.responses && Array.isArray(scenario.responses)) {
      if (scenario.responses.length !== scenario.requests?.length) {
        warnings.push('Response array length mismatch');
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      scenario: isValid ? (scenario as EnhancedScenario) : undefined,
    };
  }

  /**
   * Save scenario to library
   */
  async saveScenario(scenario: EnhancedScenario): Promise<void> {
    const library = await this.getLibrary();
    
    // Check if scenario already exists and update it
    const existingIndex = library.scenarios.findIndex(s => s.id === scenario.id);
    
    if (existingIndex >= 0) {
      library.scenarios[existingIndex] = scenario;
    } else {
      library.scenarios.push(scenario);
    }
    
    library.lastModified = Date.now();
    
    await this.saveLibrary(library);
  }

  /**
   * Get all scenarios from library
   */
  async listScenarios(): Promise<EnhancedScenario[]> {
    const library = await this.getLibrary();
    return library.scenarios;
  }

  /**
   * Get scenario by ID
   */
  async getScenarioById(id: string): Promise<EnhancedScenario | null> {
    const library = await this.getLibrary();
    return library.scenarios.find(s => s.id === id) || null;
  }

  /**
   * Delete scenario from library
   */
  async deleteScenario(id: string): Promise<void> {
    const library = await this.getLibrary();
    library.scenarios = library.scenarios.filter(s => s.id !== id);
    library.lastModified = Date.now();
    await this.saveLibrary(library);
  }

  /**
   * Update scenario
   */
  async updateScenario(id: string, updates: Partial<EnhancedScenario>): Promise<void> {
    const library = await this.getLibrary();
    const index = library.scenarios.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error(`Scenario not found: ${id}`);
    }
    
    library.scenarios[index] = {
      ...library.scenarios[index],
      ...updates,
    };
    
    library.lastModified = Date.now();
    await this.saveLibrary(library);
  }

  /**
   * Create enhanced scenario from request history
   */
  createEnhancedScenario(
    requests: UDSRequest[],
    responses: UDSResponse[],
    metadata: ScenarioMetadata,
    timings?: number[]
  ): EnhancedScenario {
    const totalRequests = requests.length;
    const positiveResponses = responses.filter(r => !r.isNegative).length;
    const successRate = totalRequests > 0 ? Math.round((positiveResponses / totalRequests) * 100) : 0;
    
    const duration = requests.length > 0 && requests[requests.length - 1]
      ? requests[requests.length - 1].timestamp - requests[0].timestamp
      : 0;

    const calculatedTimings = timings || this.calculateTimings(requests);

    return {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: metadata.name,
      description: metadata.description,
      version: STORAGE_VERSION,
      metadata: {
        author: metadata.author,
        description: metadata.description,
        tags: metadata.tags || [],
        duration,
        totalRequests,
        successRate,
      },
      requests,
      responses,
      timings: calculatedTimings,
      notes: metadata.notes,
      createdAt: Date.now(),
    };
  }

  /**
   * Calculate timings between requests
   */
  private calculateTimings(requests: UDSRequest[]): number[] {
    const timings: number[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      if (i === 0) {
        timings.push(0); // First request has no delay
      } else {
        const delay = requests[i].timestamp - requests[i - 1].timestamp;
        timings.push(Math.max(0, delay)); // Ensure non-negative
      }
    }
    
    return timings;
  }

  /**
   * Get scenario statistics
   */
  async getStatistics(): Promise<ScenarioStatistics> {
    const library = await this.getLibrary();
    const scenarios = library.scenarios;

    if (scenarios.length === 0) {
      return {
        totalScenarios: 0,
        totalRequests: 0,
        averageSuccessRate: 0,
        mostUsedServices: [],
        averageDuration: 0,
        lastModified: library.lastModified,
      };
    }

    const totalRequests = scenarios.reduce((sum, s) => sum + s.metadata.totalRequests, 0);
    const averageSuccessRate = scenarios.reduce((sum, s) => sum + s.metadata.successRate, 0) / scenarios.length;
    const averageDuration = scenarios.reduce((sum, s) => sum + s.metadata.duration, 0) / scenarios.length;

    // Calculate most used services
    const serviceCount = new Map<number, number>();
    scenarios.forEach(scenario => {
      scenario.requests.forEach(request => {
        serviceCount.set(request.sid, (serviceCount.get(request.sid) || 0) + 1);
      });
    });

    const mostUsedServices = Array.from(serviceCount.entries())
      .map(([sid, count]) => ({ sid, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalScenarios: scenarios.length,
      totalRequests,
      averageSuccessRate: Math.round(averageSuccessRate),
      mostUsedServices,
      averageDuration: Math.round(averageDuration),
      lastModified: library.lastModified,
    };
  }

  /**
   * Search scenarios by name or tags
   */
  async searchScenarios(query: string): Promise<EnhancedScenario[]> {
    const library = await this.getLibrary();
    const lowerQuery = query.toLowerCase();

    return library.scenarios.filter(scenario => {
      const nameMatch = scenario.name.toLowerCase().includes(lowerQuery);
      const descriptionMatch = scenario.metadata.description.toLowerCase().includes(lowerQuery);
      const tagMatch = scenario.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

      return nameMatch || descriptionMatch || tagMatch;
    });
  }

  /**
   * Get library from storage
   */
  private async getLibrary(): Promise<ScenarioLibrary> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const library = JSON.parse(stored) as ScenarioLibrary;
        return library;
      }
    } catch (error) {
      console.error('Error loading scenario library:', error);
    }

    return {
      scenarios: [],
      lastModified: Date.now(),
    };
  }

  /**
   * Save library to storage
   */
  private async saveLibrary(library: ScenarioLibrary): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
      console.error('Error saving scenario library:', error);
      throw new Error('Failed to save scenario library. Storage may be full.');
    }
  }

  /**
   * Clear all scenarios (for testing/reset)
   */
  async clearAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const scenarioManager = new ScenarioManager();
