/**
 * Build setup service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import BuildSetup from '../../src/services/build-setup.js';

const TEST_DIR = './working/tests/build-setup';
const BASE_DIR = path.join(TEST_DIR, 'dist', 'public');
const BUILD_DIR = path.join(TEST_DIR, 'dist', 'build');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const COLLECTION_DIR = path.join(ASSETS_DIR, 'collection');

function createConfig(overrides = {}) {
    const config = {
        build: {
            distDirs: {
                base: BASE_DIR,
                build: BUILD_DIR,
                assets: ASSETS_DIR,
                collection: COLLECTION_DIR
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function expectDirectoryExists(dirPath) {
    expect(fs.existsSync(dirPath)).toBe(true);
    expect(fs.statSync(dirPath).isDirectory()).toBe(true);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('complete dist directory structure is created', () => {
    const config = createConfig();
    new BuildSetup(config).createDistDirectoryStructure();
    expectDirectoryExists(BASE_DIR);
    expectDirectoryExists(BUILD_DIR);
    expectDirectoryExists(path.join(BUILD_DIR, 'config'));
    expectDirectoryExists(path.join(BUILD_DIR, 'languages'));
    expectDirectoryExists(path.join(BUILD_DIR, 'templates'));
    expectDirectoryExists(ASSETS_DIR);
    expectDirectoryExists(COLLECTION_DIR);
});

test('complete dist directory structure creates nested parent directories', () => {
    const config = createConfig();
    new BuildSetup(config).createDistDirectoryStructure();
    expectDirectoryExists(path.join(TEST_DIR, 'dist'));
    expectDirectoryExists(BASE_DIR);
    expectDirectoryExists(BUILD_DIR);
});

test('complete dist directory structure is idempotent', () => {
    const config = createConfig();
    const buildSetup = new BuildSetup(config);
    buildSetup.createDistDirectoryStructure();
    buildSetup.createDistDirectoryStructure();
    expectDirectoryExists(BASE_DIR);
    expectDirectoryExists(BUILD_DIR);
    expectDirectoryExists(path.join(BUILD_DIR, 'config'));
    expectDirectoryExists(path.join(BUILD_DIR, 'languages'));
    expectDirectoryExists(path.join(BUILD_DIR, 'templates'));
    expectDirectoryExists(ASSETS_DIR);
    expectDirectoryExists(COLLECTION_DIR);
});

test('complete dist directory structure preserves existing files', () => {
    const config = createConfig();
    const existingFilePath = path.join(BUILD_DIR, 'existing.txt');
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.writeFileSync(existingFilePath, 'existing');
    new BuildSetup(config).createDistDirectoryStructure();
    expect(fs.readFileSync(existingFilePath, 'utf8')).toBe('existing');
});

test('base dist directory is created', () => {
    const config = createConfig();
    new BuildSetup(config).createBaseDistDirectory();
    expectDirectoryExists(BASE_DIR);
});

test('base dist directory creates nested parent directories', () => {
    const config = createConfig();
    new BuildSetup(config).createBaseDistDirectory();
    expectDirectoryExists(path.join(TEST_DIR, 'dist'));
    expectDirectoryExists(BASE_DIR);
});

test('base dist directory creation is idempotent', () => {
    const config = createConfig();
    const buildSetup = new BuildSetup(config);
    buildSetup.createBaseDistDirectory();
    buildSetup.createBaseDistDirectory();
    expectDirectoryExists(BASE_DIR);
});

test('base dist directory creation does not create other dist directories', () => {
    const config = createConfig();
    new BuildSetup(config).createBaseDistDirectory();
    expectDirectoryExists(BASE_DIR);
    expect(fs.existsSync(BUILD_DIR)).toBe(false);
    expect(fs.existsSync(ASSETS_DIR)).toBe(false);
    expect(fs.existsSync(COLLECTION_DIR)).toBe(false);
});

test('base dist directory creation preserves existing files', () => {
    const config = createConfig();
    const existingFilePath = path.join(BASE_DIR, 'existing.txt');
    fs.mkdirSync(BASE_DIR, { recursive: true });
    fs.writeFileSync(existingFilePath, 'existing');
    new BuildSetup(config).createBaseDistDirectory();
    expect(fs.readFileSync(existingFilePath, 'utf8')).toBe('existing');
});

test('complete dist directory structure supports custom dist directory paths',
    () => {
        const config = createConfig({
            build: {
                distDirs: {
                    base: path.join(TEST_DIR, 'custom', 'base'),
                    build: path.join(TEST_DIR, 'custom', 'build'),
                    assets: path.join(TEST_DIR, 'custom', 'assets'),
                    collection: path.join(TEST_DIR, 'custom', 'collection')
                }
            }
        });
        new BuildSetup(config).createDistDirectoryStructure();
        expectDirectoryExists(path.join(TEST_DIR, 'custom', 'base'));
        expectDirectoryExists(path.join(TEST_DIR, 'custom', 'build'));
        expectDirectoryExists(path.join(TEST_DIR, 'custom', 'build', 'config'));
        expectDirectoryExists(path.join(
            TEST_DIR, 'custom', 'build', 'languages'));
        expectDirectoryExists(path.join(
            TEST_DIR, 'custom', 'build', 'templates'));
        expectDirectoryExists(path.join(TEST_DIR, 'custom', 'assets'));
        expectDirectoryExists(path.join(TEST_DIR, 'custom', 'collection'));
    });
