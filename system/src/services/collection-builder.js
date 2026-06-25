/**
 * Collection builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';
import FlexSearch from 'flexsearch';
import showdown from 'showdown';
import { stripHtml } from "string-strip-html";

import logger from '../middleware/logger.js';
import Collection from '../entities/collection.js';
import Page from '../entities/page.js';
import { createDirectory, getFiles, hasFileExtension, resolvePathInsideBase,
    writeStringToFile } from '../utils/io-utils.js';
import { sort } from '../utils/json-utils.js';
import { ISO_639_3166_LOOKUP, CJK_ISO_3166, cjkTokenizer } from 
    '../utils/lang-utils.js';

const FILE_EXT_MARKDOWN = 'md';
const INDEX_FIELD_CONTENT = 'content';
const METADATA_ENABLED = 'enabled';
const METADATA_INDEX = 'index';
const METADATA_NAME = 'name';
const METADATA_VALUE_TRUE = 'true';
const SORT_ASC = 'asc';
const INDEX_KEY_REGEX = /^[a-zA-Z0-9_.-]+$/;

class CollectionBuilder {

    constructor(config) {
        this.config = config;
        this.languageIndexKeys = {};
    }

    #shouldBuildCollection() {
        return this.config.site.collection.enabled &&
            !this.config.build.opts.ignoreCollection;
    }

    #shouldIndexPage(pageMetadata) {
        return METADATA_NAME in pageMetadata && 
            pageMetadata.name && 
            METADATA_ENABLED in pageMetadata && 
            pageMetadata.enabled === METADATA_VALUE_TRUE && 
            ( !(METADATA_INDEX in pageMetadata) || 
                ( METADATA_INDEX in pageMetadata && 
                    pageMetadata.index === METADATA_VALUE_TRUE ) ); 
    }

    #normalizePageContent(pageHtml) {
        return stripHtml(pageHtml).result
            .replace(/[\r\n]+/g, ' ')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,' ')
            .replace(/\s\s+/g, ' ')
            .trim();
    }

    #normalizeIndexKey(key) {
        const normalizedKey = String(key ?? '').trim();
        if ( !INDEX_KEY_REGEX.test(normalizedKey) ) {
            throw new Error(`Invalid collection index key '${normalizedKey}'.`);
        }
        return normalizedKey;
    }

    build() {

        // Instantiate a container for collections for each language.
        let languagePages = new Map();
        let languageMetadata = new Map();

        // Initialise an object to store language-specific collection sizes.
        this.config.site.collection.sizes = {};

        if ( this.#shouldBuildCollection() ) {

            // Get all files in the designated collection directory.
            resolvePathInsideBase(
                this.config.site.collection.pagesDir,
                this.config.system.build.siteDirs.pages,
                'collection pages directory'
            );
            const collectionDirPath = path.join(
                this.config.system.build.siteDirs.pages, 
                this.config.site.collection.pagesDir);
            const collectionPagesFilePaths = getFiles(collectionDirPath);

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
                        filename => hasFileExtension(
                            filename, FILE_EXT_MARKDOWN) &&
                            filename.toLowerCase().endsWith(
                                `.${language}.${FILE_EXT_MARKDOWN}`)
                );

                // Iterate across all filtered collection pages.
                for (const pageMdRelFilePath of collectionLanguageMdFilePaths) {

                    // Identify the absolute path to the page MD file.
                    resolvePathInsideBase(
                        pageMdRelFilePath,
                        collectionDirPath,
                        'collection page markdown source file'
                    );
                    const pageMdAbsFilePath = path.join(
                        collectionDirPath, 
                        pageMdRelFilePath);

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
                    if ( this.#shouldIndexPage(pageMetadata)) {

                        // Create a new page object.
                        let page = new Page(-1, 
                            pageMdAbsFilePath, pageMdRelFilePath, 
                            pageMetadata, language, this.config);

                        // Parse the page content if configured.
                        if ( this.config.site.collection.index.content ) {
                            page.setContent(
                                this.#normalizePageContent(pageHtml));
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
                    categories = sort(categories, METADATA_NAME, SORT_ASC);
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
                logger.debug('Collection Builder - Found and processed ' + 
                    `${pages.length} enabled markdown page documents ` + 
                    `associated with the language '${language}'.`
                )

            }

        }

        this.collection = new Collection(languagePages, languageMetadata);
        return this.config;

    }

    async index() {
        if ( this.#shouldBuildCollection() ) {

            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Create a clone of the document store configuration.
                let documentStoreConfig = structuredClone(
                    this.config.site.collection.index.documentStore);

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
                const pages = this.collection.getPages(language) ?? [];
                
                // Index each page in the language.
                for (const page of pages) {
                    index.add(page);
                }

                // Export the index.
                let keys = [];
                const indexDirBaseAbsPath = this.config.build.distDirs.collection;
                await index.export((key, data) => { 
                    const normalizedKey = this.#normalizeIndexKey(key);
                    keys.push(normalizedKey);
                    resolvePathInsideBase(
                        language,
                        indexDirBaseAbsPath,
                        'collection language index directory'
                    );
                    const indexDirAbsPath = path.join(
                        indexDirBaseAbsPath, 
                        language);
                    const indexFilePath = resolvePathInsideBase(
                        `${normalizedKey}.json`,
                        indexDirAbsPath,
                        'collection index export file'
                    );
                    createDirectory(indexDirAbsPath);
                    writeStringToFile(
                        data !== undefined ? data : '', 
                        indexFilePath);
                });

                // Update the language index keys.
                this.languageIndexKeys[language] = keys.sort();

            }

        }
    }

    getLanguageIndexKeys() {
        return this.languageIndexKeys;
    }

}

export default CollectionBuilder;
