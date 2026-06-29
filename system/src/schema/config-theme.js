/**
 * Theme configuration schema.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

const themeConfigSchema = {
    type: 'object', 
    required: ['theme'], 
    properties: {
        theme: {
            type: 'object', 
            required: [
                'author', 
                'name', 
                'version'
            ], 
            properties: {
                assets: {
                    type: 'object', 
                    properties: {
                        custom: {
                            type: 'object', 
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
                                                useCover: { type: 'boolean' }
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
