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

    static STAGES = [
        {
            label: 'Validating configuration',
            run: async pipeline => pipeline.#validateConfig()
        },
        {
            label: 'Aggregating configuration',
            run: async pipeline => pipeline.#buildConfig()
        },
        {
            label: 'Pre-build cleaning',
            run: async pipeline => pipeline.#cleanPreBuild()
        },
        {
            label: 'Setting up the build environment',
            run: async pipeline => pipeline.#setup()
        },
        {
            label: 'Deploying static artifacts',
            run: async pipeline => pipeline.#deployArtifacts()
        },
        {
            label: 'Indexing the collection',
            run: async pipeline => pipeline.#indexCollection()
        },
        {
            label: 'Building templates',
            run: async pipeline => pipeline.#buildTemplates()
        },
        {
            label: 'Building pages',
            run: async pipeline => pipeline.#buildPages()
        },
        {
            label: 'Building custom assets',
            run: async pipeline => pipeline.#buildCustomAssets()
        },
        {
            label: 'Building system assets',
            run: async pipeline => pipeline.#buildSystemAssets()
        },
        {
            label: 'Deploying assets',
            run: async pipeline => pipeline.#deployAssets()
        },
        {
            label: 'Building data sources',
            run: async pipeline => pipeline.#buildDataSources()
        },
        {
            label: 'Post-build cleaning',
            run: async pipeline => pipeline.#cleanPostBuild()
        }
    ];

    async #runStage(stage, totalStages, stageConfig) {
        logger.info(`Stage ${stage} of ${totalStages} - ` + 
            `${stageConfig.label}...`);
        return await stageConfig.run(this);
    }

    async build() {
        try {

            const startTime = performance.now();
            logger.info('Building the static site...');
            logger.info(`Site name: ${this.opts.siteName}`);
            logger.info(`Theme name: ${this.opts.themeName}`);
            logger.info(`Environment name: ${this.opts.env}`);
            for ( const [idx, stageConfig] of BuildPipeline.STAGES.entries() ) {
                await this.#runStage(
                    idx + 1,
                    BuildPipeline.STAGES.length,
                    stageConfig
                );
            }
            logger.info('Successfully finished building the static site!');
            logger.info(`Build directory: ${this.config.build.distDirs.base}`);
            const buildDuration = performance.now() - startTime;
            logger.info(`Build duration: ${buildDuration.toFixed(3)}ms`);
            this.statusCode = 0;

        } catch (err) {
            this.statusCode = 1;
            logger.error('An error was encountered whilst running the build ' + 
                'pipeline. Please consult the log files for further details.');
            logger.error(err && err.stack ? err.stack : String(err));
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
        this.configBuilder = new ConfigBuilder(packageConfig, 
            systemConfig, this.opts);
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

    #deployArtifacts() {
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
        this.templateBuilder = new TemplateBuilder(this.config);
        await this.templateBuilder.translateTemplates();
    }

    async #buildPages() {
        this.pageBuilder = new PageBuilder(this.config);
        await this.pageBuilder.translatePages();
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
        this.assetBuilder.deployAudioAssets('theme');
        this.assetBuilder.deployAudioAssets('site');
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

    async #buildDataSources() {
        this.pdfBuilder = new PdfBuilder(this.config);
        await this.pdfBuilder.build();
    }

    #cleanPostBuild() {
        this.buildCleaner.postBuildCleanup();
    }

    #processBuildError() {
        try {
            if ( this.isValidConfig ) {
                this.configBuilder = new ConfigBuilder(packageConfig, 
                    systemConfig, this.opts);
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
