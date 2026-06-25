/**
 * Build setup service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import { createDirectory, resolvePathInsideBase } from '../utils/io-utils.js';

const DIR_CONFIG = 'config';
const DIR_LANGUAGES = 'languages';
const DIR_TEMPLATES = 'templates';

class BuildSetup {

    constructor(config) {
        this.config = config;
    }

    #assertDirectoryInsideBase(dirPath, baseDirPath, label) {
        return resolvePathInsideBase(
            path.relative(baseDirPath, dirPath),
            baseDirPath,
            label
        );
    }

    createDistDirectoryStructure() {
        const buildRoot = path.dirname(this.config.build.distDirs.build);
        const baseRoot = path.dirname(this.config.build.distDirs.base);
        const assetsRoot = path.dirname(this.config.build.distDirs.assets);
        const collectionRoot = path.dirname(this.config.build.distDirs.collection);
        this.#assertDirectoryInsideBase(
            this.config.build.distDirs.base,
            baseRoot,
            'base distribution directory'
        );
        this.#assertDirectoryInsideBase(
            this.config.build.distDirs.build,
            buildRoot,
            'build distribution directory'
        );
        this.#assertDirectoryInsideBase(
            path.join(this.config.build.distDirs.build, DIR_CONFIG),
            this.config.build.distDirs.build,
            'build config directory'
        );
        this.#assertDirectoryInsideBase(
            path.join(this.config.build.distDirs.build, DIR_LANGUAGES),
            this.config.build.distDirs.build,
            'build languages directory'
        );
        this.#assertDirectoryInsideBase(
            path.join(this.config.build.distDirs.build, DIR_TEMPLATES),
            this.config.build.distDirs.build,
            'build templates directory'
        );
        this.#assertDirectoryInsideBase(
            this.config.build.distDirs.assets,
            assetsRoot,
            'assets distribution directory'
        );
        this.#assertDirectoryInsideBase(
            this.config.build.distDirs.collection,
            collectionRoot,
            'collection distribution directory'
        );
        createDirectory(this.config.build.distDirs.base);
        createDirectory(this.config.build.distDirs.build);
        createDirectory(path.join(this.config.build.distDirs.build, DIR_CONFIG));
        createDirectory(path.join(this.config.build.distDirs.build, DIR_LANGUAGES));
        createDirectory(path.join(this.config.build.distDirs.build, DIR_TEMPLATES));
        createDirectory(this.config.build.distDirs.assets);
        createDirectory(this.config.build.distDirs.collection);
    }

    createBaseDistDirectory() {
        const baseRoot = path.dirname(this.config.build.distDirs.base);
        this.#assertDirectoryInsideBase(
            this.config.build.distDirs.base,
            baseRoot,
            'base distribution directory'
        );
        createDirectory(this.config.build.distDirs.base);
    }

}

export default BuildSetup;
