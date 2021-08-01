var { exec } = require( 'child_process' )
  , path = require( 'path' )
  , cliPath = path.join( __dirname, '..', 'bin', 'textract' )
  , testFilePath = path.join( __dirname, 'files', 'cli.txt' );

describe( 'cli', function() {
  it( 'will extract text', function( done ) {
    console.log(testFilePath);
    exec( cliPath + ' ' + testFilePath,
      function( error, stdout ) {
        expect( stdout ).to.eql( '.foo {color:red}\n' );
        done();
      });
  });
});
