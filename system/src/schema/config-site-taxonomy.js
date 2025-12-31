/**
 * Site taxonomy schema.
 *
 * @author jillurquddus
 * @since  0.0.12
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
