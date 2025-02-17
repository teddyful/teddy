/**
 * Page class.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import path from 'path';
import UrlBuilder from '../services/url-builder.js';


class Page {

    constructor(pageId, pageAbsPath, pageRelPath, pageMetadata, 
        language, config) {
        
        // ID.
        this.id = pageId;

        // Name.
        this.name = pageMetadata.name;

        // Description.
        this.description = pageMetadata.description;

        // Categories.
        this.categoryLanguages = [];
        const categories = [... new Set(
            pageMetadata.categories.split(',').map(item => item.trim()))];
        categories.forEach(category => {
            this.categoryLanguages.push({
                id: category, 
                name: config.site.languages.data[language].taxonomy.categories[category]
            })
        });

        // Tags.
        this.tags = categories;

        // File system stats.
        const stats = fs.statSync(pageAbsPath);
        const mtime = stats.mtime;

        // Date.
        this.date = ( 'date' in pageMetadata && pageMetadata.date ) ? 
            new Date(`${pageMetadata.date.trim()}Z`) : mtime;
        this.displayDate = this.date.getDate() + ' ' 
            + new Date(this.date).toLocaleString('en-gb', { month: 'long' }) 
            + ' ' + this.date.getFullYear();

        // URL relative to ${pages.urls.blog}.
        this.relUrl = path.dirname(pageRelPath).replace(/\\/g, "/");

        // Cover.
        this.coverExists = 'cover' in pageMetadata;
        this.cover  = this.coverExists ? pageMetadata.cover : null;

        // Author.
        const defaultAuthorId = 
            config.site.languages.data[language].contributors.default;
        this.author = 
            config.site.languages.data[language].contributors[defaultAuthorId].name;
        this.authorUrl = 
            config.site.languages.data[language].contributors[defaultAuthorId].url;
        if ( 'authorId' in pageMetadata ) {
            const authorId = pageMetadata.authorId;
            this.author = 
                config.site.languages.data[language].contributors[authorId].name;
            this.authorUrl = 
                config.site.languages.data[language].contributors[authorId].url;
        }

        // Resolve author URL if required.
        this.authorUrl = UrlBuilder.resolveUrlPlaceholders(language, 
            config.site.languages.enabled[0], this.authorUrl);

    }

    setId(pageId) {
        this.id = pageId;
    }

}

export default Page;
