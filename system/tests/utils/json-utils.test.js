/**
 * JSON utility function tests.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { expect, test } from 'vitest';
import { exists, getValue, sort } from '../../src/utils/json-utils.js';


const json = {
    foo: {
        bar: {
            baz: {
                qux: 'teddy', 
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

test('nested key exists', () => {
    expect(exists(json, 'foo', 'bar', 'baz', 'qux')).toBe(true);
});

test('nested key value equals teddy', () => {
    expect(getValue(json, ['foo', 'bar', 'baz', 'qux'])).toEqual('teddy');
});

test('array of JSON objects correctly sorted by name', () => {
    const expectedArray = [
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
    ];
    expect(sort(json.foo.bar.baz.quux, 'name', 'asc')).toEqual(expectedArray);
});
