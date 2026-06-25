/**
 * Collection class.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

class Collection {

    #languagePages;
    #languageMetadata;

    constructor(languagePages = new Map(), languageMetadata = new Map()) {
        this.#languagePages = languagePages;
        this.#languageMetadata = languageMetadata;
    }

    getLanguagePages() {
        return new Map(this.#languagePages);
    }

    getLanguageMetadata() {
        return new Map(this.#languageMetadata);
    }

    getPages(language) {
        return this.#languagePages.get(language) ?? [];
    }

    getMetadata(language) {
        return this.#languageMetadata.get(language) ?? null;
    }

    hasLanguage(language) {
        return this.#languagePages.has(language);
    }

}

export default Collection;
