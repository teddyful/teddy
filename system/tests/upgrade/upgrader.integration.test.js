/**
 * Upgrader service integration tests.
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

import {
    createMinimalTeddy,
    createTestDir,
    createUpgradeConfig,
    copyRuntimeUpgradeCode,
    writeFile
} from './helpers/upgrader-fixtures.js';

const execFileAsync = promisify(execFile);

async function runWorker(releaseDir, args) {
    try {
        return await execFileAsync(
            process.execPath,
            [
                path.join(releaseDir, 'upgrade.js'),
                '--upgrade-worker',
                ...args
            ],
            {
                cwd: releaseDir,
                env: {
                    ...process.env,
                    NO_COLOR: '1'
                },
                maxBuffer: 1024 * 1024 * 20
            }
        );
    } catch (error) {
        throw new Error([
            error.message,
            error.stdout,
            error.stderr
        ].filter(Boolean).join('\n'));
    }
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createTargetAndRelease(testName) {
    const testDir = createTestDir(testName);
    const config = createUpgradeConfig();
    const targetDir = path.join(testDir, 'target');
    const releaseDir = path.join(testDir, 'release');
    createMinimalTeddy(targetDir, {
        version: '0.0.15',
        marker: 'old',
        upgradeConfig: config
    });
    createMinimalTeddy(releaseDir, {
        version: '0.0.16',
        marker: 'new',
        upgradeConfig: config
    });
    copyRuntimeUpgradeCode(releaseDir);
    writeFile(path.join(targetDir, 'wrangler.jsonc'), '{ "name": "custom" }\n');
    writeFile(path.join(targetDir, 'sites', 'custom-site', 'site.json'),
        '{ "site": { "name": "custom-site" } }\n');
    writeFile(path.join(targetDir, 'themes', 'custom-theme', 'theme.json'),
        '{ "theme": { "name": "custom-theme" } }\n');
    return { releaseDir, targetDir };
}

test('worker upgrades target Teddy tree without touching user files',
    async () => {
        const { releaseDir, targetDir } =
            createTargetAndRelease('upgrader-integration-worker-success');

        const { stdout, stderr } = await runWorker(releaseDir, [
            '--target',
            path.resolve(targetDir),
            '--skip-install'
        ]);
        expect(`${stdout}${stderr}`).toContain(
            'Successfully finished upgrading Teddy!'
        );
        expect(readJson(path.join(targetDir, 'package.json')).version)
            .toBe('0.0.16');
        expect(fs.readFileSync(path.join(targetDir, 'system', 'VERSION.txt'),
            'utf8')).toBe('new');
        expect(fs.readFileSync(path.join(targetDir, 'themes', 'bear',
            'VERSION.txt'), 'utf8')).toBe('new');
        expect(fs.readFileSync(path.join(targetDir, 'wrangler.jsonc'), 'utf8'))
            .toContain('custom');
        expect(fs.existsSync(path.join(targetDir, 'sites', 'custom-site',
            'site.json'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'themes', 'custom-theme',
            'theme.json'))).toBe(true);
        const backupRoot = path.join(targetDir, 'working', 'upgrade', 'backups');
        const backups = fs.readdirSync(backupRoot);
        expect(backups.length).toBe(1);
        expect(readJson(path.join(backupRoot, backups[0], 'package.json'))
            .version).toBe('0.0.15');
        expect(fs.existsSync(path.join(targetDir, 'node_modules'))).toBe(false);
    });

test('worker deletes backup after successful upgrade when requested',
    async () => {
        const { releaseDir, targetDir } =
            createTargetAndRelease('upgrader-integration-delete-backup');
        await runWorker(releaseDir, [
            '--target',
            path.resolve(targetDir),
            '--skip-install',
            '--delete-backup'
        ]);
        const backupRoot = path.join(targetDir, 'working', 'upgrade', 'backups');
        expect(fs.existsSync(backupRoot)).toBe(true);
        expect(fs.readdirSync(backupRoot)).toEqual([]);
    });

test('worker dry run leaves target Teddy tree unchanged', async () => {
    const { releaseDir, targetDir } =
        createTargetAndRelease('upgrader-integration-dry-run');
    const beforePackage = fs.readFileSync(path.join(targetDir, 'package.json'),
        'utf8');
    const beforeSystemMarker = fs.readFileSync(path.join(targetDir, 'system',
        'VERSION.txt'), 'utf8');
    const { stdout, stderr } = await runWorker(releaseDir, [
        '--target',
        path.resolve(targetDir),
        '--dry-run',
        '--skip-install'
    ]);
    expect(`${stdout}${stderr}`).toContain(
        'Dry run complete. No files were changed.'
    );
    expect(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'))
        .toBe(beforePackage);
    expect(fs.readFileSync(path.join(targetDir, 'system', 'VERSION.txt'),
        'utf8')).toBe(beforeSystemMarker);
    expect(fs.existsSync(path.join(targetDir, 'working'))).toBe(false);
});
