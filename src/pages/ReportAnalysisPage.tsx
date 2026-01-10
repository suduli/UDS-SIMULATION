/**
 * Report Analysis Page
 * Analyze and visualize UDS test session reports
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import EnhancedBackground from '../components/EnhancedBackground';
import { ReportSummaryCards } from '../components/ReportSummaryCards';
import { NRCAnalysisChart } from '../components/NRCAnalysisChart';
import { ResponseTimeline } from '../components/ResponseTimeline';
import { TestLogTable } from '../components/TestLogTable';
import { reportAnalyzer } from '../services/ReportAnalyzer';
import { htmlReportExporter } from '../services/HTMLReportExporter';
import { csvExporter } from '../services/CSVExporter';
import type { TestReport, TestAnalysisResult } from '../types/uds';
import Footer from '../components/Footer';

export const ReportAnalysisPage: React.FC = () => {
    const location = useLocation();
    const [report, setReport] = useState<TestReport | null>(null);
    const [analysis, setAnalysis] = useState<TestAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    /**
     * Auto-load report from navigation state or sessionStorage
     */
    useEffect(() => {
        // First, check if report was passed via navigation state
        const stateReport = (location.state as { reportData?: TestReport })?.reportData;
        if (stateReport) {
            try {
                setReport(stateReport);
                const analysisResult = reportAnalyzer.analyzeReport(stateReport);
                setAnalysis(analysisResult);
                // Clear sessionStorage after loading
                sessionStorage.removeItem('currentReport');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load report from navigation');
            }
            return;
        }

        // Second, check sessionStorage for report
        const storedReport = sessionStorage.getItem('currentReport');
        if (storedReport) {
            try {
                const reportData = JSON.parse(storedReport) as TestReport;
                setReport(reportData);
                const analysisResult = reportAnalyzer.analyzeReport(reportData);
                setAnalysis(analysisResult);
                // Clear sessionStorage after loading
                sessionStorage.removeItem('currentReport');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load report from sessionStorage');
            }
        }
    }, [location.state]);


    /**
     * Handle file upload
     */
    const handleFileUpload = useCallback((file: File) => {
        setIsLoading(true);
        setError(null);

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);

                // Validate JSON structure
                if (!json.requests || !json.responses || !json.metadata) {
                    throw new Error('Invalid report format. Missing required fields.');
                }

                setReport(json as TestReport);
                const analysisResult = reportAnalyzer.analyzeReport(json as TestReport);
                setAnalysis(analysisResult);
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            setError('Failed to read file');
            setIsLoading(false);
        };

        reader.readAsText(file);
    }, []);

    /**
     * Handle file drop
     */
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    handleFileUpload(file);
                } else {
                    setError('Please upload a JSON file');
                }
            }
        },
        [handleFileUpload]
    );

    /**
     * Handle file input change
     */
    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileUpload(files[0]);
            }
        },
        [handleFileUpload]
    );

    /**
     * Export to HTML
     */
    const handleExportHTML = useCallback(() => {
        if (!report || !analysis) return;

        const html = htmlReportExporter.exportToHTML(report, analysis);
        const filename = `${report.id}_analysis_${Date.now()}.html`;
        htmlReportExporter.downloadHTML(html, filename);
    }, [report, analysis]);

    /**
     * Export to CSV
     */
    const handleExportCSV = useCallback(() => {
        if (!report || !analysis) return;
        csvExporter.exportCompleteToCSV(report, analysis);
    }, [report, analysis]);

    /**
     * Reset/clear current report
     */
    const handleClear = useCallback(() => {
        setReport(null);
        setAnalysis(null);
        setError(null);
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                {/* Skip to main content */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyber-blue focus:text-dark-900 focus:rounded-lg focus:font-bold"
                >
                    Skip to main content
                </a>

                <Header />

                <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
                    {/* Page Title */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold gradient-text mb-2">Test Report Analysis</h1>
                        <p className="text-gray-400">
                            Upload and analyze UDS test session exports with detailed visualizations
                        </p>
                    </div>

                    {/* File Upload Section */}
                    {!report && (
                        <div className="max-w-3xl mx-auto">
                            <div
                                className={`glass-card p-12 text-center transition-all duration-300 ${dragOver ? 'border-cyber-blue bg-cyber-blue/10 scale-105' : ''
                                    }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                <div className="text-6xl mb-6">📊</div>
                                <h2 className="text-2xl font-bold text-cyber-blue mb-4">Upload Test Report</h2>
                                <p className="text-gray-400 mb-6">
                                    Drag and drop a JSON test report file here, or click to browse
                                </p>

                                <label className="inline-block">
                                    <input
                                        type="file"
                                        accept=".json,application/json"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                    <span className="cursor-pointer px-8 py-3 bg-gradient-to-r from-cyber-blue to-cyber-pink text-white rounded-lg font-bold hover:scale-105 transition-transform duration-200 inline-block">
                                        {isLoading ? 'Loading...' : 'Select File'}
                                    </span>
                                </label>

                                {error && (
                                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-dark-600">
                                    <p className="text-sm text-gray-500 mb-2">Supported formats:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>• UDS Session Export (JSON)</li>
                                        <li>• Test Case Reports (SID*_TestCases_report.json)</li>
                                        <li>• Custom UDS Test Logs</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analysis Results */}
                    {report && analysis && (
                        <div className="space-y-6">
                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 sm:gap-3">
                                <button
                                    onClick={handleExportHTML}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyber-blue to-purple-500 text-white rounded-lg font-bold hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <span>📥</span>
                                    Export as HTML
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <span>📊</span>
                                    Export as CSV
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-dark-800 border border-dark-600 text-gray-300 rounded-lg font-bold hover:bg-dark-700 hover:border-cyber-blue transition-all duration-200 text-sm sm:text-base"
                                >
                                    Load Different Report
                                </button>
                            </div>

                            {/* Summary Cards */}
                            <ReportSummaryCards analysis={analysis} reportName={report.name} />

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* NRC Analysis */}
                                <NRCAnalysisChart analysis={analysis} />

                                {/* Timeline */}
                                <ResponseTimeline analysis={analysis} />
                            </div>

                            {/* Detailed Log Table */}
                            <TestLogTable analysis={analysis} report={report} />
                        </div>
                    )}
                </main>

                {/* Footer Section */}
                <Footer />
            </div>
        </div>
    );
};
