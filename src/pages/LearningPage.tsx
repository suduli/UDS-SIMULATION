/**
 * Learning Page - Full-page UDS Protocol Learning Interface
 */

import React from 'react';
import EnhancedBackground from '../components/EnhancedBackground';
import Header from '../components/Header';
import RequestBuilder from '../components/RequestBuilder';
import ResponseVisualizer from '../components/ResponseVisualizer';
import ProtocolStateDashboard from '../components/ProtocolStateDashboard';
import { PowerSupplyDashboard } from '../components/PowerSupplyDashboard';

export const LearningPage: React.FC = () => {
    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                {/* Shared Header Component */}
                <Header />

                {/* Main Content - Interactive Lab Only */}
                <main className="container mx-auto p-4 flex flex-col relative min-h-[calc(100vh-80px)]">
                    <ProtocolStateDashboard />

                    {/* Interactive Lab */}
                    <div className="flex flex-col gap-4">


                        {/* Lab Content - Side-by-Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Input Section */}
                            <div className="flex flex-col h-full">
                                <RequestBuilder initialRequest="" />
                            </div>

                            {/* Output Section */}
                            <div className="flex flex-col h-full">
                                <ResponseVisualizer />
                            </div>
                        </div>
                    </div>

                    {/* Power Supply Dashboard */}
                    <div className="mt-4">
                        <PowerSupplyDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
};
