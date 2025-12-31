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
                'datasources', 
                'html', 
                'languages', 
                'name', 
                'version', 
                'web'
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
                collection: {
                    type: 'object', 
                    properties: {
                        enabled: { type: 'boolean' }, 
                        index: {
                            type: 'object', 
                            required: ['content', 'documentStore'], 
                            properties: {
                                content: { type: 'boolean' }, 
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
                        pagesDir: { type: 'string' }, 
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
                            'pagesDir', 
                            'pagination', 
                            'search', 
                            'sort', 
                            'taxonomy'
                        ]
                    }
                }, 
                datasources: {
                    type: 'object', 
                    required: ['fonts'], 
                    properties: {
                        fonts: { type: 'object' }
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
                name: { type: 'string' }, 
                version: { type: 'string' }, 
                web: {
                    type: 'object', 
                    patternProperties: {
                        "^.*$": {
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
                                host: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }
}

export default siteConfigSchema;
