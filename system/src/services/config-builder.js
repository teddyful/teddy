/**
 * Configuration builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import logger from '../middleware/logger.js';
import LanguageBuilder from './language-builder.js';
import UrlBuilder from './url-builder.js';
import { loadJsonFile } from '../utils/io-utils.js';


class ConfigBuilder {

    constructor(packageConfig, systemConfig, opts) {
        this.packageConfig = {
            package: packageConfig
        };
        this.systemConfig = systemConfig;
        this.opts = opts;
    }

    build(error = false) {

        // Load the site configuration.
        const siteDirPath = this.systemConfig.system.sites + 
            '/' + this.opts.siteName;
        const siteConfigFilePath = siteDirPath + '/site.json';
        this.siteConfig = loadJsonFile(siteConfigFilePath);

        // Generate the base configuration.
        this.config = Object.assign({}, this.packageConfig, this.systemConfig, this.siteConfig);

        // Update the system configuration with site directory structure.
        this.config.system.build = {
            siteDirs: {
                assets: siteDirPath + '/assets', 
                languages: siteDirPath + '/languages', 
                pages: siteDirPath + '/pages', 
                web: siteDirPath + '/web', 
            }, 
            siteDistDir: siteDirPath + '/public'
        }

        // Update the site configuration with the theme name.
        this.config.site.theme = {
            name: this.opts.themeName
        }

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
        const distDirBase = 
            `${this.config.system.build.siteDistDir}/${this.config.build.env}`;

        // Build distribution directory path.
        let buildDirBase = siteDirPath + 
                `/build/${this.config.build.env}/${this.config.site.version}`;
        if ( this.opts.versionBuildDate ) {
            buildDirBase = `${buildDirBase}/${this.config.build.date}`;
        }

        // Assets distribution directory path.
        let assetsDirBase = '/assets';
        if ( this.opts.versionAssetsSiteNumber && !this.opts.versionAssetsBuildId ) {
            assetsDirBase = `/assets/${this.config.site.version}`;
        } else if ( this.opts.versionAssetsBuildId && !this.opts.versionAssetsSiteNumber ) {
            assetsDirBase = `/assets/${this.config.build.id}`;
        } else if ( this.opts.versionAssetsSiteNumber && this.opts.versionAssetsBuildId ) {
            assetsDirBase = `/assets/${this.config.site.version}/${this.config.build.date}`;
        }

        // Collection distribution directory path.
        let collectionDirBase = '/collection';
        if ( this.opts.versionCollectionSiteNumber && !this.opts.versionCollectionBuildId ) {
            collectionDirBase = `/collection/${this.config.site.version}`;
        } else if ( this.opts.versionCollectionBuildId && !this.opts.versionCollectionSiteNumber ) {
            collectionDirBase = `/collection/${this.config.build.id}`;
        } else if ( this.opts.versionCollectionSiteNumber && this.opts.versionCollectionBuildId ) {
            collectionDirBase = `/collection/${this.config.site.version}/${this.config.build.date}`;
        }
        collectionDirBase = `${assetsDirBase}${collectionDirBase}`;

        // Site JavaScript assets distribution directory path.
        let siteConfigDirBase = '/js/site';
        if ( this.opts.versionSiteConfigSiteNumber && !this.opts.versionSiteConfigBuildId ) {
            siteConfigDirBase = `/js/site/${this.config.site.version}`;
        } else if ( this.opts.versionSiteConfigBuildId && !this.opts.versionSiteConfigSiteNumber ) {
            siteConfigDirBase = `/js/site/${this.config.build.id}`;
        } else if ( this.opts.versionSiteConfigSiteNumber && this.opts.versionSiteConfigBuildId ) {
            siteConfigDirBase = `/js/site/${this.config.site.version}/${this.config.build.date}`;
        }
        siteConfigDirBase = `${assetsDirBase}${siteConfigDirBase}`;

        // Distribution directory paths.
        this.config.build.distDirs = {
            base: distDirBase, 
            build: buildDirBase, 
            assets: `${distDirBase}${assetsDirBase}`, 
            collection: `${distDirBase}${collectionDirBase}`, 
            siteConfig: `${distDirBase}${siteConfigDirBase}`, 
        }
        logger.debug('Config Builder - Build configuration: ');
        logger.debug(JSON.stringify(this.config.build, null, 4));
        if ( error ) {
            return this.config;
        }

        // Collection pages directory name.
        const collectionPagesDir = this.config.site.collection.pagesDir
            .replace(/\s+/g, '-')
            .replace(/[^A-Za-z0-9\-_.\\\/]/g, '')
            .toLowerCase().trim();

        // Language data and localized URLs.
        const languageBuilder = new LanguageBuilder(this.config);
        this.config.site.languages.data = {};
        for ( const language of this.config.site.languages.enabled ) {

            // Aggregate language data.
            let languageData = languageBuilder.aggregateLanguageData(language);
            languageData.urls = 'urls' in this.config.site ? 
                structuredClone(this.config.site.urls) : {};
            this.config.site.languages.data[language] = languageData;

            // Generate localized URLs for user-defined URLs.
            this.config.site.languages.data[language].urls.collection = 
                `/${collectionPagesDir}`;
            UrlBuilder.localizeUrls(language, 
                this.config.site.languages.enabled[0], 
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
        this.config.site.urls.collection = `/${collectionPagesDir}`;
        if ( this.config.site.collection.index.content && 
            !this.config.site.collection.index.documentStore.document.index
                .includes('content') ) {
            this.config.site.collection.index.documentStore.document.index
                .push('content');
        }

        // Theme configuration.
        const themeConfigFileAbsPath = 
            this.config.system.themes + '/' 
                + `${this.config.site.theme.name}/theme.json`;
        const themeConfig = loadJsonFile(themeConfigFileAbsPath);
        this.config.site.theme = themeConfig.theme;
        
        return this.config;

    }

}

export default ConfigBuilder;
