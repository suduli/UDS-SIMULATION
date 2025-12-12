import type { Meta, StoryObj } from '@storybook/react';
import { ResponseVisualizer } from './ResponseVisualizer';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const ResponseVisualizerWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-2xl mx-auto p-4">
                <ResponseVisualizer />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/ResponseVisualizer',
    component: ResponseVisualizerWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Terminal-style response visualizer showing UDS request/response history with packet flow animation and byte-level breakdown.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ResponseVisualizerWithContext>;

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

export const Tablet: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
    },
};
