/**
 * System configuration schema.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

const systemConfigSchema = {
    type: 'object', 
    required: ['system'], 
    properties: {
        system: {
            type: 'object', 
            required: ['assets', 'sites', 'themes'], 
            properties: {
                assets: {
                    type: 'object', 
                    required: ['dir', 'js'], 
                    properties: {
                        dir: { type: 'string' }, 
                        js: {
                            type: 'object', 
                            required: ['teddy', 'vendors'], 
                            properties: {
                                teddy: { type: 'array' }, 
                                vendors: { type: 'array' }
                            }
                        }
                    }
                }, 
                sites: { type: 'string' }, 
                themes: { type: 'string' }
            }
            
        }
    }
}

export default systemConfigSchema;
