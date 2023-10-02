import fs from "fs";
import path from "path";

const extractorPath = path.join(__dirname, "extractors");
const typeExtractors: any = {};
const regexExtractors: any[] = [];
const failedExtractorTypes: any = {};
let totalExtractors = 0;
let satisfiedExtractors = 0;
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

function registerFailedExtractor(extractor: any, failedMessage: string) {
    if (extractor.types) {
        for (const type of extractor.types) {
            failedExtractorTypes[type.toLowerCase()] = failedMessage;
        }
    }
}

function testExtractor(extractor: any, options: any) {
    extractor.test(options, function (passedTest: any, failedMessage: string) {
        satisfiedExtractors++;
        if (passedTest) {
            registerExtractor(extractor.default);
        } else {
            registerFailedExtractor(extractor, failedMessage);
        }
    });
}

function initializeExtractors(options: any) {
    hasInitialized = true;

    // discover available extractors
    const extractors = fs.readdirSync(extractorPath).map(function (item: any) {
        const fullExtractorPath = path.join(extractorPath, item);
        // get the extractor
        // eslint-disable-next-line global-require
        return require(fullExtractorPath);
    });

    // perform any binary tests to ensure extractor is possible
    // given execution environment
    for (const extractor of extractors) {
        if (extractor.test) {
            testExtractor(extractor, options);
        } else {
            satisfiedExtractors++;
            registerExtractor(extractor.default);
        }
    }

    // need to keep track of how many extractors we have in total
    totalExtractors = extractors.length;
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
        initializeExtractors(options);
    }

    // registration of extractors complete?
    if (totalExtractors === satisfiedExtractors) {
        theExtractor = findExtractor(type);

        if (theExtractor) {
            return theExtractor(filePath, options);
        } else {
            // cannot extract this file type
            msg = `Error for type: [[ ${type} ]], file: [[ ${filePath} ]]`;

            // update error message if type is supported but just not configured/installed properly
            if (failedExtractorTypes[type]) {
                msg +=
                    `, extractor for type exists, but failed to initialize.` +
                    ` Message: ${failedExtractorTypes[type]}`;
            }

            error = new Error(msg);
            return error;
        }
    } else {
        // async registration has not wrapped up
        // try again later
        setTimeout(function () {
            extract(type, filePath, options);
        }, 100);
    }

    return new Error("Something went wrong.")
}
