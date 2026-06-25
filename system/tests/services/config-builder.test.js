/**
 * Configuration builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import ConfigBuilder from '../../src/services/config-builder.js';

const TEST_DIR = './working/tests/config-builder';
const SITES_DIR = path.join(TEST_DIR, 'sites');
const THEMES_DIR = path.join(TEST_DIR, 'themes');
const SITE_NAME = 'travelbook';
const THEME_NAME = 'bear';
const SITE_DIR = path.join(SITES_DIR, SITE_NAME);
const THEME_DIR = path.join(THEMES_DIR, THEME_NAME);

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 4));
}

function createPackageConfig() {
    return {
        name: 'teddy',
        version: '0.0.15',
        license: 'GPL-3.0'
    };
}

function createSystemConfig() {
    return {
        system: {
            sites: SITES_DIR,
            themes: THEMES_DIR,
            assets: {
                dir: path.join(TEST_DIR, 'system', 'assets')
            }
        }
    };
}

function createOptions(overrides = {}) {
    return {
        siteName: SITE_NAME,
        themeName: THEME_NAME,
        env: 'local',
        minifyCss: true,
        minifyHtml: false,
        minifyJs: true,
        versionAssetsSiteNumber: false,
        versionAssetsBuildId: false,
        versionCollectionSiteNumber: false,
        versionCollectionBuildId: false,
        versionSiteConfigSiteNumber: false,
        versionSiteConfigBuildId: false,
        versionBuildDate: false,
        ...overrides
    };
}

function createSiteConfig(overrides = {}) {
    return {
        site: {
            name: SITE_NAME,
            version: '1.2.3',
            languages: {
                enabled: ['en', 'ja']
            },
            collection: {
                enabled: true,
                pagesDir: 'Blog Posts',
                pagination: {
                    size: 10
                },
                sort: {
                    key: 'date',
                    order: 'desc'
                },
                search: {
                    minQueryLength: 2
                },
                taxonomy: {
                    categories: ['asia']
                },
                index: {
                    content: true,
                    documentStore: {
                        document: {
                            index: ['name', 'description']
                        }
                    }
                }
            },
            urls: {
                about: '/about/',
                external: {
                    teddy: 'https://teddyful.com'
                }
            },
            web: {
                local: {
                    domain: 'localhost:8080',
                    http: {
                        secure: false
                    },
                    host: 'simple-web-server'
                },
                production: {
                    domain: 'example.com',
                    http: {
                        secure: true
                    },
                    host: 'cloudflare-workers'
                }
            },
            ...overrides
        }
    };
}

function createThemeConfig(overrides = {}) {
    return {
        theme: {
            name: THEME_NAME,
            version: '2.0.0',
            assets: {
                custom: {
                    css: ['theme.css']
                }
            },
            ...overrides
        }
    };
}

function createLanguageFiles(language, title) {
    const languageDir = path.join(SITE_DIR, 'languages', language);
    writeJson(path.join(languageDir, 'metadata.json'), {
        metadata: {
            title
        }
    });
    writeJson(path.join(languageDir, 'contributors.json'), {
        contributors: {
            default: 'teddy',
            teddy: {
                name: 'Teddy',
                url: '${pages.urls.about}'
            }
        }
    });
    writeJson(path.join(languageDir, 'taxonomy.json'), {
        taxonomy: {
            categories: {
                asia: language === 'ja' ? 'アジア' : 'Asia'
            }
        }
    });
}

function createFixture({
    siteConfig = createSiteConfig(),
    themeConfig = createThemeConfig()
} = {}) {
    writeJson(path.join(SITE_DIR, 'site.json'), siteConfig);
    writeJson(path.join(THEME_DIR, 'theme.json'), themeConfig);
    createLanguageFiles('en', 'English');
    createLanguageFiles('ja', 'Japanese');
}

function buildConfig({
    packageConfig = createPackageConfig(),
    systemConfig = createSystemConfig(),
    opts = createOptions(),
    error = false
} = {}) {
    return new ConfigBuilder(packageConfig, systemConfig, opts).build(error);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('build merges package system and site configuration', () => {
    createFixture();
    const config = buildConfig();
    expect(config.package).toEqual(createPackageConfig());
    expect(config.system.sites).toBe(SITES_DIR);
    expect(config.site.name).toBe(SITE_NAME);
    expect(config.site.version).toBe('1.2.3');
});

test('build loads theme configuration into site theme', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.theme).toEqual(createThemeConfig().theme);
});

test('build identifies first enabled language as default language', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.languages.default).toBe('en');
});

test('build creates system build site directory paths', () => {
    createFixture();
    const config = buildConfig();
    expect(config.system.build).toEqual({
        siteDirs: {
            assets: path.join(SITE_DIR, 'assets'),
            languages: path.join(SITE_DIR, 'languages'),
            pages: path.join(SITE_DIR, 'pages'),
            web: path.join(SITE_DIR, 'web')
        },
        siteDistDir: path.join(SITE_DIR, 'public')
    });
});

test('build creates build metadata and user options', () => {
    createFixture();
    const opts = createOptions({
        env: 'production'
    });
    const config = buildConfig({ opts });
    expect(config.build.date).toMatch(/^\d{14}$/);
    expect(config.build.id).toBe(`${config.site.version}-${config.build.date}`);
    expect(config.build.env).toBe('production');
    expect(config.build.opts).toEqual(opts);
});

test('build creates default distribution directories', () => {
    createFixture();
    const config = buildConfig();
    expect(config.build.distDirs).toEqual({
        base: path.join(SITE_DIR, 'public', 'local'),
        build: path.join(SITE_DIR, 'build', 'local', '1.2.3'),
        assets: path.join(SITE_DIR, 'public', 'local', 'assets'),
        collection: path.join(
            SITE_DIR, 'public', 'local', 'assets', 'collection'),
        siteConfig: path.join(
            SITE_DIR, 'public', 'local', 'assets', 'js', 'site')
    });
});

test('build versions build directory by build date when requested', () => {
    createFixture();
    const config = buildConfig({
        opts: createOptions({
            versionBuildDate: true
        })
    });
    expect(config.build.distDirs.build).toBe(path.join(
        SITE_DIR, 'build', 'local', '1.2.3', config.build.date));
});

test('build versions asset collection and site config URLs by site version',
    () => {
        createFixture();
        const config = buildConfig({
            opts: createOptions({
                versionAssetsSiteNumber: true,
                versionCollectionSiteNumber: true,
                versionSiteConfigSiteNumber: true
            })
        });
        expect(config.site.urls.assets).toBe('/assets/1.2.3');
        expect(config.site.urls.collectionIndex)
            .toBe('/assets/1.2.3/collection/1.2.3');
        expect(config.site.urls.siteConfig)
            .toBe('/assets/1.2.3/js/site/1.2.3');
        expect(config.build.distDirs.assets).toBe(path.join(
            SITE_DIR, 'public', 'local', 'assets', '1.2.3'));
    });

test('build versions asset collection and site config URLs by build id',
    () => {
        createFixture();
        const config = buildConfig({
            opts: createOptions({
                versionAssetsBuildId: true,
                versionCollectionBuildId: true,
                versionSiteConfigBuildId: true
            })
        });
        expect(config.site.urls.assets).toBe(`/assets/${config.build.id}`);
        expect(config.site.urls.collectionIndex)
            .toBe(`/assets/${config.build.id}/collection/${config.build.id}`);
        expect(config.site.urls.siteConfig)
            .toBe(`/assets/${config.build.id}/js/site/${config.build.id}`);
    });

test('build versions URLs by site version and build date when both flags set',
    () => {
        createFixture();
        const config = buildConfig({
            opts: createOptions({
                versionAssetsSiteNumber: true,
                versionAssetsBuildId: true
            })
        });
        expect(config.site.urls.assets)
            .toBe(`/assets/1.2.3/${config.build.date}`);
    });

test('build aggregates language data for all enabled languages', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.languages.data.en.metadata.title).toBe('English');
    expect(config.site.languages.data.en.contributors.default).toBe('teddy');
    expect(config.site.languages.data.en.taxonomy.categories.asia).toBe('Asia');
    expect(config.site.languages.data.ja.metadata.title).toBe('Japanese');
});

test('build localizes language URLs and leaves external URLs unchanged', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.languages.data.en.urls.about).toBe('/about/');
    expect(config.site.languages.data.ja.urls.about).toBe('/ja/about/');
    expect(config.site.languages.data.ja.urls.external.teddy)
        .toBe('https://teddyful.com');
});

test('build adds collection URL to language data when collection enabled',
    () => {
        createFixture();
        const config = buildConfig();
        expect(config.site.languages.data.en.urls.collection)
            .toBe('/blog-posts');
        expect(config.site.languages.data.ja.urls.collection)
            .toBe('/ja/blog-posts');
    });

test('build normalizes collection pages directory', () => {
    createFixture({
        siteConfig: createSiteConfig({
            collection: {
                ...createSiteConfig().site.collection,
                pagesDir: 'Blog Posts!/2025'
            }
        })
    });
    const config = buildConfig();
    expect(config.site.urls.collection).toBe('/blog-posts/2025');
});

test('build throws when normalized collection pages directory is empty', () => {
    createFixture({
        siteConfig: createSiteConfig({
            collection: {
                ...createSiteConfig().site.collection,
                pagesDir: '!!!'
            }
        })
    });
    expect(() => buildConfig())
        .toThrow('Collection pages directory cannot be empty.');
});

test('build adds asset minification configuration to language data', () => {
    createFixture();
    const config = buildConfig({
        opts: createOptions({
            minifyCss: false,
            minifyHtml: true,
            minifyJs: false
        })
    });
    expect(config.site.languages.data.en.assets.minify).toEqual({
        css: false,
        html: true,
        js: false
    });
});

test('build adds site metadata to language data', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.languages.data.en.site).toEqual({
        name: SITE_NAME,
        version: '1.2.3'
    });
});

test('build stores static asset collection and site config URLs on site config',
    () => {
        createFixture();
        const config = buildConfig();
        expect(config.site.urls.assets).toBe('/assets');
        expect(config.site.urls.collectionIndex).toBe('/assets/collection');
        expect(config.site.urls.siteConfig).toBe('/assets/js/site');
    });

test('build creates insecure local base URL', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.web.baseUrl).toBe('http://localhost:8080');
});

test('build creates secure production base URL', () => {
    createFixture();
    const config = buildConfig({
        opts: createOptions({
            env: 'production'
        })
    });
    expect(config.site.web.baseUrl).toBe('https://example.com');
});

test('build adds normalized collection URL to site URLs', () => {
    createFixture();
    const config = buildConfig();
    expect(config.site.urls.collection).toBe('/blog-posts');
});

test('build adds content to document index when content indexing is enabled',
    () => {
        createFixture();
        const config = buildConfig();
        expect(config.site.collection.index.documentStore.document.index)
            .toEqual(['name', 'description', 'content']);
    });

test('build does not duplicate content in document index', () => {
    const collection = structuredClone(createSiteConfig().site.collection);
    collection.index.documentStore.document.index.push('content');
    createFixture({
        siteConfig: createSiteConfig({
            collection
        })
    });
    const config = buildConfig();
    expect(config.site.collection.index.documentStore.document.index)
        .toEqual(['name', 'description', 'content']);
});

test('build does not add content to document index when disabled', () => {
    const collection = structuredClone(createSiteConfig().site.collection);
    collection.index.content = false;
    createFixture({
        siteConfig: createSiteConfig({
            collection
        })
    });
    const config = buildConfig();
    expect(config.site.collection.index.documentStore.document.index)
        .toEqual(['name', 'description']);
});

test('build skips collection URL and content index mutation when disabled',
    () => {
        const collection = structuredClone(createSiteConfig().site.collection);
        collection.enabled = false;
        createFixture({
            siteConfig: createSiteConfig({
                collection
            })
        });
        const config = buildConfig();
        expect(config.site.urls.collection).toBeUndefined();
        expect(config.site.languages.data.en.urls.collection).toBeUndefined();
        expect(config.site.collection.index.documentStore.document.index)
            .toEqual(['name', 'description']);
    });

test('build ensures site URLs object exists when omitted', () => {
    const siteConfig = createSiteConfig();
    delete siteConfig.site.urls;
    createFixture({ siteConfig });
    const config = buildConfig();
    expect(config.site.urls.assets).toBe('/assets');
    expect(config.site.languages.data.en.urls.assets).toBe('/assets');
});

test('error build returns before language and web enrichment', () => {
    createFixture();
    const config = buildConfig({ error: true });
    expect(config.build.distDirs.base)
        .toBe(path.join(SITE_DIR, 'public', 'local'));
    expect(config.site.languages.data).toBeUndefined();
    expect(config.site.web.baseUrl).toBeUndefined();
    expect(config.site.urls.assets).toBeUndefined();
});

test('constructor clones input package system and options objects', () => {
    createFixture();
    const packageConfig = createPackageConfig();
    const systemConfig = createSystemConfig();
    const opts = createOptions();
    const config = buildConfig({ packageConfig, systemConfig, opts });
    config.package.version = 'mutated';
    config.system.sites = 'mutated';
    config.build.opts.env = 'mutated';
    expect(packageConfig.version).toBe('0.0.15');
    expect(systemConfig.system.sites).toBe(SITES_DIR);
    expect(opts.env).toBe('local');
});

test('site configuration file is loaded from selected site directory', () => {
    createFixture();
    const secondSiteDir = path.join(SITES_DIR, 'second');
    writeJson(path.join(secondSiteDir, 'site.json'), createSiteConfig({
        name: 'second',
        version: '9.9.9'
    }));
    fs.cpSync(path.join(SITE_DIR, 'languages'), path.join(
        secondSiteDir, 'languages'), { recursive: true });

    const config = buildConfig({
        opts: createOptions({
            siteName: 'second'
        })
    });
    expect(config.site.name).toBe('second');
    expect(config.site.version).toBe('9.9.9');
});

test('theme configuration file is loaded from selected theme directory', () => {
    createFixture();
    const secondThemeDir = path.join(THEMES_DIR, 'panda');
    writeJson(path.join(secondThemeDir, 'theme.json'), createThemeConfig({
        name: 'panda',
        version: '3.0.0'
    }));
    const config = buildConfig({
        opts: createOptions({
            themeName: 'panda'
        })
    });
    expect(config.site.theme.name).toBe('panda');
    expect(config.site.theme.version).toBe('3.0.0');
});

test('missing site configuration file throws contextual error', () => {
    createFixture();
    fs.rmSync(path.join(SITE_DIR, 'site.json'));
    expect(() => buildConfig()).toThrow('Failed to read JSON file');
});

test('duplicate language data top-level keys throw during build', () => {
    createFixture();
    writeJson(path.join(SITE_DIR, 'languages', 'en', 'duplicate.json'), {
        metadata: {
            title: 'Duplicate'
        }
    });
    expect(() => buildConfig())
        .toThrow('Failed to aggregate language data from');
});
