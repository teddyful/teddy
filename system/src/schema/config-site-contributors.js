/**
 * Site contributors schema.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.12
 */

const siteContributorsSchema = {
    type: 'object', 
    required: ['contributors'], 
    properties: {
        contributors: {
            type: 'object', 
            required: ['default'], 
            properties: {
                default: { type: 'string' }
            }
        }
    }
}

export default siteContributorsSchema;
