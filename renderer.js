
var wrapper = require("./wrapper"),
	fs = require('fs');

var renderer = {};

var wrappers = {};
var allModulesByName = {};

renderer.addWrapper = function( name ) {

	if( wrappers[ name ] ) {
		throw "A wrapper with the same name (" + name + ") already exists";
	}

	return wrappers[ name ] = new wrapper;
}

renderer.render = function( ) {

	var html = "";

	html += this.getHeader();
	
	for( var i in wrappers ) {
		html += wrapper[ i ].render();
	}

	html += this.getFooter();

	// TEMP
	var http = require('http');
	http.createServer(function (req, res) {

	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end( html );

	}).listen(1337, '127.0.0.1');
	// END TEMP

	return html;
}

renderer.getHeader = function() {
	return fs.readFileSync("./html/header.html");
}

renderer.getFooter = function() {
	return fs.readFileSync("./html/footer.html");
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

module.exports = renderer