/**
 * Theme configuration schema.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

const themeConfigSchema = {
    type: 'object', 
    required: ['theme'], 
    properties: {
        theme: {
            type: 'object', 
            required: [
                'assets', 
                'author', 
                'name', 
                'version'
            ], 
            properties: {
                assets: {
                    type: 'object', 
                    required: ['custom'], 
                    properties: {
                        custom: {
                            type: 'object', 
                            required: ['css', 'images', 'js'], 
                            properties: {
                                css: { type: 'array' }, 
                                images: { 
                                    type: 'object', 
                                    properties: {
                                        favicon: {
                                            type: 'object', 
                                            properties: {
                                                deployToRoot: { type: 'boolean' }, 
                                                ico: { type: 'string' }
                                            }
                                        }, 
                                        og: {
                                            type: 'object', 
                                            properties: {
                                                default: { type: 'string' }, 
                                                userCover: { type: 'boolean' }
                                            }
                                        }
                                    } 
                                }, 
                                js: { type: 'array' }
                            }
                        }
                    }
                }, 
                author: { type: 'string' }, 
                name: { type: 'string' }, 
                version: { type: 'string' }
            }
        }
    } 
}

export default themeConfigSchema;
