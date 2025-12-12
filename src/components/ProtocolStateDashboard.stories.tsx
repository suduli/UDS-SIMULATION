import type { Meta, StoryObj } from '@storybook/react';
import ProtocolStateDashboard from './ProtocolStateDashboard';
import { UDSProvider } from '../context/UDSContext';

// Wrapper with UDS context
const ProtocolStateDashboardWithContext = () => {
    return (
        <UDSProvider>
            <ProtocolStateDashboard />
        </UDSProvider>
    );
};

const meta = {
    title: 'Dashboard/ProtocolStateDashboard',
    component: ProtocolStateDashboardWithContext,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `Protocol state dashboard showing ECU ignition, session, security, and communication status.
                
**Mobile Layout Features:**
- **Vertical Stack Layout** (Single Column)
- Full-width status cards for better readability
- Collapsible Data Bus section at the bottom
- Optimized for one-handed use on mobile devices

**Desktop Layout Features:**
- Full horizontal row with all 7 indicators
- Visual dividers between sections
- Animated progress ring for session timeout
- Real-time voltage/current display`,
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ProtocolStateDashboardWithContext>;

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
    name: 'Mobile (375px)',
    parameters: {
        viewport: {
            defaultViewport: 'mobile',
        },
    },
};

export const Tablet: Story = {
    name: 'Tablet (768px)',
    parameters: {
        viewport: {
            defaultViewport: 'tablet',
        },
    },
};

export const MobileSmall: Story = {
    name: 'Mobile Small (320px)',
    parameters: {
        viewport: {
            viewports: {
                mobileSmall: {
                    name: 'Mobile Small',
                    styles: { width: '320px', height: '568px' },
                },
            },
            defaultViewport: 'mobileSmall',
        },
    },
};

