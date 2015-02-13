

// Note: This is a singleton instance

var wrapper = require("./wrapper"),
	stream = require("./stream"),
	fs = require('fs'),
	liquid = require("liquid-node"),
	lengine = new liquid.Engine,
	Promise = require('bluebird'),
	path = require('path'),
	os = require('os');

var	renderer = {},
	wrappers = [],
	modulesName = {},
	modulesId = {},
	modules = [],
	stylesheets = [];

var getIp = function() {

	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (var k in interfaces) {
	    for (var k2 in interfaces[k]) {
	        var address = interfaces[k][k2];
	        if (address.family === 'IPv4' && !address.internal) {
	            addresses.push(address.address);
	        }
	    }
	}

	return addresses[ 0 ];
}

renderer.addWrapper = function(  ) {

	var w = new wrapper( this );
	wrappers.push( w );
	return w;
}

renderer.addStylesheet = function( file ) {
	stylesheets.push( file );
}

renderer.render = function( ) {

	stream.setModules( modulesId );

	var html = [];

	wrappers.map( function( wrapper ) {
		html.push( wrapper.render() )
	})

	// At this point all the modules should have loaded
	// And now the css


	Promise.all( modules.map( function( module ) {

		return module.renderCSS();
	}) ).then( function( a ) {

		css = Array.prototype.join.call( a, '' );
	});

	Promise.all( html ).then( function() {

		return lengine.parseAndRender( fs.readFileSync( './server/html/page.tpl'), {

			wrappers: arguments[ 0 ],
			stylesheets: stylesheets,
			ip: getIp()
		} );

	}).then( function( html ) {

		// TEMP
		var http = require('http');
		var prefix = '../';
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

			if( req.url == "/_modules.css" ) {

				res.writeHead(200, {'Content-Type': 'text/css'});
		        res.write( css );
		        res.end();
		        return;
			}



		    if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

		      if( req.url.indexOf('getmodule-') > -1 ) {

			      fs.readFile( path.resolve( __dirname, "./modules/" + req.url.replace('getmodule-', '').replace('.js', '') + '/client.js' ), function (err, data) {
			        if (err) console.log(err);
			        res.writeHead(200, {'Content-Type': 'text/javascript'});
			        res.write(data);
			        res.end();
			      });
		      		return;
		      }


		      fs.readFile( path.resolve( "." + req.url ), function (err, data) {
		        if (err) console.log(err);
		        res.writeHead(200, {'Content-Type': 'text/javascript'});
		        res.write(data);
		        res.end();
		      });

		      return;
		    }

		    if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'


		      fs.readFile( path.resolve( "." + req.url ), function (err, data) {
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
	modulesId[ module.getId() ] = module;
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

renderer.assign = function( target, source, message ) {
	this.getModuleByName( target ).assign( this.getModuleByName( source ), message );
}

renderer.lockModules = function( modules, message ) {

	var self = this;
	if( ! Array.isArray( modules ) ) {
		modules = [ modules ];
	}

	modules.map( function( module ) {
		self.getModuleByName( module ).lock( message );
	})
}


renderer.unlockModules = function( modules, message ) {

	var self = this;

	if( ! Array.isArray( modules ) ) {
		modules = [ modules ];
	}

	modules.map( function( module ) {
		self.getModuleByName( module ).unlock( message );
	})
}

renderer.getModule = renderer.getModuleByName;

module.exports = renderer;
