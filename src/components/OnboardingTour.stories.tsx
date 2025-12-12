import type { Meta, StoryObj } from '@storybook/react';
import { OnboardingTour } from './OnboardingTour';
import { useState } from 'react';

const meta = {
    title: 'UI/OnboardingTour',
    component: OnboardingTour,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Interactive onboarding tour that guides users through the application features.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OnboardingTour>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper
const OnboardingTourWrapper = () => {
    const [isActive, setIsActive] = useState(true);

    return (
        <div className="p-4 min-h-screen">
            {!isActive && (
                <button
                    onClick={() => setIsActive(true)}
                    className="px-4 py-2 bg-cyber-blue text-dark-900 rounded-lg font-bold"
                >
                    Start Tour
                </button>
            )}
            {isActive && (
                <OnboardingTour
                    onComplete={() => setIsActive(false)}
                    onSkip={() => setIsActive(false)}
                />
            )}
        </div>
    );
};

export const Default: Story = {
    render: () => <OnboardingTourWrapper />,
};

export const Mobile: Story = {
    render: () => <OnboardingTourWrapper />,
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};
