/**
 * Tester Present Toggle Component
 * Toggle button with status indicator for ECU keep-alive functionality
 * 
 * Features:
 * - Heartbeat icon with pulse animation when active
 * - Status text: "TP: OFF" / "TP: 5s ✓"
 * - Click to toggle on/off
 * - Hover tooltip with quick stats
 */

import React, { useState, useCallback } from 'react';
import { useUDS } from '../context/UDSContext';
import type { TesterPresentInterval } from '../types/testerPresent';

interface TesterPresentToggleProps {
    showIntervalSelector?: boolean;
    compact?: boolean;
}

const INTERVAL_OPTIONS: { value: TesterPresentInterval; label: string }[] = [
    { value: 3000, label: '3s' },
    { value: 5000, label: '5s' },
    { value: 10000, label: '10s' },
];

export const TesterPresentToggle: React.FC<TesterPresentToggleProps> = ({
    showIntervalSelector = false,
    compact = false,
}) => {
    const {
        testerPresentState,
        startTesterPresent,
        stopTesterPresent,
        setTesterPresentInterval
    } = useUDS();

    const [showTooltip, setShowTooltip] = useState(false);
    const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

    const handleToggle = useCallback(() => {
        if (testerPresentState.isActive) {
            stopTesterPresent();
        } else {
            startTesterPresent();
        }
    }, [testerPresentState.isActive, startTesterPresent, stopTesterPresent]);

    const handleIntervalChange = useCallback((interval: TesterPresentInterval) => {
        setTesterPresentInterval(interval);
        setShowIntervalDropdown(false);
    }, [setTesterPresentInterval]);

    const formatUptime = (ms: number | null): string => {
        if (ms === null) return '-';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    const intervalLabel = INTERVAL_OPTIONS.find(
        opt => opt.value === testerPresentState.intervalMs
    )?.label || '5s';

    const successRate = testerPresentState.sentCount > 0
        ? Math.round((testerPresentState.successCount / testerPresentState.sentCount) * 100)
        : 0;

    const uptime = testerPresentState.sessionStartTime
        ? Date.now() - testerPresentState.sessionStartTime
        : null;

    return (
        <div className="relative inline-flex items-center gap-2">
            {/* Main Toggle Button */}
            <button
                onClick={handleToggle}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
          border transition-all duration-300 text-xs font-mono
          ${testerPresentState.isActive
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                        : 'bg-dark-700/50 border-dark-600 text-gray-400 hover:bg-dark-600/50 hover:text-gray-300'
                    }
        `}
                title={testerPresentState.isActive ? 'Click to stop keep-alive' : 'Click to start keep-alive'}
            >
                {/* Heartbeat Icon */}
                <span
                    className={`text-sm ${testerPresentState.isActive ? 'animate-pulse' : ''}`}
                    role="img"
                    aria-label="heartbeat"
                >
                    💓
                </span>

                {/* Status Text */}
                {!compact && (
                    <span className="font-medium">
                        TP: {testerPresentState.isActive ? `${intervalLabel} ✓` : 'OFF'}
                    </span>
                )}

                {/* Activity Indicator Dot */}
                {testerPresentState.isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
            </button>

            {/* Interval Selector (Optional) */}
            {showIntervalSelector && testerPresentState.isActive && (
                <div className="relative">
                    <button
                        onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-mono
              bg-dark-700/50 border border-dark-600 rounded text-gray-400
              hover:bg-dark-600/50 hover:text-gray-300 transition-colors"
                    >
                        {intervalLabel}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showIntervalDropdown && (
                        <div className="absolute top-full right-0 mt-1 py-1 bg-dark-800 border border-dark-600 
              rounded-md shadow-lg z-50 min-w-[80px]">
                            {INTERVAL_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleIntervalChange(opt.value)}
                                    className={`w-full px-3 py-1.5 text-xs text-left font-mono
                    hover:bg-dark-700 transition-colors
                    ${opt.value === testerPresentState.intervalMs
                                            ? 'text-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Stats Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
          px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg shadow-xl
          min-w-[180px] z-50 pointer-events-none">
                    <div className="text-xs font-mono space-y-1">
                        <div className="text-gray-400 border-b border-dark-600 pb-1 mb-1 font-bold">
                            Tester Present (0x3E)
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={testerPresentState.isActive ? 'text-green-400' : 'text-gray-400'}>
                                {testerPresentState.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Interval:</span>
                            <span className="text-amber-400">{intervalLabel}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Sent:</span>
                            <span className="text-cyan-400">{testerPresentState.sentCount}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Success Rate:</span>
                            <span className={successRate >= 90 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                                {successRate}%
                            </span>
                        </div>

                        {testerPresentState.isActive && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Uptime:</span>
                                <span className="text-purple-400">{formatUptime(uptime)}</span>
                            </div>
                        )}

                        {testerPresentState.lastError && (
                            <div className="mt-1 pt-1 border-t border-dark-600">
                                <span className="text-red-400 text-[10px]">
                                    ⚠ {testerPresentState.lastError}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-dark-600" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TesterPresentToggle;
