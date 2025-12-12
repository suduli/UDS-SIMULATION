import type { Meta, StoryObj } from '@storybook/react';
import { ReportSummaryCards } from './ReportSummaryCards';

// Mock analysis data
const mockAnalysis = {
    totalRequests: 150,
    positiveResponses: 120,
    negativeResponses: 30,
    successRate: 80,
    averageResponseTime: 45,
    minResponseTime: 12,
    maxResponseTime: 250,
};

const meta = {
    title: 'Dashboard/ReportSummaryCards',
    component: ReportSummaryCards,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Summary cards showing key metrics from test report analysis.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ReportSummaryCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        analysis: mockAnalysis,
        reportName: 'SID22_TestCases_Report',
    },
};

export const Mobile: Story = {
    args: {
        analysis: mockAnalysis,
        reportName: 'SID22_TestCases_Report',
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};

export const HighSuccessRate: Story = {
    args: {
        analysis: {
            ...mockAnalysis,
            successRate: 98,
            negativeResponses: 3,
        },
        reportName: 'Perfect_Test_Report',
    },
};

export const LowSuccessRate: Story = {
    args: {
        analysis: {
            ...mockAnalysis,
            successRate: 45,
            negativeResponses: 82,
        },
        reportName: 'Failing_Test_Report',
    },
};
