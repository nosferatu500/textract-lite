import path from "path";

import { expect } from 'chai';
import { fromFileWithMimeAndPath, fromFileWithPath } from "../src";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("textract", () => {
    it("properties should be functions", () => {
        expect(typeof fromFileWithPath).to.eql("function");
        expect(typeof fromFileWithMimeAndPath).to.eql("function");
    });

    // describe("will error out gracefully", function () {
    //     it("when file does not exist", async () => {
    //         const filePath = "foo/bar/foo.txt";
    //         const error = await fromFileWithPath(filePath, {});
    //         expect(error).to.be.an("error");
    //         expect((error as Error).message).to.be.an("string");
    //         expect((error as Error).message).to.eql("File at path [[ " + filePath + " ]] does not exist.");
    //     });
    // });

    it("can handle types of varying cases", async () => {
        const filePath = path.join(__dirname, "files", "new docx(1).docx");
        const text = await fromFileWithMimeAndPath(
            "appLication/vnd.openXMLformats-Officedocument.WordProcessingml.Document",
            filePath,
            {});
        expect(text).to.be.a("string");
        expect((text as string).substring(0, 38)).to.eql("This is a test Just so you know: Lorem");
    });

    // it("can handle a text file with parens", async () => {
    //     const filePath = path.join(__dirname, "files", "new doc(1).txt");
    //     const text = await fromFileWithPath(filePath, {});
    //     expect(text).to.be.a("string");
    //     expect(text).to.eql("text!!!");
    // });

    // it("can handle a docx file with parens", async () => {
    //     const filePath = path.join(__dirname, "files", "new docx(1).docx");
    //     const text = await fromFileWithPath(filePath, {});
    //     expect(text).to.be.a("string");
    //     expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
    // });

    // it("can handle cyrillic", async () => {
    //     const filePath = path.join(__dirname, "files", "cyrillic.docx");
    //     const text = await fromFileWithPath(filePath, {});
    //     expect(text).to.be.a("string");
    //     expect((text as string).substring(0, 100)).to.eql(
    //         "Актуальность диссертационного исследования определяется необходимостью развития методологического об"
    //     );
    // });

    // it("can handle special chinese characters", async () => {
    //     const filePath = path.join(__dirname, "files", "chi.txt");
    //     const text = await fromFileWithPath(filePath, {});
    //     expect(text).to.be.a("string");
    //     expect((text as string).substring(0, 100)).to.eql("，卧虎藏龙卧");
    // });

    // describe("with multi line files", function () {
    //     it("strips line breaks", async () => {
    //         const filePath = path.join(__dirname, "files", "multi-line.txt");
    //         const text = await fromFileWithPath(filePath, {});
    //         expect(text).to.be.a("string");
    //         expect(text).to.eql(
    //             "This file has a bunch of line breaks in it, and it also has some useful punctuation."
    //         );
    //     });

    //     it("does not strip line breaks when configured as such", async () => {
    //         const filePath = path.join(__dirname, "files", "multi-line.txt");
    //         const text = await fromFileWithPath(filePath, { preserveLineBreaks: true });
    //         expect(text).to.be.a("string");
    //         expect(text).to.eql(
    //             "This file\nhas a bunch\nof line breaks\nin it, and it also\nhas some useful\npunctuation."
    //         );
    //     });

    //     it("will only strip single line breaks when requested", async () => {
    //         const filePath = path.join(__dirname, "files", "line-breaks.txt");
    //         const text = await fromFileWithPath(filePath, { preserveOnlyMultipleLineBreaks: true });
    //         expect(text).to.be.a("string");
    //         expect(text).to.eql(
    //             "This is a text file\n\nthat has a combination of multiple\n\n\n\nand single line breaks, for use when testing the preserveOnlyMultipleLineBreaks option that keeps only\n\n\nmultiple line breaks."
    //         );
    //     });
    // });

    // describe("can handle all the different API variations", function () {
    //     it("fromFileWithPath(filePath, callback) ", async () => {
    //         const filePath = path.join(__dirname, "files", "new docx(1).docx");
    //         const text = await fromFileWithPath(filePath, {});
    //         expect(text).to.be.a("string");
    //         expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
    //     });

    //     it("fromFileWithPath(filePath, options, callback) ", async () => {
    //         const filePath = path.join(__dirname, "files", "new docx(1).docx");
    //         const text = await fromFileWithPath(filePath, {});
    //         expect(text).to.be.a("string");
    //         expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
    //     });

    //     it("fromFileWithMimeAndPath(mimeType, filePath, callback)", async () => {
    //         const filePath = path.join(__dirname, "files", "new docx(1).docx");
    //         const text = await fromFileWithMimeAndPath(
    //             "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //             filePath,
    //             {},
    //         );
    //         expect(text).to.be.a("string");
    //         expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
    //     });

    //     it("fromFileWithMimeAndPath(mimeType, filePath, options, callback)", async () => {
    //         const filePath = path.join(__dirname, "files", "new docx(1).docx");
    //         const text = await fromFileWithMimeAndPath(
    //             "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //             filePath,
    //             {},
    //         );
    //         expect(text).to.be.a("string");
    //         expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
    //     });
    // });
});
