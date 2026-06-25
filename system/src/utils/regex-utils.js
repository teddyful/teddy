/**
 * Regex utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

// Escape a string value before using it in a regular expression.
function escapeRegex(value) {
    return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate a regular expression to find variable placeholders 
// with a given namespace e.g. ${config.collection.metadata.size}, 
// ${page.metadata.name} etc.
function generateVarPlaceholderFinderRegex(namespace) {
    const escapedNamespace = escapeRegex(namespace);
    return new RegExp(`\\$\\{(${escapedNamespace}\\.)([^}]+)\\}`, 'g');
}

// Detect and extract all variable placeholders in a given text 
// e.g. ${page.metadata.name}, ${page.metadata.description} etc.
function getVarPlaceholders(text, namespace) {
    const sourceText = String(text ?? '');
    const regex = generateVarPlaceholderFinderRegex(namespace);
    const matches = new Set();
    [...sourceText.matchAll(regex)].forEach((hit) => {
        matches.add(hit[0]);
    });
    return matches;
}

// Get the nested keys from a variable placeholder within a given namespace 
// e.g. ${page.metadata.author.name} -> ['author', 'name'] 
function getNestedKeysFromVarPlaceholder(varPlaceholder, namespace) {
    const normalizedPlaceholder = String(varPlaceholder ?? '');
    const normalizedNamespace = String(namespace ?? '');
    const prefix = '${' + normalizedNamespace + '.';
    const suffix = '}';
    if ( !normalizedPlaceholder.startsWith(prefix) ||
            !normalizedPlaceholder.endsWith(suffix) ) {
        return [];
    }
    return normalizedPlaceholder
        .slice(prefix.length, -suffix.length)
        .split('.')
        .filter(key => key.length > 0);
}

export { getVarPlaceholders, getNestedKeysFromVarPlaceholder };
