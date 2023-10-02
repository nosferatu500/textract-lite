import { decode } from "html-entities";
import fs from "fs";
import os from "os";
import path from "path";

const STRIP_ONLY_SINGLE_LINEBREAKS = /(^|[^\n])\n(?!\n)/g;
const WHITELIST_PRESERVE_LINEBREAKS =
    /[^\d\n\r !"#$%&'-\w'()-_`a-z{|}~\u0080-\u1FFF\u007C\u2013–\u2014\u2015\u2018\u2019\u201C\u201D„\u2026\u20AC\u2116\u2C00-\uD7FF\uFB50\uFDFF\uFE70\uFEFF\uFF01-\uFFE6]*/g;
const WHITELIST_STRIP_LINEBREAKS =
    /[^\d !"#$%&'-\w'()-_`a-z{|}~\u0080-\u1FFF\u007C\u2013–\u2014\u2015\u2018\u2019\u201C\u201D„\u2026\u20AC\u2116\u2C00-\uD7FF\uFB50\uFDFF\uFE70\uFEFF\uFF01-\uFFE6]*/g;

const outDir = path.join(os.tmpdir(), "textract");
const replacements = [
    [/[|\u201C\u201D]|â€œ|â€/g, '"'], // fancy double quotes
    [/[|\u2018\u2019]|â€™|â€˜]/g, "'"], // fancy single quotes/apostrophes
    [/â€¦/g, "…"], // elipses
    [/â€“|â€”/g, "–"], // long hyphen
];
const rLen = replacements.length;
// Up front creation of tmp dir
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

// replace nasty quotes with simple ones
function replaceBadCharacters(text: string) {
    let i;
    let repl: any;
    for (i = 0; i < rLen; i++) {
        repl = replacements[i];
        text = text.replace(repl[0], repl[1]);
    }
    return text;
}

export function yauzlError(err: any, cb: any) {
    let msg = err.message;
    if (msg === "end of central directory record signature not found") {
        msg = `File not correctly recognized as zip file, ${msg}`;
    }
    cb(new Error(msg), null);
}

export function getTextFromZipFile(zipfile: any, entry: any, cb: any) {
    zipfile.openReadStream(entry, function (err: any, readStream: any) {
        let text = "";
        let error = "";
        if (err) {
            cb(err, null);
            return;
        }

        readStream.on("data", function (chunk: any) {
            text += chunk;
        });
        readStream.on("end", function () {
            if (error.length > 0) {
                cb(error, null);
            } else {
                cb(null, text);
            }
        });
        readStream.on("error", function (_err: any) {
            error += _err;
        });
    });
}

export function cleanseText(options: any, text: string) {
    // clean up text
    text = replaceBadCharacters(text);

    if (options.preserveLineBreaks || options.preserveOnlyMultipleLineBreaks) {
        if (options.preserveOnlyMultipleLineBreaks) {
            text = text.replace(STRIP_ONLY_SINGLE_LINEBREAKS, "$1 ").trim();
        }
        text = text.replace(WHITELIST_PRESERVE_LINEBREAKS, " ");
    } else {
        text = text.replace(WHITELIST_STRIP_LINEBREAKS, " ");
    }

    // multiple spaces, tabs, vertical tabs, non-breaking space]
    text = text.replace(/ (?! )/g, "").replace(/[\t\v \u00A0]{2,}/g, " ");

    text = decode(text, { level: "xml" });

    return text;
}