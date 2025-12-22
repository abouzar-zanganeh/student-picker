import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node', // Use Node for non-DOM tests (supports Worker natively)
        globals: true,
        setupFiles: ['./__tests__/setupTests.js'],
    },
});