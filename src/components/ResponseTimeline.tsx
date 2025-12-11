/**
 * Response Timeline Component
 * Visual timeline showing request/response sequence
 */

import React, { useState } from 'react';
import type { TestAnalysisResult } from '../types/uds';
import { reportAnalyzer } from '../services/ReportAnalyzer';

interface ResponseTimelineProps {
    analysis: TestAnalysisResult;
}

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({ analysis }) => {
    const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const filteredTimeline = analysis.timeline.filter((item) => {
        if (filter === 'success') return item.isSuccess;
        if (filter === 'error') return !item.isSuccess;
        return true;
    });

    // Show only first 100 items for performance
    const displayedTimeline = filteredTimeline.slice(0, 100);

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-cyber-blue">Test Timeline</h3>

                {/* Filter buttons */}
                <div className="flex gap-2">
                    {[
                        { value: 'all', label: 'All', count: analysis.timeline.length },
                        { value: 'success', label: 'Success', count: analysis.summary.successCount },
                        { value: 'error', label: 'NRC', count: analysis.summary.nrcCount },
                    ].map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === btn.value
                                ? 'bg-cyber-blue text-dark-900'
                                : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                                }`}
                        >
                            {btn.label} ({btn.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline container */}
            <div className="relative">
                {/* Central line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyber-blue via-purple-500 to-cyber-pink"></div>

                {/* Timeline items */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {displayedTimeline.map((item, index) => {
                        const isHovered = hoveredIndex === index;
                        const isSuccess = item.isSuccess;
                        const time = new Date(item.timestamp);

                        return (
                            <div
                                key={index}
                                className="relative pl-16 transition-all duration-200"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Dot on timeline */}
                                <div
                                    className={`absolute left-6 top-3 w-5 h-5 rounded-full border-2 transition-all duration-200 ${isSuccess
                                        ? 'bg-cyber-green border-cyber-green shadow-neon-green'
                                        : 'bg-red-500 border-red-500 shadow-neon-red'
                                        } ${isHovered ? 'scale-150' : 'scale-100'}`}
                                >
                                    {/* Pulse effect */}
                                    <div
                                        className={`absolute inset-0 rounded-full animate-ping ${isSuccess ? 'bg-cyber-green' : 'bg-red-500'
                                            }`}
                                        style={{ animationDuration: '2s' }}
                                    ></div>
                                </div>

                                {/* Content card */}
                                <div
                                    className={`glass-panel p-4 rounded-lg transition-all duration-200 border-l-4 ${isSuccess ? 'border-l-cyber-green' : 'border-l-red-500'
                                        } ${isHovered ? 'bg-dark-700/80 scale-102' : 'bg-dark-800/50'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-lg ${isSuccess ? 'text-cyber-green' : 'text-red-500'}`}
                                                    aria-label={isSuccess ? 'Success' : 'Error'}
                                                >
                                                    {isSuccess ? '✓' : '✗'}
                                                </span>
                                                <p className="text-sm text-gray-300 truncate">{item.description}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                <span>#{item.requestIndex + 1}</span>
                                                <span>{time.toLocaleTimeString()}.{time.getMilliseconds()}</span>
                                                {item.nrc && (
                                                    <span className="text-red-400 font-mono">
                                                        NRC: 0x{item.nrc.toString(16).toUpperCase().padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <div
                                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${isSuccess
                                                ? 'bg-cyber-green/20 text-cyber-green'
                                                : 'bg-red-500/20 text-red-500'
                                                }`}
                                        >
                                            {isSuccess ? 'SUCCESS' : 'NRC'}
                                        </div>
                                    </div>

                                    {/* Expanded details on hover */}
                                    {isHovered && item.nrc && (
                                        <div className="mt-3 pt-3 border-t border-dark-600 animate-fade-in">
                                            <p className="text-xs text-gray-400">
                                                {reportAnalyzer.getNRCDescription(item.nrc).description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Show more indicator */}
                {filteredTimeline.length > 100 && (
                    <div className="mt-4 text-center py-3 bg-dark-800/50 rounded-lg">
                        <p className="text-sm text-gray-400">
                            Showing first 100 of {filteredTimeline.length} items
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            See detailed log table for complete timeline
                        </p>
                    </div>
                )}

                {/* Empty state */}
                {displayedTimeline.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No items match the selected filter</p>
                    </div>
                )}
            </div>
        </div>
    );
};
