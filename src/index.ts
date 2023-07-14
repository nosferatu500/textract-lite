import fs from "fs";
import mime from "mime";
import { extract } from "./extract";

export async function fromFileWithMimeAndPath(type: string, filePath: string, options: any): Promise<string | Error> {
    if (fs.existsSync(filePath)) {
        return extract(type, filePath, options);
    }
    return new Error(`File at path [[ ${filePath} ]] does not exist.`);
}

export async function fromFileWithPath(filePath: string, options: any): Promise<string | Error> {
    const type = (options?.typeOverride) || mime.getType(filePath);
    return fromFileWithMimeAndPath(type, filePath, options);
}
