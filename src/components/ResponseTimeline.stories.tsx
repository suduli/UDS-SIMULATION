import type { Meta, StoryObj } from '@storybook/react';
import { ResponseTimeline } from './ResponseTimeline';

// Mock analysis data
const mockAnalysis = {
    timeline: [
        { timestamp: Date.now() - 5000, type: 'request', sid: 0x10, data: [0x10, 0x03], success: true },
        { timestamp: Date.now() - 4500, type: 'response', sid: 0x50, data: [0x50, 0x03], success: true },
        { timestamp: Date.now() - 4000, type: 'request', sid: 0x22, data: [0x22, 0xF1, 0x90], success: true },
        { timestamp: Date.now() - 3500, type: 'response', sid: 0x62, data: [0x62, 0xF1, 0x90, 0x57, 0x44, 0x42], success: true },
        { timestamp: Date.now() - 3000, type: 'request', sid: 0x27, data: [0x27, 0x01], success: true },
        { timestamp: Date.now() - 2500, type: 'response', sid: 0x67, data: [0x67, 0x01, 0x12, 0x34, 0x56, 0x78], success: true },
        { timestamp: Date.now() - 2000, type: 'request', sid: 0x27, data: [0x27, 0x02, 0xAB, 0xCD, 0xEF, 0x12], success: false },
        { timestamp: Date.now() - 1500, type: 'response', sid: 0x7F, data: [0x7F, 0x27, 0x35], success: false },
    ],
    totalRequests: 4,
    positiveResponses: 3,
    negativeResponses: 1,
};

const meta = {
    title: 'Charts/ResponseTimeline',
    component: ResponseTimeline,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Timeline visualization showing request/response flow with success/failure indicators.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ResponseTimeline>;

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
