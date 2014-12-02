
( function( global ) {

	var exports = {};
	var private = {};
	private.store = {};

	exports.store = function( object )  {
		var id = uniqueId();
		while( private.store[ id ] ) {
			id = uniqueId();
		}
		private.store[ id ] = object;
		return id;
	}

	global.storage = exports;

}) ( window )