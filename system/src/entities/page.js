/**
 * Page class.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import path from 'path';

import { formatDisplayDate } from '../utils/date-utils.js';
import { parseCommaSeparatedList } from '../utils/string-utils.js';
import UrlBuilder from '../services/url-builder.js';

const METADATA_KEY_AUTHOR_ID = 'authorId';
const METADATA_KEY_CATEGORIES = 'categories';
const METADATA_KEY_COVER = 'cover';
const METADATA_KEY_DATE = 'date';
const METADATA_KEY_TAGS = 'tags';
const RESERVED_INDEX_KEYS = new Set([
    'author', METADATA_KEY_AUTHOR_ID, 'authorUrl', METADATA_KEY_CATEGORIES, 
    'categoryLanguages', 'content', METADATA_KEY_COVER, 'coverExists', 
    'datasource', METADATA_KEY_DATE, 'description', 'displayDate', 'enabled', 
    'id', 'index', 'name', 'relUrl', METADATA_KEY_TAGS]);

class Page {

    #parseDate(pageMetadata, fallbackDate) {
        if ( !Object.hasOwn(pageMetadata, METADATA_KEY_DATE)
            || !pageMetadata[METADATA_KEY_DATE] ) {
            return fallbackDate;
        }
        const date = new Date(
            `${String(pageMetadata[METADATA_KEY_DATE]).trim()}Z`);
        return Number.isNaN(date.getTime()) ? fallbackDate : date;
    }

    #shouldPropagateCustomIndexFields(config) {
        return config.site.collection.enabled && Array.isArray(
            config.site.collection.index?.documentStore?.document?.index);
    }

    #getRelativeUrl(pageRelPath) {
        return path.dirname(pageRelPath).replace(/\\/g, '/');
    }

    constructor(pageId, pageAbsPath, pageRelPath, pageMetadata, 
        language, config) {
        
        // ID.
        this.id = pageId;

        // Name.
        this.name = pageMetadata.name;

        // Description.
        this.description = pageMetadata.description;

        // Categories.
        const categories = this.#setCategories(pageMetadata, language, config);

        // Tags.
        this.#setTags(pageMetadata, categories);

        // File system stats.
        const stats = fs.statSync(pageAbsPath);
        const mtime = stats.mtime;

        // Date.
        this.date = this.#parseDate(pageMetadata, mtime);
        this.displayDate = formatDisplayDate(this.date);

        // URL relative to ${pages.urls.blog}.
        this.relUrl = this.#getRelativeUrl(pageRelPath);

        // Cover.
        this.coverExists = Object.hasOwn(pageMetadata, METADATA_KEY_COVER);
        this.cover = this.coverExists ? pageMetadata[METADATA_KEY_COVER] : null;

        // Author.
        this.#setAuthor(pageMetadata, language, config);

        // Bespoke index keys to propagate.
        this.#setCustomIndexFields(pageMetadata, config);

    }

    setId(pageId) {
        this.id = pageId;
        return this;
    }

    setContent(content) {
        this.content = content;
        return this;
    }

    #setCategories(pageMetadata, language, config) {
        this.categoryLanguages = [];
        const categories = Object.hasOwn(
            pageMetadata, METADATA_KEY_CATEGORIES) ? 
                parseCommaSeparatedList(
                    pageMetadata[METADATA_KEY_CATEGORIES]) : [];
        const taxonomyCategories = 
            config.site.languages.data[language].taxonomy?.categories ?? {};
        categories.forEach(category => {
            this.categoryLanguages.push({
                id: category, 
                name: taxonomyCategories[category] ?? category
            })
        });
        return categories;
    }

    #setTags(pageMetadata, categories) {
        this.tags = categories;
        if ( Object.hasOwn(pageMetadata, METADATA_KEY_TAGS) ) {
            const tags = parseCommaSeparatedList(
                pageMetadata[METADATA_KEY_TAGS]);
            this.tags = [...new Set(this.tags.concat(tags))];
        }
    }

    #setAuthor(pageMetadata, language, config) {
        const contributors = config.site.languages.data[language].contributors;
        const defaultAuthorId = contributors.default;
        const authorId = Object.hasOwn(pageMetadata, METADATA_KEY_AUTHOR_ID) ?
            pageMetadata[METADATA_KEY_AUTHOR_ID] : defaultAuthorId;
        const author = contributors[authorId] ?? contributors[defaultAuthorId];
        this.author = author.name;
        this.authorUrl = UrlBuilder.resolveUrlPlaceholders(language, 
            config.site.languages.default, author.url);
    }

    #setCustomIndexFields(pageMetadata, config) {
        if ( !this.#shouldPropagateCustomIndexFields(config) ) {
            return;
        }
        const indexKeys = 
            config.site.collection.index.documentStore.document.index;
        for ( const indexKey of indexKeys ) {
            if ( !RESERVED_INDEX_KEYS.has(indexKey) && 
                Object.hasOwn(pageMetadata, indexKey) ) {
                this[indexKey] = pageMetadata[indexKey];
            }
        }
    }

}

export default Page;
