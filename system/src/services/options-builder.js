/**
 * Options builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import Options from '../entities/options.js';

// Available options.
const ENV_OPTION_KEY = '--env';
const DEFAULT_ENV = 'local';
const FLAGS = new Map([
    ['customCssOnly', '--custom-css-only'], 
    ['customJsOnly', '--custom-js-only'], 
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
    ['staticDistDirs', '--static-dist-dirs'], 
    ['verbose', '--verbose']
]);


class OptionsBuilder {

    constructor(userOptions) {
        this.userOptions = userOptions;
    }

    build() {

        // Environment.
        this.options = new Options(this.userOptions);
        const env = this.userOptions.includes(ENV_OPTION_KEY) ? 
            this.userOptions[1] : DEFAULT_ENV;
        this.options.setEnv(env);

        // Option flags.
        FLAGS.forEach((flag, key) => {
            this.options.setFlag(key, this.userOptions.includes(flag));
        });

        return this.options;
    
    }

}

export default OptionsBuilder;
