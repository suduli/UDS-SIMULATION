import type { Meta, StoryObj } from '@storybook/react';
import { TimingMetrics } from './TimingMetrics';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const TimingMetricsWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-2xl mx-auto p-4">
                <TimingMetrics />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Dashboard/TimingMetrics',
    component: TimingMetricsWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Timing metrics dashboard showing P2/P2* timing, response latency, and protocol timing conformance.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TimingMetricsWithContext>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'desktop',
        },
    },
};

export const Mobile: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};
