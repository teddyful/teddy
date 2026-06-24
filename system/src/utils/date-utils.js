/**
 * Date utility functions.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

function formatDisplayDate(date) {
    return date.getDate() + ' '
        + date.toLocaleString('en-gb', { month: 'long' }) + ' ' 
        + date.getFullYear();
}

export { formatDisplayDate };
