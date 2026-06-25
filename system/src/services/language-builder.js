/**
 * Language builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import { getFiles, hasFileExtension, loadJsonFile } from 
    '../utils/io-utils.js';

const EXT_JSON = 'json';

class LanguageBuilder {

    constructor(config) {
        this.config = config;
    }

    #getLanguageDirPath(language) {
        return path.join(
            this.config.system.build.siteDirs.languages,
            language
        );
    }

    #getLanguageDataFilePath(language, jsonFile) {
        return path.join(
            this.#getLanguageDirPath(language),
            jsonFile
        );
    }

    #assertLanguageDataObject(languageData, language, jsonFile) {
        if ( languageData === null
            || Array.isArray(languageData)
            || typeof languageData !== 'object' ) {
            throw new Error(
                `Invalid language data in '${jsonFile}' for language ` +
                `'${language}'. Expected a JSON object.`
            );
        }
    }

    #assertNoDuplicateTopLevelKeys(data, languageData, language, file) {
        for ( const key of Object.keys(languageData) ) {
            if ( Object.hasOwn(data, key) ) {
                throw new Error(
                    `Duplicate top-level language data key '${key}' in ` +
                    `'${file}' for language '${language}'.`
                );
            }
        }
    }

    #mergeLanguageData(data, languageData) {
        // Language JSON files define distinct top-level objects. 
        // Keep this shallow so duplicate top-level keys remain visible 
        // to the duplicate-key guard.
        Object.assign(data, languageData);
    }

    aggregateLanguageData(language) {
        let data = {};
        const languageFiles = getFiles(this.#getLanguageDirPath(language));
        const jsonFiles = languageFiles.filter(
            languageFile => hasFileExtension(languageFile, EXT_JSON));
        for (const jsonFile of jsonFiles) {
            try {
                const languageData = loadJsonFile(
                this.#getLanguageDataFilePath(language, jsonFile));
                this.#assertLanguageDataObject(
                    languageData, language, jsonFile);
                this.#assertNoDuplicateTopLevelKeys(
                    data, languageData, language, jsonFile);
                this.#mergeLanguageData(data, languageData);
            } catch (error) {
                throw new Error(
                    `Failed to aggregate language data from '${jsonFile}' ` +
                    `for language '${language}'.`, { cause: error });
            }
        }
        return data;
    }

}

export default LanguageBuilder;
