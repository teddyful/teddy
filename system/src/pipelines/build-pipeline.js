/**
 * Build pipeline.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import logger from '../middleware/logger.js';
import systemConfig from '../../../config/system.json' with { type: 'json' };
import AssetBuilder from '../services/asset-builder.js';
import BuildCleaner from '../services/build-cleaner.js';
import BuildDeployer from '../services/build-deployer.js';
import BuildSetup from '../services/build-setup.js';
import CollectionBuilder from '../services/collection-builder.js';
import ConfigBuilder from '../services/config-builder.js';
import ConfigValidator from '../services/config-validator.js';
import PageBuilder from '../services/page-builder.js';
import TemplateBuilder from '../services/template-builder.js';


class BuildPipeline {

    constructor(opts) {
        this.statusCode = 1;
        this.opts = opts;
        this.config = null;
        this.collectionBuilder = null;
        this.buildCleaner = null;
        this.buildDeployer = null;
        this.assetBuilder = null;
    }

    async build() {
        try {

            const startTime = performance.now();
            logger.info('Building the static site...');
            logger.info(`Site name: ${this.opts.siteName}`);
            logger.info(`Theme name: ${this.opts.themeName}`);
            logger.info(`Environment name: ${this.opts.env}`);
            logger.info('Stage 1 - Validating configuration...');
            this.#validateConfig();
            logger.info('Stage 2 - Aggregating configuration...');
            this.#buildConfig();
            logger.info('Stage 3 - Pre-build cleaning...');
            this.#cleanPreBuild();
            logger.info('Stage 4 - Setting up the build environment...');
            this.#setup();
            logger.info('Stage 5 - Deploying static artifacts...');
            await this.#deployArtifacts();
            logger.info('Stage 6 - Indexing the collection...');
            this.#indexCollection();
            logger.info('Stage 7 - Building templates...');
            await this.#buildTemplates();
            logger.info('Stage 8 - Building pages...');
            await this.#buildPages();
            logger.info('Stage 9 - Building custom assets...');
            await this.#buildCustomAssets();
            logger.info('Stage 10 - Building system assets...');
            this.#buildSystemAssets();
            logger.info('Stage 11 - Deploying assets...');
            this.#deployAssets();
            logger.info('Stage 12 - Post-build cleaning...');
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
        }

    }

    #validateConfig() {
        const configValidator = new ConfigValidator(systemConfig, this.opts);
        configValidator.validate();
    }

    #buildConfig() {

        // Configuration builder.
        let configBuilder = new ConfigBuilder(systemConfig, this.opts);
        this.config = configBuilder.build();

        // Collection builder.
        this.collectionBuilder = new CollectionBuilder(this.config);
        this.config = this.collectionBuilder.build();

    }

    #cleanPreBuild() {
        this.buildCleaner = new BuildCleaner(this.config);
        this.buildCleaner.cleanDistDirectories();
    }

    #setup() {
        const buildSetup = new BuildSetup(this.config);
        buildSetup.createDistDirectoryStructure();
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

    #indexCollection() {
        this.collectionBuilder.index();
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
        this.assetBuilder.deployFontAssets('theme');
        this.assetBuilder.deployFontAssets('site');
        this.assetBuilder.deployFavicon('theme');
        this.assetBuilder.deployFavicon('site');
        this.assetBuilder.deploySystemJsAssets();
    }

    #cleanPostBuild() {
        this.buildCleaner.postBuildCleanup();
    }

}

export default BuildPipeline;
