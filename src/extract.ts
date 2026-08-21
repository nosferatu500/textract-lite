import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { ExtractOptions, Extractor, ExtractorModule } from "./types.ts";

const extractorPath = path.join(import.meta.dirname, "extractors");

const typeExtractors = new Map<string, Extractor>();
const regexExtractors: { reg: RegExp; extractor: Extractor }[] = [];

function registerExtractor(extractor: ExtractorModule) {
    for (const type of extractor.types) {
        if (typeof type === "string") {
            typeExtractors.set(type.toLowerCase(), extractor.extract);
        } else {
            regexExtractors.push({ reg: type, extractor: extractor.extract });
        }
    }
}

async function discoverExtractors() {
    const entries = await readdir(extractorPath);

    // `pathToFileURL` is required here: on Windows a bare absolute path is not
    // a valid import specifier.
    const extractors = await Promise.all(
        entries.map(async (entry) => {
            const { default: extractor } = (await import(
                pathToFileURL(path.join(extractorPath, entry)).href
            )) as { default: ExtractorModule };

            return extractor;
        }),
    );

    for (const extractor of extractors) {
        registerExtractor(extractor);
    }
}

// Cache the promise rather than a boolean, so concurrent `extract()` calls
// share one discovery pass instead of racing each other.
let discovery: Promise<void> | undefined;

function initializeExtractors(): Promise<void> {
    return (discovery ??= discoverExtractors());
}

function findExtractor(type: string): Extractor | undefined {
    const lowered = type.toLowerCase();

    return typeExtractors.get(lowered) ?? regexExtractors.findLast(({ reg }) => reg.test(lowered))?.extractor;
}

export async function extract(type: string, filePath: string, options: ExtractOptions): Promise<string | Error> {
    await initializeExtractors();

    const theExtractor = findExtractor(type);

    if (!theExtractor) {
        // cannot extract this file type
        return new Error(`Error for type: [[ ${type} ]], file: [[ ${filePath} ]]`);
    }

    return theExtractor(filePath, options);
}
