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

        if ( this.config.build.flags.customCssOnly || 
                this.config.build.flags.customJsOnly || 
                this.config.build.flags.ignoreAssets || 
                this.config.build.flags.ignoreCss || 
                this.config.build.flags.ignoreFonts || 
                this.config.build.flags.ignoreImages || 
                this.config.build.flags.ignoreJs ) {
    
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
        if ( !this.config.build.flags.skipPostBuildCleanup ) {
            return deleteSync([
                `${this.config.build.distDirs.build}/**`], {
                    dot: true, 
                    force: true
                });
        }
    }

}

export default BuildCleaner;
