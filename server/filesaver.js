

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


FileSaver.save = function( options ) {

	var date = new Date();
	options.dir = options.dir || "./";
	options.dir = '../data/' + date.getFullYear() + "." + date.getMonth() + "." + date.getDate() + "/" + options.dir;

	mkdirrec( options.dir );

	fs.writeFile( options.dir + "./" + date.getHours() + "." + date.getMinutes() + "." + date.getSeconds() + "_" + options.fileName + "." + options.fileExtension, options.contents, function( err ) {
		if( err ) { throw err; }
		console.log('File saved');
	});
};

module.exports = FileSaver;