/**
 * Template builder service.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import path from 'path';
import gulp from 'gulp';
import mustache from 'gulp-mustache';
import { resolvePathInsideBase } from '../utils/io-utils.js';

const DIR_LANGUAGES = 'languages';
const DIR_TEMPLATES = 'templates';
const EXT_HTML = 'html';

class TemplateBuilder {

    constructor(config) {
        this.config = config;
    }

    #getLanguageDataFilePath(language) {
        resolvePathInsideBase(
            path.join(DIR_LANGUAGES, `${language}.json`),
            this.config.build.distDirs.build,
            `template language data file (${language})`
        );
        return path.join(
            this.config.build.distDirs.build,
            DIR_LANGUAGES,
            `${language}.json`
        );
    }

    #getOutputHtmlDirPath(language) {
        resolvePathInsideBase(
            path.join(DIR_TEMPLATES, language),
            this.config.build.distDirs.build,
            `translated template output directory (${language})`
        );
        return path.join(
            this.config.build.distDirs.build,
            DIR_TEMPLATES,
            language
        );
    }

    #htmlTemplatesGlob(templatesDirAbsPath) {
        return `${templatesDirAbsPath.replace(/\\/g, '/')}/*.${EXT_HTML}`;
    }

    async translateTemplates() {
        if ( !this.config.build.opts.ignoreHtml ) {

            // Identify the path to the templates directory.
            const templatesDirAbsPath = path.join(
                this.config.system.themes, 
                this.config.site.theme.name, 
                DIR_TEMPLATES);
            resolvePathInsideBase(
                path.join(this.config.site.theme.name, DIR_TEMPLATES),
                this.config.system.themes,
                'theme templates source directory'
            );

            for ( const language of this.config.site.languages.enabled ) {
                
                // Identify the path to the language data for this language.
                const languageDataFileAbsPath = this.#getLanguageDataFilePath(
                    language);

                // Identify the path for the output HTML.
                const outputHtmlDirAbsPath = this.#getOutputHtmlDirPath(
                    language);

                // Inject the language data into the templates and generate
                // the output HTML.
                await new Promise((resolve, reject) => {
                    const source = gulp.src([this.#htmlTemplatesGlob(templatesDirAbsPath)]);
                    const firstPass = source.pipe(mustache(languageDataFileAbsPath, {}, {}));
                    const secondPass = firstPass.pipe(mustache(languageDataFileAbsPath, {}, {}));
                    const destination = secondPass.pipe(gulp.dest(outputHtmlDirAbsPath));
                    source.on('error', reject);
                    firstPass.on('error', reject);
                    secondPass.on('error', reject);
                    destination.on('error', reject);
                    destination.on('end', resolve);
                });
    
            }
        }
    }

}

export default TemplateBuilder;
