/**
 * Page builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import showdown from 'showdown';
import { tryToCatch } from 'try-to-catch';
import UrlBuilder from './url-builder.js';
import { minify } from 'minify';

import logger from '../middleware/logger.js';
import { createDirectory, copyFile, getFiles, hasFileExtension, 
    hasFileExtensions, loadFile, loadJsonFile, pathExists, 
    resolvePathInsideBase, writeStringToFile } from 
        '../utils/io-utils.js';
import { exists } from '../utils/json-utils.js';
import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } from 
    '../utils/regex-utils.js';
import { escapeHtml } from '../utils/string-utils.js';

const FILE_EXT_MARKDOWN = 'md';
const FILE_EXT_HTML = 'html';
const FILE_INDEX_HTML = 'index.html';
const DIR_LANGUAGES = 'languages';
const DIR_TEMPLATES = 'templates';
const DIR_JS = 'js';
const METADATA_ENABLED = 'enabled';
const METADATA_VALUE_TRUE = 'true';
const PAGE_METADATA_NAMESPACE = 'page.metadata';
const PAGE_METADATA_KNOWN_KEYS = [
    'article', 'authorId', 'categories', 'cover', 'datasource', 'date', 
    'description', 'enabled', 'hero', 'image', 'index', 'tags', 'language', 
    'name', 'title', 'type'
];
const BUILD_YEAR = String(new Date().getFullYear());

class PageBuilder {

    constructor(config) {
        this.config = config;
        this.languagePages = {};

        // Get all markdown files in the pages directory for each language.
        resolvePathInsideBase(
            '.',
            this.config.system.build.siteDirs.pages,
            'site pages directory'
        );
        const pageFilePaths = getFiles(
            this.config.system.build.siteDirs.pages);
        for ( const language of this.config.site.languages.enabled ) {
            this.languagePages[language] = pageFilePaths.filter(
                filename => hasFileExtension(filename, FILE_EXT_MARKDOWN) &&
                    filename.toLowerCase().endsWith(
                        `.${language}.${FILE_EXT_MARKDOWN}`)
            );
        }

    }

    #getLanguageDataFilePath(language) {
        resolvePathInsideBase(
            path.join(DIR_LANGUAGES, `${language}.json`),
            this.config.build.distDirs.build,
            `language data file (${language})`
        );
        return path.join(
            this.config.build.distDirs.build,
            DIR_LANGUAGES,
            `${language}.json`
        );
    }

    #getTranslatedTemplateFilePath(language, templateFileName) {
        resolvePathInsideBase(
            path.join(DIR_TEMPLATES, language, templateFileName),
            this.config.build.distDirs.build,
            `translated template file (${language}/${templateFileName})`
        );
        return path.join(
            this.config.build.distDirs.build,
            DIR_TEMPLATES,
            language,
            templateFileName
        );
    }

    #getPageOutputFilePath(pageDestAbsDirPath) {
        resolvePathInsideBase(
            FILE_INDEX_HTML,
            pageDestAbsDirPath,
            'page output file'
        );
        return path.join(
            pageDestAbsDirPath,
            FILE_INDEX_HTML
        );
    }

    #getPageSourceFilePath(pageMdRelFilePath) {
        resolvePathInsideBase(
            pageMdRelFilePath,
            this.config.system.build.siteDirs.pages,
            'page markdown source file'
        );
        return path.join(
            this.config.system.build.siteDirs.pages,
            pageMdRelFilePath
        );
    }

    #getPageDestinationFilePath(language, pageMdRelFilePathClean) {
        resolvePathInsideBase(
            path.join(
                language,
                pageMdRelFilePathClean.replace(
                    `.${language}.${FILE_EXT_MARKDOWN}`,
                    `.${FILE_EXT_HTML}`
                )
            ),
            this.config.build.distDirs.base,
            'page destination file'
        );
        return path.join(
            this.config.build.distDirs.base,
            language,
            pageMdRelFilePathClean.replace(
                `.${language}.${FILE_EXT_MARKDOWN}`,
                `.${FILE_EXT_HTML}`
            )
        );
    }

    #normalizeResourceFilePath(resourceFilePath) {
        return resourceFilePath
            .replace(/\s+/g, '-')
            .replace(/[^A-Za-z0-9\-_.\\\/]/g, '')
            .toLowerCase()
            .trim();
    }

    #shouldBuildPage(pageMetadata) {
        return METADATA_ENABLED in pageMetadata && 
            pageMetadata.enabled === METADATA_VALUE_TRUE;
    }

    #getAllowedPageAssetExtensions() {
        if ( exists(this.config, 'site', 'collection', 
                'assets', 'extensions', 'allowed') ) {
            return this.config.site.collection.assets.extensions.allowed;
        }
        return [];
    }

    #copyPageAssets(pageMdAbsDirPath, pageDestAbsDirPath) {
        const allowedExtensions = this.#getAllowedPageAssetExtensions();
        if ( allowedExtensions.length === 0 ) {
            return;
        }
        const assetFiles = getFiles(pageMdAbsDirPath, true);
        const filteredAssetFiles = assetFiles.filter(filename => 
            hasFileExtensions(filename, allowedExtensions));
        for (const assetFile of filteredAssetFiles) {
            const clnAssetFilePath = this.#normalizeResourceFilePath(assetFile);
            resolvePathInsideBase(
                assetFile,
                pageMdAbsDirPath,
                'page asset source file'
            );
            resolvePathInsideBase(
                clnAssetFilePath,
                pageDestAbsDirPath,
                'page asset target file'
            );
            const assetSourceFilePath = path.join(pageMdAbsDirPath, assetFile);
            const assetTargetFilePath = path.join(
                pageDestAbsDirPath, clnAssetFilePath);
            const assetTargetDirPath = path.dirname(assetTargetFilePath);
            createDirectory(assetTargetDirPath);
            copyFile(assetSourceFilePath, assetTargetFilePath);
        }
    }

    #isCollectionPage(pageResourceUrl) {
        if ( !exists(this.config, 'site', 'collection', 'enabled') ||
                !this.config.site.collection.enabled ||
                !exists(this.config, 'site', 'collection', 'pagesDir') ) {
            return false;
        }
        return pageResourceUrl.startsWith(
            `/${this.config.site.collection.pagesDir}/`
        );
    }

    async translatePages() {
        if ( !this.config.build.opts.ignoreHtml ) {

            // Generate system assets HTML;
            this.systemAssetsHtml = this.#generateSystemAssetsHtml();

            // HTML minifier options.
            const minifierOptions = {
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
                const languageData = loadJsonFile(
                    this.#getLanguageDataFilePath(language));

                // Iterate across all page markdown files for this language.
                let numPagesProcessed = 0;
                for (const pageMdRelFilePath of this.languagePages[language]) {

                    // Identify source, dependency and target paths.
                    const pageMdAbsFilePath = this.#getPageSourceFilePath(
                        pageMdRelFilePath);
                    const pageMdAbsDirPath = path.dirname(pageMdAbsFilePath);
                    const pageMdRelFilePathClean = 
                        this.#normalizeResourceFilePath(pageMdRelFilePath);
                    const pageDestAbsFilePath = 
                        this.#getPageDestinationFilePath(
                            language, pageMdRelFilePathClean);
                    const pageDestAbsDirPath = 
                        path.dirname(pageDestAbsFilePath);
                    const templateFileName = path.basename(pageDestAbsFilePath);
                    const translatedTemplateAbsFilePath = 
                        this.#getTranslatedTemplateFilePath(
                            language, templateFileName);

                    // Check that the translated template exists.
                    if ( pathExists(translatedTemplateAbsFilePath) ) {

                        // Read the contents of the page markdown file.
                        const pageMd = loadFile(pageMdAbsFilePath);

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
                        if ( this.#shouldBuildPage(pageMetadata) ) {

                            // Read contents of the translated template file.
                            const translatedTemplateHtml = loadFile(
                                translatedTemplateAbsFilePath);

                            // Resolve the page HTML.
                            const pageHtml = this.#resolvePageHtml(
                                translatedTemplateHtml, pageMdAbsFilePath, 
                                pageMdRelFilePathClean, pageContentHtml, 
                                pageMetadata, language, languageData);

                            // Create the parent directory for the page.
                            createDirectory(pageDestAbsDirPath);

                            // Write the page HTML to the target page HTML file.
                            const pageHtmlAbsFilePath = 
                                this.#getPageOutputFilePath(pageDestAbsDirPath);
                            writeStringToFile(pageHtml, pageHtmlAbsFilePath);

                            // Minify the HTML if configured.
                            if ( this.config.build.opts.minifyHtml ) {
                                const [error, minifiedHtml] = await tryToCatch(
                                    minify, 
                                    pageHtmlAbsFilePath, 
                                    minifierOptions);
                                if ( error ) {
                                    throw new Error(
                                        `Failed to minify HTML page ` + 
                                            `'${pageHtmlAbsFilePath}'.`,
                                        { cause: error }
                                    );
                                }
                                writeStringToFile(minifiedHtml, 
                                    pageHtmlAbsFilePath);
                            }

                            // Copy all static assets to the target directory.
                            this.#copyPageAssets(
                                pageMdAbsDirPath, pageDestAbsDirPath);
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

    #resolvePageMetadata(pageMdAbsFilePath, pageMdRelFilePathClean, 
        pageMetadata, language, languageData) {

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
        const pageEnabled = METADATA_ENABLED in pageMetadata ? 
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
        const pageAuthorUrl = 'url' in languageData.contributors[pageAuthorId] ? 
            languageData.contributors[pageAuthorId].url : '#';
        const pageAuthorRole = 'role' in languageData.contributors[pageAuthorId] ? 
            languageData.contributors[pageAuthorId].role : '';
        const pageAuthorDescription = 'description' in languageData.contributors[pageAuthorId] ? 
            languageData.contributors[pageAuthorId].description : '';
        const pageAuthorAvatar = 'avatar' in languageData.contributors[pageAuthorId] ? 
            languageData.contributors[pageAuthorId].avatar : '';

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
        const pageIsArticle = this.#isCollectionPage(pageResourceUrl);
        const pageType = pageIsArticle ? 
            'article' : 'website';

        return {
            pageAuthorAvatar,
            pageAuthorDescription,
            pageAuthorName,
            pageAuthorRole,
            pageAuthorUrl,
            pageCategories,
            pageCover,
            pageDate,
            pageDescription,
            pageDisplayDate,
            pageEnabled,
            pageHero,
            pageImage,
            pageIsArticle,
            pageKeywords,
            pageName,
            pageTitle,
            pageType,
            pageUrl
        };

    }

    #resolvePageHtml(templateHtml, pageMdAbsFilePath, pageMdRelFilePathClean, 
        pageContentHtml, pageMetadata, language, languageData) {

        // Resolve page metadata.
        const metadata = this.#resolvePageMetadata(
            pageMdAbsFilePath,
            pageMdRelFilePathClean,
            pageMetadata,
            language,
            languageData
        );

        // Inject the markdown HTML into the template.
        let pageHtml = templateHtml
            .replaceAll('${build.year}', BUILD_YEAR)
            .replaceAll('${page.metadata.author.name}', 
                metadata.pageAuthorName)
            .replaceAll('${page.metadata.author.url}', 
                metadata.pageAuthorUrl)
            .replaceAll('${page.metadata.author.role}', 
                metadata.pageAuthorRole)
            .replaceAll('${page.metadata.author.description}', 
                metadata.pageAuthorDescription)
            .replaceAll('${page.metadata.author.avatar}', 
                metadata.pageAuthorAvatar)
            .replaceAll('${page.metadata.categories}', 
                metadata.pageCategories.join(', '))
            .replaceAll('${page.metadata.cover}', 
                metadata.pageCover)
            .replaceAll('${page.metadata.date}', 
                metadata.pageDisplayDate)
            .replaceAll('${page.metadata.description}', 
                metadata.pageDescription)
            .replaceAll('${page.metadata.enabled}', 
                metadata.pageEnabled)
            .replaceAll('${page.metadata.hero}', 
                metadata.pageHero)
            .replaceAll('${page.metadata.image}', 
                metadata.pageImage)
            .replaceAll('${page.metadata.keywords}', 
                metadata.pageKeywords)
            .replaceAll('${page.metadata.language}', 
                language)
            .replaceAll('${page.metadata.name}', 
                metadata.pageName)
            .replaceAll('${page.metadata.tags}', 
                metadata.pageKeywords)
            .replaceAll('${page.metadata.title}', 
                metadata.pageTitle)
            .replaceAll('${page.metadata.type}', 
                metadata.pageType)
            .replaceAll('${page.metadata.url}', 
                metadata.pageUrl)
            .replaceAll('${page.content}', 
                pageContentHtml);

        // Resolve page URLs.
        pageHtml = UrlBuilder.resolveUrlPlaceholders(language, 
            this.config.site.languages.default, pageHtml);

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
        const siteName = escapeHtml(languageData.metadata.applicationName);
        const pageMetaAuthor = 
            `<meta name="author" content="${escapeHtml(metadata.pageAuthorName)}">`;
        const pageMetaDescription = 
            `<meta name="description" content="${escapeHtml(metadata.pageDescription)}"/>`;
        const pageMetaKeywords = 
            `<meta name="keywords" content="${escapeHtml(metadata.pageKeywords)}"/>`;
        const pageMetaOgSiteName = 
            `<meta property="og:site_name" content="${siteName}"/>`;
        const pageMetaOgTitle = 
            `<meta property="og:title" content="${escapeHtml(metadata.pageName)}"/>`;
        const pageMetaOgDescription = 
            `<meta property="og:description" content="${escapeHtml(metadata.pageDescription)}"/>`;
        const pageMetaOgImage = 
            `<meta property="og:image" content="${escapeHtml(metadata.pageImage)}"/>`;
        const pageMetaOgUrl = 
            `<meta property="og:url" content="${escapeHtml(metadata.pageUrl)}"/>`;
        const pageMetaOgType = 
            `<meta property="og:type" content="${escapeHtml(metadata.pageType)}"/>`;

        // Generate the page OG article metadata if this page is a document
        // in the collection defined in config.js.
        let pageMetaOgArticle = '';
        if ( metadata.pageIsArticle ) {
            pageMetaOgArticle = pageMetaOgArticle + 
                `<meta property="article:modified_time" content="${escapeHtml(metadata.pageDate)}" />` + 
                `<meta property="article:author" content="${escapeHtml(metadata.pageAuthorName)}" />`;
            if ( metadata.pageCategories.length > 0 ) {
                pageMetaOgArticle = pageMetaOgArticle + 
                    `<meta property="article:section" content="${escapeHtml(metadata.pageCategories[0])}" />`;
            }
            if ( 'tags' in pageMetadata ) {
                const keywords = pageMetadata.tags.
                    split(',').map(item => item.trim());
                for ( const keyword of keywords ) {
                    pageMetaOgArticle = pageMetaOgArticle + 
                        `<meta property="article:tag" content="${escapeHtml(keyword)}" />`;
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

        // Site configuration JavaScript assets.
        const siteConfigJsAssets = this.config.system.assets.js.site;
        for ( const siteConfigJsAsset of siteConfigJsAssets ) {
            html = `${html}<script src="${this.config.site.urls.siteConfig}` + 
                `/${siteConfigJsAsset}"></script>\n`;
        }

        // System JavaScript assets.
        const jsAssets = this.config.system.assets.js.vendors
            .concat(this.config.system.assets.js.teddy);
        for ( const jsAsset of jsAssets ) {
            const resolvedJsAsset = jsAsset
                .replace('{package.version}', 
                    this.config.package.version);
            html = `${html}<script src="${this.config.site.urls.assets}` + 
                `/${DIR_JS}/${resolvedJsAsset}"></script>\n`;
        }

        return html;

    }

}

export default PageBuilder;
