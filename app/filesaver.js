

var fs = require('fs');
var path = require('path');

var FileSaver = {}


function mkdirrec( dir ) {
	dir = path.resolve( dir );

	try {
		fs.mkdirSync( dir );

	} catch( err ) {

		if( err.code == "ENOENT" ) {
			mkdirrec( path.dirname( dir ) );
			fs.mkdirSync( dir );
		}

	}
}

function pad( val ) {
	return ( String( val ).length == 1 ) ? "0" + val : val;
}

FileSaver.save = function( options ) {

	var date = new Date();
	options.dir = options.dir || "./";
	options.dir = '../data/' + date.getFullYear() + "." + pad( date.getMonth() + 1 ) + "." + pad( date.getDate() ) + "/" + options.dir;

	mkdirrec( options.dir );

	var fileName;
	if( options.forceFileName ) {
		fileName = options.forceFileName;
	} else {
		fileName = pad( date.getHours() ) + "." + pad( date.getMinutes() ) + "." + pad( date.getSeconds() ) + "_" + ( options.fileName || "no-name" ) + "." + options.fileExtension;
	}
	
	fs.writeFile( options.dir + "./" + fileName, options.contents, function( err ) {
		if( err ) { throw err; }
		console.log('File saved');
	});

	return fileName;
};

module.exports = FileSaver;