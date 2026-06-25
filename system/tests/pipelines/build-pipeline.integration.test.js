/**
 * Build pipeline integration tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import fs from 'fs';
import path from 'path';
import FlexSearch from 'flexsearch';
import { beforeAll, describe, expect, test } from 'vitest';

import BuildPipeline from '../../src/pipelines/build-pipeline.js';
import { ISO_639_3166_LOOKUP, CJK_ISO_3166, cjkTokenizer } 
    from '../../src/utils/lang-utils.js';

const opts = {
    env: 'local',
    customCssOnly: false,
    customJsOnly: false,
    generateDsPdf: false,
    ignoreAssets: false,
    ignoreAudio: false,
    ignoreCollection: false,
    ignoreCss: false,
    ignoreData: false,
    ignoreFonts: false,
    ignoreHtml: false,
    ignoreImages: false,
    ignoreJs: false,
    ignoreRobots: false,
    ignoreSitemap: false,
    ignoreVideos: false,
    ignoreWebConfig: false,
    minifyCss: false,
    minifyHtml: false,
    minifyJs: false,
    skipPostBuildCleanup: true,
    versionAssetsBuildId: false,
    versionAssetsSiteNumber: false,
    versionBuildDate: false,
    versionCollectionBuildId: false,
    versionCollectionSiteNumber: false,
    versionSiteConfigBuildId: false,
    versionSiteConfigSiteNumber: false,
    siteName: 'travelbook',
    themeName: 'bear'
}

const packageConfig = JSON.parse(fs.readFileSync(`./package.json`, 'utf8'));
const packageVersion = packageConfig.version;
const siteConfig = JSON.parse(fs.readFileSync(`./sites/${opts.siteName}/site.json`, 'utf8'));
const siteVersion = siteConfig.site.version;
const publicDirectory = `./sites/${opts.siteName}/public/${opts.env}`;
const publicResources = [
    'build.json', 
    'favicon.ico', 
    'index.html', 
    'robots.txt', 
    'sitemap.xml', 
    'about/index.html', 
    `assets/collection/en/1.doc.json`, 
    `assets/collection/en/1.reg.json`, 
    `assets/collection/en/1.tag.json`, 
    `assets/collection/en/content.1.map.json`, 
    `assets/collection/en/description.1.map.json`, 
    `assets/collection/en/name.1.map.json`, 
    `assets/collection/ja/1.doc.json`, 
    `assets/collection/ja/1.reg.json`, 
    `assets/collection/ja/1.tag.json`, 
    `assets/collection/ja/content.1.map.json`, 
    `assets/collection/ja/description.1.map.json`, 
    `assets/collection/ja/name.1.map.json`, 
    `assets/collection/zh-tw/1.doc.json`, 
    `assets/collection/zh-tw/1.reg.json`, 
    `assets/collection/zh-tw/1.tag.json`, 
    `assets/collection/zh-tw/content.1.map.json`, 
    `assets/collection/zh-tw/description.1.map.json`, 
    `assets/collection/zh-tw/name.1.map.json`, 
    `assets/css/style.css`, 
    `assets/css/vendors/bootstrap/5.3.8/bootstrap.min.css`, 
    `assets/css/vendors/fontawesome/6.7.2/all.min.css`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-brands-400.ttf`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-brands-400.woff2`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-regular-400.ttf`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-regular-400.woff2`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-solid-900.ttf`, 
    `assets/fonts/vendors/fontawesome/6.7.2/fa-solid-900.woff2`, 
    `assets/images/contributors/author.jpg`, 
    `assets/images/favicon/favicon.ico`, 
    `assets/images/logo/logo.png`, 
    `assets/images/opengraph/opengraph-default.jpg`, 
    `assets/js/blog.js`, 
    `assets/js/site/config.js`, 
    `assets/js/site/site.js`, 
    `assets/js/vendors/bootstrap/5.3.8/bootstrap.bundle.min.js`, 
    `assets/js/vendors/flexsearch/0.8.212/flexsearch.bundle.min.js`, 
    `assets/js/vendors/mithril/2.3.8/mithril.min.js`, 
    `assets/js/vendors/teddy/${packageVersion}/lang.js`, 
    `assets/js/vendors/teddy/${packageVersion}/search.js`, 
    'blog/index.html', 
    'blog/africa/kenya/index.html', 
    'blog/africa/kenya/assets/savannah.jpg', 
    'blog/africa/namibia/index.html', 
    'blog/africa/namibia/assets/desert.jpg', 
    'blog/africa/tanzania/index.html', 
    'blog/africa/tanzania/assets/serengeti.jpg', 
    'blog/africa/zambia/index.html', 
    'blog/africa/zambia/assets/victoria-falls.jpg', 
    'blog/asia/hong-kong/index.html', 
    'blog/asia/hong-kong/assets/hk.jpg', 
    'blog/asia/japan/index.html', 
    'blog/asia/japan/assets/kyoto.jpg', 
    'blog/asia/malaysia/index.html', 
    'blog/asia/malaysia/assets/kuala-lumpur.jpg', 
    'blog/asia/singapore/index.html', 
    'blog/asia/singapore/assets/singapore.jpg', 
    'blog/australia/new-zealand/index.html', 
    'blog/australia/new-zealand/assets/hobbiton.jpg', 
    'blog/europe/finland/index.html', 
    'blog/europe/finland/assets/northern-lights.jpg', 
    'blog/europe/norway/index.html', 
    'blog/europe/norway/assets/viking-ship.jpg', 
    'blog/north-america/canada/index.html', 
    'blog/north-america/canada/assets/niagara-falls.jpg', 
    'blog/south-america/bolivia/index.html', 
    'blog/south-america/bolivia/assets/uyuni-salt-flats.jpg', 
    'blog/south-america/chile/index.html', 
    'blog/south-america/chile/assets/santiago.jpg', 
    'blog/south-america/peru/index.html', 
    'blog/south-america/peru/assets/machu-picchu.jpg', 
    'en/index.html', 
    'en/about/index.html', 
    'en/blog/index.html', 
    'en/blog/africa/kenya/index.html', 
    'en/blog/africa/kenya/assets/savannah.jpg', 
    'en/blog/africa/namibia/index.html', 
    'en/blog/africa/namibia/assets/desert.jpg', 
    'en/blog/africa/tanzania/index.html', 
    'en/blog/africa/tanzania/assets/serengeti.jpg', 
    'en/blog/africa/zambia/index.html', 
    'en/blog/africa/zambia/assets/victoria-falls.jpg', 
    'en/blog/asia/hong-kong/index.html', 
    'en/blog/asia/hong-kong/assets/hk.jpg', 
    'en/blog/asia/japan/index.html', 
    'en/blog/asia/japan/assets/kyoto.jpg', 
    'en/blog/asia/malaysia/index.html', 
    'en/blog/asia/malaysia/assets/kuala-lumpur.jpg', 
    'en/blog/asia/singapore/index.html', 
    'en/blog/asia/singapore/assets/singapore.jpg', 
    'en/blog/australia/new-zealand/index.html', 
    'en/blog/australia/new-zealand/assets/hobbiton.jpg', 
    'en/blog/europe/finland/index.html', 
    'en/blog/europe/finland/assets/northern-lights.jpg', 
    'en/blog/europe/norway/index.html', 
    'en/blog/europe/norway/assets/viking-ship.jpg', 
    'en/blog/north-america/canada/index.html', 
    'en/blog/north-america/canada/assets/niagara-falls.jpg', 
    'en/blog/south-america/bolivia/index.html', 
    'en/blog/south-america/bolivia/assets/uyuni-salt-flats.jpg', 
    'en/blog/south-america/chile/index.html', 
    'en/blog/south-america/chile/assets/santiago.jpg', 
    'en/blog/south-america/peru/index.html', 
    'en/blog/south-america/peru/assets/machu-picchu.jpg', 
    'ja/index.html', 
    'ja/about/index.html', 
    'ja/blog/index.html', 
    'ja/blog/africa/kenya/index.html', 
    'ja/blog/africa/kenya/assets/savannah.jpg', 
    'ja/blog/africa/namibia/index.html', 
    'ja/blog/africa/namibia/assets/desert.jpg', 
    'ja/blog/africa/tanzania/index.html', 
    'ja/blog/africa/tanzania/assets/serengeti.jpg', 
    'ja/blog/africa/zambia/index.html', 
    'ja/blog/africa/zambia/assets/victoria-falls.jpg', 
    'ja/blog/asia/hong-kong/index.html', 
    'ja/blog/asia/hong-kong/assets/hk.jpg', 
    'ja/blog/asia/japan/index.html', 
    'ja/blog/asia/japan/assets/kyoto.jpg', 
    'ja/blog/asia/malaysia/index.html', 
    'ja/blog/asia/malaysia/assets/kuala-lumpur.jpg', 
    'ja/blog/asia/singapore/index.html', 
    'ja/blog/asia/singapore/assets/singapore.jpg', 
    'ja/blog/australia/new-zealand/index.html', 
    'ja/blog/australia/new-zealand/assets/hobbiton.jpg', 
    'ja/blog/europe/finland/index.html', 
    'ja/blog/europe/finland/assets/northern-lights.jpg', 
    'ja/blog/europe/norway/index.html', 
    'ja/blog/europe/norway/assets/viking-ship.jpg', 
    'ja/blog/north-america/canada/index.html', 
    'ja/blog/north-america/canada/assets/niagara-falls.jpg', 
    'ja/blog/south-america/bolivia/index.html', 
    'ja/blog/south-america/bolivia/assets/uyuni-salt-flats.jpg', 
    'ja/blog/south-america/chile/index.html', 
    'ja/blog/south-america/chile/assets/santiago.jpg', 
    'ja/blog/south-america/peru/index.html', 
    'ja/blog/south-america/peru/assets/machu-picchu.jpg', 
    'zh-tw/index.html', 
    'zh-tw/about/index.html', 
    'zh-tw/blog/index.html', 
    'zh-tw/blog/africa/kenya/index.html', 
    'zh-tw/blog/africa/kenya/assets/savannah.jpg', 
    'zh-tw/blog/africa/namibia/index.html', 
    'zh-tw/blog/africa/namibia/assets/desert.jpg', 
    'zh-tw/blog/africa/tanzania/index.html', 
    'zh-tw/blog/africa/tanzania/assets/serengeti.jpg', 
    'zh-tw/blog/africa/zambia/index.html', 
    'zh-tw/blog/africa/zambia/assets/victoria-falls.jpg', 
    'zh-tw/blog/asia/hong-kong/index.html', 
    'zh-tw/blog/asia/hong-kong/assets/hk.jpg', 
    'zh-tw/blog/asia/japan/index.html', 
    'zh-tw/blog/asia/japan/assets/kyoto.jpg', 
    'zh-tw/blog/asia/malaysia/index.html', 
    'zh-tw/blog/asia/malaysia/assets/kuala-lumpur.jpg', 
    'zh-tw/blog/asia/singapore/index.html', 
    'zh-tw/blog/asia/singapore/assets/singapore.jpg', 
    'zh-tw/blog/australia/new-zealand/index.html', 
    'zh-tw/blog/australia/new-zealand/assets/hobbiton.jpg', 
    'zh-tw/blog/europe/finland/index.html', 
    'zh-tw/blog/europe/finland/assets/northern-lights.jpg', 
    'zh-tw/blog/europe/norway/index.html', 
    'zh-tw/blog/europe/norway/assets/viking-ship.jpg', 
    'zh-tw/blog/north-america/canada/index.html', 
    'zh-tw/blog/north-america/canada/assets/niagara-falls.jpg', 
    'zh-tw/blog/south-america/bolivia/index.html', 
    'zh-tw/blog/south-america/bolivia/assets/uyuni-salt-flats.jpg', 
    'zh-tw/blog/south-america/chile/index.html', 
    'zh-tw/blog/south-america/chile/assets/santiago.jpg', 
    'zh-tw/blog/south-america/peru/index.html', 
    'zh-tw/blog/south-america/peru/assets/machu-picchu.jpg'
];
const buildDirectory = 
    `./sites/${opts.siteName}/build/${opts.env}/${siteVersion}`;
const buildResources = [
    'config/config.json', 
    'languages/en.json', 
    'languages/ja.json', 
    'languages/zh-tw.json', 
    'templates/en/about.html', 
    'templates/en/blog.html', 
    'templates/en/page.html', 
    'templates/en/post.html', 
    'templates/ja/about.html', 
    'templates/ja/blog.html', 
    'templates/ja/page.html', 
    'templates/ja/post.html', 
    'templates/zh-tw/about.html', 
    'templates/zh-tw/blog.html', 
    'templates/zh-tw/page.html', 
    'templates/zh-tw/post.html'
];

let buildPipeline = null;
let index = null;
const LANGUAGE = 'en';
const LANGUAGE_INDEX_KEYS = {
    "en": [
        "1.doc", 
        "1.reg", 
        "1.tag", 
        "content.1.map", 
        "description.1.map", 
        "name.1.map", 
    ]
};
const LANGUAGES = ['en', 'ja', 'zh-tw'];
const INDEX_KEYS = [
    '1.doc',
    '1.reg',
    '1.tag',
    'content.1.map',
    'description.1.map',
    'name.1.map'
];

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
    return JSON.parse(readFile(filePath));
}

function getPublicPath(resource) {
    return `${publicDirectory}/${resource}`;
}

function getBuildPath(resource) {
    return `${buildDirectory}/${resource}`;
}

async function importLanguageIndex(language) {
    const config = readJson(getBuildPath('config/config.json'));
    const documentStoreConfig = structuredClone(
        config.site.collection.index.documentStore);
    documentStoreConfig.language = language in ISO_639_3166_LOOKUP ?
        ISO_639_3166_LOOKUP[language] : language;
    if ( CJK_ISO_3166.includes(documentStoreConfig.language) ) {
        documentStoreConfig.encode = cjkTokenizer;
    }
    const languageIndex = new FlexSearch.Document(documentStoreConfig);
    const documentStorePath = getPublicPath(`assets/collection/${language}`);
    for ( const key of INDEX_KEYS ) {
        const json = readJson(`${documentStorePath}/${key}.json`);
        await languageIndex.import(key, json ?? null);
    }
    return languageIndex;
}

function getTagEntry(language, tag) {
    const tagIndex = readJson(
        getPublicPath(`assets/collection/${language}/1.tag.json`));
    const tagsEntry = tagIndex.find(([key]) => key === 'tags');
    return tagsEntry[1].find(([entryTag]) => entryTag === tag);
}

describe('static site', () => {

    beforeAll(async () => {
        buildPipeline = new BuildPipeline(opts);
        await buildPipeline.build();
    });

    test('pipeline exits successfully', () => {
        expect(buildPipeline.statusCode).toBe(0);
    });

    test('demo TravelBook site resources exist', () => {
        const publicResourcePaths = publicResources.map(
            resource => `${publicDirectory}/${resource}`);
        const buildResourcePaths = buildResources.map(
            resource => `${buildDirectory}/${resource}`);
        const resources = publicResourcePaths.concat(buildResourcePaths);
        for ( const resource of resources ) {
            expect(fs.existsSync(resource)).toBe(true);
        }
    });

    test('build metadata contains expected site information', () => {
        expect(readJson(`${publicDirectory}/build.json`)).toEqual({
            id: expect.any(String),
            date: expect.any(String),
            site: {
                name: siteConfig.site.name,
                version: siteConfig.site.version
            }
        });
    });

    test('generated build config JavaScript contains client runtime constants',
        () => {
            const configJs = readFile(
                `${publicDirectory}/assets/js/site/config.js`);
            expect(configJs).toContain('const ASSETS_BASE_URL = "/assets";');
            expect(configJs).toContain(
                'const COLLECTION_INDEX_BASE_URL = "/assets/collection";');
            expect(configJs).toContain('const DEFAULT_LANGUAGE = "en";');
            expect(configJs).toContain('const LANGUAGE_INDEX_KEYS = ');
            expect(configJs).toContain(`const SITE_VERSION = "${siteVersion}";`);
        });

    test('generated site JavaScript strips heavy collection page data', () => {
        const siteJs = readFile(`${publicDirectory}/assets/js/site/site.js`);
        expect(siteJs).toContain('const site = ');
        expect(siteJs).toContain('"metadata"');
        expect(siteJs).toContain('"content"');
        expect(siteJs).toContain('"collection"');
        expect(siteJs).toContain('"size"');
        expect(siteJs).not.toContain('"pages"');
    });

    test('localized page output contains localized URLs', () => {
        const englishAboutHtml = readFile(`${publicDirectory}/en/about/index.html`);
        const japaneseAboutHtml = readFile(`${publicDirectory}/ja/about/index.html`);
        const chineseAboutHtml = readFile(`${publicDirectory}/zh-tw/about/index.html`);
        expect(englishAboutHtml).toContain('href="/about/"');
        expect(japaneseAboutHtml).toContain('href="/ja/about/"');
        expect(chineseAboutHtml).toContain('href="/zh-tw/about/"');
    });

    test('default language pages are deployed to the public root', () => {
        expect(readFile(`${publicDirectory}/index.html`))
            .toBe(readFile(`${publicDirectory}/en/index.html`));
        expect(readFile(`${publicDirectory}/about/index.html`))
            .toBe(readFile(`${publicDirectory}/en/about/index.html`));
        expect(readFile(`${publicDirectory}/blog/index.html`))
            .toBe(readFile(`${publicDirectory}/en/blog/index.html`));
    });

    test('generated page HTML includes metadata and page language injection', () => {
        const html = readFile(
            `${publicDirectory}/en/blog/europe/norway/index.html`);
        expect(html).toContain('<meta name="description"');
        expect(html).toContain('<meta property="og:title"');
        expect(html).toContain('<meta property="og:type" content="article"/>');
        expect(html).toContain("<script>const PAGE_LANGUAGE = 'en';</script>");
    });

    test('deployed language JSON contains collection metadata', () => {
        const languageData = readJson(`${buildDirectory}/languages/en.json`);
        const collectionMetadata = languageData.collection.metadata;
        const europeCategory = collectionMetadata.categories.find(category =>
            category.id === 'europe');
        expect(collectionMetadata.size).toBe(15);
        expect(collectionMetadata.pages.head.length).toBe(
            siteConfig.site.collection.pagination.size);
        expect(europeCategory).toEqual({
            id: 'europe',
            name: 'Europe',
            count: 2
        });
    });

    test('generated config JSON contains expected build contract', () => {
        const config = readJson(getBuildPath('config/config.json'));
        expect(config.build.env).toBe(opts.env);
        expect(path.normalize(config.build.distDirs.base))
            .toBe(path.normalize(publicDirectory));
        expect(path.normalize(config.build.distDirs.build))
            .toBe(path.normalize(buildDirectory));
        expect(path.normalize(config.build.distDirs.assets))
            .toBe(path.normalize(getPublicPath('assets')));
        expect(path.normalize(config.build.distDirs.collection))
            .toBe(path.normalize(getPublicPath('assets/collection')));
        expect(path.normalize(config.build.distDirs.siteConfig))
            .toBe(path.normalize(getPublicPath('assets/js/site')));
        expect(config.site.languages.default).toBe('en');
        expect(config.site.urls.assets).toBe('/assets');
        expect(config.site.urls.collection).toBe('/blog');
        expect(config.site.urls.collectionIndex).toBe('/assets/collection');
        expect(config.site.urls.siteConfig).toBe('/assets/js/site');
        expect(config.site.web.baseUrl).toBe('http://localhost:8080');
        expect(config.site.collection.sizes).toEqual({
            en: 15,
            ja: 15,
            'zh-tw': 15
        });
    });

    test('generated language data contains required runtime namespaces', () => {
        for ( const language of LANGUAGES ) {
            const languageData = readJson(getBuildPath(`languages/${language}.json`));
            expect(languageData.metadata).toBeDefined();
            expect(languageData.contributors).toBeDefined();
            expect(languageData.taxonomy).toBeDefined();
            expect(languageData.urls).toBeDefined();
            expect(languageData.assets.minify).toEqual({
                css: opts.minifyCss,
                html: opts.minifyHtml,
                js: opts.minifyJs
            });
            expect(languageData.site).toEqual({
                name: siteConfig.site.name,
                version: siteConfig.site.version
            });
            expect(languageData.collection.metadata).toBeDefined();
        }
    });

    test('collection metadata sizes match site collection sizes', () => {
        const config = readJson(getBuildPath('config/config.json'));
        for ( const language of LANGUAGES ) {
            const languageData = readJson(getBuildPath(`languages/${language}.json`));
            expect(languageData.collection.metadata.size)
                .toBe(config.site.collection.sizes[language]);
        }
    });

    test('collection head pagination matches configured pagination size', () => {
        const config = readJson(getBuildPath('config/config.json'));
        const paginationSize = config.site.collection.pagination.size;
        for ( const language of LANGUAGES ) {
            const languageData = readJson(getBuildPath(`languages/${language}.json`));
            expect(languageData.collection.metadata.pages.head.length)
                .toBe(paginationSize);
        }
    });

    test('collection category counts are generated for all languages', () => {
        const expectedCounts = {
            africa: 4,
            asia: 4,
            australia: 1,
            europe: 2,
            'north-america': 1,
            'south-america': 3
        };
        for ( const language of LANGUAGES ) {
            const languageData = readJson(getBuildPath(`languages/${language}.json`));
            const categories = languageData.collection.metadata.categories;
            for ( const [categoryId, count] of Object.entries(expectedCounts) ) {
                const category = categories.find(item => item.id === categoryId);
                expect(category.count).toBe(count);
            }
        }
    });

    test('generated build config JavaScript contains collection runtime values',
        () => {
            const configJs = readFile(getPublicPath('assets/js/site/config.js'));
            expect(configJs).toContain('const COLLECTION_PAGINATION_SIZE = 10;');
            expect(configJs).toContain(
                'const COLLECTION_SIZES = {"en":15,"ja":15,"zh-tw":15};');
            expect(configJs).toContain(
                'const DOMAIN_NAME = "localhost:8080";');
            expect(configJs).toContain(
                'const MIN_SEARCH_QUERY_LENGTH = 2;');
            expect(configJs).toContain(
                'const INDEX_DOCUMENT_STORE_CONFIG = ' +
                '{"document":{"id":"id","tag":"tags","index":["name",' +
                '"description","content"],"store":true}};'
            );
        });

    test('generated site JavaScript contains all enabled languages', () => {
        const siteJs = readFile(getPublicPath('assets/js/site/site.js'));
        expect(siteJs).toContain('"en"');
        expect(siteJs).toContain('"ja"');
        expect(siteJs).toContain('"zh-tw"');
        expect(siteJs).not.toContain('"pages":{"head"');
    });

    test('generated HTML contains system asset injection', () => {
        const html = readFile(getPublicPath('en/blog/europe/norway/index.html'));
        expect(html).toContain(
            '/assets/js/vendors/flexsearch/0.8.212/flexsearch.bundle.min.js');
        expect(html).toContain(
            `/assets/js/vendors/teddy/${packageVersion}/lang.js`);
        expect(html).toContain(
            `/assets/js/vendors/teddy/${packageVersion}/search.js`);
        expect(html).toContain('/assets/js/site/config.js');
        expect(html).toContain('/assets/js/site/site.js');
    });

    test('generated HTML contains expected Open Graph article metadata', () => {
        const html = readFile(getPublicPath('en/blog/europe/norway/index.html'));
        expect(html).toContain('<meta name="description"');
        expect(html).toContain('<meta name="keywords"');
        expect(html).toContain('<meta property="og:image"');
        expect(html).toContain('<meta property="og:url"');
        expect(html).toContain('<meta property="article:section" content="Europe"');
        expect(html).toContain('<meta property="article:tag" content="fjord"');
    });

    test('known page assets are copied with matching file sizes', () => {
        const sourceAsset =
            './sites/travelbook/pages/blog/europe/norway/assets/viking-ship.jpg';
        const outputAsset =
            getPublicPath('en/blog/europe/norway/assets/viking-ship.jpg');
        expect(fs.existsSync(outputAsset)).toBe(true);
        expect(fs.statSync(outputAsset).size).toBe(fs.statSync(sourceAsset).size);
    });

    test('nested default-language post is deployed to public root', () => {
        expect(readFile(getPublicPath('blog/europe/norway/index.html')))
            .toBe(readFile(getPublicPath('en/blog/europe/norway/index.html')));
        expect(fs.existsSync(
            getPublicPath('blog/europe/norway/assets/viking-ship.jpg')))
            .toBe(true);
    });

    test('multilingual page output contains localized language markers', () => {
        expect(readFile(getPublicPath('en/blog/europe/norway/index.html')))
            .toContain("<script>const PAGE_LANGUAGE = 'en';</script>");
        expect(readFile(getPublicPath('ja/blog/europe/norway/index.html')))
            .toContain("<script>const PAGE_LANGUAGE = 'ja';</script>");
        expect(readFile(getPublicPath('zh-tw/blog/europe/norway/index.html')))
            .toContain("<script>const PAGE_LANGUAGE = 'zh-tw';</script>");
    });

    test('all expected search index files contain valid JSON', () => {
        for ( const language of LANGUAGES ) {
            for ( const key of INDEX_KEYS ) {
                expect(() => readJson(
                    getPublicPath(`assets/collection/${language}/${key}.json`)
                )).not.toThrow();
            }
        }
    });

    test('exported document stores contain expected document counts', () => {
        for ( const language of LANGUAGES ) {
            const documentStore = readJson(
                getPublicPath(`assets/collection/${language}/1.doc.json`));
            expect(documentStore.length).toBe(15);
        }
    });

    test('tag index export contains expected category mappings', () => {
        expect(getTagEntry('en', 'europe')).toEqual(['europe', [9, 10]]);
        expect(getTagEntry('en', 'asia')).toEqual(['asia', [4, 5, 6, 7]]);
        expect(getTagEntry('en', 'south-america'))
            .toEqual(['south-america', [12, 13, 14]]);
    });

    test('build directory is preserved because post-build cleanup is skipped', () => {
        expect(fs.existsSync(getBuildPath('config/config.json'))).toBe(true);
        expect(fs.existsSync(getBuildPath('languages/en.json'))).toBe(true);
        expect(fs.existsSync(getBuildPath('templates/en/post.html'))).toBe(true);
    });

    test('PDF datasource output is absent when PDF generation is disabled', () => {
        expect(fs.existsSync(getBuildPath('datasources/pdf/en/site.pdf')))
            .toBe(false);
        expect(fs.existsSync(getBuildPath('datasources/pdf/ja/site.pdf')))
            .toBe(false);
        expect(fs.existsSync(getBuildPath('datasources/pdf/zh-tw/site.pdf')))
            .toBe(false);
    });

    test('successful root index is not the build error page', () => {
        const html = readFile(getPublicPath('index.html'));
        expect(html).toContain('TravelBook');
        expect(html).not.toContain('Build Error');
    });

    test('public build metadata has expected timestamp and ID shape', () => {
        const buildMetadata = readJson(getPublicPath('build.json'));
        expect(buildMetadata.date).toMatch(/^\d{14}$/);
        expect(buildMetadata.id).toMatch(new RegExp(`^${siteVersion}-\\d{14}$`));
    });

});

describe('document store', () => {

    beforeAll(async () => {
        const documentStorePath = 
            `${publicDirectory}/assets/collection/${LANGUAGE}`;
        const configPath = `${buildDirectory}/config/config.json`;
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        let documentStoreConfig = config.site.collection.index.documentStore;
        documentStoreConfig.language = LANGUAGE;
        index = new FlexSearch.Document(documentStoreConfig);
        const indexKeys = LANGUAGE_INDEX_KEYS[LANGUAGE];
        for ( const key of indexKeys ) {
            const path = `${documentStorePath}/${key}.json`;
            const json = JSON.parse(fs.readFileSync(path, 'utf8'));
            await index.import(key, json ?? null);
        }
    });

    test('get document by ID', async () => {
        const document = await index.get(10);
        const expectedDocument = {
            id: 10,
            name: 'Sognefjord and Viking Ships',
            description: 'Norway is a Scandinavian country encompassing mountains, glaciers and deep coastal fjords. Oslo, the capital, is a city of green spaces and museums. Preserved 9th-century Viking ships are displayed at the Viking Ship Museum in Oslo. Bergen, with colorful wooden houses, is the starting point for cruises to the dramatic Sognefjord. Norway is also known for fishing, hiking and skiing, notably at Lillehammers Olympic resort.',
            categoryLanguages: [ { id: 'europe', name: 'Europe' } ],
            tags: [ 'europe', 'scandinavia', 'fjord', 'viking', 'Sognefjord' ],
            date: '2024-12-01T12:00:00.000Z',
            displayDate: '1 December 2024',
            relUrl: 'europe/norway',
            coverExists: true,
            cover: 'assets/viking-ship.jpg',
            author: 'Teddy',
            authorUrl: '/about/',
            content: 'Lorem ipsum dolor sit amet consectetur adipiscing elit Curabitur sem lacus rutrum convallis scelerisque eget dignissim a ligula Maecenas vitae dapibus nibh ut facilisis nulla Fusce maximus in leo nec ullamcorper Orci varius natoque penatibus et magnis dis parturient montes nascetur ridiculus mus Pellentesque nec varius augue Duis blandit dui ut tristique consequat Nullam vel ligula lectus Section Heading Donec quis sem enim In rutrum id dui sed convallis Mauris sagittis libero quis libero finibus quis accumsan turpis rutrum Donec consectetur elementum justo sit amet auctor Vivamus fringilla id est vitae laoreet Donec ornare id ligula et pharetra Sed dictum ante at orci rutrum vel faucibus quam auctor Morbi in mauris dignissim purus porttitor viverra ac sit amet leo Vestibulum dignissim sapien ut eleifend aliquet lectus diam gravida nibh et eleifend metus justo ut ante Class aptent taciti sociosqu ad litora torquent per conubia nostra per inceptos himenaeos Praesent vitae suscipit erat Vestibulum eu est ut lacus congue sagittis Vivamus sodales felis ut orci sodales vitae feugiat augue tristique Lorem ipsum dolor sit amet consectetur adipiscing elit Curabitur sem lacus rutrum convallis scelerisque eget dignissim a ligula Maecenas vitae dapibus nibh ut facilisis nulla Fusce maximus in leo nec ullamcorper Teddy Sed egestas erat nisl quis pharetra quam sodales in Mauris eu est id sapien malesuada porta consectetur sit amet ipsum Aliquam erat volutpat Duis tristique eleifend quam at accumsan Ut a nisl rhoncus iaculis lorem eget pulvinar nisl Cras neque quam ultricies id sapien sed mattis varius arcu Quisque feugiat arcu ac nulla gravida a laoreet dui congue Quisque nec risus nec eros elementum scelerisque nec in odio Etiam at purus aliquet faucibus eros eget placerat sem'
        }
        expect(document).toEqual(expectedDocument);
    });

    test('search query returns expected document', async () => {
        const results = await index.search('Norway', {
            enrich: true
        });
        const serializedResults = JSON.stringify(results);
        expect(serializedResults).toContain('Sognefjord and Viking Ships');
        expect(serializedResults).toContain('Norway is a Scandinavian country');
    });

    test('exported tag index contains expected document tag mapping', () => {
        const tagIndex = readJson(
            `${publicDirectory}/assets/collection/en/1.tag.json`);
        const tagsEntry = tagIndex.find(([key]) => key === 'tags');
        const europeEntry = tagsEntry[1].find(([tag]) => tag === 'europe');
        expect(europeEntry).toEqual(['europe', [9, 10]]);
    });

    test('exported tag index contains expected category mappings', () => {
        expect(getTagEntry('en', 'europe')).toEqual(['europe', [9, 10]]);
        expect(getTagEntry('en', 'asia')).toEqual(['asia', [4, 5, 6, 7]]);
        expect(getTagEntry('en', 'south-america'))
            .toEqual(['south-america', [12, 13, 14]]);
    });

});

describe('multilingual document stores', () => {

    test.each([
        ['en', 10, 'Sognefjord and Viking Ships'],
        ['ja', 10, 'バイキング船'],
        ['zh-tw', 10, '維京船']
    ])('imports and reads %s collection document store',
        async (language, id, expectedName) => {
            const languageIndex = await importLanguageIndex(language);
            const document = await languageIndex.get(id);
            expect(document.name).toBe(expectedName);
        });

    test.each([
        ['en', 'Sognefjord', 'Sognefjord and Viking Ships'],
        ['ja', 'バイキング', 'バイキング船'],
        ['zh-tw', '維京', '維京船']
    ])('imports and queries %s collection index',
        async (language, query, expectedName) => {
            const languageIndex = await importLanguageIndex(language);
            const results = await languageIndex.search(query, {
                enrich: true
            });
            expect(JSON.stringify(results)).toContain(expectedName);
        });

});
