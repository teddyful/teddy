/**
 * Teddy static website builder.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { Command } from 'commander';
import BuildPipeline from './system/src/pipelines/build-pipeline.js';
import logger from './system/src/middleware/logger.js';
import packageConfig from './package.json' with { type: 'json' };


console.log('');
console.log('           _     _');
console.log('          ( \\---/ )');
console.log('           ) . . (');
console.log(' ____,--._(___Y___)_,--.____');
console.log("     `--'           `--'");
console.log("            TEDDY");
console.log("         teddyful.com");
console.log(' ___________________________');
console.log('');
console.log('');

/* -----------------------------------------------------------------------------
 * CLI with variadic options
 * ---------------------------------------------------------------------------*/

const program = new Command();
program.name(packageConfig.name)
    .description(packageConfig.description)
    .version(packageConfig.version)
    .requiredOption('--site-name <siteName>', 'The name of the site to be built e.g. travelbook (required)')
    .requiredOption('--theme-name <themeName>', 'The name of the theme to be used e.g. bear (required)')
    .option('--env <env>', 'The name of the build environment e.g. local', 'local')
    .option('--custom-css-only', 'Build custom CSS assets only and ignore all other CSS assets', false)
    .option('--custom-js-only', 'Build custom JavaScript assets only and ignore all other JavaScript assets', false)
    .option('--generate-ds-pdf', 'Generate a single PDF data source file containing the metadata and text from all site pages', false)
    .option('--ignore-assets', 'Ignore all static assets', false)
    .option('--ignore-collection', 'Skip indexing for all collection pages', false)
    .option('--ignore-css', 'Ignore all CSS assets', false)
    .option('--ignore-data', 'Ignore all data assets', false)
    .option('--ignore-fonts', 'Ignore all font assets', false)
    .option('--ignore-html', 'Skip generating HTML files', false)
    .option('--ignore-images', 'Ignore all image assets', false)
    .option('--ignore-js', 'Ignore all JavaScript assets', false)
    .option('--ignore-robots', 'Ignore the robots.txt file', false)
    .option('--ignore-sitemap', 'Ignore the sitemap.xml file', false)
    .option('--ignore-videos', 'Ignore all video assets', false)
    .option('--ignore-web-config', 'Ignore all web configuration files', false)
    .option('--minify-css', 'Minify custom CSS assets', false)
    .option('--minify-html', 'Minify output HTML', false)
    .option('--minify-js', 'Minify custom JavaScript assets', false)
    .option('--skip-post-build-cleanup', 'Skip the post-build cleanup', false)
    .option('--version-assets-build-id', 'Version the assets directory with the build ID', false)
    .option('--version-assets-site-number', 'Version the assets directory with the site version number', false)
    .option('--version-build-date', 'Version the build directory with the build date in addition to the site version number', false)
    .option('--version-collection-build-id', 'Version the collection directory with the build ID', false)
    .option('--version-collection-site-number', 'Version the collection directory with the site version number', false)
    .option('--version-site-config-build-id', 'Version the site JavaScript assets directory with the build ID', false)
    .option('--version-site-config-site-number', 'Version the site JavaScript assets directory with the site version number', false)
    .action(async function(opts) {
        logger.info('Started the Teddy static website builder ' + 
            `(v${packageConfig.version}).`);
        const buildPipeline = new BuildPipeline(opts);
        await buildPipeline.build();
        logger.info('Exiting the Teddy static website builder (exitCode = ' + 
            `${buildPipeline.statusCode}).`);
        setTimeout(() => {
            process.exit(buildPipeline.statusCode);
        }, 2000);
    })
program.parse();
