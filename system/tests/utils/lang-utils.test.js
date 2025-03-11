/**
 * Language utility function tests.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import { expect, test } from 'vitest';
import { isAlphabet, isSingleChar, customTokenizer, cjkTokenizer } 
    from '../../src/utils/lang-utils.js';

test('character is used by languages that use spaces to separate words', () => {
    expect(isAlphabet('x'.charCodeAt(0))).toBe(true);
});

test('character is used by languages where one character is one word', () => {
    expect(isSingleChar('龍'.charCodeAt(0))).toBe(true);
});

test('custom tokenizer splits correctly on both types of languages', () => {
    const text = '私の名前はJillurです';
    const expectedTokens = ['私', 'の', '名', '前', 'は', 'jillur', 'で', 'す'];
    expect(customTokenizer(text)).toEqual(expectedTokens);
});

test('custom CJK tokenizer generates the correct tokens', () => {
    const text = '龍噴火';
    const expectedTokens = ['龍', '噴', '火'];
    expect(cjkTokenizer(text)).toEqual(expectedTokens);
});
