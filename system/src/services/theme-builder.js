/**
 * Theme builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';
import tryToCatch from 'try-to-catch';
import { minify } from 'minify';

import BuildDeployer from './build-deployer.js';
import { hasFileExtension, writeStringToFile } from '../utils/io-utils.js';


class ThemeBuilder {

    constructor(config) {
        this.config = config;
    }

    async buildCustomCssAssets() {
        if ( this.config.site.assets.minify.css &&  
                !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreCss ) {
            const miniferOptions = {
                "css": {
                    "type": "clean-css",
                    "clean-css": {
                        "compatibility": "*"
                    }
                }
            };
            await this.#buildCustomAssets('css', miniferOptions);
        }
    }

    async buildCustomJsAssets() {
        if ( this.config.site.assets.minify.js &&  
                !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreJs ) {
            const miniferOptions = {
                "js": {
                    "type": "putout",
                    "putout": {
                        "quote": "'",
                        "mangle": true,
                        "mangleClassNames": true,
                        "removeUnusedVariables": true,
                        "removeConsole": false,
                        "removeUselessSpread": true
                    }
                }
            };
            await this.#buildCustomAssets('js', miniferOptions);
        }
    }

    async #buildCustomAssets(assetType, miniferOptions) {

        // Iterate across and minify all custom assets.
        const assetRelPaths = this.config.site.theme.assets.custom[assetType]
            .filter(assetRelPath => hasFileExtension(assetRelPath, assetType));
        for (const relPath of assetRelPaths) {
            const absPath = this.config.system.build.siteDirs.themes + 
                `/${this.config.site.theme.name}/assets/${assetType}/${relPath}`;
            const [error, minified] = await tryToCatch(minify, 
                absPath, miniferOptions);
            if (error)
                return console.error(error.message);
            const outputRelPath = 
                relPath.replace(`.${assetType}`, `.min.${assetType}`);
            const outputAbsPath = this.config.build.distDirs.assets + 
                `/${assetType}/${outputRelPath}`;
            writeStringToFile(minified, outputAbsPath);
        }

    }

    async deployThemeCssAssets() {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreCss && 
                !this.config.build.flags.customCssOnly ) {
            const assetsDirAbsPath = this.config.system.build.siteDirs.themes + 
                `/${this.config.site.theme.name}/assets/css`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/css`;
            await BuildDeployer.deployAssets(
                assetsDirAbsPath, targetDirAbsPath);
        }
    }

    async deployThemeJsAssets() {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreJs && 
                !this.config.build.flags.customJsOnly ) {
            const assetsDirAbsPath = this.config.system.build.siteDirs.themes + 
                `/${this.config.site.theme.name}/assets/js`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/js`;
            await BuildDeployer.deployAssets(
                assetsDirAbsPath, targetDirAbsPath);
        }
    }

    async deployThemeImageAssets(done) {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreImages ) {
            const assetsDirAbsPath = this.config.system.build.siteDirs.themes + 
                `/${this.config.site.theme.name}/assets/images`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/images`;
            await BuildDeployer.deployAssets(assetsDirAbsPath, 
                targetDirAbsPath, false);
        }
    }

    async deployThemeFontAssets() {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreFonts ) {
            const assetsDirAbsPath = this.config.system.build.siteDirs.themes + 
                `/${this.config.site.theme.name}/assets/fonts`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/fonts`;
            await BuildDeployer.deployAssets(assetsDirAbsPath, 
                targetDirAbsPath, false);
        }
    }

    async deployThemeFavicon() {
        if ( 'favicon' in this.config.site.theme.assets.custom.images && 
                'deployToRoot' in this.config.site.theme.assets.custom.images.favicon && 
                this.config.site.theme.assets.custom.images.favicon.deployToRoot ) {
            const faviconFileAbsPath = 
                this.config.system.build.siteDirs.themes + 
                    `/${this.config.site.theme.name}/assets/images/` + 
                    this.config.site.theme.assets.custom.images.favicon.ico;
            await new Promise((resolve, reject) => {
                gulp.src([faviconFileAbsPath])
                    .pipe(gulp.dest(this.config.build.distDirs.base))
                    .on('end', resolve);
            });
        }
    }

}

export default ThemeBuilder;
