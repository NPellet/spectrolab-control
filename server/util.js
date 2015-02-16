var fs = require('fs');

var public = {}

public.uniqueId = function() {
	// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});

}

public.importInstruments = function( config ) {

	if( typeof config != "object" ) {
		throw "Import instruments needs to load the config"
	}

	var toReturn = [];

	Array.prototype.shift.call( arguments );

	if( arguments.length == 0 ) {
		arguments = [];
		var files = fs.readdirSync(__dirname + "/../controllers/");
		for( var i = 0; i < files.length; i ++ ) {

			if( fs.lstatSync( __dirname + "/../controllers/" + files[ i ] ).isDirectory() && files[ i ].substr( 0, 1 ) != "_" ) {
				arguments.push( files[ i ] );
			}

 		}

	}

	for( var i = 0, l = arguments.length; i < l ; i ++ ) {

		var instr = require('../controllers/' + arguments[ i ] + '/default/controller' );
		var module = require('./modules/instruments/' + arguments[ i ] + '/connect/module' );

		toReturn[ arguments[ i ] ] = {};

		toReturn[ arguments[ i ] ].instrument = new instr( config.instruments[ arguments[ i ] ] );
		toReturn[ arguments[ i ] ].moduleName = 'instruments/' + arguments[ i ] + '/connect';
		toReturn[ arguments[ i ] ].moduleConstructor = module.Constructor;
	}

	return toReturn;
}


module.exports = public;
