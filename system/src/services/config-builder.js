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

    constructor(systemConfig, siteConfig, options) {
        this.systemConfig = systemConfig;
        this.siteConfig =siteConfig;
        this.options = options;
    }

    build() {

        // Base configuration.
        this.config = Object.assign({}, this.systemConfig, this.siteConfig);

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
            build: `./build/${this.config.build.env}/${distDirVersion}`, 
            assets:  `${distDirBase}/assets/${distDirVersion}`
        }

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
            UrlBuilder.localizeUrls(language, 
                this.config.site.languages.enabled[0], 
                this.config.site.languages.data[language].urls);
            this.config.site.languages.data[language].urls.assets = 
                `/assets/${distDirVersion}`;

        }

        // Static assets relative URLs.
        this.config.site.urls.assets = `/assets/${distDirVersion}`;

        // Site configuration.
        const http = this.config.site.web.http.secure ? 'https': 'http';
        const baseUrl = `${http}://${this.config.site.web.domain}`;
        this.config.site.web.baseUrl = baseUrl;

        // Theme configuration.
        const themeConfigFileAbsPath = 
            this.config.system.build.siteDirs.themes + '/' 
                + `${this.config.site.theme.name}/theme.json`;
        const themeConfig = loadJsonFile(themeConfigFileAbsPath);
        this.config.site.theme = themeConfig.theme;
        
        return this.config;

    }

}

export default ConfigBuilder;
