/**
 * Configuration builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import path from 'path';
import logger from '../middleware/logger.js';
import LanguageBuilder from './language-builder.js';
import UrlBuilder from './url-builder.js';
import { loadJsonFile, toRelativePath } from '../utils/io-utils.js';

const SITE_CONFIG_FILE = 'site.json';
const THEME_CONFIG_FILE = 'theme.json';
const DIR_ASSETS = 'assets';
const DIR_BUILD = 'build';
const DIR_COLLECTION = 'collection';
const DIR_JS = 'js';
const DIR_LANGUAGES = 'languages';
const DIR_PAGES = 'pages';
const DIR_PUBLIC = 'public';
const DIR_SITE = 'site';
const DIR_WEB = 'web';


class ConfigBuilder {

    constructor(packageConfig, systemConfig, opts) {
        this.packageConfig = {
            package: structuredClone(packageConfig)
        };
        this.systemConfig = structuredClone(systemConfig);
        this.opts = structuredClone(opts);
    }

    #buildVersionedDirBase(basePath, siteNumberFlag, buildIdFlag) {
        if ( siteNumberFlag && !buildIdFlag ) {
            return `${basePath}/${this.config.site.version}`;
        }
        if ( buildIdFlag && !siteNumberFlag ) {
            return `${basePath}/${this.config.build.id}`;
        }
        if ( siteNumberFlag && buildIdFlag ) {
            return `${basePath}/${this.config.site.version}` + 
                `/${this.config.build.date}`;
        }
        return basePath;
    }

    #normalizeCollectionPagesDir(collectionPagesDir) {
        return String(collectionPagesDir ?? '')
            .replace(/\s+/g, '-')
            .replace(/[^A-Za-z0-9\-_.\\\/]/g, '')
            .toLowerCase()
            .trim();
    }

    build(error = false) {

        // Load the site configuration.
        const siteDirPath = path.join(
            this.systemConfig.system.sites, this.opts.siteName);
        const siteConfigFilePath = path.join(siteDirPath , SITE_CONFIG_FILE);
        this.siteConfig = loadJsonFile(siteConfigFilePath);

        // Generate the base configuration.
        this.config = {
            ...structuredClone(this.packageConfig),
            ...structuredClone(this.systemConfig),
            ...structuredClone(this.siteConfig)
        };

        // Ensure site URLs exist even when omitted from site.json.
        this.config.site.urls = this.config.site.urls ?? {};

        // Identify the default language.
        const defaultLanguage = this.config.site.languages.enabled[0];
        this.config.site.languages.default = defaultLanguage;

        // Update the system configuration with site directory structure.
        this.config.system.build = {
            siteDirs: {
                assets: path.join(siteDirPath, DIR_ASSETS), 
                languages: path.join(siteDirPath, DIR_LANGUAGES), 
                pages: path.join(siteDirPath, DIR_PAGES), 
                web: path.join(siteDirPath, DIR_WEB), 
            }, 
            siteDistDir: path.join(siteDirPath, DIR_PUBLIC)
        }

        // Update the site configuration with the theme name.
        const themeName = this.opts.themeName;
        const themeConfigFileAbsPath = path.join(
            this.config.system.themes, 
            themeName, 
            THEME_CONFIG_FILE);
        const themeConfig = loadJsonFile(themeConfigFileAbsPath);
        this.config.site.theme = themeConfig.theme;

        // Build metadata and user options.
        const buildDate = new Date().toISOString()
            .replace(/[-:.TZ]/g, "").substring(0, 14);
        this.config.build = {
            date: buildDate, 
            id: this.config.site.version + 
                `-${buildDate.replace(/[-:.TZ]/g, "")}`, 
            env: this.opts.env, 
            opts: this.opts
        }

        // Base distribution directory path.
        const distDirBase = path.join(
            this.config.system.build.siteDistDir, 
            this.config.build.env);

        // Build distribution directory path.
        let buildDirBase = path.join(
            siteDirPath, 
            DIR_BUILD, 
            this.config.build.env, 
            this.config.site.version);
        if ( this.opts.versionBuildDate ) {
            buildDirBase = path.join(
                buildDirBase, 
                this.config.build.date);
        }

        // Assets distribution directory path.
        const assetsDirBase = this.#buildVersionedDirBase(
            `/${DIR_ASSETS}`,
            this.opts.versionAssetsSiteNumber,
            this.opts.versionAssetsBuildId
        );

        // Collection distribution directory path.
        const collectionDirBase = assetsDirBase + this.#buildVersionedDirBase(
            `/${DIR_COLLECTION}`,
            this.opts.versionCollectionSiteNumber,
            this.opts.versionCollectionBuildId
        );

        // Site JavaScript assets distribution directory path.
        const siteConfigDirBase = assetsDirBase + this.#buildVersionedDirBase(
            `/${DIR_JS}/${DIR_SITE}`,
            this.opts.versionSiteConfigSiteNumber,
            this.opts.versionSiteConfigBuildId
        );

        // Distribution directory paths.
        this.config.build.distDirs = {
            base: distDirBase, 
            build: buildDirBase, 
            assets: path.join(distDirBase, 
                toRelativePath(assetsDirBase)), 
            collection: path.join(distDirBase, 
                toRelativePath(collectionDirBase)), 
            siteConfig: path.join(distDirBase, 
                toRelativePath(siteConfigDirBase)) 
        }
        logger.debug('Config Builder - Build configuration: ');
        logger.debug(JSON.stringify(this.config.build, null, 4));
        if ( error ) {
            return this.config;
        }

        // Collection pages directory name.
        const collectionEnabled = this.config.site.collection.enabled;
        let collectionPagesDir = null;
        if ( collectionEnabled ) {
            collectionPagesDir = this.#normalizeCollectionPagesDir(
                this.config.site.collection.pagesDir
            );
            if ( collectionPagesDir.length === 0 ) {
                throw new Error('Collection pages directory cannot be empty.');
            }
        }

        // Language data and localized URLs.
        const languageBuilder = new LanguageBuilder(this.config);
        this.config.site.languages.data = {};
        for ( const language of this.config.site.languages.enabled ) {

            // Aggregate language data.
            let languageData = languageBuilder.aggregateLanguageData(language);
            languageData.urls = structuredClone(this.config.site.urls);
            this.config.site.languages.data[language] = languageData;

            // Generate localized URLs for user-defined URLs.
            if ( collectionEnabled ) {
                this.config.site.languages.data[language].urls.collection = 
                    `/${collectionPagesDir}`;
            }
            UrlBuilder.localizeUrls(language, 
                defaultLanguage, 
                this.config.site.languages.data[language].urls);
            this.config.site.languages.data[language].urls.assets = 
                assetsDirBase;

            // Asset configuration.
            this.config.site.languages.data[language].assets = {
                minify: {
                    css: this.config.build.opts.minifyCss, 
                    html: this.config.build.opts.minifyHtml, 
                    js: this.config.build.opts.minifyJs
                }
            }

            // Site configuration.
            this.config.site.languages.data[language].site = {
                name: this.config.site.name, 
                version: this.config.site.version
            }

        }

        // Static assets relative URLs.
        this.config.site.urls.assets = assetsDirBase;
        this.config.site.urls.collectionIndex = collectionDirBase;
        this.config.site.urls.siteConfig = siteConfigDirBase;

        // Site configuration.
        const http = this.config.site.web[this.opts.env].http.secure ? 
            'https': 'http';
        const baseUrl = `${http}://` + 
            `${this.config.site.web[this.opts.env].domain}`;
        this.config.site.web.baseUrl = baseUrl;

        // Collection configuration.
        if ( collectionEnabled ) {
            this.config.site.urls.collection = `/${collectionPagesDir}`;
            if ( this.config.site.collection.index.content && 
                !this.config.site.collection.index.documentStore.document.index
                    .includes('content') ) {
                this.config.site.collection.index.documentStore.document.index
                    .push('content');
            }
        }
        
        return this.config;

    }

}

export default ConfigBuilder;
