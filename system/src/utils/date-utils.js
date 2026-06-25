/**
 * Date utility functions.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

function formatDisplayDate(date) {
    return date.getDate() + ' '
        + date.toLocaleString('en-gb', { month: 'long' }) + ' ' 
        + date.getFullYear();
}

export { formatDisplayDate };
