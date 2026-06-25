/**
 * Assets builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const { mockMinify } = vi.hoisted(() => {
    return {
        mockMinify: vi.fn(async sourceFilePath => {
            return `minified:${path.basename(sourceFilePath)}`;
        })
    };
});

vi.mock('minify', () => {
    return {
        minify: mockMinify
    };
});

const { default: AssetBuilder } = await import(
    '../../src/services/asset-builder.js');

const TEST_DIR = './working/tests/asset-builder';
const SITE_ASSETS_DIR = path.join(TEST_DIR, 'site', 'assets');
const THEMES_DIR = path.join(TEST_DIR, 'themes');
const THEME_ASSETS_DIR = path.join(THEMES_DIR, 'bear', 'assets');
const SYSTEM_ASSETS_DIR = path.join(TEST_DIR, 'system', 'assets');
const DIST_DIR = path.join(TEST_DIR, 'dist');
const DIST_ASSETS_DIR = path.join(DIST_DIR, 'assets');
const DIST_SITE_CONFIG_DIR = path.join(DIST_DIR, 'site-config');
const DIST_PUBLIC_DIR = path.join(DIST_DIR, 'public');

function createConfig(overrides = {}) {
    const config = {
        package: {
            version: '0.0.15'
        },
        system: {
            assets: {
                dir: SYSTEM_ASSETS_DIR
            },
            build: {
                siteDirs: {
                    assets: SITE_ASSETS_DIR
                }
            },
            themes: THEMES_DIR
        },
        site: {
            version: '1.2.3',
            urls: {
                assets: '/assets',
                collectionIndex: '/assets/collection'
            },
            web: {
                local: {
                    domain: 'example.test'
                }
            },
            languages: {
                default: 'en',
                enabled: ['en', 'ja'],
                data: {
                    en: {
                        metadata: {
                            title: 'English'
                        },
                        collection: {
                            metadata: {
                                pages: [
                                    {
                                        id: 1,
                                        name: 'Heavy English page'
                                    }
                                ],
                                size: 1
                            }
                        }
                    },
                    ja: {
                        metadata: {
                            title: 'Japanese'
                        },
                        collection: {
                            metadata: {
                                pages: [
                                    {
                                        id: 2,
                                        name: 'Heavy Japanese page'
                                    }
                                ],
                                size: 1
                            }
                        }
                    }
                }
            },
            collection: {
                enabled: true,
                pagination: {
                    size: 10
                },
                sizes: {
                    en: 1,
                    ja: 1
                },
                index: {
                    documentStore: {
                        document: {
                            index: ['name', 'description']
                        }
                    }
                },
                search: {
                    minQueryLength: 2
                }
            },
            assets: {
                custom: {
                    css: ['site.css', 'nested/site-extra.css', 'ignore.txt'],
                    js: ['site.js', 'ignore.txt'],
                    images: {
                        favicon: {
                            ico: 'favicon.ico',
                            deployToRoot: true
                        }
                    }
                }
            },
            theme: {
                name: 'bear',
                assets: {
                    custom: {
                        css: ['theme.css'],
                        js: ['theme.js'],
                        images: {
                            favicon: {
                                ico: 'theme.ico',
                                deployToRoot: true
                            }
                        }
                    }
                }
            }
        },
        build: {
            env: 'local',
            opts: {
                ignoreAssets: false,
                ignoreCss: false,
                ignoreJs: false,
                ignoreImages: false,
                ignoreAudio: false,
                ignoreVideos: false,
                ignoreFonts: false,
                ignoreData: false,
                customCssOnly: false,
                customJsOnly: false,
                minifyCss: true,
                minifyJs: true
            },
            distDirs: {
                assets: DIST_ASSETS_DIR,
                base: DIST_PUBLIC_DIR,
                siteConfig: DIST_SITE_CONFIG_DIR
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

function writeAsset(sourceBaseDir, assetType, relPath, content = 'content') {
    writeFile(path.join(sourceBaseDir, assetType, relPath), content);
}

function expectFileContent(filePath, content) {
    expect(readFile(filePath)).toBe(content);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
    mockMinify.mockClear();
    mockMinify.mockImplementation(async sourceFilePath => {
        return `minified:${path.basename(sourceFilePath)}`;
    });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('site CSS assets are deployed', () => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, 'css', 'site.css', 'site css');
    new AssetBuilder(config).deployCssAssets('site');
    expectFileContent(path.join(DIST_ASSETS_DIR, 'css', 'site.css'),
        'site css');
});

test('theme CSS assets are deployed', () => {
    const config = createConfig();
    writeAsset(THEME_ASSETS_DIR, 'css', 'theme.css', 'theme css');
    new AssetBuilder(config).deployCssAssets('theme');
    expectFileContent(path.join(DIST_ASSETS_DIR, 'css', 'theme.css'),
        'theme css');
});

test.each([
    ['deployJsAssets', 'js'],
    ['deployImageAssets', 'images'],
    ['deployAudioAssets', 'audio'],
    ['deployVideoAssets', 'videos'],
    ['deployFontAssets', 'fonts'],
    ['deployDataAssets', 'data']
])('%s deploys site %s assets', (methodName, assetType) => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, assetType, 'asset.txt', assetType);
    new AssetBuilder(config)[methodName]('site');
    expectFileContent(path.join(DIST_ASSETS_DIR, assetType, 'asset.txt'),
        assetType);
});

test.each([
    ['deployJsAssets', 'js'],
    ['deployImageAssets', 'images'],
    ['deployAudioAssets', 'audio'],
    ['deployVideoAssets', 'videos'],
    ['deployFontAssets', 'fonts'],
    ['deployDataAssets', 'data']
])('%s deploys theme %s assets', (methodName, assetType) => {
    const config = createConfig();
    writeAsset(THEME_ASSETS_DIR, assetType, 'asset.txt', assetType);
    new AssetBuilder(config)[methodName]('theme');
    expectFileContent(path.join(DIST_ASSETS_DIR, assetType, 'asset.txt'),
        assetType);
});

test('asset deployment does nothing for unknown source type', () => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, 'css', 'site.css', 'site css');
    new AssetBuilder(config).deployCssAssets('unknown');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'css', 'site.css')))
        .toBe(false);
});

test('missing optional asset directory is skipped', () => {
    const config = createConfig();
    expect(() => new AssetBuilder(config).deployCssAssets('site'))
        .not.toThrow();
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'css'))).toBe(false);
});

test.each([
    ['deployCssAssets', 'css', 'ignoreCss'],
    ['deployJsAssets', 'js', 'ignoreJs'],
    ['deployImageAssets', 'images', 'ignoreImages'],
    ['deployAudioAssets', 'audio', 'ignoreAudio'],
    ['deployVideoAssets', 'videos', 'ignoreVideos'],
    ['deployFontAssets', 'fonts', 'ignoreFonts'],
    ['deployDataAssets', 'data', 'ignoreData']
])('%s honours %s option', (methodName, assetType, optionName) => {
    const config = createConfig();
    config.build.opts[optionName] = true;
    writeAsset(SITE_ASSETS_DIR, assetType, 'asset.txt', assetType);
    new AssetBuilder(config)[methodName]('site');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, assetType, 'asset.txt')))
        .toBe(false);
});

test.each([
    ['deployCssAssets', 'css'],
    ['deployJsAssets', 'js'],
    ['deployImageAssets', 'images'],
    ['deployAudioAssets', 'audio'],
    ['deployVideoAssets', 'videos'],
    ['deployFontAssets', 'fonts'],
    ['deployDataAssets', 'data']
])('%s honours ignoreAssets option', (methodName, assetType) => {
    const config = createConfig();
    config.build.opts.ignoreAssets = true;
    writeAsset(SITE_ASSETS_DIR, assetType, 'asset.txt', assetType);
    new AssetBuilder(config)[methodName]('site');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, assetType, 'asset.txt')))
        .toBe(false);
});

test('CSS asset deployment honours customCssOnly option', () => {
    const config = createConfig();
    config.build.opts.customCssOnly = true;
    writeAsset(SITE_ASSETS_DIR, 'css', 'site.css', 'site css');
    new AssetBuilder(config).deployCssAssets('site');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'css', 'site.css')))
        .toBe(false);
});

test('JavaScript asset deployment honours customJsOnly option', () => {
    const config = createConfig();
    config.build.opts.customJsOnly = true;
    writeAsset(SITE_ASSETS_DIR, 'js', 'site.js', 'site js');
    new AssetBuilder(config).deployJsAssets('site');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'js', 'site.js')))
        .toBe(false);
});

test('site favicon is deployed to root when configured', () => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, 'images', 'favicon.ico', 'site favicon');
    fs.mkdirSync(DIST_PUBLIC_DIR, { recursive: true });
    new AssetBuilder(config).deployFavicon('site');
    expectFileContent(path.join(DIST_PUBLIC_DIR, 'favicon.ico'),
        'site favicon');
});

test('theme favicon is deployed to root when configured', () => {
    const config = createConfig();
    writeAsset(THEME_ASSETS_DIR, 'images', 'theme.ico', 'theme favicon');
    fs.mkdirSync(DIST_PUBLIC_DIR, { recursive: true });
    new AssetBuilder(config).deployFavicon('theme');
    expectFileContent(path.join(DIST_PUBLIC_DIR, 'theme.ico'),
        'theme favicon');
});

test('favicon is not deployed when deployToRoot is false', () => {
    const config = createConfig();
    config.site.assets.custom.images.favicon.deployToRoot = false;
    writeAsset(SITE_ASSETS_DIR, 'images', 'favicon.ico', 'site favicon');
    new AssetBuilder(config).deployFavicon('site');
    expect(fs.existsSync(path.join(DIST_PUBLIC_DIR, 'favicon.ico')))
        .toBe(false);
});

test('favicon deployment skips unknown source type', () => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, 'images', 'favicon.ico', 'site favicon');
    new AssetBuilder(config).deployFavicon('unknown');
    expect(fs.existsSync(path.join(DIST_PUBLIC_DIR, 'favicon.ico')))
        .toBe(false);
});

test('system JavaScript assets are deployed to versioned vendor paths', () => {
    const config = createConfig();
    writeFile(path.join(SYSTEM_ASSETS_DIR, 'js', 'vendors', 'vendor.js'),
        'vendor');
    writeFile(path.join(SYSTEM_ASSETS_DIR, 'js', 'teddy', 'search.js'),
        'search');
    new AssetBuilder(config).deploySystemJsAssets();
    expectFileContent(path.join(
        DIST_ASSETS_DIR, 'js', 'vendors', 'vendor.js'), 'vendor');
    expectFileContent(path.join(
        DIST_ASSETS_DIR, 'js', 'vendors', 'teddy', '0.0.15', 'search.js'),
        'search');
});

test.each([
    'ignoreAssets',
    'ignoreJs',
    'customJsOnly'
])('system JavaScript asset deployment honours %s option', optionName => {
    const config = createConfig();
    config.build.opts[optionName] = true;
    writeFile(path.join(SYSTEM_ASSETS_DIR, 'js', 'vendors', 'vendor.js'),
        'vendor');
    new AssetBuilder(config).deploySystemJsAssets();
    expect(fs.existsSync(path.join(
        DIST_ASSETS_DIR, 'js', 'vendors', 'vendor.js'))).toBe(false);
});

test('site custom CSS assets are minified', async () => {
    const config = createConfig();
    writeAsset(SITE_ASSETS_DIR, 'css', 'site.css', 'body{}');
    writeAsset(SITE_ASSETS_DIR, 'css', 'nested/site-extra.css', 'main{}');
    writeAsset(SITE_ASSETS_DIR, 'css', 'ignore.txt', 'ignore');
    await new AssetBuilder(config).buildCustomCssAssets('site');
    expect(mockMinify).toHaveBeenCalledTimes(2);
    expectFileContent(path.join(DIST_ASSETS_DIR, 'css', 'site.min.css'),
        'minified:site.css');
    expectFileContent(path.join(
        DIST_ASSETS_DIR, 'css', 'nested', 'site-extra.min.css'),
        'minified:site-extra.css');
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'css', 'ignore.min.css')))
        .toBe(false);
});

test('theme custom JavaScript assets are minified', async () => {
    const config = createConfig();
    writeAsset(THEME_ASSETS_DIR, 'js', 'theme.js', 'const teddy = true;');
    await new AssetBuilder(config).buildCustomJsAssets('theme');
    expect(mockMinify).toHaveBeenCalledTimes(1);
    expect(mockMinify).toHaveBeenCalledWith(
        path.join(THEME_ASSETS_DIR, 'js', 'theme.js'),
        expect.objectContaining({
            js: expect.objectContaining({
                type: 'terser'
            })
        })
    );
    expectFileContent(path.join(DIST_ASSETS_DIR, 'js', 'theme.min.js'),
        'minified:theme.js');
});

test('custom CSS minification is skipped when minifyCss is false', async () => {
    const config = createConfig();
    config.build.opts.minifyCss = false;
    writeAsset(SITE_ASSETS_DIR, 'css', 'site.css', 'body{}');
    await new AssetBuilder(config).buildCustomCssAssets('site');
    expect(mockMinify).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(DIST_ASSETS_DIR, 'css', 'site.min.css')))
        .toBe(false);
});

test('custom JavaScript minification is skipped when ignoreJs is true',
    async () => {
        const config = createConfig();
        config.build.opts.ignoreJs = true;
        writeAsset(SITE_ASSETS_DIR, 'js', 'site.js', 'const teddy = true;');
        await new AssetBuilder(config).buildCustomJsAssets('site');
        expect(mockMinify).not.toHaveBeenCalled();
    });

test('custom asset minification throws contextual error on minify failure',
    async () => {
        const config = createConfig();
        const sourceFilePath = path.join(SITE_ASSETS_DIR, 'css', 'site.css');
        writeFile(sourceFilePath, 'body{}');
        mockMinify.mockRejectedValueOnce(new Error('minify failed'));
        await expect(new AssetBuilder(config).buildCustomCssAssets('site'))
            .rejects.toThrow(`Failed to minify asset '${sourceFilePath}'.`);
    });

test('build config JavaScript is generated for enabled collection', () => {
    const config = createConfig();
    const languageIndexKeys = {
        en: ['0.cfg', '1.doc']
    };
    new AssetBuilder(config).generateBuildConfigJs(languageIndexKeys);
    expect(readFile(path.join(DIST_SITE_CONFIG_DIR, 'config.js'))).toBe([
        'const ASSETS_BASE_URL = "/assets";',
        'const COLLECTION_INDEX_BASE_URL = "/assets/collection";',
        'const COLLECTION_PAGINATION_SIZE = 10;',
        'const COLLECTION_SIZES = {"en":1,"ja":1};',
        'const DEFAULT_LANGUAGE = "en";',
        'const DOMAIN_NAME = "example.test";',
        'const INDEX_DOCUMENT_STORE_CONFIG = ' +
            '{"document":{"index":["name","description"]}};',
        'const LANGUAGE_INDEX_KEYS = {"en":["0.cfg","1.doc"]};',
        'const MIN_SEARCH_QUERY_LENGTH = 2;',
        'const SITE_VERSION = "1.2.3";'
    ].join('\n'));
});

test('build config JavaScript is generated for disabled collection', () => {
    const config = createConfig();
    config.site.collection.enabled = false;
    config.site.urls.collectionIndex = undefined;
    new AssetBuilder(config).generateBuildConfigJs();
    expect(readFile(path.join(DIST_SITE_CONFIG_DIR, 'config.js'))).toBe([
        'const ASSETS_BASE_URL = "/assets";',
        'const COLLECTION_INDEX_BASE_URL = "";',
        'const COLLECTION_PAGINATION_SIZE = 0;',
        'const COLLECTION_SIZES = {};',
        'const DEFAULT_LANGUAGE = "en";',
        'const DOMAIN_NAME = "example.test";',
        'const INDEX_DOCUMENT_STORE_CONFIG = {};',
        'const LANGUAGE_INDEX_KEYS = {};',
        'const MIN_SEARCH_QUERY_LENGTH = 0;',
        'const SITE_VERSION = "1.2.3";'
    ].join('\n'));
});

test('content JavaScript is generated without heavy collection pages', () => {
    const config = createConfig();
    new AssetBuilder(config).generateContentJs();
    const js = readFile(path.join(DIST_SITE_CONFIG_DIR, 'site.js'));
    expect(js).toBe(
        'const site = ' +
        JSON.stringify({
            en: {
                metadata: {
                    title: 'English'
                },
                collection: {
                    metadata: {
                        size: 1
                    }
                }
            },
            ja: {
                metadata: {
                    title: 'Japanese'
                },
                collection: {
                    metadata: {
                        size: 1
                    }
                }
            }
        }) +
        ';'
    );
});

test('content JavaScript generation does not mutate source language data', () => {
    const config = createConfig();
    new AssetBuilder(config).generateContentJs();
    expect(config.site.languages.data.en.collection.metadata.pages).toEqual([
        {
            id: 1,
            name: 'Heavy English page'
        }
    ]);
});

test('content JavaScript handles languages without collection pages', () => {
    const config = createConfig();
    delete config.site.languages.data.en.collection;
    new AssetBuilder(config).generateContentJs();
    expect(readFile(path.join(DIST_SITE_CONFIG_DIR, 'site.js')))
        .toContain('"en":{"metadata":{"title":"English"}}');
});
