import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import { useUDS } from '../context/UDSContext';

// We need to wrap Header with the UDS context for it to work
const HeaderWithContext = () => {
    return <Header />;
};

const meta = {
    title: 'Layout/Header',
    component: HeaderWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Main navigation header with responsive mobile menu, theme toggle, and action buttons.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof HeaderWithContext>;

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
