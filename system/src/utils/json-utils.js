/**
 * JSON utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

// Determine whether a given nested key exists in a given JSON object.
function exists(json, key, ...rest) {
    if (json === undefined) return false;
    if (rest.length == 0 && json.hasOwnProperty(key)) return true;
    return exists(json[key], ...rest);
}

// Get a value from a given JSON object given a list of nested & ordered keys.
function getValue(json, nestedKeys) {
    let value = json;
    for (const key of nestedKeys) {
        value = value[key];
    }
    return value;
}

// Sort a given array of JSON objects by a given key.
function sort(arr, key, order) {
    const keyDataType = typeof arr[0][key];
    if ( keyDataType === 'string' ) {
        return order == 'desc' ? 
            arr.sort((a, b) => b[key].localeCompare(a[key])) : 
            arr.sort((a, b) => a[key].localeCompare(b[key]))
    } else {
        return order == 'desc' ? 
            arr.sort((a, b) => b[key] - a[key]) : 
            arr.sort((a, b) => a[key] - b[key])
    }
}

export { exists, getValue, sort };
