/**
 * PDF builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.12
 */

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import showdown from 'showdown';
import { once } from 'events';
import { stripHtml } from 'string-strip-html';

import logger from '../middleware/logger.js';
import Page from '../entities/page.js';
import { createDirectory, getFiles, hasFileExtension, 
    loadFile, pathExists } from '../utils/io-utils.js';

const FILE_EXT_MARKDOWN = 'md';
const FILE_SITE_PDF = 'site.pdf';
const DIR_DATASOURCES = 'datasources';
const DIR_FONTS = 'fonts';
const DIR_PDF = 'pdf';
const FONT_ALIAS_DEFAULT = 'DefaultLanguageFont';
const FONT_ALIAS_CUSTOM = 'CustomLanguageFont';
const METADATA_ENABLED = 'enabled';
const METADATA_DATASOURCE = 'datasource';
const METADATA_VALUE_TRUE = 'true';
const PDF_SIZE_A4 = 'A4';

const DEFAULT_SYSTEM_FONT_FILE = 'Noto/NotoSans/NotoSans-Regular.ttf';
const DEFAULT_FONT_SIZE = 12;
const HEADING_FONT_SIZE = 18;
const METADATA_FONT_SIZE = 12;
const SMALL_FONT_SIZE = 10;

class PdfBuilder {

    constructor(config) {
        this.config = config;
    }

