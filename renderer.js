
var wrapper = require("./wrapper"),
	fs = require('fs');

var liquid = require("liquid-node"),
	lengine = new liquid.Engine

var Promise = require('bluebird');

var renderer = {};

var wrappers = {};
var allModulesByName = {};
var stylesheets = [];

renderer.addWrapper = function( name ) {

	if( wrappers[ name ] ) {
		throw "A wrapper with the same name (" + name + ") already exists";
	}

	return wrappers[ name ] = new wrapper( this );
}

renderer.addStylesheet = function( file ) {
	stylesheets.push( file );
}

renderer.render = function( ) {

	var html = [];
	for( var i in wrappers ) {
		html.push( wrappers[ i ].render() )
	}

	Promise.all( html ).then( function() {

		return lengine.parseAndRender( fs.readFileSync( './html/page.tpl'), { 

			wrappers: arguments[ 0 ],
			stylesheets: stylesheets
		} );

	}).then( function( html ) {

		// TEMP
		var http = require('http');
		http.createServer(function (req, res) {
/*
		    if(req.url.indexOf('.html') != -1){ //req.url has the pathname, check if it conatins '.html'

		      fs.readFile(__dirname + '/public/chatclient.html', function (err, data) {
		        if (err) console.log(err);
		        res.writeHead(200, {'Content-Type': 'text/html'});
		        res.write(data);
		        res.end();
		      });

		    }
*/


		    if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

		      fs.readFile(__dirname + req.url, function (err, data) {
		        if (err) console.log(err);
		        res.writeHead(200, {'Content-Type': 'text/javascript'});
		        res.write(data);
		        res.end();
		      });

		      return;
		    }

		    if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'

		      fs.readFile(__dirname + req.url, function (err, data) {
		        if (err) console.log(err);
		        res.writeHead(200, {'Content-Type': 'text/css'});
		        res.write(data);
		        res.end();
		      });

		  	  return;
		    }

		  res.writeHead(200, {'Content-Type': 'text/html'});
		  res.end( html );

		}).listen(1337, '0.0.0.0');
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
		throw "No module with name " + moduleName + " exists";
	}

	return allModulesByName[ moduleName ];
}

module.exports = renderer;