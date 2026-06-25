/**
 * Site taxonomy schema.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.12
 */

const siteTaxonomySchema = {
    type: 'object', 
    required: ['taxonomy'], 
    properties: {
        taxonomy: {
            type: 'object', 
            required: ['categories'], 
            properties: {
                categories: { type: 'object' }
            }
        }
    }
}

export default siteTaxonomySchema;
