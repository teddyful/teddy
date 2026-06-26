/**
 * Upgrade CLI unit tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { expect, test } from 'vitest';

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.env.TEDDY_UPGRADE_TEST_REPO_ROOT;
const UPGRADE_SCRIPT = path.join(REPO_ROOT, 'upgrade.js');

test('upgrade CLI help documents simulation and worker options', async () => {
    const { stdout } = await execFileAsync(process.execPath, [
        'upgrade.js',
        '--help'
    ], { cwd: REPO_ROOT });
    expect(stdout).toContain('--yes');
    expect(stdout).toContain('--skip-install');
    expect(stdout).toContain('--dry-run');
    expect(stdout).toContain('--upgrade-worker');
    expect(stdout).toContain('--target <path>');
});

test('upgrade bootstrap passes simulation options to worker process', () => {
    const source = fs.readFileSync(UPGRADE_SCRIPT, 'utf8');
    expect(source).toContain(
        "...(args.skipInstall ? ['--skip-install'] : [])"
    );
    expect(source).toContain("...(args.dryRun ? ['--dry-run'] : [])");
    expect(source).toContain(
        "...(args.deleteBackup ? ['--delete-backup'] : [])"
    );
});

test('upgrade worker receives the target Teddy path', () => {
    const source = fs.readFileSync(UPGRADE_SCRIPT, 'utf8');
    expect(source).toContain("'--upgrade-worker'");
    expect(source).toContain("'--target'");
    expect(source).toContain('pathToTeddy: opts.target');
});
