/**
 * Language builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { getFiles, hasFileExtension, loadJsonFile } from 
    '../utils/io-utils.js';


class LanguageBuilder {

    constructor(config) {
        this.config = config;
    }

    aggregateLanguageData(language) {
        let data = {};
        const filenames = getFiles(
            `${this.config.system.build.siteDirs.languages}/${language}`);
        const jsonFilenames = filenames.filter(
            filename => hasFileExtension(filename, 'json'));
        for (const filename of jsonFilenames) {
            const languageData = loadJsonFile(
                this.config.system.build.siteDirs.languages + 
                    `/${language}/${filename}`);
            data = Object.assign({}, data, languageData);
        }
        return data;
    }

}

export default LanguageBuilder;
