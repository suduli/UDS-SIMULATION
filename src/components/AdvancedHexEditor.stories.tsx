import type { Meta, StoryObj } from '@storybook/react';
import { AdvancedHexEditor } from './AdvancedHexEditor';
import { useState } from 'react';

const meta = {
    title: 'Core/AdvancedHexEditor',
    component: AdvancedHexEditor,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Advanced hex editor with byte highlighting, validation, and interpretation features.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        value: {
            control: 'text',
            description: 'Hex string value',
        },
        onChange: {
            action: 'changed',
            description: 'Change handler',
        },
        maxBytes: {
            control: { type: 'number', min: 1, max: 4095 },
            description: 'Maximum number of bytes allowed',
        },
    },
} satisfies Meta<typeof AdvancedHexEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper
const HexEditorWrapper = ({ initialValue = '10 03', maxBytes = 8 }: { initialValue?: string; maxBytes?: number }) => {
    const [value, setValue] = useState(initialValue);

    return (
        <div className="max-w-2xl p-4 bg-dark-900 rounded-lg">
            <AdvancedHexEditor
                value={value}
                onChange={setValue}
                maxBytes={maxBytes}
            />
            <div className="mt-4 text-sm text-gray-400">
                Current value: <code className="text-cyber-blue">{value}</code>
            </div>
        </div>
    );
};

export const Default: Story = {
    render: () => <HexEditorWrapper initialValue="22 F1 90" maxBytes={8} />,
};

export const LongData: Story = {
    render: () => <HexEditorWrapper initialValue="36 01 00 10 20 30 40 50 60 70 80 90 A0 B0 C0 D0 E0 F0" maxBytes={4095} />,
};

export const Empty: Story = {
    render: () => <HexEditorWrapper initialValue="" maxBytes={8} />,
};

export const Mobile: Story = {
    render: () => <HexEditorWrapper initialValue="27 02 AB CD EF 12" maxBytes={8} />,
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};
