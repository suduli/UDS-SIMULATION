/**
 * Conditions Page - Vehicle Conditions & Fault Triggers
 * REDESIGNED: Premium vehicle dashboard UI with SVG icons and enhanced aesthetics
 */

import React, { useState } from 'react';
import Header from '../components/Header';
import EnhancedBackground from '../components/EnhancedBackground';
import { ECUStatusBar } from '../components/ECUStatusBar';

// ========================================
// TYPE DEFINITIONS
// ========================================

type IgnitionStatus = 'OFF' | 'ACC' | 'ON' | 'CRANK';
type GearPosition = 'P' | 'R' | 'N' | 'D' | '1' | '2' | '3';

interface VehicleState {
    ignitionStatus: IgnitionStatus;
    vehicleSpeedKph: number;
    engineRpm: number;
    gearPosition: GearPosition;
    odometerKm: number;
    engineLoadPercent: number;
    coolantTempC: number;
    batteryVoltage: number;
    throttlePositionPercent: number;
    ambientTempC: number;
    cabinTempC: number;
}

interface FaultTriggers {
    powertrain: {
        mafFault: boolean;
        coolantTempFault: boolean;
        throttleCorrelationError: boolean;
        misfireDetected: boolean;
        fuelPressureLow: boolean;
    };
    brakes: {
        wheelSpeedFL: boolean;
        wheelSpeedFR: boolean;
        brakePressureSensor: boolean;
        absPumpMotor: boolean;
        yawRateSensor: boolean;
    };
    body: {
        driverDoorSwitchStuck: boolean;
        windowMotorFL: boolean;
        wiperMotorOverload: boolean;
        centralLockFault: boolean;
    };
    network: {
        canTimeoutEngineEcu: boolean;
        canTimeoutAbs: boolean;
        canBusOff: boolean;
    };
}

// ========================================
// VALIDATION HELPERS
// ========================================

// Field limits for validation
const FIELD_LIMITS: Record<string, { min: number; max: number }> = {
    vehicleSpeedKph: { min: 0, max: 250 },
    engineRpm: { min: 0, max: 8000 },
    odometerKm: { min: 0, max: 9999999 },
    engineLoadPercent: { min: 0, max: 100 },
    coolantTempC: { min: -40, max: 150 },
    batteryVoltage: { min: 0, max: 20 },
    throttlePositionPercent: { min: 0, max: 100 },
    ambientTempC: { min: -40, max: 60 },
    cabinTempC: { min: -20, max: 80 },
};

// Clamp a value to min/max range
const clampValue = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

// Check if value is within valid range
const isValidValue = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
};

// ========================================
// CORRECTION TOAST COMPONENT
// ========================================

interface ToastMessage {
    id: number;
    message: string;
}

const CorrectionToast: React.FC<{ messages: ToastMessage[]; onDismiss: (id: number) => void }> = ({ messages, onDismiss }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
            {messages.map((toast) => (
                <div
                    key={toast.id}
                    className="flex items-center gap-3 px-4 py-3 bg-amber-500/90 backdrop-blur-sm text-white rounded-lg shadow-lg shadow-amber-500/30 animate-slide-in-right"
                    onAnimationEnd={() => setTimeout(() => onDismiss(toast.id), 2000)}
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button onClick={() => onDismiss(toast.id)} className="ml-2 hover:opacity-70">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

// Custom hook for toast management
const useCorrectionToast = () => {
    const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
    const idRef = React.useRef(0);

    const showToast = React.useCallback((message: string) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message }]);
    }, []);

    const dismissToast = React.useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, dismissToast };
};

// ========================================
// VALIDATED NUMERIC INPUT COMPONENT
// ========================================

interface ValidatedNumericInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (value: number) => void;
    inputWidth?: string;
    onCorrected?: (original: number, corrected: number) => void;
}

