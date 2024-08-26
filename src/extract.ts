import fs from "fs";
import path from "path";

import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractorPath = path.join(__dirname, "extractors");
const typeExtractors: any = {};
const regexExtractors: any[] = [];
let hasInitialized = false;
function registerExtractor(extractor: any) {
    if (extractor.types) {
        for (let type of extractor.types) {
            if (typeof type === "string") {
                type = type.toLowerCase();
                typeExtractors[type] = extractor.extract;
            } else if (type instanceof RegExp) {
                regexExtractors.push({ reg: type, extractor: extractor.extract });
            }
        }
    }
}

async function initializeExtractors() {
    hasInitialized = true;

    // discover available extractors
    const extractors = await Promise.all(fs.readdirSync(pathToFileURL(extractorPath)).map(async (item: any) => {
        const fullExtractorPath = path.join(extractorPath, item);
        // get the extractor
        const { default: extractor } = await import(fullExtractorPath);

        return extractor;
    }));

    // perform any binary tests to ensure extractor is possible
    // given execution environment
    for (const extractor of extractors) {
        registerExtractor(extractor);
    }
}

function findExtractor(type: string) {
    let i;
    const iLen = regexExtractors.length;
    let extractor;
    let regexExtractor;

    type = type.toLowerCase();
    if (typeExtractors[type]) {
        extractor = typeExtractors[type];
    } else {
        for (i = 0; i < iLen; i++) {
            regexExtractor = regexExtractors[i];
            if (regexExtractor.reg.test(type)) {
                extractor = regexExtractor.extractor;
            }
        }
    }
    return extractor;
}

export async function extract(type: string, filePath: string, options: any): Promise<string | Error> {
    let error;
    let msg;
    let theExtractor;

    if (!hasInitialized) {
        await initializeExtractors();
    }

    theExtractor = findExtractor(type);

    if (theExtractor) {
        return theExtractor(filePath, options);
    } else {
        // cannot extract this file type
        msg = `Error for type: [[ ${type} ]], file: [[ ${filePath} ]]`;

        error = new Error(msg);
        return error;
    }
}
