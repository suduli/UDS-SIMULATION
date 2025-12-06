import React from 'react';
import { useUDS } from '../context/UDSContext';

export const SystemStatus: React.FC = () => {
    const { ecuPower } = useUDS();

    return (
        <div className="flex items-center gap-3 flex-1 justify-center">
            {/* System Status - Compact indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors duration-300 ${ecuPower
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className={`w-2 h-2 rounded-full ${ecuPower ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                <span className={`text-xs font-medium ${ecuPower ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    {ecuPower ? 'ECU ONLINE' : 'ECU OFFLINE'}
                </span>
            </div>

            {/* Latency */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg">
                <span className="text-xs text-gray-500">LATENCY</span>
                <span className="text-xs font-mono text-emerald-400">7ms</span>
            </div>
        </div>
    );
};
