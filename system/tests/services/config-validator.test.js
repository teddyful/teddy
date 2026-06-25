/**
 * Configuration validator service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import ConfigValidator from '../../src/services/config-validator.js';

const TEST_DIR = './working/tests/config-validator';
const SITES_DIR = path.join(TEST_DIR, 'sites');
const THEMES_DIR = path.join(TEST_DIR, 'themes');
const SYSTEM_ASSETS_DIR = path.join(TEST_DIR, 'system', 'assets');
const SITE_NAME = 'travelbook';
const THEME_NAME = 'bear';
const SITE_DIR = path.join(SITES_DIR, SITE_NAME);
const THEME_DIR = path.join(THEMES_DIR, THEME_NAME);

const FONT_KEYS = [
    'ja',
    'jpn',
    'ko',
    'kor',
    'zh',
    'zh-cn',
    'zh-hk',
    'zh-sg',
    'zh-tw'
];

function writeFile(filePath, content = 'content') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function createSystemConfig() {
    return {
        system: {
            sites: SITES_DIR,
            themes: THEMES_DIR,
            assets: {
                dir: SYSTEM_ASSETS_DIR,
                js: {
                    site: [],
                    teddy: [],
                    vendors: ['vendor.js']
                },
                fonts: Object.fromEntries(
                    FONT_KEYS.map(key => [key, `${key}.ttf`]))
            }
        }
    };
}

function createOptions(overrides = {}) {
    return {
        siteName: SITE_NAME,
        themeName: THEME_NAME,
        env: 'local',
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
                pagesDir: 'blog',
                index: {
                    content: true,
                    documentStore: {
                        document: {
                            id: 'id',
                            index: ['name', 'description'],
                            store: true,
                            tag: 'tags'
                        }
                    }
                },
                assets: {
                    extensions: {
                        allowed: ['jpg', 'png']
                    }
                },
                pagination: {
                    size: 10
                },
                search: {
                    minQueryLength: 2
                },
                sort: {
                    key: 'date',
                    order: 'desc'
                },
                taxonomy: {
                    categories: ['asia', 'europe']
                }
            },
            assets: {
                custom: {
                    css: ['site.css'],
                    js: ['site.js'],
                    images: {
                        favicon: {
                            ico: 'favicon.ico',
                            deployToRoot: true
                        },
                        og: {
                            default: 'og.jpg',
                            userCover: true
                        }
                    }
                }
            },
            datasources: {
                fonts: {}
            },
            html: {
                inject: {
                    metadata: true,
                    systemAssets: true
                }
            },
            web: {
                local: {
                    domain: 'localhost:8080',
                    http: {
                        secure: false
                    },
                    host: 'simple-web-server'
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
            author: 'Jillur Quddus',
            assets: {
                custom: {
                    css: ['theme.css'],
                    js: ['theme.js'],
                    images: {
                        favicon: {
                            ico: 'theme.ico',
                            deployToRoot: true
                        },
                        og: {
                            default: 'theme-og.jpg',
                            userCover: true
                        }
                    }
                }
            },
            ...overrides
        }
    };
}

function createLanguageFiles(language, categoryTranslations = {}) {
    const languageDir = path.join(SITE_DIR, 'languages', language);
    writeJson(path.join(languageDir, 'metadata.json'), {
        metadata: {
            title: `${language} title`,
            description: `${language} description`,
            keywords: `${language}, teddy`
        }
    });
    writeJson(path.join(languageDir, 'contributors.json'), {
        contributors: {
            default: 'teddy',
            teddy: {
                name: 'Teddy'
            }
        }
    });
    writeJson(path.join(languageDir, 'taxonomy.json'), {
        taxonomy: {
            categories: {
                asia: categoryTranslations.asia ?? 'Asia',
                europe: categoryTranslations.europe ?? 'Europe'
            }
        }
    });
}

function createBaseFixture({
    systemConfig = createSystemConfig(),
    siteConfig = createSiteConfig(),
    themeConfig = createThemeConfig()
} = {}) {
    fs.mkdirSync(SITES_DIR, { recursive: true });
    fs.mkdirSync(THEMES_DIR, { recursive: true });
    fs.mkdirSync(SYSTEM_ASSETS_DIR, { recursive: true });
    writeFile(path.join(SYSTEM_ASSETS_DIR, 'js', 'vendor.js'), 'vendor');
    for ( const fontKey of FONT_KEYS ) {
        writeFile(path.join(SYSTEM_ASSETS_DIR, 'fonts', `${fontKey}.ttf`),
            'font');
    }
    writeJson(path.join(SITE_DIR, 'site.json'), siteConfig);
    fs.mkdirSync(path.join(SITE_DIR, 'assets'), { recursive: true });
    writeFile(path.join(SITE_DIR, 'assets', 'css', 'site.css'), 'css');
    writeFile(path.join(SITE_DIR, 'assets', 'js', 'site.js'), 'js');
    writeFile(path.join(SITE_DIR, 'assets', 'images', 'favicon.ico'), 'ico');
    writeFile(path.join(SITE_DIR, 'assets', 'images', 'og.jpg'), 'og');
    createLanguageFiles('en');
    createLanguageFiles('ja', {
        asia: 'アジア',
        europe: 'ヨーロッパ'
    });
    writeFile(path.join(SITE_DIR, 'pages', 'blog', 'post.en.md'), '# English');
    writeFile(path.join(SITE_DIR, 'pages', 'blog', 'post.ja.md'), '# Japanese');
    fs.mkdirSync(path.join(SITE_DIR, 'web'), { recursive: true });
    writeJson(path.join(THEME_DIR, 'theme.json'), themeConfig);
    writeFile(path.join(THEME_DIR, 'templates', 'page.html'),
        '<html lang="${page.metadata.language}"></html>');
    writeFile(path.join(THEME_DIR, 'assets', 'css', 'theme.css'), 'css');
    writeFile(path.join(THEME_DIR, 'assets', 'js', 'theme.js'), 'js');
    writeFile(path.join(THEME_DIR, 'assets', 'images', 'theme.ico'), 'ico');
    writeFile(path.join(THEME_DIR, 'assets', 'images', 'theme-og.jpg'), 'og');
    return systemConfig;
}

function validate({
    systemConfig = createSystemConfig(),
    opts = createOptions()
} = {}) {
    return new ConfigValidator(systemConfig, opts).validate();
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('valid configuration passes validation', () => {
    const systemConfig = createBaseFixture();
    expect(() => validate({ systemConfig })).not.toThrow();
});

test('validation adds site directory build dependencies to system config', () => {
    const systemConfig = createBaseFixture();
    validate({ systemConfig });
    expect(systemConfig.system.build.siteDirs).toEqual({
        assets: path.join(SITE_DIR, 'assets'),
        languages: path.join(SITE_DIR, 'languages'),
        pages: path.join(SITE_DIR, 'pages'),
        web: path.join(SITE_DIR, 'web')
    });
});

test('invalid system config schema throws', () => {
    createBaseFixture();
    expect(() => validate({ systemConfig: { system: {} } }))
        .toThrow('System configuration schema error');
});

test.each([
    ['sites', SITES_DIR],
    ['themes', THEMES_DIR],
    ['assets.dir', SYSTEM_ASSETS_DIR]
])('missing required system resource %s throws', (_label, resourcePath) => {
    const systemConfig = createBaseFixture();
    fs.rmSync(resourcePath, { recursive: true, force: true });
    expect(() => validate({ systemConfig })).toThrow('does not exist');
});

test('missing configured vendor JavaScript file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SYSTEM_ASSETS_DIR, 'js', 'vendor.js'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'system.assets.js.vendors' does not exist");
});

test('missing configured font file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SYSTEM_ASSETS_DIR, 'fonts', 'ja.ttf'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'system.assets.fonts.ja' does not exist");
});

test.each([
    ['siteName', 'bad site', 'site name'],
    ['themeName', 'bad theme', 'theme name'],
    ['env', 'bad env', 'environment name']
])('invalid %s option throws', (optionName, value, label) => {
    const systemConfig = createBaseFixture();
    expect(() => validate({
        systemConfig,
        opts: createOptions({
            [optionName]: value
        })
    })).toThrow(`The ${label} '${value}' contains invalid characters`);
});

test('missing site directory throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(SITE_DIR, { recursive: true, force: true });
    expect(() => validate({ systemConfig }))
        .toThrow(`The required directory '${SITE_DIR}' does not exist`);
});

test('missing site config file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'site.json'));
    expect(() => validate({ systemConfig }))
        .toThrow("The required file 'site.json' does not exist");
});

test('missing theme directory throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(THEME_DIR, { recursive: true, force: true });
    expect(() => validate({ systemConfig }))
        .toThrow(`The required directory '${THEME_DIR}' does not exist`);
});

test('missing theme config file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'theme.json'));
    expect(() => validate({ systemConfig }))
        .toThrow("The required file 'theme.json' does not exist");
});

test('invalid site config schema throws', () => {
    const siteConfig = createSiteConfig();
    delete siteConfig.site.datasources;
    const systemConfig = createBaseFixture({ siteConfig });
    expect(() => validate({ systemConfig }))
        .toThrow('Site configuration schema error');
});

test('site name mismatch throws', () => {
    const systemConfig = createBaseFixture({
        siteConfig: createSiteConfig({
            name: 'other'
        })
    });
    expect(() => validate({ systemConfig }))
        .toThrow('does not exactly match the site name');
});

test('invalid site version throws', () => {
    const systemConfig = createBaseFixture({
        siteConfig: createSiteConfig({
            version: '1'
        })
    });
    expect(() => validate({ systemConfig }))
        .toThrow("The site version '1' is invalid");
});

test('missing enabled language directory throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'languages', 'ja'), {
        recursive: true,
        force: true
    });
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.languages.enabled' does not exist");
});

test('missing collection pages directory throws when collection enabled', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'pages', 'blog'), {
        recursive: true,
        force: true
    });
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.collection.pagesDir' does not exist");
});

test('collection pages directory is not required when collection disabled',
    () => {
        const siteConfig = createSiteConfig({
            collection: {
                enabled: false,
                taxonomy: {
                    categories: []
                }
            }
        });
        const systemConfig = createBaseFixture({ siteConfig });
        fs.rmSync(path.join(SITE_DIR, 'pages', 'blog'), {
            recursive: true,
            force: true
        });
        writeFile(path.join(SITE_DIR, 'pages', 'home.en.md'), '# Home');
        expect(() => validate({ systemConfig })).not.toThrow();
    });

test('missing language metadata file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'languages', 'en', 'metadata.json'));
    expect(() => validate({ systemConfig }))
        .toThrow("The required file 'metadata.json' does not exist");
});

test('invalid language metadata schema throws', () => {
    const systemConfig = createBaseFixture();
    writeJson(path.join(SITE_DIR, 'languages', 'en', 'metadata.json'), {
        metadata: {
            title: 'English'
        }
    });
    expect(() => validate({ systemConfig }))
        .toThrow('Site metadata (en) schema error');
});

test('missing language contributors file throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'languages', 'en', 'contributors.json'));
    expect(() => validate({ systemConfig }))
        .toThrow("The required file 'contributors.json' does not exist");
});

test('invalid language contributors schema throws', () => {
    const systemConfig = createBaseFixture();
    writeJson(path.join(SITE_DIR, 'languages', 'en', 'contributors.json'), {
        contributors: {}
    });
    expect(() => validate({ systemConfig }))
        .toThrow('Site contributors (en) schema error');
});

test('missing taxonomy file throws when categories are configured', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'languages', 'en', 'taxonomy.json'));
    expect(() => validate({ systemConfig }))
        .toThrow("The required file 'taxonomy.json' does not exist");
});

test('taxonomy file is not required when no categories are configured', () => {
    const siteConfig = createSiteConfig();
    siteConfig.site.collection.taxonomy.categories = [];
    const systemConfig = createBaseFixture({ siteConfig });
    fs.rmSync(path.join(SITE_DIR, 'languages', 'en', 'taxonomy.json'));
    expect(() => validate({ systemConfig })).not.toThrow();
});

test('invalid taxonomy schema throws', () => {
    const systemConfig = createBaseFixture();
    writeJson(path.join(SITE_DIR, 'languages', 'en', 'taxonomy.json'), {
        taxonomy: {}
    });
    expect(() => validate({ systemConfig }))
        .toThrow('Site taxonomy (en) schema error');
});

test('taxonomy missing configured category translation throws', () => {
    const systemConfig = createBaseFixture();
    writeJson(path.join(SITE_DIR, 'languages', 'en', 'taxonomy.json'), {
        taxonomy: {
            categories: {
                asia: 'Asia'
            }
        }
    });
    expect(() => validate({ systemConfig }))
        .toThrow("missing a translation for the category 'europe'");
});

test('missing site custom CSS asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'assets', 'css', 'site.css'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.assets.custom.css' does not exist");
});

test('missing site custom JavaScript asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'assets', 'js', 'site.js'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.assets.custom.js' does not exist");
});

test('missing site favicon asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'assets', 'images', 'favicon.ico'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.assets.custom.images.favicon.ico'");
});

test('missing site Open Graph asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'assets', 'images', 'og.jpg'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'site.assets.custom.images.og.default'");
});

test('missing web environment throws', () => {
    const systemConfig = createBaseFixture();
    expect(() => validate({
        systemConfig,
        opts: createOptions({
            env: 'production'
        })
    })).toThrow("No web configuration exists for the environment 'production'");
});

test('invalid theme config schema throws', () => {
    const themeConfig = createThemeConfig();
    delete themeConfig.theme.author;
    const systemConfig = createBaseFixture({ themeConfig });
    expect(() => validate({ systemConfig }))
        .toThrow('Theme configuration schema error');
});

test('theme name mismatch throws', () => {
    const systemConfig = createBaseFixture({
        themeConfig: createThemeConfig({
            name: 'other'
        })
    });
    expect(() => validate({ systemConfig }))
        .toThrow('does not exactly match the theme name');
});

test('invalid theme version throws', () => {
    const systemConfig = createBaseFixture({
        themeConfig: createThemeConfig({
            version: '2'
        })
    });
    expect(() => validate({ systemConfig }))
        .toThrow("The theme version '2' is invalid");
});

test('missing theme templates directory throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'templates'), {
        recursive: true,
        force: true
    });
    expect(() => validate({ systemConfig }))
        .toThrow(`The required directory '${path.join(THEME_DIR, 'templates')}'`);
});

test('theme templates directory must contain an HTML template', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'templates', 'page.html'));
    writeFile(path.join(THEME_DIR, 'templates', 'page.txt'), 'text');
    expect(() => validate({ systemConfig }))
        .toThrow('No templates files found');
});

test('theme template filename with invalid characters throws', () => {
    const systemConfig = createBaseFixture();
    writeFile(path.join(THEME_DIR, 'templates', 'bad name.html'), '<html>');
    expect(() => validate({ systemConfig }))
        .toThrow('contains invalid characters in its filename');
});

test('missing theme custom CSS asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'assets', 'css', 'theme.css'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'theme.assets.custom.css' does not exist");
});

test('missing theme custom JavaScript asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'assets', 'js', 'theme.js'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'theme.assets.custom.js' does not exist");
});

test('missing theme favicon asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'assets', 'images', 'theme.ico'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'theme.assets.custom.images.favicon.ico'");
});

test('missing theme Open Graph asset throws', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(THEME_DIR, 'assets', 'images', 'theme-og.jpg'));
    expect(() => validate({ systemConfig }))
        .toThrow("defined in 'theme.assets.custom.images.og.default'");
});

test('pages directory must contain at least one markdown file', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'pages', 'blog', 'post.en.md'));
    fs.rmSync(path.join(SITE_DIR, 'pages', 'blog', 'post.ja.md'));
    writeFile(path.join(SITE_DIR, 'pages', 'blog', 'post.txt'), 'text');
    expect(() => validate({ systemConfig }))
        .toThrow('No markdown files found in');
});

test('default language must have at least one markdown file', () => {
    const systemConfig = createBaseFixture();
    fs.rmSync(path.join(SITE_DIR, 'pages', 'blog', 'post.en.md'));
    expect(() => validate({ systemConfig }))
        .toThrow("No markdown files found for the default language 'en'");
});

test('page directory with invalid characters throws', () => {
    const systemConfig = createBaseFixture();
    writeFile(path.join(SITE_DIR, 'pages', 'bad!', 'post.en.md'), '# Bad');
    expect(() => validate({ systemConfig }))
        .toThrow("The page directory path 'bad!/post.en.md'");
});

test('page markdown filename with invalid characters throws', () => {
    const systemConfig = createBaseFixture();
    writeFile(path.join(SITE_DIR, 'pages', 'blog', 'bad!.en.md'), '# Bad');
    expect(() => validate({ systemConfig }))
        .toThrow("The page markdown file 'blog/bad!.en.md'");
});

test('page markdown filename must contain language code', () => {
    const systemConfig = createBaseFixture();
    writeFile(path.join(SITE_DIR, 'pages', 'blog', 'bad.md'), '# Bad');
    expect(() => validate({ systemConfig }))
        .toThrow('must contain exactly two period characters');
});