    #shouldBuildPdf() {
        return this.config.build.opts.generateDsPdf;
    }

    #shouldIncludePage(pageMetadata) {
        return METADATA_ENABLED in pageMetadata && 
            pageMetadata.enabled === METADATA_VALUE_TRUE && 
            ( !(METADATA_DATASOURCE in pageMetadata) || 
                ( METADATA_DATASOURCE in pageMetadata && 
                    pageMetadata.datasource === METADATA_VALUE_TRUE ) );
    }

    #normalizePageContent(pageHtml) {
        return stripHtml(pageHtml).result.trim();
    }

    async build() {
        if ( this.#shouldBuildPdf() ) {

            // Get all files in the specified pages directory.
            const pageFilePaths = getFiles(
                this.config.system.build.siteDirs.pages);

            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Initialise the list of pages for this language.
                let pages = [];

                // Filter all pages that are markdown files
                // associated with the current language.
                const pageLanguageMdFilePaths = 
                    pageFilePaths.filter(
                        filename => hasFileExtension(
                            filename, FILE_EXT_MARKDOWN) &&
                            filename.toLowerCase().endsWith(
                                `.${language}.${FILE_EXT_MARKDOWN}`)
                );

                // Iterate across all filtered pages.
                for (const pageMdRelFilePath of pageLanguageMdFilePaths) {

                    // Identify the absolute path to the page markdown file.
                    const pageMdAbsFilePath = path.join(
                        this.config.system.build.siteDirs.pages, 
                        pageMdRelFilePath);

                    // Read the contents of the page markdown file.
                    const pageMd = loadFile(pageMdAbsFilePath);

                    // Instantiate the markdown to HTML converter.
                    let converter = new showdown.Converter({
                        metadata: true
                    });

                    // Convert and parse the contents of the page markdown file.
                    const pageHtml = converter.makeHtml(pageMd);
                    const pageMetadata = converter.getMetadata();

                    // Check that the page is enabled and contains the required 
                    // metadata. Pages must be explicitly enabled in the 
                    // markdown frontmatter and have the mandatory metadata 
                    // defined in order to be built.
                    if ( this.#shouldIncludePage(pageMetadata) ) {

                        // Create a new page object.
                        let page = new Page(-1, 
                            pageMdAbsFilePath, pageMdRelFilePath, 
                            pageMetadata, language, this.config);

                        // Parse the page content.
                        page.setContent(this.#normalizePageContent(pageHtml));

                        // Add the page to the list of pages.
                        pages.push(page);

                    }

                }

                // Generate the page ID for each page.
                pages.forEach(function (page, idx) {
                    page.setId(idx);
                });

                // Generate a single PDF data source file.
                await this.#generatePdf(pages, language);
                logger.debug('PDF Builder - Found and processed ' + 
                    `${pages.length} enabled markdown page documents ` + 
                    `associated with the language '${language}'.`);

            }

        }
    }

    #assertFontExists(font) {
        if ( !pathExists(font.path) ) {
            throw new Error(
                `PDF font file for alias '${font.alias}' does not exist: ` +
                `'${font.path}'.`
            );
        }
    }

    #resolveFont(language) {
        if ( Object.hasOwn(this.config.site.datasources.fonts, language) ) {
            return {
                alias: FONT_ALIAS_CUSTOM,
                path: this.config.site.datasources.fonts[language]
            };
        }
        if ( Object.hasOwn(this.config.system.assets.fonts, language) ) {
            return {
                alias: FONT_ALIAS_CUSTOM,
                path: path.join(
                    this.config.system.assets.dir,
                    DIR_FONTS,
                    this.config.system.assets.fonts[language]
                )
            };
        }
        return {
            alias: FONT_ALIAS_DEFAULT,
            path: path.join(
                this.config.system.assets.dir,
                DIR_FONTS,
                DEFAULT_SYSTEM_FONT_FILE
            )
        };
    }

    async #generatePdf(pages, language) {
        if ( pages.length === 0 ) {
            logger.debug('PDF Builder - Skipping PDF data source generation ' +
                `for language '${language}' because no pages qualified.`);
            return;
        }

        // Create a PDF document.
        const pdfDirPath = path.join(
            this.config.build.distDirs.build, 
            DIR_DATASOURCES, 
            DIR_PDF, 
            language);
        createDirectory(pdfDirPath);
        const pdfPath = path.join(pdfDirPath, FILE_SITE_PDF);
        const doc = new PDFDocument({
            size: PDF_SIZE_A4, 
            autoFirstPage: false, 
            info: {
                Title: this.config.site.languages.data[language].metadata.title, 
                Subject: this.config.site.languages.data[language].metadata.description, 
                Keywords: this.config.site.languages.data[language].metadata.keywords
            }
        });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Register the default font that supports Latin, Greek
        // and Cyrillic characters, found in: 
        // system/assets/fonts/NotoSans/NotoSans-Regular.ttf.
        const defaultFont = {
            alias: FONT_ALIAS_DEFAULT,
            path: path.join(
                this.config.system.assets.dir,
                DIR_FONTS,
                DEFAULT_SYSTEM_FONT_FILE
            )
        };
        this.#assertFontExists(defaultFont);
        doc.registerFont(defaultFont.alias, defaultFont.path);

        // Register the language-specific font if specified.
        const resolvedFont = this.#resolveFont(language);
        this.#assertFontExists(resolvedFont);
        if ( resolvedFont.alias !== defaultFont.alias ) {
            doc.registerFont(resolvedFont.alias, resolvedFont.path);
        }
        doc.font(resolvedFont.alias);

        // Add each site page as a new PDF page.
        const siteBaseUrl = 
            language === this.config.site.languages.default ? 
                this.config.site.web.baseUrl : 
                `${this.config.site.web.baseUrl}/${language}`;
        pages.forEach(function (page, idx) {
            doc.addPage();

            // Page name.
            if ( page.name ) {
                doc.fontSize(HEADING_FONT_SIZE);
                doc.text(page.name).moveDown(0.5);
                doc.outline.addItem(page.name);
            }

            // Page absolute URL.
            const pageAbsoluteUrl = page.relUrl !== '.' ? 
                `${siteBaseUrl}/${page.relUrl}/` : `${siteBaseUrl}/`;
            doc.font(FONT_ALIAS_DEFAULT);
            doc.fontSize(SMALL_FONT_SIZE);
            doc.text(`Source: ${pageAbsoluteUrl}`).moveDown();

            // Page description.
            doc.font(resolvedFont.alias);
            doc.fontSize(METADATA_FONT_SIZE);
            if ( page.description ) {
                doc.text(page.description).moveDown();
            }

            // Page content.
            doc.fontSize(DEFAULT_FONT_SIZE);
            doc.text(page.content);

        });

        // Finalise the PDF and end the stream.
        doc.end();
        await Promise.race([
            once(stream, 'finish'),
            once(stream, 'error').then(([error]) => {
                throw error;
            })
        ]);

    }

}

export default PdfBuilder;
