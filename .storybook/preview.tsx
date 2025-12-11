import type { Preview } from "@storybook/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "../src/context/ThemeContext";
import "../src/index.css";
import "../src/high-contrast-light.css";

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: "dark",
            values: [
                {
                    name: "dark",
                    value: "#0a0a0f",
                },
                {
                    name: "light",
                    value: "#F8FAFC",
                },
                {
                    name: "high-contrast-dark",
                    value: "#000000",
                },
                {
                    name: "high-contrast-light",
                    value: "#FFFFFF",
                },
            ],
        },
        viewport: {
            viewports: {
                mobile: {
                    name: "Mobile",
                    styles: { width: "375px", height: "667px" },
                },
                tablet: {
                    name: "Tablet",
                    styles: { width: "768px", height: "1024px" },
                },
                desktop: {
                    name: "Desktop",
                    styles: { width: "1920px", height: "1080px" },
                },
                clusterDisplay: {
                    name: "Cluster Display",
                    styles: { width: "1280px", height: "720px" },
                },
            },
        },
    },
    decorators: [
        (Story) => (
            <BrowserRouter>
                <ThemeProvider>
                    <div className="min-h-screen bg-light-50 dark:bg-dark-950 text-light-500 dark:text-white">
                        <Story />
                    </div>
                </ThemeProvider>
            </BrowserRouter>
        ),
    ],
};

export default preview;
