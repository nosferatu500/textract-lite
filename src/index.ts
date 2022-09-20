import fs from "fs";
import os from "os";
import path from "path";
import mime from "mime";
import { extract } from "./extract";

const tmpDir = os.tmpdir();

function _genRandom() {
    return Math.floor(Math.random() * 100_000_000_000 + 1);
}

function _extractWithType(type: any, filePath: string, options: any, cb: any) {
    if (fs.existsSync(filePath)) {
        extract(type, filePath, options, cb);
    } else {
        cb(new Error(`File at path [[ ${filePath} ]] does not exist.`), null);
    }
}

function _returnArgsError(_args: any) {
    const args = Array.prototype.slice.call(_args);
    let callback;
    for (const parm of args) {
        if (parm && typeof parm === "function") {
            callback = parm;
        }
    }

    if (callback) {
        callback(new Error("Incorrect parameters passed to textract."), null);
    } else {
        console.error("textract could not find a callback function to execute.");
    }
}

function _writeBufferToDisk(buff: Buffer, cb: any) {
    const fullPath = path.join(tmpDir, `textract_file_${_genRandom()}`);

    fs.open(fullPath, "w", function (err: any, fd: any) {
        if (err) {
            throw new Error(`error opening temp file: ${err}`);
        } else {
            fs.write(fd, buff, 0, buff.length, null, function (err2: any) {
                if (err2) {
                    throw new Error(`error writing temp file: ${err2}`);
                } else {
                    fs.close(fd, function () {
                        cb(fullPath);
                    });
                }
            });
        }
    });
}

export function fromFileWithMimeAndPath(type: any, filePath: string, options: any, cb: any) {
    let called = false;

    if (typeof type === "string" && typeof filePath === "string") {
        if (typeof cb === "function" && typeof options === "object") {
            // (mimeType, filePath, options, callback)
            _extractWithType(type, filePath, options, cb);
            called = true;
        } else if (typeof options === "function" && cb === undefined) {
            // (mimeType, filePath, callback)
            _extractWithType(type, filePath, {}, options);
            called = true;
        }
    }

    if (!called) {
        _returnArgsError(arguments);
    }
}

export function fromFileWithPath(filePath: string, options: any, cb: any) {
    let type;
    if (typeof filePath === "string" && (typeof options === "function" || typeof cb === "function")) {
        type = (options && options.typeOverride) || mime.getType(filePath);
        fromFileWithMimeAndPath(type, filePath, options, cb);
    } else {
        _returnArgsError(arguments);
    }
}

export function fromBufferWithMime(type: any, bufferContent: Buffer, options: any, cb: any) {
    if (
        typeof type === "string" &&
        bufferContent &&
        bufferContent instanceof Buffer &&
        (typeof options === "function" || typeof cb === "function")
    ) {
        if (typeof options === "function") {
            cb = options;
            options = {};
        }
        _writeBufferToDisk(bufferContent, function (newPath: string) {
            fromFileWithMimeAndPath(type, newPath, options, function (err: any, text: string) {
                // Remove temporary file regardless of error, ignore error on unlink
                fs.unlink(newPath, function () { });
                if (cb) cb(err, text);
            });
        });
    } else {
        _returnArgsError(arguments);
    }
}

export function fromBufferWithName(filePath: string, bufferContent: Buffer, options: any, cb: any) {
    let type;
    if (typeof filePath === "string") {
        type = mime.getType(filePath);
        fromBufferWithMime(type, bufferContent, options, cb);
    } else {
        _returnArgsError(arguments);
    }
}
