/**
 * Assets builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import { tryToCatch } from 'try-to-catch';
import { minify } from 'minify';

import logger from '../middleware/logger.js';
import { copyDir, copyFile, createDirectory, hasFileExtension, pathExists, 
    writeStringToFile } from '../utils/io-utils.js';
import { exists } from '../utils/json-utils.js';

const SOURCE_SITE = 'site';
const SOURCE_THEME = 'theme';
const ASSET_CSS = 'css';
const ASSET_JS = 'js';
const ASSET_IMAGES = 'images';
const ASSET_AUDIO = 'audio';
const ASSET_VIDEOS = 'videos';
const ASSET_FONTS = 'fonts';
const ASSET_DATA = 'data';
const DIR_JS = 'js';
const DIR_VENDORS = 'vendors';
const DIR_TEDDY = 'teddy';
const CONFIG_JS_FILE = 'config.js';
const SITE_JS_FILE = 'site.js';

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

    #shouldDeployAssetType(assetType) {
        if ( this.config.build.opts.ignoreAssets ) {
            return false;
        }
        if ( assetType === ASSET_CSS ) {
            return !this.config.build.opts.ignoreCss &&
                !this.config.build.opts.customCssOnly;
        }
        if ( assetType === ASSET_JS ) {
            return !this.config.build.opts.ignoreJs &&
                !this.config.build.opts.customJsOnly;
        }
        if ( assetType === ASSET_IMAGES ) {
            return !this.config.build.opts.ignoreImages;
        }
        if ( assetType === ASSET_AUDIO ) {
            return !this.config.build.opts.ignoreAudio;
        }
        if ( assetType === ASSET_VIDEOS ) {
            return !this.config.build.opts.ignoreVideos;
        }
        if ( assetType === ASSET_FONTS ) {
            return !this.config.build.opts.ignoreFonts;
        }
        if ( assetType === ASSET_DATA ) {
            return !this.config.build.opts.ignoreData;
        }
        return true;
    }

    #deployAssetType(sourceType, assetType) {
        if ( !this.#shouldDeployAssetType(assetType) ) {
            return;
        }
        const assetsDirAbsPath = this.#ascertainPathToAssets(
            sourceType, assetType);
        if ( assetsDirAbsPath ) {
            const targetDirAbsPath = path.join(
                this.config.build.distDirs.assets,
                assetType
            );
            this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);
        }
    }

    async buildCustomCssAssets(sourceType) {
        if ( this.config.build.opts.minifyCss &&  
                !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreCss ) {
            await this.#buildCustomAssets(
                sourceType, ASSET_CSS, this.cssMinifierOptions);
        }
    }

    async buildCustomJsAssets(sourceType) {
        if ( this.config.build.opts.minifyJs &&  
                !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreJs ) {
            await this.#buildCustomAssets(
                sourceType, ASSET_JS, this.jsMinifierOptions);
        }
    }

    async #buildCustomAssets(sourceType, assetType, minifierOptions) {

        // Iterate across and minify all custom assets.
        let assets = null;
        let assetBasePath = null;
        if ( sourceType === SOURCE_SITE && 'assets' in this.config.site ) {
            assets = this.config.site.assets;
            assetBasePath = this.config.system.build.siteDirs.assets;
        } else if ( sourceType === SOURCE_THEME && 
            'assets' in this.config.site.theme ) {
            assets = this.config.site.theme.assets;
            assetBasePath = path.join(
                this.config.system.themes, 
                this.config.site.theme.name, 
                'assets');
        }
        if ( assets && 'custom' in assets && assetType in assets.custom ) {
            const assetRelPaths = assets.custom[assetType].filter(
                assetRelPath => hasFileExtension(assetRelPath, assetType));
            for (const relPath of assetRelPaths) {
                const absPath = path.join(
                    assetBasePath, 
                    assetType, 
                    relPath);
                const [error, minified] = await tryToCatch(minify, 
                    absPath, minifierOptions);
                if ( error ) {
                    throw new Error(`Failed to minify asset '${absPath}'.`, 
                        { cause: error });
                }
                const outputRelPath = 
                    relPath.replace(`.${assetType}`, `.min.${assetType}`);
                const outputAbsPath = path.join(
                    this.config.build.distDirs.assets, 
                    assetType, 
                    outputRelPath);
                const outputDirAbsPath = path.dirname(outputAbsPath);
                createDirectory(outputDirAbsPath);
                writeStringToFile(minified, outputAbsPath);
            }
        }

    }

    deployCssAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_CSS);
    }

    deployJsAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_JS);
    }

    deployImageAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_IMAGES);
    }

    deployAudioAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_AUDIO);
    }

    deployVideoAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_VIDEOS);
    }

    deployFontAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_FONTS);
    }

    deployDataAssets(sourceType) {
        this.#deployAssetType(sourceType, ASSET_DATA);
    }

    deployFavicon(sourceType) {
        const assetsDirAbsPath = 
            this.#ascertainPathToAssets(sourceType, ASSET_IMAGES);
        if ( assetsDirAbsPath ) {
            if ( sourceType === SOURCE_SITE ) {
                if ( exists(this.config, 'site', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = path.join(
                        assetsDirAbsPath, 
                        this.config.site.assets.custom.images.favicon.ico);
                    copyFile(faviconFileAbsPath, 
                        this.config.build.distDirs.base, false);
                }
            } else if ( sourceType === SOURCE_THEME ) {
                if ( exists(this.config, 'site', 'theme', 'assets', 'custom', 
                        'images', 'favicon', 'deployToRoot') && 
                    this.config.site.theme.assets.custom.images.favicon.deployToRoot ) {
                    const faviconFileAbsPath = path.join(
                        assetsDirAbsPath, 
                        this.config.site.theme.assets.custom.images.favicon.ico);
                    copyFile(faviconFileAbsPath, 
                        this.config.build.distDirs.base, false);
                }
            }
        }
    }

    #ascertainPathToAssets(sourceType, assetType) {
        if ( sourceType === SOURCE_SITE ) {
            return path.join(
                this.config.system.build.siteDirs.assets, 
                assetType);
        } else if ( sourceType === SOURCE_THEME ) {
            return path.join(
                this.config.system.themes, 
                this.config.site.theme.name, 
                'assets', 
                assetType);
        } else return null;
    }

    deploySystemJsAssets() {
        if ( !this.config.build.opts.ignoreAssets && 
                !this.config.build.opts.ignoreJs && 
                !this.config.build.opts.customJsOnly ) {
            
            // Vendor system JavaScript asset subdirectories are already versioned.
            const vendorAssetsDirAbsPath = path.join(
                this.config.system.assets.dir, 
                DIR_JS, 
                DIR_VENDORS);
            const vendorTargetDirAbsPath = path.join(
                this.config.build.distDirs.assets, 
                DIR_JS, 
                DIR_VENDORS);
            this.#deployAssets(vendorAssetsDirAbsPath, vendorTargetDirAbsPath);

            // Create a versioned subdirectory for Teddy system JavaScript assets.
            const assetsDirAbsPath = path.join(
                this.config.system.assets.dir, 
                DIR_JS, 
                DIR_TEDDY);
            const targetDirAbsPath = path.join(
                this.config.build.distDirs.assets, 
                DIR_JS, 
                DIR_VENDORS, 
                DIR_TEDDY, 
                this.config.package.version);
            this.#deployAssets(assetsDirAbsPath, targetDirAbsPath);

        }
    }

    #deployAssets(assetsDirAbsPath, targetDirAbsPath) {
        if ( pathExists(assetsDirAbsPath) ) {
            createDirectory(targetDirAbsPath);
            copyDir(assetsDirAbsPath, targetDirAbsPath);
            return true;
        }
        logger.debug('Asset Builder - Skipping optional asset directory; ' +
            `source directory does not exist: '${assetsDirAbsPath}'.`);
        return false;
    }

    #generateBuildConfigData(languageIndexKeys) {
        const collectionEnabled = this.config.site.collection.enabled;
        return {
            ASSETS_BASE_URL: this.config.site.urls.assets,
            COLLECTION_INDEX_BASE_URL: this.config.site.urls.collectionIndex ?? '',
            COLLECTION_PAGINATION_SIZE: collectionEnabled ?
                this.config.site.collection.pagination.size : 0,
            COLLECTION_SIZES: collectionEnabled ?
                this.config.site.collection.sizes : {},
            DEFAULT_LANGUAGE: this.config.site.languages.default,
            DOMAIN_NAME: this.config.site.web[this.config.build.env].domain,
            INDEX_DOCUMENT_STORE_CONFIG: collectionEnabled ?
                this.config.site.collection.index.documentStore : {},
            LANGUAGE_INDEX_KEYS: languageIndexKeys ?? {},
            MIN_SEARCH_QUERY_LENGTH: collectionEnabled ?
                this.config.site.collection.search.minQueryLength : 0,
            SITE_VERSION: this.config.site.version
        };
    }

    generateBuildConfigJs(languageIndexKeys) {
        const targetDirAbsPath = this.config.build.distDirs.siteConfig;
        createDirectory(targetDirAbsPath);
        const configData = this.#generateBuildConfigData(languageIndexKeys);
        const js = Object.entries(configData)
            .map(function([key, value]) {
                return `const ${key} = ${JSON.stringify(value)};`;
            })
            .join('\n');
        writeStringToFile(js, path.join(targetDirAbsPath, CONFIG_JS_FILE));
    }

    #stripHeavyRuntimeContent(content) {
        for ( const language of Object.keys(content) ) {
            if ( exists(content[language], 'collection', 'metadata', 'pages') ) {
                delete content[language].collection.metadata.pages;
            }
        }
        return content;
    }

    generateContentJs() {
        let content = {};
        for ( const language of this.config.site.languages.enabled ) {
            content[language] = structuredClone(
                this.config.site.languages.data[language]);
        }
        content = this.#stripHeavyRuntimeContent(content);
        const targetDirAbsPath = this.config.build.distDirs.siteConfig;
        createDirectory(targetDirAbsPath);
        const js = `const site = ${JSON.stringify(content)};`;
        writeStringToFile(js, path.join(targetDirAbsPath, SITE_JS_FILE));
    }

}

export default AssetBuilder;
