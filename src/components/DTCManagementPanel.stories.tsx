import type { Meta, StoryObj } from '@storybook/react';
import { DTCManagementPanel } from './DTCManagementPanel';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const DTCManagementPanelWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-4xl mx-auto p-4">
                <DTCManagementPanel />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/DTCManagementPanel',
    component: DTCManagementPanelWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Panel for viewing and managing Diagnostic Trouble Codes (DTCs) with filtering and clearing capabilities.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DTCManagementPanelWithContext>;

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
