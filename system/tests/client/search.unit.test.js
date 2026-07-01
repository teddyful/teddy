/**
 * Client-side search service unit tests.
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
import { afterEach, describe, expect, test, vi } from 'vitest';

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

function createMockIndex() {
    return {
        import: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        searchAsync: vi.fn()
    };
}

function loadSearch(overrides = {}) {
    const source = fs.readFileSync(SEARCH_SOURCE_FILE, 'utf8');
    const mockIndex = overrides.mockIndex ?? createMockIndex();
    const MockDocument = vi.fn(function Document() {
        return mockIndex;
    });
    const normalizeLanguageKey = vi.fn(function(language) {
        const normalizedLanguage = String(language ?? '').trim();
        if ( !/^[a-zA-Z0-9_-]+$/.test(normalizedLanguage) ) {
            throw new Error('Invalid search language key.');
        }
        return normalizedLanguage;
    });
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
        getPageLanguage: vi.fn(function(defaultLanguage = 'en') {
            return normalizeLanguageKey(context.PAGE_LANGUAGE ?? defaultLanguage);
        }),
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
        cjkTokenizer: vi.fn((value) =>
            String(value).replace(/[\x00-\x7F]/g, '').split('')
        ),
        LANGUAGE_INDEX_KEYS: {
            en: ['0.map', '1.doc']
        },
        COLLECTION_SIZES: {
            en: 3
        },
        FlexSearch: {
            Document: MockDocument
        },
        ...overrides
    };
    vm.runInNewContext(`${source}\nglobalThis.Search = Search;`, context);
    return {
        Search: context.Search,
        context,
        mockIndex
    };
}

describe('Search static helpers', () => {

    test('sanitizeQuery strips unsafe punctuation and normalizes whitespace', () => {
        const { Search } = loadSearch();
        expect(Search.sanitizeQuery('  teddy!!! <script> bear\t\ncat  '))
            .toBe('teddy script bear cat');
    });

    test('sanitizeQuery supports Unicode property filtering', () => {
        const { Search } = loadSearch();
        expect(Search.sanitizeQuery('東京 café медведь 🧸 bear')).toBe(
            '東京 café медведь bear'
        );
    });

    test('sanitizeQuery supports the legacy allowlist fallback', () => {
        const { Search } = loadSearch();
        expect(Search.sanitizeQuery('東京 café медведь 🧸 bear', false)).toBe(
            '東京 café медведь bear'
        );
    });

    test('sanitizeQuery handles nullish and long input', () => {
        const { Search } = loadSearch();
        expect(Search.sanitizeQuery(null)).toBe('');
        expect(Search.sanitizeQuery('a'.repeat(250))).toHaveLength(
            Search.MAX_SEARCH_QUERY_LENGTH
        );
    });

    test('normalizeMinSearchQueryLength clamps invalid, negative, and large values', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeMinSearchQueryLength()).toBe(2);
        expect(Search.normalizeMinSearchQueryLength('5.9')).toBe(5);
        expect(Search.normalizeMinSearchQueryLength(-10)).toBe(0);
        expect(Search.normalizeMinSearchQueryLength('abc')).toBe(0);
        expect(Search.normalizeMinSearchQueryLength(999)).toBe(
            Search.MAX_MIN_SEARCH_QUERY_LENGTH
        );
    });

    test('normalizeEnrich only accepts literal true', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeEnrich(true)).toBe(true);
        expect(Search.normalizeEnrich(false)).toBe(false);
        expect(Search.normalizeEnrich('true')).toBe(false);
        expect(Search.normalizeEnrich(1)).toBe(false);
    });

    test('normalizeTags accepts strings and numbers, removes blanks, and caps length', () => {
        const { Search } = loadSearch();
        const tags = [
            'toy',
            '',
            '  ',
            123,
            false,
            null,
            undefined,
            ...Array.from({ length: 40 }, (_, index) => `tag-${index}`)
        ];
        const normalized = Search.normalizeTags(tags);
        expect(normalized).toHaveLength(Search.MAX_TAG_COUNT);
        expect(normalized.slice(0, 2)).toEqual(['toy', 123]);
    });

    test('normalizeTags wraps a single non-array tag', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeTags('bear')).toEqual(['bear']);
        expect(Search.normalizeTags(null)).toEqual([]);
    });

    test('normalizePagination floors values and clamps offset and limit', () => {
        const { Search } = loadSearch();
        expect(Search.normalizePagination('2.9', '5.8')).toEqual({
            offset: 2,
            limit: 5
        });
        expect(Search.normalizePagination(-3, -1)).toEqual({
            offset: 0,
            limit: 0
        });
        expect(Search.normalizePagination(1, 999)).toEqual({
            offset: 1,
            limit: Search.MAX_SEARCH_LIMIT
        });
    });

    test('normalizeIndexKey accepts alphanumeric, underscore, hyphen, and dot keys', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeIndexKey(' 1.doc ')).toBe('1.doc');
        expect(Search.normalizeIndexKey('name.1.map')).toBe('name.1.map');
        expect(() => Search.normalizeIndexKey('../secret')).toThrow(
            'Invalid search index key.'
        );
        expect(() => Search.normalizeIndexKey('')).toThrow(
            'Invalid search index key.'
        );
    });

    test('normalizeLanguageKey accepts safe language keys and rejects unsafe ones', () => {
        const { context } = loadSearch();
        expect(context.normalizeLanguageKey(' zh-tw ')).toBe('zh-tw');
        expect(context.normalizeLanguageKey('en_US')).toBe('en_US');
        expect(() => context.normalizeLanguageKey('../en')).toThrow(
            'Invalid search language key.'
        );
        expect(() => context.normalizeLanguageKey('')).toThrow(
            'Invalid search language key.'
        );
    });

    test('normalizeIndexBaseUrl resolves same-origin relative and absolute URLs', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeIndexBaseUrl('/assets/collection/')).toBe(
            'https://example.test/assets/collection'
        );
        expect(Search.normalizeIndexBaseUrl('https://example.test/assets/collection/'))
            .toBe('https://example.test/assets/collection');
    });

    test('normalizeIndexBaseUrl rejects empty, non-http, and cross-origin URLs', () => {
        const { Search } = loadSearch();
        expect(() => Search.normalizeIndexBaseUrl('')).toThrow(
            'Invalid search index base URL.'
        );
        expect(() => Search.normalizeIndexBaseUrl('javascript:alert(1)')).toThrow(
            'Invalid search index base URL.'
        );
        expect(() => Search.normalizeIndexBaseUrl('https://evil.test/index')).toThrow(
            'Search index base URL must use the current origin.'
        );
    });

    test('normalizeDocumentId floors invalid IDs and clamps negatives to zero', () => {
        const { Search } = loadSearch();
        expect(Search.normalizeDocumentId('2.9')).toBe(2);
        expect(Search.normalizeDocumentId(-10)).toBe(0);
        expect(Search.normalizeDocumentId('abc')).toBe(0);
    });

});

describe('Search.fetchIndexData', () => {

    test('fetches same-origin index data using normalized language and key', async () => {
        const { Search, context } = loadSearch();
        context.fetch = vi.fn().mockResolvedValue(createResponse({
            text: '{"ok":true}',
            contentLength: '11'
        }));
        await expect(Search.fetchIndexData(' 1.doc ')).resolves.toEqual({
            key: '1.doc',
            data: '{"ok":true}'
        });
        expect(context.fetch).toHaveBeenCalledWith(
            'https://example.test/assets/collection/en/1.doc.json'
        );
    });

    test('throws contextual errors for failed responses', async () => {
        const { Search, context } = loadSearch();
        context.fetch = vi.fn().mockResolvedValue(createResponse({
            ok: false,
            status: 500,
            statusText: 'Server Error'
        }));
        await expect(Search.fetchIndexData('1.doc')).rejects.toThrow(
            "Failed to load search index '1.doc': 500 Server Error"
        );
    });

    test('rejects oversized content-length before reading the body', async () => {
        const { Search, context } = loadSearch();
        const response = createResponse({
            contentLength: String(Search.MAX_INDEX_FILE_SIZE_BYTES + 1)
        });
        context.fetch = vi.fn().mockResolvedValue(response);
        await expect(Search.fetchIndexData('1.doc')).rejects.toThrow(
            "Search index '1.doc' exceeds the maximum file size."
        );
        expect(response.text).not.toHaveBeenCalled();
    });

    test('rejects oversized response bodies even without content-length', async () => {
        const { Search, context } = loadSearch();
        context.fetch = vi.fn().mockResolvedValue(createResponse({
            text: 'a'.repeat(Search.MAX_INDEX_FILE_SIZE_BYTES + 1)
        }));
        await expect(Search.fetchIndexData('1.doc')).rejects.toThrow(
            "Search index '1.doc' exceeds the maximum file size."
        );
    });

});

describe('Search load and query unit behavior', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('constructor starts unloaded with an empty collection', () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        expect(search.index).toBeNull();
        expect(search.collectionSize).toBe(0);
        expect(search.loaded).toBe(false);
    });

    test('loadIndex creates a FlexSearch document, fetches all keys, imports data, and marks loaded', async () => {
        const mockIndex = createMockIndex();
        const { Search, context } = loadSearch({ mockIndex });
        Search.fetchIndexData = vi.fn()
            .mockResolvedValueOnce({ key: '0.map', data: '{"map":true}' })
            .mockResolvedValueOnce({ key: '1.doc', data: '{"doc":true}' });
        const search = new Search();
        await search.loadIndex();
        expect(context.FlexSearch.Document).toHaveBeenCalledWith({
            document: BASE_DOCUMENT_STORE_CONFIG.document,
            language: 'en'
        });
        expect(Search.fetchIndexData).toHaveBeenCalledTimes(2);
        expect(mockIndex.import).toHaveBeenCalledWith('0.map', '{"map":true}');
        expect(mockIndex.import).toHaveBeenCalledWith('1.doc', '{"doc":true}');
        expect(search.loaded).toBe(true);
        expect(search.collectionSize).toBe(3);
    });

    test('loadIndex maps CJK language config and installs the CJK tokenizer', async () => {
        const mockIndex = createMockIndex();
        const { Search, context } = loadSearch({
            mockIndex,
            PAGE_LANGUAGE: 'ja',
            LANGUAGE_INDEX_KEYS: {
                ja: []
            },
            COLLECTION_SIZES: {
                ja: 2
            }
        });
        Search.fetchIndexData = vi.fn();
        const search = new Search();
        await search.loadIndex();
        expect(context.FlexSearch.Document).toHaveBeenCalledWith({
            document: BASE_DOCUMENT_STORE_CONFIG.document,
            language: 'jp',
            encode: context.cjkTokenizer
        });
        expect(search.collectionSize).toBe(2);
        expect(search.loaded).toBe(true);
    });

    test('loadIndex resets state when fetching fails', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        Search.fetchIndexData = vi.fn().mockRejectedValue(new Error('network'));
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 10;
        await expect(search.loadIndex()).rejects.toThrow('network');
        expect(search.loaded).toBe(false);
        expect(search.index).toBeNull();
        expect(search.collectionSize).toBe(0);
    });

    test('loadIndex wraps import failures with the failing key', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        Search.fetchIndexData = vi.fn().mockResolvedValue({
            key: '1.doc',
            data: '{"doc":true}'
        });
        mockIndex.import.mockRejectedValue(new Error('bad json'));
        const search = new Search();
        await expect(search.loadIndex()).rejects.toThrow(
            "Failed to import search index '1.doc'."
        );
        expect(search.loaded).toBe(false);
        expect(search.index).toBeNull();
    });

    test('document readers throw before load', () => {
        const { Search } = loadSearch();
        const search = new Search();
        expect(() => search.getDocument(0)).toThrow(
            'Search index has not been loaded.'
        );
        expect(() => search.getDocuments()).toThrow(
            'Search index has not been loaded.'
        );
    });

    test('getDocument normalizes IDs and returns null outside collection bounds', () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 3;
        mockIndex.get.mockImplementation((id) => DOCUMENTS[id]);
        expect(search.getDocument('2.9')).toEqual(DOCUMENTS[2]);
        expect(search.getDocument(3)).toBeNull();
        expect(search.getDocument(-1)).toEqual(DOCUMENTS[0]);
    });

    test('getDocuments returns existing documents in normalized pagination range', () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 3;
        mockIndex.get.mockImplementation((id) => DOCUMENTS[id] ?? null);
        expect(search.getDocuments(1, 5)).toEqual([DOCUMENTS[1], DOCUMENTS[2]]);
        expect(search.getDocuments(-2, 1.9)).toEqual([DOCUMENTS[0]]);
    });

    test('getDocumentsByTags returns empty output for empty normalized tags', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        await expect(search.getDocumentsByTags([], 0, 10)).resolves.toEqual([]);
        expect(mockIndex.searchAsync).not.toHaveBeenCalled();
    });

    test('getDocumentsByTags searches by normalized tags and deduplicates enriched hits', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        mockIndex.searchAsync.mockResolvedValue([
            {
                field: 'tags',
                result: [
                    { id: 0, doc: DOCUMENTS[0] },
                    { id: 2, doc: DOCUMENTS[2] },
                    { id: 0, doc: DOCUMENTS[0] }
                ]
            }
        ]);
        await expect(search.getDocumentsByTags(['toy', '', null], 1, 2))
            .resolves.toEqual([DOCUMENTS[0], DOCUMENTS[2]]);
        expect(mockIndex.searchAsync).toHaveBeenCalledWith({
            tag: {
                field: 'tags',
                tag: ['toy']
            },
            offset: 1,
            limit: 2,
            enrich: true
        });
    });

    test('query returns empty output below the minimum query length', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        await expect(search.query('a', { minSearchQueryLength: 2 }))
            .resolves.toEqual([]);
        expect(mockIndex.searchAsync).not.toHaveBeenCalled();
    });

    test('query sanitizes input, normalizes options, and deduplicates results by document ID', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 3;
        mockIndex.searchAsync.mockResolvedValue([
            {
                field: 'name',
                result: [
                    { id: 0, doc: DOCUMENTS[0] },
                    { id: 2, doc: DOCUMENTS[2] }
                ]
            },
            {
                field: 'description',
                result: [
                    { id: 2, doc: DOCUMENTS[2] },
                    { id: 1, doc: DOCUMENTS[1] }
                ]
            }
        ]);
        await expect(search.query(' bear!!! ', {
            offset: '1.9',
            limit: 2,
            enrich: true,
            minSearchQueryLength: 1
        })).resolves.toEqual([DOCUMENTS[2], DOCUMENTS[1]]);
        expect(mockIndex.searchAsync).toHaveBeenCalledWith('bear', {
            offset: 0,
            limit: 3,
            enrich: true
        });
    });

    test('query paginates deduplicated results across load-more pages', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 3;
        const flexSearchHits = [
            {
                field: 'name',
                result: [
                    { id: 0, doc: DOCUMENTS[0] },
                    { id: 2, doc: DOCUMENTS[2] }
                ]
            },
            {
                field: 'description',
                result: [
                    { id: 2, doc: DOCUMENTS[2] },
                    { id: 1, doc: DOCUMENTS[1] }
                ]
            }
        ];
        mockIndex.searchAsync.mockResolvedValue(flexSearchHits);
        const firstPage = await search.query('bear', {
            offset: 0,
            limit: 2,
            enrich: true,
            minSearchQueryLength: 1
        });
        const secondPage = await search.query('bear', {
            offset: 2,
            limit: 2,
            enrich: true,
            minSearchQueryLength: 1
        });
        expect(firstPage).toEqual([DOCUMENTS[0], DOCUMENTS[2]]);
        expect(secondPage).toEqual([DOCUMENTS[1]]);
        expect(firstPage.concat(secondPage)).toEqual([
            DOCUMENTS[0],
            DOCUMENTS[2],
            DOCUMENTS[1]
        ]);
        expect(mockIndex.searchAsync).toHaveBeenCalledTimes(2);
        expect(mockIndex.searchAsync).toHaveBeenNthCalledWith(1, 'bear', {
            offset: 0,
            limit: 3,
            enrich: true
        });
        expect(mockIndex.searchAsync).toHaveBeenNthCalledWith(2, 'bear', {
            offset: 0,
            limit: 3,
            enrich: true
        });
    });

    test('queryAndFilterByTags returns empty output for short query or empty tags', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        await expect(search.queryAndFilterByTags('a', ['toy'], {
            minSearchQueryLength: 2
        })).resolves.toEqual([]);
        await expect(search.queryAndFilterByTags('bear', [], {
            minSearchQueryLength: 1
        })).resolves.toEqual([]);
        expect(mockIndex.searchAsync).not.toHaveBeenCalled();
    });

    test('queryAndFilterByTags intersects query and tag results', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        search.collectionSize = 3;
        mockIndex.searchAsync
            .mockResolvedValueOnce([
                {
                    field: 'name',
                    result: [
                        { id: 0, doc: DOCUMENTS[0] },
                        { id: 1, doc: DOCUMENTS[1] }
                    ]
                }
            ])
            .mockResolvedValueOnce([
                {
                    field: 'tags',
                    result: [
                        { id: 0, doc: DOCUMENTS[0] }
                    ]
                }
            ]);
        await expect(search.queryAndFilterByTags(' bear!!! ', ['toy', null], {
            offset: 0,
            limit: 10,
            enrich: true,
            minSearchQueryLength: 1
        })).resolves.toEqual([DOCUMENTS[0]]);
        expect(mockIndex.searchAsync).toHaveBeenNthCalledWith(1, 'bear', {
            offset: 0,
            limit: 3,
            enrich: true
        });
        expect(mockIndex.searchAsync).toHaveBeenNthCalledWith(2, {
            tag: {
                field: 'tags',
                tag: ['toy']
            },
            offset: 0,
            limit: 3,
            enrich: true
        });
    });

    test('query methods return empty output for malformed non-array FlexSearch hits', async () => {
        const mockIndex = createMockIndex();
        const { Search } = loadSearch({ mockIndex });
        const search = new Search();
        search.loaded = true;
        search.index = mockIndex;
        mockIndex.searchAsync.mockResolvedValue(null);
        await expect(search.query('bear', { minSearchQueryLength: 1 }))
            .resolves.toEqual([]);
    });

});
