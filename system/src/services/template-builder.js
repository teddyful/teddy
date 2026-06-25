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

const DIR_LANGUAGES = 'languages';
const DIR_TEMPLATES = 'templates';
const EXT_HTML = 'html';

class TemplateBuilder {

    constructor(config) {
        this.config = config;
    }

    #getLanguageDataFilePath(language) {
        return path.join(
            this.config.build.distDirs.build,
            DIR_LANGUAGES,
            `${language}.json`
        );
    }

    #getOutputHtmlDirPath(language) {
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
                    gulp.src([this.#htmlTemplatesGlob(templatesDirAbsPath)])
                        .pipe(mustache(languageDataFileAbsPath, {}, {}))
                        .pipe(mustache(languageDataFileAbsPath, {}, {}))
                        .pipe(gulp.dest(outputHtmlDirAbsPath))
                        .on('end', resolve)
                        .on('error', reject);
                });
    
            }
        }
    }

}

export default TemplateBuilder;
