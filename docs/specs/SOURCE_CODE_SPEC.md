# Teddy Source Code Specification

This document explains the Teddy source code for humans and AI agents that need
to understand, modify, or extend the project. Teddy is a Node.js static site
generator that converts Markdown content from `sites/` into static HTML, assets,
search indexes, generated browser configuration, and optional PDF data sources.

## Project Summary

Teddy is an opinionated CMS/static site generator. Site-specific content and
configuration live under `sites/<site-name>/`; themes live under
`themes/<theme-name>/`; system code and shared runtime assets live under
`system/`. The build entry point is `build.js`, which parses CLI options and
delegates the build to `system/src/pipelines/build-pipeline.js`.

The default example site is `sites/travelbook`, and the default example theme is
`themes/bear`.

## Runtime and Commands

The project is an ES module Node.js application (`"type": "module"`).

- `npm run build` runs `node build.js`.
- `npm run build:demo` builds the TravelBook demo site with the Bear theme.
- `npm test` runs Vitest with `system/tests/vitest.config.js`.
- `npm run test:upgrade` runs the separate offline upgrade test suite with
  `system/tests/upgrade/vitest.config.js`.
- `npm run upgrade` runs `node upgrade.js`.
- Main build dependencies include `commander`, `ajv`, `gulp`,
  `gulp-mustache`, `showdown`, `flexsearch`, `minify`, `pdfkit`,
  `string-strip-html`, `try-to-catch`, and `winston`.

The CLI requires:

```bash
node build.js --site-name <siteName> --theme-name <themeName>
```

Common optional flags include:

- `--env <env>`: build environment, default `local`.
- `--minify-css`, `--minify-js`, `--minify-html`: minify generated/custom
  assets.
- `--ignore-html`, `--ignore-assets`, `--ignore-js`, `--ignore-css`,
  `--ignore-images`, `--ignore-fonts`, `--ignore-data`, `--ignore-collection`,
  and related ignore flags.
- `--generate-ds-pdf`: generate PDF data source files.
- `--version-assets-*`, `--version-collection-*`,
  `--version-site-config-*`, `--version-build-date`: alter output paths with
  site version/build metadata.
- `--skip-post-build-cleanup`: retain intermediate build artifacts.

The upgrade CLI supports:

- `--delete-backup`: delete the pre-upgrade backup after a successful worker
  upgrade.
- `--yes`: auto-confirm the upgrade prompt.
- `--skip-install`: skip the final `npm install` step after resources are
  copied.
- `--dry-run`: validate and simulate worker mode without deleting, copying,
  backing up, or installing dependencies.
- `--upgrade-worker --target <path>`: internal worker mode used by the extracted
  release to upgrade the target Teddy installation.

## Repository Map

```text
build.js                         CLI entry point.
upgrade.js                       Native upgrade bootstrapper and worker CLI.
package.json                     Package metadata, scripts, dependencies.
LICENSE                          GPL-3.0 license text.
COPYRIGHT                        Teddy copyright notice.
AUTHORS                          Optional curated author/contributor notice.
THIRD_PARTY_NOTICES.md           Third-party dependency and bundled asset notices.
SECURITY.md                      Security reporting policy, if present.
docs/specs/                      Architecture and source code specifications.
config/release.json              Native upgrader resource and release settings.
config/system.json               Global system paths/assets/fonts/runtime JS.
system/src/pipelines/            Build orchestration.
system/src/services/             Build services for config, pages, assets, etc.
system/src/services/upgrade/     Native upgrade service.
system/src/entities/             Runtime/build data models.
system/src/schema/               AJV JSON schemas for config files.
system/src/utils/                Filesystem, JSON, regex, language helpers.
system/assets/                   Shared system runtime assets and fonts.
system/tests/                    Vitest unit and integration tests.
system/tests/upgrade/            Separate offline upgrader tests.
sites/<site>/                    Site config, language JSON, Markdown, assets.
themes/<theme>/                  Theme config, templates, assets.
```

## Repository Metadata and Notices

The root `LICENSE` file contains the unmodified GPL-3.0 license text. Its Free
Software Foundation copyright notice belongs to the license document itself and
should not be replaced with Teddy's project copyright.

