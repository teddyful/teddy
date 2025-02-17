/**
 * Site configuration schema.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

const siteConfigSchema = {
    type: 'object', 
    required: ['site'], 
    properties: {
        site: {
            type: 'object', 
            required: [
                'assets', 
                'collection', 
                'html', 
                'languages', 
                'theme', 
                'version', 
                'web'
            ], 
            properties: {
                assets: {
                    type: 'object', 
                    required: ['minify'], 
                    properties: {
                        minify: {
                            type: 'object', 
                            required: ['css', 'html', 'js'], 
                            properties: {
                                css: { type: 'boolean' }, 
                                html: { type: 'boolean' }, 
                                js: { type: 'boolean' }
                            }
                        }
                    }
                }, 
                collection: {
                    type: 'object', 
                    properties: {
                        enabled: { type: 'boolean' }, 
                        index: {
                            type: 'object', 
                            required: ['documentStore'], 
                            properties: {
                                documentStore: {
                                    type: 'object', 
                                    required: ['document'], 
                                    properties: {
                                        document: {
                                            type: 'object', 
                                            required: [
                                                'id', 
                                                'index', 
                                                'store', 
                                                'tag'], 
                                            properties: {
                                                id: { type: 'string' }, 
                                                index: { type: 'array' }, 
                                                store: { type: 'boolean' }, 
                                                tag: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }, 
                        media: {
                            type: 'object', 
                            required: ['extensions'], 
                            properties: {
                                extensions: {
                                    type: 'object', 
                                    required: ['allowed'], 
                                    properties: {
                                        allowed: { type: 'array' }
                                    }
                                }
                            }
                        }, 
                        pagesDirName: { type: 'string' }, 
                        pagination: {
                            type: 'object', 
                            required: ['size'], 
                            properties: {
                                size: { type: 'integer' }
                            }
                        }, 
                        search: {
                            type: 'object', 
                            required: ['minQueryLength'], 
                            properties: {
                                minQueryLength: { type: 'integer' }
                            }
                        }, 
                        sort: {
                            type: 'object', 
                            required: ['key', 'order'], 
                            properties: {
                                key: { type: 'string' }, 
                                order: { type: 'string' }
                            }
                        }, 
                        taxonomy: {
                            type: 'object', 
                            required: ['categories'], 
                            properties: {
                                categories: { type: 'array' }
                            }
                        }
                    }, 
                    if: {
                        properties: {
                            enabled: { enum: [true] }
                        }
                    }, 
                    then: {
                        required: [
                            'index', 
                            'media', 
                            'pagesDirName', 
                            'pagination', 
                            'search', 
                            'sort', 
                            'taxonomy'
                        ]
                    }
                }, 
                html: {
                    type: 'object', 
                    required: ['inject'], 
                    properties: {
                        inject: {
                            type: 'object', 
                            required: ['metadata', 'systemAssets'], 
                            properties: {
                                metadata: { type: 'boolean' }, 
                                systemAssets: { type: 'boolean' }
                            }
                        }
                    }
                }, 
                languages: {
                    type: 'object', 
                    required: ['enabled'], 
                    properties: {
                        enabled: { type: 'array' }
                    }
                }, 
                theme: {
                    type: 'object', 
                    required: ['name'], 
                    properties: {
                        name: { type: 'string' }
                    }
                }, 
                version: { type: 'string' }, 
                web: {
                    type: 'object', 
                    required: ['domain', 'http', 'host'], 
                    properties: {
                        domain: { type: 'string' }, 
                        http: {
                            type: 'object', 
                            required: ['secure'], 
                            properties: {
                                secure: { type: 'boolean' }
                            }
                        }, 
                        host: {
                            type: 'object', 
                            required: ['apache', 'cloudflarePages'], 
                            properties: {
                                apache: { type: 'boolean' }, 
                                cloudflarePages: { type: 'boolean' }
                            }
                        }
                    }
                }
            }
        }
    }
}

export default siteConfigSchema;
