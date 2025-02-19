/**
 * Options builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import Options from '../entities/options.js';

// Available options.
const SITE_NAME_OPTION_KEY = '--site-name';
const THEME_NAME_OPTION_KEY = '--theme-name';
const ENV_OPTION_KEY = '--env';
const DEFAULT_ENV = 'local';
const FLAGS = new Map([
    ['customCssOnly', '--custom-css-only'], 
    ['customJsOnly', '--custom-js-only'], 
    ['distUseBuildId', '--dist-use-build-id'], 
    ['ignoreAssets', '--ignore-assets'], 
    ['ignoreCollection', '--ignore-collection'], 
    ['ignoreCss', '--ignore-css'], 
    ['ignoreFonts', '--ignore-fonts'], 
    ['ignoreHtml', '--ignore-html'], 
    ['ignoreImages', '--ignore-images'], 
    ['ignoreJs', '--ignore-js'], 
    ['ignoreRobots', '--ignore-robots'], 
    ['ignoreSitemap', '--ignore-sitemap'], 
    ['ignoreWebConfig', '--ignore-web-config'], 
    ['skipPostBuildCleanup', '--skip-post-build-cleanup'], 
    ['verbose', '--verbose']
]);


class OptionsBuilder {

    constructor(args) {
        this.args = args;
    }

    build() {

        // Base options.
        this.options = new Options();

        // Site name.
        if ( !this.args.includes(SITE_NAME_OPTION_KEY) ) {
            throw new Error('The site name is missing. Please provide the ' + 
                'site name as a command line argument to the builder ' + 
                'application in the format --site-name [sitename], for ' + 
                'example: --site-name travelbook');
        }
        const siteNameOptionKeyIdx = this.args.indexOf(SITE_NAME_OPTION_KEY);
        this.options.setSiteName(this.args[siteNameOptionKeyIdx + 1]);

        // Theme name.
        if ( !this.args.includes(THEME_NAME_OPTION_KEY) ) {
            throw new Error('The theme name is missing. Please provide the ' + 
                'theme name as a command line argument to the builder ' + 
                'application in the format --theme-name [themename], for ' + 
                'example: --theme-name bear');
        }
        const themeNameOptionKeyIdx = this.args.indexOf(THEME_NAME_OPTION_KEY);
        this.options.setThemeName(this.args[themeNameOptionKeyIdx + 1]);

        // Environment.
        const envOptionKeyIdx = this.args.indexOf(ENV_OPTION_KEY);
        const env = this.args.includes(ENV_OPTION_KEY) ? 
            this.args[envOptionKeyIdx + 1] : DEFAULT_ENV;
        this.options.setEnv(env);

        // Option flags.
        FLAGS.forEach((flag, key) => {
            this.options.setFlag(key, this.args.includes(flag));
        });

        return this.options;
    
    }

}

export default OptionsBuilder;
