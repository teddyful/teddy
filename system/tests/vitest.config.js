/**
 * Vitest configuration.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            './system/tests/**/*.{test,spec}.js'
        ]
    }
});
