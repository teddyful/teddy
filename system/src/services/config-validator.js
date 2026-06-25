/**
 * Configuration validator service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import Ajv from "ajv";
import path from 'path';
import siteConfigSchema from '../schema/config-site.js';
import siteContributorsSchema from '../schema/config-site-contributors.js';
import siteMetadataSchema from '../schema/config-site-metadata.js';
import siteTaxonomySchema from '../schema/config-site-taxonomy.js';
import systemConfigSchema from '../schema/config-system.js';
import themeConfigSchema from '../schema/config-theme.js';

import { getFiles, hasFileExtension, loadJsonFile, pathExists } from 
    '../utils/io-utils.js';
import { exists } from '../utils/json-utils.js';
import { getValue } from '../utils/json-utils.js';

// Semantic versioning 2.0.0 regex - see https://semver.org
const SEMANTIC_VERSIONING_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const FILE_EXT_MARKDOWN = 'md';

class ConfigValidator {

    constructor(systemConfig, opts) {
        this.systemConfig = systemConfig;
        this.opts = opts;
        this.siteConfigFileName = 'site.json';
        this.themeConfigFileName = 'theme.json';
        this.ajv = new Ajv({ allErrors: true });
    }

    validate() {
        this.#validateSystemConfig();
        this.#validateOptions();
        this.#validateSiteConfig();
        this.#validateThemeConfig();
        this.#validatePages();

    }

    #validateSchema(schema, data, label) {
        if ( !this.ajv.validate(schema, data) ) {
            throw new Error(`${label} schema error:\n` +
                JSON.stringify(this.ajv.errors, null, 4));
        }
    }

    #validateSystemConfig() {

        // Validate the system configuration against its schema.
        this.#validateSchema(systemConfigSchema, this.systemConfig, 
            'System configuration');

        // Validate that the required system directories exist.
        this.#validateResourceExists(this.systemConfig, ['system', 'sites']);
        this.#validateResourceExists(this.systemConfig, ['system', 'themes']);
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'assets', 'dir']);

        // Validate that the required files exist.
        this.#validateResourceExists(this.systemConfig, 
            ['system', 'assets', 'js', 'vendors'], 
            path.join(this.systemConfig.system.assets.dir, 'js'));
        for ( const key of Object.keys(
            this.systemConfig.system.assets.fonts) ) {
            this.#validateResourceExists(this.systemConfig, 
                ['system', 'assets', 'fonts', key], 
                path.join(this.systemConfig.system.assets.dir, 'fonts'));
        }

    }

    #validateOptions() {

        // Validate the site name.
        if ( /[^A-Za-z0-9\-_]/.test(this.opts.siteName) ) {
            throw new Error(`The site name '${this.opts.siteName}' ` + 
                'contains invalid characters. Only alphanumeric, hyphen and ' + 
                'underscore characters are permitted in site names.'); 
        }

        // Validate that the specified site directory and config file exist.
        this.siteDirPath = path.join(
            this.systemConfig.system.sites,
            this.opts.siteName);
        this.siteConfigFilePath = path.join(
            this.siteDirPath,
            this.siteConfigFileName);
        this.#validateDirExists(this.siteDirPath);
        this.#validateFileExists(this.siteDirPath, this.siteConfigFileName);

        // Validate the theme name.
        if ( /[^A-Za-z0-9\-_]/.test(this.opts.themeName) ) {
            throw new Error(`The theme name '${this.opts.themeName}' ` + 
                'contains invalid characters. Only alphanumeric, hyphen and ' + 
                'underscore characters are permitted in theme names.'); 
        }

        // Validate that the specified theme directory and config file exist.
        this.themeDirPath = path.join(
            this.systemConfig.system.themes,
            this.opts.themeName);
        this.themeConfigFilePath = path.join(
            this.themeDirPath,
            this.themeConfigFileName);
        this.#validateDirExists(this.themeDirPath);
        this.#validateFileExists(this.themeDirPath, this.themeConfigFileName);

        // Validate the environment name.
        if ( /[^A-Za-z0-9\-_]/.test(this.opts.env) ) {
            throw new Error(`The environment name '${this.opts.env}' ` + 
                'contains invalid characters. Only alphanumeric, hyphen and ' + 
                'underscore characters are permitted in environment names.'); 
        }

    }

    #validateTaxonomyCompleteness(categoryIds, taxonomy, language) {
        const translatedCategories = taxonomy.taxonomy?.categories ?? {};
        for ( const categoryId of categoryIds ) {
            if ( !Object.hasOwn(translatedCategories, categoryId) ) {
                throw new Error(
                    `The taxonomy file for language '${language}' is missing ` +
                    `a translation for the category '${categoryId}'. ` +
                    `All categories listed in ` +
                    `'site.collection.taxonomy.categories' must be defined ` +
                    `in each enabled language's taxonomy.json file.`
                );
            }
        }
    }

    #validateSiteConfig() {

        // Load the site config.
        this.siteConfig = loadJsonFile(this.siteConfigFilePath);

        // Update the system config with site directory dependencies.
        this.systemConfig.system.build = {
            siteDirs: {
                assets: path.join(this.siteDirPath, 'assets'), 
                languages: path.join(this.siteDirPath, 'languages'), 
                pages: path.join(this.siteDirPath, 'pages'), 
                web: path.join(this.siteDirPath, 'web'), 
            }
        }

        // Validate the site configuration against its schema.
        this.#validateSchema(siteConfigSchema, this.siteConfig, 
            'Site configuration');

        // Validate the site name against the site name command line argument.
        if ( this.siteConfig.site.name !== this.opts.siteName ) {
            throw new Error('The site name provided as a command line ' + 
                `argument ('${this.opts.siteName}') does not exactly ` + 
                'match the site name in the site configuration file ' + 
                `('${this.siteConfig.site.name}').`);
        }

        // Validate the site version.
        if ( !(SEMANTIC_VERSIONING_REGEX.test(
                this.siteConfig.site.version)) ) {
            throw new Error('The site version ' + 
                `'${this.siteConfig.site.version}' is invalid. The site ` + 
                'version should conform to the semantic versioning 2.0.0 ' + 
                'specification described at https://semver.org.'); 
        }

        // Validate that the specified site directories exist.
        this.#validateResourceExists(this.siteConfig, 
            ['site', 'languages', 'enabled'], 
            this.systemConfig.system.build.siteDirs.languages);
        if ( this.siteConfig.site.collection.enabled ) {
            this.#validateResourceExists(this.siteConfig, 
                ['site', 'collection', 'pagesDir'], 
                this.systemConfig.system.build.siteDirs.pages);
        }

        // Validate that the required site files exist.
        const categoryIds = this.siteConfig.site.collection.taxonomy.categories;
        for ( const language of this.siteConfig.site.languages.enabled ) {
            
            // metadata.json
            const siteLanguageDirPath = path.join(
                this.systemConfig.system.build.siteDirs.languages, language);
            const metadataFileName = 'metadata.json';
            this.#validateFileExists(siteLanguageDirPath, metadataFileName);
            const metadata = loadJsonFile(
                path.join(siteLanguageDirPath, metadataFileName));
            this.#validateSchema(siteMetadataSchema, metadata, 
                `Site metadata (${language})`);

            // contributors.json
            const contributorsFileName = 'contributors.json';
            this.#validateFileExists(siteLanguageDirPath, contributorsFileName);
            const contributors = loadJsonFile(
                path.join(siteLanguageDirPath, contributorsFileName));
            this.#validateSchema(siteContributorsSchema, contributors, 
                `Site contributors (${language})`);

            // taxonomy.json
            if ( this.siteConfig.site.collection.enabled && 
                this.siteConfig.site.collection.taxonomy.categories.length > 0 
            ) {
                const taxonomyFileName = 'taxonomy.json';
                this.#validateFileExists(siteLanguageDirPath, taxonomyFileName);
                const taxonomy = loadJsonFile(
                    path.join(siteLanguageDirPath, taxonomyFileName));
                this.#validateSchema(siteTaxonomySchema, taxonomy, 
                    `Site taxonomy (${language})`);
                this.#validateTaxonomyCompleteness(
                    categoryIds, taxonomy, language);
            }

        }

        // Validate that the specified asset files exist.
        if ( exists(this.siteConfig, 'site', 'assets', 'custom') ) {
            if ( 'css' in this.siteConfig.site.assets.custom ) {
                this.#validateResourceExists(this.siteConfig, 
                    ['site', 'assets', 'custom', 'css'], 
                    path.join(this.siteDirPath, 'assets', 'css'));
            }
            if ( 'js' in this.siteConfig.site.assets.custom ) {
                this.#validateResourceExists(this.siteConfig, 
                    ['site', 'assets', 'custom', 'js'], 
                    path.join(this.siteDirPath, 'assets', 'js'));
            }
            if ( 'images' in this.siteConfig.site.assets.custom ) {
                if ( 'favicon' in this.siteConfig.site.assets.custom.images && 
                    'ico' in this.siteConfig.site.assets.custom.images.favicon ) {
                    this.#validateResourceExists(this.siteConfig, 
                        ['site', 'assets', 'custom', 'images', 'favicon', 'ico'], 
                        path.join(this.siteDirPath, 'assets', 'images'));
                }
                if ( 'og' in this.siteConfig.site.assets.custom.images && 
                    'default' in this.siteConfig.site.assets.custom.images.og ) {
                    this.#validateResourceExists(this.siteConfig, 
                        ['site', 'assets', 'custom', 'images', 'og', 'default'], 
                        path.join(this.siteDirPath, 'assets', 'images'));
                }
            }
        }

        // Validate that an object for this environment exists in site.web.
        const env = this.opts.env;
        if ( !(env in this.siteConfig.site.web) ) {
            throw new Error('No web configuration exists for the environment ' + 
                `'${env}' in the site configuration 'site.web' namespace.`);
        }

    }

    #validateThemeConfig() {

        // Validate the theme configuration against its schema.
        this.themeConfig = loadJsonFile(this.themeConfigFilePath);
        this.#validateSchema(themeConfigSchema, this.themeConfig, 
            'Theme configuration');

        // Validate the theme name against the theme name command line argument.
        if ( this.themeConfig.theme.name !== this.opts.themeName ) {
            throw new Error('The theme name provided as a command line ' + 
                `argument ('${this.opts.themeName}') does not ` +  
                'exactly match the theme name in the theme configuration ' + 
                `file ('${this.themeConfig.theme.name}').`);
        }

        // Validate the theme version.
        if ( !(SEMANTIC_VERSIONING_REGEX.test(
                this.themeConfig.theme.version)) ) {
            throw new Error('The theme version ' + 
                `'${this.themeConfig.theme.version}' is invalid. The theme ` + 
                'version should conform to the semantic versioning 2.0.0 ' + 
                'specification described at https://semver.org.'); 
        }

        // Validate that the required directories exist.
        this.themeTemplatesDirPath = path.join(this.themeDirPath, 'templates');
        this.#validateDirExists(this.themeTemplatesDirPath);

        // Validate that at least one theme template exists.
        const templateFiles = getFiles(this.themeTemplatesDirPath, false);
        const templateHtmlFiles = templateFiles.filter(
            filename => hasFileExtension(filename, 'html'));
        if ( templateHtmlFiles.length === 0 ) {
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

        // Validate that the specified asset files exist.
        if ( exists(this.themeConfig, 'theme', 'assets', 'custom') ) {
            if ( 'css' in this.themeConfig.theme.assets.custom ) {
                this.#validateResourceExists(this.themeConfig, 
                    ['theme', 'assets', 'custom', 'css'], 
                    path.join(this.themeDirPath, 'assets', 'css'));
            }
            if ( 'js' in this.themeConfig.theme.assets.custom ) {
                this.#validateResourceExists(this.themeConfig, 
                    ['theme', 'assets', 'custom', 'js'], 
                    path.join(this.themeDirPath, 'assets', 'js'));
            }
            if ( 'images' in this.themeConfig.theme.assets.custom ) {
                if ( 'favicon' in this.themeConfig.theme.assets.custom.images && 
                    'ico' in this.themeConfig.theme.assets.custom.images.favicon ) {
                    this.#validateResourceExists(this.themeConfig, 
                        ['theme', 'assets', 'custom', 'images', 'favicon', 'ico'], 
                        path.join(this.themeDirPath, 'assets', 'images'));
                }
                if ( 'og' in this.themeConfig.theme.assets.custom.images && 
                    'default' in this.themeConfig.theme.assets.custom.images.og ) {
                    this.#validateResourceExists(this.themeConfig, 
                        ['theme', 'assets', 'custom', 'images', 'og', 'default'], 
                        path.join(this.themeDirPath, 'assets', 'images'));
                }
            }
        }

    }

    #validateResourceExists(config, keys, parentPath = null) {
        const resourcePath = getValue(config, keys);
        if ( Array.isArray(resourcePath) ) {
            for ( const itemPath of resourcePath ) {
                const resolvedPath = parentPath ? 
                    path.join(parentPath, itemPath) : itemPath;
                if ( !pathExists(resolvedPath) )
                    throw new Error(`The resource '${resolvedPath}' defined ` + 
                        `in '${keys.join('.')}' does not exist.`);
            }
        } else {
            const resolvedPath = parentPath ? 
                path.join(parentPath, resourcePath) : resourcePath;
            if ( !pathExists(resolvedPath) )
                throw new Error(`The resource '${resolvedPath}' defined ` + 
                    `in '${keys.join('.')}' does not exist.`);
        }
    }

    #validateDirExists(dirPath) {
        if ( !pathExists(dirPath) )
            throw new Error(`The required directory '${dirPath}' ` + 
                'does not exist');
    }

    #validateFileExists(dirPath, fileName) {
        const filePath = path.join(dirPath, fileName);
        if ( !pathExists(filePath) )
            throw new Error(`The required file '${fileName}' does not exist ` + 
                `in the directory '${dirPath}'.`);
    }

    #validateFilePathExists(filePath) {
        if ( !pathExists(filePath) )
            throw new Error(`The required file '${filePath}' does not exist.`);
    }

    #validatePages() {

        // Validate that at least one page exists.
        const pageFiles = getFiles(
            this.systemConfig.system.build.siteDirs.pages);
        const pageMdFiles = pageFiles.filter(
            filename => hasFileExtension(filename, FILE_EXT_MARKDOWN));
        if ( pageMdFiles.length === 0 ) {
            throw new Error('No markdown files found in' + 
                `'${this.systemConfig.system.build.siteDirs.pages}'.`);
        }

        // Validate that the default language has at least one page.
        const defaultLanguage = this.siteConfig.site.languages.enabled[0];
        const defaultLanguagePages = pageMdFiles.filter(filename => 
            filename.toLowerCase().endsWith(
                `.${defaultLanguage}.${FILE_EXT_MARKDOWN}`));
        if ( defaultLanguagePages.length === 0 ) {
            throw new Error('No markdown files found for the default ' + 
                `language '${defaultLanguage}' in ` + 
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
            if ( (fileName.match(/\./g) || []).length !== 2 ) {
                throw new Error(`The page markdown file '${pageMdFile}' ` +  
                    'must contain exactly two period characters in its ' + 
                    'filename which are used to separate the language code ' + 
                    `and file extension, for example 'page.en.md'.`); 
            }

        }

    }

}

export default ConfigValidator;