Project-specific legal/attribution files may include:

- `COPYRIGHT`: Teddy's project copyright notice.
- `AUTHORS`: optional curated author and contributor list.
- `THIRD_PARTY_NOTICES.md`: direct npm dependencies, bundled browser libraries,
  bundled fonts/icon fonts, copyright/license notices, and links.
- `SECURITY.md`: vulnerability reporting and supported-version policy.

Bundled third-party assets include FlexSearch browser files under
`system/assets/js/vendors`, Bootstrap/Mithril browser files under
`themes/bear/assets/js/vendors`, Noto/Source font license data under
`system/assets/fonts`, and Font Awesome Free fonts/icons/CSS under
`themes/bear/assets`.

## Build Entry Point

`build.js`:

1. Imports `commander`, `BuildPipeline`, the logger, and `package.json`.
2. Prints a Teddy banner.
3. Defines CLI options.
4. Instantiates `BuildPipeline` with parsed options.
5. Runs `await buildPipeline.build()`.
6. Exits with `buildPipeline.statusCode`.

The CLI performs no build work itself. All behavior after option parsing is in
`BuildPipeline`.

## Build Pipeline

`system/src/pipelines/build-pipeline.js` coordinates a 13-stage build:

1. Validate configuration with `ConfigValidator`.
2. Aggregate configuration with `ConfigBuilder`, then build collection metadata
   with `CollectionBuilder`.
3. Pre-build clean with `BuildCleaner`.
4. Create build/public directory structure with `BuildSetup`.
5. Deploy static build artifacts with `BuildDeployer`.
6. Index collection pages with `CollectionBuilder.index()`.
7. Translate theme templates with `TemplateBuilder`.
8. Convert Markdown pages to HTML with `PageBuilder`, then copy default
   language pages to root.
9. Build/minify custom theme and site CSS/JS with `AssetBuilder`.
10. Generate system browser assets (`config.js`, `site.js`) with
    `AssetBuilder`.
11. Deploy theme, site, vendor, and Teddy runtime assets.
12. Optionally generate PDF data sources with `PdfBuilder`.
13. Post-build cleanup with `BuildCleaner`.

On success, `statusCode` is set to `0`. On failure, the pipeline logs the error,
cleans partial output when possible, creates the base public directory, and
deploys `system/assets/html/build-error.html` as `index.html`.

## Configuration Model

Configuration is merged in `ConfigBuilder` from:

1. `package.json`, under `config.package`.
2. `config/system.json`, under `config.system`.
3. `sites/<site-name>/site.json`, under `config.site`.
4. `themes/<theme-name>/theme.json`, replacing `config.site.theme`.
5. CLI options, under `config.build.opts`.

`ConfigValidator` validates:

- `config/system.json` against `config-system.js`.
- Schemas with AJV configured for full error collection.
- CLI `siteName`, `themeName`, and `env` names against conservative character
  rules.
- Site config against `config-site.js`.
- Theme config against `config-theme.js`.
- Per-language `metadata.json`, `contributors.json`, and when collection
  taxonomy is enabled, `taxonomy.json`.
- Taxonomy completeness, so every configured collection category has a
  translation in each enabled language.
- Page availability, including at least one Markdown page for the default
  language.
- Markdown page naming conventions.
- Required site/theme asset paths referenced by config.

Important naming conventions:

- Site/theme/env names may contain alphanumeric characters, hyphens, and
  underscores.
- Markdown page files must contain exactly two period separators, such as
  `page.en.md` or `post.zh-tw.md`.
- Page directories may contain alphanumeric characters, spaces, hyphens, and
  underscores.
- Page filenames may additionally contain periods.

## Output Directories and URLs

`ConfigBuilder` computes:

- `config.system.build.siteDirs`: source directories for site assets,
  languages, pages, and web files.
- `config.system.build.siteDistDir`: `sites/<site>/public`.
- `config.build.distDirs.base`: public output for the selected env.
- `config.build.distDirs.build`: intermediate build output under
  `sites/<site>/build/<env>/<site-version>[/<build-date>]`.
- `config.build.distDirs.assets`: public asset output.
- `config.build.distDirs.collection`: public FlexSearch index output.
- `config.build.distDirs.siteConfig`: generated browser config output.

