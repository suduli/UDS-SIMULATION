import type { Meta, StoryObj } from '@storybook/react';
import { SparklesCore } from './sparkles';

const meta = {
    title: 'UI/SparklesCore',
    component: SparklesCore,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Animated particle background effect using tsparticles. Provides immersive visual feedback with customizable colors, density, and particle properties.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        background: {
            control: 'color',
            description: 'Background color of the canvas',
        },
        particleColor: {
            control: 'color',
            description: 'Color of the particles',
        },
        particleDensity: {
            control: { type: 'range', min: 10, max: 300, step: 10 },
            description: 'Number of particles to render',
        },
        speed: {
            control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
            description: 'Particle movement speed',
        },
        particleSize: {
            control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
            description: 'Base particle size',
        },
        minSize: {
            control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
            description: 'Minimum particle size',
        },
        maxSize: {
            control: { type: 'range', min: 0.5, max: 5, step: 0.1 },
            description: 'Maximum particle size',
        },
    },
} satisfies Meta<typeof SparklesCore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        id: 'sparkles-default',
        background: 'transparent',
        particleColor: '#00f3ff',
        particleDensity: 120,
        speed: 0.5,
        particleSize: 1,
        minSize: 0.8,
        maxSize: 1.5,
    },
    render: (args) => (
        <div className="h-screen w-full bg-dark-950">
            <SparklesCore {...args} />
        </div>
    ),
};

export const CyberPink: Story = {
    args: {
        ...Default.args,
        id: 'sparkles-cyber-pink',
        particleColor: '#ff0099',
    },
    render: Default.render,
};

export const NeonGreen: Story = {
    args: {
        ...Default.args,
        id: 'sparkles-neon-green',
        particleColor: '#00ff9f',
    },
    render: Default.render,
};

export const HighDensity: Story = {
    args: {
        ...Default.args,
        id: 'sparkles-high-density',
        particleDensity: 250,
        speed: 0.3,
    },
    render: Default.render,
};

export const FastMoving: Story = {
    args: {
        ...Default.args,
        id: 'sparkles-fast',
        speed: 2.5,
        particleDensity: 80,
    },
    render: Default.render,
};

export const LargeParticles: Story = {
    args: {
        ...Default.args,
        id: 'sparkles-large',
        particleSize: 2.5,
        minSize: 1.5,
        maxSize: 4,
        particleDensity: 60,
    },
    render: Default.render,
};

export const LightTheme: Story = {
    args: {
        id: 'sparkles-light',
        background: 'transparent',
        particleColor: '#1976D2',
        particleDensity: 100,
        speed: 0.4,
        particleSize: 1,
        minSize: 0.8,
        maxSize: 1.5,
    },
    render: (args) => (
        <div className="h-screen w-full bg-light-50">
            <SparklesCore {...args} />
        </div>
    ),
};
