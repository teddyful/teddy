/**
 * URL builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } from 
    '../utils/regex-utils.js';

const PAGES_URLS_NAMESPACE = 'pages.urls';


class UrlBuilder {

    static resolveUrlPlaceholders(language, defaultLanguage, text) {
        const languagePrefix = UrlBuilder.generateLanguagePrefix(
            language, defaultLanguage);
        let resolvedText = structuredClone(text);
        const urlPlaceholders = getVarPlaceholders(text, PAGES_URLS_NAMESPACE);
        for ( const urlPlaceholder of urlPlaceholders ) {
            const dirs = getNestedKeysFromVarPlaceholder(
                urlPlaceholder, PAGES_URLS_NAMESPACE);
            const cleanDirs = dirs.map(dir => 
                dir.replace(/\s+/g, '-').toLowerCase());
            const url = cleanDirs.length == 1 && cleanDirs[0] == 'home' ? 
               `${languagePrefix}/` : 
               `${languagePrefix}/${cleanDirs.join('/')}`;
            resolvedText = resolvedText.replaceAll(urlPlaceholder, url);
        }
        return resolvedText;
    }

    static localizeUrls(language, defaultLanguage, urls) {
        const languagePrefix = UrlBuilder.generateLanguagePrefix(
            language, defaultLanguage);
        for ( const key in urls ) {
            if ( typeof urls[key] === 'object' ) {
                if ( !Array.isArray(urls[key]) ) {
                    this.localizeUrls(languagePrefix, urls[key]);
                }
            } else {
                const url = urls[key];
                if ( url.startsWith('/') )
                    urls[key] = `${languagePrefix}${url}`;
            }
        }
    }

    static generateLanguagePrefix(language, defaultLanguage) {
        return language == defaultLanguage ? '' : `/${language}`;
    }

}

export default UrlBuilder;
