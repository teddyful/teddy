/**
 * Build pipeline tests.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import fs from 'fs';
import FlexSearch from 'flexsearch';
import { beforeAll, describe, expect, test } from 'vitest';

import BuildPipeline from '../../src/pipelines/build-pipeline.js';


const opts = {
    env: 'local',
    customCssOnly: false,
    customJsOnly: false,
    distUseBuildId: false,
    ignoreAssets: false,
    ignoreCollection: false,
    ignoreCss: false,
    ignoreData: false,
    ignoreFonts: false,
    ignoreHtml: false,
    ignoreImages: false,
    ignoreJs: false,
    ignoreRobots: false,
    ignoreSitemap: false,
    ignoreWebConfig: false,
    minifyCss: false,
    minifyHtml: false,
    minifyJs: false,
    skipPostBuildCleanup: true,
    siteName: 'travelbook',
    themeName: 'bear'
}

const siteConfig =JSON.parse(fs.readFileSync(
    `./sites/${opts.siteName}/site.json`, 'utf8'));
const siteVersion = siteConfig.site.version;
const publicDirectory = `./sites/${opts.siteName}/public/${opts.env}`;
const publicResources = [
    'build.json', 
    'favicon.ico', 
    'index.html', 
    'robots.txt', 
    'sitemap.xml', 
    'about/index.html', 
    `assets/${siteVersion}/collection/en/content.cfg.json`, 
    `assets/${siteVersion}/collection/en/content.ctx.json`, 
    `assets/${siteVersion}/collection/en/content.map.json`, 
    `assets/${siteVersion}/collection/en/description.cfg.json`, 
    `assets/${siteVersion}/collection/en/description.ctx.json`, 
    `assets/${siteVersion}/collection/en/description.map.json`, 
    `assets/${siteVersion}/collection/en/name.cfg.json`, 
    `assets/${siteVersion}/collection/en/name.ctx.json`, 
    `assets/${siteVersion}/collection/en/name.map.json`, 
    `assets/${siteVersion}/collection/en/reg.json`, 
    `assets/${siteVersion}/collection/en/store.json`, 
    `assets/${siteVersion}/collection/en/tag.json`, 
    `assets/${siteVersion}/collection/ja/content.cfg.json`, 
    `assets/${siteVersion}/collection/ja/content.ctx.json`, 
    `assets/${siteVersion}/collection/ja/content.map.json`, 
    `assets/${siteVersion}/collection/ja/description.cfg.json`, 
    `assets/${siteVersion}/collection/ja/description.ctx.json`, 
    `assets/${siteVersion}/collection/ja/description.map.json`, 
    `assets/${siteVersion}/collection/ja/name.cfg.json`, 
    `assets/${siteVersion}/collection/ja/name.ctx.json`, 
    `assets/${siteVersion}/collection/ja/name.map.json`, 
    `assets/${siteVersion}/collection/ja/reg.json`, 
    `assets/${siteVersion}/collection/ja/store.json`, 
    `assets/${siteVersion}/collection/ja/tag.json`, 
    `assets/${siteVersion}/collection/zh-tw/content.cfg.json`, 
    `assets/${siteVersion}/collection/zh-tw/content.ctx.json`, 
    `assets/${siteVersion}/collection/zh-tw/content.map.json`, 
    `assets/${siteVersion}/collection/zh-tw/description.cfg.json`, 
    `assets/${siteVersion}/collection/zh-tw/description.ctx.json`, 
    `assets/${siteVersion}/collection/zh-tw/description.map.json`, 
    `assets/${siteVersion}/collection/zh-tw/name.cfg.json`, 
    `assets/${siteVersion}/collection/zh-tw/name.ctx.json`, 
    `assets/${siteVersion}/collection/zh-tw/name.map.json`, 
    `assets/${siteVersion}/collection/zh-tw/reg.json`, 
    `assets/${siteVersion}/collection/zh-tw/store.json`, 
    `assets/${siteVersion}/collection/zh-tw/tag.json`, 
    `assets/${siteVersion}/css/style.css`, 
    `assets/${siteVersion}/css/vendors/bootstrap/5.3.3/bootstrap.min.css`, 
    `assets/${siteVersion}/css/vendors/fontawesome/6.7.2/all.min.css`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-brands-400.ttf`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-brands-400.woff2`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-regular-400.ttf`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-regular-400.woff2`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-solid-900.ttf`, 
    `assets/${siteVersion}/fonts/vendors/fontawesome/6.7.2/fa-solid-900.woff2`, 
    `assets/${siteVersion}/images/contributors/author.jpg`, 
    `assets/${siteVersion}/images/favicon/favicon.ico`, 
    `assets/${siteVersion}/images/logo/logo.png`, 
    `assets/${siteVersion}/images/og/og-default.jpg`, 
    `assets/${siteVersion}/js/blog.js`, 
    `assets/${siteVersion}/js/vendors/bootstrap/5.3.3/bootstrap.bundle.min.js`, 
    `assets/${siteVersion}/js/vendors/flexsearch/0.7.43/flexsearch.bundle.min.js`, 
    `assets/${siteVersion}/js/vendors/mithril/2.2.14/mithril.min.js`, 
    `assets/${siteVersion}/js/vendors/teddy/config.js`, 
    `assets/${siteVersion}/js/vendors/teddy/lang.js`, 
    `assets/${siteVersion}/js/vendors/teddy/search.js`, 
    `assets/${siteVersion}/js/vendors/teddy/site.js`, 
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

let index = null;
const LANGUAGE = 'en';
const LANGUAGE_INDEX_KEYS = {
    "en": [
        "reg", 
        "name.cfg", 
        "name.map", 
        "name.ctx", 
        "description.cfg", 
        "description.map", 
        "description.ctx", 
        "content.cfg", 
        "content.map", 
        "content.ctx", 
        "tag", 
        "store"
    ]
};


describe('static site', () => {

    beforeAll(async () => {
        const buildPipeline = new BuildPipeline(opts);
        await buildPipeline.build();
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

});

describe('document store', () => {

    beforeAll(async () => {
        const documentStorePath = 
            `${publicDirectory}/assets/${siteVersion}/collection/${LANGUAGE}`;
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
            authorUrl: '/about',
            content: 'Lorem ipsum dolor sit amet consectetur adipiscing elit Curabitur sem lacus rutrum convallis scelerisque eget dignissim a ligula Maecenas vitae dapibus nibh ut facilisis nulla Fusce maximus in leo nec ullamcorper Orci varius natoque penatibus et magnis dis parturient montes nascetur ridiculus mus Pellentesque nec varius augue Duis blandit dui ut tristique consequat Nullam vel ligula lectus Section Heading Donec quis sem enim In rutrum id dui sed convallis Mauris sagittis libero quis libero finibus quis accumsan turpis rutrum Donec consectetur elementum justo sit amet auctor Vivamus fringilla id est vitae laoreet Donec ornare id ligula et pharetra Sed dictum ante at orci rutrum vel faucibus quam auctor Morbi in mauris dignissim purus porttitor viverra ac sit amet leo Vestibulum dignissim sapien ut eleifend aliquet lectus diam gravida nibh et eleifend metus justo ut ante Class aptent taciti sociosqu ad litora torquent per conubia nostra per inceptos himenaeos Praesent vitae suscipit erat Vestibulum eu est ut lacus congue sagittis Vivamus sodales felis ut orci sodales vitae feugiat augue tristique Lorem ipsum dolor sit amet consectetur adipiscing elit Curabitur sem lacus rutrum convallis scelerisque eget dignissim a ligula Maecenas vitae dapibus nibh ut facilisis nulla Fusce maximus in leo nec ullamcorper Teddy Sed egestas erat nisl quis pharetra quam sodales in Mauris eu est id sapien malesuada porta consectetur sit amet ipsum Aliquam erat volutpat Duis tristique eleifend quam at accumsan Ut a nisl rhoncus iaculis lorem eget pulvinar nisl Cras neque quam ultricies id sapien sed mattis varius arcu Quisque feugiat arcu ac nulla gravida a laoreet dui congue Quisque nec risus nec eros elementum scelerisque nec in odio Etiam at purus aliquet faucibus eros eget placerat sem'
        }
        expect(document).toEqual(expectedDocument);
    });

});
