import { describe } from "mocha";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fromFileWithPath, fromFileWithMimeAndPath, fromBufferWithName, fromBufferWithMime } from "../src";

chai.use(chaiAsPromised);
const expect = chai.expect;

const test = function (done: any) {
        return function (error: any, text: string) {
            expect(text).to.be.null;
            expect(error).to.be.an("error");
            expect(error.message).to.be.an("string");
            expect(error.message).to.eql("Incorrect parameters passed to textract.");
            done();
        };
    },
    pathTests = function (testFunction: any) {
        let funct: any;

        beforeEach(function () {
            funct = testFunction();
        });

        it("should return an error 1", function (done) {
            funct(test(done));
        });

        it("should return an error 2", function (done) {
            funct(false, test(done));
        });

        it("should return an error 3", function (done) {
            funct(test(done), false);
        });

        it("should return an error 4", function (done) {
            funct("foo", test(done), false);
        });

        it("should return an error 5", function (done) {
            funct("foo", {}, false, test(done));
        });
    },
    bufferTests = function (testFunction: any) {
        let funct: any;

        beforeEach(function () {
            funct = testFunction();
        });

        it("should return an error 1", function (done) {
            funct(test(done));
        });

        it("should return an error 2", function (done) {
            funct(false, test(done));
        });

        it("should return an error 3", function (done) {
            funct(test(done), false);
        });

        it("should return an error 4", function (done) {
            funct("foo", test(done), false);
        });

        it("should return an error 5", function (done) {
            funct("foo", {}, false, test(done));
        });
    };

describe("when passed incorrect parameters", function () {
    describe("fromFileWithPath", function () {
        pathTests(function () {
            return fromFileWithPath;
        });
    });

    describe("fromFileWithMimeAndPath", function () {
        pathTests(function () {
            return fromFileWithMimeAndPath;
        });
    });

    describe("fromBufferWithName", function () {
        bufferTests(function () {
            return fromBufferWithName;
        });
    });

    describe("fromBufferWithMime", function () {
        bufferTests(function () {
            return fromBufferWithMime;
        });
    });
});
