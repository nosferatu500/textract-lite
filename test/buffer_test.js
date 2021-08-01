var fs = require("fs")
  , path = require("path")
  , mime = require("mime")
  ;

var test = function (_testFunction, withMime) {

  var testFunction;

  beforeEach(function () {
    testFunction = _testFunction();
  });

  var _test = function (ext, name, _text) {
    it('will ' + ext + ' files', function (done) {
      var docPath = path.join(__dirname, "files", name);
      var textBuff = fs.readFileSync(docPath);

      testFunction(
        (withMime) ? mime.getType(docPath) : docPath,
        textBuff, function (error, text) {

          expect(error).to.be.null;
          expect(text).to.be.an('string');
          expect(text.substring(0, 100)).to.eql(_text);
          done();
        });
    });
  };

  _test(
    "docx",
    "docx.docx",
    "This is a test Just so you know: Lorem ipsum dolor sit amet, consecutuer adipiscing elit, sed diam n"
  );

  _test(
    "text/*",
    "txt.txt",
    "This is a plain old text file."
  );
};

describe('textract fromBufferWithName', function () {
  test(function () { return global.fromBufferWithName }, false);
});

describe('textract fromBufferWithMime', function () {
  test(function () { return global.fromBufferWithMime }, true);
});
