/**
 * Build cleaner service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { deleteSync } from 'del';


class BuildCleaner {

    constructor(config) {
        this.config = config;
    }

    cleanDistDirectories() {

        if ( this.config.build.opts.customCssOnly || 
                this.config.build.opts.customJsOnly || 
                this.config.build.opts.ignoreAssets || 
                this.config.build.opts.ignoreCss || 
                this.config.build.opts.ignoreFonts || 
                this.config.build.opts.ignoreImages || 
                this.config.build.opts.ignoreJs ) {
    
                // Delete everything except the assets directory.
                return deleteSync([
                    `${this.config.build.distDirs.build}/**`, 
                    `${this.config.build.distDirs.base}/**`, 
                    `!${this.config.build.distDirs.base}/assets`], {
                        dot: true, 
                        force: true
                    });
    
        } else {
    
            // Delete everything.
            return deleteSync([
                `${this.config.build.distDirs.build}/**`, 
                `${this.config.build.distDirs.base}/**`], {
                dot: true, 
                force: true
            });
    
        }
    
    }

    postBuildCleanup() {
        if ( !this.config.build.opts.skipPostBuildCleanup ) {
            return deleteSync([
                `${this.config.build.distDirs.build}/**`], {
                    dot: true, 
                    force: true
                });
        }
    }

}

export default BuildCleaner;
