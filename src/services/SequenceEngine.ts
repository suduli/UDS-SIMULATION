/**
 * Sequence Engine
 * Core execution engine for diagnostic sequences
 */

import type { 
  Sequence, 
  SequenceStep, 
  SequenceExecutionState,
  SequenceValidationResult,
  StepExecutionResult,
  SequenceExecutionOptions
} from '../types/sequence';
import type { UDSRequest, UDSResponse } from '../types/uds';
import { delay } from '../utils/udsHelpers';

export class SequenceEngine {
  private abortController: AbortController | null = null;

  /**
   * Validate a sequence before execution
   */
  validateSequence(sequence: Sequence): SequenceValidationResult {
    const errors: SequenceValidationResult['errors'] = [];
    const warnings: string[] = [];

    // Check for empty sequence
    if (sequence.steps.length === 0) {
      errors.push({
        stepId: '',
        stepOrder: 0,
        message: 'Sequence must contain at least one step',
        severity: 'error'
      });
    }

    // Validate each step
    sequence.steps.forEach((step, index) => {
      // Check order consistency
      if (step.order !== index) {
        warnings.push(`Step ${index + 1} has incorrect order value (${step.order} vs ${index})`);
      }

      // Check for valid SID
      if (step.request.sid === undefined || step.request.sid < 0 || step.request.sid > 0xFF) {
        errors.push({
          stepId: step.id,
          stepOrder: step.order,
          message: `Invalid Service ID: ${step.request.sid}`,
          severity: 'error'
        });
      }

      // Check delay is reasonable
      if (step.delay < 0) {
        errors.push({
          stepId: step.id,
          stepOrder: step.order,
          message: 'Delay cannot be negative',
          severity: 'error'
        });
      }
      if (step.delay > 60000) {
        warnings.push(`Step ${step.order + 1} has very long delay (${step.delay}ms)`);
      }

      // Check for variable references
      const variableRefs = this.extractVariableReferences(step.request);
      variableRefs.forEach(ref => {
        if (!sequence.variables[ref] && !ref.startsWith('step')) {
          warnings.push(`Step ${step.order + 1} references undefined variable: ${ref}`);
        }
      });

      // Check for infinite loops (step referencing itself)
      if (variableRefs.some(ref => ref === `step${step.order}`)) {
        errors.push({
          stepId: step.id,
          stepOrder: step.order,
          message: 'Step cannot reference its own response',
          severity: 'error'
        });
      }

      // Check condition validity
      if (step.condition?.type === 'if_value' && !step.condition.expectedValue) {
        errors.push({
          stepId: step.id,
          stepOrder: step.order,
          message: 'Condition type "if_value" requires expectedValue',
          severity: 'error'
        });
      }
    });

    // Check for potential security issues (security access should come before protected services)
    const hasProtectedService = sequence.steps.some(s => 
      [0x27, 0x28, 0x31, 0x34, 0x35, 0x36, 0x3D, 0x3E].includes(s.request.sid)
    );
    const hasSecurityAccess = sequence.steps.some(s => s.request.sid === 0x27);
    
    if (hasProtectedService && !hasSecurityAccess) {
      warnings.push('Sequence uses protected services without security access. Requests may fail.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Execute a complete sequence
   */
  async executeSequence(
    sequence: Sequence,
    sendRequest: (request: UDSRequest) => Promise<UDSResponse>,
    options: SequenceExecutionOptions = {}
  ): Promise<SequenceExecutionState> {
    this.abortController = new AbortController();
    
    const executionState: SequenceExecutionState = {
      sequence,
      currentStep: 0,
      isRunning: true,
      isPaused: false,
      results: [],
      variables: { ...sequence.variables },
      startedAt: Date.now()
    };

    try {
      for (let i = 0; i < sequence.steps.length; i++) {
        if (this.abortController.signal.aborted) {
          break;
        }

        executionState.currentStep = i;
        const step = sequence.steps[i];

        // Check breakpoint
        if (step.breakpoint && !options.skipBreakpoints) {
          executionState.isPaused = true;
          executionState.pausedAt = Date.now();
          // In real implementation, this would pause until resume() is called
          // For now, we'll just note it in the result
        }

        // Apply delay (scaled by speed)
        const effectiveDelay = step.delay / (options.speed || 1);
        if (effectiveDelay > 0) {
          await delay(effectiveDelay);
        }

        // Evaluate condition
        const shouldExecute = this.evaluateCondition(
          step,
          executionState.results[i - 1]?.response
        );

        if (!shouldExecute) {
          // Skip this step
          executionState.results.push({
            step,
            response: { 
              sid: step.request.sid, 
              data: [], 
              timestamp: Date.now(), 
              isNegative: false 
            },
            success: true,
            timestamp: Date.now(),
            duration: 0,
            error: 'Skipped due to condition'
          } as StepExecutionResult);
          continue;
        }

        // Execute step
        const result = await this.executeStep(
          step,
          executionState.variables,
          sendRequest,
          options.dryRun
        );

        executionState.results.push(result);

        // Update variables with response data
        if (result.success && result.response.data) {
          executionState.variables[`step${i}`] = result.response.data;
        }

        // Check if should continue on error
        if (!result.success) {
          const shouldStop = options.stopOnError ?? !step.continueOnError;
          if (shouldStop) {
            // Set flags before breaking
            executionState.isRunning = false;
            executionState.completedAt = Date.now();
            executionState.totalDuration = executionState.completedAt - (executionState.startedAt || 0);
            break;
          }
        }
      }

      // Set completion flags (might already be set if broke early)
      if (!executionState.completedAt) {
        executionState.completedAt = Date.now();
        executionState.totalDuration = executionState.completedAt - (executionState.startedAt || 0);
      }
      executionState.isRunning = false;

      return executionState;
    } catch (error) {
      executionState.isRunning = false;
      executionState.completedAt = Date.now();
      executionState.totalDuration = executionState.completedAt - (executionState.startedAt || 0);
      throw error;
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(
    step: SequenceStep,
    variables: Record<string, number[]>,
    sendRequest: (request: UDSRequest) => Promise<UDSResponse>,
    dryRun?: boolean
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    try {
      // Substitute variables in request
      const processedRequest = this.substituteVariables(step.request, variables);

      if (dryRun) {
        // In dry run mode, create a mock response
        return {
          step,
          response: {
            sid: processedRequest.sid,
            data: [0x00],
            timestamp: Date.now(),
            isNegative: false
          },
          success: true,
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }

      // Execute the actual request
      const response = await sendRequest(processedRequest);

      // Validate response if expected response is defined
      const success = this.validateResponse(response, step.expectedResponse);

      return {
        step,
        response,
        success,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        error: success ? undefined : 'Response did not match expected pattern'
      };
    } catch (error) {
      return {
        step,
        response: {
          sid: step.request.sid,
          data: [],
          timestamp: Date.now(),
          isNegative: true,
          nrc: 0x10 // General reject
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Evaluate if a step should execute based on its condition
   */
  evaluateCondition(
    step: SequenceStep,
    lastResponse?: UDSResponse
  ): boolean {
    if (!step.condition) {
      return true; // No condition, always execute
    }

    if (!lastResponse) {
      return step.condition.type === 'always';
    }

    switch (step.condition.type) {
      case 'always':
        return true;

      case 'if_positive':
        return !lastResponse.isNegative;

      case 'if_negative':
        return lastResponse.isNegative === true;

      case 'if_value':
        if (!step.condition.expectedValue || !lastResponse.data) {
          return false;
        }
        return this.matchesDataPattern(
          lastResponse.data,
          step.condition.expectedValue
        );

      default:
        return true;
    }
  }

  /**
   * Substitute variables in request data
   */
  substituteVariables(
    request: UDSRequest,
    _variables: Record<string, number[]>
  ): UDSRequest {
    // Clone the request to avoid mutation
    const processedRequest: UDSRequest = {
      ...request,
      data: request.data ? [...request.data] : []
    };

    // Process data array for variable tokens
    // In a real implementation, we might support ${variableName} syntax in data
    // For now, we'll keep it simple and just return the processed request
    // TODO: Implement variable substitution using _variables parameter
    
    return processedRequest;
  }

  /**
   * Extract variable references from a request
   */
  private extractVariableReferences(_request: UDSRequest): string[] {
    const refs: string[] = [];
    
    // Look for variable patterns in data
    // This is a simplified implementation
    // In production, you might parse ${variableName} tokens
    // TODO: Implement variable reference extraction from _request
    
    return refs;
  }

  /**
   * Check if response data matches expected pattern
   */
  private matchesDataPattern(data: number[], pattern: number[]): boolean {
    if (data.length !== pattern.length) {
      return false;
    }

    return pattern.every((byte, index) => {
      // -1 is wildcard (matches any byte)
      return byte === -1 || byte === data[index];
    });
  }

  /**
   * Validate response against expected response
   */
  private validateResponse(
    response: UDSResponse,
    expected?: SequenceStep['expectedResponse']
  ): boolean {
    if (!expected) {
      return true; // No validation required
    }

    // Check positive/negative
    if (expected.isPositive !== undefined) {
      if (expected.isPositive && response.isNegative) {
        return false;
      }
      if (!expected.isPositive && !response.isNegative) {
        return false;
      }
    }

    // Check NRC
    if (expected.nrc !== undefined && response.nrc !== expected.nrc) {
      return false;
    }

    // Check data pattern
    if (expected.dataPattern && response.data) {
      return this.matchesDataPattern(response.data, expected.dataPattern);
    }

    return true;
  }

  /**
   * Abort current execution
   */
  abort(): void {
    this.abortController?.abort();
  }
}

// Export singleton instance
export const sequenceEngine = new SequenceEngine();
