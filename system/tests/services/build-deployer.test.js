/**
 * Static resources deployment service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import BuildDeployer from '../../src/services/build-deployer.js';

const TEST_DIR = './working/tests/build-deployer';
const BUILD_DIR = path.join(TEST_DIR, 'build');
const BASE_DIR = path.join(TEST_DIR, 'public');
const WEB_DIR = path.join(TEST_DIR, 'site', 'web');
const SYSTEM_ASSETS_DIR = path.join(TEST_DIR, 'system', 'assets');

function createConfig(overrides = {}) {
    const config = {
        system: {
            build: {
                siteDirs: {
                    web: WEB_DIR
                }
            },
            assets: {
                dir: SYSTEM_ASSETS_DIR
            }
        },
        site: {
            name: 'travelbook',
            version: '1.2.3',
            web: {
                local: {
                    host: 'cloudflare-workers'
                },
                static: {
                    host: 'simple-web-server'
                }
            },
            languages: {
                default: 'en',
                enabled: ['en', 'ja'],
                data: {
                    en: {
                        metadata: {
                            title: 'English'
                        }
                    },
                    ja: {
                        metadata: {
                            title: 'Japanese'
                        }
                    }
                }
            }
        },
        build: {
            id: 'build-123',
            date: '2025-06-25',
            env: 'local',
            opts: {
                ignoreHtml: false,
                ignoreWebConfig: false,
                ignoreRobots: false,
                ignoreSitemap: false
            },
            distDirs: {
                build: BUILD_DIR,
                base: BASE_DIR
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

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
    return JSON.parse(readFile(filePath));
}

function pathExists(filePath) {
    return fs.existsSync(filePath);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('build configuration is deployed to build config directory', () => {
    const config = createConfig();
    new BuildDeployer(config).deployBuildConfig();
    expect(readJson(path.join(BUILD_DIR, 'config', 'config.json')))
        .toEqual(config);
});

test('build metadata is deployed to base directory', () => {
    const config = createConfig();
    new BuildDeployer(config).deployBuildMetadata();
    expect(readJson(path.join(BASE_DIR, 'build.json'))).toEqual({
        id: 'build-123',
        date: '2025-06-25',
        site: {
            name: 'travelbook',
            version: '1.2.3'
        }
    });
});

test('language data is deployed for each enabled language', () => {
    const config = createConfig();
    new BuildDeployer(config).deployLanguages();
    expect(readJson(path.join(BUILD_DIR, 'languages', 'en.json'))).toEqual({
        metadata: {
            title: 'English'
        }
    });
    expect(readJson(path.join(BUILD_DIR, 'languages', 'ja.json'))).toEqual({
        metadata: {
            title: 'Japanese'
        }
    });
});

test('language deployment creates parent directories', () => {
    const config = createConfig();
    new BuildDeployer(config).deployLanguages();
    expect(pathExists(path.join(BUILD_DIR, 'languages'))).toBe(true);
});

test('default language pages are deployed to base directory', () => {
    const config = createConfig();
    writeFile(path.join(BASE_DIR, 'en', 'index.html'), 'home');
    writeFile(path.join(BASE_DIR, 'en', 'about', 'index.html'), 'about');
    new BuildDeployer(config).deployDefaultLanguagePages();
    expect(readFile(path.join(BASE_DIR, 'index.html'))).toBe('home');
    expect(readFile(path.join(BASE_DIR, 'about', 'index.html'))).toBe('about');
});

test('default language deployment falls back to first enabled language', () => {
    const config = createConfig();
    delete config.site.languages.default;
    writeFile(path.join(BASE_DIR, 'en', 'index.html'), 'home');
    new BuildDeployer(config).deployDefaultLanguagePages();
    expect(readFile(path.join(BASE_DIR, 'index.html'))).toBe('home');
});

test('default language deployment is skipped when HTML is ignored', () => {
    const config = createConfig();
    config.build.opts.ignoreHtml = true;
    writeFile(path.join(BASE_DIR, 'en', 'index.html'), 'home');
    new BuildDeployer(config).deployDefaultLanguagePages();
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
});

test('default language deployment skips missing language directory', () => {
    const config = createConfig();
    expect(() => new BuildDeployer(config).deployDefaultLanguagePages())
        .not.toThrow();
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
});

test('web host configuration files are deployed for configured host', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(
        WEB_DIR, 'hosts', 'cloudflare', 'workers', '_headers'), 'headers');
    writeFile(path.join(
        WEB_DIR, 'hosts', 'cloudflare', 'workers', '404.html'), 'not found');
    new BuildDeployer(config).deployWebConfig();
    expect(readFile(path.join(BASE_DIR, '_headers'))).toBe('headers');
    expect(readFile(path.join(BASE_DIR, '404.html'))).toBe('not found');
});

test('web host configuration deployment skips missing optional files', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(
        WEB_DIR, 'hosts', 'cloudflare', 'workers', '_headers'), 'headers');
    new BuildDeployer(config).deployWebConfig();
    expect(readFile(path.join(BASE_DIR, '_headers'))).toBe('headers');
    expect(pathExists(path.join(BASE_DIR, '404.html'))).toBe(false);
});

test('web host configuration deployment is skipped when ignored', () => {
    const config = createConfig();
    config.build.opts.ignoreWebConfig = true;
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(
        WEB_DIR, 'hosts', 'cloudflare', 'workers', '_headers'), 'headers');
    new BuildDeployer(config).deployWebConfig();
    expect(pathExists(path.join(BASE_DIR, '_headers'))).toBe(false);
});

test('web host configuration deployment skips unknown host', () => {
    const config = createConfig();
    config.build.env = 'static';
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(WEB_DIR, 'hosts', 'simple-web-server', 'config'),
        'config');
    new BuildDeployer(config).deployWebConfig();
    expect(fs.readdirSync(BASE_DIR)).toEqual([]);
});

test('robots file is deployed', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(WEB_DIR, 'robots', 'robots.txt'), 'robots');
    new BuildDeployer(config).deployRobots();
    expect(readFile(path.join(BASE_DIR, 'robots.txt'))).toBe('robots');
});

test('robots deployment is skipped when ignored', () => {
    const config = createConfig();
    config.build.opts.ignoreRobots = true;
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(WEB_DIR, 'robots', 'robots.txt'), 'robots');
    new BuildDeployer(config).deployRobots();
    expect(pathExists(path.join(BASE_DIR, 'robots.txt'))).toBe(false);
});

test('robots deployment skips missing optional file', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    expect(() => new BuildDeployer(config).deployRobots()).not.toThrow();
    expect(pathExists(path.join(BASE_DIR, 'robots.txt'))).toBe(false);
});

test('sitemap file is deployed', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(WEB_DIR, 'sitemap', 'sitemap.xml'), 'sitemap');
    new BuildDeployer(config).deploySitemap();
    expect(readFile(path.join(BASE_DIR, 'sitemap.xml'))).toBe('sitemap');
});

test('sitemap deployment is skipped when ignored', () => {
    const config = createConfig();
    config.build.opts.ignoreSitemap = true;
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(WEB_DIR, 'sitemap', 'sitemap.xml'), 'sitemap');
    new BuildDeployer(config).deploySitemap();
    expect(pathExists(path.join(BASE_DIR, 'sitemap.xml'))).toBe(false);
});

test('sitemap deployment skips missing optional file', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    expect(() => new BuildDeployer(config).deploySitemap()).not.toThrow();
    expect(pathExists(path.join(BASE_DIR, 'sitemap.xml'))).toBe(false);
});

test('build error page is deployed as index file', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    writeFile(path.join(
        SYSTEM_ASSETS_DIR, 'html', 'build-error.html'), 'build error');
    new BuildDeployer(config).deployBuildErrorPage();
    expect(readFile(path.join(BASE_DIR, 'index.html'))).toBe('build error');
});

test('build error page overwrites existing index file', () => {
    const config = createConfig();
    writeFile(path.join(BASE_DIR, 'index.html'), 'old index');
    writeFile(path.join(
        SYSTEM_ASSETS_DIR, 'html', 'build-error.html'), 'build error');
    new BuildDeployer(config).deployBuildErrorPage();
    expect(readFile(path.join(BASE_DIR, 'index.html'))).toBe('build error');
});

test('build error page deployment is skipped when base directory is missing',
    () => {
        const config = createConfig();
        writeFile(path.join(
            SYSTEM_ASSETS_DIR, 'html', 'build-error.html'), 'build error');
        new BuildDeployer(config).deployBuildErrorPage();
        expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
    });

test('build error page deployment skips missing optional source file', () => {
    const config = createConfig();
    fs.mkdirSync(BASE_DIR, { recursive: true });
    expect(() => new BuildDeployer(config).deployBuildErrorPage())
        .not.toThrow();
    expect(pathExists(path.join(BASE_DIR, 'index.html'))).toBe(false);
});
