import type { Meta, StoryObj } from '@storybook/react';
import { TestLogTable } from './TestLogTable';

// Mock report and analysis data
const mockReport = {
    id: 'report-123',
    name: 'SID22_TestCases_Report',
    requests: [
        { timestamp: Date.now() - 5000, hex: '22 F1 90', description: 'Read VIN' },
        { timestamp: Date.now() - 4000, hex: '22 F1 91', description: 'Read ECU Serial' },
        { timestamp: Date.now() - 3000, hex: '22 F1 A0', description: 'Read Software Version' },
    ],
    responses: [
        { timestamp: Date.now() - 4800, hex: '62 F1 90 57 44 42 ...', isPositive: true },
        { timestamp: Date.now() - 3800, hex: '7F 22 31', isPositive: false },
        { timestamp: Date.now() - 2800, hex: '62 F1 A0 01 02 03', isPositive: true },
    ],
    metadata: {
        createdAt: new Date().toISOString(),
        ecuId: 'ECU_001',
    },
};

const mockAnalysis = {
    totalRequests: 3,
    positiveResponses: 2,
    negativeResponses: 1,
    successRate: 66.7,
    testResults: [
        {
            id: 1,
            request: '22 F1 90',
            response: '62 F1 90 57 44 42 ...',
            status: 'pass',
            description: 'Read VIN - Success',
            responseTime: 45,
        },
        {
            id: 2,
            request: '22 F1 91',
            response: '7F 22 31',
            status: 'fail',
            description: 'Read ECU Serial - Request Out of Range',
            responseTime: 23,
            nrc: 0x31,
        },
        {
            id: 3,
            request: '22 F1 A0',
            response: '62 F1 A0 01 02 03',
            status: 'pass',
            description: 'Read Software Version - Success',
            responseTime: 38,
        },
    ],
};

const meta = {
    title: 'Tables/TestLogTable',
    component: TestLogTable,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Detailed table view of test results with filtering, sorting, and export capabilities.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TestLogTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        analysis: mockAnalysis,
        report: mockReport,
    },
    decorators: [
        (Story) => (
            <div className="max-w-6xl p-4">
                <Story />
            </div>
        ),
    ],
};

export const Mobile: Story = {
    args: {
        analysis: mockAnalysis,
        report: mockReport,
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

export const Tablet: Story = {
    args: {
        analysis: mockAnalysis,
        report: mockReport,
    },
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
    },
    decorators: [
        (Story) => (
            <div className="p-4">
                <Story />
            </div>
        ),
    ],
};
