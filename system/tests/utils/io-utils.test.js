/**
 * I/O utility function tests.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { expect, test } from 'vitest';
import { getFiles } from '../../src/utils/io-utils.js';

test('recursive file listing generated correctly', () => {
    const basePath = './system';
    expect(getFiles(basePath).length).toBeGreaterThanOrEqual(40);
});
