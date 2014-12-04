
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	
	update: function( message, type ) {

		this.streamOut( "status", { message: message, type: type, date: Date.now() } );
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}