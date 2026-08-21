import { text as streamToText } from "node:stream/consumers";
import xpath from "xpath";
import { DOMParser, MIME_TYPE } from "@xmldom/xmldom";
import yauzl from "yauzl";
import type { Entry, ZipFile } from "yauzl";

import { cleanseText } from "../utils.ts";
import type { ExtractOptions, ExtractorModule } from "../types.ts";

const includeRegex = /.xml$/;
const excludeRegex = /^(word\/media\/|word\/_rels\/)/;

// Security workaround for xmldom >= v0.8.4, which rejects multi-root input.
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/**
 * A leading XML declaration, which is only legal at the very start of a
 * document. Every entry carries one, and they are concatenated into a single
 * document below, so all but the wrapper's own must go. Matched as a pattern
 * rather than one exact literal: entries vary in attribute set and line ending,
 * and xmldom >= 0.9 treats a stray mid-document declaration as fatal.
 */
const LEADING_XML_DECLARATION = /^\s*<\?xml[\s\S]*?\?>\s*/;

/**
 * The parts of an xmldom node this extractor touches. Declared structurally so
 * the module does not need the DOM lib on top of `lib: ES2025`.
 */
interface XmlNode {
    localName: string;
    childNodes: ArrayLike<{ data?: string }>;
    toString(): string;
}

/**
 * `xpath`'s types are written against the DOM's `Node`, which xmldom 0.9 nodes
 * no longer structurally satisfy even though they work fine at runtime. Keep
 * the cast confined to this one place.
 */
function selectNodes(expression: string, contextNode: unknown): XmlNode[] {
    return xpath.select(expression, contextNode as Parameters<typeof xpath.select>[1]) as unknown as XmlNode[];
}

function _calculateExtractedText(inText: string, preserveLineBreaks?: boolean) {
    // Security workaround for xmldom >= v0.8.4
    inText = `${XML_DECLARATION}<Properties>${inText}</Properties>`;
    const doc = new DOMParser().parseFromString(inText, MIME_TYPE.XML_TEXT);
    const ps = selectNodes("//*[local-name()='p']", doc);
    let text = "";

    for (const paragraph of ps) {
        let localText = "";
        // Relative to the paragraph (`.//`), so there is no need to serialize
        // and re-parse each one just to scope an absolute `//` query. That also
        // keeps the original document's namespace declarations in scope.
        const ts = selectNodes(".//*[local-name()='t' or local-name()='tab' or local-name()='br']", paragraph);

        for (const t of ts) {
            if (t.localName === "t" && t.childNodes.length > 0) {
                localText += t.childNodes[0]?.data ?? "";
            } else if (t.localName === "tab") {
                localText += " ";
            } else if (t.localName === "br") {
                localText += preserveLineBreaks !== true ? " " : "\n";
            }
        }
        text += `${localText}\n`;
    }

    return text;
}

/** Turn a yauzl failure into an error carrying a more useful message. */
function yauzlError(err: unknown): Error {
    if (!(err instanceof Error)) {
        return new Error(String(err));
    }
    return err.message === "end of central directory record signature not found"
        ? new Error(`File not correctly recognized as zip file, ${err.message}`)
        : err;
}

/**
 * Read one zip entry out as text. `stream/consumers` decodes the entry in a
 * single pass, so multi-byte characters straddling a chunk boundary survive.
 */
async function readEntryText(zipfile: ZipFile, entry: Entry): Promise<string> {
    return streamToText(await zipfile.openReadStreamPromise(entry));
}

async function extractText(filePath: string, options: ExtractOptions): Promise<string | Error> {
    let zipfile: ZipFile;
    try {
        // `eachEntry()` requires lazyEntries, and reads one entry at a time.
        zipfile = await yauzl.openPromise(filePath, { lazyEntries: true });
    } catch (error) {
        // A file that is not a zip is reported as a value, not a rejection.
        return yauzlError(error);
    }

    const parts: string[] = [];

    for await (const entry of zipfile.eachEntry()) {
        if (!includeRegex.test(entry.fileName) || excludeRegex.test(entry.fileName)) {
            continue;
        }

        // Skip what yauzl cannot decode -- an encrypted entry or an unsupported
        // compression method -- rather than failing the whole document. If that
        // leaves nothing at all, the empty check below reports it.
        if (!entry.canDecodeFileData()) {
            continue;
        }

        const entryText = await readEntryText(zipfile, entry);
        parts.push(`${entryText.replace(LEADING_XML_DECLARATION, "")}\n`);
    }

    const result = parts.join("");

    if (result.length === 0) {
        throw new Error(
            "Extraction could not find content in file, are you sure it is the mime type it says it is?",
        );
    }

    return cleanseText(options, _calculateExtractedText(result, options.preserveLineBreaks));
}

export default {
    types: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extract: extractText,
} satisfies ExtractorModule;