const ValidatedNumericInput: React.FC<ValidatedNumericInputProps> = ({
    label, value, min, max, step = 1, unit, onChange, inputWidth = 'w-20', onCorrected
}) => {
    const [inputValue, setInputValue] = React.useState(String(value));
    const [hasError, setHasError] = React.useState(false);
    const [showCorrectionFlash, setShowCorrectionFlash] = React.useState(false);

    React.useEffect(() => {
        setInputValue(String(value));
        setHasError(!isValidValue(value, min, max));
    }, [value, min, max]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setInputValue(rawValue);
        const numValue = Number(rawValue);
        if (!isNaN(numValue)) {
            setHasError(!isValidValue(numValue, min, max));
        }
    };

    const handleBlur = () => {
        const numValue = Number(inputValue);
        if (!isNaN(numValue)) {
            const clamped = clampValue(numValue, min, max);
            if (clamped !== numValue) {
                // Value was corrected - show flash and notify
                setShowCorrectionFlash(true);
                setTimeout(() => setShowCorrectionFlash(false), 600);
                onCorrected?.(numValue, clamped);
            }
            onChange(clamped);
            setInputValue(String(clamped));
            setHasError(false);
        } else {
            setInputValue(String(value));
            setHasError(false);
        }
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${showCorrectionFlash ? 'bg-amber-500/20 border-2 border-amber-500 animate-pulse' :
            hasError ? 'bg-red-500/10 border border-red-500/50' : 'bg-dark-700/50'
            }`}>
            <div>
                <span className={`text-sm ${hasError ? 'text-red-400' : 'text-gray-400'}`}>{label}</span>
                {hasError && (
                    <p className="text-[10px] text-red-400 mt-0.5">Range: {min} - {max}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={inputValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={hasError}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    className={`${inputWidth} px-2 py-1 text-right text-sm font-mono rounded transition-all focus:outline-none ${showCorrectionFlash ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-200' :
                        hasError
                            ? 'bg-red-500/20 border-2 border-red-500 text-red-300 focus:border-red-400'
                            : 'bg-dark-600 border border-dark-500 text-gray-200 focus:border-cyan-500'
                        }`}
                />
                <span className="text-xs text-gray-500">{unit}</span>
            </div>
        </div>
    );
};

// ========================================
// VEHICLE SVG ICON COMPONENT
// ========================================

const VehicleSVG: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car Body - Modern sedan silhouette */}
        <path
            d="M15 35 L25 35 L30 25 L45 18 L75 18 L90 25 L95 35 L105 35 L105 42 L100 42 L100 45 L85 45 L85 42 L35 42 L35 45 L20 45 L20 42 L15 42 Z"
            fill="url(#carGradient)"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Windows */}
        <path
            d="M32 26 L44 20 L74 20 L88 26 L85 33 L35 33 Z"
            fill="url(#windowGradient)"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.8"
        />
        {/* Window divider */}
        <line x1="60" y1="20" x2="60" y2="33" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
        {/* Front wheel */}
        <circle cx="27" cy="42" r="8" fill="url(#wheelGradient)" stroke="currentColor" strokeWidth="1" />
        <circle cx="27" cy="42" r="4" fill="#1a1a24" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="27" cy="42" r="1.5" fill="currentColor" opacity="0.5" />
        {/* Rear wheel */}
        <circle cx="93" cy="42" r="8" fill="url(#wheelGradient)" stroke="currentColor" strokeWidth="1" />
        <circle cx="93" cy="42" r="4" fill="#1a1a24" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="93" cy="42" r="1.5" fill="currentColor" opacity="0.5" />
        {/* Headlight */}
        <ellipse cx="17" cy="36" rx="3" ry="2" fill="url(#lightGradient)" opacity="0.9" />
        {/* Taillight */}
        <ellipse cx="103" cy="36" rx="2" ry="2" fill="#ff4444" opacity="0.8" />
        {/* Door handle */}
        <rect x="48" y="28" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
        {/* Side mirror */}
        <ellipse cx="32" cy="25" rx="2" ry="1.5" fill="currentColor" opacity="0.3" />
        {/* Gradients */}
        <defs>
            <linearGradient id="carGradient" x1="15" y1="18" x2="15" y2="45">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="windowGradient" x1="60" y1="20" x2="60" y2="33">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="wheelGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="lightGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
        </defs>
    </svg>
);

// ========================================
// GAUGE COMPONENT - Circular gauge display
// ========================================

interface GaugeProps {
    value: number;
    max: number;
    label: string;
    unit: string;
    color: string;
    size?: 'sm' | 'md' | 'lg';
}

const Gauge: React.FC<GaugeProps> = ({ value, max, label, unit, color, size = 'md' }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

    const sizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-32 h-32',
        lg: 'w-40 h-40',
    };

    return (
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
            <svg className="w-full h-full -rotate-135" viewBox="0 0 100 100">
                {/* Background arc */}
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference * 0.75} ${circumference}`}
                    className="text-dark-700"
                />
                {/* Value arc */}
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference * 0.75} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-100" style={{ textShadow: `0 0 10px ${color}` }}>
                    {value}
                </span>
                <span className="text-xs text-gray-400">{unit}</span>
                <span className="text-[10px] text-gray-500 mt-1">{label}</span>
            </div>
        </div>
    );
};

