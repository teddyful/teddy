/**
 * System assets builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';
import tryToCatch from 'try-to-catch';
import { minify } from 'minify';

import { createDirectory, hasFileExtension, pathExists, writeStringToFile } from 
    '../utils/io-utils.js';
import { exists } from '../utils/json-utils.js';


class AssetBuilder {

    constructor(config) {
        this.config = config;
        this.cssMinifierOptions = {
            "css": {
                "type": "clean-css",
                "clean-css": {
                    "compatibility": "*"
                }
            }
        };
        this.jsMinifierOptions = {
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
    }

    async buildCustomCssAssets(sourceType) {
        if ( this.config.site.assets.minify.css &&  
                !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreCss ) {
            await this.#buildCustomAssets(
                sourceType, 'css', this.cssMinifierOptions);
        }
    }

    async buildCustomJsAssets(sourceType) {
        if ( this.config.site.assets.minify.js &&  
                !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreJs ) {
            await this.#buildCustomAssets(
                sourceType, 'js', this.jsMinifierOptions);
        }
    }

    async #buildCustomAssets(sourceType, assetType, miniferOptions) {

        // Iterate across and minify all custom assets.
        let assets = null;
        let assetBasePath = null;
        if ( sourceType == 'site' && 'assets' in this.config.site ) {
            assets = this.config.site.assets;
            assetBasePath = this.config.system.build.siteDirs.assets;
        } else if ( sourceType == 'theme' && 
            'assets' in this.config.site.theme ) {
            assets = this.config.site.theme.assets;
            assetBasePath = this.config.system.themes + 
                `/${this.config.site.theme.name}/assets`;
        }
        if ( assets && 'custom' in assets && assetType in assets.custom ) {
            const assetRelPaths = assets[assetType].filter(
                assetRelPath => hasFileExtension(assetRelPath, assetType));
            for (const relPath of assetRelPaths) {
                const absPath = `${assetBasePath}/${assetType}/${relPath}`;
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

    }

    async deployCssAssets(sourceType) {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreCss && 
                !this.config.build.flags.customCssOnly ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'css');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/css`;
                await this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    async deployJsAssets(sourceType) {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreJs && 
                !this.config.build.flags.customJsOnly ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'js');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/js`;
                await this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    async deployImageAssets(sourceType) {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreImages ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'images');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/images`;
                await this.#deployAssets(assetsDirAbsPath, 
                    targetDirAbsPath, false);
            }
        }
    }

    async deployFontAssets(sourceType) {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreFonts ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'fonts');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/fonts`;
                await this.#deployAssets(assetsDirAbsPath, 
                    targetDirAbsPath, false);
            }
        }
    }

    async deployFavicon(sourceType) {
        const assetsDirAbsPath = 
            this.#ascertainPathToAssets(sourceType, 'images');
        if ( assetsDirAbsPath ) {
            if ( sourceType == 'site' ) {
                if ( exists(this.config, 'site', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = assetsDirAbsPath + '/' + 
                        this.config.site.assets.custom.images.favicon.ico;
                    await new Promise((resolve, reject) => {
                        gulp.src([faviconFileAbsPath])
                            .pipe(gulp.dest(this.config.build.distDirs.base))
                            .on('end', resolve);
                    });
                }
            } else if ( sourceType == 'theme' ) {
                if ( exists(this.config, 'site', 'theme', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.theme.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = assetsDirAbsPath + '/' + 
                        this.config.site.theme.assets.custom.images.favicon.ico;
                    await new Promise((resolve, reject) => {
                        gulp.src([faviconFileAbsPath])
                            .pipe(gulp.dest(this.config.build.distDirs.base))
                            .on('end', resolve);
                    });
                }
            }
        }
    }

    #ascertainPathToAssets(sourceType, assetType) {
        if ( sourceType == 'site' ) {
            return this.config.system.build.siteDirs.assets + '/' + assetType;
        } else if ( sourceType == 'theme' ) {
            return this.config.system.themes + 
                `/${this.config.site.theme.name}/assets/${assetType}`;
        } else return null;
    }

    async deploySystemJsAssets() {
        if ( !this.config.build.flags.ignoreAssets && 
                !this.config.build.flags.ignoreJs && 
                !this.config.build.flags.customJsOnly ) {
            const assetsDirAbsPath = 
                `${this.config.system.assets.dir}/js`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/js`;
            await this.#deployAssets(
                assetsDirAbsPath, targetDirAbsPath);
        }
    }

    async #deployAssets(assetsDirAbsPath, targetDirAbsPath) {
        if ( pathExists(assetsDirAbsPath) ) {
            createDirectory(targetDirAbsPath);
            await new Promise((resolve, reject) => {
                gulp.src([`${assetsDirAbsPath}/**`])
                    .pipe(gulp.dest(targetDirAbsPath))
                    .on('end', resolve);
            });
        }
    }

    generateBuildConfigJs(languageIndexKeys) {
        const targetDirAbsPath = this.config.build.distDirs.assets + 
            '/js/vendors/teddy';
        createDirectory(targetDirAbsPath);
        const js = `const ASSETS_BASE_URL = '${this.config.site.urls.assets}';
const COLLECTION_PAGINATION_SIZE = ${this.config.site.collection.pagination.size - 1};
const DEFAULT_LANGUAGE = '${this.config.site.languages.enabled[0]}';
const DOMAIN_NAME = '${this.config.site.web.domain}';
const INDEX_DOCUMENT_STORE_CONFIG = ${JSON.stringify(
    this.config.site.collection.index.documentStore)};
const LANGUAGE_INDEX_KEYS = ${JSON.stringify(languageIndexKeys)};
const MIN_SEARCH_QUERY_LENGTH = ${this.config.site.collection.search.minQueryLength};`;
        writeStringToFile(js, `${targetDirAbsPath}/config.js`);
    }

}

export default AssetBuilder;
