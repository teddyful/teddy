/**
 * Language builder service tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';
import LanguageBuilder from '../../src/services/language-builder.js';

const TEST_DIR = './working/tests/language-builder';
const LANGUAGES_DIR = path.join(TEST_DIR, 'languages');

function createConfig(overrides = {}) {
    const config = {
        system: {
            build: {
                siteDirs: {
                    languages: LANGUAGES_DIR
                }
            }
        }
    };
    return {
        ...config,
        ...overrides
    };
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 4));
}

function writeFile(filePath, content = 'content') {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function createLanguageBuilder(config = createConfig()) {
    return new LanguageBuilder(config);
}

beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('language data is aggregated from JSON files', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), {
        metadata: {
            title: 'English'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'contributors.json'), {
        contributors: {
            default: 'teddy'
        }
    });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        contributors: {
            default: 'teddy'
        },
        metadata: {
            title: 'English'
        }
    });
});

test('language data aggregation is shallow', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), {
        metadata: {
            title: 'English',
            nested: {
                value: true
            }
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'content.json'), {
        content: {
            labels: {
                search: 'Search'
            }
        }
    });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        content: {
            labels: {
                search: 'Search'
            }
        },
        metadata: {
            title: 'English',
            nested: {
                value: true
            }
        }
    });
});

test('non-JSON files are ignored', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), {
        metadata: {
            title: 'English'
        }
    });
    writeFile(path.join(LANGUAGES_DIR, 'en', 'notes.txt'), JSON.stringify({
        notes: {
            title: 'Ignored'
        }
    }));
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        metadata: {
            title: 'English'
        }
    });
});

test('JSON extension matching is case-insensitive', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.JSON'), {
        metadata: {
            title: 'English'
        }
    });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        metadata: {
            title: 'English'
        }
    });
});

test('nested JSON files are aggregated recursively', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), {
        metadata: {
            title: 'English'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'nested', 'content.json'), {
        content: {
            labels: {
                search: 'Search'
            }
        }
    });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        content: {
            labels: {
                search: 'Search'
            }
        },
        metadata: {
            title: 'English'
        }
    });
});

test('empty language directory returns empty object', () => {
    fs.mkdirSync(path.join(LANGUAGES_DIR, 'en'), { recursive: true });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({});
});

test('missing language directory throws', () => {
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow();
});

test('invalid JSON file throws contextual aggregation error', () => {
    writeFile(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), '{');
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow(
            "Failed to aggregate language data from 'metadata.json' " +
            "for language 'en'.");
});

test('invalid JSON file error preserves original cause', () => {
    writeFile(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), '{');
    try {
        createLanguageBuilder().aggregateLanguageData('en');
    } catch (error) {
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.cause.message)
            .toContain('Failed to parse JSON file');
    }
});

test('null JSON language data throws contextual aggregation error', () => {
    writeFile(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), 'null');
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow(
            "Failed to aggregate language data from 'metadata.json' " +
            "for language 'en'.");
});

test('array JSON language data throws contextual aggregation error', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), []);
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow(
            "Failed to aggregate language data from 'metadata.json' " +
            "for language 'en'.");
});

test('string JSON language data throws contextual aggregation error', () => {
    writeFile(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), '"metadata"');
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow(
            "Failed to aggregate language data from 'metadata.json' " +
            "for language 'en'.");
});

test('invalid language data object error is preserved as cause', () => {
    writeFile(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), 'null');
    try {
        createLanguageBuilder().aggregateLanguageData('en');
    } catch (error) {
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.cause.message).toBe(
            "Invalid language data in 'metadata.json' for language " +
            "'en'. Expected a JSON object.");
    }
});

test('duplicate top-level keys throw contextual aggregation error', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'a.json'), {
        metadata: {
            title: 'First'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'b.json'), {
        metadata: {
            title: 'Second'
        }
    });
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow(
            "Failed to aggregate language data from 'b.json' " +
            "for language 'en'.");
});

test('duplicate top-level key error is preserved as cause', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'a.json'), {
        metadata: {
            title: 'First'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'b.json'), {
        metadata: {
            title: 'Second'
        }
    });
    try {
        createLanguageBuilder().aggregateLanguageData('en');
    } catch (error) {
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.cause.message).toBe(
            "Duplicate top-level language data key 'metadata' in " +
            "'b.json' for language 'en'.");
    }
});

test('duplicate top-level keys are detected in nested JSON files', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'a.json'), {
        metadata: {
            title: 'First'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'en', 'nested', 'b.json'), {
        metadata: {
            title: 'Second'
        }
    });
    expect(() => createLanguageBuilder().aggregateLanguageData('en'))
        .toThrow('Failed to aggregate language data from');
});

test('falsey object values are aggregated', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'content.json'), {
        content: {
            emptyString: '',
            falseValue: false,
            nullValue: null,
            zeroValue: 0
        }
    });
    expect(createLanguageBuilder().aggregateLanguageData('en')).toEqual({
        content: {
            emptyString: '',
            falseValue: false,
            nullValue: null,
            zeroValue: 0
        }
    });
});

test('language path is resolved using configured languages directory', () => {
    const customLanguagesDir = path.join(TEST_DIR, 'custom-languages');
    const config = createConfig({
        system: {
            build: {
                siteDirs: {
                    languages: customLanguagesDir
                }
            }
        }
    });
    writeJson(path.join(customLanguagesDir, 'ja', 'metadata.json'), {
        metadata: {
            title: 'Japanese'
        }
    });
    expect(createLanguageBuilder(config).aggregateLanguageData('ja')).toEqual({
        metadata: {
            title: 'Japanese'
        }
    });
});

test('separate language aggregations return separate objects', () => {
    writeJson(path.join(LANGUAGES_DIR, 'en', 'metadata.json'), {
        metadata: {
            title: 'English'
        }
    });
    writeJson(path.join(LANGUAGES_DIR, 'ja', 'metadata.json'), {
        metadata: {
            title: 'Japanese'
        }
    });
    const builder = createLanguageBuilder();
    const englishData = builder.aggregateLanguageData('en');
    const japaneseData = builder.aggregateLanguageData('ja');
    expect(englishData).toEqual({
        metadata: {
            title: 'English'
        }
    });
    expect(japaneseData).toEqual({
        metadata: {
            title: 'Japanese'
        }
    });
    expect(englishData).not.toBe(japaneseData);
});

test('returned language data can be mutated without changing source files',
    () => {
        const filePath = path.join(LANGUAGES_DIR, 'en', 'metadata.json');
        writeJson(filePath, {
            metadata: {
                title: 'English'
            }
        });
        const languageData = createLanguageBuilder()
            .aggregateLanguageData('en');
        languageData.metadata.title = 'Mutated';
        expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toEqual({
            metadata: {
                title: 'English'
            }
        });
    });
