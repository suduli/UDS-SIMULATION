/**
 * usePendingExample Hook
 * Manages pending UDS examples to be loaded into the simulator
 */

import { useState, useEffect } from 'react';

const PENDING_EXAMPLE_KEY = 'uds-pending-example';

interface PendingExample {
    request: string;
    timestamp: number;
}

export const usePendingExample = () => {
    const [pendingExample, setPendingExampleState] = useState<string | null>(null);

    // Check for pending example on mount
    useEffect(() => {
        const stored = localStorage.getItem(PENDING_EXAMPLE_KEY);
        if (stored) {
            try {
                const data: PendingExample = JSON.parse(stored);
                // Only use if less than 5 minutes old
                const isRecent = Date.now() - data.timestamp < 5 * 60 * 1000;
                if (isRecent) {
                    setPendingExampleState(data.request);
                    // Clear from storage after retrieving
                    localStorage.removeItem(PENDING_EXAMPLE_KEY);
                } else {
                    // Clear stale data
                    localStorage.removeItem(PENDING_EXAMPLE_KEY);
                }
            } catch (error) {
                console.error('Error parsing pending example:', error);
                localStorage.removeItem(PENDING_EXAMPLE_KEY);
            }
        }
    }, []);

    const setPendingExample = (request: string) => {
        const data: PendingExample = {
            request,
            timestamp: Date.now()
        };
        localStorage.setItem(PENDING_EXAMPLE_KEY, JSON.stringify(data));
    };

    const clearPendingExample = () => {
        setPendingExampleState(null);
        localStorage.removeItem(PENDING_EXAMPLE_KEY);
    };

    return {
        pendingExample,
        setPendingExample,
        clearPendingExample
    };
};
