import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [],
    framework: {
        name: "@storybook/react-vite",
        options: {},
    },
    viteFinal: async (config) => {
        // Merge custom configuration with Storybook's Vite config
        return {
            ...config,
            resolve: {
                ...config.resolve,
                alias: {
                    ...config.resolve?.alias,
                    '@': path.resolve(__dirname, '../src'),
                },
            },
        };
    },
    staticDirs: ["../public"],
};

export default config;
