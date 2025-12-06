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
import Header from '../components/Header';
import EnhancedBackground from '../components/EnhancedBackground';

// ========================================
// TYPE DEFINITIONS
// ========================================

type IgnitionStatus = 'OFF' | 'ACC' | 'ON' | 'CRANK';
type GearPosition = 'P' | 'R' | 'N' | 'D' | '1' | '2' | '3';

interface VehicleState {
    ignitionStatus: IgnitionStatus;
    gearPosition: GearPosition;
    engineRpm: number;
    vehicleSpeedKph: number;
    batteryVoltage12V: number;
    coolantTemperature: number;
    fuelLevel: number;
    oilPressure: number;
}

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
}

const PremiumGauge: React.FC<PremiumGaugeProps> = ({
    value,
    min,
    max,
    label,
    size = 280,
    redZoneStart,
    isRpm = false
}) => {
    const center = size / 2;
    const outerRadius = size / 2 - 15;
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

        const x1 = center + Math.cos(angle) * tickInnerRadius;
        const y1 = center + Math.sin(angle) * tickInnerRadius;
        const x2 = center + Math.cos(angle) * tickOuterRadius;
        const y2 = center + Math.sin(angle) * tickOuterRadius;

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
            const labelX = center + Math.cos(angle) * labelRadius;
            const labelY = center + Math.sin(angle) * labelRadius;
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

        const x1 = center + Math.cos(startRad) * arcRadius;
        const y1 = center + Math.sin(startRad) * arcRadius;
        const x2 = center + Math.cos(endRad) * arcRadius;
        const y2 = center + Math.sin(endRad) * arcRadius;

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
    const needleTipX = center + Math.cos(needleAngle) * needleLength;
    const needleTipY = center + Math.sin(needleAngle) * needleLength;

    const isInRed = redZoneStart !== undefined && value >= redZoneStart;
    const needleColor = isInRed ? '#ff3b30' : '#00d4ff';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    {/* Outer ring gradient */}
                    <linearGradient id={`bezel-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3a3a40" />
                        <stop offset="50%" stopColor="#1a1a1f" />
                        <stop offset="100%" stopColor="#2a2a30" />
                    </linearGradient>
                    {/* Inner gradient */}
                    <radialGradient id={`inner-${label}`} cx="30%" cy="30%">
                        <stop offset="0%" stopColor="#1a1a1f" />
                        <stop offset="100%" stopColor="#0a0a0d" />
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
                    cx={center} cy={center} r={outerRadius + 3}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth="1"
                    opacity="0.3"
                    filter={`url(#bezel-glow-${label})`}
                />

                {/* Outer bezel */}
                <circle
                    cx={center} cy={center} r={outerRadius}
                    fill={`url(#inner-${label})`}
                    stroke={`url(#bezel-${label})`}
                    strokeWidth="8"
                />

                {/* Inner circle */}
                <circle
                    cx={center} cy={center} r={innerRadius - 30}
                    fill="#0a0a0d"
                    stroke="#222"
                    strokeWidth="1"
                />

                {/* Red zone arc */}
                {redArc}

                {/* Tick marks and labels */}
                {ticks}

                {/* Needle */}
                <line
                    x1={center}
                    y1={center}
                    x2={needleTipX}
                    y2={needleTipY}
                    stroke={needleColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={`url(#needle-glow-${label})`}
                    style={{ transition: 'all 0.15s ease-out' }}
                />

                {/* Center hub */}
                <circle cx={center} cy={center} r="18" fill="#1a1a1f" stroke="#333" strokeWidth="3" />
                <circle cx={center} cy={center} r="8" fill="#333" />
            </svg>

            {/* Label at bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-sm text-gray-500 uppercase tracking-[0.2em] font-medium">
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
                className="w-6 h-6 transition-all duration-300"
                style={{
                    color: active ? c.on : '#2a2a2f',
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
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
            <div className={`text-lg font-semibold tabular-nums ${warning ? 'text-red-400' : 'text-white'}`}>
                {value}<span className="text-xs text-gray-500 ml-1">{unit}</span>
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
        <div className="flex flex-col items-center gap-1">
            {mainGears.map((g) => (
                <button
                    key={g}
                    onClick={() => onChange(g)}
                    className={`w-12 h-10 flex items-center justify-center text-xl font-bold transition-all duration-200 rounded ${gear === g
                        ? 'text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(48,209,88,0.3)]'
                        : 'text-gray-600 hover:text-gray-400'
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
        <div className="flex gap-1 bg-black/50 rounded-lg p-1">
            {statuses.map((s) => (
                <button
                    key={s}
                    onClick={() => onChange(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${status === s ? 'scale-105' : 'opacity-40 hover:opacity-70'}`}
                    style={{
                        backgroundColor: status === s ? `${colors[s]}20` : 'transparent',
                        color: status === s ? colors[s] : '#666',
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
        <span className={`text-xs transition-colors ${checked ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
            {label}
        </span>
        <div
            className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${checked ? 'bg-red-500' : 'bg-gray-700'}`}
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
        <div className="border border-gray-800/50 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
            >
                <span className="text-xs font-medium text-gray-400">{title}</span>
                <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                            {activeCount}
                        </span>
                    )}
                    <svg className={`w-3 h-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {open && <div className="px-2.5 pb-2.5 border-t border-gray-800/50">{children}</div>}
        </div>
    );
};

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export const ClusterDashboardPage: React.FC = () => {
    const [vehicleState, setVehicleState] = useState<VehicleState>({
        ignitionStatus: 'ON',
        gearPosition: 'D',
        engineRpm: 3200,
        vehicleSpeedKph: 85,
        batteryVoltage12V: 14.2,
        coolantTemperature: 88,
        fuelLevel: 72,
        oilPressure: 45
    });

    const [faultTriggers, setFaultTriggers] = useState<FaultTriggers>({
        powertrain: { mafFault: false, coolantTempSensorFault: false, throttlePositionError: false, misfireDetected: false, fuelPressureLow: false },
        brakes: { wheelSpeedFLFault: false, wheelSpeedFRFault: false, brakePressureSensorFault: false, absPumpMotorFailure: false, yawRateSensorFault: false },
        body: { driverDoorSwitchStuck: false, windowMotorFLStuck: false, wiperMotorOverload: false, centralLockControlFault: false },
        network: { canTimeoutEngineEcu: false, canTimeoutAbs: false, canBusOff: false }
    });

    const updateVehicle = <K extends keyof VehicleState>(key: K, value: VehicleState[K]) => {
        setVehicleState(prev => ({ ...prev, [key]: value }));
    };

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

    // INTEGRATION POINT
    const handleApplyConditions = () => {
        console.log('=== Operating Conditions Applied ===');
        console.log('vehicleState:', JSON.stringify(vehicleState, null, 2));
    };

    const handleApplyFaults = () => {
        console.log('=== Fault Triggers Applied ===');
        console.log('faultTriggers:', JSON.stringify({ ...faultTriggers, totalActive: totalFaults }, null, 2));
    };

    const handleResetFaults = () => {
        setFaultTriggers({
            powertrain: { mafFault: false, coolantTempSensorFault: false, throttlePositionError: false, misfireDetected: false, fuelPressureLow: false },
            brakes: { wheelSpeedFLFault: false, wheelSpeedFRFault: false, brakePressureSensorFault: false, absPumpMotorFailure: false, yawRateSensorFault: false },
            body: { driverDoorSwitchStuck: false, windowMotorFLStuck: false, wiperMotorOverload: false, centralLockControlFault: false },
            network: { canTimeoutEngineEcu: false, canTimeoutAbs: false, canBusOff: false }
        });
    };

    const telltales = {
        engine: Object.values(faultTriggers.powertrain).some(Boolean),
        abs: Object.values(faultTriggers.brakes).some(Boolean),
        battery: vehicleState.batteryVoltage12V < 11.5 || vehicleState.batteryVoltage12V > 15.5,
        oil: faultTriggers.powertrain.fuelPressureLow || vehicleState.oilPressure < 20,
        temp: vehicleState.coolantTemperature > 105,
        fuel: vehicleState.fuelLevel < 15,
        brake: faultTriggers.brakes.brakePressureSensorFault,
        esp: faultTriggers.brakes.yawRateSensorFault
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#050508]">
            <div className="cyber-grid opacity-30" />
            <EnhancedBackground />

            <div className="relative z-10">
                <Header />

                <main className="container mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

                        {/* MAIN CLUSTER PANEL - 4 columns */}
                        <div className="xl:col-span-4">
                            {/* Instrument Cluster */}
                            <div
                                className="relative rounded-[2rem] overflow-hidden"
                                style={{
                                    background: 'linear-gradient(180deg, #0c0c10 0%, #050508 100%)',
                                    boxShadow: '0 0 60px rgba(0, 212, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Top bezel with telltales */}
                                <div className="flex items-center justify-center gap-8 py-4 border-b border-gray-800/30">
                                    <Telltale icon={<EngineIcon />} active={telltales.engine} color="amber" label="Check Engine" />
                                    <Telltale icon={<ABSIcon />} active={telltales.abs} color="amber" label="ABS" />
                                    <Telltale icon={<BatteryIcon />} active={telltales.battery} color="red" label="Battery" />
                                    <Telltale icon={<OilIcon />} active={telltales.oil} color="red" label="Oil" />
                                    <Telltale icon={<TempIcon />} active={telltales.temp} color="red" label="Temperature" />
                                    <Telltale icon={<FuelIcon />} active={telltales.fuel} color="amber" label="Fuel" />
                                    <Telltale icon={<BrakeIcon />} active={telltales.brake} color="red" label="Brake" />
                                    <Telltale icon={<ESPIcon />} active={telltales.esp} color="amber" label="ESP" />
                                </div>

                                {/* Main gauge area */}
                                <div className="flex items-center justify-center py-6 px-4 gap-2 lg:gap-0">
                                    {/* Left - RPM Gauge */}
                                    <div className="flex-shrink-0">
                                        <PremiumGauge
                                            value={vehicleState.engineRpm}
                                            min={0}
                                            max={10000}
                                            label="RPM"
                                            size={260}
                                            redZoneStart={7000}
                                            isRpm={true}
                                        />
                                    </div>

                                    {/* Center - Digital Display */}
                                    <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-8 min-w-[200px] max-w-[350px]">
                                        {/* Large Speed Display */}
                                        <div className="text-center mb-4">
                                            <div
                                                className="text-7xl lg:text-8xl font-extralight tabular-nums tracking-tight"
                                                style={{
                                                    color: '#00d4ff',
                                                    textShadow: '0 0 40px rgba(0, 212, 255, 0.4)',
                                                    fontFamily: "'Inter', sans-serif"
                                                }}
                                            >
                                                {Math.round(vehicleState.vehicleSpeedKph)}
                                            </div>
                                            <div className="text-sm text-gray-500 tracking-[0.3em] mt-1">KM/H</div>
                                        </div>

                                        {/* Vehicle Status Info */}
                                        <div className="grid grid-cols-2 gap-2 w-full bg-black/40 rounded-xl p-3 border border-gray-800/50">
                                            <StatusItem
                                                icon={<BatteryIcon />}
                                                label="Voltage"
                                                value={vehicleState.batteryVoltage12V.toFixed(1)}
                                                unit="V"
                                                warning={vehicleState.batteryVoltage12V < 11.5}
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
                                                status={vehicleState.ignitionStatus}
                                                onChange={(s) => updateVehicle('ignitionStatus', s)}
                                            />
                                        </div>
                                    </div>

                                    {/* Right - Speed Gauge + PRND */}
                                    <div className="flex-shrink-0 flex items-center gap-4">
                                        <PremiumGauge
                                            value={vehicleState.vehicleSpeedKph}
                                            min={0}
                                            max={280}
                                            label="KM/H"
                                            size={260}
                                        />
                                        <GearSelector
                                            gear={vehicleState.gearPosition}
                                            onChange={(g) => updateVehicle('gearPosition', g)}
                                        />
                                    </div>
                                </div>

                                {/* Bottom controls */}
                                <div className="px-6 pb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-black/40 rounded-lg p-3 border border-gray-800/30">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Engine RPM</label>
                                            <input
                                                type="range" min="0" max="10000" step="100"
                                                value={vehicleState.engineRpm}
                                                onChange={(e) => updateVehicle('engineRpm', Number(e.target.value))}
                                                className="w-full mt-1 accent-cyan-500"
                                            />
                                            <div className="text-center text-xs text-gray-400 mt-1">{vehicleState.engineRpm}</div>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-3 border border-gray-800/30">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Speed</label>
                                            <input
                                                type="range" min="0" max="280"
                                                value={vehicleState.vehicleSpeedKph}
                                                onChange={(e) => updateVehicle('vehicleSpeedKph', Number(e.target.value))}
                                                className="w-full mt-1 accent-cyan-500"
                                            />
                                            <div className="text-center text-xs text-gray-400 mt-1">{vehicleState.vehicleSpeedKph} km/h</div>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-3 border border-gray-800/30">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Coolant</label>
                                            <input
                                                type="range" min="-40" max="130"
                                                value={vehicleState.coolantTemperature}
                                                onChange={(e) => updateVehicle('coolantTemperature', Number(e.target.value))}
                                                className="w-full mt-1 accent-red-500"
                                            />
                                            <div className="text-center text-xs text-gray-400 mt-1">{vehicleState.coolantTemperature}°C</div>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-3 border border-gray-800/30">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Fuel Level</label>
                                            <input
                                                type="range" min="0" max="100"
                                                value={vehicleState.fuelLevel}
                                                onChange={(e) => updateVehicle('fuelLevel', Number(e.target.value))}
                                                className="w-full mt-1 accent-green-500"
                                            />
                                            <div className="text-center text-xs text-gray-400 mt-1">{vehicleState.fuelLevel}%</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleApplyConditions}
                                        className="w-full mt-3 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
                                    >
                                        Apply Operating Conditions
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* FAULT TRIGGERS PANEL - 1 column */}
                        <div className="bg-[#0a0a0d] border border-gray-800/50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Faults</h2>
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

                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800/50">
                                <button
                                    onClick={handleApplyFaults}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all"
                                >
                                    Inject
                                </button>
                                <button
                                    onClick={handleResetFaults}
                                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
