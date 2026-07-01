/**
 * Client search service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

class Search {

    static UNICODE_QUERY_FILTER_REGEX = /[^\p{Letter}\p{Number}_\-\s]/gu;
    static LEGACY_QUERY_FILTER_REGEX = /[^a-zA-Z0-9_\-\s\u00c0-\u024f\u4e00-\u9fff\u30a0-\u30ff\u3040-\u309f\uac00-\ud7af\u0370-\u03ff\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f\u0980-\u09ff\u0b80-\u0bff\u0a80-\u0aff\u0590-\u05ff\u0f00-\u0fff\u1800-\u18af]/gi;
    static WHITESPACE_REGEX = /\s+/g;
    static INDEX_KEY_REGEX = /^[a-zA-Z0-9_.-]+$/;
    static MAX_MIN_SEARCH_QUERY_LENGTH = 20;
    static MAX_SEARCH_QUERY_LENGTH = 200;
    static MAX_SEARCH_LIMIT = 100;
    static MAX_TAG_COUNT = 30;
    static MAX_INDEX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

    constructor() {
        this.index = null;
        this.collectionSize = 0;
        this.loaded = false;
    }

    #assertIndexLoaded() {
        if ( !this.loaded || this.index === null ) {
            throw new Error('Search index has not been loaded.');
        }
    }

    static sanitizeQuery(query, unicodeProperties = true) {
        const normalizedQuery = String(query ?? '')
            .slice(0, Search.MAX_SEARCH_QUERY_LENGTH);
        const filteredQuery = unicodeProperties ? 
            
            // Using Unicode properties.
            normalizedQuery.replace(Search.UNICODE_QUERY_FILTER_REGEX, '') : 

            // Without using Unicode properties (legacy systems).
            // Keep the following character sets:
            // Alphanumeric                                             a-zA-Z0-9
            // Underscore, hyphen and whitespace                        _\-\s
            // Extended Latin (incl. characters for Vietnamese)         \u00c0-\u024f
            // Chinese characters (CJK unified ideographs)              \u4e00-\u9fff
            // Japanese Hiragana                                        \u3040-\u309f
            // Japanese Katakana                                        \u30a0-\u30ff
            // Korean (Hangul syllables)                                \uac00-\ud7af
            // Greek (and Coptic)                                       \u0370-\u03ff
            // Cyrillic                                                 \u0400-\u04ff
            // Arabic                                                   \u0600-\u06ff
            // Thai                                                     \u0e00-\u0e7f
            // Hindi (Devanagari)                                       \u0900-\u097f
            // Bengali                                                  \u0980-\u09ff
            // Tamil                                                    \u0b80-\u0bff
            // Gujarati                                                 \u0a80-\u0aff
            // Hebrew                                                   \u0590-\u05ff
            // Tibetan                                                  \u0f00-\u0fff
            // Mongolian                                                \u1800-\u18af
            normalizedQuery.replace(Search.LEGACY_QUERY_FILTER_REGEX, '');

        // Clean and standardise whitespace characters.
        return filteredQuery
                .replace(Search.WHITESPACE_REGEX, ' ')
                .trim();

    }

    static normalizeMinSearchQueryLength(minSearchQueryLength = 2) {
        const normalizedMinSearchQueryLength = Math.floor(
            Number(minSearchQueryLength) || 0
        );
        return Math.min(
            Math.max(0, normalizedMinSearchQueryLength),
            Search.MAX_MIN_SEARCH_QUERY_LENGTH
        );
    }

    static normalizeEnrich(enrich = true) {
        return enrich === true;
    }

    static normalizeTags(tags) {
        const normalizedTags = Array.isArray(tags) ? tags : [tags];
        return normalizedTags
            .filter(function(tag) {
                return ['string', 'number'].includes(typeof tag) &&
                    String(tag).trim().length > 0;
            })
            .slice(0, Search.MAX_TAG_COUNT);
    }

    static normalizePagination(offset = 0, limit = 10) {
        const normalizedOffset = Math.floor(Number(offset) || 0);
        const normalizedLimit = Math.floor(Number(limit) || 0);
        return {
            offset: Math.max(0, normalizedOffset),
            limit: Math.min(
                Math.max(0, normalizedLimit),
                Search.MAX_SEARCH_LIMIT
            )
        };
    }

    static normalizeIndexKey(key) {
        const normalizedKey = String(key ?? '').trim();
        if ( !Search.INDEX_KEY_REGEX.test(normalizedKey) ) {
            throw new Error('Invalid search index key.');
        }
        return normalizedKey;
    }

    static normalizeIndexBaseUrl(url) {
        const normalizedUrl = String(url ?? '').trim();
        if ( normalizedUrl.length === 0 ) {
            throw new Error('Invalid search index base URL.');
        }
        const parsedUrl = new URL(normalizedUrl, window.location.origin);
        if ( !['http:', 'https:'].includes(parsedUrl.protocol) ) {
            throw new Error('Invalid search index base URL.');
        }
        if ( parsedUrl.origin !== window.location.origin ) {
            throw new Error(
                'Search index base URL must use the current origin.');
        }
        return parsedUrl.href.replace(/\/$/, '');
    }

    static normalizeDocumentId(id) {
        return Math.max(0, Math.floor(Number(id) || 0));
    }

    static async fetchIndexData(key, language = getPageLanguage()) {
        const normalizedKey = Search.normalizeIndexKey(key);
        const normalizedLanguage = normalizeLanguageKey(language);
        const normalizedIndexBaseUrl = Search.normalizeIndexBaseUrl(
            COLLECTION_INDEX_BASE_URL
        );
        const indexDataUrl =`${normalizedIndexBaseUrl}/` + 
            `${normalizedLanguage}/${normalizedKey}.json`;
        const response = await fetch(indexDataUrl);
        if ( !response.ok ) {
            throw new Error(
                `Failed to load search index '${normalizedKey}': ` +
                `${response.status} ${response.statusText}`
            );
        }
        const contentLength = Number(
            response.headers.get('Content-Length') || 0);
        if ( contentLength > Search.MAX_INDEX_FILE_SIZE_BYTES ) {
            throw new Error(
                `Search index '${normalizedKey}' exceeds the ` + 
                `maximum file size.`);
        }
        const data = await response.text();
        const dataSize = new TextEncoder().encode(data).length;
        if ( dataSize > Search.MAX_INDEX_FILE_SIZE_BYTES ) {
            throw new Error(
                `Search index '${normalizedKey}' exceeds the ` + 
                `maximum file size.`);
        }
        return { key: normalizedKey, data };
    }

    async loadIndex() {

        this.loaded = false;
        this.index = null;
        this.collectionSize = 0;

        try {

            // Regenerate the index configuration.
            const normalizedLanguage = getPageLanguage();
            let indexConfig = structuredClone(INDEX_DOCUMENT_STORE_CONFIG);
            indexConfig.language = normalizedLanguage in ISO_639_3166_LOOKUP ? 
                ISO_639_3166_LOOKUP[normalizedLanguage] : normalizedLanguage;
            if ( CJK_ISO_3166.includes(indexConfig.language) ) {
                indexConfig.encode = cjkTokenizer;
            }

            // Create an empty index using the same build-time index config.
            this.index = new FlexSearch.Document(indexConfig);
            const indexKeys = normalizedLanguage in LANGUAGE_INDEX_KEYS ? 
                LANGUAGE_INDEX_KEYS[normalizedLanguage] : [];

            // Fetch all index files concurrently.
            const indexData = await Promise.all(indexKeys.map(
                function(key) {
                    return Search.fetchIndexData(key, normalizedLanguage);
                }
            ));

            // Import each index key using the fetched data.
            for ( const { key, data } of indexData ) {
                try {
                    await this.index.import(key, data ?? null);
                } catch (error) {
                    throw new Error(
                        `Failed to import search index '${key}'.`, 
                        { cause: error });
                }
            }

            // Set the collection size.
            this.collectionSize = normalizedLanguage in COLLECTION_SIZES ? 
                COLLECTION_SIZES[normalizedLanguage] : 0;
            this.loaded = true;

        } catch (error) {
            this.loaded = false;
            this.index = null;
            this.collectionSize = 0;
            throw error;
        }

    }

    getDocument(id) {
        this.#assertIndexLoaded();
        const normalizedId = Search.normalizeDocumentId(id);
        if ( normalizedId >= this.collectionSize ) {
            return null;
        }
        return this.index.get(normalizedId);
    }

    getDocuments(offset = 0, limit = 10) {
        this.#assertIndexLoaded();
        const {
            offset: paginationOffset,
            limit: paginationLimit
        } = Search.normalizePagination(offset, limit);
        let documents = [];
        for (let i = paginationOffset; i < (
            paginationOffset + paginationLimit); i++) {
            const document = this.index.get(i);
            if ( typeof document !== 'undefined' && document !== null ) {
                documents.push(document);
            }
        }
        return documents;
    }

    async getDocumentsByTags(tags, offset = 0, limit = 10, enrich = true) {
        this.#assertIndexLoaded();
        const normalizedTags = Search.normalizeTags(tags);
        if ( normalizedTags.length === 0 ) {
            return [];
        }
        const {
            offset: paginationOffset,
            limit: paginationLimit
        } = Search.normalizePagination(offset, limit);
        const normalizedEnrich = Search.normalizeEnrich(enrich);
        return this.#deduplicateHits(await this.index.searchAsync({
            tag: {
                field: "tags", 
                tag: normalizedTags
            }, 
            offset: paginationOffset, 
            limit: paginationLimit, 
            enrich: normalizedEnrich
        }), paginationLimit);
    }

    async query(searchQuery, options = {}) {
        this.#assertIndexLoaded();
        const {
            enrich = true,
            minSearchQueryLength = 2
        } = options;
        const {
            offset: paginationOffset,
            limit: paginationLimit
        } = Search.normalizePagination(options.offset, options.limit);
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        const minQueryLength = Search.normalizeMinSearchQueryLength(
            minSearchQueryLength
        );
        const normalizedEnrich = Search.normalizeEnrich(enrich);
        if ( sanitizedSearchQuery.length < minQueryLength ) {
            return [];
        }
        
        // Paginate unique documents after dedupe, not FlexSearch hit offsets.
        const scanLimit = Math.min(
            Math.max(this.collectionSize, 0),
            Search.MAX_SEARCH_LIMIT
        );
        const allResults = this.#deduplicateHits(
            await this.index.searchAsync(sanitizedSearchQuery, {
                offset: 0,
                limit: scanLimit,
                enrich: normalizedEnrich
            }),
            scanLimit
        );
        return allResults.slice(
            paginationOffset,
            paginationOffset + paginationLimit
        );
        
    }

    async queryAndFilterByTags(searchQuery, tags, options = {}) {
        this.#assertIndexLoaded();
        const {
            enrich = true,
            minSearchQueryLength = 2
        } = options;
        const {
            offset: paginationOffset,
            limit: paginationLimit
        } = Search.normalizePagination(options.offset, options.limit);
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        const minQueryLength = Search.normalizeMinSearchQueryLength(
            minSearchQueryLength
        );
        const normalizedTags = Search.normalizeTags(tags);
        const normalizedEnrich = Search.normalizeEnrich(enrich);
        if ( sanitizedSearchQuery.length < minQueryLength || 
            normalizedTags.length === 0 ) {
            return [];
        }

        // FlexSearch can return no hits for combined text + tag queries when
        // the same term matches one document through a secondary field 
        // (e.g. content) while other documents match the term in primary 
        // fields. Intersect query results with tag-filtered documents instead.
        const scanLimit = Math.min(
            Math.max(this.collectionSize, 0),
            Search.MAX_SEARCH_LIMIT
        );
        const queryResults = this.#deduplicateHits(
            await this.index.searchAsync(sanitizedSearchQuery, {
                offset: 0,
                limit: scanLimit,
                enrich: normalizedEnrich
            }),
            scanLimit
        );
        const tagResults = await this.getDocumentsByTags(
            normalizedTags, 0, scanLimit, normalizedEnrich);
        const tagIds = new Set(tagResults.map((doc) => doc.id));
        const intersected = queryResults.filter((doc) => tagIds.has(doc.id));
        return intersected.slice(
            paginationOffset,
            paginationOffset + paginationLimit
        );
    }

    #deduplicateHits(hits, limit = Infinity) {
        let docs = new Map();
        let results = [];
        if ( !Array.isArray(hits) ) {
            return results;
        }
        for ( const hit of hits ) {
            if ( !hit || !Array.isArray(hit.result) ) {
                continue;
            }
            for ( const result of hit.result ) {
                const doc = result && result.doc;
                if ( !doc || typeof doc.id === 'undefined' ||
                    docs.has(doc.id) ) {
                    continue;
                }
                docs.set(doc.id, true);
                results.push(doc);
                if ( results.length >= limit ) {
                    return results;
                }
            }
        }
        return results;
    }

}
