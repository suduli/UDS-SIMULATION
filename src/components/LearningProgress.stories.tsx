import type { Meta, StoryObj } from '@storybook/react';
import { LearningProgress } from './LearningProgress';

const meta = {
    title: 'UI/LearningProgress',
    component: LearningProgress,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Progress indicator showing learning completion status for UDS services.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        progress: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Progress percentage',
        },
        completedServices: {
            control: 'object',
            description: 'Array of completed service IDs',
        },
    },
} satisfies Meta<typeof LearningProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        progress: 0,
        completedServices: [],
    },
    decorators: [
        (Story) => (
            <div className="w-96 p-4 bg-dark-900 rounded-lg">
                <Story />
            </div>
        ),
    ],
};

export const InProgress: Story = {
    args: {
        progress: 45,
        completedServices: [0x10, 0x11, 0x22, 0x27],
    },
    decorators: [
        (Story) => (
            <div className="w-96 p-4 bg-dark-900 rounded-lg">
                <Story />
            </div>
        ),
    ],
};

export const Complete: Story = {
    args: {
        progress: 100,
        completedServices: [0x10, 0x11, 0x14, 0x19, 0x22, 0x23, 0x27, 0x28, 0x2E, 0x31, 0x34, 0x35, 0x36, 0x37, 0x3E],
    },
    decorators: [
        (Story) => (
            <div className="w-96 p-4 bg-dark-900 rounded-lg">
                <Story />
            </div>
        ),
    ],
};

export const Mobile: Story = {
    args: {
        progress: 60,
        completedServices: [0x10, 0x11, 0x22, 0x27, 0x2E, 0x3E],
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
    decorators: [
        (Story) => (
            <div className="w-full p-2 bg-dark-900 rounded-lg">
                <Story />
            </div>
        ),
    ],
};
