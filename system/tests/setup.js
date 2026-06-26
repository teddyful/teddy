/**
 * Test environment setup.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { createDirectory } from '../src/utils/io-utils.js';

const TEST_SETUP_CONFIG = {
    dirs: {
        working: './working/tests'
    }
};

createDirectory(TEST_SETUP_CONFIG.dirs.working);
