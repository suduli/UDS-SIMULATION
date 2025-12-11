import type { Meta, StoryObj } from '@storybook/react';
import CardWithSparkles from './CardWithSparkles';

const meta = {
    title: 'UI/CardWithSparkles',
    component: CardWithSparkles,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Card wrapper component that adds animated sparkle effects to content. Automatically theme-aware with customizable particle properties.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        sparkleColor: {
            control: 'color',
            description: 'Sparkle particle color',
        },
        particleDensity: {
            control: { type: 'range', min: 10, max: 150, step: 10 },
            description: 'Number of sparkle particles',
        },
        speed: {
            control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
            description: 'Particle movement speed',
        },
        minSize: {
            control: { type: 'range', min: 0.1, max: 1, step: 0.1 },
            description: 'Minimum particle size',
        },
        maxSize: {
            control: { type: 'range', min: 0.5, max: 2, step: 0.1 },
            description: 'Maximum particle size',
        },
    },
} satisfies Meta<typeof CardWithSparkles>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleCard = () => (
    <div className="bg-dark-800 dark:bg-dark-800 border border-dark-600 rounded-2xl p-8 min-w-[400px]">
        <h3 className="text-2xl font-bold text-white mb-3">Session Statistics</h3>
        <div className="space-y-4">
            <div>
                <div className="text-gray-400 text-sm">Requests Sent</div>
                <div className="text-3xl font-bold text-cyber-blue">142</div>
            </div>
            <div>
                <div className="text-gray-400 text-sm">Success Rate</div>
                <div className="text-3xl font-bold text-cyber-green">94%</div>
            </div>
            <div>
                <div className="text-gray-400 text-sm">Active DTCs</div>
                <div className="text-3xl font-bold text-cyber-pink">3</div>
            </div>
        </div>
    </div>
);

export const Default: Story = {
    args: {
        sparkleColor: '#60A5FA',
        particleDensity: 50,
        minSize: 0.3,
        maxSize: 0.8,
        speed: 1.5,
        children: undefined as any, // Children provided in render
    },
    render: (args) => (
        <div className="bg-dark-950 p-12 rounded-xl">
            <CardWithSparkles {...args}>
                <SampleCard />
            </CardWithSparkles>
        </div>
    ),
};

export const CyberBlue: Story = {
    args: {
        ...Default.args,
        sparkleColor: '#00f3ff',
    },
    render: Default.render,
};

export const NeonPink: Story = {
    args: {
        ...Default.args,
        sparkleColor: '#ff0099',
    },
    render: Default.render,
};

export const NeonGreen: Story = {
    args: {
        ...Default.args,
        sparkleColor: '#00ff9f',
    },
    render: Default.render,
};

export const HighDensity: Story = {
    args: {
        ...Default.args,
        particleDensity: 120,
        speed: 0.8,
    },
    render: Default.render,
};

export const LowDensity: Story = {
    args: {
        ...Default.args,
        particleDensity: 20,
        speed: 2,
    },
    render: Default.render,
};

export const StaticSlow: Story = {
    args: {
        ...Default.args,
        speed: 0.5,
        particleDensity: 80,
    },
    render: Default.render,
};
