/**
 * Deployment service of static build resources and assets.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import path from 'path';
import hosts from '../enums/hosts.js';
import { copyDir, copyFile, pathExists, writeJsonToFile } from 
    '../utils/io-utils.js';


class BuildDeployer {

    constructor(config) {
        this.config = config;
    }

    deployBuildConfig() {
        writeJsonToFile(this.config, 
            `${this.config.build.distDirs.build}/config/config.json`);
    }

    deployBuildMetadata() {
        const buildMetadata = {
            id: this.config.build.id, 
            date: this.config.build.date, 
            site: {
                name: this.config.site.name, 
                version: this.config.site.version
            }
        };
        writeJsonToFile(buildMetadata, 
            `${this.config.build.distDirs.base}/build.json`);
    }

    deployLanguages() {
        for ( const language of this.config.site.languages.enabled ) {
            writeJsonToFile(this.config.site.languages.data[language], 
                `${this.config.build.distDirs.build}/languages/` + 
                    `${language}.json`);
        }
    }

    deployDefaultLanguagePages() {
        if ( !this.config.build.opts.ignoreHtml ) {
            const defaultLanguage = this.config.site.languages.enabled[0];
            const defaultLanguageDir = this.config.build.distDirs.base + 
                `/${defaultLanguage}/`;
            copyDir(defaultLanguageDir, this.config.build.distDirs.base);
        }
    }

    deployWebConfig() {
        if ( !this.config.build.opts.ignoreWebConfig) {
            const env = this.config.build.env;
            const webConfigBaseDirPath = 
                this.config.system.build.siteDirs.web + '/hosts/';
            const webHost = this.config.site.web[env].host;
            if ( webHost in hosts ) {
                const filepath = webConfigBaseDirPath + hosts[webHost];
                if ( filepath && pathExists(filepath) ) {
                    const filename = path.basename(filepath);
                    copyFile(filepath, 
                        `${this.config.build.distDirs.base}/${filename}`);
                }
            }
        }
    }

    deployRobots() {
        if ( !this.config.build.opts.ignoreRobots) {
            const filepath = this.config.system.build.siteDirs.web + 
                '/robots/robots.txt';
            if ( pathExists(filepath) ) {
                const filename = path.basename(filepath);
                copyFile(filepath, 
                    `${this.config.build.distDirs.base}/${filename}`);
            }
        }
    }

    deploySitemap() {
        if ( !this.config.build.opts.ignoreSitemap) {
            const filepath = this.config.system.build.siteDirs.web + 
                '/sitemap/sitemap.xml';
            if ( pathExists(filepath) ) {
                const filename = path.basename(filepath);
                copyFile(filepath, 
                    `${this.config.build.distDirs.base}/${filename}`);
            }
        }
    }

    deployBuildErrorPage() {
        const filepath = this.config.system.assets.dir + 
            '/html/build-error.html';
        if ( pathExists(filepath) && 
            pathExists(this.config.build.distDirs.base) ) {
            copyFile(filepath, 
                `${this.config.build.distDirs.base}/index.html`);
        }
    }

}

export default BuildDeployer;
