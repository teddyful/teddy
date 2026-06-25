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

    #assertDirectoryPath(dirPath, label) {
        resolvePathInsideBase(
            path.basename(dirPath),
            path.dirname(dirPath),
            label
        );
    }

    createDistDirectoryStructure() {
        this.#assertDirectoryPath(
            this.config.build.distDirs.base,
            'base distribution directory'
        );
        this.#assertDirectoryPath(
            this.config.build.distDirs.build,
            'build distribution directory'
        );
        resolvePathInsideBase(
            DIR_CONFIG,
            this.config.build.distDirs.build,
            'build config directory'
        );
        resolvePathInsideBase(
            DIR_LANGUAGES,
            this.config.build.distDirs.build,
            'build languages directory'
        );
        resolvePathInsideBase(
            DIR_TEMPLATES,
            this.config.build.distDirs.build,
            'build templates directory'
        );
        this.#assertDirectoryPath(
            this.config.build.distDirs.assets,
            'assets distribution directory'
        );
        this.#assertDirectoryPath(
            this.config.build.distDirs.collection,
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
        this.#assertDirectoryPath(
            this.config.build.distDirs.base,
            'base distribution directory'
        );
        createDirectory(this.config.build.distDirs.base);
    }

}

export default BuildSetup;
