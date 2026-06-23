/**
 * Build setup service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import path from 'path';
import { createDirectory } from '../utils/io-utils.js';

const DIR_CONFIG = 'config';
const DIR_LANGUAGES = 'languages';
const DIR_TEMPLATES = 'templates';

class BuildSetup {

    constructor(config) {
        this.config = config;
    }

    createDistDirectoryStructure() {
        createDirectory(this.config.build.distDirs.base);
        createDirectory(this.config.build.distDirs.build);
        createDirectory(path.join(this.config.build.distDirs.build, DIR_CONFIG));
        createDirectory(path.join(this.config.build.distDirs.build, DIR_LANGUAGES));
        createDirectory(path.join(this.config.build.distDirs.build, DIR_TEMPLATES));
        createDirectory(this.config.build.distDirs.assets);
        createDirectory(this.config.build.distDirs.collection);
    }

    createBaseDistDirectory() {
        createDirectory(this.config.build.distDirs.base);
    }

}

export default BuildSetup;
