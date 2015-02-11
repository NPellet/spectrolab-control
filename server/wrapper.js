
var fs = require('fs'),
	path = require('path');

var liquid = require("liquid-node"),
	lengine = new liquid.Engine,
	Promise = require('bluebird');

var Wrapper = function( renderer ) {
	this.renderer = renderer;
	this.modules = [];

	this.top = 0;
	this.left = 0;
	this.width = 1;
};

Wrapper.prototype.setTitle = function( title ) {
	this.title = title;
	return this;
}

Wrapper.prototype.setPosition = function( left, top ) {
	this.left = left || 0;
	this.top = top || 0;
	return this;
}

Wrapper.prototype.setSize = function( w, h ) {
	this.width = w || 10;
	this.height = h || false;
	return this;
}

Wrapper.prototype.setWidth = function( w ) {
	this.width = w;
	return this;
}

Wrapper.prototype.addModule = function( moduleType, moduleName, moduleOptions ) {

	var moduleConstructor = require( path.resolve( './server/modules/', moduleType, 'module.js' ) ).Constructor;
	var module = new moduleConstructor( moduleOptions );

	module.init( moduleType, moduleName );
	module.setFolder( path.resolve('./server/modules/', moduleType ) );

	module.setRelativePath( moduleType );

	this.modules.push( module );
	this.renderer.addModule( moduleName, module );

	return module;
}

Wrapper.prototype.render = function() {

	var self = this,
		html = [],
		js = [];

	for( var i = 0, l = this.modules.length ; i < l ; i ++ ) {

		html.push( this.modules[ i ].renderHTML( ) );

	}

	return Promise.all( html ).then( function( html ) {

		return lengine.parseAndRender( fs.readFileSync( './server/html/wrapper.tpl', 'utf-8' ), {

			html: html,
			position: {
				top: self.getPositionTop(),
				left: self.getPositionLeft()
			},

			size: {
				width: self.getSizeWidth(),
				height: self.getSizeHeight()
			},

			title: self.title

		} );
	});
}

Wrapper.prototype.getPositionTop = function() {
	return ( this.top ) * ( Wrapper.gridY + 0 ) ;
}
Wrapper.prototype.getPositionLeft = function() {
	return ( this.left ) * ( Wrapper.gridX + 0 );
}
Wrapper.prototype.getSizeWidth = function() {
	return ( this.width || 1 ) * Wrapper.gridX - 10;
}

// Height behaves slightly differently. Auto height if not defined
Wrapper.prototype.getSizeHeight = function() {
	if( this.height ) {
		return this.height * Wrapper.gridY;
	}

	return false;
}

Wrapper.gridX = 50;
Wrapper.gridY = 50;

module.exports = Wrapper;
