/**
 * URL builder service.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } from 
    '../utils/regex-utils.js';

const HOME_PAGE_KEY = 'home';
const PAGES_URLS_NAMESPACE = 'pages.urls';
const URL_PATH_SEPARATOR = '/';

class UrlBuilder {

    static normalizeUrlSegment(segment) {
        return String(segment ?? '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    static resolveUrlPlaceholders(language, defaultLanguage, text) {
        const languagePrefix = UrlBuilder.generateLanguagePrefix(
            language, defaultLanguage);
        let resolvedText = String(text ?? '');
        const urlPlaceholders = getVarPlaceholders(text, PAGES_URLS_NAMESPACE);
        for ( const urlPlaceholder of urlPlaceholders ) {
            const dirs = getNestedKeysFromVarPlaceholder(
                urlPlaceholder, PAGES_URLS_NAMESPACE);
            const cleanDirs = dirs.map(
                dir => UrlBuilder.normalizeUrlSegment(dir));
            const url = cleanDirs.length === 1 && 
                cleanDirs[0] === HOME_PAGE_KEY ? 
               `${languagePrefix}/` : 
               `${languagePrefix}/${cleanDirs.join(URL_PATH_SEPARATOR)}/`;
            resolvedText = resolvedText.replaceAll(urlPlaceholder, url);
        }
        return resolvedText;
    }

    static isLocalizableUrlObject(value) {
        return value !== null
            && typeof value === 'object'
            && !Array.isArray(value);
    }

    static isLocalRootRelativeUrl(value) {
        return typeof value === 'string' && 
            value.startsWith(URL_PATH_SEPARATOR) && 
            !value.startsWith('//');
    }

    static localizeUrls(language, defaultLanguage, urls) {
        const languagePrefix = UrlBuilder.generateLanguagePrefix(
            language, defaultLanguage);
        for ( const [key, value] of Object.entries(urls) ) {
            if ( UrlBuilder.isLocalizableUrlObject(value) ) {
                this.localizeUrls(language, defaultLanguage, value);
            } else if ( UrlBuilder.isLocalRootRelativeUrl(value) ) {
                urls[key] = `${languagePrefix}${value}`;
            }
        }
        return urls;
    }

    static generateLanguagePrefix(language, defaultLanguage) {
        return language === defaultLanguage ? '' : `/${language}`;
    }

}

export default UrlBuilder;
