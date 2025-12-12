import type { Meta, StoryObj } from '@storybook/react';
import { NRCAnalysisChart } from './NRCAnalysisChart';

// Mock analysis data
const mockAnalysis = {
    totalRequests: 50,
    positiveResponses: 35,
    negativeResponses: 15,
    nrcBreakdown: [
        { code: 0x22, name: 'Conditions Not Correct', count: 5, percentage: 33.3 },
        { code: 0x31, name: 'Request Out of Range', count: 4, percentage: 26.7 },
        { code: 0x33, name: 'Security Access Denied', count: 3, percentage: 20 },
        { code: 0x11, name: 'Service Not Supported', count: 2, percentage: 13.3 },
        { code: 0x7F, name: 'Service Not Supported In Active Session', count: 1, percentage: 6.7 },
    ],
    successRate: 70,
};

const meta = {
    title: 'Charts/NRCAnalysisChart',
    component: NRCAnalysisChart,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Chart component for visualizing NRC (Negative Response Code) distribution and analysis.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof NRCAnalysisChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        analysis: mockAnalysis,
    },
    decorators: [
        (Story) => (
            <div className="max-w-2xl p-4">
                <Story />
            </div>
        ),
    ],
};

export const Mobile: Story = {
    args: {
        analysis: mockAnalysis,
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
    decorators: [
        (Story) => (
            <div className="p-2">
                <Story />
            </div>
        ),
    ],
};

export const NoErrors: Story = {
    args: {
        analysis: {
            ...mockAnalysis,
            negativeResponses: 0,
            nrcBreakdown: [],
            successRate: 100,
        },
    },
    decorators: [
        (Story) => (
            <div className="max-w-2xl p-4">
                <Story />
            </div>
        ),
    ],
};
