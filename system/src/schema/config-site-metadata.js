/**
 * Site metadata schema.
 *
 * @author jillurquddus
 * @since  0.0.12
 */

const siteMetadataSchema = {
    type: 'object', 
    required: ['metadata'], 
    properties: {
        metadata: {
            type: 'object', 
            required: [
                'description', 
                'keywords', 
                'title'
            ], 
            properties: {
                description: { type: 'string' }, 
                keywords: { type: 'string' }, 
                title: { type: 'string' }
            }
        }
    }
}

export default siteMetadataSchema;
