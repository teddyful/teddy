/**
 * Client-side search service integration-style tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { TextEncoder } from 'node:util';
import FlexSearch from 'flexsearch';
import { describe, expect, test, vi } from 'vitest';

const SEARCH_SOURCE_FILE = path.resolve('system/assets/js/teddy/search.js');
const BASE_DOCUMENT_STORE_CONFIG = {
    document: {
        id: 'id',
        index: ['name', 'description', 'content'],
        store: true,
        tag: 'tags'
    }
};
const DOCUMENTS = [
    {
        id: 0,
        name: 'Alpha Teddy Bear',
        description: 'A soft teddy bear story.',
        content: 'Alpha content about bears and toys.',
        tags: ['toy', 'bear']
    },
    {
        id: 1,
        name: 'Beta Cat',
        description: 'A cat travel story.',
        content: 'Beta content about cats.',
        tags: ['pet', 'cat']
    },
    {
        id: 2,
        name: 'Gamma Bear',
        description: 'Another teddy bear article.',
        content: 'Gamma content about bears.',
        tags: ['toy', 'bear']
    }
];

function createHeaders(contentLength = null) {
    return {
        get: vi.fn((header) => {
            if (header.toLowerCase() === 'content-length') {
                return contentLength;
            }
            return null;
        })
    };
}

function createResponse({
    ok = true,
    status = 200,
    statusText = 'OK',
    text = '{}',
    contentLength = null
} = {}) {
    return {
        ok,
        status,
        statusText,
        headers: createHeaders(contentLength),
        text: vi.fn().mockResolvedValue(text)
    };
}

function loadSearch(overrides = {}) {
    const source = fs.readFileSync(SEARCH_SOURCE_FILE, 'utf8');
    const normalizeLanguageKey = function(language) {
        const normalizedLanguage = String(language ?? '').trim();
        if ( !/^[a-zA-Z0-9_-]+$/.test(normalizedLanguage) ) {
            throw new Error('Invalid search language key.');
        }
        return normalizedLanguage;
    };
    const context = {
        URL,
        TextEncoder,
        structuredClone: globalThis.structuredClone,
        console,
        window: {
            location: {
                origin: 'https://example.test'
            }
        },
        fetch: vi.fn(),
        PAGE_LANGUAGE: 'en',
        DEFAULT_LANGUAGE: 'en',
        normalizeLanguageKey,
        getPageLanguage: function(defaultLanguage = 'en') {
            return normalizeLanguageKey(context.PAGE_LANGUAGE ?? defaultLanguage);
        },
        COLLECTION_INDEX_BASE_URL: '/assets/collection',
        INDEX_DOCUMENT_STORE_CONFIG: structuredClone(BASE_DOCUMENT_STORE_CONFIG),
        ISO_639_3166_LOOKUP: {
            en: 'en',
            eng: 'en',
            ja: 'jp',
            jpn: 'jp',
            ko: 'kr',
            kor: 'kr',
            zh: 'cn',
            'zh-hk': 'cn',
            'zh-tw': 'cn'
        },
        CJK_ISO_3166: ['jp', 'kr', 'cn'],
        cjkTokenizer: (value) =>
            String(value).replace(/[\x00-\x7F]/g, '').split(''),
        LANGUAGE_INDEX_KEYS: {
            en: []
        },
        COLLECTION_SIZES: {
            en: 0
        },
        FlexSearch,
        ...overrides
    };
    vm.runInNewContext(`${source}\nglobalThis.Search = Search;`, context);
    return {
        Search: context.Search,
        context
    };
}

async function exportFlexSearchIndex(config, documents) {
    const index = new FlexSearch.Document(config);
    for (const document of documents) {
        index.add(document);
    }
    const exported = {};
    await index.export((key, data) => {
        exported[key] = data ?? null;
    });
    return exported;
}

function installIndexFetch(context, exportedIndex) {
    context.fetch = vi.fn(async (url) => {
        const pathname = new URL(url).pathname;
        const key = path.basename(pathname, '.json');
        if (!Object.hasOwn(exportedIndex, key)) {
            return createResponse({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: ''
            });
        }
        return createResponse({
            text: exportedIndex[key],
            contentLength: String(new TextEncoder().encode(exportedIndex[key]).length)
        });
    });
}

function expectSameDocuments(actual, expectedDocuments) {
    expect(actual).toHaveLength(expectedDocuments.length);
    expect(actual).toEqual(expect.arrayContaining(expectedDocuments));
}

describe('Search integration with real FlexSearch export/import data', () => {

    test('loads exported index files and supports document reads and search queries', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const indexKeys = Object.keys(exportedIndex);
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: indexKeys
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        expect(search.loaded).toBe(true);
        expect(search.collectionSize).toBe(DOCUMENTS.length);
        expect(search.getDocument(0)).toEqual(DOCUMENTS[0]);
        expect(search.getDocuments(0, 2)).toEqual([DOCUMENTS[0], DOCUMENTS[1]]);
        const results = await search.query('bear', {
            minSearchQueryLength: 1,
            limit: 10
        });
        expectSameDocuments(results, [DOCUMENTS[0], DOCUMENTS[2]]);
        expect(context.fetch).toHaveBeenCalledTimes(indexKeys.length);
        expect(context.fetch.mock.calls[0][0]).toMatch(
            /^https:\/\/example\.test\/assets\/collection\/en\/.+\.json$/
        );
    });

    test('supports tag-only searches with real FlexSearch', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: Object.keys(exportedIndex)
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        await expect(search.getDocumentsByTags(['toy'], 0, 10))
            .resolves.toEqual([DOCUMENTS[0], DOCUMENTS[2]]);
        await expect(search.getDocumentsByTags(['pet'], 0, 10))
            .resolves.toEqual([DOCUMENTS[1]]);
        await expect(search.getDocumentsByTags(['missing'], 0, 10))
            .resolves.toEqual([]);
    });

    test('supports query-plus-tag searches with real FlexSearch', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: Object.keys(exportedIndex)
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        const bearToyResults = await search.queryAndFilterByTags('bear', ['toy'], {
            minSearchQueryLength: 1,
            limit: 10
        });
        expectSameDocuments(bearToyResults, [DOCUMENTS[0], DOCUMENTS[2]]);
        await expect(search.queryAndFilterByTags('cat', ['toy'], {
            minSearchQueryLength: 1,
            limit: 10
        })).resolves.toEqual([]);
        await expect(search.queryAndFilterByTags('cat', ['pet'], {
            minSearchQueryLength: 1,
            limit: 10
        })).resolves.toEqual([DOCUMENTS[1]]);
    });

    test('deduplicates real FlexSearch results across multiple indexed fields', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: Object.keys(exportedIndex)
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        const results = await search.query('teddy', {
            minSearchQueryLength: 1,
            limit: 10
        });
        const resultIds = results.map((document) => document.id);
        expect(new Set(resultIds).size).toBe(resultIds.length);
        expect(resultIds).toEqual(expect.arrayContaining([0, 2]));
    });

    test('respects query pagination limits after deduplication', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: Object.keys(exportedIndex)
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        const results = await search.query('bear', {
            minSearchQueryLength: 1,
            limit: 1
        });
        expect(results).toHaveLength(1);
        expect([DOCUMENTS[0], DOCUMENTS[2]]).toContainEqual(results[0]);
    });

    test('loads a CJK language index with the custom tokenizer configured', async () => {
        const cjkConfig = structuredClone(BASE_DOCUMENT_STORE_CONFIG);
        cjkConfig.language = 'jp';
        cjkConfig.encode = (value) =>
            String(value).replace(/[\x00-\x7F]/g, '').split('');
        const documents = [
            {
                id: 0,
                name: '東京旅行',
                description: '東京の旅行記事',
                content: '東京 京都 旅行',
                tags: ['旅行']
            },
            {
                id: 1,
                name: '大阪案内',
                description: '大阪の記事',
                content: '大阪 食べ物',
                tags: ['大阪']
            }
        ];
        const exportedIndex = await exportFlexSearchIndex(cjkConfig, documents);
        const { Search, context } = loadSearch({
            PAGE_LANGUAGE: 'ja',
            LANGUAGE_INDEX_KEYS: {
                ja: Object.keys(exportedIndex)
            },
            COLLECTION_SIZES: {
                ja: documents.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await search.loadIndex();
        expect(search.getDocument(0)).toEqual(documents[0]);
        const results = await search.query('東京', {
            minSearchQueryLength: 1,
            limit: 10
        });
        expectSameDocuments(results, [documents[0]]);
    });

    test('loads successfully with no configured index keys', async () => {
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: []
            },
            COLLECTION_SIZES: {
                en: 0
            }
        });
        const search = new Search();
        await search.loadIndex();
        expect(search.loaded).toBe(true);
        expect(search.collectionSize).toBe(0);
        expect(context.fetch).not.toHaveBeenCalled();
        expect(search.getDocument(0)).toBeNull();
        expect(search.getDocuments(0, 10)).toEqual([]);
    });

    test('fails the whole load when one exported index file cannot be fetched', async () => {
        const exportedIndex = await exportFlexSearchIndex(
            BASE_DOCUMENT_STORE_CONFIG,
            DOCUMENTS
        );
        const { Search, context } = loadSearch({
            LANGUAGE_INDEX_KEYS: {
                en: [...Object.keys(exportedIndex), 'missing.key']
            },
            COLLECTION_SIZES: {
                en: DOCUMENTS.length
            }
        });
        installIndexFetch(context, exportedIndex);
        const search = new Search();
        await expect(search.loadIndex()).rejects.toThrow(
            "Failed to load search index 'missing.key': 404 Not Found"
        );
        expect(search.loaded).toBe(false);
        expect(search.index).toBeNull();
        expect(search.collectionSize).toBe(0);
    });
    
});
