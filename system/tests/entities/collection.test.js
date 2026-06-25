/**
 * Collection class tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import { expect, test } from 'vitest';
import Collection from '../../src/entities/collection.js';

const enPages = [
    {
        id: 1,
        name: 'English page'
    }
];

const jaPages = [
    {
        id: 2,
        name: 'Japanese page'
    }
];

const enMetadata = {
    size: 1,
    categories: [
        {
            id: 'europe',
            name: 'Europe',
            count: 1
        }
    ]
};

const jaMetadata = {
    size: 1,
    categories: [
        {
            id: 'asia',
            name: 'Asia',
            count: 1
        }
    ]
};

test('collection can be constructed without language maps', () => {
    const collection = new Collection();
    expect(collection.getLanguagePages()).toEqual(new Map());
    expect(collection.getLanguageMetadata()).toEqual(new Map());
});

test('language pages map returned correctly', () => {
    const languagePages = new Map([
        ['en', enPages],
        ['ja', jaPages]
    ]);
    const collection = new Collection(languagePages);
    expect(collection.getLanguagePages()).toEqual(languagePages);
});

test('language metadata map returned correctly', () => {
    const languageMetadata = new Map([
        ['en', enMetadata],
        ['ja', jaMetadata]
    ]);
    const collection = new Collection(new Map(), languageMetadata);
    expect(collection.getLanguageMetadata()).toEqual(languageMetadata);
});

test('language pages getter returns a cloned map', () => {
    const languagePages = new Map([
        ['en', enPages]
    ]);
    const collection = new Collection(languagePages);
    const returnedLanguagePages = collection.getLanguagePages();
    returnedLanguagePages.set('ja', jaPages);
    expect(collection.getLanguagePages()).toEqual(new Map([
        ['en', enPages]
    ]));
});

test('language metadata getter returns a cloned map', () => {
    const languageMetadata = new Map([
        ['en', enMetadata]
    ]);
    const collection = new Collection(new Map(), languageMetadata);
    const returnedLanguageMetadata = collection.getLanguageMetadata();
    returnedLanguageMetadata.set('ja', jaMetadata);
    expect(collection.getLanguageMetadata()).toEqual(new Map([
        ['en', enMetadata]
    ]));
});

test('language pages clone is shallow', () => {
    const languagePages = new Map([
        ['en', enPages]
    ]);
    const collection = new Collection(languagePages);
    const returnedLanguagePages = collection.getLanguagePages();
    returnedLanguagePages.get('en').push({
        id: 3,
        name: 'Mutated page'
    });
    expect(collection.getPages('en')).toEqual([
        {
            id: 1,
            name: 'English page'
        },
        {
            id: 3,
            name: 'Mutated page'
        }
    ]);
    enPages.pop();
});

test('language metadata clone is shallow', () => {
    const languageMetadata = new Map([
        ['en', {
            size: 1
        }]
    ]);
    const collection = new Collection(new Map(), languageMetadata);
    const returnedLanguageMetadata = collection.getLanguageMetadata();
    returnedLanguageMetadata.get('en').size = 2;
    expect(collection.getMetadata('en')).toEqual({
        size: 2
    });
});

test('pages returned for existing language', () => {
    const collection = new Collection(new Map([
        ['en', enPages],
        ['ja', jaPages]
    ]));
    expect(collection.getPages('en')).toBe(enPages);
    expect(collection.getPages('ja')).toBe(jaPages);
});

test('empty pages array returned for missing language', () => {
    const collection = new Collection(new Map([
        ['en', enPages]
    ]));
    expect(collection.getPages('fr')).toEqual([]);
});

test('new empty pages array returned for each missing language call', () => {
    const collection = new Collection();
    const firstMissingPages = collection.getPages('en');
    const secondMissingPages = collection.getPages('en');
    expect(firstMissingPages).toEqual([]);
    expect(secondMissingPages).toEqual([]);
    expect(firstMissingPages).not.toBe(secondMissingPages);
});

test('stored empty pages array is returned for existing language', () => {
    const pages = [];
    const collection = new Collection(new Map([
        ['en', pages]
    ]));
    expect(collection.getPages('en')).toBe(pages);
});

test('metadata returned for existing language', () => {
    const collection = new Collection(
        new Map(),
        new Map([
            ['en', enMetadata],
            ['ja', jaMetadata]
        ])
    );
    expect(collection.getMetadata('en')).toBe(enMetadata);
    expect(collection.getMetadata('ja')).toBe(jaMetadata);
});

test('null metadata returned for missing language', () => {
    const collection = new Collection(
        new Map(),
        new Map([
            ['en', enMetadata]
        ])
    );
    expect(collection.getMetadata('fr')).toBe(null);
});

test('stored null metadata falls back to null', () => {
    const collection = new Collection(
        new Map(),
        new Map([
            ['en', null]
        ])
    );
    expect(collection.getMetadata('en')).toBe(null);
});

test('stored falsey metadata falls back only for nullish values', () => {
    const collection = new Collection(
        new Map(),
        new Map([
            ['emptyString', ''],
            ['zero', 0],
            ['false', false],
            ['undefined', undefined]
        ])
    );
    expect(collection.getMetadata('emptyString')).toBe('');
    expect(collection.getMetadata('zero')).toBe(0);
    expect(collection.getMetadata('false')).toBe(false);
    expect(collection.getMetadata('undefined')).toBe(null);
});

test('hasLanguage returns true for language with pages', () => {
    const collection = new Collection(new Map([
        ['en', enPages]
    ]));
    expect(collection.hasLanguage('en')).toBe(true);
});

test('hasLanguage returns true for language with empty pages array', () => {
    const collection = new Collection(new Map([
        ['en', []]
    ]));
    expect(collection.hasLanguage('en')).toBe(true);
});

test('hasLanguage returns false for missing language', () => {
    const collection = new Collection(new Map([
        ['en', enPages]
    ]));
    expect(collection.hasLanguage('fr')).toBe(false);
});

test('hasLanguage checks page map only and not metadata map', () => {
    const collection = new Collection(
        new Map(),
        new Map([
            ['en', enMetadata]
        ])
    );
    expect(collection.hasLanguage('en')).toBe(false);
});

test('constructor stores provided maps by reference', () => {
    const languagePages = new Map([
        ['en', enPages]
    ]);
    const collection = new Collection(languagePages);
    languagePages.set('ja', jaPages);
    expect(collection.hasLanguage('ja')).toBe(true);
    expect(collection.getPages('ja')).toBe(jaPages);
});

test('constructor stores provided metadata map by reference', () => {
    const languageMetadata = new Map([
        ['en', enMetadata]
    ]);
    const collection = new Collection(new Map(), languageMetadata);
    languageMetadata.set('ja', jaMetadata);
    expect(collection.getMetadata('ja')).toBe(jaMetadata);
});

test('map keys are matched exactly', () => {
    const collection = new Collection(new Map([
        ['en', enPages],
        ['EN', jaPages]
    ]));
    expect(collection.getPages('en')).toBe(enPages);
    expect(collection.getPages('EN')).toBe(jaPages);
    expect(collection.hasLanguage('En')).toBe(false);
});

test('non-string language keys are supported by underlying map', () => {
    const symbolKey = Symbol('language');
    const objectKey = {
        language: 'en'
    };
    const collection = new Collection(
        new Map([
            [symbolKey, enPages],
            [objectKey, jaPages]
        ]),
        new Map([
            [symbolKey, enMetadata],
            [objectKey, jaMetadata]
        ])
    );
    expect(collection.getPages(symbolKey)).toBe(enPages);
    expect(collection.getPages(objectKey)).toBe(jaPages);
    expect(collection.getMetadata(symbolKey)).toBe(enMetadata);
    expect(collection.getMetadata(objectKey)).toBe(jaMetadata);
    expect(collection.hasLanguage(symbolKey)).toBe(true);
    expect(collection.hasLanguage(objectKey)).toBe(true);
});
