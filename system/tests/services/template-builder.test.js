/**
 * Template builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import TemplateBuilder from '../../src/services/template-builder.js';

const TEST_DIR = './working/tests/template-builder';
const THEMES_DIR = path.join(TEST_DIR, 'themes');
const THEME_NAME = 'bear';
const THEME_TEMPLATES_DIR = path.join(THEMES_DIR, THEME_NAME, 'templates');
const BUILD_DIR = path.join(TEST_DIR, 'build');

function createConfig(overrides = {}) {
    const config = {
        system: {
            themes: THEMES_DIR
        },
        site: {
            theme: {
                name: THEME_NAME
            },
            languages: {
                enabled: ['en', 'ja']
            }
        },
        build: {
            opts: {
                ignoreHtml: false
            },
            distDirs: {
                build: BUILD_DIR
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function writeFile(filePath, content = 'content') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function writeJson(filePath, value) {
    writeFile(filePath, JSON.stringify(value, null, 4));
}

function writeLanguageData(language, data = {}) {
    writeJson(path.join(BUILD_DIR, 'languages', `${language}.json`), {
        metadata: {
            title: language === 'ja' ? '旅行記' : 'TravelBook',
            description: language === 'ja' ?
                'Japanese description' : 'English description'
        },
        content: {
            label: language === 'ja' ? '読む' : 'Read',
            nested: '{{ metadata.title }}'
        },
        ...data
    });
}

function writeTemplate(fileName, content) {
    writeFile(path.join(THEME_TEMPLATES_DIR, fileName), content);
}

function readOutput(language, fileName) {
    return fs.readFileSync(path.join(
        BUILD_DIR, 'templates', language, fileName), 'utf8');
}

async function translate(config = createConfig()) {
    await new TemplateBuilder(config).translateTemplates();
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('HTML templates are translated for each enabled language', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html',
        '<title>{{ metadata.title }}</title><p>{{ content.label }}</p>');
    await translate();
    expect(readOutput('en', 'page.html'))
        .toBe('<title>TravelBook</title><p>Read</p>');
    expect(readOutput('ja', 'page.html'))
        .toBe('<title>旅行記</title><p>読む</p>');
});

test('multiple HTML templates are translated', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    writeTemplate('post.html', '<p>{{ metadata.description }}</p>');
    await translate();
    expect(readOutput('en', 'page.html')).toBe('<h1>TravelBook</h1>');
    expect(readOutput('en', 'post.html'))
        .toBe('<p>English description</p>');
    expect(readOutput('ja', 'page.html')).toBe('<h1>旅行記</h1>');
    expect(readOutput('ja', 'post.html'))
        .toBe('<p>Japanese description</p>');
});

test('template output directories are created for each language', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    await translate();
    expect(fs.statSync(path.join(
        BUILD_DIR, 'templates', 'en')).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(
        BUILD_DIR, 'templates', 'ja')).isDirectory()).toBe(true);
});

test('second mustache pass resolves placeholders emitted by first pass',
    async () => {
        writeLanguageData('en');
        writeLanguageData('ja');
        writeTemplate('page.html', '<h1>{{ content.nested }}</h1>');
        await translate();
        expect(readOutput('en', 'page.html')).toBe('<h1>TravelBook</h1>');
        expect(readOutput('ja', 'page.html')).toBe('<h1>旅行記</h1>');
    });

test('HTML escaping follows gulp-mustache defaults', async () => {
    writeLanguageData('en', {
        metadata: {
            title: '<TravelBook>',
            description: 'English description'
        }
    });
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    await translate();
    expect(readOutput('en', 'page.html')).toBe('<h1>&lt;TravelBook&gt;</h1>');
});

test('triple mustache leaves HTML unescaped', async () => {
    writeLanguageData('en', {
        content: {
            label: '<strong>Read</strong>',
            nested: '{{ metadata.title }}'
        }
    });
    writeLanguageData('ja');
    writeTemplate('page.html', '<p>{{{ content.label }}}</p>');
    await translate();
    expect(readOutput('en', 'page.html'))
        .toBe('<p><strong>Read</strong></p>');
});

test('non-HTML templates are ignored', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    writeTemplate('notes.txt', '{{ metadata.title }}');
    await translate();
    expect(readOutput('en', 'page.html')).toBe('<h1>TravelBook</h1>');
    expect(fs.existsSync(path.join(
        BUILD_DIR, 'templates', 'en', 'notes.txt'))).toBe(false);
});

test('nested template files are ignored by top-level HTML glob', async () => {
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    writeFile(path.join(
        THEME_TEMPLATES_DIR, 'nested', 'partial.html'), 'Nested');
    await translate();
    expect(readOutput('en', 'page.html')).toBe('<h1>TravelBook</h1>');
    expect(fs.existsSync(path.join(
        BUILD_DIR, 'templates', 'en', 'nested', 'partial.html'))).toBe(false);
});

test('translation is skipped when HTML is ignored', async () => {
    const config = createConfig();
    config.build.opts.ignoreHtml = true;
    writeLanguageData('en');
    writeLanguageData('ja');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    await translate(config);
    expect(fs.existsSync(path.join(
        BUILD_DIR, 'templates', 'en', 'page.html'))).toBe(false);
    expect(fs.existsSync(path.join(
        BUILD_DIR, 'templates', 'ja', 'page.html'))).toBe(false);
});

test('translation succeeds when templates directory has no HTML files',
    async () => {
        writeLanguageData('en');
        writeLanguageData('ja');
        writeTemplate('notes.txt', '{{ metadata.title }}');
        await expect(translate()).resolves.toBeUndefined();
        expect(fs.existsSync(path.join(BUILD_DIR, 'templates', 'en')))
            .toBe(false);
    });

test('missing language data file rejects translation', async () => {
    writeLanguageData('en');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    await expect(translate()).rejects.toThrow();
});

test('invalid language data JSON rejects translation', async () => {
    writeLanguageData('en');
    writeFile(path.join(BUILD_DIR, 'languages', 'ja.json'), '{');
    writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
    await expect(translate()).rejects.toThrow();
});

test('configured theme name determines source template directory', async () => {
    const config = createConfig();
    config.site.theme.name = 'panda';
    writeLanguageData('en');
    writeLanguageData('ja');
    writeFile(path.join(
        THEMES_DIR, 'panda', 'templates', 'page.html'),
        '<h1>{{ metadata.title }}</h1>');
    writeTemplate('page.html', '<h1>Wrong theme</h1>');
    await translate(config);
    expect(readOutput('en', 'page.html')).toBe('<h1>TravelBook</h1>');
    expect(readOutput('ja', 'page.html')).toBe('<h1>旅行記</h1>');
});

test('configured build directory determines language input and template output',
    async () => {
        const customBuildDir = path.join(TEST_DIR, 'custom-build');
        const config = createConfig({
            build: {
                opts: {
                    ignoreHtml: false
                },
                distDirs: {
                    build: customBuildDir
                }
            }
        });
        writeJson(path.join(customBuildDir, 'languages', 'en.json'), {
            metadata: {
                title: 'Custom English'
            }
        });
        writeJson(path.join(customBuildDir, 'languages', 'ja.json'), {
            metadata: {
                title: 'Custom Japanese'
            }
        });
        writeTemplate('page.html', '<h1>{{ metadata.title }}</h1>');
        await translate(config);
        expect(fs.readFileSync(path.join(
            customBuildDir, 'templates', 'en', 'page.html'), 'utf8'))
            .toBe('<h1>Custom English</h1>');
        expect(fs.readFileSync(path.join(
            customBuildDir, 'templates', 'ja', 'page.html'), 'utf8'))
            .toBe('<h1>Custom Japanese</h1>');
    });
