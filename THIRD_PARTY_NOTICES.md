# Third-Party Notices

This file lists third-party software directly declared, bundled, or distributed with Teddy.

Teddy itself is licensed under the GNU General Public License, version 3. See [`LICENSE`](./LICENSE).

This file is provided for attribution and notice purposes. Third-party software remains copyright of its respective authors and is licensed under its own terms.

## Bundled Client-Side Libraries

These libraries are included directly in the repository under `system/assets/js/vendors` or `themes/bear/assets/js/vendors`.

| Package | Version(s) | Used For | Copyright / Author | License | Project |
|---|---:|---|---|---|---|
| FlexSearch | 0.8.212 | Client-side full-text search | Thomas Wilkerling / Nextapps GmbH | Apache-2.0 | [github.com/nextapps-de/flexsearch](https://github.com/nextapps-de/flexsearch) |
| Bootstrap | 5.3.3, 5.3.8 | Theme UI JavaScript | Copyright 2011-2026 The Bootstrap Authors | MIT | [getbootstrap.com](https://getbootstrap.com/) |
| Mithril | 2.3.8 | Client-side rendering in the Bear theme | Copyright 2017 Leo Horie | MIT | [mithril.js.org](https://mithril.js.org/) |

## Bundled Fonts and Icon Fonts

These font assets are included directly in the repository.

| Package / Font | Version | Location | Used For | Copyright / Author | License | Project |
|---|---:|---|---|---|---|---|
| Noto / Source font software | See bundled files | `system/assets/fonts/Noto` | System PDF/font support | Copyright 2014-2021 Adobe, with Reserved Font Name “Source” | SIL OFL 1.1 | [openfontlicense.org](https://openfontlicense.org/) |
| Font Awesome Free | 6.7.2 | `themes/bear/assets/fonts/vendors/fontawesome/6.7.2` | Bear theme icon fonts | Copyright 2024 Fonticons, Inc. | Fonts: SIL OFL 1.1; Icons: CC BY 4.0; Code: MIT | [fontawesome.com](https://fontawesome.com/) |

## Direct npm Dependencies

These packages are declared directly in [`package.json`](./package.json).

| Package | Version | Used For | Copyright / Author | License | Project |
|---|---:|---|---|---|---|
| Ajv | 8.20.0 | JSON schema validation | Evgeny Poberezkin | MIT | [ajv.js.org](https://ajv.js.org/) |
| commander | 15.0.0 | CLI option parsing | TJ Holowaychuk | MIT | [github.com/tj/commander.js](https://github.com/tj/commander.js) |
| del | 8.0.1 | File and directory deletion | Sindre Sorhus | MIT | [github.com/sindresorhus/del](https://github.com/sindresorhus/del) |
| FlexSearch | 0.8.212 | Build-time and test-time search index generation | Thomas Wilkerling / Nextapps GmbH | Apache-2.0 | [github.com/nextapps-de/flexsearch](https://github.com/nextapps-de/flexsearch) |
| gulp | 5.0.1 | Build streams and file processing | Gulp Team | MIT | [gulpjs.com](https://gulpjs.com/) |
| gulp-mustache | 5.0.0 | Mustache template rendering in Gulp streams | Rogério Vicente | MIT | [github.com/rogeriopvl/gulp-mustache](https://github.com/rogeriopvl/gulp-mustache) |
| minify | 15.3.1 | HTML, CSS, and JavaScript minification | coderaiser | MIT | [github.com/coderaiser/minify](https://github.com/coderaiser/minify) |
| pdfkit | 0.19.1 | Optional PDF data source generation | Devon Govett | MIT | [pdfkit.org](http://pdfkit.org/) |
| showdown | 2.1.0 | Markdown to HTML conversion | Estevão Santos and contributors | MIT | [showdownjs.com](http://showdownjs.com/) |
| string-strip-html | 13.5.3 | HTML stripping / text extraction | Roy Revelt / Codsen | MIT | [codsen.com/os/string-strip-html](https://codsen.com/os/string-strip-html) |
| try-to-catch | 4.0.5 | Promise error handling helper | coderaiser | MIT | [github.com/coderaiser/try-to-catch](https://github.com/coderaiser/try-to-catch) |
| vite | 8.1.3 | Test/build tooling dependency used by Vitest | Evan You and contributors | MIT | [vite.dev](https://vite.dev/) |
| vitest | 4.1.9 | Test runner | Anthony Fu and contributors | MIT | [vitest.dev](https://vitest.dev/) |
| winston | 3.19.0 | Logging | Charlie Robbins | MIT | [github.com/winstonjs/winston](https://github.com/winstonjs/winston) |
| winston-daily-rotate-file | 5.0.0 | Rotating file transport for Winston | Charlie Robbins | MIT | [github.com/winstonjs/winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file) |
| wrangler | 4.103.0 | Cloudflare deployment tooling | Cloudflare | MIT OR Apache-2.0 | [github.com/cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) |

## Transitive npm Dependencies

Teddy’s direct npm dependencies may install additional transitive dependencies. The exact resolved dependency tree is recorded in [`package-lock.json`](./package-lock.json).

For release audits, regenerate a complete transitive dependency license report from the lockfile or installed `node_modules` tree before publishing a distribution package.

## License Texts

Where third-party libraries are bundled directly in this repository, their license files are retained alongside the bundled files where available.

- FlexSearch license files are stored under `system/assets/js/vendors/flexsearch/*/LICENSE.txt`.
- Bootstrap license files are stored under `themes/bear/assets/js/vendors/bootstrap/*/LICENSE.txt`.
- Mithril license file is stored under `themes/bear/assets/js/vendors/mithril/2.3.8/LICENSE`.
- Noto / Source font license file is stored under `system/assets/fonts/Noto/OFL.txt`.
- Font Awesome Free license file is stored under `themes/bear/assets/fonts/vendors/fontawesome/6.7.2/LICENSE.txt`.

## Notes

This notice file is not a replacement for the license texts of the third-party packages. If there is any inconsistency between this file and a third-party package’s own license file or package metadata, the third-party package’s own license terms control.