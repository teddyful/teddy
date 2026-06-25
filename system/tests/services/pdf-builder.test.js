/**
 * PDF builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { once } from 'events';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const { mockPdfDocuments } = vi.hoisted(() => {
    return {
        mockPdfDocuments: []
    };
});

vi.mock('pdfkit', () => {
    class MockPDFDocument {
        constructor(options) {
            this.options = options;
            this.calls = [];
            this.stream = null;
            this.outline = {
                addItem: title => {
                    this.calls.push(['outline.addItem', title]);
                }
            };
            mockPdfDocuments.push(this);
        }

        pipe(stream) {
            this.stream = stream;
            this.calls.push(['pipe']);
            return stream;
        }

        registerFont(alias, fontPath) {
            this.calls.push(['registerFont', alias, fontPath]);
            return this;
        }

        font(alias) {
            this.calls.push(['font', alias]);
            return this;
        }

        fontSize(size) {
            this.calls.push(['fontSize', size]);
            return this;
        }

        text(value) {
            this.calls.push(['text', value]);
            return this;
        }

        moveDown(value) {
            this.calls.push(['moveDown', value]);
            return this;
        }

        addPage() {
            this.calls.push(['addPage']);
            return this;
        }

        end() {
            this.calls.push(['end']);
            this.stream.end('mock pdf');
        }
    }

    return {
        default: MockPDFDocument
    };
});

const { default: PdfBuilder } = await import(
    '../../src/services/pdf-builder.js');

const TEST_DIR = './working/tests/pdf-builder';
const PAGES_DIR = path.join(TEST_DIR, 'pages');
const SYSTEM_ASSETS_DIR = path.join(TEST_DIR, 'system', 'assets');
const BUILD_DIR = path.join(TEST_DIR, 'build');
const DEFAULT_FONT_PATH = path.join(
    SYSTEM_ASSETS_DIR, 'fonts', 'Noto', 'NotoSans', 'NotoSans-Regular.ttf');
const SYSTEM_JA_FONT_PATH = path.join(
    SYSTEM_ASSETS_DIR, 'fonts', 'Noto', 'NotoSansJP-Regular.ttf');
const CUSTOM_JA_FONT_PATH = path.join(TEST_DIR, 'custom-fonts', 'ja.ttf');

function createConfig(overrides = {}) {
    const config = {
        system: {
            build: {
                siteDirs: {
                    pages: PAGES_DIR
                }
            },
            assets: {
                dir: SYSTEM_ASSETS_DIR,
                fonts: {
                    ja: path.join('Noto', 'NotoSansJP-Regular.ttf')
                }
            }
        },
        site: {
            web: {
                baseUrl: 'https://example.test'
            },
            languages: {
                enabled: ['en'],
                default: 'en',
                data: {
                    en: {
                        metadata: {
                            title: 'English Site',
                            description: 'English description',
                            keywords: 'english,teddy'
                        },
                        taxonomy: {
                            categories: {
                                asia: 'Asia'
                            }
                        },
                        contributors: {
                            default: 'teddy',
                            teddy: {
                                name: 'Teddy',
                                url: '${pages.urls.about}'
                            }
                        }
                    },
                    ja: {
                        metadata: {
                            title: 'Japanese Site',
                            description: 'Japanese description',
                            keywords: 'japanese,teddy'
                        },
                        taxonomy: {
                            categories: {
                                asia: 'アジア'
                            }
                        },
                        contributors: {
                            default: 'teddy',
                            teddy: {
                                name: 'テディ',
                                url: '${pages.urls.about}'
                            }
                        }
                    }
                }
            },
            urls: {
                about: '/about/'
            },
            datasources: {
                fonts: {}
            },
            collection: {
                enabled: true,
                index: {
                    documentStore: {
                        document: {
                            index: ['name', 'description']
                        }
                    }
                }
            }
        },
        build: {
            opts: {
                generateDsPdf: true
            },
            distDirs: {
                build: BUILD_DIR
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

function writeMarkdown(relPath, metadata = {}, content = 'Markdown content') {
    const metadataLines = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    writeFile(path.join(PAGES_DIR, relPath), [
        '---',
        metadataLines,
        '---',
        '',
        content
    ].join('\n'));
}

function createFonts() {
    writeFile(DEFAULT_FONT_PATH, 'default font');
    writeFile(SYSTEM_JA_FONT_PATH, 'ja font');
    writeFile(CUSTOM_JA_FONT_PATH, 'custom ja font');
}

function getPdfPath(language = 'en') {
    return path.join(
        BUILD_DIR, 'datasources', 'pdf', language, 'site.pdf');
}

function getTextCalls(document) {
    return document.calls
        .filter(call => call[0] === 'text')
        .map(call => call[1]);
}

async function build(config = createConfig()) {
    await new PdfBuilder(config).build();
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
    mockPdfDocuments.length = 0;
});

afterEach(async () => {
    for ( const document of mockPdfDocuments ) {
        if ( document.stream && !document.stream.writableEnded ) {
            document.stream.end();
            await Promise.race([
                once(document.stream, 'finish'),
                once(document.stream, 'error')
            ]);
        }
    }
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('PDF generation is skipped when generateDsPdf is false', async () => {
    const config = createConfig();
    config.build.opts.generateDsPdf = false;
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    await build(config);
    expect(mockPdfDocuments.length).toBe(0);
    expect(fs.existsSync(getPdfPath())).toBe(false);
});

test('PDF is generated for enabled markdown pages', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home',
        description: 'Home description'
    }, '# Home\n\nWelcome to **Teddy**.');
    await build();
    expect(fs.readFileSync(getPdfPath(), 'utf8')).toBe('mock pdf');
    expect(mockPdfDocuments.length).toBe(1);
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
    expect(getTextCalls(mockPdfDocuments[0]))
        .toContain('Home description');
    expect(getTextCalls(mockPdfDocuments[0]).some(text =>
        text.includes('Welcome to Teddy.'))).toBe(true);
});

test('PDF document uses language metadata as document info', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    await build();
    expect(mockPdfDocuments[0].options).toEqual({
        size: 'A4',
        autoFirstPage: false,
        info: {
            Title: 'English Site',
            Subject: 'English description',
            Keywords: 'english,teddy'
        }
    });
});

test('disabled pages are excluded from PDF', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    writeMarkdown('draft.en.md', {
        enabled: 'false',
        name: 'Draft'
    });
    await build();
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
    expect(getTextCalls(mockPdfDocuments[0])).not.toContain('Draft');
});

test('pages with datasource false are excluded from PDF', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    writeMarkdown('private.en.md', {
        enabled: 'true',
        datasource: 'false',
        name: 'Private'
    });
    await build();
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
    expect(getTextCalls(mockPdfDocuments[0])).not.toContain('Private');
});

test('pages with datasource true are included in PDF', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        datasource: 'true',
        name: 'Home'
    });
    await build();
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
});

test('non-markdown files are ignored', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    writeFile(path.join(PAGES_DIR, 'notes.en.txt'), 'Notes');
    await build();
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
    expect(getTextCalls(mockPdfDocuments[0])).not.toContain('Notes');
});

test('pages are filtered by language suffix', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['en', 'ja'];
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    writeMarkdown('home.ja.md', {
        enabled: 'true',
        name: 'ホーム'
    });
    await build(config);
    expect(mockPdfDocuments.length).toBe(2);
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Home');
    expect(getTextCalls(mockPdfDocuments[1])).toContain('ホーム');
    expect(fs.existsSync(getPdfPath('en'))).toBe(true);
    expect(fs.existsSync(getPdfPath('ja'))).toBe(true);
});

test('no PDF is generated when no pages qualify', async () => {
    createFonts();
    writeMarkdown('draft.en.md', {
        enabled: 'false',
        name: 'Draft'
    });
    await build();
    expect(mockPdfDocuments.length).toBe(0);
    expect(fs.existsSync(getPdfPath())).toBe(false);
});

test('page ids are assigned after filtering', async () => {
    createFonts();
    writeMarkdown('first.en.md', {
        enabled: 'true',
        name: 'First'
    });
    writeMarkdown('second.en.md', {
        enabled: 'true',
        name: 'Second'
    });
    await build();
    expect(mockPdfDocuments[0].calls.filter(call => call[0] === 'addPage'))
        .toHaveLength(2);
});

test('root page source URL is generated without relative path', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    await build();
    expect(getTextCalls(mockPdfDocuments[0]))
        .toContain('Source: https://example.test/');
});

test('nested page source URL is generated from relative directory', async () => {
    createFonts();
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    });
    await build();
    expect(getTextCalls(mockPdfDocuments[0]))
        .toContain('Source: https://example.test/blog/');
});

test('non-default language source URL includes language prefix', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['ja'];
    createFonts();
    writeMarkdown('blog/post.ja.md', {
        enabled: 'true',
        name: '投稿'
    });
    await build(config);
    expect(getTextCalls(mockPdfDocuments[0]))
        .toContain('Source: https://example.test/ja/blog/');
});

test('default font is registered and selected for default language',
    async () => {
        createFonts();
        writeMarkdown('home.en.md', {
            enabled: 'true',
            name: 'Home'
        });
        await build();
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'registerFont',
            'DefaultLanguageFont',
            DEFAULT_FONT_PATH
        ]);
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'font',
            'DefaultLanguageFont'
        ]);
    });

test('system language font is registered and selected when configured',
    async () => {
        const config = createConfig();
        config.site.languages.enabled = ['ja'];
        createFonts();
        writeMarkdown('home.ja.md', {
            enabled: 'true',
            name: 'ホーム'
        });
        await build(config);
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'registerFont',
            'DefaultLanguageFont',
            DEFAULT_FONT_PATH
        ]);
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'registerFont',
            'CustomLanguageFont',
            SYSTEM_JA_FONT_PATH
        ]);
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'font',
            'CustomLanguageFont'
        ]);
    });

test('site datasource font takes precedence over system language font',
    async () => {
        const config = createConfig();
        config.site.languages.enabled = ['ja'];
        config.site.datasources.fonts.ja = CUSTOM_JA_FONT_PATH;
        createFonts();
        writeMarkdown('home.ja.md', {
            enabled: 'true',
            name: 'ホーム'
        });
        await build(config);
        expect(mockPdfDocuments[0].calls).toContainEqual([
            'registerFont',
            'CustomLanguageFont',
            CUSTOM_JA_FONT_PATH
        ]);
        expect(mockPdfDocuments[0].calls).not.toContainEqual([
            'registerFont',
            'CustomLanguageFont',
            SYSTEM_JA_FONT_PATH
        ]);
    });

test('missing default font throws contextual error', async () => {
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    await expect(build()).rejects.toThrow(
        "PDF font file for alias 'DefaultLanguageFont' does not exist");
});

test('missing system language font throws contextual error', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['ja'];
    writeFile(DEFAULT_FONT_PATH, 'default font');
    writeMarkdown('home.ja.md', {
        enabled: 'true',
        name: 'ホーム'
    });
    await expect(build(config)).rejects.toThrow(
        "PDF font file for alias 'CustomLanguageFont' does not exist");
});

test('missing site datasource font throws contextual error', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['ja'];
    config.site.datasources.fonts.ja = CUSTOM_JA_FONT_PATH;
    writeFile(DEFAULT_FONT_PATH, 'default font');
    writeMarkdown('home.ja.md', {
        enabled: 'true',
        name: 'ホーム'
    });
    await expect(build(config)).rejects.toThrow(
        "PDF font file for alias 'CustomLanguageFont' does not exist");
});

test('PDF output directory is created recursively', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    });
    await build();
    expect(fs.statSync(path.dirname(getPdfPath())).isDirectory()).toBe(true);
});

test('content is normalized from markdown HTML', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    }, '# Heading\n\nThis is **bold** content.');
    await build();
    expect(getTextCalls(mockPdfDocuments[0]).some(text =>
        text.includes('Heading') &&
            text.includes('This is bold content.'))).toBe(true);
});

test('page description is optional', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true',
        name: 'Home'
    }, 'Content');
    await build();
    expect(getTextCalls(mockPdfDocuments[0]))
        .not.toContain(undefined);
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Content');
});

test('page name is optional', async () => {
    createFonts();
    writeMarkdown('home.en.md', {
        enabled: 'true'
    }, 'Content');
    await build();
    expect(getTextCalls(mockPdfDocuments[0])).toContain('Content');
    expect(mockPdfDocuments[0].calls).not.toContainEqual([
        'outline.addItem',
        undefined
    ]);
});