Asset, collection, and site-config URLs are relative URL roots. Versioning flags
can add site version or build date/build ID segments.

For each enabled language, `LanguageBuilder` merges all JSON files under
`sites/<site>/languages/<language>/`. `UrlBuilder.localizeUrls()` then prefixes
root-relative URLs for non-default languages. The default language uses no URL
language prefix.

## Site Structure

A site directory conventionally contains:

```text
sites/<site>/
  site.json
  languages/<language>/*.json
  pages/**/*.md
  assets/
  web/
```

For `travelbook`, enabled languages are `en`, `ja`, and `zh-tw`. Language data
includes content labels/messages, menu definitions, metadata, contributors, and
taxonomy translations.

Site Markdown frontmatter drives page generation. Common metadata keys include:

- `enabled`: must be `'true'` for the page to be built.
- `name`, `description`, `tags`, `categories`.
- `authorId`.
- `date`.
- `cover`, `hero`, `og`.
- `index`: for collection indexing; omitted or `'true'` means indexable.
- `datasource`: for PDF data-source inclusion.
- Any custom keys that templates reference as `${page.metadata.<key>}`.

## Theme Structure

A theme directory conventionally contains:

```text
themes/<theme>/
  theme.json
  templates/*.html
  templates/partials/**/*.html
  assets/
```

`themes/bear/theme.json` declares the Bear theme and its custom assets:

- `assets/css/style.css`
- `assets/js/blog.js`

Templates use two placeholder systems:

- Mustache placeholders, resolved with language JSON data.
- Teddy placeholders such as `${page.content}`,
  `${page.metadata.name}`, and `${pages.urls.blog}`.

`TemplateBuilder` runs `gulp-mustache` twice over every top-level theme template
for every language. The double pass allows partials and nested Mustache
templates to resolve before page-specific placeholders are injected by
`PageBuilder`.

## Page Generation

`PageBuilder`:

1. Scans the site pages directory once and groups Markdown files by language
   suffix.
2. For each language, reads the generated language JSON from the intermediate
   build directory.
3. For each Markdown page, computes source paths, clean relative paths, output
   paths, and the matching translated template file. Template matching is based
   on the output HTML filename. For example, `about.en.md` maps to
   `about.html`.
4. Converts Markdown to HTML with Showdown (`metadata: true`, `tables: true`).
5. Skips pages unless frontmatter contains `enabled: true`.
6. Resolves page metadata, author data, dates, taxonomy, Open Graph metadata,
   language script, system JS assets, and custom placeholders.
7. Renders remaining Mustache placeholders with language data.
8. Writes each page as `index.html` under the cleaned output path.
9. Optionally minifies HTML.
10. Copies allowed page-adjacent static assets into the page output directory.

Pages are generated under language-prefixed output directories. After page
generation, `BuildDeployer.deployDefaultLanguagePages()` copies the default
language output into the public root, so default-language pages are available at
both `/en/...` and `/...`.

## Collection and Search Indexing

Collections are optional and configured under `site.collection`.

`CollectionBuilder.build()`:

1. Scans the configured collection pages directory, e.g. `pages/blog`.
2. Groups Markdown files by language.
3. Converts Markdown with Showdown and reads frontmatter.
4. Includes a page only when it has a non-empty `name`, `enabled: true`, and
   `index` is absent or `'true'`.
5. Creates a `Page` entity for each included page.
6. Optionally strips HTML content and stores searchable plain text when
   `site.collection.index.content` is true.
7. Tracks per-category counts.
8. Sorts pages by configured key/order.
9. Assigns numeric IDs after sorting.
10. Adds collection metadata and the first pagination slice to language data.
11. Stores language page arrays and metadata in a `Collection` entity.

`CollectionBuilder.index()`:

1. Clones the configured FlexSearch document-store config.
2. Applies ISO language lookup for FlexSearch.
3. Uses a CJK tokenizer for Japanese, Korean, and Chinese language codes.
4. Adds each `Page` entity to a `FlexSearch.Document`.
5. Exports each FlexSearch key to JSON under
   `assets/collection/<language>/<key>.json`.
6. Stores exported key names in `languageIndexKeys` for browser config.

