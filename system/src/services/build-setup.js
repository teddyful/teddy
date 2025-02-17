/**
 * Build setup service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { createDirectory } from '../utils/io-utils.js';


class BuildSetup {

    constructor(config) {
        this.config = config;
    }

    createDistDirectoryStructure() {
        createDirectory(this.config.build.distDirs.base);
        createDirectory(this.config.build.distDirs.build);
        createDirectory(this.config.build.distDirs.build + '/config');
        createDirectory(this.config.build.distDirs.build + '/languages');
        createDirectory(this.config.build.distDirs.build + '/templates');
        createDirectory(this.config.build.distDirs.assets);
        createDirectory(this.config.build.distDirs.assets + '/collection');
    }

}

export default BuildSetup;
