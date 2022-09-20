import fs from "fs";
import path from "path";
import iconv from "iconv-lite";
import jschardet from "jschardet";

function extractText(filePath: string, options: any, cb: any) {
    fs.readFile(filePath, function (error, data) {
        let encoding;
        let decoded;
        let detectedEncoding;
        if (error) {
            cb(error, null);
            return;
        }
        try {
            detectedEncoding = jschardet.detect(data).encoding;
            if (!detectedEncoding) {
                error = new Error(`Could not detect encoding for file named [[ ${path.basename(filePath)} ]]`);
                cb(error, null);
                return;
            }
            encoding = detectedEncoding.toLowerCase();

            decoded = iconv.decode(data, encoding);
        } catch (error_) {
            cb(error_);
            return;
        }
        cb(null, decoded);
    });
}

export default {
    types: [/text\//, "application/csv", "application/javascript"],
    extract: extractText,
}
