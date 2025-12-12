import type { Meta, StoryObj } from '@storybook/react';
import { SequenceBuilder } from './SequenceBuilder';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const SequenceBuilderWithContext = () => {
    return (
        <UDSProvider>
            <SequenceBuilder
                isOpen={true}
                onClose={() => { }}
            />
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/SequenceBuilder',
    component: SequenceBuilderWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Sequence builder for creating and managing multi-step UDS request sequences.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SequenceBuilderWithContext>;

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
