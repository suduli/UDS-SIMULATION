/**
 * Tester Present Service
 * Manages auto-sending of 0x3E (Tester Present) keep-alive packets
 * 
 * Per ISO 14229-1:
 * - Tester Present prevents session timeout (S3 timer reset)
 * - Uses sub-function 0x80 (suppress positive response) for efficiency
 * - Interval must be less than S3 timeout (typically 5000ms)
 */

import { ServiceId } from '../types/uds';
import type { UDSRequest, UDSResponse } from '../types/uds';
import type {
    TesterPresentState,
    TesterPresentInterval,
    TesterPresentStats
} from '../types/testerPresent';

type SendRequestFn = (
    request: UDSRequest,
    options?: { isAutoKeepAlive?: boolean }
) => Promise<UDSResponse>;

export class TesterPresentService {
    private state: TesterPresentState;
    private intervalHandle: number | null = null;
    private sendRequest: SendRequestFn | null = null;
    private onStateChange: ((state: TesterPresentState) => void) | null = null;

    constructor() {
        this.state = { ...this.getDefaultState() };
    }

    private getDefaultState(): TesterPresentState {
        return {
            isActive: false,
            intervalMs: 5000,
            sentCount: 0,
            successCount: 0,
            failCount: 0,
            lastSentTime: null,
            lastError: null,
            sessionStartTime: null,
        };
    }

    /**
     * Initialize the service with send function and state change callback
     */
    initialize(
        sendRequest: SendRequestFn,
        onStateChange: (state: TesterPresentState) => void
    ): void {
        this.sendRequest = sendRequest;
        this.onStateChange = onStateChange;
    }

    /**
     * Start auto-sending Tester Present packets
     */
    start(intervalMs?: TesterPresentInterval): void {
        if (this.intervalHandle !== null) {
            this.stop();
        }

        if (!this.sendRequest) {
            console.error('[TesterPresentService] Cannot start: sendRequest not initialized');
            return;
        }

        const interval = intervalMs ?? this.state.intervalMs;

        this.state = {
            ...this.state,
            isActive: true,
            intervalMs: interval,
            sessionStartTime: Date.now(),
            lastError: null,
        };
        this.notifyStateChange();

        console.log(`[TesterPresentService] 💓 Started keep-alive at ${interval}ms interval`);

        // Send first packet immediately
        this.sendKeepAlivePacket();

        // Then start interval
        this.intervalHandle = window.setInterval(() => {
            this.sendKeepAlivePacket();
        }, interval);
    }

    /**
     * Stop auto-sending Tester Present packets
     */
    stop(): void {
        if (this.intervalHandle !== null) {
            window.clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }

        this.state = {
            ...this.state,
            isActive: false,
            sessionStartTime: null,
        };
        this.notifyStateChange();

        console.log('[TesterPresentService] 💔 Stopped keep-alive');
    }

    /**
     * Change the keep-alive interval
     */
    setInterval(intervalMs: TesterPresentInterval): void {
        this.state.intervalMs = intervalMs;

        // If currently active, restart with new interval
        if (this.state.isActive) {
            this.stop();
            this.start(intervalMs);
        } else {
            this.notifyStateChange();
        }
    }

    /**
     * Get current state
     */
    getState(): TesterPresentState {
        return { ...this.state };
    }

    /**
     * Get statistics summary
     */
    getStats(): TesterPresentStats {
        const uptime = this.state.sessionStartTime
            ? Date.now() - this.state.sessionStartTime
            : null;

        const successRate = this.state.sentCount > 0
            ? Math.round((this.state.successCount / this.state.sentCount) * 100)
            : 0;

        return {
            sentCount: this.state.sentCount,
            successCount: this.state.successCount,
            failCount: this.state.failCount,
            successRate,
            lastSentTime: this.state.lastSentTime,
            lastError: this.state.lastError,
            uptime,
        };
    }

    /**
     * Reset counters (but keep running if active)
     */
    resetCounters(): void {
        this.state = {
            ...this.state,
            sentCount: 0,
            successCount: 0,
            failCount: 0,
            lastError: null,
        };
        this.notifyStateChange();
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.stop();
        this.sendRequest = null;
        this.onStateChange = null;
    }

    /**
     * Send a single keep-alive packet
     */
    private async sendKeepAlivePacket(): Promise<void> {
        if (!this.sendRequest) {
            return;
        }

        const request: UDSRequest = {
            sid: ServiceId.TESTER_PRESENT, // 0x3E
            subFunction: 0x80, // Suppress positive response
            data: [],
            timestamp: Date.now(),
        };

        try {
            this.state.sentCount++;
            this.state.lastSentTime = Date.now();

            const response = await this.sendRequest(request, { isAutoKeepAlive: true });

            if (response.isNegative) {
                this.state.failCount++;
                const nrcHex = response.nrc
                    ? `0x${response.nrc.toString(16).toUpperCase().padStart(2, '0')}`
                    : 'Unknown';
                this.state.lastError = `NRC ${nrcHex}`;
                console.warn(`[TesterPresentService] ⚠️ Keep-alive failed: ${this.state.lastError}`);
            } else {
                this.state.successCount++;
                this.state.lastError = null;
            }
        } catch (error) {
            this.state.failCount++;
            this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error('[TesterPresentService] ❌ Keep-alive error:', this.state.lastError);
        }

        this.notifyStateChange();
    }

    private notifyStateChange(): void {
        if (this.onStateChange) {
            this.onStateChange({ ...this.state });
        }
    }
}

// Singleton instance
export const testerPresentService = new TesterPresentService();
