import type { Meta, StoryObj } from '@storybook/react';
import { ScenarioLibrary } from './ScenarioLibrary';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const ScenarioLibraryWithContext = () => {
    return (
        <UDSProvider>
            <div className="max-w-4xl mx-auto p-4">
                <ScenarioLibrary />
            </div>
        </UDSProvider>
    );
};

const meta = {
    title: 'Core/ScenarioLibrary',
    component: ScenarioLibraryWithContext,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Library of pre-built UDS test scenarios and workflows for common diagnostic operations.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ScenarioLibraryWithContext>;

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
