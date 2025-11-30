import React, { useState, useEffect } from 'react';
import { useUDS } from '../context/UDSContext';

export const SystemStatus: React.FC = () => {
    const { voltage, current, ecuPower, toggleEcuPower } = useUDS();
    const [latency, setLatency] = useState(12);

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate slight latency fluctuation
            setLatency(prev => Math.max(5, Math.min(50, prev + (Math.random() * 10 - 5))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center space-x-4 px-4 py-1 bg-dark-800/50 rounded-full border border-cyber-blue/20 backdrop-blur-sm">
            {/* System Status */}
            <div className="flex items-center space-x-2">
                <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${ecuPower ? 'bg-cyber-green' : 'bg-red-500'} ${ecuPower ? 'animate-pulse' : ''}`}></div>
                    {ecuPower && <div className={`absolute inset-0 w-2 h-2 rounded-full bg-cyber-green animate-ping opacity-75`}></div>}
                </div>
                <span className={`text-xs font-mono tracking-wider ${ecuPower ? 'text-cyber-blue' : 'text-red-500'}`}>
                    SYSTEM {ecuPower ? 'ONLINE' : 'OFFLINE'}
                </span>
            </div>

            <div className="h-4 w-px bg-cyber-blue/20"></div>

            {/* Voltage & Current */}
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1" title="ECU Voltage">
                    <svg className="w-3 h-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-mono text-cyber-blue">{voltage.toFixed(1)}V</span>
                </div>
                <div className="flex items-center space-x-1" title="ECU Current Consumption">
                    <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-mono text-cyber-blue">{current.toFixed(2)}A</span>
                </div>
            </div>

            <div className="h-4 w-px bg-cyber-blue/20"></div>

            {/* ECU Power Switch */}
            <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-400">IGNITION</span>
                <button
                    onClick={toggleEcuPower}
                    className={`
                        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ease-in-out focus:outline-none 
                        ${ecuPower ? 'bg-cyber-green/20 border-cyber-green/50' : 'bg-gray-700 border-gray-600'}
                    `}
                    role="switch"
                    aria-checked={ecuPower}
                    title="Toggle ECU Power"
                >
                    <span className="sr-only">Toggle ECU Power</span>
                    <span
                        aria-hidden="true"
                        className={`
                            pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 
                            transition duration-200 ease-in-out
                            ${ecuPower ? 'translate-x-4 bg-cyber-green' : 'translate-x-0 bg-gray-400'}
                        `}
                    />
                </button>
            </div>

            <div className="h-4 w-px bg-cyber-blue/20"></div>

            <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-400">LATENCY</span>
                <span className="text-xs font-mono text-cyber-blue">{Math.round(latency)}ms</span>
            </div>
        </div>
    );
};
