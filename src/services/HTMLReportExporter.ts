/**
 * HTML Report Exporter Service
 * Generates standalone HTML files for test reports
 */

import type { TestReport, TestAnalysisResult } from '../types/uds';
import { reportAnalyzer } from './ReportAnalyzer';

/**
 * HTML Report Exporter Class
 */
export class HTMLReportExporter {
    /**
     * Export analysis as standalone HTML file
     */
    exportToHTML(report: TestReport, analysis: TestAnalysisResult): string {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(report.name)} - UDS Test Report</title>
    <style>
        ${this.getEmbeddedCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${this.escapeHtml(report.name)}</h1>
            <p class="subtitle">${this.escapeHtml(report.description)}</p>
            <div class="metadata">
                <span>Report ID: ${this.escapeHtml(report.id)}</span>
                <span>Version: ${this.escapeHtml(report.version)}</span>
                <span>Generated: ${new Date().toLocaleString()}</span>
            </div>
        </header>

        ${this.generateSummarySection(analysis)}
        ${this.generateNRCAnalysisSection(analysis)}
        ${this.generateTimelineSection(analysis)}
        ${this.generateDetailedLogSection(analysis)}
    </div>

    <script>
        ${this.getEmbeddedJS()}
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * Generate summary statistics section
     */
    private generateSummarySection(analysis: TestAnalysisResult): string {
        const { summary } = analysis;
        return `
        <section class="summary-section">
            <h2>Test Summary</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${summary.totalRequests}</div>
                    <div class="stat-label">Total Requests</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value">${summary.successCount}</div>
                    <div class="stat-label">Successful</div>
                </div>
                <div class="stat-card error">
                    <div class="stat-value">${summary.nrcCount}</div>
                    <div class="stat-label">NRC Errors</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summary.successRate.toFixed(1)}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportAnalyzer.formatDuration(summary.duration)}</div>
                    <div class="stat-label">Duration</div>
                </div>
            </div>
        </section>`;
    }

    /**
     * Generate NRC analysis section
     */
    private generateNRCAnalysisSection(analysis: TestAnalysisResult): string {
        const nrcRows = Array.from(analysis.nrcBreakdown.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .map(([code, info]) => {
                const nrcDesc = reportAnalyzer.getNRCDescription(code);
                return `
                <tr>
                    <td><code>0x${code.toString(16).toUpperCase().padStart(2, '0')}</code></td>
                    <td>${this.escapeHtml(info.description)}</td>
                    <td>${info.count}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${info.percentage}%"></div>
                        </div>
                        <span class="percentage">${info.percentage.toFixed(1)}%</span>
                    </td>
                    <td><span class="severity ${nrcDesc.severity}">${nrcDesc.severity}</span></td>
                </tr>`;
            })
            .join('');

        return `
        <section class="nrc-section">
            <h2>NRC Analysis</h2>
            ${analysis.nrcBreakdown.size > 0
                ? `<table class="data-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${nrcRows}
                    </tbody>
                </table>`
                : '<p class="no-data">No NRC errors encountered in this test session.</p>'
            }
        </section>`;
    }

    /**
     * Generate timeline visualization section
     */
    private generateTimelineSection(analysis: TestAnalysisResult): string {
        const timelineItems = analysis.timeline
            .slice(0, 50) // Limit to first 50 for performance
            .map((item) => {
                const statusClass = item.isSuccess ? 'success' : 'error';
                const nrcText = item.nrc ? ` (NRC: 0x${item.nrc.toString(16).toUpperCase().padStart(2, '0')})` : '';
                return `
                <div class="timeline-item ${statusClass}" title="${this.escapeHtml(item.description)}${nrcText}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-description">${this.escapeHtml(item.description)}</div>
                        <div class="timeline-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div class="timeline-status">${item.isSuccess ? '✓' : '✗'}</div>
                </div>`;
            })
            .join('');

        return `
        <section class="timeline-section">
            <h2>Test Timeline</h2>
            <div class="timeline-container">
                ${timelineItems}
            </div>
            ${analysis.timeline.length > 50 ? '<p class="note">Showing first 50 items. See detailed log for complete timeline.</p>' : ''}
        </section>`;
    }

    /**
     * Generate detailed log section
     */
    private generateDetailedLogSection(analysis: TestAnalysisResult): string {
        const logRows = analysis.requestResponsePairs
            .map((pair, index) => {
                const statusClass = pair.status === 'success' ? 'success' : 'error';
                const statusText =
                    pair.status === 'success'
                        ? 'Success'
                        : pair.response.nrc
                            ? `NRC 0x${pair.response.nrc.toString(16).toUpperCase().padStart(2, '0')}`
                            : 'No Response';

                const requestData = pair.request.data.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                const responseData = pair.response.data.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

                return `
                <tr class="${statusClass}">
                    <td>${index + 1}</td>
                    <td>${new Date(pair.request.timestamp).toLocaleTimeString()}</td>
                    <td><code>0x${pair.request.sid.toString(16).toUpperCase().padStart(2, '0')}</code></td>
                    <td>${pair.request.subFunction !== undefined ? `0x${pair.request.subFunction.toString(16).toUpperCase().padStart(2, '0')}` : '-'}</td>
                    <td class="description">${this.escapeHtml(pair.request.description)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><code>${requestData || '-'}</code></td>
                    <td><code>${responseData || '-'}</code></td>
                    <td>${pair.duration}ms</td>
                </tr>`;
            })
            .join('');

        return `
        <section class="log-section">
            <h2>Detailed Test Log</h2>
            <div class="table-controls">
                <input type="text" id="filterInput" placeholder="Filter by description..." />
                <select id="statusFilter">
                    <option value="all">All Status</option>
                    <option value="success">Success Only</option>
                    <option value="error">NRC Only</option>
                </select>
            </div>
            <div class="table-wrapper">
                <table class="data-table" id="logTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Time</th>
                            <th>SID</th>
                            <th>Sub-Func</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Request Data</th>
                            <th>Response Data</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logRows}
                    </tbody>
                </table>
            </div>
        </section>`;
    }

    /**
     * Get embedded CSS styles
     */
    private getEmbeddedCSS(): string {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
            line-height: 1.6;
            padding: 2rem;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        header { margin-bottom: 3rem; text-align: center; }
        h1 { font-size: 2.5rem; color: #00f3ff; margin-bottom: 0.5rem; }
        .subtitle { font-size: 1.1rem; color: #94a3b8; margin-bottom: 1rem; }
        .metadata { display: flex; gap: 2rem; justify-content: center; font-size: 0.9rem; color: #64748b; }
        
        h2 { font-size: 1.8rem; color: #00f3ff; margin-bottom: 1.5rem; }
        
        section { 
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(0, 243, 255, 0.2);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .stat-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }
        .stat-card {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
        }
        .stat-card.success { border-color: rgba(16, 185, 129, 0.5); }
        .stat-card.error { border-color: rgba(239, 68, 68, 0.5); }
        .stat-value { 
            font-size: 2.5rem;
            font-weight: bold;
            color: #00f3ff;
            margin-bottom: 0.5rem;
        }
        .stat-card.success .stat-value { color: #10b981; }
        .stat-card.error .stat-value { color: #ef4444; }
        .stat-label { color: #94a3b8; font-size: 0.9rem; }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(15, 23, 42, 0.5);
        }
        .data-table th {
            background: rgba(0, 243, 255, 0.1);
            padding: 1rem;
            text-align: left;
            border-bottom: 2px solid rgba(0, 243, 255, 0.3);
            color: #00f3ff;
        }
        .data-table td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }
        .data-table tr:hover { background: rgba(0, 243, 255, 0.05); }
        .data-table tr.success { border-left: 3px solid #10b981; }
        .data-table tr.error { border-left: 3px solid #ef4444; }
        
        code { 
            background: rgba(0, 0, 0, 0.3);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #00f3ff;
        }
        
        .progress-bar {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
            display: inline-block;
            width: 100px;
            vertical-align: middle;
            margin-right: 0.5rem;
        }
        .progress-fill {
            background: linear-gradient(90deg, #ef4444, #f97316);
            height: 100%;
            transition: width 0.3s ease;
        }
        .percentage { font-size: 0.9rem; color: #94a3b8; }
        
        .severity {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .severity.info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .severity.warning { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .severity.error { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .severity.critical { background: rgba(220, 38, 38, 0.2); color: #dc2626; }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .status-badge.success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .status-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        .timeline-container {
            max-height: 600px;
            overflow-y: auto;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            margin-bottom: 0.5rem;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            border-left: 3px solid #64748b;
        }
        .timeline-item.success { border-left-color: #10b981; }
        .timeline-item.error { border-left-color: #ef4444; }
        .timeline-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #64748b;
            flex-shrink: 0;
        }
        .timeline-item.success .timeline-dot { background: #10b981; }
        .timeline-item.error .timeline-dot { background: #ef4444; }
        .timeline-content { flex: 1; }
        .timeline-description { color: #e2e8f0; margin-bottom: 0.25rem; }
        .timeline-time { font-size: 0.85rem; color: #64748b; }
        .timeline-status {
            font-size: 1.5rem;
            font-weight: bold;
            flex-shrink: 0;
        }
        .timeline-item.success .timeline-status { color: #10b981; }
        .timeline-item.error .timeline-status { color: #ef4444; }
        
        .table-controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .table-controls input,
        .table-controls select {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 6px;
            padding: 0.5rem 1rem;
            color: #e2e8f0;
            font-size: 0.95rem;
        }
        .table-controls input { flex: 1; }
        .table-controls input:focus,
        .table-controls select:focus {
            outline: 2px solid #00f3ff;
            border-color: #00f3ff;
        }
        
        .table-wrapper { overflow-x: auto; }
        .description { max-width: 400px; }
        .no-data { text-align: center; color: #64748b; padding: 2rem; }
        .note { color: #64748b; font-size: 0.9rem; margin-top: 1rem; text-align: center; }
        
        @media print {
            body { background: white; color: black; }
            section { border: 1px solid #ccc; background: white; }
        }
    `;
    }

    /**
     * Get embedded JavaScript
     */
    private getEmbeddedJS(): string {
        return `
        // Filter functionality
        const filterInput = document.getElementById('filterInput');
        const statusFilter = document.getElementById('statusFilter');
        const logTable = document.getElementById('logTable');
        
        function filterTable() {
            const filterText = filterInput.value.toLowerCase();
            const statusValue = statusFilter.value;
            const rows = logTable.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const description = row.querySelector('.description').textContent.toLowerCase();
                const matchesText = description.includes(filterText);
                const matchesStatus = statusValue === 'all' || row.classList.contains(statusValue);
                
                row.style.display = (matchesText && matchesStatus) ? '' : 'none';
            });
        }
        
        if (filterInput && statusFilter) {
            filterInput.addEventListener('input', filterTable);
            statusFilter.addEventListener('change', filterTable);
        }
    `;
    }

    /**
     * Escape HTML special characters
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Download HTML file
     */
    downloadHTML(html: string, filename: string): void {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export singleton instance
export const htmlReportExporter = new HTMLReportExporter();
