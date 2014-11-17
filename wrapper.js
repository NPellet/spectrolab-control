


var fs = require('fs');

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
	this.height = h || 10;
	return this;
}

Wrapper.prototype.addModule = function( moduleType, moduleName ) {

	var moduleConstructor = require('./modules/' + moduleType + '/module.js').Constructor;

	var module = new moduleConstructor();

	module.init();
	module.setFolder('./modules/' + moduleType );

	this.modules.push( module );
	this.renderer.addModuleByName( moduleName, module );
	return module;
}

Wrapper.prototype.render = function() {

	var html = [],
		js = [];

	for( var i = 0, l = this.modules.length ; i < l ; i ++ ) {

		html.push( this.modules[ i ].renderHTML( ) );
		js.push( this.modules[ i ].renderJS( ) );
	}

	return Promise.all( [ Promise.all( html ), Promise.all( js ) ] ).then( function( responses ) {


		return lengine.parseAndRender( fs.readFileSync( './html/wrapper.tpl', 'utf-8' ), { html: responses[ 0 ], js: responses[ 1 ] } );
	});
}

module.exports = Wrapper;