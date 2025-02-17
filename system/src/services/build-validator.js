/**
 * Build validator service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import Ajv from "ajv";
import path from 'path';
import siteConfigSchema from '../schema/config-site.js';
import systemConfigSchema from '../schema/config-system.js';
import themeConfigSchema from '../schema/config-theme.js';

import { getFiles, hasFileExtension, loadJsonFile, pathExists } from 
    '../utils/io-utils.js';
import { getValue } from '../utils/json-utils.js';


class BuildValidator {

    constructor(systemConfig, siteConfig) {
        this.systemConfig = systemConfig;
        this.siteConfig = siteConfig;
        this.themeConfigFileName = 'theme.json';
        this.ajv = new Ajv();
    }

    validate() {
        this.#validateSystemConfig();
        this.#validateSiteConfig();
        this.#validateThemeConfig();
        this.#validatePages();

    }

    #validateSystemConfig() {

        // Validate the system configuration against its schema.
        if ( !this.ajv.validate(systemConfigSchema, this.systemConfig) )
            throw new Error('System configuration schema error: \n' + 
                JSON.stringify(this.ajv.errors, null, 4));

        // Validate that the specified system directories exist.
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'build', 'siteDirs', 'languages']);
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'build', 'siteDirs', 'pages']);
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'build', 'siteDirs', 'themes']);
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'build', 'siteDirs', 'web']);
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'assets', 'dir']);

        // Validate that the specified files exist.
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'assets', 'js', 'vendors'], 
            this.systemConfig.system.assets.dir + '/js');


    }

    #validateSiteConfig() {

        // Validate the site configuration against its schema.
        if ( !this.ajv.validate(siteConfigSchema, this.siteConfig) )
            throw new Error('Site configuration schema error: \n' + 
                JSON.stringify(this.ajv.errors, null, 4));

        // Validate that the specified site directories exist.
        this.#validateResourceExists(this.siteConfig, 
            ['site', 'theme', 'name'], 
            this.systemConfig.system.build.siteDirs.themes);
        this.#validateResourceExists(this.siteConfig, 
            ['site', 'languages', 'enabled'], 
            this.systemConfig.system.build.siteDirs.languages);
        if ( this.siteConfig.site.collection.enabled ) {
            this.#validateResourceExists(this.siteConfig, 
                ['site', 'collection', 'pagesDirName'], 
                this.systemConfig.system.build.siteDirs.pages);
        }

        // Validate that the specified site files exist.
        this.themeConfigDirPath = 
            this.systemConfig.system.build.siteDirs.themes + '/' + 
                this.siteConfig.site.theme.name;
        this.themeConfigPath = this.themeConfigDirPath + '/' + 
            this.themeConfigFileName;
        this.#validateFileExists(this.themeConfigDirPath, 
            this.themeConfigFileName);
        for ( const language of this.siteConfig.site.languages.enabled ) {
            this.#validateFileExists(
                this.systemConfig.system.build.siteDirs.languages + 
                    `/${language}`, 'metadata.json');
            this.#validateFileExists(
                this.systemConfig.system.build.siteDirs.languages + 
                    `/${language}`, 'contributors.json');
            if ( this.siteConfig.site.collection.enabled && 
                this.siteConfig.site.collection.taxonomy.categories.length > 0 
            ) {
                this.#validateFileExists(
                    this.systemConfig.system.build.siteDirs.languages + 
                        `/${language}`, 'taxonomy.json');
            }
        }

    }

    #validateThemeConfig() {

        // Validate the theme configuration against its schema.
        this.themeConfig = loadJsonFile(this.themeConfigPath);
        if ( !this.ajv.validate(themeConfigSchema, this.themeConfig) )
            throw new Error('Theme configuration schema error: \n' + 
                JSON.stringify(this.ajv.errors, null, 4));

        // Validate that the required directories exist.
        this.themeTemplatesDirPath = this.themeConfigDirPath + '/templates'
        this.#validateDirExists(this.themeTemplatesDirPath);

        // Validate that at least one theme template exists.
        const templateFiles = getFiles(this.themeTemplatesDirPath, false);
        const templateHtmlFiles = templateFiles.filter(
            filename => hasFileExtension(filename, 'html'));
        if ( templateHtmlFiles.length == 0 ) {
            throw new Error('No templates files found in' + 
                `'${this.themeTemplatesDirPath}'.`);
        }

        // Validate theme template filenames.
        for ( const templateHtmlFile of templateHtmlFiles ) {
            const pathComponents = templateHtmlFile.split(path.sep);
            const fileName = pathComponents[pathComponents.length - 1];
            if ( /[^A-Za-z0-9\-_.]/.test(fileName) ) {
                throw new Error('The theme template file found at ' + 
                    `'${templateHtmlFile}' contains invalid characters in ` + 
                    'its filename. Only alphanumeric, hyphen, underscore and ' + 
                    'period characters are permitted in theme template ' + 
                    'file names.'); 
            }
        }

        // Validate that the specified files exist.
        this.#validateResourceExists(this.themeConfig, 
            ['theme', 'assets', 'custom', 'css'], 
            this.themeConfigDirPath + '/assets/css');
        this.#validateResourceExists(this.themeConfig, 
            ['theme', 'assets', 'custom', 'js'], 
            this.themeConfigDirPath + '/assets/js');
        if ( 'favicon' in this.themeConfig.theme.assets.custom.images && 
                'ico' in this.themeConfig.theme.assets.custom.images.favicon ) {
            this.#validateResourceExists(this.themeConfig, 
                ['theme', 'assets', 'custom', 'images', 'favicon', 'ico'], 
                this.themeConfigDirPath + '/assets/images');
        }
        if ( 'og' in this.themeConfig.theme.assets.custom.images && 
                'default' in this.themeConfig.theme.assets.custom.images.og ) {
            this.#validateResourceExists(this.themeConfig, 
                ['theme', 'assets', 'custom', 'images', 'og', 'default'], 
                this.themeConfigDirPath + '/assets/images');
        }

    }

    #validateResourceExists(config, keys, parentPath = null) {
        let path = getValue(config, keys);
        if ( Array.isArray(path) ) {
            for ( const p of path ) {
                const ppath = parentPath ? `${parentPath}/${p}` : p;
                if ( !pathExists(ppath) )
                    throw new Error(`The resource '${ppath}' defined in ` + 
                        `'${keys.join('.')}' does not exist.`);
            }
        } else {
            path = parentPath ? `${parentPath}/${path}` : path;
            if ( !pathExists(path) )
                throw new Error(`The resource '${path}' defined in ` + 
                    `'${keys.join('.')}' does not exist.`);
        }
    }

    #validateDirExists(dirPath) {
        if ( !pathExists(dirPath) )
            throw new Error(`The required directory '${dirPath}' ` + 
                'does not exist');
    }

    #validateFileExists(dirPath, fileName) {
        const path = `${dirPath}/${fileName}`;
        if ( !pathExists(path) )
            throw new Error(`The required file '${fileName}' does not exist ` + 
                `in the directory '${dirPath}'.`);
    }

    #validatePages() {

        // Validate that at least one page exists.
        const pageFiles = getFiles(
            this.systemConfig.system.build.siteDirs.pages);
        const pageMdFiles = pageFiles.filter(
            filename => hasFileExtension(filename, 'md'));
        if ( pageMdFiles.length == 0 ) {
            throw new Error('No markdown files found in' + 
                `'${this.systemConfig.system.build.siteDirs.pages}'.`);
        }

        // Validate page directory and file names.
        for ( const pageMdFile of pageMdFiles ) {
            const pathComponents = pageMdFile.split(path.sep);
            const dirs = pageMdFile.split(path.sep).slice(0, -1);
            const fileName = pathComponents[pathComponents.length - 1];
            for ( const dir of dirs ) {
                if ( /[^A-Za-z0-9\-_ ]/.test(dir) ) {
                    throw new Error(`The page directory path '${pageMdFile}' ` +  
                        'contains invalid characters. Only alphanumeric, ' + 
                        'space, hyphen and underscore characters ' + 
                        'are permitted in directory names.'); 
                }
            }
            if ( /[^A-Za-z0-9\-_. ]/.test(fileName) ) {
                throw new Error(`The page markdown file '${pageMdFile}' ` +  
                    'contains invalid characters in its filename. Only ' + 
                    'alphanumeric, space, hyphen, underscore and period ' + 
                    'characters are permitted in page markdown file names.'); 
            }

            // Validate that the page filename contains its language code.
            if ( (fileName.match(/\./g) || []).length != 2 ) {
                throw new Error(`The page markdown file '${pageMdFile}' ` +  
                    'must contain exactly two period characters in its ' + 
                    'filename which are used to separate the language code ' + 
                    `and file extension, for example 'page.en.md'.`); 
            }

        }

    }

}

export default BuildValidator;
