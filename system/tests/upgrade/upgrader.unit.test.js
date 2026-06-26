/**
 * Upgrader service unit tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, expect, test, vi } from 'vitest';

import logger from '../../src/middleware/logger.js';
import Upgrader from '../../src/services/upgrade/upgrader.js';
import {
    createMinimalTeddy,
    createOfflineReleaseServer,
    createTestDir,
    createUpgradeConfig,
    createZipFromDirectory,
    copyRuntimeUpgradeCode,
    sha256,
    writeFile
} from './helpers/upgrader-fixtures.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
});

test('prepareUpgrade returns no-op when latest version is current version',
    async () => {
        const testDir = createTestDir('upgrader-unit-no-update');
        const targetDir = path.join(testDir, 'target');
        createMinimalTeddy(targetDir, { version: '0.0.15' });
        vi.stubGlobal('fetch', vi.fn(async () => {
            return new Response(JSON.stringify({ tag_name: 'v0.0.15' }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }));
        const upgrader = new Upgrader({
            pathToTeddy: targetDir,
            yes: true
        }, createUpgradeConfig());
        await expect(upgrader.prepareUpgrade()).resolves.toEqual({
            upgradeAvailable: false,
            statusCode: 0
        });
        expect(globalThis.fetch).toHaveBeenCalledOnce();
        expect(fs.existsSync(path.join(targetDir, 'working'))).toBe(false);
    });

test('prepareUpgrade downloads, verifies, extracts, and can clean up release',
    async () => {
        const testDir = createTestDir('upgrader-unit-prepare');
        const targetDir = path.join(testDir, 'target');
        const releaseDir = path.join(testDir, 'release-source');
        const archivePath = path.join(testDir, 'teddy-0.0.16.zip');
        createMinimalTeddy(releaseDir, {
            version: '0.0.16',
            marker: 'new'
        });
        copyRuntimeUpgradeCode(releaseDir);
        createZipFromDirectory(releaseDir, archivePath);
        const checksumText = `${sha256(archivePath)}  teddy-0.0.16.zip\n`;
        const server = await createOfflineReleaseServer({
            version: '0.0.16',
            archivePath,
            checksumText
        });
        try {
            const config = createUpgradeConfig({
                latestUrl: `${server.baseUrl}/releases/latest`,
                downloadBaseUrl: `${server.baseUrl}/releases/download/v\${version}`
            });
            createMinimalTeddy(targetDir, {
                version: '0.0.15',
                marker: 'old',
                upgradeConfig: config
            });

            const upgrader = new Upgrader({
                pathToTeddy: targetDir,
                yes: true
            }, config);
            const result = await upgrader.prepareUpgrade();

            expect(result.upgradeAvailable).toBe(true);
            expect(result.currentVersion).toBe('0.0.15');
            expect(result.latestVersion).toBe('0.0.16');
            expect(result.workerScriptPath).toContain(
                path.join('working', 'upgrade', 'downloads', '0.0.16')
            );
            expect(fs.existsSync(result.workerScriptPath)).toBe(true);

            upgrader.cleanupPreparedUpgrade(result);
            expect(fs.existsSync(result.downloadDir)).toBe(false);
        } finally {
            await server.close();
        }
    });

test('prepareUpgrade fails and removes download when checksum is invalid',
    async () => {
        vi.spyOn(logger, 'error').mockImplementation(() => {});
        vi.spyOn(logger, 'info').mockImplementation(() => {});

        const testDir = createTestDir('upgrader-unit-bad-checksum');
        const targetDir = path.join(testDir, 'target');
        const releaseDir = path.join(testDir, 'release-source');
        const archivePath = path.join(testDir, 'teddy-0.0.16.zip');
        createMinimalTeddy(releaseDir, {
            version: '0.0.16',
            marker: 'new'
        });
        copyRuntimeUpgradeCode(releaseDir);
        createZipFromDirectory(releaseDir, archivePath);

        const server = await createOfflineReleaseServer({
            version: '0.0.16',
            archivePath,
            checksumText: `bad-checksum  teddy-0.0.16.zip\n`
        });
        try {
            const config = createUpgradeConfig({
                latestUrl: `${server.baseUrl}/releases/latest`,
                downloadBaseUrl: `${server.baseUrl}/releases/download/v\${version}`
            });
            createMinimalTeddy(targetDir, {
                version: '0.0.15',
                marker: 'old',
                upgradeConfig: config
            });

            const upgrader = new Upgrader({
                pathToTeddy: targetDir,
                yes: true
            }, config);
            const result = await upgrader.prepareUpgrade();

            expect(result).toEqual({
                upgradeAvailable: false,
                statusCode: 1
            });
            expect(fs.existsSync(
                path.join(targetDir, 'working', 'upgrade', 'downloads', '0.0.16')
            )).toBe(false);
        } finally {
            await server.close();
        }
    });

test('upgradeTarget dry run validates without mutating target', async () => {
    const testDir = createTestDir('upgrader-unit-dry-run');
    const targetDir = path.join(testDir, 'target');
    createMinimalTeddy(targetDir, {
        version: '0.0.15',
        marker: 'old'
    });
    writeFile(path.join(targetDir, 'wrangler.jsonc'), '{ "name": "custom" }\n');
    const upgrader = new Upgrader({
        pathToTeddy: targetDir,
        dryRun: true,
        skipInstall: true
    }, createUpgradeConfig());
    await upgrader.upgradeTarget();
    expect(upgrader.statusCode).toBe(0);
    expect(JSON.parse(
        fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8')
    ).version).toBe('0.0.15');
    expect(fs.readFileSync(path.join(targetDir, 'system', 'VERSION.txt'), 'utf8'))
        .toBe('old');
    expect(fs.existsSync(path.join(targetDir, 'working'))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, 'wrangler.jsonc'))).toBe(true);
});
