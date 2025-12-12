import type { Meta, StoryObj } from '@storybook/react';
import { UDSLearning } from './UDSLearning';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const UDSLearningWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-6xl mx-auto p-4">
                <UDSLearning />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/UDSLearning',
    component: UDSLearningWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Comprehensive UDS learning interface with interactive lessons, quizzes, and progress tracking.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof UDSLearningWithContext>;

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
