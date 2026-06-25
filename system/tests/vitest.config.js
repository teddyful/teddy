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
        include: [
            './system/tests/**/*.{test,spec}.js'
        ]
    }
});
