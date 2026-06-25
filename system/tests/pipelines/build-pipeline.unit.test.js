/**
 * Build pipeline unit tests.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mockState = vi.hoisted(() => {
    return {
        calls: [],
        failAt: null,
        languageIndexKeys: {
            en: ['1.doc', '1.reg']
        },
        configs: {
            aggregated: {
                marker: 'aggregated',
                build: {
                    distDirs: {
                        base: 'public-aggregated'
                    }
                }
            },
            collection: {
                marker: 'collection',
                build: {
                    distDirs: {
                        base: 'public-collection'
                    }
                }
            },
            error: {
                marker: 'error',
                build: {
                    distDirs: {
                        base: 'public-error'
                    }
                }
            }
        }
    };
});

function record(name, args = []) {
    mockState.calls.push({
        name,
        args
    });
}

function callNames() {
    return mockState.calls.map(call => call.name);
}

vi.mock('../../src/middleware/logger.js', () => {
    return {
        default: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        }
    };
});

vi.mock('../../src/services/config-validator.js', () => {
    return {
        default: class ConfigValidator {
            constructor(systemConfig, opts) {
                record('ConfigValidator.constructor', [systemConfig, opts]);
            }
            validate() {
                record('ConfigValidator.validate');
                if ( mockState.failAt === 'validate' ) {
                    throw new Error('Validation failed.');
                }
            }
        }
    };
});

vi.mock('../../src/services/config-builder.js', () => {
    return {
        default: class ConfigBuilder {
            constructor(packageConfig, systemConfig, opts) {
                record('ConfigBuilder.constructor', [
                    packageConfig,
                    systemConfig,
                    opts
                ]);
            }
            build(error = false) {
                record('ConfigBuilder.build', [error]);
                if ( mockState.failAt === 'buildConfig' ) {
                    throw new Error('Config build failed.');
                }
                return error ?
                    mockState.configs.error :
                    mockState.configs.aggregated;
            }
        }
    };
});

vi.mock('../../src/services/collection-builder.js', () => {
    return {
        default: class CollectionBuilder {
            constructor(config) {
                record('CollectionBuilder.constructor', [config]);
            }
            build() {
                record('CollectionBuilder.build');
                if ( mockState.failAt === 'collectionBuild' ) {
                    throw new Error('Collection build failed.');
                }
                return mockState.configs.collection;
            }
            async index() {
                record('CollectionBuilder.index');
                if ( mockState.failAt === 'collectionIndex' ) {
                    throw new Error('Collection index failed.');
                }
            }
            getLanguageIndexKeys() {
                record('CollectionBuilder.getLanguageIndexKeys');
                return mockState.languageIndexKeys;
            }
        }
    };
});

vi.mock('../../src/services/build-cleaner.js', () => {
    return {
        default: class BuildCleaner {
            constructor(config) {
                record('BuildCleaner.constructor', [config]);
            }
            cleanDistDirectories() {
                record('BuildCleaner.cleanDistDirectories');
            }
            postBuildCleanup() {
                record('BuildCleaner.postBuildCleanup');
            }
            postErrorBuildCleanup() {
                record('BuildCleaner.postErrorBuildCleanup');
                if ( mockState.postErrorCleanupShouldFail ) {
                    throw new Error('Post-error cleanup failed.');
                }
            }
        }
    };
});

vi.mock('../../src/services/build-setup.js', () => {
    return {
        default: class BuildSetup {
            constructor(config) {
                record('BuildSetup.constructor', [config]);
            }
            createDistDirectoryStructure() {
                record('BuildSetup.createDistDirectoryStructure');
            }
            createBaseDistDirectory() {
                record('BuildSetup.createBaseDistDirectory');
            }
        }
    };
});

vi.mock('../../src/services/build-deployer.js', () => {
    return {
        default: class BuildDeployer {
            constructor(config) {
                record('BuildDeployer.constructor', [config]);
            }
            deployBuildConfig() {
                record('BuildDeployer.deployBuildConfig');
            }
            deployBuildMetadata() {
                record('BuildDeployer.deployBuildMetadata');
            }
            deployLanguages() {
                record('BuildDeployer.deployLanguages');
            }
            deployWebConfig() {
                record('BuildDeployer.deployWebConfig');
            }
            deployRobots() {
                record('BuildDeployer.deployRobots');
            }
            deploySitemap() {
                record('BuildDeployer.deploySitemap');
            }
            deployDefaultLanguagePages() {
                record('BuildDeployer.deployDefaultLanguagePages');
            }
            deployBuildErrorPage() {
                record('BuildDeployer.deployBuildErrorPage');
            }
        }
    };
});

vi.mock('../../src/services/template-builder.js', () => {
    return {
        default: class TemplateBuilder {
            constructor(config) {
                record('TemplateBuilder.constructor', [config]);
            }
            async translateTemplates() {
                record('TemplateBuilder.translateTemplates');
                if ( mockState.failAt === 'templates' ) {
                    throw new Error('Template build failed.');
                }
            }
        }
    };
});

vi.mock('../../src/services/page-builder.js', () => {
    return {
        default: class PageBuilder {
            constructor(config) {
                record('PageBuilder.constructor', [config]);
            }
            async translatePages() {
                record('PageBuilder.translatePages');
                if ( mockState.failAt === 'pages' ) {
                    throw new Error('Page build failed.');
                }
            }
        }
    };
});

vi.mock('../../src/services/asset-builder.js', () => {
    return {
        default: class AssetBuilder {
            constructor(config) {
                record('AssetBuilder.constructor', [config]);
            }
            async buildCustomCssAssets(sourceType) {
                record('AssetBuilder.buildCustomCssAssets', [sourceType]);
            }
            async buildCustomJsAssets(sourceType) {
                record('AssetBuilder.buildCustomJsAssets', [sourceType]);
            }
            generateBuildConfigJs(languageIndexKeys) {
                record('AssetBuilder.generateBuildConfigJs', [
                    languageIndexKeys
                ]);
            }
            generateContentJs(languageIndexKeys) {
                record('AssetBuilder.generateContentJs', [languageIndexKeys]);
            }
            deployCssAssets(sourceType) {
                record('AssetBuilder.deployCssAssets', [sourceType]);
            }
            deployJsAssets(sourceType) {
                record('AssetBuilder.deployJsAssets', [sourceType]);
            }
            deployImageAssets(sourceType) {
                record('AssetBuilder.deployImageAssets', [sourceType]);
            }
            deployAudioAssets(sourceType) {
                record('AssetBuilder.deployAudioAssets', [sourceType]);
            }
            deployVideoAssets(sourceType) {
                record('AssetBuilder.deployVideoAssets', [sourceType]);
            }
            deployFontAssets(sourceType) {
                record('AssetBuilder.deployFontAssets', [sourceType]);
            }
            deployDataAssets(sourceType) {
                record('AssetBuilder.deployDataAssets', [sourceType]);
            }
            deployFavicon(sourceType) {
                record('AssetBuilder.deployFavicon', [sourceType]);
            }
            deploySystemJsAssets() {
                record('AssetBuilder.deploySystemJsAssets');
            }
        }
    };
});

vi.mock('../../src/services/pdf-builder.js', () => {
    return {
        default: class PdfBuilder {
            constructor(config) {
                record('PdfBuilder.constructor', [config]);
            }
            async build() {
                record('PdfBuilder.build');
                if ( mockState.failAt === 'pdf' ) {
                    throw new Error('PDF build failed.');
                }
            }
        }
    };
});

const { default: logger } = await import('../../src/middleware/logger.js');
const { default: BuildPipeline } = await import(
    '../../src/pipelines/build-pipeline.js');

function createOptions(overrides = {}) {
    return {
        siteName: 'travelbook',
        themeName: 'bear',
        env: 'local',
        ...overrides
    };
}

beforeEach(() => {
    mockState.calls = [];
    mockState.failAt = null;
    mockState.postErrorCleanupShouldFail = false;
    vi.clearAllMocks();
});

test('pipeline initializes with failing status before build runs', () => {
    const pipeline = new BuildPipeline(createOptions());
    expect(pipeline.statusCode).toBe(1);
    expect(pipeline.opts.siteName).toBe('travelbook');
    expect(pipeline.isValidConfig).toBe(false);
    expect(pipeline.config).toBe(null);
    expect(pipeline.collectionBuilder).toBe(null);
    expect(pipeline.buildCleaner).toBe(null);
    expect(pipeline.buildSetup).toBe(null);
    expect(pipeline.buildDeployer).toBe(null);
    expect(pipeline.assetBuilder).toBe(null);
    expect(pipeline.pdfBuilder).toBe(null);
});

test('pipeline exposes ordered stage descriptors', () => {
    expect(BuildPipeline.STAGES.map(stage => stage.label)).toEqual([
        'Validating configuration',
        'Aggregating configuration',
        'Pre-build cleaning',
        'Setting up the build environment',
        'Deploying static artifacts',
        'Indexing the collection',
        'Building templates',
        'Building pages',
        'Building custom assets',
        'Building system assets',
        'Deploying assets',
        'Building data sources',
        'Post-build cleaning'
    ]);
    expect(BuildPipeline.STAGES).toHaveLength(13);
    for ( const stage of BuildPipeline.STAGES ) {
        expect(stage.run).toBeTypeOf('function');
    }
});

test('successful build runs all stages in order', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    expect(pipeline.statusCode).toBe(0);
    expect(callNames()).toEqual([
        'ConfigValidator.constructor',
        'ConfigValidator.validate',
        'ConfigBuilder.constructor',
        'ConfigBuilder.build',
        'CollectionBuilder.constructor',
        'CollectionBuilder.build',
        'BuildCleaner.constructor',
        'BuildCleaner.cleanDistDirectories',
        'BuildSetup.constructor',
        'BuildSetup.createDistDirectoryStructure',
        'BuildDeployer.constructor',
        'BuildDeployer.deployBuildConfig',
        'BuildDeployer.deployBuildMetadata',
        'BuildDeployer.deployLanguages',
        'BuildDeployer.deployWebConfig',
        'BuildDeployer.deployRobots',
        'BuildDeployer.deploySitemap',
        'CollectionBuilder.index',
        'TemplateBuilder.constructor',
        'TemplateBuilder.translateTemplates',
        'PageBuilder.constructor',
        'PageBuilder.translatePages',
        'BuildDeployer.deployDefaultLanguagePages',
        'AssetBuilder.constructor',
        'AssetBuilder.buildCustomCssAssets',
        'AssetBuilder.buildCustomCssAssets',
        'AssetBuilder.buildCustomJsAssets',
        'AssetBuilder.buildCustomJsAssets',
        'CollectionBuilder.getLanguageIndexKeys',
        'AssetBuilder.generateBuildConfigJs',
        'AssetBuilder.generateContentJs',
        'AssetBuilder.deployCssAssets',
        'AssetBuilder.deployCssAssets',
        'AssetBuilder.deployJsAssets',
        'AssetBuilder.deployJsAssets',
        'AssetBuilder.deployImageAssets',
        'AssetBuilder.deployImageAssets',
        'AssetBuilder.deployAudioAssets',
        'AssetBuilder.deployAudioAssets',
        'AssetBuilder.deployVideoAssets',
        'AssetBuilder.deployVideoAssets',
        'AssetBuilder.deployFontAssets',
        'AssetBuilder.deployFontAssets',
        'AssetBuilder.deployDataAssets',
        'AssetBuilder.deployDataAssets',
        'AssetBuilder.deployFavicon',
        'AssetBuilder.deployFavicon',
        'AssetBuilder.deploySystemJsAssets',
        'PdfBuilder.constructor',
        'PdfBuilder.build',
        'BuildCleaner.postBuildCleanup'
    ]);
});

test('pipeline logs stage progress and successful build metadata', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    expect(logger.info).toHaveBeenCalledWith('Building the static site...');
    expect(logger.info).toHaveBeenCalledWith('Site name: travelbook');
    expect(logger.info).toHaveBeenCalledWith('Theme name: bear');
    expect(logger.info).toHaveBeenCalledWith('Environment name: local');
    expect(logger.info).toHaveBeenCalledWith(
        'Stage 1 of 13 - Validating configuration...'
    );
    expect(logger.info).toHaveBeenCalledWith(
        'Stage 13 of 13 - Post-build cleaning...'
    );
    expect(logger.info).toHaveBeenCalledWith(
        'Successfully finished building the static site!'
    );
    expect(logger.info).toHaveBeenCalledWith(
        'Build directory: public-collection'
    );
    expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/^Build duration: \d+\.\d{3}ms$/)
    );
});

test('config validator receives constructor options', async () => {
    const opts = createOptions({
        env: 'production'
    });
    const pipeline = new BuildPipeline(opts);
    await pipeline.build();
    expect(mockState.calls[0].name).toBe('ConfigValidator.constructor');
    expect(mockState.calls[0].args[1]).toBe(opts);
});

test('config builder output is passed into collection builder', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    const collectionBuilderConstructor = mockState.calls.find(call =>
        call.name === 'CollectionBuilder.constructor');
    expect(collectionBuilderConstructor.args[0])
        .toBe(mockState.configs.aggregated);
    expect(pipeline.config).toBe(mockState.configs.collection);
});

test('post-build services receive collection-enriched config', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    for ( const serviceName of [
        'BuildCleaner.constructor',
        'BuildSetup.constructor',
        'BuildDeployer.constructor',
        'TemplateBuilder.constructor',
        'PageBuilder.constructor',
        'AssetBuilder.constructor',
        'PdfBuilder.constructor'
    ] ) {
        const call = mockState.calls.find(item => item.name === serviceName);
        expect(call.args[0]).toBe(mockState.configs.collection);
    }
});

test('custom assets are built in theme then site order', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    const customAssetCalls = mockState.calls
        .filter(call => [
            'AssetBuilder.buildCustomCssAssets',
            'AssetBuilder.buildCustomJsAssets'
        ].includes(call.name))
        .map(call => [call.name, call.args[0]]);
    expect(customAssetCalls).toEqual([
        ['AssetBuilder.buildCustomCssAssets', 'theme'],
        ['AssetBuilder.buildCustomCssAssets', 'site'],
        ['AssetBuilder.buildCustomJsAssets', 'theme'],
        ['AssetBuilder.buildCustomJsAssets', 'site']
    ]);
});

test('system assets receive language index keys from collection builder',
    async () => {
        const pipeline = new BuildPipeline(createOptions());
        await pipeline.build();
        expect(mockState.calls).toContainEqual({
            name: 'AssetBuilder.generateBuildConfigJs',
            args: [mockState.languageIndexKeys]
        });
        expect(mockState.calls).toContainEqual({
            name: 'AssetBuilder.generateContentJs',
            args: [mockState.languageIndexKeys]
        });
    });

test('asset deployment runs each asset source in expected order', async () => {
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    const deployCalls = mockState.calls
        .filter(call => call.name.startsWith('AssetBuilder.deploy'))
        .map(call => [call.name, call.args[0]]);
    expect(deployCalls).toEqual([
        ['AssetBuilder.deployCssAssets', 'theme'],
        ['AssetBuilder.deployCssAssets', 'site'],
        ['AssetBuilder.deployJsAssets', 'theme'],
        ['AssetBuilder.deployJsAssets', 'site'],
        ['AssetBuilder.deployImageAssets', 'theme'],
        ['AssetBuilder.deployImageAssets', 'site'],
        ['AssetBuilder.deployAudioAssets', 'theme'],
        ['AssetBuilder.deployAudioAssets', 'site'],
        ['AssetBuilder.deployVideoAssets', 'theme'],
        ['AssetBuilder.deployVideoAssets', 'site'],
        ['AssetBuilder.deployFontAssets', 'theme'],
        ['AssetBuilder.deployFontAssets', 'site'],
        ['AssetBuilder.deployDataAssets', 'theme'],
        ['AssetBuilder.deployDataAssets', 'site'],
        ['AssetBuilder.deployFavicon', 'theme'],
        ['AssetBuilder.deployFavicon', 'site'],
        ['AssetBuilder.deploySystemJsAssets', undefined]
    ]);
});

test('validation failure stops pipeline and does not process build error',
    async () => {
        mockState.failAt = 'validate';
        const pipeline = new BuildPipeline(createOptions());
        await pipeline.build();
        expect(pipeline.statusCode).toBe(1);
        expect(callNames()).toEqual([
            'ConfigValidator.constructor',
            'ConfigValidator.validate'
        ]);
        expect(logger.error).toHaveBeenCalledWith(
            'An error was encountered whilst running the build pipeline. ' +
            'Please consult the log files for further details.'
        );
    });

test('failure after valid config triggers post-error build processing',
    async () => {
        mockState.failAt = 'templates';
        const pipeline = new BuildPipeline(createOptions());
        await pipeline.build();
        expect(pipeline.statusCode).toBe(1);
        expect(callNames()).toEqual(expect.arrayContaining([
            'ConfigValidator.validate',
            'TemplateBuilder.translateTemplates',
            'ConfigBuilder.constructor',
            'ConfigBuilder.build',
            'BuildCleaner.constructor',
            'BuildSetup.constructor',
            'BuildDeployer.constructor',
            'BuildCleaner.postErrorBuildCleanup',
            'BuildSetup.createBaseDistDirectory',
            'BuildDeployer.deployBuildErrorPage'
        ]));
        const errorBuildCall = mockState.calls
            .filter(call => call.name === 'ConfigBuilder.build')
            .at(-1);
        expect(errorBuildCall.args).toEqual([true]);
    });

test('post-error processing uses error-mode config', async () => {
    mockState.failAt = 'pages';
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    const finalCleanerConstructor = mockState.calls
        .filter(call => call.name === 'BuildCleaner.constructor')
        .at(-1);
    const finalSetupConstructor = mockState.calls
        .filter(call => call.name === 'BuildSetup.constructor')
        .at(-1);
    const finalDeployerConstructor = mockState.calls
        .filter(call => call.name === 'BuildDeployer.constructor')
        .at(-1);
    expect(finalCleanerConstructor.args[0]).toBe(mockState.configs.error);
    expect(finalSetupConstructor.args[0]).toBe(mockState.configs.error);
    expect(finalDeployerConstructor.args[0]).toBe(mockState.configs.error);
});

test('pipeline catches post-error processing failures', async () => {
    mockState.failAt = 'templates';
    mockState.postErrorCleanupShouldFail = true;
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    expect(pipeline.statusCode).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
        'Could not process the build directory post-error.'
    );
});

test('collection indexing failure skips later build stages', async () => {
    mockState.failAt = 'collectionIndex';
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    expect(pipeline.statusCode).toBe(1);
    expect(callNames()).toContain('CollectionBuilder.index');
    expect(callNames()).not.toContain('TemplateBuilder.constructor');
    expect(callNames()).not.toContain('PageBuilder.constructor');
    expect(callNames()).not.toContain('AssetBuilder.constructor');
    expect(callNames()).not.toContain('PdfBuilder.constructor');
});

test('PDF build failure triggers post-error processing', async () => {
    mockState.failAt = 'pdf';
    const pipeline = new BuildPipeline(createOptions());
    await pipeline.build();
    expect(pipeline.statusCode).toBe(1);
    expect(callNames()).toContain('PdfBuilder.build');
    expect(callNames()).not.toContain('BuildCleaner.postBuildCleanup');
    expect(callNames()).toContain('BuildCleaner.postErrorBuildCleanup');
    expect(callNames()).toContain('BuildDeployer.deployBuildErrorPage');
});
