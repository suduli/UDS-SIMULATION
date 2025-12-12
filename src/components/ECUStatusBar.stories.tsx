import type { Meta, StoryObj } from '@storybook/react';
import ECUStatusBar from './ECUStatusBar';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const ECUStatusBarWithContext = () => {
    return (
        <UDSProvider>
            <ECUStatusBar />
        </UDSProvider>
    );
};

const meta = {
    title: 'Dashboard/ECUStatusBar',
    component: ECUStatusBarWithContext,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Status bar showing ECU connection state, session type, and diagnostic information.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ECUStatusBarWithContext>;

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
