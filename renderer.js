
var wrapper = require("./wrapper"),
	fs = require('fs');

var liquid = require("liquid-node"),
	lengine = new liquid.Engine

var Promise = require('bluebird');

var renderer = {};

var wrappers = {};
var allModulesByName = {};

renderer.addWrapper = function( name ) {

	if( wrappers[ name ] ) {
		throw "A wrapper with the same name (" + name + ") already exists";
	}

	return wrappers[ name ] = new wrapper( this );
}

renderer.render = function( ) {

	var html = [];
	for( var i in wrappers ) {
		html.push( wrappers[ i ].render() )
	}

	Promise.all( html ).then( function() {

		return lengine.parseAndRender( fs.readFileSync( './html/page.tpl'), { wrappers: arguments } );

	}).then( function( html ) {

		// TEMP
		var http = require('http');
		http.createServer(function (req, res) {

		  res.writeHead(200, {'Content-Type': 'text/html'});
		  res.end( html );

		}).listen(1337, '127.0.0.1');
		// END TEMP

	});

}


renderer.addModuleByName = function( moduleName, module ) {

	if( allModulesByName[ moduleName ] ) {
		throw "A module with a similar name already exists";
	}

	allModulesByName[ moduleName ] = module;
	return;
}

renderer.getModuleByName = function( moduleName ) {

	if( ! allModulesByName[ moduleName ] ) {
		throw "No such module exists";
	}

	return allModulesByName[ moduleName ];
}

module.exports = renderer;