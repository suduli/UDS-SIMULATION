/**
 * ECU Status Bar Component
 * Displays system status in a futuristic cyber-diagnostic style
 * Includes: SESSION, SECURITY, COMMS, DATA BUS indicators
 */

import React, { useState, useEffect } from 'react';
import { useUDS } from '../context/UDSContext';
import { TesterPresentToggle } from './TesterPresentToggle';

// Animated Ring Indicator Component
const RingIndicator: React.FC<{ active: boolean; color?: string }> = ({ active, color = '#10b981' }) => (
    <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 40 40">
            {/* Outer ring - always visible */}
            <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={active ? color : '#374151'}
                strokeWidth="2"
                opacity={active ? 0.3 : 0.5}
            />
            {/* Inner ring - animated when active */}
            <circle
                cx="20"
                cy="20"
                r="12"
                fill="none"
                stroke={active ? color : '#4b5563'}
                strokeWidth="1.5"
                className={active ? 'animate-pulse' : ''}
                strokeDasharray={active ? "4 2" : "0"}
            />
            {/* Center dot */}
            <circle
                cx="20"
                cy="20"
                r="4"
                fill={active ? color : '#6b7280'}
                className={active ? 'animate-pulse' : ''}
            />
        </svg>
        {/* Glow effect */}
        {active && (
            <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: color }}
            />
        )}
    </div>
);

// Lock Icon SVG
const LockIcon: React.FC<{ locked: boolean }> = ({ locked }) => (
    <div className={`p-2 rounded-lg border transition-all ${locked
        ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
        : 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
        }`}>
        <svg className={`w-5 h-5 ${locked ? 'text-amber-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {locked ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            )}
        </svg>
    </div>
);

// Signal Dots Component (for COMMS status)
const SignalDots: React.FC<{ online: boolean }> = ({ online }) => {
    const [animatedDots, setAnimatedDots] = useState([false, false, false, false, false]);

    useEffect(() => {
        if (!online) {
            setAnimatedDots([false, false, false, false, false]);
            return;
        }

        const interval = setInterval(() => {
            setAnimatedDots(prev => {
                const newDots = [...prev];
                const randomIndex = Math.floor(Math.random() * 5);
                newDots[randomIndex] = !newDots[randomIndex];
                return newDots;
            });
        }, 200);

        return () => clearInterval(interval);
    }, [online]);

    return (
        <div className="flex flex-col gap-0.5">
            {[0, 1, 2].map(row => (
                <div key={row} className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map(col => {
                        const dotIndex = (row + col) % 5;
                        const isActive = online && animatedDots[dotIndex];
                        return (
                            <div
                                key={col}
                                className={`w-1.5 h-1.5 rounded-sm transition-all duration-150 ${isActive
                                    ? 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]'
                                    : online
                                        ? 'bg-emerald-600/40'
                                        : 'bg-gray-600'
                                    }`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// Data Bus Waveform Component
const DataBusWaveform: React.FC<{ idle: boolean }> = ({ idle }) => {
    const [bars, setBars] = useState([2, 4, 6, 4, 2, 5, 3, 7, 4, 2]);

    useEffect(() => {
        if (idle) return;

        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.floor(Math.random() * 8) + 1));
        }, 100);

        return () => clearInterval(interval);
    }, [idle]);

    return (
        <div className="flex items-end gap-0.5 h-6">
            {bars.map((height, index) => (
                <div
                    key={index}
                    className={`w-1 rounded-t transition-all duration-100 ${idle
                        ? 'bg-amber-500/60'
                        : 'bg-cyan-400 shadow-[0_0_3px_rgba(34,211,238,0.8)]'
                        }`}
                    style={{ height: idle ? '3px' : `${height * 2.5}px` }}
                />
            ))}
        </div>
    );
};

// Main ECU Status Bar Component
export const ECUStatusBar: React.FC = () => {
    const {
        ecuPower,
        toggleEcuPower,
        voltage,
        current,
        protocolState
    } = useUDS();

    // Extract current session and security from protocol state
    const currentSession = protocolState?.currentSession ?? 0x01;
    const securityLevel = protocolState?.securityLevel ?? 0;

    // Derive status values
    const sessionName = currentSession === 0x01 ? 'Default'
        : currentSession === 0x02 ? 'Programming'
            : currentSession === 0x03 ? 'Extended'
                : currentSession === 0x04 ? 'Safety'
                    : 'Unknown';

    const isLocked = securityLevel === 0;
    const isOnline = ecuPower;
    const isIdle = !ecuPower || currentSession === 0x01;

    return (
        <div className="w-full bg-dark-900/80 backdrop-blur-md border-y border-dark-600/50 py-3">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-6 lg:gap-12 flex-wrap">

                    {/* IGNITION Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleEcuPower}
                            className={`p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${ecuPower
                                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : 'bg-red-500/10 border-red-500/30'
                                }`}
                        >
                            <svg className={`w-5 h-5 ${ecuPower ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Ignition
                            </span>
                            <span className={`text-sm font-bold ${ecuPower ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {ecuPower ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>

                    {/* SYS UP/DOWN Indicator */}
                    <div className="flex items-center gap-3">
                        <div className={`relative p-2 rounded-lg border transition-all ${ecuPower
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ecuPower
                                ? 'bg-emerald-500/30'
                                : 'bg-red-500/30'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${ecuPower
                                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                    : 'bg-red-400'
                                    }`} />
                            </div>
                            {ecuPower && (
                                <div className="absolute inset-0 rounded-lg animate-ping opacity-20 bg-emerald-400" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                System
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${ecuPower ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {ecuPower ? 'SYS UP' : 'SYS DOWN'}
                                </span>
                                {ecuPower && (
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        {voltage.toFixed(1)}V / {current.toFixed(2)}A
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SESSION Indicator */}
                    <div className="flex items-center gap-3">
                        <RingIndicator
                            active={ecuPower}
                            color={ecuPower ? '#10b981' : '#6b7280'}
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Session
                            </span>
                            <span className={`text-sm font-semibold ${ecuPower ? 'text-emerald-400' : 'text-gray-500'
                                }`}>
                                {ecuPower ? sessionName : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* SECURITY Indicator */}
                    <div className="flex items-center gap-3">
                        <LockIcon locked={isLocked} />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Security
                            </span>
                            <span className={`text-sm font-bold ${isLocked ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                {isLocked ? 'LOCKED' : 'UNLOCKED'}
                            </span>
                        </div>
                    </div>

                    {/* TESTER PRESENT Keep-Alive */}
                    <div className="flex items-center gap-3">
                        <TesterPresentToggle showIntervalSelector={true} />
                    </div>

                    {/* COMMS Indicator */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border transition-all ${isOnline
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-gray-700/30 border-gray-600/30'
                            }`}>
                            <SignalDots online={isOnline} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Comms
                            </span>
                            <span className={`text-sm font-bold ${isOnline ? 'text-emerald-400' : 'text-gray-500'
                                }`}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>

                    {/* DATA BUS Indicator */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border transition-all ${isIdle
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-cyan-500/10 border-cyan-500/30'
                            }`}>
                            <DataBusWaveform idle={isIdle} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Data Bus
                            </span>
                            <span className={`text-sm font-bold flex items-center gap-2 ${isIdle ? 'text-amber-400' : 'text-cyan-400'
                                }`}>
                                {isIdle ? 'IDLE' : 'ACTIVE'}
                                {!isIdle && (
                                    <span className="inline-flex">
                                        <span className="animate-pulse">|</span>
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ECUStatusBar;
