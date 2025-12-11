/**
 * Test Log Table Component
 * Detailed, filterable table of all test requests and responses
 */

import React, { useState, useMemo } from 'react';
import type { TestAnalysisResult, TestReport } from '../types/uds';
import { reportAnalyzer } from '../services/ReportAnalyzer';
import { csvExporter } from '../services/CSVExporter';

interface TestLogTableProps {
    analysis: TestAnalysisResult;
    report: TestReport;
}

export const TestLogTable: React.FC<TestLogTableProps> = ({ analysis, report }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'nrc'>('all');
    const [sortColumn, setSortColumn] = useState<'index' | 'time' | 'duration'>('index');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Filter and sort data
    const filteredData = useMemo(() => {
        let filtered = analysis.requestResponsePairs.filter((pair) => {
            // Status filter
            if (statusFilter === 'success' && pair.status !== 'success') return false;
            if (statusFilter === 'nrc' && pair.status === 'success') return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const description = String(pair.request.description || '');
                return description.toLowerCase().includes(query);
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal: number, bVal: number;

            switch (sortColumn) {
                case 'time':
                    aVal = a.request.timestamp;
                    bVal = b.request.timestamp;
                    break;
                case 'duration':
                    aVal = a.duration;
                    bVal = b.duration;
                    break;
                case 'index':
                default:
                    aVal = analysis.requestResponsePairs.indexOf(a);
                    bVal = analysis.requestResponsePairs.indexOf(b);
                    break;
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [analysis.requestResponsePairs, searchQuery, statusFilter, sortColumn, sortDirection]);

    const handleSort = (column: 'index' | 'time' | 'duration') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const formatDataBytes = (data: number[]): string => {
        if (data.length === 0) return '-';
        return data.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-cyber-blue">Detailed Test Log</h3>
                <div className="text-sm text-gray-400">
                    {filteredData.length} / {analysis.requestResponsePairs.length} items
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyber-blue transition-colors"
                    />
                </div>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyber-blue transition-colors cursor-pointer"
                >
                    <option value="all">All Status</option>
                    <option value="success">Success Only</option>
                    <option value="nrc">NRC Only</option>
                </select>

                {/* Export CSV button */}
                <button
                    onClick={() => csvExporter.exportTestLogToCSV(report, analysis)}
                    className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700 hover:border-cyber-blue transition-all duration-200 whitespace-nowrap"
                    title="Export test log as CSV"
                >
                    📥 Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dark-600">
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                            <th
                                className="text-left py-3 px-4 text-gray-400 font-semibold cursor-pointer hover:text-cyber-blue transition-colors"
                                onClick={() => handleSort('time')}
                            >
                                Time {sortColumn === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">SID</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Sub-Func</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold min-w-[300px]">Description</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                            <th
                                className="text-left py-3 px-4 text-gray-400 font-semibold cursor-pointer hover:text-cyber-blue transition-colors"
                                onClick={() => handleSort('duration')}
                            >
                                Duration {sortColumn === 'duration' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((pair) => {
                            const originalIndex = analysis.requestResponsePairs.indexOf(pair);
                            const isExpanded = expandedRow === originalIndex;
                            const isSuccess = pair.status === 'success';

                            return (
                                <React.Fragment key={originalIndex}>
                                    <tr
                                        className={`border-b border-dark-700/50 transition-colors hover:bg-dark-700/30 ${isExpanded ? 'bg-dark-700/50' : ''
                                            } ${isSuccess ? 'border-l-2 border-l-cyber-green' : 'border-l-2 border-l-red-500'
                                            }`}
                                    >
                                        <td className="py-3 px-4 text-gray-400">{originalIndex + 1}</td>
                                        <td className="py-3 px-4 font-mono text-xs text-gray-300">
                                            {new Date(pair.request.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <code className="text-cyber-blue">
                                                0x{pair.request.sid.toString(16).toUpperCase().padStart(2, '0')}
                                            </code>
                                        </td>
                                        <td className="py-3 px-4">
                                            {pair.request.subFunction !== undefined ? (
                                                <code className="text-purple-400">
                                                    0x{pair.request.subFunction.toString(16).toUpperCase().padStart(2, '0')}
                                                </code>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">{pair.request.description}</td>
                                        <td className="py-3 px-4">
                                            {isSuccess ? (
                                                <span className="px-3 py-1 bg-cyber-green/20 text-white rounded-full text-xs font-bold">
                                                    SUCCESS
                                                </span>
                                            ) : pair.response.nrc ? (
                                                <span className="px-3 py-1 bg-red-500/20 text-white rounded-full text-xs font-bold font-mono">
                                                    NRC 0x{pair.response.nrc.toString(16).toUpperCase().padStart(2, '0')}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-500/20 text-white rounded-full text-xs font-bold">
                                                    TIMEOUT
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">{pair.duration}ms</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => setExpandedRow(isExpanded ? null : originalIndex)}
                                                className="text-cyber-blue hover:text-cyber-pink transition-colors"
                                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                            >
                                                {isExpanded ? '▼' : '▶'}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded row details */}
                                    {isExpanded && (
                                        <tr className="bg-dark-800/80 border-b border-dark-700">
                                            <td colSpan={8} className="py-4 px-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 mb-2">REQUEST DATA</h4>
                                                        <div className="bg-dark-900/50 p-3 rounded font-mono text-xs text-cyber-blue break-all">
                                                            {formatDataBytes(pair.request.data)}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Service: {reportAnalyzer.getSIDName(pair.request.sid)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 mb-2">RESPONSE DATA</h4>
                                                        <div className="bg-dark-900/50 p-3 rounded font-mono text-xs text-purple-400 break-all">
                                                            {formatDataBytes(pair.response.data)}
                                                        </div>
                                                        {pair.response.nrc && (
                                                            <p className="text-xs text-red-400 mt-2">
                                                                Error: {reportAnalyzer.getNRCDescription(pair.response.nrc).description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty state */}
                {filteredData.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No items match your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};
