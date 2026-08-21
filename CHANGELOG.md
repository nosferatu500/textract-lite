### 9.0.0

#### Security
* Bumped `@xmldom/xmldom` 0.8.11 → 0.9.11, clearing five high-severity advisories: XML injection via CDATA ([GHSA-wh4c-j3r5-mjhp](https://github.com/advisories/GHSA-wh4c-j3r5-mjhp)), uncontrolled recursion in serialization ([GHSA-2v35-w6hq-6mfw](https://github.com/advisories/GHSA-2v35-w6hq-6mfw)), and node injection through `DocumentType`, processing-instruction and comment serialization ([GHSA-f6ww-3ggp-fr8h](https://github.com/advisories/GHSA-f6ww-3ggp-fr8h), [GHSA-x6wf-f3px-wcqx](https://github.com/advisories/GHSA-x6wf-f3px-wcqx), [GHSA-j759-j44w-7fr8](https://github.com/advisories/GHSA-j759-j44w-7fr8)). Together with the `yauzl` bump below, `npm audit --omit=dev` now reports zero vulnerabilities.
* `DOMParser.parseFromString()` now takes the mime type xmldom 0.9 requires (`MIME_TYPE.XML_TEXT`).
* Extraction output was verified byte-for-byte identical across the 0.8 → 0.9 upgrade for every `.docx` in the test corpus, in both line-break modes.

#### Fixed
* Fixed: an XML declaration in any archive entry but the first could abort extraction. Each entry's declaration was stripped by matching one exact literal ending in `\r\n`, so entries differing in line ending or attribute order kept theirs, leaving a declaration mid-document. xmldom 0.8 only warned; 0.9 treats it as fatal. Now matched as a pattern anchored to the start of each entry.
* Fixed: large `.docx` files never finished extracting. `yauzl` 3.2.0 contained an off-by-one error ([GHSA-gmq8-994r-jv83](https://github.com/advisories/GHSA-gmq8-994r-jv83)) that truncated the inflate stream part-way through, so the read stalled with no error rather than completing. Requires `yauzl` >= 3.4.0. This is the long-standing `can handle a huge docx` test failure; the suite is now fully green.
* Fixed: multi-byte characters that straddled a chunk boundary could be corrupted. Zip entries were decoded by concatenating each `Buffer` separately; they now go through `stream/consumers`, which decodes the entry in one pass.
* Fixed: `types` pointed at `./dist/index.d`, which is not a real file, so consumers got no type information. It now points at `./dist/index.d.ts`.
* Fixed: concurrent first calls to `extract()` could each kick off their own extractor-discovery pass. The discovery promise is cached now, so they share one.
* Fixed: `fromFileWithPath()` threw a `TypeError` for a file whose mime type could not be determined. It returns a descriptive `Error` like every other failure.
* Removed a dead `os.tmpdir()/textract` directory that was created as an import side effect. Nothing has used it since the `exec`-based extractors were dropped in 5.0.4.

#### Language level and toolchain
* Build targets ES2025 (`target`/`lib`), up from ES2023, on TypeScript 6.
* `module`/`moduleResolution` moved from `ESNext`/`Node` to `NodeNext`. The old `Node` value selected legacy node10 resolution, which does not match how this ESM-only package is actually loaded.
* Enabled `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`, `rewriteRelativeImportExtensions` and an explicit `rootDir`.
* Dropped `ts-node`. Tests now run directly off the TypeScript source through Node's built-in type stripping, so relative imports in `src/` are written as `.ts` and rewritten to `.js` on emit.
* ESLint 9 → 10, and the config rewritten as a native flat config. It previously routed `eslint:recommended` and the `@typescript-eslint` presets through `FlatCompat`, the eslintrc compatibility bridge, and wired up the parser and plugin by hand. It now composes `js.configs.recommended` and the typescript-eslint presets directly via `tseslint.config()`, which drops the `@eslint/eslintrc` dependency and the `fileURLToPath`/`__dirname` boilerplate.
* Replaced `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` with the unified `typescript-eslint` package.
* Type-aware linting now uses the project service (`projectService: true`) instead of a `project: true` glob, so TypeScript decides which config owns each file.
* ESLint's parser had been configured with `ecmaVersion: 5` and `sourceType: "script"` — wrong on both counts for this codebase. Both are now the flat-config defaults and no longer stated explicitly.
* Dropped the `@typescript-eslint/no-explicit-any: "off"` override. No `any` remains in `src/`, so the rule is enforced.
* `npm run lint` covers the whole repository rather than just `src/`. `tests/` is linted without the type-aware rules, since it is deliberately outside `tsconfig.json` and the project service therefore has no types for it.
* Lint reports zero problems; before this release it reported 71 errors.

#### Modernized APIs
* `import.meta.dirname` replaces the `fileURLToPath(import.meta.url)` + `path.dirname` pair.
* `node:fs/promises` replaces callback `fs.readFile` and sync `fs.readdirSync`, removing two hand-rolled promise wrappers.
* Adopted yauzl 3.4's promise API: `openPromise()`, `eachEntry()` and `openReadStreamPromise()`. `.docx` archives are now walked with a plain `for await` loop over `eachEntry()`, which replaces the `entry`/`end`/`error` listener setup, the manual `readEntry()` pumping and the `entryCount === ++processedEntries` counter. Errors surface through the promise chain, and the archive is closed automatically when iteration finishes or unwinds. There is no hand-written promise plumbing left in `src/` — no `new Promise`, no `Promise.withResolvers`.
* Entries are skipped when `entry.canDecodeFileData()` is false — an encrypted entry or an unsupported compression method — instead of failing the whole document. A `.docx` yielding nothing at all still reports the existing "could not find content" error.
* Bumped `@types/yauzl` 2.10.3 → 3.4.0. It was two majors behind the runtime dependency, so none of the above API was typed.
* `src/utils.ts` is now purely text cleansing; the two yauzl-specific helpers moved into the extractor that uses them.
* Paragraph text is now selected with a relative `.//` XPath against the paragraph node. Each paragraph was previously serialized back to a string and re-parsed into its own document purely so an absolute `//` query would stay scoped to it. Output is unchanged; it is also modestly faster (247ms → 205ms on the 863 KB test document) and keeps the source document's namespace declarations in scope instead of re-parsing prefixed markup without them.
* Extractor lookup uses a `Map` plus `Array.prototype.findLast` instead of an index-counting loop over a plain object.

#### API
* Added `ExtractOptions`, `Extractor` and `ExtractorModule` type exports, replacing `options: any` throughout.
* `options` is now optional on both `fromFileWithPath()` and `fromFileWithMimeAndPath()`; it previously had to be passed as `{}`.
* Added an `exports` map so the package resolves correctly as ESM, with `types` and `default` conditions for the single `.` entry point.

#### Packaging and docs
* Added `files: ["dist"]`. The tarball had been shipping `.claude/settings.json`, `.mocharc.json` and `eslint.config.mjs`.
* Removed the `browserslist` config. It never applied — this is a node-only library.
* `description` and `keywords` corrected to describe what is actually supported (`.docx` and plain text). `.doc` has not been supported since the fork.
* README rewritten. It still documented the upstream `textract` CLI, the callback API, the buffer and URL entry points, and `tesseract`/`pdftotext`/`odt` options, none of which exist in this package.
* LICENSE copyright range extended through 2026.

### 8.0.0
* Bump node >= 24.11.
* Bump deps: `iconv-lite` 0.7, `mime` 4.1, `html-entities` 2.6, `yauzl` 3.2, `jschardet` 3.1.4, `@xmldom/xmldom` 0.8.11.
* Bump dev deps: TypeScript 5.9, ESLint 9.39, `@typescript-eslint` 8.48, chai 6, mocha 11, typedoc 0.28, rimraf 6.1.
* Dropped `@types/chai` and `@types/mocha`, both packages now ship their own types.

### 7.0.9 - 7.0.13
* Fixed: unable to load files on Windows. Extractor modules are now imported through `pathToFileURL()` and the `text` extractor reads through a file URL rather than a raw path.
* Migrated ESLint to flat config (`eslint.config.mjs`, ESLint 9). `.eslintrc.json` removed and the `lint` script no longer passes `--ext`.
* `clean` script uses `rimraf` instead of `rm -rf` so builds work on Windows.
* Bump node >= 20.9.

### 7.0.4 - 7.0.8
* Fixed build issue: internal relative imports now carry the `.js` extension required under ESM (`./extract.js`, `../utils.js`).
* `tsconfig.json`: target/lib raised to ES2023, added `declarationDir`, `resolveJsonModule` and `isolatedModules`, dropped the self-referential `paths` mapping.
* `types` entry in `package.json` changed to `./dist/index.d`.

### 7.0.0
* **Breaking:** the package is now ESM only (`"type": "module"`).
* Extractor discovery is asynchronous — `require()` was replaced by `await import()`, and `__dirname` is derived from `import.meta.url`.
* Removed the extractor self-test machinery (`test`/`registerFailedExtractor`/`satisfiedExtractors`) along with the `setTimeout` retry loop in `extract()`. No extractor depends on an external binary any more, so there is nothing to probe and errors no longer mention failed initialization.
* Tests moved from `test/` to `tests/` and are configured through `.mocharc.json` (`ts-node/esm` loader).
* Switched from `yarn.lock` to `package-lock.json`.

### 6.0.2
* Fixed: pipe characters were being mangled during cleansing, so text containing `||` came out as `""`. The fancy double-quote and apostrophe replacement patterns each contained a stray `|` inside their character class.

### 6.0.0
* Bump node >= 18.
* Bump deps: TypeScript 5.2, typedoc 0.25, ESLint 8.50, `@typescript-eslint` 6.7.

### 5.0.6 - 5.0.10
* Bump deps: TypeScript 5.1, `@xmldom/xmldom` 0.8.10, `xpath` 0.0.33, `html-entities` 2.4, `@typescript-eslint` 6, typedoc 0.24.
* Enabled ESLint caching and regenerated the typedoc output under `docs/`.

### 5.0.5
* Security workaround for `@xmldom/xmldom` >= 0.8.4. `.docx` XML fragments are now wrapped in a single `<Properties>` root element and the per-entry XML declaration is stripped before parsing, so the parser no longer rejects the multi-root input.
* `_extractWithType` inlined into `fromFileWithMimeAndPath`, and `replaceBadCharacters` is no longer exported.

### 5.0.4
* **Breaking:** removed the buffer API, `fromBufferWithMime()` and `fromBufferWithName()`. `fromFileWithPath()` and `fromFileWithMimeAndPath()` are the only entry points.
* Removed the leftover shell-based helpers from `src/utils.ts` — `createExecOptions`, `unzipCheck` and `runExecIntoFile` — dropping the `child_process` dependency entirely.
* Pinned `@xmldom/xmldom` to 0.8.2 to work around a parser error.

### 5.0.1 - 5.0.3
* Bump deps: `@xmldom/xmldom` 0.8.6, TypeScript 4.9, ESLint 8.32, typedoc 0.23.24.

### 5.0.0
* **Breaking:** callbacks replaced with `async`/`await`. Every exported function now returns `Promise<string | Error>` and no longer accepts a `cb` argument.
* Removed the argument-shape sniffing and `_returnArgsError` — argument validation is now the type system's job.
* Text cleansing moved out of `extract()` into `cleanseText()` in `src/utils.ts`, applied by each extractor instead of wrapping the callback.
* Package description narrowed to reflect what is actually supported: txt, doc, docx.

### 4.0.1
* Tightened types: `type` parameters are `string` rather than `any`, and the runtime `typeof` guards those types made redundant were removed.

### 4.0.0
* Moved on TS.
* Bump node >= 16
* Remove ./bin/...

### 3.0.2
* Bump deps.

### 3.0.0
* Bump deps.
* [#192](https://github.com/dbashford/textract/pull/192). Header and footer extracted from .odt.

### 2.5.0
* [#188](https://github.com/dbashford/textract/pull/188). PR updated `marked` depedency.
* [#179](https://github.com/dbashford/textract/pull/179). PR added ability to capture powerpoint speaker notes.
* [#175](https://github.com/dbashford/textract/pull/175). PR captured cases where `text` mime types files couldn't have their encoding detected

### 2.4.0
* [#164](https://github.com/dbashford/textract/issues/164). Fixed issue with extra text nodes in odt/ott extraction.
* [#156](https://github.com/dbashford/textract/issues/156). Introduced `preserveOnlyMultipleLineBreaks` feature.
* [#149](https://github.com/dbashford/textract/issues/149). RTF extraction error error fixed by [#166](https://github.com/dbashford/textract/pull/166).
* [#145](https://github.com/dbashford/textract/issues/145). Handling Japanese full-width characters.
* [#106](https://github.com/dbashford/textract/issues/106). Now extracting `.epub`

### 2.3.0
* [#149](https://github.com/dbashford/textract/issues/149). Fixed a few text errors that had cropped up with previous PRs/library updates
* [#139](https://github.com/dbashford/textract/issues/139). Updated mime and marked libraries because of GitHub vulnerability warnings
* [#137](https://github.com/dbashford/textract/issues/137). Added ability to capture HTML `alt` text via `includeAltText` option.

### 2.2.0
* [#118](https://github.com/dbashford/textract/issues/118). Properly extracting horizontal bar character
* [#119](https://github.com/dbashford/textract/pull/119). Passing exec options into RTF extraction.
* [#119](https://github.com/dbashford/textract/pull/119). Preserving № character.
* [#122](https://github.com/dbashford/textract/pull/122). Passing exec options into DOC extraction.
* [#123](https://github.com/dbashford/textract/pull/123). Adding ATOM and RSS extraction.
* [#128](https://github.com/dbashford/textract/pull/128). Handle line break preservation properly in `.docx` extractor

### 2.1.2
* [#114](https://github.com/dbashford/textract/pull/114). Not stripping Microsoft dashes.
* [#116](https://github.com/dbashford/textract/pull/116). Better handling image binary check.

### 2.1.1
* [#111](https://github.com/dbashford/textract/issues/111). Callback was being called two times when URL errored out.
* [#112](https://github.com/dbashford/textract/pull/112). PR added handling errors returned by decoding text files.

### 2.1.0
* Updated all dependencies to latest, except for [got](https://github.com/sindresorhus/got), which was updated, but not to the latest because of lack of support for older node versions.
* [#93](https://github.com/dbashford/textract/pull/93). PR added better error handling for `fromUrl` requests.
* [#95](https://github.com/dbashford/textract/pull/95). PR added support for monetary symbols.
* [#96](https://github.com/dbashford/textract/issues/96). Fixed various issues with doc handling on Windows.
* [#97](https://github.com/dbashford/textract/issues/97), [#102](https://github.com/dbashford/textract/pull/102). Added ability to provide raw [node.js URL object](https://nodejs.org/api/url.html) to the `fromUrl` call which bypasses URL parsing/mangling.
* [#98](https://github.com/dbashford/textract/pull/98). PR shortened needlessly long file paths for temp files.
* [#99](https://github.com/dbashford/textract/issues/99). Now handling Chinese comma.
* [#101](https://github.com/dbashford/textract/pull/101). PR added UTF-8 support for antiword requests.
* [#105](https://github.com/dbashford/textract/issues/105). Added `tesseract.cmd` option which allows for providing an exact tesseract command-line string.
* [#109](https://github.com/dbashford/textract/issues/109). Properly handle RTF files with spaces in the name on OSX

### 2.0.0
* Codebase is now properly eslinted.
* Fixed testing issue, `.csv` was `.gitignore`d preventing `.csv` test file from making into repo.
* [#57](https://github.com/dbashford/textract/issues/57), [#75](https://github.com/dbashford/textract/issues/75). Added a `pdftotextOptions` in textract options. This is a proxy to the [pdf-text-extract](https://github.com/nisaacson/pdf-text-extract) options.
* [#69](https://github.com/dbashford/textract/issues/69). Escaping paths for all `exec` and `spawn`.
* [#74](https://github.com/dbashford/textract/pull/74). PR fixing fancy double quotes -> “.
* [#77](https://github.com/dbashford/textract/pull/77). PR fixes decoding of non-utf8 encoded files.
* [#78](https://github.com/dbashford/textract/issues/78). Force all mime types to lowercase for comparison.
* [#81](https://github.com/dbashford/textract/issues/81). Moved `.doc` (old MSWord) extraction to [antiword](http://www.winfield.demon.nl/) from catdoc. catdoc is no longer supported on OSX making it extremely difficult for me to support updates that require testing of `.doc` files.  One major difference that'll be seen with `.doc`s of certain types is [explained here](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=307657). If "I'm afraid the text stream of this file is too small to handle." is an error message you see, see that post.
* [#82](https://github.com/dbashford/textract/issues/82), [#83](https://github.com/dbashford/textract/pull/83). PR updated cheerio to fix a cheerio regression.
* Fixed regression issue with above two PRs in combination. Pure `text/*` extraction left encoded characters for stylized quotes and true elipsis in the text.
* [#88](https://github.com/dbashford/textract/pull/88). PR fixed detection/messaging of missing binaries for `.doc`, images and `.pdf`.
* [#89](https://github.com/dbashford/textract/pull/89). PR returned textract to using j as a module rather than a binary.
* [#90](https://github.com/dbashford/textract/pull/90). PR improved content type detection when extracting from URLs. Also updated tests to pull test files using proper content-type.

### 1.2.1
* [#68](https://github.com/dbashford/textract/pull/68). PR captured unzip errors.

### 1.2.0
* [#66](https://github.com/dbashford/textract/issues/66). textract will no longer put the info text to stdout about the extractors not being available or installed correctly.  Instead, if you attempt to use a supported extractor that did not initialize correctly, you will get an updated error message indicating that the type is supported by textract but that external dependencies were not located. As part of this update, error messages were updated a bit to list both the type and the file.
* [#65](https://github.com/dbashford/textract/issues/65). Fixed issue where for `.odt` and `.docx` files with varying non-Latin characters (ex: cyrillic) were being stripped entirely of their content.

### 1.1.2
* [#63](https://github.com/dbashford/textract/pull/63). PR added support for CSV.

### 1.1.1
* [#58](https://github.com/dbashford/textract/pull/58)/[#59](https://github.com/dbashford/textract/issues/59). PR fixed issue with removing line breaks when more than 1 break present.

### 1.1.0
* [#53](https://github.com/dbashford/textract/pull/53). Cleared up documentation around CLI and line breaks.
* [#54](https://github.com/dbashford/textract/pull/54). PR removed `disableCatdocWordWrap` as an option, instead always disabling catdoc's word wrapping.
* [#55](https://github.com/dbashford/textract/pull/55). PR removed clobbering of non-boolean flags on CLI.

### 1.0.4
* [#52](https://github.com/dbashford/textract/issues/52). PR fixed CLI post big API changes.

### 1.0.3
* [#51](https://github.com/dbashford/textract/issues/51).  Fixed issue with large files using unzip returning blank string.

### 1.0.1/1.0.2
* [#49](https://github.com/dbashford/textract/issues/49) Updated messages when extractors are not available to be purely informational, since textract will work just fine without some of its extractors.
* [#50](https://github.com/dbashford/textract/issues/50). Updated way in which catdoc was detected to not rely on file being test extracted.

### 1.0.0
* Overhaul of interface. To simplify the code, the original `textract` function was broken into `textract.fromFileWithPath` and `textract.fromFileWithMimeAndPath`.
* [#41](https://github.com/dbashford/textract/issues/41). Added support for pulling files from a URL.
* [#40](https://github.com/dbashford/textract/issues/40).  Added support for extracting text from a node `Buffer`.  This prevents you from having to write the file to disk first.  textract does have to write the file to disk itself, but because it is a textract requirement that files be on disk textract should be able to take care of that for you. Two new functions, `textract.fromBufferWithName` and `textract.fromBufferWithMime` have been added.  textract needs to either know the file name or the mime type to extract a buffer.
* Added entity decoding, so encoded items like `&lt;`, `&gt;`, `&quot;`, `&apos;`, and `&amp;` will show up appropriately in the text.
* Removed external dependency on `unzip`
* [#38](https://github.com/dbashford/textract/issues/38).  Added markdown support.
* [#31](https://github.com/dbashford/textract/issues/31).  Added initial ODT support.  Feedback needed if there is any trouble.  Also added OTT support.
* Added support for ODS, OTS.
* Added support for XML, XSL.
* Added support for POTX.
* Added support for XLTX, XLTS.
* Added support for ODG, OTG.
* Added support for ODP, OTP.

### 0.20.0
* Pull Request [#39](https://github.com/dbashford/textract/pull/39) added support for not work wrapping with catdoc.

### 0.19.0
* [#30](https://github.com/dbashford/textract/issues/30), [#34](https://github.com/dbashford/textract/issues/34).  The command line has been improved, allowing for all the configuration options to be provided.

### 0.18.0
* [#36](https://github.com/dbashford/textract/issues/36) Fixed error with previous deploy.
* [#32](https://github.com/dbashford/textract/issues/32) Fixed `docx` line break issue.

### 0.17.0
* Updated character stripping regex to be more lenient.

### 0.16.0
* Added HTML extraction.
* Added ability for extractors to register for specific extensions (not yet used).  This handles cases where extensions (like `.webarchive`) do not have recognized mime types.

### 0.15.0
* Addressed some lingering regex issues from previous release.
* Added tests for RTF, more tests for DOC
* [#29](https://github.com/dbashford/textract/issues/29) Introduced new extractor for `.doc` and `.rtf` __for OSX only__.  All non-OSX operating systems will continue to use `catdoc`. Going forward, because of issues getting `catdoc` installed on OSX, on OSX only `textutil` will be used. `textutil` comes default installed with OSX.

### 0.14.0
* [#29](https://github.com/dbashford/textract/issues/29) which resulted in the following changes:
1. writing info messages to `stderr` when extractors taking awhile to get going
2. no longer removing …
3. centralized some cleansing regexes, also no longer removing multiple back to back spaces using `\s` as it was removing any back to back newlines.  Now scoping back to back replacing to `[\t\v\u00A0]`.

### 0.13.2
* [#27](https://github.com/dbashford/textract/issues/27), addressed issues with page ordering in `pptx` extraction.

### 0.13.1
* [#25](https://github.com/dbashford/textract/issues/25), added language support for tesseract, see `tesseract.lang` property.
* Updated regex that strips bad characters to not strip (some) chinese characters.  The regex will likely need updating by someonw more familiar with Chinese. =)

### 0.13.0
* [#26](https://github.com/dbashford/textract/issues/26), using `os.tmpdir()` rather than a temp dir inside textract.
* Upgraded to latest `j` (dependency)
* Removed `macProcessGif` option and tests as tesseract seems to work on Mac just fine now

### 0.12.0
* [#21](https://github.com/dbashford/textract/issues/21), [#22](https://github.com/dbashford/textract/issues/22), Now using [j](https://www.npmjs.org/package/j) via its binaries rather than using it via node. This makes XLS/X extraction slower, but reduces memory consumption of textract signifcantly.

### 0.11.2
* Updated pdf-text-extract to latest, fixes [#20](https://github.com/dbashford/textract/issues/20).

### 0.11.1
* Addressed path escaping issues with tesseract, fixes [#18] (https://github.com/dbashford/textract/issues/18)

### 0.11.0
* Using [j](https://github.com/SheetJS/j) to handle `xls` and `xlsx`, this removes the requirement on the `xls2csv` binary.
* j also supports `xlsb` and `xlsm`
