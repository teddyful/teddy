/**
 * Build cleaner service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import BuildCleaner from '../../src/services/build-cleaner.js';

const TEST_DIR = './working/tests/build-cleaner';
const BUILD_DIR = path.join(TEST_DIR, 'build');
const BASE_DIR = path.join(TEST_DIR, 'public');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');

function createConfig(overrides = {}) {
    const config = {
        build: {
            opts: {
                customCssOnly: false,
                customJsOnly: false,
                generateDsPdf: false,
                ignoreAssets: false,
                ignoreAudio: false,
                ignoreCss: false,
                ignoreData: false,
                ignoreFonts: false,
                ignoreImages: false,
                ignoreJs: false,
                ignoreVideos: false,
                skipPostBuildCleanup: false
            },
            distDirs: {
                build: BUILD_DIR,
                base: BASE_DIR,
                assets: ASSETS_DIR
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function writeFile(filePath, content = 'content') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function pathExists(filePath) {
    return fs.existsSync(filePath);
}

function createBuildFiles() {
    writeFile(path.join(BUILD_DIR, 'config', 'language.json'), 'language');
    writeFile(path.join(BUILD_DIR, '.hidden'), 'hidden');
    writeFile(path.join(BASE_DIR, 'index.html'), 'index');
    writeFile(path.join(BASE_DIR, '.headers'), 'headers');
    writeFile(path.join(ASSETS_DIR, 'css', 'site.css'), 'css');
    writeFile(path.join(ASSETS_DIR, 'js', 'site.js'), 'js');
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('dist directories are cleaned completely by default', () => {
    const config = createConfig();
    createBuildFiles();
    const deletedPaths = new BuildCleaner(config).cleanDistDirectories();
    expect(deletedPaths.length).toBeGreaterThan(0);
    expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
        .toBe(false);
    expect(pathExists(path.join(BUILD_DIR, '.hidden'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, '.headers'))).toBe(false);
    expect(pathExists(path.join(ASSETS_DIR, 'css', 'site.css'))).toBe(false);
    expect(pathExists(path.join(ASSETS_DIR, 'js', 'site.js'))).toBe(false);
});

test('dist directory roots are preserved when contents are cleaned', () => {
    const config = createConfig();
    createBuildFiles();
    new BuildCleaner(config).cleanDistDirectories();
    expect(pathExists(BUILD_DIR)).toBe(true);
    expect(pathExists(BASE_DIR)).toBe(true);
});

test.each([
    'customCssOnly',
    'customJsOnly',
    'ignoreAssets',
    'ignoreAudio',
    'ignoreCss',
    'ignoreData',
    'ignoreFonts',
    'ignoreImages',
    'ignoreJs',
    'ignoreVideos'
])('asset directory is preserved when %s is enabled', optionName => {
    const config = createConfig();
    config.build.opts[optionName] = true;
    createBuildFiles();
    new BuildCleaner(config).cleanDistDirectories();
    expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
        .toBe(false);
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, '.headers'))).toBe(false);
    expect(pathExists(path.join(ASSETS_DIR, 'css', 'site.css'))).toBe(true);
    expect(pathExists(path.join(ASSETS_DIR, 'js', 'site.js'))).toBe(true);
});

test('cleanDistDirectories handles missing dist directories', () => {
    const config = createConfig();
    expect(new BuildCleaner(config).cleanDistDirectories()).toEqual([]);
});

test('cleanDistDirectories rejects unsafe build directory', () => {
    const config = createConfig();
    config.build.distDirs.build = '.';
    expect(() => new BuildCleaner(config).cleanDistDirectories())
        .toThrow('Cannot delete Build directory: unsafe directory path');
});

test('cleanDistDirectories rejects unsafe base directory', () => {
    const config = createConfig();
    config.build.distDirs.base = '';
    expect(() => new BuildCleaner(config).cleanDistDirectories())
        .toThrow('Cannot delete Base directory: directory path is empty');
});

test('cleanDistDirectories rejects unsafe assets directory', () => {
    const config = createConfig();
    config.build.opts.ignoreAssets = true;
    config.build.distDirs.assets = '..';
    expect(() => new BuildCleaner(config).cleanDistDirectories())
        .toThrow('Cannot delete Assets directory: unsafe directory path');
});

test('post build cleanup deletes build directory contents', () => {
    const config = createConfig();
    createBuildFiles();
    const deletedPaths = new BuildCleaner(config).postBuildCleanup();
    expect(deletedPaths.length).toBeGreaterThan(0);
    expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
        .toBe(false);
    expect(pathExists(path.join(BUILD_DIR, '.hidden'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(true);
    expect(pathExists(path.join(ASSETS_DIR, 'css', 'site.css'))).toBe(true);
});

test('post build cleanup preserves build directory root', () => {
    const config = createConfig();
    createBuildFiles();
    new BuildCleaner(config).postBuildCleanup();
    expect(pathExists(BUILD_DIR)).toBe(true);
});

test('post build cleanup is skipped when skipPostBuildCleanup is enabled', () => {
    const config = createConfig();
    config.build.opts.skipPostBuildCleanup = true;
    createBuildFiles();
    const deletedPaths = new BuildCleaner(config).postBuildCleanup();
    expect(deletedPaths).toBeUndefined();
    expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
        .toBe(true);
});

test('post build cleanup is skipped when PDF datasource generation is enabled',
    () => {
        const config = createConfig();
        config.build.opts.generateDsPdf = true;
        createBuildFiles();
        const deletedPaths = new BuildCleaner(config).postBuildCleanup();
        expect(deletedPaths).toBeUndefined();
        expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
            .toBe(true);
    });

test('post build cleanup handles missing build directory', () => {
    const config = createConfig();
    expect(new BuildCleaner(config).postBuildCleanup()).toEqual([]);
});

test('post build cleanup rejects unsafe build directory', () => {
    const config = createConfig();
    config.build.distDirs.build = '/';
    expect(() => new BuildCleaner(config).postBuildCleanup())
        .toThrow('Cannot delete Build directory: unsafe directory path');
});

test('post error build cleanup deletes build and base directory contents', () => {
    const config = createConfig();
    createBuildFiles();
    new BuildCleaner(config).postErrorBuildCleanup();
    expect(pathExists(path.join(BUILD_DIR, 'config', 'language.json')))
        .toBe(false);
    expect(pathExists(path.join(BUILD_DIR, '.hidden'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
    expect(pathExists(path.join(BASE_DIR, '.headers'))).toBe(false);
    expect(pathExists(path.join(ASSETS_DIR, 'css', 'site.css'))).toBe(false);
});

test('post error build cleanup preserves build and base directory roots', () => {
    const config = createConfig();
    createBuildFiles();
    new BuildCleaner(config).postErrorBuildCleanup();
    expect(pathExists(BUILD_DIR)).toBe(true);
    expect(pathExists(BASE_DIR)).toBe(true);
});

test('post error build cleanup handles missing directories', () => {
    const config = createConfig();
    expect(() => new BuildCleaner(config).postErrorBuildCleanup())
        .not.toThrow();
});

test('post error build cleanup rejects unsafe build directory', () => {
    const config = createConfig();
    config.build.distDirs.build = '..';
    expect(() => new BuildCleaner(config).postErrorBuildCleanup())
        .toThrow('Cannot delete Build directory: unsafe directory path');
});

test('post error build cleanup rejects unsafe base directory', () => {
    const config = createConfig();
    config.build.distDirs.base = '.';
    expect(() => new BuildCleaner(config).postErrorBuildCleanup())
        .toThrow('Cannot delete Base directory: unsafe directory path');
});
