import type { Meta, StoryObj } from '@storybook/react';
import { RequestBuilder } from './RequestBuilder';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const RequestBuilderWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-2xl mx-auto p-4">
                <RequestBuilder />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/RequestBuilder',
    component: RequestBuilderWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'UDS request builder with service selection grid, parameter inputs, and quick examples. Supports both builder and manual hex modes.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RequestBuilderWithContext>;

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
