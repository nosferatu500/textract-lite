import fs from "fs";
import path from "path";
import mime from "mime";

import { describe } from "mocha";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fromBufferWithMime, fromBufferWithName } from "../src";

chai.use(chaiAsPromised);
const expect = chai.expect;

const test = function (_testFunction: any, withMime: boolean) {
    let testFunction: any;

    beforeEach(function () {
        testFunction = _testFunction();
    });

    const _test = function (ext: string, name: string, _text: string) {
        it(`will ${ext} files`, async () => {
            const docPath = path.join(__dirname, "files", name);
            const textBuff = fs.readFileSync(docPath);

            const text = await testFunction(withMime ? mime.getType(docPath) : docPath, textBuff, {});
            expect(text.slice(0, 100)).to.eql(_text);
        });
    };

    _test(
        "docx",
        "docx.docx",
        "This is a test Just so you know: Lorem ipsum dolor sit amet, consecutuer adipiscing elit, sed diam n"
    );

    _test("text/*", "txt.txt", "This is a plain old text file.");
};

describe("textract fromBufferWithName", function () {
    test(function () {
        return fromBufferWithName;
    }, false);
});

describe("textract fromBufferWithMime", function () {
    test(function () {
        return fromBufferWithMime;
    }, true);
});
