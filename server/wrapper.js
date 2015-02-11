
var fs = require('fs'),
	path = require('path');

var liquid = require("liquid-node"),
	lengine = new liquid.Engine,
	Promise = require('bluebird');

var Wrapper = function( renderer ) {
	this.renderer = renderer;
	this.modules = [];
};

Wrapper.prototype.setTitle = function( title ) {
	this.title = title;
	return this;
}

Wrapper.prototype.setPosition = function( left, top ) {
	this.left = left || 1;
	this.top = top || 1;	
	return this;
}

Wrapper.prototype.setSize = function( w, h ) {
	this.width = w || 10;
	this.height = h || false;
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
	return ( this.top || 1 ) * Wrapper.gridY;
}
Wrapper.prototype.getPositionLeft = function() {
	return ( this.left || 1 ) * Wrapper.gridX;
}
Wrapper.prototype.getSizeWidth = function() {
	return ( this.width || 1 ) * Wrapper.gridX;
}

// Height behaves slightly differently. Auto height if not defined
Wrapper.prototype.getSizeHeight = function() {
	if( this.height ) {
		return this.height * Wrapper.gridY;
	}

	return false;
}

Wrapper.gridX = 10;
Wrapper.gridY = 10;

module.exports = Wrapper;