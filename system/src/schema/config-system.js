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
                    required: ['dir', 'fonts', 'js'], 
                    properties: {
                        dir: { type: 'string' }, 
                        fonts: {
                            type: 'object', 
                            required: [
                                'ja', 
                                'jpn', 
                                'ko', 
                                'kor', 
                                'zh', 
                                'zh-cn', 
                                'zh-hk', 
                                'zh-sg', 
                                'zh-tw'
                            ], 
                            properties: {
                                ja: { type: 'string' }, 
                                jpn: { type: 'string' }, 
                                ko: { type: 'string' }, 
                                kor: { type: 'string' }, 
                                zh: { type: 'string' }, 
                                'zh-cn': { type: 'string' }, 
                                'zh-hk': { type: 'string' }, 
                                'zh-sg': { type: 'string' }, 
                                'zh-tw': { type: 'string' }
                            }
                        }, 
                        js: {
                            type: 'object', 
                            required: ['site', 'teddy', 'vendors'], 
                            properties: {
                                site: { type: 'array' }, 
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
