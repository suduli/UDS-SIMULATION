import React, { useEffect, useRef, useState } from 'react';
import { useUDS } from '../context/UDSContext';

export const PowerSupplyDashboard: React.FC = () => {
    const {
        voltage,
        current,
        powerState,
        targetVoltage,
        currentLimit,
        systemVoltage,
        faultState,
        setTargetVoltage,
        setCurrentLimit,
        setPowerState,
        setSystemVoltage,
        setFaultState,
        simulateCranking,
        // RPS State
        rpsEnabled,
        rpsPowerDownTime,
        rpsCountdown,
    } = useUDS();

    // Local state for waveform
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [history, setHistory] = useState<number[]>(new Array(100).fill(0));

    // Update waveform history
    useEffect(() => {
        setHistory(prev => {
            const next = [...prev.slice(1), voltage];
            return next;
        });
    }, [voltage]);

    // Draw waveform - check theme for colors
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Check if light theme is active
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Grid - theme aware
        ctx.strokeStyle = isLightTheme ? '#e2e8f0' : '#374151'; // slate-200 / gray-700
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 20) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 20) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Waveform Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); // emerald-500
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.strokeStyle = '#10B981'; // emerald-500
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxV = systemVoltage === 12 ? 18 : 36;
        const scaleY = height / maxV;

        history.forEach((v, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - (v * scaleY);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

    }, [history, systemVoltage]);


    // Helpers
    const isCC = current >= currentLimit && powerState !== 'OFF';
    const isOVP = voltage > (systemVoltage === 12 ? 16 : 30);
    const powerW = voltage * current;

    const getVoltageColor = () => {
        if (powerState === 'OFF') return 'text-slate-400 dark:text-gray-500';
        if (voltage < 11 && systemVoltage === 12) return 'text-amber-500 dark:text-yellow-400';
        if (voltage < 22 && systemVoltage === 24) return 'text-amber-500 dark:text-yellow-400';
        if (voltage > 15 && systemVoltage === 12) return 'text-red-500';
        if (voltage > 28 && systemVoltage === 24) return 'text-red-500';
        return 'text-emerald-500 dark:text-emerald-400';
    };

    return (
        <div className="bg-white dark:bg-dark-800/60 backdrop-blur-md border border-slate-200 dark:border-gray-700 rounded-xl p-4 mb-6 relative overflow-hidden shadow-lg dark:shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 border-b border-slate-200 dark:border-gray-700 pb-3 gap-3 sm:gap-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100 font-mono tracking-tight flex-1 sm:flex-none">
                        DC POWER SUPPLY
                        <span className="text-xs text-slate-400 dark:text-gray-500 ml-2 font-normal">PPS-3005 PRO</span>
                    </h2>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setSystemVoltage(12)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${systemVoltage === 12
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700'
                            }`}
                    >
                        12V SYS
                    </button>
                    <button
                        onClick={() => setSystemVoltage(24)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${systemVoltage === 24
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700'
                            }`}
                    >
                        24V SYS
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Monitoring Display (Left) */}
                <div className="lg:col-span-1 bg-slate-50 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-gray-700 flex flex-col justify-between relative overflow-hidden">
                    {/* Status Icons */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isCC
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/50'
                            : 'text-slate-400 dark:text-gray-600'
                            }`}>CC</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${!isCC && powerState !== 'OFF'
                            ? 'bg-emerald-100 dark:bg-green-500/20 text-emerald-600 dark:text-green-400 border border-emerald-300 dark:border-green-500/50'
                            : 'text-slate-400 dark:text-gray-600'
                            }`}>CV</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isOVP
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-slate-400 dark:text-gray-600'
                            }`}>OVP</span>
                        {/* RPS Status Indicator */}
                        <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${rpsCountdown !== null
                                ? 'bg-orange-500 text-white animate-pulse'
                                : rpsEnabled
                                    ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/50'
                                    : 'text-slate-400 dark:text-gray-600'
                                }`}
                            title={rpsEnabled ? `RPS Enabled: ${rpsPowerDownTime * 10}ms` : 'RPS Disabled'}
                        >
                            RPS
                        </span>
                    </div>

                    {/* RPS Countdown Overlay */}
                    {rpsCountdown !== null && (
                        <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
                            <div className="text-center">
                                <div className="text-orange-500 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    RPS POWER-DOWN
                                </div>
                                <div className="text-orange-600 dark:text-orange-300 text-3xl font-mono font-bold">
                                    {(rpsCountdown / 1000).toFixed(1)}s
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Voltage Readout */}
                    <div className="mb-4">
                        <div className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1 font-medium">Voltage</div>
                        <div className={`text-5xl font-mono font-bold tracking-tighter ${getVoltageColor()}`}>
                            {voltage.toFixed(2)}<span className="text-2xl ml-1 text-slate-400 dark:text-gray-600">V</span>
                        </div>
                    </div>

                    {/* Current Readout */}
                    <div className="mb-4">
                        <div className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1 font-medium">Current</div>
                        <div className="text-4xl font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-tighter">
                            {current < 1 ? (current * 1000).toFixed(0) : current.toFixed(3)}
                            <span className="text-xl ml-1 text-slate-400 dark:text-gray-600">{current < 1 ? 'mA' : 'A'}</span>
                        </div>
                    </div>

                    {/* Power Readout */}
                    <div>
                        <div className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1 font-medium">Power</div>
                        <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                            {powerW.toFixed(1)}<span className="text-sm ml-1 text-slate-400 dark:text-gray-600">W</span>
                        </div>
                    </div>
                </div>

                {/* 2. Control Panel (Middle) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Voltage Control */}
                    <div className="bg-slate-50 dark:bg-transparent p-4 rounded-xl border border-slate-200 dark:border-gray-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wide">Set Voltage</label>
                            <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">{targetVoltage.toFixed(2)}V</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="32"
                            step="0.1"
                            value={targetVoltage}
                            onChange={(e) => setTargetVoltage(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="grid grid-cols-5 gap-2 mt-3">
                            {[3.3, 5.0, 12.0, 13.5, 24.0].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setTargetVoltage(v)}
                                    className="px-1 py-1.5 bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-[11px] font-mono font-medium text-slate-700 dark:text-gray-300 transition-colors shadow-sm"
                                >
                                    {v}V
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Limit */}
                    <div className="bg-slate-50 dark:bg-transparent p-4 rounded-xl border border-slate-200 dark:border-gray-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wide">Current Limit (OCP)</label>
                            <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded">{currentLimit.toFixed(2)}A</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={currentLimit}
                            onChange={(e) => setCurrentLimit(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    {/* Ignition Toggle */}
                    <div className={`
                        relative group p-4 rounded-xl border transition-all duration-300 
                        ${powerState !== 'OFF'
                            ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-100 dark:bg-gray-800/30 border-slate-200 dark:border-gray-700/50 hover:border-slate-300 dark:hover:border-gray-600'
                        }
                    `}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold tracking-wide transition-colors ${powerState !== 'OFF' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-gray-400'}`}>
                                    IGNITION (KL15)
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 mt-0.5">
                                    {powerState !== 'OFF' ? 'POWER SUPPLY ACTIVE' : 'OUTPUT DISABLED'}
                                </span>
                            </div>

                            <button
                                onClick={() => setPowerState(powerState === 'OFF' ? 'ON' : 'OFF')}
                                className={`
                                    relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none 
                                    ${powerState !== 'OFF'
                                        ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                        : 'bg-slate-300 dark:bg-gray-700 shadow-inner'
                                    }
                                `}
                            >
                                <span className="sr-only">Toggle Ignition</span>
                                <span
                                    className={`
                                        absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ease-out
                                        ${powerState !== 'OFF' ? 'right-1' : 'left-1'}
                                    `}
                                />
                            </button>
                        </div>

                        {/* Glow effect for active state */}
                        {powerState !== 'OFF' && (
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-xl animate-pulse pointer-events-none" />
                        )}
                    </div>
                </div>

                {/* 3. Advanced Features (Right) */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Waveform */}
                    <div className="flex-1 bg-slate-100 dark:bg-gray-900/50 rounded-xl border border-slate-200 dark:border-gray-700 p-3 relative min-h-[120px]">
                        <div className="absolute top-2 left-3 text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">V-OUT MONITOR</div>
                        <canvas ref={canvasRef} width={300} height={120} className="w-full h-full rounded-lg" />
                    </div>

                    {/* Fault Injection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onMouseDown={() => setFaultState('SHORT_GND')}
                            onMouseUp={() => setFaultState('NONE')}
                            onMouseLeave={() => setFaultState('NONE')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${faultState === 'SHORT_GND'
                                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40'
                                }`}
                        >
                            SHORT GND
                        </button>
                        <button
                            onMouseDown={() => setFaultState('OPEN_CIRCUIT')}
                            onMouseUp={() => setFaultState('NONE')}
                            onMouseLeave={() => setFaultState('NONE')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${faultState === 'OPEN_CIRCUIT'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30'
                                : 'bg-amber-50 dark:bg-yellow-900/20 text-amber-600 dark:text-yellow-400 border-amber-200 dark:border-yellow-900/50 hover:bg-amber-100 dark:hover:bg-yellow-900/40'
                                }`}
                        >
                            OPEN CIRCUIT
                        </button>
                        <button
                            onClick={simulateCranking}
                            disabled={powerState === 'OFF' || powerState === 'CRANKING'}
                            className="col-span-2 p-3 rounded-xl border border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {powerState === 'CRANKING' ? 'CRANKING...' : 'SIMULATE CRANKING'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
