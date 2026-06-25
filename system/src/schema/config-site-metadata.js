/**
 * Site metadata schema.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.12
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
