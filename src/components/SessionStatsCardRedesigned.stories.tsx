import type { Meta, StoryObj } from '@storybook/react';
import SessionStatsCardRedesigned from './SessionStatsCardRedesigned';

const meta = {
    title: 'Cards/SessionStatsCard',
    component: SessionStatsCardRedesigned,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Session statistics card showing key metrics with trend indicators and time range selector.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SessionStatsCardRedesigned>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="bg-dark-950 p-8 min-w-[500px]">
            <SessionStatsCardRedesigned />
        </div>
    ),
};

export const DarkTheme: Story = {
    render: () => (
        <div className="dark bg-dark-950 p-8 min-w-[500px]">
            <SessionStatsCardRedesigned />
        </div>
    ),
};

export const LightTheme: Story = {
    render: () => (
        <div className="light bg-light-50 p-8 min-w-[500px]">
            <SessionStatsCardRedesigned />
        </div>
    ),
};
