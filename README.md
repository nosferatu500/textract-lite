textract-lite
========

A small, dependency-light text extraction module for node. ESM only.

This is a trimmed-down fork of [textract](https://github.com/dbashford/textract). Everything that required an external binary (`antiword`, `tesseract`, `pdftotext`, `unzip`, …) has been removed, so there is nothing to install beyond the package itself.

## Currently Extracts...

* `.docx` — `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
* Anything with a `text/*` mime type — `.txt`, `.csv`, `.html`, `.md`, …
* `application/csv`
* `application/javascript`

What textract-lite cares about is the mime type, not the extension. Any extension that maps to one of the types above will extract. The mime type is resolved from the file name via [mime](https://github.com/broofa/mime), and can be overridden — see `typeOverride` below.

_Need a type that isn't listed?_ Open an issue or a pull request.

## Requirements

* Node.js >= 24.11

## Install

```
npm i @nosferatu500/textract-lite
```

## Usage

The package is ESM only, so use `import`. There is no CLI.

```javascript
import { fromFileWithPath, fromFileWithMimeAndPath } from "@nosferatu500/textract-lite";
```

### APIs

Both functions are `async` and resolve to either the extracted text or an `Error`. The `options` argument is required — pass `{}` if you have nothing to configure.

#### File

```javascript
const text = await fromFileWithPath(filePath, {});
```

The mime type is derived from `filePath`.

#### File + mime type

```javascript
const text = await fromFileWithMimeAndPath(type, filePath, {});
```

Use this when the file name doesn't reflect its contents, or when you already know the type.

### Error handling

Extraction failures are reported two different ways, so handle both: most failures **resolve** with an `Error` (unsupported mime type, missing file, undetectable text encoding), while some `.docx` failures **reject** (a file that isn't really a zip, or a `.docx` with no extractable content).

```javascript
try {
    const result = await fromFileWithPath(filePath, {});
    if (result instanceof Error) {
        // unsupported type, missing file, unknown encoding, ...
        console.error(result.message);
    } else {
        console.log(result);
    }
} catch (error) {
    // malformed .docx, empty .docx, unreadable file
    console.error(error);
}
```

## Configuration

The second argument to both functions accepts:

* `preserveLineBreaks`: Defaults to `false`, which strips all line breaks from the output. Pass `true` to keep them.
* `preserveOnlyMultipleLineBreaks`: Defaults to `false`. When `true`, single line breaks are collapsed into spaces but consecutive line breaks are preserved. Note that this does not reliably preserve paragraphs unless the source actually uses multiple breaks between them. Setting this implies `preserveLineBreaks`.
* `typeOverride`: Only used by `fromFileWithPath`. When set, this mime type is used instead of the one derived from the file name.

```javascript
const text = await fromFileWithPath(filePath, { preserveLineBreaks: true });
const csv = await fromFileWithPath("data.dat", { typeOverride: "application/csv" });
```

## Notes on extraction

* Text files have their encoding detected with [jschardet](https://github.com/aadsm/jschardet) and are decoded with [iconv-lite](https://github.com/ashtuchkin/iconv-lite). If the encoding cannot be detected, an `Error` is returned rather than a best-effort guess.
* All extracted text is passed through a cleansing step that normalizes typographic quotes, ellipses and long hyphens, collapses runs of whitespace, and decodes XML entities.

## Development

```
npm install
npm run build     # clean + tsc + prune internal .d.ts files
npm test          # mocha, tests live in tests/
npm run lint      # eslint (flat config)
npm run docs      # typedoc into docs/
```

## License

MIT. See [LICENSE](LICENSE).
