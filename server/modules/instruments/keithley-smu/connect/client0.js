
define( [ 'getmodule-instruments/connect.js'], function( defaultModule ) {

	var module = function() {}
	module.prototype = new defaultModule();

	return module;
	
} );
