/**
 * One-time test environment setup.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import { beforeAll, expect, test } from 'vitest';
import { createDirectory } from '../src/utils/io-utils.js';


const config = {
    dirs: {
        working: './working/tests'
    }
};

beforeAll(() => {
    createDirectory(config.dirs.working);
});

test('working directory exists', () => {
    expect(fs.existsSync(config.dirs.working)).toBe(true);
});
