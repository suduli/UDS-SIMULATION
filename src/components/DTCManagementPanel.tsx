/**
 * DTC Management Panel Component
 * Comprehensive DTC visualization with category filtering and status display
 * Supports Light/Dark themes with High Contrast modes
 */

import React, { useState, useMemo } from 'react';
import { useUDS } from '../context/UDSContext';
import type { DTCInfo, DTCCategory, DTCStatusMask, ServiceId } from '../types/uds';
import {
    formatDTCCode,
    dtcStatusToByte,
    getDTCStatusDescriptions,
    getSID19SubfunctionName
} from '../utils/udsHelpers';

interface DTCManagementPanelProps {
    onClose?: () => void;
    compact?: boolean;
}

const DTCManagementPanel: React.FC<DTCManagementPanelProps> = ({ onClose, compact = false }) => {
    const { sendRequest, ecuConfig, ecuPower } = useUDS(); const [selectedCategory, setSelectedCategory] = useState<DTCCategory | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'confirmed' | 'pending' | 'active'>('all');
    const [expandedDTC, setExpandedDTC] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSubfunction, setLastSubfunction] = useState<number>(0x02);

    // Get DTCs from ECU config
    const dtcs: DTCInfo[] = ecuConfig?.dtcs || [];

    // DEBUG: Log mount and prop updates
    React.useEffect(() => {
        console.log('[DTCManagementPanel] Mounted. ECU Power:', ecuPower);
    }, [ecuPower]);

    // Filter DTCs based on selected category and status
    const filteredDTCs = useMemo(() => {
        return dtcs.filter(dtc => {
            // Category filter
            if (selectedCategory !== 'all' && dtc.category !== selectedCategory) {
                return false;
            }

            // Status filter
            if (selectedStatus === 'confirmed' && !dtc.status.confirmedDTC) return false;
            if (selectedStatus === 'pending' && !dtc.status.pendingDTC) return false;
            if (selectedStatus === 'active' && !dtc.status.testFailed) return false;

            return true;
        });
    }, [dtcs, selectedCategory, selectedStatus]);

    // Category counts
    const categoryCounts = useMemo(() => {
        return {
            all: dtcs.length,
            powertrain: dtcs.filter(d => d.category === 'powertrain').length,
            chassis: dtcs.filter(d => d.category === 'chassis').length,
            body: dtcs.filter(d => d.category === 'body').length,
            network: dtcs.filter(d => d.category === 'network').length,
        };
    }, [dtcs]);

    // Status counts
    const statusCounts = useMemo(() => {
        return {
            confirmed: dtcs.filter(d => d.status.confirmedDTC).length,
            pending: dtcs.filter(d => d.status.pendingDTC).length,
            active: dtcs.filter(d => d.status.testFailed).length,
        };
    }, [dtcs]);

    // Send DTC read request
    const handleReadDTCs = async (subfunction: number, statusMask: number = 0xFF) => {
        setIsLoading(true);
        setLastSubfunction(subfunction);
        try {
            await sendRequest({
                sid: 0x19,
                subFunction: subfunction,
                data: [statusMask],
                timestamp: Date.now(),
            });
            console.log('[DTCManagementPanel] Read DTCs Success');
        } catch (e) {
            console.error('[DTCManagementPanel] Read DTCs Failed:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Send clear DTC request
    const handleClearDTCs = async () => {
        setIsLoading(true);

        const requestData = [0xFF, 0xFF, 0xFF];
        const request = {
            sid: 0x14 as ServiceId,
            data: requestData,
            timestamp: Date.now(),
        };

        console.log('[DTCManagementPanel] 🔴 Clear DTC Request Created:');
        console.log('  - SID:', `0x${request.sid.toString(16).toUpperCase()}`);
        console.log('  - Data Array:', request.data);
        console.log('  - Data Length:', request.data?.length);
        console.log('  - Data Contents:', request.data?.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(' '));
        console.log('  - Timestamp:', request.timestamp);
        console.log('  - Request Object:', JSON.stringify(request));

        try {
            console.log('[DTCManagementPanel] 🚀 Sending Clear DTC request...');
            await sendRequest(request);
            console.log('[DTCManagementPanel] ✅ Clear DTC request completed successfully');
        } catch (error) {
            console.error('[DTCManagementPanel] ❌ Clear DTC request failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get category icon
    const getCategoryIcon = (category: DTCCategory) => {
        switch (category) {
            case 'powertrain':
                return '⚙️';
            case 'chassis':
                return '🔧';
            case 'body':
                return '🚗';
            case 'network':
                return '📡';
            default:
                return '❓';
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Render status byte visualization
    const renderStatusByte = (status: DTCStatusMask) => {
        const statusByte = dtcStatusToByte(status);
        const bits = [
            { mask: 0x80, label: 'WIR', desc: 'Warning Indicator Requested' },
            { mask: 0x40, label: 'TNC', desc: 'Test Not Completed This Cycle' },
            { mask: 0x20, label: 'TFS', desc: 'Test Failed Since Last Clear' },
            { mask: 0x10, label: 'TNC', desc: 'Test Not Completed Since Clear' },
            { mask: 0x08, label: 'CD', desc: 'Confirmed DTC' },
            { mask: 0x04, label: 'PD', desc: 'Pending DTC' },
            { mask: 0x02, label: 'TFT', desc: 'Test Failed This Operation Cycle' },
            { mask: 0x01, label: 'TF', desc: 'Test Failed' },
        ];

        return (
            <div className="flex gap-1">
                {bits.map((bit, idx) => (
                    <div
                        key={idx}
                        title={bit.desc}
                        className={`dtc-status-bit ${(statusByte & bit.mask) !== 0
                            ? 'dtc-status-bit-active'
                            : 'dtc-status-bit-inactive'
                            }`}
                    >
                        {((statusByte & bit.mask) !== 0) ? '1' : '0'}
                    </div>
                ))}
            </div>
        );
    };

    // Quick action buttons
    const QuickActions = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                onClick={() => {
                    console.log('[DTCManagementPanel] Clicked Count All');
                    handleReadDTCs(0x01, 0xFF);
                }}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-primary"
            >
                Count All
            </button>
            <button
                onClick={() => {
                    console.log('[DTCManagementPanel] Clicked Read All');
                    handleReadDTCs(0x02, 0xFF);
                }}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-primary"
            >
                Read All
            </button>
            <button
                onClick={() => handleReadDTCs(0x02, 0x08)}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-warning"
            >
                Confirmed Only
            </button>
            <button
                onClick={() => handleReadDTCs(0x02, 0x04)}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-info"
            >
                Pending Only
            </button>
            <button
                onClick={() => handleReadDTCs(0x0A)}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-purple"
            >
                Supported DTCs
            </button>
            <button
                onClick={handleClearDTCs}
                disabled={isLoading || !ecuPower}
                className="dtc-action-btn dtc-action-btn-danger ml-auto"
            >
                Clear All DTCs
            </button>
        </div>
    );

    // Category tabs
    const CategoryTabs = () => (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {(['all', 'powertrain', 'chassis', 'body', 'network'] as const).map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`dtc-category-tab ${selectedCategory === cat
                        ? 'dtc-category-tab-active'
                        : 'dtc-category-tab-inactive'
                        }`}
                >
                    {cat === 'all' ? '📊 All' : `${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                    <span className="ml-1.5 text-[10px] opacity-70">({categoryCounts[cat]})</span>
                </button>
            ))}
        </div>
    );

    // Status filter pills
    const StatusFilters = () => (
        <div className="flex gap-2 mb-4">
            {(['all', 'confirmed', 'pending', 'active'] as const).map(status => (
                <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`dtc-status-pill ${selectedStatus === status
                        ? status === 'confirmed' ? 'dtc-status-pill-confirmed' :
                            status === 'pending' ? 'dtc-status-pill-pending' :
                                status === 'active' ? 'dtc-status-pill-active' :
                                    'dtc-status-pill-all'
                        : 'dtc-status-pill-inactive'
                        }`}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && <span className="ml-1">({statusCounts[status as keyof typeof statusCounts]})</span>}
                </button>
            ))}
        </div>
    );

    // DTC Card component
    const DTCCard: React.FC<{ dtc: DTCInfo }> = ({ dtc }) => {
        const isExpanded = expandedDTC === dtc.code;
        const formattedCode = formatDTCCode(dtc.code);
        const statusDescriptions = getDTCStatusDescriptions(dtc.status);

        // Get severity class
        const getSeverityClass = (severity: string) => {
            switch (severity) {
                case 'critical':
                    return 'dtc-severity-critical';
                case 'high':
                    return 'dtc-severity-high';
                case 'medium':
                    return 'dtc-severity-medium';
                case 'low':
                    return 'dtc-severity-low';
                default:
                    return 'dtc-severity-default';
            }
        };

        return (
            <div
                className={`dtc-card ${isExpanded ? 'dtc-card-expanded' : ''}`}
            >
                {/* Card Header */}
                <button
                    onClick={() => setExpandedDTC(isExpanded ? null : dtc.code)}
                    className="w-full p-3 flex items-center gap-3 text-left dtc-card-header"
                >
                    {/* Category Icon */}
                    <div className="text-xl">{getCategoryIcon(dtc.category)}</div>

                    {/* DTC Code */}
                    <div className="flex-shrink-0">
                        <div className="dtc-code">
                            {formattedCode}
                        </div>
                        <div className="dtc-category-label">{dtc.category}</div>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                        <div className="dtc-description">{dtc.description}</div>
                        <div className="flex gap-1 mt-1">
                            {statusDescriptions.slice(0, 3).map((desc, idx) => (
                                <span key={idx} className="dtc-status-tag">
                                    {desc}
                                </span>
                            ))}
                            {statusDescriptions.length > 3 && (
                                <span className="dtc-status-more">+{statusDescriptions.length - 3}</span>
                            )}
                        </div>
                    </div>

                    {/* Severity Badge */}
                    <div className={`dtc-severity-badge ${getSeverityClass(dtc.severity)}`}>
                        {dtc.severity}
                    </div>

                    {/* Expand Icon */}
                    <svg
                        className={`dtc-expand-icon ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="dtc-expanded-content">
                        {/* Status Byte Visualization */}
                        <div className="pt-4">
                            <div className="dtc-section-label">Status Byte (0x{dtcStatusToByte(dtc.status).toString(16).toUpperCase().padStart(2, '0')})</div>
                            {renderStatusByte(dtc.status)}
                            <div className="mt-2 dtc-status-labels">
                                WIR | TNC | TFS | TNC | CD | PD | TFT | TF
                            </div>
                        </div>

                        {/* Counters */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="dtc-counter-box">
                                <div className="dtc-counter-label">Occurrences</div>
                                <div className="dtc-counter-value dtc-counter-value-primary">{dtc.occurrenceCounter}</div>
                            </div>
                            <div className="dtc-counter-box">
                                <div className="dtc-counter-label">Aging Counter</div>
                                <div className="dtc-counter-value dtc-counter-value-secondary">{dtc.agingCounter}</div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="dtc-timestamp-label">First Failure: </span>
                                <span className="dtc-timestamp-value">{formatTimestamp(dtc.firstFailureTimestamp)}</span>
                            </div>
                            <div>
                                <span className="dtc-timestamp-label">Most Recent: </span>
                                <span className="dtc-timestamp-value">{formatTimestamp(dtc.mostRecentFailureTimestamp)}</span>
                            </div>
                        </div>

                        {/* Snapshot Data */}
                        {dtc.snapshots && dtc.snapshots.length > 0 && (
                            <div>
                                <div className="dtc-section-label">Freeze Frame Data (Record #{dtc.snapshots[0].recordNumber})</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(dtc.snapshots[0].data).map(([key, value]) => (
                                        <div key={key} className="dtc-data-row">
                                            <span className="dtc-data-key">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="dtc-data-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Extended Data */}
                        {dtc.extendedData && dtc.extendedData.length > 0 && (
                            <div>
                                <div className="dtc-section-label">Extended Data</div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="dtc-data-row">
                                        <span className="dtc-data-key">Aged: </span>
                                        <span className="dtc-data-value">{dtc.extendedData[0].agedCounter}</span>
                                    </div>
                                    <div className="dtc-data-row">
                                        <span className="dtc-data-key">Self-Heal: </span>
                                        <span className="dtc-data-value">{dtc.extendedData[0].selfHealingCounter}</span>
                                    </div>
                                    <div className="dtc-data-row">
                                        <span className="dtc-data-key">Failed Since Clear: </span>
                                        <span className={dtc.extendedData[0].failedSinceLastClear ? 'dtc-data-value-fail' : 'dtc-data-value-pass'}>
                                            {dtc.extendedData[0].failedSinceLastClear ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => handleReadDTCs(0x04, dtc.code)}
                                className="dtc-detail-btn dtc-detail-btn-primary"
                            >
                                Read Snapshot
                            </button>
                            <button
                                onClick={() => handleReadDTCs(0x06, dtc.code)}
                                className="dtc-detail-btn dtc-detail-btn-purple"
                            >
                                Read Extended Data
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // DEBUG: Render log
    console.log('[DTCManagementPanel] Render. isLoading:', isLoading, 'ecuPower:', ecuPower);

    return (
        <div className={`dtc-panel ${compact ? 'p-3' : 'p-4'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="dtc-header-icon">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="dtc-panel-title">DTC Management</h3>
                        <p className="dtc-panel-subtitle">Service 0x19 - Read DTC Information</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="dtc-close-btn">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Last Request Info */}
            {lastSubfunction > 0 && (
                <div className="dtc-last-request">
                    Last Request: <span className="dtc-last-request-value">{getSID19SubfunctionName(lastSubfunction)}</span>
                </div>
            )}

            {/* Quick Actions */}
            <QuickActions />

            {/* Category Tabs */}
            <CategoryTabs />

            {/* Status Filters */}
            <StatusFilters />

            {/* DTC List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {filteredDTCs.length === 0 ? (
                    <div className="dtc-empty-state">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No DTCs match the current filters</p>
                    </div>
                ) : (
                    filteredDTCs.map(dtc => <DTCCard key={dtc.code} dtc={dtc} />)
                )}
            </div>

            {/* Summary Footer */}
            <div className="dtc-footer">
                <span>
                    Showing {filteredDTCs.length} of {dtcs.length} DTCs
                </span>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                        <span className="dtc-footer-dot dtc-footer-dot-confirmed"></span>
                        Confirmed: {statusCounts.confirmed}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="dtc-footer-dot dtc-footer-dot-pending"></span>
                        Pending: {statusCounts.pending}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Wrap with React.memo to prevent re-renders from parent context updates
export default React.memo(DTCManagementPanel);
