/**
 * Report Summary Cards Component
 * Displays key metrics from test report analysis
 */

import React from 'react';
import type { TestAnalysisResult } from '../types/uds';
import { reportAnalyzer } from '../services/ReportAnalyzer';

interface ReportSummaryCardsProps {
    analysis: TestAnalysisResult;
    reportName: string;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ analysis, reportName }) => {
    const { summary } = analysis;

    const cards = [
        {
            label: 'Total Requests',
            value: summary.totalRequests.toString(),
            icon: '📊',
            color: 'cyan',
        },
        {
            label: 'Successful',
            value: summary.successCount.toString(),
            icon: '✓',
            color: 'green',
        },
        {
            label: 'NRC Errors',
            value: summary.nrcCount.toString(),
            icon: '✗',
            color: 'red',
        },
        {
            label: 'Success Rate',
            value: `${summary.successRate.toFixed(1)}%`,
            icon: '📈',
            color: summary.successRate >= 80 ? 'green' : summary.successRate >= 50 ? 'orange' : 'red',
        },
        {
            label: 'Test Duration',
            value: reportAnalyzer.formatDuration(summary.duration),
            icon: '⏱️',
            color: 'purple',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Report Header */}
            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold gradient-text mb-2">{reportName}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span>Start: {reportAnalyzer.formatTimestamp(summary.startTime)}</span>
                    <span>End: {reportAnalyzer.formatTimestamp(summary.endTime)}</span>
                    <span>Total Responses: {summary.totalResponses}</span>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`glass-card p-6 hover-lift transition-all duration-300 ${getCardBorderClass(card.color)}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl" aria-hidden="true">
                                {card.icon}
                            </span>
                            <div className={`text-3xl font-bold ${getTextColorClass(card.color)}`}>{card.value}</div>
                        </div>
                        <div className="text-sm text-gray-400">{card.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Get border class based on color
 */
function getCardBorderClass(color: string): string {
    switch (color) {
        case 'green':
            return 'border-l-4 border-l-cyber-green';
        case 'red':
            return 'border-l-4 border-l-red-500';
        case 'orange':
            return 'border-l-4 border-l-orange-500';
        case 'purple':
            return 'border-l-4 border-l-purple-500';
        case 'cyan':
        default:
            return 'border-l-4 border-l-cyber-blue';
    }
}

/**
 * Get text color class based on color
 */
function getTextColorClass(color: string): string {
    switch (color) {
        case 'green':
            return 'text-cyber-green';
        case 'red':
            return 'text-red-500';
        case 'orange':
            return 'text-orange-500';
        case 'purple':
            return 'text-purple-500';
        case 'cyan':
        default:
            return 'text-cyber-blue';
    }
}
