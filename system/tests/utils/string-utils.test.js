/**
 * String utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

import { expect, test } from 'vitest';
import { escapeHtml, parseCommaSeparatedList, redactSecretLookingKeys }
    from '../../src/utils/string-utils.js';

test('HTML ampersand escaped', () => {
    expect(escapeHtml('Teddy & Bear')).toBe('Teddy &amp; Bear');
});

test('HTML double quote escaped', () => {
    expect(escapeHtml('"Teddy"')).toBe('&quot;Teddy&quot;');
});

test('HTML single quote escaped', () => {
    expect(escapeHtml("'Teddy'")).toBe('&#39;Teddy&#39;');
});

test('HTML less than escaped', () => {
    expect(escapeHtml('<Teddy')).toBe('&lt;Teddy');
});

test('HTML greater than escaped', () => {
    expect(escapeHtml('Teddy>')).toBe('Teddy&gt;');
});

test('all special HTML characters escaped', () => {
    expect(escapeHtml('<a href="https://teddyful.com?a=1&b=2">Teddy\'s</a>'))
        .toBe(
            '&lt;a href=&quot;https://teddyful.com?a=1&amp;b=2&quot;&gt;' +
            'Teddy&#39;s&lt;/a&gt;'
        );
});

test('HTML escaping is applied in replacement order', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
});

test('plain string is unchanged by HTML escaping', () => {
    expect(escapeHtml('Teddy static website builder'))
        .toBe('Teddy static website builder');
});

test('empty string escapes to empty string', () => {
    expect(escapeHtml('')).toBe('');
});

test('null value escapes to empty string', () => {
    expect(escapeHtml(null)).toBe('');
});

test('undefined value escapes to empty string', () => {
    expect(escapeHtml(undefined)).toBe('');
});

test('number value converted to string before escaping', () => {
    expect(escapeHtml(123)).toBe('123');
});

test('boolean value converted to string before escaping', () => {
    expect(escapeHtml(false)).toBe('false');
});

test('object value converted to string before escaping', () => {
    expect(escapeHtml({})).toBe('[object Object]');
});

test('array value converted to string before escaping', () => {
    expect(escapeHtml(['Teddy', 'Bear'])).toBe('Teddy,Bear');
});

test('array value special characters escaped after string conversion', () => {
    expect(escapeHtml(['<Teddy>', '&Bear']))
        .toBe('&lt;Teddy&gt;,&amp;Bear');
});

test('comma separated list parsed correctly', () => {
    expect(parseCommaSeparatedList('africa,asia,europe'))
        .toEqual(['africa', 'asia', 'europe']);
});

test('comma separated list trims whitespace', () => {
    expect(parseCommaSeparatedList(' africa, asia , europe '))
        .toEqual(['africa', 'asia', 'europe']);
});

test('comma separated list removes duplicate values', () => {
    expect(parseCommaSeparatedList('africa,asia,africa,europe,asia'))
        .toEqual(['africa', 'asia', 'europe']);
});

test('comma separated list preserves first duplicate position', () => {
    expect(parseCommaSeparatedList('asia,africa,asia,europe'))
        .toEqual(['asia', 'africa', 'europe']);
});

test('comma separated list filters empty values', () => {
    expect(parseCommaSeparatedList('africa,, asia, ,europe,'))
        .toEqual(['africa', 'asia', 'europe']);
});

test('comma separated list with only commas returns empty array', () => {
    expect(parseCommaSeparatedList(',,,')).toEqual([]);
});

test('comma separated list with only whitespace returns empty array', () => {
    expect(parseCommaSeparatedList('   ')).toEqual([]);
});

test('empty comma separated list input returns empty array', () => {
    expect(parseCommaSeparatedList('')).toEqual([]);
});

test('null comma separated list input returns empty array', () => {
    expect(parseCommaSeparatedList(null)).toEqual([]);
});

test('undefined comma separated list input returns empty array', () => {
    expect(parseCommaSeparatedList(undefined)).toEqual([]);
});

test('false comma separated list input returns empty array', () => {
    expect(parseCommaSeparatedList(false)).toEqual([]);
});

test('zero comma separated list input returns empty array', () => {
    expect(parseCommaSeparatedList(0)).toEqual([]);
});

test('number comma separated list input converted to string', () => {
    expect(parseCommaSeparatedList(123)).toEqual(['123']);
});

test('boolean true comma separated list input converted to string', () => {
    expect(parseCommaSeparatedList(true)).toEqual(['true']);
});

test('array comma separated list input converted to string and parsed', () => {
    expect(parseCommaSeparatedList(['africa', 'asia']))
        .toEqual(['africa', 'asia']);
});

test('array comma separated list input trims and filters after conversion', () => {
    expect(parseCommaSeparatedList([' africa ', '', 'asia']))
        .toEqual(['africa', 'asia']);
});

test('object comma separated list input converted to string', () => {
    expect(parseCommaSeparatedList({})).toEqual(['[object Object]']);
});

test('comma separated list preserves case sensitivity for unique values', () => {
    expect(parseCommaSeparatedList('Africa,africa,AFRICA'))
        .toEqual(['Africa', 'africa', 'AFRICA']);
});

test('comma separated list preserves internal spaces', () => {
    expect(parseCommaSeparatedList('north america, south america'))
        .toEqual(['north america', 'south america']);
});

test('comma separated list does not split on semicolons', () => {
    expect(parseCommaSeparatedList('africa;asia,europe'))
        .toEqual(['africa;asia', 'europe']);
});

test('secret looking keys are redacted from nested objects', () => {
    expect(redactSecretLookingKeys({
        metadata: {
            title: 'Teddy',
            password: 'do-not-publish',
            auth_token: 'do-not-publish'
        },
        config: {
            nested: {
                client_secret: 'do-not-publish',
                safeValue: 'public'
            }
        }
    })).toEqual({
        metadata: {
            title: 'Teddy',
            password: '[REDACTED]',
            auth_token: '[REDACTED]'
        },
        config: {
            nested: {
                client_secret: '[REDACTED]',
                safeValue: 'public'
            }
        }
    });
});

test('secret looking keys are redacted from arrays', () => {
    expect(redactSecretLookingKeys([
        {
            name: 'public',
            access_token: 'do-not-publish'
        },
        {
            items: [
                {
                    private_key: 'do-not-publish',
                    label: 'safe'
                }
            ]
        }
    ])).toEqual([
        {
            name: 'public',
            access_token: '[REDACTED]'
        },
        {
            items: [
                {
                    private_key: '[REDACTED]',
                    label: 'safe'
                }
            ]
        }
    ]);
});

test('secret redaction does not mutate source values', () => {
    const source = {
        api_key: 'do-not-publish',
        nested: {
            token: 'do-not-publish'
        },
        items: [
            {
                secret: 'do-not-publish'
            }
        ]
    };
    const redacted = redactSecretLookingKeys(source);
    expect(redacted).toEqual({
        api_key: '[REDACTED]',
        nested: {
            token: '[REDACTED]'
        },
        items: [
            {
                secret: '[REDACTED]'
            }
        ]
    });
    expect(source).toEqual({
        api_key: 'do-not-publish',
        nested: {
            token: 'do-not-publish'
        },
        items: [
            {
                secret: 'do-not-publish'
            }
        ]
    });
});
