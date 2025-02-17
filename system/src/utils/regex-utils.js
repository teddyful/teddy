/**
 * Regex utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Generate a regular expression to find variable placeholders 
// with a given namespace e.g. ${config.collection.metadata.size}, 
// ${page.metadata.name} etc.
function generateVarPlaceholderFinderRegex(namespace) {
    return new RegExp('\\$\\{(' + namespace + '.)([^}]+)\\}', 'gi');
}

// Detect and extract all variable placeholders in a given text 
// e.g. ${page.metadata.name}, ${page.metadata.description} etc.
function getVarPlaceholders(text, namespace) {
    const regex = generateVarPlaceholderFinderRegex(namespace);
    const matches = new Set();
    [...text.matchAll(regex)].forEach((hit) => {
        matches.add(hit[0]);
    });
    return matches;
}

// Get the nested keys from a variable placeholder within a given namespace 
// e.g. ${page.metadata.author.name} -> ['author', 'name'] 
function getNestedKeysFromVarPlaceholder(varPlaceholder, namespace) {
    return varPlaceholder
        .replace(/[\$\{\}]+/g, '')
        .replace(namespace + '.', '')
        .split('.');
}

export { getVarPlaceholders, getNestedKeysFromVarPlaceholder };
