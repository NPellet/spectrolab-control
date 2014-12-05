

var wrapper = require("./wrapper"),
	fs = require('fs'),
	liquid = require("liquid-node"),
	lengine = new liquid.Engine,
	Promise = require('bluebird'),
	path = require('path');

var	renderer = {},
	wrappers = {},
	modulesName = {},
	modules = [],
	stylesheets = [];

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

	var js;
	var html = [];
	for( var i in wrappers ) {
		html.push( wrappers[ i ].render() )
	}

	// At this point all the modules should have loaded

	// Let's get the client javascript ready
	Promise.all( modules.map( function( module ) {
		return module.renderJS();
	}) ).then( function( a ) {
		js = "$(document).ready( function() { " + Array.prototype.join.call( a, '' ) + " });";
	});
	
	// And now the css
	Promise.all( modules.map( function( module ) {
		return module.renderCSS();
	}) ).then( function( a ) {

		css = Array.prototype.join.call( a, '' );
	});
	



	Promise.all( html ).then( function() {

		return lengine.parseAndRender( fs.readFileSync( './server/html/page.tpl'), { 

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

			if( req.url == "/_modules.js" ) {

				res.writeHead(200, {'Content-Type': 'text/javascript'});
		        res.write( js );
		        res.end();
		        return;
			}


			if( req.url == "/_modules.css" ) {

				res.writeHead(200, {'Content-Type': 'text/css'});
		        res.write( css );
		        res.end();
		        return;
			}



		    if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

		      fs.readFile( path.resolve( __dirname, "." + req.url ), function (err, data) {
		        if (err) console.log(err);
		        res.writeHead(200, {'Content-Type': 'text/javascript'});
		        res.write(data);
		        res.end();
		      });

		      return;
		    }

		    if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'

		      fs.readFile( path.resolve( __dirname, "." + req.url ), function (err, data) {
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


renderer.addModule = function( moduleName, module ) {

	if( modulesName[ moduleName ] ) {
		throw "A module with a similar name already exists";
	}
	modules.push( module ); // Array
	modulesName[ moduleName ] = module; // Object indexed by name
	return;
}

renderer.getModuleByName = function( moduleName ) {

	if( ! modulesName[ moduleName ] ) {
		throw "No module with name " + moduleName + " exists";
	}

	return modulesName[ moduleName ];
}

renderer.getModules = function() {
	return allModulesByName;
}

renderer.getModule = renderer.getModuleByName;

module.exports = renderer;