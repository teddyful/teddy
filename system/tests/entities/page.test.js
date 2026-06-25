/**
 * Page class tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import Page from '../../src/entities/page.js';

const TEST_DIR = './working/tests/page';

function createPageFile(fileName = 'post.en.md', mtime = null) {
    const filePath = path.join(TEST_DIR, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '# Test page');
    if ( mtime ) {
        fs.utimesSync(filePath, mtime, mtime);
    }
    return filePath;
}

function createConfig(overrides = {}) {
    return {
        site: {
            languages: {
                default: 'en',
                data: {
                    en: {
                        taxonomy: {
                            categories: {
                                africa: 'Africa',
                                asia: 'Asia',
                                europe: 'Europe',
                                travel: 'Travel'
                            }
                        },
                        contributors: {
                            default: 'teddy',
                            teddy: {
                                name: 'Teddy',
                                url: '${pages.urls.about}'
                            },
                            jillur: {
                                name: 'Jillur Quddus',
                                url: '${pages.urls.author}'
                            }
                        }
                    },
                    ja: {
                        taxonomy: {
                            categories: {
                                asia: 'アジア',
                                travel: '旅行'
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
                index: {
                    documentStore: {
                        document: {
                            index: [
                                'name',
                                'description',
                                'customField',
                                'rating',
                                'author',
                                'tags',
                                'nestedValue'
                            ]
                        }
                    }
                }
            }
        },
        ...overrides
    };
}

function createPage({
    pageId = 7,
    pageAbsPath = createPageFile(),
    pageRelPath = path.join('blog', 'post.en.md'),
    pageMetadata = {},
    language = 'en',
    config = createConfig()
} = {}) {
    const metadata = {
        name: 'Test page',
        description: 'Test page description',
        ...pageMetadata
    };
    return new Page(
        pageId,
        pageAbsPath,
        pageRelPath,
        metadata,
        language,
        config
    );
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('page constructed with id name and description', () => {
    const page = createPage({
        pageId: 12,
        pageMetadata: {
            name: 'My page',
            description: 'My page description'
        }
    });
    expect(page.id).toBe(12);
    expect(page.name).toBe('My page');
    expect(page.description).toBe('My page description');
});

test('categories are parsed and translated', () => {
    const page = createPage({
        pageMetadata: {
            categories: 'africa, asia'
        }
    });
    expect(page.categoryLanguages).toEqual([
        {
            id: 'africa',
            name: 'Africa'
        },
        {
            id: 'asia',
            name: 'Asia'
        }
    ]);
});

test('categories are trimmed deduplicated and empty values removed', () => {
    const page = createPage({
        pageMetadata: {
            categories: ' africa, asia, africa, , europe, '
        }
    });
    expect(page.categoryLanguages).toEqual([
        {
            id: 'africa',
            name: 'Africa'
        },
        {
            id: 'asia',
            name: 'Asia'
        },
        {
            id: 'europe',
            name: 'Europe'
        }
    ]);
});

test('unknown category falls back to category id as display name', () => {
    const page = createPage({
        pageMetadata: {
            categories: 'unknown-category'
        }
    });
    expect(page.categoryLanguages).toEqual([
        {
            id: 'unknown-category',
            name: 'unknown-category'
        }
    ]);
});

test('missing taxonomy categories object falls back to category ids', () => {
    const config = createConfig();
    config.site.languages.data.en.taxonomy = {};
    const page = createPage({
        config,
        pageMetadata: {
            categories: 'africa'
        }
    });
    expect(page.categoryLanguages).toEqual([
        {
            id: 'africa',
            name: 'africa'
        }
    ]);
});

test('missing categories metadata produces empty category language list', () => {
    const page = createPage();
    expect(page.categoryLanguages).toEqual([]);
});

test('tags default to categories when tags metadata is missing', () => {
    const page = createPage({
        pageMetadata: {
            categories: 'africa, asia'
        }
    });
    expect(page.tags).toEqual(['africa', 'asia']);
});

test('tags merge categories and tag metadata with deduplication', () => {
    const page = createPage({
        pageMetadata: {
            categories: 'africa, asia',
            tags: 'featured, asia, teddy'
        }
    });
    expect(page.tags).toEqual(['africa', 'asia', 'featured', 'teddy']);
});

test('empty tag metadata does not add tags', () => {
    const page = createPage({
        pageMetadata: {
            categories: 'africa',
            tags: ' , , '
        }
    });
    expect(page.tags).toEqual(['africa']);
});

test('date metadata is parsed and formatted', () => {
    const page = createPage({
        pageMetadata: {
            date: '2025-06-25T12:00:00'
        }
    });
    expect(page.date.toISOString()).toBe('2025-06-25T12:00:00.000Z');
    expect(page.displayDate).toBe('25 June 2025');
});

test('date metadata is trimmed before parsing', () => {
    const page = createPage({
        pageMetadata: {
            date: ' 2025-01-15T12:00:00 '
        }
    });
    expect(page.date.toISOString()).toBe('2025-01-15T12:00:00.000Z');
    expect(page.displayDate).toBe('15 January 2025');
});

test('missing date metadata falls back to file modified time', () => {
    const mtime = new Date('2025-03-10T12:00:00Z');
    const pageAbsPath = createPageFile('post.en.md', mtime);
    const page = createPage({
        pageAbsPath
    });
    expect(page.date.getTime()).toBe(mtime.getTime());
    expect(page.displayDate).toBe('10 March 2025');
});

test('invalid date metadata falls back to file modified time', () => {
    const mtime = new Date('2025-04-11T12:00:00Z');
    const pageAbsPath = createPageFile('post.en.md', mtime);
    const page = createPage({
        pageAbsPath,
        pageMetadata: {
            date: 'not-a-date'
        }
    });
    expect(page.date.getTime()).toBe(mtime.getTime());
    expect(page.displayDate).toBe('11 April 2025');
});

test('relative URL is derived from page relative directory', () => {
    const page = createPage({
        pageRelPath: path.join('blog', 'europe', 'post.en.md')
    });
    expect(page.relUrl).toBe(path.join('blog', 'europe').replace(/\\/g, '/'));
});

test('root page relative URL is a dot', () => {
    const page = createPage({
        pageRelPath: 'home.en.md'
    });
    expect(page.relUrl).toBe('.');
});

test('cover metadata is detected and assigned', () => {
    const page = createPage({
        pageMetadata: {
            cover: 'cover.jpg'
        }
    });
    expect(page.coverExists).toBe(true);
    expect(page.cover).toBe('cover.jpg');
});

test('missing cover metadata sets cover to null', () => {
    const page = createPage();
    expect(page.coverExists).toBe(false);
    expect(page.cover).toBe(null);
});

test('empty cover metadata is still detected as existing', () => {
    const page = createPage({
        pageMetadata: {
            cover: ''
        }
    });
    expect(page.coverExists).toBe(true);
    expect(page.cover).toBe('');
});

test('default author is used when author id metadata is missing', () => {
    const page = createPage();
    expect(page.author).toBe('Teddy');
    expect(page.authorUrl).toBe('/about/');
});

test('author id metadata selects configured contributor', () => {
    const page = createPage({
        pageMetadata: {
            authorId: 'jillur'
        }
    });
    expect(page.author).toBe('Jillur Quddus');
    expect(page.authorUrl).toBe('/author/');
});

test('unknown author id falls back to default contributor', () => {
    const page = createPage({
        pageMetadata: {
            authorId: 'missing-author'
        }
    });
    expect(page.author).toBe('Teddy');
    expect(page.authorUrl).toBe('/about/');
});

test('author URL is localized for non-default language', () => {
    const page = createPage({
        language: 'ja',
        pageMetadata: {
            categories: 'asia'
        }
    });
    expect(page.author).toBe('テディ');
    expect(page.authorUrl).toBe('/ja/about/');
});

test('custom index fields are propagated when collection is enabled', () => {
    const page = createPage({
        pageMetadata: {
            customField: 'custom value',
            rating: 5
        }
    });
    expect(page.customField).toBe('custom value');
    expect(page.rating).toBe(5);
});

test('custom index fields are not propagated when collection is disabled', () => {
    const config = createConfig();
    config.site.collection.enabled = false;
    const page = createPage({
        config,
        pageMetadata: {
            customField: 'custom value'
        }
    });
    expect(page.customField).toBeUndefined();
});

test('custom index fields are not propagated when index config is missing', () => {
    const config = createConfig();
    config.site.collection.index = undefined;
    const page = createPage({
        config,
        pageMetadata: {
            customField: 'custom value'
        }
    });
    expect(page.customField).toBeUndefined();
});

test('custom index field is not propagated unless listed in index config', () => {
    const page = createPage({
        pageMetadata: {
            unindexedField: 'unindexed value'
        }
    });
    expect(page.unindexedField).toBeUndefined();
});

test('reserved index keys are not overwritten by custom index propagation', () => {
    const config = createConfig();
    config.site.collection.index.documentStore.document.index = [
        'id',
        'author',
        'tags',
        'cover',
        'customField'
    ];
    const page = createPage({
        pageId: 42,
        config,
        pageMetadata: {
            id: 999,
            author: 'Metadata author',
            tags: 'metadata-tag',
            cover: 'cover.jpg',
            customField: 'custom value'
        }
    });
    expect(page.id).toBe(42);
    expect(page.author).toBe('Teddy');
    expect(page.tags).toEqual(['metadata-tag']);
    expect(page.cover).toBe('cover.jpg');
    expect(page.customField).toBe('custom value');
});

test('custom index field must be an own metadata property', () => {
    const metadataPrototype = {
        customField: 'prototype value'
    };
    const pageMetadata = Object.create(metadataPrototype);
    pageMetadata.name = 'Prototype page';
    pageMetadata.description = 'Prototype page description';
    const page = createPage({
        pageMetadata
    });
    expect(page.customField).toBeUndefined();
});

test('metadata inherited categories tags cover author and date are ignored', () => {
    const metadataPrototype = {
        categories: 'africa',
        tags: 'tag',
        cover: 'cover.jpg',
        authorId: 'jillur',
        date: '2025-06-25T12:00:00'
    };
    const pageMetadata = Object.create(metadataPrototype);
    pageMetadata.name = 'Inherited metadata page';
    pageMetadata.description = 'Inherited metadata page description';
    const mtime = new Date('2025-05-20T12:00:00Z');
    const pageAbsPath = createPageFile('post.en.md', mtime);
    const page = createPage({
        pageAbsPath,
        pageMetadata
    });
    expect(page.categoryLanguages).toEqual([]);
    expect(page.tags).toEqual([]);
    expect(page.coverExists).toBe(false);
    expect(page.cover).toBe(null);
    expect(page.author).toBe('Teddy');
    expect(page.date.getTime()).toBe(mtime.getTime());
});

test('setId updates id and returns page instance', () => {
    const page = createPage();
    const result = page.setId(99);
    expect(page.id).toBe(99);
    expect(result).toBe(page);
});

test('setContent updates content and returns page instance', () => {
    const page = createPage();
    const result = page.setContent('<p>Content</p>');
    expect(page.content).toBe('<p>Content</p>');
    expect(result).toBe(page);
});

test('setId and setContent can be chained', () => {
    const page = createPage();
    page
        .setId(123)
        .setContent('<p>Chained content</p>');
    expect(page.id).toBe(123);
    expect(page.content).toBe('<p>Chained content</p>');
});

test('constructor throws when page absolute path does not exist', () => {
    expect(() => createPage({
        pageAbsPath: path.join(TEST_DIR, 'missing.md')
    })).toThrow();
});

test('page supports non-string custom index values', () => {
    const nestedValue = {
        featured: true
    };
    const page = createPage({
        pageMetadata: {
            nestedValue
        }
    });
    expect(page.nestedValue).toBe(nestedValue);
});

test('language-specific taxonomy is used for category translations', () => {
    const page = createPage({
        language: 'ja',
        pageMetadata: {
            categories: 'asia, travel'
        }
    });
    expect(page.categoryLanguages).toEqual([
        {
            id: 'asia',
            name: 'アジア'
        },
        {
            id: 'travel',
            name: '旅行'
        }
    ]);
});
