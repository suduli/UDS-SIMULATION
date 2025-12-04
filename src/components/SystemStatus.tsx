import React from 'react';
import { useUDS } from '../context/UDSContext';

export const SystemStatus: React.FC = () => {
    const { ecuPower, toggleEcuPower, voltage, current } = useUDS();

    return (
        <div className="flex items-center gap-3 flex-1 justify-center">
            {/* System Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors duration-300 ${ecuPower
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className={`w-2 h-2 rounded-full ${ecuPower ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                <span className={`text-xs font-medium ${ecuPower ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    {ecuPower ? 'SYS UP' : 'SYS DOWN'}
                </span>
            </div>

            {/* Voltage Control */}
            <div className={`flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded-lg transition-opacity duration-300 group/volt ${!ecuPower ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-mono text-gray-300 min-w-[40px]">{ecuPower ? voltage.toFixed(1) + 'V' : '0.0V'}</span>
                </div>
            </div>

            {/* Current Control */}
            <div className={`flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded-lg transition-opacity duration-300 group/curr ${!ecuPower ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-xs font-mono text-gray-300 min-w-[45px]">{ecuPower ? current.toFixed(2) + 'A' : '0.00A'}</span>
                </div>
            </div>

            {/* IGNITION Toggle */}
            <button
                onClick={toggleEcuPower}
                className={`group relative px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 overflow-hidden ${ecuPower
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}
            >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${ecuPower ? 'bg-emerald-400/10' : 'bg-red-400/10'
                    }`} />
                <span className="relative flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    IGNITION {ecuPower ? 'ON' : 'OFF'}
                </span>
            </button>

            {/* Latency */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg">
                <span className="text-xs text-gray-500">LATENCY</span>
                <span className="text-xs font-mono text-emerald-400">7ms</span>
            </div>
        </div>
    );
};
