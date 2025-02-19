/**
 * Deployment service of static build resources and assets.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';
import path from 'path';
import { copyFile, createDirectory, pathExists, writeJsonToFile } from 
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
        writeJsonToFile({id: this.config.build.id}, 
            `${this.config.build.distDirs.base}/build.json`);
    }

    deployLanguages() {
        for ( const language of this.config.site.languages.enabled ) {
            writeJsonToFile(this.config.site.languages.data[language], 
                `${this.config.build.distDirs.build}/languages/${language}.json`);
        }
    }

    async deployDefaultLanguagePages() {
        if ( !this.config.build.flags.ignoreHtml ) {
            const defaultLanguage = this.config.site.languages.enabled[0];
            await new Promise((resolve, reject) => {
                gulp.src([this.config.build.distDirs.base + 
                        `/${defaultLanguage}/**`])
                    .pipe(gulp.dest(this.config.build.distDirs.base))
                    .on('end', resolve);
            });
        }
    }

    deployWebConfig() {

        if ( !this.config.build.flags.ignoreWebConfig) {
            let filepath = null;

            // Apache web server.
            if ( this.config.site.web.host.apache ) {
                filepath = this.config.system.build.siteDirs.web + 
                    '/hosts/apache/.htaccess';
            }

            // Cloudflare pages.
            else if ( this.config.site.web.host.cloudflarePages ) {
                filepath = this.config.system.build.siteDirs.web + 
                    '/hosts/cloudflare/pages/_headers';
            }

            // Copy the web configuration to the base distribution directory.
            if ( filepath && pathExists(filepath) ) {
                const filename = path.basename(filepath);
                copyFile(filepath, 
                    `${this.config.build.distDirs.base}/${filename}`);
            }

        }

    }

    deployRobots() {
        if ( !this.config.build.flags.ignoreRobots) {
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
        if ( !this.config.build.flags.ignoreSitemap) {
            const filepath = this.config.system.build.siteDirs.web + 
            '/sitemap/sitemap.xml';
            if ( pathExists(filepath) ) {
                const filename = path.basename(filepath);
                copyFile(filepath, 
                    `${this.config.build.distDirs.base}/${filename}`);
            }
        }
    }

}

export default BuildDeployer;
