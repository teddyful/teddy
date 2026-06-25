/**
 * String utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.15
 */

const SECRET_KEY_REGEX = /(?:^|[-_.])(?:api[-_]?key|access[-_]?token|auth[-_]?token|bearer[-_]?token|client[-_]?secret|credential|credentials|jwt|password|private[-_]?key|secret|secret[-_]?key|token)(?:$|[-_.])|(?:^|[a-z0-9])(?:apiKey|accessToken|authToken|bearerToken|clientSecret|privateKey|secretKey|jwt|password|secret|token|credentials?)(?:$|[A-Z])/i;
const REDACTED_SECRET_VALUE = '[REDACTED]';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseCommaSeparatedList(value) {
    if ( !value ) {
        return [];
    }
    return [...new Set(
        String(value)
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
    )];
}

function redactSecretLookingKeys(value) {
    if ( Array.isArray(value) ) {
        return value.map(item => redactSecretLookingKeys(item));
    }
    if ( value !== null && typeof value === 'object' ) {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => {
                if ( SECRET_KEY_REGEX.test(key) ) {
                    return [key, REDACTED_SECRET_VALUE];
                }
                return [key, redactSecretLookingKeys(nestedValue)];
            })
        );
    }
    return value;
}

export { escapeHtml, parseCommaSeparatedList, redactSecretLookingKeys };
