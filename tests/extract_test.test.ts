import { expect } from 'chai';
import path from "path";
import { fromFileWithPath } from '../src';

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("textract", () => {
    describe("for .docx files", () => {
        it("will extract text from actual docx files", async () => {
            const filePath = path.join(__dirname, "files", "docx.docx");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect((text as string).substring(0, 20)).to.eql("This is a test Just ");
        });

        it("will extract text from actual docx files and preserve line breaks", async () => {
            const filePath = path.join(__dirname, "files", "docx.docx");
            const text = await fromFileWithPath(filePath, { preserveLineBreaks: true });
            expect(text).to.be.a("string");
            expect((text as string).substring(20, 40)).to.eql("so you know:\nLorem i");
        });

        it("will extract text from actual docx files and preserve line breaks [line-breaks.docx]", async () => {
            const filePath = path.join(__dirname, "files", "line-breaks.docx");
            const text = await fromFileWithPath(filePath, { preserveLineBreaks: true });
            expect(text).to.be.a("string");
            expect((text as string)).to.eql("Paragraph follows\n\nLine break follows\n\nend\n\n");
        });

        it("will error out when docx file isn't actually a docx", async () => {
            const filePath = path.join(__dirname, "files", "notadocx.docx");
            const error = await fromFileWithPath(filePath, {});
            expect(error).to.be.an("error");
            expect((error as Error).message).to.be.a("string");
            expect((error as Error).message.substring(0, 34)).to.eql("End of central directory record si");
        });

        it("will not extract smashed together text", async () => {
            const filePath = path.join(__dirname, "files", "testresume.docx");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect((text as string).substring(0, 31)).to.eql("Karol Miner 336 W. Chugalug Way");
        });

        it("can handle funky formatting", async () => {
            const filePath = path.join(__dirname, "files", "Untitleddocument.docx");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect(text).to.eql("this is a test document that won't be extracted properly. ");
        });

        it("can handle a huge docx", async () => {
            const filePath = path.join(__dirname, "files", "LargeLorem.docx");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect((text as string).substring(0, 100)).to.eql(
                "Hashtag chambray XOXO PBR&B chia small batch. Before they sold out banh mi raw denim, fap synth hell"
            );
        });

        it("can handle arabic", async () => {
            const filePath = path.join(__dirname, "files", "arabic.docx");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect((text as string).substring(0, 100)).to.eql(
                " التعرف الضوئي على الحروف إشعار عدم التمييز (المصدر: مكتب الصحة والخدمات الإنسانية من أجل الحقوق الم"
            );
        });
    });

    describe("for text/* files", function () {
        it("will extract text from specifically a .txt file", async () => {
            const filePath = path.join(__dirname, "files", "txt.txt");
            const text = await fromFileWithPath(filePath, {preserveLineBreaks: true});
            expect(text).to.be.a("string");
            expect(text).to.eql("This is a plain old text file. ||");
        });

        it("will extract text from specifically a non utf8 .txt file", async () => {
            const filePath = path.join(__dirname, "files", "non-utf8.txt");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect(text).to.eql("これは非UTF8 テキストファイルです ");
        });

        it("will error when .txt file encoding cannot be detected", async () => {
            const filePath = path.join(__dirname, "files", "unknown-encoding.txt");
            const error = await fromFileWithPath(filePath, {});
            expect((error as Error).message).to.be.a("string");
            expect((error as Error).message).to.eql("Could not detect encoding for file named [[ unknown-encoding.txt ]]");
        });

        it("will remove extraneous white space from a .txt file", async () => {
            const filePath = path.join(__dirname, "files", "spacey.txt");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect(text).to.eql("this has lots of space");
        });

        it("will not remove fancy quotes from a .txt file", async () => {
            const filePath = path.join(__dirname, "files", "fancyquote.txt");
            const text = await fromFileWithPath(filePath, {});
            expect(text).to.be.a("string");
            expect(text).to.eql('this has "fancy" quotes');
        });
    });
});