Generated browser config includes:

- `COLLECTION_INDEX_BASE_URL`
- `COLLECTION_PAGINATION_SIZE`
- `COLLECTION_SIZES`
- `INDEX_DOCUMENT_STORE_CONFIG`
- `LANGUAGE_INDEX_KEYS`
- `MIN_SEARCH_QUERY_LENGTH`
- `SITE_VERSION`

## Page Entity

`system/src/entities/page.js` defines the document shape used by collection
metadata, FlexSearch indexing, browser search results, and PDF data sources.

Important properties:

- `id`
- `name`
- `description`
- `categoryLanguages`
- `tags`
- `date`
- `displayDate`
- `relUrl`
- `coverExists`
- `cover`
- `author`
- `authorUrl`
- Optional `content`
- Custom configured index fields from Markdown frontmatter

`Page` resolves category names and author URLs using language data and
`UrlBuilder`.

## Client-Side Search Runtime

`system/assets/js/teddy/search.js` defines the browser `Search` class. It:

- Normalizes search query input, pagination, tags, document IDs, language keys,
  index keys, and index base URLs.
- Preserves Unicode letters/numbers in normal query mode and uses a legacy
  allowlist fallback that includes common accented Latin characters, CJK,
  Greek, Cyrillic, Arabic, Thai, Indic, Hebrew, Tibetan, and Mongolian ranges.
- Caps search query length, minimum-query-length configuration, result limits,
  tag count, and loaded index file size.
- Loads FlexSearch index exports concurrently from the generated collection URL.
- Validates fetch responses, same-origin collection index URLs, and index file
  sizes before import.
- Imports exported index data into a browser `FlexSearch.Document`.
- Resets `loaded`, `index`, and `collectionSize` on load failure.
- Exposes:
  - `loadIndex()`
  - `getDocument(id)`
  - `getDocuments(offset, limit)`
  - `getDocumentsByTags(tags, offset, limit, enrich)`
  - `query(searchQuery, options)`
  - `queryAndFilterByTags(searchQuery, tags, options)`
- Deduplicates enriched FlexSearch hits by document ID.

The browser search runtime depends on global constants generated into
`assets/js/site/config.js`, and on language/tokenizer globals from
`system/assets/js/teddy/lang.js`.

`themes/bear/assets/js/blog.js` is the Bear theme collection UI. It:

- Loads the search index.
- Renders initial head documents.
- Provides query search, category filtering, combined query+tag search, reset,
  and load-more pagination.
- Uses Mithril components mounted into IDs emitted by `blog.html`.
- Renders collection results as Mithril vnodes rather than trusted HTML.
- Validates local document URLs before rendering `href` and `src` attributes.
- Uses an incrementing request ID to prevent stale async search responses from
  replacing newer UI state.

## Asset Pipeline

`AssetBuilder` handles custom asset minification, asset copying, and generated
browser config.

Custom assets:

- Theme assets come from `themes/<theme>/assets/<type>/`.
- Site assets come from `sites/<site>/assets/<type>/`.
- CSS/JS minification writes `.min.css` or `.min.js` into the public assets
  directory.
- Minification uses `minify`; JS uses Terser with `mangle: false`.

Deployment:

- CSS, JS, images, audio, videos, fonts, and data assets can be ignored by CLI
  flags.
- Theme and site asset folders are copied into the public assets tree.
- Favicon files can optionally be copied to the public root.
- System vendor JS and Teddy runtime JS are copied from `system/assets/js`.
- Teddy runtime JS is deployed under
  `assets/js/vendors/teddy/<package.version>/`.

Generated browser files:

- `config.js` contains build/search constants.
- `site.js` contains language data as `const site = ...`, with heavy collection
  `pages` metadata removed.

## Static Artifacts and Web Host Files

`BuildDeployer` writes:

- `build.json` into the public root.
- Full build config into the intermediate build directory.
- Per-language merged JSON into the intermediate build directory.
- Host-specific files, based on `site.web[env].host`.
- `robots.txt` and `sitemap.xml` when present.
- Default-language HTML copied from `/<default-language>/` to public root.
- Build-error fallback page on pipeline failure.

