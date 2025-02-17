/**
 * Client search service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

class Search {

    #getLanguage() {
        return document.documentElement.lang !== null ? 
            document.documentElement.lang : DEFAULT_LANGUAGE;
    }

    static sanitizeQuery(query) {
        return query.replace(/[`!|£^*&;$%@"<>()+-={}[]#~:?\\\/,]/gi, '')
            .replace(/\s\s+/g, ' ')
            .trim();
    }

    async loadIndex() {

        // Regenerate the index configuration.
        const language = this.#getLanguage();
        let indexConfig = INDEX_DOCUMENT_STORE_CONFIG;
        indexConfig.language = language in ISO_639_3166_LOOKUP ? 
            ISO_639_3166_LOOKUP[language] : language;
        if ( CJK_ISO_3166.includes(indexConfig.language) ) {
            indexConfig.encode = cjkTokenizer;
        }

        // Create an empty index using the same build-time index configuration.
        this.index = new FlexSearch.Document(indexConfig);
        const indexKeys = LANGUAGE_INDEX_KEYS[language];

        // Define the HTTP headers for the Fetch API.
        let headers = new Headers();
        headers.append('Content-Type','application/json; charset=UTF-8');

        // Iterate over all index keys and import their data into the index.
        for ( const key of indexKeys ) {
            const indexDataUrl = 
                `${ASSETS_BASE_URL}/collection/${language}/${key}.json`;
            const response = await fetch(indexDataUrl, headers);
            const json = await response.json();
            await this.index.import(key, json ?? null);
        }

    }

    async getDocument(id) {
        return await this.index.get(id);
    }

    async getDocuments(offset = 0, limit = 10) {
        let documents = [];
        for (let i = offset; i <= (offset + limit); i++) {
            const document = await this.index.get(i);
            if ( typeof document !== 'undefined' ) {
                documents.push(document);
            }
        }
        return documents;
    }

    async getDocumentsByTags(tags, offset = 0, limit = 10, enrich = true) {
        return await this.index.searchAsync({
            tag: tags, 
            offset: offset, 
            limit: limit, 
            enrich: enrich
        });
    }

    async query(searchQuery, offset = 0, limit = 10, enrich = true) {
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        if ( sanitizedSearchQuery.length >= MIN_SEARCH_QUERY_LENGTH ) {
            return await this.index.searchAsync(sanitizedSearchQuery, {
                offset: offset, 
                limit: limit, 
                enrich: enrich
            });
        }
    }

    async queryAndFilterByTags(searchQuery, tags, 
        offset = 0, limit = 10, enrich = true) {
        const sanitizedSearchQuery = Search.sanitizeQuery(searchQuery);
        if ( sanitizedSearchQuery.length >= MIN_SEARCH_QUERY_LENGTH ) {
            return await this.index.searchAsync(sanitizedSearchQuery, {
                tag: tags, 
                offset: offset, 
                limit: limit, 
                enrich: enrich
            });
        }
    }

}
