/**
 * Build cleaner service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { deleteSync } from 'del';
import path from 'path';
import { allDescendantsGlob, negatedGlob, assertSafeDeleteDirInsideBase, 
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

    #resolveSafeDeleteDir(dirPath, baseDirPath, label) {
        return assertSafeDeleteDirInsideBase(dirPath, baseDirPath, label);
    }

    #deleteDirectoryContents(dirPath, baseDirPath, label) {
        const safeDirPath = this.#resolveSafeDeleteDir(
            dirPath, baseDirPath, label);
        if ( pathExists(safeDirPath) ) {
            return deleteSync([
                allDescendantsGlob(safeDirPath)
            ], DELETE_OPTIONS);
        }
        return [];
    }

    cleanDistDirectories() {

        const buildRoot = path.dirname(this.config.build.distDirs.build);
        const baseRoot = path.dirname(this.config.build.distDirs.base);
        const buildDir = this.#resolveSafeDeleteDir(
            this.config.build.distDirs.build, buildRoot, 'Build directory');
        const baseDir = this.#resolveSafeDeleteDir(
            this.config.build.distDirs.base, baseRoot, 'Base directory');
        const assetsDir = this.#resolveSafeDeleteDir(
            this.config.build.distDirs.assets, baseDir, 'Assets directory');

        if ( this.#shouldPreserveAssets() ) {
    
                // Delete everything except the assets directory.
                return deleteSync([
                    allDescendantsGlob(buildDir), 
                    allDescendantsGlob(baseDir), 
                    negatedGlob(assetsDir), 
                    negatedGlob(allDescendantsGlob(assetsDir))
                ], DELETE_OPTIONS);
    
        } else {
    
            // Delete everything.
            return deleteSync([
                allDescendantsGlob(buildDir), 
                allDescendantsGlob(baseDir)
            ], DELETE_OPTIONS);
    
        }
    
    }

    postBuildCleanup() {
        const buildRoot = path.dirname(this.config.build.distDirs.build);
        const buildDir = this.#resolveSafeDeleteDir(
            this.config.build.distDirs.build, buildRoot, 'Build directory');
        if ( !this.config.build.opts.skipPostBuildCleanup && 
                !this.config.build.opts.generateDsPdf ) {
            return deleteSync([
                allDescendantsGlob(buildDir)
            ], DELETE_OPTIONS);
        }
    }

    postErrorBuildCleanup() {
        this.#deleteDirectoryContents(
            this.config.build.distDirs.build,
            path.dirname(this.config.build.distDirs.build),
            'Build directory');
        this.#deleteDirectoryContents(
            this.config.build.distDirs.base,
            path.dirname(this.config.build.distDirs.base),
            'Base directory');
    }

}

export default BuildCleaner;
