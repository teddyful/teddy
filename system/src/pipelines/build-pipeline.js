/**
 * Build pipeline.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import logger from '../middleware/logger.js';
import packageConfig from '../../../package.json' with { type: 'json' };
import systemConfig from '../../../config/system.json' with { type: 'json' };
import AssetBuilder from '../services/asset-builder.js';
import BuildCleaner from '../services/build-cleaner.js';
import BuildDeployer from '../services/build-deployer.js';
import BuildSetup from '../services/build-setup.js';
import CollectionBuilder from '../services/collection-builder.js';
import ConfigBuilder from '../services/config-builder.js';
import ConfigValidator from '../services/config-validator.js';
import PageBuilder from '../services/page-builder.js';
import PdfBuilder from '../services/pdf-builder.js';
import TemplateBuilder from '../services/template-builder.js';


class BuildPipeline {

    constructor(opts) {
        this.statusCode = 1;
        this.opts = opts;
        this.isValidConfig = false;
        this.configBuilder = null;
        this.config = null;
        this.collectionBuilder = null;
        this.buildCleaner = null;
        this.buildSetup = null;
        this.buildDeployer = null;
        this.assetBuilder = null;
        this.pdfBuilder = null;
    }

    async build() {
        try {

            const numberStages = 13;
            const startTime = performance.now();
            logger.info('Building the static site...');
            logger.info(`Site name: ${this.opts.siteName}`);
            logger.info(`Theme name: ${this.opts.themeName}`);
            logger.info(`Environment name: ${this.opts.env}`);
            logger.info(`Stage 1 of ${numberStages} - Validating configuration...`);
            this.#validateConfig();
            logger.info(`Stage 2 of ${numberStages} - Aggregating configuration...`);
            this.#buildConfig();
            logger.info(`Stage 3 of ${numberStages} - Pre-build cleaning...`);
            this.#cleanPreBuild();
            logger.info(`Stage 4 of ${numberStages} - Setting up the build environment...`);
            this.#setup();
            logger.info(`Stage 5 of ${numberStages} - Deploying static artifacts...`);
            await this.#deployArtifacts();
            logger.info(`Stage 6 of ${numberStages} - Indexing the collection...`);
            await this.#indexCollection();
            logger.info(`Stage 7 of ${numberStages} - Building templates...`);
            await this.#buildTemplates();
            logger.info(`Stage 8 of ${numberStages} - Building pages...`);
            await this.#buildPages();
            logger.info(`Stage 9 of ${numberStages} - Building custom assets...`);
            await this.#buildCustomAssets();
            logger.info(`Stage 10 of ${numberStages} - Building system assets...`);
            this.#buildSystemAssets();
            logger.info(`Stage 11 of ${numberStages} - Deploying assets...`);
            this.#deployAssets();
            logger.info(`Stage 12 of ${numberStages} - Building data sources...`);
            this.#buildDataSources();
            logger.info(`Stage 13 of ${numberStages} - Post-build cleaning...`);
            this.#cleanPostBuild();
            logger.info('Successfully finished building the static site!');
            logger.info(`Build directory: ${systemConfig.system.sites}` + 
                `/${this.opts.siteName}/public/${this.opts.env}`);
            const buildDuration = performance.now() - startTime;
            logger.info(`Build duration: ${buildDuration.toFixed(3)}ms`);
            this.statusCode = 0;

        } catch (err) {
            logger.error('An error was encountered whilst running the build ' + 
                'pipeline. Please consult the log files for further details.');
            logger.error(err.stack);
            logger.info('Processing the build directory post-error...');
            this.#processBuildError();
        }

    }

    #validateConfig() {
        const configValidator = new ConfigValidator(systemConfig, this.opts);
        configValidator.validate();
        this.isValidConfig = true;
    }

    #buildConfig() {

        // Configuration builder.
        this.configBuilder = new ConfigBuilder(packageConfig, systemConfig, this.opts);
        this.config = this.configBuilder.build();

        // Collection builder.
        this.collectionBuilder = new CollectionBuilder(this.config);
        this.config = this.collectionBuilder.build();

    }

    #cleanPreBuild() {
        this.buildCleaner = new BuildCleaner(this.config);
        this.buildCleaner.cleanDistDirectories();
    }

    #setup() {
        this.buildSetup = new BuildSetup(this.config);
        this.buildSetup.createDistDirectoryStructure();
    }

    async #deployArtifacts() {
        this.buildDeployer = new BuildDeployer(this.config);
        this.buildDeployer.deployBuildConfig();
        this.buildDeployer.deployBuildMetadata();
        this.buildDeployer.deployLanguages();
        this.buildDeployer.deployWebConfig();
        this.buildDeployer.deployRobots();
        this.buildDeployer.deploySitemap();
    }

    async #indexCollection() {
        await this.collectionBuilder.index();
    }

    async #buildTemplates() {
        const templateBuilder = new TemplateBuilder(this.config);
        await templateBuilder.translateTemplates();
    }

    async #buildPages() {
        const pageBuilder = new PageBuilder(this.config);
        await pageBuilder.translatePages();
        this.buildDeployer.deployDefaultLanguagePages();
    }

    async #buildCustomAssets() {
        this.assetBuilder = new AssetBuilder(this.config);
        await this.assetBuilder.buildCustomCssAssets('theme');
        await this.assetBuilder.buildCustomCssAssets('site');
        await this.assetBuilder.buildCustomJsAssets('theme');
        await this.assetBuilder.buildCustomJsAssets('site');
    }

    #buildSystemAssets() {
        const languageIndexKeys = this.collectionBuilder.getLanguageIndexKeys();
        this.assetBuilder.generateBuildConfigJs(languageIndexKeys);
        this.assetBuilder.generateContentJs(languageIndexKeys);
    }

    #deployAssets() {
        this.assetBuilder.deployCssAssets('theme');
        this.assetBuilder.deployCssAssets('site');
        this.assetBuilder.deployJsAssets('theme');
        this.assetBuilder.deployJsAssets('site');
        this.assetBuilder.deployImageAssets('theme');
        this.assetBuilder.deployImageAssets('site');
        this.assetBuilder.deployVideoAssets('theme');
        this.assetBuilder.deployVideoAssets('site');
        this.assetBuilder.deployFontAssets('theme');
        this.assetBuilder.deployFontAssets('site');
        this.assetBuilder.deployDataAssets('theme');
        this.assetBuilder.deployDataAssets('site');
        this.assetBuilder.deployFavicon('theme');
        this.assetBuilder.deployFavicon('site');
        this.assetBuilder.deploySystemJsAssets();
    }

    #buildDataSources() {
        this.pdfBuilder = new PdfBuilder(this.config);
        this.pdfBuilder.build();
    }

    #cleanPostBuild() {
        this.buildCleaner.postBuildCleanup();
    }

    #processBuildError() {
        try {
            if ( this.isValidConfig ) {
                this.configBuilder = new ConfigBuilder(systemConfig, this.opts);
                this.config = this.configBuilder.build(true);
                this.buildCleaner = new BuildCleaner(this.config);
                this.buildSetup = new BuildSetup(this.config);
                this.buildDeployer = new BuildDeployer(this.config);
                this.buildCleaner.postErrorBuildCleanup();
                this.buildSetup.createBaseDistDirectory();
                this.buildDeployer.deployBuildErrorPage();
            }
        } catch (err) {
            logger.error('Could not process the build directory post-error.');
            logger.debug(err.stack);
        }
    }

}

export default BuildPipeline;