// ========================================
// DASHBOARD STAT CARD
// ========================================

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    unit?: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, unit, color }) => (
    <div className="bg-dark-800/80 backdrop-blur-sm border border-dark-600/50 rounded-xl p-4 hover:border-opacity-80 transition-all group"
        style={{ borderColor: `${color}30` }}>
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-semibold text-gray-100">
                    {value}
                    {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
                </p>
            </div>
        </div>
    </div>
);

// ========================================
// IGNITION KEY COMPONENT
// ========================================

interface IgnitionKeyProps {
    status: IgnitionStatus;
    onChange: (status: IgnitionStatus) => void;
}

const IgnitionKey: React.FC<IgnitionKeyProps> = ({ status, onChange }) => {
    const positions: IgnitionStatus[] = ['OFF', 'ACC', 'ON', 'CRANK'];
    const currentIndex = positions.indexOf(status);
    const rotation = currentIndex * 45 - 45;

    const statusColors = {
        OFF: '#6b7280',
        ACC: '#f59e0b',
        ON: '#10b981',
        CRANK: '#3b82f6',
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-28 h-28">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full bg-dark-700 border-4 border-dark-600 shadow-inner" />
                {/* Position markers */}
                {positions.map((pos, i) => {
                    const angle = (i * 45 - 45) * (Math.PI / 180);
                    const x = 50 + Math.cos(angle) * 38;
                    const y = 50 + Math.sin(angle) * 38;
                    return (
                        <button
                            key={pos}
                            onClick={() => onChange(pos)}
                            className={`absolute text-[10px] font-bold transition-all ${status === pos ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                textShadow: status === pos ? `0 0 10px ${statusColors[pos]}` : 'none',
                            }}
                        >
                            {pos}
                        </button>
                    );
                })}
                {/* Center key indicator */}
                <div className="absolute inset-6 rounded-full bg-dark-800 border-2 border-dark-500 flex items-center justify-center">
                    <div
                        className="w-1 h-10 rounded-full transition-transform duration-300"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            background: `linear-gradient(180deg, ${statusColors[status]} 0%, ${statusColors[status]}50 100%)`,
                            boxShadow: `0 0 12px ${statusColors[status]}`,
                        }}
                    />
                </div>
            </div>
            <span className="text-sm font-medium" style={{ color: statusColors[status] }}>
                Ignition: {status}
            </span>
        </div>
    );
};

// ========================================
// GEAR SELECTOR COMPONENT
// ========================================

interface GearSelectorProps {
    position: GearPosition;
    onChange: (position: GearPosition) => void;
}

const GearSelector: React.FC<GearSelectorProps> = ({ position, onChange }) => {
    const gears: GearPosition[] = ['P', 'R', 'N', 'D', '1', '2', '3'];

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-1 flex flex-col gap-1">
                {gears.map((gear) => (
                    <button
                        key={gear}
                        onClick={() => onChange(gear)}
                        className={`w-12 h-8 rounded-lg font-bold text-sm transition-all ${position === gear
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-gray-200'
                            }`}
                    >
                        {gear}
                    </button>
                ))}
            </div>
            <span className="text-xs text-gray-500">Gear Position</span>
        </div>
    );
};

// ========================================
// ENHANCED SLIDER COMPONENT WITH VALIDATION
// ========================================

interface EnhancedSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    color: string;
    icon?: React.ReactNode;
    onChange: (value: number) => void;
}

const EnhancedSlider: React.FC<EnhancedSliderProps> = ({
    label, value, min, max, step = 1, unit, color, icon, onChange
}) => {
    const [inputValue, setInputValue] = useState(String(value));
    const [hasError, setHasError] = useState(false);

    // Sync input when external value changes
    React.useEffect(() => {
        setInputValue(String(value));
        setHasError(!isValidValue(value, min, max));
    }, [value, min, max]);

    const clampedValue = clampValue(value, min, max);
    const percentage = Math.max(0, Math.min(100, ((clampedValue - min) / (max - min)) * 100));
    const isOutOfRange = value < min || value > max;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setInputValue(rawValue);

        const numValue = Number(rawValue);
        if (!isNaN(numValue)) {
            setHasError(!isValidValue(numValue, min, max));
        }
    };

    const handleInputBlur = () => {
        const numValue = Number(inputValue);
        if (!isNaN(numValue)) {
            // Clamp value on blur
            const clamped = clampValue(numValue, min, max);
            onChange(clamped);
            setInputValue(String(clamped));
            setHasError(false);
        } else {
            // Reset to current value if invalid
            setInputValue(String(value));
            setHasError(false);
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = Number(e.target.value);
        onChange(numValue);
        setInputValue(String(numValue));
        setHasError(false);
    };

    return (
        <div className={`bg-dark-800/60 backdrop-blur-sm border rounded-xl p-4 space-y-3 transition-all ${hasError ? 'border-red-500/70 shadow-red-500/20 shadow-lg' : 'border-dark-600/50'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon && <div className={hasError ? 'text-red-400' : 'text-gray-400'}>{icon}</div>}
                    <span className={`text-sm font-medium ${hasError ? 'text-red-400' : 'text-gray-300'}`}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={inputValue}
                        min={min}
                        max={max}
                        step={step}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        aria-invalid={hasError}
                        className={`w-20 px-2 py-1 text-right text-sm font-mono rounded-lg focus:outline-none transition-all ${hasError
                            ? 'bg-red-500/10 border-2 border-red-500 text-red-300 focus:border-red-400'
                            : 'bg-dark-700 border border-dark-600 text-gray-200 focus:border-cyan-500'
                            }`}
                    />
                    <span className="text-xs text-gray-500 w-10">{unit}</span>
                </div>
            </div>
            {hasError && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Value must be between {min} and {max} {unit}</span>
                </div>
            )}
            <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
                    style={{
                        width: `${percentage}%`,
                        background: isOutOfRange
                            ? 'linear-gradient(90deg, #ef444480, #ef4444)'
                            : `linear-gradient(90deg, ${color}80, ${color})`,
                        boxShadow: isOutOfRange ? '0 0 10px #ef444450' : `0 0 10px ${color}50`,
                    }}
                />
                <input
                    type="range"
                    value={clampedValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

// ========================================
// FAULT TOGGLE SWITCH
// ========================================

interface FaultToggleProps {
    label: string;
    description?: string;
    active: boolean;
    onChange: (active: boolean) => void;
}

const FaultToggle: React.FC<FaultToggleProps> = ({ label, description, active, onChange }) => (
    <label className="flex items-center justify-between p-3 bg-dark-800/40 hover:bg-dark-800/60 border border-dark-600/30 rounded-lg cursor-pointer transition-all group">
        <div className="flex-1">
            <span className={`text-sm font-medium transition-colors ${active ? 'text-red-400' : 'text-gray-300'}`}>
                {label}
            </span>
            {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
        </div>
        <div className="relative">
            <input
                type="checkbox"
                checked={active}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-all ${active ? 'bg-red-500/30 border-red-500' : 'bg-dark-600 border-dark-500'
                } border`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${active ? 'left-7 bg-red-500 shadow-lg shadow-red-500/50' : 'left-1 bg-gray-400'
                    }`} />
            </div>
        </div>
    </label>
);

// ========================================
// FAULT CATEGORY PANEL
// ========================================

interface FaultCategoryProps {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    children: React.ReactNode;
    faultCount: number;
    totalFaults: number;
}

const FaultCategory: React.FC<FaultCategoryProps> = ({
    title, icon, iconColor, children, faultCount, totalFaults
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-dark-800/40 backdrop-blur-sm border border-dark-600/50 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${iconColor}20` }}>
                        {icon}
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
                        <p className="text-xs text-gray-500">
                            {faultCount > 0 ? (
                                <span className="text-red-400">{faultCount} active</span>
                            ) : (
                                'No faults'
                            )} of {totalFaults}
                        </p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
};

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export const ConditionsPage: React.FC = () => {
    // Vehicle State
    const [vehicleState, setVehicleState] = useState<VehicleState>({
        ignitionStatus: 'OFF',
        vehicleSpeedKph: 0,
        engineRpm: 0,
        gearPosition: 'P',
        odometerKm: 12500,
        engineLoadPercent: 0,
        coolantTempC: 20,
        batteryVoltage: 12.6,
        throttlePositionPercent: 0,
        ambientTempC: 25,
        cabinTempC: 22,
    });

    // Fault Triggers
    const [faultTriggers, setFaultTriggers] = useState<FaultTriggers>({
        powertrain: {
            mafFault: false,
            coolantTempFault: false,
            throttleCorrelationError: false,
            misfireDetected: false,
            fuelPressureLow: false,
        },
        brakes: {
            wheelSpeedFL: false,
            wheelSpeedFR: false,
            brakePressureSensor: false,
            absPumpMotor: false,
            yawRateSensor: false,
        },
        body: {
            driverDoorSwitchStuck: false,
            windowMotorFL: false,
            wiperMotorOverload: false,
            centralLockFault: false,
        },
        network: {
            canTimeoutEngineEcu: false,
            canTimeoutAbs: false,
            canBusOff: false,
        },
    });

    // Update vehicle state with automatic validation/clamping for numeric fields
    const updateVehicleState = <K extends keyof VehicleState>(key: K, value: VehicleState[K]) => {
        let validatedValue = value;

        // Apply validation for numeric fields
        if (typeof value === 'number' && FIELD_LIMITS[key]) {
            const { min, max } = FIELD_LIMITS[key];
            validatedValue = clampValue(value, min, max) as VehicleState[K];
        }

        setVehicleState(prev => ({ ...prev, [key]: validatedValue }));
    };

    const updateFault = (category: keyof FaultTriggers, fault: string, value: boolean) => {
        setFaultTriggers(prev => ({
            ...prev,
            [category]: { ...prev[category], [fault]: value },
        }));
    };

    // Count active faults per category
    const countFaults = (category: keyof FaultTriggers) =>
        Object.values(faultTriggers[category]).filter(Boolean).length;

    const totalActiveFaults = Object.keys(faultTriggers).reduce(
        (sum, cat) => sum + countFaults(cat as keyof FaultTriggers), 0
    );

    const handleApplyConditions = () => {
        console.log('=== Vehicle Operating Conditions Applied ===');
        console.log('vehicleState:', JSON.stringify(vehicleState, null, 2));
    };

    const handleApplyFaults = () => {
        console.log('=== Fault Triggers Applied ===');
        console.log('faultTriggers:', JSON.stringify(faultTriggers, null, 2));
    };

    const handleResetFaults = () => {
        const resetFaults: FaultTriggers = {
            powertrain: { mafFault: false, coolantTempFault: false, throttleCorrelationError: false, misfireDetected: false, fuelPressureLow: false },
            brakes: { wheelSpeedFL: false, wheelSpeedFR: false, brakePressureSensor: false, absPumpMotor: false, yawRateSensor: false },
            body: { driverDoorSwitchStuck: false, windowMotorFL: false, wiperMotorOverload: false, centralLockFault: false },
            network: { canTimeoutEngineEcu: false, canTimeoutAbs: false, canBusOff: false },
        };
        setFaultTriggers(resetFaults);
        console.log('=== All Faults Reset ===');
    };

    // Toast notifications for value corrections
    const { toasts, showToast, dismissToast } = useCorrectionToast();

    const handleValueCorrected = (label: string, original: number, corrected: number) => {
        showToast(`${label}: ${original} → ${corrected} (adjusted to valid range)`);
    };

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                <Header />
                <ECUStatusBar />

                <main className="container mx-auto px-4 py-6 lg:py-8">
                    {/* Hero Header with Vehicle */}
                    <div className="relative mb-8 p-6 lg:p-8 bg-gradient-to-br from-dark-800/90 via-dark-800/70 to-dark-900/90 backdrop-blur-md border border-dark-600/50 rounded-2xl overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

                        <div className="relative flex flex-col lg:flex-row items-center gap-6">
                            {/* Vehicle Illustration */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
                                <VehicleSVG className="w-48 lg:w-64 h-auto text-cyan-400 relative" />
                            </div>

                            {/* Title & Description */}
                            <div className="flex-1 text-center lg:text-left">
                                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                                        Vehicle Dashboard
                                    </span>
                                </h1>
                                <p className="text-gray-400 text-sm lg:text-base max-w-xl">
                                    Configure operating conditions and inject faults for UDS DTC simulation.
                                    Adjust parameters to simulate real-world vehicle states.
                                </p>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap gap-4 mt-4 justify-center lg:justify-start">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-full border border-dark-600/50">
                                        <div className={`w-2 h-2 rounded-full ${vehicleState.ignitionStatus === 'ON' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                        <span className="text-xs text-gray-300">Ignition: {vehicleState.ignitionStatus}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-full border border-dark-600/50">
                                        <span className="text-xs text-gray-300">Gear: {vehicleState.gearPosition}</span>
                                    </div>
                                    {totalActiveFaults > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/30">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-xs text-red-400">{totalActiveFaults} Active Faults</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* LEFT: Primary Gauges & Controls */}
                        <div className="xl:col-span-2 space-y-6">

                            {/* Gauges Row */}
                            <div className="bg-dark-800/60 backdrop-blur-md border border-dark-600/50 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-gray-200 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Primary Instruments
                                </h2>

                                <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6">
                                    {/* Ignition */}
                                    <IgnitionKey
                                        status={vehicleState.ignitionStatus}
                                        onChange={(v) => updateVehicleState('ignitionStatus', v)}
                                    />

                                    {/* Speed Gauge */}
                                    <Gauge
                                        value={vehicleState.vehicleSpeedKph}
                                        max={250}
                                        label="Speed"
                                        unit="km/h"
                                        color="#06b6d4"
                                        size="lg"
                                    />

                                    {/* RPM Gauge */}
                                    <Gauge
                                        value={Math.round(vehicleState.engineRpm / 100)}
                                        max={80}
                                        label="RPM"
                                        unit="x100"
                                        color="#f59e0b"
                                        size="lg"
                                    />

                                    {/* Gear Selector */}
                                    <GearSelector
                                        position={vehicleState.gearPosition}
                                        onChange={(v) => updateVehicleState('gearPosition', v)}
                                    />
                                </div>

                                {/* Speed & RPM Sliders */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <EnhancedSlider
                                        label="Vehicle Speed"
                                        value={vehicleState.vehicleSpeedKph}
                                        min={0} max={250} unit="km/h"
                                        color="#06b6d4"
                                        onChange={(v) => updateVehicleState('vehicleSpeedKph', v)}
                                    />
                                    <EnhancedSlider
                                        label="Engine RPM"
                                        value={vehicleState.engineRpm}
                                        min={0} max={8000} step={100} unit="RPM"
                                        color="#f59e0b"
                                        onChange={(v) => updateVehicleState('engineRpm', v)}
                                    />
                                </div>
                            </div>

                            {/* Powertrain & Environment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Powertrain */}
                                <div className="bg-dark-800/60 backdrop-blur-md border border-dark-600/50 rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Powertrain
                                    </h3>
                                    <div className="space-y-4">
                                        <EnhancedSlider label="Engine Load" value={vehicleState.engineLoadPercent} min={0} max={100} unit="%" color="#10b981" onChange={(v) => updateVehicleState('engineLoadPercent', v)} />
                                        <EnhancedSlider label="Coolant Temp" value={vehicleState.coolantTempC} min={-40} max={150} unit="°C" color="#ef4444" onChange={(v) => updateVehicleState('coolantTempC', v)} />
                                        <EnhancedSlider label="Throttle Position" value={vehicleState.throttlePositionPercent} min={0} max={100} unit="%" color="#8b5cf6" onChange={(v) => updateVehicleState('throttlePositionPercent', v)} />
                                        <ValidatedNumericInput
                                            label="Battery Voltage"
                                            value={vehicleState.batteryVoltage}
                                            min={0}
                                            max={20}
                                            step={0.1}
                                            unit="V"
                                            inputWidth="w-16"
                                            onChange={(v) => updateVehicleState('batteryVoltage', v)}
                                            onCorrected={(orig, corr) => handleValueCorrected('Battery Voltage', orig, corr)}
                                        />
                                    </div>
                                </div>

                                {/* Environment */}
                                <div className="bg-dark-800/60 backdrop-blur-md border border-dark-600/50 rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                        </svg>
                                        Environment
                                    </h3>
                                    <div className="space-y-4">
                                        <EnhancedSlider label="Ambient Temp" value={vehicleState.ambientTempC} min={-40} max={60} unit="°C" color="#3b82f6" onChange={(v) => updateVehicleState('ambientTempC', v)} />
                                        <EnhancedSlider label="Cabin Temp" value={vehicleState.cabinTempC} min={-20} max={80} unit="°C" color="#f97316" onChange={(v) => updateVehicleState('cabinTempC', v)} />
                                        <ValidatedNumericInput
                                            label="Odometer"
                                            value={vehicleState.odometerKm}
                                            min={0}
                                            max={9999999}
                                            step={1}
                                            unit="km"
                                            inputWidth="w-24"
                                            onChange={(v) => updateVehicleState('odometerKm', v)}
                                            onCorrected={(orig, corr) => handleValueCorrected('Odometer', orig, corr)}
                                        />
                                    </div>

                                    {/* Apply Button */}
                                    <button onClick={handleApplyConditions} className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Apply Conditions
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Fault Triggers Panel */}
                        <div className="space-y-4">
                            <div className="bg-dark-800/60 backdrop-blur-md border border-dark-600/50 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Fault Injection
                                    </h2>
                                    {totalActiveFaults > 0 && (
                                        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                                            {totalActiveFaults} Active
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Powertrain Faults */}
                                    <FaultCategory title="Powertrain" iconColor="#f97316" faultCount={countFaults('powertrain')} totalFaults={5}
                                        icon={<svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                                        <FaultToggle label="MAF Sensor" active={faultTriggers.powertrain.mafFault} onChange={(v) => updateFault('powertrain', 'mafFault', v)} />
                                        <FaultToggle label="Coolant Temp Sensor" active={faultTriggers.powertrain.coolantTempFault} onChange={(v) => updateFault('powertrain', 'coolantTempFault', v)} />
                                        <FaultToggle label="Throttle Correlation" active={faultTriggers.powertrain.throttleCorrelationError} onChange={(v) => updateFault('powertrain', 'throttleCorrelationError', v)} />
                                        <FaultToggle label="Misfire Detected" active={faultTriggers.powertrain.misfireDetected} onChange={(v) => updateFault('powertrain', 'misfireDetected', v)} />
                                        <FaultToggle label="Fuel Pressure Low" active={faultTriggers.powertrain.fuelPressureLow} onChange={(v) => updateFault('powertrain', 'fuelPressureLow', v)} />
                                    </FaultCategory>

                                    {/* Brakes Faults */}
                                    <FaultCategory title="Brakes / ABS / ESP" iconColor="#ef4444" faultCount={countFaults('brakes')} totalFaults={5}
                                        icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}>
                                        <FaultToggle label="Wheel Speed FL" active={faultTriggers.brakes.wheelSpeedFL} onChange={(v) => updateFault('brakes', 'wheelSpeedFL', v)} />
                                        <FaultToggle label="Wheel Speed FR" active={faultTriggers.brakes.wheelSpeedFR} onChange={(v) => updateFault('brakes', 'wheelSpeedFR', v)} />
                                        <FaultToggle label="Brake Pressure" active={faultTriggers.brakes.brakePressureSensor} onChange={(v) => updateFault('brakes', 'brakePressureSensor', v)} />
                                        <FaultToggle label="ABS Pump Motor" active={faultTriggers.brakes.absPumpMotor} onChange={(v) => updateFault('brakes', 'absPumpMotor', v)} />
                                        <FaultToggle label="Yaw Rate Sensor" active={faultTriggers.brakes.yawRateSensor} onChange={(v) => updateFault('brakes', 'yawRateSensor', v)} />
                                    </FaultCategory>

                                    {/* Body Faults */}
                                    <FaultCategory title="Body / Comfort" iconColor="#3b82f6" faultCount={countFaults('body')} totalFaults={4}
                                        icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                                        <FaultToggle label="Driver Door Switch" active={faultTriggers.body.driverDoorSwitchStuck} onChange={(v) => updateFault('body', 'driverDoorSwitchStuck', v)} />
                                        <FaultToggle label="Window Motor FL" active={faultTriggers.body.windowMotorFL} onChange={(v) => updateFault('body', 'windowMotorFL', v)} />
                                        <FaultToggle label="Wiper Motor" active={faultTriggers.body.wiperMotorOverload} onChange={(v) => updateFault('body', 'wiperMotorOverload', v)} />
                                        <FaultToggle label="Central Lock" active={faultTriggers.body.centralLockFault} onChange={(v) => updateFault('body', 'centralLockFault', v)} />
                                    </FaultCategory>

                                    {/* Network Faults */}
                                    <FaultCategory title="Network / CAN" iconColor="#eab308" faultCount={countFaults('network')} totalFaults={3}
                                        icon={<svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>}>
                                        <FaultToggle label="CAN Timeout - Engine" active={faultTriggers.network.canTimeoutEngineEcu} onChange={(v) => updateFault('network', 'canTimeoutEngineEcu', v)} />
                                        <FaultToggle label="CAN Timeout - ABS" active={faultTriggers.network.canTimeoutAbs} onChange={(v) => updateFault('network', 'canTimeoutAbs', v)} />
                                        <FaultToggle label="CAN Bus-Off" active={faultTriggers.network.canBusOff} onChange={(v) => updateFault('network', 'canBusOff', v)} />
                                    </FaultCategory>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <button onClick={handleApplyFaults} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-700 transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Inject Faults
                                    </button>
                                    <button onClick={handleResetFaults} className="px-4 py-3 bg-dark-700 border border-dark-500 text-gray-300 font-medium rounded-xl hover:bg-dark-600 transition-all">
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Correction Toast Notifications */}
            <CorrectionToast messages={toasts} onDismiss={dismissToast} />
        </div>
    );
};
