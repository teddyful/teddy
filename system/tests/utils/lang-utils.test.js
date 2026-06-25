/**
 * Language utility function tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { expect, test } from 'vitest';
import {
    ISO_639_3166_LOOKUP,
    CJK_ISO_3166,
    LANG_ALPHABETS,
    LANG_SINGLE_CHARS,
    isAlphabet,
    isSingleChar,
    customTokenizer,
    cjkTokenizer
} from '../../src/utils/lang-utils.js';

test('character is used by languages that use spaces to separate words v1', () => {
    expect(isAlphabet('x'.charCodeAt(0))).toBe(true);
});

test('character is used by languages where one character is one word v1', () => {
    expect(isSingleChar('龍'.charCodeAt(0))).toBe(true);
});

test('custom tokenizer splits correctly on both types of languages v1', () => {
    const text = '私の名前はJillurです';
    const expectedTokens = ['私', 'の', '名', '前', 'は', 'jillur', 'で', 'す'];
    expect(customTokenizer(text)).toEqual(expectedTokens);
});

test('custom CJK tokenizer generates the correct tokens v1', () => {
    const text = '龍噴火';
    const expectedTokens = ['龍', '噴', '火'];
    expect(cjkTokenizer(text)).toEqual(expectedTokens);
});

test('ISO 639 to ISO 3166 lookup contains supported language mappings', () => {
    expect(ISO_639_3166_LOOKUP).toMatchObject({
        en: 'en',
        eng: 'en',
        ja: 'jp',
        jpn: 'jp',
        ko: 'kr',
        kor: 'kr',
        zh: 'cn',
        'zh-cn': 'cn',
        'zh-hk': 'cn',
        'zh-tw': 'cn'
    });
});

test('CJK ISO 3166 list contains Japanese Korean and Chinese country codes', () => {
    expect(CJK_ISO_3166).toEqual(['jp', 'kr', 'cn']);
});

test('language alphabet ranges are exported', () => {
    expect(LANG_ALPHABETS).toEqual([
        [0x30, 0x39],
        [0x41, 0x5a],
        [0x61, 0x7a],
        [0xc0, 0x2af],
        [0x370, 0x52f]
    ]);
});

test('single character language ranges are exported', () => {
    expect(LANG_SINGLE_CHARS).toEqual([
        [0xe00, 0x0e5b],
        [0x3040, 0x309f],
        [0x4e00, 0x9fff],
        [0xac00, 0xd7af]
    ]);
});

test('ASCII digits are alphabet characters', () => {
    expect(isAlphabet('0'.charCodeAt(0))).toBe(true);
    expect(isAlphabet('9'.charCodeAt(0))).toBe(true);
});

test('ASCII uppercase letters are alphabet characters', () => {
    expect(isAlphabet('A'.charCodeAt(0))).toBe(true);
    expect(isAlphabet('Z'.charCodeAt(0))).toBe(true);
});

test('ASCII lowercase letters are alphabet characters', () => {
    expect(isAlphabet('a'.charCodeAt(0))).toBe(true);
    expect(isAlphabet('z'.charCodeAt(0))).toBe(true);
});

test('Latin extended characters are alphabet characters', () => {
    expect(isAlphabet('é'.charCodeAt(0))).toBe(true);
    expect(isAlphabet('ā'.charCodeAt(0))).toBe(true);
});

test('Greek and Cyrillic characters are alphabet characters', () => {
    expect(isAlphabet('Ω'.charCodeAt(0))).toBe(true);
    expect(isAlphabet('Ж'.charCodeAt(0))).toBe(true);
});

test('punctuation and whitespace are not alphabet characters', () => {
    expect(isAlphabet('-'.charCodeAt(0))).toBe(false);
    expect(isAlphabet(' '.charCodeAt(0))).toBe(false);
    expect(isAlphabet('.'.charCodeAt(0))).toBe(false);
});

test('single character language characters are not alphabet characters', () => {
    expect(isAlphabet('龍'.charCodeAt(0))).toBe(false);
    expect(isAlphabet('あ'.charCodeAt(0))).toBe(false);
    expect(isAlphabet('한'.charCodeAt(0))).toBe(false);
});

test('invalid alphabet character code returns false', () => {
    expect(isAlphabet(Number.NaN)).toBe(false);
    expect(isAlphabet(undefined)).toBe(false);
});

test('Thai characters are single character language characters', () => {
    expect(isSingleChar('ก'.charCodeAt(0))).toBe(true);
    expect(isSingleChar('๛'.charCodeAt(0))).toBe(true);
});

test('Hiragana characters are single character language characters', () => {
    expect(isSingleChar('あ'.charCodeAt(0))).toBe(true);
    expect(isSingleChar('ん'.charCodeAt(0))).toBe(true);
});

test('Chinese Japanese Korean ideographs are single character language characters', () => {
    expect(isSingleChar('一'.charCodeAt(0))).toBe(true);
    expect(isSingleChar('龍'.charCodeAt(0))).toBe(true);
});

test('Hangul syllables are single character language characters', () => {
    expect(isSingleChar('가'.charCodeAt(0))).toBe(true);
    expect(isSingleChar('힣'.charCodeAt(0))).toBe(true);
});

test('ASCII alphabet characters are not single character language characters', () => {
    expect(isSingleChar('a'.charCodeAt(0))).toBe(false);
    expect(isSingleChar('Z'.charCodeAt(0))).toBe(false);
    expect(isSingleChar('1'.charCodeAt(0))).toBe(false);
});

test('punctuation and whitespace are not single character language characters', () => {
    expect(isSingleChar('-'.charCodeAt(0))).toBe(false);
    expect(isSingleChar(' '.charCodeAt(0))).toBe(false);
    expect(isSingleChar('.'.charCodeAt(0))).toBe(false);
});

test('invalid single character code returns false', () => {
    expect(isSingleChar(Number.NaN)).toBe(false);
    expect(isSingleChar(undefined)).toBe(false);
});

test('custom tokenizer returns empty array for empty string', () => {
    expect(customTokenizer('')).toEqual([]);
});

test('custom tokenizer lowercases ASCII words', () => {
    expect(customTokenizer('Teddy Builder')).toEqual(['teddy', 'builder']);
});

test('custom tokenizer ignores one-character alphabet tokens', () => {
    expect(customTokenizer('a bb c dd')).toEqual(['bb', 'dd']);
});

test('custom tokenizer keeps multi-character numeric tokens', () => {
    expect(customTokenizer('v 12 build 345')).toEqual(['12', 'build', '345']);
});

test('custom tokenizer joins adjacent alphabet and numeric characters', () => {
    expect(customTokenizer('Teddy2025')).toEqual(['teddy2025']);
});

test('custom tokenizer splits alphabet tokens on punctuation', () => {
    expect(customTokenizer('hello-world_teddy.cms')).toEqual([
        'hello',
        'world',
        'teddy',
        'cms'
    ]);
});

test('custom tokenizer supports Latin extended characters', () => {
    expect(customTokenizer('Café naïve')).toEqual(['café', 'naïve']);
});

test('custom tokenizer supports Greek and Cyrillic words', () => {
    expect(customTokenizer('Αθήνα Москва')).toEqual(['αθήνα', 'москва']);
});

test('custom tokenizer emits CJK characters as individual tokens', () => {
    expect(customTokenizer('龍噴火')).toEqual(['龍', '噴', '火']);
});

test('custom tokenizer emits Thai characters as individual tokens', () => {
    expect(customTokenizer('ภาษา')).toEqual(['ภ', 'า', 'ษ', 'า']);
});

test('custom tokenizer emits Hangul syllables as individual tokens', () => {
    expect(customTokenizer('한국')).toEqual(['한', '국']);
});

test('custom tokenizer splits correctly on mixed alphabet and single character languages', () => {
    const text = '私の名前はJillurです';
    expect(customTokenizer(text)).toEqual([
        '私',
        'の',
        '名',
        '前',
        'は',
        'jillur',
        'で',
        'す'
    ]);
});

test('custom tokenizer flushes alphabet token before CJK token', () => {
    expect(customTokenizer('Teddy熊')).toEqual(['teddy', '熊']);
});

test('custom tokenizer starts a new alphabet token after CJK token', () => {
    expect(customTokenizer('熊Teddy')).toEqual(['熊', 'teddy']);
});

test('custom tokenizer ignores emoji and other unsupported symbols', () => {
    expect(customTokenizer('Teddy 🧸 Builder')).toEqual(['teddy', 'builder']);
});

test('custom tokenizer ignores unsupported symbols between single-letter alphabet tokens', () => {
    expect(customTokenizer('a+b=c')).toEqual([]);
});

test('custom tokenizer flushes trailing alphabet token', () => {
    expect(customTokenizer('hello')).toEqual(['hello']);
});

test('custom tokenizer ignores trailing one-character alphabet token', () => {
    expect(customTokenizer('hello x')).toEqual(['hello']);
});

test('CJK tokenizer returns empty array for empty string', () => {
    expect(cjkTokenizer('')).toEqual([]);
});

test('CJK tokenizer generates one token per non-ASCII character', () => {
    expect(cjkTokenizer('龍噴火')).toEqual(['龍', '噴', '火']);
});

test('CJK tokenizer removes ASCII letters before tokenizing', () => {
    expect(cjkTokenizer('abc龍def噴')).toEqual(['龍', '噴']);
});

test('CJK tokenizer removes ASCII numbers and punctuation before tokenizing', () => {
    expect(cjkTokenizer('2025-龍,噴.火!')).toEqual(['龍', '噴', '火']);
});

test('CJK tokenizer keeps Hiragana characters', () => {
    expect(cjkTokenizer('abcあいう')).toEqual(['あ', 'い', 'う']);
});

test('CJK tokenizer keeps Hangul characters', () => {
    expect(cjkTokenizer('abc한국')).toEqual(['한', '국']);
});

test('CJK tokenizer keeps Thai characters because they are non-ASCII', () => {
    expect(cjkTokenizer('abcภาษา')).toEqual(['ภ', 'า', 'ษ', 'า']);
});

test('CJK tokenizer keeps non-ASCII Latin characters', () => {
    expect(cjkTokenizer('Cafe Café')).toEqual(['é']);
});

test('CJK tokenizer returns empty array for ASCII-only text', () => {
    expect(cjkTokenizer('Teddy 2025!')).toEqual([]);
});
