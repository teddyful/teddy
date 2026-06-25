/**
 * Vitest configuration.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node', 
        globals: false, 
        clearMocks: true, 
        restoreMocks: true, 
        testTimeout: 10000, 
        setupFiles: [
            './system/tests/setup.js'
        ], 
        include: [
            './system/tests/**/*.{test,spec}.js'
        ], 
        exclude: [
            './node_modules/**',
            './dist/**',
            './build/**',
            './working/**',
            './sites/**/assets/js/vendors/**',
            './system/assets/js/vendors/**',
            './themes/**/assets/js/vendors/**'
        ]
    }
});
