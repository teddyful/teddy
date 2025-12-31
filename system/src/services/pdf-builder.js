/**
 * PDF builder service.
 *
 * @author jillurquddus
 * @since  0.0.12
 */

import fs from 'fs';
import PDFDocument from 'pdfkit';
import showdown from 'showdown';
import { stripHtml } from 'string-strip-html';

import logger from '../middleware/logger.js';
import Page from '../entities/page.js';
import { createDirectory, getFiles, hasFileExtension } from 
    '../utils/io-utils.js';


const SUPPORTED_LANGUAGES = {
    'en': ['Helvetica'], 
    'ja': ['NotoSansJP-Regular', 'NotoSansJP-Regular.ttf'], 
    'jpn': ['NotoSansJP-Regular', 'NotoSansJP-Regular.ttf'], 
    'ko': ['NotoSansKR-Regular', 'NotoSansKR-Regular.ttf'], 
    'kor': ['NotoSansKR-Regular', 'NotoSansKR-Regular.ttf'], 
    'zh': ['NotoSansSC-Regular', 'NotoSansSC-Regular.ttf'], 
    'zh-cn': ['NotoSansSC-Regular', 'NotoSansSC-Regular.ttf'], 
    'zh-hk': ['NotoSansHK-Regular', 'NotoSansHK-Regular.ttf'], 
    'zh-sg': ['NotoSansTC-Regular', 'NotoSansTC-Regular.ttf'], 
    'zh-tw': ['NotoSansTC-Regular', 'NotoSansTC-Regular.ttf']
};
const DEFAULT_FONT_NAME = 'Helvetica';
const DEFAULT_FONT_SIZE = 12;
const HEADING_FONT_SIZE = 18;
const METADATA_FONT_SIZE = 12;
const SMALL_FONT_SIZE = 10;


class PdfBuilder {

    constructor(config) {
        this.config = config;
        this.languageIndexKeys = {};
    }

    build() {
        if ( this.config.build.opts.generateDsPdf ) {

            // Get all files in the specified pages directory.
            const pageFilePaths = getFiles(
                this.config.system.build.siteDirs.pages);

            // Iterate across all languages.
            for ( const language of this.config.site.languages.enabled ) {

                // Check that the language is supported.
                if ( SUPPORTED_LANGUAGES.hasOwnProperty(language) ) {

                    // Initialise the list of pages for this language.
                    let pages = [];

                    // Filter all pages that are markdown files
                    // associated with the current language.
                    const pageLanguageMdFilePaths = 
                        pageFilePaths.filter(
                            filename => hasFileExtension(filename, 'md') &&
                                filename.toLowerCase().endsWith(
                                    `.${language}.md`)
                    );

                    // Iterate across all filtered pages.
                    for (const pageMdRelFilePath of pageLanguageMdFilePaths) {

                        // Identify the absolute path to the page markdown file.
                        const pageMdAbsFilePath = 
                            this.config.system.build.siteDirs.pages + 
                                `/${pageMdRelFilePath}`;

                        // Read the contents of the page markdown file.
                        const pageMd = fs.readFileSync(
                            `${pageMdAbsFilePath}`, 'utf8');

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
                        if ( 'enabled' in pageMetadata && pageMetadata.enabled == 'true' && 
                            ( !('datasource' in pageMetadata) || 
                                ( 'datasource' in pageMetadata && pageMetadata.index == 'true' ) ) 
                        ) {

                            // Create a new page object.
                            let page = new Page(-1, 
                                pageMdAbsFilePath, pageMdRelFilePath, 
                                pageMetadata, language, this.config);

                            // Parse the page content.
                            page.setContent(stripHtml(pageHtml).result.trim());

                            // Add the page to the list of pages.
                            pages.push(page);

                            // Generate the page ID for each page.
                            pages.forEach(function (page, idx) {
                                page.setId(idx);
                            });

                        }

                    }

                    // Generate a single PDF data source file.
                    this.#generatePdf(pages, language);
                    logger.debug('PDF Builder - Found and processed ' + 
                        `${pages.length} enabled markdown page documents ` + 
                        `associated with the language '${language}'.`);

                }

            }

        }
    }

    #generatePdf(pages, language) {
        if ( pages.length > 0 ) {

            // Create a PDF document.
            const pdfDirPath = this.config.build.distDirs.build + 
                `/datasources/pdf/${language}`;
            createDirectory(pdfDirPath);
            const pdfPath = `${pdfDirPath}/site.pdf`;
            const doc = new PDFDocument({
                size: 'A4', 
                autoFirstPage: false, 
                info: {
                    Title: this.config.site.languages.data[language].metadata.title, 
                    Subject: this.config.site.languages.data[language].metadata.description, 
                    Keywords: this.config.site.languages.data[language].metadata.keywords
                }
            });
            doc.pipe(fs.createWriteStream(pdfPath));

            // Register a suitable font if required.
            const fontData = SUPPORTED_LANGUAGES[language];
            if ( fontData.length == 2 ) {
                const fontFilePath = this.config.system.assets.dir + 
                    `/fonts/${fontData[1]}`;
                doc.registerFont(fontData[0], fontFilePath);
            }
            doc.font(fontData[0]);

            // Add each site page as a new PDF page.
            const siteBaseUrl = 
                language == this.config.site.languages.enabled[0] ? 
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
                const pageAbsoluteUrl = page.relUrl != '.' ? 
                    `${siteBaseUrl}/${page.relUrl}/` : `${siteBaseUrl}/`;
                doc.font(DEFAULT_FONT_NAME);
                doc.fontSize(SMALL_FONT_SIZE);
                doc.text(`Source: ${pageAbsoluteUrl}`).moveDown();

                // Page description.
                doc.font(fontData[0]);
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
            
        }
    }

}

export default PdfBuilder;
