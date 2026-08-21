import { decode } from "html-entities";

import type { ExtractOptions } from "./types.ts";

const STRIP_ONLY_SINGLE_LINEBREAKS = /(^|[^\n])\n(?!\n)/g;
const WHITELIST_PRESERVE_LINEBREAKS =
    /[^\d\n\r !"#$%&'-\w'()-_`a-z{|}~\u0080-\u1FFF\u2013–\u2014\u2015\u2018\u2019\u201C\u201D„\u2026\u20AC\u2116\u2C00-\uD7FF\uFB50\uFDFF\uFE70\uFEFF\uFF01-\uFFE6]*/g;
const WHITELIST_STRIP_LINEBREAKS =
    /[^\d !"#$%&'-\w'()-_`a-z{|}~\u0080-\u1FFF\u2013–\u2014\u2015\u2018\u2019\u201C\u201D„\u2026\u20AC\u2116\u2C00-\uD7FF\uFB50\uFDFF\uFE70\uFEFF\uFF01-\uFFE6]*/g;

const replacements: [RegExp, string][] = [
    [/[\u201C\u201D]|â€œ|â€/g, '"'], // fancy double quotes
    [/[\u2018\u2019]|â€™|â€˜]/g, "'"], // fancy single quotes/apostrophes
    [/â€¦/g, "…"], // elipses
    [/â€“|â€”/g, "–"], // long hyphen
];

// replace nasty quotes with simple ones
function replaceBadCharacters(text: string): string {
    return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

/** Global, all-file-type content cleansing. */
export function cleanseText(options: ExtractOptions, text: string): string {
    text = replaceBadCharacters(text);

    if (options.preserveLineBreaks || options.preserveOnlyMultipleLineBreaks) {
        if (options.preserveOnlyMultipleLineBreaks) {
            text = text.replace(STRIP_ONLY_SINGLE_LINEBREAKS, "$1 ").trim();
        }
        text = text.replace(WHITELIST_PRESERVE_LINEBREAKS, " ");
    } else {
        text = text.replace(WHITELIST_STRIP_LINEBREAKS, " ");
    }

    // multiple spaces, tabs, vertical tabs, non-breaking space
    text = text.replace(/ (?! )/g, "").replace(/[\t\v \u00A0]{2,}/g, " ");

    return decode(text, { level: "xml" });
}
