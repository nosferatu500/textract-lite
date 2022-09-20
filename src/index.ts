import fs from "fs";
import os from "os";
import path from "path";
import mime from "mime";
import { extract } from "./extract";

const tmpDir = os.tmpdir();

function _genRandom() {
    return Math.floor(Math.random() * 100_000_000_000 + 1);
}

async function _extractWithType(type: string, filePath: string, options: any): Promise<string | Error> {
    if (fs.existsSync(filePath)) {
        return extract(type, filePath, options);
    }
    return new Error(`File at path [[ ${filePath} ]] does not exist.`);
}

function _writeBufferToDisk(buff: Buffer) {
    const fullPath = path.join(tmpDir, `textract_file_${_genRandom()}`);

    const fd = fs.openSync(fullPath, "w");
    fs.writeSync(fd, buff, 0, buff.length, null);
    fs.closeSync(fd);

    return fullPath;
}

export async function fromFileWithMimeAndPath(type: string, filePath: string, options: any): Promise<string | Error> {
    return _extractWithType(type, filePath, options);
}

export async function fromFileWithPath(filePath: string, options: any): Promise<string | Error> {
    const type = (options && options.typeOverride) || mime.getType(filePath);
    return fromFileWithMimeAndPath(type, filePath, options);
}

export async function fromBufferWithMime(type: string, bufferContent: Buffer, options: any): Promise<string | Error> {
    const newPath = _writeBufferToDisk(bufferContent);
    const text = await fromFileWithMimeAndPath(type, newPath, options);

    // TODO:
    // Remove temporary file regardless of error, ignore error on unlink
    fs.unlink(newPath, function () { });
    return text;
}

export async function fromBufferWithName(filePath: string, bufferContent: Buffer, options: any): Promise<string | Error> {
    const type = mime.getType(filePath);
    if (typeof type === "string") {
        return fromBufferWithMime(type, bufferContent, options);
    }

    return new Error("Something went wrong.");
}
