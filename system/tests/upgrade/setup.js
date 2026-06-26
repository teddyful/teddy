/**
 * Upgrade test environment setup.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import path from 'path';

import { createDirectory } from '../../src/utils/io-utils.js';

const repoRoot = process.cwd();
const upgradeTestRoot = path.join(repoRoot, 'working', 'tests', 'upgrade');
const upgradeTestCwd = path.join(upgradeTestRoot, 'cwd');

process.env.TEDDY_UPGRADE_TEST_REPO_ROOT = repoRoot;
createDirectory(upgradeTestCwd);
process.chdir(upgradeTestCwd);
