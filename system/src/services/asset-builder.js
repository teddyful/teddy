/**
 * System assets builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { createDirectory, writeStringToFile } from '../utils/io-utils.js';


class AssetBuilder {

    constructor(config) {
        this.config = config;
    }

    generateBuildConfigJs(languageIndexKeys) {
        const targetDirAbsPath = this.config.build.distDirs.assets + 
            '/js/vendors/teddy';
        createDirectory(targetDirAbsPath);
        const js = `const ASSETS_BASE_URL = '${this.config.site.urls.assets}';
const COLLECTION_PAGINATION_SIZE = ${this.config.site.collection.pagination.size - 1};
const DEFAULT_LANGUAGE = '${this.config.site.languages.enabled[0]}';
const DOMAIN_NAME = '${this.config.site.web.domain}';
const INDEX_DOCUMENT_STORE_CONFIG = ${JSON.stringify(
    this.config.site.collection.index.documentStore)};
const LANGUAGE_INDEX_KEYS = ${JSON.stringify(languageIndexKeys)};
const MIN_SEARCH_QUERY_LENGTH = ${this.config.site.collection.search.minQueryLength};`;
        writeStringToFile(js, `${targetDirAbsPath}/config.js`);
    }

}

export default AssetBuilder;
