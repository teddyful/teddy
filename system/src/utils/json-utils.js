/**
 * JSON utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Determine whether a given nested key exists in a given JSON object.
function exists(json, key, ...rest) {
    if (json === null || json === undefined || typeof json !== 'object' ) 
        return false;
    if (rest.length === 0 && Object.hasOwn(json, key)) 
        return true;
    return exists(json[key], ...rest);
}

// Get a value from a given JSON object given a list of nested & ordered keys.
function getValue(json, nestedKeysOrFirstKey, ...restKeys) {
    const nestedKeys = Array.isArray(nestedKeysOrFirstKey) ? 
        nestedKeysOrFirstKey : [nestedKeysOrFirstKey, ...restKeys];
    let value = json;
    for (const key of nestedKeys) {
        if ( value === null || typeof value !== 'object' || !(key in value) ) {
            return undefined;
        }
        value = value[key];
    }
    return value;
}

// Normalize sort order.
function normalizeSortOrder(order) {
    return order === 'desc' ? 'desc' : 'asc';
}

// Get sortable string value including missing and null values.
function getSortableStringValue(item, key) {
    return String(item?.[key] ?? '');
}

// Get sortable numeric value including missing and non-numeric values.
function getSortableNumberValue(item, key) {
    const value = Number(item?.[key]);
    return Number.isNaN(value) ? 0 : value;
}

// Sort a given array of JSON objects by a given key.
function sort(arr, key, order) {
    if ( !Array.isArray(arr) || arr.length === 0 ) {
        return [];
    }
    const sortedArr = [...arr];
    const sortOrder = normalizeSortOrder(order);
    const keyDataType = typeof sortedArr[0][key];
    if ( keyDataType === 'string' ) {
        return sortOrder === 'desc' ?
            sortedArr.sort((a, b) =>
                getSortableStringValue(b, key)
                    .localeCompare(getSortableStringValue(a, key))) :
            sortedArr.sort((a, b) =>
                getSortableStringValue(a, key)
                    .localeCompare(getSortableStringValue(b, key)));
    }
    return sortOrder === 'desc' ?
        sortedArr.sort((a, b) =>
            getSortableNumberValue(b, key) -
                getSortableNumberValue(a, key)) :
        sortedArr.sort((a, b) =>
            getSortableNumberValue(a, key) -
                getSortableNumberValue(b, key));
}

export { exists, getValue, sort };
