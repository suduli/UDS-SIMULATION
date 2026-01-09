/**
 * Landing Page - Welcome to UDS Protocol Simulator
 * A visually stunning introduction to the simulator
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import EnhancedBackground from '../components/EnhancedBackground';
import Footer from '../components/Footer';
import { LandingPageSEO } from '../components/LandingPageSEO';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useAnalytics } from '../hooks/useAnalytics';
import { useABTest } from '../hooks/useABTest';
import { trackCTAClick, trackConversion } from '../utils/analytics';

export const LandingPage: React.FC = () => {
    const [visitorCount, setVisitorCount] = useState(0);

    // Analytics tracking
    useAnalytics('landing_page');

    // A/B testing for primary CTA
    const ctaTest = useABTest({
        testName: 'hero_cta_button',
        variants: {
            A: { text: 'Launch Simulator →', color: 'from-cyber-blue to-blue-600' },
            B: { text: 'Try It Now →', color: 'from-cyber-green to-green-600' }
        }
    });

    useEffect(() => {
        // Visitor counter
        const count = parseInt(localStorage.getItem('visitor_count') || '1337');
        setVisitorCount(count);
        localStorage.setItem('visitor_count', String(count + 1));
    }, []);

    // Handle CTA clicks with analytics
    const handleCTAClick = (button: string, location: string) => {
        trackCTAClick(button, location);
        trackConversion('landing_page');
        ctaTest.trackVariantEvent('cta_click', { button, location });
    };

    const features = [
        {
            icon: '🔐',
            title: 'Security Access',
            description: 'Seed-key authentication with ISO 14229 compliant security levels',
            gradient: 'from-cyber-purple to-purple-600'
        },
        {
            icon: '📊',
            title: 'Real-time Visualization',
            description: 'Live packet flow animation and response timing charts',
            gradient: 'from-cyber-blue to-blue-600'
        },
        {
            icon: '🎯',
            title: '16+ UDS Services',
            description: 'Complete implementation of diagnostic services 0x10 to 0x37',
            gradient: 'from-cyber-green to-green-600'
        },
        {
            icon: '♿',
            title: 'WCAG AAA Compliant',
            description: 'High contrast mode and full keyboard navigation support',
            gradient: 'from-cyber-pink to-pink-600'
        },
        {
            icon: '🎓',
            title: 'Interactive Learning',
            description: 'Guided onboarding tour with tooltips and detailed documentation',
            gradient: 'from-yellow-400 to-orange-500'
        },
        {
            icon: '⚡',
            title: 'Built with Modern Tech',
            description: 'React 19, TypeScript 5.9, Tailwind CSS, and Framer Motion',
            gradient: 'from-indigo-400 to-violet-600'
        }
    ];

    const stats = [
        { label: 'UDS Services', value: '16+', icon: '🔧' },
        { label: 'Test Cases', value: '28+', icon: '🧪' },
        { label: 'Documentation Pages', value: '50+', icon: '📚' },
        { label: 'Visitors', value: visitorCount.toLocaleString(), icon: '👥' }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden">
            <LandingPageSEO />
            <div className="cyber-grid" />
            <EnhancedBackground />
            <div className="scanline" aria-hidden="true" />

            <div className="relative z-10">
                <Header />

                {/* Hero Section */}
                <section className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-5xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 mb-8"
                        >
                            <span className="text-cyber-blue text-sm font-semibold">✨ ISO 14229 Compliant</span>
                        </motion.div>

                        {/* Main Heading */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            <span className="gradient-text animate-gradient-shift">
                                Master UDS Protocol
                            </span>
                            <br />
                            <span className="text-gray-100">
                                Learn by Doing
                            </span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                            An interactive, futuristic simulator for learning{' '}
                            <span className="text-cyber-blue font-semibold">Unified Diagnostic Services</span> protocol used in automotive diagnostics. Practice in a safe, simulated environment with real-time feedback.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/simulator" onClick={() => handleCTAClick(ctaTest.value.text, 'hero')}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`group relative px-8 py-4 bg-gradient-to-r ${ctaTest.value.color} text-dark-900 font-bold text-lg rounded-lg overflow-hidden shadow-neon-cyan hover:shadow-xl transition-all duration-300`}
                                >
                                    <span className="relative z-10">{ctaTest.value.text}</span>
                                    <div className={`absolute inset-0 bg-gradient-to-r ${ctaTest.value.color.split(' ').reverse().join(' ')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                </motion.button>
                            </Link>

                            <Link to="/learn" onClick={() => trackCTAClick('View Documentation', 'hero')}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-transparent border-2 border-cyber-blue text-cyber-blue font-bold text-lg rounded-lg hover:bg-cyber-blue/10 transition-all duration-300"
                                >
                                    View Documentation
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </section>

                {/* Stats Section */}
                <section className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="glass-card p-6 text-center hover-lift"
                            >
                                <div className="text-4xl mb-2">{stat.icon}</div>
                                {stat.label === 'Visitors' ? (
                                    <AnimatedCounter
                                        end={visitorCount}
                                        duration={2.5}
                                        className="text-3xl font-bold text-cyber-blue mb-1"
                                    />
                                ) : (
                                    <AnimatedCounter
                                        end={parseInt(stat.value.replace('+', ''))}
                                        suffix="+"
                                        duration={2}
                                        className="text-3xl font-bold text-cyber-blue mb-1"
                                    />
                                )}
                                <div className="text-sm text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto px-4 py-16 sm:py-24">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Everything you need to learn and master automotive diagnostic protocols
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="glass-card p-6 hover-lift group cursor-pointer"
                            >
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-100 mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Visual Preview Section */}
                <section className="container mx-auto px-4 py-16 sm:py-24">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="max-w-5xl mx-auto"
                    >
                        <div className="glass-card p-8 sm:p-12">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-100">
                                    See It In Action
                                </h2>
                                <p className="text-gray-300 text-lg">
                                    Experience the futuristic interface with real-time packet visualization
                                </p>
                            </div>

                            {/* Demo Visualization */}
                            <div className="bg-dark-900/50 rounded-xl p-6 border border-cyber-blue/20">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-cyber-pink"></div>
                                        <div className="w-3 h-3 rounded-full bg-cyber-yellow"></div>
                                        <div className="w-3 h-3 rounded-full bg-cyber-green"></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">UDS-SIMULATOR v1.0</span>
                                </div>

                                <div className="font-mono text-sm space-y-3">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-cyber-blue">→</span>
                                        <span className="text-gray-400">Request:</span>
                                        <span className="text-cyber-green">10 03</span>
                                        <span className="text-gray-500 text-xs">(Extended Session)</span>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-cyber-purple">←</span>
                                        <span className="text-gray-400">Response:</span>
                                        <span className="text-cyber-blue">50 03 00 32 01 F4</span>
                                        <span className="text-cyber-green text-xs">✓ Success</span>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.6 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-cyber-blue">→</span>
                                        <span className="text-gray-400">Request:</span>
                                        <span className="text-cyber-green">27 01</span>
                                        <span className="text-gray-500 text-xs">(Security Seed)</span>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.8 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-cyber-purple">←</span>
                                        <span className="text-gray-400">Response:</span>
                                        <span className="text-cyber-blue">67 01 B7 6E A6 77</span>
                                        <span className="text-cyber-green text-xs">✓ Seed Generated</span>
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ width: '0%' }}
                                    whileInView={{ width: '100%' }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 1, duration: 1 }}
                                    className="mt-6 h-1 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Call to Action Section */}
                <section className="container mx-auto px-4 py-16 sm:py-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto text-center glass-card p-12 relative overflow-hidden"
                    >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/10 via-cyber-purple/10 to-cyber-pink/10 animate-gradient-shift opacity-50" />

                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                Ready to Get Started?
                            </h2>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                                Join automotive engineers, students, and developers learning UDS protocol through hands-on practice.
                            </p>

                            <Link to="/simulator" onClick={() => handleCTAClick('Start Learning Now', 'final_cta')}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative px-10 py-5 bg-gradient-to-r from-cyber-green to-green-600 text-dark-900 font-bold text-xl rounded-lg overflow-hidden shadow-neon-green"
                                >
                                    <span className="relative z-10">Start Learning Now →</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-cyber-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.button>
                            </Link>

                            <p className="text-sm text-gray-400 mt-6">
                                No installation required • Free and Open Source • WCAG AAA Accessible
                            </p>
                        </div>
                    </motion.div>
                </section>

                <Footer />
            </div>
        </div>
    );
};
