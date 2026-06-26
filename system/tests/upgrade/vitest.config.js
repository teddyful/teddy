/**
 * Upgrade Vitest configuration.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: false,
        clearMocks: true,
        restoreMocks: true,
        testTimeout: 30000,
        setupFiles: [
            './system/tests/upgrade/setup.js'
        ],
        include: [
            './system/tests/upgrade/**/*.{test,spec}.js'
        ],
        exclude: [
            './node_modules/**',
            './dist/**',
            './build/**',
            './working/**'
        ]
    }
});
