import fs from "fs";
import path from "path";
import iconv from "iconv-lite";
import jschardet from "jschardet";
import { cleanseText } from "../utils.js";

function extractText(filePath: string, options: any): Promise<string | Error> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function (error, data) {
            let encoding;
            let decoded;
            let detectedEncoding;
            if (error) {
                reject(error);
                return;
            }
            try {
                detectedEncoding = jschardet.detect(data).encoding;
                if (!detectedEncoding) {
                    error = new Error(`Could not detect encoding for file named [[ ${path.basename(filePath)} ]]`);
                    resolve(error);
                    return;
                }
                encoding = detectedEncoding.toLowerCase();

                decoded = iconv.decode(data, encoding);
                decoded = cleanseText(options, decoded);
            } catch (error_) {
                resolve(error_ as Error);
                return;
            }
            resolve(decoded);
        });
    });
}

export default {
    types: [/text\//, "application/csv", "application/javascript"],
    extract: extractText,
}
