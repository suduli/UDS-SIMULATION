/**
 * Tester Present (0x3E) Types
 * Type definitions for the Tester Present keep-alive system
 */

import type { UDSRequest, UDSResponse } from './uds';

/**
 * State of the Tester Present keep-alive system
 */
export interface TesterPresentState {
    /** Whether keep-alive is currently active */
    isActive: boolean;
    /** Interval between keep-alive packets in milliseconds */
    intervalMs: TesterPresentInterval;
    /** Total packets sent since activation */
    sentCount: number;
    /** Successful responses received */
    successCount: number;
    /** Failed responses (NRC or timeout) */
    failCount: number;
    /** Timestamp of last sent packet (null if never sent) */
    lastSentTime: number | null;
    /** Last error message (null if no error) */
    lastError: string | null;
    /** Session start timestamp for this TP session */
    sessionStartTime: number | null;
}

/**
 * Supported keep-alive intervals (in milliseconds)
 * Per ISO 14229-1, S3 timeout is typically 5000ms, so intervals must be less
 */
export type TesterPresentInterval = 3000 | 5000 | 10000;

/**
 * Extended request history item with auto-keep-alive flag
 */
export interface TesterPresentHistoryItem {
    request: UDSRequest;
    response: UDSResponse;
    /** True if this was an auto-generated keep-alive packet */
    isAutoKeepAlive: boolean;
    timestamp: number;
}

/**
 * Options for sending requests with keep-alive metadata
 */
export interface SendRequestOptions {
    /** Mark this request as an auto-generated keep-alive */
    isAutoKeepAlive?: boolean;
}

/**
 * Statistics for Tester Present activity
 */
export interface TesterPresentStats {
    sentCount: number;
    successCount: number;
    failCount: number;
    successRate: number;
    lastSentTime: number | null;
    lastError: string | null;
    uptime: number | null; // milliseconds since activation
}

/**
 * Initial/default state for Tester Present
 */
export const DEFAULT_TESTER_PRESENT_STATE: TesterPresentState = {
    isActive: false,
    intervalMs: 5000, // 5 seconds - safe margin under S3 timeout
    sentCount: 0,
    successCount: 0,
    failCount: 0,
    lastSentTime: null,
    lastError: null,
    sessionStartTime: null,
};
