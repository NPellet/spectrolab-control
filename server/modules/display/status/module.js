
var moduleProto = require('../../../module'),
	extend = require('extend');

var Status = function() {};


Status.prototype = new moduleProto();
Status.prototype = extend( Status.prototype, {
	

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
	Constructor: Status
}
