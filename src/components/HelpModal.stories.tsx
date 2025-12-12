import type { Meta, StoryObj } from '@storybook/react';
import { HelpModal } from './HelpModal';
import { useState } from 'react';

const meta = {
    title: 'Modals/HelpModal',
    component: HelpModal,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Help modal with keyboard shortcuts and application usage information.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof HelpModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper
const HelpModalWrapper = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-4">
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-cyber-blue text-dark-900 rounded-lg font-bold"
            >
                Open Help Modal
            </button>
            <HelpModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

export const Default: Story = {
    render: () => <HelpModalWrapper />,
};

export const Mobile: Story = {
    render: () => <HelpModalWrapper />,
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};

export const Tablet: Story = {
    render: () => <HelpModalWrapper />,
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
    },
};
