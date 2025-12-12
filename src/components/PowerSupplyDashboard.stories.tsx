import type { Meta, StoryObj } from '@storybook/react';
import { PowerSupplyDashboard } from './PowerSupplyDashboard';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const PowerSupplyDashboardWithContext = () => {
    return (
        <UDSProvider>
            <PowerSupplyDashboard />
        </UDSProvider>
    );
};

const meta = {
    title: 'Dashboard/PowerSupplyDashboard',
    component: PowerSupplyDashboardWithContext,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Power supply visualization showing voltage and current graphs with real-time updates.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PowerSupplyDashboardWithContext>;

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
