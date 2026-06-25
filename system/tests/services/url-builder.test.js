/**
 * URL builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import { expect, test } from 'vitest';
import UrlBuilder from '../../src/services/url-builder.js';

test('URL segment is normalized', () => {
    expect(UrlBuilder.normalizeUrlSegment(' About Us ')).toBe('about-us');
});

test('URL segment collapses repeated whitespace to hyphen', () => {
    expect(UrlBuilder.normalizeUrlSegment('Blog   Posts')).toBe('blog-posts');
});

test('URL segment preserves non-whitespace punctuation', () => {
    expect(UrlBuilder.normalizeUrlSegment('Blog_Posts.2025!'))
        .toBe('blog_posts.2025!');
});

test('null URL segment normalizes to empty string', () => {
    expect(UrlBuilder.normalizeUrlSegment(null)).toBe('');
});

test('undefined URL segment normalizes to empty string', () => {
    expect(UrlBuilder.normalizeUrlSegment(undefined)).toBe('');
});

test('numeric URL segment is converted to string', () => {
    expect(UrlBuilder.normalizeUrlSegment(2025)).toBe('2025');
});

test('default language prefix is empty', () => {
    expect(UrlBuilder.generateLanguagePrefix('en', 'en')).toBe('');
});

test('non-default language prefix includes leading slash', () => {
    expect(UrlBuilder.generateLanguagePrefix('ja', 'en')).toBe('/ja');
});

test('language prefix comparison is strict', () => {
    expect(UrlBuilder.generateLanguagePrefix(1, '1')).toBe('/1');
});

test('home URL placeholder resolves to root for default language', () => {
    expect(UrlBuilder.resolveUrlPlaceholders(
        'en',
        'en',
        '${pages.urls.home}'
    )).toBe('/');
});

test('home URL placeholder resolves to localized root for non-default language',
    () => {
        expect(UrlBuilder.resolveUrlPlaceholders(
            'ja',
            'en',
            '${pages.urls.home}'
        )).toBe('/ja/');
    });

test('single URL placeholder resolves to normalized directory URL', () => {
    expect(UrlBuilder.resolveUrlPlaceholders(
        'en',
        'en',
        '${pages.urls.About Us}'
    )).toBe('/about-us/');
});

test('nested URL placeholder resolves to nested directory URL', () => {
    expect(UrlBuilder.resolveUrlPlaceholders(
        'en',
        'en',
        '${pages.urls.blog.Post One}'
    )).toBe('/blog/post-one/');
});

test('nested URL placeholder resolves with language prefix', () => {
    expect(UrlBuilder.resolveUrlPlaceholders(
        'zh-tw',
        'en',
        '${pages.urls.blog.Post One}'
    )).toBe('/zh-tw/blog/post-one/');
});

test('multiple URL placeholders are resolved in text', () => {
    const text = '<a href="${pages.urls.home}">Home</a>' +
        '<a href="${pages.urls.about}">About</a>';
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', text)).toBe(
        '<a href="/">Home</a><a href="/about/">About</a>');
});

test('duplicate URL placeholders are all replaced', () => {
    const text = '${pages.urls.about} ${pages.urls.about}';
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', text))
        .toBe('/about/ /about/');
});

test('non-page URL placeholders are ignored', () => {
    const text = '${config.urls.about} ${pages.urls.about}';
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', text))
        .toBe('${config.urls.about} /about/');
});

test('malformed URL placeholder is consumed up to the next closing brace', () => {
    const text = '${pages.urls.about ${pages.urls.blog}';
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', text))
        .toBe('/about-${pages/urls/blog/');
});

test('text without URL placeholders is returned unchanged', () => {
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', 'No placeholders'))
        .toBe('No placeholders');
});

test('null placeholder text resolves to empty string', () => {
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', null)).toBe('');
});

test('undefined placeholder text resolves to empty string', () => {
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', undefined)).toBe('');
});

test('numeric placeholder text is converted to string', () => {
    expect(UrlBuilder.resolveUrlPlaceholders('en', 'en', 123)).toBe('123');
});

test('plain objects are localizable URL objects', () => {
    expect(UrlBuilder.isLocalizableUrlObject({ about: '/about/' }))
        .toBe(true);
});

test('nested plain objects are localizable URL objects', () => {
    expect(UrlBuilder.isLocalizableUrlObject(Object.create(null))).toBe(true);
});

test('null is not a localizable URL object', () => {
    expect(UrlBuilder.isLocalizableUrlObject(null)).toBe(false);
});

test('arrays are not localizable URL objects', () => {
    expect(UrlBuilder.isLocalizableUrlObject(['/about/'])).toBe(false);
});

test('strings are not localizable URL objects', () => {
    expect(UrlBuilder.isLocalizableUrlObject('/about/')).toBe(false);
});

test('root-relative URL is local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl('/about/')).toBe(true);
});

test('root URL is local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl('/')).toBe(true);
});

test('protocol-relative URL is not local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl('//cdn.example.test/app.js'))
        .toBe(false);
});

test('absolute HTTPS URL is not local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl('https://example.test/about/'))
        .toBe(false);
});

test('relative URL without leading slash is not local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl('about/')).toBe(false);
});

test('non-string value is not local root-relative URL', () => {
    expect(UrlBuilder.isLocalRootRelativeUrl(null)).toBe(false);
    expect(UrlBuilder.isLocalRootRelativeUrl(123)).toBe(false);
});

test('root-relative URLs are localized for non-default language', () => {
    const urls = {
        home: '/',
        about: '/about/',
        blog: '/blog/'
    };
    expect(UrlBuilder.localizeUrls('ja', 'en', urls)).toBe(urls);
    expect(urls).toEqual({
        home: '/ja/',
        about: '/ja/about/',
        blog: '/ja/blog/'
    });
});

test('root-relative URLs are unchanged for default language', () => {
    const urls = {
        home: '/',
        about: '/about/'
    };
    UrlBuilder.localizeUrls('en', 'en', urls);
    expect(urls).toEqual({
        home: '/',
        about: '/about/'
    });
});

test('nested URL objects are localized recursively', () => {
    const urls = {
        pages: {
            home: '/',
            about: '/about/'
        },
        assets: '/assets/'
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls).toEqual({
        pages: {
            home: '/ja/',
            about: '/ja/about/'
        },
        assets: '/ja/assets/'
    });
});

test('deeply nested URL objects are localized recursively', () => {
    const urls = {
        footer: {
            links: {
                home: '/',
                contact: '/contact/'
            }
        }
    };
    UrlBuilder.localizeUrls('zh-tw', 'en', urls);
    expect(urls).toEqual({
        footer: {
            links: {
                home: '/zh-tw/',
                contact: '/zh-tw/contact/'
            }
        }
    });
});

test('external URLs are not localized', () => {
    const urls = {
        github: 'https://github.com',
        email: 'mailto:hello@example.test',
        phone: 'tel:123'
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls).toEqual({
        github: 'https://github.com',
        email: 'mailto:hello@example.test',
        phone: 'tel:123'
    });
});

test('protocol-relative URLs are not localized', () => {
    const urls = {
        cdn: '//cdn.example.test/app.js'
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls).toEqual({
        cdn: '//cdn.example.test/app.js'
    });
});

test('arrays are not localized recursively', () => {
    const links = [
        {
            url: '/about/'
        }
    ];
    const urls = {
        links
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls.links).toBe(links);
    expect(urls.links[0].url).toBe('/about/');
});

test('null nested values are ignored during localization', () => {
    const urls = {
        about: '/about/',
        missing: null
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls).toEqual({
        about: '/ja/about/',
        missing: null
    });
});

test('non-string primitive nested values are ignored during localization', () => {
    const urls = {
        enabled: true,
        count: 3,
        about: '/about/'
    };
    UrlBuilder.localizeUrls('ja', 'en', urls);
    expect(urls).toEqual({
        enabled: true,
        count: 3,
        about: '/ja/about/'
    });
});

test('localizeUrls throws for null root object', () => {
    expect(() => UrlBuilder.localizeUrls('ja', 'en', null)).toThrow();
});

test('localizeUrls handles empty object', () => {
    const urls = {};
    expect(UrlBuilder.localizeUrls('ja', 'en', urls)).toBe(urls);
    expect(urls).toEqual({});
});
