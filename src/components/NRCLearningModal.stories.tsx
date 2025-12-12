import type { Meta, StoryObj } from '@storybook/react';
import { NRCLearningModal } from './NRCLearningModal';
import { useState } from 'react';

const meta = {
    title: 'Modals/NRCLearningModal',
    component: NRCLearningModal,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Modal for learning about Negative Response Codes (NRCs) with detailed explanations and examples.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        nrcCode: {
            control: { type: 'number', min: 0x10, max: 0xFF },
            description: 'NRC code to display',
        },
        isOpen: {
            control: 'boolean',
            description: 'Modal visibility state',
        },
    },
} satisfies Meta<typeof NRCLearningModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper
const NRCModalWrapper = ({ nrcCode }: { nrcCode: number }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-4">
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-cyber-blue text-dark-900 rounded-lg font-bold"
            >
                Open NRC Modal (0x{nrcCode.toString(16).toUpperCase().padStart(2, '0')})
            </button>
            <NRCLearningModal
                nrcCode={nrcCode}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

export const ConditionsNotCorrect: Story = {
    render: () => <NRCModalWrapper nrcCode={0x22} />,
};

export const SecurityAccessDenied: Story = {
    render: () => <NRCModalWrapper nrcCode={0x33} />,
};

export const ServiceNotSupported: Story = {
    render: () => <NRCModalWrapper nrcCode={0x11} />,
};

export const RequestOutOfRange: Story = {
    render: () => <NRCModalWrapper nrcCode={0x31} />,
};

export const Mobile: Story = {
    render: () => <NRCModalWrapper nrcCode={0x22} />,
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};