Supported host mappings are in `system/src/enums/hosts.js`:

- `apache-http-server`: `.htaccess`
- `cloudflare-pages`: `_headers`, `404.html`
- `cloudflare-workers`: `_headers`, `404.html`

## Native Upgrade Process

Teddy includes a native upgrader with entry point `upgrade.js`, service logic in
`system/src/services/upgrade/upgrader.js`, and resource/release settings in
`config/release.json`.

The upgrader uses a two-stage design:

1. Bootstrap mode runs from the currently installed Teddy tree.
2. Bootstrap validates the current Teddy instance, reads the current version,
   fetches latest release metadata, compares versions, asks for confirmation
   unless `--yes` is used, downloads the release archive and checksum file,
   verifies the SHA-256 checksum, extracts the archive, validates the extracted
   Teddy release, and spawns the extracted `upgrade.js` in worker mode.
3. Worker mode runs from the extracted release tree, with `--upgrade-worker` and
   `--target <path>` pointing at the installed Teddy tree to upgrade.
4. Worker mode validates both release and target trees, creates a backup under
   `working/upgrade/backups/<timestamp>`, deletes only configured replaceable
   resources and generated TravelBook build/public output, copies configured
   resources from the release tree, validates the upgraded target, optionally
   runs `npm install`, and deletes the backup only when `--delete-backup` is
   passed after a successful upgrade.

`config/release.json` controls:

- backup and download roots under `./working/upgrade`;
- GitHub latest-release, release-notes, tag, archive, and checksum URL
  templates;
- replaceable Teddy directories and files.

The configured resources intentionally determine what is replaced. User-created
root files, custom sites, and custom themes are preserved unless explicitly
listed in `config/release.json`.

Failure behavior:

- GitHub metadata/download failures, bad HTTP responses, checksum mismatch,
  unsafe archive paths, invalid extraction, invalid target/release trees, copy
  failures, verification failures, and `npm install` failures are caught and
  logged.
- Failed preparation cleans up the prepared download directory where possible.
- Failed worker upgrades preserve the backup even when `--delete-backup` was
  requested.
- There is no automatic rollback after a partial worker failure; the backup path
  is logged so the user can restore manually.

Simulation and safety options:

- `--dry-run` validates worker inputs and versions without changing files.
- `--skip-install` avoids dependency installation, useful for tests and manual
  staged verification.
- `--yes` avoids interactive prompts in automation.

## PDF Data Sources

`PdfBuilder` runs only when `--generate-ds-pdf` is set. It:

1. Scans all Markdown pages by language.
2. Includes pages with `enabled: true` and datasource eligibility.
3. Converts Markdown to text by rendering HTML and stripping tags.
4. Creates a `Page` entity for metadata.
5. Generates `site.pdf` under
   `build/<env>/<version>/datasources/pdf/<language>/`.
6. Uses Noto system fonts by default, with site- or system-configured
   language-specific fonts when available.

The PDF is intended as a single site data source for retrieval-augmented
generation workflows.

## Utility Modules

- `io-utils.js`: synchronous filesystem helpers for copying, creating
  directories, reading JSON/text, listing files, and writing JSON/text.
- `json-utils.js`: nested existence checks, nested value access, and simple
  array-of-object sorting.
- `regex-utils.js`: finds `${namespace.path}` placeholders and extracts nested
  key paths.
- `lang-utils.js`: language code lookup, CJK language list, language character
  helpers, a mixed tokenizer, and a CJK tokenizer.
- `logger.js`: Winston console plus daily rotating debug log files under
  `logs/`.

## Tests

The normal test suite is run by Vitest with `system/tests/vitest.config.js`. The
config uses a Node test environment, setup file `system/tests/setup.js`, mock
reset/restore defaults, and excludes generated/build/vendor directories. It also
excludes `system/tests/upgrade/**`, because upgrade tests are intentionally run
with a separate command.

Upgrade tests are run with `npm run test:upgrade`, using
`system/tests/upgrade/vitest.config.js`. They have their own setup file and
execute from a working test cwd so logger side effects and generated fixtures
remain under `./working/tests/upgrade`.

The test tree keeps the source-oriented folder structure:

