/**
 * Configuration builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import LanguageBuilder from './language-builder.js';
import UrlBuilder from './url-builder.js';
import { loadJsonFile } from '../utils/io-utils.js';


class ConfigBuilder {

    constructor(systemConfig, options) {
        this.systemConfig = systemConfig;
        this.options = options;
    }

    build() {

        // Load the site configuration.
        const siteDirPath = this.systemConfig.system.sites + 
            '/' + this.options.getSiteName();
        const siteConfigFilePath = siteDirPath + '/site.json';
        this.siteConfig = loadJsonFile(siteConfigFilePath);

        // Generate the base configuration.
        this.config = Object.assign({}, this.systemConfig, this.siteConfig);

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
            name: this.options.getThemeName()
        }

        // Build metadata and user options.
        const buildDate = new Date().toISOString()
            .replace(/[-:.TZ]/g, "").substring(0, 14);
        this.config.build = {
            date: buildDate, 
            id: this.config.site.version + 
                `-${buildDate.replace(/[-:.TZ]/g, "")}`, 
            env: this.options.getEnv(), 
            flags: this.options.getFlags()
        }

        // Build directory structure.
        const distDirVersion = this.options.flags.distUseBuildId ? 
            this.config.build.id : this.config.site.version;
        const distDirBase = 
            `${this.config.system.build.siteDistDir}/${this.config.build.env}`;
        this.config.build.distDirs = {
            base: distDirBase, 
            build: siteDirPath + 
                `/build/${this.config.build.env}/${distDirVersion}`, 
            assets:  `${distDirBase}/assets/${distDirVersion}`
        }

        // Collection pages directory name.
        const collectionPagesDirName = this.config.site.collection.pagesDirName
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
                `/${collectionPagesDirName}`;
            UrlBuilder.localizeUrls(language, 
                this.config.site.languages.enabled[0], 
                this.config.site.languages.data[language].urls);
            this.config.site.languages.data[language].urls.assets = 
                `/assets/${distDirVersion}`;

        }

        // Static assets relative URLs.
        this.config.site.urls.assets = `/assets/${distDirVersion}`;

        // Site configuration.
        const http = this.config.site.web[this.options.getEnv()].http.secure ? 
            'https': 'http';
        const baseUrl = `${http}://` + 
            `${this.config.site.web[this.options.getEnv()].domain}`;
        this.config.site.web.baseUrl = baseUrl;

        // Collection configuration.
        this.config.site.urls.collection = `/${collectionPagesDirName}`;
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
