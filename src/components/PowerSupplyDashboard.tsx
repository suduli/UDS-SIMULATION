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

    // Draw waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#374151'; // gray-700
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
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // emerald-500 low opacity
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
        if (powerState === 'OFF') return 'text-gray-500';
        if (voltage < 11 && systemVoltage === 12) return 'text-yellow-400';
        if (voltage < 22 && systemVoltage === 24) return 'text-yellow-400';
        if (voltage > 15 && systemVoltage === 12) return 'text-red-500';
        if (voltage > 28 && systemVoltage === 24) return 'text-red-500';
        return 'text-emerald-400';
    };

    return (
        <div className="glass-panel p-4 mb-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-gray-100 font-mono">DC POWER SUPPLY <span className="text-xs text-gray-500 ml-2">PPS-3005 PRO</span></h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSystemVoltage(12)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${systemVoltage === 12 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        12V SYS
                    </button>
                    <button
                        onClick={() => setSystemVoltage(24)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${systemVoltage === 24 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        24V SYS
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Monitoring Display (Left) */}
                <div className="lg:col-span-1 bg-black/40 rounded-xl p-4 border border-gray-700 flex flex-col justify-between relative overflow-hidden">
                    {/* Status Icons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <span className={`text-[10px] px-1 rounded ${isCC ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-700'}`}>CC</span>
                        <span className={`text-[10px] px-1 rounded ${!isCC && powerState !== 'OFF' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-700'}`}>CV</span>
                        <span className={`text-[10px] px-1 rounded ${isOVP ? 'bg-red-500 text-white animate-pulse' : 'text-gray-700'}`}>OVP</span>
                        {/* RPS Status Indicator */}
                        <span
                            className={`text-[10px] px-1 rounded ${rpsCountdown !== null
                                    ? 'bg-orange-500 text-white animate-pulse'
                                    : rpsEnabled
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'text-gray-700'
                                }`}
                            title={rpsEnabled ? `RPS Enabled: ${rpsPowerDownTime * 10}ms` : 'RPS Disabled'}
                        >
                            RPS
                        </span>
                    </div>

                    {/* RPS Countdown Overlay */}
                    {rpsCountdown !== null && (
                        <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center pointer-events-none z-10">
                            <div className="text-center">
                                <div className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    RPS POWER-DOWN
                                </div>
                                <div className="text-orange-300 text-2xl font-mono font-bold">
                                    {(rpsCountdown / 1000).toFixed(1)}s
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Voltage Readout */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Voltage</div>
                        <div className={`text-5xl font-mono font-bold tracking-tighter ${getVoltageColor()}`}>
                            {voltage.toFixed(2)}<span className="text-2xl ml-1 text-gray-600">V</span>
                        </div>
                    </div>

                    {/* Current Readout */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current</div>
                        <div className="text-4xl font-mono font-bold text-cyan-400 tracking-tighter">
                            {current < 1 ? (current * 1000).toFixed(0) : current.toFixed(3)}
                            <span className="text-xl ml-1 text-gray-600">{current < 1 ? 'mA' : 'A'}</span>
                        </div>
                    </div>

                    {/* Power Readout */}
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Power</div>
                        <div className="text-2xl font-mono font-bold text-purple-400">
                            {powerW.toFixed(1)}<span className="text-sm ml-1 text-gray-600">W</span>
                        </div>
                    </div>
                </div>

                {/* 2. Control Panel (Middle) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Voltage Control */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Set Voltage</label>
                            <span className="text-xs font-mono text-emerald-400">{targetVoltage.toFixed(2)}V</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="32"
                            step="0.1"
                            value={targetVoltage}
                            onChange={(e) => setTargetVoltage(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="grid grid-cols-5 gap-2 mt-2">
                            {[3.3, 5.0, 12.0, 13.5, 24.0].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setTargetVoltage(v)}
                                    className="px-1 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-[10px] font-mono text-gray-300 transition-colors"
                                >
                                    {v}V
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Limit */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Current Limit (OCP)</label>
                            <span className="text-xs font-mono text-cyan-400">{currentLimit.toFixed(2)}A</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={currentLimit}
                            onChange={(e) => setCurrentLimit(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    {/* Ignition Toggle */}
                    <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        <span className="text-sm font-bold text-gray-300">IGNITION (KL15)</span>
                        <button
                            onClick={() => setPowerState(powerState === 'OFF' ? 'ON' : 'OFF')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${powerState !== 'OFF' ? 'bg-emerald-600' : 'bg-gray-700'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${powerState !== 'OFF' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* 3. Advanced Features (Right) */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Waveform */}
                    <div className="flex-1 bg-gray-900/50 rounded-lg border border-gray-700 p-2 relative min-h-[120px]">
                        <div className="absolute top-2 left-2 text-[10px] text-gray-500">V-OUT MONITOR</div>
                        <canvas ref={canvasRef} width={300} height={120} className="w-full h-full" />
                    </div>

                    {/* Fault Injection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onMouseDown={() => setFaultState('SHORT_GND')}
                            onMouseUp={() => setFaultState('NONE')}
                            onMouseLeave={() => setFaultState('NONE')}
                            className={`p-2 rounded border text-xs font-bold transition-all active:scale-95 ${faultState === 'SHORT_GND' ? 'bg-red-600 text-white border-red-500' : 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40'}`}
                        >
                            SHORT GND
                        </button>
                        <button
                            onMouseDown={() => setFaultState('OPEN_CIRCUIT')}
                            onMouseUp={() => setFaultState('NONE')}
                            onMouseLeave={() => setFaultState('NONE')}
                            className={`p-2 rounded border text-xs font-bold transition-all active:scale-95 ${faultState === 'OPEN_CIRCUIT' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/40'}`}
                        >
                            OPEN CIRCUIT
                        </button>
                        <button
                            onClick={simulateCranking}
                            disabled={powerState === 'OFF' || powerState === 'CRANKING'}
                            className="col-span-2 p-2 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {powerState === 'CRANKING' ? 'CRANKING...' : 'SIMULATE CRANKING'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
