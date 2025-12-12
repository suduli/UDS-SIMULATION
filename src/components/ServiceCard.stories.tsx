import type { Meta, StoryObj } from '@storybook/react';
import ServiceCard from './ServiceCard';

const meta = {
    title: 'UI/ServiceCard',
    component: ServiceCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Card component for displaying individual UDS services with icon, name, and ID.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        service: {
            description: 'Service object with id and name',
        },
        isSelected: {
            control: 'boolean',
            description: 'Whether the card is selected',
        },
        onClick: {
            action: 'clicked',
            description: 'Click handler',
        },
    },
} satisfies Meta<typeof ServiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        service: {
            id: 0x10,
            name: 'Diagnostic Session Control',
        },
        isSelected: false,
        metadata: {
            icon: '🔧',
            color: 'blue',
            description: 'Controls the diagnostic session',
        },
    },
    decorators: [
        (Story) => (
            <div className="w-64 p-4 bg-dark-900">
                <Story />
            </div>
        ),
    ],
};

export const Selected: Story = {
    args: {
        service: {
            id: 0x22,
            name: 'Read Data By Identifier',
        },
        isSelected: true,
        metadata: {
            icon: '📖',
            color: 'green',
            description: 'Reads data from ECU',
        },
    },
    decorators: [
        (Story) => (
            <div className="w-64 p-4 bg-dark-900">
                <Story />
            </div>
        ),
    ],
};

export const SecurityService: Story = {
    args: {
        service: {
            id: 0x27,
            name: 'Security Access',
        },
        isSelected: false,
        metadata: {
            icon: '🔐',
            color: 'purple',
            description: 'Security access service',
        },
    },
    decorators: [
        (Story) => (
            <div className="w-64 p-4 bg-dark-900">
                <Story />
            </div>
        ),
    ],
};

export const GridLayout: Story = {
    render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-dark-900 max-w-4xl">
            <ServiceCard
                service={{ id: 0x10, name: 'Diagnostic Session Control' }}
                isSelected={false}
                metadata={{ icon: '🔧', color: 'blue', description: '' }}
            />
            <ServiceCard
                service={{ id: 0x11, name: 'ECU Reset' }}
                isSelected={true}
                metadata={{ icon: '🔄', color: 'red', description: '' }}
            />
            <ServiceCard
                service={{ id: 0x22, name: 'Read Data By Identifier' }}
                isSelected={false}
                metadata={{ icon: '📖', color: 'green', description: '' }}
            />
            <ServiceCard
                service={{ id: 0x27, name: 'Security Access' }}
                isSelected={false}
                metadata={{ icon: '🔐', color: 'purple', description: '' }}
            />
            <ServiceCard
                service={{ id: 0x2E, name: 'Write Data By Identifier' }}
                isSelected={false}
                metadata={{ icon: '✏️', color: 'orange', description: '' }}
            />
            <ServiceCard
                service={{ id: 0x3E, name: 'Tester Present' }}
                isSelected={false}
                metadata={{ icon: '💓', color: 'pink', description: '' }}
            />
        </div>
    ),
};
