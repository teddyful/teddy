/**
 * Page builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const { mockMinify } = vi.hoisted(() => {
    return {
        mockMinify: vi.fn(async sourceFilePath => {
            return `minified:${path.basename(sourceFilePath)}`;
        })
    };
});

vi.mock('minify', () => {
    return {
        minify: mockMinify
    };
});

const { default: PageBuilder } = await import(
    '../../src/services/page-builder.js');

const TEST_DIR = './working/tests/page-builder';
const PAGES_DIR = path.join(TEST_DIR, 'pages');
const BUILD_DIR = path.join(TEST_DIR, 'build');
const BASE_DIR = path.join(TEST_DIR, 'public');

function createConfig(overrides = {}) {
    const config = {
        package: {
            version: '0.0.15'
        },
        system: {
            build: {
                siteDirs: {
                    pages: PAGES_DIR
                }
            },
            assets: {
                js: {
                    vendors: ['vendors/flexsearch/0.8.212/flexsearch.js'],
                    teddy: ['vendors/teddy/{package.version}/search.js'],
                    site: ['config.js', 'site.js']
                }
            }
        },
        site: {
            web: {
                baseUrl: 'https://example.test'
            },
            urls: {
                assets: '/assets',
                siteConfig: '/assets/js/site',
                about: '/about/',
                blog: '/blog/'
            },
            languages: {
                enabled: ['en'],
                default: 'en'
            },
            collection: {
                enabled: true,
                pagesDir: 'blog',
                assets: {
                    extensions: {
                        allowed: ['jpg', 'png']
                    }
                }
            },
            assets: {
                custom: {
                    images: {
                        hero: {
                            default: 'site-hero.jpg'
                        },
                        og: {
                            default: 'site-og.jpg',
                            useCover: false
                        }
                    }
                }
            },
            theme: {
                assets: {
                    custom: {
                        images: {
                            hero: {
                                default: 'theme-hero.jpg'
                            },
                            og: {
                                default: 'theme-og.jpg',
                                useCover: false
                            }
                        }
                    }
                }
            },
            html: {
                inject: {
                    metadata: true,
                    systemAssets: true
                }
            }
        },
        build: {
            opts: {
                ignoreHtml: false,
                minifyHtml: false
            },
            distDirs: {
                build: BUILD_DIR,
                base: BASE_DIR
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function createLanguageData(language = 'en') {
    return {
        metadata: {
            applicationName: 'TravelBook',
            title: language === 'ja' ? '旅行記' : 'TravelBook',
            description: language === 'ja' ?
                'Japanese site description' : 'English site description',
            keywords: language === 'ja' ?
                '旅行,日本' : 'travel,teddy'
        },
        contributors: {
            default: 'teddy',
            teddy: {
                name: language === 'ja' ? 'テディ' : 'Teddy',
                url: '${pages.urls.about}',
                role: 'Author',
                description: 'Default author',
                avatar: 'teddy.jpg'
            },
            jillur: {
                name: 'Jillur',
                url: 'https://example.test/jillur',
                role: 'Editor',
                description: 'Editor description',
                avatar: 'jillur.jpg'
            }
        },
        taxonomy: {
            categories: {
                asia: language === 'ja' ? 'アジア' : 'Asia',
                europe: language === 'ja' ? 'ヨーロッパ' : 'Europe'
            }
        },
        content: {
            label: language === 'ja' ? '読む' : 'Read'
        }
    };
}

function writeFile(filePath, content = 'content') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function writeLanguageData(language = 'en', data = createLanguageData(language)) {
    writeJson(path.join(BUILD_DIR, 'languages', `${language}.json`), data);
}

function writeTemplate(language, templateFileName, body = null) {
    const template = body ?? [
        '<!doctype html>',
        '<html>',
        '<head><title>${page.metadata.title}</title></head>',
        '<body>',
        '<a href="${pages.urls.about}">About</a>',
        '<h1>${page.metadata.name}</h1>',
        '<p class="description">${page.metadata.description}</p>',
        '<p class="author">${page.metadata.author.name}</p>',
        '<p class="author-url">${page.metadata.author.url}</p>',
        '<p class="author-role">${page.metadata.author.role}</p>',
        '<p class="author-description">${page.metadata.author.description}</p>',
        '<p class="author-avatar">${page.metadata.author.avatar}</p>',
        '<p class="categories">${page.metadata.categories}</p>',
        '<p class="cover">${page.metadata.cover}</p>',
        '<p class="date">${page.metadata.date}</p>',
        '<p class="enabled">${page.metadata.enabled}</p>',
        '<p class="hero">${page.metadata.hero}</p>',
        '<p class="image">${page.metadata.image}</p>',
        '<p class="keywords">${page.metadata.keywords}</p>',
        '<p class="language">${page.metadata.language}</p>',
        '<p class="tags">${page.metadata.tags}</p>',
        '<p class="type">${page.metadata.type}</p>',
        '<p class="url">${page.metadata.url}</p>',
        '<p class="custom">${page.metadata.customFlag}</p>',
        '<p class="missing">${page.metadata.missingFlag}</p>',
        '<p class="mustache">{{ content.label }}</p>',
        '<main>${page.content}</main>',
        '</body>',
        '</html>'
    ].join('');
    writeFile(path.join(
        BUILD_DIR, 'templates', language, templateFileName), template);
}

function writeMarkdown(relPath, metadata = {}, content = 'Markdown content') {
    const metadataLines = Object.entries(metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    writeFile(path.join(PAGES_DIR, relPath), [
        '---',
        metadataLines,
        '---',
        '',
        content
    ].join('\n'));
}

function readOutput(...segments) {
    return fs.readFileSync(path.join(BASE_DIR, ...segments), 'utf8');
}

async function translate(config = createConfig()) {
    const builder = new PageBuilder(config);
    await builder.translatePages();
    return builder;
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
    mockMinify.mockClear();
    mockMinify.mockImplementation(async sourceFilePath => {
        return `minified:${path.basename(sourceFilePath)}`;
    });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('enabled markdown page is translated into index HTML', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        description: 'Post description'
    }, '# Hello Teddy');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain('<h1>Post</h1>');
    expect(html).toContain('<h1 id="helloteddy">Hello Teddy</h1>');
});

test('constructor filters pages by language suffix', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['en', 'ja'];
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('en', 'post.html');
    writeTemplate('ja', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'English Post'
    });
    writeMarkdown('blog/post.ja.md', {
        enabled: 'true',
        name: 'Japanese Post'
    });
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('English Post');
    expect(readOutput('ja', 'blog', 'index.html'))
        .toContain('Japanese Post');
});

test('HTML translation is skipped when ignoreHtml is enabled', async () => {
    const config = createConfig();
    config.build.opts.ignoreHtml = true;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    });
    await translate(config);
    expect(fs.existsSync(path.join(
        BASE_DIR, 'en', 'blog', 'index.html'))).toBe(false);
});

test('disabled page is skipped', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'false',
        name: 'Post'
    });
    await translate();
    expect(fs.existsSync(path.join(
        BASE_DIR, 'en', 'blog', 'index.html'))).toBe(false);
});

test('page without enabled metadata is skipped', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        name: 'Post'
    });
    await translate();
    expect(fs.existsSync(path.join(
        BASE_DIR, 'en', 'blog', 'index.html'))).toBe(false);
});

test('page is skipped when corresponding translated template is missing',
    async () => {
        writeLanguageData('en');
        writeMarkdown('blog/post.en.md', {
            enabled: 'true',
            name: 'Post'
        });
        await translate();
        expect(fs.existsSync(path.join(
            BASE_DIR, 'en', 'blog', 'index.html'))).toBe(false);
    });

test('resource paths are normalized for output directories', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'my-page.html');
    writeMarkdown('Blog Posts/My Page!.en.md', {
        enabled: 'true',
        name: 'My Page'
    });
    await translate();
    expect(readOutput('en', 'blog-posts', 'index.html'))
        .toContain('My Page');
});

test('page metadata placeholders are resolved', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        description: 'Post description',
        tags: 'alpha,beta',
        categories: 'asia,europe',
        cover: 'cover.jpg',
        date: '2025-06-25T12:00:00',
        hero: 'hero.jpg',
        customFlag: 'custom value'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain('<title>Post | TravelBook</title>');
    expect(html).toContain('<p class="description">Post description</p>');
    expect(html).toContain('<p class="categories">Asia, Europe</p>');
    expect(html).toContain('<p class="cover">cover.jpg</p>');
    expect(html).toContain('<p class="date">25 June 2025</p>');
    expect(html).toContain('<p class="enabled">true</p>');
    expect(html).toContain('<p class="hero">hero.jpg</p>');
    expect(html).toContain('<p class="keywords">alpha,beta,travel,teddy</p>');
    expect(html).toContain('<p class="language">en</p>');
    expect(html).toContain('<p class="tags">alpha,beta,travel,teddy</p>');
    expect(html).toContain('<p class="type">article</p>');
    expect(html).toContain('<p class="custom">custom value</p>');
    expect(html).toContain('<p class="missing"></p>');
});

test('metadata defaults are used when optional frontmatter is missing',
    async () => {
        writeLanguageData('en');
        writeTemplate('en', 'post.html');
        writeMarkdown('blog/post.en.md', {
            enabled: 'true'
        }, 'Body');
        await translate();
        const html = readOutput('en', 'blog', 'index.html');
        expect(html).toContain('<title>TravelBook</title>');
        expect(html).toContain('<h1>TravelBook</h1>');
        expect(html).toContain(
            '<p class="description">English site description</p>');
        expect(html).toContain('<p class="keywords">travel,teddy</p>');
        expect(html).toContain('<p class="cover"></p>');
        expect(html).toContain('<p class="hero">site-hero.jpg</p>');
});

test('author metadata is resolved from selected contributor', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        authorId: 'jillur'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain('<p class="author">Jillur</p>');
    expect(html).toContain(
        '<p class="author-url">https://example.test/jillur</p>');
    expect(html).toContain('<p class="author-role">Editor</p>');
    expect(html).toContain(
        '<p class="author-description">Editor description</p>');
    expect(html).toContain('<p class="author-avatar">jillur.jpg</p>');
});

test('default author URL placeholder is localized', async () => {
    const config = createConfig();
    config.site.languages.enabled = ['ja'];
    writeLanguageData('ja');
    writeTemplate('ja', 'post.html');
    writeMarkdown('blog/post.ja.md', {
        enabled: 'true',
        name: '投稿'
    }, 'Body');
    await translate(config);
    expect(readOutput('ja', 'blog', 'index.html'))
        .toContain('<p class="author-url">/ja/about/</p>');
});

test('page URL placeholders are resolved', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate();
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<a href="/about/">About</a>');
});

test('mustache templates are rendered using language data', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate();
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="mustache">Read</p>');
});

test('system assets are injected when enabled', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain(
        '<script src="/assets/js/vendors/flexsearch/0.8.212/flexsearch.js"></script>');
    expect(html).toContain(
        '<script src="/assets/js/vendors/teddy/0.0.15/search.js"></script>');
    expect(html).toContain(
        '<script src="/assets/js/site/config.js"></script>');
    expect(html).toContain(
        '<script src="/assets/js/site/site.js"></script>');
});

test('system assets are not injected when disabled', async () => {
    const config = createConfig();
    config.site.html.inject.systemAssets = false;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .not.toContain('/assets/js/');
});

test('page language script is always injected', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate();
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain("<script>const PAGE_LANGUAGE = 'en';</script>");
});

test('metadata tags are injected and escaped when enabled', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: '<Post>',
        description: 'Description & details',
        tags: 'alpha,<beta>',
        categories: 'asia',
        cover: 'cover.jpg'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain(
        '<meta name="description" content="Description &amp;amp; details"/>');
    expect(html).toContain(
        '<meta property="og:title" content="&lt;Post&gt;"/>');
    expect(html).toContain(
        '<meta property="article:tag" content="&lt;beta&gt;" />');
});

test('metadata tags are not injected when disabled', async () => {
    const config = createConfig();
    config.site.html.inject.metadata = false;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        description: 'Description'
    }, 'Body');
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .not.toContain('<meta name="description"');
});

test('collection pages include article metadata', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        categories: 'asia',
        tags: 'alpha,beta'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'blog', 'index.html');
    expect(html).toContain('<meta property="og:type" content="article"/>');
    expect(html).toContain('<meta property="article:author"');
    expect(html).toContain(
        '<meta property="article:section" content="Asia" />');
});

test('non-collection pages use website type', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'about.html');
    writeMarkdown('about.en.md', {
        enabled: 'true',
        name: 'About'
    }, 'Body');
    await translate();
    const html = readOutput('en', 'index.html');
    expect(html).toContain('<p class="type">website</p>');
    expect(html).toContain('<meta property="og:type" content="website"/>');
    expect(html).not.toContain('article:author');
});

test('collection pages use website type when collection disabled', async () => {
    const config = createConfig();
    config.site.collection.enabled = false;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="type">website</p>');
});

test('site Open Graph image default is used', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate();
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="image">https://example.test/assets/images/site-og.jpg</p>');
});

test('site Open Graph image can use page cover', async () => {
    const config = createConfig();
    config.site.assets.custom.images.og.useCover = true;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        cover: 'cover.jpg'
    }, 'Body');
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="image">https://example.test/blog/cover.jpg</p>');
});

test('theme Open Graph image default is used when site default is absent',
    async () => {
        const config = createConfig();
        delete config.site.assets.custom.images.og;
        writeLanguageData('en');
        writeTemplate('en', 'post.html');
        writeMarkdown('blog/post.en.md', {
            enabled: 'true',
            name: 'Post'
        }, 'Body');
        await translate(config);
        expect(readOutput('en', 'blog', 'index.html'))
            .toContain(
                '<p class="image">https://example.test/assets/images/theme-og.jpg</p>');
    });

test('page Open Graph image overrides site and theme defaults', async () => {
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post',
        og: 'page-og.jpg'
    }, 'Body');
    await translate();
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="image">https://example.test/blog/page-og.jpg</p>');
});

test('theme hero fallback is used when site hero is absent', async () => {
    const config = createConfig();
    delete config.site.assets.custom.images.hero;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate(config);
    expect(readOutput('en', 'blog', 'index.html'))
        .toContain('<p class="hero">theme-hero.jpg</p>');
});

test('page assets with allowed extensions are copied and normalized',
    async () => {
        writeLanguageData('en');
        writeTemplate('en', 'post.html');
        writeMarkdown('blog/post.en.md', {
            enabled: 'true',
            name: 'Post'
        }, 'Body');
        writeFile(path.join(PAGES_DIR, 'blog', 'Cover Image!.JPG'), 'image');
        writeFile(path.join(PAGES_DIR, 'blog', 'notes.txt'), 'notes');
        await translate();
        expect(fs.readFileSync(path.join(
            BASE_DIR, 'en', 'blog', 'cover-image.jpg'), 'utf8'))
            .toBe('image');
        expect(fs.existsSync(path.join(
            BASE_DIR, 'en', 'blog', 'notes.txt'))).toBe(false);
    });

test('page assets are not copied when no allowed extensions are configured',
    async () => {
        const config = createConfig();
        config.site.collection.assets.extensions.allowed = [];
        writeLanguageData('en');
        writeTemplate('en', 'post.html');
        writeMarkdown('blog/post.en.md', {
            enabled: 'true',
            name: 'Post'
        }, 'Body');
        writeFile(path.join(PAGES_DIR, 'blog', 'cover.jpg'), 'image');
        await translate(config);
        expect(fs.existsSync(path.join(
            BASE_DIR, 'en', 'blog', 'cover.jpg'))).toBe(false);
    });

test('HTML is minified when configured', async () => {
    const config = createConfig();
    config.build.opts.minifyHtml = true;
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await translate(config);
    expect(mockMinify).toHaveBeenCalledTimes(1);
    expect(readOutput('en', 'blog', 'index.html'))
        .toBe('minified:index.html');
});

test('HTML minification failure throws contextual error', async () => {
    const config = createConfig();
    config.build.opts.minifyHtml = true;
    mockMinify.mockRejectedValueOnce(new Error('minify failed'));
    writeLanguageData('en');
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await expect(translate(config)).rejects.toThrow(
        `Failed to minify HTML page ` +
        `'${path.join(BASE_DIR, 'en', 'blog', 'index.html')}'.`);
});

test('missing language data file throws', async () => {
    writeTemplate('en', 'post.html');
    writeMarkdown('blog/post.en.md', {
        enabled: 'true',
        name: 'Post'
    }, 'Body');
    await expect(translate()).rejects.toThrow('Failed to read JSON file');
});
