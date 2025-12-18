/**
 * Client search service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

class Search {

    static sanitizeQuery(query, unicodeProperties = true) {
        const filteredQuery = unicodeProperties ? 
            
            // Using Unicode properties.
            query.replace(/[^\p{Letter}\p{Number}_\-\s]/gu, '') : 

            // Without using Unicode properties (legacy systems).
            // Keep the following character sets:
            // Alphanumeric                                             a-zA-Z0-9
            // Underscore, hyphen and whitespace                        _\-\s
            // Extended Latin (incl. characters for Vietnamese)         \u0100-\u024f
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
            query.replace(/[^a-zA-Z0-9_\-\s\u0100-\u024f\u4e00-\u9fff\u30a0-\u30ff\u3040-\u309f\uac00-\ud7af\u0370-\u03ff\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f\u0980-\u09ff\u0b80-\u0bff\u0a80-\u0aff\u0590-\u05ff\u0f00-\u0fff\u1800-\u18af]/gi, '');

        // Clean and standardise whitespace characters.
        return filteredQuery
                .replace(/\s\s+/g, ' ')
                .replace(/\s/g, ' ')
                .trim();

    }

    async loadIndex() {

        // Regenerate the index configuration.
        let indexConfig = INDEX_DOCUMENT_STORE_CONFIG;
        indexConfig.language = PAGE_LANGUAGE in ISO_639_3166_LOOKUP ? 
            ISO_639_3166_LOOKUP[PAGE_LANGUAGE] : PAGE_LANGUAGE;
        if ( CJK_ISO_3166.includes(indexConfig.language) ) {
            indexConfig.encode = cjkTokenizer;
        }

        // Create an empty index using the same build-time index configuration.
        this.index = new FlexSearch.Document(indexConfig);
        const indexKeys = PAGE_LANGUAGE in LANGUAGE_INDEX_KEYS ? 
            LANGUAGE_INDEX_KEYS[PAGE_LANGUAGE] : [];

        // Define the HTTP headers for the Fetch API.
        let headers = new Headers();
        headers.append('Content-Type','application/json; charset=UTF-8');

        // Iterate over all index keys and import their data into the index.
        for ( const key of indexKeys ) {
            const indexDataUrl = 
                `${COLLECTION_INDEX_BASE_URL}/${PAGE_LANGUAGE}/${key}.json`;
            const response = await fetch(indexDataUrl, headers);
            const json = await response.json();
            await this.index.import(key, json ?? null);
        }

        // Set the collection size.
        this.collectionSize = PAGE_LANGUAGE in COLLECTION_SIZES ? 
            COLLECTION_SIZES[PAGE_LANGUAGE] : 0;

    }

    async getDocument(id) {
        return await this.index.get(id);
    }

    async getDocuments(offset = 0, limit = 10) {
        let documents = [];
        for (let i = offset; i < (offset + limit); i++) {
            const document = await this.index.get(i);
            if ( typeof document !== 'undefined' ) {
                documents.push(document);
            }
        }
        return documents;
    }

    async getDocumentsByTags(tags, offset = 0, limit = 10, enrich = true) {
        return this.#deduplicateHits(await this.index.searchAsync({
            tag: tags, 
            offset: offset, 
            limit: limit, 
            enrich: enrich
        }));
    }

    async query(searchQuery, offset = 0, limit = 10, 
        enrich = true, minSearchQueryLength = 2) {
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        if ( sanitizedSearchQuery.length >= minSearchQueryLength ) {
            return this.#deduplicateHits(await this.index.searchAsync(
                sanitizedSearchQuery, {
                    offset: offset, 
                    limit: limit, 
                    enrich: enrich
                }));
        }
        return [];
    }

    // Exists a bug in Flexsearch where performing a query and tag-based filter
    // together does not return any documents outside of the strict range 
    // [offset, limit] (unlike query or tag-based filters when applied
    // individually). The temporary fix applied below is to incrementally 
    // increase the offset until it reaches the size of the collection, or
    // the number of hits equals the requested limit - whichever comes first.
    async queryAndFilterByTags(searchQuery, tags, 
        offset = 0, limit = 10, enrich = true, minSearchQueryLength = 2) {
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        if ( sanitizedSearchQuery.length >= minSearchQueryLength ) {
            let docs = new Map();
            let liveOffset = offset;
            while ( liveOffset < this.collectionSize ) {
                const hits = await this.index.searchAsync(sanitizedSearchQuery, 
                    {
                        tag: tags, 
                        offset: liveOffset, 
                        limit: limit, 
                        enrich: enrich
                    });
                for ( const hit of hits ) {
                    for ( const result of hit.result ) {
                        if ( !docs.has(result.doc.id) && docs.size < limit ) {
                            docs.set(result.doc.id, result.doc);
                        }
                    }
                }
                if ( docs.size == limit )
                    break;
                liveOffset += limit;
            }
            return [...docs.values()];
        }
        return [];
    }

    #deduplicateHits(hits) {
        let docs = new Map();
        for ( const hit of hits ) {
            for ( const result of hit.result ) {
                if ( !docs.has(result.doc.id) ) {
                    docs.set(result.doc.id, result.doc);
                }
            }
        }
        return [...docs.values()];
    }

}
