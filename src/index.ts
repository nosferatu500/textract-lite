import { existsSync } from "node:fs";
import mime from "mime";

import { extract } from "./extract.ts";

export type { ExtractOptions, Extractor, ExtractorModule } from "./types.ts";

import type { ExtractOptions } from "./types.ts";

/** Extract text from a file whose mime type you already know. */
export async function fromFileWithMimeAndPath(
    type: string,
    filePath: string,
    options: ExtractOptions = {},
): Promise<string | Error> {
    if (existsSync(filePath)) {
        return extract(type, filePath, options);
    }
    return new Error(`File at path [[ ${filePath} ]] does not exist.`);
}

/** Extract text from a file, deriving the mime type from its name. */
export async function fromFileWithPath(filePath: string, options: ExtractOptions = {}): Promise<string | Error> {
    // An unset *or empty* `typeOverride` falls through to mime detection,
    // which is why this is not a `??`.
    const { typeOverride } = options;
    const type = typeOverride === undefined || typeOverride === "" ? mime.getType(filePath) : typeOverride;

    if (type === null) {
        return new Error(`Could not determine the mime type of [[ ${filePath} ]].`);
    }

    return fromFileWithMimeAndPath(type, filePath, options);
}
