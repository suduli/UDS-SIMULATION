/**
 * Cluster Dashboard Page - V3 Mercedes/Audi Premium Design
 * 
 * Features:
 * - Edge-to-edge curved display panel
 * - Left RPM gauge with cyan needle and red zone
 * - Right speedometer gauge with cyan needle
 * - Center digital speed display with vehicle status info
 * - Integrated telltale warning indicators
 * - Vertical PRND gear selector with green highlight
 * 
 * INTEGRATION POINTS:
 * - vehicleState: Operating conditions for freeze frame data
 * - faultTriggers: For DTC injection
 */

import React, { useState } from 'react';
import type { JSX } from 'react';
import Header from '../components/Header';
import EnhancedBackground from '../components/EnhancedBackground';
import ProtocolStateDashboard from '../components/ProtocolStateDashboard';
import DTCManagementPanel from '../components/DTCManagementPanel';
import { useUDS } from '../context/UDSContext';

// ========================================
// TYPE DEFINITIONS
// ========================================

type IgnitionStatus = 'OFF' | 'ACC' | 'ON' | 'CRANK';
type GearPosition = 'P' | 'R' | 'N' | 'D' | '1' | '2' | '3';

// Local interface for cluster display (ignition and battery from context)

interface FaultTriggers {
    powertrain: {
        mafFault: boolean;
        coolantTempSensorFault: boolean;
        throttlePositionError: boolean;
        misfireDetected: boolean;
        fuelPressureLow: boolean;
    };
    brakes: {
        wheelSpeedFLFault: boolean;
        wheelSpeedFRFault: boolean;
        brakePressureSensorFault: boolean;
        absPumpMotorFailure: boolean;
        yawRateSensorFault: boolean;
    };
    body: {
        driverDoorSwitchStuck: boolean;
        windowMotorFLStuck: boolean;
        wiperMotorOverload: boolean;
        centralLockControlFault: boolean;
    };
    network: {
        canTimeoutEngineEcu: boolean;
        canTimeoutAbs: boolean;
        canBusOff: boolean;
    };
}

// ========================================
// PREMIUM CIRCULAR GAUGE
// ========================================

interface PremiumGaugeProps {
    value: number;
    min: number;
    max: number;
    label: string;
    size?: number;
    redZoneStart?: number;
    isRpm?: boolean;
    className?: string;
}

