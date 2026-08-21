import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import iconv from "iconv-lite";
import jschardet from "jschardet";

import { cleanseText } from "../utils.ts";
import type { ExtractOptions, ExtractorModule } from "../types.ts";

async function extractText(filePath: string, options: ExtractOptions): Promise<string | Error> {
    // Read through a file URL: a bare path breaks on some Windows paths.
    const data = await readFile(pathToFileURL(filePath));

    const detectedEncoding = jschardet.detect(data).encoding;
    if (!detectedEncoding) {
        return new Error(`Could not detect encoding for file named [[ ${path.basename(filePath)} ]]`);
    }

    try {
        return cleanseText(options, iconv.decode(data, detectedEncoding.toLowerCase()));
    } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
}

export default {
    types: [/text\//, "application/csv", "application/javascript"],
    extract: extractText,
} satisfies ExtractorModule;
