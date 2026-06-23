/**
 * Build cleaner service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { deleteSync } from 'del';
import { allFilesGlob, negatedGlob, assertSafeDeleteDir, 
    pathExists } from '../utils/io-utils.js';

const DELETE_OPTIONS = {
    dot: true,
    force: true
};

class BuildCleaner {

    constructor(config) {
        this.config = config;
    }

    #shouldPreserveAssets() {
        return this.config.build.opts.customCssOnly ||
            this.config.build.opts.customJsOnly ||
            this.config.build.opts.ignoreAssets ||
            this.config.build.opts.ignoreAudio ||
            this.config.build.opts.ignoreCss ||
            this.config.build.opts.ignoreData ||
            this.config.build.opts.ignoreFonts ||
            this.config.build.opts.ignoreImages ||
            this.config.build.opts.ignoreJs ||
            this.config.build.opts.ignoreVideos;
    }

    #deleteDirectoryContents(dirPath, label) {
        const safeDirPath = assertSafeDeleteDir(dirPath, label);
        if ( pathExists(safeDirPath) ) {
            return deleteSync([
                allFilesGlob(safeDirPath)
            ], DELETE_OPTIONS);
        }
        return [];
    }

    cleanDistDirectories() {

        const buildDir = assertSafeDeleteDir(
            this.config.build.distDirs.build, 'Build directory');
        const baseDir = assertSafeDeleteDir(
            this.config.build.distDirs.base, 'Base directory');
        const assetsDir = assertSafeDeleteDir(
            this.config.build.distDirs.assets, 'Assets directory');

        if ( this.#shouldPreserveAssets() ) {
    
                // Delete everything except the assets directory.
                return deleteSync([
                    allFilesGlob(buildDir), 
                    allFilesGlob(baseDir), 
                    negatedGlob(assetsDir), 
                    negatedGlob(allFilesGlob(assetsDir))
                ], DELETE_OPTIONS);
    
        } else {
    
            // Delete everything.
            return deleteSync([
                allFilesGlob(buildDir), 
                allFilesGlob(baseDir)
            ], DELETE_OPTIONS);
    
        }
    
    }

    postBuildCleanup() {
        const buildDir = assertSafeDeleteDir(
            this.config.build.distDirs.build, 'Build directory');
        if ( !this.config.build.opts.skipPostBuildCleanup && 
                !this.config.build.opts.generateDsPdf ) {
            return deleteSync([
                allFilesGlob(buildDir)
            ], DELETE_OPTIONS);
        }
    }

    postErrorBuildCleanup() {
        this.#deleteDirectoryContents(
            this.config.build.distDirs.build, 'Build directory');
        this.#deleteDirectoryContents(
            this.config.build.distDirs.base, 'Base directory');
    }

}

export default BuildCleaner;
