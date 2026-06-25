/**
 * Static resources deployment service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import logger from '../middleware/logger.js';
import hosts from '../enums/hosts.js';
import { copyDir, copyFile, pathExists, resolvePathInsideBase,
    writeJsonToFile } from '../utils/io-utils.js';

const BUILD_CONFIG_FILE = 'config.json';
const BUILD_METADATA_FILE = 'build.json';
const BUILD_ERROR_FILE = 'build-error.html';
const INDEX_FILE = 'index.html';
const ROBOTS_FILE = 'robots.txt';
const SITEMAP_FILE = 'sitemap.xml';
const DIR_CONFIG = 'config';
const DIR_HTML = 'html';
const DIR_HOSTS = 'hosts';
const DIR_LANGUAGES = 'languages';
const DIR_ROBOTS = 'robots';
const DIR_SITEMAP = 'sitemap';

class BuildDeployer {

    constructor(config) {
        this.config = config;
    }

    #copyFileIfExists(sourceFilePath, targetFilePath, label = 'file') {
        if ( sourceFilePath && pathExists(sourceFilePath) && targetFilePath ) {
            copyFile(sourceFilePath, targetFilePath);
            return true;
        }
        logger.debug(`Build Deployer - Skipping optional ${label}; ` +
            `source file does not exist: '${sourceFilePath}'.`);
        return false;
    }

    deployBuildConfig() {
        const buildConfigFilePath = resolvePathInsideBase(
            path.join(DIR_CONFIG, BUILD_CONFIG_FILE),
            this.config.build.distDirs.build,
            BUILD_CONFIG_FILE
        );
        writeJsonToFile(this.config, buildConfigFilePath);
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
        const buildMetadataFilePath = resolvePathInsideBase(
            BUILD_METADATA_FILE,
            this.config.build.distDirs.base,
            BUILD_METADATA_FILE
        );
        writeJsonToFile(buildMetadata, buildMetadataFilePath);
    }

    deployLanguages() {
        for ( const language of this.config.site.languages.enabled ) {
            const languageDataFilePath = resolvePathInsideBase(
                path.join(DIR_LANGUAGES, `${language}.json`),
                this.config.build.distDirs.build,
                `language data file (${language})`
            );
            writeJsonToFile(this.config.site.languages.data[language], 
                languageDataFilePath
            );
        }
    }

    deployDefaultLanguagePages() {
        if ( !this.config.build.opts.ignoreHtml ) {
            const defaultLanguage = this.config.site.languages.default ??
                this.config.site.languages.enabled[0];
            const defaultLanguageDir = path.join(
                this.config.build.distDirs.base, 
                defaultLanguage);
            resolvePathInsideBase(
                defaultLanguage,
                this.config.build.distDirs.base,
                'default language directory'
            );
            if ( pathExists(defaultLanguageDir) ) {
                copyDir(defaultLanguageDir, this.config.build.distDirs.base);
                return;
            }
            logger.debug('Build Deployer - Skipping default language page ' +
                'deployment; directory does not exist: ' + 
                `'${defaultLanguageDir}'.`);
        }
    }

    deployWebConfig() {
        if ( !this.config.build.opts.ignoreWebConfig ) {
            const env = this.config.build.env;
            const webHost = this.config.site.web[env].host;
            if ( webHost in hosts ) {
                const webConfigFiles = hosts[webHost];
                for ( const webConfigFile of webConfigFiles ) {
                    resolvePathInsideBase(
                        path.join(DIR_HOSTS, webConfigFile),
                        this.config.system.build.siteDirs.web,
                        `web host config ${webConfigFile}`
                    );
                    const sourceFilePath = path.join(
                        this.config.system.build.siteDirs.web,
                        DIR_HOSTS,
                        webConfigFile
                    );
                    const targetFilePath = resolvePathInsideBase(
                        path.basename(webConfigFile),
                        this.config.build.distDirs.base,
                        `web host config target ${webConfigFile}`
                    );
                    this.#copyFileIfExists(
                        sourceFilePath, 
                        targetFilePath, 
                        `web host config ${webConfigFile}`);
                }
            }
        }
    }

    deployRobots() {
        if ( !this.config.build.opts.ignoreRobots ) {
            const sourceFilePath = path.join(
                this.config.system.build.siteDirs.web,
                DIR_ROBOTS,
                ROBOTS_FILE
            );
            resolvePathInsideBase(
                path.join(DIR_ROBOTS, ROBOTS_FILE),
                this.config.system.build.siteDirs.web,
                ROBOTS_FILE
            );
            const targetFilePath = resolvePathInsideBase(
                ROBOTS_FILE,
                this.config.build.distDirs.base,
                `${ROBOTS_FILE} target`
            );
            this.#copyFileIfExists(
                sourceFilePath,
                targetFilePath, 
                ROBOTS_FILE
            );
        }
    }

    deploySitemap() {
        if ( !this.config.build.opts.ignoreSitemap ) {
            const sourceFilePath = path.join(
                this.config.system.build.siteDirs.web,
                DIR_SITEMAP,
                SITEMAP_FILE
            );
            resolvePathInsideBase(
                path.join(DIR_SITEMAP, SITEMAP_FILE),
                this.config.system.build.siteDirs.web,
                SITEMAP_FILE
            );
            const targetFilePath = resolvePathInsideBase(
                SITEMAP_FILE,
                this.config.build.distDirs.base,
                `${SITEMAP_FILE} target`
            );
            this.#copyFileIfExists(
                sourceFilePath,
                targetFilePath, 
                SITEMAP_FILE
            );
        }
    }

    deployBuildErrorPage() {
        if ( pathExists(this.config.build.distDirs.base) ) {
            const sourceFilePath = path.join(
                this.config.system.assets.dir,
                DIR_HTML,
                BUILD_ERROR_FILE
            );
            resolvePathInsideBase(
                path.join(DIR_HTML, BUILD_ERROR_FILE),
                this.config.system.assets.dir,
                BUILD_ERROR_FILE
            );
            const targetFilePath = resolvePathInsideBase(
                INDEX_FILE,
                this.config.build.distDirs.base,
                `${BUILD_ERROR_FILE} target`
            );
            this.#copyFileIfExists(
                sourceFilePath,
                targetFilePath, 
                BUILD_ERROR_FILE
            );
        }
    }

}

export default BuildDeployer;
