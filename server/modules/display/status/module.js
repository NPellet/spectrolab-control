
var moduleProto = require('../../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	/* Available types: neutral warning error ok process */
	update: function( message, type ) {
		this.status.message = { message: message, type: type, date: Date.now() };
		this.streamOut( "status", this.status.message );
	},


	getStatus: function() {
		return this.status;
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}