const PremiumGauge: React.FC<PremiumGaugeProps> = ({
    value,
    min,
    max,
    label,
    size = 280,
    redZoneStart,
    isRpm = false,
    className
}) => {
    const center = 140; // Fixed internal coordinate system
    const scale = size / 280; // Keep existing prop for backwards compat if needed, but we'll use constrained SVG

    // We'll use a fixed internal coordinate system of 280x280 for the SVG logic
    // and let CSS handle the actual display size.
    const internalSize = 280;
    const internalCenter = internalSize / 2;
    const outerRadius = internalCenter - 15;
    const innerRadius = outerRadius - 35;

    // Angle calculations (270 degree sweep from -225 to +45)
    const startAngle = -225;
    const endAngle = 45;
    const angleRange = endAngle - startAngle;
    const clampedValue = Math.max(min, Math.min(max, value));
    const valueAngle = startAngle + ((clampedValue - min) / (max - min)) * angleRange;

    // Generate major tick marks
    const ticks: JSX.Element[] = [];
    const numMajorTicks = isRpm ? 10 : 14;
    const tickStep = (max - min) / numMajorTicks;

    for (let i = 0; i <= numMajorTicks; i++) {
        const tickValue = min + i * tickStep;
        const angle = (startAngle + (i / numMajorTicks) * angleRange) * (Math.PI / 180);
        const isInRedZone = redZoneStart !== undefined && tickValue >= redZoneStart;

        const tickOuterRadius = outerRadius - 8;
        const tickInnerRadius = tickOuterRadius - (i % 2 === 0 ? 20 : 10);

        const x1 = internalCenter + Math.cos(angle) * tickInnerRadius;
        const y1 = internalCenter + Math.sin(angle) * tickInnerRadius;
        const x2 = internalCenter + Math.cos(angle) * tickOuterRadius;
        const y2 = internalCenter + Math.sin(angle) * tickOuterRadius;

        ticks.push(
            <line
                key={`tick-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isInRedZone ? '#ff3b30' : '#ffffff'}
                strokeWidth={i % 2 === 0 ? 3 : 1.5}
                strokeLinecap="round"
                opacity={i % 2 === 0 ? 1 : 0.5}
            />
        );

        // Number labels for major ticks
        if (i % 2 === 0) {
            const labelRadius = tickInnerRadius - 18;
            const labelX = internalCenter + Math.cos(angle) * labelRadius;
            const labelY = internalCenter + Math.sin(angle) * labelRadius;
            const displayValue = isRpm ? tickValue / 1000 : tickValue;

            ticks.push(
                <text
                    key={`label-${i}`}
                    x={labelX}
                    y={labelY}
                    fill={isInRedZone ? '#ff3b30' : '#aaaaaa'}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                >
                    {Math.round(displayValue)}
                </text>
            );
        }
    }

    // Red zone arc
    let redArc = null;
    if (redZoneStart !== undefined && redZoneStart < max) {
        const redStartAngle = startAngle + ((redZoneStart - min) / (max - min)) * angleRange;
        const arcRadius = outerRadius - 5;
        const startRad = redStartAngle * (Math.PI / 180);
        const endRad = endAngle * (Math.PI / 180);

        const x1 = internalCenter + Math.cos(startRad) * arcRadius;
        const y1 = internalCenter + Math.sin(startRad) * arcRadius;
        const x2 = internalCenter + Math.cos(endRad) * arcRadius;
        const y2 = internalCenter + Math.sin(endRad) * arcRadius;

        const largeArc = (endAngle - redStartAngle) > 180 ? 1 : 0;

        redArc = (
            <path
                d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke="#ff3b30"
                strokeWidth="5"
                opacity="0.9"
            />
        );
    }

    // Needle
    const needleAngle = valueAngle * (Math.PI / 180);
    const needleLength = innerRadius + 15;
    const needleTipX = internalCenter + Math.cos(needleAngle) * needleLength;
    const needleTipY = internalCenter + Math.sin(needleAngle) * needleLength;

    const isInRed = redZoneStart !== undefined && value >= redZoneStart;
    const needleColor = isInRed ? '#ff3b30' : '#00d4ff';

    return (
        <div className={`relative cluster-gauge ${className || ''}`} style={{ width: '100%', maxWidth: size, aspectRatio: '1/1' }}>
            <svg viewBox={`0 0 ${internalSize} ${internalSize}`} className="w-full h-full cluster-gauge-svg">
                <defs>
                    {/* Outer ring gradient - Dark theme */}
                    <linearGradient id={`bezel-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className="gauge-bezel-start" stopColor="var(--gauge-bezel-start, #3a3a40)" />
                        <stop offset="50%" className="gauge-bezel-mid" stopColor="var(--gauge-bezel-mid, #1a1a1f)" />
                        <stop offset="100%" className="gauge-bezel-end" stopColor="var(--gauge-bezel-end, #2a2a30)" />
                    </linearGradient>
                    {/* Inner gradient */}
                    <radialGradient id={`inner-${label}`} cx="30%" cy="30%">
                        <stop offset="0%" stopColor="var(--gauge-inner-start, #1a1a1f)" />
                        <stop offset="100%" stopColor="var(--gauge-inner-end, #0a0a0d)" />
                    </radialGradient>
                    {/* Needle glow */}
                    <filter id={`needle-glow-${label}`}>
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Cyan glow for bezel */}
                    <filter id={`bezel-glow-${label}`}>
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer bezel ring with glow */}
                <circle
                    cx={internalCenter} cy={internalCenter} r={outerRadius + 3}
                    fill="none"
                    className="gauge-bezel-glow"
                    strokeWidth="1"
                    filter={`url(#bezel-glow-${label})`}
                />

                {/* Outer bezel */}
                <circle
                    cx={internalCenter} cy={internalCenter} r={outerRadius}
                    className="gauge-outer-bezel"
                    fill={`url(#inner-${label})`}
                    stroke={`url(#bezel-${label})`}
                    strokeWidth="8"
                />

                {/* Inner circle */}
                <circle
                    cx={internalCenter} cy={internalCenter} r={innerRadius - 30}
                    className="gauge-inner-circle"
                    strokeWidth="1"
                />

                {/* Red zone arc */}
                {redArc}

                {/* Tick marks and labels */}
                {ticks}

                {/* Needle */}
                <line
                    x1={internalCenter}
                    y1={internalCenter}
                    x2={needleTipX}
                    y2={needleTipY}
                    stroke={needleColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={`url(#needle-glow-${label})`}
                    style={{ transition: 'all 0.15s ease-out' }}
                />

                {/* Center hub */}
                <circle cx={internalCenter} cy={internalCenter} r="18" className="gauge-center-hub" strokeWidth="3" />
                <circle cx={internalCenter} cy={internalCenter} r="8" className="gauge-center-dot" />
            </svg>

            {/* Label at bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-sm cluster-gauge-label uppercase tracking-[0.2em] font-medium">
                    {label}
                </span>
            </div>
        </div>
    );
};

// ========================================
// TELLTALE ICON COMPONENTS
// ========================================

const EngineIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 10h-4V6h-2v4H7v2h4v4h2v-4h4v-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
);

const ABSIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="bold">ABS</text>
    </svg>
);

const BatteryIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 4h-3V2h-4v2H7v18h10V4zm-4 12h-2v-4H9v-2h2V8h2v2h2v2h-2v4z" />
    </svg>
);

const OilIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 20H5V9l7-7 7 7v11zM12 4.83L7 9.83V18h10V9.83l-5-5z" />
        <circle cx="12" cy="14" r="3" />
    </svg>
);

const TempIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1v3h-2V5z" />
    </svg>
);

const BrakeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="9" textAnchor="middle" fontSize="5">!</text>
        <text x="12" y="16" textAnchor="middle" fontSize="4">BRAKE</text>
    </svg>
);

const ESPIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
    </svg>
);

const FuelIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z" />
    </svg>
);

// ========================================
// TELLTALE INDICATOR
// ========================================

interface TelltaleProps {
    icon: React.ReactNode;
    active: boolean;
    color: 'red' | 'amber' | 'green';
    label: string;
}

const Telltale: React.FC<TelltaleProps> = ({ icon, active, color, label }) => {
    const colors = {
        red: { on: '#ff3b30', glow: 'rgba(255, 59, 48, 0.8)' },
        amber: { on: '#ff9500', glow: 'rgba(255, 149, 0, 0.8)' },
        green: { on: '#30d158', glow: 'rgba(48, 209, 88, 0.8)' }
    };

    const c = colors[color];

    return (
        <div className="flex flex-col items-center" title={label}>
            <div
                className={`w-6 h-6 transition-all duration-300 ${active ? '' : 'cluster-telltale-inactive'}`}
                style={{
                    color: active ? c.on : undefined,
                    filter: active ? `drop-shadow(0 0 6px ${c.glow})` : 'none'
                }}
            >
                {icon}
            </div>
        </div>
    );
};

// ========================================
// VEHICLE STATUS ITEM
// ========================================

interface StatusItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    warning?: boolean;
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, label, value, unit, warning }) => (
    <div className="flex items-center gap-3 px-4 py-2">
        <div className={`w-5 h-5 ${warning ? 'text-red-500' : 'text-cyan-500'}`}>
            {icon}
        </div>
        <div>
            <div className="text-[10px] cluster-text-secondary uppercase tracking-wider">{label}</div>
            <div className={`text-lg font-semibold tabular-nums ${warning ? 'text-red-400' : 'cluster-status-value'}`}>
                {value}<span className="text-xs cluster-text-secondary ml-1">{unit}</span>
            </div>
        </div>
    </div>
);

// ========================================
// GEAR SELECTOR (PRND)
// ========================================

interface GearSelectorProps {
    gear: GearPosition;
    onChange: (gear: GearPosition) => void;
}

const GearSelector: React.FC<GearSelectorProps> = ({ gear, onChange }) => {
    const mainGears: GearPosition[] = ['P', 'R', 'N', 'D'];

    return (
        <div className="flex items-center justify-center gap-4 bg-black/20 rounded-xl px-4 py-2 border border-white/5">
            {mainGears.map((g) => (
                <button
                    key={g}
                    onClick={() => onChange(g)}
                    className={`w-8 h-8 flex items-center justify-center text-lg font-bold transition-all duration-200 rounded ${gear === g
                        ? 'text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(48,209,88,0.3)] scale-110'
                        : 'cluster-fault-chevron hover:text-gray-400 opacity-50'
                        }`}
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        textShadow: gear === g ? '0 0 10px rgba(48, 209, 88, 0.8)' : 'none'
                    }}
                >
                    {g}
                </button>
            ))}
        </div>
    );
};

// ========================================
// IGNITION SWITCH
// ========================================

interface IgnitionSwitchProps {
    status: IgnitionStatus;
    onChange: (status: IgnitionStatus) => void;
}

const IgnitionSwitch: React.FC<IgnitionSwitchProps> = ({ status, onChange }) => {
    const statuses: IgnitionStatus[] = ['OFF', 'ACC', 'ON', 'CRANK'];
    const colors: Record<IgnitionStatus, string> = {
        OFF: '#666',
        ACC: '#ff9500',
        ON: '#30d158',
        CRANK: '#007aff'
    };

    return (
        <div className="flex gap-1 cluster-ignition-switch rounded-lg p-1">
            {statuses.map((s) => (
                <button
                    key={s}
                    onClick={() => onChange(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${status === s ? 'scale-105' : 'opacity-40 hover:opacity-70 cluster-ignition-btn-inactive'}`}
                    style={{
                        backgroundColor: status === s ? `${colors[s]}20` : 'transparent',
                        color: status === s ? colors[s] : undefined,
                        boxShadow: status === s ? `0 0 10px ${colors[s]}40` : 'none'
                    }}
                >
                    {s}
                </button>
            ))}
        </div>
    );
};

// ========================================
// FAULT TOGGLE
// ========================================

interface FaultToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const FaultToggle: React.FC<FaultToggleProps> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between py-1.5 cursor-pointer group">
        <span className={`text-xs transition-colors ${checked ? 'text-red-400' : 'cluster-fault-label group-hover:cluster-fault-label'}`}>
            {label}
        </span>
        <div
            className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${checked ? 'bg-red-500' : 'cluster-toggle-inactive'}`}
            onClick={() => onChange(!checked)}
        >
            <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`}
            />
        </div>
    </label>
);

// ========================================
// FAULT SECTION
// ========================================

interface FaultSectionProps {
    title: string;
    activeCount: number;
    children: React.ReactNode;
}

const FaultSection: React.FC<FaultSectionProps> = ({ title, activeCount, children }) => {
    const [open, setOpen] = useState(true);

    return (
        <div className="border cluster-fault-section rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-2.5 cluster-fault-section-header hover:bg-white/5 transition-colors"
            >
                <span className="text-xs font-medium cluster-fault-section-title">{title}</span>
                <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                            {activeCount}
                        </span>
                    )}
                    <svg className={`w-3 h-3 cluster-fault-chevron transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {open && <div className="px-2.5 pb-2.5 border-t cluster-fault-section-content">{children}</div>}
        </div>
    );
};

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export const ClusterDashboardPage: React.FC = () => {
    // Get vehicle state and power management from UDS Context
    const {
        vehicleState,
        updateVehicleState,
        powerState,
        setPowerState,
        voltage,
        simulateCranking,
        updateDTCStatus
    } = useUDS();

    React.useEffect(() => {
        console.log('[ClusterDashboardPage] Mounted');
    }, []);

    // Map powerState to ignitionStatus for display
    const mapPowerStateToIgnition = (ps: typeof powerState): IgnitionStatus => {
        switch (ps) {
            case 'OFF': return 'OFF';
            case 'ACC': return 'ACC';
            case 'ON': return 'ON';
            case 'CRANKING': return 'CRANK';
            default: return 'OFF';
        }
    };

    // Map ignitionStatus to powerState for context
    const mapIgnitionToPowerState = (ig: IgnitionStatus): typeof powerState => {
        switch (ig) {
            case 'OFF': return 'OFF';
            case 'ACC': return 'ACC';
            case 'ON': return 'ON';
            case 'CRANK': return 'CRANKING';
            default: return 'OFF';
        }
    };

    // Derived ignition status from context
    const ignitionStatus = mapPowerStateToIgnition(powerState);

    // Handle ignition change - sync with context
    const handleIgnitionChange = (newStatus: IgnitionStatus) => {
        if (newStatus === 'CRANK') {
            simulateCranking();
        } else {
            setPowerState(mapIgnitionToPowerState(newStatus));
        }
    };

    // Handle vehicle state changes - sync with context
    const updateVehicle = <K extends keyof typeof vehicleState>(key: K, value: typeof vehicleState[K]) => {
        updateVehicleState(key, value);
    };

    const [faultTriggers, setFaultTriggers] = useState<FaultTriggers>({
        powertrain: { mafFault: false, coolantTempSensorFault: false, throttlePositionError: false, misfireDetected: false, fuelPressureLow: false },
        brakes: { wheelSpeedFLFault: false, wheelSpeedFRFault: false, brakePressureSensorFault: false, absPumpMotorFailure: false, yawRateSensorFault: false },
        body: { driverDoorSwitchStuck: false, windowMotorFLStuck: false, wiperMotorOverload: false, centralLockControlFault: false },
        network: { canTimeoutEngineEcu: false, canTimeoutAbs: false, canBusOff: false }
    });

    const updateFault = (category: keyof FaultTriggers, fault: string, value: boolean) => {
        setFaultTriggers(prev => ({
            ...prev,
            [category]: { ...prev[category], [fault]: value }
        }));
    };

    const countFaults = (category: keyof FaultTriggers) =>
        Object.values(faultTriggers[category]).filter(Boolean).length;

    const totalFaults = Object.keys(faultTriggers).reduce(
        (sum, cat) => sum + countFaults(cat as keyof FaultTriggers), 0
    );

    // Mobile specific state
    const [isFaultPanelOpen, setIsFaultPanelOpen] = useState(false);

    // INTEGRATION POINT
    const handleApplyConditions = () => {
        console.log('=== Operating Conditions Applied ===');
        console.log('vehicleState:', JSON.stringify(vehicleState, null, 2));
        console.log('ignitionStatus:', ignitionStatus);
        console.log('voltage:', voltage);
    };

    const handleApplyFaults = () => {
        console.log('=== Fault Triggers Applied ===');
        console.log('faultTriggers:', JSON.stringify({ ...faultTriggers, totalActive: totalFaults }, null, 2));

        // Map fault triggers to DTC codes and update DTC status
        // Powertrain DTCs
        updateDTCStatus(0x010101, faultTriggers.powertrain.mafFault, vehicleState);           // P0101 - MAF Sensor
        updateDTCStatus(0x010171, faultTriggers.powertrain.coolantTempSensorFault, vehicleState); // P0171 - System Lean (coolant sensor related)
        updateDTCStatus(0x010300, faultTriggers.powertrain.misfireDetected, vehicleState);   // P0300 - Misfire
        updateDTCStatus(0x010562, faultTriggers.powertrain.fuelPressureLow, vehicleState);   // P0562 - System Voltage Low (fuel pressure)

        // Chassis DTCs
        updateDTCStatus(0x020035, faultTriggers.brakes.wheelSpeedFLFault, vehicleState);     // C0035 - Left Front Wheel Speed
        updateDTCStatus(0x020045, faultTriggers.brakes.absPumpMotorFailure, vehicleState);   // C0045 - ABS Pump Motor

        // Body DTCs - using existing codes
        updateDTCStatus(0x030056, faultTriggers.body.driverDoorSwitchStuck, vehicleState);   // B0056 - Driver Door

        // Network DTCs
        updateDTCStatus(0x040100, faultTriggers.network.canTimeoutEngineEcu, vehicleState);  // U0100 - Lost Comm ECM
        updateDTCStatus(0x040121, faultTriggers.network.canTimeoutAbs, vehicleState);        // U0121 - Lost Comm ABS
    };

    const handleResetFaults = () => {
        setFaultTriggers({
            powertrain: { mafFault: false, coolantTempSensorFault: false, throttlePositionError: false, misfireDetected: false, fuelPressureLow: false },
            brakes: { wheelSpeedFLFault: false, wheelSpeedFRFault: false, brakePressureSensorFault: false, absPumpMotorFailure: false, yawRateSensorFault: false },
            body: { driverDoorSwitchStuck: false, windowMotorFLStuck: false, wiperMotorOverload: false, centralLockControlFault: false },
            network: { canTimeoutEngineEcu: false, canTimeoutAbs: false, canBusOff: false }
        });
    };

    // Use voltage from context for battery display and telltales
    const telltales = {
        engine: Object.values(faultTriggers.powertrain).some(Boolean),
        abs: Object.values(faultTriggers.brakes).some(Boolean),
        battery: voltage < 11.5 || voltage > 15.5,
        oil: faultTriggers.powertrain.fuelPressureLow || vehicleState.oilPressure < 20,
        temp: vehicleState.coolantTemperature > 105,
        fuel: vehicleState.fuelLevel < 15,
        brake: faultTriggers.brakes.brakePressureSensorFault,
        esp: faultTriggers.brakes.yawRateSensorFault
    };

    return (
        <div className="min-h-screen relative overflow-hidden cluster-page-container">
            <div className="cyber-grid opacity-30" />
            <EnhancedBackground />

            <div className="relative z-10">
                <Header />

                <main className="container mx-auto px-4 py-4">
                    {/* Protocol State Dashboard - Below Header */}
                    <div className="protocol-dashboard mb-4">
                        <ProtocolStateDashboard />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

                        {/* MAIN CLUSTER PANEL - 4 columns */}
                        <div className="xl:col-span-4">
                            {/* Instrument Cluster */}
                            <div
                                className="relative rounded-[2rem] overflow-hidden cluster-main-panel"
                            >
                                {/* Mobile Header with Fault Toggle */}
                                <div className="xl:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
                                    <div className="text-sm font-semibold tracking-wider text-cyan-400">CLUSTER V3</div>
                                    <button
                                        onClick={() => setIsFaultPanelOpen(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium active:bg-white/10"
                                    >
                                        <span className={totalFaults > 0 ? "text-red-400" : "text-gray-400"}>
                                            {totalFaults > 0 ? `${totalFaults} Faults` : 'System OK'}
                                        </span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Top bezel with telltales - Horizontal scrollable on mobile */}
                                <div className="flex items-center justify-start xl:justify-center gap-6 xl:gap-8 px-4 py-4 border-b cluster-telltales-header overflow-x-auto no-scrollbar">
                                    <div className="flex gap-6 xl:gap-8 min-w-max mx-auto">
                                        <Telltale icon={<EngineIcon />} active={telltales.engine} color="amber" label="Check Engine" />
                                        <Telltale icon={<ABSIcon />} active={telltales.abs} color="amber" label="ABS" />
                                        <Telltale icon={<BatteryIcon />} active={telltales.battery} color="red" label="Battery" />
                                        <Telltale icon={<OilIcon />} active={telltales.oil} color="red" label="Oil" />
                                        <Telltale icon={<TempIcon />} active={telltales.temp} color="red" label="Temperature" />
                                        <Telltale icon={<FuelIcon />} active={telltales.fuel} color="amber" label="Fuel" />
                                        <Telltale icon={<BrakeIcon />} active={telltales.brake} color="red" label="Brake" />
                                        <Telltale icon={<ESPIcon />} active={telltales.esp} color="amber" label="ESP" />
                                    </div>
                                </div>

                                {/* Main gauge area - Responsive Grid/Stack */}
                                <div className="flex flex-col xl:flex-row items-center justify-center py-6 px-4 gap-8 xl:gap-0">
                                    {/* Left - RPM Gauge */}
                                    <div className="flex-shrink-0 w-[200px] xl:w-[260px] order-2 xl:order-1">
                                        <PremiumGauge
                                            value={vehicleState.engineRpm}
                                            min={0}
                                            max={10000}
                                            label="RPM"
                                            redZoneStart={7000}
                                            isRpm={true}
                                        />
                                    </div>

                                    {/* Center - Digital Display */}
                                    <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-8 w-full max-w-[350px] order-1 xl:order-2">
                                        {/* Large Speed Display */}
                                        <div className="text-center mb-4">
                                            <div
                                                className="text-7xl lg:text-8xl font-extralight tabular-nums tracking-tight cluster-speed-display"
                                                style={{
                                                    fontFamily: "'Inter', sans-serif"
                                                }}
                                            >
                                                {Math.round(vehicleState.vehicleSpeedKph)}
                                            </div>
                                            <div className="text-sm cluster-text-secondary tracking-[0.3em] mt-1">KM/H</div>
                                        </div>

                                        {/* Vehicle Status Info */}
                                        <div className="grid grid-cols-2 gap-2 w-full cluster-status-panel rounded-xl p-3 border">
                                            <StatusItem
                                                icon={<BatteryIcon />}
                                                label="Voltage"
                                                value={voltage.toFixed(1)}
                                                unit="V"
                                                warning={voltage < 11.5}
                                            />
                                            <StatusItem
                                                icon={<TempIcon />}
                                                label="Coolant"
                                                value={vehicleState.coolantTemperature.toString()}
                                                unit="°C"
                                                warning={vehicleState.coolantTemperature > 105}
                                            />
                                            <StatusItem
                                                icon={<OilIcon />}
                                                label="Oil Press"
                                                value={vehicleState.oilPressure.toString()}
                                                unit="psi"
                                                warning={vehicleState.oilPressure < 20}
                                            />
                                            <StatusItem
                                                icon={<FuelIcon />}
                                                label="Fuel"
                                                value={vehicleState.fuelLevel.toString()}
                                                unit="%"
                                                warning={vehicleState.fuelLevel < 15}
                                            />
                                        </div>

                                        {/* Ignition */}
                                        <div className="mt-4">
                                            <IgnitionSwitch
                                                status={ignitionStatus}
                                                onChange={handleIgnitionChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Right - Speed Gauge + PRND */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center gap-4 w-full xl:w-auto order-3">
                                        <div className="w-[200px] xl:w-[260px]">
                                            <PremiumGauge
                                                value={vehicleState.vehicleSpeedKph}
                                                min={0}
                                                max={280}
                                                label="KM/H"
                                            />
                                        </div>
                                        <div className="-mt-4 relative z-10">
                                            <GearSelector
                                                gear={vehicleState.gearPosition}
                                                onChange={(g) => updateVehicle('gearPosition', g)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom controls */}
                                <div className="px-6 pb-6 pt-4 border-t border-white/5 bg-black/20">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="cluster-control-slider rounded-lg p-3 border">
                                            <label className="text-[10px] cluster-control-label uppercase tracking-wider">Engine RPM</label>
                                            <input
                                                type="range" min="0" max="10000" step="100"
                                                value={vehicleState.engineRpm}
                                                onChange={(e) => updateVehicle('engineRpm', Number(e.target.value))}
                                                className="w-full mt-1 accent-cyan-500"
                                            />
                                            <div className="text-center text-xs cluster-control-value mt-1">{vehicleState.engineRpm}</div>
                                        </div>
                                        <div className="cluster-control-slider rounded-lg p-3 border">
                                            <label className="text-[10px] cluster-control-label uppercase tracking-wider">Speed</label>
                                            <input
                                                type="range" min="0" max="280"
                                                value={vehicleState.vehicleSpeedKph}
                                                onChange={(e) => updateVehicle('vehicleSpeedKph', Number(e.target.value))}
                                                className="w-full mt-1 accent-cyan-500"
                                            />
                                            <div className="text-center text-xs cluster-control-value mt-1">{vehicleState.vehicleSpeedKph} km/h</div>
                                        </div>
                                        <div className="cluster-control-slider rounded-lg p-3 border">
                                            <label className="text-[10px] cluster-control-label uppercase tracking-wider">Coolant</label>
                                            <input
                                                type="range" min="-40" max="130"
                                                value={vehicleState.coolantTemperature}
                                                onChange={(e) => updateVehicle('coolantTemperature', Number(e.target.value))}
                                                className="w-full mt-1 accent-red-500"
                                            />
                                            <div className="text-center text-xs cluster-control-value mt-1">{vehicleState.coolantTemperature}°C</div>
                                        </div>
                                        <div className="cluster-control-slider rounded-lg p-3 border">
                                            <label className="text-[10px] cluster-control-label uppercase tracking-wider">Fuel Level</label>
                                            <input
                                                type="range" min="0" max="100"
                                                value={vehicleState.fuelLevel}
                                                onChange={(e) => updateVehicle('fuelLevel', Number(e.target.value))}
                                                className="w-full mt-1 accent-green-500"
                                            />
                                            <div className="text-center text-xs cluster-control-value mt-1">{vehicleState.fuelLevel}%</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleApplyConditions}
                                        className="w-full mt-3 py-2.5 cluster-apply-btn text-sm font-medium rounded-lg transition-all"
                                    >
                                        Apply Operating Conditions
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* FAULT TRIGGERS PANEL - Desktop Sidebar / Mobile Drawer */}
                        {/* Mobile Drawer Overlay */}
                        <div
                            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] transition-opacity xl:hidden ${isFaultPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            onClick={() => setIsFaultPanelOpen(false)}
                        />

                        {/* Panel Content - Sidebar on desktop, Slide-up drawer on mobile */}
                        <div className={`
                            fixed xl:static bottom-0 left-0 right-0 z-[100] 
                            bg-[#121214] xl:bg-transparent 
                            border-t xl:border-none border-white/10 
                            rounded-t-2xl xl:rounded-xl 
                            p-4 xl:p-3 
                            cluster-fault-panel 
                            transform transition-transform duration-300 ease-out xl:transform-none
                            ${isFaultPanelOpen ? 'translate-y-0' : 'translate-y-full xl:translate-y-0'}
                            max-h-[80vh] xl:max-h-none overflow-hidden flex flex-col
                        `}>
                            <div className="flex items-center justify-between mb-4 xl:mb-3">
                                <div className='flex items-center gap-2'>
                                    <h2 className="text-xs font-medium cluster-fault-header uppercase tracking-wider">Fault Injection</h2>
                                    {/* Mobile Drag Handle */}
                                    <div className="xl:hidden w-12 h-1 bg-white/10 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                                </div>
                                {totalFaults > 0 && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                                        {totalFaults}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                <FaultSection title="Powertrain" activeCount={countFaults('powertrain')}>
                                    <FaultToggle label="MAF Sensor" checked={faultTriggers.powertrain.mafFault} onChange={(v) => updateFault('powertrain', 'mafFault', v)} />
                                    <FaultToggle label="Coolant Sensor" checked={faultTriggers.powertrain.coolantTempSensorFault} onChange={(v) => updateFault('powertrain', 'coolantTempSensorFault', v)} />
                                    <FaultToggle label="Throttle Error" checked={faultTriggers.powertrain.throttlePositionError} onChange={(v) => updateFault('powertrain', 'throttlePositionError', v)} />
                                    <FaultToggle label="Misfire" checked={faultTriggers.powertrain.misfireDetected} onChange={(v) => updateFault('powertrain', 'misfireDetected', v)} />
                                    <FaultToggle label="Fuel Pressure" checked={faultTriggers.powertrain.fuelPressureLow} onChange={(v) => updateFault('powertrain', 'fuelPressureLow', v)} />
                                </FaultSection>

                                <FaultSection title="Brakes/ABS/ESP" activeCount={countFaults('brakes')}>
                                    <FaultToggle label="Wheel Speed FL" checked={faultTriggers.brakes.wheelSpeedFLFault} onChange={(v) => updateFault('brakes', 'wheelSpeedFLFault', v)} />
                                    <FaultToggle label="Wheel Speed FR" checked={faultTriggers.brakes.wheelSpeedFRFault} onChange={(v) => updateFault('brakes', 'wheelSpeedFRFault', v)} />
                                    <FaultToggle label="Brake Pressure" checked={faultTriggers.brakes.brakePressureSensorFault} onChange={(v) => updateFault('brakes', 'brakePressureSensorFault', v)} />
                                    <FaultToggle label="ABS Pump" checked={faultTriggers.brakes.absPumpMotorFailure} onChange={(v) => updateFault('brakes', 'absPumpMotorFailure', v)} />
                                    <FaultToggle label="Yaw Rate" checked={faultTriggers.brakes.yawRateSensorFault} onChange={(v) => updateFault('brakes', 'yawRateSensorFault', v)} />
                                </FaultSection>

                                <FaultSection title="Body/Comfort" activeCount={countFaults('body')}>
                                    <FaultToggle label="Door Switch" checked={faultTriggers.body.driverDoorSwitchStuck} onChange={(v) => updateFault('body', 'driverDoorSwitchStuck', v)} />
                                    <FaultToggle label="Window Motor" checked={faultTriggers.body.windowMotorFLStuck} onChange={(v) => updateFault('body', 'windowMotorFLStuck', v)} />
                                    <FaultToggle label="Wiper Motor" checked={faultTriggers.body.wiperMotorOverload} onChange={(v) => updateFault('body', 'wiperMotorOverload', v)} />
                                    <FaultToggle label="Central Lock" checked={faultTriggers.body.centralLockControlFault} onChange={(v) => updateFault('body', 'centralLockControlFault', v)} />
                                </FaultSection>

                                <FaultSection title="Network/CAN" activeCount={countFaults('network')}>
                                    <FaultToggle label="CAN Engine" checked={faultTriggers.network.canTimeoutEngineEcu} onChange={(v) => updateFault('network', 'canTimeoutEngineEcu', v)} />
                                    <FaultToggle label="CAN ABS" checked={faultTriggers.network.canTimeoutAbs} onChange={(v) => updateFault('network', 'canTimeoutAbs', v)} />
                                    <FaultToggle label="CAN Bus-Off" checked={faultTriggers.network.canBusOff} onChange={(v) => updateFault('network', 'canBusOff', v)} />
                                </FaultSection>
                            </div>

                            <div className="flex gap-2 mt-3 pt-3 border-t cluster-footer-divider">
                                <button
                                    onClick={handleApplyFaults}
                                    className="flex-1 py-2 cluster-inject-btn text-xs font-medium rounded-lg transition-all hover:opacity-90"
                                >
                                    Inject
                                </button>
                                <button
                                    onClick={handleResetFaults}
                                    className="px-3 py-2 cluster-reset-btn text-xs rounded-lg transition-all hover:opacity-90"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DTC Management Panel - SID 19 Support */}
                    <div className="dtc-management-panel mt-4">
                        <DTCManagementPanel />
                    </div>
                </main>
            </div>
        </div>
    );
};
