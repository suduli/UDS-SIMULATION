import type { Meta, StoryObj } from '@storybook/react';
import Toast from './Toast';
import { useState } from 'react';

const meta = {
    title: 'UI/Toast',
    component: Toast,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Toast notification component for displaying temporary alerts and feedback messages.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['success', 'error', 'warning', 'info'],
            description: 'Type of toast notification',
        },
        message: {
            control: 'text',
            description: 'Main toast message',
        },
        description: {
            control: 'text',
            description: 'Optional detailed description',
        },
        duration: {
            control: { type: 'number', min: 1000, max: 10000, step: 500 },
            description: 'Duration in milliseconds before auto-dismissing',
        },
    },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component that prevents auto-close for Storybook
const ToastWrapper = (args: any) => {
    const [visible, setVisible] = useState(true);

    if (!visible) {
        return (
            <button
                onClick={() => setVisible(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
                Show Toast Again
            </button>
        );
    }

    return (
        <div className="bg-dark-950 p-8 rounded-xl">
            <Toast {...args} onClose={() => setVisible(false)} />
        </div>
    );
};

export const Success: Story = {
    args: {
        id: 'toast-success',
        type: 'success',
        message: 'Response for service 0x22',
        description: 'Received 20 bytes from ECU.',
        duration: 5000,
        onClose: () => { },
    },
    render: ToastWrapper,
};

export const Error: Story = {
    args: {
        id: 'toast-error',
        type: 'error',
        message: 'Conditions Not Correct (0x22)',
        description: 'Negative Response Code: The requested action cannot be performed because the preconditions are not met.',
        duration: 7000,
        onClose: () => { },
    },
    render: ToastWrapper,
};

export const Warning: Story = {
    args: {
        id: 'toast-warning',
        type: 'warning',
        message: 'Session Timeout (S3)',
        description: 'Reverted to Default session due to inactivity',
        duration: 5000,
        onClose: () => { },
    },
    render: ToastWrapper,
};

export const Info: Story = {
    args: {
        id: 'toast-info',
        type: 'info',
        message: 'Security Access Granted',
        description: 'ECU Unlocked',
        duration: 4500,
        onClose: () => { },
    },
    render: ToastWrapper,
};

export const LongMessage: Story = {
    args: {
        id: 'toast-long',
        type: 'error',
        message: 'Service Not Supported In Active Session (0x7F)',
        description: 'This service cannot be used in the current diagnostic session. Please switch to the appropriate session (Programming, Extended, or Default) before attempting this operation.',
        duration: 8000,
        onClose: () => { },
    },
    render: ToastWrapper,
};

export const ShortMessage: Story = {
    args: {
        id: 'toast-short',
        type: 'success',
        message: 'Request sent',
        duration: 3000,
        onClose: () => { },
    },
    render: ToastWrapper,
};
