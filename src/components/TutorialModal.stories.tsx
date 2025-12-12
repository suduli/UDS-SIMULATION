import type { Meta, StoryObj } from '@storybook/react';
import { TutorialModal } from './TutorialModal';
import { useState } from 'react';

const meta = {
    title: 'Modals/TutorialModal',
    component: TutorialModal,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Interactive tutorial modal for learning UDS services with step-by-step guidance.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TutorialModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper
const TutorialModalWrapper = ({ tutorialId = 'session-control' }: { tutorialId?: string }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="p-4">
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-cyber-blue text-dark-900 rounded-lg font-bold"
            >
                Open Tutorial
            </button>
            <TutorialModal
                tutorialId={tutorialId}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
};

export const SessionControl: Story = {
    render: () => <TutorialModalWrapper tutorialId="session-control" />,
};

export const SecurityAccess: Story = {
    render: () => <TutorialModalWrapper tutorialId="security-access" />,
};

export const Mobile: Story = {
    render: () => <TutorialModalWrapper tutorialId="session-control" />,
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};

export const Tablet: Story = {
    render: () => <TutorialModalWrapper tutorialId="security-access" />,
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
    },
};
