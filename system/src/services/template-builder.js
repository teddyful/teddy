/**
 * Template builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import gulp from 'gulp';
import mustache from 'gulp-mustache';


class TemplateBuilder {

    constructor(config) {
        this.config = config;
    }

    async translateTemplates() {
        if ( !this.config.build.opts.ignoreHtml ) {
            for ( const language of this.config.site.languages.enabled ) {
                
                // Identify the path to the templates directory.
                const templatesDirAbsPath = 
                    this.config.system.themes + 
                        '/' + `${this.config.site.theme.name}/templates`;

                // Identify the path to the language data for this language.
                const languageDataFileAbsPath = 
                    this.config.build.distDirs.build + 
                        `/languages/${language}.json`;

                // Identify the path for the output HTML.
                const outputHtmlDirAbsPath = this.config.build.distDirs.build 
                    + `/templates/${language}`;

                // Inject the language data into the templates and generate
                // the output HTML.
                await new Promise((resolve, reject) => {
                    gulp.src([`${templatesDirAbsPath}/*.html`])
                        .pipe(mustache(languageDataFileAbsPath, {}, {}))
                        .pipe(mustache(languageDataFileAbsPath, {}, {}))
                        .pipe(gulp.dest(outputHtmlDirAbsPath))
                        .on('end', resolve);
                });
    
            }
        }
    }

}

export default TemplateBuilder;
