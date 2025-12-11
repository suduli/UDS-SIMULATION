/**
 * NRC Analysis Chart Component
 * Visualizes negative response code distribution
 */

import React, { useState } from 'react';
import type { TestAnalysisResult } from '../types/uds';
import { reportAnalyzer } from '../services/ReportAnalyzer';

interface NRCAnalysisChartProps {
    analysis: TestAnalysisResult;
}

export const NRCAnalysisChart: React.FC<NRCAnalysisChartProps> = ({ analysis }) => {
    const [selectedNRC, setSelectedNRC] = useState<number | null>(null);

    const nrcData = Array.from(analysis.nrcBreakdown.entries())
        .map(([code, info]) => ({
            code,
            ...info,
            nrcInfo: reportAnalyzer.getNRCDescription(code),
        }))
        .sort((a, b) => b.count - a.count);

    if (nrcData.length === 0) {
        return (
            <div className="glass-card p-8">
                <h3 className="text-xl font-bold text-cyber-blue mb-4">NRC Analysis</h3>
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">✓</div>
                    <p className="text-gray-400">No NRC errors encountered in this test session!</p>
                    <p className="text-sm text-gray-500 mt-2">All requests completed successfully.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-cyber-blue">NRC Distribution</h3>
                <div className="text-sm text-gray-400">
                    Total NRCs: <span className="text-red-500 font-bold">{analysis.summary.nrcCount}</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-3 mb-6">
                {nrcData.map((item) => {
                    const isSelected = selectedNRC === item.code;
                    const bgColor = getSeverityColor(item.nrcInfo.severity);

                    return (
                        <div
                            key={item.code}
                            className={`transition-all duration-300 cursor-pointer ${isSelected ? 'scale-105' : 'hover:scale-102'
                                }`}
                            onClick={() => setSelectedNRC(isSelected ? null : item.code)}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div className="font-mono text-sm text-cyber-blue min-w-[4rem]">
                                    0x{item.code.toString(16).toUpperCase().padStart(2, '0')}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-300">{item.description}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{item.count}x</span>
                                            <span className="text-xs font-bold text-gray-400">{item.percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-8 bg-dark-800 rounded-lg overflow-hidden">
                                        <div
                                            className={`h-full ${bgColor} transition-all duration-500 ease-out flex items-center px-3`}
                                            style={{ width: `${item.percentage}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white mix-blend-difference">
                                                {item.count} occurrence{item.count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Extended info when selected */}
                            {isSelected && (
                                <div className="ml-20 mt-2 p-4 bg-dark-800/50 rounded-lg border border-cyber-blue/30 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Full Name:</span>
                                            <span className="ml-2 text-gray-200">{item.nrcInfo.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Severity:</span>
                                            <span
                                                className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getSeverityBadgeClass(
                                                    item.nrcInfo.severity
                                                )}`}
                                            >
                                                {item.nrcInfo.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="text-gray-500">Description:</span>
                                            <p className="mt-1 text-gray-300">{item.nrcInfo.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-dark-600">
                <div className="flex flex-wrap gap-4 justify-center text-xs">
                    {['info', 'warning', 'error', 'critical'].map((severity) => (
                        <div key={severity} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getSeverityColor(severity as any)}`}></div>
                            <span className="text-gray-400 capitalize">{severity}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">Click on any bar for more details</p>
        </div>
    );
};

/**
 * Get background color based on severity
 */
function getSeverityColor(severity: 'info' | 'warning' | 'error' | 'critical'): string {
    switch (severity) {
        case 'info':
            return 'bg-blue-500';
        case 'warning':
            return 'bg-yellow-500';
        case 'error':
            return 'bg-orange-500';
        case 'critical':
            return 'bg-red-600';
        default:
            return 'bg-gray-500';
    }
}

/**
 * Get badge class based on severity
 */
function getSeverityBadgeClass(severity: 'info' | 'warning' | 'error' | 'critical'): string {
    switch (severity) {
        case 'info':
            return 'bg-blue-500/20 text-blue-400';
        case 'warning':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'error':
            return 'bg-orange-500/20 text-orange-400';
        case 'critical':
            return 'bg-red-600/20 text-red-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
}
