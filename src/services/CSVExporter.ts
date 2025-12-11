/**
 * CSV Exporter Service
 * Exports UDS test reports and analysis results to CSV format
 */

import type { TestReport, TestAnalysisResult } from '../types/uds';
import { reportAnalyzer } from './ReportAnalyzer';

/**
 * CSV Exporter Class
 */
export class CSVExporter {
    /**
     * Convert array of values to CSV row
     */
    private toCSVRow(values: (string | number | undefined)[]): string {
        return values
            .map((value) => {
                if (value === undefined || value === null) {
                    return '';
                }
                const str = String(value);
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            })
            .join(',');
    }

    /**
     * Format timestamp to readable date/time
     */
    private formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Convert hex array to string
     */
    private hexArrayToString(data: number[]): string {
        return data.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    }

    /**
     * Get NRC name from code
     */
    private getNRCName(code: number): string {
        const nrcInfo = reportAnalyzer.getNRCDescription(code);
        return nrcInfo.name;
    }

    /**
     * Export test log to CSV format
     * This is the detailed request/response pairs
     */
    exportTestLog(analysis: TestAnalysisResult): string {
        const rows: string[] = [];

        // Headers
        rows.push(
            this.toCSVRow([
                'Index',
                'Timestamp',
                'Request SID',
                'Request SubFunction',
                'Request Data',
                'Request Description',
                'Response SID',
                'Response Data',
                'Response Status',
                'NRC Code',
                'NRC Description',
                'Duration (ms)',
            ])
        );

        // Data rows
        analysis.requestResponsePairs.forEach((pair, index) => {
            const request = pair.request;
            const response = pair.response;
            const status = pair.status === 'success' ? 'Success' : pair.status === 'nrc' ? 'NRC' : 'Timeout';

            rows.push(
                this.toCSVRow([
                    index + 1,
                    this.formatTimestamp(request.timestamp),
                    `0x${request.sid.toString(16).toUpperCase().padStart(2, '0')}`,
                    request.subFunction !== undefined
                        ? `0x${request.subFunction.toString(16).toUpperCase().padStart(2, '0')}`
                        : '',
                    this.hexArrayToString(request.data),
                    request.description,
                    `0x${response.sid.toString(16).toUpperCase().padStart(2, '0')}`,
                    this.hexArrayToString(response.data),
                    status,
                    response.isNegative && response.nrc !== undefined
                        ? `0x${response.nrc.toString(16).toUpperCase().padStart(2, '0')}`
                        : '',
                    response.isNegative && response.nrc !== undefined ? this.getNRCName(response.nrc) : '',
                    pair.duration.toFixed(2),
                ])
            );
        });

        return rows.join('\n');
    }

    /**
     * Export summary statistics to CSV format
     */
    exportSummary(report: TestReport, analysis: TestAnalysisResult): string {
        const rows: string[] = [];

        // Report Information
        rows.push(this.toCSVRow(['Report Information']));
        rows.push(this.toCSVRow(['Report ID', report.id]));
        rows.push(this.toCSVRow(['Report Name', report.name]));
        rows.push(this.toCSVRow(['Description', report.description]));
        rows.push(this.toCSVRow(['Version', report.version]));
        rows.push(this.toCSVRow(['Author', report.metadata.author]));
        rows.push(this.toCSVRow(['Tags', report.metadata.tags.join(', ')]));
        rows.push(this.toCSVRow([])); // Empty row

        // Summary Statistics
        rows.push(this.toCSVRow(['Summary Statistics']));
        rows.push(this.toCSVRow(['Total Requests', analysis.summary.totalRequests]));
        rows.push(this.toCSVRow(['Total Responses', analysis.summary.totalResponses]));
        rows.push(this.toCSVRow(['Successful Responses', analysis.summary.successCount]));
        rows.push(this.toCSVRow(['Negative Responses (NRC)', analysis.summary.nrcCount]));
        rows.push(this.toCSVRow(['Success Rate (%)', analysis.summary.successRate.toFixed(2)]));
        rows.push(this.toCSVRow(['Test Duration', reportAnalyzer.formatDuration(analysis.summary.duration)]));
        rows.push(this.toCSVRow(['Start Time', this.formatTimestamp(analysis.summary.startTime)]));
        rows.push(this.toCSVRow(['End Time', this.formatTimestamp(analysis.summary.endTime)]));
        rows.push(this.toCSVRow([])); // Empty row

        // NRC Breakdown
        if (analysis.nrcBreakdown.size > 0) {
            rows.push(this.toCSVRow(['NRC Breakdown']));
            rows.push(this.toCSVRow(['NRC Code', 'Description', 'Count', 'Percentage (%)']));

            analysis.nrcBreakdown.forEach((value, code) => {
                rows.push(
                    this.toCSVRow([
                        `0x${code.toString(16).toUpperCase().padStart(2, '0')}`,
                        value.description,
                        value.count,
                        value.percentage.toFixed(2),
                    ])
                );
            });
        }

        return rows.join('\n');
    }

    /**
     * Export complete report with all data
     */
    exportComplete(report: TestReport, analysis: TestAnalysisResult): string {
        const sections: string[] = [];

        // Summary section
        sections.push(this.exportSummary(report, analysis));
        sections.push(''); // Empty line
        sections.push(''); // Empty line

        // Test log section
        sections.push('Test Log (Detailed Request/Response Data)');
        sections.push(this.exportTestLog(analysis));

        return sections.join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(csvContent: string, filename: string): void {
        // Add BOM for proper Excel UTF-8 support
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object
        URL.revokeObjectURL(url);
    }

    /**
     * Export and download test log as CSV
     */
    exportTestLogToCSV(report: TestReport, analysis: TestAnalysisResult): void {
        const csv = this.exportTestLog(analysis);
        const filename = `${report.id}_test_log_${Date.now()}.csv`;
        this.downloadCSV(csv, filename);
    }

    /**
     * Export and download summary as CSV
     */
    exportSummaryToCSV(report: TestReport, analysis: TestAnalysisResult): void {
        const csv = this.exportSummary(report, analysis);
        const filename = `${report.id}_summary_${Date.now()}.csv`;
        this.downloadCSV(csv, filename);
    }

    /**
     * Export and download complete report as CSV
     */
    exportCompleteToCSV(report: TestReport, analysis: TestAnalysisResult): void {
        const csv = this.exportComplete(report, analysis);
        const filename = `${report.id}_complete_report_${Date.now()}.csv`;
        this.downloadCSV(csv, filename);
    }
}

// Export singleton instance
export const csvExporter = new CSVExporter();
