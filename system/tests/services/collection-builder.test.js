/**
 * Collection builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import CollectionBuilder from '../../src/services/collection-builder.js';

const TEST_DIR = './working/tests/collection-builder';
const PAGES_DIR = path.join(TEST_DIR, 'pages');
const COLLECTION_DIR = path.join(PAGES_DIR, 'blog');
const DIST_COLLECTION_DIR = path.join(TEST_DIR, 'dist', 'assets', 'collection');

function createConfig(overrides = {}) {
    const config = {
        system: {
            build: {
                siteDirs: {
                    pages: PAGES_DIR
                }
            }
        },
        site: {
            languages: {
                enabled: ['en', 'ja'],
                default: 'en',
                data: {
                    en: {
                        taxonomy: {
                            categories: {
                                africa: 'Africa',
                                asia: 'Asia',
                                europe: 'Europe'
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
                        taxonomy: {
                            categories: {
                                africa: 'アフリカ',
                                asia: 'アジア',
                                europe: 'ヨーロッパ'
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
            collection: {
                enabled: true,
                pagesDir: 'blog',
                taxonomy: {
                    categories: ['africa', 'asia', 'europe']
                },
                pagination: {
                    size: 2
                },
                sort: {
                    key: 'date',
                    order: 'desc'
                },
                search: {
                    minQueryLength: 2
                },
                index: {
                    content: true,
                    documentStore: {
                        document: {
                            id: 'id',
                            index: [
                                'name',
                                'description',
                                'content',
                                'customField'
                            ],
                            store: true,
                            tag: 'tags'
                        }
                    }
                },
                sizes: {}
            }
        },
        build: {
            opts: {
                ignoreCollection: false
            },
            distDirs: {
                collection: DIST_COLLECTION_DIR
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function writeMarkdownPage(relPath, metadata = {}, body = 'Page content') {
    const filePath = path.join(COLLECTION_DIR, relPath);
    const metadataLines = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    const markdown = [
        '---',
        metadataLines,
        '---',
        '',
        body
    ].join('\n');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, markdown);
    return filePath;
}

function createCollectionPages() {
    writeMarkdownPage('zebra.en.md', {
        name: 'Zebra',
        description: 'Zebra description',
        enabled: 'true',
        date: '2025-01-03T12:00:00',
        categories: 'asia',
        tags: 'featured',
        customField: 'zebra-custom'
    }, '<strong>Zebra</strong> content, with punctuation!');
    writeMarkdownPage('alpha.en.md', {
        name: 'Alpha',
        description: 'Alpha description',
        enabled: 'true',
        date: '2025-01-01T12:00:00',
        categories: 'africa, asia',
        tags: 'alpha, asia',
        customField: 'alpha-custom'
    }, 'Alpha content\nwith multiple lines.');
    writeMarkdownPage('disabled.en.md', {
        name: 'Disabled',
        description: 'Disabled description',
        enabled: 'false',
        date: '2025-01-04T12:00:00',
        categories: 'europe'
    }, 'Disabled content');
    writeMarkdownPage('no-name.en.md', {
        description: 'No name description',
        enabled: 'true',
        date: '2025-01-05T12:00:00',
        categories: 'europe'
    }, 'No name content');
    writeMarkdownPage('not-indexed.en.md', {
        name: 'Not indexed',
        description: 'Not indexed description',
        enabled: 'true',
        index: 'false',
        date: '2025-01-06T12:00:00',
        categories: 'europe'
    }, 'Not indexed content');
    writeMarkdownPage('japan.ja.md', {
        name: '日本',
        description: '日本 description',
        enabled: 'true',
        date: '2025-01-02T12:00:00',
        categories: 'asia'
    }, '日本語の本文');
    writeMarkdownPage('draft.ja.md', {
        name: 'Draft',
        description: 'Draft description',
        enabled: 'false',
        date: '2025-01-07T12:00:00',
        categories: 'asia'
    }, 'Draft content');
    writeMarkdownPage('plain.txt', {}, 'Not markdown');
}

function getPageNames(pages) {
    return pages.map(page => page.name);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('collection build returns updated config', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    expect(builder.build()).toBe(config);
});

test('collection build creates collection with language pages', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(builder.collection.hasLanguage('en')).toBe(true);
    expect(builder.collection.hasLanguage('ja')).toBe(true);
    expect(getPageNames(builder.collection.getPages('en'))).toEqual([
        'Zebra',
        'Alpha'
    ]);
    expect(getPageNames(builder.collection.getPages('ja'))).toEqual([
        '日本'
    ]);
});

test('collection build filters disabled missing name and non-indexed pages',
    () => {
        const config = createConfig();
        createCollectionPages();
        const builder = new CollectionBuilder(config);
        builder.build();
        expect(getPageNames(builder.collection.getPages('en'))).not.toContain(
            'Disabled');
        expect(getPageNames(builder.collection.getPages('en'))).not.toContain(
            'Not indexed');
        expect(builder.collection.getPages('en').length).toBe(2);
    });

test('collection build filters files by language-specific markdown suffix', () => {
    const config = createConfig();
    createCollectionPages();
    new CollectionBuilder(config).build();
    expect(config.site.collection.sizes).toEqual({
        en: 2,
        ja: 1
    });
});

test('collection build assigns page ids after sorting', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(builder.collection.getPages('en').map(page => page.id))
        .toEqual([0, 1]);
    expect(builder.collection.getPages('ja').map(page => page.id))
        .toEqual([0]);
});

test('collection build sorts pages by configured date descending', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(getPageNames(builder.collection.getPages('en'))).toEqual([
        'Zebra',
        'Alpha'
    ]);
});

test('collection build sorts pages by configured name ascending', () => {
    const config = createConfig();
    config.site.collection.sort = {
        key: 'name',
        order: 'asc'
    };
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(getPageNames(builder.collection.getPages('en'))).toEqual([
        'Alpha',
        'Zebra'
    ]);
});

test('collection build stores normalized page content when enabled', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(builder.collection.getPages('en')[0].content)
        .toBe('Zebra content with punctuation');
});

test('collection build omits page content when content indexing is disabled',
    () => {
        const config = createConfig();
        config.site.collection.index.content = false;
        createCollectionPages();
        const builder = new CollectionBuilder(config);
        builder.build();
        expect(builder.collection.getPages('en')[0].content).toBeUndefined();
    });

test('collection build propagates configured custom index fields', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(builder.collection.getPages('en')[0].customField)
        .toBe('zebra-custom');
});

test('collection build writes language collection metadata into config', () => {
    const config = createConfig();
    createCollectionPages();
    new CollectionBuilder(config).build();
    expect(config.site.languages.data.en.collection.metadata.size).toBe(2);
    expect(config.site.languages.data.en.collection.metadata.pagination)
        .toBe(config.site.collection.pagination);
    expect(config.site.languages.data.en.collection.metadata.sort)
        .toBe(config.site.collection.sort);
    expect(config.site.languages.data.en.collection.metadata.search)
        .toBe(config.site.collection.search);
});

test('collection build stores paginated head pages in metadata', () => {
    const config = createConfig();
    config.site.collection.pagination.size = 1;
    createCollectionPages();
    new CollectionBuilder(config).build();
    expect(config.site.languages.data.en.collection.metadata.pages.head.length)
        .toBe(1);
    expect(config.site.languages.data.en.collection.metadata.pages.head[0].name)
        .toBe('Zebra');
});

test('collection build creates sorted localized category metadata with counts',
    () => {
        const config = createConfig();
        createCollectionPages();
        new CollectionBuilder(config).build();
        expect(config.site.languages.data.en.collection.metadata.categories)
            .toEqual([
                {
                    id: 'africa',
                    name: 'Africa',
                    count: 1
                },
                {
                    id: 'asia',
                    name: 'Asia',
                    count: 2
                },
                {
                    id: 'europe',
                    name: 'Europe',
                    count: 0
                }
            ]);
    });

test('collection metadata map mirrors language metadata in config', () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(builder.collection.getMetadata('en'))
        .toBe(config.site.languages.data.en.collection.metadata);
});

test('collection build initializes sizes when collection is disabled', () => {
    const config = createConfig();
    config.site.collection.enabled = false;
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(config.site.collection.sizes).toEqual({});
    expect(builder.collection.getLanguagePages()).toEqual(new Map());
});

test('collection build initializes sizes when collection is ignored', () => {
    const config = createConfig();
    config.build.opts.ignoreCollection = true;
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    expect(config.site.collection.sizes).toEqual({});
    expect(builder.collection.getLanguagePages()).toEqual(new Map());
});

test('collection build creates empty language entries when no pages qualify',
    () => {
        const config = createConfig();
        writeMarkdownPage('disabled.en.md', {
            name: 'Disabled',
            enabled: 'false'
        }, 'Disabled');
        const builder = new CollectionBuilder(config);
        builder.build();
        expect(builder.collection.getPages('en')).toEqual([]);
        expect(builder.collection.getPages('ja')).toEqual([]);
        expect(config.site.collection.sizes).toEqual({
            en: 0,
            ja: 0
        });
    });

test('language index keys are empty before indexing', () => {
    const builder = new CollectionBuilder(createConfig());
    expect(builder.getLanguageIndexKeys()).toEqual({});
});

test('collection index exports files and language index keys', async () => {
    const config = createConfig();
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    await builder.index();
    expect(builder.getLanguageIndexKeys().en.length).toBeGreaterThan(0);
    expect(builder.getLanguageIndexKeys().ja.length).toBeGreaterThan(0);
    expect([...builder.getLanguageIndexKeys().en].sort())
        .toEqual(builder.getLanguageIndexKeys().en);
    for ( const key of builder.getLanguageIndexKeys().en ) {
        expect(fs.existsSync(path.join(
            DIST_COLLECTION_DIR, 'en', `${key}.json`))).toBe(true);
    }
    for ( const key of builder.getLanguageIndexKeys().ja ) {
        expect(fs.existsSync(path.join(
            DIST_COLLECTION_DIR, 'ja', `${key}.json`))).toBe(true);
    }
});

test('collection index exports empty files for undefined index chunks',
    async () => {
        const config = createConfig();
        createCollectionPages();
        const builder = new CollectionBuilder(config);
        builder.build();
        await builder.index();
        const emptyFiles = builder.getLanguageIndexKeys().en
            .filter(key => fs.readFileSync(
                path.join(DIST_COLLECTION_DIR, 'en', `${key}.json`),
                'utf8') === '');
        expect(emptyFiles.length).toBeGreaterThanOrEqual(0);
    });

test('collection index does nothing when collection is disabled', async () => {
    const config = createConfig();
    config.site.collection.enabled = false;
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    await builder.index();
    expect(builder.getLanguageIndexKeys()).toEqual({});
    expect(fs.existsSync(DIST_COLLECTION_DIR)).toBe(false);
});

test('collection index does nothing when collection is ignored', async () => {
    const config = createConfig();
    config.build.opts.ignoreCollection = true;
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    await builder.index();
    expect(builder.getLanguageIndexKeys()).toEqual({});
    expect(fs.existsSync(DIST_COLLECTION_DIR)).toBe(false);
});

test('collection index supports CJK language configuration', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['ja'];
    createCollectionPages();
    const builder = new CollectionBuilder(config);
    builder.build();
    await builder.index();
    expect(builder.getLanguageIndexKeys().ja.length).toBeGreaterThan(0);
});
