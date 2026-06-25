/**
 * Regex utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { expect, test } from 'vitest';
import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } 
    from '../../src/utils/regex-utils.js';

test('variable placeholders are extracted correctly 01', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + 
        'Ut venenatis ex sem, ${page.metadata.name} in vulputate est ' + 
        'finibus in purus commodo, ${page.metadata.description} placerat mi. ' + 
        'Praesent ornare justo ${page.metadata.author.name} vitae iaculis.';
    const expectedMatches = new Set();
    [
        '${page.metadata.name}', 
        '${page.metadata.description}', 
        '${page.metadata.author.name}'
    ].forEach((match) => {
        expectedMatches.add(match);
    });
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(expectedMatches);
});

test('variable placeholders are extracted correctly 02', () => {
    const text = 'Lorem ipsum ${page.metadata.name} dolor ' +
        '${page.metadata.description} sit amet ' +
        '${page.metadata.author.name}.';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.name}',
        '${page.metadata.description}',
        '${page.metadata.author.name}'
    ]));
});

test('duplicate variable placeholders are returned once', () => {
    const text = '${page.metadata.name} ${page.metadata.name}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.name}'
    ]));
});

test('variable placeholders are extracted for dotted namespace', () => {
    const text = '${config.collection.metadata.size} ' +
        '${config.collection.metadata.pageCount}';
    expect(getVarPlaceholders(text, 'config.collection.metadata'))
        .toEqual(new Set([
            '${config.collection.metadata.size}',
            '${config.collection.metadata.pageCount}'
        ]));
});

test('namespace regex metacharacters are escaped before matching', () => {
    const text = '${config.collection.metadata.name} ' +
        '${configXcollectionXmetadata.name}';
    expect(getVarPlaceholders(text, 'config.collection.metadata'))
        .toEqual(new Set([
            '${config.collection.metadata.name}'
        ]));
});

test('placeholders from different namespaces are ignored', () => {
    const text = '${page.metadata.name} ${config.site.name}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.name}'
    ]));
});

test('partial namespace matches are ignored', () => {
    const text = '${page.metadata.name} ${page.metadataExtra.name} ' +
        '${xpage.metadata.name}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.name}'
    ]));
});

test('case-sensitive namespace matching is used', () => {
    const text = '${page.metadata.name} ${Page.Metadata.name}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.name}'
    ]));
});

test('placeholder values may contain multiple nested keys', () => {
    const text = '${page.metadata.author.profile.displayName}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.author.profile.displayName}'
    ]));
});

test('placeholder values may contain spaces', () => {
    const text = '${page.metadata.author name}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set([
        '${page.metadata.author name}'
    ]));
});

test('malformed placeholder without closing brace is ignored', () => {
    const text = '${page.metadata.name';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set());
});

test('placeholder with empty nested key is ignored by finder', () => {
    const text = '${page.metadata.}';
    expect(getVarPlaceholders(text, 'page.metadata')).toEqual(new Set());
});

test('non-string text returns no placeholders', () => {
    expect(getVarPlaceholders(null, 'page.metadata')).toEqual(new Set());
    expect(getVarPlaceholders(undefined, 'page.metadata')).toEqual(new Set());
    expect(getVarPlaceholders(123, 'page.metadata')).toEqual(new Set());
});

test('nested keys are extracted from a variable placeholder correctly', () => {
    const placeholder = '${page.metadata.author.name}';
    const expectedNestedKeys = ['author', 'name'];
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual(expectedNestedKeys);
});

test('single nested key is extracted from a variable placeholder correctly', () => {
    const placeholder = '${page.metadata.name}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual(['name']);
});

test('deep nested keys are extracted from a variable placeholder correctly', () => {
    const placeholder = '${config.collection.metadata.pagination.size}';
    expect(getNestedKeysFromVarPlaceholder(
        placeholder,
        'config.collection.metadata'
    )).toEqual(['pagination', 'size']);
});

test('empty nested key segments are filtered out', () => {
    const placeholder = '${page.metadata.author..name}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual(['author', 'name']);
});

test('trailing empty nested key segment is filtered out', () => {
    const placeholder = '${page.metadata.author.}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual(['author']);
});

test('placeholder with only namespace returns empty nested keys', () => {
    const placeholder = '${page.metadata.}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual([]);
});

test('wrong namespace returns empty nested keys', () => {
    const placeholder = '${page.metadata.author.name}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'config.metadata'))
        .toEqual([]);
});

test('placeholder without opening syntax returns empty nested keys', () => {
    const placeholder = 'page.metadata.author.name}';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual([]);
});

test('placeholder without closing brace returns empty nested keys', () => {
    const placeholder = '${page.metadata.author.name';
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual([]);
});

test('non-string placeholder returns empty nested keys', () => {
    expect(getNestedKeysFromVarPlaceholder(null, 'page.metadata')).toEqual([]);
    expect(getNestedKeysFromVarPlaceholder(undefined, 'page.metadata'))
        .toEqual([]);
    expect(getNestedKeysFromVarPlaceholder(123, 'page.metadata')).toEqual([]);
});

test('null namespace only matches normalized null namespace shape', () => {
    expect(getNestedKeysFromVarPlaceholder('${.name}', null))
        .toEqual(['name']);
});

test('namespace containing regex metacharacters is treated literally', () => {
    const text = '${config.*.metadata.name} ${configXXXmetadata.name}';
    expect(getVarPlaceholders(text, 'config.*.metadata')).toEqual(new Set([
        '${config.*.metadata.name}'
    ]));
});
