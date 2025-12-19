/**
 * Build cleaner service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { deleteSync } from 'del';
import { pathExists } from '../utils/io-utils.js';


class BuildCleaner {

    constructor(config) {
        this.config = config;
    }

    cleanDistDirectories() {

        if ( this.config.build.opts.customCssOnly || 
                this.config.build.opts.customJsOnly || 
                this.config.build.opts.ignoreAssets || 
                this.config.build.opts.ignoreCss || 
                this.config.build.opts.ignoreData || 
                this.config.build.opts.ignoreFonts || 
                this.config.build.opts.ignoreImages || 
                this.config.build.opts.ignoreJs || 
                this.config.build.opts.ignoreVideos ) {
    
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

    postErrorBuildCleanup() {
        if ( pathExists(this.config.build.distDirs.build) ) {
            deleteSync([`${this.config.build.distDirs.build}/**`], {
                dot: true, 
                force: true
            });
        }
        if ( pathExists(this.config.build.distDirs.base) ) {
            deleteSync([`${this.config.build.distDirs.base}/**`], {
                dot: true, 
                force: true
            });
        }
    }

}

export default BuildCleaner;
