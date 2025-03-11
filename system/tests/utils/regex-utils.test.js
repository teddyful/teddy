/**
 * Regex utility function tests.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { expect, test } from 'vitest';
import { getVarPlaceholders, getNestedKeysFromVarPlaceholder } 
    from '../../src/utils/regex-utils.js';


test('variable placeholders are extracted correctly', () => {
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

test('nested keys are extracted from a variable placeholder correctly', () => {
    const placeholder = '${page.metadata.author.name}';
    const expectedNestedKeys = ['author', 'name'];
    expect(getNestedKeysFromVarPlaceholder(placeholder, 'page.metadata'))
        .toEqual(expectedNestedKeys);
});
