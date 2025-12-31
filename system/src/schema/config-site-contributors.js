/**
 * Site contributors schema.
 *
 * @author jillurquddus
 * @since  0.0.12
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
