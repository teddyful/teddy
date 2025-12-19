/**
 * System assets builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import path from 'path';
import tryToCatch from 'try-to-catch';
import { minify } from 'minify';

import { copyDir, copyFile, createDirectory, hasFileExtension, pathExists, 
    writeStringToFile } from '../utils/io-utils.js';
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
                "type": "terser",
                "terser": {
                    "mangle": false
                }
            }
        };
    }

    async buildCustomCssAssets(sourceType) {
        if ( this.config.build.opts.minifyCss &&  
                !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreCss ) {
            await this.#buildCustomAssets(
                sourceType, 'css', this.cssMinifierOptions);
        }
    }

    async buildCustomJsAssets(sourceType) {
        if ( this.config.build.opts.minifyJs &&  
                !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreJs ) {
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
            const assetRelPaths = assets.custom[assetType].filter(
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
                const outputDirAbsPath = path.dirname(outputAbsPath);
                createDirectory(outputDirAbsPath);
                writeStringToFile(minified, outputAbsPath);
            }
        }

    }

    deployCssAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreCss && 
                !this.config.build.opts.customCssOnly ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'css');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/css`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    deployJsAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreJs && 
                !this.config.build.opts.customJsOnly ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'js');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/js`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    deployImageAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreImages ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'images');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/images`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    deployVideoAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreVideos ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'videos');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/videos`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    deployFontAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreFonts ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'fonts');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/fonts`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
            }
        }
    }

    deployFavicon(sourceType) {
        const assetsDirAbsPath = 
            this.#ascertainPathToAssets(sourceType, 'images');
        if ( assetsDirAbsPath ) {
            if ( sourceType == 'site' ) {
                if ( exists(this.config, 'site', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = assetsDirAbsPath + '/' + 
                        this.config.site.assets.custom.images.favicon.ico;
                    copyFile(faviconFileAbsPath, 
                        this.config.build.distDirs.base, false);
                }
            } else if ( sourceType == 'theme' ) {
                if ( exists(this.config, 'site', 'theme', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.theme.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = assetsDirAbsPath + '/' + 
                        this.config.site.theme.assets.custom.images.favicon.ico;
                    copyFile(faviconFileAbsPath, 
                        this.config.build.distDirs.base, false);
                }
            }
        }
    }

    deployDataAssets(sourceType) {
        if ( !this.config.build.opts.ignoreAssets && 
            !this.config.build.opts.ignoreData ) {
            const assetsDirAbsPath = 
                this.#ascertainPathToAssets(sourceType, 'data');
            if ( assetsDirAbsPath ) {
                const targetDirAbsPath = 
                    `${this.config.build.distDirs.assets}/data`;
                this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
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

    deploySystemJsAssets() {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreJs && 
                !this.config.build.opts.customJsOnly ) {
            
            // Vendor system JavaScript asset subdirectories are already versioned.
            const vendorAssetsDirAbsPath = 
                `${this.config.system.assets.dir}/js/vendors`;
            const vendorTargetDirAbsPath = 
                `${this.config.build.distDirs.assets}/js/vendors`;
            this.#deployAssets(vendorAssetsDirAbsPath, vendorTargetDirAbsPath);

            // Create a versioned subdirectory for Teddy system JavaScript assets.
            const assetsDirAbsPath = 
                `${this.config.system.assets.dir}/js/teddy`;
            const targetDirAbsPath = 
                `${this.config.build.distDirs.assets}/js/vendors/teddy/${this.config.package.version}`;
            this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);

        }
    }

    #deployAssets(assetsDirAbsPath, targetDirAbsPath) {
        if ( pathExists(assetsDirAbsPath) ) {
            createDirectory(targetDirAbsPath);
            copyDir(assetsDirAbsPath, targetDirAbsPath);
        }
    }

    generateBuildConfigJs(languageIndexKeys) {
        const targetDirAbsPath = this.config.build.distDirs.siteConfig;
        createDirectory(targetDirAbsPath);
        const js = `const ASSETS_BASE_URL = '${this.config.site.urls.assets}';
const COLLECTION_INDEX_BASE_URL = '${this.config.site.urls.collectionIndex}';
const COLLECTION_PAGINATION_SIZE = ${this.config.site.collection.pagination.size};
const COLLECTION_SIZES = ${JSON.stringify(this.config.site.collection.sizes)};
const DEFAULT_LANGUAGE = '${this.config.site.languages.enabled[0]}';
const DOMAIN_NAME = '${this.config.site.web[this.config.build.env].domain}';
const INDEX_DOCUMENT_STORE_CONFIG = ${JSON.stringify(
    this.config.site.collection.index.documentStore)};
const LANGUAGE_INDEX_KEYS = ${JSON.stringify(languageIndexKeys)};
const MIN_SEARCH_QUERY_LENGTH = ${this.config.site.collection.search.minQueryLength};
const SITE_VERSION = '${this.config.site.version}';`;
        writeStringToFile(js, `${targetDirAbsPath}/config.js`);
    }

    generateContentJs() {
        let content = {};
        for ( const language of this.config.site.languages.enabled ) {
            content[language] = structuredClone(
                this.config.site.languages.data[language]);
            if ( exists(content[language], 
                    'collection', 'metadata', 'pages') ) {
                delete content[language].collection.metadata.pages;
            }
        }
        const targetDirAbsPath = this.config.build.distDirs.siteConfig;
        createDirectory(targetDirAbsPath);
        const js = `const site = ${JSON.stringify(content)};`;
        writeStringToFile(js, `${targetDirAbsPath}/site.js`);
    }

}

export default AssetBuilder;
