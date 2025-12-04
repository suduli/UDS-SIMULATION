/**
 * Interactive Lesson Example Component
 * Displays UDS request/response examples with "Try This" functionality
 */

import React from 'react';
import type { LearningExample } from '../data/learningContent';

interface InteractiveLessonExampleProps {
    example: LearningExample;
    onTryExample: (request: string) => void;
}

export const InteractiveLessonExample: React.FC<InteractiveLessonExampleProps> = ({
    example,
    onTryExample
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleTryExample = () => {
        onTryExample(example.request);
    };

    return (
        <div className="glass-card p-6 space-y-4 hover-lift">
            {/* Example Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-cyber-blue mb-1">
                        {example.title}
                    </h4>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        {example.description}
                    </p>
                </div>
            </div>

            {/* Request Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Request
                    </span>
                    <button
                        onClick={() => handleCopy(example.request)}
                        className="text-xs text-cyber-blue hover:text-cyber-purple transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>
                <div className="bg-dark-800/50 border border-cyber-blue/20 rounded-lg p-3 font-mono text-sm">
                    <code className="text-cyber-green">{example.request}</code>
                </div>
            </div>

            {/* Expected Response Section */}
            <div className="space-y-2">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Expected Response
                </span>
                <div className="bg-dark-800/50 border border-cyber-purple/20 rounded-lg p-3 font-mono text-sm">
                    <code className="text-cyber-purple">{example.expectedResponse}</code>
                </div>
            </div>

            {/* Packet Breakdown */}
            {example.breakdown && example.breakdown.length > 0 && (
                <div className="space-y-2">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Packet Breakdown
                    </span>
                    <div className="bg-dark-800/30 border border-dark-600 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-dark-700/50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-cyber-blue font-mono">Byte(s)</th>
                                    <th className="px-3 py-2 text-left text-gray-300">Meaning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-600">
                                {example.breakdown.map((item, index) => (
                                    <tr key={index} className="hover:bg-dark-700/30 transition-colors">
                                        <td className="px-3 py-2 font-mono text-cyber-green">{item.byte}</td>
                                        <td className="px-3 py-2 text-gray-300">{item.meaning}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Explanation */}
            <div className="bg-cyber-blue/5 border border-cyber-blue/20 rounded-lg p-4">
                <p className="text-sm text-gray-300 leading-relaxed">
                    <span className="text-cyber-blue font-semibold">💡 Explanation: </span>
                    {example.explanation}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={handleTryExample}
                    className="flex-1 cyber-button bg-gradient-to-r from-cyber-blue to-cyber-purple hover:shadow-neon-cyan transition-all duration-300"
                >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Try This Example
                </button>
                <button
                    onClick={() => handleCopy(example.request)}
                    className="px-4 cyber-button border-cyber-blue/30 hover:border-cyber-blue transition-colors"
                    title="Copy request to clipboard"
                >
                    📋
                </button>
            </div>
        </div>
    );
};
