/* eslint-disable max-len, no-unused-expressions */
/* global fromFileWithPath */

var path = require( 'path' );

describe( 'textract', function() {
  var test;

  describe( 'for .docx files', function() {
    it( 'will extract text from actual docx files', function( done ) {
      var filePath = path.join( __dirname, 'files', 'docx.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text.substring( 0, 20 ) ).to.eql( 'This is a test Just ' );
        done();
      });
    });

    it( 'will extract text from actual docx files and preserve line breaks', function( done ) {
      var filePath = path.join( __dirname, 'files', 'docx.docx' );
      fromFileWithPath( filePath, { preserveLineBreaks: true }, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text.substring( 20, 40 ) ).to.eql( 'so you know:\nLorem i' );
        done();
      });
    });

    it( 'will extract text from actual docx files and preserve line breaks [line-breaks.docx]', function( done ) {
      var filePath = path.join( __dirname, 'files', 'line-breaks.docx' );
      fromFileWithPath( filePath, { preserveLineBreaks: true }, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( 'Paragraph follows\n\nLine break follows\n\nend\n\n' );
        done();
      });
    });

    it( 'will error out when docx file isn\'t actually a docx', function( done ) {
      var filePath = path.join( __dirname, 'files', 'notadocx.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( text ).to.be.null;
        expect( error ).to.be.an( 'error' );
        expect( error.message ).to.be.a( 'string' );
        expect( error.message.substring( 0, 34 ) ).to.eql( 'File not correctly recognized as z' );
        done();
      });
    });

    it( 'will not extract smashed together text', function( done ) {
      var filePath = path.join( __dirname, 'files', 'testresume.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text.substring( 0, 31 ) ).to.eql( 'Karol Miner 336 W. Chugalug Way' );
        done();
      });
    });

    it( 'can handle funky formatting', function( done ) {
      var filePath = path.join( __dirname, 'files', 'Untitleddocument.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( "this is a test document that won't be extracted properly. " );
        done();
      });
    });

    it( 'can handle a huge docx', function( done ) {
      var filePath = path.join( __dirname, 'files', 'LargeLorem.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text.substring( 0, 100 ) ).to.eql( 'Hashtag chambray XOXO PBR&B chia small batch. Before they sold out banh mi raw denim, fap synth hell' );
        done();
      });
    });

    it( 'can handle arabic', function( done ) {
      var filePath = path.join( __dirname, 'files', 'arabic.docx' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text.substring( 0, 100 ) ).to.eql( ' التعرف الضوئي على الحروف إشعار عدم التمييز (المصدر: مكتب الصحة والخدمات الإنسانية من أجل الحقوق الم' );
        done();
      });
    });
  });

  describe( 'for text/* files', function() {
    it( 'will extract text from specifically a .txt file', function( done ) {
      var filePath = path.join( __dirname, 'files', 'txt.txt' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( 'This is a plain old text file.' );
        done();
      });
    });

    it( 'will extract text from specifically a non utf8 .txt file', function( done ) {
      var filePath = path.join( __dirname, 'files', 'non-utf8.txt' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( 'これは非UTF8 テキストファイルです ' );
        done();
      });
    });

    it( 'will error when .txt file encoding cannot be detected', function( done ) {
      var filePath = path.join( __dirname, 'files', 'unknown-encoding.txt' );
      fromFileWithPath( filePath, function( error ) {
        expect( error ).to.be.an( 'error' );
        expect( error.message ).to.be.a( 'string' );
        expect( error.message ).to.eql( 'Could not detect encoding for file named [[ unknown-encoding.txt ]]' );
        done();
      });
    });

    it( 'will remove extraneous white space from a .txt file', function( done ) {
      var filePath = path.join( __dirname, 'files', 'spacey.txt' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( 'this has lots of space' );
        done();
      });
    });

    it( 'will not remove fancy quotes from a .txt file', function( done ) {
      var filePath = path.join( __dirname, 'files', 'fancyquote.txt' );
      fromFileWithPath( filePath, function( error, text ) {
        expect( error ).to.be.null;
        expect( text ).to.be.a( 'string' );
        expect( text ).to.eql( 'this has "fancy" quotes' );
        done();
      });
    });
  });

  test = function( ext, name, text1, text2 ) {
    describe( 'for ' + ext + ' files', function() {
      it( 'will extract text', function( done ) {
        var filePath = path.join( __dirname, 'files', name );
        fromFileWithPath( filePath, function( error, text ) {
          expect( error ).to.be.null;
          expect( text ).to.be.an( 'string' );
          expect( text.substring( 0, 100 ) ).to.eql( text1 );
          done();
        });
      });

      it( 'will extract text and preserve line breaks', function( done ) {
        var filePath = path.join( __dirname, 'files', name );
        fromFileWithPath( filePath, { preserveLineBreaks: true }, function( error, text ) {
          expect( error ).to.be.null;
          expect( text ).to.be.an( 'string' );
          expect( text.substring( 0, 100 ) ).to.eql( text2 );
          done();
        });
      });
    });
  };
});
