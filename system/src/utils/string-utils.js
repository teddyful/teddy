/**
 * String utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

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

export { escapeHtml, parseCommaSeparatedList };
