/**
 * Language utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// ISO 639 to ISO 3166 lookup.
const ISO_639_3166_LOOKUP = {
    "en": "en", 
    "eng": "en", 
    "ja": "jp", 
    "jpn": "jp", 
    "ko": "kr", 
    "kor": "kr", 
    "zh": "cn", 
    "zh-hk": "cn", 
    "zh-tw": "cn"
}

// CJK ISO 3166 language codes.
const CJK_ISO_3166 = ['jp', 'kr', 'cn'];

// Unciode encodings for characters used by languages 
// which rely on spaces to separate words.
const LANG_ALPHABETS = [
    [0x30, 0x39],       // 0-9
    [0x41, 0x5a],       // A-Z
    [0x61, 0x7a],       // a-z
    [0xc0, 0x2af],      // part of Latin-1 supplement / Latin extended A/B / IPA
    [0x370, 0x52f]      // Greek / Cyrillic / Cyrillic supplement
];

// Unicode encodings for characters used by languages
// where one character is one word.
const LANG_SINGLE_CHARS = [
    [0xe00, 0x0e5b],    // Thai
    [0x3040, 0x309f],   // Hiragana
    [0x4e00, 0x9fff],   // Chinese / Japanese / Korean
    [0xac00, 0xd7af]    // Hangul syllables
];

// Identify whether a given character is used by languages 
// which rely on spaces to separate words.
function isAlphabet(n) {
    for (let range of LANG_ALPHABETS) {
        if (n >= range[0] && n <= range[1]) {
            return true;
        }
    }
    return false;
}

// Identify whether a given character is used by languages 
// where one character is one word.
function isSingleChar(n) {
    for (let range of LANG_SINGLE_CHARS) {
        if (n >= range[0] && n <= range[1]) {
            return true;
        }
    }
    return false;
}

// Tokenizer that supports both types of languages.
function customTokenizer(str) {
    const length = str.length;
    const tokens = [];
    let last = '';
    for (let i = 0; i < length; i++) {
        let code = str.charCodeAt(i);
        if (isSingleChar(code)) {
            if (last) {
                if (last.length > 1) {
                    tokens.push(last.toLowerCase());
                }
                last = '';
            }
            tokens.push(str[i]);
        } else if (isAlphabet(code)) {
            last = last + str[i];
        } else {
            if (last) {
                if (last.length > 1) {
                    tokens.push(last.toLowerCase());
                }
                last = '';
            }
        }
    }
    if (last) {
        if (last.length > 1) {
            tokens.push(last.toLowerCase());
        }
        last = '';
    }
    return tokens;
}

// Custom CJK tokenizer.
function cjkTokenizer(str) {
    return str.replace(/[\x00-\x7F]/g, "").split("");
}

export { ISO_639_3166_LOOKUP, CJK_ISO_3166, 
    LANG_ALPHABETS, LANG_SINGLE_CHARS, 
    isAlphabet, isSingleChar, 
    customTokenizer, cjkTokenizer };
