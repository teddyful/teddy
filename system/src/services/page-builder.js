/**
 * Page builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import showdown from 'showdown';
import tryToCatch from 'try-to-catch';
import UrlBuilder from './url-builder.js';
import { minify } from 'minify';

import logger from '../middleware/logger.js';
import { createDirectory, copyFile, getFiles, 
    hasFileExtension, hasFileExtensions, writeStringToFile } from 
        '../utils/io-utils.js';
import { exists } from '../utils/json-utils.js';
import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } from 
    '../utils/regex-utils.js';


const PAGE_METADATA_NAMESPACE = 'page.metadata';
const PAGE_METADATA_KNOWN_KEYS = [
    'article', 'authorId', 'categories', 'cover', 'date', 'description', 
    'enabled', 'hero', 'image', 'tags', 'language', 'name', 'title', 'type'
];


class PageBuilder {

    constructor(config) {
        this.config = config;
        this.languagePages = {};

        // Get all markdown files in the pages directory for each language.
        const pageFilePaths = getFiles(
            this.config.system.build.siteDirs.pages);
        for ( const language of this.config.site.languages.enabled ) {
            this.languagePages[language] = pageFilePaths.filter(
                filename => hasFileExtension(filename, 'md') &&
                    filename.toLowerCase().endsWith(`.${language}.md`)
            );
        }

    }

    async translatePages() {
        if ( !this.config.build.opts.ignoreHtml ) {

            // Generate system assets HTML;
            this.systemAssetsHtml = this.#generateSystemAssetsHtml();

            // HTML minifier options.
            const miniferOptions = {
                html: {
                    collapseBooleanAttributes: false, 
                    removeAttributeQuotes: false, 
                    removeRedundantAttributes: false, 
                    removeOptionalTags: false, 
                    removeScriptTypeAttributes: false, 
                    removeStyleLinkTypeAttributes: false, 
                    minifyJS: false,
                    minifyCSS: false
                }
            };
            
            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Read the contents of the language data.
                const languageData = JSON.parse(fs.readFileSync(
                    this.config.build.distDirs.build + 
                        `/languages/${language}.json`, 'utf-8'));

                // Iterate across all page markdown files for this language.
                let numPagesProcessed = 0;
                for (const pageMdRelFilePath of this.languagePages[language]) {

                    // Identify source, dependency and target paths.
                    const pageMdAbsFilePath = 
                        this.config.system.build.siteDirs.pages + 
                            `/${pageMdRelFilePath}`;
                    const pageMdAbsDirPath = path.dirname(pageMdAbsFilePath);
                    const pageMdRelFilePathClean = pageMdRelFilePath
                        .replace(/\s+/g, '-')
                        .replace(/[^A-Za-z0-9\-_.\\\/]/g, '')
                        .toLowerCase().trim();
                    const pageDestAbsFilePath = 
                        this.config.build.distDirs.base + `/${language}/` + 
                            pageMdRelFilePathClean.replace(
                                `.${language}.md`, '.html');
                    const pageDestAbsDirPath = 
                        path.dirname(pageDestAbsFilePath);
                    const templateFileName = path.basename(pageDestAbsFilePath);
                    const translatedTemplateAbsFilePath = 
                        this.config.build.distDirs.build + 
                            `/templates/${language}/${templateFileName}`;

                    // Check that the translated template exists.
                    if ( fs.existsSync(translatedTemplateAbsFilePath) ) {

                        // Read the contents of the page markdown file.
                        const pageMd = fs.readFileSync(
                            pageMdAbsFilePath, 'utf8');

                        // Instantiate the Markdown to HTML converter.
                        let converter = new showdown.Converter({
                            metadata: true, 
                            tables: true
                        });

                        // Parse the contents of the page markdown file.
                        const pageContentHtml = converter.makeHtml(pageMd);
                        const pageMetadata = converter.getMetadata();

                        // Check that the page is enabled. Pages must be 
                        // explicitly enabled in the markdown frontmatter 
                        // in order to be built.
                        if ( 'enabled' in pageMetadata && 
                            pageMetadata.enabled == 'true' ) {

                            // Read the contents of the translated template file.
                            const translatedTemplateHtml = fs.readFileSync(
                                `${translatedTemplateAbsFilePath}`, 'utf8');

                            // Resolve the page HTML.
                            const pageHtml = this.#resolvePageHtml(
                                translatedTemplateHtml, pageMdAbsFilePath, 
                                pageMdRelFilePathClean, pageContentHtml, 
                                pageMetadata, language, languageData);

                            // Create the parent directory for the page.
                            createDirectory(pageDestAbsDirPath);

                            // Write the page HTML to the target page HTML file.
                            const pageHtmlAbsFilePath = 
                                `${pageDestAbsDirPath}/index.html`;
                            writeStringToFile(pageHtml, pageHtmlAbsFilePath);

                            // Minify the HTML if configured.
                            if ( this.config.build.opts.minifyHtml ) {
                                const [error, minifiedHtml] = await tryToCatch(
                                    minify, pageHtmlAbsFilePath, 
                                    miniferOptions);
                                    if (error)
                                        return console.error(error.message);
                                    writeStringToFile(minifiedHtml, 
                                        pageHtmlAbsFilePath);
                            }

                            // Copy all static assets to the target directory.
                            const assetFiles = getFiles(
                                pageMdAbsDirPath, true);
                            const filteredAssetFiles = assetFiles.filter(
                                filename => hasFileExtensions(filename, 
                                    this.config.site.collection.media.extensions.allowed
                                )
                            );
                            for (const assetFile of filteredAssetFiles) {
                                let clnAssetFilePath = assetFile
                                    .replace(/\s+/g, '-')
                                    .replace(/[^A-Za-z0-9\-_.\\\/]/g, '')
                                    .toLowerCase().trim();
                                const assetTargetFilePath = 
                                    `${pageDestAbsDirPath}/${clnAssetFilePath}`;
                                const assetTargetDirPath = path.dirname(
                                    assetTargetFilePath);
                                createDirectory(assetTargetDirPath);
                                copyFile(`${pageMdAbsDirPath}/${assetFile}`, 
                                    assetTargetFilePath
                                );
                            }
                            numPagesProcessed += 1;

                        } else {
                            logger.debug('Page Builder - Skipping ' + 
                                `'${pageMdAbsFilePath}' as it is not ` + 
                                'enabled in its frontmatter.');
                        }

                    } else {
                        logger.debug('Page Builder - Skipping ' + 
                            `'${pageMdAbsFilePath}' as the corresponding ` + 
                            `HTML template '${templateFileName}' does ` + 
                            'not exist.');
                    }

                }

                logger.debug('Page Builder - Found and processed ' + 
                    `${numPagesProcessed} enabled markdown pages associated ` + 
                    `with the language '${language}'.`);

            }

        }
    }

    #resolvePageHtml(templateHtml, pageMdAbsFilePath, pageMdRelFilePathClean, 
        pageContentHtml, pageMetadata, language, languageData) {

        // Parse the page title. The 'name' property is optional in 
        // the page markdown frontmatter, but highly recommended.
        const pageTitle = 'name' in pageMetadata ? 
            pageMetadata.name + 
            ` | ${languageData.metadata.title}` : 
            languageData.metadata.title;

        // Parse the page name. The 'name' property is optional in 
        // the page markdown frontmatter, but highly recommended.
        const pageName = 'name' in pageMetadata ? 
            pageMetadata.name : 
            languageData.metadata.title;

        // Parse the page enabled. The 'enabled' property is optional in
        // the page markdown frontmatter, but highy recommended as it will
        // default to false and hence the page will not be built.
        const pageEnabled = 'enabled' in pageMetadata ? 
            pageMetadata.enabled : false;

        // Parse the page description. The 'description' property is optional
        // in the page markdown frontmatter.
        const pageDescription = 
            'description' in pageMetadata ? 
                pageMetadata.description : 
                languageData.metadata.description;

        // Parse the page tags (optional in the markdown frontmatter).
        const pageKeywords = 
            'tags' in pageMetadata ? 
                pageMetadata.tags + 
                    `,${languageData.metadata.keywords}` : 
                languageData.metadata.keywords;

        // Parse the page hero image, relative to the asset images base URL 
        // (optional in the markdown frontmatter). If the 'hero' property is 
        // not found, then the hero will default to that image which is defined 
        // in the theme.json config file for the active theme.
        let pageHero = '';
        if ( 'hero' in pageMetadata ) {
            pageHero = pageMetadata.hero;
        } else if ( exists(this.config, 'site', 'assets', 'custom', 'images', 
            'hero', 'default') ) {
            pageHero = this.config.site.assets.custom.images.hero.default;
        } else if ( exists(this.config, 'site', 'theme', 'assets', 'custom', 
            'images', 'hero', 'default') ) {
            pageHero = this.config.site.theme.assets.custom.images.hero.default;
        }

        // Parse the page author ID (optional in the markdown frontmatter).
        const pageAuthorId = 'authorId' in pageMetadata ? 
            pageMetadata.authorId : 
            languageData.contributors.default;
        const pageAuthorName = languageData.contributors[pageAuthorId].name;
        const pageAuthorUrl = languageData.contributors[pageAuthorId].url;

        // Parse the page date (optional in the markdown frontmatter). If the
        // 'date' property is not found, then the page date will default
        // to the last modified datetime of the markdown file.
        const stats = fs.statSync(pageMdAbsFilePath);
        const mtime = stats.mtime;
        const pageDate = ( 'date' in pageMetadata && 
                pageMetadata.date ) ? 
            new Date(`${pageMetadata.date.trim()}Z`) : 
                mtime;
        const pageDisplayDate = pageDate.getDate() + ' ' 
            + new Date(pageDate).toLocaleString(
                'en-gb', { month: 'long' }) 
            + ' ' + pageDate.getFullYear();

        // Parse the page cover image, relative to the page URL itself 
        // (optional in the markdown frontmatter).
        const pageCover = 'cover' in pageMetadata ? 
            pageMetadata.cover : '';

        // Parse, remove duplicates and translate the page categories 
        // (optional in the markdown frontmatter).
        let pageCategories = [];
        if ( 'categories' in pageMetadata ) {
            const categories = [... new Set(
                pageMetadata.categories.split(',')
                    .map(item => item.trim()))];
            categories.forEach(category => {
                pageCategories.push(
                    languageData.taxonomy.categories[
                        category]);
            });
        }

        // Generate the absolute URL to the page that will be used, for 
        // example, as the OG URL.
        let pageResourceUrl = 
            path.dirname(pageMdRelFilePathClean)
                .replaceAll('\\', '/');
        if ( pageResourceUrl.endsWith('.') ) {
            pageResourceUrl = pageResourceUrl.substring(
                0, pageResourceUrl.length - 1);
        }
        if ( !pageResourceUrl.endsWith('/') ) {
            pageResourceUrl = pageResourceUrl + '/';
        }
        if ( !pageResourceUrl.startsWith('/') ) {
            pageResourceUrl = '/' + pageResourceUrl;
        }
        const pageUrl = this.config.site.web.baseUrl + pageResourceUrl;

        // Generate the absolute URL to the page image that will be used, 
        // for example, as the OG image. If the 'og' property is not found, 
        // then the 'cover' property value will be used if configured to do so.
        let siteImagesBaseUrl = this.config.site.web.baseUrl + 
            this.config.site.urls.assets + '/images/';
        let pageImageRelPath = '';
        if ( exists(this.config, 'site', 'assets', 'custom', 'images', 'og') ) {
            if ( 'default' in this.config.site.assets.custom.images.og ) {
                pageImageRelPath = 
                    this.config.site.assets.custom.images.og.default;
            }
            if ( 'cover' in pageMetadata && 
                'useCover' in this.config.site.assets.custom.images.og && 
                this.config.site.assets.custom.images.og.useCover ) {
                siteImagesBaseUrl = pageUrl;
                pageImageRelPath = pageMetadata.cover;
            }
        }
        else if ( exists(this.config, 'site', 'theme', 'assets', 
            'custom', 'images', 'og') ) {
            if ('default' in this.config.site.theme.assets.custom.images.og ) {
                pageImageRelPath = 
                    this.config.site.theme.assets.custom.images.og.default;
            }
            if ( 'cover' in pageMetadata && 
                'useCover' in this.config.site.theme.assets.custom.images.og && 
                this.config.site.theme.assets.custom.images.og.useCover ) {
                siteImagesBaseUrl = pageUrl;
                pageImageRelPath = pageMetadata.cover;
            }
        }
        if ( 'og' in pageMetadata ) {
            siteImagesBaseUrl = pageUrl;
            pageImageRelPath = pageMetadata.og;
        }
        const pageImage = siteImagesBaseUrl + pageImageRelPath;

        // Generate the page type to use that will be used, for example, 
        // as the OG type.
        const pageIsArticle = pageResourceUrl.startsWith(
            '/' + this.config.site.collection.pagesDir + '/');
        const pageType = pageIsArticle ? 
            'article' : 'website';

        // Inject the markdown HTML into the template.
        let pageHtml = templateHtml
            .replaceAll('${page.metadata.author.name}', 
                pageAuthorName)
            .replaceAll('${page.metadata.author.url}', 
                pageAuthorUrl)
            .replaceAll('${page.metadata.categories}', 
                pageCategories.join(', '))
            .replaceAll('${page.metadata.cover}', 
                pageCover)
            .replaceAll('${page.metadata.date}', 
                pageDisplayDate)
            .replaceAll('${page.metadata.description}', 
                pageDescription)
            .replaceAll('${page.metadata.enabled}', 
                pageEnabled)
            .replaceAll('${page.metadata.hero}', 
                pageHero)
            .replaceAll('${page.metadata.image}', 
                pageImage)
            .replaceAll('${page.metadata.keywords}', 
                pageKeywords)
            .replaceAll('${page.metadata.language}', 
                language)
            .replaceAll('${page.metadata.name}', 
                pageName)
            .replaceAll('${page.metadata.tags}', 
                pageKeywords)
            .replaceAll('${page.metadata.title}', 
                pageTitle)
            .replaceAll('${page.metadata.type}', 
                pageType)
            .replaceAll('${page.metadata.url}', 
                pageUrl)
            .replaceAll('${page.content}', 
                pageContentHtml);

        // Resolve page URLs.
        pageHtml = UrlBuilder.resolveUrlPlaceholders(language, 
            this.config.site.languages.enabled[0], pageHtml);

        // Inject any custom metadata from the markdown
        // frontmatter e.g. page.metadata.flags etc.
        const varPlaceholders = getVarPlaceholders(
            pageHtml, PAGE_METADATA_NAMESPACE);
        for ( const varPlaceholder of varPlaceholders ) {
            const key = getNestedKeysFromVarPlaceholder(
                varPlaceholder, PAGE_METADATA_NAMESPACE);
            let resolvedPlaceholderValue = ( 
                !PAGE_METADATA_KNOWN_KEYS.includes(key) && 
                    key in pageMetadata ) ? 
                    pageMetadata[key] : '';
            pageHtml = pageHtml.replaceAll(
                varPlaceholder, resolvedPlaceholderValue);
        }

        // Generate the page metadata.
        const siteName = languageData.metadata.applicationName;
        const pageMetaAuthor = 
            `<meta name="author" content="${pageAuthorName}">`;
        const pageMetaDescription = 
            `<meta name="description" content="${pageDescription}"/>`;
        const pageMetaKeywords = 
            `<meta name="keywords" content="${pageKeywords}"/>`;
        const pageMetaOgSiteName = 
            `<meta property="og:site_name" content="${siteName}"/>`;
        const pageMetaOgTitle = 
            `<meta property="og:title" content="${pageName}"/>`;
        const pageMetaOgDescription = 
            `<meta property="og:description" content="${pageDescription}"/>`;
        const pageMetaOgImage = 
            `<meta property="og:image" content="${pageImage}"/>`;
        const pageMetaOgUrl = 
            `<meta property="og:url" content="${pageUrl}"/>`;
        const pageMetaOgType = 
            `<meta property="og:type" content="${pageType}"/>`;

        // Generate the page OG article metadata if this page is a document
        // in the collection defined in config.js.
        let pageMetaOgArticle = '';
        if ( pageIsArticle ) {
            pageMetaOgArticle = pageMetaOgArticle + 
                `<meta property="article:modified_time" content="${pageDate}" />` + 
                `<meta property="article:author" content="${pageAuthorName}" />`;
            if ( pageCategories.length > 0 ) {
                pageMetaOgArticle = pageMetaOgArticle + 
                    `<meta property="article:section" content="${pageCategories[0]}" />`;
            }
            if ( 'tags' in pageMetadata ) {
                const keywords = pageMetadata.tags.
                    split(',').map(item => item.trim());
                for ( const keyword of keywords ) {
                    pageMetaOgArticle = pageMetaOgArticle + 
                        `<meta property="article:tag" content="${keyword}" />`;
                }
            }
        }

        // Inject the page OG metadata.
        if ( this.config.site.html.inject.metadata ) {
            const pageMeta = pageMetaAuthor + pageMetaDescription + 
                pageMetaKeywords + pageMetaOgSiteName + pageMetaOgTitle + 
                pageMetaOgDescription + pageMetaOgImage + pageMetaOgUrl + 
                pageMetaOgType + pageMetaOgArticle;
            pageHtml = pageHtml.replace('</head>', 
                `${pageMeta}</head>`);
        }

        // Inject the page language.
        const pageLangHtml = 
            `<script>const PAGE_LANGUAGE = '${language}';</script>`;
        pageHtml = pageHtml.replace('</head>', `${pageLangHtml}</head>`);

        // Inject system assets if enabled.
        if ( this.config.site.html.inject.systemAssets ) {
            pageHtml = pageHtml.replace('</head>', 
                `${this.systemAssetsHtml}</head>`);
        }

        // Resolve any mustache templates.
        pageHtml = mustache.render(pageHtml, languageData);

        // Return the fully resolved page HTML.
        return pageHtml;

    }

    #generateSystemAssetsHtml() {
        
        let html = '';

        // System JavaScript assets.
        const jsAssets = this.config.system.assets.js.vendors.concat(
            this.config.system.assets.js.teddy
        );
        for ( const jsAsset of jsAssets ) {
            html = `${html}<script src="${this.config.site.urls.assets}` + 
                `/js/${jsAsset}"></script>\n`;
        }

        return html;

    }

}

export default PageBuilder;
