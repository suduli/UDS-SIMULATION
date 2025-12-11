/**
 * Report Analyzer Service
 * Analyzes UDS test reports and extracts statistics
 */

import type {
    TestReport,
    TestAnalysisResult,
    NRCDescription,
} from '../types/uds';

/**
 * NRC (Negative Response Code) descriptions
 * Based on ISO 14229-1:2020
 */
const NRC_DESCRIPTIONS: Record<number, NRCDescription> = {
    0x10: {
        code: 0x10,
        name: 'General Reject',
        description: 'General rejection - service not supported or malformed request',
        severity: 'error',
    },
    0x11: {
        code: 0x11,
        name: 'Service Not Supported',
        description: 'The requested service is not supported by the server',
        severity: 'error',
    },
    0x12: {
        code: 0x12,
        name: 'Sub-Function Not Supported',
        description: 'The requested sub-function is not supported',
        severity: 'error',
    },
    0x13: {
        code: 0x13,
        name: 'Incorrect Message Length',
        description: 'The length of the message is incorrect',
        severity: 'error',
    },
    0x14: {
        code: 0x14,
        name: 'Response Too Long',
        description: 'The response would exceed the maximum allowed size',
        severity: 'warning',
    },
    0x21: {
        code: 0x21,
        name: 'Busy Repeat Request',
        description: 'Server is busy, client should repeat the request',
        severity: 'info',
    },
    0x22: {
        code: 0x22,
        name: 'Conditions Not Correct',
        description: 'The conditions are not correct to perform the request',
        severity: 'warning',
    },
    0x24: {
        code: 0x24,
        name: 'Request Sequence Error',
        description: 'The request is out of sequence',
        severity: 'error',
    },
    0x31: {
        code: 0x31,
        name: 'Request Out of Range',
        description: 'The request parameter is out of range',
        severity: 'error',
    },
    0x33: {
        code: 0x33,
        name: 'Security Access Denied',
        description: 'Security access is required but not granted',
        severity: 'critical',
    },
    0x35: {
        code: 0x35,
        name: 'Invalid Key',
        description: 'The security key sent by the client is invalid',
        severity: 'critical',
    },
    0x36: {
        code: 0x36,
        name: 'Exceed Number of Attempts',
        description: 'Security access attempts exceeded',
        severity: 'critical',
    },
    0x37: {
        code: 0x37,
        name: 'Required Time Delay Not Expired',
        description: 'Required delay period has not expired',
        severity: 'warning',
    },
    0x70: {
        code: 0x70,
        name: 'Upload/Download Not Accepted',
        description: 'Upload or download operation not accepted',
        severity: 'error',
    },
    0x71: {
        code: 0x71,
        name: 'Transfer Data Suspended',
        description: 'Data transfer operation has been suspended',
        severity: 'warning',
    },
    0x72: {
        code: 0x72,
        name: 'General Programming Failure',
        description: 'General programming failure occurred',
        severity: 'critical',
    },
    0x73: {
        code: 0x73,
        name: 'Wrong Block Sequence Counter',
        description: 'Block sequence counter is incorrect',
        severity: 'error',
    },
    0x78: {
        code: 0x78,
        name: 'Request Correctly Received - Response Pending',
        description: 'Request received but response is pending',
        severity: 'info',
    },
    0x7E: {
        code: 0x7E,
        name: 'Sub-Function Not Supported In Active Session',
        description: 'Sub-function not supported in the current session',
        severity: 'warning',
    },
    0x7F: {
        code: 0x7F,
        name: 'Service Not Supported In Active Session',
        description: 'Service not supported in the current session',
        severity: 'warning',
    },
};

/**
 * Report Analyzer Class
 */
