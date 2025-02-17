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
            required: ['assets', 'build'], 
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
                build: {
                    type: 'object', 
                    required: ['siteDirs', 'siteDistDir'], 
                    properties: {
                        siteDirs: {
                            type: 'object', 
                            required: ['languages', 'pages', 'themes', 'web'], 
                            properties: {
                                languages: { type: 'string' }, 
                                pages: { type: 'string' }, 
                                themes: { type: 'string' }, 
                                web: { type: 'string' }, 
                            }
                        }, 
                        siteDistDir: { type: 'string' }
                    }
                }
            }
            
        }
    }
}

export default systemConfigSchema;
