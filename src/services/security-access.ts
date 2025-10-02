/**
 * Service 0x27: Security Access
 */

import { ServiceId, NegativeResponseCode, SecurityAccessType } from '../core/constants';
import { UDSRequest, UDSResponse, DiagnosticSessionState, ServiceHandler } from '../core/types';

export class SecurityAccessService implements ServiceHandler {
  serviceId = ServiceId.SECURITY_ACCESS;
  private securitySeed: Uint8Array = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
  private expectedKey: Uint8Array = new Uint8Array([0x87, 0x65, 0x43, 0x21]);
  private lastSeedTime = 0;
  private failedAttempts = 0;

  async handle(request: UDSRequest, state: DiagnosticSessionState): Promise<UDSResponse> {
    if (!request.subFunction) {
      return this.createNegativeResponse(NegativeResponseCode.INCORRECT_MESSAGE_LENGTH_OR_INVALID_FORMAT);
    }

    const accessType = request.subFunction;
    const isRequestSeed = (accessType % 2) === 1;

    if (isRequestSeed) {
      return this.handleRequestSeed(accessType, state);
    } else {
      return this.handleSendKey(accessType, request, state);
    }
  }

  private handleRequestSeed(level: number, state: DiagnosticSessionState): UDSResponse {
    // Check if already unlocked
    if (state.isSecurityUnlocked && state.securityLevel >= level) {
      // Already unlocked at this level - return zero seed
      return this.createPositiveResponse(new Uint8Array([level, 0x00, 0x00, 0x00, 0x00]));
    }

    // Return seed
    this.lastSeedTime = Date.now();
    const responseData = new Uint8Array(1 + this.securitySeed.length);
    responseData[0] = level;
    responseData.set(this.securitySeed, 1);

    return this.createPositiveResponse(responseData);
  }

  private handleSendKey(level: number, request: UDSRequest, state: DiagnosticSessionState): UDSResponse {
    // Check if seed was requested recently
    if (Date.now() - this.lastSeedTime > 5000) {
      return this.createNegativeResponse(NegativeResponseCode.REQUEST_SEQUENCE_ERROR);
    }

    // Check if too many failed attempts
    if (this.failedAttempts >= 3) {
      return this.createNegativeResponse(NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS);
    }

    // Verify key
    const providedKey = request.data;
    const keyMatch = this.verifyKey(providedKey);

    if (!keyMatch) {
      this.failedAttempts++;
      return this.createNegativeResponse(NegativeResponseCode.INVALID_KEY);
    }

    // Key is valid - unlock security
    this.failedAttempts = 0;
    state.isSecurityUnlocked = true;
    state.securityLevel = level;

    return this.createPositiveResponse(new Uint8Array([level]));
  }

  private verifyKey(providedKey: Uint8Array): boolean {
    if (providedKey.length !== this.expectedKey.length) {
      return false;
    }

    for (let i = 0; i < providedKey.length; i++) {
      if (providedKey[i] !== this.expectedKey[i]) {
        return false;
      }
    }

    return true;
  }

  private createPositiveResponse(data: Uint8Array): UDSResponse {
    return {
      serviceId: this.serviceId,
      isPositive: true,
      data,
    };
  }

  private createNegativeResponse(nrc: NegativeResponseCode): UDSResponse {
    return {
      serviceId: this.serviceId,
      isPositive: false,
      data: new Uint8Array(0),
      nrc,
    };
  }
}
