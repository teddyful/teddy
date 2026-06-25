/**
 * JSON utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { expect, test } from 'vitest';
import { exists, getValue, sort } from '../../src/utils/json-utils.js';

const json = {
    foo: {
        bar: {
            baz: {
                qux: 'teddy',
                emptyString: '',
                falseValue: false,
                nullValue: null,
                zeroValue: 0,
                quux: [
                    {
                        id: 3,
                        name: 'item-3',
                        description: 'item-description-3'
                    },
                    {
                        id: 1,
                        name: 'item-1',
                        description: 'item-description-1'
                    },
                    {
                        id: 2,
                        name: 'item-2',
                        description: 'item-description-2'
                    }
                ]
            }
        }
    }
};

test('top-level key exists', () => {
    expect(exists(json, 'foo')).toBe(true);
});

test('nested key exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'qux')).toBe(true);
});

test('array index key exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'quux', 0, 'name')).toBe(true);
});

test('key with empty string value exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'emptyString')).toBe(true);
});

test('key with false value exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'falseValue')).toBe(true);
});

test('key with null value exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'nullValue')).toBe(true);
});

test('key with zero value exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'zeroValue')).toBe(true);
});

test('missing top-level key does not exist', () => {
    expect(exists(json, 'missing')).toBe(false);
});

test('missing nested key does not exist', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'missing')).toBe(false);
});

test('nested key below null value does not exist', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'nullValue', 'missing')).toBe(false);
});

test('nested key below primitive value does not exist', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'qux', 'missing')).toBe(false);
});

test('exists returns false for null JSON input', () => {
    expect(exists(null, 'foo')).toBe(false);
});

test('exists returns false for undefined JSON input', () => {
    expect(exists(undefined, 'foo')).toBe(false);
});

test('exists returns false for primitive JSON input', () => {
    expect(exists('teddy', 'foo')).toBe(false);
});

test('nested key value returned using array of keys', () => {
    expect(getValue(json, ['foo', 'bar', 'baz', 'qux'])).toBe('teddy');
});

test('nested key value returned using rest keys', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'qux')).toBe('teddy');
});

test('array item value returned using numeric index key', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'quux', 1, 'name'))
        .toBe('item-1');
});

test('empty string value returned', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'emptyString')).toBe('');
});

test('false value returned', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'falseValue')).toBe(false);
});

test('null value returned', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'nullValue')).toBe(null);
});

test('zero value returned', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'zeroValue')).toBe(0);
});

test('missing top-level value returns undefined', () => {
    expect(getValue(json, 'missing')).toBeUndefined();
});

test('missing nested value returns undefined', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'missing')).toBeUndefined();
});

test('nested value below null returns undefined', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'nullValue', 'missing'))
        .toBeUndefined();
});

test('nested value below primitive returns undefined', () => {
    expect(getValue(json, 'foo', 'bar', 'baz', 'qux', 'missing'))
        .toBeUndefined();
});

test('getValue returns undefined for null JSON input', () => {
    expect(getValue(null, 'foo')).toBeUndefined();
});

test('getValue returns undefined for primitive JSON input', () => {
    expect(getValue('teddy', 'foo')).toBeUndefined();
});

test('getValue with empty key array returns original JSON object', () => {
    expect(getValue(json, [])).toBe(json);
});

test('array of JSON objects sorted by string key ascending', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'name', 'asc')).toEqual([
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        }
    ]);
});

test('array of JSON objects sorted by string key descending', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'name', 'desc')).toEqual([
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        }
    ]);
});

test('array of JSON objects sorted by numeric key ascending', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'id', 'asc')).toEqual([
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        }
    ]);
});

test('array of JSON objects sorted by numeric key descending', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'id', 'desc')).toEqual([
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        }
    ]);
});

test('sort defaults to ascending order for missing order', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'id')).toEqual([
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        }
    ]);
});

test('sort defaults to ascending order for invalid order', () => {
    const arr = json.foo.bar.baz.quux;
    expect(sort(arr, 'id', 'invalid')).toEqual([
        {
            id: 1,
            name: 'item-1',
            description: 'item-description-1'
        },
        {
            id: 2,
            name: 'item-2',
            description: 'item-description-2'
        },
        {
            id: 3,
            name: 'item-3',
            description: 'item-description-3'
        }
    ]);
});

test('sort returns empty array for non-array input', () => {
    expect(sort(null, 'id', 'asc')).toEqual([]);
    expect(sort(undefined, 'id', 'asc')).toEqual([]);
    expect(sort({}, 'id', 'asc')).toEqual([]);
});

test('sort returns empty array for empty array input', () => {
    expect(sort([], 'id', 'asc')).toEqual([]);
});

test('sort does not mutate the original array', () => {
    const arr = [
        { id: 2, name: 'item-2' },
        { id: 1, name: 'item-1' }
    ];
    const sortedArr = sort(arr, 'id', 'asc');
    expect(sortedArr).toEqual([
        { id: 1, name: 'item-1' },
        { id: 2, name: 'item-2' }
    ]);
    expect(arr).toEqual([
        { id: 2, name: 'item-2' },
        { id: 1, name: 'item-1' }
    ]);
});

test('string sort handles missing and null values', () => {
    const arr = [
        { name: 'b' },
        { id: 1 },
        { name: null },
        { name: 'a' }
    ];
    expect(sort(arr, 'name', 'asc')).toEqual([
        { id: 1 },
        { name: null },
        { name: 'a' },
        { name: 'b' }
    ]);
});

test('numeric sort handles missing and non-numeric values as zero', () => {
    const arr = [
        { score: 10 },
        { score: 'not-a-number' },
        { id: 1 },
        { score: 5 }
    ];
    expect(sort(arr, 'score', 'asc')).toEqual([
        { score: 'not-a-number' },
        { id: 1 },
        { score: 5 },
        { score: 10 }
    ]);
});

test('string sort handles numeric strings lexicographically', () => {
    const arr = [
        { score: '10' },
        { score: '2' },
        { score: '5' }
    ];
    expect(sort(arr, 'score', 'asc')).toEqual([
        { score: '10' },
        { score: '2' },
        { score: '5' }
    ]);
});

test('numeric sort handles negative values', () => {
    const arr = [
        { score: 10 },
        { score: -5 },
        { score: 0 }
    ];
    expect(sort(arr, 'score', 'asc')).toEqual([
        { score: -5 },
        { score: 0 },
        { score: 10 }
    ]);
});