```text
system/tests/utils/             Unit tests for utility modules.
system/tests/entities/          Unit tests for entity classes.
system/tests/enums/             Unit tests for enum contracts.
system/tests/services/          Unit tests for build services.
system/tests/pipelines/         Build pipeline unit and integration tests.
system/tests/client/            Browser-runtime client asset tests.
system/tests/upgrade/           Separate offline upgrade unit/integration tests.
```

Unit-style tests cover:

- `io-utils.js`, including safe delete guards, recursive file listing, copy
  helpers, JSON parse failures, relative path conversion, and write helpers.
- `json-utils.js`, including null/primitive safety, nested paths, immutable
  sorting, and numeric/string sort behavior.
- `regex-utils.js`, including placeholder extraction, namespace escaping, and
  malformed placeholder behavior.
- `lang-utils.js`, including alphabet/single-character ranges and CJK/mixed
  tokenizers.
- `date-utils.js` and `string-utils.js`.
- `Collection` and `Page` entity construction and invariants.
- `hosts.js` with generalized host config path contracts.
- Every core service under `system/src/services`, including config building and
  validation, language aggregation, template translation, page generation,
  collection indexing, asset generation/deployment, cleanup/setup/deploy stages,
  URL localization, and PDF data-source generation.
- `BuildPipeline` orchestration with mocked service dependencies.
- `system/assets/js/teddy/search.js` using VM-loaded browser globals and mocked
  `FlexSearch.Document`.
- `upgrade.js` CLI option exposure and worker argument forwarding.
- `system/src/services/upgrade/upgrader.js` preparation and worker behavior,
  including no-update responses, download/extract/cleanup preparation, checksum
  failure cleanup, and dry-run validation.

Integration-style tests cover:

- `system/tests/pipelines/build-pipeline.integration.test.js`, which runs the
  real TravelBook/Bear build, asserts generated public/intermediate artifacts,
  validates browser `config.js`/`site.js` contracts, verifies localized pages,
  checks collection metadata/category counts/pagination, re-imports generated
  FlexSearch indexes for English/Japanese/Chinese, and confirms expected
  cleanup behavior.
- `system/tests/client/search.integration.test.js`, which exports real
  FlexSearch indexes in memory, serves them through mocked browser `fetch()`,
  and verifies the client search runtime's import, document lookup, query,
  tag-filter, combined query+tag, pagination, deduplication, and CJK behavior.
- `system/tests/upgrade/upgrader.integration.test.js`, which runs the real
  upgrade worker CLI in a child Node process against generated Teddy target and
  release fixtures. It verifies configured resource replacement, backup
  creation/deletion, preservation of user-created root/site/theme files,
  `--skip-install`, and `--dry-run`.

Upgrade tests are fully offline:

- Fixtures are generated dynamically under `./working/tests/upgrade`.
- Release archives are generated in pure JavaScript for the tests.
- Release metadata, archive, and checksum downloads are served from a local
  `127.0.0.1` HTTP server.
- Tests do not contact GitHub and do not write outside `./working`.
- Expected logger output for intentional failure-path tests is suppressed in the
  test, while assertions still verify the caught failure behavior.

Test fixtures should be generated at runtime under `./working` when file system
fixtures are needed. Tests should not depend on committed generated output under
`sites/<site>/public` or create new resources outside `./working`.

## Security and Trust Boundaries

Teddy primarily processes local, repository-controlled content, but the build
system still performs string interpolation into HTML and browser JavaScript.

Important boundaries:

- Markdown HTML generated by Showdown is inserted into templates as trusted page
  content.
- Page metadata is interpolated into HTML, meta tags, attributes, and generated
  JavaScript. Treat site/theme/content repositories as trusted inputs unless
  additional sanitization is added.
- Build services validate many filesystem paths and generated output paths, but
  site and theme repositories should still be treated as trusted build inputs.
- Browser search indexes are generated at build time and loaded from the
  configured same-origin collection URL.
- The client search runtime validates index key, language key, index base URL,
  pagination, query length, tag count, and index file size.
- Bear's search-result rendering uses Mithril text nodes and no longer needs
  `m.trust()` for collection result cards or category labels.
