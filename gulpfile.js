/**
 * Static website builder.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';
import util from 'util';

import systemConfig from './config/system.json' with { type: 'json' };
import siteConfig from './config/site.json' with { type: 'json' };
import AssetBuilder from './system/src/services/asset-builder.js';
import BuildCleaner from './system/src/services/build-cleaner.js';
import BuildDeployer from './system/src/services/build-deployer.js';
import BuildSetup from './system/src/services/build-setup.js';
import BuildValidator from './system/src/services/build-validator.js';
import CollectionBuilder from './system/src/services/collection-builder.js';
import ConfigBuilder from './system/src/services/config-builder.js';
import OptionsBuilder from './system/src/services/options-builder.js';
import PageBuilder from './system/src/services/page-builder.js';
import TemplateBuilder from './system/src/services/template-builder.js';
import ThemeBuilder from './system/src/services/theme-builder.js';

/* -----------------------------------------------------------------------------
 * 1. CONFIGURATION VALIDATOR
 * ---------------------------------------------------------------------------*/

// Configuration validator.
const buildValidator = new BuildValidator(systemConfig, siteConfig);
buildValidator.validate();

/* -----------------------------------------------------------------------------
 * 2. CONFIGURATION BUILDER
 * ---------------------------------------------------------------------------*/

// Options builder.
const userOptions = process.argv.slice(2);
let optionsBuilder = new OptionsBuilder(userOptions);
const options = optionsBuilder.build();

// Configuration builder.
let configBuilder = new ConfigBuilder(systemConfig, siteConfig, options);
let config = configBuilder.build();

// Collection builder.
let collectionBuilder = new CollectionBuilder(config);
config = collectionBuilder.build();

// Display build configuration.
if ( config.build.flags.verbose )
    console.log('\n----- Build Configuration -----\n\n' + 
        util.inspect(config, {
            showHidden: false, 
            depth: null, 
            colors: true}) + '\n'
    );

/* -----------------------------------------------------------------------------
 * 3. BUILD SERVICES
 * ---------------------------------------------------------------------------*/

// Instantiate build services.
const assetBuilder = new AssetBuilder(config);
const buildCleaner = new BuildCleaner(config);
const buildDeployer = new BuildDeployer(config);
const buildSetup = new BuildSetup(config);
const pageBuilder = new PageBuilder(config);
const templateBuilder = new TemplateBuilder(config);
const themeBuilder = new ThemeBuilder(config);

/* -----------------------------------------------------------------------------
 * 4. TASKS
 * ---------------------------------------------------------------------------*/

/* -----------------------------------------------------------------------------
 * CLEAN
 * ---------------------------------------------------------------------------*/

// Clean the base distribution directory.
gulp.task('build-clean', function(done) {
    buildCleaner.cleanDistDirectories();
    done();
});

/* -----------------------------------------------------------------------------
 * SETUP
 * ---------------------------------------------------------------------------*/

// Create the base distribution directory structure.
gulp.task('build-setup', function(done) {
    buildSetup.createDistDirectoryStructure();
    done();
});

/* -----------------------------------------------------------------------------
 * BUILD CONFIG
 * ---------------------------------------------------------------------------*/

// Deploy the consolidated build config.
gulp.task('deploy-build-config', function(done) {
    buildDeployer.deployBuildConfig();
    done();
});

/* -----------------------------------------------------------------------------
 * BUILD METADATA
 * ---------------------------------------------------------------------------*/

// Deploy build metadata.
gulp.task('deploy-build-metadata', function(done) {
    buildDeployer.deployBuildMetadata();
    done();
});

/* -----------------------------------------------------------------------------
 * LANGUAGES
 * ---------------------------------------------------------------------------*/

// Deploy the consolidated languages.
gulp.task('deploy-languages', function(done) {
    buildDeployer.deployLanguages();
    done();
});

/* -----------------------------------------------------------------------------
 * WEB CONFIGURATION
 * ---------------------------------------------------------------------------*/

// Deploy web configuration.
gulp.task('deploy-web-config', function(done) {
    buildDeployer.deployWebConfig();
    done();
});

/* -----------------------------------------------------------------------------
 * ROBOTS
 * ---------------------------------------------------------------------------*/

// Deploy robots configuration.
gulp.task('deploy-robots', function(done) {
    buildDeployer.deployRobots();
    done();
});

/* -----------------------------------------------------------------------------
 * SITEMAP
 * ---------------------------------------------------------------------------*/

// Deploy sitemap.
gulp.task('deploy-sitemap', function(done) {
    buildDeployer.deploySitemap();
    done();
});

/* -----------------------------------------------------------------------------
 * COLLECTION INDEXER
 * ---------------------------------------------------------------------------*/

// Build the collection index.
gulp.task('build-collection-index', function(done) {
    collectionBuilder.index();
    done();
});

/* -----------------------------------------------------------------------------
 * TEMPLATES
 * ---------------------------------------------------------------------------*/

// Build templates.
gulp.task('build-templates', async function(done) {
    await templateBuilder.translateTemplates();
    done();
});

/* -----------------------------------------------------------------------------
 * PAGES
 * ---------------------------------------------------------------------------*/

// Build pages.
gulp.task('build-pages', async function(done) {
    await pageBuilder.translatePages();
    await buildDeployer.deployDefaultLanguagePages();
    done();
});

/* -----------------------------------------------------------------------------
 * THEME ASSETS
 * ---------------------------------------------------------------------------*/

// Build theme assets.
gulp.task('build-theme-assets', async function(done) {
    await themeBuilder.deployThemeCssAssets();
    await themeBuilder.deployThemeJsAssets();
    await themeBuilder.deployThemeImageAssets();
    await themeBuilder.deployThemeFontAssets();
    await themeBuilder.deployThemeFavicon();
    await themeBuilder.buildCustomCssAssets();
    await themeBuilder.buildCustomJsAssets();
    await buildDeployer.deploySystemJsAssets();
    done();
});

/* -----------------------------------------------------------------------------
 * SYSTEM ASSETS
 * ---------------------------------------------------------------------------*/

// Build system assets.
gulp.task('build-system-assets', async function(done) {
    const languageIndexKeys = collectionBuilder.getLanguageIndexKeys();
    assetBuilder.generateBuildConfigJs(languageIndexKeys);
});

/* -----------------------------------------------------------------------------
 * POST-BUILD CLEANUP
 * ---------------------------------------------------------------------------*/

// Post-build cleanup.
gulp.task('build-clean-post', function(done) {
    buildCleaner.postBuildCleanup();
    done();
});

/* -----------------------------------------------------------------------------
 * 5. PIPELINES
 * ---------------------------------------------------------------------------*/

// Default pipeline.
gulp.task('default', gulp.series(
    'build-clean', 
    'build-setup', 
    'deploy-build-config', 
    'deploy-build-metadata', 
    'deploy-languages', 
    'deploy-web-config', 
    'deploy-robots', 
    'deploy-sitemap', 
    'build-collection-index', 
    'build-templates', 
    'build-pages', 
    'build-theme-assets', 
    'build-system-assets', 
    'build-clean-post'
));
