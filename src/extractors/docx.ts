import xpath from "xpath";
import { DOMParser } from "@xmldom/xmldom";
import yauzl from "yauzl";
import { yauzlError, getTextFromZipFile } from "../utils";

const includeRegex = /.xml$/;
const excludeRegex = /^(word\/media\/|word\/_rels\/)/;

function _calculateExtractedText(inText: any, preserveLineBreaks: any) {
    const doc = new DOMParser().parseFromString(inText);
    const ps: any = xpath.select("//*[local-name()='p']", doc);
    let text = "";
    for (let paragraph of ps) {
        let localText = "";
        paragraph = new DOMParser().parseFromString(paragraph.toString());
        const ts = xpath.select("//*[local-name()='t' or local-name()='tab' or local-name()='br']", paragraph) as any;
        for (const t of ts) {
            if (t.localName === "t" && t.childNodes.length > 0) {
                localText += t.childNodes[0].data;
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

function extractText(filePath: string, options: any, cb: any) {
    let result = "";

    yauzl.open(filePath, function (err: any, zipfile: any) {
        let processedEntries = 0;
        if (err) {
            yauzlError(err, cb);
            return;
        }

        const processEnd = function () {
            let text;
            if (zipfile.entryCount === ++processedEntries) {
                if (result.length > 0) {
                    text = _calculateExtractedText(result, options.preserveLineBreaks);
                    cb(null, text);
                } else {
                    cb(
                        new Error(
                            "Extraction could not find content in file, are you" +
                            " sure it is the mime type it says it is?"
                        ),
                        null
                    );
                }
            }
        };

        zipfile.on("entry", function (entry: any) {
            if (includeRegex.test(entry.fileName) && !excludeRegex.test(entry.fileName)) {
                getTextFromZipFile(zipfile, entry, function (_: any, text: any) {
                    result += `${text}\n`;
                    processEnd();
                });
            } else {
                processEnd();
            }
        });

        zipfile.on("error", function (err3: any) {
            cb(err3);
        });
    });
}

export default {
    types: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extract: extractText,
};