- Bear's client collection UI validates local document URLs before assigning
  `href` and `src` attributes. Author URLs are parsed as HTTP(S) URLs and
  fallback to `#` if unsafe.
- Templates may use triple Mustache braces in places where raw HTML or URLs are
  intended; avoid passing untrusted input to those fields.
- Some theme links use `target="_blank"` for external/social URLs. Prefer
  adding `rel="noopener noreferrer"` when creating or editing those templates.
- `PdfBuilder` resolves configured font paths and checks font existence before
  generating PDF data sources.
- `BuildCleaner` uses safety guards before deleting generated directories.
- The upgrader validates release downloads with SHA-256 checksums, blocks unsafe
  archive extraction paths, keeps backups on caught worker failures, and avoids
  replacing files not listed in `config/release.json`.
- The upgrader does not automatically roll back after a partial worker failure;
  production use should retain backups until the upgraded instance and
  dependencies are verified.

When extending Teddy for untrusted authors or multi-tenant content, add explicit
HTML sanitization, URL scheme validation, and escaping for metadata attributes.

Client-side security rules for new theme JavaScript:

- Prefer vnodes or `textContent` over `innerHTML`/`outerHTML`/`m.trust()`.
- Validate any content-derived `href`, `src`, `poster`, or similar URL
  attributes.
- Avoid protocol-relative URLs unless explicitly intended.
- Keep async search/filter operations ordered with a stale-response guard when
  multiple requests can overlap.

## Important Invariants

- `ConfigValidator.validate()` must pass before a normal build proceeds.
- `ConfigBuilder.build()` must run before services that depend on computed
  paths, language data, URL data, or theme config.
- `CollectionBuilder.build()` must run before template/page generation so
  collection metadata is available to language templates.
- `CollectionBuilder.index()` must run before `AssetBuilder.generateBuildConfigJs()`
  so `LANGUAGE_INDEX_KEYS` is complete.
- `TemplateBuilder.translateTemplates()` must run before `PageBuilder.translatePages()`
  because page generation consumes translated templates.
- `PageBuilder.translatePages()` must run before default-language pages are
  copied to root.
- Generated `config.js` and `site.js` must be available before browser search
  and theme collection scripts execute.
- FlexSearch document IDs are assigned after collection sorting and are expected
  to match ordered collection pages.

## Extension Points

To add a new site:

1. Create `sites/<site>/site.json`.
2. Add per-language JSON files under `sites/<site>/languages/<language>/`.
3. Add Markdown pages under `sites/<site>/pages/`.
4. Add optional site assets under `sites/<site>/assets/`.
5. Add optional web host files under `sites/<site>/web/`.
6. Build with `--site-name <site> --theme-name <theme>`.

To add a new theme:

1. Create `themes/<theme>/theme.json`.
2. Add top-level HTML templates under `themes/<theme>/templates/`.
3. Add partials under `themes/<theme>/templates/partials/`.
4. Add optional CSS/JS/images/fonts/data under `themes/<theme>/assets/`.
5. Reference custom theme assets in `theme.json`.

To add new page metadata fields:

1. Add frontmatter keys in Markdown.
2. Reference them in templates as `${page.metadata.<key>}`.
3. For collection indexing/storage, add field names to
   `site.collection.index.documentStore.document.index`.
4. Avoid names reserved by `Page`.

To add new browser behavior:

1. Add JS under site or theme assets.
2. Reference it from `site.json` or `theme.json`.
3. Use generated globals from `config.js`/`site.js` carefully.
4. Prefer safe DOM APIs (`textContent`, validated URLs) when rendering indexed
   or content-derived data.

## Known Implementation Notes

- Most build filesystem operations are synchronous; pipeline stages are mostly
  sequential for predictable artifact ordering.
- `TemplateBuilder` runs Mustache twice over templates to resolve partials and
  nested substitutions.
- `UrlBuilder` supports `${pages.urls.*}` placeholders and language prefixes.
- Build cleanup deletes intermediate build artifacts unless
  `--skip-post-build-cleanup` or `--generate-ds-pdf` is used.
- The generated site is static; all collection search/filtering happens in the
  browser using generated FlexSearch JSON exports.
- `Options` exists as an entity but the CLI currently passes Commander option
  objects directly to `BuildPipeline`.