export class ReportAnalyzer {
    /**
     * Analyze a test report and extract comprehensive statistics
     */
    analyzeReport(report: TestReport): TestAnalysisResult {
        const { requests, responses } = report;

        // Calculate summary statistics
        const totalRequests = requests.length;
        const totalResponses = responses.length;
        const successCount = responses.filter((r) => !r.isNegative).length;
        const nrcCount = responses.filter((r) => r.isNegative).length;
        const successRate = totalResponses > 0 ? (successCount / totalResponses) * 100 : 0;

        // Calculate duration
        const timestamps = [...requests.map((r) => r.timestamp), ...responses.map((r) => r.timestamp)];
        const startTime = Math.min(...timestamps);
        const endTime = Math.max(...timestamps);
        const duration = endTime - startTime;

        // Build NRC breakdown
        const nrcBreakdown = new Map<number, { count: number; description: string; percentage: number }>();
        responses
            .filter((r) => r.isNegative && r.nrc !== undefined)
            .forEach((r) => {
                const nrc = r.nrc!;
                const existing = nrcBreakdown.get(nrc);
                if (existing) {
                    existing.count++;
                } else {
                    const nrcInfo = NRC_DESCRIPTIONS[nrc] || {
                        code: nrc,
                        name: `Unknown NRC (0x${nrc.toString(16).toUpperCase().padStart(2, '0')})`,
                        description: 'Unknown or custom negative response code',
                        severity: 'error' as const,
                    };
                    nrcBreakdown.set(nrc, {
                        count: 1,
                        description: nrcInfo.name,
                        percentage: 0, // Will calculate after loop
                    });
                }
            });

        // Calculate percentages
        nrcBreakdown.forEach((value) => {
            value.percentage = nrcCount > 0 ? (value.count / nrcCount) * 100 : 0;
        });

        // Build timeline
        const timeline = requests.map((request, index) => {
            const response = responses[index];
            return {
                timestamp: request.timestamp,
                isSuccess: response ? !response.isNegative : false,
                nrc: response?.nrc,
                description: request.description,
                requestIndex: index,
            };
        });

        // Build request-response pairs
        const requestResponsePairs = requests.map((request, index) => {
            const response = responses[index];
            const duration = response ? response.timestamp - request.timestamp : 0;
            const status: 'success' | 'nrc' | 'timeout' = !response
                ? 'timeout'
                : response.isNegative
                    ? 'nrc'
                    : 'success';

            return {
                request,
                response: response || {
                    sid: request.sid,
                    data: [],
                    timestamp: request.timestamp,
                    isNegative: true,
                    nrc: 0x78, // Response pending
                },
                duration,
                status,
            };
        });

        return {
            summary: {
                totalRequests,
                totalResponses,
                successCount,
                nrcCount,
                successRate: Math.round(successRate * 100) / 100,
                duration,
                startTime,
                endTime,
            },
            nrcBreakdown,
            timeline,
            requestResponsePairs,
        };
    }

    /**
     * Get NRC description by code
     */
    getNRCDescription(code: number): NRCDescription {
        return (
            NRC_DESCRIPTIONS[code] || {
                code,
                name: `Unknown NRC (0x${code.toString(16).toUpperCase().padStart(2, '0')})`,
                description: 'Unknown or custom negative response code',
                severity: 'error',
            }
        );
    }

    /**
     * Get all NRC descriptions
     */
    getAllNRCDescriptions(): NRCDescription[] {
        return Object.values(NRC_DESCRIPTIONS);
    }

    /**
     * Format duration in human-readable format
     */
    formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(2)}s`;
        } else if (ms < 3600000) {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        } else {
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            return `${hours}h ${minutes}m`;
        }
    }

    /**
     * Format timestamp to readable date/time
     */
    formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Convert SID to service name
     */
    getSIDName(sid: number): string {
        const sidNames: Record<number, string> = {
            0x10: 'Diagnostic Session Control',
            0x11: 'ECU Reset',
            0x14: 'Clear Diagnostic Information',
            0x19: 'Read DTC Information',
            0x22: 'Read Data By Identifier',
            0x23: 'Read Memory By Address',
            0x27: 'Security Access',
            0x28: 'Communication Control',
            0x2a: 'Read Data By Periodic Identifier',
            0x2e: 'Write Data By Identifier',
            0x31: 'Routine Control',
            0x34: 'Request Download',
            0x35: 'Request Upload',
            0x36: 'Transfer Data',
            0x37: 'Request Transfer Exit',
            0x3d: 'Write Memory By Address',
        };

        return sidNames[sid] || `Service 0x${sid.toString(16).toUpperCase().padStart(2, '0')}`;
    }
}

// Export singleton instance
export const reportAnalyzer = new ReportAnalyzer();
