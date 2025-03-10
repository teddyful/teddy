/**
 * Collection builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import FlexSearch from 'flexsearch';
import showdown from 'showdown';
import { stripHtml } from "string-strip-html";

import Collection from '../entities/collection.js';
import Page from '../entities/page.js';
import { createDirectory, getFiles, hasFileExtension } from 
    '../utils/io-utils.js';
import { sort } from '../utils/json-utils.js';
import { ISO_639_3166_LOOKUP, CJK_ISO_3166, cjkTokenizer } from 
    '../utils/lang-utils.js';


class CollectionBuilder {

    constructor(config) {
        this.config = config;
        this.languageIndexKeys = {};
    }

    build() {

        // Instantiate a container for collections for each language.
        let languagePages = new Map();
        let languageMetadata = new Map();

        if ( this.config.site.collection.enabled && 
            !this.config.build.opts.ignoreCollection ) {

            // Get all files in the designated collection directory.
            const collectionDirPath = this.config.system.build.siteDirs.pages + 
                '/' + this.config.site.collection.pagesDirName;
            const collectionPagesFilePaths = getFiles(collectionDirPath);

            // Initialise an object to store language-specific collection sizes.
            this.config.site.collection.sizes = {};

            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Initialise the list of pages for this language.
                let pages = [];

                // Initialise collection category counters.
                let categoryCounts = new Map();
                for (const category of 
                        this.config.site.collection.taxonomy.categories) {
                    categoryCounts.set(category, 0);
                }

                // Filter all collection pages that are markdown files
                // associated with the current language.
                const collectionLanguageMdFilePaths = 
                    collectionPagesFilePaths.filter(
                        filename => hasFileExtension(filename, 'md') &&
                            filename.toLowerCase().endsWith(`.${language}.md`)
                );

                // Iterate across all filtered collection pages.
                for (const pageMdRelFilePath of collectionLanguageMdFilePaths) {

                    // Identify the absolute path to the page MD file.
                    const pageMdAbsFilePath = 
                        `${collectionDirPath}/${pageMdRelFilePath}`;

                    // Read the contents of the page MD file.
                    const pageMd = fs.readFileSync(
                        `${pageMdAbsFilePath}`, 'utf8');

                    // Instantiate the markdown to HTML converter.
                    let converter = new showdown.Converter({
                        metadata: true
                    });

                    // Convert and parse the contents of the page MD file.
                    const pageHtml = converter.makeHtml(pageMd);
                    const pageMetadata = converter.getMetadata();

                    // Check that the page is enabled and contains the required 
                    // metadata. Pages must be explicitly enabled in the 
                    // markdown frontmatter and have the mandatory metadata 
                    // defined in order to be built.
                    if ( 'name' in pageMetadata && pageMetadata.name && 
                        'enabled' in pageMetadata && pageMetadata.enabled == 'true' && 
                        ( !('index' in pageMetadata) || 
                            ( 'index' in pageMetadata && pageMetadata.index == 'true' ) ) 
                    ) {

                        // Create a new page object.
                        let page = new Page(-1, 
                            pageMdAbsFilePath, pageMdRelFilePath, 
                            pageMetadata, language, this.config);

                        // Parse the page content if configured.
                        if ( this.config.site.collection.index.content ) {
                            page.setContent(stripHtml(pageHtml).result
                                .replace(/[\r\n]+/g, ' ')
                                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,' ')
                                .replace(/\s\s+/g, ' ')
                                .trim());
                        }

                        // Add the page to the list of pages.
                        pages.push(page);

                        // Update the category counts map.
                        for ( const category of page.categoryLanguages ) {
                            if ( categoryCounts.has(category.id) ) {
                                categoryCounts.set(category.id, 
                                    categoryCounts.get(category.id) + 1);
                            }
                        }

                    }

                }

                // Sort the pages.
                if ( pages.length > 0 ) {
                    pages = sort(pages, 
                        this.config.site.collection.sort.key, 
                        this.config.site.collection.sort.order);
                }

                // Generate the page ID using the ordered collection.
                pages.forEach(function (page, idx) {
                    page.setId(idx);
                });

                // Only process the first N pages, as determined by the
                // configured pagination size, for the purposes of
                // the metadata and initial load of the collection page.
                const pagesHead = pages.slice(0, 
                    this.config.site.collection.pagination.size);

                // Create language-specific category objects.
                let categories = [];
                for (const category of 
                        this.config.site.collection.taxonomy.categories) {
                    categories.push({
                        id: category, 
                        name: this.config.site.languages.data[language].taxonomy.categories[category], 
                        count: categoryCounts.get(category)
                    });
                }

                // Sort the language-specific categories.
                if ( categories.length > 0 ) {
                    categories = sort(categories, 'name', 'asc');
                }

                // Generate the collection metadata for the current language.
                this.config.site.collection.sizes[language] = pages.length;
                this.config.site.languages.data[language].collection = {
                    metadata: {
                        size: pages.length, 
                        pagination: this.config.site.collection.pagination, 
                        sort: this.config.site.collection.sort, 
                        search: this.config.site.collection.search, 
                        pages: {
                            head: pagesHead
                        }, 
                        categories: categories
                    }
                }

                // Add the pages and metadata for this language to the maps.
                languagePages.set(language, pages);
                languageMetadata.set(language, 
                    this.config.site.languages.data[language].collection.metadata);

            }

        }

        this.collection = new Collection(languagePages, languageMetadata);
        return this.config;

    }

    index() {
        if ( this.config.site.collection.enabled && 
            !this.config.build.opts.ignoreCollection ) {

            // Create a clone of the document store configuration.
            let documentStoreConfig = structuredClone(
                this.config.site.collection.index.documentStore);

            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Lookup the ISO 3166 country code.
                documentStoreConfig.language = language in ISO_639_3166_LOOKUP ? 
                    ISO_639_3166_LOOKUP[language] : language;
                
                // Set a custom encoder for Chinese, Japanese and Korean
                // where there may be no spaces in text.
                if ( CJK_ISO_3166.includes(documentStoreConfig.language) ) {
                    documentStoreConfig.encode = cjkTokenizer;
                }

                // Create a new FlexSearch index for this language.
                const index = new FlexSearch.Document(documentStoreConfig);

                // Get the language pages.
                const pages = this.collection.getLanguagePages().get(language);
                
                // Index each page in the language.
                for (const page of pages) {
                    index.add(page);
                }

                // Export the index.
                let keys = [];
                const indexDirBaseAbsPath = this.config.build.distDirs.assets;
                index.export(function(key, data) { 
                    keys.push(key);
                    const indexDirAbsPath = indexDirBaseAbsPath 
                        + `/collection/${language}`;
                    createDirectory(indexDirAbsPath);
                    fs.writeFileSync(`${indexDirAbsPath}/${key}.json`, 
                        data !== undefined ? data : '');
                });

                // Update the language index keys.
                this.languageIndexKeys[language] = keys;

            }

        }
    }

    getLanguageIndexKeys() {
        return this.languageIndexKeys;
    }

}

export default CollectionBuilder;
