import type { Meta, StoryObj } from '@storybook/react';
import { TesterPresentToggle } from './TesterPresentToggle';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const TesterPresentToggleWithContext = () => {
    return (
        <UDSProvider>
            <div className="p-4 bg-dark-900 rounded-lg max-w-md">
                <TesterPresentToggle />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'UI/TesterPresentToggle',
    component: TesterPresentToggleWithContext,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Toggle component for controlling the Tester Present (0x3E) keep-alive functionality.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TesterPresentToggleWithContext>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};
