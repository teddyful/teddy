/**
 * Collection class.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

class Collection {

    constructor(languagePages, languageMetadata) {
        this.languagePages = languagePages;
        this.languageMetadata = languageMetadata;
    }

    getLanguagePages() {
        return this.languagePages;
    }

    getLanguageMetadata() {
        return this.languageMetadata;
    }

}

export default Collection;
